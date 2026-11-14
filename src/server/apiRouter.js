import express from 'express';
import {
  joinQueueSchema,
  callNextSchema,
  updateTokenStatusSchema,
  toggleQueueStatusSchema,
  walkInSchema,
  bookAppointmentSchema,
  rescheduleAppointmentSchema,
  updateAppointmentStatusSchema,
  registerOrgSchema,
  updateOrgStatusSchema,
  updateUserAdminSchema,
  createBranchSchema,
  createServiceSchema,
  createCounterSchema,
  toggleCounterStatusSchema,
  createStaffSchema,
  updateOrgProfileSchema,
  updateOrgSettingsSchema
} from './validators.js';
import {
  joinQueueAtomic,
  callNextAtomic,
  transitionTokenStatus,
  toggleQueueStatusAtomic,
  bookAppointmentAtomic,
  recallTokenAtomic,
  rescheduleAppointmentAtomic,
  updateAppointmentStatusAtomic,
  getPlatformOverviewStats,
  getComprehensiveReports,
  getBusinessDateInTimezone,
  mergeServiceQueueStatuses
} from './queueEngine.js';
import {
  requireAuth,
  optionalAuth,
  requireRole,
  hasOrgBranchScope
} from './authMiddleware.js';
import { createRateLimiter } from './securityMiddleware.js';
import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  query,
  where,
  orderBy,
  limit,
  addDoc
} from 'firebase/firestore';
import { db } from '../firebase/config.js';
import { ensureDatabaseSeeded } from '../firebase/seedData.js';

export const apiRouter = express.Router();

// Stricter rate limiter for mutating / sensitive write endpoints
const writeRateLimiter = createRateLimiter({
  windowMs: 60_000,
  maxRequests: 40,
  keyPrefix: 'api-write'
});

// Platform Settings & Provider Gateway Status
let platformSettingsState = {
  platformName: 'QUEUELESS Digital Operations',
  defaultLanguage: 'en',
  primaryTimezone: 'Asia/Kathmandu',
  maintenanceMode: false,
  maxDailyTokensPerBranch: 500
};

function getGatewayStatusSnapshot() {
  const hasSms = Boolean(process.env.SPARROW_SMS_TOKEN || process.env.TWILIO_AUTH_TOKEN);
  const hasEmail = Boolean(process.env.SENDGRID_API_KEY || process.env.SMTP_HOST);
  const hasVapid = Boolean(process.env.VAPID_PUBLIC_KEY && process.env.VAPID_PRIVATE_KEY);

  return {
    inApp: {
      name: 'In-App Notification Center',
      configured: true,
      status: 'ACTIVE (Cloud Firestore Persistent)'
    },
    sms: {
      provider: 'Sparrow SMS / Twilio Gateway',
      configured: hasSms,
      status: hasSms ? 'ACTIVE (Configured via Environment)' : 'UNAVAILABLE (SMS credentials not configured in environment)',
      fallback: 'In-App Notifications Active'
    },
    email: {
      provider: 'Transactional SMTP / SendGrid',
      configured: hasEmail,
      status: hasEmail ? 'ACTIVE (Configured via Environment)' : 'UNAVAILABLE (Email credentials not configured in environment)',
      fallback: 'In-App Notifications Active'
    },
    push: {
      provider: 'Web Push (VAPID)',
      configured: hasVapid,
      status: hasVapid ? 'ACTIVE (VAPID keys configured)' : 'UNAVAILABLE (VAPID keys not configured in environment)',
      fallback: 'In-App Web Alerts Active'
    }
  };
}

