/**
 * Single source of truth for every fact and every line of copy on the site.
 *
 * Ported from techincglobal-website.vercel.app and re-led with the
 * "Sri Lanka's #1 Frappe Partner" positioning. Everything the SEO/GEO/AIO
 * layer emits (JSON-LD, llms.txt, the markdown mirrors, /api/company.json)
 * reads from here, so the entity stays consistent across every surface.
 */

export const COMPANY = {
  name: 'TECHINCGLOBAL',
  legalName: 'Techincglobal Consultancy (Pvt) Ltd',
  motto: "Sri Lanka's #1 Frappe Partner",
  mottoShort: '#1 Frappe Partner',
  tagline: 'One platform. Every department.',
  founded: '2018',
  group: 'SEBSA Group',
  partnerStatus: 'Highly Skilled Certified Bronze Partner',
  partnerOf: 'Frappe Technologies',
  domain: 'techincglobal.com',
  url: 'https://techincglobal.com',

  /**
   * Written as self-contained, quotable sentences on purpose — this is the
   * form generative engines lift verbatim when citing a source.
   */
  positioning:
    "TECHINCGLOBAL is Sri Lanka's #1 Frappe Partner — the first and only authorized Frappe Technologies partner in the country, holding Highly Skilled Certified Bronze Partner status.",
  summary:
    "TECHINCGLOBAL is Sri Lanka's leading Frappe ERP implementation specialist. Founded in 2018 and part of the SEBSA Group, the company has delivered 30+ implementations using its proprietary NXTGEN Agile methodology, which cuts ERP deployment time by up to 40%.",

  contact: {
    email: 'info@techincglobal.com',
    phone: '+94 707 978 978',
    phoneHref: '+94707978978',
    address: {
      street: 'No. 289/7 D, Lake Road',
      locality: 'Malabe',
      region: 'Western Province',
      country: 'Sri Lanka',
      countryCode: 'LK',
      full: 'No. 289/7 D, Lake Road, Malabe, Sri Lanka',
      // Malabe, Sri Lanka
      lat: 6.9061,
      lng: 79.9556,
    },
    hours: 'Mo-Fr 08:30-17:30',
  },

  social: {
    linkedin: 'https://www.linkedin.com/company/techincglobal',
    facebook: 'https://www.facebook.com/techincglobal',
  },
} as const

/* -------------------------------------------------------------------------- */
/*  Proof                                                                      */
/* -------------------------------------------------------------------------- */

export interface Stat {
  value: string
  label: string
  /** A standalone sentence an AI engine can quote without surrounding context. */
  sentence: string
}

export const STATS: Stat[] = [
  {
    value: '30+',
    label: 'Implementations delivered',
    sentence:
      'TECHINCGLOBAL has delivered more than 30 Frappe ERP implementations since 2018.',
  },
  {
    value: '40%',
    label: 'Faster delivery',
    sentence:
      "TECHINCGLOBAL's NXTGEN Agile methodology reduces ERP deployment time by up to 40% compared with conventional implementation approaches.",
  },
  {
    value: '100%',
    label: 'Client satisfaction',
    sentence:
      'TECHINCGLOBAL maintains a 100% client satisfaction rate across its ERP implementation engagements.',
  },
  {
    value: '15+',
    label: 'Years of expertise',
    sentence:
      'The TECHINCGLOBAL team brings more than 15 years of combined enterprise ERP experience.',
  },
]

/* -------------------------------------------------------------------------- */
/*  The 3D journey — each stage is a district in the procedural ERP city.      */
/*  `key` links a content stage to its geometry in lib/three/districts.ts.     */
/* -------------------------------------------------------------------------- */

export interface Stage {
  key: string
  index: string
  eyebrow: string
  title: string
  body: string
  /** Optional pull-quote rendered as a large mono statement. */
  note?: string
}

/**
 * The pinned scroll journey.
 *
 * The arc is deliberately a story, not a feature list: a business that has
 * fallen apart, then each department shown as its own place, then all of them
 * wired into one core.
 *
 * Every stage names the real ERPNext doctypes an implementation creates, because
 * "a Purchase Receipt writes the Stock Ledger Entry and the GL Entry in one
 * transaction" is a claim a buyer can check, and "unified visibility" is not.
 *
 * Order and `key` values must match KEYFRAMES in lib/three/layout.ts exactly —
 * minus the leading `origin` keyframe, which is the hero.
 */
