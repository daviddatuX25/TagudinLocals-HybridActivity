# Features Research: TagudinLocals Hybrid App

**Date:** 2026-04-20

## Table Stakes (Must Have — Grader Deducts Points)

| Feature | Rubric Task | Points | Complexity |
|---------|------------|--------|------------|
| Existing app runs properly | Task 1 | 10 | Low (already done) |
| GET /products returns 5+ products | Task 2 | 10 | Low |
| GET /cart returns stored items | Task 2 | 10 | Low |
| POST /cart adds items | Task 2 | 10 | Low |
| Products loaded from API (not hardcoded) | Task 3 | 10 | Medium |
| Add to Cart button sends POST /cart | Task 4 | 10 | Medium |
| Camera capture or simulate product image | Task 5 | 10 | Medium |
| Clean responsive Ionic UI | Task 6 | 10 | Low (already done) |

## Differentiators (Bonus for Defense)

| Feature | Why It Helps Defense |
|---------|---------------------|
| JSON file persistence | "Cart survives server restart" — shows understanding of persistence vs in-memory |
| Loading skeleton on product fetch | Shows async UX awareness, not just blank screen |
| Error handling toast on API failure | Shows defensive programming, grader sees you thought about failure cases |
| 10.0.2.2 environment swap for Android | Shows you understand emulator networking, not just browser dev |
| Camera with web fallback | Camera works in browser (picks file) and native (takes photo) |

## Anti-Features (Deliberately NOT Building)

| Feature | Reason |
|---------|--------|
| Authentication/login | Not in rubric, adds scope creep |
| Payment integration | Not in rubric |
| Real database (MongoDB/PostgreSQL) | JSON file is sufficient and simpler to defend |
| Admin CRUD via API | Admin page already works with localStorage, don't overcomplicate |
| Push notifications | Not in rubric |