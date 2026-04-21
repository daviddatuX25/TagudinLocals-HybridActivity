# Roadmap: TagudinLocals-HybridActivity

**Created:** 2026-04-20
**Granularity:** Coarse (3 phases)
**Total Requirements:** 18

## Phase 1: Backend API

**Goal:** Create a working Node.js + Express server with product and cart endpoints, seeded with localized Tagudin product data, persisting to JSON file.

**Requirements:** BACK-01, BACK-02, BACK-03, BACK-04, BACK-05, BACK-06

**Plans:** 1 plan (complete)

Plans:
- [x] 01-01-PLAN.md -- Create Express server with LowDB persistence and 11-product seed data

**Success Criteria:**
1. `node server.js` starts without errors on port 3000
2. GET /products returns 11 products as JSON (same items currently hardcoded)
3. POST /cart with { productId, name, price, quantity } returns 201 with saved item
4. GET /cart returns items previously added via POST
5. Cart data survives server restart (db.json persists)

---

## Phase 2: Frontend API Integration

**Goal:** Replace hardcoded product data with HTTP calls, wire add-to-cart to POST /cart, add loading/error states, ensure Android emulator compatibility.

**Requirements:** PROD-01, PROD-02, PROD-03, PROD-04, PROD-05, CART-01, CART-02, CART-03, CART-04, UI-01, UI-02, UI-03

**Plans:** 1 plan (complete)

Plans:
- [x] 02-01-PLAN.md -- Replace hardcoded data with API calls, wire cart to backend, add loading/error states

**Success Criteria:**
1. Home page loads products from http://localhost:3000/products (no hardcoded array in service)
2. Loading skeleton shown while fetching, error toast if API unreachable
3. Add to Cart button triggers POST /cart and item appears at GET /cart
4. Cart page shows items from both localStorage and API
5. App works on Android emulator with 10.0.2.2:3000
6. Responsive Ionic UI maintained across breakpoints

---

## Phase 3: Camera Integration

**Goal:** Integrate Capacitor Camera plugin with web fallback, allow users to capture or select a product image, display it in the UI.

**Requirements:** CAM-01, CAM-02, CAM-03, CAM-04

**Plans:** 1 plan

Plans:
- [ ] 03-01-PLAN.md -- Add camera capture with upload pipeline and image preview in admin form

**Success Criteria:**
1. Camera button triggers photo capture on native device
2. Camera falls back to file picker in browser
3. Captured/selected image is displayed in product card or detail view
4. Permission errors handled gracefully with user-friendly message

---

## Phase Summary

| Phase | Goal | Requirements | Success Criteria |
|-------|------|--------------|------------------|
| 1 | Backend API | BACK-01-06 | 5 |
| 2 | Frontend Integration | PROD-01-05, CART-01-04, UI-01-03 | 6 |
| 3 | Camera | CAM-01-04 | 4 |

**Coverage:** 18/18 requirements mapped