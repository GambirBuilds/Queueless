/**
 * Authentication Service Layer for QUEUELESS
 * Connected to Firebase Authentication and Cloud Firestore User Profiles
 */

import {
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  signOut,
  sendPasswordResetEmail,
  signInWithPopup,
  GoogleAuthProvider
} from 'firebase/auth';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { auth, db } from '../firebase/config.js';

export const authService = {
  /**
   * Get current authenticated user
   */
  getCurrentUser() {
    return auth.currentUser;
  },

  /**
   * Validate customer registration fields
   */
  validateRegistration({ fullName, email, phoneNumber, password, confirmPassword }) {
    const errors = {};
    if (!fullName || fullName.trim().length < 3) {
      errors.fullName = 'Full name must be at least 3 characters.';
    }
    if (!email || !/\S+@\S+\.\S+/.test(email)) {
      errors.email = 'Please provide a valid email address.';
    }
    if (!phoneNumber || phoneNumber.trim().length < 8) {
      errors.phoneNumber = 'Valid mobile phone number is required for SMS tokens.';
    }
    if (!password || password.length < 8) {
      errors.password = 'Password must be at least 8 characters.';
    }
    if (password !== confirmPassword) {
      errors.confirmPassword = 'Passwords do not match.';
    }
    return {
      isValid: Object.keys(errors).length === 0,
      errors
    };
  },

  /**
   * Register new user with Firebase Authentication and Firestore User Profile
   */
  async register({ fullName, email, phoneNumber, password, role = 'customer' }) {
    const cred = await createUserWithEmailAndPassword(auth, email, password);
    const user = cred.user;

    const isBootstrappedAdmin = email === 'karkiamir15@gmail.com';
    const profile = {
      uid: user.uid,
      fullName,
      email,
      phone: phoneNumber,
      role: isBootstrappedAdmin ? 'platform_admin' : role,
      accountStatus: 'active',
      preferredLanguage: 'en',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    try {
      await setDoc(doc(db, 'users', user.uid), profile);
    } catch (err) {
      console.warn('[Firestore User profile write warning]', err.message);
    }

    return { user, profile };
  },

  /**
   * Sign In with Email and Password
   */
  async login(email, password) {
    const cred = await signInWithEmailAndPassword(auth, email, password);
    const user = cred.user;

    // Fetch user profile from Firestore
    let profile = null;
    try {
      const snap = await getDoc(doc(db, 'users', user.uid));
      if (snap.exists()) {
        profile = snap.data();
      }
    } catch (err) {
      console.warn('[Fetch profile on login warning]', err.message);
    }

    return { user, profile };
  },

  /**
   * Sign In with Google Popup
   */
  async loginWithGoogle() {
    const provider = new GoogleAuthProvider();
    const cred = await signInWithPopup(auth, provider);
    const user = cred.user;

    const userRef = doc(db, 'users', user.uid);
    const snap = await getDoc(userRef);
    let profile = null;

    if (!snap.exists()) {
      const isBootstrappedAdmin = user.email === 'karkiamir15@gmail.com';
      profile = {
        uid: user.uid,
        fullName: user.displayName || 'QUEUELESS User',
        email: user.email || '',
        phone: user.phoneNumber || '',
        role: isBootstrappedAdmin ? 'platform_admin' : 'customer',
        accountStatus: 'active',
        preferredLanguage: 'en',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      await setDoc(userRef, profile);
    } else {
      profile = snap.data();
    }

    return { user, profile };
  },

  /**
   * Password Reset Email
   */
  async resetPassword(email) {
    await sendPasswordResetEmail(auth, email);
    return true;
  },

  /**
   * Log Out
   */
  async logout() {
    await signOut(auth);
  }
};
