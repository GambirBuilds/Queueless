# QUEUELESS Production Deployment Guide

## 1. Architecture Overview

- **Frontend**: React 19 (JavaScript `.jsx`/`.js`), Tailwind CSS v4, Lucide icons, Vite (`dist/`).
- **Backend**: Node.js 22 + Express (`server.ts`, `src/server/*`) serving REST endpoints under `/api/*` and static `dist/` assets in `NODE_ENV=production`.
- **Database & Auth**: Cloud Firestore (`ai-studio-queuelessdigital-a56e71b1-a407-44c9-9332-e35a57121734`) & Firebase Authentication (Project `gen-lang-client-0101089604`).

---

## 2. Pre-Deployment Checklist (External Console Actions)

1. **Firebase Authentication Providers**:
   - In the Firebase Console (`Authentication -> Sign-in method`), enable **Email/Password** and **Google** providers.
   - Add your production custom domain(s) to **Authorized domains**.
   - Note: `karkiamir15@gmail.com` is the bootstrapped `platform_admin` account (requires `email_verified == true` claim from Firebase Auth, e.g. via Google Sign-In or verified email link).

2. **Firestore Security Rules & Composite Indexes**:
   - Deploy `/firestore.rules` (`npx firebase deploy --only firestore:rules` or AI Studio RPC `DeployRules`).
   - Deploy `/firestore.indexes.json` (`npx firebase deploy --only firestore:indexes`) so compound queries on `queueTokens`, `appointments`, `notifications`, and `auditLogs` execute without index errors.

3. **Production Server Admin SDK Cutover (Cloud Run / Self-Hosted Node)**:
   - In the AI Studio container sandbox without Application Default Credentials (ADC), `src/server/queueEngine.js` and `src/server/apiRouter.js` operate over the Firestore JS Client SDK while `src/server/authMiddleware.js` validates Firebase ID tokens cryptographically via `firebase-admin/auth`.
   - Before deploying to production on Cloud Run (with an IAM service account attached) or a server with `GOOGLE_APPLICATION_CREDENTIALS`, switch Firestore calls in `src/server/*` to `getFirestore(adminApp)` from `firebase-admin/firestore` and tighten `firestore.rules` writes on server-owned collections (`queues`, `auditLogs`, `organizations`, `users` role fields) to `if false;` so all mutations are 100% server-authoritative.

4. **External Notification Gateways (Optional)**:
   - In-app notifications are persistently stored in Cloud Firestore out of the box.
   - To activate external SMS, Email, or Web Push delivery, provide environment secrets:
     - SMS: `SPARROW_SMS_TOKEN` or `TWILIO_AUTH_TOKEN`
     - Email: `SENDGRID_API_KEY` or `SMTP_HOST`
     - Web Push: `VAPID_PUBLIC_KEY` and `VAPID_PRIVATE_KEY`
   - Never commit secrets to git; inject via Cloud Run Secrets / AI Studio Secrets panel.

5. **CORS Allowlist**:
   - Set `ALLOWED_ORIGINS="https://your-production-domain.com"` in the runtime environment.

---

## 3. Build & Start Commands

```bash
npm ci
npm test
npm run build
NODE_ENV=production PORT=3000 npm start
```

Verify server readiness:
```bash
curl -s http://localhost:3000/api/health
```
Expected response: HTTP 200 `{ "status": "healthy", ... }`.
