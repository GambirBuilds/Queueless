import {
  doc,
  collection,
  getDoc,
  getDocs,
  setDoc,
  addDoc,
  updateDoc,
  query,
  where,
  runTransaction
} from 'firebase/firestore';
import { db } from '../firebase/config.js';

// Queue token finite state machine transitions
export const VALID_TRANSITIONS = {
  waiting: ['called', 'cancelled'],
  called: ['serving', 'skipped', 'cancelled'],
  serving: ['completed', 'skipped', 'cancelled'],
  skipped: ['called', 'cancelled'],
  completed: [],
  cancelled: [],
};

// Appointment finite state machine transitions
export const VALID_APPOINTMENT_TRANSITIONS = {
  pending: ['confirmed', 'cancelled', 'rejected'],
  confirmed: ['arrived', 'completed', 'cancelled', 'rescheduled'],
  arrived: ['completed', 'cancelled'],
  rescheduled: ['confirmed', 'arrived', 'completed', 'cancelled'],
  completed: [],
  cancelled: [],
  rejected: [],
};

/**
 * Format sequence to padded token number, e.g. A-001
 */
export function formatTokenNumber(prefix, seq) {
  const cleanPrefix = (prefix || 'A').toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 3) || 'A';
  return `${cleanPrefix}-${String(seq).padStart(3, '0')}`;
}

/**
 * Compute business date (YYYY-MM-DD) in an organization's configured timezone.
 * Defaults to Asia/Kathmandu when Nepal-based, while supporting any IANA timezone.
 */
export function getBusinessDateInTimezone(timezone = 'Asia/Kathmandu', date = new Date()) {
  try {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: timezone || 'Asia/Kathmandu',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  } catch {
    return new Intl.DateTimeFormat('en-CA', {
      timeZone: 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit'
    }).format(date);
  }
}

/**
 * Attach live today's queueStatus ('open' | 'paused' | 'closed') to each service of an organization
 */
export function mergeServiceQueueStatuses(services = [], queues = [], organizationId, businessDate) {
  return services
    .filter(s => s.organizationId === organizationId)
    .map(srv => {
      const queueDocId = `q-${organizationId}-${srv.id}-${businessDate}`;
      const match = queues.find(
        q => q.id === queueDocId || (q.organizationId === organizationId && q.serviceId === srv.id && q.date === businessDate)
      );
      return {
        ...srv,
        queueStatus: match?.status || 'open'
      };
    });
}

/**
 * Atomic Join Queue Engine
 * Atomically checks queue status, increments sequence, and writes token inside a Firestore transaction.
 */
