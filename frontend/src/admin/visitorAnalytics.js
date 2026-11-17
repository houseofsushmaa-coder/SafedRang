// Visitor analytics from public.site_events (written by the "site-visit" server function).
import { supabase } from "../lib/supabase";
import { periodRange } from "./adminService";

const PAGE = 1000;
const MAX_PAGES = 30; // up to 30,000 events per period

async function fetchEvents(start, end) {
  const rows = [];
  for (let i = 0; i < MAX_PAGES; i++) {
    const { data, error } = await supabase
      .from("site_events")
      .select("*")
      .gte("created_at", start.toISOString())
      .lt("created_at", end.toISOString())
      .order("created_at", { ascending: true })
      .range(i * PAGE, i * PAGE + PAGE - 1);
    if (error) {
      const missing = /site_events|does not exist|schema cache/i.test(error.message || "");
      return { rows, error: missing ? "missing" : error.message };
    }
    rows.push(...(data || []));
    if (!data || data.length < PAGE) break;
  }
  return { rows, truncated: rows.length >= PAGE * MAX_PAGES };
}

const SOURCE_NAMES = {
  ig: "Instagram", instagram: "Instagram", fb: "Facebook", facebook: "Facebook", meta: "Facebook",
  google: "Google", youtube: "YouTube", yt: "YouTube", whatsapp: "WhatsApp", wa: "WhatsApp",
  pinterest: "Pinterest", bing: "Bing", email: "Email", newsletter: "Email",
};

export function sourceOf(e) {
  if (e.utm_source) {
    const key = e.utm_source.toLowerCase();
    const name = SOURCE_NAMES[key] || e.utm_source;
    return /cpc|paid|ads?$/i.test(e.utm_medium || "") ? `${name} Ads` : name;
  }
  if (e.referrer) {
    let host = "";
    try {
      host = new URL(e.referrer).hostname.replace(/^www\./, "").replace(/^(m|l|lm)\./, "");
    } catch {
      return "Other";
    }
    if (/instagram/.test(host)) return "Instagram";
    if (/facebook|fb\.com|fb\.me/.test(host)) return "Facebook";
    if (/google\./.test(host)) return "Google";
    if (/whatsapp|wa\.me/.test(host)) return "WhatsApp";
    if (/youtube|youtu\.be/.test(host)) return "YouTube";
    if (/pinterest|pin\.it/.test(host)) return "Pinterest";
    if (/bing\./.test(host)) return "Bing";
    if (/chatgpt|openai|perplexity|gemini/.test(host)) return "AI assistants";
    return host || "Other";
  }
  return "Direct / unknown";
}

const TZ_COUNTRY = {
  "Asia/Kolkata": "India", "Asia/Calcutta": "India", "Asia/Dubai": "UAE", "Europe/London": "United Kingdom",
  "Asia/Singapore": "Singapore", "Asia/Riyadh": "Saudi Arabia", "Asia/Qatar": "Qatar", "Asia/Kathmandu": "Nepal",
  "Asia/Dhaka": "Bangladesh", "Asia/Karachi": "Pakistan", "Asia/Colombo": "Sri Lanka", "Australia/Sydney": "Australia",
  "Australia/Melbourne": "Australia", "America/Toronto": "Canada", "America/Vancouver": "Canada",
  "America/New_York": "USA", "America/Chicago": "USA", "America/Denver": "USA", "America/Los_Angeles": "USA",
  "Pacific/Auckland": "New Zealand", "Asia/Kuala_Lumpur": "Malaysia", "Asia/Hong_Kong": "Hong Kong",
};
let regionNames = null;
try {
  regionNames = new Intl.DisplayNames(["en"], { type: "region" });
} catch {}

export function locationOf(e) {
  if (e.country && e.country !== "XX" && e.country !== "T1") {
    try {
      return regionNames?.of(e.country) || e.country;
    } catch {
      return e.country;
    }
  }
  if (e.timezone) return TZ_COUNTRY[e.timezone] || e.timezone.split("/").pop().replace(/_/g, " ");
  return "Unknown";
}

const cleanPath = (p) => (p || "/").split("?")[0].replace(/\/+$/, "") || "/";
const pageLabel = (path) => {
  const p = cleanPath(path);
  if (p === "/") return "Home";
  if (p.startsWith("/product/")) return `Product · ${p.slice(9).replace(/-/g, " ")}`;
  return p.slice(1).replace(/[-/]/g, " ").replace(/^\w/, (c) => c.toUpperCase());
};

const tally = (map, key, by = 1) => map.set(key, (map.get(key) || 0) + by);
const top = (map, n = 8) =>
  [...map.entries()].sort((a, b) => b[1] - a[1]).slice(0, n).map(([label, value]) => ({ label, value }));
const pct = (a, b) => (b > 0 ? Math.round((a / b) * 1000) / 10 : null);
const dayKey = (iso) => {
  const d = new Date(iso);
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
};

