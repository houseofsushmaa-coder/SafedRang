/**
 * ==============================================================================
 * SAFED RANG — UNIFIED TRACKING & ANALYTICS ENGINE
 * Handles multi-pixel script injection, standard event dispatching,
 * deduplication, and single-page application route transitions.
 * ==============================================================================
 */

import { supabase } from "./supabase";

export const TRACKING_STORAGE_KEY = "safedrang_tracking_integrations";

// Supported integration definitions with default state
export const DEFAULT_INTEGRATIONS = {
  meta_pixel: {
    id: "meta_pixel",
    name: "Meta Pixel (Facebook & Instagram)",
    provider: "Meta",
    enabled: false,
    public_id: "",
    conversions_api_token: "",
    test_event_code: "",
    conversions_api_enabled: false,
    advanced_matching_enabled: true,
    event_settings: {
      track_page_view: true,
      track_view_content: true,
      track_add_to_cart: true,
      track_initiate_checkout: true,
      track_purchase: true,
      track_lead: true,
    },
    verification_status: "unconfigured",
    last_verified_at: null,
  },
  ga4: {
    id: "ga4",
    name: "Google Analytics 4 (GA4)",
    provider: "Google",
    enabled: false,
    public_id: "",
    enhanced_measurement: true,
    debug_mode: false,
    event_settings: {
      track_page_view: true,
      track_view_item: true,
      track_add_to_cart: true,
      track_begin_checkout: true,
      track_purchase: true,
      track_form_submissions: true,
    },
    verification_status: "unconfigured",
    last_verified_at: null,
  },
  gtm: {
    id: "gtm",
    name: "Google Tag Manager",
    provider: "Google",
    enabled: false,
    public_id: "",
    data_layer_enabled: true,
    ecommerce_data_layer_enabled: true,
    custom_events_enabled: true,
    event_settings: {
      track_page_view: true,
      track_ecommerce: true,
    },
    verification_status: "unconfigured",
    last_verified_at: null,
  },
  google_ads: {
    id: "google_ads",
    name: "Google Ads Conversion Tracking",
    provider: "Google",
    enabled: false,
    public_id: "",
    conversion_label: "",
    conversion_value: "",
    currency_code: "INR",
    enhanced_conversions: true,
    event_settings: {
      track_purchase: true,
      track_lead: true,
    },
    verification_status: "unconfigured",
    last_verified_at: null,
  },
  tiktok: {
    id: "tiktok",
    name: "TikTok Pixel",
    provider: "ByteDance",
    enabled: false,
    public_id: "",
    events_api_enabled: false,
    events_api_token: "",
    event_settings: {
      track_page_view: true,
      track_view_content: true,
      track_add_to_cart: true,
      track_initiate_checkout: true,
      track_complete_payment: true,
    },
    verification_status: "unconfigured",
    last_verified_at: null,
  },
  pinterest: {
    id: "pinterest",
    name: "Pinterest Tag",
    provider: "Pinterest",
    enabled: false,
    public_id: "",
    event_settings: {
      track_page_visit: true,
      track_add_to_cart: true,
      track_checkout: true,
      track_signup: true,
      track_lead: true,
    },
    verification_status: "unconfigured",
    last_verified_at: null,
  },
  clarity: {
    id: "clarity",
    name: "Microsoft Clarity",
    provider: "Microsoft",
    enabled: false,
    public_id: "",
    event_settings: {},
    verification_status: "unconfigured",
    last_verified_at: null,
  },
  microsoft_uet: {
    id: "microsoft_uet",
    name: "Microsoft Advertising UET",
    provider: "Microsoft",
    enabled: false,
    public_id: "",
    conversion_goal_name: "",
    event_settings: {
      track_page_view: true,
      track_conversions: true,
      track_remarketing: true,
    },
    verification_status: "unconfigured",
    last_verified_at: null,
  },
  reddit: {
    id: "reddit",
    name: "Reddit Pixel",
    provider: "Reddit",
    enabled: false,
    public_id: "",
    event_settings: {
      track_page_visit: true,
      track_view_content: true,
      track_add_to_cart: true,
      track_purchase: true,
      track_lead: true,
    },
    verification_status: "unconfigured",
    last_verified_at: null,
  },
  openai: {
    id: "openai",
    name: "OpenAI Tag",
    provider: "OpenAI",
    enabled: false,
    public_id: "",
    is_supported: false,
    notice: "No official consumer advertising or analytics tracking pixel is offered by OpenAI. Script injection is not supported for this provider.",
    event_settings: {},
    verification_status: "unsupported",
    last_verified_at: null,
  },
};

