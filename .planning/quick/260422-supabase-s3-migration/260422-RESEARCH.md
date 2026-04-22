# Quick Task 260422: Supabase + S3 Migration - Research

**Researched:** 2026-04-22
**Domain:** LowDB-to-Supabase PostgreSQL migration, local-filesystem-to-AWS-S3 image storage
**Confidence:** HIGH

## Summary

The TagudinLocals Express backend currently uses LowDB (a JSON file on disk) for all data and multer + local `/uploads/` for image storage. Both approaches are fundamentally broken on Render: the filesystem is ephemeral (wiped on each deploy) and separate instances do not share state. The migration replaces LowDB with Supabase PostgreSQL (free tier) and local uploads with AWS S3, while keeping the Express server on Render.

**Primary recommendation:** Use `@supabase/supabase-js` with the `service_role` key for all server-side queries (bypasses RLS, no auth complexity needed). Use AWS S3 SDK v3 with **server-proxy upload** (not presigned URLs) because the frontend already sends FormData to `/upload` -- swapping multer's disk storage for S3 storage is a one-line concept change and requires zero frontend modifications. This minimizes blast radius.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- Supabase PostgreSQL (free tier) -- replaces LowDB entirely
- AWS S3 -- replaces local /uploads/ directory
- Keep Express server on Render (no change)
- Seed script: read db.json, insert into Supabase tables. Run once, then remove LowDB.
- Keep session tokens in-memory (ephemeral, already works)
- PIN hash stored in Supabase `settings` table

### Claude's Discretion
- Exact table schema design
- S3 bucket configuration (region, CORS, presigned URLs vs direct upload)
- How to handle the upload endpoint (presigned URL vs server proxy)
- Error handling and rollback strategy

### Deferred Ideas (OUT OF SCOPE)
- None specified
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| MIG-01 | Replace LowDB with Supabase PostgreSQL | Standard Stack: @supabase/supabase-js v2 + service_role key |
| MIG-02 | Replace local uploads with AWS S3 | Standard Stack: @aws-sdk/client-s3 v3 + server-proxy upload |
| MIG-03 | Seed script: db.json -> Supabase tables | Architecture Patterns: JS seed script using supabase-js |
| MIG-04 | Keep Render hosting working | Environment Availability + pitfalls: ephemeral FS, connection pooling |
| MIG-05 | Admin PIN hash in Supabase settings table | Table schema: `settings` key-value table |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Data persistence | Database (Supabase) | API (Express) | Postgres owns durability; Express routes queries |
| Image storage | External Service (S3) | API (Express) | S3 owns blobs; Express proxies uploads |
| Admin auth sessions | API (Express, in-memory) | -- | Sessions are ephemeral, scoped to server process |
| Seed/migration | CLI script (one-time) | -- | Runs once, not part of serving tier |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @supabase/supabase-js | 2.104.0 | PostgreSQL client | Official client, handles connection pooling, auto-retries, typed queries [VERIFIED: npm registry] |
| @aws-sdk/client-s3 | 3.1034.0 | S3 upload/delete/get | Official AWS SDK v3, tree-shakeable, maintained by AWS [VERIFIED: npm registry] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @aws-sdk/s3-request-presigner | 3.1034.0 | Generate presigned URLs | Only if switching to client-direct upload later [VERIFIED: npm registry] |
| multer-s3 | 3.0.1 | Multer storage engine for S3 | Drop-in replacement for multer.diskStorage -- keeps upload endpoint identical [VERIFIED: npm registry] |

### Removed
| Library | Reason |
|---------|--------|
| lowdb | Replaced by @supabase/supabase-js |

**Installation:**
```bash
cd server
npm install @supabase/supabase-js @aws-sdk/client-s3 multer-s3
npm uninstall lowdb
```

## Architecture Patterns

### System Architecture Diagram

```
Browser/Ionic App
    |
    | HTTP (FormData for uploads, JSON for data)
    v
Express on Render
    |-- /products, /orders, /cart, /delivery-services
    |       |
    |       v
    |   @supabase/supabase-js (service_role key)
    |       |
    |       v
    |   Supabase PostgreSQL (free tier)
    |       - products, cart_items, orders, delivery_services, settings
    |
    |-- /upload
    |       |
    |       v
    |   multer-s3 (PutObjectCommand)
    |       |
    |       v
    |   AWS S3 bucket
    |       - returns: https://bucket.s3.region.amazonaws.com/key
    |
    |-- /uploads/* (REMOVE -- served from S3 directly via image URL)
    |
    |-- admin auth (in-memory sessions, PIN hash from Supabase settings)
```