export async function joinQueueAtomic(data) {
  const {
    organizationId,
    branchId,
    serviceId,
    customerName,
    customerPhone,
    customerUid = 'guest_user',
    priority = 'Normal',
    notes = '',
    isWalkIn = false
  } = data;

  const now = new Date();

  // 1. Verify Organization is Approved
  const orgRef = doc(db, 'organizations', organizationId);
  const orgSnap = await getDoc(orgRef);
  if (!orgSnap.exists()) {
    throw new Error('Organization not found.');
  }
  const orgData = orgSnap.data();
  if (orgData.status !== 'approved' && !orgData.isDemo) {
    throw new Error('Organization is pending verification or suspended. Queue unavailable.');
  }

  // 2. Fetch Service Details & Check Availability
  const srvRef = doc(db, 'services', serviceId);
  const srvSnap = await getDoc(srvRef);
  if (!srvSnap.exists()) {
    throw new Error('Service counter not found.');
  }
  const srvData = srvSnap.data();
  if (srvData.isActive === false) {
    throw new Error(`Service "${srvData.name}" is currently unavailable.`);
  }
  if (srvData.organizationId && srvData.organizationId !== organizationId) {
    throw new Error('Service does not belong to the selected organization.');
  }

  // 3. Fetch Branch Details & Check Opening Status
  const branchRef = doc(db, 'branches', branchId);
  const branchSnap = await getDoc(branchRef);
  const branchData = branchSnap.exists() ? branchSnap.data() : { name: 'Main Branch', isOpen: true };
  if (branchSnap.exists() && branchData.organizationId && branchData.organizationId !== organizationId) {
    throw new Error('Branch does not belong to the selected organization.');
  }
  if (branchData.isOpen === false) {
    throw new Error(`Branch "${branchData.name}" is currently closed.`);
  }

  // Resolve timezone (respecting org/branch timezone, defaulting to Asia/Kathmandu)
  const timezone = branchData.timezone || orgData.timezone || 'Asia/Kathmandu';
  const today = getBusinessDateInTimezone(timezone, now);

  // 4. Duplicate Active Token Check (same customer phone OR authenticated UID in same service today)
  const tokensRef = collection(db, 'queueTokens');
  const existingActiveQuery = query(
    tokensRef,
    where('organizationId', '==', organizationId),
    where('serviceId', '==', serviceId),
    where('date', '==', today)
  );
  const existingSnap = await getDocs(existingActiveQuery);
  const hasActiveToken = existingSnap.docs.some(d => {
    const t = d.data();
    const isActiveState = t.status === 'waiting' || t.status === 'called' || t.status === 'serving';
    if (!isActiveState) return false;
    const samePhone = t.customerPhone === customerPhone;
    const sameUid = customerUid && customerUid !== 'guest_user' && t.customerUid === customerUid;
    return samePhone || sameUid;
  });

  if (hasActiveToken) {
    throw new Error(`Customer (${customerPhone}) already holds an active token for ${srvData.name} today. Please complete or cancel current token before joining again.`);
  }

  const waitingCountEstimate = existingSnap.docs.filter(d => d.data().status === 'waiting').length;

  // 5. Atomic Sequence Increment + Token Creation Inside Transaction
  const queueDocId = `q-${organizationId}-${serviceId}-${today}`;
  const queueRef = doc(db, 'queues', queueDocId);
  const tokenDocRef = doc(collection(db, 'queueTokens'));

  let tokenRecord = null;

  await runTransaction(db, async (transaction) => {
    const queueDoc = await transaction.get(queueRef);

    let nextSeq = 1;
    if (!queueDoc.exists()) {
      transaction.set(queueRef, {
        id: queueDocId,
        organizationId,
        branchId,
        serviceId,
        date: today,
        timezone,
        prefix: srvData.code || 'A',
        lastSequence: 1,
        status: 'open',
        waitingCount: 1,
        createdAt: now.toISOString(),
        updatedAt: now.toISOString()
      });
    } else {
      const qData = queueDoc.data();
      if (qData.status === 'closed') {
        throw new Error('Queue is closed for today.');
      }
      if (qData.status === 'paused') {
        throw new Error('Queue is temporarily paused. Please check back shortly.');
      }
      nextSeq = (qData.lastSequence || 0) + 1;
      transaction.update(queueRef, {
        lastSequence: nextSeq,
        waitingCount: (qData.waitingCount || 0) + 1,
        updatedAt: now.toISOString()
      });
    }

    const tokenNum = formatTokenNumber(srvData.code || 'A', nextSeq);

    tokenRecord = {
      id: tokenDocRef.id,
      tokenNumber: tokenNum,
      sequenceNumber: nextSeq,
      organizationId,
      orgName: orgData.name,
      branchId,
      branchName: branchData.name,
      serviceId,
      serviceName: srvData.name,
      queueId: queueDocId,
      date: today,
      timezone,
      customerUid,
      customerName,
      customerPhone,
      priority,
      isWalkIn,
      status: 'waiting',
      counterId: '',
      counterName: '',
      staffUid: '',
      peopleAhead: waitingCountEstimate,
      notes,
      issuedAt: now.toISOString(),
      calledAt: null,
      servingAt: null,
      completedAt: null,
      updatedAt: now.toISOString()
    };

    transaction.set(tokenDocRef, tokenRecord);
  });

  // Write In-App Notification
  await addDoc(collection(db, 'notifications'), {
    recipientUserId: customerUid,
    organizationId,
    type: 'TOKEN_ISSUED',
    title: `Token ${tokenRecord.tokenNumber} Issued`,
    message: `Your queue token ${tokenRecord.tokenNumber} for ${srvData.name} has been issued. There are ${waitingCountEstimate} citizens ahead of you.`,
    read: false,
    relatedTokenId: tokenDocRef.id,
    createdAt: now.toISOString()
  });

  // Write Audit Log
  await addDoc(collection(db, 'auditLogs'), {
    organizationId,
    actorUid: customerUid,
    actorEmail: customerPhone,
    action: 'TOKEN_ISSUED',
    entityType: 'QueueToken',
    entityId: tokenDocRef.id,
    details: `Issued token ${tokenRecord.tokenNumber} for customer ${customerName} (${customerPhone})`,
    timestamp: now.toISOString()
  });

  return tokenRecord;
}

