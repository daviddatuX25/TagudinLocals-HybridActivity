# Phase 3: Camera Integration - Context

**Gathered:** 2026-04-21
**Status:** Ready for planning

<domain>
## Phase Boundary

Integrate Capacitor Camera plugin into the admin product form so users can capture or select a product image, resize it, upload it to the backend, and display it. Web fallback uses the built-in file picker. Permission errors use the existing IonToast pattern.

</domain>

<decisions>
## Implementation Decisions

### Button placement
- **D-01:** Camera button lives in the Admin add/edit product form — a camera icon on the image field inside the existing modal. Not on customer-facing product cards.

### After-capture behavior
- **D-02:** Full upload flow — captured/selected image is resized on the frontend, uploaded via a new POST /upload endpoint on the Express server, and the returned URL replaces the product's image field.

### Image storage
- **D-03:** Images stored as files in a `server/uploads/` directory. Multer handles multipart form data. Express serves static files from `uploads/`. Product `image` field gets the URL path (e.g., `/uploads/filename.jpg`). Frontend resizes to 800x800 before upload using canvas.

### Error handling
- **D-04:** Camera permission and availability errors shown via `<ion-toast color="danger">` — consistent with Phase 2's error pattern on the home page.

### Web fallback
- **D-05:** @capacitor/camera's built-in web fallback — automatically opens a file picker on browser. No custom UI needed.

### Claude's Discretion
- Exact resize implementation (canvas API approach)
- Multer configuration (file size limits, allowed extensions)
- Upload directory creation and static serving setup
- Camera button icon and styling in the admin form

</decisions>

<spec_lock>
## Locked from Prior Phases

- Product model: `{ id, name, price, description, image, category, available, rating?, stock?, deliveryServices?, availableDeliveryServices? }` — `image` is a `string` (URL)
- Admin form already has `newProduct.image` as a text input for URL — camera button replaces/augments this
- Phase 2 uses `<ion-toast color="danger">` for API errors — camera errors follow the same pattern
- Phase 2 uses `<ion-skeleton-text>` for loading states — similar pattern for upload progress if needed
- Backend is Express + lowdb at `server/server.js` — upload endpoint will be added here
- Capacitor config: `appId: 'com.tagudinProducts'`, `webDir: 'www'`
- Android emulator uses `10.0.2.2:3000` for API — upload URL must also use this pattern

</spec_lock>

<canonical_refs>
## Canonical References

### Camera requirements
- `.planning/REQUIREMENTS.md` — CAM-01 through CAM-04: camera button, Capacitor plugin, web fallback, image display
- `.planning/ROADMAP.md` — Phase 3 success criteria: native capture, web fallback, image display, permission handling

### Backend reference
- `.planning/phases/01-backend-api/01-01-PLAN.md` — Express server structure, lowdb persistence pattern
- `server/server.js` — Existing Express server where upload endpoint will be added

### Frontend patterns
- `.planning/phases/02-frontend-api-integration/02-01-PLAN.md` — HttpClient pattern, error toast pattern, environment config
- `src/app/home/home.page.html` — IonToast error pattern, loading skeleton pattern

</canonical_refs>

<code_context>
## Existing Code Insights

### Reusable Assets
- **Admin modal**: Already has `newProduct.image` text input — camera icon replaces/augments this field
- **IonToast pattern**: `<ion-toast color="danger">` already used on home page — reuse for camera errors
- **Product model**: `image: string` field already exists — upload returns URL to store here
- **Capacitor core**: `@capacitor/core@8.1.0` and `@capacitor/android@8.1.0` already installed
- **Environment config**: `environment.ts` already has API URL with Android emulator handling

### Established Patterns
- **Error handling**: BehaviorSubject + ion-toast for async errors (Phase 2 pattern)
- **HTTP calls**: HttpClient with observables (Phase 2 pattern)
- **Admin CRUD**: ProductService already has add/update methods — upload URL updates product image field

### Integration Points
- **`server/server.js`**: Add POST /upload endpoint, serve static from uploads/
- **`src/app/admin/admin.page.ts`**: Add camera trigger, resize, upload, and image preview
- **`src/app/admin/admin.page.html`**: Add camera icon button on image field
- **`src/app/services/product.service.ts`**: May need upload helper method or separate UploadService
- **`package.json`**: Add `@capacitor/camera` and `multer` dependencies

</code_context>

<specifics>
## Specific Ideas

- Camera icon on the admin form's image field — tapping opens native camera on device, file picker on browser
- After capture, resize to 800x800 via canvas before uploading
- Upload returns a URL path like `/uploads/1234.jpg` which replaces the image field value
- Product card immediately shows the uploaded image
- Permission denied → red toast matching existing error pattern

</specifics>

<deferred>
## Deferred Ideas

- Customer-facing camera on product cards — out of scope for this phase, admin-only per decision
- Image gallery / multiple images per product — single image is sufficient for rubric
- Image cropping UI — resize is sufficient, no crop tool needed for demo
- Pull-to-refresh (PROD-06) — separate v2 requirement
- Delete from cart endpoint (CART-05) — separate v2 requirement

</deferred>

---
*Phase: 03-camera-integration*
*Context gathered: 2026-04-21*