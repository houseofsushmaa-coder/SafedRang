// Product SEO helpers shared by the storefront (runtime <head> updates) and
// scripts/prerender-seo.mjs (build-time sitemap + per-product HTML).
// Keep this file free of browser-only and React imports.
import { normalizeDescription, parseDescription } from "../utils/productDetails.js";

export const SITE_URL = "https://safedrang.com";
export const BRAND = "Safed Rang";
export const DEFAULT_TITLE = "Safed Rang | Handcrafted Lucknowi Chikankari & Zardozi Sarees";
export const DEFAULT_DESCRIPTION =
  "Hand-embroidered Lucknowi chikankari and zardozi sarees, kurta sets and dupattas, crafted by karigars in Lucknow. One of One pieces, free shipping on online payment.";
export const DEFAULT_IMAGE = `${SITE_URL}/one-of-one-banner.jpg`;

const SMALL_WORDS = new Set(["a", "an", "and", "as", "at", "by", "for", "in", "of", "on", "or", "the", "to", "with"]);

/** Readable product URL path; falls back to the id for older items. */
export const productPath = (p) => `/product/${encodeURIComponent(p?.slug || p?.id || "")}`;

export const slugify = (text = "") =>
  String(text)
    .toLowerCase()
    .replace(/["'’]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 90);

/** "\"GAZAL-E-RANG\" TUSSER SILK SAREE" → "Gazal-E-Rang Tusser Silk Saree". */
export function displayName(raw = "") {
  const name = String(raw).replace(/["“”]/g, "").replace(/\s+/g, " ").trim();
  if (!name) return "";
  const shouty = name === name.toUpperCase();
  return name
    .split(" ")
    .map((word, i) => {
      const lower = word.toLowerCase();
      if (i > 0 && SMALL_WORDS.has(lower)) return lower;
      if (!shouty && word !== lower) return word; // keep deliberate casing
      return lower.replace(/(^|-)([a-z])/g, (_, sep, ch) => sep + ch.toUpperCase());
    })
    .join(" ");
}

/** Plain-text description (no HTML, no "Product Details" list). */
export function descriptionText(raw = "") {
  const parsed = parseDescription(raw);
  const text = parsed ? parsed.intro : normalizeDescription(raw);
  return text
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/\s+/g, " ")
    .trim();
}

const clip = (text, max) => {
  if (text.length <= max) return text;
  const cut = text.slice(0, max - 1);
  return `${cut.slice(0, Math.max(cut.lastIndexOf(" "), max - 20)).replace(/[\s,;:–-]+$/, "")}…`;
};

const absolute = (url) => (!url ? DEFAULT_IMAGE : /^https?:\/\//.test(url) ? url : `${SITE_URL}${url.startsWith("/") ? "" : "/"}${url}`);

/** Normalises a raw `products` row (snake/camel case) for the SEO helpers. */
export function fromDbRow(r) {
  return {
    id: String(r.id),
    slug: r.slug || "",
    title: r.name || r.title || "",
    description: r.description || "",
    category: r.category_name || r.category || "",
    fabric: r.fabric || "",
    craft: r.craft || "",
    sku: r.sku || "",
    price: Number(r.price || 0),
    salePrice: r.salePrice ? Number(r.salePrice) : null,
    image: r.image_url || "",
    images: Array.isArray(r.images) ? r.images.map((i) => (typeof i === "string" ? i : i?.url)).filter(Boolean) : [],
    stock: Number(r.stock ?? 0),
    stockStatus: r.stock_status || "",
    isOneOfOne: Boolean(r.is_one_of_one),
    isArchived: Boolean(r.is_archived) || String(r.status).toUpperCase() === "ARCHIVED",
    isDraft: String(r.status).toUpperCase() === "DRAFT",
    seoTitle: r.seoTitle || "",
    seoDescription: r.seoDescription || "",
    updatedAt: r.updatedAt || r.createdAt || null,
  };
}

const isAvailable = (p) =>
  !p.isArchived && Number(p.stock) > 0 && !["out of stock", "sold out"].includes(String(p.stockStatus).toLowerCase());

/** Default SEO title, used when the admin hasn't written one. */
export function autoSeoTitle(p) {
  const base = displayName(p.title);
  const withBrand = `${base} | ${BRAND}`;
  return withBrand.length <= 65 ? withBrand : clip(base, 64);
}

// Filter families that say nothing specific about the piece.
const GENERIC_FACTS = new Set(["mixed", "handcrafted", "others", "other"]);

/** First real sentence paragraph (skips "Brand – Headline | Tagline" lines). */
function leadParagraph(raw = "") {
  const parsed = parseDescription(raw);
  const text = (parsed ? parsed.intro : normalizeDescription(raw)).replace(/<[^>]+>/g, " ");
  const paras = text
    .split(/\n+/)
    .map((t) => t.replace(/&nbsp;/g, " ").replace(/&amp;/g, "&").replace(/\s+/g, " ").trim())
    .filter(Boolean);
  return paras.find((t) => t.length >= 60 && !t.includes("|")) || paras.join(" ");
}

/** Default meta description, built only from the product's own data. */
export function autoSeoDescription(p) {
  const text = leadParagraph(p.description);
  if (text.length >= 70) return clip(text, 158);
  const facts = [p.fabric, p.craft].filter((f) => f && !GENERIC_FACTS.has(f.toLowerCase())).join(" · ");
  const lead = text || `${displayName(p.title)}${facts ? ` — ${facts}` : ""}.`;
  return clip(`${lead} Handcrafted in Lucknow by ${BRAND}.${p.isOneOfOne ? " A One of One piece." : ""}`, 158);
}

/** Everything a product page needs in <head>. */
export function productSeo(p) {
  const url = `${SITE_URL}${productPath(p)}`;
  const images = [p.image, ...(p.images || [])]
    .filter((u) => u && !String(u).includes("placeholder"))
    .filter((u, i, a) => a.indexOf(u) === i)
    .map(absolute);
  const price = p.salePrice > 0 && p.salePrice < p.price ? p.salePrice : p.price;
  const description = p.seoDescription || autoSeoDescription(p);

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: displayName(p.title),
    description: descriptionText(p.description) || description,
    sku: p.sku || undefined,
    category: p.category || undefined,
    material: p.fabric || undefined,
    image: images.length ? images : undefined,
    brand: { "@type": "Brand", name: BRAND },
    url,
    offers: price > 0 ? {
      "@type": "Offer",
      url,
      priceCurrency: "INR",
      price: String(price),
      availability: isAvailable(p) ? "https://schema.org/InStock" : "https://schema.org/OutOfStock",
      itemCondition: "https://schema.org/NewCondition",
      seller: { "@type": "Organization", name: BRAND },
    } : undefined,
  };

  return {
    title: p.seoTitle || autoSeoTitle(p),
    description,
    canonical: url,
    image: images[0] || DEFAULT_IMAGE,
    type: "product",
    price,
    available: isAvailable(p),
    jsonLd: JSON.parse(JSON.stringify(jsonLd)), // drop undefined keys
  };
}

const escapeAttr = (s = "") =>
  String(s).replace(/&/g, "&amp;").replace(/"/g, "&quot;").replace(/</g, "&lt;").replace(/>/g, "&gt;");

/** <head> markup for build-time pages. */
export function headTags(seo) {
  const tags = [
    `<title>${escapeAttr(seo.title)}</title>`,
    `<meta name="description" content="${escapeAttr(seo.description)}" />`,
    `<link rel="canonical" href="${escapeAttr(seo.canonical)}" />`,
    `<meta property="og:site_name" content="${BRAND}" />`,
    `<meta property="og:type" content="${seo.type === "product" ? "product" : "website"}" />`,
    `<meta property="og:title" content="${escapeAttr(seo.title)}" />`,
    `<meta property="og:description" content="${escapeAttr(seo.description)}" />`,
    `<meta property="og:url" content="${escapeAttr(seo.canonical)}" />`,
    `<meta property="og:image" content="${escapeAttr(seo.image)}" />`,
    `<meta name="twitter:card" content="summary_large_image" />`,
  ];
  if (seo.type === "product" && seo.price > 0) {
    tags.push(
      `<meta property="product:price:amount" content="${seo.price}" />`,
      `<meta property="product:price:currency" content="INR" />`,
      `<meta property="product:availability" content="${seo.available ? "in stock" : "out of stock"}" />`
    );
  }
  if (seo.jsonLd) {
    tags.push(`<script type="application/ld+json" data-sr-seo="1">${JSON.stringify(seo.jsonLd).replace(/</g, "\\u003c")}</script>`);
  }
  return tags.join("\n    ");
}

// ── Runtime (browser) ──────────────────────────────────────────────────────
const setMeta = (attr, key, content) => {
  let el = document.head.querySelector(`meta[${attr}="${key}"]`);
  if (!content) {
    el?.remove();
    return;
  }
  if (!el) {
    el = document.createElement("meta");
    el.setAttribute(attr, key);
    document.head.appendChild(el);
  }
  el.setAttribute("content", content);
};

/** Updates <head> for the current page. Pass nothing to restore site defaults. */
export function applyHead(seo = {}) {
  if (typeof document === "undefined") return;
  const title = seo.title || DEFAULT_TITLE;
  const description = seo.description || DEFAULT_DESCRIPTION;
  const canonical = seo.canonical || `${SITE_URL}${window.location.pathname}`;
  document.title = title;
  setMeta("name", "description", description);
  setMeta("property", "og:title", title);
  setMeta("property", "og:description", description);
  setMeta("property", "og:url", canonical);
  setMeta("property", "og:type", seo.type === "product" ? "product" : "website");
  setMeta("property", "og:image", seo.image || DEFAULT_IMAGE);
  setMeta("property", "product:price:amount", seo.type === "product" && seo.price ? String(seo.price) : "");
  setMeta("property", "product:price:currency", seo.type === "product" && seo.price ? "INR" : "");

  let link = document.head.querySelector('link[rel="canonical"]');
  if (!link) {
    link = document.createElement("link");
    link.setAttribute("rel", "canonical");
    document.head.appendChild(link);
  }
  link.setAttribute("href", canonical);

  document.head.querySelectorAll('script[type="application/ld+json"][data-sr-seo]').forEach((s) => s.remove());
  if (seo.jsonLd) {
    const s = document.createElement("script");
    s.type = "application/ld+json";
    s.dataset.srSeo = "1";
    s.textContent = JSON.stringify(seo.jsonLd);
    document.head.appendChild(s);
  }
}
