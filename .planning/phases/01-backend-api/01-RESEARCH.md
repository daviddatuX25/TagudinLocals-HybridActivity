# Phase 1: Backend API - Research

**Researched:** 2026-04-20
**Domain:** Node.js + Express REST API with JSON file persistence (LowDB)
**Confidence:** HIGH

## Summary

Phase 1 builds a standalone Node.js + Express backend server that provides three endpoints (GET /products, GET /cart, POST /cart), persists data to a JSON file via LowDB v7, and serves the existing 11-item Tagudin localized product dataset as seed data. The backend runs independently from the Ionic/Angular frontend on port 3000 with CORS enabled so the frontend can call it during development.

The critical technical constraint is that LowDB v7 is ESM-only. The backend server directory needs its own `package.json` with `"type": "module"` and all server files must use ES module import syntax (`import`/`export`). LowDB's `JSONFilePreset` helper is the simplest initialization path -- it reads an existing `db.json` or creates one with provided default data, eliminating the need for a separate seed script.

The backend must be kept intentionally simple. This is a lab exam project where the student must explain all code during grading. No authentication, no real database, no complex middleware. The entire server can be a single `server.js` file with inline route handlers, plus a `db.json` seed file and a `package.json`. Three files total.

**Primary recommendation:** Create a `server/` directory at project root with its own ESM `package.json`, a `server.js` using LowDB `JSONFilePreset` for persistence, and seed `db.json` copied from the existing 11-product array in `product.service.ts`.

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Serve product list | API / Backend | -- | Static seed data, no frontend computation needed |
| Store/retrieve cart items | API / Backend | -- | Persistence must survive server restart, belongs in backend |
| CORS policy | API / Backend | -- | Backend owns the Access-Control headers |
| Request body parsing | API / Backend | -- | express.json() middleware on server side |
| JSON file persistence | Database / Storage | -- | db.json is the "database", LowDB reads/writes it |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| express | ^5.2.1 | HTTP server and routing | Rubric-mandated, minimal, most widely taught [VERIFIED: npm registry 2026-04-20] |
| cors | ^2.8.6 | Cross-origin middleware | Required for Ionic frontend on different port calling localhost:3000 [VERIFIED: npm registry 2026-04-20] |
| lowdb | ^7.0.1 | JSON file persistence | Simplest JSON file DB, cart survives server restart [VERIFIED: npm registry 2026-04-20] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| steno | ^4.0.2 | Safe atomic file writes (LowDB dependency) | Bundled with LowDB, no explicit install needed [VERIFIED: npm registry] |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| LowDB | Raw fs.readFile/writeFile | Raw fs is simpler but risks data corruption on crash (no atomic writes). LowDB uses steno for safe writes. For a lab demo, LowDB is 3 lines vs 15 lines of file handling. |
| LowDB | json-server | json-server provides full REST automatically but is a black box the student cannot explain. LowDB is transparent. |
| Express v5 | Express v4 | v5 is current (5.2.1). v4 still works but v5 is the latest stable. Use v5. |
| ESM server | CJS server with LowDB v1 | LowDB v1 was CJS but is ancient (v1.0.0 from 2017). Staying current with v7 ESM is better for defense. |

**Installation:**
```bash
cd server
npm init -y
# Manually add "type": "module" to package.json
npm install express cors lowdb
```

**Version verification (2026-04-20):**
- express: 5.2.1 [VERIFIED: npm registry]
- cors: 2.8.6 [VERIFIED: npm registry]
- lowdb: 7.0.1 [VERIFIED: npm registry]
- Node.js: v22.21.0 [VERIFIED: local environment]
- npm: 10.9.4 [VERIFIED: local environment]

## Architecture Patterns

### System Architecture Diagram

```
                    Ionic/Angular Frontend (port 4200)
                           |
                    HttpClient GET/POST
                           |
                           v
              +---------------------------+
              |   Express Server          |
              |   (port 3000)             |
              |                           |
              |  cors() middleware         |
              |  express.json() middleware |
              |                           |
              |  GET  /products --------->|---> reads db.json products[]
              |  GET  /cart ------------->|---> reads db.json cart[]
              |  POST /cart ------------->|---> appends to db.json cart[]
              |                           |     then db.write()
              +---------------------------+
                           |
                           v
                    db.json (JSON file)
                    {
                      "products": [ ...11 items... ],
                      "cart": [ ... ]
                    }
```

