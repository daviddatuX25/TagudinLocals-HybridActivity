# Phase 3: Camera Integration - Research

**Researched:** 2026-04-21
**Domain:** Capacitor Camera plugin (v8 API), image upload via Multer, canvas resize
**Confidence:** HIGH

## Summary

Phase 3 adds camera-based image capture to the admin product form and a full upload pipeline: camera capture (or file picker on web), frontend canvas resize to 800x800, multipart upload via a new POST /upload endpoint on the Express server, and displaying the uploaded image URL in the product card. The critical discovery is that this project runs Capacitor v8 (core@8.1.0, android@8.1.0), which means the Camera plugin MUST be @capacitor/camera@8.1.0 -- NOT v6 as listed in STACK.md. The v8 API uses `Camera.takePhoto()` and `Camera.chooseFromGallery()` instead of the deprecated `Camera.getPhoto()`. The `CameraSource.Prompt` enum is removed entirely in v8, so the app must build its own UI (ActionSheet or buttons) to let the user choose between camera and gallery.

The server side is straightforward: Multer v2.1.1 is already installed in server/package.json and is ESM-compatible (verified via live import test). The server already uses `"type": "module"` and Express v5, so adding a POST /upload route with `multer.diskStorage` and serving static files from `uploads/` requires no architectural changes. Multer's CJS `module.exports` interops correctly with ESM `import multer from 'multer'`.

**Primary recommendation:** Install `@capacitor/camera@8.1.0` (matching Capacitor core version). Use `Camera.takePhoto()` with `webUseInput: true` for browser file picker fallback. Build an ActionSheet-style prompt in the admin form for camera vs. gallery choice. Resize via canvas on the frontend before uploading. Add POST /upload with Multer diskStorage on the server, serve `uploads/` as static.

<user_constraints>
## User Constraints (from CONTEXT.md)

### Locked Decisions
- **D-01:** Camera button lives in the Admin add/edit product form -- a camera icon on the image field inside the existing modal. Not on customer-facing product cards.
- **D-02:** Full upload flow -- captured/selected image is resized on the frontend, uploaded via a new POST /upload endpoint on the Express server, and the returned URL replaces the product's image field.
- **D-03:** Images stored as files in a `server/uploads/` directory. Multer handles multipart form data. Express serves static files from `uploads/`. Product `image` field gets the URL path (e.g., `/uploads/filename.jpg`). Frontend resizes to 800x800 before upload using canvas.
- **D-04:** Camera permission and availability errors shown via `<ion-toast color="danger">` -- consistent with Phase 2's error pattern on the home page.
- **D-05:** @capacitor/camera's built-in web fallback -- automatically opens a file picker on browser. No custom UI needed.

### Claude's Discretion
- Exact resize implementation (canvas API approach)
- Multer configuration (file size limits, allowed extensions)
- Upload directory creation and static serving setup
- Camera button icon and styling in the admin form

### Deferred Ideas (OUT OF SCOPE)
- Customer-facing camera on product cards -- out of scope for this phase, admin-only per decision
- Image gallery / multiple images per product -- single image is sufficient for rubric
- Image cropping UI -- resize is sufficient, no crop tool needed for demo
- Pull-to-refresh (PROD-06) -- separate v2 requirement
- Delete from cart endpoint (CART-05) -- separate v2 requirement
</user_constraints>

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|------------------|
| CAM-01 | Camera button/trigger available on product UI | Admin form camera icon button, ActionSheet prompt for camera vs gallery choice |
| CAM-02 | @capacitor/camera plugin integrated for photo capture | Camera.takePhoto() (v8 API) with proper Android permissions in AndroidManifest.xml |
| CAM-03 | Web fallback works (file picker on browser) | Camera.takePhoto({ webUseInput: true }) triggers file input on web; chooseFromGallery always uses file input on web |
| CAM-04 | Captured/selected image displayed in UI | Upload response returns URL path, product.image updated, image preview shown in admin form and product cards |
</phase_requirements>

## Architectural Responsibility Map

