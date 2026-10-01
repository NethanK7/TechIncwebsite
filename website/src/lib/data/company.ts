/**
 * Single source of truth for every fact and every line of copy on the site.
 *
 * Ported from techincglobal-website.vercel.app and re-led with the
 * "Sri Lanka's #1 Frappe Partner" positioning. Everything the SEO/GEO/AIO
 * layer emits (JSON-LD, llms.txt, the markdown mirrors, /api/company.json)
 * reads from here, so the entity stays consistent across every surface.
 */

export const COMPANY = {
  name: 'Techincglobal',
  legalName: 'Techincglobal Consultancy (Pvt) Ltd',
  motto: 'Sri Lanka’s Frappe partner for enterprise solutions',
  mottoShort: 'Sri Lanka’s Frappe partner',
  tagline: 'One platform. Your entire enterprise.',
  founded: '2018',
  group: 'SEBSA Group',
  partnerStatus: 'Certified Bronze Partner',
  partnerOf: 'Frappe Technologies',
  domain: 'techincglobal.com',
  url: 'https://techincglobal.com',

  /**
   * Written as self-contained, quotable sentences on purpose — this is the
   * form generative engines lift verbatim when citing a source.
   */
  positioning:
    'Techincglobal is Sri Lanka’s first and only authorized Frappe Technologies partner. We work with businesses to implement ERPNext, configure it around their processes, develop the functionality they need, and support their teams beyond go-live.',
  summary:
    'Techincglobal brings finance, sales, inventory, production, projects, and people together on ERPNext, with implementations built around the way your business works. The first and only authorized Frappe Technologies partner in Sri Lanka, with 30+ ERP implementations delivered using our NXTGEN Agile methodology.',

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
    label: 'ERP implementations delivered',
    sentence:
      'Techincglobal has delivered more than 30 Frappe ERP implementations since 2018.',
  },
  {
    value: '40%',
    label: 'Faster deployment with NXTGEN',
    sentence:
      "Techincglobal's NXTGEN Agile methodology reduces ERP deployment time by up to 40% compared with conventional implementation approaches.",
  },
  {
    value: '😊',
    label: 'Happy customers',
    sentence:
      'We are proud of the long term relationships we have built with the businesses we serve.',
  },
  {
    value: '15+',
    label: 'Years of combined team experience',
    sentence:
      'The Techincglobal team brings more than 15 years of combined enterprise ERP experience.',
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
 */
export const JOURNEY: Stage[] = [
  {
    key: 'problem',
    index: '01',
    eyebrow: 'Before',
    title: 'A business held together by workarounds',
    body: 'A spreadsheet for finance. Separate records for stock. Another list on site. Everyone is doing their part, but the information does not always make its way to the people who need it.',
  },
  {
    key: 'departments',
    index: '02',
    eyebrow: 'Your departments',
    title: 'Different departments. Different versions of the truth.',
    body: 'Finance, sales, inventory, production, projects, HR, and more. Each has its own information and its own way of working. The real trouble starts when that information needs to move between them.',
  },
  {
    key: 'core',
    index: '03',
    eyebrow: 'The Frappe core',
    title: 'Bring it together with ERPNext',
    body: 'ERPNext puts the different parts of your business into one system. The same customers, items, transactions, costs, and business information are available across the functions that need them.',
  },
  {
    key: 'connected',
    index: '04',
    eyebrow: 'Wiring it up',
    title: 'Let information move with the work',
    body: 'A sale can move from quotation to order to delivery and invoicing. A purchase can update stock and accounts. Production can connect materials, operations, and costs. The information moves as the work moves.',
  },
  {
    key: 'unified',
    index: '05',
    eyebrow: 'After',
    title: 'One view of the business',
    body: 'When your teams are working from the same system, there is less information to chase and fewer records to reconcile. You have a clearer view of sales, stock, costs, projects, and finances when you need to make a decision.',
  },
]

/* -------------------------------------------------------------------------- */
/*  The stack — how Frappe, ERPNext, NXTGEN and Techincglobal fit together.     */
/* -------------------------------------------------------------------------- */

export interface StackLayer {
  name: string
  title: string
  body: string
}

export const STACK: StackLayer[] = [
  {
    name: 'Techincglobal',
    title: 'Your ERP implementation partner',
    body: 'Techincglobal is Sri Lanka’s first and only authorized Frappe Technologies partner. We work with businesses to implement ERPNext, configure it around their processes, develop the functionality they need, and support their teams beyond go-live. Our role is to make sure the platform fits the business, not the other way around.',
  },
  {
    name: 'NXTGEN',
    title: 'How we deliver your implementation',
    body: 'NXTGEN is Techincglobal’s Agile implementation methodology. It breaks the implementation into defined stages, from understanding your business and configuring the system to development, testing, training, and deployment. Your teams stay involved throughout, so the solution develops around real business requirements rather than assumptions made at the start of a project.',
  },
  {
    name: 'ERPNext',
    title: 'The business platform',
    body: 'ERPNext brings finance, sales, purchasing, inventory, manufacturing, projects, HR, and other core business functions together in one system. It provides the common platform underneath your business processes, so information can move between functions without relying on separate systems, spreadsheets, or manual handoffs.',
  },
  {
    name: 'Frappe',
    title: 'The technology and company behind ERPNext',
    body: 'ERPNext is developed by Frappe Technologies and built on Frappe Framework, its open source application framework. The framework provides the technology that allows ERPNext to be configured, extended, and developed to meet specific business requirements. This gives us room to work with the standard ERPNext platform while adapting it where your business needs something more.',
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
    body: 'We map your processes as they actually work and define the target state around Frappe’s native capabilities before configuration begins.',
  },
  {
    n: '02',
    name: 'Segregate',
    body: 'We divide the scope into independently deliverable modules, each with its own acceptance criteria. This means one module does not have to wait for every other part of the implementation to be completed.',
  },
  {
    n: '03',
    name: 'Cyclic mapping',
    body: 'We work through short configure, review, and refine cycles with your process owners. You see the working system early, giving your teams the opportunity to correct requirements while there is still time to make changes.',
  },
  {
    n: '04',
    name: 'Training',
    body: 'We provide role-based training using your own data and workflows. The aim is not simply to show users how the system works, but to help your team build the knowledge needed to use it in their day to day work.',
  },
  {
    n: '05',
    name: 'Go-live authorization',
    body: 'Before go-live, we use a formal readiness gate. Data migration is verified, parallel runs are reconciled, and process owners provide sign-off. The system goes live when the required checks are complete, rather than simply because a target date has arrived.',
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

import { SERVICES_CONTENT, type ServiceDetail } from './services-content'

export interface Service extends ServiceDetail {
  body: string
}

export const SERVICES: Service[] = SERVICES_CONTENT.map((s) => ({
  ...s,
  body: s.overview,
}))

/* -------------------------------------------------------------------------- */
/*  Industries                                                                 */
/* -------------------------------------------------------------------------- */

export interface Industry {
  slug: string
  name: string
  /** Short one-liner for the homepage teaser grid. */
  teaser: string
  /** Longer statement of what the industry needs from an ERP — the lead on /industries and each industry page. */
  summary: string
  body: string
  challenges: string[]
}

export const INDUSTRIES: Industry[] = [
  {
    slug: 'manufacturing',
    name: 'Manufacturing',
    teaser: 'Production planning, shop floor control, and costing in one system.',
    summary:
      'Production planning, material availability, shop floor operations, and job costing need to work together. Techincglobal helps manufacturers bring these processes into one connected ERPNext environment.',
    body: 'More than 20 Sri Lankan manufacturers run on ERP implementations delivered by Techincglobal. We configure ERPNext to connect multi-level bills of materials (BOMs), routings, work orders, inventory, and costing, so production teams and finance are working from the same information.\n\nThe solution can be shaped around the way your factory actually operates, including the processes used to plan production, issue materials, track work, and understand the cost of what is being produced.',
    challenges: [
      'Production plans that do not reflect actual material availability',
      'Job costs calculated after the work is done',
    ],
  },
  {
    slug: 'distribution-logistics',
    name: 'Distribution & logistics',
    teaser: 'Manage stock across warehouses, automate reordering, and keep deliveries moving.',
    summary:
      'Stock, purchasing, warehouses, orders, and deliveries need to stay aligned across locations. Techincglobal helps distribution and logistics businesses bring these processes together in ERPNext.',
    body: 'Distribution businesses often manage large numbers of Stock Keeping Units (SKU)s across multiple warehouses and locations. We configure ERPNext to support batch and serial traceability, landed-cost tracking, automated reorder points, and the movement of stock from purchasing through to delivery.\n\nFor courier and distribution businesses, this can bring stock, invoicing, and finance together instead of leaving them across separate systems.',
    challenges: [
      'Stock figures that differ by system or warehouse',
      'Excess and dead stock tying up working capital',
    ],
  },
  {
    slug: 'retail-ecommerce',
    name: 'Retail & e-commerce',
    teaser: 'Connect your point of sale (POS), online store, inventory, and back office.',
    summary:
      'Point of sale (POS), online sales, inventory, and back office operations need to work from the same stock position. Techincglobal helps retailers and e-commerce businesses connect these processes through ERPNext.',
    body: 'We bring counter, warehouse, and online inventory together so teams can work from the same stock position. ERPNext can be integrated with POS systems, marketplaces, and online storefronts, while also supporting promotions, loyalty programmes, and margin reporting by sales channel and Stock Keeping Unit (SKU).\n\nThe aim is to give the business a clearer view of what has been sold, what is available, and what each sales channel is contributing.',
    challenges: [
      'Overselling when online stock lags behind the warehouse',
      'Difficulty calculating profitability by sales channel',
    ],
  },
  {
    slug: 'professional-services',
    name: 'Professional services',
    teaser: 'Keep projects, timesheets, costs, and profitability together.',
    summary:
      'For professional services businesses, time and people are the product. Projects depend on accurate time tracking, resource use, billing, and visibility into profitability.',
    body: 'Techincglobal configures ERPNext around the way professional services teams manage their projects. This can include project structures, timesheet capture, billing rules, revenue recognition, and utilization reporting.\n\nThe objective is to give project teams visibility into costs, billable time, and profitability while work is still underway, rather than finding out after the project has finished.',
    challenges: [
      'Unbilled or under-billed time reducing margins',
      'Project profitability known only after completion',
    ],
  },
  {
    slug: 'construction-real-estate',
    name: 'Construction & real estate',
    teaser: 'Manage project costs, subcontractors, materials, and progress billing.',
    summary:
      'Construction and real estate businesses need to track project costs, materials, subcontractors, budgets, and progress billing throughout the life of a project.',
    body: 'Techincglobal configures ERPNext to give project teams a view of budget and actual costs by project, cost code, and subcontractor. Depending on the requirements, the solution can also cover material issues to sites, retention, progress billing, and variation control.\n\nThis gives contractors and developers a connected view of project costs as work progresses, rather than having to piece the information together from separate records.',
    challenges: [
      'Cost overruns discovered after the money is spent',
      'Materials issued to sites without a clear cost trail',
    ],
  },
  {
    slug: 'healthcare',
    name: 'Healthcare',
    teaser: 'Bring patient administration, pharmacy stock, and billing into one system.',
    summary:
      'Healthcare organizations need patient administration, pharmacy stock, services, and billing to stay connected across operational and financial teams.',
    body: 'Techincglobal can configure ERPNext around the administrative and operational processes of healthcare organizations. This can include appointments and patient administration, pharmacy and consumables inventory, expiry control, laboratory workflows, insurance, and billing.\n\nAccess controls and audit trails can also be incorporated into the solution where required, helping organizations manage sensitive information and maintain appropriate records of system activity.',
    challenges: [
      'Pharmacy stock expiry and shrinkage',
      'Billing gaps between clinical operations and finance',
    ],
  },
  {
    slug: 'education',
    name: 'Education',
    teaser: 'Manage student records, fees, and institutional operations from one platform.',
    summary:
      'Education organizations manage student records, fees, academic activities, staff, and institutional finance across multiple departments and stages.',
    body: 'Techincglobal can configure ERPNext to connect admissions, student records, programmes and courses, fee schedules and collections, staff payroll, and institutional financial reporting.\n\nBringing these functions together helps different teams work from the information they need while keeping student operations connected to the financial side of the institution.',
    challenges: [
      'Fee arrears tracked manually across intakes',
      'Student records split across departments',
    ],
  },
  {
    slug: 'trading-import-export',
    name: 'Trading & import/export',
    teaser: 'Manage landed costs, multiple currencies, purchasing, and shipments.',
    summary:
      'Trading and import/export businesses need purchasing, shipments, landed costs, currencies, and sales to come together to show the real cost of each transaction.',
    body: 'Techincglobal configures ERPNext to connect purchasing with shipment and landed-cost information. Landed costs such as freight, duty, clearing, and demurrage can be allocated back to the relevant items, giving businesses a clearer view of the actual cost of imported goods.\n\nThe solution can also support multi-currency transactions and letter-of-credit tracking, depending on the business requirements.',
    challenges: [
      'True landed cost not calculated at the item level',
      'Currency exposure becoming visible only after it affects the business',
    ],
  },
]

/* -------------------------------------------------------------------------- */
/*  About                                                                      */
/* -------------------------------------------------------------------------- */

export const STORY = {
  eyebrow: 'About Techincglobal',
  title: 'A technology partner built around your business',
  intro:
    'Techincglobal is a Sri Lankan Enterprise Resource Planning (ERP) implementation and technology company that helps businesses bring their operations onto one connected platform. We combine ERPNext, Frappe technology, our NXTGEN implementation methodology, and local business knowledge to build solutions around how each business actually works.',
  paragraphs: [
    'Founded in 2018, Techincglobal works with businesses across Sri Lanka to implement and extend ERPNext for their operational and financial requirements.',
    'Our work goes beyond configuring an ERP system. We work with business teams to understand their processes, determine how ERPNext can support them, and identify where configuration, customization, development, or integration is needed. We then take the solution through implementation, testing, training, deployment, and ongoing support.',
    'Techincglobal is an authorized Frappe Technologies partner and the only official Frappe partner in Sri Lanka. ERPNext is the business platform we implement, while Frappe Framework provides the open source technology on which ERPNext is built. Our NXTGEN methodology provides the structured approach we use to take an implementation from business requirements through to deployment.',
    'As part of the SEBSA Group, Techincglobal also draws on wider technology and business capabilities while maintaining a local focus on the needs of Sri Lankan businesses.',
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
    body: 'Techincglobal was established as a digital transformation company providing advisory services to enterprise customers across Sri Lanka.',
  },
  {
    year: '2019',
    name: 'Licence-free software',
    body: 'Techincglobal developed its first rapid application development platform, with the ability to deliver licence-free enterprise software.',
  },
  {
    year: '2020',
    name: 'NXTGEN implementation methodology',
    body: 'Techincglobal began its Frappe journey and developed the NXTGEN Agile implementation methodology through hands-on delivery experience.',
  },
  {
    year: '2021',
    name: 'Cloud journey',
    body: 'Techincglobal established key cloud infrastructure partnerships, expanding its ability to deliver cloud hosted ERP solutions.',
  },
  {
    year: '2022',
    name: 'Joined the SEBSA Group',
    body: 'Techincglobal became an integral part of the SEBSA Group, expanding its global ERP delivery footprint and shared capabilities.',
  },
  {
    year: '2023',
    name: 'Authorized Frappe partner in Sri Lanka',
    body: 'Techincglobal became the first authorized Frappe Technologies partner in Sri Lanka.',
  },
  {
    year: '2024',
    name: 'Growing manufacturing expertise',
    body: 'Techincglobal passed the milestone of serving more than 20 customers in the manufacturing sector, strengthening its experience in industrial ERP implementations.',
  },
  {
    year: '2025',
    name: 'Certified Bronze Partner',
    body: 'Techincglobal became a Certified Bronze Partner with Frappe Technologies, recognizing its growing expertise in the Frappe technology ecosystem.',
  },
]

export interface Value {
  name: string
  tagline?: string
  body: string
}

export const VALUES: Value[] = [
  {
    name: 'Integrity',
    tagline: 'ERP should be honest.',
    body: "Our founder's view was simple: bring honesty into ERP. Too often, businesses pay for more software than they need and still struggle to get the value they were promised. We believe customers deserve a solution that makes sense for their business, at a fair cost, with clear expectations from the start.",
  },
  {
    name: 'Excellence',
    tagline: 'Do the job properly.',
    body: 'We care about getting the details right, whether we are configuring a workflow, writing code, solving a problem, or sitting with a customer to understand what is really needed. Good enough is rarely good enough when people are going to depend on the system every day.',
  },
  {
    name: 'Customer success',
    tagline: 'Your success is our success.',
    body: 'Our responsibility does not end when the system goes live. We care about whether your teams can use it, whether it works as intended, and whether it continues to support the business as it changes.',
  },
  {
    name: 'Collaboration',
    tagline: 'Work with people, not around them.',
    body: 'The people who use the system know their business better than anyone else. We listen to them, work through problems with them, and involve them in the decisions that shape the solution. We work alongside your team, not around it.',
  },
  {
    name: 'Innovation',
    tagline: 'Keep making things better.',
    body: 'Technology keeps changing, but we do not adopt something new simply because it is new. We look at what can genuinely improve the way a business works, then find practical ways to put it to use.',
  },
  {
    name: 'Continuous learning',
    tagline: 'Keep learning.',
    body: 'Every implementation teaches us something. We learn from our customers, our projects, our mistakes, and the technology itself. That experience feeds back into how we work and what we deliver next.',
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
  image?: string
  imagePosition?: string
  imageScale?: number
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
    image: '/team/sean-fernando.jpg',
    imagePosition: 'center 34%',
    imageScale: 1.58,
  },
  {
    slug: 'lahiru-pathirana',
    name: 'Lahiru Pathirana',
    role: 'Head of Technical Solutions',
    bio: 'Specialist in technical architecture, Frappe development, and complex ERP integration strategies.',
    initials: 'LP',
    image: '/team/lahiru-pathirana.jpg',
    imagePosition: 'center 40%',
  },
  {
    slug: 'jeby-krishoan',
    name: 'Jeby Krishoan',
    role: 'Functional Consultant — Manufacturing & Supply Chain',
    bio: 'Expert in manufacturing and logistics workflows, ensuring Frappe ERP aligns perfectly with production and procurement realities.',
    initials: 'JK',
    image: '/team/jeby-krishoan.jpg',
    imagePosition: 'center 39%',
  },
  {
    slug: 'ashen-bandara',
    name: 'Ashen Bandara',
    role: 'Functional Consultant — Supply Chain & HR',
    bio: 'Specialist in supply chain logistics, inventory optimization, and HR operations, aligning Frappe ERP with day-to-day organizational workflows.',
    initials: 'AB',
    image: '/team/ashen-bandara.jpg',
    imagePosition: 'center 45%',
  },
  {
    slug: 'niluka-dilrukshi',
    name: 'Niluka Dilrukshi',
    role: 'Functional Consultant — Finance & Payroll',
    bio: 'Finance process expert ensuring accurate, efficient financial operations and statutory compliance through Frappe ERP.',
    initials: 'ND',
    image: '/team/niluka-dilrukshi.jpg',
    imagePosition: 'center 45%',
  },
  {
    slug: 'lakvindu-siriwardena',
    name: 'Lakvindu Siriwardena',
    role: 'Techno-Functional Consultant',
    bio: 'Bridges technical and functional perspectives to deliver seamless, high-quality ERP implementations.',
    initials: 'LS',
    image: '/team/lakvindu-siriwardena.jpg',
    imagePosition: 'center 45%',
  },
  {
    slug: 'shakthi-rodrigo',
    name: 'Shakthi Rodrigo',
    role: 'Techno-Functional Consultant',
    bio: 'Delivers end-to-end ERP solutions combining deep technical expertise with domain knowledge across industries.',
    initials: 'SR',
    image: '/team/shakthi-rodrigo.jpg',
    imagePosition: 'center 47%',
    imageScale: 1.68,
  },
  {
    slug: 'thineth-weerasinghe',
    name: 'Thineth Weerasinghe',
    role: 'Developer — AI Enterprise Solutions',
    bio: 'Builds AI-driven capability into Frappe implementations — from document extraction to forecasting — grounded in what the platform can actually support in production.',
    initials: 'TW',
    image: '/team/thineth-weerasinghe.jpg',
    imagePosition: 'center 39%',
    imageScale: 1.52,
  },
  {
    slug: 'nethan-kombalavitana',
    name: 'Nethan Kombalavitana',
    role: 'Developer — AI Enterprise Solutions',
    bio: 'Designs the interfaces our clients actually use day-to-day, with a focus on enterprise UX that holds up under real operational load, not just a demo.',
    initials: 'NK',
  },
]

export const PARTNERSHIPS = [
  {
    name: 'Frappe Technologies',
    status: 'Authorized Frappe partner in Sri Lanka',
    body: 'Techincglobal is the only official Frappe partner in Sri Lanka. Our Certified Bronze Partner status reflects our growing expertise in implementing and extending Frappe technologies, including ERPNext and Frappe Framework. Our partnership also gives us access to Frappe’s partner ecosystem, technical resources, and ongoing product and platform knowledge.',
  },
  {
    name: 'SEBSA Group',
    status: 'Part of a wider technology group',
    body: 'Techincglobal is part of the SEBSA Group, giving us access to shared knowledge, capabilities, and a wider technology network. The relationship adds depth to what we can offer while allowing Techincglobal to remain focused on delivering solutions for our customers and the businesses we work with.',
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
    q: 'How can Techincglobal help our enterprise?',
    a: 'Techincglobal helps businesses bring finance, sales, inventory, production, projects, and people together with ERPNext, an enterprise resource planning (ERP) platform. We configure and extend the platform around the way your business works, rather than expecting your business to fit a standard setup.',
  },
  {
    q: 'Do we have to replace all our existing systems?',
    a: 'Not necessarily. Techincglobal can connect ERPNext with systems you already use, so you can keep the systems that still serve a purpose while bringing the information and processes that matter together. We assess your existing setup and determine what should be retained, replaced, or integrated.',
  },
  {
    q: 'What happens to the data in our existing systems?',
    a: 'Techincglobal assesses your existing data as part of the implementation and plans how it should be cleaned, mapped, and migrated into the new system. The aim is to bring across the information the business needs without carrying unnecessary or outdated data into the new system.',
  },
  {
    q: 'What if our business processes do not fit the standard setup?',
    a: 'We start with the standard platform and configure it around your requirements wherever possible. Where a specific business need goes beyond the standard functionality, Techincglobal can customize or develop the required functionality rather than asking your teams to work around the system.',
  },
  {
    q: 'How much involvement is needed from our teams?',
    a: 'Your teams are involved throughout the implementation. They help us understand how the business works, review the configured processes, test the system, and prepare for go-live. This gives us a clearer understanding of the actual work behind the requirements and helps your teams become familiar with the system before deployment.',
  },
  {
    q: 'Can Techincglobal implement the solution in stages?',
    a: 'Yes. We can plan the implementation around the priorities of the business rather than requiring everything to go live at once. Functions or business areas can be delivered in stages, allowing teams to start using the system while further work continues.',
  },
  {
    q: 'What happens if our requirements change during implementation?',
    a: 'Requirements can become clearer as teams see the system and work through real processes. We review changes as they arise, assess their impact on scope and delivery, and agree on how they should be handled before the work proceeds.',
  },
  {
    q: 'Can Techincglobal connect ERPNext to our existing systems?',
    a: 'Yes. Techincglobal can integrate ERPNext with the systems your business already depends on, including banking, payment gateways, POS, e-commerce, payroll, and logistics systems. The integration approach depends on the systems involved and can include APIs, webhooks, or scheduled data synchronization.',
  },
  {
    q: 'What happens after go-live?',
    a: 'Go-live is the beginning of using the system, not the end of the relationship. Techincglobal provides ongoing support, helps resolve issues, supports upgrades, and works with you as your processes and requirements develop. Additional functionality and modules can also be introduced in stages as the business is ready for them.',
  },
  {
    q: 'How does Techincglobal determine what the solution should look like for our business?',
    a: 'That is something we establish before implementation begins. We work with your teams to understand your processes, requirements, existing systems, and priorities, then determine how ERPNext can be applied to the business and where customization or integration may be needed.',
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
      { label: 'ERP articles', href: '/blog' },
      { label: 'Customer support', href: '/support' },
    ],
  },
]
