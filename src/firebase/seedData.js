import { collection, doc, getDocs, writeBatch, query, limit } from 'firebase/firestore';
import { db } from './config.js';
import { sampleOrganizations } from '../data/sampleOrganizations.js';

let seedingInProgress = false;
let isSeeded = false;

export async function ensureDatabaseSeeded() {
  if (isSeeded || seedingInProgress) return;
  seedingInProgress = true;

  try {
    const orgsRef = collection(db, 'organizations');
    const existingSnap = await getDocs(query(orgsRef, limit(1)));

    if (!existingSnap.empty) {
      isSeeded = true;
      seedingInProgress = false;
      return;
    }

    console.log('[Seed] Database empty. Seeding initial institutions, branches, services, and queues into Firestore...');
    const now = new Date().toISOString();
    const today = now.split('T')[0];

    // Seed in batches
    let batch = writeBatch(db);
    let opCount = 0;

    const commitBatchIfFull = async () => {
      if (opCount >= 400) {
        await batch.commit();
        batch = writeBatch(db);
        opCount = 0;
      }
    };

    // 1. Seed Organizations
    for (const org of sampleOrganizations) {
      const orgDocRef = doc(db, 'organizations', org.id);
      batch.set(orgDocRef, {
        id: org.id,
        name: org.name,
        nameNe: org.nameNe || '',
        industryId: org.industryId,
        industryName: org.industryName,
        industryNameNe: org.industryNameNe || '',
        tagline: org.tagline || '',
        taglineNe: org.taglineNe || '',
        city: org.city,
        district: org.district || '',
        province: org.province || '',
        registrationNumber: org.registrationNumber || '',
        website: org.website || '',
        email: org.email || '',
        phone: org.phone || '',
        about: org.about || '',
        aboutNe: org.aboutNe || '',
        ownerUid: 'system_admin',
        ownerName: 'Platform Administrator',
        ownerEmail: 'karkiamir15@gmail.com',
        ownerPhone: '+977 1-4400000',
        status: 'approved',
        verifiedAt: now,
        verifiedBy: 'system',
        createdAt: now,
        updatedAt: now
      });
      opCount++;
      await commitBatchIfFull();

      // 2. Seed Branches
      for (const branch of (org.branches || [])) {
        const branchDocRef = doc(db, 'branches', branch.id);
        batch.set(branchDocRef, {
          id: branch.id,
          organizationId: org.id,
          name: branch.name,
          nameNe: branch.nameNe || '',
          address: branch.address,
          phone: branch.phone,
          email: branch.email,
          operatingHours: branch.operatingHours,
          timezone: org.timezone || 'Asia/Kathmandu',
          isOpen: true,
          isActive: true,
          createdAt: now,
          updatedAt: now
        });
        opCount++;
        await commitBatchIfFull();

        // 3. Seed Counters
        for (const counter of (branch.counters || [])) {
          const counterDocRef = doc(db, 'counters', counter.id);
          batch.set(counterDocRef, {
            id: counter.id,
            organizationId: org.id,
            branchId: branch.id,
            number: counter.number,
            name: counter.name,
            serviceIds: counter.serviceIds || [],
            assignedStaffUid: 'staff_default',
            status: 'Active',
            createdAt: now,
            updatedAt: now
          });
          opCount++;
          await commitBatchIfFull();
        }
      }

      // 4. Seed Services
      for (const srv of (org.services || [])) {
        const srvDocRef = doc(db, 'services', srv.id);
        batch.set(srvDocRef, {
          id: srv.id,
          organizationId: org.id,
          name: srv.name,
          nameNe: srv.nameNe || '',
          code: srv.code,
          category: srv.category,
          categoryNe: srv.categoryNe || '',
          description: srv.description || '',
          descriptionNe: srv.descriptionNe || '',
          estimatedDurationMinutes: srv.estimatedDurationMinutes || 15,
          isPaid: srv.isPaid || false,
          feeAmount: srv.feeAmount || 0,
          feeCurrency: srv.feeCurrency || 'NPR',
          requiredDocuments: srv.requiredDocuments || [],
          isActive: true,
          createdAt: now,
          updatedAt: now
        });
        opCount++;
        await commitBatchIfFull();

        // 5. Seed a Queue for today
        const queueId = `q-${org.id}-${srv.id}-${today}`;
        const queueDocRef = doc(db, 'queues', queueId);
        batch.set(queueDocRef, {
          id: queueId,
          organizationId: org.id,
          branchId: org.branches[0]?.id || '',
          serviceId: srv.id,
          date: today,
          timezone: org.timezone || 'Asia/Kathmandu',
          prefix: srv.code || 'A',
          lastSequence: 4,
          status: 'open',
          waitingCount: 2,
          createdAt: now,
          updatedAt: now
        });
        opCount++;
        await commitBatchIfFull();
      }
    }

    // 6. Seed initial demonstration queue tokens for Patan Hospital
    const defaultOrg = sampleOrganizations[0];
    const defaultBranch = defaultOrg.branches[0];
    const defaultService = defaultOrg.services[0];

    const sampleTokens = [
      {
        id: 'tok-001',
        tokenNumber: 'A-001',
        sequenceNumber: 1,
        organizationId: defaultOrg.id,
        orgName: defaultOrg.name,
        branchId: defaultBranch.id,
        branchName: defaultBranch.name,
        serviceId: defaultService.id,
        serviceName: defaultService.name,
        customerUid: 'cust_ramesh',
        customerName: 'Ramesh Karki',
        customerPhone: '+977 9801234567',
        priority: 'Normal',
        isWalkIn: false,
        status: 'called',
        counterId: defaultBranch.counters[0].id,
        counterName: defaultBranch.counters[0].name,
        peopleAhead: 0,
        issuedAt: new Date(Date.now() - 35 * 60000).toISOString(),
        calledAt: new Date(Date.now() - 2 * 60000).toISOString(),
        updatedAt: now
      },
      {
        id: 'tok-002',
        tokenNumber: 'A-002',
        sequenceNumber: 2,
        organizationId: defaultOrg.id,
        orgName: defaultOrg.name,
        branchId: defaultBranch.id,
        branchName: defaultBranch.name,
        serviceId: defaultService.id,
        serviceName: defaultService.name,
        customerUid: 'cust_sita',
        customerName: 'Sita Sharma',
        customerPhone: '+977 9841122334',
        priority: 'Senior Citizen',
        isWalkIn: false,
        status: 'waiting',
        counterId: '',
        counterName: '',
        peopleAhead: 1,
        issuedAt: new Date(Date.now() - 25 * 60000).toISOString(),
        updatedAt: now
      },
      {
        id: 'tok-003',
        tokenNumber: 'A-003',
        sequenceNumber: 3,
        organizationId: defaultOrg.id,
        orgName: defaultOrg.name,
        branchId: defaultBranch.id,
        branchName: defaultBranch.name,
        serviceId: defaultService.id,
        serviceName: defaultService.name,
        customerUid: 'cust_bikash',
        customerName: 'Bikash Tamang',
        customerPhone: '+977 9812998877',
        priority: 'Normal',
        isWalkIn: true,
        status: 'waiting',
        counterId: '',
        counterName: '',
        peopleAhead: 2,
        issuedAt: new Date(Date.now() - 10 * 60000).toISOString(),
        updatedAt: now
      }
    ];

    for (const tok of sampleTokens) {
      const tokDocRef = doc(db, 'queueTokens', tok.id);
      batch.set(tokDocRef, tok);
      opCount++;
      await commitBatchIfFull();
    }

    // 7. Seed initial appointment
    const sampleAppointment = {
      id: 'apt-001',
      customerId: 'cust_ramesh',
      customerName: 'Ramesh Karki',
      customerEmail: 'ramesh@example.com',
      customerPhone: '+977 9801234567',
      organizationId: defaultOrg.id,
      orgName: defaultOrg.name,
      branchId: defaultBranch.id,
      branchName: defaultBranch.name,
      serviceId: defaultService.id,
      serviceName: defaultService.name,
      appointmentDate: today,
      timeSlot: '11:00 AM - 11:30 AM',
      startTime: '11:00',
      endTime: '11:30',
      status: 'confirmed',
      referenceCode: 'APT-PH-9418',
      notes: 'Consultation for recurring headache',
      createdAt: now,
      updatedAt: now
    };
    batch.set(doc(db, 'appointments', sampleAppointment.id), sampleAppointment);
    opCount++;

    // 8. Bootstrap system admin user
    const adminUser = {
      uid: 'admin_master',
      fullName: 'QUEUELESS Platform Admin',
      email: 'karkiamir15@gmail.com',
      phone: '+977 1-4400000',
      role: 'platform_admin',
      accountStatus: 'active',
      preferredLanguage: 'en',
      notificationPreferences: { sms: false, email: false, inApp: true },
      createdAt: now,
      updatedAt: now
    };
    batch.set(doc(db, 'users', adminUser.uid), adminUser);
    opCount++;

    if (opCount > 0) {
      await batch.commit();
    }

    console.log('[Seed] Database successfully populated with initial multi-industry records.');
    isSeeded = true;
  } catch (err) {
    console.error('[Seed Error] Failed to seed database:', err);
  } finally {
    seedingInProgress = false;
  }
}