export async function getVisitorAnalytics(period) {
  const { start, end } = periodRange(period);
  const { rows, error, truncated } = await fetchEvents(start, end);
  if (error === "missing") return { missing: true };
  if (error) throw new Error(error);

  // ── Sessions ──
  const sessions = new Map();
  for (const e of rows) {
    let s = sessions.get(e.session_id);
    if (!s) {
      s = {
        id: e.session_id,
        visitor: e.visitor_id,
        start: e.created_at,
        end: e.created_at,
        ip: e.ip,
        location: locationOf(e),
        device: e.device || "—",
        os: e.os || "",
        browser: e.browser || "",
        source: sourceOf(e),
        campaign: e.utm_campaign || "",
        landing: e.event === "page_view" ? pageLabel(e.path) : null,
        events: [],
        pages: 0,
        views: 0,
        adds: 0,
        checkout: false,
        orderId: null,
        orderValue: 0,
      };
      sessions.set(e.session_id, s);
    }
    s.end = e.created_at;
    if (!s.ip && e.ip) s.ip = e.ip;
    if (!s.landing && e.event === "page_view") s.landing = pageLabel(e.path);
    s.events.push(e);
    if (e.event === "page_view") s.pages++;
    if (e.event === "view_item") s.views++;
    if (e.event === "add_to_cart") s.adds += Number(e.quantity) || 1;
    if (e.event === "begin_checkout") s.checkout = true;
    if (e.event === "purchase") {
      s.orderId = e.order_id || "yes";
      s.orderValue += Number(e.value) || 0;
    }
  }
  const sessionList = [...sessions.values()];
  const visitors = new Set(rows.map((r) => r.visitor_id));
  const sessionsPerVisitor = new Map();
  sessionList.forEach((s) => tally(sessionsPerVisitor, s.visitor));
  sessionList.forEach((s) => {
    s.returning = (sessionsPerVisitor.get(s.visitor) || 0) > 1;
    s.durationSec = Math.max(0, Math.round((new Date(s.end) - new Date(s.start)) / 1000));
  });

  // ── Funnel (share of sessions reaching each step) ──
  const total = sessionList.length;
  const viewed = sessionList.filter((s) => s.views > 0).length;
  const added = sessionList.filter((s) => s.adds > 0).length;
  const checkedOut = sessionList.filter((s) => s.checkout).length;
  const ordered = sessionList.filter((s) => s.orderId).length;
  const funnel = [
    { label: "Visited the site", value: total },
    { label: "Viewed a product", value: viewed },
    { label: "Added to bag", value: added },
    { label: "Started checkout", value: checkedOut },
    { label: "Placed an order", value: ordered },
  ].map((step, i, arr) => ({
    ...step,
    ofTotal: pct(step.value, total),
    fromPrev: i === 0 ? null : pct(step.value, arr[i - 1].value),
  }));

  // ── Breakdowns ──
  const sources = new Map(), devices = new Map(), locations = new Map(), browsers = new Map();
  const pages = new Map(), productViews = new Map(), productAdds = new Map(), searches = new Map(), landings = new Map();
  sessionList.forEach((s) => {
    tally(sources, s.source);
    tally(devices, s.device);
    tally(locations, s.location);
    tally(browsers, s.browser || "Other");
    if (s.landing) tally(landings, s.landing);
  });
  for (const e of rows) {
    if (e.event === "page_view") tally(pages, pageLabel(e.path));
    if (e.event === "view_item" && e.product_title) tally(productViews, e.product_title);
    if (e.event === "add_to_cart" && e.product_title) tally(productAdds, e.product_title, Number(e.quantity) || 1);
    if (e.event === "search" && e.search_term) tally(searches, e.search_term.toLowerCase());
  }

  // Products people look at but don't add (worth improving photos/price/description).
  const lookedNotBought = [...productViews.entries()]
    .map(([title, views]) => ({ label: title, value: views, adds: productAdds.get(title) || 0 }))
    .filter((p) => p.value >= 3)
    .map((p) => ({ ...p, rate: pct(p.adds, p.value) }))
    .sort((a, b) => (a.rate ?? 0) - (b.rate ?? 0) || b.value - a.value)
    .slice(0, 8);

  // ── Daily visitors ──
  const daily = new Map();
  for (let d = new Date(start); d < end; d.setDate(d.getDate() + 1)) daily.set(dayKey(d), new Set());
  rows.forEach((e) => daily.get(dayKey(e.created_at))?.add(e.visitor_id));
  const dailySeries = [...daily.entries()].map(([date, set]) => ({ date, visitors: set.size }));

  const bounced = sessionList.filter((s) => s.events.length <= 1).length;
  const avgDuration = total ? Math.round(sessionList.reduce((a, s) => a + s.durationSec, 0) / total) : 0;

  return {
    missing: false,
    truncated,
    totals: {
      visitors: visitors.size,
      sessions: total,
      pageViews: rows.filter((e) => e.event === "page_view").length,
      productViews: rows.filter((e) => e.event === "view_item").length,
      addToCarts: rows.filter((e) => e.event === "add_to_cart").length,
      checkouts: checkedOut,
      orders: ordered,
      conversion: pct(ordered, total),
      bounceRate: pct(bounced, total),
      avgDuration,
      returning: sessionList.filter((s) => s.returning).length,
    },
    funnel,
    sources: top(sources),
    devices: top(devices, 4),
    browsers: top(browsers, 6),
    locations: top(locations),
    landings: top(landings),
    pages: top(pages),
    productViews: top(productViews),
    productAdds: top(productAdds),
    searches: top(searches),
    lookedNotBought,
    dailySeries,
    sessions: sessionList.sort((a, b) => new Date(b.start) - new Date(a.start)),
  };
}
