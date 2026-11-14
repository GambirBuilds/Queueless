/**
 * Queue Operations Service Layer for QUEUELESS
 * Connected to Cloud Firestore real-time listeners and authenticated server-side endpoints.
 */

import {
  collection,
  doc,
  query,
  where,
  onSnapshot,
  getDoc,
  getDocs
} from 'firebase/firestore';
import { db } from '../firebase/config.js';
import { handleFirestoreError, OperationType } from '../firebase/errorHandler.js';
import { apiFetch } from './apiClient.js';

export const VALID_TRANSITIONS = {
  waiting: ['called', 'cancelled'],
  called: ['serving', 'skipped', 'cancelled'],
  serving: ['completed', 'skipped', 'cancelled'],
  skipped: ['called', 'cancelled'],
  completed: [],
  cancelled: [],
};

export const queueService = {
  /**
   * Subscribe to live tokens for a branch (Receptionist Console / Kiosk)
   */
  subscribeToBranchTokens(branchId, onUpdate, onError) {
    if (!branchId) return () => {};

    const tokensRef = collection(db, 'queueTokens');
    const q = query(tokensRef, where('branchId', '==', branchId));

    const unsubscribe = onSnapshot(
      q,
      (snapshot) => {
        const tokens = snapshot.docs.map((d) => ({ id: d.id, ...d.data() }));
        tokens.sort((a, b) => new Date(a.issuedAt || 0) - new Date(b.issuedAt || 0));
        onUpdate(tokens);
      },
      (err) => {
        console.error('[Firestore onSnapshot Error in queueService]:', err);
        if (onError) onError(err);
        handleFirestoreError(err, OperationType.GET, `queueTokens?branchId=${branchId}`);
      }
    );

    return unsubscribe;
  },

  /**
   * Subscribe to non-PII public kiosk display feed via API polling fallback if anonymous
   */
  async getPublicDisplayTokens(branchId) {
    if (!branchId) return [];
    const res = await fetch(`/api/public/display/${encodeURIComponent(branchId)}`);
    const json = await res.json();
    if (!res.ok || !json.success) return [];
    return json.data || [];
  },

  /**
   * Subscribe to a single live token for customer real-time tracking
   */
  subscribeToToken(tokenId, onUpdate, onError) {
    if (!tokenId) return () => {};

    const tokenRef = doc(db, 'queueTokens', tokenId);

    const unsubscribe = onSnapshot(
      tokenRef,
      (snapshot) => {
        if (snapshot.exists()) {
          onUpdate({ id: snapshot.id, ...snapshot.data() });
        } else {
          onUpdate(null);
        }
      },
      (err) => {
        console.error('[Firestore onSnapshot Error for token]:', err);
        if (onError) onError(err);
        handleFirestoreError(err, OperationType.GET, `queueTokens/${tokenId}`);
      }
    );

    return unsubscribe;
  },

  /**
   * Fetch single token once
   */
  async getTokenById(tokenId) {
    try {
      const snap = await getDoc(doc(db, 'queueTokens', tokenId));
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() };
      }
      return null;
    } catch (err) {
      console.warn('[queueService.getTokenById fallback]', err.message);
      return null;
    }
  },

  /**
   * Get tokens for an authenticated customer (by UID first, plus phone if present)
   */
  async getCustomerTokens(customerUid, customerPhone = '') {
    try {
      const tokensRef = collection(db, 'queueTokens');
      const resultsMap = new Map();

      if (customerUid) {
        const snapUid = await getDocs(query(tokensRef, where('customerUid', '==', customerUid)));
        snapUid.docs.forEach(d => resultsMap.set(d.id, { id: d.id, ...d.data() }));
      }

      if (customerPhone) {
        const snapPhone = await getDocs(query(tokensRef, where('customerPhone', '==', customerPhone)));
        snapPhone.docs.forEach(d => resultsMap.set(d.id, { id: d.id, ...d.data() }));
      }

      return Array.from(resultsMap.values()).sort(
        (a, b) => new Date(b.issuedAt || 0) - new Date(a.issuedAt || 0)
      );
    } catch (err) {
      console.warn('[queueService.getCustomerTokens error]', err.message);
      return [];
    }
  },

  /**
   * Atomic join queue via authenticated server-side endpoint
   */
  async joinQueue({
    org,
    branch,
    service,
    customerName,
    customerPhone,
    priority = 'Normal',
    notes = ''
  }) {
    const res = await apiFetch('/api/queue/join', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: org.id,
        branchId: branch.id,
        serviceId: service.id,
        customerName,
        customerPhone,
        priority,
        notes
      })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to join queue.');
    }
    return data.data;
  },

  /**
   * Atomic Walk-in Registration (Authenticated Desk Operator)
   */
  async registerWalkIn({
    branchId,
    serviceId,
    customerName,
    customerPhone,
    priority = 'Normal',
    org,
    counterId
  }) {
    const res = await apiFetch('/api/queue/walk-in', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: org.id,
        branchId,
        serviceId,
        customerName,
        customerPhone,
        priority,
        counterId
      })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to register walk-in citizen.');
    }
    return data.data;
  },

  /**
   * Atomic Call Next Customer
   */
  async callNext({ organizationId, branchId, counterId, serviceId = 'all' }) {
    const res = await apiFetch('/api/queue/call-next', {
      method: 'POST',
      body: JSON.stringify({
        organizationId,
        branchId,
        counterId,
        serviceId
      })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to call next customer.');
    }
    return data.data;
  },

  /**
   * Recall Token
   */
  async recallToken(tokenId, counterId) {
    const res = await apiFetch('/api/queue/recall', {
      method: 'POST',
      body: JSON.stringify({ tokenId, counterId })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to recall token.');
    }
    return data.data;
  },

  /**
   * Update Token Status via State Machine Guard
   */
  async updateTokenStatus(tokenId, newStatus, counter = null) {
    const res = await apiFetch('/api/queue/update-status', {
      method: 'POST',
      body: JSON.stringify({
        tokenId,
        status: newStatus.toLowerCase(),
        counterId: counter?.id,
        counterName: counter?.name
      })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Status transition rejected.');
    }
    return data.data;
  },

  /**
   * Open / Pause / Close Queue for a Service
   */
  async toggleQueueStatus({ organizationId, branchId, serviceId, status }) {
    const res = await apiFetch('/api/queue/toggle-status', {
      method: 'POST',
      body: JSON.stringify({ organizationId, branchId, serviceId, status })
    });
    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to change queue status.');
    }
    return data.data;
  }
};
