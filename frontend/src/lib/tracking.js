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
      window.pintrk("page");
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

/**
 * Dispatches an event across all active integrations respecting user toggles.
 *
 * Supported event names:
 * - 'page_view'
 * - 'view_item' (product view)
 * - 'add_to_cart'
 * - 'begin_checkout'
 * - 'purchase'
 * - 'lead'
 *
 * @param {string} eventName
 * @param {object} payload
 */
export function trackEvent(eventName, payload = {}) {
  if (typeof window === "undefined") return;

  // Prevent tracking admin activity
  if (window.location.pathname.startsWith("/admin")) return;

  const cfg = cachedIntegrations;
  if (!cfg) return;

  const cleanPayload = { ...payload };

  // ── Purchase Deduplication ──────────────────────────────────
  if (eventName === "purchase") {
    const dedupeKey = payload.orderId || payload.transactionId || payload.order_id;
    if (dedupeKey) {
      const storageKey = `sr_tracked_purchase_${dedupeKey}`;
      if (firedPurchaseDeduplication.has(dedupeKey) || sessionStorage.getItem(storageKey)) {
        console.info(`[Tracking] Duplicate purchase suppressed for order: ${dedupeKey}`);
        return;
      }
      firedPurchaseDeduplication.add(dedupeKey);
      try {
        sessionStorage.setItem(storageKey, "1");
      } catch {}
    }
  }

  // 1. DataLayer / GTM
  if (cfg.gtm?.enabled && window.dataLayer) {
    if (eventName === "page_view") {
      window.dataLayer.push({
        event: "page_view",
        page_path: window.location.pathname,
        page_title: document.title,
      });
    } else if (eventName === "view_item") {
      window.dataLayer.push({
        event: "view_item",
        ecommerce: {
          currency: cleanPayload.currency || "INR",
          value: cleanPayload.price || cleanPayload.value || 0,
          items: [
            {
              item_id: cleanPayload.productId || cleanPayload.id || "",
              item_name: cleanPayload.productName || cleanPayload.name || "",
              price: cleanPayload.price || 0,
            },
          ],
        },
      });
    } else if (eventName === "add_to_cart") {
      window.dataLayer.push({
        event: "add_to_cart",
        ecommerce: {
          currency: cleanPayload.currency || "INR",
          value: (cleanPayload.price || 0) * (cleanPayload.quantity || 1),
          items: [
            {
              item_id: cleanPayload.productId || cleanPayload.id || "",
              item_name: cleanPayload.productName || cleanPayload.name || "",
              price: cleanPayload.price || 0,
              quantity: cleanPayload.quantity || 1,
            },
          ],
        },
      });
    } else if (eventName === "begin_checkout") {
      window.dataLayer.push({
        event: "begin_checkout",
        ecommerce: {
          currency: cleanPayload.currency || "INR",
          value: cleanPayload.value || 0,
        },
      });
    } else if (eventName === "purchase") {
      window.dataLayer.push({
        event: "purchase",
        ecommerce: {
          transaction_id: cleanPayload.orderId || cleanPayload.order_id || "",
          value: cleanPayload.value || cleanPayload.total || 0,
          currency: cleanPayload.currency || "INR",
          items: cleanPayload.items || [],
        },
      });
    } else if (eventName === "lead") {
      window.dataLayer.push({
        event: "generate_lead",
        lead_type: cleanPayload.type || "contact",
      });
    }
  }

  // 2. Google Analytics 4 (GA4)
  if (cfg.ga4?.enabled && window.gtag) {
    const gaEvents = cfg.ga4.event_settings || {};

    if (eventName === "page_view" && gaEvents.track_page_view !== false) {
      window.gtag("event", "page_view", {
        page_path: window.location.pathname + window.location.search,
        page_location: window.location.href,
        page_title: document.title,
      });
    } else if (eventName === "view_item" && gaEvents.track_view_item !== false) {
      window.gtag("event", "view_item", {
        currency: cleanPayload.currency || "INR",
        value: cleanPayload.price || cleanPayload.value || 0,
        items: [
          {
            item_id: cleanPayload.productId || cleanPayload.id,
            item_name: cleanPayload.productName || cleanPayload.name,
            price: cleanPayload.price || 0,
          },
        ],
      });
    } else if (eventName === "add_to_cart" && gaEvents.track_add_to_cart !== false) {
      window.gtag("event", "add_to_cart", {
        currency: cleanPayload.currency || "INR",
        value: (cleanPayload.price || 0) * (cleanPayload.quantity || 1),
        items: [
          {
            item_id: cleanPayload.productId || cleanPayload.id,
            item_name: cleanPayload.productName || cleanPayload.name,
            price: cleanPayload.price || 0,
            quantity: cleanPayload.quantity || 1,
          },
        ],
      });
    } else if (eventName === "begin_checkout" && gaEvents.track_begin_checkout !== false) {
      window.gtag("event", "begin_checkout", {
        currency: cleanPayload.currency || "INR",
        value: cleanPayload.value || 0,
      });
    } else if (eventName === "purchase" && gaEvents.track_purchase !== false) {
      window.gtag("event", "purchase", {
        transaction_id: cleanPayload.orderId || cleanPayload.order_id,
        value: cleanPayload.value || cleanPayload.total || 0,
        currency: cleanPayload.currency || "INR",
        items: cleanPayload.items || [],
      });
    } else if (eventName === "lead" && gaEvents.track_form_submissions !== false) {
      window.gtag("event", "generate_lead", {
        event_category: "Engagement",
        event_label: cleanPayload.type || "Form Submission",
      });
    }
  }

  // 3. Google Ads
  if (cfg.google_ads?.enabled && window.gtag) {
    const adsCfg = cfg.google_ads;
    const adsEvents = adsCfg.event_settings || {};
    const sendTo = adsCfg.conversion_label
      ? `${adsCfg.public_id}/${adsCfg.conversion_label}`
      : adsCfg.public_id;

    if (eventName === "purchase" && adsEvents.track_purchase !== false) {
      window.gtag("event", "conversion", {
        send_to: sendTo,
        value: cleanPayload.value || cleanPayload.total || Number(adsCfg.conversion_value) || 0,
        currency: adsCfg.currency_code || "INR",
        transaction_id: cleanPayload.orderId || cleanPayload.order_id || "",
      });
    } else if (eventName === "lead" && adsEvents.track_lead !== false) {
      window.gtag("event", "conversion", {
        send_to: sendTo,
      });
    }
  }

  // 4. Meta Pixel (Facebook & Instagram)
  if (cfg.meta_pixel?.enabled && window.fbq) {
    const metaEvents = cfg.meta_pixel.event_settings || {};

    if (eventName === "page_view" && metaEvents.track_page_view !== false) {
      window.fbq("track", "PageView");
    } else if (eventName === "view_item" && metaEvents.track_view_content !== false) {
      window.fbq("track", "ViewContent", {
        content_name: cleanPayload.productName || cleanPayload.name,
        content_ids: [cleanPayload.productId || cleanPayload.id],
        content_type: "product",
        value: cleanPayload.price || cleanPayload.value || 0,
        currency: cleanPayload.currency || "INR",
      });
    } else if (eventName === "add_to_cart" && metaEvents.track_add_to_cart !== false) {
      window.fbq("track", "AddToCart", {
        content_name: cleanPayload.productName || cleanPayload.name,
        content_ids: [cleanPayload.productId || cleanPayload.id],
        content_type: "product",
        value: (cleanPayload.price || 0) * (cleanPayload.quantity || 1),
        currency: cleanPayload.currency || "INR",
      });
    } else if (eventName === "begin_checkout" && metaEvents.track_initiate_checkout !== false) {
      window.fbq("track", "InitiateCheckout", {
        value: cleanPayload.value || 0,
        currency: cleanPayload.currency || "INR",
        num_items: cleanPayload.itemCount || 1,
      });
    } else if (eventName === "purchase" && metaEvents.track_purchase !== false) {
      window.fbq("track", "Purchase", {
        value: cleanPayload.value || cleanPayload.total || 0,
        currency: cleanPayload.currency || "INR",
        content_type: "product",
        num_items: cleanPayload.itemCount || (cleanPayload.items ? cleanPayload.items.length : 1),
        order_id: cleanPayload.orderId || cleanPayload.order_id,
      });
    } else if (eventName === "lead" && metaEvents.track_lead !== false) {
      window.fbq("track", "Lead", {
        content_category: cleanPayload.type || "Lead",
      });
    }
  }

  // 5. TikTok Pixel
  if (cfg.tiktok?.enabled && window.ttq) {
    const ttEvents = cfg.tiktok.event_settings || {};

    if (eventName === "page_view" && ttEvents.track_page_view !== false) {
      window.ttq.page();
    } else if (eventName === "view_item" && ttEvents.track_view_content !== false) {
      window.ttq.track("ViewContent", {
        content_id: cleanPayload.productId || cleanPayload.id,
        content_name: cleanPayload.productName || cleanPayload.name,
        content_type: "product",
        value: cleanPayload.price || 0,
        currency: cleanPayload.currency || "INR",
      });
    } else if (eventName === "add_to_cart" && ttEvents.track_add_to_cart !== false) {
      window.ttq.track("AddToCart", {
        content_id: cleanPayload.productId || cleanPayload.id,
        content_name: cleanPayload.productName || cleanPayload.name,
        quantity: cleanPayload.quantity || 1,
        value: cleanPayload.price || 0,
        currency: cleanPayload.currency || "INR",
      });
    } else if (eventName === "begin_checkout" && ttEvents.track_initiate_checkout !== false) {
      window.ttq.track("InitiateCheckout", {
        value: cleanPayload.value || 0,
        currency: cleanPayload.currency || "INR",
      });
    } else if (eventName === "purchase" && ttEvents.track_complete_payment !== false) {
      window.ttq.track("CompletePayment", {
        value: cleanPayload.value || cleanPayload.total || 0,
        currency: cleanPayload.currency || "INR",
        content_type: "product",
      });
    }
  }

  // 6. Pinterest Tag
  if (cfg.pinterest?.enabled && window.pintrk) {
    const pinEvents = cfg.pinterest.event_settings || {};

    if (eventName === "page_view" && pinEvents.track_page_visit !== false) {
      window.pintrk("track", "PageVisit");
    } else if (eventName === "add_to_cart" && pinEvents.track_add_to_cart !== false) {
      window.pintrk("track", "AddToCart", {
        value: cleanPayload.price || 0,
        order_quantity: cleanPayload.quantity || 1,
        currency: cleanPayload.currency || "INR",
      });
    } else if (eventName === "purchase" && pinEvents.track_checkout !== false) {
      window.pintrk("track", "Checkout", {
        value: cleanPayload.value || cleanPayload.total || 0,
        order_quantity: cleanPayload.itemCount || 1,
        currency: cleanPayload.currency || "INR",
        order_id: cleanPayload.orderId || cleanPayload.order_id,
      });
    } else if (eventName === "lead" && pinEvents.track_lead !== false) {
      window.pintrk("track", "Lead");
    }
  }

  // 7. Reddit Pixel
  if (cfg.reddit?.enabled && window.rdt) {
    const rdtEvents = cfg.reddit.event_settings || {};

    if (eventName === "page_view" && rdtEvents.track_page_visit !== false) {
      window.rdt("track", "PageVisit");
    } else if (eventName === "view_item" && rdtEvents.track_view_content !== false) {
      window.rdt("track", "ViewContent", {
        products: [
          {
            id: cleanPayload.productId || cleanPayload.id,
            name: cleanPayload.productName || cleanPayload.name,
          },
        ],
      });
    } else if (eventName === "add_to_cart" && rdtEvents.track_add_to_cart !== false) {
      window.rdt("track", "AddToCart", {
        itemCount: cleanPayload.quantity || 1,
        value: cleanPayload.price || 0,
        currency: cleanPayload.currency || "INR",
      });
    } else if (eventName === "purchase" && rdtEvents.track_purchase !== false) {
      window.rdt("track", "Purchase", {
        transactionId: cleanPayload.orderId || cleanPayload.order_id,
        value: cleanPayload.value || cleanPayload.total || 0,
        currency: cleanPayload.currency || "INR",
        itemCount: cleanPayload.itemCount || 1,
      });
    } else if (eventName === "lead" && rdtEvents.track_lead !== false) {
      window.rdt("track", "Lead");
    }
  }

  // 8. Microsoft Advertising UET
  if (cfg.microsoft_uet?.enabled && window.uetq) {
    const uetEvents = cfg.microsoft_uet.event_settings || {};

    if (eventName === "page_view" && uetEvents.track_page_view !== false) {
      window.uetq.push("pageLoad");
    } else if (eventName === "purchase" && uetEvents.track_conversions !== false) {
      window.uetq.push("event", "purchase", {
        revenue_value: cleanPayload.value || cleanPayload.total || 0,
        currency: cleanPayload.currency || "INR",
      });
    }
  }
}