// In-memory cache & tracking state
let cachedIntegrations = null;
const firedPurchaseDeduplication = new Set();

/**
 * Loads current tracking integrations from Supabase or localStorage fallback.
 */
export async function loadTrackingIntegrations() {
  let loaded = null;

  try {
    const { data, error } = await supabase
      .from("tracking_integrations")
      .select("*");

    if (!error && Array.isArray(data) && data.length > 0) {
      loaded = { ...DEFAULT_INTEGRATIONS };
      data.forEach((row) => {
        if (loaded[row.id]) {
          loaded[row.id] = {
            ...loaded[row.id],
            ...row,
            event_settings: {
              ...loaded[row.id].event_settings,
              ...(row.event_settings || {}),
            },
            ...(row.additional_config || {}),
          };
        }
      });
    }
  } catch (err) {
    console.warn("[Tracking] Supabase read failed, trying local storage:", err?.message);
  }

  if (!loaded) {
    try {
      const stored = localStorage.getItem(TRACKING_STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        loaded = { ...DEFAULT_INTEGRATIONS };
        Object.keys(parsed).forEach((key) => {
          if (loaded[key]) {
            loaded[key] = { ...loaded[key], ...parsed[key] };
          }
        });
      }
    } catch {}
  }

  // Check if legacy GA4 measurement ID was in SEO settings
  if (loaded && !loaded.ga4?.public_id) {
    try {
      const legacy = localStorage.getItem("safedrang_store_settings");
      if (legacy) {
        const parsedLegacy = JSON.parse(legacy);
        const legacyGa = parsedLegacy?.seo?.google_analytics_id;
        if (legacyGa && legacyGa.startsWith("G-")) {
          loaded.ga4.public_id = legacyGa;
          loaded.ga4.enabled = true;
          loaded.ga4.verification_status = "configured";
        }
      }
    } catch {}
  }

  cachedIntegrations = loaded || { ...DEFAULT_INTEGRATIONS };
  return cachedIntegrations;
}

/**
 * Saves tracking integrations to Supabase and localStorage.
 */
