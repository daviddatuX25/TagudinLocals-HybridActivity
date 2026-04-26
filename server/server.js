import 'dotenv/config'
import express from 'express'
import cors from 'cors'
import bcrypt from 'bcryptjs'
import multer from 'multer'
import crypto from 'crypto'
import path from 'path'
import { supabase, cloudinary } from './supabase-client.js'

const app = express()
const PORT = process.env.PORT || 3000

// In-memory admin sessions (acceptable for demo)
const adminSessions = new Map()
const SESSION_TTL_MS = 8 * 60 * 60 * 1000

// Rate limiting for PIN attempts
const pinAttempts = new Map()

// Multer — temp disk storage for Cloudinary upload
const upload = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => cb(null, '/tmp'),
    filename: (req, file, cb) => cb(null, `${Date.now()}${path.extname(file.originalname)}`)
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    const allowed = ['image/jpeg', 'image/png', 'image/webp']
    cb(null, allowed.includes(file.mimetype))
  }
})

// CORS
const allowedOrigins = [
  'http://localhost:4200',
  'http://localhost:8100',
  'http://localhost:8000',
  'http://10.0.2.2:4200',
  'https://localhost',
  'capacitor://localhost',
  'ionic://localhost',
  'https://tagudinlocals-hybridactivity.onrender.com',
  'https://tagudinlocals-hybridactivity-1.onrender.com',
]
app.use(cors({
  origin: (origin, callback) => {
    if (!origin || allowedOrigins.includes(origin)) return callback(null, true)
    callback(new Error(`CORS blocked: ${origin}`))
  },
  credentials: true,
}))
app.use(express.json())
// NOTE: No more express.static for /uploads — images are on Cloudinary

// Admin auth middleware — session token only (PIN lives in env var)
const adminAuth = (req, res, next) => {
  const token = req.headers['x-admin-token']
  if (token) {
    const session = adminSessions.get(token)
    if (session && Date.now() - session.createdAt < SESSION_TTL_MS) {
      return next()
    }
    adminSessions.delete(token)
    return res.status(401).json({ error: 'Session expired' })
  }
  return res.status(401).json({ error: 'Admin auth required' })
}

// ==================== MAPPER FUNCTIONS ====================
// Map snake_case DB rows to camelCase API responses.
// IMPORTANT: Must be defined BEFORE routes that use them (const arrow functions are not hoisted).

function mapProductRow(row) {
  return {
    id: row.id,
    name: row.name,
    price: row.price,
    description: row.description || '',
    image: row.image || '',
    category: row.category || '',
    available: row.available !== undefined ? row.available : true,
    rating: row.rating || 0,
    stock: row.stock || 0,
    deliveryServices: row.delivery_services || [],
    availableDeliveryServices: row.available_delivery_services || [],
  }
}

function mapDeliveryServiceRow(row) {
  return {
    id: row.id,
    name: row.name,
    description: row.description || '',
    coverageAreas: row.coverage_areas || [],
    pricing: row.pricing || 0,
    estimatedTime: row.estimated_time || '',
    rating: row.rating || 0,
    image: row.image || '',
    available: row.available !== undefined ? row.available : true,
  }
}

function mapCartItemRow(row) {
  return {
    id: row.id,
    sessionId: row.session_id,
    productId: row.product_id,
    name: row.name,
    price: row.price,
    quantity: row.quantity,
  }
}

function mapOrderRow(row) {
  return {
    id: row.id,
    customerInfo: row.customer_info,
    deliveryServiceId: row.delivery_service_id,
    deliveryFee: row.delivery_fee || 0,
    items: row.items,
    subtotal: row.subtotal,
    totalAmount: row.total_amount,
    status: row.status,
    createdAt: row.created_at,
    orderDate: row.order_date,
  }
}

// ==================== ADMIN PIN ENDPOINTS ====================

// GET /api/admin/has-pin — check if PIN is configured
app.get('/api/admin/has-pin', (req, res) => {
  res.json({ hasPin: !!process.env.ADMIN_PIN_HASH })
})

// POST /api/admin/setup-pin — informational only (PIN is set via env var)
app.post('/api/admin/setup-pin', (req, res) => {
  if (process.env.ADMIN_PIN_HASH) {
    return res.status(409).json({ error: 'PIN already configured. Update via ADMIN_PIN_HASH env var.' })
  }
  return res.status(400).json({ error: 'Set ADMIN_PIN_HASH environment variable to configure the PIN.' })
})