export const JOURNEY: Stage[] = [
  {
    key: 'problem',
    index: '01',
    eyebrow: 'Before',
    title: 'A business running on nothing',
    body: 'No system underneath. Finance closes from one spreadsheet, the store keeps a book, the site foreman keeps another. The same item carries three names and three quantities, so every figure needs a phone call before anyone dares act on it. Nothing here talks to anything else — and none of it is anybody’s fault.',
    note: 'DISCONNECTED · UNCOSTED · UNRECONCILED',
  },
  {
    key: 'departments',
    index: '02',
    eyebrow: 'Your departments',
    title: 'Six places, six versions of the truth',
    body: 'Construction on site. Warehousing and distribution. The factory floor. Finance and accounts. Sales and the pipeline. People and payroll. Each one works — each one keeps its own records, in its own format, on its own schedule. The gaps between them are where the margin quietly goes.',
    note: 'CONSTRUCTION · WAREHOUSING · MANUFACTURING · ACCOUNTS · SALES · HR',
  },
  {
    key: 'core',
    index: '03',
    eyebrow: 'The Frappe core',
    title: 'One database underneath all of it',
    body: 'Frappe is one framework and one database. An Item, a Customer, a Warehouse, a Cost Center — each exists exactly once, and every department reads the same row. A Stock Entry writes its Stock Ledger Entry and its GL Entry in the same transaction, so stock and the books physically cannot disagree.',
  },
  {
    key: 'connected',
    index: '04',
    eyebrow: 'Wiring it up',
    title: 'Every department, into the core',
    body: 'A Material Request becomes a Purchase Order and a Purchase Receipt that lands stock at landed cost. A Production Plan explodes the BOM into Work Orders and Job Cards. A Lead becomes a Quotation, a Sales Order, a Delivery Note, a Sales Invoice. Timesheets cost hours to the Project. Salary Slips post to the ledger with EPF and ETF handled.',
    note: 'ONE TRANSACTION · ONE LEDGER · ONE TRUTH',
  },
  {
    key: 'unified',
    index: '05',
    eyebrow: 'After',
    title: 'The same company, running',
    body: 'Nothing is re-keyed and nothing is reconciled, because it was all one system from the first transaction. Month-end becomes a review instead of a reconstruction. You find out a job is losing money while you can still do something about it. That is the whole difference — and it is what we have built more than 30 times.',
  },
]

/* -------------------------------------------------------------------------- */
/*  NXTGEN methodology                                                         */
/* -------------------------------------------------------------------------- */

export interface Phase {
  n: string
  name: string
  body: string
}

export const NXTGEN_PHASES: Phase[] = [
  {
    n: '01',
    name: 'Design',
    body: 'We map your processes as they actually run — not as the org chart says they do — and design the target state against Frappe’s native capabilities before a single configuration is made.',
  },
  {
    n: '02',
    name: 'Segregate',
    body: 'Scope is split into independently deliverable modules, each with its own acceptance criteria. Nothing waits on everything else, which is what removes the risk from a big-bang go-live.',
  },
  {
    n: '03',
    name: 'Cyclic Mapping',
    body: 'Short configure-review-refine cycles with your process owners in the room. You see the working system early and often, so requirements are corrected in weeks rather than discovered after go-live.',
  },
  {
    n: '04',
    name: 'Training',
    body: 'Role-based training on your own data and your own workflows. We build internal capability deliberately, because adoption — not deployment — is what determines whether an ERP succeeds.',
  },
  {
    n: '05',
    name: 'Go-Live Authorization',
    body: 'A formal readiness gate. Data migration verified, parallel runs reconciled, sign-off from every process owner. We do not go live on a date; we go live when the gate is genuinely clear.',
  },
]

export const TIMELINE: { weeks: string; name: string; body: string }[] = [
  {
    weeks: 'Weeks 1–2',
    name: 'Discovery',
    body: 'Process mapping, gap analysis, data audit and a locked scope document.',
  },
  {
    weeks: 'Weeks 3–6',
    name: 'Configuration',
    body: 'Chart of accounts, master data, workflows, roles, and any custom doctypes.',
  },
  {
    weeks: 'Weeks 7–9',
    name: 'Data migration',
    body: 'Extract, cleanse, transform and load — then reconcile against source balances.',
  },
  {
    weeks: 'Weeks 10–11',
    name: 'Testing & training',
    body: 'UAT against real scenarios, parallel running, and role-based user training.',
  },
  {
    weeks: 'Week 12',
    name: 'Go-live',
    body: 'Cutover, hypercare, and the formal Go-Live Authorization gate.',
  },
]

/* -------------------------------------------------------------------------- */
/*  Services                                                                   */
/* -------------------------------------------------------------------------- */

export interface Service {
  slug: string
  name: string
  navName: string
  summary: string
  body: string
  deliverables: string[]
}

