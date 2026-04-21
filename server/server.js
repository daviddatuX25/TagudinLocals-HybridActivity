import express from 'express'
import cors from 'cors'
import { JSONFilePreset } from 'lowdb/node'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)
const uploadsDir = path.join(__dirname, 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir)
}

const app = express()
const PORT = 3000

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

// Middleware: CORS first (before routes), then JSON body parser
app.use(cors())
app.use(express.json())
app.use('/uploads', express.static(uploadsDir))

// Initialize LowDB with seed data from db.json
// If db.json doesn't exist, JSONFilePreset creates it with defaultData
const defaultData = { products: [], cart: [] }
const db = await JSONFilePreset('db.json', defaultData)

// GET /products - return all products
app.get('/products', (req, res) => {
  res.json(db.data.products)
})

// GET /cart - return all cart items
app.get('/cart', (req, res) => {
  res.json(db.data.cart)
})

// POST /cart - add item to cart with validation
app.post('/cart', async (req, res) => {
  const { productId, name, price, quantity } = req.body

  if (!productId || !name || price == null || !quantity) {
    return res.status(400).json({ error: 'Missing required fields: productId, name, price, quantity' })
  }

  const newItem = { productId, name, price, quantity }
  db.data.cart.push(newItem)
  await db.write()

  res.status(201).json(newItem)
})

// POST /upload - upload product image
app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided' })
  }
  const url = `/uploads/${req.file.filename}`
  res.status(201).json({ url })
})

// Multer error handler
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
  console.log(`Server running on http://localhost:${PORT}`)
})