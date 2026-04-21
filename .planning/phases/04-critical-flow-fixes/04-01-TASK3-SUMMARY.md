---
phase: "04"
plan: "01"
subsystem: "frontend-services"
tags: ["api-first", "auth", "cart-session", "orders", "delivery"]
dependency_graph:
  requires: ["04-01-task1", "04-01-task2"]
  provides: ["04-01-task3"]
  affects: ["product.service", "cart.service", "order.service", "delivery.service", "auth.service"]
tech_stack:
  added: ["AuthService (BehaviorSubject + HttpClient)"]
  patterns: ["session-based cart", "API-first with graceful degradation", "PIN in-memory storage"]
key_files:
  created:
    - "src/app/services/auth.service.ts"
  modified:
    - "src/app/services/product.service.ts"
    - "src/app/services/cart.service.ts"
    - "src/app/services/order.service.ts"
    - "src/app/services/delivery.service.ts"
    - "src/app/cart/cart.page.ts"
    - "src/app/checkout/checkout.page.ts"
    - "src/app/order-success/order-success.page.ts"
decisions:
  - "Auto-subscribe (fire-and-forget) pattern for admin CRUD methods matching existing admin page callers"
  - "Cart uses crypto.randomUUID() for session ID stored in localStorage as cache"
  - "apiItemIdMap tracks API item IDs for PATCH/DELETE cart operations"
  - "createOrder and getOrderById return Observables requiring consumers to subscribe"
  - "OrderService.getOrders() auto-fetches from API and returns BehaviorSubject"
metrics:
  duration: "26 min"
  completed: "2026-04-21"
  tasks_completed: 5
  files_changed: 8
---

# Phase 4 Plan 1 Task 3: Frontend Services API-First Conversion Summary

AuthService created with PIN verification; all frontend services converted from localStorage to API-first pattern.

## Completed Tasks

| Sub-task | Name | Commit | Key Changes |
|----------|------|--------|-------------|
| 3.1 | Create AuthService | b324362 | New auth.service.ts with PIN setup/verify/hasPinSet/logout/getPinHeader |
| 3.2 | Convert ProductService | 0feb355 | Admin CRUD uses /api/admin/products with pin header, removed localStorage |
| 3.3 | Convert CartService | 68f9afb | Session-based cart API with graceful degradation, crypto.randomUUID() |
| 3.4 | Convert OrderService | 0dcd4d1 | API-first orders, removed localStorage, admin uses pin header |
| 3.5 | Convert DeliveryService | 52daec1 | Fetches from GET /delivery-services instead of hardcoded array |

## Deviations from Plan

None - plan executed exactly as written.

## Key Design Decisions

1. **Auto-subscribe for admin methods**: ProductService admin methods (addProduct, updateProduct, deleteProduct) use `.subscribe()` internally (fire-and-forget) because the existing admin page calls them synchronously without subscribing. The `fetchProducts()` call in the `tap` refreshes the product list from the server after each mutation.

2. **Cart session ID via crypto.randomUUID()**: Stored in localStorage as a cache key. The API is the source of truth; localStorage only caches the session ID.

3. **API item ID mapping**: The `apiItemIdMap` in CartService maps product IDs to API-assigned cart item IDs, enabling correct PATCH and DELETE operations on session-based cart endpoints.

4. **Observable returns for order methods**: `createOrder()` and `getOrderById()` return Observables since their callers (checkout page, order-success page) need the response data. Consumers subscribe and navigate on success.

5. **Graceful degradation**: CartService updates locally if the API call fails, ensuring the UI remains responsive even when the server is unavailable.

## Build Verification

App builds successfully with `npx ng build`. Only pre-existing warnings present (NG8107 optional chain, Stencil glob pattern).

## Self-Check: PASSED

- All 8 created/modified files exist on disk
- All 5 task commits found in git log (b324362, 0feb355, 68f9afb, 0dcd4d1, 52daec1)
- App builds without errors