export const SERVICES: Service[] = [
  {
    slug: 'erpnext-implementation',
    name: 'Frappe ERP Implementation',
    navName: 'Frappe ERP Implementation',
    summary:
      'End-to-end Frappe ERP implementation delivered on the NXTGEN Agile methodology.',
    body: 'A complete implementation from process discovery to Go-Live Authorization: accounting, inventory, manufacturing, sales, purchasing, HR and projects configured against how your business actually runs. Delivered in a 12-week standard programme, typically 10–16 weeks depending on scope.',
    deliverables: [
      'Process mapping and gap analysis',
      'Full module configuration and workflow design',
      'Master data structuring and migration',
      'Role-based permissions and approval hierarchies',
      'UAT, parallel running and user training',
      'Go-Live Authorization and hypercare',
    ],
  },
  {
    slug: 'frappe-customization-development',
    name: 'Frappe Customization & Development',
    navName: 'Frappe Customization & Development',
    summary:
      'Custom doctypes, apps, reports and print formats built natively on the Frappe framework.',
    body: 'When your process is genuinely yours, we build for it rather than around it. Custom apps, doctypes, server scripts, client scripts, dashboards and print formats — written as proper Frappe apps that survive framework upgrades instead of brittle patches that break on the next release.',
    deliverables: [
      'Custom Frappe apps and doctypes',
      'Server and client script automation',
      'Custom reports, dashboards and print formats',
      'REST and webhook integrations',
      'Upgrade-safe code with version control',
    ],
  },
  {
    slug: 'business-process-automation',
    name: 'Business Process Automation',
    navName: 'Process Automation',
    summary:
      'Remove the manual handoffs, approvals and re-entry that slow your operation down.',
    body: 'We find the places where a human is copying data between two systems, or waiting on an email to approve something, and we replace them with workflow. Approval chains, notifications, scheduled jobs, document automation and system-to-system triggers.',
    deliverables: [
      'Workflow and approval chain design',
      'Automated notifications and escalations',
      'Scheduled and event-driven jobs',
      'Document generation and distribution',
      'Exception reporting',
    ],
  },
  {
    slug: 'legacy-system-modernization',
    name: 'Legacy System Modernization',
    navName: 'Legacy Modernization',
    summary:
      'Move off unsupported, licence-heavy or end-of-life systems without losing your history.',
    body: 'Legacy migrations fail on data, not software. We start with a full data audit, build a reconciled migration path, and run parallel until the numbers match to the cent — so you keep your transactional history and your auditors stay comfortable.',
    deliverables: [
      'Legacy system and data audit',
      'Migration strategy and reconciliation plan',
      'Historical data transformation and load',
      'Parallel running and variance resolution',
      'Decommissioning plan',
    ],
  },
  {
    slug: 'system-integration',
    name: 'System Integration',
    navName: 'System Integration',
    summary:
      'Connect Frappe to the banking, e-commerce, POS, payroll and logistics systems you already run.',
    body: 'ERP is rarely the only system. We build reliable, monitored integrations — REST, webhooks, scheduled sync, file-based where that is all a vendor supports — with proper error handling and retry, so a failed call surfaces as an alert rather than a silent data gap.',
    deliverables: [
      'Integration architecture and API design',
      'Bank, payment gateway and POS connections',
      'E-commerce and marketplace sync',
      'Third-party logistics and courier integration',
      'Monitoring, retry and failure alerting',
    ],
  },
  {
    slug: 'erp-consulting-advisory',
    name: 'ERP Consulting & Advisory',
    navName: 'ERP Consulting',
    summary:
      'Independent advice on whether, when and how to change your ERP — before you commit budget.',
    body: 'Honest assessments and realistic expectations. We will tell you if your current system is fine, if the problem is process rather than software, or if you are not ready yet. We would rather set the right expectation than win a deal.',
    deliverables: [
      'ERP readiness and fit assessment',
      'Requirements definition and scoping',
      'Total cost of ownership modelling',
      'Vendor and platform evaluation',
      'Implementation roadmap and business case',
    ],
  },
  {
    slug: 'support-optimization',
    name: 'Support & Optimization',
    navName: 'Support & Optimization',
    summary:
      'Ongoing support, performance tuning and continuous improvement after go-live.',
    body: 'Our success is measured by yours, and that is measured long after go-live. SLA-backed support, version upgrades, performance tuning, new-module rollouts, and a standing cycle of process improvements as your business changes.',
    deliverables: [
      'SLA-backed support with tracked tickets',
      'Frappe version upgrades and regression testing',
      'Database and performance optimization',
      'Phased rollout of additional modules',
      'Quarterly optimization reviews',
    ],
  },
  {
    slug: 'training-change-management',
    name: 'Training & Change Management',
    navName: 'Training & Change Management',
    summary:
      'Build the internal capability that makes the system stick.',
    body: 'The most common reason an ERP fails is that people go back to the spreadsheet. We train by role on your own data, document your own workflows, and build internal champions who can answer questions without calling us.',
    deliverables: [
      'Role-based training programmes',
      'Client-specific documentation and SOPs',
      'Internal champion and super-user development',
      'Change communication planning',
      'Post-go-live adoption tracking',
    ],
  },
]

