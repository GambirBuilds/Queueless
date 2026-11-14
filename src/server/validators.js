import { z } from 'zod';

export const joinQueueSchema = z.object({
  organizationId: z.string().min(1, 'Organization ID required').max(128),
  branchId: z.string().min(1, 'Branch ID required').max(128),
  serviceId: z.string().min(1, 'Service ID required').max(128),
  customerName: z.string().min(2, 'Customer name must be at least 2 characters').max(100),
  customerPhone: z.string().min(7, 'Valid phone number required').max(30),
  customerUid: z.string().max(128).optional().default('guest_user'),
  priority: z.enum(['Normal', 'Senior Citizen', 'Urgent']).default('Normal'),
  notes: z.string().max(500).optional().default(''),
  isWalkIn: z.boolean().optional().default(false),
});

export const callNextSchema = z.object({
  organizationId: z.string().min(1, 'Organization ID required').max(128),
  branchId: z.string().min(1, 'Branch ID required').max(128),
  counterId: z.string().min(1, 'Counter ID required').max(128),
  serviceId: z.string().max(128).optional(),
  staffUid: z.string().max(128).optional().default('staff_operator'),
});

export const updateTokenStatusSchema = z.object({
  tokenId: z.string().min(1, 'Token ID required').max(128),
  status: z.enum(['waiting', 'called', 'serving', 'completed', 'skipped', 'cancelled']),
  counterId: z.string().max(128).optional(),
  counterName: z.string().max(100).optional(),
  staffUid: z.string().max(128).optional().default('staff_operator'),
  notes: z.string().max(300).optional(),
});

export const toggleQueueStatusSchema = z.object({
  organizationId: z.string().min(1, 'Organization ID required').max(128),
  branchId: z.string().min(1, 'Branch ID required').max(128),
  serviceId: z.string().min(1, 'Service ID required').max(128),
  status: z.enum(['open', 'paused', 'closed']),
});

export const walkInSchema = z.object({
  organizationId: z.string().min(1, 'Organization ID required').max(128),
  branchId: z.string().min(1, 'Branch ID required').max(128),
  serviceId: z.string().min(1, 'Service ID required').max(128),
  customerName: z.string().min(2, 'Customer name required').max(100),
  customerPhone: z.string().min(7, 'Customer phone required').max(30),
  priority: z.enum(['Normal', 'Senior Citizen', 'Urgent']).default('Normal'),
  counterId: z.string().max(128).optional(),
  staffUid: z.string().max(128).optional().default('staff_operator'),
});

export const bookAppointmentSchema = z.object({
  customerId: z.string().min(1, 'Customer ID required').max(128).optional(),
  organizationId: z.string().min(1, 'Organization ID required').max(128),
  branchId: z.string().min(1, 'Branch ID required').max(128),
  serviceId: z.string().min(1, 'Service ID required').max(128),
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  timeSlot: z.string().min(3, 'Time slot required').max(60),
  customerName: z.string().min(2, 'Customer name required').max(100),
  customerEmail: z.string().email('Valid email required').max(120),
  customerPhone: z.string().min(7, 'Valid phone required').max(30),
  notes: z.string().max(500).optional().default(''),
});

export const rescheduleAppointmentSchema = z.object({
  appointmentDate: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Date must be YYYY-MM-DD'),
  timeSlot: z.string().min(3, 'Time slot required').max(60),
});

export const updateAppointmentStatusSchema = z.object({
  status: z.enum(['confirmed', 'arrived', 'completed', 'cancelled', 'rejected']),
  notes: z.string().max(300).optional().default(''),
});

