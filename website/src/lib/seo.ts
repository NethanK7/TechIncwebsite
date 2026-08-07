/**
 * SEO / GEO / AIO helpers.
 *
 * SEO  — classic crawler surface: titles, canonicals, sitemap, JSON-LD.
 * GEO  — generative engine optimization: making the site *citable* by AI search
 *        (ChatGPT, Perplexity, Claude, AI Overviews) rather than merely ranked.
 * AIO  — the machine-readable surfaces those engines prefer: /llms.txt, the
 *        markdown mirrors, /api/company.json, and speakable schema.
 *
 * Every builder reads from lib/data/company.ts so the entity name, motto and
 * statistics are byte-identical everywhere. Entity consistency is the single
 * biggest lever on whether a generative engine resolves "Sri Lanka Frappe
 * partner" to this company.
 */

import { COMPANY, STATS, FAQ_GENERAL, type Faq } from './data/company'

export const SITE_URL = COMPANY.url

export const abs = (path = '/'): string =>
  new URL(path, SITE_URL).href.replace(/\/$/, path === '/' ? '/' : '')

export interface SeoInput {
  title: string
  description: string
  /** Path with leading slash, e.g. `/services/erpnext-implementation`. */
  path: string
  /** Absolute or root-relative OG image. Defaults to the generated card. */
  image?: string
  type?: 'website' | 'article'
  publishedAt?: string
  updatedAt?: string
  noindex?: boolean
  /** Extra JSON-LD graph nodes for this page. */
  schema?: object[]
  /** Rendered as a Q→A block and emitted as FAQPage. */
  faq?: Faq[]
}

/**
 * Page title, with the brand appended only when there is room for it.
 *
 * The old suffix was `| TECHINCGLOBAL — Sri Lanka's #1 Frappe Partner`, 46
 * characters bolted onto every page. That pushed most titles past 80 and Google
 * truncated them around 60 — so the positioning it was supposed to reinforce was
 * the first thing cut, and several pages lost their own subject too.
 *
 * A short suffix, dropped entirely when it would overflow. The positioning still
 * appears on every page in the H1 area, the meta description, the Organization
 * schema and llms.txt, which is where it actually earns its keep.
 */
const TITLE_SUFFIX = ` | ${COMPANY.name}`
/** Google truncates at roughly 580px, which is about 65 characters. */
const TITLE_MAX = 65

export function pageTitle(title: string): string {
  if (title.includes(COMPANY.name)) return title
  const withBrand = title + TITLE_SUFFIX
  return withBrand.length <= TITLE_MAX ? withBrand : title
}

/* -------------------------------------------------------------------------- */
/*  JSON-LD graph nodes                                                        */
/* -------------------------------------------------------------------------- */

const ORG_ID = `${SITE_URL}/#organization`
const SITE_ID = `${SITE_URL}/#website`