| Capability | Primary Tier | Secondary Tier | Rationale |
|------------|-------------|----------------|-----------|
| Camera capture / file pick | Browser / Client | -- | Camera API runs in the browser/webview, triggers native camera via plugin |
| Image resize (canvas) | Browser / Client | -- | Frontend resize reduces upload size, done before sending to server |
| File upload (multipart) | API / Backend | -- | POST /upload with Multer processes the file on the server |
| Static file serving | API / Backend | CDN / Static | Express serves uploaded images from uploads/ directory |
| Permission handling | Browser / Client | -- | Camera plugin requests permissions on native; errors shown via ion-toast |
| Image URL storage | Database / Storage | -- | Product image field updated with URL path from upload response |

## Standard Stack

### Core
| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| @capacitor/camera | ^8.1.0 | Camera capture and gallery selection | Official Capacitor plugin, must match core@8.1.0 version. v8 API uses takePhoto/chooseFromGallery [VERIFIED: npm registry, Context7] |
| multer | ^2.1.1 | Multipart form data handling on Express | Already installed in server/package.json. ESM-compatible via default import interop [VERIFIED: npm registry, live import test] |

### Supporting
| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| @capacitor/android | ^8.1.0 | Android native runtime | Already installed -- needed for camera plugin native bridge |

### Alternatives Considered
| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| @capacitor/camera@8 | @capacitor/camera@6 | v6 uses deprecated getPhoto() API. MISMATCHED with core@8 -- will fail. Must use v8. |
| Multer diskStorage | Multer memoryStorage + manual write | memoryStorage loads file into memory as Buffer; for 800x800 images this is fine but diskStorage is simpler (auto-writes to disk) |
| Canvas resize | Sharp (server-side) | Sharp would add a native dependency to the server; canvas resize on frontend is simpler and reduces upload bandwidth |
| PWA Elements | webUseInput: true | PWA Elements provides a camera-like UI on web but adds a dependency; webUseInput: true uses native file picker which is simpler |

**Installation:**
```bash
# Frontend (project root)
npm install @capacitor/camera@^8.1.0

# Server (already has multer)
cd server
# multer@2.1.1 already installed, no action needed
```

**Version verification (2026-04-21):**
- @capacitor/camera: 8.1.0 [VERIFIED: npm registry]
- multer: 2.1.1 [VERIFIED: npm registry, installed in server/package.json]
- @capacitor/core: 8.1.0 [VERIFIED: package.json in repo]
- @capacitor/android: 8.1.0 [VERIFIED: package.json in repo]
- Node.js: v22.21.0 [VERIFIED: local environment]

## Architecture Patterns

### System Architecture Diagram

```
  Admin Form (Browser/WebView)
       |
       | 1. User taps camera icon
       v
  +------------------------------------+
  |  ActionSheet: "Camera" or "Gallery"|
  |  (custom UI, not CameraSource.Prompt)|
  +------------------------------------+
       |                    |
   "Camera"            "Gallery"
       |                    |
       v                    v
  Camera.takePhoto()  Camera.chooseFromGallery()
  (native camera      (native gallery or
   on device,          file picker on web)
   file picker
   on web)
       |                    |
       v                    v
  MediaResult { webPath, uri, thumbnail, ... }
       |
       | 2. Read image as data URL from webPath/uri
       v
  Canvas Resize (800x800)
  - Create off-screen canvas
  - Draw image scaled to 800x800 (contain, not crop)
  - Export as JPEG blob (quality 0.8)
       |
       | 3. Build FormData + POST /upload
       v
  +------------------------------------+
  |  Express Server (port 3000)         |
  |                                     |
  |  POST /upload                       |
  |  - Multer diskStorage               |
  |  - fileFilter: image/* only         |
  |  - limits: 5MB max                  |
  |  - Save to server/uploads/          |
  |  - Return { url: "/uploads/xxx" }   |
  |                                     |
  |  app.use('/uploads', static(...))   |
  |  Serves uploaded images             |
  +------------------------------------+
       |
       | 4. Response { url: "/uploads/abc123.jpg" }
       v
  Admin Form
  - Set newProduct.image = response.url
  - Show image preview in form
  - On save, product.image persisted via existing CRUD
```

