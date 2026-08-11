/**
 * Shared SEO helpers. Head-metadata only — nothing here renders visible UI.
 */

export const SITE_URL = "https://training4performance.com";
export const SITE_NAME = "Training 4 Performance";
export const OG_IMAGE = `${SITE_URL}/logo-t4p.png`;

export const BASE_KEYWORDS = [
  "football fitness coach software",
  "soccer fitness coach platform",
  "football S&C software",
  "strength and conditioning software football",
  "football sports science platform",
  "athlete monitoring system football",
  "player monitoring software soccer",
  "football performance management platform",
];

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
  return `${SITE_URL}${path}`;
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
  const allKeywords = Array.from(new Set([...keywords, ...BASE_KEYWORDS])).join(", ");

  const meta = [
    { title },
    { name: "description", content: description },
    { name: "keywords", content: allKeywords },
    {
      name: "robots",
      content: noindex ? "noindex, nofollow" : "index, follow, max-image-preview:large, max-snippet:-1",
    },
    { property: "og:title", content: title },
    { property: "og:description", content: description },
    { property: "og:type", content: type },
    { property: "og:url", content: url },
    { property: "og:site_name", content: SITE_NAME },
    { property: "og:locale", content: "en" },
    { property: "og:image", content: image },
    { name: "twitter:card", content: card },
    { name: "twitter:title", content: title },
    { name: "twitter:description", content: description },
    { name: "twitter:image", content: image },
  ];

  const links = noindex ? [] : [{ rel: "canonical", href: url }];

  return { meta, links };
}

/** BreadcrumbList JSON-LD for a leaf page. */
export function breadcrumbLd(items: Array<{ name: string; path: string }>) {
  return {
    type: "application/ld+json",
    children: JSON.stringify({
      "@context": "https://schema.org",
      "@type": "BreadcrumbList",
      itemListElement: items.map((item, index) => ({
        "@type": "ListItem",
        position: index + 1,
        name: item.name,
        item: canonicalUrl(item.path),
      })),
    }),
  };
}

export function jsonLd(data: unknown) {
  return { type: "application/ld+json", children: JSON.stringify(data) };
}