### Recommended Project Structure
```
server/                 # Backend directory (separate from Ionic app)
  package.json          # "type": "module" + dependencies
  server.js             # Express app, routes, LowDB init
  db.json               # Seed data (products) + empty cart
```

Three files. No separate route files, no controllers directory, no middleware directory. The student must explain this code -- every extra file is a defense liability.

### Pattern 1: LowDB JSONFilePreset Initialization
**What:** Single async call that reads existing db.json or creates it with default data.
**When to use:** Server startup -- this is the only initialization needed.
**Example:**
```javascript
// Source: https://github.com/typicode/lowdb README [CITED: Context7]
import { JSONFilePreset } from 'lowdb/node'

const defaultData = { products: [], cart: [] }
const db = await JSONFilePreset('db.json', defaultData)

// Read products
const products = db.data.products

// Add to cart and persist
db.data.cart.push(newItem)
await db.write()
```

### Pattern 2: Express Minimal Server with CORS First
**What:** Express setup where CORS is the very first middleware (before routes).
**When to use:** Always -- CORS must be applied before any route handler to handle preflight requests.
**Example:**
```javascript
// Source: Express 5.x docs [CITED: Context7]
import express from 'express'
import cors from 'cors'

const app = express()
const PORT = 3000

// Middleware order matters: CORS first, then body parser
app.use(cors())
app.use(express.json())

// Routes
app.get('/products', (req, res) => {
  res.json(db.data.products)
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
```

### Pattern 3: POST /cart with Validation
**What:** Validate required fields before storing, return appropriate HTTP status codes.
**When to use:** POST /cart endpoint.
**Example:**
```javascript
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
```

### Anti-Patterns to Avoid
- **CORS after routes:** If `app.use(cors())` comes after route definitions, preflight OPTIONS requests will fail. Always put CORS first. [CITED: Express docs, PITFALLS.md]
- **In-memory cart array:** Cart data will be lost on server restart. Must use LowDB + db.write() for persistence. [CITED: PITFALLS.md]
- **Single monolithic package.json:** Don't mix backend deps (express, lowdb) into the existing Ionic package.json. Keep server/ separate with its own package.json and node_modules.
- **Over-engineering with controllers/routes directories:** For 3 endpoints in a lab exam, a single server.js is defensible. Splitting into files the student cannot explain is a defense risk.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| JSON file persistence | Custom fs.readFile/writeFile with try/catch | LowDB JSONFilePreset | Atomic writes via steno, handles file creation, one-line init |
| CORS headers | Manual Access-Control-Allow-Origin headers | cors middleware | Handles preflight, origin patterns, credentials -- deceptively complex |
| Request body parsing | Custom body chunking from req | express.json() | Built into Express, handles content-type, encoding edge cases |

**Key insight:** Each of these seems trivial (read a file, set a header, parse JSON) but each has edge cases (concurrent writes, preflight requests, chunked encoding). The libraries handle them in 1 line each.

## Common Pitfalls

### Pitfall 1: CORS Preflight Failure
**What goes wrong:** Browser sends OPTIONS preflight before POST /cart. Without cors() middleware, the preflight gets no Access-Control headers, browser blocks the actual POST.
**Why it happens:** CORS middleware is placed after routes, or forgotten entirely.
**How to avoid:** `app.use(cors())` as the very first line after `const app = express()`.
**Warning signs:** Browser console shows "Access-Control-Allow-Origin" errors; Network tab shows failed OPTIONS requests.

### Pitfall 2: Cart Data Lost on Server Restart
**What goes wrong:** Items added via POST /cart disappear when server restarts.
**Why it happens:** Using an in-memory array (`let cart = []`) instead of LowDB with file persistence.
**How to avoid:** Always `await db.write()` after modifying `db.data.cart`. Verify by: add item via POST, restart server, GET /cart should still return the item.
**Warning signs:** POST /cart returns 201 but GET /cart returns [] after server restart.

### Pitfall 3: LowDB ESM Import Failure
**What goes wrong:** `require('lowdb')` throws ERR_REQUIRE_ESM because LowDB v7 is ESM-only.
**Why it happens:** Using CommonJS syntax in a file without `"type": "module"` in package.json.
**How to avoid:** Server package.json must have `"type": "module"`. All imports use `import` syntax, not `require()`. File extension is `.js` (not `.mjs` needed if type is module).
**Warning signs:** Error "require() of ES Module" or "ERR_REQUIRE_ESM" on startup.

