# Roadmap: TagudinLocals-HybridActivity

**Created:** 2026-04-20
**Granularity:** Coarse (6 phases)
**Total Requirements:** 18 (original) + 18 (redesign)

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

**Plans:** 1 plan (complete)

Plans:
- [x] 03-01-PLAN.md -- Add camera capture with upload pipeline and image preview in admin form

**Success Criteria:**
1. Camera button triggers photo capture on native device
2. Camera falls back to file picker in browser
3. Captured/selected image is displayed in product card or detail view
4. Permission errors handled gracefully with user-friendly message

---

## Phase 4: Critical Flow Fixes (P0)

**Goal:** Fix the three root problems identified in REDESIGN.md: wrong entry flow (role selection), wrong checkout flow (3-page detour), wrong data flow (localStorage as primary). Make the app behave like a real e-commerce app.

**Source:** .planning/codebase/REDESIGN.md sections 1-5

**Depends on:** Phases 1-3 (complete)

**Plans:** 1 plan (ready for execution)

Plans:
- [ ] 04-01-PLAN.md -- Server endpoints, remove landing, API-first services, PIN modal, merge checkout, stock display

**Success Criteria:**
1. App opens directly to /products (no landing/role-selection page)
2. Checkout is a single page with delivery method, details, and address sections (no /delivery page)
3. /admin route requires PIN authentication (AdminGuard + server middleware)
4. Products, cart, and orders read/write via API only (localStorage as cache)
5. POST /orders atomically deducts stock

---

## Phase 5: UX Improvements (P1)

**Goal:** Fix UX-breaking issues: no feedback on actions, no form validation, no loading states, no double-submit prevention, inconsistent headers.

**Source:** .planning/codebase/REDESIGN.md sections 6-7

**Depends on:** Phase 4

**Plans:** 0 plans

Plans:
- [ ] 05-01-PLAN.md -- (not yet created)

**Success Criteria:**
1. Add-to-cart shows toast + cart badge animation
2. Checkout form validates with inline errors on blur
3. Cart and checkout show loading states during API calls
4. Place Order button prevents double-submit with spinner + disabled state
5. CartGuard redirects to /products if cart is empty
6. Consistent header style across all buyer pages

---

## Phase 6: Polish & Accessibility (P2)

**Goal:** Bottom tab navigation, product detail page, order history, pull-to-refresh, search debounce, lazy loading, ARIA labels, keyboard navigation, shared components.

**Source:** .planning/codebase/REDESIGN.md sections 2, 3, 6-8

**Depends on:** Phase 5

**Plans:** 0 plans

Plans:
- [ ] 06-01-PLAN.md -- (not yet created)

**Success Criteria:**
1. Bottom tab bar with Home, Cart, Orders tabs
2. /products/:id detail page with full product info
3. /orders page showing customer order history
4. Pull-to-refresh on Products and Cart pages
5. Search with 300ms debounce
6. Images use lazy loading + error fallback placeholder
7. ARIA labels on all icon buttons, aria-live on cart badge
8. Shared components: empty-state, product-card, loading-skeleton, order-card

---

## Phase Summary

| Phase | Goal | Requirements | Success Criteria | Status |
|-------|------|--------------|------------------|--------|
| 1 | Backend API | BACK-01-06 | 5 | Complete |
| 2 | Frontend Integration | PROD-01-05, CART-01-04, UI-01-03 | 6 | Complete |
| 3 | Camera | CAM-01-04 | 4 | Complete |
| 4 | Critical Flow Fixes (P0) | REDESIGN 1-5 | 5 | Not started |
| 5 | UX Improvements (P1) | REDESIGN 6-7 | 6 | Not started |
| 6 | Polish & Accessibility (P2) | REDESIGN 2,3,6-8 | 8 | Not started |

**Coverage:** 18/18 original + 19 redesign requirements mapped