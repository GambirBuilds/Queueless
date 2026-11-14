/**
 * Sample Audit Logs and Platform Activity Data for Platform Administration
 */
export const sampleAuditLogs = [
  {
    id: 'log-1092',
    timestamp: '2026-11-11T03:30:12Z',
    actor: 'admin@queueless.internal',
    actorRole: 'SUPER_ADMIN',
    action: 'ORGANIZATION_STATUS_REVIEWED',
    entityType: 'ORGANIZATION',
    entityId: 'org-health-01',
    entityName: 'Patan Regional Hospital & Diagnostic Center',
    details: 'Reviewed compliance documents. Granted verified pilot status.',
    ipAddress: '103.10.28.4',
    status: 'SUCCESS'
  },
  {
    id: 'log-1091',
    timestamp: '2026-11-11T02:15:45Z',
    actor: 'sys-router@queueless.internal',
    actorRole: 'SYSTEM_DAEMON',
    action: 'BRANCH_HOURS_EVALUATION',
    entityType: 'BRANCH',
    entityId: 'branch-ehb-newroad',
    entityName: 'New Road Central Branch',
    details: 'Automated branch opening sync completed for morning trading hours.',
    ipAddress: '10.0.4.12',
    status: 'SUCCESS'
  },
  {
    id: 'log-1090',
    timestamp: '2026-11-10T16:40:08Z',
    actor: 'manager@citymotors.example.com',
    actorRole: 'ORG_MANAGER',
    action: 'SERVICE_CONFIG_UPDATED',
    entityType: 'SERVICE',
    entityId: 'srv-cm-periodic',
    entityName: 'Periodic General Service (10,000 KM)',
    details: 'Updated required document checklist and standard 60-min slot buffer.',
    ipAddress: '27.34.20.19',
    status: 'SUCCESS'
  },
  {
    id: 'log-1089',
    timestamp: '2026-11-10T14:12:33Z',
    actor: 'admin@queueless.internal',
    actorRole: 'SUPER_ADMIN',
    action: 'SECURITY_POLICY_ENFORCED',
    entityType: 'SYSTEM_SECURITY',
    entityId: 'sec-rbac-09',
    entityName: 'Role-Based Access Control Audit',
    details: 'Automated policy validator verified zero unauthenticated mutation routes.',
    ipAddress: '10.0.1.2',
    status: 'SUCCESS'
  },
  {
    id: 'log-1088',
    timestamp: '2026-11-10T11:05:20Z',
    actor: 'registrar@tu-exam.example.edu',
    actorRole: 'ORG_ADMIN',
    action: 'COUNTER_ROSTER_ASSIGNED',
    entityType: 'COUNTER',
    entityId: 'c-tu-01',
    entityName: 'Faculty of Humanities Desk',
    details: 'Assigned 2 officer terminals for transcript processing.',
    ipAddress: '110.44.112.50',
    status: 'SUCCESS'
  }
];

export const platformStats = {
  totalOrganizations: 14,
  verifiedOrganizations: 8,
  pendingVerificationCount: 3,
  activeBranches: 28,
  activeCounters: 114,
  registeredServices: 62,
  registeredUsers: 1480,
  systemUptime: '99.98%',
  environment: 'Reference Seed Fixture'
};