### Recommended Project Structure
```
server/
  uploads/             # NEW: created at server startup, gitignored
  server.js            # MODIFY: add POST /upload, static serving, multer config

src/app/admin/
  admin.page.ts        # MODIFY: add camera trigger, resize, upload logic
  admin.page.html      # MODIFY: add camera icon button, image preview
  admin.page.scss      # MODIFY: styling for camera button and preview

src/app/services/
  upload.service.ts    # NEW: optional service for upload HTTP call (or inline in admin page)
```

### Pattern 1: Camera v8 takePhoto with webUseInput
**What:** Capture photo using the v8 Camera API with automatic web fallback.
**When to use:** When user chooses "Take Photo" from the action sheet.
**Example:**
```typescript
// Source: Capacitor Camera v8 docs [CITED: capacitorjs.com/docs/apis/camera]
import { Camera, CameraResultType } from '@capacitor/camera';

async capturePhoto(): Promise<void> {
  try {
    const result = await Camera.takePhoto({
      quality: 80,
      webUseInput: true,  // Force file picker on web (no PWA Elements needed)
      correctOrientation: true
    });

    // result.webPath is a blob URL on native, or data URL on web
    // result.thumbnail contains base64 on web (full image on web, smaller on native)
    const imageUrl = result.webPath;
    // Process: resize then upload
  } catch (error: unknown) {
    this.handleCameraError(error);
  }
}
```

### Pattern 2: Camera v8 chooseFromGallery
**What:** Select photo from gallery with web fallback (always file picker on web).
**When to use:** When user chooses "From Gallery" from the action sheet.
**Example:**
```typescript
// Source: Capacitor Camera v8 docs [CITED: capacitorjs.com/docs/apis/camera]
import { Camera } from '@capacitor/camera';

async selectFromGallery(): Promise<void> {
  try {
    const { results } = await Camera.chooseFromGallery({
      limit: 1,
      webUseInput: true
    });

    if (results.length > 0) {
      const imageUrl = results[0].webPath;
      // Process: resize then upload
    }
  } catch (error: unknown) {
    this.handleCameraError(error);
  }
}
```

### Pattern 3: Canvas Resize to 800x800 (Contain, Not Crop)
**What:** Resize image to fit within 800x800 while maintaining aspect ratio (contain, not cover/crop).
**When to use:** After camera capture or gallery selection, before upload.
**Example:**
```typescript
async resizeImage(imagePath: string, maxSize = 800): Promise<Blob> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const canvas = document.createElement('canvas');

      // Contain: scale to fit within maxSize x maxSize
      let width = img.width;
      let height = img.height;
      if (width > height) {
        if (width > maxSize) {
          height = Math.round((height * maxSize) / width);
          width = maxSize;
        }
      } else {
        if (height > maxSize) {
          width = Math.round((width * maxSize) / height);
          height = maxSize;
        }
      }

      canvas.width = width;
      canvas.height = height;

      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0, width, height);

      canvas.toBlob(
        (blob) => {
          if (blob) {
            resolve(blob);
          } else {
            reject(new Error('Canvas toBlob failed'));
          }
        },
        'image/jpeg',
        0.8  // 80% quality
      );
    };
    img.onerror = () => reject(new Error('Failed to load image'));
    img.src = imagePath;
  });
}
```

### Pattern 4: Multer Upload Endpoint with ESM
**What:** POST /upload with Multer diskStorage, image filter, and size limits.
**When to use:** Server-side file upload handling.
**Example:**
```javascript
// Source: Multer v2 docs [CITED: Context7 /expressjs/multer]
import express from 'express'
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir)
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, uploadsDir)
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`
    cb(null, uniqueName)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // 5MB max
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'), false)
    }
  }
})

// Serve uploaded files statically
app.use('/uploads', express.static(uploadsDir))

// Upload endpoint
app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided' })
  }
  const url = `/uploads/${req.file.filename}`
  res.status(201).json({ url })
})

