/**
 * Shared SEO helpers. Head-metadata and JSON-LD only — nothing here renders
 * visible UI, and nothing here may change layout, copy or styling.
 *
 * Structured data uses a single @id graph so crawlers and AI answer engines
 * read the site as one connected entity:
 *   Organization (#organization) -> WebSite (#website) -> WebPage (<url>#webpage)
 *   -> SoftwareApplication (#software) / Product / Article / FAQPage / BreadcrumbList
 */

export const SITE_URL = "https://training4performance.com";
export const SITE_NAME = "Training 4 Performance";
export const SITE_SHORT_NAME = "T4P";
export const OG_IMAGE = `${SITE_URL}/logo-t4p.png`;
export const OG_IMAGE_ALT =
  "Training 4 Performance (T4P) — football performance management platform for strength and conditioning coaches";
export const CONTACT_EMAIL = "harisfalas@gmail.com";

/** Stable schema.org node identifiers. */
export const ORGANIZATION_ID = `${SITE_URL}/#organization`;
export const WEBSITE_ID = `${SITE_URL}/#website`;
export const SOFTWARE_ID = `${SITE_URL}/#software`;
export const FOUNDER_ID = `${SITE_URL}/haris-falas#person`;
export const LOGO_ID = `${SITE_URL}/#logo`;

/**
 * Official product description — reused everywhere so the entity never
 * conflicts between pages, metadata and structured data.
 */
export const ENTITY_DESCRIPTION =
  "T4P (Training 4 Performance) is a web-based football performance management platform for football fitness coaches, strength and conditioning coaches, performance coaches and sports scientists. It connects squad management and player availability, training session and drill design on an interactive tactical board, GPS data import and analysis, training load and acute:chronic workload monitoring, RPE and wellness monitoring, fitness testing, player comparison and performance reporting.";

/**
 * Broad topical vocabulary used for structured-data `knowsAbout` / `about`
 * fields. This is entity context for machines, not on-page keyword copy.
 */
export const TOPIC_ENTITIES = [
  "Football performance management",
  "Football strength and conditioning",
  "Football sports science",
  "Football training session design",
  "Football drill design",
  "Football tactical board",
  "GPS player tracking in football",
  "GPS training load analysis",
  "High-speed running and sprint exposure",
  "Accelerations and decelerations",
  "Training load monitoring",
  "Acute to chronic workload ratio (ACWR)",
  "Training monotony and strain",
  "Session RPE (sRPE)",
  "Athlete wellness and readiness monitoring",
  "Football fitness testing",
  "Countermovement jump (CMJ) testing",
  "Sprint split testing",
  "Yo-Yo intermittent recovery test",
  "30-15 Intermittent Fitness Test",
  "Repeated sprint ability",
  "Player availability and return-to-play monitoring",
  "Microcycle and match-day-minus periodisation",
  "Squad and player performance analytics",
  "Football performance reporting",
];

/** Legacy `meta keywords` are not a ranking factor — kept minimal, page-specific only. */
export type SeoOptions = {
  /** Route path, e.g. "/pricing" (use "/" for home). */
  path: string;
  title: string;
  description: string;
  keywords?: string[];
  /** Open Graph object type. */
  type?: string;
  /** Absolute image URL for social previews. */
  image?: string;
  /** Private / authenticated pages that must stay out of the index. */
  noindex?: boolean;
  /** Twitter card format. */
  card?: "summary" | "summary_large_image";
};

export function canonicalUrl(path: string): string {
  if (path === "/") return `${SITE_URL}/`;
  const clean = path.split("?")[0]!.split("#")[0]!.replace(/\/+$/, "");
  return `${SITE_URL}${clean}`;
}

export function seoHead(options: SeoOptions) {
  const {
    path,
    title,
    description,
    keywords = [],
    type = "website",
    image = OG_IMAGE,
    noindex = false,
    card = "summary_large_image",
  } = options;

  const url = canonicalUrl(path);

  const meta = [
    { title },
    { name: "description", content: description },
    ...(keywords.length ? [{ name: "keywords", content: keywords.join(", ") }] : []),
    {
      name: "robots",
      content: noindex
        ? "noindex, nofollow"
        : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
    },
    {
      name: "googlebot",
      content: noindex
        ? "noindex, nofollow"
        : "index, follow, max-image-preview:large, max-snippet:-1, max-video-preview:-1",
    },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: type },
    { property: "og:url", content: url },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:locale", content: "en_GB" },
    { property: "og:image", content: image },
    { property: "og:image:alt", content: OG_IMAGE_ALT },
    { name: "twitter:card", content: card },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: image },
    { name: "twitter:image:alt", content: OG_IMAGE_ALT },
  ];

  const links = noindex ? [] : [{ rel: "canonical", href: url }];

  return { meta, links };
}

