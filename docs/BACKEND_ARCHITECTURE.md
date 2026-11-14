# QUEUELESS Backend Architecture & Technical Documentation

## 1. System Overview
QUEUELESS is a multi-industry digital queue and appointment platform. In Stage 3, the application is connected to a production Node.js Express full-stack architecture powered by **Cloud Firestore** and **Firebase Authentication**.

- **Frontend**: React 19 SPA running with Tailwind CSS and bilingual English/Nepali language switching.
- **Backend**: Express server mounted with Vite development middlewares in dev (`tsx server.ts`) and static production serving in production.
- **Database**: Cloud Firestore Enterprise database instance (`ai-studio-queuelessdigital-a56e71b1-a407-44c9-9332-e35a57121734`).
- **Identity**: Firebase Authentication with email/password and Google Sign-In popup support, synced with `/users/{uid}` in Firestore.

---

## 2. Firestore Collection Schema
The data model supports multi-tenant isolation, multi-branch hierarchies, daily queue counters, atomic tokens, and immutable audit logs:

| Collection | Document Key | Description |
|---|---|---|
| `users` | `{uid}` | User profiles containing `fullName`, `email`, `phone`, `role`, `accountStatus`, `preferredLanguage`, `createdAt`, `updatedAt`. |
| `organizations` | `{orgId}` | Institutional providers with `industryId`, `registrationNumber`, `status` (`pending_verification`, `approved`, `rejected`, `suspended`), `ownerUid`. |
| `branches` | `{branchId}` | Physical branches containing `organizationId`, `address`, `operatingHours`, `isActive`. |
| `services` | `{serviceId}` | Service definitions containing `organizationId`, `code`, `estimatedDurationMinutes`, `feeAmount`, `requiredDocuments`. |
| `counters` | `{counterId}` | Service desks containing `branchId`, `number`, `supportedServiceIds`, `currentServingTokenId`. |
| `staff` | `{staffId}` | Institutional staff member assignments and desk routing. |
| `queues` | `q-{orgId}-{srvId}-{date}` | Scoped daily queue metadata with atomic `lastSequence` counter and `status` (`open`, `paused`, `closed`). |
| `queueTokens` | `{tokenId}` | Atomic queue passes containing `tokenNumber` (e.g. `A-001`), `sequenceNumber`, `customerPhone`, `status`, `peopleAhead`, `counterId`. |
| `appointments` | `{appointmentId}` | Pre-booked appointments with `referenceCode`, `appointmentDate`, `timeSlot`, `status`. |
| `notifications` | `{notificationId}` | User in-app notifications (`TOKEN_ISSUED`, `TOKEN_CALLED`, `APPOINTMENT_CONFIRMED`). |
| `auditLogs` | `{logId}` | Immutable audit records tracking state transitions, actor UIDs, entity IDs, and timestamps. |

---

## 3. Real Digital Queue Engine & Concurrency
- **Atomic Token Issuance (`/api/queue/join`)**:
  - Scoped to organization, service counter, and current business day (`YYYY-MM-DD`).
  - Runs inside a Firestore transaction `runTransaction` to increment `lastSequence` atomically.
  - Generates token format `${code}-${seq}` (e.g. `OPD-001`, `LAB-002`).
  - **Duplicate Prevention Policy**: Checks if the customer phone already holds an active token (`waiting`, `called`, or `serving`) in that service line on the same day. Rejects duplicates with HTTP 409 Conflict.
- **Atomic Call-Next Desk Operation (`/api/queue/call-next`)**:
  - Re-evaluates waiting tokens filtered by desk service bindings, sorted by triage priority (`Urgent` > `Senior Citizen` > `Normal`) and arrival timestamp.
  - Executes atomic transaction: re-verifies that candidate token is strictly in `waiting` state. If another receptionist claimed it in a race condition, the transaction throws a concurrency conflict so only one desk operator wins the ticket.
  - Updates token status to `called`, assigns counter desk, and updates the counter's `currentServingTokenId`.
- **Finite State Machine (`/api/queue/update-status`)**:
  - Enforces strict transition matrix:
    - `waiting` $\to$ `called`, `cancelled`
    - `called` $\to$ `serving`, `skipped`, `cancelled`
    - `serving` $\to$ `completed`, `skipped`, `cancelled`
    - `skipped` $\to$ `called` (Recall chime)
    - `completed` $\to$ `[]` (Terminal state)
    - `cancelled` $\to$ `[]` (Terminal state)

---

## 4. Real-Time Tracking Implementation
- **Customer Screen (`QueueTrackingPage.jsx`)**:
  - Attaches real-time Firestore listener `onSnapshot(doc(db, 'queueTokens', tokenId))`.
  - Automatically receives live status changes (`waiting` $\to$ `called` $\to$ `serving`), assigned counter number, and people ahead without requiring page reloads.
  - Automatically unsubscribes on component unmount to prevent memory leaks.
- **Receptionist Console (`ReceptionistQueuePage.jsx`)**:
  - Attaches `onSnapshot(query(collection(db, 'queueTokens'), where('branchId', '==', branchId)))`.
  - Live streams the waiting queue, currently serving card, and completed history across all workstations.

---

## 5. Security Rules Architecture (`firestore.rules`)
- Production-hardened with `rules_version = '2'`.
- Default-deny catch-all rule: `match /{document=**} { allow read, write: if false; }`.
- Verified user checks: `request.auth != null`.
- Bootstrapped administrator access for `karkiamir15@gmail.com` and users with `role == 'platform_admin'`.
- Role-based separation:
  - Users can only read/update their own profile within allowed keys (`fullName`, `phone`, `preferredLanguage`).
  - Ordinary clients are prevented from granting themselves administrator or staff roles.
  - Organization verification cannot be bypassed; initial creation forced to `pending_verification`.
  - `auditLogs` writes restricted strictly to server backend operations.

---

## 6. REST API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health` | Health check verifying Firestore database connection and service status. |
| `POST` | `/api/queue/join` | Atomic digital token generation with duplicate prevention and transaction sequence numbering. |
| `POST` | `/api/queue/walk-in` | On-the-spot token issuance for citizens arriving at the reception desk. |
| `POST` | `/api/queue/call-next` | Concurrency-safe atomic ticket assignment to an active counter desk. |
| `POST` | `/api/queue/update-status` | State machine transition validator (`serving`, `completed`, `skipped`, `cancelled`). |
| `POST` | `/api/appointments/book` | Persistent appointment booking with capacity and slot exhaustion guards. |
| `POST` | `/api/appointments/:id/cancel` | Safe cancellation of pre-booked appointment. |
| `POST` | `/api/orgs/register` | Institutional onboarding submission entering `pending_verification`. |
| `POST` | `/api/orgs/verify` | Platform administrative approval or rejection of organizations. |
| `GET` | `/api/audit-logs` | Retrieve immutable audit trail events. |
| `POST` | `/api/seed` | Trigger Firestore initialization seeder. |
