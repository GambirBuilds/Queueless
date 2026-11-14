/**
 * Appointment Service Layer for QUEUELESS
 * Connected to Cloud Firestore and authenticated Express backend endpoints
 */

import {
  collection,
  doc,
  getDoc,
  query,
  where,
  onSnapshot
} from 'firebase/firestore';
import { db } from '../firebase/config.js';
import { handleFirestoreError, OperationType } from '../firebase/errorHandler.js';
import { apiFetch } from './apiClient.js';

export const appointmentService = {
  /**
   * Subscribe to live appointments for an organization
   */
  subscribeToOrgAppointments(orgId, onUpdate, onError) {
    if (!orgId) return () => {};

    const q = query(
      collection(db, 'appointments'),
      where('organizationId', '==', orgId)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const apts = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        apts.sort((a, b) => String(b.appointmentDate || '').localeCompare(String(a.appointmentDate || '')));
        onUpdate(apts);
      },
      (err) => {
        console.error('[Firestore onSnapshot Appointments Error]:', err);
        if (onError) onError(err);
        handleFirestoreError(err, OperationType.GET, `appointments?orgId=${orgId}`);
      }
    );
  },

  /**
   * Subscribe to authenticated customer appointments by UID (plus phone fallback if needed)
   */
  subscribeToCustomerAppointments(customerUid, onUpdate, onError) {
    if (!customerUid) return () => {};

    const q = query(
      collection(db, 'appointments'),
      where('customerId', '==', customerUid)
    );

    return onSnapshot(
      q,
      (snapshot) => {
        const apts = snapshot.docs.map(d => ({ id: d.id, ...d.data() }));
        apts.sort((a, b) => String(b.appointmentDate || '').localeCompare(String(a.appointmentDate || '')));
        onUpdate(apts);
      },
      (err) => {
        console.warn('[Appointments subscribe warning]', err.message);
        if (onError) onError(err);
      }
    );
  },

  /**
   * Get appointment by ID
   */
  async getAppointmentById(appointmentId) {
    try {
      const snap = await getDoc(doc(db, 'appointments', appointmentId));
      if (snap.exists()) {
        return { id: snap.id, ...snap.data() };
      }
      return null;
    } catch (err) {
      console.warn('[getAppointmentById error]', err.message);
      return null;
    }
  },

  /**
   * Compute available time slots based on service duration and opening hours
   */
  getAvailableSlots(durationMinutes = 30, startHour = 9, endHour = 16) {
    const slots = [];
    const safeDuration = Math.max(Number(durationMinutes) || 30, 10);
    let currentMinutes = startHour * 60;
    const endMinutes = endHour * 60;

    const formatMinutes = (totalMins) => {
      const h24 = Math.floor(totalMins / 60);
      const m = totalMins % 60;
      const period = h24 >= 12 ? 'PM' : 'AM';
      const displayH = h24 > 12 ? h24 - 12 : (h24 === 0 ? 12 : h24);
      return `${String(displayH).padStart(2, '0')}:${String(m).padStart(2, '0')} ${period}`;
    };

    while (currentMinutes + safeDuration <= endMinutes) {
      const nextMinutes = currentMinutes + safeDuration;
      const timeLabel = `${formatMinutes(currentMinutes)} - ${formatMinutes(nextMinutes)}`;
      slots.push({
        id: `slot-${currentMinutes}`,
        time: timeLabel,
        available: true
      });
      currentMinutes = nextMinutes;
    }

    return slots;
  },

  /**
   * Book appointment via authenticated backend API
   */
  async bookAppointment({
    org,
    branch,
    service,
    date,
    timeSlot,
    customerName,
    customerEmail,
    customerPhone,
    notes = ''
  }) {
    const res = await apiFetch('/api/appointments/book', {
      method: 'POST',
      body: JSON.stringify({
        organizationId: org.id,
        branchId: branch.id,
        serviceId: service.id,
        appointmentDate: date,
        timeSlot,
        customerName,
        customerEmail,
        customerPhone,
        notes
      })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to book appointment.');
    }
    return data.data;
  },

  /**
   * Cancel appointment
   */
  async cancelAppointment(appointmentId) {
    const res = await apiFetch(`/api/appointments/${encodeURIComponent(appointmentId)}/cancel`, {
      method: 'POST',
      body: JSON.stringify({})
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to cancel appointment.');
    }
    return true;
  },

  /**
   * Reschedule appointment
   */
  async rescheduleAppointment(appointmentId, appointmentDate, timeSlot) {
    const res = await apiFetch(`/api/appointments/${encodeURIComponent(appointmentId)}/reschedule`, {
      method: 'POST',
      body: JSON.stringify({ appointmentDate, timeSlot })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to reschedule appointment.');
    }
    return data.data;
  },

  /**
   * Staff update appointment status (confirmed, arrived, completed, cancelled, rejected)
   */
  async updateAppointmentStatus(appointmentId, status, notes = '') {
    const res = await apiFetch(`/api/appointments/${encodeURIComponent(appointmentId)}/status`, {
      method: 'POST',
      body: JSON.stringify({ status: String(status).toLowerCase(), notes })
    });

    const data = await res.json();
    if (!res.ok || !data.success) {
      throw new Error(data.error || 'Failed to update appointment status.');
    }
    return data.data;
  }
};