// Multer error handler
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'Image must be under 5MB' })
    }
    return res.status(400).json({ error: err.message })
  }
  if (err.message === 'Only image files are allowed') {
    return res.status(400).json({ error: 'Only image files are allowed' })
  }
  next(err)
})
```

### Pattern 5: Frontend Upload via FormData
**What:** Upload resized image blob as multipart form data.
**When to use:** After canvas resize, before updating product.
**Example:**
```typescript
async uploadImage(imageBlob: Blob): Promise<string> {
  const formData = new FormData();
  formData.append('image', imageBlob, 'product.jpg');

  const response = await this.http.post<{ url: string }>(
    `${environment.apiUrl}/upload`,
    formData
  ).toPromise();

  return response!.url;
}
```

### Pattern 6: IonToast Error Display (Consistent with Phase 2)
**What:** Display camera and upload errors using the same ion-toast danger pattern from the home page.
**When to use:** Camera permission denied, capture cancelled, upload fails.
**Example:**
```typescript
// In admin.page.ts -- matching home.page.ts pattern
showErrorToast = false;
errorMessage: string | null = null;

handleCameraError(error: unknown): void {
  const err = error as any;
  let message = 'Camera error occurred';

  if (err.code === 'OS-PLUG-CAMR-0003') {
    message = 'Camera permission denied. Please enable camera access in settings.';
  } else if (err.code === 'OS-PLUG-CAMR-0006') {
    message = 'Photo capture was cancelled';
    return; // Don't show toast for user cancellation
  } else if (err.code === 'OS-PLUG-CAMR-0007') {
    message = 'No camera available on this device';
  } else if (err.message) {
    message = err.message;
  }

  this.errorMessage = message;
  this.showErrorToast = true;
}

