/**
 * Industry taxonomy for QUEUELESS
 * Supports all 7 specified sectors
 */
export const industries = [
  {
    id: 'healthcare',
    name: 'Healthcare',
    nameNe: 'स्वास्थ्य सेवा',
    icon: 'Activity',
    description: 'Hospitals, polyclinics, diagnostic pathology laboratories, and specialized medical centers.',
    descriptionNe: 'अस्पताल, पोलिक्लिनिक, निदान प्याथोलोजी प्रयोगशाला तथा विशेष स्वास्थ्य केन्द्रहरू।',
    exampleServices: ['General OPD', 'Specialist Consultation', 'Blood & Sample Collection', 'Radiology / X-Ray', 'Pharmacy Counter'],
    color: 'teal'
  },
  {
    id: 'banking',
    name: 'Banking & Finance',
    nameNe: 'बैंकिङ तथा वित्तीय संस्था',
    icon: 'Building2',
    description: 'Commercial banks, development banks, cooperatives, microfinance, and financial customer counters.',
    descriptionNe: 'वाणिज्य बैंक, विकास बैंक, सहकारी, लघुवित्त तथा वित्तीय सेवा काउन्टरहरू।',
    exampleServices: ['Cash Deposit & Withdrawal', 'Account Opening & KYC', 'Foreign Remittance', 'Loan Inquiry', 'Cheque Clearing'],
    color: 'emerald'
  },
  {
    id: 'government',
    name: 'Government & Public Services',
    nameNe: 'सरकारी तथा नागरिक सेवा',
    icon: 'Landmark',
    description: 'Municipal wards, transport & driver license offices, passport bureaus, and revenue offices.',
    descriptionNe: 'नगरपालिका तथा वडा कार्यालय, यातायात तथा सवारी चालक अनुमतिपत्र, राहदानी र कर कार्यालयहरू।',
    exampleServices: ['Biometric Verification', 'License Renewal', 'Citizenship & Vital Registration', 'Property Tax Payment', 'Document Attestation'],
    color: 'blue'
  },
  {
    id: 'retail',
    name: 'Retail & Consumer Services',
    nameNe: 'खुद्रा तथा उपभोक्ता सेवा',
    icon: 'ShoppingBag',
    description: 'Electronics warranty hubs, authorized repair centers, telecom service points, and retail stores.',
    descriptionNe: 'इलेक्ट्रोनिक्स वारेन्टी हब, आधिकारिक मर्मत केन्द्र, दूरसञ्चार सेवा र खुद्रा पसलहरू।',
    exampleServices: ['Device Diagnostics & Repair', 'Warranty Claim & Swap', 'SIM & Telephony Support', 'Merchandise Exchange', 'Product Pickup'],
    color: 'indigo'
  },
  {
    id: 'automotive',
    name: 'Automotive & Mobility',
    nameNe: 'सवारी साधन तथा मर्मत सेवा',
    icon: 'Car',
    description: 'Vehicle authorized dealerships, scheduled maintenance workshops, and inspection centers.',
    descriptionNe: 'सवारी साधन आधिकारिक बिक्रेता, आवधिक मर्मत वर्कशप तथा प्राविधिक जाँच केन्द्रहरू।',
    exampleServices: ['Periodic Service (10,000 km)', 'Wheel Alignment & Tire Care', 'Accidental Repair Assessment', 'Vehicle Inspection / Pollution Check', 'Spare Parts Counter'],
    color: 'amber'
  },
  {
    id: 'education',
    name: 'Education & Academic Offices',
    nameNe: 'शिक्षा तथा शैक्षिक प्रशासन',
    icon: 'GraduationCap',
    description: 'University administrative offices, college examination counters, registrar offices, and student libraries.',
    descriptionNe: 'विश्वविद्यालय प्रशासनिक कार्यालय, क्याम्पस परीक्षा काउन्टर, रजिष्ट्रार कार्यालय र विद्यार्थी सेवा।',
    exampleServices: ['Transcript & Certificate Issuance', 'Admissions & Enrollment Verification', 'Fee Payment Desk', 'Student Identity Card', 'Exam Form Submission'],
    color: 'purple'
  },
  {
    id: 'other',
    name: 'Other Configurable Services',
    nameNe: 'अन्य अनुकूलन योग्य सेवाहरू',
    icon: 'Sparkles',
    description: 'Custom service-based organizations, embassies, visa application centers, and specialized consultants.',
    descriptionNe: 'अनुकूलन योग्य सेवा प्रदायक, दूतावास, भिसा आवेदन केन्द्र तथा परामर्श संस्थाहरू।',
    exampleServices: ['Visa Document Lodgement', 'Consular Verification', 'Legal Consultation', 'Specialist Audit Appointment'],
    color: 'slate'
  }
];