### Recommended Supabase Table Schema

```sql
-- Products table
CREATE TABLE products (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  description TEXT DEFAULT '',
  image TEXT DEFAULT '',           -- S3 URL or external URL
  category TEXT DEFAULT '',
  available BOOLEAN DEFAULT true,
  rating NUMERIC DEFAULT 0,
  stock INTEGER DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Delivery services
CREATE TABLE delivery_services (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  description TEXT DEFAULT '',
  coverage_areas JSONB DEFAULT '[]',
  pricing NUMERIC DEFAULT 0,
  estimated_time TEXT DEFAULT '',
  rating NUMERIC DEFAULT 0,
  image TEXT DEFAULT '',
  available BOOLEAN DEFAULT true,
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Cart items (session-based)
CREATE TABLE cart_items (
  id TEXT PRIMARY KEY,
  session_id TEXT NOT NULL,
  product_id TEXT NOT NULL REFERENCES products(id),
  name TEXT NOT NULL,
  price NUMERIC NOT NULL,
  quantity INTEGER NOT NULL DEFAULT 1,
  created_at TIMESTAMPTZ DEFAULT now()
);
CREATE INDEX idx_cart_items_session ON cart_items(session_id);

-- Orders
CREATE TABLE orders (
  id TEXT PRIMARY KEY,              -- 'ORD-timestamp-random' format
  customer_info JSONB NOT NULL,     -- { fullName, phoneNumber, deliveryAddress }
  delivery_service_id TEXT,
  delivery_fee NUMERIC DEFAULT 0,
  items JSONB NOT NULL,            -- [{ productId, name, price, quantity }]
  subtotal NUMERIC NOT NULL,
  total_amount NUMERIC NOT NULL,
  status TEXT DEFAULT 'pending',
  created_at TIMESTAMPTZ DEFAULT now(),
  order_date TIMESTAMPTZ DEFAULT now()
);

-- Settings (key-value for admin PIN hash, etc.)
CREATE TABLE settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
-- Row: key='admin_pin', value='$2b$10$...' (bcrypt hash)
```

**Why this schema:**
- `id` as TEXT (not UUID/auto-increment) -- preserves existing IDs from db.json seed data, no frontend changes needed [ASSUMED]
- JSONB for `coverage_areas`, `customer_info`, `items` -- avoids join tables for arrays/objects that are always read/written atomically
- `deliveryServices` array on products removed -- it was only stored but never queried relationally; can be re-added as a join table later if needed [ASSUMED: verify frontend doesn't filter by deliveryServices]
- `settings` as key-value -- extensible, only holds `admin_pin` now but can hold other config

### Pattern 1: Server-Proxy Upload (Recommended)

**What:** Express receives multipart/form-data, multer-s3 streams directly to S3, returns S3 URL.
**Why over presigned URLs:** Zero frontend changes. The admin page already POSTs FormData to `/upload` and reads `response.url`. With multer-s3, the endpoint signature stays identical. Presigned URLs would require the frontend to (1) request a presigned URL, (2) PUT the file directly to S3, (3) handle CORS, (4) construct the final URL -- 4 changes vs 0.

```javascript
import multerS3 from 'multer-s3'
import { S3Client } from '@aws-sdk/client-s3'

const s3 = new S3Client({
  region: process.env.AWS_REGION,
  credentials: {
    accessKeyId: process.env.AWS_ACCESS_KEY_ID,
    secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY
  }
})

const upload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.S3_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`
      cb(null, uniqueName)
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Only image files are allowed'), false)
  }
})

// Upload endpoint stays identical
app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image file provided' })
  // multer-s3 puts the S3 URL in req.file.location
  const url = req.file.location
  res.status(201).json({ url })
})
```
[Source: multer-s3 npm readme, AWS SDK v3 official docs]

### Pattern 2: Supabase Query Replacement

**What:** Replace every `db.data.X` access with `supabase.from('X').select()/insert()/update()/delete()`.

```javascript
import { createClient } from '@supabase/supabase-js'

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