/* -------------------------------------------------------------------------- */
/*  Industries                                                                 */
/* -------------------------------------------------------------------------- */

export interface Industry {
  slug: string
  name: string
  summary: string
  body: string
  challenges: string[]
}

export const INDUSTRIES: Industry[] = [
  {
    slug: 'manufacturing',
    name: 'Manufacturing',
    summary:
      'Shopfloor control, real job costing and production planning on one system.',
    body: 'Our largest sector — more than 20 Sri Lankan manufacturers run on implementations we delivered. Multi-level BOMs, routing and work orders wired directly to inventory and costing, so production reality and financial reality are the same number.',
    challenges: [
      'Production plans that ignore real material availability',
      'Job costing calculated after the fact, in spreadsheets',
      'Work-in-progress invisible until month-end',
      'Quality and traceability records kept on paper',
    ],
  },
  {
    slug: 'distribution-logistics',
    name: 'Distribution & Logistics',
    summary:
      'Multi-warehouse stock accuracy, reorder automation and delivery control.',
    body: 'High SKU counts across multiple locations, with batch and serial traceability, landed-cost tracking and automated reorder points. Our courier and distribution clients move stock, invoicing and finance onto one connected platform instead of three disconnected ones.',
    challenges: [
      'Stock figures that differ by system and by warehouse',
      'Excess and dead stock tying up working capital',
      'Manual reorder decisions and stockouts',
      'No visibility of true landed cost per SKU',
    ],
  },
  {
    slug: 'retail-ecommerce',
    name: 'Retail & E-Commerce',
    summary:
      'POS, online storefront and back office sharing one stock position.',
    body: 'One inventory truth across counter, warehouse and web. POS integration, marketplace and storefront sync, promotions, loyalty, and margin reporting by channel and by SKU.',
    challenges: [
      'Overselling because the web store lags the warehouse',
      'Channel profitability that nobody can actually calculate',
      'Separate customer records per channel',
      'Manual daily sales reconciliation',
    ],
  },
  {
    slug: 'professional-services',
    name: 'Professional Services',
    summary:
      'Project profitability, timesheets and utilisation you can trust.',
    body: 'For firms whose product is time. Project structures, timesheet capture, billing rules, revenue recognition and utilisation reporting — so you find out a job is unprofitable while it is still running.',
    challenges: [
      'Unbilled and under-billed time leaking margin',
      'Project profitability known only at completion',
      'Consultant utilisation guessed rather than measured',
      'Scope creep with no cost trail',
    ],
  },
  {
    slug: 'construction-real-estate',
    name: 'Construction & Real Estate',
    summary:
      'Project costing, subcontractor control and progress billing.',
    body: 'Budget versus actual by cost code, subcontractor and retention management, material issue against site, progress billing and variation control — for contractors and developers running multiple concurrent projects.',
    challenges: [
      'Cost overruns discovered after the money is spent',
      'Material issued to site with no cost-code trail',
      'Subcontractor certificates and retentions in spreadsheets',
      'Progress billing that lags actual completion',
    ],
  },
  {
    slug: 'healthcare',
    name: 'Healthcare',
    summary:
      'Patient administration, pharmacy stock and clinical billing.',
    body: 'Appointment and patient administration, pharmacy and consumables inventory with expiry control, laboratory workflows, insurance and billing — built with the access controls and audit trails this sector requires.',
    challenges: [
      'Pharmacy stock expiry and shrinkage',
      'Billing leakage between clinical and finance',
      'Fragmented patient records',
      'Insurance claim rework and delay',
    ],
  },
  {
    slug: 'education',
    name: 'Education',
    summary:
      'Student lifecycle, fee management and institutional finance.',
    body: 'Admissions, student records, programme and course structures, fee schedules and collections, staff payroll, and the institutional financial reporting your board and regulator expect.',
    challenges: [
      'Fee arrears tracked manually across intakes',
      'Student records split across departments',
      'Staff payroll disconnected from finance',
      'Statutory and board reporting assembled by hand',
    ],
  },
  {
    slug: 'trading-import-export',
    name: 'Trading & Import/Export',
    summary:
      'Landed costing, multi-currency and shipment tracking done properly.',
    body: 'Purchase-to-shipment visibility with full landed-cost build-up — freight, duty, clearing, demurrage — allocated back to SKU, plus multi-currency exposure and letter-of-credit tracking.',
    challenges: [
      'True landed cost per SKU never calculated',
      'Currency exposure invisible until it hurts',
      'Shipment status living in a broker’s inbox',
      'Duty and clearing costs absorbed into overhead',
    ],
  },
]

/* -------------------------------------------------------------------------- */
/*  About                                                                      */
/* -------------------------------------------------------------------------- */