// In admin.page.html (matching home page pattern)
// <ion-toast
//   [isOpen]="showErrorToast"
//   [message]="errorMessage || 'An error occurred'"
//   position="top"
//   color="danger"
//   [duration]="4000"
//   (didDismiss)="showErrorToast = false">
// </ion-toast>
```

### Anti-Patterns to Avoid
- **Using Camera.getPhoto() (deprecated v6 API):** Will not work with @capacitor/camera@8. Use `Camera.takePhoto()` and `Camera.chooseFromGallery()` instead. [CITED: Capacitor v8 docs]
- **Using CameraSource.Prompt:** Removed in v8. Must build custom UI (ActionSheet, buttons, or popover) to let user choose camera vs gallery. [CITED: Capacitor v8 docs]
- **Installing @capacitor/camera@6:** Version mismatch with core@8 will cause runtime errors. Must use @capacitor/camera@8.1.0. [VERIFIED: npm registry]
- **Resizing on the server:** Wastes upload bandwidth for large images. Resize on frontend via canvas before uploading. [ASSUMED: established best practice]
- **Storing images in lowdb/db.json:** Images are binary files. Store file paths in db.json, actual files on disk in uploads/. [ASSUMED: standard practice]
- **Adding PWA Elements dependency:** webUseInput: true bypasses the need for PWA Elements. The file picker is sufficient for a lab exam project. [VERIFIED: Capacitor docs]

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Camera capture / gallery selection | Custom file input or navigator.mediaDevices | @capacitor/camera takePhoto/chooseFromGallery | Handles permissions, native bridge, orientation correction, web fallback -- deceptively complex cross-platform |
| Multipart form data parsing | Custom body parsing for file uploads | multer.diskStorage | Handles streaming, temp files, file limits, MIME validation -- hand-rolling is fragile and insecure |
| Unique filenames | Custom name generation (uuid, random) | Date.now() + random suffix | Simple and collision-resistant enough for a lab demo; no need for uuid dependency |
| Image MIME validation | Manual extension checking | multer fileFilter with mimetype check | MIME type is more reliable than extension checking |

**Key insight:** The Camera plugin's cross-platform behavior (native camera vs web file picker) and permission handling are complex enough that hand-rolling would be a significant effort with many platform-specific edge cases. Similarly, Multer handles streaming uploads, file size limits, and error codes that are easy to get wrong manually.

## Common Pitfalls

### Pitfall 1: Camera Plugin Version Mismatch
**What goes wrong:** Installing @capacitor/camera@6 (as listed in STACK.md) alongside @capacitor/core@8.1.0 causes "plugin not compatible" runtime errors.
**Why it happens:** Capacitor requires plugin versions to match the core major version. v6 plugins use the deprecated getPhoto() API which doesn't exist in v8.
**How to avoid:** Install `@capacitor/camera@^8.1.0`. Use `Camera.takePhoto()` and `Camera.chooseFromGallery()`, NOT `Camera.getPhoto()`.
**Warning signs:** "Camera.getPhoto is not a function" or plugin initialization errors in console.

### Pitfall 2: CameraSource.Prompt Not Available in v8
**What goes wrong:** Trying to use `CameraSource.Prompt` (which showed a system action sheet in v6) will fail silently or throw an error in v8.
**Why it happens:** `CameraSource.Prompt` was removed in v8. The Camera plugin no longer shows its own selection UI.
**How to avoid:** Build a simple UI in the admin form (two buttons, or an Ionic ActionSheet) that calls either `takePhoto()` or `chooseFromGallery()` based on user choice.
**Warning signs:** Camera opens directly without giving user a choice between camera and gallery.

### Pitfall 3: Canvas CORS When Loading Native Camera URIs
**What goes wrong:** `img.src = result.webPath` may trigger a CORS error when trying to draw to canvas on certain platforms, particularly when the image comes from a native file:// URI.
**Why it happens:** Canvas becomes "tainted" when loading cross-origin images, which prevents `toBlob()` / `toDataURL()` from working.
**How to avoid:** For native platforms, read the image as base64 via the Filesystem API or use the `thumbnail` property from MediaResult (which contains base64 data on web). On web, the webPath is typically a data URL or blob URL which doesn't have CORS issues.
**Warning signs:** "SecurityError: The operation is insecure" or "Tainted canvases may not be exported" when calling canvas.toBlob().

### Pitfall 4: Missing Android Camera Permission
**What goes wrong:** Camera.takePhoto() fails with permission denied on Android, even before the user sees a permission prompt.
**Why it happens:** The AndroidManifest.xml needs `CAMERA` permission. Capacitor plugins typically auto-inject permissions, but this should be verified after `npx cap sync`.
**How to avoid:** After installing @capacitor/camera and running `npx cap sync android`, check that `android/app/src/main/AndroidManifest.xml` contains `<uses-permission android:name="android.permission.CAMERA" />`. If missing, add it manually.
**Warning signs:** App crashes or returns permission error immediately when camera button is tapped on Android.

### Pitfall 5: uploads/ Directory Not Created
**What goes wrong:** Multer's diskStorage fails with "ENOENT: no such file or directory" for server/uploads/.
**Why it happens:** Multer does not create the destination directory automatically. If the directory doesn't exist when the first upload happens, the write fails.
**How to avoid:** Create the directory at server startup: `if (!fs.existsSync(uploadsDir)) fs.mkdirSync(uploadsDir)`. Also add `server/uploads/` to .gitignore.
**Warning signs:** POST /upload returns 500 with "ENOENT" error; no files appear in server/uploads/.

### Pitfall 6: Large Image Upload Timeout
**What goes wrong:** Upload times out or fails because the original camera image (could be 4000x3000 pixels, 5+ MB) is sent before resizing.
**Why it happens:** Forgetting to resize before upload, or the resize function fails silently and falls through to uploading the original blob.
**How to avoid:** Always resize to 800x800 via canvas before constructing FormData. Add a file size limit in Multer (5MB) as a safety net. Verify the resized blob size is reasonable (< 500KB for 800x800 JPEG at 80% quality).
**Warning signs:** Upload takes more than a few seconds; server logs show large request bodies.

### Pitfall 7: Multer Error Not Caught Properly
**What goes wrong:** File too large or wrong type returns unhandled error instead of clean JSON response.
**Why it happens:** Multer errors need to be caught by Express error-handling middleware, not in the route handler itself. The `upload.single()` middleware throws before the handler runs.
**How to avoid:** Add an Express error-handling middleware (`app.use((err, req, res, next) => ...)`) after all routes that checks for `multer.MulterError` instances.
**Warning signs:** POST /upload returns HTML error page instead of JSON when file is too large.

### Pitfall 8: Image URL Not Displaying After Upload
**What goes wrong:** Product card shows broken image after upload completes.
**Why it happens:** The returned URL path (e.g., `/uploads/abc.jpg`) is a relative path that the frontend treats as relative to its own origin (localhost:4200), not the backend (localhost:3000).
**How to avoid:** Either (a) return full URL including origin: `http://localhost:3000/uploads/abc.jpg`, or (b) ensure the product.image field stores the full URL using environment.apiUrl prefix, or (c) use a proxy. Option (a) is simplest for a lab demo.
**Warning signs:** Browser console shows 404 for `http://localhost:4200/uploads/abc.jpg`.

