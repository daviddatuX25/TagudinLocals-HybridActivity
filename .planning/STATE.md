# State: TagudinLocals-HybridActivity

**Updated:** 2026-04-21

## Project Reference

See: .planning/PROJECT.md (updated 2026-04-20)

**Core value:** The app must fetch products dynamically from a running backend API and successfully add items to cart via POST
**Current focus:** Phase 3 — Camera Integration

## Phase Status

| Phase | Status | Plans | Progress |
|-------|--------|-------|----------|
| 1 | Complete | 1/1 | 100% |
| 2 | Complete | 1/1 | 100% |
| 3 | Complete | 1/1 | 100% |

## Workflow Config

- Mode: YOLO
- Granularity: Coarse
- Parallelization: true
- Research: yes
- Plan Check: yes
- Verifier: yes
- Last Activity: 2026-04-21 (Phase 3 complete)

## Decisions

- Used BehaviorSubject for loading/error state (reactive pattern consistent with products$)
- Dual-write to API + localStorage on cart add for resilience
- Graceful degradation: localStorage still works if API is down
- Admin CRUD methods kept localStorage-only per scope
- API cart items enriched with Product data from ProductService
- Camera in admin form only (not customer-facing)
- Full upload flow: resize to 800x800 → POST /upload → file stored on server → URL in product.image
- IonToast danger for camera errors (consistent with Phase 2 pattern)
- Built-in web fallback via @capacitor/camera