// POST /api/admin/verify-pin — verify PIN and return session token
app.post('/api/admin/verify-pin', async (req, res) => {
  const clientIp = req.ip || req.connection.remoteAddress
  const attempt = pinAttempts.get(clientIp) || { count: 0, lockedUntil: 0 }

  if (attempt.lockedUntil && Date.now() < attempt.lockedUntil) {
    const remaining = Math.ceil((attempt.lockedUntil - Date.now()) / 1000)
    return res.status(429).json({ error: `Too many attempts. Try again in ${remaining}s` })
  }

  const { pin } = req.body
  if (!pin) {
    return res.status(400).json({ error: 'PIN is required' })
  }

  const pinHash = process.env.ADMIN_PIN_HASH
  if (!pinHash) {
    return res.status(404).json({ error: 'PIN not configured on server' })
  }

  const valid = await bcrypt.compare(String(pin), pinHash)
  if (!valid) {
    attempt.count += 1
    if (attempt.count >= 5) {
      attempt.lockedUntil = Date.now() + 5 * 60 * 1000
      attempt.count = 0
    }
    pinAttempts.set(clientIp, attempt)
    return res.status(401).json({ error: 'Invalid PIN' })
  }

  // Success
  pinAttempts.delete(clientIp)
  const token = crypto.randomUUID()
  adminSessions.set(token, { createdAt: Date.now() })
  res.json({ success: true, token })
})

// ==================== PUBLIC ENDPOINTS ====================

