// Mock data for the Otangeles Intelligent System

const TEST_USERS = [
  { id: 'u1',  email: 'sarah.chen@otangeles.com',   password: 'demo', name: 'Sarah Chen',      initials: 'SC', role: 'Director of Nursing',          short: 'DON', dept: 'Nursing leadership' },
  { id: 'u2',  email: 'marcus.webb@otangeles.com',  password: 'demo', name: 'Marcus Webb',     initials: 'MW', role: 'Assistant Director of Nursing', short: 'ADON', dept: 'Nursing leadership' },
  { id: 'u3',  email: 'david.kim@otangeles.com',    password: 'demo', name: 'David Kim',       initials: 'DK', role: 'Unit Manager',                 short: 'Unit Mgr', dept: 'Nursing leadership' },
  { id: 'u4',  email: 'jenny.ortiz@otangeles.com',  password: 'demo', name: 'Jenny Ortiz',     initials: 'JO', role: 'RN — Charge Nurse',             short: 'RN', dept: 'Nursing' },
  { id: 'u5',  email: 'linh.tran@otangeles.com',    password: 'demo', name: 'Linh Tran',       initials: 'LT', role: 'LPN',                          short: 'LPN', dept: 'Nursing' },
  { id: 'u6',  email: 'diana.cole@otangeles.com',   password: 'demo', name: 'Diana Cole',      initials: 'DC', role: 'CNA',                          short: 'CNA', dept: 'Nursing support' },
  { id: 'u7',  email: 'beatrice.liu@otangeles.com', password: 'demo', name: 'Beatrice Liu',    initials: 'BL', role: 'MDS Coordinator',              short: 'MDS', dept: 'Assessment' },
  { id: 'u8',  email: 'robert.chen@otangeles.com',  password: 'demo', name: 'Robert Chen',     initials: 'RC', role: 'Infection Preventionist',      short: 'IP', dept: 'Quality / IPCP' },
  { id: 'u9',  email: 'aisha.patel@otangeles.com',  password: 'demo', name: 'Aisha Patel',     initials: 'AP', role: 'Wound Care Nurse',             short: 'Wound', dept: 'Nursing quality' },
  { id: 'u10', email: 'dr.patel@otangeles.com',     password: 'demo', name: 'Dr. Eleanor Patel', initials: 'EP', role: 'Medical Director',          short: 'MD', dept: 'Medical oversight' },
  { id: 'u11', email: 'henry.cole@otangeles.com',   password: 'demo', name: 'Dr. Henry Cole',  initials: 'HC', role: 'Nurse Practitioner',           short: 'NP', dept: 'Medical care' },
  { id: 'u12', email: 'aanya.verma@otangeles.com',  password: 'demo', name: 'Aanya Verma',     initials: 'AV', role: 'Consultant Pharmacist',        short: 'Rx', dept: 'Pharmacy' },
  { id: 'u13', email: 'david.rehab@otangeles.com',  password: 'demo', name: 'David Park',      initials: 'DP', role: 'Director of Rehabilitation',   short: 'DOR', dept: 'Rehabilitation' },
  { id: 'u14', email: 'olivia.reed@otangeles.com',  password: 'demo', name: 'Olivia Reed',     initials: 'OR', role: 'Physical Therapist',           short: 'PT', dept: 'Rehabilitation' },
  { id: 'u15', email: 'maria.alvarez@otangeles.com',password: 'demo', name: 'Maria Alvarez',   initials: 'MA', role: 'Director of Social Services',  short: 'SW', dept: 'Social services' },
  { id: 'u16', email: 'tom.becker@otangeles.com',   password: 'demo', name: 'Tom Becker',      initials: 'TB', role: 'Case Manager',                 short: 'CM', dept: 'Case management' },
  { id: 'u17', email: 'nora.williams@otangeles.com',password: 'demo', name: 'Nora Williams',   initials: 'NW', role: 'Director of Food & Nutrition', short: 'Dietary', dept: 'Dietary' },
  { id: 'u18', email: 'sofia.rossi@otangeles.com',  password: 'demo', name: 'Sofia Rossi',     initials: 'SR', role: 'Registered Dietitian',         short: 'RD', dept: 'Dietary clinical' },
];