function escapeCsvCell(value) {
  const str = String(value ?? '').replace(/"/g, '""');
  // Prevent CSV formula injection in spreadsheet tools
  const safe = /^[=+\-@\t\r]/.test(str) ? `'${str}` : str;
  return `"${safe}"`;
}

// Middleware: ensure database is seeded with initial institutions on first API hit
apiRouter.use(async (req, res, next) => {
  try {
    await ensureDatabaseSeeded();
  } catch (err) {
    console.warn('[Seed Check Warning]', err.message);
  }
  next();
});

// ============================================================================
// PUBLIC ENDPOINTS (Discovery, Health, Notification Capability, Lobby Kiosk)
// ============================================================================

apiRouter.get('/health', (req, res) => {
  res.json({
    status: 'healthy',
    timestamp: new Date().toISOString(),
    service: 'QUEUELESS Real Backend Engine',
    version: '4.0.0-PROD',
    database: 'Cloud Firestore'
  });
});

apiRouter.get('/notifications/status', (req, res) => {
  res.json({
    success: true,
    data: getGatewayStatusSnapshot()
  });
});

apiRouter.get('/public/organizations', async (req, res, next) => {
  try {
    const [orgsSnap, branchesSnap, servicesSnap, countersSnap, queuesSnap] = await Promise.all([
      getDocs(collection(db, 'organizations')),
      getDocs(collection(db, 'branches')),
      getDocs(collection(db, 'services')),
      getDocs(collection(db, 'counters')),
      getDocs(collection(db, 'queues'))
    ]);

    const approvedOrgs = orgsSnap.docs
      .map(d => ({ id: d.id, ...d.data() }))
      .filter(o => o.status === 'approved' || o.isDemo);

    const branches = branchesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const services = servicesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const counters = countersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const queues = queuesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    const result = approvedOrgs.map(org => {
      const tz = org.timezone || 'Asia/Kathmandu';
      const today = getBusinessDateInTimezone(tz);
      return {
        id: org.id,
        name: org.name,
        industryId: org.industryId,
        industryName: org.industryName,
        city: org.city,
        province: org.province,
        address: org.address,
        phone: org.phone,
        timezone: tz,
        description: org.description,
        status: org.status,
        isDemo: Boolean(org.isDemo),
        branches: branches.filter(b => b.organizationId === org.id).map(b => ({
          ...b,
          counters: counters.filter(c => c.branchId === b.id)
        })),
        services: mergeServiceQueueStatuses(services, queues, org.id, today)
      };
    });

    res.json({ success: true, data: result });
  } catch (err) {
    next(err);
  }
});

// Public Lobby Kiosk Display Feed (Strips customer PII — never exposes phone/email/notes)
apiRouter.get('/public/display/:branchId', async (req, res, next) => {
  try {
    const { branchId } = req.params;
    const tokensRef = collection(db, 'queueTokens');
    const q = query(tokensRef, where('branchId', '==', branchId));
    const snap = await getDocs(q);

    const safeTokens = snap.docs
      .map(d => d.data())
      .filter(t => ['waiting', 'called', 'serving'].includes(String(t.status).toLowerCase()))
      .map(t => ({
        id: t.id,
        tokenNumber: t.tokenNumber,
        status: t.status,
        counterName: t.counterName || '',
        serviceName: t.serviceName || '',
        priority: t.priority || 'Normal',
        issuedAt: t.issuedAt,
        calledAt: t.calledAt || null,
        servingAt: t.servingAt || null
      }))
      .sort((a, b) => new Date(a.issuedAt || 0) - new Date(b.issuedAt || 0));

    res.json({ success: true, data: safeTokens });
  } catch (err) {
    next(err);
  }
});

// ============================================================================
// QUEUE ENGINE ENDPOINTS (Authenticated & RBAC Enforced)
// ============================================================================

// 1. Join Queue (Atomic Token Issuance - Authenticated Citizen)
apiRouter.post('/queue/join', writeRateLimiter, requireAuth, async (req, res) => {
  try {
    if (platformSettingsState.maintenanceMode && req.user.role !== 'platform_admin') {
      return res.status(503).json({
        success: false,
        error: 'Platform is temporarily in maintenance mode. New queue joins are paused.'
      });
    }

    const validated = joinQueueSchema.parse(req.body);
    const token = await joinQueueAtomic({
      ...validated,
      customerUid: req.user.uid // Server-authoritative UID binding
    });
    res.status(201).json({
      success: true,
      data: token,
      message: `Token ${token.tokenNumber} successfully issued.`
    });
  } catch (err) {
    const isConflict = err.message && err.message.includes('already holds an active token');
    const isValidation = err.errors != null;
    res.status(isConflict ? 409 : isValidation ? 400 : 422).json({
      success: false,
      error: isValidation ? err.errors.map(e => e.message).join(', ') : err.message
    });
  }
});

// 2. Register Walk-in Customer (Desk Operator / Branch Staff Only)
apiRouter.post(
  '/queue/walk-in',
  writeRateLimiter,
  requireAuth,
  requireRole('receptionist', 'service_staff', 'branch_manager', 'organization_owner', 'platform_admin'),
  async (req, res) => {
    try {
      const validated = walkInSchema.parse(req.body);
      if (!hasOrgBranchScope(req.user, validated.organizationId, validated.branchId)) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: You do not have operator permissions for this organization or branch.'
        });
      }

      const token = await joinQueueAtomic({
        ...validated,
        customerUid: 'walkin_guest',
        isWalkIn: true
      });
      res.status(201).json({
        success: true,
        data: token,
        message: `Walk-in citizen registered: Token ${token.tokenNumber} issued.`
      });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }
);

// 3. Call Next Customer (Atomic Lock & Assignment - Staff Only)
apiRouter.post(
  '/queue/call-next',
  writeRateLimiter,
  requireAuth,
  requireRole('receptionist', 'service_staff', 'branch_manager', 'organization_owner', 'platform_admin'),
  async (req, res) => {
    try {
      const validated = callNextSchema.parse(req.body);
      if (!hasOrgBranchScope(req.user, validated.organizationId, validated.branchId)) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Cross-organization or cross-branch queue calling is prohibited.'
        });
      }

      const assignedToken = await callNextAtomic({
        ...validated,
        staffUid: req.user.uid
      });
      res.json({
        success: true,
        data: assignedToken,
        message: `Token ${assignedToken.tokenNumber} called to desk.`
      });
    } catch (err) {
      const isConflict = err.message && err.message.includes('Conflict:');
      const isForbidden = err.message && err.message.includes('Forbidden:');
      res.status(isForbidden ? 403 : isConflict ? 409 : 400).json({
        success: false,
        error: err.message
      });
    }
  }
);