// Before (LowDB):
// const products = db.data.products
// res.json(products)

// After (Supabase):
app.get('/products', async (req, res) => {
  const { data, error } = await supabase
    .from('products')
    .select('*')
    .order('id', { ascending: true })
  if (error) return res.status(500).json({ error: error.message })
  res.json(data)
})
```
[Source: Context7 /supabase/supabase-js docs]

### Pattern 3: Admin Auth with Supabase Settings Table

```javascript
// Before: db.data.adminPin
// After:
app.get('/api/admin/has-pin', async (req, res) => {
  const { data } = await supabase
    .from('settings')
    .select('value')
    .eq('key', 'admin_pin')
    .single()
  res.json({ hasPin: !!data })
})
```

### Pattern 4: Seed Script (one-time)

```javascript
// scripts/seed-supabase.js
import { createClient } from '@supabase/supabase-js'
import dbData from '../server/db.json' assert { type: 'json' }

const supabase = createClient(
  process.env.SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
)

async function seed() {
  // Products
  const { error: pErr } = await supabase
    .from('products')
    .upsert(dbData.products, { onConflict: 'id' })
  if (pErr) console.error('Products:', pErr)

  // Delivery services
  const { error: dErr } = await supabase
    .from('delivery_services')
    .upsert(dbData.deliveryServices, { onConflict: 'id' })
  if (dErr) console.error('Delivery services:', dErr)

  // Admin PIN hash
  if (dbData.adminPin) {
    const { error: sErr } = await supabase
      .from('settings')
      .upsert({ key: 'admin_pin', value: dbData.adminPin }, { onConflict: 'key' })
    if (sErr) console.error('Settings:', sErr)
  }

  // Cart and orders: skip or migrate if needed
  console.log('Seed complete')
}

seed()
```

**Why JS seed script, not SQL migration:**
- db.json has JavaScript data types (arrays as `deliveryServices`, nested `customerInfo` objects) that map directly to Supabase JSONB via the JS client
- A SQL migration would require hand-writing INSERT statements and manually serializing JSON arrays -- error-prone for this use case
- `upsert` with `onConflict` makes the script idempotent (safe to re-run)

### Anti-Patterns to Avoid
- **Using `anon` key on server side:** The `anon` key is subject to RLS policies. The Express server is a trusted backend -- use `service_role` key to bypass RLS. Otherwise every query must have RLS policies configured, adding complexity for a single-user admin app. [CITED: supabase.com/docs/reference/javascript/initializing]
- **Storing S3 credentials in code:** Use environment variables only. Render supports env vars in dashboard.
- **Trying to use Supabase Storage instead of S3:** Supabase Storage IS S3-compatible, but using raw S3 with the AWS SDK gives full control over bucket policies, CORS, and lifecycle rules. CONTEXT.md locked AWS S3, not Supabase Storage.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| S3 multipart upload | Custom multipart logic | multer-s3 | Handles streaming, content-type detection, retry logic |
| PostgreSQL connection pooling | Custom pool | @supabase/supabase-js built-in pooler | Supabase JS client uses HTTP-based PostgREST API, auto-handles pooling [CITED: supabase.com/docs/guides/database/connecting-to-postgres] |
| Presigned URL generation | Custom HMAC-SHA256 signing | @aws-sdk/s3-request-presigner | AWS SigV4 signing is complex and version-specific |
| DB retry/backoff | Custom retry logic | supabase-js built-in retries | Client handles network errors with configurable retries |

## Common Pitfalls

### Pitfall 1: Supabase Free Tier Project Pausing
**What goes wrong:** Supabase pauses free-tier projects after 1 week of inactivity. First request after pause takes ~30s to wake up, or returns 503.
**Why it happens:** Free tier policy -- compute resources are released to save costs.
**How to avoid:** (1) Set up a cron ping (e.g., UptimeRobot hitting `/products` every 5 min), or (2) accept cold starts for low-traffic app, or (3) upgrade to Pro ($25/mo) for always-on. [ASSUMED -- verify current Supabase pausing policy]

### Pitfall 2: Render Ephemeral Filesystem
**What goes wrong:** Any file written to disk on Render is lost on redeploy. This is the root cause we're fixing.
**Why it happens:** Render uses ephemeral containers. Only `/data` persistent disk survives (only on paid plans).
**How to avoid:** After migration, NO data should touch disk. Remove all `fs` writes, `uploadsDir`, and `express.static('/uploads')`. All data goes to Supabase, all images go to S3.

### Pitfall 3: Supabase Connection Limits on Free Tier
**What goes wrong:** Free tier allows 60 direct DB connections, 200 pooler connections. A single Render instance opening many concurrent connections could exhaust this.
**Why it happens:** The supabase-js client uses the PostgREST HTTP API, not direct TCP connections. Each query is an HTTP request, so connection count is effectively unlimited through the pooler. Direct `pg` connections would hit the 60-connection limit.
**How to avoid:** Use `@supabase/supabase-js` (HTTP/PostgREST) instead of `pg` (direct TCP). The HTTP API auto-pools. [VERIFIED: supabase.com/docs/guides/database/connecting-to-postgres]

### Pitfall 4: S3 CORS Configuration
**What goes wrong:** If frontend ever needs to access S3 URLs directly (e.g., `<img src="https://bucket.s3...">`), browser blocks the request without CORS headers on the S3 bucket.
**Why it happens:** S3 buckets have no CORS config by default.
**How to avoid:** With server-proxy upload, images are served via S3's public URL. If the bucket has public read access, CORS is not needed for `<img>` tags (CORS only blocks programmatic fetch/XHR, not image loads). But if you later switch to presigned URLs, you MUST configure CORS on the bucket.

### Pitfall 5: S3 Object URLs Changing from Relative to Absolute
**What goes wrong:** Current `/upload` endpoint returns `{ url: '/uploads/1234-file.jpg' }`. Frontend prepends `environment.apiUrl` to construct full URL. After S3 migration, the URL will be absolute (e.g., `https://bucket.s3.region.amazonaws.com/1234-file.jpg`). The frontend line `this.newProduct.image = ${environment.apiUrl}${response.url}` will produce a broken double-domain URL.
**Why it happens:** Hardcoded URL concatenation in frontend.
**How to avoid:** Two options: (1) Return the full S3 URL from the upload endpoint and change frontend to use `response.url` directly (no prefix), or (2) Return a relative path and add a proxy route in Express that redirects to S3. Option 1 is simpler.

