/**
 * Sample Demonstration Organizations for QUEUELESS
 *
 * NOTE: All organizations, branches, and contact points listed here are strictly
 * simulated sample profiles for demonstration and testing purposes.
 * Live data syncing will be established in Stage 2 with Cloud Firestore.
 */

export const sampleOrganizations = [
  {
    id: 'org-health-01',
    isDemo: true,
    name: 'Patan Regional Hospital & Diagnostic Center',
    nameNe: 'पाटन क्षेत्रीय अस्पताल तथा निदान केन्द्र',
    industryId: 'healthcare',
    industryName: 'Healthcare',
    industryNameNe: 'स्वास्थ्य सेवा',
    tagline: 'Comprehensive secondary and tertiary outpatient healthcare services.',
    taglineNe: 'विस्तृत दोस्रो र तेस्रो तहको बहिरंग स्वास्थ्य सेवा।',
    city: 'Lalitpur',
    district: 'Lalitpur',
    province: 'Bagmati Province',
    verifiedStatus: 'demo_verified',
    establishedYear: 2012,
    registrationNumber: 'MED-NP-99214',
    website: 'https://demo-patan-hospital.example.org',
    email: 'info@demo-patanhospital.example.org',
    phone: '+977 1-5521000',
    about: 'Patan Regional Hospital serves over 1,200 outpatient visitors daily across specialty departments including General Medicine, Pediatrics, Orthopedics, and Gynecology. The hospital is piloting QUEUELESS to streamline appointment booking and morning OPD registration queues.',
    aboutNe: 'पाटन क्षेत्रीय अस्पतालले दैनिक १,२०० भन्दा बढी बहिरंग बिरामीहरूलाई जनरल मेडिसिन, बालरोग, हाडजोर्नी र स्त्रीरोग लगायतका विभागहरूबाट सेवा प्रदान गर्दछ।',
    branches: [
      {
        id: 'branch-ph-main',
        name: 'Main Central Campus',
        nameNe: 'मुख्य केन्द्रीय परिसर',
        address: 'Lagankhel, Lalitpur, Nepal',
        phone: '+977 1-5521001',
        email: 'main@demo-patanhospital.example.org',
        operatingHours: 'Sun - Fri: 07:30 AM - 04:30 PM (Sat: Emergency Only)',
        counters: [
          { id: 'c-ph-01', number: '1', name: 'OPD Ticket & Registration Desk A', serviceIds: ['srv-ph-ticket'] },
          { id: 'c-ph-02', number: '2', name: 'OPD Ticket & Registration Desk B', serviceIds: ['srv-ph-ticket'] },
          { id: 'c-ph-03', number: '3', name: 'Diagnostic Lab Sample Submission', serviceIds: ['srv-ph-lab'] },
          { id: 'c-ph-04', number: '4', name: 'Radiology & Ultrasound Booking', serviceIds: ['srv-ph-radio'] },
          { id: 'c-ph-05', number: '5', name: 'Senior Citizen & Special Priority Desk', serviceIds: ['srv-ph-ticket', 'srv-ph-lab'] }
        ],
        serviceIds: ['srv-ph-ticket', 'srv-ph-lab', 'srv-ph-radio', 'srv-ph-cardio']
      },
      {
        id: 'branch-ph-annex',
        name: 'Kumaripati Specialist Poly-Clinic Annex',
        nameNe: 'कुमारीपाटी विशेषज्ञ पोलिक्लिनिक शाखा',
        address: 'Kumaripati Main Road, Lalitpur, Nepal',
        phone: '+977 1-5534200',
        email: 'annex@demo-patanhospital.example.org',
        operatingHours: 'Sun - Fri: 09:00 AM - 05:00 PM',
        counters: [
          { id: 'c-ph-a1', number: '1', name: 'Specialist Consultation Check-in', serviceIds: ['srv-ph-specialist'] },
          { id: 'c-ph-a2', number: '2', name: 'Pathology & Blood Draw', serviceIds: ['srv-ph-lab'] }
        ],
        serviceIds: ['srv-ph-specialist', 'srv-ph-lab']
      }
    ],
    services: [
      {
        id: 'srv-ph-ticket',
        name: 'General OPD Registration & Token',
        nameNe: 'सामान्य ओपीडी दर्ता तथा टोकन',
        code: 'MED-OPD-01',
        category: 'Outpatient Registration',
        estimatedDurationMinutes: 8,
        feeAmount: 150,
        feeCurrency: 'NPR',
        isPaid: true,
        requiredDocuments: [
          'National Identity Card or Citizenship (or Birth Certificate for minors)',
          'Previous Hospital Patient Book / ID (if follow-up visit)',
          'Health Insurance Board Card (if seeking government subsidy claims)'
        ],
        description: 'Primary counter registration for daily doctor appointments across General Medicine, General Surgery, and ENT.',
        instructions: 'Please arrive at the clinic counter 10 minutes prior to your expected appointment window. Queue calling notifications will update in your browser.'
      },
      {
        id: 'srv-ph-lab',
        name: 'Blood & Pathology Sample Collection',
        nameNe: 'रगत तथा प्याथोलोजी नमुना संकलन',
        code: 'MED-LAB-02',
        category: 'Diagnostic Laboratory',
        estimatedDurationMinutes: 12,
        feeAmount: 350,
        feeCurrency: 'NPR',
        isPaid: true,
        requiredDocuments: [
          'Doctor Diagnostic Prescription / Test Order Slip',
          'Hospital OPD Registration Receipt'
        ],
        description: 'Routine blood tests (CBC, Lipid Profile, Sugar, Thyroid) and urine/stool sample intake.',
        instructions: 'For fasting tests (Fasting Glucose, Lipid), ensure a minimum 10 to 12 hour overnight fast prior to attending.'
      },
      {
        id: 'srv-ph-radio',
        name: 'Radiology / X-Ray & Ultrasound Appointment',
        nameNe: 'रेडियोलोजी / एक्स-रे तथा भिडियो एक्स-रे',
        code: 'MED-RAD-03',
        category: 'Imaging Department',
        estimatedDurationMinutes: 20,
        feeAmount: 850,
        feeCurrency: 'NPR',
        isPaid: true,
        requiredDocuments: [
          'Physician Radiology Order Form',
          'Prior imaging reports if available'
        ],
        description: 'Diagnostic plain digital X-rays and abdominal/pelvic sonography examinations.',
        instructions: 'Pelvic ultrasound examinations require drinking 1 liter of plain water 1 hour beforehand.'
      },
      {
        id: 'srv-ph-specialist',
        name: 'Senior Consultant Clinic Check-in',
        nameNe: 'वरिष्ठ कन्सल्टेन्ट क्लिनिक जाँच',
        code: 'MED-SPEC-04',
        category: 'Specialist Clinic',
        estimatedDurationMinutes: 15,
        feeAmount: 600,
        feeCurrency: 'NPR',
        isPaid: true,
        requiredDocuments: [
          'Referral letter or initial diagnostic test results',
          'Patient Medical History Summary'
        ],
        description: 'Pre-scheduled consultation with Department Heads and Senior Consultants in Cardiology, Neurology, and Rheumatology.',
        instructions: 'Keep previous test reports ordered chronologically to expedite consultation.'
      }
    ]
  },
  {
    id: 'org-bank-01',
    isDemo: true,
    name: 'Everest Himalayan Commercial Bank',
    nameNe: 'एभरेष्ट हिमालयन कमर्सियल बैंक',
    industryId: 'banking',
    industryName: 'Banking & Finance',
    industryNameNe: 'बैंकिङ तथा वित्तीय संस्था',
    tagline: 'Class "A" Commercial Bank providing reliable retail & corporate financial services.',
    taglineNe: 'क वर्गको वाणिज्य बैंक, भरपर्दो खुद्रा तथा संस्थागत वित्तीय सेवा।',
    city: 'Kathmandu',
    district: 'Kathmandu',
    province: 'Bagmati Province',
    verifiedStatus: 'demo_verified',
    establishedYear: 2004,
    registrationNumber: 'BNK-NRB-4410',
    website: 'https://demo-everesthimalayan.example.org',
    email: 'customercare@demo-everesthimalayan.example.org',
    phone: '+977 1-4419200',
    about: 'Everest Himalayan Bank operates 42 branches across central and western districts. This digital queue initiative enables depositors, remitters, and corporate clients to book counter tickets from anywhere, eliminating crowded banking halls during peak banking hours.',
    aboutNe: 'एभरेष्ट हिमालयन बैंकले ४२ शाखाहरूमार्फत वित्तीय सेवा प्रदान गर्दै आएको छ। बैंकिङ समयमा हुने भीड व्यवस्थापनका लागि डिजिटल टोकन प्रणाली लागू गरिएको छ।',
    branches: [
      {
        id: 'branch-ehb-newroad',
        name: 'New Road Central Branch',
        nameNe: 'न्यूरोड केन्द्रीय शाखा',
        address: 'New Road Pipalbot, Ward 22, Kathmandu',
        phone: '+977 1-4419201',
        email: 'newroad@demo-everesthimalayan.example.org',
        operatingHours: 'Sun - Thu: 09:30 AM - 03:30 PM (Fri: 09:30 AM - 01:30 PM)',
        counters: [
          { id: 'c-ehb-01', number: '1', name: 'Cash Deposit & Withdrawal (Regular)', serviceIds: ['srv-ehb-cash'] },
          { id: 'c-ehb-02', number: '2', name: 'High-Value Cash & Bullion Desk', serviceIds: ['srv-ehb-cash'] },
          { id: 'c-ehb-03', number: '3', name: 'Customer Service & KYC Update', serviceIds: ['srv-ehb-kyc'] },
          { id: 'c-ehb-04', number: '4', name: 'Inbound Remittance Payout', serviceIds: ['srv-ehb-remit'] },
          { id: 'c-ehb-05', number: '5', name: 'Account Opening & Cheque Requisition', serviceIds: ['srv-ehb-acc'] }
        ],
        serviceIds: ['srv-ehb-cash', 'srv-ehb-kyc', 'srv-ehb-remit', 'srv-ehb-acc']
      },
      {
        id: 'branch-ehb-thamel',
        name: 'Thamel Tourist & Foreign Exchange Branch',
        nameNe: 'ठमेल विदेशी मुद्रा तथा सटही शाखा',
        address: 'Tridevi Marg, Thamel, Kathmandu',
        phone: '+977 1-4428800',
        email: 'thamel@demo-everesthimalayan.example.org',
        operatingHours: 'Sun - Fri: 09:00 AM - 05:00 PM',
        counters: [
          { id: 'c-ehb-t1', number: '1', name: 'Foreign Currency Exchange & Travellers Cheque', serviceIds: ['srv-ehb-forex'] },
          { id: 'c-ehb-t2', number: '2', name: 'Remittance & Fast Transfer', serviceIds: ['srv-ehb-remit'] }
        ],
        serviceIds: ['srv-ehb-forex', 'srv-ehb-remit', 'srv-ehb-cash']
      }
    ],
    services: [
      {
        id: 'srv-ehb-cash',
        name: 'Cash Deposit & Teller Withdrawal',
        nameNe: 'नगद जम्मा तथा भुक्तानी सेवा',
        code: 'BNK-CSH-01',
        category: 'Teller Services',
        estimatedDurationMinutes: 6,
        feeAmount: 0,
        feeCurrency: 'NPR',
        isPaid: false,
        requiredDocuments: [
          'Account Number / Cheque Leaf or Deposit Slip',
          'Depositor Citizenship / ID (if amount exceeds NPR 100,000)'
        ],
        description: 'Over-the-counter physical cash transactions, account-to-account internal transfers, and clearing cheque submission.',
        instructions: 'Please have your deposit slip filled and cash organized before counter call.'
      },
      {
        id: 'srv-ehb-kyc',
        name: 'Biometric KYC Update & Compliance',
        nameNe: 'बायोमेट्रिक केवाइसी अद्यावधिक',
        code: 'BNK-KYC-02',
        category: 'Customer Relationship',
        estimatedDurationMinutes: 15,
        feeAmount: 0,
        feeCurrency: 'NPR',
        isPaid: false,
        requiredDocuments: [
          'Original Citizenship Certificate or Passport',
          'Two passport-sized color photographs',
          'Electricity / Water utility bill or proof of residence'
        ],
        description: 'Mandatory annual Know-Your-Customer account renewal, address change, and signature specimen updating.',
        instructions: 'Both physical presence and original identification are required for biometric thumbprint authentication.'
      },
      {
        id: 'srv-ehb-remit',
        name: 'International & Domestic Remittance Payout',
        nameNe: 'आन्तरिक तथा अन्तर्राष्ट्रिय विप्रेषण भुक्तानी',
        code: 'BNK-RMT-03',
        category: 'Remittance Services',
        estimatedDurationMinutes: 10,
        feeAmount: 0,
        feeCurrency: 'NPR',
        isPaid: false,
        requiredDocuments: [
          'Remittance Reference / MTCN PIN Number',
          'Original Beneficiary Government ID',
          'Sender and Receiver full legal names'
        ],
        description: 'Receive Western Union, MoneyGram, and Gulf corridor inbound remittances instantly at teller counters.',
        instructions: 'Verify the reference PIN matches your SMS confirmation prior to queuing.'
      },
      {
        id: 'srv-ehb-acc',
        name: 'New Savings / Current Account Opening',
        nameNe: 'नयाँ बचत तथा चल्ती खाता खोल्ने',
        code: 'BNK-ACC-04',
        category: 'Retail Accounts',
        estimatedDurationMinutes: 20,
        feeAmount: 0,
        feeCurrency: 'NPR',
        isPaid: false,
        requiredDocuments: [
          'Original and photocopy of National ID / Citizenship',
          'Nominee details and identification proof',
          'Initial minimum deposit (NPR 500)'
        ],
        description: 'Open interest-bearing savings, fixed deposits, or business checking accounts with debit card and mobile banking enrollment.',
        instructions: 'Digital pre-forms can be submitted in advance to reduce counter processing time.'
      }
    ]
  },
  {
    id: 'org-gov-01',
    isDemo: true,
    name: 'Department of Transport & Driver Licensing Bureau',
    nameNe: 'यातायात व्यवस्था तथा सवारी चालक अनुमतिपत्र कार्यालय',
    industryId: 'government',
    industryName: 'Government & Public Services',
    industryNameNe: 'सरकारी तथा नागरिक सेवा',
    tagline: 'Public administrative authority for driver certification, license renewals, and biometrics.',
    taglineNe: 'चालक अनुमतिपत्र नवीकरण, बायोमेट्रिक तथा सवारी व्यवस्थापन सरकारी कार्यालय।',
    city: 'Lalitpur',
    district: 'Lalitpur',
    province: 'Bagmati Province',
    verifiedStatus: 'demo_verified',
    establishedYear: 1992,
    registrationNumber: 'GOV-DOTM-02',
    website: 'https://demo-dotm-ekantakuna.example.gov',
    email: 'support@demo-dotm.example.gov',
    phone: '+977 1-5544111',
    about: 'The Ekantakuna Transport Office processes thousands of daily applications for new driver biometric registration, license renewal, and vehicle category endorsements. Digital queues eliminate pre-dawn physical lines outside government gates.',
    aboutNe: 'एकान्तकुना यातायात कार्यालयले सवारी चालक अनुमतिपत्रको नयाँ बायोमेट्रिक दर्ता र नवीकरण सेवा प्रवाह गर्दछ।',
    branches: [
      {
        id: 'branch-dotm-ekantakuna',
        name: 'Ekantakuna Main Licensing Center',
        nameNe: 'एकान्तकुना मुख्य सवारी अनुमतिपत्र केन्द्र',
        address: 'Ekantakuna Ring Road, Lalitpur, Nepal',
        phone: '+977 1-5544112',
        email: 'ekantakuna@demo-dotm.example.gov',
        operatingHours: 'Sun - Thu: 10:00 AM - 04:00 PM (Fri: 10:00 AM - 02:00 PM)',
        counters: [
          { id: 'c-dotm-01', number: '1', name: 'Document Screening & Token Entry', serviceIds: ['srv-dotm-renew'] },
          { id: 'c-dotm-02', number: '2', name: 'Biometric Fingerprint & Iris Capture Desk', serviceIds: ['srv-dotm-bio'] },
          { id: 'c-dotm-03', number: '3', name: 'Medical & Vision Examination Room', serviceIds: ['srv-dotm-med'] },
          { id: 'c-dotm-04', number: '4', name: 'Government Revenue & Challan Cash Counter', serviceIds: ['srv-dotm-renew', 'srv-dotm-bio'] },
          { id: 'c-dotm-05', number: '5', name: 'Smart Card Printed License Distribution', serviceIds: ['srv-dotm-pickup'] }
        ],
        serviceIds: ['srv-dotm-renew', 'srv-dotm-bio', 'srv-dotm-med', 'srv-dotm-pickup']
      }
    ],
    services: [
      {
        id: 'srv-dotm-renew',
        name: 'Smart License 5-Year Renewal',
        nameNe: 'स्मार्ट लाइसेन्स ५-वर्षे नवीकरण',
        code: 'GOV-LIC-REN',
        category: 'Licensing Administration',
        estimatedDurationMinutes: 15,
        feeAmount: 1500,
        feeCurrency: 'NPR',
        isPaid: true,
        requiredDocuments: [
          'Original expiring Driving License card',
          'Copy of Nepali Citizenship Certificate',
          'Medical Eye Examination Slip (issued within 30 days)'
        ],
        description: 'Statutory renewal for Category A (Motorcycle), B (Car/Jeep), and Commercial vehicle endorsements.',
        instructions: 'Fines apply if renewal takes place more than 90 days after expiration date.'
      },
      {
        id: 'srv-dotm-bio',
        name: 'New Applicant Biometric Enrollment',
        nameNe: 'नयाँ आवेदक बायोमेट्रिक विवरण संकलन',
        code: 'GOV-LIC-BIO',
        category: 'Biometric Services',
        estimatedDurationMinutes: 10,
        feeAmount: 500,
        feeCurrency: 'NPR',
        isPaid: true,
        requiredDocuments: [
          'Online Application Form Confirmation Printout (with Barcode)',
          'Original Citizenship Certificate',
          'Blood Group Certificate Card'
        ],
        description: 'Ten-finger digital fingerprint capture, high-resolution iris scan, and digital photo registration for new driving test applicants.',
        instructions: 'Avoid applying colored contact lenses or deep henna on fingers prior to biometric scanning.'
      },
      {
        id: 'srv-dotm-pickup',
        name: 'Printed Smart Card Collection',
        nameNe: 'प्रिन्ट भएको स्मार्ट कार्ड बुझ्ने',
        code: 'GOV-LIC-CRD',
        category: 'Card Dispatch',
        estimatedDurationMinutes: 5,
        feeAmount: 0,
        feeCurrency: 'NPR',
        isPaid: false,
        requiredDocuments: [
          'Temporary Revenue Payment Receipt Slip',
          'Original Citizenship Certificate'
        ],
        description: 'Collect ready-to-dispatch physical smart plastic license cards once production confirmation SMS is received.',
        instructions: 'Cards can only be collected in person by the applicant; proxy collection requires notarized authorization.'
      }
    ]
  },
  {
    id: 'org-retail-01',
    isDemo: true,
    name: 'GadgetHub Authorized Device Care & Warranty',
    nameNe: 'ग्याजेटहब आधिकारिक उपकरण मर्मत तथा वारेन्टी केन्द्र',
    industryId: 'retail',
    industryName: 'Retail & Consumer Services',
    industryNameNe: 'खुद्रा तथा उपभोक्ता सेवा',
    tagline: 'Authorized technical warranty service center for smartphones, laptops, and home electronics.',
    taglineNe: 'स्मार्टफोन, ल्यापटप र घरायसी इलेक्ट्रोनिक्सको आधिकारिक प्राविधिक वारेन्टी सेवा।',
    city: 'Kathmandu',
    district: 'Kathmandu',
    province: 'Bagmati Province',
    verifiedStatus: 'demo_verified',
    establishedYear: 2018,
    registrationNumber: 'RET-WRN-8831',
    website: 'https://demo-gadgethub.example.com',
    email: 'care@demo-gadgethub.example.com',
    phone: '+977 1-4245500',
    about: 'GadgetHub provides certified warranty repair and technical troubleshooting for major consumer electronics brands. Customers book technical check-in slots to avoid waiting in crowded retail lounge areas.',
    aboutNe: 'ग्याजेटहबले प्रमुख इलेक्ट्रोनिक्स ब्राण्डहरूको आधिकारिक वारेन्टी मर्मत र प्राविधिक जाँच सेवा प्रदान गर्दछ।',
    branches: [
      {
        id: 'branch-gh-putalisadak',
        name: 'Putalisadak Tech Hub',
        nameNe: 'पुतलीसडक टेक हब',
        address: 'Star Mall 2nd Floor, Putalisadak, Kathmandu',
        phone: '+977 1-4245501',
        email: 'putalisadak@demo-gadgethub.example.com',
        operatingHours: 'Sun - Fri: 10:00 AM - 06:30 PM (Sat: 11:00 AM - 04:00 PM)',
        counters: [
          { id: 'c-gh-01', number: '1', name: 'Smartphone Rapid Diagnostic Intake', serviceIds: ['srv-gh-phone'] },
          { id: 'c-gh-02', number: '2', name: 'Laptop & Hardware Inspection Desk', serviceIds: ['srv-gh-laptop'] },
          { id: 'c-gh-03', number: '3', name: 'Warranty Claim & Replacement Authorization', serviceIds: ['srv-gh-claim'] },
          { id: 'c-gh-04', number: '4', name: 'Repaired Device Collection & Payment', serviceIds: ['srv-gh-phone', 'srv-gh-laptop'] }
        ],
        serviceIds: ['srv-gh-phone', 'srv-gh-laptop', 'srv-gh-claim']
      }
    ],
    services: [
      {
        id: 'srv-gh-phone',
        name: 'Smartphone Battery & Screen Diagnostics',
        nameNe: 'स्मार्टफोन ब्याट्री तथा स्क्रिन परीक्षण',
        code: 'RET-MOB-01',
        category: 'Diagnostic Inspection',
        estimatedDurationMinutes: 15,
        feeAmount: 300,
        feeCurrency: 'NPR',
        isPaid: true,
        requiredDocuments: [
          'Purchase Invoice or Tax Bill',
          'Valid Manufacturer Warranty Card (if seeking free warranty service)'
        ],
        description: 'Hardware test for cracked display, battery health calibration, charging port replacement, and water damage detection.',
        instructions: 'Please back up personal cloud data and remove SIM/SD cards before handing the device to our technician.'
      },
      {
        id: 'srv-gh-laptop',
        name: 'Laptop Thermal Cleaning & OS Restoration',
        nameNe: 'ल्यापटप सर्भिसिङ तथा सिस्टम मर्मत',
        code: 'RET-LPT-02',
        category: 'Computer Hardware',
        estimatedDurationMinutes: 30,
        feeAmount: 1200,
        feeCurrency: 'NPR',
        isPaid: true,
        requiredDocuments: [
          'Device Original Charger',
          'Ownership Proof / Purchase Receipt'
        ],
        description: 'Cooling fan cleaning, thermal paste re-application, memory/SSD upgrade consultation, and OS restore.',
        instructions: 'Ensure backup of work documents has been completed to external storage.'
      }
    ]
  },
  {
    id: 'org-auto-01',
    isDemo: true,
    name: 'City Motors Authorized Vehicle Care Hub',
    nameNe: 'सिटी मोटर्स आधिकारिक सवारी साधन मर्मत केन्द्र',
    industryId: 'automotive',
    industryName: 'Automotive & Mobility',
    industryNameNe: 'सवारी साधन तथा मर्मत सेवा',
    tagline: 'Multi-bay certified auto workshop and periodic maintenance service center.',
    taglineNe: 'मल्टी-बे प्रमाणित अटो वर्कशप तथा आवधिक मर्मत सम्भार सेवा केन्द्र।',
    city: 'Kathmandu',
    district: 'Kathmandu',
    province: 'Bagmati Province',
    verifiedStatus: 'demo_verified',
    establishedYear: 2015,
    registrationNumber: 'AUTO-NP-6721',
    website: 'https://demo-citymotors.example.com',
    email: 'service@demo-citymotors.example.com',
    phone: '+977 1-4478100',
    about: 'City Motors features 12 service bays with computerized wheel alignment, 50-point engine health inspections, and quick express oil change services.',
    aboutNe: 'सिटी मोटर्समा १२ वटा आधुनिक सर्भिस बेहरू रहेका छन् जहाँ कम्प्युटरयुक्त मर्मत र आवधिक सर्भिसिङ गरिन्छ।',
    branches: [
      {
        id: 'branch-cm-tinkune',
        name: 'Tinkune Main Service Workshop',
        nameNe: 'तीनकुने मुख्य वर्कशप',
        address: 'Tinkune Ring Road Highway, Kathmandu',
        phone: '+977 1-4478101',
        email: 'tinkune@demo-citymotors.example.com',
        operatingHours: 'Sun - Fri: 08:30 AM - 05:30 PM (Sat: Emergency Roadside Only)',
        counters: [
          { id: 'c-cm-01', number: '1', name: 'Service Advisor Check-In Bay A', serviceIds: ['srv-cm-periodic'] },
          { id: 'c-cm-02', number: '2', name: 'Service Advisor Check-In Bay B', serviceIds: ['srv-cm-periodic', 'srv-cm-wheel'] },
          { id: 'c-cm-03', number: '3', name: 'Accident Insurance Survey & Estimates', serviceIds: ['srv-cm-survey'] },
          { id: 'c-cm-04', number: '4', name: 'Vehicle Delivery & Invoice Billing', serviceIds: ['srv-cm-periodic'] }
        ],
        serviceIds: ['srv-cm-periodic', 'srv-cm-wheel', 'srv-cm-survey']
      }
    ],
    services: [
      {
        id: 'srv-cm-periodic',
        name: 'Periodic General Service (10,000 KM Maintenance)',
        nameNe: 'आवधिक सामान्य सर्भिसिङ (१०,००० कि.मि.)',
        code: 'AUT-PRD-10K',
        category: 'Periodic Maintenance',
        estimatedDurationMinutes: 60,
        feeAmount: 3500,
        feeCurrency: 'NPR',
        isPaid: true,
        requiredDocuments: [
          'Vehicle Blue Book (Sawaari Darta Kitab)',
          'Valid Driver License of custodian',
          'Service Logbook with stamped warranty'
        ],
        description: 'Complete engine synthetic oil replacement, oil filter swap, brake pad inspection, suspension check, and engine tune-up.',
        instructions: 'Please empty the boot/trunk of personal valuables before leaving the vehicle with service advisors.'
      },
      {
        id: 'srv-cm-wheel',
        name: 'Computerized 3D Wheel Alignment & Balancing',
        nameNe: 'कम्प्युटराइज्ड ३डी ह्वील अलाइनमेन्ट',
        code: 'AUT-WHL-3D',
        category: 'Tire & Suspension',
        estimatedDurationMinutes: 25,
        feeAmount: 1200,
        feeCurrency: 'NPR',
        isPaid: true,
        requiredDocuments: [
          'Vehicle Registration Certificate'
        ],
        description: 'Laser guided 4-wheel alignment and high-speed tire balancing to eliminate highway steering vibrations.',
        instructions: 'Ensure tires have proper cold pressure before driving onto the alignment bay.'
      }
    ]
  },
  {
    id: 'org-edu-01',
    isDemo: true,
    name: 'Tribhuvan Academic Administration & Examination Office',
    nameNe: 'त्रिभुवन शैक्षिक प्रशासन तथा परीक्षा नियन्त्रण कार्यालय',
    industryId: 'education',
    industryName: 'Education & Academic Offices',
    industryNameNe: 'शिक्षा तथा शैक्षिक प्रशासन',
    tagline: 'Central administrative desk for student transcripts, migration, and certificate verification.',
    taglineNe: 'विद्यार्थी ट्रान्सक्रिप्ट, स्थानान्तरण प्रमाणपत्र र प्रमाणीकरण केन्द्रीय कार्यालय।',
    city: 'Kathmandu',
    district: 'Kathmandu',
    province: 'Bagmati Province',
    verifiedStatus: 'demo_verified',
    establishedYear: 1959,
    registrationNumber: 'EDU-TU-01',
    website: 'https://demo-tu-exam.example.edu',
    email: 'registrar@demo-tu-exam.example.edu',
    phone: '+977 1-4330100',
    about: 'Servicing thousands of university graduates daily across all faculties. Queueless eliminates multi-hour campus queues for transcript processing and provisional degree issuance.',
    aboutNe: 'हजारौँ विद्यार्थीहरूलाई शैक्षिक ट्रान्सक्रिप्ट र प्रमाणपत्र सेवा सहज रूपमा प्रदान गर्न डिजिटल लाइन प्रणाली।',
    branches: [
      {
        id: 'branch-tu-balkhu',
        name: 'Balkhu Central Examination Controller',
        nameNe: 'बल्खु केन्द्रीय परीक्षा नियन्त्रण कार्यालय',
        address: 'Balkhu Campus Complex, Kathmandu',
        phone: '+977 1-4330101',
        email: 'balkhu@demo-tu-exam.example.edu',
        operatingHours: 'Sun - Thu: 10:30 AM - 03:00 PM (Fri: 10:30 AM - 01:30 PM)',
        counters: [
          { id: 'c-tu-01', number: '1', name: 'Faculty of Humanities & Social Sciences', serviceIds: ['srv-tu-trans'] },
          { id: 'c-tu-02', number: '2', name: 'Faculty of Management & Commerce', serviceIds: ['srv-tu-trans'] },
          { id: 'c-tu-03', number: '3', name: 'Institute of Science & Technology', serviceIds: ['srv-tu-trans', 'srv-tu-mig'] },
          { id: 'c-tu-04', number: '4', name: 'Provisional Certificate & Verification Desk', serviceIds: ['srv-tu-prov'] },
          { id: 'c-tu-05', number: '5', name: 'Revenue Bank Slip Verification', serviceIds: ['srv-tu-trans', 'srv-tu-prov'] }
        ],
        serviceIds: ['srv-tu-trans', 'srv-tu-mig', 'srv-tu-prov']
      }
    ],
    services: [
      {
        id: 'srv-tu-trans',
        name: 'Academic Transcript Application & Issuance',
        nameNe: 'शैक्षिक ट्रान्सक्रिप्ट आवेदन तथा प्राप्ति',
        code: 'EDU-TU-TRN',
        category: 'Academic Records',
        estimatedDurationMinutes: 12,
        feeAmount: 500,
        feeCurrency: 'NPR',
        isPaid: true,
        requiredDocuments: [
          'Photocopies of all Year/Semester Marksheets',
          'Registration Card original and photocopy',
          'Bank Voucher deposit confirmation slip'
        ],
        description: 'Official academic transcript containing grade history and cumulative percentage for all undergraduate and graduate levels.',
        instructions: 'Verify student spelling of your name on marksheets matches your citizenship card exactly before lodging application.'
      },
      {
        id: 'srv-tu-prov',
        name: 'Provisional Graduation Certificate',
        nameNe: 'अस्थायी स्नातक प्रमाणपत्र',
        code: 'EDU-TU-PRV',
        category: 'Graduation Records',
        estimatedDurationMinutes: 10,
        feeAmount: 400,
        feeCurrency: 'NPR',
        isPaid: true,
        requiredDocuments: [
          'Official Transcript Copy',
          'University Registration Card'
        ],
        description: 'Provisional certification valid for employment and international university admissions prior to the annual convocation ceremony.',
        instructions: 'Tokens can be reserved up to 3 days in advance of attending the Balkhu counter.'
      }
    ]
  },
  {
    id: 'org-other-01',
    isDemo: true,
    name: 'Global Consular & Visa Attestation Bureau',
    nameNe: 'ग्लोबल कन्सुलर तथा भिसा प्रमाणीकरण ब्युरो',
    industryId: 'other',
    industryName: 'Other Configurable Services',
    industryNameNe: 'अन्य अनुकूलन योग्य सेवाहरू',
    tagline: 'Specialized document legalisation, embassy verification, and consular apostille center.',
    taglineNe: 'कागजात प्रमाणीकरण, दूतावास सिफारिस तथा कन्सुलर प्रमाणीकरण विशेष केन्द्र।',
    city: 'Kathmandu',
    district: 'Kathmandu',
    province: 'Bagmati Province',
    verifiedStatus: 'demo_verified',
    establishedYear: 2019,
    registrationNumber: 'CON-APP-2019',
    website: 'https://demo-consularbureau.example.org',
    email: 'contact@demo-consularbureau.example.org',
    phone: '+977 1-4433220',
    about: 'Providing document translation authentication, police clearance notarization, and foreign embassy visa document lodgement queues.',
    aboutNe: 'विदेश अध्ययन तथा रोजगारीका लागि आवश्यक कागजात प्रमाणीकरण र कन्सुलर सेवा।',
    branches: [
      {
        id: 'branch-gc-naxal',
        name: 'Naxal Diplomatic Enclave Annex',
        nameNe: 'नक्साल कन्सुलर शाखा',
        address: 'Naxal Bhagwati, Ward 1, Kathmandu',
        phone: '+977 1-4433221',
        email: 'naxal@demo-consularbureau.example.org',
        operatingHours: 'Sun - Thu: 09:00 AM - 04:00 PM',
        counters: [
          { id: 'c-gc-01', number: '1', name: 'Document Lodgement & Notary Check', serviceIds: ['srv-gc-apostille'] },
          { id: 'c-gc-02', number: '2', name: 'Biometric Appointment Check-in', serviceIds: ['srv-gc-bio'] }
        ],
        serviceIds: ['srv-gc-apostille', 'srv-gc-bio']
      }
    ],
    services: [
      {
        id: 'srv-gc-apostille',
        name: 'Document Apostille & Legalisation',
        nameNe: 'कागजात अपोस्टिल तथा प्रमाणीकरण',
        code: 'OTH-CON-01',
        category: 'Legal Certification',
        estimatedDurationMinutes: 15,
        feeAmount: 1800,
        feeCurrency: 'NPR',
        isPaid: true,
        requiredDocuments: [
          'Original certificates with Ministry of Foreign Affairs (MoFA) stamp',
          'Valid passport color copy'
        ],
        description: 'Authentication of birth certificates, marriage certificates, and police clearance reports for international legal recognition.',
        instructions: 'Original documents must bear prior district administration and MoFA seal.'
      }
    ]
  }
];
