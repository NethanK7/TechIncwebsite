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
    "TECHINCGLOBAL is Sri Lanka's leading Frappe ERP implementation specialist. Founded in 2018 and part of the SEBSA Group, the company has delivered 150+ implementations using its proprietary NXTGEN Agile methodology, which cuts ERP deployment time by up to 40%.",

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
    value: '150+',
    label: 'Implementations delivered',
    sentence:
      'TECHINCGLOBAL has delivered more than 150 Frappe ERP implementations since 2018.',
  },
  {
    value: '40%',
    label: 'Faster delivery',
    sentence:
      "TECHINCGLOBAL's NXTGEN Agile methodology reduces ERP deployment time by up to 40% compared with conventional implementation approaches.",
  },
  {
    value: '98%',
    label: 'Client satisfaction',
    sentence:
      'TECHINCGLOBAL maintains a 98% client satisfaction rate across its ERP implementation engagements.',
  },
  {
    value: '10+',
    label: 'Years of expertise',
    sentence:
      'The TECHINCGLOBAL team brings more than 10 years of combined enterprise ERP experience.',
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
 * Order and `key` values must match KEYFRAMES in lib/three/layout.ts exactly —
 * minus the leading `origin` keyframe, which is the hero. The engine reports the
 * active stage by key, and the stepper highlights the matching entry.
 */
export const JOURNEY: Stage[] = [
  {
    key: 'problem',
    index: '01',
    eyebrow: 'The problem',
    title: 'Your departments are islands',
    body: 'Finance closes the books from one spreadsheet. Production plans from another. Sales keeps its pipeline somewhere else entirely. Nothing reconciles, every number needs a phone call to confirm, and month-end takes five days it should not take.',
  },
  {
    key: 'core',
    index: '02',
    eyebrow: 'The Frappe core',
    title: 'One open platform underneath',
    body: 'Frappe is full-stack and open-source — no licence fees, no vendor lock-in. Every module writes to one database, so a goods receipt updates stock, costing and the general ledger in the same transaction. This is the foundation under every implementation we deliver.',
  },
  {
    key: 'finance',
    index: '03',
    eyebrow: 'Finance & accounting',
    title: 'Month-end in a day, not a week',
    body: 'Double-entry accounting, multi-currency, cost centres, budgets, and statutory compliance for Sri Lankan reporting. Because every transaction posts itself, closing stops being a reconciliation exercise and becomes a review.',
  },
  {
    key: 'manufacturing',
    index: '04',
    eyebrow: 'Manufacturing',
    title: 'The shopfloor, wired to the ledger',
    body: 'Multi-level BOMs, routing, work orders, capacity planning and real job costing. Material issued on the floor moves inventory and cost in the same moment — so what you quoted is what you actually earn.',
  },
  {
    key: 'inventory',
    index: '05',
    eyebrow: 'Inventory & distribution',
    title: 'Know what you have, everywhere',
    body: 'Multi-warehouse stock with batch and serial traceability, reorder automation, landed-cost tracking and delivery routing. Our distribution clients run at 99.2% inventory accuracy.',
  },
  {
    key: 'crm',
    index: '06',
    eyebrow: 'CRM & sales',
    title: 'Pipeline that ends in a real invoice',
    body: 'Leads, deals, quotations and orders in one funnel — wired directly to stock availability and credit limits. Your sales team stops promising what the warehouse cannot ship.',
  },
  {
    key: 'hr',
    index: '07',
    eyebrow: 'HRMS & payroll',
    title: 'People and payroll on one spine',
    body: 'Employee lifecycle, shift and attendance capture, leave, appraisals, and payroll with EPF and ETF handled correctly for Sri Lanka. Payroll posts straight to the general ledger — no re-entry, no reconciliation.',
  },
  {
    key: 'projects',
    index: '08',
    eyebrow: 'Projects & services',
    title: 'Every hour costed against the job',
    body: 'Project structures, tasks, timesheets and billing flowing into revenue recognition and profitability per project. You find out a job is losing money while you can still do something about it.',
  },
  {
    key: 'unified',
    index: '09',
    eyebrow: 'Unified',
    title: 'One platform. Every department.',
    body: 'This is what an implementation actually delivers: not eight tools that talk to each other, but one system where finance, production, stock, sales, people and projects are the same data seen from different angles.',
  },
  {
    key: 'methodology',
    index: '10',
    eyebrow: 'The NXTGEN methodology',
    title: 'Five phases, then a gate',
    body: 'Design, Segregate, Cyclic Mapping, Training, Go-Live Authorization. Segregating scope into independently deliverable modules is what removes big-bang risk — and why our implementations land up to 40% faster.',
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
    body: 'High SKU counts across multiple locations, with batch and serial traceability, landed-cost tracking and automated reorder points. Our distribution clients run at 99.2% inventory accuracy with 40% less excess stock.',
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
  name: string
  role: string
  bio: string
  /** Monogram plate initials — replaced by a photo when one is supplied. */
  initials: string
}

export const TEAM: TeamMember[] = [
  {
    name: 'Herschel Gunawardena',
    role: 'Chairman',
    bio: 'Strategic leadership driving innovation and enterprise transformation across Sri Lanka and the wider South Asian region.',
    initials: 'HG',
  },
  {
    name: 'Sean Fernando',
    role: 'Director — Solutions',
    bio: 'Leading solutions architecture and delivery with a focus on measurable business value from every Frappe ERP engagement.',
    initials: 'SF',
  },
  {
    name: 'Lahiru Pathirana',
    role: 'Head of Technical Solutions',
    bio: 'Specialist in technical architecture, Frappe development, and complex ERP integration strategies.',
    initials: 'LP',
  },
  {
    name: 'Jeby Krishoan',
    role: 'Functional Consultant — Manufacturing & Supply Chain',
    bio: 'Expert in manufacturing and logistics workflows, ensuring Frappe ERP aligns perfectly with production and procurement realities.',
    initials: 'JK',
  },
  {
    name: 'Niluka Dilrukshi',
    role: 'Functional Consultant — Finance & Payroll',
    bio: 'Finance process expert ensuring accurate, efficient financial operations and statutory compliance through Frappe ERP.',
    initials: 'ND',
  },
  {
    name: 'Lakvindu Siriwardena',
    role: 'Techno-Functional Consultant',
    bio: 'Bridges technical and functional perspectives to deliver seamless, high-quality ERP implementations.',
    initials: 'LS',
  },
  {
    name: 'Shakthi Rodrigo',
    role: 'Techno-Functional Consultant',
    bio: 'Delivers end-to-end ERP solutions combining deep technical expertise with domain knowledge across industries.',
    initials: 'SR',
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
  results: { value: string; label: string }[]
  challenge: string
  approach: string
  outcome: string
}

export const CASE_STUDIES: CaseStudy[] = [
  {
    slug: 'manufacturing-frappe',
    sector: 'Manufacturing',
    title: 'Shopfloor operations rebuilt around one system',
    summary:
      'A Sri Lankan manufacturer cut production lead time by 30% and reduced month-end closing from five days to one.',
    quote:
      'TECHINCGLOBAL didn’t just install a system; they fundamentally optimized our shopfloor operations.',
    results: [
      { value: '30%', label: 'Production lead time reduction' },
      { value: '5 days → 1 day', label: 'Month-end closing' },
    ],
    challenge:
      'Production scheduling ran on spreadsheets that had no view of real material availability. Job costing was reconstructed after the fact, so quoted margin and earned margin routinely diverged. Month-end took five days of manual consolidation across finance, stores and production.',
    approach:
      'We ran the NXTGEN Agile methodology across five segregated modules — accounting, inventory, BOM and routing, work orders, and costing — each with its own acceptance gate. Cyclic mapping sessions with the production and finance leads corrected the routing model in week four rather than after go-live.',
    outcome:
      'Material issue on the floor now moves stock, work-in-progress and the general ledger in one transaction. Production lead time fell 30%, and month-end closing became a one-day review instead of a five-day reconciliation.',
  },
  {
    slug: 'distribution-frappe',
    sector: 'Distribution & Logistics',
    title: 'Inventory accuracy to 99.2% across every warehouse',
    summary:
      'A multi-location distributor reached 99.2% inventory accuracy and cut excess stock by 40%.',
    quote:
      'Their team’s understanding of regional tax policies and Frappe localization has been a game changer.',
    results: [
      { value: '99.2%', label: 'Inventory accuracy' },
      { value: '40%', label: 'Excess stock reduction' },
    ],
    challenge:
      'Stock figures differed between the head-office system and each warehouse. Reorder decisions were made on instinct, producing simultaneous stockouts and dead stock. Landed cost per SKU was never actually calculated, so channel margin was unknown.',
    approach:
      'Multi-warehouse inventory with batch traceability, automated reorder levels driven by consumption history, and a landed-cost model that allocates freight, duty and clearing back to SKU. Sri Lankan tax localization was configured natively rather than bolted on.',
    outcome:
      'Inventory accuracy reached 99.2% and excess stock fell 40%, releasing working capital. Margin is now reportable per SKU and per channel on real landed cost.',
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
    a: 'TECHINCGLOBAL is Sri Lanka’s #1 Frappe Partner. It was the first authorized Frappe Technologies partner in the country and holds Highly Skilled Certified Bronze Partner status, with more than 150 Frappe ERP implementations delivered since 2018.',
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