export function jsonLd(data: unknown) {
  return { type: "application/ld+json", children: JSON.stringify(data) };
}

/** BreadcrumbList JSON-LD for a leaf page, wired into the page graph by @id. */
export function breadcrumbLd(items: Array<{ name: string; path: string }>) {
  const leaf = items[items.length - 1]!;
  return jsonLd({
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    "@id": `${canonicalUrl(leaf.path)}#breadcrumb`,
    itemListElement: items.map((item, index) => ({
      "@type": "ListItem",
      position: index + 1,
      name: item.name,
      item: canonicalUrl(item.path),
    })),
  });
}

export type WebPageOptions = {
  path: string;
  name: string;
  description: string;
  /** Schema type — WebPage, AboutPage, ContactPage, CollectionPage, FAQPage... */
  type?: string;
  /** Set when the page also emits a BreadcrumbList for the same path. */
  breadcrumb?: boolean;
  /** Primary entity of the page, e.g. SOFTWARE_ID on the home page. */
  primaryEntityId?: string;
  about?: string[];
  image?: string;
};

/** WebPage node connecting a page to the WebSite / Organization graph. */
export function webPageLd(options: WebPageOptions) {
  const {
    path,
    name,
    description,
    type = "WebPage",
    breadcrumb = false,
    primaryEntityId,
    about,
    image = OG_IMAGE,
  } = options;
  const url = canonicalUrl(path);

  return jsonLd({
    "@context": "https://schema.org",
    "@type": type,
    "@id": `${url}#webpage`,
    url,
    name,
    description,
    inLanguage: "en",
    isPartOf: { "@id": WEBSITE_ID },
    about: about?.length
      ? about.map((topic) => ({ "@type": "Thing", name: topic }))
      : { "@id": ORGANIZATION_ID },
    primaryImageOfPage: { "@type": "ImageObject", url: image },
    ...(primaryEntityId ? { mainEntity: { "@id": primaryEntityId } } : {}),
    ...(breadcrumb ? { breadcrumb: { "@id": `${url}#breadcrumb` } } : {}),
    publisher: { "@id": ORGANIZATION_ID },
  });
}

export type ArticleLdOptions = {
  path: string;
  headline: string;
  description: string;
  datePublished: string;
  dateModified?: string;
  image?: string;
  authorName?: string;
  articleSection?: string;
  keywords?: string[];
};

/**
 * Article JSON-LD, ready for the future public resource hub.
 * Only call it with real, published content — never fabricate authorship or dates.
 */
export function articleLd(options: ArticleLdOptions) {
  const {
    path,
    headline,
    description,
    datePublished,
    dateModified = datePublished,
    image = OG_IMAGE,
    authorName = "Haris Falas",
    articleSection,
    keywords,
  } = options;
  const url = canonicalUrl(path);

  return jsonLd({
    "@context": "https://schema.org",
    "@type": "Article",
    "@id": `${url}#article`,
    headline,
    description,
    image,
    datePublished,
    dateModified,
    inLanguage: "en",
    author: { "@type": "Person", name: authorName, "@id": FOUNDER_ID },
    publisher: { "@id": ORGANIZATION_ID },
    mainEntityOfPage: { "@id": `${url}#webpage` },
    ...(articleSection ? { articleSection } : {}),
    ...(keywords?.length ? { keywords: keywords.join(", ") } : {}),
  });
}

/**
 * TODO (owner action, cannot be automated here):
 * - Verify the domain in Google Search Console and Bing Webmaster Tools, then
 *   submit https://training4performance.com/sitemap.xml in both.
 * - IndexNow: once a key is issued, host it at /<key>.txt and ping
 *   https://api.indexnow.org/indexnow on public content changes.
 * Never commit fabricated verification tokens or API keys.
 */
