# Pitfalls Research: TagudinLocals Hybrid App

**Date:** 2026-04-20

## Critical Pitfalls

### 1. CORS Blocking API Requests
**Warning signs:** Browser console shows `Access-Control-Allow-Origin` errors; network tab shows failed OPTIONS preflight.
**Prevention:** Add `app.use(cors())` as the FIRST middleware in Express, before routes.
**Phase:** Phase 1 (Backend)

### 2. Hardcoded Data Still Visible After API Integration
**Warning signs:** Grader checks home page source and sees product array in TypeScript; products load even when server is down.
**Prevention:** Remove the entire `products` array from `product.service.ts`. Replace with HTTP call. If API is down, show error/loading state — NOT fallback to hardcoded data.
**Phase:** Phase 2 (Dynamic Fetching)

### 3. Android Emulator Can't Reach localhost:3000
**Warning signs:** App works in `ionic serve` but shows network errors on Android emulator.
**Prevention:** Use `10.0.2.2` instead of `localhost` for Android. Implement environment-based URL switching.
**Phase:** Phase 2 (Dynamic Fetching)

### 4. Camera Permission Denied on Device
**Warning signs:** Camera works in browser (file picker) but fails on Android; app crashes when tapping "Take Photo".
**Prevention:** Use `@capacitor/camera` with `web` fallback. On browser, it falls back to file input. Wrap in try/catch with user-friendly error message.
**Phase:** Phase 3 (Camera)

### 5. POST /cart Doesn't Persist Across Server Restart
**Warning signs:** Items added to cart disappear after restarting `node server.js`.
**Prevention:** Use LowDB (JSON file) instead of in-memory array. Cart data persists in `db.json`.
**Phase:** Phase 1 (Backend)

### 6. Academic Integrity Penalty (-20 pts for fully AI-generated)
**Warning signs:** Student cannot explain code; code looks too polished or uses patterns not covered in class.
**Prevention:** Write code incrementally, understand each piece. Use comments sparingly. Be ready to explain: why Express, why HttpClient, why Capacitor Camera, what CORS does.
**Phase:** All phases

### 7. Forgot to Start Backend Before Demo
**Warning signs:** Frontend loads but shows error/empty state.
**Prevention:** Start `node server.js` FIRST, then `ionic serve`. Add a clear error message in UI when API is unreachable.
**Phase:** Phase 2 (Dynamic Fetching)

### 8. Product Images Not Loading (External URLs)
**Warning signs:** Image placeholders or broken image icons in product cards.
**Prevention:** Test all image URLs in the seed data. Keep them as external URLs (they work fine for demo). Consider adding a fallback placeholder image.
**Phase:** Phase 1 (Backend seed data)