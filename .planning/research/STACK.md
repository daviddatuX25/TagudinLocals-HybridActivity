# Stack Research: TagudinLocals Hybrid App

**Date:** 2026-04-20
**Confidence:** High (all libraries are stable, well-documented, and directly match the rubric)

## Backend Stack

| Component | Choice | Version | Rationale |
|-----------|--------|---------|-----------|
| Runtime | Node.js | 18+ LTS | Required by rubric (IV. Server-Side Scripting with Node.js) |
| Framework | Express | ^4.21 | Minimal, rubric-aligned, easiest to defend |
| CORS | cors middleware | ^2.8 | Required for Ionic frontend calling localhost:3000 |
| Persistence | LowDB (JSON file) | ^7.0 | Tiny JSON file DB — cart persists across server restarts, minimal code |
| Body Parser | express.json() | built-in | Parse POST /cart JSON payloads |

## Frontend Stack (Existing)

| Component | Current | Change Needed |
|-----------|---------|---------------|
| Framework | Ionic 8 + Angular 20 | None — keep existing |
| HTTP Client | None (hardcoded data) | Add `provideHttpClient()` in `main.ts` |
| Environment | None | Add `environment.ts` with `apiUrl` |
| Camera | None | Add `@capacitor/camera` plugin |

## Native Feature Stack

| Component | Choice | Version | Rationale |
|-----------|--------|---------|-----------|
| Camera | @capacitor/camera | ^6.0 | Official Capacitor plugin, works in browser fallback and native |
| Photo UI | Ionic ActionSheet | built-in | Simple "take photo / choose from gallery" prompt |

## NOT Using

| Rejected | Why |
|----------|-----|
| NestJS | Overkill for 3 endpoints, harder to defend |
| MongoDB | JSON file is enough, adds install complexity |
| SQLite | Overkill for a lab exam demo |
| @ionic-native/camera | Deprecated — use @capacitor/camera instead |
| Geolocation API | Chosen Camera per user decision |