### Pitfall 4: db.json Not Found / Empty on First Run
**What goes wrong:** Server crashes because db.json doesn't exist yet.
**Why it happens:** LowDB JSONFilePreset creates the file if missing, BUT the `defaultData` argument must contain the seeded products. If you pass `{ products: [], cart: [] }` as default, the API returns empty products array.
**How to avoid:** Either (a) create db.json with seed data before first run, or (b) pass the full 11-product seed array as `defaultData` in the JSONFilePreset call. Option (a) is cleaner -- db.json is a committed file.
**Warning signs:** GET /products returns `[]` on first run.

### Pitfall 5: POST /cart Missing Fields Silently Accepted
**What goes wrong:** POST /cart with empty body or partial fields gets stored as incomplete data.
**Why it happens:** No input validation on the POST handler.
**How to avoid:** Check for required fields (productId, name, price, quantity) before pushing to cart array. Return 400 if missing.
**Warning signs:** GET /cart returns items with undefined/null fields.

### Pitfall 6: Frontend and Backend Port Confusion
**What goes wrong:** Student tries to serve both on same port, or frontend calls wrong URL.
**Why it happens:** Ionic serves on 4200 (or ionic serve default), backend on 3000.
**How to avoid:** Backend explicitly listens on port 3000. Frontend environment config points to `http://localhost:3000`. These are separate processes.
**Warning signs:** Frontend network errors, "cannot fetch" messages.

## Code Examples

### Complete Minimal server.js (Verified Pattern)
```javascript
// Source: Express 5.x + LowDB 7.x docs [CITED: Context7]
import express from 'express'
import cors from 'cors'
import { JSONFilePreset } from 'lowdb/node'

const app = express()
const PORT = 3000

// Middleware: CORS first, then JSON body parser
app.use(cors())
app.use(express.json())

// Initialize LowDB with seed data
const defaultData = {
  products: [
    { id: '1', name: 'Calamansi', price: 120, description: 'Freshly harvested from Tagudin.', image: 'https://www.recipesbynora.com/wp-content/uploads/2024/04/Calamansi-in-basket.jpg', category: 'Fruits', available: true, rating: 4.8, deliveryServices: ['1','2','3'] },
    { id: '2', name: 'Ilocos Empanada', price: 80, description: 'Freshly cooked Ilocos empanada.', image: 'https://i.pinimg.com/originals/9c/8e/3e/9c8e3efc123f95db09e5f8bb40be973b.jpg', category: 'Food', available: true, rating: 4.5, deliveryServices: ['1','3'] }
    // ... remaining 9 products
  ],
  cart: []
}

const db = await JSONFilePreset('db.json', defaultData)

// GET /products - return all products
app.get('/products', (req, res) => {
  res.json(db.data.products)
})

// GET /cart - return all cart items
app.get('/cart', (req, res) => {
  res.json(db.data.cart)
})

// POST /cart - add item to cart
app.post('/cart', async (req, res) => {
  const { productId, name, price, quantity } = req.body

  if (!productId || !name || price == null || !quantity) {
    return res.status(400).json({ error: 'Missing required fields' })
  }

  const newItem = { productId, name, price, quantity }
  db.data.cart.push(newItem)
  await db.write()

  res.status(201).json(newItem)
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
```

### server/package.json
```json
{
  "name": "tagudinlocals-backend",
  "version": "1.0.0",
  "type": "module",
  "main": "server.js",
  "scripts": {
    "start": "node server.js"
  },
  "dependencies": {
    "cors": "^2.8.6",
    "express": "^5.2.1",
    "lowdb": "^7.0.1"
  }
}
```