## Code Examples

### Complete Admin Page Camera Integration (TypeScript)
```typescript
// Source: Capacitor v8 API [CITED: capacitorjs.com/docs/apis/camera]
import { Camera } from '@capacitor/camera';

export class AdminPage {
  // Add to existing properties
  imagePreview: string | null = null;
  showErrorToast = false;
  errorMessage: string | null = null;

  async selectImage(): Promise<void> {
    // Show action sheet for camera vs gallery choice
    // (CameraSource.Prompt removed in v8 -- build custom UI)
    // Option A: Ionic ActionSheet
    // Option B: Simple ion-select or two buttons

    // For simplicity, use two separate methods:
  }

  async takePhoto(): Promise<void> {
    try {
      const result = await Camera.takePhoto({
        quality: 80,
        webUseInput: true,
        correctOrientation: true
      });

      await this.processAndUpload(result.webPath);
    } catch (error: unknown) {
      this.handleCameraError(error);
    }
  }

  async pickFromGallery(): Promise<void> {
    try {
      const { results } = await Camera.chooseFromGallery({
        limit: 1,
        webUseInput: true
      });

      if (results.length > 0) {
        await this.processAndUpload(results[0].webPath);
      }
    } catch (error: unknown) {
      this.handleCameraError(error);
    }
  }

  private async processAndUpload(imagePath: string): Promise<void> {
    // 1. Show preview
    this.imagePreview = imagePath;

    // 2. Resize
    const blob = await this.resizeImage(imagePath, 800);

    // 3. Upload
    const formData = new FormData();
    formData.append('image', blob, 'product.jpg');

    this.http.post<{ url: string }>(
      `${environment.apiUrl}/upload`,
      formData
    ).subscribe({
      next: (response) => {
        this.newProduct.image = `${environment.apiUrl}${response.url}`;
        this.imagePreview = this.newProduct.image!;
      },
      error: (err) => {
        this.errorMessage = 'Failed to upload image';
        this.showErrorToast = true;
      }
    });
  }

  private async resizeImage(imagePath: string, maxSize: number): Promise<Blob> {
    return new Promise((resolve, reject) => {
      const img = new Image();
      img.onload = () => {
        const canvas = document.createElement('canvas');
        let width = img.width;
        let height = img.height;

        if (width > height) {
          if (width > maxSize) {
            height = Math.round((height * maxSize) / width);
            width = maxSize;
          }
        } else {
          if (height > maxSize) {
            width = Math.round((width * maxSize) / height);
            height = maxSize;
          }
        }

        canvas.width = width;
        canvas.height = height;
        const ctx = canvas.getContext('2d')!;
        ctx.drawImage(img, 0, 0, width, height);

        canvas.toBlob(
          (blob) => blob ? resolve(blob) : reject(new Error('toBlob failed')),
          'image/jpeg',
          0.8
        );
      };
      img.onerror = () => reject(new Error('Image load failed'));
      img.src = imagePath;
    });
  }
}
```

### Complete POST /upload Server Addition (server.js additions)
```javascript
// Source: Multer v2 + Express v5 [CITED: Context7 /expressjs/multer]
import multer from 'multer'
import path from 'path'
import { fileURLToPath } from 'url'
import fs from 'fs'

const __filename = fileURLToPath(import.meta.url)
const __dirname = path.dirname(__filename)

// Ensure uploads directory exists
const uploadsDir = path.join(__dirname, 'uploads')
if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir)
}

// Multer configuration
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, uploadsDir),
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${Math.round(Math.random() * 1E9)}${path.extname(file.originalname)}`
    cb(null, uniqueName)
  }
})

const upload = multer({
  storage,
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (req, file, cb) => {
    if (file.mimetype.startsWith('image/')) {
      cb(null, true)
    } else {
      cb(new Error('Only image files are allowed'), false)
    }
  }
})

// Serve uploaded images (add after existing middleware, before routes)
app.use('/uploads', express.static(uploadsDir))

// Upload endpoint
app.post('/upload', upload.single('image'), (req, res) => {
  if (!req.file) {
    return res.status(400).json({ error: 'No image file provided' })
  }
  const url = `/uploads/${req.file.filename}`
  res.status(201).json({ url })
})

