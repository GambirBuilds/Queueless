# QUEUELESS — Digital Queue & Appointment Management Platform

QUEUELESS is a multi-tenant digital queue and appointment management platform built with React (JavaScript), Express, Firebase Authentication, and Cloud Firestore. It enables citizens and customers to discover organizations, check required documents, join live digital queues, track tokens in real time, and book scheduled appointments across Healthcare, Banking, Government, Retail, Automotive, Education, and custom service sectors, with a bilingual English and Nepali (`नेपाली`) interface.

## Core Capabilities

- **Public Service Discovery & Bilingual Interface**: Filterable directory across 7 industry sectors, branch operating hours, service fees, required documents checklist, and real-time lobby display boards (PII-stripped).
- **Customer Portal**: Registration/login/password reset/Google sign-in via Firebase Authentication, active token tracking, token cancellation, upcoming appointments with rescheduling and cancellation, and persistent in-app Notification Center.
- **Organization Portal**: Multi-branch configuration, custom service catalog definitions, counter desk management, staff roster assignments, live receptionist queue desk console (call next, recall, serve, complete, hold/skip, cancel, walk-in issuance, open/pause/close queue), appointment management, customer visit history, and CSV/printable reports.
- **Platform Administrator Console (11 Modules)**:
  1. Platform Overview (live database-backed counts)
  2. Organization Management (approve, suspend, reinstate)
  3. Organization Verification (review applicant details, registration docs, audit decisions)
  4. User Management (search, suspend/activate, assign RBAC roles & tenant bindings)
  5. Branch Overview (cross-tenant waiting/serving/completed load)
  6. Queue Monitoring (live token inspector & daily queue states)
  7. Appointment Monitoring (cross-tenant booking & check-in filter)
  8. Platform Activity (live administrative/system action feed)
  9. Audit Logs (immutable audit trail across queue & admin actions)
  10. Reports & Analytics (zero-fabricated real duration metrics & CSV export)
  11. Platform Settings (locale, timezone, maintenance toggle, real gateway status)

## Supported Roles (RBAC)

1. `customer`
2. `organization_owner`
3. `branch_manager`
4. `receptionist`
5. `service_staff`
6. `platform_admin`

## Quick Start & Development Information

```bash
npm install
npm test
npm run dev
```

Once started, open the application in your browser at the local development URL:

- **Local Development URL**: `http://localhost:3000`
- **Bind Host & Port**: `0.0.0.0:3000` (configured in both Express `server.ts` and `vite.config.ts`)
- **API Health Check**: `http://localhost:3000/api/health`
- **Runtime Mode**: Express HTTP server (`0.0.0.0:3000`) serving `/api/*` endpoints with integrated Vite development middleware for the React frontend.

## Scripts

- `npm run dev` — Start Express + Vite development server on `http://localhost:3000` (`0.0.0.0:3000`) (`tsx server.ts`)
- `npm run build` — Build production client bundle (`vite build`)
- `npm start` — Run production Express server on port `3000` (`node server.ts`)
- `npm test` — Run automated backend, state machine, RBAC, security middleware, and bilingual parity tests (`node tests/runTests.js`)
- `npm run lint` — Run static check (`tsc --noEmit`)

## Environment Variables

Copy `.env.example` and configure required variables for your target environment:
- `PORT`, `NODE_ENV`, `APP_URL`, `ALLOWED_ORIGINS`
- Optional external notification credentials: `SPARROW_SMS_TOKEN`, `TWILIO_AUTH_TOKEN`, `SENDGRID_API_KEY`, `SMTP_HOST`, `VAPID_PUBLIC_KEY`, `VAPID_PRIVATE_KEY`
- Production GCP credential path (when running outside Cloud Run ADC): `GOOGLE_APPLICATION_CREDENTIALS`

See `docs/DEPLOYMENT_GUIDE.md` and `docs/SECURITY_AUDIT.md` for production hardening steps.
"# Queueless" 
