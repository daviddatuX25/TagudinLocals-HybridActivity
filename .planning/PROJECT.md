# TagudinLocals-HybridActivity

## What This Is

Final lab exam project for Prof Elective 4 — Advanced Mobile Development: Hybrid. Enhances an existing Ionic/Angular shopping app (TagudinLocals) by replacing hardcoded product data with a Node.js + Express backend API, wiring dynamic product fetching and add-to-cart POST, integrating a native Camera feature, and maintaining a clean responsive UI. Graded on 6 tasks worth 60 points.

## Core Value

The app must fetch products dynamically from a running backend API and successfully add items to cart via POST — everything else supports those two flows.

## Requirements

### Validated

- ✓ Existing Ionic/Angular shopping app UI (home, cart, checkout, delivery, admin pages) — existing
- ✓ Hardcoded product data with 5+ items — existing
- ✓ Cart service with localStorage persistence — existing
- ✓ Product, CartItem, Order, DeliveryService models — existing

### Active

- [ ] Backend API with GET /products, GET /cart, POST /cart (Node.js + Express, JSON file persistence)
- [ ] Dynamic product fetching from http://localhost:3000/products (replace all hardcoded data)
- [ ] Add to Cart functionality using POST /cart endpoint
- [ ] Camera integration (Option B) — capture or simulate a product image
- [ ] Clean, responsive UI using Ionic components (mobile/tablet/desktop)
- [ ] Android emulator compatibility (10.0.2.2:3000 API URL)

### Out of Scope

- Authentication / user accounts — not required by rubric
- Payment processing — not required by rubric
- Real database (MongoDB, etc.) — JSON file persistence is sufficient for lab demo
- Geolocation feature — chose Camera instead
- External API feature — chose Camera instead
- Toast/Alert feature — chose Camera instead

## Context

- Lab exam deadline: April 21-23, 2026 (3-day window)
- Academic integrity policy: fully AI-generated work = -20pts, partial AI = -10pts, cannot explain = possible zero
- Must be able to explain and defend all code during grading
- App uses Ionic 8 + Angular 20 + Capacitor 8
- Existing product data is localized (Calamansi, Ilocos Empanada, Dalem, Shrimp, Pork Meat)
- Must demo on both browser (ionic serve) and Android emulator
- Backend runs on localhost:3000; Android emulator needs 10.0.2.2 instead

## Constraints

- **Tech stack**: Must use Node.js + Express for backend (per rubric)
- **Timeline**: Must be functional and demonstrable by April 23, 2026
- **API endpoints**: GET /products, GET /cart, POST /cart (minimum)
- **Products**: At least 5 products returned by /products endpoint
- **Cart**: Must store added items (JSON file persistence)
- **Hardcoded data**: Deduction if products are still hardcoded in frontend
- **Camera feature**: Basic implementation acceptable per rubric (can use placeholder)
- **Existing app**: Must reuse and improve current shopping app, not create new one

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Camera (Option B) over Toast/Geolocation/External API | More impressive for defense, shows native integration depth | — Pending |
| JSON file persistence over in-memory | Cart survives server restart, slightly more realistic, minimal extra code | — Pending |
| Android emulator support | Graders may test on device; 10.0.2.2 URL handling needed | — Pending |
| Capacitor Camera plugin | Official Ionic-native bridge, well documented for Capacitor 8 | — Pending |

---
*Last updated: 2026-04-20 after initialization*