### db.json Seed Structure
```json
{
  "products": [
    {
      "id": "1",
      "name": "Calamansi",
      "price": 120,
      "description": "Freshly harvested from Tagudin. Perfect for cooking, drinks, and marinades.",
      "image": "https://www.recipesbynora.com/wp-content/uploads/2024/04/Calamansi-in-basket.jpg",
      "category": "Fruits",
      "available": true,
      "rating": 4.8,
      "deliveryServices": ["1", "2", "3"]
    }
  ],
  "cart": []
}
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| LowDB v1 CJS `require('lowdb')` | LowDB v7 ESM `import { JSONFilePreset } from 'lowdb/node'` | v6+ (2023) | Server package.json needs `"type": "module"` |
| Express v4 `app.router` | Express v5 middleware auto-ordering | v4→v5 migration | Middleware executes in definition order, no explicit router needed |
| `body-parser` separate package | `express.json()` built-in | Express 4.16+ (2017) | No need to install body-parser separately |

**Deprecated/outdated:**
- `require('lowdb')`: ESM-only since v6. Use `import` syntax with `"type": "module"`.
- `@ionic-native/camera`: Deprecated. Use `@capacitor/camera` instead. (Not relevant to Phase 1 but noted.)
- `body-parser` package: Built into Express as `express.json()` since 4.16.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Express v5 is stable for production use (5.2.1 is latest) | Standard Stack | If v5 has breaking changes from v4 that affect basic routing, could cause issues. Mitigated: v5 is well-established by April 2026. |
| A2 | LowDB `JSONFilePreset` creates db.json if it doesn't exist | Architecture Patterns | If this behavior changed in v7, seed data won't auto-create. Verified via Context7 docs. |
| A3 | The 11-product array from product.service.ts is the complete seed data set | Code Examples | If there are more products elsewhere or the admin page can add products, seed data may be incomplete. Verified: read product.service.ts, exactly 11 products. |
| A4 | The POST /cart body shape { productId, name, price, quantity } matches what the frontend CartService will send | Architecture Patterns | Frontend may send the full Product object instead. Phase 2 handles this conversion; backend accepts the flat shape per BACK-04. |

**Note:** A1 through A3 are verified through documentation or codebase reading. A4 is an assumption about the Phase 2 interface contract -- low risk since it's defined in the requirements.

## Open Questions

1. **Should db.json be committed to git?**
   - What we know: db.json contains seed product data. Cart data will accumulate during development.
   - What's unclear: Whether accumulating cart data in a committed file is desirable, or if .gitignore should exclude it.
   - Recommendation: Commit db.json with seed data (products populated, cart empty). Add `server/db.json` to .gitignore AFTER initial commit so cart test data doesn't pollute the repo. Alternatively, provide a `seed` npm script that resets db.json. For a lab exam, committing seed data is fine.

2. **Should the server use nodemon for development?**
   - What we know: Without nodemon, every code change requires manual server restart.
   - What's unclear: Whether the convenience is worth an extra devDependency the student must explain.
   - Recommendation: Don't add nodemon. The student can explain `node server.js`. If asked during grading "how do you handle auto-restart?", the honest answer "I restart manually for development" is fine for a 3-endpoint server.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Express runtime | Yes | v22.21.0 | -- |
| npm | Package installation | Yes | 10.9.4 | -- |
| Port 3000 | Express server | Likely free | -- | Change PORT in server.js if occupied |

**Missing dependencies with no fallback:**
- None -- all required tools are available.

**Missing dependencies with fallback:**
- None.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No auth required for lab exam |
| V3 Session Management | No | No sessions needed |
| V4 Access Control | No | All endpoints are public |
| V5 Input Validation | Yes | Validate POST /cart fields before storing |
| V6 Cryptography | No | No sensitive data handled |

### Known Threat Patterns for Node.js + Express

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Missing input validation on POST | Tampering | Validate required fields (productId, name, price, quantity), return 400 |
| CORS too permissive (cors(*)) | Information Disclosure | Acceptable for lab exam localhost development; production would restrict origin |
| JSON file corruption on concurrent writes | Tampering | LowDB uses steno for atomic writes -- handled by library |

**Note:** This is a lab exam project running on localhost. Full production security hardening is out of scope.

## Sources

### Primary (HIGH confidence)
- Context7 /typicode/lowdb - LowDB v7 API: JSONFilePreset, JSONFile, Low, LowSync, db.update, db.write
- Context7 /expressjs/express - Express routing, middleware ordering, express.json()
- npm registry - Version verification: express 5.2.1, cors 2.8.6, lowdb 7.0.1
- Codebase: src/app/services/product.service.ts - 11-product seed data extracted
- Codebase: src/app/models/product.model.ts - Product interface shape
- Codebase: src/app/models/cart-item.model.ts - CartItem interface shape

### Secondary (MEDIUM confidence)
- .planning/research/STACK.md - Stack research confirming LowDB + Express choices
- .planning/research/PITFALLS.md - CORS ordering, persistence pitfalls
- .planning/research/ARCHITECTURE.md - Component boundaries and data flow

### Tertiary (LOW confidence)
- None -- all claims verified through primary or secondary sources.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all versions verified against npm registry, APIs verified via Context7
- Architecture: HIGH - 3-file server structure is minimal and defensible, pattern verified in LowDB docs
- Pitfalls: HIGH - CORS and ESM issues are well-documented common problems

**Research date:** 2026-04-20
**Valid until:** 2026-05-20 (stable libraries, low churn expected)