import express from 'express'
import cors from 'cors'
import { JSONFilePreset } from 'lowdb/node'
import multer from 'multer'
import bcrypt from 'bcryptjs'
import crypto from 'crypto'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const DATA_DIR = process.env.DATA_DIR || __dirname
const uploadsDir = path.join(DATA_DIR, 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true })
}

const app = express()
const PORT = process.env.PORT || 3000

// CR-03: Session tokens replace raw PIN in headers
const adminSessions = new Map() // token -> { createdAt: number }
const SESSION_TTL_MS = 8 * 60 * 60 * 1000 // 8 hours

// CR-01: Mutex for order processing prevents race condition on stock
let orderLock = false

const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`
    cb(null, uniqueName)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'), false)
    }
  }
})

// Middleware — CR-02: Restrict CORS to known origins
const allowedOrigins = [
  'http://localhost:4200',
  'http://localhost:8100',
  'http://localhost:8000',
  'http://10.0.2.2:4200',
  'https://tagudin-products.onrender.com'
]
app.use(cors({ origin: allowedOrigins }))
app.use(express.json())
app.use('/uploads', express.static(uploadsDir))

// Initialize LowDB
const defaultData = { products: [], cart: [], orders: [], deliveryServices: [], adminPin: null }
const dbPath = path.join(DATA_DIR, 'db.json')
const db = await JSONFilePreset(dbPath, defaultData)

// ==================== ADMIN AUTH MIDDLEWARE ====================
// CR-03: Accept session token OR raw PIN (backwards-compatible during migration)

const adminAuth = async (req, res, next) => {
  // Prefer session token
  const token = req.headers['x-admin-token']
  if (token) {
    const session = adminSessions.get(token)
    if (session && Date.now() - session.createdAt < SESSION_TTL_MS) {
      return next()
    }
    adminSessions.delete(token)
    return res.status(401).json({ error: 'Session expired' })
  }

  // Fallback: raw PIN (deprecated, will be removed)
  const pin = req.headers['x-admin-pin']
  if (!pin) {
    return res.status(401).json({ error: 'Admin auth required' })
  }
  if (!db.data.adminPin) {
    return res.status(404).json({ error: 'PIN not configured' })
  }
  const valid = await bcrypt.compare(pin, db.data.adminPin)
  if (!valid) {
    return res.status(401).json({ error: 'Invalid PIN' })
  }
  next()
}

// ==================== PUBLIC ENDPOINTS ====================

// GET /products
app.get('/products', (req, res) => {
  res.json(db.data.products)
})

// GET /delivery-services
app.get('/delivery-services', (req, res) => {
  res.json(db.data.deliveryServices)
})

// GET /cart (legacy)
app.get('/cart', (req, res) => {
  res.json(db.data.cart)
})

// POST /cart (legacy)
app.post('/cart', async (req, res) => {
  const { productId, name, price, quantity } = req.body

  if (!productId || !name || price == null || !quantity) {
    return res.status(400).json({ error: 'Missing required fields: productId, name, price, quantity' })
  }

  const newItem = { productId, name, price, quantity, id: Date.now().toString() }
  db.data.cart.push(newItem)
  await db.write()

  res.status(201).json(newItem)
})

// ==================== SESSION-BASED CART ENDPOINTS ====================

// GET /cart/:sessionId
app.get('/cart/:sessionId', (req, res) => {
  const items = db.data.cart.filter(item => item.sessionId === req.params.sessionId)
  res.json(items)
})

// POST /cart/:sessionId - add item (dedup by productId)
app.post('/cart/:sessionId', async (req, res) => {
  const { sessionId } = req.params
  const { productId, name, price, quantity } = req.body

  if (!productId || !name || price == null || !quantity) {
    return res.status(400).json({ error: 'Missing required fields: productId, name, price, quantity' })
  }

  // Check product stock — WR-05: validate cumulative quantity
  const product = db.data.products.find(p => p.id === productId)
  if (product && product.stock !== undefined && product.stock <= 0) {
    return res.status(400).json({ error: 'Product out of stock' })
  }

  const existingItem = db.data.cart.find(
    item => item.sessionId === sessionId && item.productId === productId
  )

  if (existingItem) {
    const newQuantity = existingItem.quantity + quantity
    if (product && product.stock !== undefined && newQuantity > product.stock) {
      return res.status(400).json({ error: `Only ${product.stock - existingItem.quantity} more can be added (stock limit)`, available: product.stock, inCart: existingItem.quantity, requested: quantity })
    }
    existingItem.quantity = newQuantity
    await db.write()
    return res.json(existingItem)
  }

  if (product && product.stock !== undefined && quantity > product.stock) {
    return res.status(400).json({ error: `Insufficient stock for ${product.name}`, available: product.stock, requested: quantity })
  }

  const newItem = { id: Date.now().toString(), sessionId, productId, name, price, quantity }
  db.data.cart.push(newItem)
  await db.write()

  res.status(201).json(newItem)
})

// PATCH /cart/:sessionId/:itemId - update quantity
app.patch('/cart/:sessionId/:itemId', async (req, res) => {
  const { sessionId, itemId } = req.params
  const { quantity } = req.body

  const item = db.data.cart.find(
    item => item.sessionId === sessionId && item.id === itemId
  )

  if (!item) {
    return res.status(404).json({ error: 'Cart item not found' })
  }

  if (quantity <= 0) {
    db.data.cart = db.data.cart.filter(i => !(i.sessionId === sessionId && i.id === itemId))
    await db.write()
    return res.json({ deleted: true })
  }

  item.quantity = quantity
  await db.write()
  res.json(item)
})

// DELETE /cart/:sessionId/:itemId
app.delete('/cart/:sessionId/:itemId', async (req, res) => {
  const { sessionId, itemId } = req.params
  const initialLength = db.data.cart.length
  db.data.cart = db.data.cart.filter(
    item => !(item.sessionId === sessionId && item.id === itemId)
  )

  if (db.data.cart.length === initialLength) {
    return res.status(404).json({ error: 'Cart item not found' })
  }

  await db.write()
  res.json({ deleted: true })
})

// ==================== ORDER ENDPOINTS ====================

// POST /orders - create order with atomic stock deduction (CR-01: mutex lock)
app.post('/orders', async (req, res) => {
  if (orderLock) {
    return res.status(429).json({ error: 'Another order is being processed. Please try again.' })
  }
  orderLock = true
  const { items, customerInfo, deliveryServiceId } = req.body

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Order must contain at least one item' })
  }

  if (!customerInfo || !customerInfo.fullName || !customerInfo.phoneNumber || !customerInfo.deliveryAddress) {
    orderLock = false
    return res.status(400).json({ error: 'Missing required customer info: fullName, phoneNumber, deliveryAddress' })
  }

  // Validate stock availability
  for (const item of items) {
    const product = db.data.products.find(p => p.id === item.productId)
    if (!product) {
      orderLock = false
      return res.status(400).json({ error: `Product not found: ${item.productId}` })
    }
    if (product.stock !== undefined && product.stock <= 0) {
      orderLock = false
      return res.status(400).json({ error: `Product out of stock: ${product.name}` })
    }
    if (product.stock !== undefined && item.quantity > product.stock) {
      orderLock = false
      return res.status(400).json({ error: `Insufficient stock for ${product.name}`, available: product.stock, requested: item.quantity })
    }
  }

  // Atomic: deduct stock + create order
  const orderItems = items.map(item => {
    const product = db.data.products.find(p => p.id === item.productId)
    if (product.stock !== undefined) {
      product.stock -= item.quantity
    }
    return {
      productId: item.productId,
      name: item.name || product.name,
      price: item.price || product.price,
      quantity: item.quantity
    }
  })

  const deliveryService = db.data.deliveryServices.find(s => s.id === deliveryServiceId)
  const deliveryFee = deliveryService ? deliveryService.pricing : 0
  const subtotal = orderItems.reduce((sum, item) => sum + (item.price * item.quantity), 0)

  const order = {
    id: 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
    customerInfo,
    deliveryServiceId: deliveryServiceId || null,
    deliveryFee,
    items: orderItems,
    subtotal,
    totalAmount: subtotal + deliveryFee,
    status: 'pending',
    createdAt: new Date().toISOString(),
    orderDate: new Date().toISOString()
  }

  db.data.orders.push(order)
  await db.write()
  orderLock = false

  res.status(201).json(order)
})

// GET /orders - list orders (optional ?customer=phone filter)
app.get('/orders', (req, res) => {
  let orders = db.data.orders
  if (req.query.customer) {
    orders = orders.filter(o =>
      o.customerInfo && o.customerInfo.phoneNumber === req.query.customer
    )
  }
  res.json(orders)
})

// GET /orders/:id
app.get('/orders/:id', (req, res) => {
  const order = db.data.orders.find(o => o.id === req.params.id)
  if (!order) {
    return res.status(404).json({ error: 'Order not found' })
  }
  res.json(order)
})

// ==================== ADMIN PIN ENDPOINTS ====================

// POST /api/admin/setup-pin — also returns session token
app.post('/api/admin/setup-pin', async (req, res) => {
  const { pin } = req.body
  if (!pin || pin.length < 4) {
    return res.status(400).json({ error: 'PIN must be at least 4 digits' })
  }
  if (db.data.adminPin) {
    return res.status(409).json({ error: 'PIN already set' })
  }

  db.data.adminPin = await bcrypt.hash(pin, 10)
  await db.write()

  const token = crypto.randomUUID()
  adminSessions.set(token, { createdAt: Date.now() })

  res.json({ success: true, token })
})

// POST /api/admin/verify-pin — CR-03: returns session token, WR-02: rate limited
const pinAttempts = new Map() // ip -> { count, lockedUntil }
app.post('/api/admin/verify-pin', async (req, res) => {
  const clientIp = req.ip || req.connection.remoteAddress
  const attempt = pinAttempts.get(clientIp) || { count: 0, lockedUntil: 0 }

  // WR-02: Rate limiting — lock after 5 failed attempts for 5 minutes
  if (attempt.lockedUntil && Date.now() < attempt.lockedUntil) {
    const remaining = Math.ceil((attempt.lockedUntil - Date.now()) / 1000)
    return res.status(429).json({ error: `Too many attempts. Try again in ${remaining}s` })
  }

  const { pin } = req.body
  if (!pin) {
    return res.status(400).json({ error: 'PIN is required' })
  }
  if (!db.data.adminPin) {
    return res.status(404).json({ error: 'PIN not configured' })
  }

  const valid = await bcrypt.compare(pin, db.data.adminPin)
  if (!valid) {
    attempt.count += 1
    if (attempt.count >= 5) {
      attempt.lockedUntil = Date.now() + 5 * 60 * 1000 // 5 min lockout
      attempt.count = 0
    }
    pinAttempts.set(clientIp, attempt)
    return res.status(401).json({ error: 'Invalid PIN' })
  }

  // Success — issue session token
  pinAttempts.delete(clientIp)
  const token = crypto.randomUUID()
  adminSessions.set(token, { createdAt: Date.now() })

  res.json({ success: true, token })
})

// GET /api/admin/has-pin
app.get('/api/admin/has-pin', (req, res) => {
  res.json({ hasPin: !!db.data.adminPin })
})

// ==================== ADMIN PROTECTED ROUTES ====================

// Admin product CRUD
app.post('/api/admin/products', adminAuth, async (req, res) => {
  const { name, price } = req.body
  if (!name || price == null) {
    return res.status(400).json({ error: 'Missing required fields: name, price' })
  }

  const maxId = db.data.products.reduce((max, p) => Math.max(max, parseInt(p.id, 10) || 0), 0)
  const newProduct = {
    id: String(maxId + 1),
    name,
    price,
    description: req.body.description || '',
    image: req.body.image || '',
    category: req.body.category || '',
    available: req.body.available !== undefined ? req.body.available : true,
    stock: req.body.stock !== undefined ? req.body.stock : 0,
    rating: req.body.rating || 0,
    deliveryServices: req.body.availableDeliveryServices || [],
    availableDeliveryServices: req.body.availableDeliveryServices || [],
    ...req.body,
    id: String(maxId + 1)
  }

  db.data.products.push(newProduct)
  await db.write()

  res.status(201).json(newProduct)
})

app.put('/api/admin/products/:id', adminAuth, async (req, res) => {
  const product = db.data.products.find(p => p.id === req.params.id)
  if (!product) {
    return res.status(404).json({ error: 'Product not found' })
  }

  // WR-03: Whitelist allowed fields to prevent mass assignment
  const allowedFields = ['name', 'price', 'description', 'image', 'category', 'available', 'stock', 'rating', 'deliveryServices', 'availableDeliveryServices']
  const updates = {}
  for (const key of allowedFields) {
    if (req.body[key] !== undefined) updates[key] = req.body[key]
  }
  Object.assign(product, updates)
  await db.write()

  res.json(product)
})

app.delete('/api/admin/products/:id', adminAuth, async (req, res) => {
  const initialLength = db.data.products.length
  db.data.products = db.data.products.filter(p => p.id !== req.params.id)

  if (db.data.products.length === initialLength) {
    return res.status(404).json({ error: 'Product not found' })
  }

  await db.write()
  res.json({ deleted: true })
})

// Admin delivery service CRUD
app.post('/api/admin/delivery-services', adminAuth, async (req, res) => {
  const { name } = req.body
  if (!name) {
    return res.status(400).json({ error: 'Missing required field: name' })
  }

  const maxId = db.data.deliveryServices.reduce((max, s) => Math.max(max, parseInt(s.id, 10) || 0), 0)
  const newService = {
    id: String(maxId + 1),
    name,
    description: req.body.description || '',
    coverageAreas: req.body.coverageAreas || [],
    pricing: req.body.pricing || 0,
    estimatedTime: req.body.estimatedTime || '',
    rating: req.body.rating || 0,
    image: req.body.image || '',
    available: req.body.available !== undefined ? req.body.available : true
  }

  db.data.deliveryServices.push(newService)
  await db.write()

  res.status(201).json(newService)
})

app.put('/api/admin/delivery-services/:id', adminAuth, async (req, res) => {
  const service = db.data.deliveryServices.find(s => s.id === req.params.id)
  if (!service) {
    return res.status(404).json({ error: 'Delivery service not found' })
  }

  // WR-03: Whitelist allowed fields to prevent mass assignment
  const allowedFields = ['name', 'description', 'coverageAreas', 'pricing', 'estimatedTime', 'rating', 'image', 'available']
  const updates = {}
  for (const key of allowedFields) {
    if (req.body[key] !== undefined) updates[key] = req.body[key]
  }
  Object.assign(service, updates)
  await db.write()

  res.json(service)
})

app.delete('/api/admin/delivery-services/:id', adminAuth, async (req, res) => {
  const initialLength = db.data.deliveryServices.length
  db.data.deliveryServices = db.data.deliveryServices.filter(s => s.id !== req.params.id)

  if (db.data.deliveryServices.length === initialLength) {
    return res.status(404).json({ error: 'Delivery service not found' })
  }

  await db.write()
  res.json({ deleted: true })
})

// Admin order status update
app.patch('/api/admin/orders/:id', adminAuth, async (req, res) => {
  const order = db.data.orders.find(o => o.id === req.params.id)
  if (!order) {
    return res.status(404).json({ error: 'Order not found' })
  }

  if (req.body.status) {
    order.status = req.body.status
  }

  await db.write()
  res.json(order)
})

// ==================== UPLOAD ENDPOINT ====================

app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided' })
  }
  const url = `/uploads/${req.file.filename}`
  res.status(201).json({ url })
})

// ==================== ERROR HANDLER ====================

app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'Image must be under 5MB' })
    }
    return res.status(400).json({ error: err.message })
  }
  if (err.message === 'Only image files are allowed') {
    return res.status(400).json({ error: 'Only image files are allowed' })
  }
  next(err)
})

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Data directory: ${DATA_DIR}`)
})