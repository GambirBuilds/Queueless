# QUEUELESS Security Audit Report

**Audit Scope**: Server middleware, API routes, RBAC enforcement, validation layer, frontend auth flows, data exports, kiosk isolation, and Cloud Firestore security rules.

---

## 1. Controls Implemented & Verified

| Security Control | Implementation Location | Verification Status |
| :--- | :--- | :--- |
| **Cryptographic Token Verification** | `src/server/authMiddleware.js` (`adminAuth.verifyIdToken`) | All protected `/api/*` routes require valid Firebase ID Bearer token (`401` on missing/invalid). |
| **Authoritative Role Resolution** | `resolveAuthoritativeUser()` reads Firestore `users/{uid}` | Never trusts client-supplied `role`, `uid`, or `email` in headers/body. Suspended users blocked (`403`). |
| **Cross-Tenant & Branch Isolation** | `hasOrgBranchScope(user, orgId, branchId)` | Enforced on `walk-in`, `call-next`, `recall`, `update-status`, `toggle-status`, `appointments`, `audit-logs`, `reports`, and all `/api/org/:orgId/*` mutations. |
| **Customer Self-Registration Guard** | `src/context/AuthContext.jsx` & `authMiddleware.js` | Self-signup defaults strictly to `role: 'customer'`. `updateProfile()` whitelists safe profile fields only. |
| **Kiosk Display PII Isolation** | `GET /api/public/display/:branchId` | Strips customer phone, email, notes, and UIDs; exposes only token number, desk, status, and timestamps. |
| **Finite State Machine Enforcement** | `VALID_TRANSITIONS` & `VALID_APPOINTMENT_TRANSITIONS` | Rejects illegal transitions (e.g. `completed -> waiting`, `cancelled -> serving`) with `400/422`. |
| **Atomic Queue Sequencing** | `runTransaction` in `joinQueueAtomic` & `callNextAtomic` | Prevents duplicate token numbers and concurrent double-call race conditions across counters. |
| **CSV Formula Injection Prevention** | `escapeCsvCell()` in `src/server/apiRouter.js` | Escapes quotes and prefixes leading `=`, `+`, `-`, `@`, `\t`, `\r` cells with `'`. |
| **CORS Origin Allowlist** | `corsAllowlistMiddleware` in `src/server/securityMiddleware.js` | Rejects disallowed browser `Origin` headers with `403`. |
| **Sliding Window Rate Limiting** | `createRateLimiter` (120 req/min global API, 40 req/min writes) | Returns HTTP `429` with `Retry-After` and `X-RateLimit-*` headers. |
| **Payload Cap & Malformed JSON Handling** | `server.ts` (`express.json({ limit: '100kb' })`) | Returns HTTP `413` on oversized bodies and clean HTTP `400` JSON on malformed syntax. |
| **Security Response Headers** | `securityHeadersMiddleware` | Sets `X-Content-Type-Options: nosniff`, `Referrer-Policy`, `Permissions-Policy`, `X-DNS-Prefetch-Control`. |
| **Immutable Audit Trail** | `firestore.rules` (`auditLogs`: `allow update, delete: if false`) | Guarantees append-only institutional accountability; server logs audit events on every sensitive mutation. |

---

## 2. Known Architectural Caveats & Production Hardening Actions

1. **Sandbox Client-SDK Firestore Bridge**:
   - Because this AI Studio container lacks a GCP service account (`GOOGLE_APPLICATION_CREDENTIALS` / Cloud Run IAM ADC), `firebase-admin/firestore` returns `7 PERMISSION_DENIED` here. Consequently, `src/server/*` uses the Firebase JS Client SDK for Firestore reads/writes while using `firebase-admin/auth` for token verification.
   - To keep Express API routes working inside the sandbox, `firestore.rules` permits schema-validated unauthenticated writes on collections written by Express, while enforcing `isValidId()`, field types, `.size()` limits, enum values, `users` anti-self-escalation for signed-in users, `allow delete: if isAdmin()`, and immutable `auditLogs`.
   - **Action Before Production Launch**: Attach a service account / Cloud Run ADC, migrate `src/server/*` imports from `firebase/firestore` to `firebase-admin/firestore`, and update `firestore.rules` to deny unauthenticated client writes (`request.auth != null` / `false` on admin-only collections).

2. **External Gateway Credentials**:
   - SMS (`SPARROW_SMS_TOKEN` / `TWILIO_AUTH_TOKEN`), Email (`SENDGRID_API_KEY` / `SMTP_HOST`), and Web Push (`VAPID_*`) keys are intentionally absent from code. `/api/notifications/status` accurately surfaces `UNAVAILABLE` without simulating delivery.