// GET /products
app.get('/products', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    res.json(data.map(mapProductRow))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /delivery-services
app.get('/delivery-services', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('delivery_services')
      .select('*')
      .eq('available', true)
    if (error) throw error
    res.json(data.map(mapDeliveryServiceRow))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ==================== CART ENDPOINTS ====================

// GET /cart/:sessionId
app.get('/cart/:sessionId', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('cart_items')
      .select('*')
      .eq('session_id', req.params.sessionId)
    if (error) throw error
    res.json(data.map(mapCartItemRow))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /cart/:sessionId — add item (dedup by productId)
app.post('/cart/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params
    const { productId, name, price, quantity } = req.body

    if (!productId || !name || price == null || !quantity) {
      return res.status(400).json({ error: 'Missing required fields: productId, name, price, quantity' })
    }

    // Check product stock
    const { data: product, error: prodErr } = await supabase
      .from('products')
      .select('stock, available')
      .eq('id', productId)
      .single()
    if (prodErr) throw prodErr
    if (!product) {
      return res.status(400).json({ error: `Product not found: ${productId}` })
    }
    if (product.stock !== undefined && product.stock <= 0) {
      return res.status(400).json({ error: 'Product out of stock' })
    }

    // Check for existing cart item
    const { data: existing, error: existErr } = await supabase
      .from('cart_items')
      .select('*')
      .eq('session_id', sessionId)
      .eq('product_id', productId)
      .maybeSingle()
    if (existErr) throw existErr

    if (existing) {
      const newQuantity = existing.quantity + quantity
      if (product.stock !== undefined && newQuantity > product.stock) {
        return res.status(400).json({
          error: `Only ${product.stock - existing.quantity} more can be added (stock limit)`,
          available: product.stock,
          inCart: existing.quantity,
          requested: quantity,
        })
      }
      const { data, error } = await supabase
        .from('cart_items')
        .update({ quantity: newQuantity })
        .eq('id', existing.id)
        .select()
        .single()
      if (error) throw error
      return res.json(mapCartItemRow(data))
    }

    if (product.stock !== undefined && quantity > product.stock) {
      return res.status(400).json({
        error: `Insufficient stock for ${name}`,
        available: product.stock,
        requested: quantity,
      })
    }

    const newItem = {
      id: Date.now().toString(),
      session_id: sessionId,
      product_id: productId,
      name,
      price,
      quantity,
    }
    const { data, error } = await supabase
      .from('cart_items')
      .insert(newItem)
      .select()
      .single()
    if (error) throw error
    res.status(201).json(mapCartItemRow(data))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /cart/:sessionId/:itemId — update quantity
app.patch('/cart/:sessionId/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params
    const { quantity } = req.body

    if (quantity <= 0) {
      const { error } = await supabase
        .from('cart_items')
        .delete()
        .eq('id', itemId)
      if (error) throw error
      return res.json({ deleted: true })
    }

    const { data, error } = await supabase
      .from('cart_items')
      .update({ quantity })
      .eq('id', itemId)
      .select()
      .single()
    if (error) throw error
    res.json(mapCartItemRow(data))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /cart/:sessionId/:itemId
app.delete('/cart/:sessionId/:itemId', async (req, res) => {
  try {
    const { itemId } = req.params
    const { error } = await supabase
      .from('cart_items')
      .delete()
      .eq('id', itemId)
    if (error) throw error
    res.json({ deleted: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ==================== ORDER ENDPOINTS ====================

// POST /orders — create order with stock deduction
app.post('/orders', async (req, res) => {
  const { items, customerInfo, deliveryServiceId } = req.body

  if (!items || !Array.isArray(items) || items.length === 0) {
    return res.status(400).json({ error: 'Order must contain at least one item' })
  }
  if (!customerInfo || !customerInfo.fullName || !customerInfo.phoneNumber || !customerInfo.deliveryAddress) {
    return res.status(400).json({ error: 'Missing required customer info: fullName, phoneNumber, deliveryAddress' })
  }

  // Validate stock availability
  for (const item of items) {
    const { data: product, error: prodErr } = await supabase
      .from('products')
      .select('stock, name')
      .eq('id', item.productId)
      .single()
    if (prodErr || !product) {
      return res.status(400).json({ error: `Product not found: ${item.productId}` })
    }
    if (product.stock !== undefined && product.stock <= 0) {
      return res.status(400).json({ error: `Product out of stock: ${product.name}` })
    }
    if (product.stock !== undefined && item.quantity > product.stock) {
      return res.status(400).json({ error: `Insufficient stock for ${product.name}`, available: product.stock, requested: item.quantity })
    }
  }

  // Deduct stock for each item
  for (const item of items) {
    const { data: product } = await supabase
      .from('products')
      .select('stock')
      .eq('id', item.productId)
      .single()
    const newStock = (product.stock || 0) - item.quantity
    await supabase
      .from('products')
      .update({ stock: newStock })
      .eq('id', item.productId)
  }

  // Calculate totals
  const { data: deliveryService } = await supabase
    .from('delivery_services')
    .select('*')
    .eq('id', deliveryServiceId)
    .single()
  const deliveryFee = deliveryService ? deliveryService.pricing : 0
  const subtotal = items.reduce((sum, item) => sum + (item.price * item.quantity), 0)
  const totalAmount = subtotal + deliveryFee

  const order = {
    id: 'ORD-' + Date.now() + '-' + Math.random().toString(36).substr(2, 9).toUpperCase(),
    customer_info: customerInfo,
    delivery_service_id: deliveryServiceId || null,
    delivery_fee: deliveryFee,
    items,
    subtotal,
    total_amount: totalAmount,
    status: 'pending',
  }

  const { data, error } = await supabase
    .from('orders')
    .insert(order)
    .select()
    .single()
  if (error) throw error
  res.status(201).json(mapOrderRow(data))
})

// GET /orders — list orders (optional ?customer=phone filter)
app.get('/orders', async (req, res) => {
  try {
    let query = supabase.from('orders').select('*').order('created_at', { ascending: false })
    if (req.query.customer) {
      query = query.contains('customer_info', { phoneNumber: req.query.customer })
    }
    const { data, error } = await query
    if (error) throw error
    res.json(data.map(mapOrderRow))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /orders/:id
app.get('/orders/:id', async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .eq('id', req.params.id)
      .single()
    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Order not found' })
    res.json(mapOrderRow(data))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/admin/orders — list all orders for admin panel
app.get('/api/admin/orders', adminAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select('*')
      .order('created_at', { ascending: false })
    if (error) throw error
    res.json(data.map(mapOrderRow))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PATCH /api/admin/orders/:id — update order status
app.patch('/api/admin/orders/:id', adminAuth, async (req, res) => {
  try {
    const { status } = req.body
    const validStatuses = ['pending', 'confirmed', 'preparing', 'out-for-delivery', 'delivered', 'cancelled']
    if (!validStatuses.includes(status)) {
      return res.status(400).json({ error: 'Invalid status value' })
    }
    const { data, error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', req.params.id)
      .select()
      .single()
    if (error) throw error
    res.json(mapOrderRow(data))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ==================== ADMIN PROTECTED ROUTES ====================

// POST /api/admin/products
app.post('/api/admin/products', adminAuth, async (req, res) => {
  try {
    const { name, price } = req.body
    if (!name || price == null) {
      return res.status(400).json({ error: 'Missing required fields: name, price' })
    }
    const maxIdResult = await supabase
      .from('products')
      .select('id')
      .order('id', { ascending: false })
      .limit(1)
    const maxId = maxIdResult.data?.length ? parseInt(maxIdResult.data[0].id, 10) || 0 : 0

    const newProduct = {
      id: String(maxId + 1),
      name,
      price: Number(price),
      description: req.body.description || '',
      image: req.body.image || '',
      category: req.body.category || '',
      available: req.body.available !== undefined ? req.body.available : true,
      rating: req.body.rating || 0,
      stock: req.body.stock !== undefined ? req.body.stock : 0,
      delivery_services: req.body.deliveryServices || [],
      available_delivery_services: req.body.availableDeliveryServices || [],
    }
    const { data, error } = await supabase
      .from('products')
      .insert(newProduct)
      .select()
      .single()
    if (error) throw error
    res.status(201).json(mapProductRow(data))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/admin/products/:id
app.put('/api/admin/products/:id', adminAuth, async (req, res) => {
  try {
    const allowedFields = ['name', 'price', 'description', 'image', 'category', 'available', 'stock', 'rating', 'deliveryServices', 'availableDeliveryServices']
    const updates = {}
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        if (key === 'deliveryServices') updates.delivery_services = req.body[key]
        else if (key === 'availableDeliveryServices') updates.available_delivery_services = req.body[key]
        else updates[key] = req.body[key]
      }
    }

    if (Object.keys(updates).length === 0) {
      return res.status(400).json({ error: 'No valid fields to update' })
    }

    const { data, error } = await supabase
      .from('products')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single()
    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Product not found' })
    res.json(mapProductRow(data))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/admin/products/:id
app.delete('/api/admin/products/:id', adminAuth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', req.params.id)
    if (error) throw error
    res.json({ deleted: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// POST /api/admin/delivery-services
app.post('/api/admin/delivery-services', adminAuth, async (req, res) => {
  try {
    const { name } = req.body
    if (!name) {
      return res.status(400).json({ error: 'Missing required field: name' })
    }
    const maxIdResult = await supabase
      .from('delivery_services')
      .select('id')
      .order('id', { ascending: false })
      .limit(1)
    const maxId = maxIdResult.data?.length ? parseInt(maxIdResult.data[0].id, 10) || 0 : 0

    const newService = {
      id: String(maxId + 1),
      name,
      description: req.body.description || '',
      coverage_areas: req.body.coverageAreas || [],
      pricing: req.body.pricing || 0,
      estimated_time: req.body.estimatedTime || '',
      rating: req.body.rating || 0,
      image: req.body.image || '',
      available: req.body.available !== undefined ? req.body.available : true,
    }
    const { data, error } = await supabase
      .from('delivery_services')
      .insert(newService)
      .select()
      .single()
    if (error) throw error
    res.status(201).json(mapDeliveryServiceRow(data))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// PUT /api/admin/delivery-services/:id
app.put('/api/admin/delivery-services/:id', adminAuth, async (req, res) => {
  try {
    const allowedFields = ['name', 'description', 'coverageAreas', 'pricing', 'estimatedTime', 'rating', 'image', 'available']
    const updates = {}
    for (const key of allowedFields) {
      if (req.body[key] !== undefined) {
        if (key === 'coverageAreas') updates.coverage_areas = req.body[key]
        else if (key === 'estimatedTime') updates.estimated_time = req.body[key]
        else updates[key] = req.body[key]
      }
    }

    const { data, error } = await supabase
      .from('delivery_services')
      .update(updates)
      .eq('id', req.params.id)
      .select()
      .single()
    if (error) throw error
    if (!data) return res.status(404).json({ error: 'Delivery service not found' })
    res.json(mapDeliveryServiceRow(data))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// DELETE /api/admin/delivery-services/:id
app.delete('/api/admin/delivery-services/:id', adminAuth, async (req, res) => {
  try {
    const { error } = await supabase
      .from('delivery_services')
      .delete()
      .eq('id', req.params.id)
    if (error) throw error
    res.json({ deleted: true })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// GET /api/admin/delivery-services — all delivery services (including inactive)
app.get('/api/admin/delivery-services', adminAuth, async (req, res) => {
  try {
    const { data, error } = await supabase
      .from('delivery_services')
      .select('*')
    if (error) throw error
    res.json(data.map(mapDeliveryServiceRow))
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ==================== UPLOAD ENDPOINT ====================

app.post('/upload', adminAuth, upload.single('image'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'No image file provided' })
    }
    const result = await cloudinary.uploader.upload(req.file.path, {
      folder: 'tagudinlocals',
      transformation: [{ width: 800, crop: 'limit' }, { quality: 'auto' }],
    })
    // Return absolute Cloudinary URL — frontend uses it directly
    res.status(201).json({ url: result.secure_url })
  } catch (err) {
    res.status(500).json({ error: err.message })
  }
})

// ==================== ERROR HANDLER ====================

app.use((err, req, res, next) => {
  console.error('[ERROR]', err.message)
  if (err.code === 'LIMIT_FILE_SIZE') {
    return res.status(413).json({ error: 'Image must be under 5MB' })
  }
  if (err.message === 'Only image files are allowed') {
    return res.status(400).json({ error: 'Only image files are allowed' })
  }
  if (err.message && err.message.startsWith('CORS blocked')) {
    return res.status(403).json({ error: err.message })
  }
  res.status(500).json({ error: 'Internal server error' })
})

// Start
app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`)
  console.log(`Supabase: ${process.env.SUPABASE_URL ? 'connected' : 'MISSING URL'}`)
  console.log(`Cloudinary: ${process.env.CLOUDINARY_CLOUD_NAME ? 'configured' : 'MISSING CONFIG'}`)
  console.log(`Admin PIN: ${process.env.ADMIN_PIN_HASH ? 'set' : 'NOT SET — admin login will fail'}`)
})