/**
 * Comprehensive Automated Test Suite for QUEUELESS
 * Executes directly against real server modules (RBAC, queueEngine, validators,
 * securityMiddleware) and bilingual translation modules.
 */

import {
  VALID_TRANSITIONS,
  VALID_APPOINTMENT_TRANSITIONS,
  formatTokenNumber,
  getBusinessDateInTimezone,
  mergeServiceQueueStatuses
} from '../src/server/queueEngine.js';
import { ALLOWED_ROLES, hasOrgBranchScope } from '../src/server/authMiddleware.js';
import { isOriginAllowed, createRateLimiter } from '../src/server/securityMiddleware.js';
import {
  joinQueueSchema,
  callNextSchema,
  updateTokenStatusSchema,
  toggleQueueStatusSchema,
  bookAppointmentSchema,
  rescheduleAppointmentSchema,
  registerOrgSchema,
  updateOrgStatusSchema,
  updateUserAdminSchema,
  createBranchSchema,
  createServiceSchema,
  createCounterSchema,
  createStaffSchema
} from '../src/server/validators.js';
import { en } from '../src/translations/en.js';
import { ne } from '../src/translations/ne.js';

let passedCount = 0;
let failedCount = 0;

function assert(condition, testName) {
  if (condition) {
    console.log(`  PASS: ${testName}`);
    passedCount++;
  } else {
    console.error(`  FAIL: ${testName}`);
    failedCount++;
  }
}

