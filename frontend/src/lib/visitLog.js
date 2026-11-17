// First-party visitor analytics (Admin → Overview → Visitors).
// Events are queued and sent in small batches to the "site-visit" server function,
// which adds the visitor's IP, device and country. Admin pages and the store
// owner's own browser (anyone who has opened the admin on it) are not counted.

const ENDPOINT = `${import.meta.env.VITE_SUPABASE_URL}/functions/v1/site-visit`;
const VISITOR_KEY = "sr_vid";
const SESSION_KEY = "sr_sid";
const SESSION_TOUCH_KEY = "sr_sid_at";
const ATTRIBUTION_KEY = "sr_attr";
export const ADMIN_DEVICE_KEY = "sr_admin_device";
const SESSION_IDLE_MS = 30 * 60 * 1000;

const LOGGED_EVENTS = new Set([
  "page_view", "view_item", "search", "add_to_wishlist", "add_to_cart", "remove_from_cart",
  "begin_checkout", "add_payment_info", "purchase", "whatsapp_click",
]);

const uid = () =>
  (crypto.randomUUID?.() || `${Date.now().toString(36)}${Math.random().toString(36).slice(2)}`).replace(/-/g, "").slice(0, 24);

function safeGet(store, key) {
  try {
    return store.getItem(key);
  } catch {
    return null;
  }
}
function safeSet(store, key, value) {
  try {
    store.setItem(key, value);
  } catch {}
}

function visitorId() {
  let id = safeGet(localStorage, VISITOR_KEY);
  if (!id) {
    id = uid();
    safeSet(localStorage, VISITOR_KEY, id);
  }
  return id;
}

// A session ends after 30 minutes without activity.
function sessionId() {
  const now = Date.now();
  let id = safeGet(sessionStorage, SESSION_KEY);
  const last = Number(safeGet(localStorage, SESSION_TOUCH_KEY) || 0);
  if (!id || now - last > SESSION_IDLE_MS) {
    id = uid();
    safeSet(sessionStorage, SESSION_KEY, id);
    safeSet(sessionStorage, ATTRIBUTION_KEY, ""); // fresh source for the new session
  }
  safeSet(localStorage, SESSION_TOUCH_KEY, String(now));
  return id;
}

// Where this session came from: UTM tags and the external referrer, kept for the session.
function attribution() {
  const saved = safeGet(sessionStorage, ATTRIBUTION_KEY);
  if (saved) {
    try {
      return JSON.parse(saved);
    } catch {}
  }
  const params = new URLSearchParams(window.location.search);
  let ref = document.referrer || "";
  try {
    if (ref && new URL(ref).host === window.location.host) ref = "";
  } catch {
    ref = "";
  }
  const attr = {
    ref,
    utm_source: params.get("utm_source") || (params.get("fbclid") ? "facebook" : params.get("gclid") ? "google" : ""),
    utm_medium: params.get("utm_medium") || (params.get("gclid") ? "cpc" : ""),
    utm_campaign: params.get("utm_campaign") || "",
  };
  safeSet(sessionStorage, ATTRIBUTION_KEY, JSON.stringify(attr));
  return attr;
}

let queue = [];
let timer = null;

function flush(useBeacon = false) {
  clearTimeout(timer);
  timer = null;
  if (!queue.length) return;
  const events = queue.splice(0, 25);
  let tz = "";
  try {
    tz = Intl.DateTimeFormat().resolvedOptions().timeZone || "";
  } catch {}
  const body = JSON.stringify({
    ctx: {
      vid: visitorId(),
      sid: sessionId(),
      tz,
      lang: navigator.language || "",
      screen: `${window.screen?.width || 0}x${window.screen?.height || 0}`,
      ...attribution(),
    },
    events,
  });
  try {
    // text/plain avoids a CORS preflight and works with sendBeacon on page exit.
    const blob = new Blob([body], { type: "text/plain" });
    if (useBeacon && navigator.sendBeacon?.(ENDPOINT, blob)) return;
    fetch(ENDPOINT, { method: "POST", body, keepalive: true, headers: { "Content-Type": "text/plain" } }).catch(() => {});
  } catch {}
  if (queue.length) flush(useBeacon);
}

if (typeof window !== "undefined") {
  window.addEventListener("pagehide", () => flush(true));
  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "hidden") flush(true);
  });
}

/** Called from trackEvent for storefront events. */
export function logVisitEvent(name, data = {}) {
  if (typeof window === "undefined" || !LOGGED_EVENTS.has(name)) return;
  if (!import.meta.env.VITE_SUPABASE_URL) return;
  if (window.location.pathname.startsWith("/admin")) return;
  if (safeGet(localStorage, ADMIN_DEVICE_KEY)) return;
  if (navigator.webdriver) return;

  const item = Array.isArray(data.items) && data.items[0] ? data.items[0] : null;
  queue.push({
    name,
    ts: Date.now(),
    path: window.location.pathname + window.location.search,
    title: document.title,
    productId: item?.item_id || null,
    productTitle: item?.item_name || null,
    quantity: item?.quantity ?? null,
    value: typeof data.value === "number" ? data.value : null,
    orderId: data.transaction_id || null,
    searchTerm: data.search_term || null,
  });
  // Purchases and checkouts go straight away; everything else is batched.
  if (name === "purchase" || name === "begin_checkout" || queue.length >= 10) flush();
  else if (!timer) timer = setTimeout(() => flush(), 4000);
}