### Pitfall 6: Existing Products Have External Image URLs
**What goes wrong:** Current db.json products use external URLs (unsplash, pinimg, etc.) as `image` values, not `/uploads/` paths. The migration must not break these.
**Why it happens:** Products were seeded with external image links.
**How to avoid:** The `image` field in Supabase is TEXT -- it stores any URL. No transformation needed for existing data. Only newly uploaded images will have S3 URLs.

## Code Examples

### Full S3 Upload Endpoint Replacement

```javascript
// Source: multer-s3 npm readme + AWS SDK v3 docs
import { S3Client } from '@aws-sdk/client-s3'
import multerS3 from 'multer-s3'

const s3 = new S3Client({ region: process.env.AWS_REGION })

const upload = multer({
  storage: multerS3({
    s3,
    bucket: process.env.S3_BUCKET_NAME,
    contentType: multerS3.AUTO_CONTENT_TYPE,
    key: (req, file, cb) => {
      cb(null, `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`)
    }
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true)
    else cb(new Error('Only image files are allowed'), false)
  }
})

app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) return res.status(400).json({ error: 'No image file provided' })
  res.status(201).json({ url: req.file.location })
})
```

### Supabase CRUD Replacements (key patterns)

```javascript
// Source: Context7 /supabase/supabase-js

// SELECT all
const { data, error } = await supabase.from('products').select('*')

// SELECT with filter
const { data } = await supabase.from('cart_items').select('*').eq('session_id', sessionId)

// INSERT
const { data, error } = await supabase.from('cart_items').insert(newItem).select().single()

// UPDATE with filter
const { data, error } = await supabase.from('products').update(updates).eq('id', id).select().single()

// DELETE with filter
const { error } = await supabase.from('cart_items').delete().eq('session_id', sessionId).eq('id', itemId)

// UPSERT (for seed script)
const { error } = await supabase.from('products').upsert(rows, { onConflict: 'id' })
```

### Frontend Image URL Fix

