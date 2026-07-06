import {Scheme} from '../types';

export const SCHEMES: Scheme[] = [
  {
    id: 'pmay', name: 'PM Awas Yojana (PMAY)', category: 'Housing', benefit: 'Up to ₹2.67 lakh interest subsidy on home loans',
    eligibilityStatus: 'eligible', requiredDocs: ['Aadhaar', 'Income certificate', 'Property papers', 'Bank details'],
    applyUrl: 'https://pmaymis.gov.in', description: 'Credit-linked subsidy for first-time home buyers in EWS/LIG/MIG categories.',
  },
  {
    id: 'ssy', name: 'Sukanya Samriddhi Yojana', category: 'Women', benefit: '8.2% tax-free interest for a girl child',
    eligibilityStatus: 'eligible', requiredDocs: ['Girl child birth certificate', 'Guardian Aadhaar', 'Address proof'],
    applyUrl: 'https://www.india.gov.in', description: 'A small-savings scheme to secure a girl child’s education and marriage expenses.',
  },
  {
    id: 'apy', name: 'Atal Pension Yojana', category: 'Pension', benefit: 'Guaranteed ₹1,000–₹5,000/mo pension after 60',
    eligibilityStatus: 'maybe', requiredDocs: ['Aadhaar', 'Savings bank account', 'Mobile number'],
    applyUrl: 'https://www.npscra.nsdl.co.in', description: 'A government-backed pension scheme for unorganised-sector workers aged 18–40.',
  },
  {
    id: 'nsp', name: 'National Scholarship (NSP)', category: 'Scholarships', benefit: 'Tuition + maintenance allowance for students',
    eligibilityStatus: 'eligible', requiredDocs: ['Aadhaar', 'Marksheet', 'Income certificate', 'Bank passbook'],
    applyUrl: 'https://scholarships.gov.in', description: 'Single-window scholarships for pre-matric, post-matric and merit-based students.',
  },
  {
    id: 'pmkisan', name: 'PM-KISAN', category: 'Farmer', benefit: '₹6,000/year in 3 instalments to farmers',
    eligibilityStatus: 'maybe', requiredDocs: ['Aadhaar', 'Land records', 'Bank account'],
    applyUrl: 'https://pmkisan.gov.in', description: 'Income support for small and marginal farmer families holding cultivable land.',
  },
  {
    id: 'standup', name: 'Stand-Up India', category: 'Startup', benefit: 'Bank loans ₹10 lakh–₹1 crore for enterprises',
    eligibilityStatus: 'maybe', requiredDocs: ['Aadhaar', 'Business plan', 'Caste certificate (if applicable)'],
    applyUrl: 'https://www.standupmitra.in', description: 'Loans for SC/ST and women entrepreneurs to set up greenfield enterprises.',
  },
  {
    id: 'vaya', name: 'Vaya Vandana Yojana', category: 'Senior Citizen', benefit: 'Assured pension for senior citizens',
    eligibilityStatus: 'ineligible', requiredDocs: ['Aadhaar', 'Age proof', 'Bank details'],
    applyUrl: 'https://licindia.in', description: 'A pension scheme by LIC for citizens aged 60 and above.',
  },
];

export const schemesByCategory = (category: string): Scheme[] =>
  SCHEMES.filter(s => s.category === category);