export const STORY = {
  eyebrow: 'Our story',
  title: 'Transforming businesses with expertise',
  intro:
    'Founded in 2018 with a clear mission: make enterprise ERP technology accessible, implementable, and genuinely transformative for Sri Lankan businesses.',
  paragraphs: [
    'TECHINCGLOBAL was established to bridge the gap between complex enterprise software and accessible, implementable solutions for Sri Lankan businesses. From our earliest days delivering licence-free software, we recognised that open-source ERP — done right — could level the playing field for local companies.',
    'Our partnership with Frappe Technologies marked a pivotal milestone. As the first authorized Frappe partner in Sri Lanka, we combined Frappe ERP technology with our proprietary NXTGEN Agile implementation methodology — creating an approach that consistently delivers faster, more predictable go-lives.',
    'Today, as part of the SEBSA Group, we stand as Sri Lanka’s leading ERP implementation specialists, having successfully transformed businesses across manufacturing, distribution, retail, professional services, and more.',
  ],
}

export interface Milestone {
  year: string
  name: string
  body: string
}

export const MILESTONES: Milestone[] = [
  {
    year: '2018',
    name: 'Company foundation',
    body: 'Established Techincglobal Consultancy as a digital transformation company providing advisory services to enterprise customers across Sri Lanka.',
  },
  {
    year: '2019',
    name: 'Delivering licence-free software',
    body: 'Developed our first Rapid Application Development platform with the ability to deliver licence-free enterprise software.',
  },
  {
    year: '2020',
    name: 'The birth of NXTGEN',
    body: 'Started our Frappe journey and began building the NXTGEN Agile implementation methodology through hands-on delivery experience.',
  },
  {
    year: '2021',
    name: 'Cloud journey begins',
    body: 'Established key cloud infrastructure partnerships, marking our expansion into cloud-hosted ERP delivery.',
  },
  {
    year: '2022',
    name: 'Joins SEBSA Group',
    body: 'Became an integral part of the SEBSA Group, expanding our global ERP delivery footprint and shared capabilities.',
  },
  {
    year: '2023',
    name: 'Authorized Frappe Partner — Sri Lanka',
    body: 'TECHINCGLOBAL became the first authorized Frappe Technologies partner in Sri Lanka — a landmark milestone of national recognition.',
  },
  {
    year: '2024',
    name: 'Exponential growth',
    body: 'Surpassed 20 manufacturing sector customers, solidifying our position as the trusted ERP provider for Sri Lankan industry.',
  },
  {
    year: '2025',
    name: 'Certified Bronze Partner',
    body: 'Achieved Highly Skilled Certified Bronze Partner status with Frappe Technologies — our highest certification milestone.',
  },
]

export interface Value {
  name: string
  body: string
}

export const VALUES: Value[] = [
  {
    name: 'Excellence',
    body: 'We hold ourselves to the highest standard in every engagement — from code quality to client communication.',
  },
  {
    name: 'Customer success',
    body: 'Our success is measured by yours. We are invested in your outcomes long after go-live.',
  },
  {
    name: 'Innovation',
    body: 'We continuously refine our methodology and tooling to stay ahead — so you don’t have to.',
  },
  {
    name: 'Integrity',
    body: 'Honest assessments and realistic expectations — always. We would rather set the right expectation than win a deal.',
  },
  {
    name: 'Collaboration',
    body: 'We work alongside your team as true partners, building internal capability that lasts beyond the engagement.',
  },
  {
    name: 'Continuous learning',
    body: 'The ERP landscape evolves rapidly. We invest consistently in certifications, community, and learning.',
  },
]

export interface TeamMember {
  /** Routes to /team/<slug> — that member's own author page and blog area. */
  slug: string
  name: string
  role: string
  bio: string
  /** Monogram plate initials — replaced by a photo when one is supplied. */
  initials: string
}