const FACILITY = {
  name: 'Sunnybrook Skilled Nursing',
  building: 'Building A',
  beds: 124,
  occupied: 117,
  admits24h: 3,
  discharges24h: 1,
  pendingProvider: 6,
};

// Risk drivers we surface across the app
const RISK_CATEGORIES = [
  { id: 'rehosp',     label: 'Transfer / Rehosp Risk',  icon: 'arrowRight',     tone: 'critical', count: 7 },
  { id: 'sepsis',     label: 'Infection / Sepsis',       icon: 'alertTriangle',  tone: 'critical', count: 4 },
  { id: 'fall',       label: 'Fall Risk',                icon: 'shield',         tone: 'high',     count: 11 },
  { id: 'med',        label: 'Medication Risk',          icon: 'pill',           tone: 'high',     count: 9 },
  { id: 'nutrition',  label: 'Nutrition / Hydration',    icon: 'droplet',        tone: 'watch',    count: 8 },
  { id: 'rehab',      label: 'Functional / Rehab',       icon: 'trendingDown',   tone: 'watch',    count: 6 },
  { id: 'skin',       label: 'Skin / Wound',             icon: 'heart',          tone: 'watch',    count: 5 },
  { id: 'behavioral', label: 'Behavioral / Cognitive',   icon: 'sparkles',       tone: 'stable',   count: 3 },
];

// Watchlist cards
const WATCHLISTS = [
  { id: 'admits',     label: 'New Admits (72h)',       icon: 'plus',         tone: 'info',     count: 5,  desc: 'Residents admitted in the last 72 hours — heightened observation window.' },
  { id: 'returns',    label: 'Post-Hospital Return',   icon: 'refresh',      tone: 'info',     count: 3,  desc: 'Residents returning from acute hospitalization in the last 7 days.' },
  { id: 'fall',       label: 'High Fall Risk',         icon: 'shield',       tone: 'high',     count: 11, desc: 'Morse Fall Scale ≥ 45 or recent fall event.' },
  { id: 'sepsis',     label: 'Sepsis Watch',           icon: 'alertTriangle',tone: 'critical', count: 4,  desc: 'Active sepsis screening positive or 2+ qSOFA criteria.' },
  { id: 'wound',      label: 'Active Wound Care',      icon: 'heart',        tone: 'watch',    count: 9,  desc: 'Stage II+ pressure injury, surgical wound, or non-healing wound.' },
  { id: 'iso',        label: 'Isolation / Precaution', icon: 'shield',       tone: 'coral',    count: 2,  desc: 'Contact, droplet, or enhanced precautions in effect.' },
  { id: 'nutrition',  label: 'Weight Loss / Nutrition',icon: 'droplet',      tone: 'watch',    count: 6,  desc: '≥ 5% weight loss in 30 days or PO intake < 50%.' },
  { id: 'pendingMd',  label: 'Pending Provider',       icon: 'clock',        tone: 'pending',  count: 6,  desc: 'Awaiting provider response — > 4 hours elapsed since outreach.' },
  { id: 'meds',       label: 'High-Risk Medications',  icon: 'pill',         tone: 'high',     count: 14, desc: 'Anticoagulants, opioids, antipsychotics, insulin sliding scale.' },
  { id: 'discharge',  label: 'Discharge Planning',     icon: 'arrowRight',   tone: 'info',     count: 7,  desc: 'Targeted discharge within 14 days — coordination active.' },
];

