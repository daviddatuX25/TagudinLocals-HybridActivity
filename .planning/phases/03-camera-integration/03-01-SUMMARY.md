---
phase: 03-camera-integration
plan: 01
subsystem: camera-upload
tags: [capacitor, camera, multer, upload, angular]
key-files:
  created:
    - path: "server/server.js"
      provides: "POST /upload endpoint with Multer diskStorage and static file serving"
      contains: "app.post('/upload'"
    - path: "src/app/admin/admin.page.ts"
      provides: "Camera capture, resize, upload, and error handling methods"
      min_lines: 280
    - path: "src/app/admin/admin.page.html"
      provides: "Camera/gallery buttons, image preview, and error toast in product modal"
      contains: "camera-outline"
    - path: "src/app/admin/admin.page.scss"
      provides: "Camera button and image preview styling"
      contains: "image-preview"
    - path: ".gitignore"
      provides: "Excludes uploaded images from version control"
      contains: "server/uploads/"
metrics:
  files_created: 0
  files_modified: 8
  lines_added: 257
  lines_removed: 12
---

## Task 1: Add POST /upload endpoint and static file serving

**Status: Complete**

Added Multer-based image upload endpoint to Express server:
- `POST /upload` with `multer.diskStorage` for unique filenames (`Date.now()-random.ext`)
- 5MB file size limit via `limits: { fileSize: 5 * 1024 * 1024 }`
- Image-only filter via `file.mimetype.startsWith('image/')`
- Static file serving at `/uploads` via `express.static(uploadsDir)`
- Multer error handler for file size and type errors
- `.gitignore` updated to exclude `server/uploads/`

**Commit:** `275d33b` — feat(03-01): add POST /upload endpoint and static file serving

## Task 2: Install Capacitor Camera and integrate into admin form

**Status: Complete**

Integrated `@capacitor/camera@8.1.0` into the admin product form:
- Camera button (`camera-outline`) triggers `Camera.takePhoto()` with `webUseInput: true`
- Gallery button (`image-outline`) triggers `Camera.chooseFromGallery()` with `webUseInput: true`
- `processAndUpload()` handles resize via canvas (max 800x800) and multipart upload
- `resizeImage()` uses HTML5 Canvas API for client-side image compression
- `handleCameraError()` maps Capacitor error codes to user-friendly messages:
  - `OS-PLUG-CAMR-0003` (permission denied) → danger toast
  - `OS-PLUG-CAMR-0006` (user cancelled) → silent return
  - `OS-PLUG-CAMR-0007` (no camera) → danger toast
- Image preview container shows selected/captured image with upload badge
- `IonToast color="danger"` for errors consistent with Phase 2 pattern
- `imagePreview` state tracks display; `isUploading` shows progress badge
- `HttpClient` injected for `POST /upload` with `FormData`
- `CAMERA` permission added to `AndroidManifest.xml`
- `npx cap sync android` completed successfully

**Commit:** `a75c381` — feat(03-01): integrate Capacitor Camera with admin product form

## Deviations

None. Implementation follows the plan exactly.

## Self-Check: PASSED

- [x] All acceptance criteria met
- [x] Server starts without errors
- [x] POST /upload returns 400 for missing file, 201 with URL for valid upload
- [x] Angular build compiles without errors
- [x] Camera.takePhoto uses v8 API (NOT deprecated getPhoto)
- [x] Camera.chooseFromGallery uses v8 API with webUseInput
- [x] Error codes mapped correctly (0003, 0006, 0007)
- [x] Image preview shows captured/selected image
- [x] Upload URL populates product image field
- [x] IonToast danger pattern consistent with Phase 2