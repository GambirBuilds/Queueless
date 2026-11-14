import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import {
  onAuthStateChanged,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, getDoc, setDoc, updateDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config.js';

const AuthContext = createContext(null);

export function AuthProvider({ children }) {
  const [currentUser, setCurrentUser] = useState(null);
  const [userProfile, setUserProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  const loadOrInitProfile = useCallback(async (user) => {
    if (!user) {
      setUserProfile(null);
      return null;
    }

    const userDocRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userDocRef);
    const isBootstrappedAdmin = user.email === 'karkiamir15@gmail.com' && user.emailVerified;

    if (snap.exists()) {
      const data = snap.data();
      if (isBootstrappedAdmin && data.role !== 'platform_admin') {
        const updated = { ...data, role: 'platform_admin', updatedAt: new Date().toISOString() };
        try {
          await updateDoc(userDocRef, { role: 'platform_admin', updatedAt: updated.updatedAt });
        } catch {
          // ignore if rule restricts; backend still resolves admin deterministically
        }
        setUserProfile(updated);
        return updated;
      }
      setUserProfile(data);
      return data;
    }

    const now = new Date().toISOString();
    const newProfile = {
      uid: user.uid,
      fullName: user.displayName || 'QUEUELESS User',
      email: user.email || '',
      phone: user.phoneNumber || '',
      role: isBootstrappedAdmin ? 'platform_admin' : 'customer',
      organizationId: null,
      branchId: null,
      accountStatus: 'active',
      preferredLanguage: 'en',
      notificationPreferences: { sms: false, email: false, inApp: true },
      createdAt: now,
      updatedAt: now
    };
    await setDoc(userDocRef, newProfile);
    setUserProfile(newProfile);
    return newProfile;
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      setCurrentUser(user);
      if (user) {
        try {
          await loadOrInitProfile(user);
        } catch (err) {
          console.error('[Auth Error] Failed to fetch or create user profile in Firestore:', err);
        }
      } else {
        setUserProfile(null);
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [loadOrInitProfile]);

  const login = async (email, password) => {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    return cred.user;
  };

  // Self-registration always creates 'customer' unless verified bootstrapped admin (never trusts client role)
  const register = async ({ email, password, fullName, phone }) => {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const user = cred.user;
    const now = new Date().toISOString();

    const profileData = {
      uid: user.uid,
      fullName,
      email,
      phone,
      role: 'customer',
      organizationId: null,
      branchId: null,
      accountStatus: 'active',
      preferredLanguage: 'en',
      notificationPreferences: { sms: false, email: false, inApp: true },
      createdAt: now,
      updatedAt: now
    };

    await setDoc(doc(db, 'users', user.uid), profileData);
    setUserProfile(profileData);
    return user;
  };

  const loginWithGoogle = async () => {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    await loadOrInitProfile(cred.user);
    return cred.user;
  };

  const resetPassword = async (email) => {
    await sendPasswordResetEmail(auth, email);
  };

  const logout = async () => {
    await signOut(auth);
    setUserProfile(null);
  };

  // Safe profile update: never modifies role, organizationId, branchId, or accountStatus
  const updateProfile = async (fields) => {
    if (!currentUser) throw new Error('You must be signed in to update your profile.');
    const allowedUpdates = {};
    if (typeof fields.fullName === 'string') allowedUpdates.fullName = fields.fullName.trim().slice(0, 100);
    if (typeof fields.phone === 'string') allowedUpdates.phone = fields.phone.trim().slice(0, 30);
    if (typeof fields.preferredLanguage === 'string' && ['en', 'ne'].includes(fields.preferredLanguage)) {
      allowedUpdates.preferredLanguage = fields.preferredLanguage;
    }
    if (fields.notificationPreferences && typeof fields.notificationPreferences === 'object') {
      allowedUpdates.notificationPreferences = {
        inApp: Boolean(fields.notificationPreferences.inApp ?? true),
        sms: Boolean(fields.notificationPreferences.sms),
        email: Boolean(fields.notificationPreferences.email)
      };
    }
    allowedUpdates.updatedAt = new Date().toISOString();

    await updateDoc(doc(db, 'users', currentUser.uid), allowedUpdates);
    setUserProfile(prev => ({ ...(prev || {}), ...allowedUpdates }));
    return allowedUpdates;
  };

  const refreshProfile = async () => {
    if (!currentUser) return null;
    return loadOrInitProfile(currentUser);
  };

  const role = (currentUser?.email === 'karkiamir15@gmail.com' && currentUser?.emailVerified)
    ? 'platform_admin'
    : (userProfile?.role || 'customer');
  const isAdmin = role === 'platform_admin';
  const isOrgOwner = role === 'organization_owner' || isAdmin;
  const isReceptionist = role === 'receptionist' || role === 'branch_manager' || isOrgOwner;
  const isStaff = isReceptionist || role === 'service_staff';

  return (
    <AuthContext.Provider
      value={{
        currentUser,
        userProfile,
        loading,
        isAuthenticated: !!currentUser,
        role,
        isAdmin,
        isOrgOwner,
        isReceptionist,
        isStaff,
        login,
        register,
        loginWithGoogle,
        logout,
        resetPassword,
        updateProfile,
        refreshProfile
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
}