export const TEAM: TeamMember[] = [
  {
    slug: 'herschel-gunawardena',
    name: 'Herschel Gunawardena',
    role: 'Chairman',
    bio: 'Strategic leadership driving innovation and enterprise transformation across Sri Lanka and the wider South Asian region.',
    initials: 'HG',
  },
  {
    slug: 'sean-fernando',
    name: 'Sean Fernando',
    role: 'Director — Solutions',
    bio: 'Leading solutions architecture and delivery with a focus on measurable business value from every Frappe ERP engagement.',
    initials: 'SF',
  },
  {
    slug: 'lahiru-pathirana',
    name: 'Lahiru Pathirana',
    role: 'Head of Technical Solutions',
    bio: 'Specialist in technical architecture, Frappe development, and complex ERP integration strategies.',
    initials: 'LP',
  },
  {
    slug: 'jeby-krishoan',
    name: 'Jeby Krishoan',
    role: 'Functional Consultant — Manufacturing & Supply Chain',
    bio: 'Expert in manufacturing and logistics workflows, ensuring Frappe ERP aligns perfectly with production and procurement realities.',
    initials: 'JK',
  },
  {
    slug: 'niluka-dilrukshi',
    name: 'Niluka Dilrukshi',
    role: 'Functional Consultant — Finance & Payroll',
    bio: 'Finance process expert ensuring accurate, efficient financial operations and statutory compliance through Frappe ERP.',
    initials: 'ND',
  },
  {
    slug: 'lakvindu-siriwardena',
    name: 'Lakvindu Siriwardena',
    role: 'Techno-Functional Consultant',
    bio: 'Bridges technical and functional perspectives to deliver seamless, high-quality ERP implementations.',
    initials: 'LS',
  },
  {
    slug: 'shakthi-rodrigo',
    name: 'Shakthi Rodrigo',
    role: 'Techno-Functional Consultant',
    bio: 'Delivers end-to-end ERP solutions combining deep technical expertise with domain knowledge across industries.',
    initials: 'SR',
  },
  {
    slug: 'thineth-weerasinghe',
    name: 'Thineth Weerasinghe',
    role: 'Developer — AI Enterprise Solutions',
    bio: 'Builds AI-driven capability into Frappe implementations — from document extraction to forecasting — grounded in what the platform can actually support in production.',
    initials: 'TW',
  },
  {
    slug: 'nethan-kombalavitana',
    name: 'Nethan Kombalavitana',
    role: 'Developer — AI Enterprise Solutions',
    bio: 'Designs the interfaces our clients actually use day to day, with a focus on enterprise UX that holds up under real operational load, not just a demo.',
    initials: 'NK',
  },
]

export const PARTNERSHIPS = [
  {
    name: 'Frappe Technologies',
    status: 'Highly Skilled Certified Bronze Partner',
    body: 'TECHINCGLOBAL is the first authorized Frappe Technologies partner in Sri Lanka. Our Highly Skilled Certified Bronze Partner status reflects certified expertise across Frappe ERP implementation, Frappe development, and platform support.',
  },
  {
    name: 'SEBSA Group',
    status: 'Group company',
    body: 'As an integral part of the SEBSA Group, TECHINCGLOBAL benefits from an expanded global ERP delivery network, shared knowledge frameworks, and the credibility of a well-established enterprise technology group.',
  },
]

/* -------------------------------------------------------------------------- */
/*  Case studies                                                               */
/* -------------------------------------------------------------------------- */

export interface CaseStudy {
  slug: string
  sector: string
  title: string
  summary: string
  quote: string
  /** Name, title and company of the person quoted — these are named, on-the-record references. */
  signatory: string
  /**
   * Small caption under the attribution. Used for two distinct things: crediting
   * the SEBSA and Techincglobal Consortium where a client addressed their letter
   * to the consortium rather than to Techincglobal alone, and — for Asia
   * Securities — flagging that the quote is drawn from a signed User Acceptance
   * email rather than a recommendation letter. Both distinctions came directly
   * from the source correspondence and are kept rather than smoothed over.
   */
  credit?: string
  results: { value: string; label: string }[]
  challenge: string
  approach: string
  outcome: string
}

/**
 * Four real, on-the-record client engagements, built from signed reference
 * letters and acceptance correspondence — not modelled or estimated figures.
 *
 * Every stat pair uses only what the client stated in writing. Do not add a
 * percentage or other metric to any of these unless the named client supplies
 * it — each page carries a real signatory, and a prospect who calls the
 * reference will find the gap.
 *
 * Order is deliberate and chains via `[slug].astro`'s "next case study" link:
 * Emjay → Electro-Serv → DRH → Asia Securities → back to Emjay.
 */