export async function saveTrackingIntegrations(integrationsObj) {
  cachedIntegrations = { ...integrationsObj };

  // Persist locally for zero-latency load on client side
  try {
    localStorage.setItem(TRACKING_STORAGE_KEY, JSON.stringify(integrationsObj));
  } catch (err) {
    console.warn("[Tracking] localStorage save error:", err);
  }

  // Persist to Supabase
  try {
    const rows = Object.values(integrationsObj)
      .filter((item) => item.id !== "openai") // OpenAI is strictly unsupported
      .map((item) => ({
        id: item.id,
        enabled: Boolean(item.enabled),
        public_id: String(item.public_id || "").trim(),
        event_settings: item.event_settings || {},
        additional_config: {
          conversions_api_token: item.conversions_api_token || "",
          test_event_code: item.test_event_code || "",
          conversions_api_enabled: Boolean(item.conversions_api_enabled),
          advanced_matching_enabled: Boolean(item.advanced_matching_enabled),
          enhanced_measurement: Boolean(item.enhanced_measurement),
          debug_mode: Boolean(item.debug_mode),
          data_layer_enabled: Boolean(item.data_layer_enabled),
          ecommerce_data_layer_enabled: Boolean(item.ecommerce_data_layer_enabled),
          custom_events_enabled: Boolean(item.custom_events_enabled),
          conversion_label: item.conversion_label || "",
          conversion_value: item.conversion_value || "",
          currency_code: item.currency_code || "INR",
          enhanced_conversions: Boolean(item.enhanced_conversions),
          events_api_enabled: Boolean(item.events_api_enabled),
          events_api_token: item.events_api_token || "",
          conversion_goal_name: item.conversion_goal_name || "",
        },
        verification_status: item.verification_status || "unconfigured",
        last_verified_at: item.last_verified_at || null,
        updated_at: new Date().toISOString(),
      }));

    await supabase.from("tracking_integrations").upsert(rows, { onConflict: "id" });
  } catch (err) {
    console.warn("[Tracking] Supabase upsert error (saved locally):", err?.message);
  }

  // Broadcast event across windows/tabs
  if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent("safedrang:tracking_updated", { detail: integrationsObj }));
  }

  return integrationsObj;
}

// ─────────────────────────────────────────────────────────────────────────────
// SCRIPT INJECTION RUNTIME
// ─────────────────────────────────────────────────────────────────────────────

function injectScriptOnce(id, src, inlineCode) {
  if (typeof document === "undefined") return;
  if (document.getElementById(id)) return;

  const script = document.createElement("script");
  script.id = id;
  script.async = true;

  if (src) {
    script.src = src;
  }
  if (inlineCode) {
    script.innerHTML = inlineCode;
  }

  document.head.appendChild(script);
}

/**
 * Initializes all enabled provider scripts on the storefront.
 */
