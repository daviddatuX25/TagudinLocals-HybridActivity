// One-time seed script: reads db.json and upserts into Supabase
// Usage: node seed-supabase.js  (reads from .env)

import 'dotenv/config'
import { createClient } from '@supabase/supabase-js'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_KEY
)

if (!process.env.SUPABASE_URL || !process.env.SUPABASE_SERVICE_KEY) {
  console.error('ERROR: SUPABASE_URL and SUPABASE_SERVICE_KEY env vars required')
  process.exit(1)
}

const dbPath = path.join(__dirname, 'db.json')
const rawData = JSON.parse(fs.readFileSync(dbPath, 'utf-8'))

async function seed() {
  let errors = 0

  // Products
  console.log(`Seeding ${rawData.products.length} products...`)
  const productRows = rawData.products.map(p => ({
    id: p.id,
    name: p.name,
    price: p.price,
    description: p.description || '',
    image: p.image || '',
    category: p.category || '',
    available: p.available !== undefined ? p.available : true,
    rating: p.rating || 0,
    stock: p.stock !== undefined ? p.stock : 0,
    delivery_services: p.deliveryServices || [],
    available_delivery_services: p.availableDeliveryServices || [],
  }))
  const { error: pErr } = await supabase
    .from('products')
    .upsert(productRows, { onConflict: 'id' })
  if (pErr) { console.error('Products error:', pErr.message); errors++ }
  else console.log('Products: OK')

  // Delivery services
  console.log(`Seeding ${rawData.deliveryServices.length} delivery services...`)
  const deliveryRows = rawData.deliveryServices.map(s => ({
    id: s.id,
    name: s.name,
    description: s.description || '',
    coverage_areas: s.coverageAreas || [],
    pricing: s.pricing || 0,
    estimated_time: s.estimatedTime || '',
    rating: s.rating || 0,
    image: s.image || '',
    available: s.available !== undefined ? s.available : true
  }))
  const { error: dErr } = await supabase
    .from('delivery_services')
    .upsert(deliveryRows, { onConflict: 'id' })
  if (dErr) { console.error('Delivery services error:', dErr.message); errors++ }
  else console.log('Delivery services: OK')

  // Cart items
  if (rawData.cart && rawData.cart.length > 0) {
    console.log(`Seeding ${rawData.cart.length} cart items...`)
    const cartRows = rawData.cart.map(c => ({
      id: String(c.id),
      session_id: c.sessionId,
      product_id: c.productId,
      name: c.name,
      price: c.price,
      quantity: c.quantity
    }))
    const { error: cErr } = await supabase
      .from('cart_items')
      .upsert(cartRows, { onConflict: 'id' })
    if (cErr) { console.error('Cart items error:', cErr.message); errors++ }
    else console.log('Cart items: OK')
  } else {
    console.log('No cart items to seed')
  }

  // Orders (empty in seed data but handle if present)
  if (rawData.orders && rawData.orders.length > 0) {
    console.log(`Seeding ${rawData.orders.length} orders...`)
    const orderRows = rawData.orders.map(o => ({
      id: o.id,
      customer_info: o.customerInfo,
      delivery_service_id: o.deliveryServiceId || null,
      delivery_fee: o.deliveryFee || 0,
      items: o.items,
      subtotal: o.subtotal,
      total_amount: o.totalAmount,
      status: o.status || 'pending'
    }))
    const { error: oErr } = await supabase
      .from('orders')
      .upsert(orderRows, { onConflict: 'id' })
    if (oErr) { console.error('Orders error:', oErr.message); errors++ }
    else console.log('Orders: OK')
  } else {
    console.log('No orders to seed')
  }

  if (errors > 0) {
    console.error(`\nSeed completed with ${errors} error(s)`)
    process.exit(1)
  } else {
    console.log('\nSeed completed successfully!')
  }
}

seed()