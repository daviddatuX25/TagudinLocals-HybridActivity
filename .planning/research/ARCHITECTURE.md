# Architecture Research: TagudinLocals Hybrid App

**Date:** 2026-04-20

## Component Boundaries

```
┌─────────────────────────────────────────────┐
│                 Ionic/Angular Frontend       │
│  ┌─────────┐ ┌─────────┐ ┌──────────────┐  │
│  │ Home     │ │ Cart     │ │ Camera UI    │  │
│  │ Page     │ │ Page     │ │ (new)        │  │
│  └────┬─────┘ └────┬─────┘ └──────┬───────┘  │
│       │             │              │           │
│  ┌────┴─────────────┴──────────────┴───────┐  │
│  │         Product Service (HTTP)           │  │
│  │         Cart Service (HTTP + local)      │  │
│  │         Camera Service (Capacitor)       │  │
│  └────────────┬────────────────────────────┘  │
│               │ HttpClient / Capacitor         │
└───────────────┼────────────────────────────────┘
                │
                ▼
┌─────────────────────────────────────────────┐
│          Node.js + Express Backend           │
│  ┌─────────┐ ┌─────────┐ ┌────────────────┐  │
│  │GET      │ │GET      │ │POST            │  │
│  │/products│ │/cart    │ │/cart            │  │
│  └────┬────┘ └────┬────┘ └──────┬─────────┘  │
│       │           │             │            │
│  ┌────┴───────────┴─────────────┴──────────┐  │
│  │           LowDB (db.json)                │  │
│  └──────────────────────────────────────────┘  │
└────────────────────────────────────────────────┘
```

## Data Flow

1. **Product Fetch**: Home page → ProductService.getProducts() → HTTP GET /products → Express reads db.json → returns Product[]
2. **Add to Cart**: Cart button → CartService.addToCart() → HTTP POST /cart → Express appends to db.json cart array → returns saved item
3. **View Cart**: Cart page → CartService.getCart() → HTTP GET /cart → Express reads db.json cart → returns CartItem[]
4. **Camera**: Product page → CameraService.capturePhoto() → Capacitor Camera plugin → returns base64 image or web file
5. **Dual-write Cart**: POST /cart AND localStorage update (demo resilience — if server is down, cart still works locally)

## Suggested Build Order

| Order | Component | Depends On | Why This Order |
|-------|-----------|------------|----------------|
| 1 | Backend API (Express server + routes) | Nothing | Everything else needs the API running |
| 2 | Product seed data in db.json | Backend server | API needs data to serve |
| 3 | HttpClient integration in ProductService | Backend API | Frontend needs working API to fetch |
| 4 | POST /cart from CartService | Backend API, ProductService | Cart needs products to add |
| 5 | Camera integration | Frontend working | Nice-to-have, independent of API |
| 6 | Polish & responsiveness | All above | Final pass |

## Key Architectural Decisions

- **Dual-write cart**: localStorage + POST /cart. If API is down, cart still works locally. During grading, they'll verify /cart endpoint — so POST must succeed.
- **Environment-based API URL**: `environment.apiUrl` switches between `http://localhost:3000` (browser) and `http://10.0.2.2:3000` (Android emulator).
- **LowDB for persistence**: Zero-config JSON file DB. db.json sits in `server/` directory. Products are seeded, cart is initially empty.