/**
 * Toggle Queue Status (Open, Pause, Close)
 */
export async function toggleQueueStatusAtomic({ organizationId, branchId, serviceId, status, actorUid }) {
  const now = new Date();
  const orgSnap = await getDoc(doc(db, 'organizations', organizationId));
  const timezone = orgSnap.exists() ? (orgSnap.data().timezone || 'Asia/Kathmandu') : 'Asia/Kathmandu';
  const today = getBusinessDateInTimezone(timezone, now);

  const queueDocId = `q-${organizationId}-${serviceId}-${today}`;
  const queueRef = doc(db, 'queues', queueDocId);
  const queueSnap = await getDoc(queueRef);

  if (!queueSnap.exists()) {
    await setDoc(queueRef, {
      id: queueDocId,
      organizationId,
      branchId,
      serviceId,
      date: today,
      timezone,
      prefix: 'A',
      lastSequence: 0,
      status,
      waitingCount: 0,
      createdAt: now.toISOString(),
      updatedAt: now.toISOString()
    });
  } else {
    await updateDoc(queueRef, {
      status,
      updatedAt: now.toISOString()
    });
  }

  await addDoc(collection(db, 'auditLogs'), {
    organizationId,
    actorUid,
    action: `QUEUE_${status.toUpperCase()}`,
    entityType: 'Queue',
    entityId: queueDocId,
    details: `Queue status changed to '${status}' for service ${serviceId} on ${today} (${timezone})`,
    timestamp: now.toISOString()
  });

  return { id: queueDocId, organizationId, branchId, serviceId, date: today, status };
}

/**
 * Atomic Call Next Token Engine
 */
export async function callNextAtomic(data) {
  const { organizationId, branchId, counterId, serviceId, staffUid = 'staff_operator' } = data;
  const now = new Date();

  // 1. Fetch Counter & Validate Branch Isolation
  const counterRef = doc(db, 'counters', counterId);
  const counterSnap = await getDoc(counterRef);
  if (!counterSnap.exists()) {
    throw new Error('Counter desk not found.');
  }
  const counterData = counterSnap.data();
  if (counterData.branchId && counterData.branchId !== branchId) {
    throw new Error('Forbidden: Counter desk does not belong to the requested branch.');
  }

  // 2. Query Waiting Tokens for this branch
  const tokensRef = collection(db, 'queueTokens');
  const waitingQuery = query(
    tokensRef,
    where('organizationId', '==', organizationId),
    where('branchId', '==', branchId),
    where('status', '==', 'waiting')
  );
  const waitingSnap = await getDocs(waitingQuery);

  if (waitingSnap.empty) {
    throw new Error('No waiting customers in the queue for this counter station.');
  }

  let eligibleTokens = waitingSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  if (serviceId && serviceId !== 'all') {
    eligibleTokens = eligibleTokens.filter(t => t.serviceId === serviceId);
  } else if (counterData.serviceIds && counterData.serviceIds.length > 0) {
    eligibleTokens = eligibleTokens.filter(t => counterData.serviceIds.includes(t.serviceId));
  }

  if (eligibleTokens.length === 0) {
    throw new Error('No waiting customers matching the services supported by this desk.');
  }

  // Sort: Priority triage first (Urgent > Senior Citizen > Normal), then arrival time
  const priorityWeight = { 'Urgent': 3, 'Senior Citizen': 2, 'Normal': 1 };
  eligibleTokens.sort((a, b) => {
    const pwA = priorityWeight[a.priority] || 1;
    const pwB = priorityWeight[b.priority] || 1;
    if (pwB !== pwA) return pwB - pwA;
    return new Date(a.issuedAt).getTime() - new Date(b.issuedAt).getTime();
  });

  const nextCandidate = eligibleTokens[0];
  const targetTokenRef = doc(db, 'queueTokens', nextCandidate.id);

  // 3. Concurrency Protection via Transaction
  let assignedToken = null;

  await runTransaction(db, async (transaction) => {
    const freshCounterDoc = await transaction.get(counterRef);
    const freshTokenDoc = await transaction.get(targetTokenRef);
    if (!freshTokenDoc.exists()) {
      throw new Error('Candidate token record disappeared.');
    }

    if (freshCounterDoc.exists() && freshCounterDoc.data().currentServingTokenId) {
      const activeId = freshCounterDoc.data().currentServingTokenId;
      if (activeId !== nextCandidate.id) {
        const activeSnap = await transaction.get(doc(db, 'queueTokens', activeId));
        if (activeSnap.exists() && ['called', 'serving'].includes(activeSnap.data().status)) {
          throw new Error('Conflict: This counter desk is already serving an active token.');
        }
      }
    }

    const freshData = freshTokenDoc.data();
    if (freshData.status !== 'waiting') {
      throw new Error(`Conflict: Token ${freshData.tokenNumber} was just called or modified by another desk operator.`);
    }

    assignedToken = {
      ...freshData,
      status: 'called',
      counterId,
      counterName: counterData.name || `Desk #${counterData.number}`,
      staffUid,
      calledAt: now.toISOString(),
      updatedAt: now.toISOString()
    };

    transaction.update(targetTokenRef, {
      status: 'called',
      counterId,
      counterName: counterData.name || `Desk #${counterData.number}`,
      staffUid,
      calledAt: now.toISOString(),
      updatedAt: now.toISOString()
    });

    transaction.update(counterRef, {
      currentServingTokenId: nextCandidate.id,
      updatedAt: now.toISOString()
    });
  });

  // Write Audit Log
  await addDoc(collection(db, 'auditLogs'), {
    organizationId,
    actorUid: staffUid,
    action: 'TOKEN_CALLED',
    entityType: 'QueueToken',
    entityId: nextCandidate.id,
    details: `Counter ${counterData.name} called token ${assignedToken.tokenNumber} (${assignedToken.customerName})`,
    timestamp: now.toISOString()
  });

  // Write In-App Notification
  if (assignedToken.customerUid && assignedToken.customerUid !== 'guest_user') {
    await addDoc(collection(db, 'notifications'), {
      recipientUserId: assignedToken.customerUid,
      organizationId,
      type: 'TOKEN_CALLED',
      title: `Token ${assignedToken.tokenNumber} Called!`,
      message: `Your token ${assignedToken.tokenNumber} has been called to ${assignedToken.counterName}. Please proceed directly to the desk.`,
      read: false,
      relatedTokenId: nextCandidate.id,
      createdAt: now.toISOString()
    });
  }

  return assignedToken;
}

