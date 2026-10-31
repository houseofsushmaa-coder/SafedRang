// Runs after `vite build`. Writes, into dist/:
//   robots.txt, sitemap.xml, and product/<slug>.html for every live product,
// each with its own <title>, meta description, canonical URL, Open Graph tags
// and Product JSON-LD — so search engines and link previews (WhatsApp,
// Instagram, Facebook), which don't run JavaScript, see real product data.
//
// It never fails the build: if the catalogue can't be fetched it still writes
// robots.txt and a sitemap of the static pages.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "fs";
import { dirname, join } from "path";
import { fileURLToPath } from "url";
import { SITE_URL, displayName, fromDbRow, headTags, productPath, productSeo } from "../src/lib/seo.js";

const root = join(dirname(fileURLToPath(import.meta.url)), "..");
const dist = join(root, "dist");

const STATIC_PAGES = [
  ["/", "1.0"], ["/shop", "0.9"], ["/one-of-one", "0.9"], ["/craft", "0.6"], ["/about", "0.6"],
  ["/journey", "0.5"], ["/care-guide", "0.5"], ["/faq", "0.5"], ["/contact", "0.5"],
  ["/privacy-policy", "0.2"], ["/terms", "0.2"],
];

const DISALLOW = ["/admin", "/account", "/checkout", "/payment", "/order-success", "/login", "/signup"];

const xmlEscape = (s = "") => String(s).replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;");
const htmlEscape = xmlEscape;

function readEnv() {
  const env = { url: process.env.VITE_SUPABASE_URL, key: process.env.VITE_SUPABASE_ANON_KEY };
  const file = join(root, ".env");
  if ((!env.url || !env.key) && existsSync(file)) {
    for (const line of readFileSync(file, "utf8").split(/\r?\n/)) {
      const m = line.match(/^(VITE_SUPABASE_URL|VITE_SUPABASE_ANON_KEY)=(.*)$/);
      if (m) env[m[1] === "VITE_SUPABASE_URL" ? "url" : "key"] ||= m[2].trim().replace(/^"|"$/g, "");
    }
  }
  return env;
}

async function fetchProducts() {
  const { url, key } = readEnv();
  if (!url || !key) throw new Error("Supabase URL/key not available at build time");
  const cols = "id,slug,name,description,category_name,fabric,craft,sku,price,salePrice,image_url,images,stock,stock_status,status,is_one_of_one,is_archived,seoTitle,seoDescription,updatedAt,createdAt";
  const res = await fetch(`${url}/rest/v1/products?select=${cols}&limit=2000`, {
    headers: { apikey: key, Authorization: `Bearer ${key}` },
  });
  if (!res.ok) throw new Error(`products fetch failed: ${res.status}`);
  return (await res.json()).map(fromDbRow);
}

// Removes the site-default tags from index.html so each page gets its own.
const stripDefaultHead = (html) =>
  html
    .replace(/\s*<title>[\s\S]*?<\/title>/, "")
    .replace(/\s*<meta name="description"[^>]*>/g, "")
    .replace(/\s*<meta property="(og|product):[^"]*"[^>]*>/g, "")
    .replace(/\s*<meta name="twitter:[^"]*"[^>]*>/g, "")
    .replace(/\s*<link rel="canonical"[^>]*>/g, "");

function productPage(template, p) {
  const seo = productSeo(p);
  const name = displayName(p.title);
  const price = seo.price > 0 ? `₹${Number(seo.price).toLocaleString("en-IN")}` : "";
  // Shown only until the app loads (and to crawlers that don't run JS).
  const body = [
    `<main style="max-width:720px;margin:40px auto;padding:0 20px;font-family:sans-serif">`,
    `<h1>${htmlEscape(name)}</h1>`,
    price ? `<p>${price}</p>` : "",
    seo.image ? `<img src="${htmlEscape(seo.image)}" alt="${htmlEscape(name)}" width="450" style="max-width:100%;height:auto" />` : "",
    `<p>${htmlEscape(seo.jsonLd.description || seo.description)}</p>`,
    `</main>`,
  ].join("");
  return stripDefaultHead(template)
    .replace("</head>", `    ${headTags(seo)}\n  </head>`)
    .replace('<div id="root"></div>', `<div id="root">${body}</div>`);
}

function sitemap(products) {
  const today = new Date().toISOString().slice(0, 10);
  const urls = STATIC_PAGES.map(
    ([path, priority]) => `  <url><loc>${SITE_URL}${path}</loc><lastmod>${today}</lastmod><priority>${priority}</priority></url>`
  );
  for (const p of products) {
    const seo = productSeo(p);
    const image = seo.image && !seo.image.endsWith("one-of-one-banner.jpg")
      ? `<image:image><image:loc>${xmlEscape(seo.image)}</image:loc><image:title>${xmlEscape(displayName(p.title))}</image:title></image:image>`
      : "";
    const lastmod = p.updatedAt ? String(p.updatedAt).slice(0, 10) : today;
    urls.push(`  <url><loc>${xmlEscape(seo.canonical)}</loc><lastmod>${lastmod}</lastmod><priority>0.8</priority>${image}</url>`);
  }
  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9" xmlns:image="http://www.google.com/schemas/sitemap-image/1.1">\n${urls.join("\n")}\n</urlset>\n`;
}

const robots = () =>
  ["User-agent: *", "Allow: /", ...DISALLOW.map((d) => `Disallow: ${d}`), "", `Sitemap: ${SITE_URL}/sitemap.xml`, ""].join("\n");

async function main() {
  if (!existsSync(join(dist, "index.html"))) {
    console.warn("[seo] dist/index.html not found — run vite build first.");
    return;
  }
  writeFileSync(join(dist, "robots.txt"), robots());

  let products = [];
  try {
    products = (await fetchProducts()).filter(
      (p) => !p.isDraft && !p.isArchived && /^[a-z0-9-]+$/.test(p.slug)
    );
  } catch (err) {
    console.warn(`[seo] Skipping product pages: ${err.message}`);
  }

  writeFileSync(join(dist, "sitemap.xml"), sitemap(products));

  const template = readFileSync(join(dist, "index.html"), "utf8");
  for (const p of products) {
    const file = join(dist, `${productPath(p).slice(1)}.html`);
    mkdirSync(dirname(file), { recursive: true });
    writeFileSync(file, productPage(template, p));
  }
  console.log(`[seo] robots.txt, sitemap.xml (${STATIC_PAGES.length + products.length} URLs), ${products.length} product pages`);
}

main().catch((err) => console.warn(`[seo] ${err.message}`));
