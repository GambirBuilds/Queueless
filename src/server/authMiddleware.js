/**
 * Authentication & Role-Based Access Control (RBAC) Middleware
 * Verifies Firebase ID tokens via Firebase Admin Auth SDK and resolves
 * authoritative user roles from Cloud Firestore (never trusting client-supplied role values).
 */

import { initializeApp, getApps } from 'firebase-admin/app';
import { getAuth as getAdminAuth } from 'firebase-admin/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { db, firebaseConfig } from '../firebase/config.js';

export const ALLOWED_ROLES = [
  'customer',
  'organization_owner',
  'branch_manager',
  'receptionist',
  'service_staff',
  'platform_admin'
];

const BOOTSTRAPPED_ADMIN_EMAIL = 'karkiamir15@gmail.com';

const adminApp = getApps().length
  ? getApps()[0]
  : initializeApp({ projectId: firebaseConfig.projectId });

const adminAuth = getAdminAuth(adminApp);

/**
 * Verify Firebase Auth ID token from Authorization: Bearer <token>
 */
export async function verifyBearerToken(authHeader) {
  if (!authHeader || typeof authHeader !== 'string' || !authHeader.startsWith('Bearer ')) {
    return null;
  }
  const idToken = authHeader.slice(7).trim();
  if (!idToken) return null;

  return adminAuth.verifyIdToken(idToken);
}

/**
 * Resolve authoritative user profile from Firestore without trusting browser claims
 */
export async function resolveAuthoritativeUser(decodedToken) {
  const uid = decodedToken.uid;
  const email = decodedToken.email || '';
  const emailVerified = Boolean(decodedToken.email_verified);
  const isBootstrappedAdmin = email === BOOTSTRAPPED_ADMIN_EMAIL && emailVerified;

  const userRef = doc(db, 'users', uid);
  const snap = await getDoc(userRef);

  if (snap.exists()) {
    const profile = snap.data();
    const effectiveRole = isBootstrappedAdmin ? 'platform_admin' : (ALLOWED_ROLES.includes(profile.role) ? profile.role : 'customer');
    return {
      uid,
      email: profile.email || email,
      emailVerified,
      fullName: profile.fullName || decodedToken.name || 'QUEUELESS User',
      phone: profile.phone || '',
      role: effectiveRole,
      organizationId: profile.organizationId || null,
      branchId: profile.branchId || null,
      accountStatus: profile.accountStatus || 'active'
    };
  }

  // First-time verified user profile initialization (always defaults to 'customer' unless bootstrapped admin)
  const now = new Date().toISOString();
  const initialProfile = {
    uid,
    fullName: decodedToken.name || 'QUEUELESS User',
    email,
    phone: decodedToken.phone_number || '',
    role: isBootstrappedAdmin ? 'platform_admin' : 'customer',
    organizationId: null,
    branchId: null,
    accountStatus: 'active',
    preferredLanguage: 'en',
    createdAt: now,
    updatedAt: now
  };

  try {
    await setDoc(userRef, initialProfile);
  } catch (err) {
    console.warn('[AuthMiddleware] Profile auto-init warning:', err.message);
  }

  return {
    ...initialProfile,
    emailVerified
  };
}

/**
 * Express Middleware: Strictly require valid Firebase ID token
 */
export async function requireAuth(req, res, next) {
  try {
    const decoded = await verifyBearerToken(req.headers.authorization);
    if (!decoded) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required. Please sign in and include a valid Bearer token.'
      });
    }

    const user = await resolveAuthoritativeUser(decoded);
    if (user.accountStatus === 'suspended') {
      return res.status(403).json({
        success: false,
        error: 'Account is suspended. Contact platform administration.'
      });
    }

    req.user = user;
    next();
  } catch (err) {
    return res.status(401).json({
      success: false,
      error: 'Invalid or expired authentication token.'
    });
  }
}

/**
 * Express Middleware: Optional authentication (attaches req.user if token present)
 */
export async function optionalAuth(req, res, next) {
  try {
    const decoded = await verifyBearerToken(req.headers.authorization);
    if (decoded) {
      req.user = await resolveAuthoritativeUser(decoded);
    }
  } catch {
    // Ignore invalid optional token; route remains anonymous
  }
  next();
}

/**
 * Express Middleware: Require one of the allowed RBAC roles
 */
export function requireRole(...roles) {
  return (req, res, next) => {
    if (!req.user) {
      return res.status(401).json({
        success: false,
        error: 'Authentication required.'
      });
    }
    if (!roles.includes(req.user.role)) {
      return res.status(403).json({
        success: false,
        error: `Access denied. Required role: ${roles.join(' or ')}.`
      });
    }
    next();
  };
}

/**
 * Check cross-organization and cross-branch isolation
 */
export function hasOrgBranchScope(user, targetOrgId, targetBranchId = null) {
  if (!user) return false;
  if (user.role === 'platform_admin') return true;

  if (user.role === 'organization_owner') {
    return Boolean(user.organizationId && user.organizationId === targetOrgId);
  }

  if (['branch_manager', 'receptionist', 'service_staff'].includes(user.role)) {
    const orgMatch = Boolean(user.organizationId && user.organizationId === targetOrgId);
    if (!orgMatch) return false;
    if (targetBranchId && user.branchId) {
      return user.branchId === targetBranchId;
    }
    return true;
  }

  return false;
}
