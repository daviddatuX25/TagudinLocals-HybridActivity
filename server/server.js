import express from 'express'
import cors from 'cors'
import { JSONFilePreset } from 'lowdb/node'

const app = express()
const PORT = 3000

// Middleware: CORS first (before routes), then JSON body parser
app.use(cors())
app.use(express.json())

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

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})