# Research Summary: TagudinLocals Hybrid App

**Date:** 2026-04-20

## Key Findings

### Stack
- **Backend:** Node.js + Express ^4.21 + cors + LowDB (JSON file persistence). Minimal, rubric-aligned, easy to defend.
- **Frontend:** Keep existing Ionic 8 + Angular 20. Add `provideHttpClient()` and `@capacitor/camera`.
- **Camera:** `@capacitor/camera` ^6.0 — official plugin with web fallback.

### Table Stakes
- GET /products, GET /cart, POST /cart endpoints must work
- Products must load from API, not hardcoded array
- Add-to-cart must POST to server
- Camera feature must work (basic implementation acceptable per rubric)
- Responsive Ionic UI maintained

### Watch Out For
- CORS must be the FIRST middleware in Express
- Remove hardcoded product array entirely — grader checks for this
- Use `10.0.2.2` for Android emulator API URL
- Start backend server BEFORE frontend demo
- Student must be able to explain all code (AI integrity policy)

### Architecture
- Backend serves products and cart from LowDB (db.json)
- Frontend Product/Cart services switch from BehaviorSubject/localStorage to HTTP calls
- Dual-write cart strategy: POST to server AND update localStorage (demo resilience)
- Environment-based API URL for browser vs Android

### Build Order
1. Backend API (Express + routes + LowDB + seed data)
2. Frontend HTTP integration (ProductService + CartService)
3. Camera integration
4. Polish & responsive check