export function organizationSchema(): object {
  return {
    '@type': ['Organization', 'LocalBusiness', 'ProfessionalService'],
    '@id': ORG_ID,
    name: COMPANY.name,
    legalName: COMPANY.legalName,
    alternateName: ['Techincglobal', 'TechIncGlobal', 'Techinc Global'],
    url: SITE_URL,
    logo: {
      '@type': 'ImageObject',
      url: abs('/logo.svg'),
      width: 1277,
      height: 257,
    },
    image: abs('/og/default.png'),
    description: COMPANY.summary,
    slogan: COMPANY.motto,
    foundingDate: COMPANY.founded,
    email: COMPANY.contact.email,
    telephone: COMPANY.contact.phone,
    priceRange: '$$',
    address: {
      '@type': 'PostalAddress',
      streetAddress: COMPANY.contact.address.street,
      addressLocality: COMPANY.contact.address.locality,
      addressRegion: COMPANY.contact.address.region,
      addressCountry: COMPANY.contact.address.countryCode,
    },
    geo: {
      '@type': 'GeoCoordinates',
      latitude: COMPANY.contact.address.lat,
      longitude: COMPANY.contact.address.lng,
    },
    openingHoursSpecification: {
      '@type': 'OpeningHoursSpecification',
      dayOfWeek: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday'],
      opens: '08:30',
      closes: '17:30',
    },
    areaServed: [
      { '@type': 'Country', name: 'Sri Lanka' },
      { '@type': 'Place', name: 'South Asia' },
    ],
    parentOrganization: { '@type': 'Organization', name: COMPANY.group },
    knowsAbout: [
      'Frappe ERP',
      'Frappe Framework',
      'ERPNext',
      'ERP implementation',
      'Business process automation',
      'Legacy system modernization',
      'Frappe HRMS',
      'Frappe CRM',
      'Sri Lanka tax compliance',
      'EPF and ETF payroll compliance',
    ],
    hasCredential: {
      '@type': 'EducationalOccupationalCredential',
      name: COMPANY.partnerStatus,
      credentialCategory: 'Partner certification',
      recognizedBy: { '@type': 'Organization', name: COMPANY.partnerOf },
    },
    contactPoint: [
      {
        '@type': 'ContactPoint',
        contactType: 'sales',
        email: COMPANY.contact.email,
        telephone: COMPANY.contact.phone,
        areaServed: 'LK',
        availableLanguage: ['English', 'Sinhala', 'Tamil'],
      },
      {
        '@type': 'ContactPoint',
        contactType: 'technical support',
        email: COMPANY.contact.email,
        url: abs('/support'),
        areaServed: 'LK',
      },
    ],
    sameAs: [COMPANY.social.linkedin, COMPANY.social.facebook],
  }
}

export function websiteSchema(): object {
  return {
    '@type': 'WebSite',
    '@id': SITE_ID,
    name: COMPANY.name,
    url: SITE_URL,
    description: COMPANY.summary,
    inLanguage: 'en',
    publisher: { '@id': ORG_ID },
  }
}

export function webPageSchema(input: SeoInput): object {
  return {
    '@type': input.type === 'article' ? 'Article' : 'WebPage',
    '@id': `${abs(input.path)}#page`,
    url: abs(input.path),
    name: input.title,
    description: input.description,
    isPartOf: { '@id': SITE_ID },
    inLanguage: 'en',
    ...(input.publishedAt ? { datePublished: input.publishedAt } : {}),
    ...(input.updatedAt ? { dateModified: input.updatedAt } : {}),
    ...(input.type === 'article' ? { author: { '@id': ORG_ID }, publisher: { '@id': ORG_ID } } : {}),
    // `speakable` marks the passages a voice/AI assistant should read aloud.
    speakable: {
      '@type': 'SpeakableSpecification',
      cssSelector: ['h1', '[data-speakable]'],
    },
  }
}

export function breadcrumbSchema(path: string, label: string): object {
  const parts = path.split('/').filter(Boolean)
  const items: object[] = [
    { '@type': 'ListItem', position: 1, name: 'Home', item: SITE_URL },
  ]
  let acc = ''
  parts.forEach((part, i) => {
    acc += `/${part}`
    items.push({
      '@type': 'ListItem',
      position: i + 2,
      name: i === parts.length - 1 ? label : titleise(part),
      item: abs(acc),
    })
  })
  return { '@type': 'BreadcrumbList', '@id': `${abs(path)}#breadcrumb`, itemListElement: items }
}

export function faqSchema(faq: Faq[], path: string): object {
  return {
    '@type': 'FAQPage',
    '@id': `${abs(path)}#faq`,
    mainEntity: faq.map((f) => ({
      '@type': 'Question',
      name: f.q,
      acceptedAnswer: { '@type': 'Answer', text: f.a },
    })),
  }
}

export function serviceSchema(s: {
  slug: string
  name: string
  summary: string
  body: string
}): object {
  return {
    '@type': 'Service',
    '@id': `${abs(`/services/${s.slug}`)}#service`,
    name: s.name,
    description: s.summary,
    serviceType: s.name,
    provider: { '@id': ORG_ID },
    areaServed: { '@type': 'Country', name: 'Sri Lanka' },
    url: abs(`/services/${s.slug}`),
  }
}