/**
 * State Transition Engine
 */
export async function transitionTokenStatus(data) {
  const { tokenId, status: newStatus, counterId, counterName, staffUid = 'staff_operator', notes = '' } = data;
  const now = new Date();

  const tokenRef = doc(db, 'queueTokens', tokenId);
  const tokenSnap = await getDoc(tokenRef);
  if (!tokenSnap.exists()) {
    throw new Error('Queue token not found.');
  }

  const token = tokenSnap.data();
  const currentStatus = token.status;

  // Validate state machine rule
  const allowed = VALID_TRANSITIONS[currentStatus] || [];
  if (!allowed.includes(newStatus)) {
    throw new Error(`Invalid state transition: Cannot change token from '${currentStatus}' to '${newStatus}'. Allowed: [${allowed.join(', ')}]`);
  }

  const updates = {
    status: newStatus,
    updatedAt: now.toISOString()
  };

  if (counterId) updates.counterId = counterId;
  if (counterName) updates.counterName = counterName;
  if (staffUid) updates.staffUid = staffUid;

  if (newStatus === 'serving') {
    updates.servingAt = now.toISOString();
  } else if (newStatus === 'completed') {
    updates.completedAt = now.toISOString();
  }

  await updateDoc(tokenRef, updates);

  // Release counter if completed/cancelled/skipped
  if (newStatus === 'completed' || newStatus === 'cancelled' || newStatus === 'skipped') {
    if (token.counterId) {
      const counterRef = doc(db, 'counters', token.counterId);
      const cSnap = await getDoc(counterRef);
      if (cSnap.exists() && cSnap.data().currentServingTokenId === tokenId) {
        await updateDoc(counterRef, {
          currentServingTokenId: null,
          updatedAt: now.toISOString()
        });
      }
    }
  }

  // Audit Log
  await addDoc(collection(db, 'auditLogs'), {
    organizationId: token.organizationId,
    actorUid: staffUid,
    action: `TOKEN_${newStatus.toUpperCase()}`,
    entityType: 'QueueToken',
    entityId: tokenId,
    details: `Transitioned token ${token.tokenNumber} from ${currentStatus} to ${newStatus}${notes ? ` (${notes})` : ''}`,
    timestamp: now.toISOString()
  });

  return { ...token, ...updates };
}