export const registerOrgSchema = z.object({
  name: z.string().min(3, 'Organization name must be at least 3 characters').max(150),
  industryId: z.string().min(1, 'Industry selection required').max(50),
  industryName: z.string().max(100).optional().default('General Service'),
  registrationNumber: z.string().max(80).optional().default(''),
  email: z.string().email('Valid institutional email required').max(120),
  phone: z.string().min(7, 'Institutional phone required').max(30),
  address: z.string().min(3, 'Address required').max(200),
  city: z.string().min(2, 'City required').max(80),
  province: z.string().max(80).optional().default('Bagmati Province'),
  timezone: z.string().max(60).optional().default('Asia/Kathmandu'),
  website: z.string().max(200).optional().default(''),
  description: z.string().max(1000).optional().default(''),
  ownerUid: z.string().max(128).optional().default('applicant_pending'),
  ownerName: z.string().min(2, 'Owner / Representative name required').max(100),
  ownerEmail: z.string().email('Representative email required').max(120),
  ownerPhone: z.string().max(30).optional().default(''),
});

export const updateOrgStatusSchema = z.object({
  organizationId: z.string().min(1).max(128),
  status: z.enum(['pending_verification', 'approved', 'rejected', 'suspended']),
  reason: z.string().max(500).optional().default(''),
});

export const updateUserAdminSchema = z.object({
  userId: z.string().min(1).max(128),
  accountStatus: z.enum(['active', 'suspended']).optional(),
  role: z.enum(['customer', 'organization_owner', 'branch_manager', 'receptionist', 'service_staff', 'platform_admin']).optional(),
  organizationId: z.string().max(128).nullable().optional(),
  branchId: z.string().max(128).nullable().optional(),
});

export const createBranchSchema = z.object({
  name: z.string().min(2, 'Branch name required').max(150),
  address: z.string().min(3, 'Branch address required').max(250),
  phone: z.string().min(6, 'Phone required').max(30),
  operatingHours: z.string().min(3).max(120).optional().default('Sun - Fri: 09:00 AM - 05:00 PM'),
  timezone: z.string().max(60).optional().default('Asia/Kathmandu'),
  isOpen: z.boolean().optional().default(true),
});

export const createServiceSchema = z.object({
  name: z.string().min(2, 'Service name required').max(150),
  code: z.string().min(1, 'Service code required').max(20),
  category: z.string().min(2, 'Category required').max(80),
  estimatedDurationMinutes: z.coerce.number().int().min(1).max(480).default(15),
  feeAmount: z.coerce.number().min(0).max(1000000).default(0),
  feeCurrency: z.string().max(10).optional().default('NPR'),
  isPaid: z.boolean().optional().default(false),
  requiredDocuments: z.array(z.string().max(200)).max(25).optional().default(['Government Identity Document']),
  description: z.string().max(1000).optional().default('Configured service offering.'),
  maxSlotCapacity: z.coerce.number().int().min(1).max(50).optional().default(4),
});

export const createCounterSchema = z.object({
  branchId: z.string().min(1, 'Branch ID required').max(128),
  number: z.string().min(1, 'Counter number required').max(30),
  name: z.string().min(2, 'Counter name required').max(120),
  serviceIds: z.array(z.string().max(128)).max(50).optional().default([]),
});

export const toggleCounterStatusSchema = z.object({
  status: z.enum(['Active', 'On Break']),
});

export const createStaffSchema = z.object({
  name: z.string().min(2, 'Staff name required').max(100),
  email: z.string().email('Valid official email required').max(120),
  role: z.enum(['receptionist', 'service_staff', 'branch_manager', 'organization_owner']),
  branchId: z.string().max(128).optional().default(''),
  counter: z.string().max(120).optional().default('Unassigned'),
});

export const updateOrgProfileSchema = z.object({
  name: z.string().min(3).max(150),
  tagline: z.string().max(200).optional().default(''),
  email: z.string().email().max(120),
  phone: z.string().min(6).max(30),
  website: z.string().max(200).optional().default(''),
  description: z.string().max(1500).optional().default(''),
});

export const updateOrgSettingsSchema = z.object({
  turnoverBufferMinutes: z.coerce.number().int().min(0).max(120).default(5),
  maxAdvanceDays: z.coerce.number().int().min(1).max(90).default(7),
  smsNotificationOnCall: z.boolean().default(false),
  audioChimeEnabled: z.boolean().default(true),
  autoRecallTimeoutMinutes: z.coerce.number().int().min(1).max(30).default(3),
});