// Residents
const RESIDENTS = [
  { id: 'r1', name: 'Harold Johnson', age: 78, sex: 'M', mrn: '0034-722', room: '312B', unit: 'East · Skilled', code: 'Full Code', risk: 'critical', score: 87, trend: 'up', dx: 'CHF exacerbation, Stage III sacral wound', admitted: '2026-04-22', initials: 'HJ', avatar: '#845EC2',
    drivers: ['rehosp', 'skin', 'nutrition'],
    issues: [
      { id: 'i1', kind: 'vitals', severity: 'critical', title: 'BP trend: 88/52 → 84/49 over 4h', detail: 'Systolic dropped 14 pts since 02:00. HR 112. Concern for early sepsis vs. volume depletion.', source: 'AI · vitals stream', time: '2h ago' },
      { id: 'i2', kind: 'wound', severity: 'high',     title: 'Sacral wound — exudate increased', detail: 'CNA night shift documented saturated dressing × 2. Photo on file. Last MD review 3d ago.', source: 'CNA note · A. Patel', time: '5h ago' },
      { id: 'i3', kind: 'med',   severity: 'watch',    title: 'Furosemide held × 2 doses', detail: 'BP parameters per order. Provider not yet notified of held doses.', source: 'eMAR', time: '6h ago' },
    ]},
  { id: 'r2', name: 'Marjorie Bell', age: 84, sex: 'F', mrn: '0034-781', room: '218A', unit: 'West · LTC', code: 'DNR', risk: 'critical', score: 81, trend: 'up', dx: 'UTI, dementia, recurrent falls', admitted: '2026-03-04', initials: 'MB', avatar: '#FF6E6C',
    drivers: ['sepsis', 'fall'],
    issues: [
      { id: 'i1', kind: 'vitals', severity: 'critical', title: 'Temp spike 38.9°C, qSOFA = 2', detail: 'Tachypnea 24, AMS noted. Urine cloudy. Sepsis screening positive.', source: 'AI · sepsis screen', time: '40m ago' },
      { id: 'i2', kind: 'fall',   severity: 'high',     title: 'Witnessed fall — bathroom, no injury', detail: 'Morse score updated 65 → 80. Bed alarm reordered.', source: 'Incident · J. Okafor', time: '12h ago' },
    ]},
  { id: 'r3', name: 'Rafael Moreno', age: 71, sex: 'M', mrn: '0034-815', room: '305A', unit: 'East · Skilled', code: 'Full Code', risk: 'high', score: 68, trend: 'flat', dx: 'Post-op CABG day 6, A.fib', admitted: '2026-05-01', initials: 'RM', avatar: '#0081CF',
    drivers: ['med', 'rehab'],
    issues: [
      { id: 'i1', kind: 'med',  severity: 'high', title: 'INR 3.8 — supratherapeutic', detail: 'On warfarin 5mg. Hold dose pending provider confirmation.', source: 'Lab · Quest', time: '1h ago' },
      { id: 'i2', kind: 'rehab', severity: 'watch', title: 'PT session refused × 2', detail: 'Reports fatigue. OT proceeded with bedside ADLs.', source: 'Rehab · O. Reed', time: '1d ago' },
    ]},
  { id: 'r4', name: 'Adam Linda',     age: 69, sex: 'M', mrn: '0034-772', room: '312A', unit: 'East · Skilled',  code: 'Full Code', risk: 'high', score: 64, trend: 'down', dx: 'COPD exac., DM2',                  admitted: '2026-04-29', initials: 'AL', avatar: '#FF9671', drivers: ['rehosp','med'] },
  { id: 'r5', name: 'Priscilla Owens',age: 76, sex: 'F', mrn: '0034-803', room: '221B', unit: 'West · LTC',      code: 'DNR/DNI',   risk: 'high', score: 62, trend: 'up',   dx: 'Stage IV sacral pressure injury',   admitted: '2026-02-12', initials: 'PO', avatar: '#C34A7D', drivers: ['skin','nutrition'] },
  { id: 'r6', name: 'Gladys Howe',    age: 88, sex: 'F', mrn: '0034-829', room: '117',  unit: 'Memory Care',     code: 'DNR',       risk: 'watch',score: 49, trend: 'flat', dx: 'Advanced dementia, dysphagia',      admitted: '2025-11-20', initials: 'GH', avatar: '#67568C', drivers: ['nutrition','behavioral'] },
  { id: 'r7', name: 'Harold Chen',    age: 73, sex: 'M', mrn: '0034-799', room: '104C', unit: 'East · Skilled',  code: 'Full Code', risk: 'watch',score: 44, trend: 'down', dx: 'Total knee replacement day 3',       admitted: '2026-05-04', initials: 'HC', avatar: '#00C9A7', drivers: ['rehab','med'] },
  { id: 'r8', name: 'Eleanor Park',   age: 81, sex: 'F', mrn: '0034-744', room: '210',  unit: 'West · LTC',      code: 'Full Code', risk: 'watch',score: 41, trend: 'flat', dx: 'Parkinson\u2019s, recurrent UTI',    admitted: '2026-01-08', initials: 'EP', avatar: '#FF6E6C', drivers: ['fall','med'] },
  { id: 'r9', name: 'Jorge Salazar',  age: 65, sex: 'M', mrn: '0034-855', room: '301B', unit: 'East · Skilled',  code: 'Full Code', risk: 'stable',score: 22, trend: 'down', dx: 'Hip fracture s/p ORIF, day 9',     admitted: '2026-04-26', initials: 'JS', avatar: '#0081CF', drivers: ['rehab'] },
  { id: 'r10',name: 'Helen Goodwin',  age: 79, sex: 'F', mrn: '0034-866', room: '215A', unit: 'West · LTC',      code: 'DNR',       risk: 'stable',score: 18, trend: 'flat', dx: 'CKD III, HTN',                       admitted: '2025-12-01', initials: 'HG', avatar: '#29BB89', drivers: [] },
  { id: 'r11',name: 'Wendell Ortiz',  age: 70, sex: 'M', mrn: '0034-877', room: '109',  unit: 'Memory Care',     code: 'DNR',       risk: 'stable',score: 15, trend: 'flat', dx: 'Alzheimer\u2019s, behavioral plan',  admitted: '2025-10-14', initials: 'WO', avatar: '#845EC2', drivers: ['behavioral'] },
  { id: 'r12',name: 'Doris Pham',     age: 86, sex: 'F', mrn: '0034-888', room: '222',  unit: 'West · LTC',      code: 'DNR',       risk: 'stable',score: 12, trend: 'down', dx: 'Hospice eligible — comfort care',    admitted: '2025-09-22', initials: 'DP', avatar: '#FF9671', drivers: [] },
];