/**
 * Persistent Appointment Booking Engine
 */
export async function bookAppointmentAtomic(data) {
  const {
    customerId,
    organizationId,
    branchId,
    serviceId,
    appointmentDate,
    timeSlot,
    customerName,
    customerEmail,
    customerPhone,
    notes = ''
  } = data;

  const now = new Date();

  // Validate Org
  const orgRef = doc(db, 'organizations', organizationId);
  const orgSnap = await getDoc(orgRef);
  if (!orgSnap.exists()) throw new Error('Organization not found.');
  const orgData = orgSnap.data();
  if (orgData.status !== 'approved' && !orgData.isDemo) {
    throw new Error('Organization is pending verification or suspended.');
  }

  // Validate Service
  const srvRef = doc(db, 'services', serviceId);
  const srvSnap = await getDoc(srvRef);
  if (!srvSnap.exists()) throw new Error('Service not found.');
  const srvData = srvSnap.data();
  if (srvData.isActive === false) {
    throw new Error(`Service "${srvData.name}" is currently unavailable for appointments.`);
  }

  // Validate Branch & Timezone
  const branchRef = doc(db, 'branches', branchId);
  const branchSnap = await getDoc(branchRef);
  const branchData = branchSnap.exists() ? branchSnap.data() : { name: 'Main Branch', isOpen: true };
  if (branchData.isOpen === false) {
    throw new Error(`Branch "${branchData.name}" is currently closed.`);
  }

  const timezone = branchData.timezone || orgData.timezone || 'Asia/Kathmandu';
  const todayInOrgTz = getBusinessDateInTimezone(timezone, now);
  if (appointmentDate < todayInOrgTz) {
    throw new Error(`Cannot book appointment in the past (${appointmentDate} < ${todayInOrgTz} in ${timezone}).`);
  }

  // Check Capacity for Slot & Prevent Duplicate Customer Slot Booking
  const maxCapacity = Number(srvData.maxSlotCapacity) || 4;
  const aptRef = collection(db, 'appointments');
  const slotQuery = query(
    aptRef,
    where('organizationId', '==', organizationId),
    where('branchId', '==', branchId),
    where('serviceId', '==', serviceId),
    where('appointmentDate', '==', appointmentDate),
    where('timeSlot', '==', timeSlot)
  );
  const slotSnap = await getDocs(slotQuery);
  const activeBookings = slotSnap.docs.filter(d => d.data().status !== 'cancelled' && d.data().status !== 'rejected');

  const duplicateCustomer = activeBookings.some(d => {
    const b = d.data();
    return b.customerId === customerId || b.customerPhone === customerPhone;
  });
  if (duplicateCustomer) {
    throw new Error(`You already have a confirmed booking for ${timeSlot} on ${appointmentDate}.`);
  }

  if (activeBookings.length >= maxCapacity) {
    throw new Error(`Time slot ${timeSlot} on ${appointmentDate} has reached maximum appointment capacity (${maxCapacity}). Please select another slot.`);
  }

  const randomRef = Math.floor(1000 + Math.random() * 9000);
  const refCode = `APT-${srvData.code || 'SVC'}-${randomRef}`;
  const aptDocRef = doc(collection(db, 'appointments'));

  const appointmentRecord = {
    id: aptDocRef.id,
    customerId,
    organizationId,
    orgName: orgData.name,
    branchId,
    branchName: branchData.name,
    serviceId,
    serviceName: srvData.name,
    serviceDurationMinutes: srvData.estimatedDurationMinutes || 30,
    timezone,
    appointmentDate,
    timeSlot,
    startTime: timeSlot.split(' - ')[0] || timeSlot,
    endTime: timeSlot.split(' - ')[1] || '',
    status: 'confirmed',
    customerName,
    customerEmail,
    customerPhone,
    referenceCode: refCode,
    notes,
    createdAt: now.toISOString(),
    updatedAt: now.toISOString()
  };

  await setDoc(aptDocRef, appointmentRecord);

  // Notifications
  await addDoc(collection(db, 'notifications'), {
    recipientUserId: customerId,
    organizationId,
    type: 'APPOINTMENT_CONFIRMED',
    title: 'Appointment Confirmed',
    message: `Your appointment for ${srvData.name} on ${appointmentDate} at ${timeSlot} (${timezone}) is confirmed. Reference: ${refCode}.`,
    read: false,
    relatedAppointmentId: aptDocRef.id,
    createdAt: now.toISOString()
  });

  // Audit Log
  await addDoc(collection(db, 'auditLogs'), {
    organizationId,
    actorUid: customerId,
    actorEmail: customerEmail,
    action: 'APPOINTMENT_BOOKED',
    entityType: 'Appointment',
    entityId: aptDocRef.id,
    details: `Booked appointment ${refCode} for ${customerName} (${timezone})`,
    timestamp: now.toISOString()
  });

  return appointmentRecord;
}