// Error handler (add after all routes)
app.use((err, req, res, next) => {
  if (err instanceof multer.MulterError) {
    if (err.code === 'LIMIT_FILE_SIZE') {
      return res.status(413).json({ error: 'Image must be under 5MB' })
    }
    return res.status(400).json({ error: err.message })
  }
  if (err.message === 'Only image files are allowed') {
    return res.status(400).json({ error: 'Only image files are allowed' })
  }
  next(err)
})
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| Camera.getPhoto() | Camera.takePhoto() / chooseFromGallery() | Capacitor v8.1.0 (2026) | Must use new API; getPhoto is deprecated |
| CameraSource.Prompt | Build custom UI (ActionSheet) | Capacitor v8.1.0 | No built-in prompt; app must provide selection UI |
| CameraResultType.Uri/Base64/DataUrl | MediaResult always returns webPath + thumbnail | Capacitor v8.1.0 | No more resultType option; thumbnail contains base64 on web |
| width/height in ImageOptions | targetWidth/targetHeight (must be used together) | Capacitor v8.1.0 | Setting only one has no effect |
| allowEditing: boolean | editable: 'in-app' / 'external' / 'no' | Capacitor v8.1.0 | Three-state enum replaces boolean |
| @capacitor/camera@6 with core@8 | @capacitor/camera@8 matching core version | Capacitor v8 | Plugin version MUST match core major version |
| PWA Elements for web camera UI | webUseInput: true for file picker | Always available | Simpler approach, no extra dependency |

**Deprecated/outdated:**
- `Camera.getPhoto()`: Deprecated in v8. Use `takePhoto()` or `chooseFromGallery()`.
- `CameraSource.Prompt`: Removed in v8. Build custom UI.
- `CameraResultType`: Removed in v8. MediaResult always returns all fields.
- `@ionic-native/camera`: Long deprecated. Use `@capacitor/camera` directly.
- `@capacitor/camera@6`: Incompatible with Capacitor core@8. Use @8.

## Assumptions Log

