# Requirements: TagudinLocals-HybridActivity

**Defined:** 2026-04-20
**Core Value:** The app must fetch products dynamically from a running backend API and successfully add items to cart via POST

## v1 Requirements

### Backend API

- [ ] **BACK-01**: Express server runs on port 3000 with CORS enabled
- [ ] **BACK-02**: GET /products returns at least 5 products as JSON array
- [ ] **BACK-03**: GET /cart returns stored cart items as JSON array
- [ ] **BACK-04**: POST /cart accepts { productId, name, price, quantity } and stores the item
- [ ] **BACK-05**: Cart and product data persist in db.json (survives server restart)
- [ ] **BACK-06**: Products are seeded from the existing 11-item localized dataset

### Dynamic Product Fetching

- [ ] **PROD-01**: ProductService fetches products via HTTP GET /products (no hardcoded array)
- [ ] **PROD-02**: Hardcoded product array is removed from product.service.ts
- [ ] **PROD-03**: Home page displays products loaded from API
- [ ] **PROD-04**: Loading state shown while products are being fetched
- [ ] **PROD-05**: Error state shown if API is unreachable

### Add to Cart

- [ ] **CART-01**: Add to Cart button sends POST /cart to backend
- [ ] **CART-02**: Cart items visible at GET /cart endpoint after adding
- [ ] **CART-03**: Cart also updates localStorage (dual-write for demo resilience)
- [ ] **CART-04**: Cart page reflects items added via POST

### Native Feature — Camera

- [ ] **CAM-01**: Camera button/trigger available on product UI
- [ ] **CAM-02**: @capacitor/camera plugin integrated for photo capture
- [ ] **CAM-03**: Web fallback works (file picker on browser)
- [ ] **CAM-04**: Captured/selected image displayed in UI

### UI & Responsiveness

- [ ] **UI-01**: Clean Ionic layout maintained across mobile/tablet/desktop
- [ ] **UI-02**: Ionic components properly used (cards, buttons, grids)
- [ ] **UI-03**: Environment-based API URL switches for browser vs Android emulator

## v2 Requirements

### Enhanced Features

- **CAM-05**: Save captured photo as product image (replace default)
- **PROD-06**: Pull-to-refresh on home page to reload products
- **CART-05**: Delete from cart via DELETE /cart/:id endpoint

## Out of Scope

| Feature | Reason |
|---------|--------|
| User authentication | Not in rubric, adds scope |
| Payment processing | Not in rubric |
| Real database (MongoDB/PostgreSQL) | JSON file persistence sufficient for lab demo |
| Geolocation/Toast/External API | Chose Camera instead |
| Admin CRUD via API | Admin page works with localStorage, don't overcomplicate |

## Traceability

| Requirement | Phase | Status |
|-------------|-------|--------|
| BACK-01 | Phase 1 | Pending |
| BACK-02 | Phase 1 | Pending |
| BACK-03 | Phase 1 | Pending |
| BACK-04 | Phase 1 | Pending |
| BACK-05 | Phase 1 | Pending |
| BACK-06 | Phase 1 | Pending |
| PROD-01 | Phase 2 | Pending |
| PROD-02 | Phase 2 | Pending |
| PROD-03 | Phase 2 | Pending |
| PROD-04 | Phase 2 | Pending |
| PROD-05 | Phase 2 | Pending |
| CART-01 | Phase 2 | Pending |
| CART-02 | Phase 2 | Pending |
| CART-03 | Phase 2 | Pending |
| CART-04 | Phase 2 | Pending |
| CAM-01 | Phase 3 | Pending |
| CAM-02 | Phase 3 | Pending |
| CAM-03 | Phase 3 | Pending |
| CAM-04 | Phase 3 | Pending |
| UI-01 | Phase 2 | Pending |
| UI-02 | Phase 2 | Pending |
| UI-03 | Phase 2 | Pending |

**Coverage:**
- v1 requirements: 18 total
- Mapped to phases: 18
- Unmapped: 0 ✓

---
*Requirements defined: 2026-04-20*
*Last updated: 2026-04-20 after initial definition*