// Care team for a resident (just store IDs)
const CARE_TEAMS = {
  r1: ['u1','u2','u3','u4','u9','u10','u11','u12','u14','u18'],
  r2: ['u1','u3','u4','u8','u10','u11','u15'],
  r3: ['u1','u4','u10','u11','u12','u13','u14'],
};

const NOTES_SEED = {
  r1: [
    { id: 'n1', user: 'u9', body: 'Sacral wound: dressing change at 06:00. Exudate moderate, no odor. Photo uploaded. Recommend escalating to wound consult — @u10 @u1.', time: 'Today · 06:42' },
    { id: 'n2', user: 'u4', body: 'Held 06:00 furosemide per parameters (SBP < 95). Will recheck at 10:00. @u11 please advise on next dose.', time: 'Today · 06:18' },
    { id: 'n3', user: 'u14', body: 'Bed mobility assist x 2 → x 1 today. Tolerated 8 minutes upright. Continuing current plan.', time: 'Yesterday · 15:10' },
  ],
};

const CAREPLAN_SEED = {
  r1: [
    { id: 'cp1', kind: 'huddle', title: 'Morning Huddle — Apr 7', participants: ['u1','u2','u3','u4','u9','u10'], time: 'Today · 07:00', summary: 'Wound nurse raised positioning compliance. AI linked to PT note from 4/5 noting refusal of repositioning q2h. Decision: wound specialist consult requested via @u10. Follow-up: Aisha to retake photo in 24h.', actions: ['Wound consult requested','Repositioning q2h re-educated','Photo recheck 24h'] },
    { id: 'cp2', kind: 'call', title: 'Call with Dr. Park — nephrology follow-up', participants: ['u1','u10'], time: 'Yesterday · 14:32', duration: '8m 14s', summary: 'Discussed declining UOP and BUN/Cr trend. Plan: hold furosemide if SBP < 95, recheck BMP in AM, consider IV fluids 250cc bolus PRN. Nephrology to call back tomorrow.', actions: ['Hold furosemide if SBP<95','BMP in AM','IV bolus PRN'] },
    { id: 'cp3', kind: 'message', title: 'Care plan thread — initial admission', participants: ['u1','u11','u15'], time: 'Apr 22 · 10:14', summary: 'Initial admission goals set: stabilize CHF, advance wound healing, target d/c home with family in 4 weeks. Social services to assess home suitability.', actions: ['Social work assessment','4-wk d/c target','Family meeting scheduled'] },
  ],
};