```typescript
// Before (admin.page.ts line ~387):
this.newProduct.image = `${environment.apiUrl}${response.url}`

// After (S3 returns absolute URL):
this.newProduct.image = response.url  // Already full S3 URL, no prefix needed
```

## Environment Variables Required

| Variable | Purpose | Set Where |
|----------|---------|-----------|
| `SUPABASE_URL` | Supabase project URL | Render env vars |
| `SUPABASE_SERVICE_ROLE_KEY` | Server-side key (bypasses RLS) | Render env vars (KEEP SECRET) |
| `AWS_REGION` | S3 bucket region (e.g., `ap-southeast-1`) | Render env vars |
| `AWS_ACCESS_KEY_ID` | IAM user access key | Render env vars |
| `AWS_SECRET_ACCESS_KEY` | IAM user secret key | Render env vars (KEEP SECRET) |
| `S3_BUCKET_NAME` | S3 bucket name | Render env vars |

**Removed env vars:** `DATA_DIR` (no longer needed, no disk writes)

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Express server | Yes | Check Render | -- |
| npm | Package install | Yes | Check Render | -- |
| Supabase account | PostgreSQL DB | Needs setup | Free tier | -- |
| AWS account | S3 bucket | Needs setup | Free tier (12mo) | -- |
| Render account | Hosting | Yes | Free tier | -- |

**Missing dependencies with no fallback:**
- Supabase project must be created before migration (blocks execution)
- AWS S3 bucket + IAM user must be created before migration (blocks execution)

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | TEXT ids (not UUID/auto-increment) work fine for preserving existing seed data | Table Schema | Medium -- if Supabase auto-generates UUIDs, seed upsert fails |
| A2 | `deliveryServices` array on products is not queried relationally | Table Schema | Low -- worst case, add a join table later |
| A3 | Supabase pauses free projects after 1 week of inactivity | Pitfall 1 | Low -- if policy changed, just remove the cron ping note |
| A4 | multer-s3 v3.0.1 is compatible with multer v2.x (current dep) | Standard Stack | Medium -- verify compatibility, may need multer downgrade or multer-s3 upgrade |

## Open Questions

1. **multer-s3 + multer v2 compatibility**
   - What we know: package.json has `multer: ^2.1.1`, multer-s3 is at 3.0.1
   - What's unclear: multer-s3 3.x lists multer as a peer dep; need to verify v2 compat
   - Recommendation: Test `npm install multer-s3` with current multer v2 -- if incompatible, pin multer-s3 to a compatible version or upgrade multer

2. **Supabase free tier project pausing**
   - What we know: Free tier projects pause after inactivity (standard Supabase behavior)
   - What's unclear: Exact inactivity threshold (believed ~7 days) and wake-up time
   - Recommendation: Accept cold start or set up UptimeRobot ping; verify current policy on Supabase dashboard after project creation

3. **S3 bucket public read access**
   - What we know: Product images need to be publicly accessible for `<img>` tags
   - What's unclear: Whether to use bucket-level public read or per-object ACL (`public-read`)
   - Recommendation: Use per-object ACL via multer-s3 `acl: 'public-read'` -- more secure, only uploaded images are public

## Sources

### Primary (HIGH confidence)
- Context7 /supabase/supabase-js -- CRUD query patterns (select, insert, update, delete, upsert)
- AWS S3 official docs -- presigned URL patterns with PutObjectCommand
- npm registry -- @supabase/supabase-js 2.104.0, @aws-sdk/client-s3 3.1034.0, multer-s3 3.0.1

### Secondary (MEDIUM confidence)
- supabase.com/docs/guides/database/connecting-to-postgres -- connection pooling (HTTP/PostgREST auto-pools)
- supabase.com/docs/guides/platform/compute-and-disk -- free tier limits (500MB DB, 60 direct conns, 200 pooler conns)
- multer-s3 npm readme -- S3 storage engine usage pattern

### Tertiary (LOW confidence)
- Supabase free tier pausing policy -- believed ~7 days inactivity, needs verification [ASSUMED]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH -- verified versions from npm registry
- Architecture: HIGH -- patterns from official docs and well-known migration paths
- Pitfalls: MEDIUM -- Supabase pausing policy unverified, multer-s3 compat untested

**Research date:** 2026-04-22
**Valid until:** 2026-05-22