async function runTestSuite() {
  console.log('\n======================================================');
  console.log('   QUEUELESS AUTOMATED BACKEND & SECURITY TEST SUITE');
  console.log('======================================================\n');

  // 1. Registration & Input Validation
  console.log('1. Registration, Queue & Org Input Validation:');
  {
    const validOrg = {
      name: 'Kathmandu Regional Diagnostic Polyclinic',
      industryId: 'healthcare',
      email: 'contact@ktmpoly.org',
      phone: '+977 1-4410000',
      address: 'Tripureshwor',
      city: 'Kathmandu',
      ownerName: 'Dr. Ram Shrestha',
      ownerEmail: 'ram@ktmpoly.org'
    };
    assert(registerOrgSchema.safeParse(validOrg).success, 'Valid org registration accepted');
    assert(!registerOrgSchema.safeParse({ ...validOrg, email: 'invalid' }).success, 'Malformed email rejected');
    assert(!registerOrgSchema.safeParse({ ...validOrg, name: 'AB' }).success, 'Short org name rejected');

    assert(joinQueueSchema.safeParse({
      organizationId: 'org-1',
      branchId: 'br-1',
      serviceId: 'srv-1',
      customerName: 'Asha Gurung',
      customerPhone: '+977 9801112233',
      priority: 'Senior Citizen'
    }).success, 'Valid join queue schema accepted');

    assert(!joinQueueSchema.safeParse({
      organizationId: 'org-1',
      branchId: 'br-1',
      serviceId: 'srv-1',
      customerName: 'A',
      customerPhone: '123',
      priority: 'VIP_OVERRIDE'
    }).success, 'Invalid priority / short phone rejected');

    assert(toggleQueueStatusSchema.safeParse({
      organizationId: 'org-1',
      branchId: 'br-1',
      serviceId: 'srv-1',
      status: 'paused'
    }).success, 'Toggle queue status schema accepts open/paused/closed');

    assert(!toggleQueueStatusSchema.safeParse({
      organizationId: 'org-1',
      branchId: 'br-1',
      serviceId: 'srv-1',
      status: 'deleted'
    }).success, 'Toggle queue status schema rejects invalid state');

    assert(rescheduleAppointmentSchema.safeParse({
      appointmentDate: '2026-12-01',
      timeSlot: '10:00 AM - 10:30 AM'
    }).success, 'Valid appointment reschedule payload accepted');

    assert(!rescheduleAppointmentSchema.safeParse({
      appointmentDate: '01-12-2026',
      timeSlot: '10:00 AM'
    }).success, 'Non-ISO appointment date format rejected');

    assert(createBranchSchema.safeParse({
      name: 'Pokhara Lakeside Branch',
      address: 'Lakeside Road, Ward 6',
      phone: '+977 61-460000'
    }).success, 'Create branch schema validates required fields');

    assert(createServiceSchema.safeParse({
      name: 'Cardiology Consultation',
      code: 'CRD',
      category: 'Specialist Clinic',
      estimatedDurationMinutes: 20
    }).success, 'Create service schema validates custom service definitions');

    assert(createCounterSchema.safeParse({
      branchId: 'br-1',
      number: '4',
      name: 'Priority Desk'
    }).success, 'Create counter schema validates desk assignment');

    assert(createStaffSchema.safeParse({
      name: 'Maya Adhikari',
      email: 'maya@org.example',
      role: 'receptionist'
    }).success, 'Create staff schema validates role');
  }

  // 2. RBAC Roles & Real Cross-Tenant / Cross-Branch Scope Helper
  console.log('\n2. Real RBAC Role Hierarchy & Cross-Tenant Isolation:');
  {
    assert(ALLOWED_ROLES.includes('customer') && ALLOWED_ROLES.includes('platform_admin'), 'Standard & Platform Admin roles registered');
    assert(ALLOWED_ROLES.includes('receptionist') && ALLOWED_ROLES.includes('branch_manager'), 'Branch & desk roles registered');
    assert(!ALLOWED_ROLES.includes('super_hacker'), 'Arbitrary unknown roles excluded');

    const adminUser = { uid: 'u-adm', role: 'platform_admin' };
    const orgAOwner = { uid: 'u-own', role: 'organization_owner', organizationId: 'org-a', branchId: null };
    const orgABranch1Staff = { uid: 'u-rec', role: 'receptionist', organizationId: 'org-a', branchId: 'br-a1' };
    const customer = { uid: 'u-cus', role: 'customer', organizationId: null, branchId: null };

    assert(hasOrgBranchScope(adminUser, 'org-z', 'br-z9'), 'Platform admin has cross-tenant oversight scope');
    assert(hasOrgBranchScope(orgAOwner, 'org-a', 'br-a2'), 'Org owner can manage any branch in own org');
    assert(!hasOrgBranchScope(orgAOwner, 'org-b', 'br-b1'), 'Org owner denied access to another organization');
    assert(hasOrgBranchScope(orgABranch1Staff, 'org-a', 'br-a1'), 'Branch staff permitted on own branch');
    assert(!hasOrgBranchScope(orgABranch1Staff, 'org-a', 'br-a2'), 'Branch staff denied cross-branch operation');
    assert(!hasOrgBranchScope(orgABranch1Staff, 'org-b', 'br-b1'), 'Branch staff denied cross-org operation');
    assert(!hasOrgBranchScope(customer, 'org-a', 'br-a1'), 'Customer denied staff operations');
    assert(!hasOrgBranchScope(null, 'org-a', 'br-a1'), 'Anonymous user denied scoped operations');
  }

  // 3. Token Formatting & Timezone Business Date Engine
  console.log('\n3. Token Formatting & Timezone Business Date Engine:');
  {
    assert(formatTokenNumber('a', 1) === 'A-001', 'Sequence 1 formats to A-001');
    assert(formatTokenNumber('opd', 42) === 'OPD-042', 'Sequence 42 formats to OPD-042');
    assert(formatTokenNumber('lab!', 105) === 'LAB-105', 'Special chars stripped from prefix safely');

    const sampleInstant = new Date('2026-11-13T19:00:00Z'); // Already Nov 14 in Asia/Kathmandu (+05:45), Nov 13 in UTC
    const ktmDate = getBusinessDateInTimezone('Asia/Kathmandu', sampleInstant);
    const utcDate = getBusinessDateInTimezone('UTC', sampleInstant);
    assert(ktmDate === '2026-11-14', 'Asia/Kathmandu business date rolls over accurately at +05:45');
    assert(utcDate === '2026-11-13', 'UTC business date computed independently');
    assert(/^\d{4}-\d{2}-\d{2}$/.test(getBusinessDateInTimezone('Invalid/Zone', sampleInstant)), 'Invalid timezone falls back cleanly to YYYY-MM-DD');

    const mockServices = [
      { id: 'srv-1', organizationId: 'org-1', name: 'OPD' },
      { id: 'srv-2', organizationId: 'org-1', name: 'Lab' },
      { id: 'srv-3', organizationId: 'org-1', name: 'Pharmacy' },
      { id: 'srv-other', organizationId: 'org-2', name: 'Other Org' }
    ];
    const mockQueues = [
      { id: 'q-org-1-srv-1-2026-11-14', organizationId: 'org-1', serviceId: 'srv-1', date: '2026-11-14', status: 'paused' },
      { id: 'q-org-1-srv-2-2026-11-14', organizationId: 'org-1', serviceId: 'srv-2', date: '2026-11-14', status: 'closed' },
      { id: 'q-org-1-srv-3-2026-11-13', organizationId: 'org-1', serviceId: 'srv-3', date: '2026-11-13', status: 'closed' }
    ];
    const merged = mergeServiceQueueStatuses(mockServices, mockQueues, 'org-1', '2026-11-14');
    assert(merged.length === 3, 'mergeServiceQueueStatuses scopes services strictly to target organization');
    assert(merged[0].queueStatus === 'paused' && merged[1].queueStatus === 'closed', 'Live paused/closed queue status merged onto services for business date');
    assert(merged[2].queueStatus === 'open', 'Prior-day closed queue does not block today’s default open queueStatus');
  }

  // 4. Queue Token & Appointment Finite State Machines
  console.log('\n4. Queue Token & Appointment Finite State Machines:');
  {
    assert(VALID_TRANSITIONS.waiting.includes('called'), 'Token waiting -> called permitted');
    assert(VALID_TRANSITIONS.called.includes('serving'), 'Token called -> serving permitted');
    assert(VALID_TRANSITIONS.serving.includes('completed'), 'Token serving -> completed permitted');
    assert(VALID_TRANSITIONS.called.includes('skipped'), 'Token called -> skipped (hold) permitted');
    assert(VALID_TRANSITIONS.skipped.includes('called'), 'Token skipped -> called (recall) permitted');
    assert(!VALID_TRANSITIONS.completed.includes('waiting'), 'Illegal token completed -> waiting blocked');
    assert(!VALID_TRANSITIONS.cancelled.includes('serving'), 'Illegal token cancelled -> serving blocked');

    assert(VALID_APPOINTMENT_TRANSITIONS.confirmed.includes('arrived'), 'Appointment confirmed -> arrived permitted');
    assert(VALID_APPOINTMENT_TRANSITIONS.arrived.includes('completed'), 'Appointment arrived -> completed permitted');
    assert(!VALID_APPOINTMENT_TRANSITIONS.completed.includes('confirmed'), 'Completed appointment cannot revert');
    assert(!VALID_APPOINTMENT_TRANSITIONS.cancelled.includes('arrived'), 'Cancelled appointment cannot check in');
  }

  // 5. Security Middleware: CORS Allowlist & Sliding Window Rate Limiter
  console.log('\n5. Security Middleware (CORS Allowlist & Rate Limiter):');
  {
    assert(isOriginAllowed('http://localhost:3000'), 'Localhost dev origin allowed');
    assert(isOriginAllowed('https://ais-dev-example.asia-southeast1.run.app'), 'Cloud Run origin allowed');
    assert(!isOriginAllowed('https://evil-phishing-domain.example'), 'Untrusted external origin blocked');

    const limiter = createRateLimiter({ windowMs: 10_000, maxRequests: 2, keyPrefix: 'test-suite' });
    let statusAssigned = 200;
    let nextCalledCount = 0;
    const mockReq = { headers: {}, socket: { remoteAddress: '10.10.10.10' } };
    const mockRes = {
      headers: {},
      setHeader(k, v) { this.headers[k] = v; },
      status(code) { statusAssigned = code; return this; },
      json(body) { return body; }
    };

    limiter(mockReq, mockRes, () => { nextCalledCount++; });
    limiter(mockReq, mockRes, () => { nextCalledCount++; });
    limiter(mockReq, mockRes, () => { nextCalledCount++; });

    assert(nextCalledCount === 2, 'First 2 requests allowed within limit window');
    assert(statusAssigned === 429, '3rd request exceeding window triggers HTTP 429 Too Many Requests');
  }

  // 6. Admin Schemas & RBAC Update Validation
  console.log('\n6. Administrative Verification & User Governance Validation:');
  {
    assert(updateOrgStatusSchema.safeParse({
      organizationId: 'org-test-1',
      status: 'approved'
    }).success, 'Admin org verification approval schema accepted');

    assert(!updateOrgStatusSchema.safeParse({
      organizationId: 'org-test-1',
      status: 'super_approved'
    }).success, 'Arbitrary org status rejected');

    assert(updateUserAdminSchema.safeParse({
      userId: 'uid-123',
      role: 'branch_manager',
      organizationId: 'org-health-01',
      accountStatus: 'active'
    }).success, 'Admin role & org assignment payload accepted');

    assert(!updateUserAdminSchema.safeParse({
      userId: 'uid-123',
      accountStatus: 'banned_forever'
    }).success, 'Invalid user accountStatus rejected');
  }

  // 7. English & Nepali Bilingual Parity + No Stage 1 Marketing Copy Left
  console.log('\n7. English & Nepali Bilingual Parity:');
  {
    const enNavKeys = Object.keys(en.nav);
    const neNavKeys = Object.keys(ne.nav);
    assert(enNavKeys.every(k => neNavKeys.includes(k)), 'Full navigation key parity (en <-> ne)');

    const enAdminKeys = Object.keys(en.adminPortalView);
    const neAdminKeys = Object.keys(ne.adminPortalView);
    assert(enAdminKeys.every(k => neAdminKeys.includes(k)), 'Full 11-tab admin console key parity (en <-> ne)');

    assert(!en.hero.badge.includes('Stage 1') && !ne.hero.badge.includes('चरण १'), 'Stale Stage 1 labels removed from bilingual hero badges');
  }

  console.log('\n======================================================');
  console.log(`TEST RESULTS: ${passedCount} PASSED, ${failedCount} FAILED`);
  console.log('======================================================\n');

  if (failedCount > 0) {
    process.exit(1);
  }
}

runTestSuite().catch(err => {
  console.error('Test suite error:', err);
  process.exit(1);
});