/**
 * Recall Token Engine (Re-announce token to desk)
 */
export async function recallTokenAtomic(data) {
  const { tokenId, counterId, staffUid = 'staff_operator' } = data;
  const now = new Date();

  const tokenRef = doc(db, 'queueTokens', tokenId);
  const tokenSnap = await getDoc(tokenRef);
  if (!tokenSnap.exists()) {
    throw new Error('Queue token not found.');
  }

  const token = tokenSnap.data();
  if (token.status !== 'called' && token.status !== 'skipped' && token.status !== 'serving') {
    throw new Error(`Cannot recall token in '${token.status}' state. Token must be called, serving, or on-hold.`);
  }

  await updateDoc(tokenRef, {
    status: 'called',
    calledAt: now.toISOString(),
    updatedAt: now.toISOString()
  });

  await addDoc(collection(db, 'auditLogs'), {
    organizationId: token.organizationId,
    actorUid: staffUid,
    action: 'TOKEN_RECALLED',
    entityType: 'QueueToken',
    entityId: tokenId,
    details: `Recalled token ${token.tokenNumber} to counter ${token.counterName || counterId}`,
    timestamp: now.toISOString()
  });

  if (token.customerUid && token.customerUid !== 'guest_user') {
    await addDoc(collection(db, 'notifications'), {
      recipientUserId: token.customerUid,
      organizationId: token.organizationId,
      type: 'TOKEN_CALLED',
      title: `Recall: Token ${token.tokenNumber}`,
      message: `Token ${token.tokenNumber} is being recalled to ${token.counterName || 'Counter'}. Please report immediately.`,
      read: false,
      relatedTokenId: tokenId,
      createdAt: now.toISOString()
    });
  }

  return { ...token, status: 'called', calledAt: now.toISOString() };
}

/**
 * Reschedule Appointment Engine
 */
export async function rescheduleAppointmentAtomic(data) {
  const { appointmentId, appointmentDate, timeSlot, actorUid = 'user' } = data;
  const now = new Date();

  const aptRef = doc(db, 'appointments', appointmentId);
  const aptSnap = await getDoc(aptRef);
  if (!aptSnap.exists()) {
    throw new Error('Appointment not found.');
  }

  const apt = aptSnap.data();
  if (apt.status === 'cancelled' || apt.status === 'completed') {
    throw new Error(`Cannot reschedule a ${apt.status} appointment.`);
  }

  const timezone = apt.timezone || 'Asia/Kathmandu';
  const todayInTz = getBusinessDateInTimezone(timezone, now);
  if (appointmentDate < todayInTz) {
    throw new Error(`Cannot reschedule to a past date (${appointmentDate} < ${todayInTz}).`);
  }

  const aptsColl = collection(db, 'appointments');
  const slotQuery = query(
    aptsColl,
    where('organizationId', '==', apt.organizationId),
    where('branchId', '==', apt.branchId),
    where('serviceId', '==', apt.serviceId),
    where('appointmentDate', '==', appointmentDate),
    where('timeSlot', '==', timeSlot)
  );
  const slotSnap = await getDocs(slotQuery);
  const activeBookings = slotSnap.docs.filter(
    d => d.id !== appointmentId && d.data().status !== 'cancelled' && d.data().status !== 'rejected'
  );

  if (activeBookings.length >= 4) {
    throw new Error(`Target time slot ${timeSlot} on ${appointmentDate} is fully booked.`);
  }

  await updateDoc(aptRef, {
    appointmentDate,
    timeSlot,
    startTime: timeSlot.split(' - ')[0] || timeSlot,
    endTime: timeSlot.split(' - ')[1] || '',
    status: 'rescheduled',
    updatedAt: now.toISOString()
  });

  await addDoc(collection(db, 'auditLogs'), {
    organizationId: apt.organizationId,
    actorUid,
    action: 'APPOINTMENT_RESCHEDULED',
    entityType: 'Appointment',
    entityId: appointmentId,
    details: `Rescheduled ${apt.referenceCode} to ${appointmentDate} at ${timeSlot} (${timezone})`,
    timestamp: now.toISOString()
  });

  return { ...apt, appointmentDate, timeSlot, status: 'rescheduled' };
}