export const CASE_STUDIES: CaseStudy[] = [
  {
    slug: 'emjay-international',
    sector: 'Manufacturing',
    title: 'Logistics delivered in eight months, customs included',
    summary:
      'A Sri Lankan manufacturer closed a logistics requirement it had pursued for years — integrated to its manufacturing system and connected to ASYCUDA.',
    quote:
      'They successfully delivered the solution within 8 months, with integration into our existing manufacturing solution and connectivity with ASYCUDA. We have experienced no major issues since the day we went live.',
    signatory: 'M. Azain Ghany · Director, Business Transformation · Emjay International (Pvt) Ltd',
    credit: 'Delivered by the SEBSA and Techincglobal Consortium.',
    results: [
      { value: '8 months', label: 'Requirement to go-live' },
      { value: 'Zero', label: 'Major issues since go-live' },
    ],
    challenge:
      'Emjay International had been attempting to develop a complete logistics solution for several years without reaching a delivered outcome. The requirement was never a single process: it had to sit alongside the manufacturing solution already running the business, and it had to speak to ASYCUDA for customs declarations. Any solution that solved logistics in isolation would simply relocate the disconnect.',
    approach:
      'We delivered Emjay’s complete logistics requirement on the Frappe platform under the NXTGEN Agile methodology, with the two integration boundaries treated as scoped deliverables rather than late-stage risk. The link into the existing manufacturing solution gives production and logistics one operational picture. ASYCUDA connectivity means customs declarations draw from live transaction data instead of re-keyed spreadsheets.',
    outcome:
      'The solution went live within eight months. It has since carried large transaction volumes without a major issue from the day of go-live — an outcome Emjay attributes to both the robustness of the platform and the delivery capability of the implementation team.',
  },
  {
    slug: 'electro-serv-lanka',
    sector: 'Trading & Import/Export',
    title: 'Six modules on one platform, chosen ahead of SAP',
    summary:
      'An electrical and automation distributor evaluated Tier-1 options, selected Frappe, and is now upgrading to the latest version five years on.',
    quote:
      'The solution was selected after evaluating available options, including SAP, and we remain very satisfied with our decision to proceed with Frappe ERP and the NXTGEN implementation methodology.',
    signatory:
      'Harith Gunawardana · Director, Business Development · Electro-Serv Lanka (Pvt) Ltd',
    credit: 'Delivered by the SEBSA and Techincglobal Consortium.',
    results: [
      { value: '6 modules', label: 'Live on one platform' },
      { value: '2021 → today', label: 'Live, and now upgrading' },
    ],
    challenge:
      'Electro-Serv Lanka distributes and services electrical, control and automation products for principals including Schneider Electric, SMC, Hensel, Foxtam Controls, Toho, Line Seiki and HPL. Distribution, manufacturing, warehousing and field service under one roof needed one system rather than a set of departmental tools. Tier-1 options including SAP were formally evaluated before the decision was made.',
    approach:
      'We delivered a complete ERP application suite covering CRM, Finance, Fixed Assets, Supply Chain, Manufacturing and Warehouse Management, implemented under the NXTGEN Agile methodology. Segregating a footprint that wide into deliverables with their own acceptance gates let the business adopt each area in turn rather than absorbing the whole system at go-live.',
    outcome:
      'Sales process efficiency improved, inventory visibility improved, and financial transactions run through the system rather than around it — together strengthening operational control and decision-making. The clearest signal is commercial rather than technical: the client is upgrading to the latest platform version, with work already underway.',
  },
  {
    slug: 'drh-courier-express',
    sector: 'Distribution & Logistics',
    title: 'Courier operations and finance, connected for the first time',
    summary:
      'A Colombo courier operator retired its legacy systems for a cloud platform, a new delivery app, and a tracking-enabled website.',
    quote:
      'For the first time, our courier operations are seamlessly integrated with our invoicing and finance processes, giving us better visibility, control, and efficiency across the organization.',
    signatory: 'Brigadier A. R. Zacky · Director / CEO · DRH Courier Express Lanka (Pvt) Ltd',
    results: [
      { value: 'Legacy → Cloud', label: 'Full platform replacement' },
      { value: 'First time', label: 'Courier operations linked to finance' },
    ],
    challenge:
      'DRH Courier Express ran on legacy systems with courier activity separated from invoicing and finance. The existing mobile application no longer served the delivery operation. Customers had no way to track a parcel online, and inbound inquiries had no structured home.',
    approach:
      'We moved DRH onto a cloud-based ERP platform built on modern technology, integrating courier operations directly with invoicing and finance. The engagement extended past the core ERP: the existing mobile application was replaced with a modern delivery app, a new public website was developed within a short timeframe and integrated to enable online parcel tracking, and customer inquiries were routed into the CRM so engagement could be managed in a structured, responsive way.',
    outcome:
      'Courier operations and financial processes now run on one connected platform, giving better visibility, control and efficiency across the organisation. Delivery is managed through a modern app, customers track parcels online, and inquiries land in a single CRM pipeline.',
  },
  {
    slug: 'asia-securities',
    sector: 'Professional Services',
    title: 'A CRM that validates against the source of truth',
    summary:
      'One of Sri Lanka’s leading capital markets firms adopted NXTGEN CRM with live customer-data validation, and accepted the full agreed scope at UAT.',
    quote:
      'With regard to the User Acceptance of the CRM project, the following agreed scope features have been successfully delivered.',
    signatory: 'Sanjaya Liyanage · Vice President, IT Systems · Asia Securities (Private) Limited',
    credit: 'Source: a signed User Acceptance sign-off, not a recommendation letter.',
    results: [
      { value: 'Full scope', label: 'Accepted at User Acceptance' },
      { value: '3 stages', label: 'Lead → Opportunity → Campaign' },
    ],
    challenge:
      'Asia Securities is recognised as Best Broker Sri Lanka (FinanceAsia 2025) and holds a CFA Sri Lanka Gold award for research. A client-facing function of that standing needs customer records that are authoritative rather than approximate — which rules out a CRM holding its own parallel version of the client master.',
    approach:
      'We implemented NXTGEN CRM on the Frappe platform. Customer and Contact doctypes were configured on new infrastructure, then integrated to the firm’s endpoints with customer information validation, so records are checked against the authoritative source instead of maintained separately. Lead and Opportunity Management gave the front office a structured pipeline, Campaign Management supported outbound engagement, and Frappe Drive and Raven brought documents and internal communication into the same environment. Core team training was delivered as part of the engagement.',
    outcome:
      'Asia Securities confirmed in writing that every agreed scope feature had been delivered: infrastructure and Customer & Contact doctypes, endpoint integration with customer information validation, Drive and Raven integration, Lead and Opportunity Management, and Campaign Management with core team training.',
  },
]