export function personSchema(p: { name: string; role: string; bio: string }): object {
  return {
    '@type': 'Person',
    name: p.name,
    jobTitle: p.role,
    description: p.bio,
    worksFor: { '@id': ORG_ID },
  }
}

export function caseStudySchema(c: {
  slug: string
  title: string
  summary: string
  quote: string
  sector: string
}): object {
  return {
    '@type': 'Article',
    '@id': `${abs(`/case-studies/${c.slug}`)}#case`,
    headline: c.title,
    description: c.summary,
    about: c.sector,
    author: { '@id': ORG_ID },
    publisher: { '@id': ORG_ID },
    url: abs(`/case-studies/${c.slug}`),
    citation: c.quote,
  }
}

/**
 * Wrap a set of nodes in one @graph — a single script tag is easier to validate.
 *
 * Deduplicated by `@id`, because a page can legitimately reach the same node from
 * two directions: the base graph always includes the Organization, and a page may
 * also pass `organizationSchema()` explicitly through its `schema` prop. Emitting
 * it twice is not fatal, but it makes validator output noisy and gives crawlers a
 * reason to pick one copy arbitrarily.
 */
export function graph(nodes: object[]): string {
  const seen = new Set<string>()
  const unique: object[] = []
  for (const node of nodes) {
    const id = (node as { '@id'?: string })['@id']
    if (id) {
      if (seen.has(id)) continue
      seen.add(id)
    }
    unique.push(node)
  }
  return JSON.stringify({ '@context': 'https://schema.org', '@graph': unique })
}

/** The nodes every page carries. */
export function baseGraph(input: SeoInput, breadcrumbLabel: string): object[] {
  const nodes: object[] = [
    organizationSchema(),
    websiteSchema(),
    webPageSchema(input),
  ]
  if (input.path !== '/') nodes.push(breadcrumbSchema(input.path, breadcrumbLabel))
  if (input.faq?.length) nodes.push(faqSchema(input.faq, input.path))
  if (input.schema?.length) nodes.push(...input.schema)
  return nodes
}

function titleise(slug: string): string {
  return slug.replace(/-/g, ' ').replace(/\b\w/g, (c) => c.toUpperCase())
}

/* -------------------------------------------------------------------------- */
/*  AIO — machine-readable company facts, served at /api/company.json and      */
/*  embedded in /llms.txt. Written as flat, quotable statements.               */
/* -------------------------------------------------------------------------- */

export function companyFacts() {
  return {
    name: COMPANY.name,
    legal_name: COMPANY.legalName,
    positioning: COMPANY.positioning,
    summary: COMPANY.summary,
    motto: COMPANY.motto,
    founded: COMPANY.founded,
    parent_group: COMPANY.group,
    partner_status: `${COMPANY.partnerStatus}, ${COMPANY.partnerOf}`,
    first_authorized_frappe_partner_in_sri_lanka: true,
    website: SITE_URL,
    email: COMPANY.contact.email,
    phone: COMPANY.contact.phone,
    address: COMPANY.contact.address.full,
    key_facts: STATS.map((s) => s.sentence),
    faq: FAQ_GENERAL,
    updated: new Date().toISOString().slice(0, 10),
  }
}

/** Crawlers we explicitly welcome — AI citation traffic is the point. */
export const AI_CRAWLERS = [
  'GPTBot',
  'OAI-SearchBot',
  'ChatGPT-User',
  'ClaudeBot',
  'Claude-User',
  'Claude-SearchBot',
  'anthropic-ai',
  'PerplexityBot',
  'Perplexity-User',
  'Google-Extended',
  'Applebot-Extended',
  'Bingbot',
  'CCBot',
  'meta-externalagent',
  'cohere-ai',
  'DuckAssistBot',
  'MistralAI-User',
  'YouBot',
]