// Today's priority list — derived but explicit for the Home page
function priorityResidents() {
  const order = { critical: 0, high: 1, watch: 2, stable: 3 };
  return [...RESIDENTS].sort((a, b) => order[a.risk] - order[b.risk] || b.score - a.score);
}

// Recent "changes" (Changes tab summary across the facility)
const FACILITY_CHANGES = [
  { residentId: 'r2', kind: 'sepsis',   severity: 'critical', title: 'Sepsis screen positive', detail: 'Temp 38.9°C, AMS, qSOFA 2. AI flagged 40m ago. No provider response yet.',           time: '40m ago', source: 'AI · sepsis screen' },
  { residentId: 'r1', kind: 'vitals',   severity: 'critical', title: 'BP trending down', detail: 'SBP −14 pts in 4h, HR 112. Consider sepsis vs volume depletion.',                          time: '2h ago',  source: 'AI · vitals stream' },
  { residentId: 'r3', kind: 'lab',      severity: 'high',     title: 'INR 3.8 — supratherapeutic', detail: 'Warfarin held pending provider confirmation. Last INR 2.6 (4d ago).',             time: '1h ago',  source: 'Lab · Quest' },
  { residentId: 'r4', kind: 'vitals',   severity: 'high',     title: 'SpO₂ 88% on 2L', detail: 'Resp rate 24, audible wheeze. Respiratory therapy paged.',                                    time: '3h ago',  source: 'AI · vitals stream' },
  { residentId: 'r1', kind: 'wound',    severity: 'high',     title: 'Sacral wound — exudate ↑', detail: 'Saturated dressing × 2 overnight. Photo on file.',                                  time: '5h ago',  source: 'CNA note' },
  { residentId: 'r5', kind: 'nutrition',severity: 'watch',    title: 'PO intake < 25% × 3 meals', detail: 'Refusing solids, accepting fluids. Consider supplement order.',                    time: '6h ago',  source: 'eMAR' },
  { residentId: 'r2', kind: 'fall',     severity: 'high',     title: 'Witnessed fall — bathroom', detail: 'No injury. Morse 65 → 80. Bed alarm reordered.',                                   time: '12h ago', source: 'Incident report' },
  { residentId: 'r7', kind: 'rehab',    severity: 'watch',    title: 'PT session shortened', detail: 'Pain 7/10 at incision site. PRN oxycodone given, plan to retry in PM.',                 time: '14h ago', source: 'Rehab note' },
];

Object.assign(window, { TEST_USERS, FACILITY, RISK_CATEGORIES, WATCHLISTS, RESIDENTS, CARE_TEAMS, NOTES_SEED, CAREPLAN_SEED, FACILITY_CHANGES, priorityResidents });