/**
 * Update Appointment Status with State Machine Verification
 */
export async function updateAppointmentStatusAtomic({ appointmentId, status, actorUid, notes = '' }) {
  const now = new Date().toISOString();
  const aptRef = doc(db, 'appointments', appointmentId);
  const aptSnap = await getDoc(aptRef);
  if (!aptSnap.exists()) {
    throw new Error('Appointment not found.');
  }
  const apt = aptSnap.data();
  const current = (apt.status || 'confirmed').toLowerCase();
  const next = status.toLowerCase();
  const allowed = VALID_APPOINTMENT_TRANSITIONS[current] || [];
  if (!allowed.includes(next)) {
    throw new Error(`Invalid appointment status transition from '${current}' to '${next}'.`);
  }

  await updateDoc(aptRef, {
    status: next,
    notes: notes || apt.notes || '',
    updatedAt: now
  });

  await addDoc(collection(db, 'auditLogs'), {
    organizationId: apt.organizationId,
    actorUid,
    action: `APPOINTMENT_${next.toUpperCase()}`,
    entityType: 'Appointment',
    entityId: appointmentId,
    details: `Updated appointment ${apt.referenceCode} status from ${current} to ${next}`,
    timestamp: now
  });

  return { ...apt, status: next, updatedAt: now };
}

/**
 * Real Database-Backed Platform Overview Stats
 */
export async function getPlatformOverviewStats() {
  const [usersSnap, orgsSnap, branchesSnap, tokensSnap, appointmentsSnap, queuesSnap] = await Promise.all([
    getDocs(collection(db, 'users')),
    getDocs(collection(db, 'organizations')),
    getDocs(collection(db, 'branches')),
    getDocs(collection(db, 'queueTokens')),
    getDocs(collection(db, 'appointments')),
    getDocs(collection(db, 'queues'))
  ]);

  const users = usersSnap.docs.map(d => d.data());
  const orgs = orgsSnap.docs.map(d => d.data());
  const tokens = tokensSnap.docs.map(d => d.data());
  const appointments = appointmentsSnap.docs.map(d => d.data());
  const queues = queuesSnap.docs.map(d => d.data());

  const totalRegisteredCustomers = users.filter(u => u.role === 'customer' || !u.role).length;
  const totalOrganizations = orgs.length;
  const pendingOrganizations = orgs.filter(o => o.status === 'pending_verification').length;
  const approvedOrganizations = orgs.filter(o => o.status === 'approved' || o.isDemo).length;
  const suspendedOrganizations = orgs.filter(o => o.status === 'suspended').length;
  const totalBranches = branchesSnap.size;

  const activeQueues = queues.filter(q => q.status === 'open').length;
  const tokensIssued = tokens.length;
  const completedServices = tokens.filter(t => t.status === 'completed').length;
  const totalAppointments = appointments.length;

  return {
    totalRegisteredCustomers,
    totalOrganizations,
    pendingOrganizations,
    approvedOrganizations,
    suspendedOrganizations,
    totalBranches,
    activeQueues,
    tokensIssued,
    completedServices,
    totalAppointments,
    tokensByStatus: {
      waiting: tokens.filter(t => t.status === 'waiting').length,
      called: tokens.filter(t => t.status === 'called').length,
      serving: tokens.filter(t => t.status === 'serving').length,
      completed: completedServices,
      skipped: tokens.filter(t => t.status === 'skipped').length,
      cancelled: tokens.filter(t => t.status === 'cancelled').length
    },
    systemHealth: 'Operational',
    timezone: 'Asia/Kathmandu (NPT)'
  };
}

/**
 * Real Comprehensive Reports & Analytics (Zero Fabricated Metrics)
 */