| # | Claim | Section | Risk if Wrong |
|---|-------|---------|---------------|
| A1 | Canvas resize works with webPath from Camera.takePhoto() on native platforms without CORS issues | Architecture Patterns | If native webPath causes canvas tainting, need to use Filesystem API to read as base64 first. Medium risk -- fallback is reading the file via Filesystem plugin. |
| A2 | Capacitor auto-injects CAMERA permission in AndroidManifest.xml after cap sync | Common Pitfalls | If not auto-injected, manual addition is needed. Low risk -- easy to add manually. |
| A3 | Multer diskStorage works with ESM import `import multer from 'multer'` | Code Examples | Verified via live test: default import + diskStorage/MulterError are all accessible. |
| A4 | Product image URL should use full origin (http://localhost:3000/uploads/...) for display | Code Examples | If relative path is used, image won't display due to frontend/backend port difference. Medium risk -- verified by architecture (frontend on 4200, backend on 3000). |
| A5 | Image preview in admin form can use the camera's webPath/URI directly (blob URL or data URL) | Architecture Patterns | These are temporary browser URLs that work for `<img [src]>`. Low risk. |

## Open Questions

1. **Should we use Ionic ActionSheet or simple buttons for camera vs gallery choice?**
   - What we know: CameraSource.Prompt is removed in v8. Need custom UI.
   - What's unclear: ActionSheet looks more polished but adds complexity (need to import ActionSheetController). Simple buttons are easier to implement.
   - Recommendation: Use two buttons side-by-side (camera icon + gallery icon) in the admin form. Simpler, no extra imports, defensible in lab exam.

2. **Should the upload service be separate or inline in admin.page.ts?**
   - What we know: Phase 2 used separate ProductService and CartService. Upload is only used in admin page.
   - What's unclear: Whether a separate UploadService is worth the extra file.
   - Recommendation: Inline the upload HTTP call in admin.page.ts (or add a small private method). Upload is a single call with no state to manage -- not worth a separate service for a lab demo. At Claude's discretion per CONTEXT.md.

3. **Canvas CORS on Android native -- does webPath work?**
   - What we know: On web, webPath is a blob/data URL that works with canvas. On native Android, webPath may be a content:// URI.
   - What's unclear: Whether content:// URIs can be loaded into `<img>` and then drawn to canvas without tainting.
   - Recommendation: Test after implementation. If canvas taints, fallback to using the `thumbnail` base64 data (available on native per v8 API) or read the file via @capacitor/filesystem. This is a LOW risk -- webPath is designed to be usable as img.src, and canvas can draw images loaded from same-origin blob URLs.

## Environment Availability

| Dependency | Required By | Available | Version | Fallback |
|------------|------------|-----------|---------|----------|
| Node.js | Express server | Yes | v22.21.0 | -- |
| npm | Package installation | Yes | 10.9.4 | -- |
| @capacitor/core | Camera plugin | Yes | 8.1.0 | -- |
| @capacitor/android | Native camera | Yes | 8.1.0 | -- |
| multer | Upload handling | Yes | 2.1.1 | -- |
| Port 3000 | Express server | Likely free | -- | Change PORT if occupied |
| Canvas API | Image resize | Yes (browser) | Built-in | -- |

**Missing dependencies with no fallback:**
- None -- all required tools and libraries are available.

**Missing dependencies with fallback:**
- None.

## Security Domain

### Applicable ASVS Categories

| ASVS Category | Applies | Standard Control |
|---------------|---------|-----------------|
| V2 Authentication | No | No auth required for lab exam |
| V3 Session Management | No | No sessions needed |
| V4 Access Control | No | Admin page has no access control (lab exam) |
| V5 Input Validation | Yes | Multer fileFilter validates MIME type; size limits via multer limits |
| V6 Cryptography | No | No sensitive data; images are public product images |

### Known Threat Patterns for Express File Upload

| Pattern | STRIDE | Standard Mitigation |
|---------|--------|---------------------|
| Malicious file upload (non-image) | Tampering | Multer fileFilter checks `file.mimetype.startsWith('image/')` |
| Oversized file (DoS) | Denial of Service | Multer limits: `fileSize: 5 * 1024 * 1024` (5MB max) |
| Path traversal in filename | Tampering | Multer diskStorage uses custom filename (timestamp + random), ignores original name |
| Unrestricted file count | Denial of Service | `upload.single('image')` accepts only one file per request |

**Note:** This is a lab exam project running on localhost. Full production security hardening (virus scanning, CDN, signed URLs) is out of scope.

## Sources

### Primary (HIGH confidence)
- Context7 /ionic-team/capacitor-plugins - Camera v8 API: takePhoto, chooseFromGallery, ImageOptions, MediaResult, webUseInput, permission APIs
- capacitorjs.com/docs/apis/camera - v8.1.0 API changes: deprecated getPhoto, new methods, removed CameraSource.Prompt, structured error codes
- Context7 /expressjs/multer - Multer v2 API: diskStorage, memoryStorage, limits, fileFilter, MulterError handling
- npm registry - Version verification: @capacitor/camera 8.1.0, multer 2.1.1
- Codebase: server/package.json - multer@2.1.1 already installed
- Codebase: server/server.js - Express v5 + ESM pattern established
- Codebase: src/app/admin/admin.page.ts - Admin form with newProduct.image text input
- Codebase: src/app/home/home.page.html - IonToast danger pattern established

### Secondary (MEDIUM confidence)
- Live import test: multer ESM compatibility verified (default export + diskStorage accessible)
- Codebase: capacitor.config.ts - appId, webDir confirmed
- Codebase: android/app/src/main/AndroidManifest.xml - only INTERNET permission currently declared

### Tertiary (LOW confidence)
- Canvas CORS behavior with native camera URIs -- needs runtime verification [flagged in Assumptions A1]

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH - all versions verified against npm registry, APIs verified via Context7 and official docs
- Architecture: HIGH - upload pipeline is well-established pattern, Capacitor v8 API fully documented
- Pitfalls: HIGH - version mismatch and API changes are documented in official migration notes; CORS and directory issues are well-known
- Canvas resize: MEDIUM - canvas API is standard but native URI handling needs runtime verification

**Research date:** 2026-04-21
**Valid until:** 2026-05-21 (stable libraries, Capacitor v8 is current LTS)