// 4. Recall Token (Atomic Operator Re-Announcement - Staff Only)
apiRouter.post(
  '/queue/recall',
  writeRateLimiter,
  requireAuth,
  requireRole('receptionist', 'service_staff', 'branch_manager', 'organization_owner', 'platform_admin'),
  async (req, res) => {
    try {
      const { tokenId, counterId } = req.body;
      if (!tokenId) {
        return res.status(400).json({ success: false, error: 'tokenId is required' });
      }
      const tokenSnap = await getDoc(doc(db, 'queueTokens', tokenId));
      if (!tokenSnap.exists()) {
        return res.status(404).json({ success: false, error: 'Queue token not found.' });
      }
      const tData = tokenSnap.data();
      if (!hasOrgBranchScope(req.user, tData.organizationId, tData.branchId)) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Cannot recall token belonging to another organization or branch.'
        });
      }

      const recalled = await recallTokenAtomic({
        tokenId,
        counterId,
        staffUid: req.user.uid
      });
      res.json({
        success: true,
        data: recalled,
        message: `Token ${recalled.tokenNumber} recalled to counter.`
      });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }
);

// 5. Update Token Status (State Machine Guard + Owner/Staff Scope Check)
apiRouter.post('/queue/update-status', writeRateLimiter, requireAuth, async (req, res) => {
  try {
    const validated = updateTokenStatusSchema.parse(req.body);
    const tokenSnap = await getDoc(doc(db, 'queueTokens', validated.tokenId));
    if (!tokenSnap.exists()) {
      return res.status(404).json({ success: false, error: 'Queue token not found.' });
    }
    const tokenData = tokenSnap.data();

    if (req.user.role === 'customer') {
      if (validated.status !== 'cancelled' || tokenData.customerUid !== req.user.uid) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Customers can only cancel their own active queue tokens.'
        });
      }
    } else if (!hasOrgBranchScope(req.user, tokenData.organizationId, tokenData.branchId)) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: Cross-organization or cross-branch token modification is prohibited.'
      });
    }

    const updated = await transitionTokenStatus({
      ...validated,
      staffUid: req.user.uid
    });
    res.json({
      success: true,
      data: updated,
      message: `Token status transitioned to ${updated.status}.`
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 6. Toggle Queue Status (Open / Pause / Close - Staff Only)
apiRouter.post(
  '/queue/toggle-status',
  writeRateLimiter,
  requireAuth,
  requireRole('receptionist', 'service_staff', 'branch_manager', 'organization_owner', 'platform_admin'),
  async (req, res) => {
    try {
      const validated = toggleQueueStatusSchema.parse(req.body);
      if (!hasOrgBranchScope(req.user, validated.organizationId, validated.branchId)) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Cross-organization or cross-branch queue status change denied.'
        });
      }

      const result = await toggleQueueStatusAtomic({
        ...validated,
        actorUid: req.user.uid
      });
      res.json({
        success: true,
        data: result,
        message: `Queue status updated to ${validated.status}.`
      });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }
);

// ============================================================================
// APPOINTMENT ENDPOINTS (Authenticated & Ownership/Scope Enforced)
// ============================================================================