export async function getComprehensiveReports(organizationId = null) {
  const [tokensSnap, appointmentsSnap] = await Promise.all([
    getDocs(collection(db, 'queueTokens')),
    getDocs(collection(db, 'appointments'))
  ]);

  let timezone = 'Asia/Kathmandu';
  if (organizationId) {
    const orgSnap = await getDoc(doc(db, 'organizations', organizationId));
    if (orgSnap.exists() && orgSnap.data().timezone) {
      timezone = orgSnap.data().timezone;
    }
  }

  let tokens = tokensSnap.docs.map(d => ({ id: d.id, ...d.data() }));
  let appointments = appointmentsSnap.docs.map(d => ({ id: d.id, ...d.data() }));

  if (organizationId) {
    tokens = tokens.filter(t => t.organizationId === organizationId);
    appointments = appointments.filter(a => a.organizationId === organizationId);
  }

  const now = new Date();
  const todayStr = getBusinessDateInTimezone(timezone, now);

  const oneWeekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000);
  const oneMonthAgo = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000);

  const completedTokens = tokens.filter(t => t.status === 'completed');
  const dailyServed = completedTokens.filter(t => {
    const refDate = t.completedAt ? getBusinessDateInTimezone(timezone, new Date(t.completedAt)) : t.date;
    return refDate === todayStr;
  }).length;
  const weeklyServed = completedTokens.filter(t => new Date(t.completedAt || t.issuedAt) >= oneWeekAgo).length;
  const monthlyServed = completedTokens.filter(t => new Date(t.completedAt || t.issuedAt) >= oneMonthAgo).length;

  // Actual Historical Service Duration (NEVER fabricated if 0 completed samples)
  let totalDurationMinutes = 0;
  let durationCount = 0;
  completedTokens.forEach(t => {
    if (t.servingAt && t.completedAt) {
      const dur = (new Date(t.completedAt).getTime() - new Date(t.servingAt).getTime()) / (1000 * 60);
      if (dur > 0 && dur < 240) {
        totalDurationMinutes += dur;
        durationCount++;
      }
    }
  });
  const avgServiceDuration = durationCount > 0 ? (totalDurationMinutes / durationCount).toFixed(1) : null;

  const totalIssued = tokens.length;
  const tokenCompletionRate = totalIssued > 0 ? `${((completedTokens.length / totalIssued) * 100).toFixed(1)}%` : '0.0%';
  const cancelledCount = tokens.filter(t => t.status === 'cancelled').length;
  const skippedCount = tokens.filter(t => t.status === 'skipped').length;

  const totalAppts = appointments.length;
  const completedAppts = appointments.filter(a => a.status === 'completed').length;
  const apptCompletionRate = totalAppts > 0 ? `${((completedAppts / totalAppts) * 100).toFixed(1)}%` : '0.0%';

  const branchMap = {};
  tokens.forEach(t => {
    const bName = t.branchName || 'Main Branch';
    if (!branchMap[bName]) {
      branchMap[bName] = { branchName: bName, total: 0, completed: 0, waiting: 0 };
    }
    branchMap[bName].total++;
    if (t.status === 'completed') branchMap[bName].completed++;
    if (t.status === 'waiting') branchMap[bName].waiting++;
  });

  const serviceMap = {};
  tokens.forEach(t => {
    const sName = t.serviceName || 'General Service';
    if (!serviceMap[sName]) {
      serviceMap[sName] = { serviceName: sName, total: 0, completed: 0 };
    }
    serviceMap[sName].total++;
    if (t.status === 'completed') serviceMap[sName].completed++;
  });

  const counterMap = {};
  tokens.forEach(t => {
    if (t.counterName) {
      if (!counterMap[t.counterName]) {
        counterMap[t.counterName] = { counterName: t.counterName, served: 0 };
      }
      if (t.status === 'completed' || t.status === 'serving') {
        counterMap[t.counterName].served++;
      }
    }
  });

  return {
    dailyServed,
    weeklyServed,
    monthlyServed,
    avgServiceDuration,
    durationSampleCount: durationCount,
    tokenCompletionRate,
    cancelledTokens: cancelledCount,
    skippedTokens: skippedCount,
    appointmentCompletionRate,
    totalTokens: tokens.length,
    totalAppointments: appointments.length,
    branchComparisons: Object.values(branchMap),
    serviceComparisons: Object.values(serviceMap),
    counterActivity: Object.values(counterMap),
    periodLabel: 'Last 30 Days (Rolling)',
    timezone
  };
}