export function initStorefrontTracking(integrations) {
  if (typeof window === "undefined" || !integrations) return;

  // 1. Google Tag Manager
  const gtm = integrations.gtm;
  if (gtm?.enabled && gtm?.public_id?.trim().startsWith("GTM-")) {
    const gtmId = gtm.public_id.trim();
    window.dataLayer = window.dataLayer || [];
    window.dataLayer.push({ "gtm.start": new Date().getTime(), event: "gtm.js" });

    injectScriptOnce(
      "gtm-script",
      `https://www.googletagmanager.com/gtm.js?id=${gtmId}`
    );
  }

  // 2. Google Analytics 4 (GA4)
  const ga4 = integrations.ga4;
  if (ga4?.enabled && ga4?.public_id?.trim().startsWith("G-")) {
    const gaId = ga4.public_id.trim();
    injectScriptOnce("ga4-gtag-script", `https://www.googletagmanager.com/gtag/js?id=${gaId}`);

    window.dataLayer = window.dataLayer || [];
    if (!window.gtag) {
      window.gtag = function () {
        window.dataLayer.push(arguments);
      };
      window.gtag("js", new Date());
    }

    const configOpts = {
      send_page_view: false, // Managed manually per route
    };
    if (ga4.debug_mode) {
      configOpts.debug_mode = true;
    }
    window.gtag("config", gaId, configOpts);
  }

  // 3. Google Ads Conversion Tracking
  const gAds = integrations.google_ads;
  if (gAds?.enabled && gAds?.public_id?.trim().startsWith("AW-")) {
    const adsId = gAds.public_id.trim();
    if (!document.getElementById("ga4-gtag-script")) {
      injectScriptOnce("gads-gtag-script", `https://www.googletagmanager.com/gtag/js?id=${adsId}`);
    }
    window.dataLayer = window.dataLayer || [];
    if (!window.gtag) {
      window.gtag = function () {
        window.dataLayer.push(arguments);
      };
      window.gtag("js", new Date());
    }
    window.gtag("config", adsId);
  }

  // 4. Meta Pixel (Facebook & Instagram)
  const meta = integrations.meta_pixel;
  if (meta?.enabled && meta?.public_id?.trim()) {
    const pixelId = meta.public_id.trim();
    if (!window.fbq) {
      /* eslint-disable */
      (function(f,b,e,v,n,t,s)
      {if(f.fbq)return;n=f.fbq=function(){n.callMethod?
      n.callMethod.apply(n,arguments):n.queue.push(arguments)};
      if(!f._fbq)f._fbq=n;n.push=n;n.loaded=!0;n.version='2.0';
      n.queue=[];t=b.createElement(e);t.async=!0;
      t.src=v;s=b.getElementsByTagName(e)[0];
      s.parentNode.insertBefore(t,s)})(window, document,'script',
      'https://connect.facebook.net/en_US/fbevents.js');
      /* eslint-enable */
    }
    if (window.fbq) {
      window.fbq("init", pixelId);
    }
  }

  // 5. TikTok Pixel
  const tiktok = integrations.tiktok;
  if (tiktok?.enabled && tiktok?.public_id?.trim()) {
    const ttId = tiktok.public_id.trim();
    if (!window.ttq) {
      /* eslint-disable */
      (function (w, d, t) {
        w.TiktokAnalyticsObject=t;var ttq=w[t]=w[t]||[];ttq.methods=["page","track","identify","instances","debug","on","off","once","ready","alias","group","enableCookie","disableCookie","holdConsent","revokeConsent","grantConsent"];ttq.setAndDefer=function(t,e){t[e]=function(){t.push([e].concat(Array.prototype.slice.call(arguments,0)))}};for(var i=0;i<ttq.methods.length;i++)ttq.setAndDefer(ttq,ttq.methods[i]);ttq.instance=function(t){for(var e=ttq._i[t]||[],n=0;n<ttq.methods.length;n++)ttq.setAndDefer(e,ttq.methods[n]);return e};ttq.load=function(e,n){var r="https://analytics.tiktok.com/i18n/pixel/events.js",o=n&&n.partner;ttq._i=ttq._i||{},ttq._i[e]=[],ttq._i[e]._u=r,ttq._t=ttq._t||{},ttq._t[e]=+new Date,ttq._o=ttq._o||{},ttq._o[e]=n||{};var a=document.createElement("script");a.type="text/javascript",a.async=!0,a.src=r+"?sdkid="+e+"&lib="+t;var c=document.getElementsByTagName("script")[0];c.parentNode.insertBefore(a,c)};
      })(window, document, 'ttq');
      /* eslint-enable */
    }
    if (window.ttq) {
      window.ttq.load(ttId);
    }
  }

  // 6. Pinterest Tag
  const pinterest = integrations.pinterest;
  if (pinterest?.enabled && pinterest?.public_id?.trim()) {
    const pinId = pinterest.public_id.trim();
    if (!window.pintrk) {
      /* eslint-disable */
      (function(e){if(!window.pintrk){window.pintrk = function () {
      window.pintrk.queue.push(Array.prototype.slice.call(arguments))};var
      n=window.pintrk;n.queue=[],n.version="3.0";var
      t=document.createElement("script");t.async=!0,t.src=e;var
      r=document.getElementsByTagName("script")[0];
      r.parentNode.insertBefore(t,r)}})("https://s.pinimg.com/ct/core.js");
      /* eslint-enable */
    }
    if (window.pintrk) {
      window.pintrk("load", pinId);
    }
  }

  // 7. Microsoft Clarity
  const clarity = integrations.clarity;
  if (clarity?.enabled && clarity?.public_id?.trim()) {
    const clarityId = clarity.public_id.trim();
    if (!window.clarity) {
      /* eslint-disable */
      (function(c,l,a,r,i,t,y){
        c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};
        t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/"+i;
        y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);
      })(window, document, "clarity", "script", clarityId);
      /* eslint-enable */
    }
  }

  // 8. Microsoft Advertising UET
  const uet = integrations.microsoft_uet;
  if (uet?.enabled && uet?.public_id?.trim()) {
    const uetTagId = uet.public_id.trim();
    window.uetq = window.uetq || [];
    injectScriptOnce(
      "ms-uet-script",
      `https://bat.bing.com/bat.js`
    );
  }

  // 9. Reddit Pixel
  const reddit = integrations.reddit;
  if (reddit?.enabled && reddit?.public_id?.trim()) {
    const redditId = reddit.public_id.trim();
    if (!window.rdt) {
      /* eslint-disable */
      !function(w,d){if(!w.rdt){var p=w.rdt=function(){p.sendEvent?p.sendEvent.apply(p,arguments):p.callQueue.push(arguments)};p.callQueue=[];var t=d.createElement("script");t.src="https://www.redditstatic.com/ads/pixel.js",t.async=!0;var s=d.getElementsByTagName("script")[0];s.parentNode.insertBefore(t,s)}}(window,document);
      /* eslint-enable */
    }
    if (window.rdt) {
      window.rdt("init", redditId);
    }
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// UNIFIED EVENT TRACKING ENGINE
// ─────────────────────────────────────────────────────────────────────────────

const stripEmpty = (obj) =>
  Object.fromEntries(Object.entries(obj).filter(([, v]) => v !== undefined && v !== null && v !== ""));

/**
 * Converts a storefront product (or cart line) into a GA4 ecommerce item.
 * Only catalogue data is included — never customer information.
 */
export function toAnalyticsItem(product, { price, quantity = 1, variant, index, listName } = {}) {
  const unit = price ?? (product?.salePrice > 0 ? product.salePrice : product?.price) ?? 0;
  return stripEmpty({
    item_id: String(product?.id ?? ""),
    item_name: String(product?.title || product?.name || "").replace(/"/g, ""),
    item_brand: "Safed Rang",
    item_category: product?.category,
    item_category2: product?.isOneOfOne ? "One of One" : undefined,
    item_variant: variant,
    item_list_name: listName,
    index,
    price: Number(unit) || 0,
    quantity,
  });
}

// GA4 events that can be switched off from Admin → Tracking.
const GA4_TOGGLES = {
  page_view: "track_page_view",
  view_item: "track_view_item",
  add_to_cart: "track_add_to_cart",
  begin_checkout: "track_begin_checkout",
  purchase: "track_purchase",
  generate_lead: "track_form_submissions",
};

const ECOMMERCE_EVENTS = new Set([
  "view_item_list", "select_item", "view_item", "add_to_wishlist", "add_to_cart",
  "remove_from_cart", "view_cart", "begin_checkout", "add_shipping_info",
  "add_payment_info", "purchase",
]);

const metaContents = (items = []) => ({
  content_ids: items.map((i) => i.item_id),
  contents: items.map((i) => ({ id: i.item_id, quantity: i.quantity || 1, item_price: i.price })),
  content_type: "product",
  num_items: items.reduce((s, i) => s + (i.quantity || 1), 0),
});

/**
 * Dispatches an event to every enabled integration.
 *
 * Event names follow the GA4 recommended ecommerce schema:
 *   page_view, view_item_list, select_item, view_item, search, add_to_wishlist,
 *   add_to_cart, remove_from_cart, view_cart, begin_checkout, add_shipping_info,
 *   add_payment_info, purchase, generate_lead
 * plus custom: filter_apply, sort_change, whatsapp_click.
 *
 * Payload: { value, currency, items: toAnalyticsItem()[], transaction_id,
 *            shipping, payment_type, search_term, item_list_name, ... }
 *
 * `purchase` must only be sent after the server has confirmed the order.
 */
export function trackEvent(eventName, payload = {}) {
  if (typeof window === "undefined") return;

  // Prevent tracking admin activity
  if (window.location.pathname.startsWith("/admin")) return;

  const data = { currency: "INR", ...payload };
  const items = Array.isArray(data.items) ? data.items : [];

  // ── Purchase Deduplication (across reloads and tabs) ─────────
  if (eventName === "purchase") {
    const dedupeKey = data.transaction_id;
    if (!dedupeKey) {
      console.warn("[Tracking] purchase without transaction_id ignored");
      return;
    }
    const storageKey = `sr_tracked_purchase_${dedupeKey}`;
    let seen = firedPurchaseDeduplication.has(dedupeKey);
    try {
      seen = seen || Boolean(localStorage.getItem(storageKey));
      localStorage.setItem(storageKey, "1");
    } catch {}
    if (seen) {
      console.info(`[Tracking] Duplicate purchase suppressed for order: ${dedupeKey}`);
      return;
    }
    firedPurchaseDeduplication.add(dedupeKey);
  }

  // Development audit trail — lets us verify events fire without live pixels.
  if (import.meta.env.DEV) {
    window.__srEvents = window.__srEvents || [];
    window.__srEvents.push({ event: eventName, ...data });
    console.debug("[Tracking]", eventName, data);
  }

  const cfg = cachedIntegrations;
  if (!cfg) return;

  const pagePayload = {
    page_path: window.location.pathname + window.location.search,
    page_location: window.location.href,
    page_title: document.title,
  };
  const ga4Params =
    eventName === "page_view"
      ? pagePayload
      : stripEmpty({ ...data, items: items.length ? items : undefined });

  // 1. DataLayer / GTM
  if (cfg.gtm?.enabled && window.dataLayer) {
    if (ECOMMERCE_EVENTS.has(eventName)) {
      window.dataLayer.push({ ecommerce: null });
      window.dataLayer.push({ event: eventName, ecommerce: ga4Params });
    } else {
      window.dataLayer.push({ event: eventName, ...ga4Params });
    }
  }

  // 2. Google Analytics 4 (GA4)
  if (cfg.ga4?.enabled && window.gtag) {
    const toggle = GA4_TOGGLES[eventName];
    if (!toggle || (cfg.ga4.event_settings || {})[toggle] !== false) {
      window.gtag("event", eventName, ga4Params);
    }
  }

  // 3. Google Ads
  if (cfg.google_ads?.enabled && window.gtag) {
    const adsCfg = cfg.google_ads;
    const adsEvents = adsCfg.event_settings || {};
    const sendTo = adsCfg.conversion_label ? `${adsCfg.public_id}/${adsCfg.conversion_label}` : adsCfg.public_id;

    if (eventName === "purchase" && adsEvents.track_purchase !== false) {
      window.gtag("event", "conversion", {
        send_to: sendTo,
        value: data.value || 0,
        currency: data.currency,
        transaction_id: data.transaction_id,
      });
    } else if (eventName === "generate_lead" && adsEvents.track_lead !== false) {
      window.gtag("event", "conversion", { send_to: sendTo });
    }
  }

  // 4. Meta Pixel (Facebook & Instagram)
  if (cfg.meta_pixel?.enabled && window.fbq) {
    const m = cfg.meta_pixel.event_settings || {};
    const value = { value: data.value || 0, currency: data.currency };
    const map = {
      page_view: m.track_page_view !== false && ["PageView"],
      view_item: m.track_view_content !== false && ["ViewContent", { ...metaContents(items), ...value }],
      add_to_cart: m.track_add_to_cart !== false && ["AddToCart", { ...metaContents(items), ...value }],
      add_to_wishlist: ["AddToWishlist", { ...metaContents(items), ...value }],
      begin_checkout: m.track_initiate_checkout !== false && ["InitiateCheckout", { ...metaContents(items), ...value }],
      add_payment_info: ["AddPaymentInfo", { ...metaContents(items), ...value }],
      purchase: m.track_purchase !== false && ["Purchase", { ...metaContents(items), ...value }, { eventID: data.transaction_id }],
      search: ["Search", { search_string: data.search_term }],
      whatsapp_click: ["Contact"],
      generate_lead: m.track_lead !== false && ["Lead", { content_category: data.lead_type || "Lead" }],
    }[eventName];
    if (map) window.fbq("track", ...map);
  }

  // 5. TikTok Pixel
  if (cfg.tiktok?.enabled && window.ttq) {
    const t = cfg.tiktok.event_settings || {};
    const params = {
      contents: items.map((i) => ({ content_id: i.item_id, content_name: i.item_name, quantity: i.quantity || 1, price: i.price })),
      content_type: "product",
      value: data.value || 0,
      currency: data.currency,
    };
    if (eventName === "page_view" && t.track_page_view !== false) window.ttq.page();
    const name = {
      view_item: t.track_view_content !== false && "ViewContent",
      add_to_cart: t.track_add_to_cart !== false && "AddToCart",
      add_to_wishlist: "AddToWishlist",
      begin_checkout: t.track_initiate_checkout !== false && "InitiateCheckout",
      add_payment_info: "AddPaymentInfo",
      purchase: t.track_complete_payment !== false && "CompletePayment",
      search: "Search",
      whatsapp_click: "Contact",
    }[eventName];
    if (name) window.ttq.track(name, eventName === "search" ? { query: data.search_term } : params);
  }

  // 6. Pinterest Tag
  if (cfg.pinterest?.enabled && window.pintrk) {
    const p = cfg.pinterest.event_settings || {};
    const qty = items.reduce((s, i) => s + (i.quantity || 1), 0) || 1;
    if (eventName === "page_view" && p.track_page_visit !== false) window.pintrk("page");
    else if (eventName === "add_to_cart" && p.track_add_to_cart !== false)
      window.pintrk("track", "addtocart", { value: data.value || 0, order_quantity: qty, currency: data.currency });
    else if (eventName === "purchase" && p.track_checkout !== false)
      window.pintrk("track", "checkout", { value: data.value || 0, order_quantity: qty, currency: data.currency, order_id: data.transaction_id });
    else if (eventName === "search") window.pintrk("track", "search", { search_query: data.search_term });
    else if (eventName === "generate_lead" && p.track_lead !== false) window.pintrk("track", "lead");
  }

  // 7. Reddit Pixel
  if (cfg.reddit?.enabled && window.rdt) {
    const r = cfg.reddit.event_settings || {};
    const products = items.map((i) => ({ id: i.item_id, name: i.item_name }));
    const itemCount = items.reduce((s, i) => s + (i.quantity || 1), 0);
    if (eventName === "page_view" && r.track_page_visit !== false) window.rdt("track", "PageVisit");
    else if (eventName === "view_item" && r.track_view_content !== false) window.rdt("track", "ViewContent", { products });
    else if (eventName === "add_to_cart" && r.track_add_to_cart !== false)
      window.rdt("track", "AddToCart", { products, itemCount, value: data.value || 0, currency: data.currency });
    else if (eventName === "add_to_wishlist") window.rdt("track", "AddToWishlist", { products });
    else if (eventName === "search") window.rdt("track", "Search");
    else if (eventName === "purchase" && r.track_purchase !== false)
      window.rdt("track", "Purchase", { products, itemCount, value: data.value || 0, currency: data.currency, conversionId: data.transaction_id });
    else if (eventName === "generate_lead" && r.track_lead !== false) window.rdt("track", "Lead");
  }

  // 8. Microsoft Advertising UET
  if (cfg.microsoft_uet?.enabled && window.uetq) {
    const u = cfg.microsoft_uet.event_settings || {};
    if (eventName === "page_view" && u.track_page_view !== false) window.uetq.push("pageLoad");
    else if (eventName === "purchase" && u.track_conversions !== false)
      window.uetq.push("event", "purchase", { revenue_value: data.value || 0, currency: data.currency, transaction_id: data.transaction_id });
  }
}