// 7. Book Persistent Appointment
apiRouter.post('/appointments/book', writeRateLimiter, requireAuth, async (req, res) => {
  try {
    const validated = bookAppointmentSchema.parse(req.body);
    const appointment = await bookAppointmentAtomic({
      ...validated,
      customerId: req.user.uid // Server-authoritative owner binding
    });
    res.status(201).json({
      success: true,
      data: appointment,
      message: `Appointment ${appointment.referenceCode} confirmed.`
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 8. Cancel Appointment (Owner or Scoped Staff)
apiRouter.post('/appointments/:id/cancel', writeRateLimiter, requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const aptSnap = await getDoc(doc(db, 'appointments', id));
    if (!aptSnap.exists()) {
      return res.status(404).json({ success: false, error: 'Appointment not found' });
    }
    const aptData = aptSnap.data();
    const isOwner = aptData.customerId === req.user.uid;
    const isScopedStaff = hasOrgBranchScope(req.user, aptData.organizationId, aptData.branchId);

    if (!isOwner && !isScopedStaff) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You cannot cancel another user or organization appointment.'
      });
    }

    await updateAppointmentStatusAtomic({
      appointmentId: id,
      status: 'cancelled',
      actorUid: req.user.uid
    });

    res.json({ success: true, message: 'Appointment cancelled.' });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 9. Reschedule Appointment (Owner or Scoped Staff)
apiRouter.post('/appointments/:id/reschedule', writeRateLimiter, requireAuth, async (req, res) => {
  try {
    const { id } = req.params;
    const validated = rescheduleAppointmentSchema.parse(req.body);

    const aptSnap = await getDoc(doc(db, 'appointments', id));
    if (!aptSnap.exists()) {
      return res.status(404).json({ success: false, error: 'Appointment not found.' });
    }
    const aptData = aptSnap.data();
    const isOwner = aptData.customerId === req.user.uid;
    const isScopedStaff = hasOrgBranchScope(req.user, aptData.organizationId, aptData.branchId);

    if (!isOwner && !isScopedStaff) {
      return res.status(403).json({
        success: false,
        error: 'Forbidden: You cannot reschedule another user or organization appointment.'
      });
    }

    const updated = await rescheduleAppointmentAtomic({
      appointmentId: id,
      appointmentDate: validated.appointmentDate,
      timeSlot: validated.timeSlot,
      actorUid: req.user.uid
    });
    res.json({
      success: true,
      data: updated,
      message: `Appointment rescheduled to ${validated.appointmentDate} at ${validated.timeSlot}.`
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 10. Staff Update Appointment Status (Check-in / Complete / Reject)
apiRouter.post(
  '/appointments/:id/status',
  writeRateLimiter,
  requireAuth,
  requireRole('receptionist', 'service_staff', 'branch_manager', 'organization_owner', 'platform_admin'),
  async (req, res) => {
    try {
      const { id } = req.params;
      const validated = updateAppointmentStatusSchema.parse(req.body);
      const aptSnap = await getDoc(doc(db, 'appointments', id));
      if (!aptSnap.exists()) {
        return res.status(404).json({ success: false, error: 'Appointment not found.' });
      }
      const aptData = aptSnap.data();
      if (!hasOrgBranchScope(req.user, aptData.organizationId, aptData.branchId)) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Cross-organization appointment modification denied.'
        });
      }

      const updated = await updateAppointmentStatusAtomic({
        appointmentId: id,
        status: validated.status,
        notes: validated.notes,
        actorUid: req.user.uid
      });
      res.json({
        success: true,
        data: updated,
        message: `Appointment status updated to ${validated.status}.`
      });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }
);

// ============================================================================
// ORGANIZATION ONBOARDING & VERIFICATION
// ============================================================================

// 11. Organization Registration
apiRouter.post('/orgs/register', writeRateLimiter, optionalAuth, async (req, res) => {
  try {
    const validated = registerOrgSchema.parse(req.body);
    const now = new Date().toISOString();
    const orgDocRef = doc(collection(db, 'organizations'));

    const orgRecord = {
      id: orgDocRef.id,
      ...validated,
      ownerUid: req.user?.uid || validated.ownerUid || 'applicant_pending',
      status: 'pending_verification', // Always enforced server-side
      verifiedAt: null,
      verifiedBy: null,
      createdAt: now,
      updatedAt: now
    };

    await setDoc(orgDocRef, orgRecord);

    await addDoc(collection(db, 'auditLogs'), {
      organizationId: orgDocRef.id,
      actorUid: req.user?.uid || 'anonymous_applicant',
      actorEmail: req.user?.email || validated.ownerEmail,
      action: 'ORG_REGISTRATION_SUBMITTED',
      entityType: 'Organization',
      entityId: orgDocRef.id,
      details: `Submitted registration for ${validated.name} (${validated.industryId})`,
      timestamp: now
    });

    res.status(201).json({
      success: true,
      data: orgRecord,
      message: 'Organization application submitted for administrative verification.'
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});

// 12. Admin Verify / Status Update for Organization (Platform Admin Only)
apiRouter.post(
  '/orgs/verify',
  writeRateLimiter,
  requireAuth,
  requireRole('platform_admin'),
  async (req, res) => {
    try {
      const { organizationId, status, reason } = updateOrgStatusSchema.parse(req.body);
      const orgRef = doc(db, 'organizations', organizationId);
      const orgSnap = await getDoc(orgRef);

      if (!orgSnap.exists()) {
        return res.status(404).json({ success: false, error: 'Organization not found' });
      }

      const previousStatus = orgSnap.data().status || 'pending_verification';
      const now = new Date().toISOString();

      await updateDoc(orgRef, {
        status,
        verificationRemarks: reason || '',
        verifiedAt: status === 'approved' ? now : orgSnap.data().verifiedAt || null,
        verifiedBy: req.user.uid,
        updatedAt: now
      });

      await addDoc(collection(db, 'auditLogs'), {
        organizationId,
        actorUid: req.user.uid,
        actorEmail: req.user.email,
        actorRole: req.user.role,
        action: `ORG_${status.toUpperCase()}`,
        entityType: 'Organization',
        entityId: organizationId,
        previousStatus,
        newStatus: status,
        reason: reason || 'Administrative verification update',
        details: `Platform admin updated ${orgSnap.data().name} from ${previousStatus} to ${status}${reason ? ` — Reason: ${reason}` : ''}`,
        timestamp: now
      });

      res.json({
        success: true,
        message: `Organization status updated to ${status}.`
      });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }
);

// ============================================================================
// TENANT-SCOPED ORGANIZATION CONFIGURATION ENDPOINTS
// ============================================================================

apiRouter.post(
  '/org/:orgId/branches',
  writeRateLimiter,
  requireAuth,
  requireRole('organization_owner', 'branch_manager', 'platform_admin'),
  async (req, res) => {
    try {
      const { orgId } = req.params;
      if (!hasOrgBranchScope(req.user, orgId)) {
        return res.status(403).json({ success: false, error: 'Forbidden: Cross-organization branch creation denied.' });
      }
      const validated = createBranchSchema.parse(req.body);
      const now = new Date().toISOString();
      const branchRef = doc(collection(db, 'branches'));
      const branchRecord = {
        id: branchRef.id,
        organizationId: orgId,
        ...validated,
        counters: [],
        serviceIds: [],
        createdAt: now,
        updatedAt: now
      };
      await setDoc(branchRef, branchRecord);
      await addDoc(collection(db, 'auditLogs'), {
        organizationId: orgId,
        actorUid: req.user.uid,
        actorEmail: req.user.email,
        action: 'BRANCH_CREATED',
        entityType: 'Branch',
        entityId: branchRef.id,
        details: `Created branch ${validated.name}`,
        timestamp: now
      });
      res.status(201).json({ success: true, data: branchRecord });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }
);

apiRouter.post(
  '/org/:orgId/services',
  writeRateLimiter,
  requireAuth,
  requireRole('organization_owner', 'branch_manager', 'platform_admin'),
  async (req, res) => {
    try {
      const { orgId } = req.params;
      if (!hasOrgBranchScope(req.user, orgId)) {
        return res.status(403).json({ success: false, error: 'Forbidden: Cross-organization service creation denied.' });
      }
      const validated = createServiceSchema.parse(req.body);
      const now = new Date().toISOString();
      const srvRef = doc(collection(db, 'services'));
      const serviceRecord = {
        id: srvRef.id,
        organizationId: orgId,
        ...validated,
        code: validated.code.toUpperCase(),
        isActive: true,
        createdAt: now,
        updatedAt: now
      };
      await setDoc(srvRef, serviceRecord);
      await addDoc(collection(db, 'auditLogs'), {
        organizationId: orgId,
        actorUid: req.user.uid,
        actorEmail: req.user.email,
        action: 'SERVICE_CREATED',
        entityType: 'Service',
        entityId: srvRef.id,
        details: `Created service ${serviceRecord.name} (${serviceRecord.code})`,
        timestamp: now
      });
      res.status(201).json({ success: true, data: serviceRecord });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }
);

apiRouter.post(
  '/org/:orgId/counters',
  writeRateLimiter,
  requireAuth,
  requireRole('organization_owner', 'branch_manager', 'platform_admin'),
  async (req, res) => {
    try {
      const { orgId } = req.params;
      const validated = createCounterSchema.parse(req.body);
      if (!hasOrgBranchScope(req.user, orgId, validated.branchId)) {
        return res.status(403).json({ success: false, error: 'Forbidden: Cross-organization or cross-branch counter creation denied.' });
      }
      const now = new Date().toISOString();
      const counterRef = doc(collection(db, 'counters'));
      const counterRecord = {
        id: counterRef.id,
        organizationId: orgId,
        ...validated,
        status: 'Active',
        currentServingTokenId: null,
        createdAt: now,
        updatedAt: now
      };
      await setDoc(counterRef, counterRecord);
      await addDoc(collection(db, 'auditLogs'), {
        organizationId: orgId,
        actorUid: req.user.uid,
        actorEmail: req.user.email,
        action: 'COUNTER_CREATED',
        entityType: 'Counter',
        entityId: counterRef.id,
        details: `Created desk #${validated.number} (${validated.name}) in branch ${validated.branchId}`,
        timestamp: now
      });
      res.status(201).json({ success: true, data: counterRecord });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }
);

apiRouter.post(
  '/org/:orgId/counters/:counterId/toggle',
  writeRateLimiter,
  requireAuth,
  requireRole('organization_owner', 'branch_manager', 'receptionist', 'platform_admin'),
  async (req, res) => {
    try {
      const { orgId, counterId } = req.params;
      const { status } = toggleCounterStatusSchema.parse(req.body);
      const counterRef = doc(db, 'counters', counterId);
      const snap = await getDoc(counterRef);
      if (!snap.exists()) {
        return res.status(404).json({ success: false, error: 'Counter not found.' });
      }
      const cData = snap.data();
      if (!hasOrgBranchScope(req.user, cData.organizationId || orgId, cData.branchId)) {
        return res.status(403).json({ success: false, error: 'Forbidden: Cross-organization counter access denied.' });
      }
      const now = new Date().toISOString();
      await updateDoc(counterRef, { status, updatedAt: now });
      await addDoc(collection(db, 'auditLogs'), {
        organizationId: cData.organizationId || orgId,
        actorUid: req.user.uid,
        actorEmail: req.user.email,
        action: 'COUNTER_STATUS_UPDATED',
        entityType: 'Counter',
        entityId: counterId,
        details: `Set desk #${cData.number} status to ${status}`,
        timestamp: now
      });
      res.json({ success: true, data: { ...cData, id: counterId, status } });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }
);

apiRouter.get(
  '/org/:orgId/staff',
  requireAuth,
  requireRole('organization_owner', 'branch_manager', 'platform_admin'),
  async (req, res, next) => {
    try {
      const { orgId } = req.params;
      if (!hasOrgBranchScope(req.user, orgId)) {
        return res.status(403).json({ success: false, error: 'Forbidden: Cross-organization staff directory denied.' });
      }
      const snap = await getDocs(query(collection(db, 'staff'), where('organizationId', '==', orgId)));
      res.json({ success: true, data: snap.docs.map(d => ({ id: d.id, ...d.data() })) });
    } catch (err) {
      next(err);
    }
  }
);

apiRouter.post(
  '/org/:orgId/staff',
  writeRateLimiter,
  requireAuth,
  requireRole('organization_owner', 'branch_manager', 'platform_admin'),
  async (req, res) => {
    try {
      const { orgId } = req.params;
      const validated = createStaffSchema.parse(req.body);
      if (!hasOrgBranchScope(req.user, orgId, validated.branchId || null)) {
        return res.status(403).json({ success: false, error: 'Forbidden: Cross-organization staff creation denied.' });
      }
      const now = new Date().toISOString();
      const staffRef = doc(collection(db, 'staff'));
      const staffRecord = {
        id: staffRef.id,
        organizationId: orgId,
        ...validated,
        status: 'Active',
        createdAt: now,
        updatedAt: now
      };
      await setDoc(staffRef, staffRecord);
      await addDoc(collection(db, 'auditLogs'), {
        organizationId: orgId,
        actorUid: req.user.uid,
        actorEmail: req.user.email,
        action: 'STAFF_ADDED',
        entityType: 'Staff',
        entityId: staffRef.id,
        details: `Added staff member ${validated.name} (${validated.role})`,
        timestamp: now
      });
      res.status(201).json({ success: true, data: staffRecord });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }
);

apiRouter.patch(
  '/org/:orgId/profile',
  writeRateLimiter,
  requireAuth,
  requireRole('organization_owner', 'platform_admin'),
  async (req, res) => {
    try {
      const { orgId } = req.params;
      if (!hasOrgBranchScope(req.user, orgId)) {
        return res.status(403).json({ success: false, error: 'Forbidden: Cross-organization profile update denied.' });
      }
      const validated = updateOrgProfileSchema.parse(req.body);
      const orgRef = doc(db, 'organizations', orgId);
      const snap = await getDoc(orgRef);
      if (!snap.exists()) {
        return res.status(404).json({ success: false, error: 'Organization not found.' });
      }
      const now = new Date().toISOString();
      await updateDoc(orgRef, {
        name: validated.name,
        tagline: validated.tagline,
        email: validated.email,
        phone: validated.phone,
        website: validated.website,
        description: validated.description,
        updatedAt: now
      });
      await addDoc(collection(db, 'auditLogs'), {
        organizationId: orgId,
        actorUid: req.user.uid,
        actorEmail: req.user.email,
        action: 'ORG_PROFILE_UPDATED',
        entityType: 'Organization',
        entityId: orgId,
        details: `Updated institutional profile for ${validated.name}`,
        timestamp: now
      });
      res.json({ success: true, data: { ...snap.data(), ...validated, updatedAt: now } });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }
);

apiRouter.patch(
  '/org/:orgId/settings',
  writeRateLimiter,
  requireAuth,
  requireRole('organization_owner', 'branch_manager', 'platform_admin'),
  async (req, res) => {
    try {
      const { orgId } = req.params;
      if (!hasOrgBranchScope(req.user, orgId)) {
        return res.status(403).json({ success: false, error: 'Forbidden: Cross-organization settings update denied.' });
      }
      const validated = updateOrgSettingsSchema.parse(req.body);
      const orgRef = doc(db, 'organizations', orgId);
      const snap = await getDoc(orgRef);
      if (!snap.exists()) {
        return res.status(404).json({ success: false, error: 'Organization not found.' });
      }
      const now = new Date().toISOString();
      await updateDoc(orgRef, {
        operationalSettings: validated,
        updatedAt: now
      });
      await addDoc(collection(db, 'auditLogs'), {
        organizationId: orgId,
        actorUid: req.user.uid,
        actorEmail: req.user.email,
        action: 'ORG_SETTINGS_UPDATED',
        entityType: 'Organization',
        entityId: orgId,
        details: `Updated operational cadence (buffer=${validated.turnoverBufferMinutes}m, maxAdvance=${validated.maxAdvanceDays}d)`,
        timestamp: now
      });
      res.json({ success: true, data: validated });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }
);

// ============================================================================
// AUDIT LOGS, REPORTS & PLATFORM ADMINISTRATION (RBAC Strictly Enforced)
// ============================================================================

// 13. Fetch Audit Logs (Admin sees all; Org Owner/Branch Manager scoped to own org)
apiRouter.get(
  '/audit-logs',
  requireAuth,
  requireRole('platform_admin', 'organization_owner', 'branch_manager'),
  async (req, res, next) => {
    try {
      const { orgId, limitCount = 50, page = 1 } = req.query;
      const safeLimit = Math.min(Math.max(Number(limitCount) || 50, 1), 250);
      const safePage = Math.max(Number(page) || 1, 1);

      const effectiveOrgId =
        req.user.role === 'platform_admin'
          ? orgId || null
          : req.user.organizationId || '__none__';

      if (req.user.role !== 'platform_admin' && orgId && orgId !== req.user.organizationId) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Cross-organization audit log access is denied.'
        });
      }

      const logsRef = collection(db, 'auditLogs');
      const q = effectiveOrgId
        ? query(logsRef, where('organizationId', '==', effectiveOrgId), orderBy('timestamp', 'desc'), limit(safeLimit * safePage))
        : query(logsRef, orderBy('timestamp', 'desc'), limit(safeLimit * safePage));

      const snap = await getDocs(q);
      const allLogs = snap.docs.map(d => ({ id: d.id, ...d.data() }));
      const offset = (safePage - 1) * safeLimit;

      res.json({
        success: true,
        data: allLogs.slice(offset, offset + safeLimit),
        pagination: {
          page: safePage,
          limit: safeLimit,
          returned: allLogs.slice(offset, offset + safeLimit).length
        }
      });
    } catch (err) {
      next(err);
    }
  }
);

// 14. Database Seed Trigger (Platform Admin Only)
apiRouter.post('/seed', writeRateLimiter, requireAuth, requireRole('platform_admin'), async (req, res, next) => {
  try {
    await ensureDatabaseSeeded();
    res.json({ success: true, message: 'Database verified / seeded.' });
  } catch (err) {
    next(err);
  }
});

// 15. Platform Overview Statistics (Platform Admin Only)
apiRouter.get('/admin/overview-stats', requireAuth, requireRole('platform_admin'), async (req, res, next) => {
  try {
    const stats = await getPlatformOverviewStats();
    res.json({ success: true, data: stats });
  } catch (err) {
    next(err);
  }
});

// 16. Admin Organizations Registry (Platform Admin Only)
apiRouter.get('/admin/organizations', requireAuth, requireRole('platform_admin'), async (req, res, next) => {
  try {
    const [orgsSnap, branchesSnap, tokensSnap] = await Promise.all([
      getDocs(collection(db, 'organizations')),
      getDocs(collection(db, 'branches')),
      getDocs(collection(db, 'queueTokens'))
    ]);

    const orgs = orgsSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const branches = branchesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const tokens = tokensSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    const enhanced = orgs.map(org => {
      const orgBranches = branches.filter(b => b.organizationId === org.id);
      const orgTokens = tokens.filter(t => t.organizationId === org.id);
      return {
        ...org,
        branchCount: orgBranches.length,
        totalTokensIssued: orgTokens.length,
        activeTokens: orgTokens.filter(t => t.status === 'waiting' || t.status === 'called' || t.status === 'serving').length,
        completedTokens: orgTokens.filter(t => t.status === 'completed').length
      };
    });

    res.json({ success: true, data: enhanced });
  } catch (err) {
    next(err);
  }
});

// 17. Admin User Management List (Platform Admin Only)
apiRouter.get('/admin/users', requireAuth, requireRole('platform_admin'), async (req, res, next) => {
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    const users = usersSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    res.json({ success: true, data: users });
  } catch (err) {
    next(err);
  }
});

// 18. Admin Update User Status / Role / Org Binding (Platform Admin Only)
apiRouter.post(
  '/admin/users/update-status',
  writeRateLimiter,
  requireAuth,
  requireRole('platform_admin'),
  async (req, res) => {
    try {
      const { userId, accountStatus, role, organizationId, branchId } = updateUserAdminSchema.parse(req.body);
      const userRef = doc(db, 'users', userId);
      const userSnap = await getDoc(userRef);
      if (!userSnap.exists()) {
        return res.status(404).json({ success: false, error: 'User not found' });
      }

      const existing = userSnap.data();
      const now = new Date().toISOString();
      const updates = { updatedAt: now };
      if (accountStatus !== undefined) updates.accountStatus = accountStatus;
      if (role !== undefined) updates.role = role;
      if (organizationId !== undefined) updates.organizationId = organizationId;
      if (branchId !== undefined) updates.branchId = branchId;

      await updateDoc(userRef, updates);

      await addDoc(collection(db, 'auditLogs'), {
        organizationId: existing.organizationId || 'platform_core',
        actorUid: req.user.uid,
        actorEmail: req.user.email,
        actorRole: req.user.role,
        action: 'USER_ACCOUNT_UPDATED',
        entityType: 'User',
        entityId: userId,
        previousRole: existing.role || 'customer',
        newRole: role || existing.role || 'customer',
        previousStatus: existing.accountStatus || 'active',
        newStatus: accountStatus || existing.accountStatus || 'active',
        details: `Updated user ${existing.email || userId}: status=${accountStatus || 'unchanged'}, role=${role || 'unchanged'}`,
        timestamp: now
      });

      res.json({ success: true, message: 'User record updated.' });
    } catch (err) {
      res.status(400).json({ success: false, error: err.message });
    }
  }
);

// 19. Admin Cross-Branch Oversight (Platform Admin Only)
apiRouter.get('/admin/branches', requireAuth, requireRole('platform_admin'), async (req, res, next) => {
  try {
    const [branchesSnap, tokensSnap, countersSnap] = await Promise.all([
      getDocs(collection(db, 'branches')),
      getDocs(collection(db, 'queueTokens')),
      getDocs(collection(db, 'counters'))
    ]);

    const branches = branchesSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const tokens = tokensSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const counters = countersSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    const enhanced = branches.map(b => {
      const bTokens = tokens.filter(t => t.branchId === b.id);
      const bCounters = counters.filter(c => c.branchId === b.id);
      return {
        ...b,
        counterCount: bCounters.length,
        waitingCount: bTokens.filter(t => t.status === 'waiting').length,
        servingCount: bTokens.filter(t => t.status === 'serving' || t.status === 'called').length,
        completedCount: bTokens.filter(t => t.status === 'completed').length
      };
    });

    res.json({ success: true, data: enhanced });
  } catch (err) {
    next(err);
  }
});

// 20. Admin Queue Monitoring (Platform Admin Only)
apiRouter.get('/admin/queues', requireAuth, requireRole('platform_admin'), async (req, res, next) => {
  try {
    const [tokensSnap, queuesSnap] = await Promise.all([
      getDocs(collection(db, 'queueTokens')),
      getDocs(collection(db, 'queues'))
    ]);
    const tokens = tokensSnap.docs.map(d => ({ id: d.id, ...d.data() }));
    const queues = queuesSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    res.json({
      success: true,
      data: {
        queues,
        tokens: tokens.slice(0, 150)
      }
    });
  } catch (err) {
    next(err);
  }
});

// 21. Admin Appointments Monitoring (Platform Admin Only)
apiRouter.get('/admin/appointments', requireAuth, requireRole('platform_admin'), async (req, res, next) => {
  try {
    const { status, date } = req.query;
    const aptsSnap = await getDocs(collection(db, 'appointments'));
    let appointments = aptsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

    if (status && status !== 'all') {
      appointments = appointments.filter(a => a.status === status);
    }
    if (date) {
      appointments = appointments.filter(a => a.appointmentDate === date);
    }

    res.json({ success: true, data: appointments });
  } catch (err) {
    next(err);
  }
});

// 22. Comprehensive Reports & Analytics (Platform Admin or Scoped Org Leadership)
apiRouter.get(
  '/admin/reports',
  requireAuth,
  requireRole('platform_admin', 'organization_owner', 'branch_manager'),
  async (req, res, next) => {
    try {
      const requestedOrgId = req.query.orgId ? String(req.query.orgId) : null;
      if (req.user.role !== 'platform_admin') {
        if (requestedOrgId && req.user.organizationId && requestedOrgId !== req.user.organizationId) {
          return res.status(403).json({
            success: false,
            error: 'Forbidden: Cannot access reports for another organization.'
          });
        }
      }
      const effectiveOrgId = req.user.role === 'platform_admin'
        ? requestedOrgId
        : (req.user.organizationId || requestedOrgId);

      const reports = await getComprehensiveReports(effectiveOrgId || null);
      res.json({ success: true, data: reports });
    } catch (err) {
      next(err);
    }
  }
);

// 23. Reports CSV Export (Authenticated, Scoped, Formula-Injection Protected)
apiRouter.get(
  '/admin/reports/csv',
  requireAuth,
  requireRole('platform_admin', 'organization_owner', 'branch_manager'),
  async (req, res, next) => {
    try {
      const requestedOrgId = req.query.orgId ? String(req.query.orgId) : null;
      if (req.user.role !== 'platform_admin' && requestedOrgId && req.user.organizationId && requestedOrgId !== req.user.organizationId) {
        return res.status(403).json({
          success: false,
          error: 'Forbidden: Cross-organization CSV export denied.'
        });
      }
      const effectiveOrgId = req.user.role === 'platform_admin'
        ? requestedOrgId
        : (req.user.organizationId || requestedOrgId);

      const tokensSnap = await getDocs(collection(db, 'queueTokens'));
      let tokens = tokensSnap.docs.map(d => d.data());
      if (effectiveOrgId) {
        tokens = tokens.filter(t => t.organizationId === effectiveOrgId);
      }

      const header = 'TokenNumber,Organization,Branch,Service,CustomerName,Status,Priority,Date,Timezone,IssuedAt,ServingAt,CompletedAt\n';
      const rows = tokens
        .map(t =>
          [
            escapeCsvCell(t.tokenNumber),
            escapeCsvCell(t.orgName),
            escapeCsvCell(t.branchName),
            escapeCsvCell(t.serviceName),
            escapeCsvCell(t.customerName),
            escapeCsvCell(t.status),
            escapeCsvCell(t.priority),
            escapeCsvCell(t.date),
            escapeCsvCell(t.timezone || 'Asia/Kathmandu'),
            escapeCsvCell(t.issuedAt),
            escapeCsvCell(t.servingAt),
            escapeCsvCell(t.completedAt)
          ].join(',')
        )
        .join('\n');

      res.setHeader('Content-Type', 'text/csv; charset=utf-8');
      res.setHeader('Content-Disposition', 'attachment; filename="queueless_report.csv"');
      res.send(header + rows);
    } catch (err) {
      next(err);
    }
  }
);

// 24. Platform Settings (Platform Admin Only)
apiRouter.get('/admin/settings', requireAuth, requireRole('platform_admin'), (req, res) => {
  const gateways = getGatewayStatusSnapshot();
  res.json({
    success: true,
    data: {
      ...platformSettingsState,
      smsGateway: gateways.sms,
      emailGateway: gateways.email,
      webPushGateway: gateways.push
    }
  });
});

apiRouter.post('/admin/settings', writeRateLimiter, requireAuth, requireRole('platform_admin'), async (req, res) => {
  try {
    const { platformName, defaultLanguage, primaryTimezone, maintenanceMode } = req.body;
    if (platformName !== undefined) platformSettingsState.platformName = String(platformName).slice(0, 120);
    if (defaultLanguage !== undefined && ['en', 'ne'].includes(defaultLanguage)) {
      platformSettingsState.defaultLanguage = defaultLanguage;
    }
    if (primaryTimezone !== undefined) platformSettingsState.primaryTimezone = String(primaryTimezone).slice(0, 60);
    if (maintenanceMode !== undefined) platformSettingsState.maintenanceMode = Boolean(maintenanceMode);

    await addDoc(collection(db, 'auditLogs'), {
      organizationId: 'platform_core',
      actorUid: req.user.uid,
      actorEmail: req.user.email,
      actorRole: req.user.role,
      action: 'PLATFORM_SETTINGS_UPDATED',
      entityType: 'PlatformSettings',
      entityId: 'global',
      details: `Updated settings: locale=${platformSettingsState.defaultLanguage}, timezone=${platformSettingsState.primaryTimezone}, maintenance=${platformSettingsState.maintenanceMode}`,
      timestamp: new Date().toISOString()
    });

    const gateways = getGatewayStatusSnapshot();
    res.json({
      success: true,
      data: {
        ...platformSettingsState,
        smsGateway: gateways.sms,
        emailGateway: gateways.email,
        webPushGateway: gateways.push
      },
      message: 'Platform settings updated successfully.'
    });
  } catch (err) {
    res.status(400).json({ success: false, error: err.message });
  }
});
