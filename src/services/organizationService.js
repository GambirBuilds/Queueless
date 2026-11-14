/**
 * Organization Service Layer for QUEUELESS
 * Connected to Cloud Firestore organizations collection and authenticated admin verification endpoints
 */

import { collection, doc, getDoc, getDocs, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase/config.js';
import { sampleOrganizations } from '../data/sampleOrganizations.js';
import { apiFetch } from './apiClient.js';

export const organizationService = {
  /**
   * Fetch all approved/demo organizations from Firestore with fallback
   */
  async getOrganizations() {
    try {
      const snap = await getDocs(collection(db, 'organizations'));
      if (!snap.empty) {
        return snap.docs.map(d => ({ id: d.id, ...d.data() }));
      }
    } catch (err) {
      console.warn('[getOrganizations fallback to sample data]', err.message);
    }
    return sampleOrganizations;
  },

  /**
   * Fetch public directory with nested branches, services, counters
   */
  async getPublicDirectory() {
    try {
      const res = await fetch('/api/public/organizations');
      const json = await res.json();
      if (res.ok && json.success && Array.isArray(json.data) && json.data.length > 0) {
        return json.data;
      }
    } catch (err) {
      console.warn('[getPublicDirectory fallback]', err.message);
    }
    return sampleOrganizations;
  },

  /**
   * Subscribe to real-time organizations list
   */
  subscribeToOrganizations(onUpdate) {
    return onSnapshot(
      collection(db, 'organizations'),
      (snapshot) => {
        if (!snapshot.empty) {
          onUpdate(snapshot.docs.map(d => ({ id: d.id, ...d.data() })));
        } else {
          onUpdate(sampleOrganizations);
        }
      },
      (err) => {
        console.warn('[subscribeToOrganizations error]', err.message);
        onUpdate(sampleOrganizations);
      }
    );
  },

  /**
   * Get single organization by ID
   */
  async getOrganizationById(orgId) {
    try {
      const snap = await getDoc(doc(db, 'organizations', orgId));
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() };
      }
    } catch (err) {
      console.warn('[getOrganizationById error]', err.message);
    }
    return sampleOrganizations.find(o => o.id === orgId) || sampleOrganizations[0];
  },

  /**
   * Submit institutional registration via backend API
   */
  async submitRegistration(formData) {
    const res = await apiFetch('/api/orgs/register', {
      method: 'POST',
      body: JSON.stringify(formData)
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to submit organization registration.');
    }
    return data.data;
  },

  /**
   * Platform admin verification of an organization
   */
  async updateVerificationStatus(organizationId, status, reason = '') {
    const res = await apiFetch('/api/orgs/verify', {
      method: 'POST',
      body: JSON.stringify({ organizationId, status, reason })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to update organization status.');
    }
    return true;
  },

  /**
   * Get verification status for an application ID
   */
  async getVerificationStatus(regId) {
    try {
      const snap = await getDoc(doc(db, 'organizations', regId));
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() };
      }
    } catch (err) {
      console.warn('[getVerificationStatus error]', err.message);
    }
    return null;
  },

  async createBranch(orgId, payload) {
    const res = await apiFetch(`/api/org/${orgId}/branches`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to create branch.');
    return data.data;
  },

  async createService(orgId, payload) {
    const res = await apiFetch(`/api/org/${orgId}/services`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to create service.');
    return data.data;
  },

  async createCounter(orgId, payload) {
    const res = await apiFetch(`/api/org/${orgId}/counters`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to create counter.');
    return data.data;
  },

  async toggleCounterStatus(orgId, counterId, status) {
    const res = await apiFetch(`/api/org/${orgId}/counters/${counterId}/toggle`, {
      method: 'POST',
      body: JSON.stringify({ status })
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update counter status.');
    return data.data;
  },

  async getStaff(orgId) {
    const res = await apiFetch(`/api/org/${orgId}/staff`);
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to load staff directory.');
    return data.data || [];
  },

  async createStaff(orgId, payload) {
    const res = await apiFetch(`/api/org/${orgId}/staff`, {
      method: 'POST',
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to add staff member.');
    return data.data;
  },

  async updateOrgProfile(orgId, payload) {
    const res = await apiFetch(`/api/org/${orgId}/profile`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update organization profile.');
    return data.data;
  },

  async updateOrgSettings(orgId, payload) {
    const res = await apiFetch(`/api/org/${orgId}/settings`, {
      method: 'PATCH',
      body: JSON.stringify(payload)
    });
    const data = await res.json();
    if (!res.ok || !data.success) throw new Error(data.error || 'Failed to update operational settings.');
    return data.data;
  }
};