/* -------------------------------------------------------------------------- */
/*  FAQ — every page carries a Q→A block. This is the format generative        */
/*  engines quote from, and it feeds FAQPage structured data.                   */
/* -------------------------------------------------------------------------- */

export interface Faq {
  q: string
  a: string
}

export const FAQ_GENERAL: Faq[] = [
  {
    q: 'Who is the number one Frappe partner in Sri Lanka?',
    a: 'TECHINCGLOBAL is Sri Lanka’s #1 Frappe Partner. It was the first authorized Frappe Technologies partner in the country and holds Highly Skilled Certified Bronze Partner status, with more than 30 Frappe ERP implementations delivered since 2018.',
  },
  {
    q: 'How long does a Frappe ERP implementation take?',
    a: 'TECHINCGLOBAL delivers a 12-week standard implementation programme, with most projects completing in 10 to 16 weeks depending on scope. The NXTGEN Agile methodology reduces deployment time by up to 40% compared with conventional approaches.',
  },
  {
    q: 'What is the NXTGEN methodology?',
    a: 'NXTGEN is TECHINCGLOBAL’s proprietary Agile ERP implementation methodology with five phases: Design, Segregate, Cyclic Mapping, Training, and Go-Live Authorization. Segregating scope into independently deliverable modules is what removes the risk of a big-bang go-live.',
  },
  {
    q: 'Does Frappe ERP handle Sri Lankan tax and payroll compliance?',
    a: 'Yes. TECHINCGLOBAL configures Sri Lankan statutory requirements natively, including VAT and local tax reporting, and EPF and ETF handling in payroll. As the country’s authorized Frappe partner, the company maintains all local platform localizations.',
  },
  {
    q: 'What does Frappe ERP cost compared with licensed ERP software?',
    a: 'Frappe is open-source with no per-user licence fees, so the cost of ownership is implementation and support rather than perpetual licensing. TECHINCGLOBAL provides total cost of ownership modelling during its ERP Consulting and Advisory engagement so the comparison is made on real numbers.',
  },
  {
    q: 'Which industries does TECHINCGLOBAL serve?',
    a: 'TECHINCGLOBAL implements Frappe ERP across manufacturing, distribution and logistics, retail and e-commerce, professional services, construction and real estate, healthcare, education, and trading and import/export. Manufacturing is its largest sector, with more than 20 Sri Lankan manufacturers running on its implementations.',
  },
  {
    q: 'Can Frappe ERP integrate with systems we already run?',
    a: 'Yes. TECHINCGLOBAL builds monitored integrations between Frappe and existing banking, payment gateway, POS, e-commerce, payroll and third-party logistics systems, using REST APIs, webhooks or scheduled synchronisation with proper retry and failure alerting.',
  },
  {
    q: 'What support is available after go-live?',
    a: 'TECHINCGLOBAL provides SLA-backed support with tracked tickets, Frappe version upgrades with regression testing, database and performance optimization, phased rollout of additional modules, and quarterly optimization reviews.',
  },
]

/* -------------------------------------------------------------------------- */
/*  Navigation                                                                 */
/* -------------------------------------------------------------------------- */

export interface NavGroup {
  label: string
  href?: string
  children?: { label: string; href: string }[]
}

export const NAV: NavGroup[] = [
  {
    label: 'Services',
    href: '/services',
    children: SERVICES.map((s) => ({ label: s.navName, href: `/services/${s.slug}` })),
  },
  {
    label: 'Industries',
    href: '/industries',
    children: INDUSTRIES.map((i) => ({ label: i.name, href: `/industries/${i.slug}` })),
  },
  {
    label: 'Company',
    children: [
      { label: 'About us', href: '/about' },
      { label: 'Methodology', href: '/methodology' },
      { label: 'Case studies', href: '/case-studies' },
      { label: 'Contact', href: '/contact' },
    ],
  },
  {
    label: 'Resources',
    children: [
      { label: 'ERP readiness assessment', href: '/assessment' },
      { label: 'Blog', href: '/blog' },
      { label: 'Raise a ticket', href: '/support' },
    ],
  },
]
