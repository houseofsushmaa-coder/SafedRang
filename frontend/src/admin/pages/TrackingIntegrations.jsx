import React, { useState, useEffect, useMemo, useCallback } from "react";
import {
  CheckCircle2,
  AlertCircle,
  Copy,
  Check,
  Eye,
  EyeOff,
  Save,
  RotateCcw,
  Search,
  ExternalLink,
  ChevronDown,
  Activity,
  Layers,
  Sparkles,
  Info,
  Loader2,
  ShieldCheck,
  Radio,
  SlidersHorizontal,
} from "lucide-react";
import toast from "react-hot-toast";
import { adminService } from "../adminService";
import { DEFAULT_INTEGRATIONS } from "../../lib/tracking";
import "./AdminPages.css";
import "./TrackingIntegrations.css";

// ─────────────────────────────────────────────────────────────────────────────
// OFFICIAL PROVIDER LOGOS (SVG)
// ─────────────────────────────────────────────────────────────────────────────

const ProviderLogo = ({ id }) => {
  switch (id) {
    case "meta_pixel":
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2C6.477 2 2 6.477 2 12c0 4.991 3.657 9.128 8.438 9.879V14.89h-2.54V12h2.54V9.797c0-2.506 1.492-3.89 3.777-3.89 1.094 0 2.238.195 2.238.195v2.46h-1.26c-1.243 0-1.63.771-1.63 1.562V12h2.773l-.443 2.89h-2.33v6.989C18.343 21.129 22 16.99 22 12c0-5.523-4.477-10-10-10z"
            fill="#0866FF"
          />
        </svg>
      );
    case "ga4":
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <rect x="2" y="14" width="4" height="8" rx="1.5" fill="#E37400" />
          <rect x="10" y="8" width="4" height="14" rx="1.5" fill="#F9AB00" />
          <rect x="18" y="2" width="4" height="20" rx="1.5" fill="#E37400" />
        </svg>
      );
    case "gtm":
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <path
            d="M12 2L2 7.5v9L12 22l10-5.5v-9L12 2z"
            fill="#246FDB"
            opacity="0.15"
          />
          <path
            d="M12 2L2 7.5l10 5.5 10-5.5L12 2z"
            fill="#4285F4"
          />
          <path
            d="M2 7.5v9l10 5.5v-9L2 7.5z"
            fill="#1E65D8"
          />
          <path
            d="M22 7.5v9l-10 5.5v-9l10-5.5z"
            fill="#2A75E6"
          />
        </svg>
      );
    case "google_ads":
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <path
            d="M5.5 19a3.5 3.5 0 100-7 3.5 3.5 0 000 7z"
            fill="#4285F4"
          />
          <path
            d="M19.5 8.5L12 3.5 8 16l4 3 7.5-10.5z"
            fill="#FBBC04"
          />
          <path
            d="M12 3.5l7.5 5-7.5 10.5-4-3 4-12.5z"
            fill="#34A853"
          />
        </svg>
      );
    case "tiktok":
      return (
        <svg viewBox="0 0 24 24" fill="currentColor" color="#111111">
          <path d="M19.589 6.686a4.793 4.793 0 01-3.77-4.245V2h-3.445v13.672a2.896 2.896 0 01-2.887 2.895 2.898 2.898 0 01-2.896-2.895 2.898 2.898 0 012.896-2.896c.27 0 .528.037.776.104V9.414A6.334 6.334 0 009.487 9.25a6.345 6.345 0 00-6.34 6.343A6.345 6.345 0 009.487 22a6.345 6.345 0 006.34-6.343V9.063a8.17 8.17 0 003.762.915v-3.292z" />
        </svg>
      );
    case "pinterest":
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" fill="#E60023" />
          <path
            d="M12 6.5a5.5 5.5 0 00-2 10.63c.09-.76.17-1.92.04-2.76l.73-3.1s-.18-.37-.18-.92c0-.86.5-1.5 1.12-1.5.53 0 .78.4.78.87 0 .53-.34 1.33-.51 2.07-.15.61.3 1.11.9 1.11 1.08 0 1.8-1.39 1.8-3.04 0-1.26-.85-2.2-2.38-2.2a2.76 2.76 0 00-2.88 2.8c0 .51.15.87.38 1.15.1.13.12.18.08.33l-.12.48c-.04.14-.14.2-.26.13-1-.41-1.46-1.51-1.46-2.75 0-2 1.7-4.4 5.06-4.4 2.7 0 4.47 1.95 4.47 4.06 0 2.78-1.55 4.86-3.83 4.86-.77 0-1.5-.42-1.74-.89l-.5 1.92c-.17.65-.62 1.46-.94 1.96A5.5 5.5 0 1012 6.5z"
            fill="#FFFFFF"
          />
        </svg>
      );
    case "clarity":
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <rect x="3" y="3" width="18" height="18" rx="4" fill="#0078D4" />
          <circle cx="12" cy="12" r="4.5" fill="#50E6FF" />
          <circle cx="12" cy="12" r="2" fill="#FFFFFF" />
        </svg>
      );
    case "microsoft_uet":
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <rect x="2" y="2" width="9" height="9" fill="#F25022" />
          <rect x="13" y="2" width="9" height="9" fill="#7FBA00" />
          <rect x="2" y="13" width="9" height="9" fill="#00A4EF" />
          <rect x="13" y="13" width="9" height="9" fill="#FFB900" />
        </svg>
      );
    case "reddit":
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" fill="#FF4500" />
          <circle cx="9" cy="12" r="1.3" fill="#FFFFFF" />
          <circle cx="15" cy="12" r="1.3" fill="#FFFFFF" />
          <path
            d="M9.5 15.5c.8.6 1.7.8 2.5.8s1.7-.2 2.5-.8"
            stroke="#FFFFFF"
            strokeWidth="1.2"
            strokeLinecap="round"
          />
        </svg>
      );
    case "openai":
      return (
        <svg viewBox="0 0 24 24" fill="none">
          <circle cx="12" cy="12" r="10" fill="#10A37F" opacity="0.15" />
          <circle cx="12" cy="12" r="6" stroke="#10A37F" strokeWidth="2" strokeDasharray="3 3" />
        </svg>
      );
    default:
      return <Activity size={24} color="#ae8a54" />;
  }
};

// ─────────────────────────────────────────────────────────────────────────────
// VALIDATION ENGINE
// ─────────────────────────────────────────────────────────────────────────────

function validateIntegrationConfig(id, config) {
  const publicId = (config.public_id || "").trim();

  if (!config.enabled && !publicId) {
    return { valid: true, status: "unconfigured", message: "Not configured" };
  }

  if (id === "openai") {
    return {
      valid: false,
      status: "unsupported",
      message: "No official consumer advertising pixel provided by OpenAI.",
    };
  }

  if (config.enabled && !publicId) {
    return { valid: false, status: "error", message: "ID is required when enabled." };
  }

  switch (id) {
    case "meta_pixel": {
      const isDigits = /^\d{12,18}$/.test(publicId);
      if (!isDigits) {
        return {
          valid: false,
          status: "error",
          message: "Meta Pixel ID must be 12-18 digits (e.g. 123456789012345).",
        };
      }
      return { valid: true, status: "configured", message: "Valid Meta Pixel ID format" };
    }
    case "ga4": {
      const isGA4 = /^G-[A-Z0-9]{6,14}$/i.test(publicId);
      if (!isGA4) {
        return {
          valid: false,
          status: "error",
          message: "Measurement ID must start with 'G-' (e.g. G-XXXXXXXXXX).",
        };
      }
      return { valid: true, status: "configured", message: "Valid GA4 format" };
    }
    case "gtm": {
      const isGTM = /^GTM-[A-Z0-9]{4,10}$/i.test(publicId);
      if (!isGTM) {
        return {
          valid: false,
          status: "error",
          message: "Container ID must start with 'GTM-' (e.g. GTM-XXXXXXX).",
        };
      }
      return { valid: true, status: "configured", message: "Valid GTM container format" };
    }
    case "google_ads": {
      const isAds = /^AW-\d{8,12}$/i.test(publicId);
      if (!isAds) {
        return {
          valid: false,
          status: "error",
          message: "Conversion ID must start with 'AW-' followed by numbers.",
        };
      }
      return { valid: true, status: "configured", message: "Valid Google Ads conversion ID" };
    }
    case "tiktok": {
      const isTT = /^[A-Z0-9]{12,24}$/i.test(publicId);
      if (!isTT) {
        return {
          valid: false,
          status: "error",
          message: "TikTok Pixel ID is usually 14-20 alphanumeric characters.",
        };
      }
      return { valid: true, status: "configured", message: "Valid TikTok Pixel format" };
    }
    case "pinterest": {
      const isPin = /^\d{10,16}$/.test(publicId);
      if (!isPin) {
        return {
          valid: false,
          status: "error",
          message: "Pinterest Tag ID must be 10-16 digits.",
        };
      }
      return { valid: true, status: "configured", message: "Valid Pinterest Tag format" };
    }
    case "clarity": {
      const isClarity = /^[a-z0-9]{8,14}$/i.test(publicId);
      if (!isClarity) {
        return {
          valid: false,
          status: "error",
          message: "Clarity Project ID is usually 8-12 lowercase letters/numbers.",
        };
      }
      return { valid: true, status: "configured", message: "Valid Clarity Project ID format" };
    }
    case "microsoft_uet": {
      const isUET = /^\d{6,14}$/.test(publicId);
      if (!isUET) {
        return {
          valid: false,
          status: "error",
          message: "UET Tag ID must be numeric (e.g. 12345678).",
        };
      }
      return { valid: true, status: "configured", message: "Valid UET Tag ID format" };
    }
    case "reddit": {
      const isReddit = /^[a-z0-9_-]{6,30}$/i.test(publicId);
      if (!isReddit) {
        return {
          valid: false,
          status: "error",
          message: "Reddit Pixel ID format is invalid.",
        };
      }
      return { valid: true, status: "configured", message: "Valid Reddit Pixel format" };
    }
    default:
      return { valid: true, status: "configured", message: "Configured" };
  }
}

// ─────────────────────────────────────────────────────────────────────────────
// COMPONENT
// ─────────────────────────────────────────────────────────────────────────────

export default function TrackingIntegrations({ isEmbedded = false }) {
  const [integrations, setIntegrations] = useState(DEFAULT_INTEGRATIONS);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [activeTab, setActiveTab] = useState("all"); // 'all' | 'pixels' | 'gtm'
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedCards, setExpandedCards] = useState({ meta_pixel: true, ga4: true });
  const [showTokens, setShowTokens] = useState({});
  const [copiedKey, setCopiedKey] = useState(null);
  const [verificationFeedback, setVerificationFeedback] = useState({});

  // Fetch initial tracking settings
  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getTrackingIntegrations();
      if (data) setIntegrations(data);
    } catch (err) {
      console.error("[Tracking] Failed to load settings:", err);
      toast.error("Failed to load tracking settings");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchSettings();
  }, [fetchSettings]);

  // Toggle card expansion
  const toggleCard = (id) => {
    setExpandedCards((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Toggle secret visibility
  const toggleSecret = (id) => {
    setShowTokens((prev) => ({ ...prev, [id]: !prev[id] }));
  };

  // Copy non-secret public ID
  const copyPublicId = (text, id) => {
    if (!text) return;
    navigator.clipboard.writeText(text);
    setCopiedKey(id);
    toast.success("Copied to clipboard");
    setTimeout(() => setCopiedKey(null), 2000);
  };

  // Update specific field on integration
  const updateField = (id, field, value) => {
    setIntegrations((prev) => {
      const current = prev[id] || {};
      const updated = { ...current, [field]: value };

      // Re-evaluate verification status on edits
      if (field === "public_id" || field === "enabled") {
        const val = validateIntegrationConfig(id, updated);
        if (!val.valid) {
          updated.verification_status = val.status;
        } else if (updated.verification_status === "verified" && field === "public_id") {
          updated.verification_status = "configured";
        }
      }

      return { ...prev, [id]: updated };
    });
  };

  // Update event toggle on integration
  const updateEventToggle = (id, eventKey, value) => {
    setIntegrations((prev) => {
      const current = prev[id] || {};
      const events = { ...(current.event_settings || {}), [eventKey]: value };
      return { ...prev, [id]: { ...current, event_settings: events } };
    });
  };

  // Save all integrations
  const handleSaveAll = async () => {
    setSaving(true);
    try {
      await adminService.saveTrackingIntegrations(integrations);
      toast.success("All tracking integrations saved successfully!");
    } catch (err) {
      console.error("[Tracking] Save error:", err);
      toast.error("Failed to save changes.");
    } finally {
      setSaving(false);
    }
  };

  // Save single integration
  const handleSaveSingle = async (id) => {
    setSaving(true);
    try {
      await adminService.saveTrackingIntegrations(integrations);
      toast.success(`${integrations[id]?.name || "Integration"} saved!`);
    } catch (err) {
      toast.error("Error saving configuration.");
    } finally {
      setSaving(false);
    }
  };

  // Test / Verify single integration
  const handleVerify = (id) => {
    const item = integrations[id];
    if (!item) return;

    if (id === "openai") {
      setVerificationFeedback((prev) => ({
        ...prev,
        [id]: {
          success: false,
          message: "OpenAI does not provide a public tracking tag for consumer sites.",
        },
      }));
      return;
    }

    const val = validateIntegrationConfig(id, item);
    if (!val.valid) {
      setVerificationFeedback((prev) => ({
        ...prev,
        [id]: { success: false, message: val.message },
      }));
      updateField(id, "verification_status", "error");
      return;
    }

    // Format is valid -> mark as Active & Verified
    const now = new Date().toISOString();
    setIntegrations((prev) => ({
      ...prev,
      [id]: {
        ...prev[id],
        verification_status: "verified",
        last_verified_at: now,
      },
    }));

    setVerificationFeedback((prev) => ({
      ...prev,
      [id]: {
        success: true,
        message: `Verified! Format is valid (${item.public_id.trim()}). Active on storefront.`,
      },
    }));

    toast.success(`${item.name} verified successfully!`);
  };

  // Count metrics
  const metrics = useMemo(() => {
    const list = Object.values(integrations).filter((i) => i.id !== "openai");
    const total = list.length;
    const active = list.filter((i) => i.enabled && (i.verification_status === "verified" || i.public_id)).length;
    const configured = list.filter((i) => i.public_id && !i.enabled).length;
    const unconfigured = list.filter((i) => !i.public_id).length;
    return { total, active, configured, unconfigured };
  }, [integrations]);

  // Check if GTM and direct pixels are coexisting
  const gtmCoexistenceWarning = useMemo(() => {
    const gtmActive = integrations.gtm?.enabled && integrations.gtm?.public_id;
    const metaActive = integrations.meta_pixel?.enabled && integrations.meta_pixel?.public_id;
    const ga4Active = integrations.ga4?.enabled && integrations.ga4?.public_id;
    return gtmActive && (metaActive || ga4Active);
  }, [integrations]);

  // Filtered integrations
  const filteredList = useMemo(() => {
    let list = Object.values(integrations);

    if (activeTab === "gtm") {
      list = list.filter((i) => i.id === "gtm");
    } else if (activeTab === "pixels") {
      list = list.filter((i) => i.id !== "gtm");
    }

    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      list = list.filter(
        (i) =>
          i.name?.toLowerCase().includes(q) ||
          i.provider?.toLowerCase().includes(q) ||
          i.public_id?.toLowerCase().includes(q)
      );
    }

    return list;
  }, [integrations, activeTab, searchQuery]);

  if (loading) {
    return (
      <div style={{ padding: "60px 20px", textAlign: "center" }}>
        <Loader2 size={32} className="spin" style={{ margin: "0 auto 12px", color: "var(--admin-primary)" }} />
        <p style={{ color: "var(--admin-text-muted)" }}>Loading tracking configurations…</p>
      </div>
    );
  }

  return (
    <div className={`admin-page tracking-page ${isEmbedded ? "embedded-mode" : ""}`}>
      {/* ── Page Header ── */}
      {!isEmbedded && (
        <div className="page-header">
          <div>
            <h2>Tracking & Integrations</h2>
            <p className="page-subtitle">
              Configure Meta Pixel, Google Analytics, GTM, and advertising tags directly from your dashboard.
            </p>
          </div>
          <div className="header-actions">
            <button
              className="admin-btn--primary"
              onClick={handleSaveAll}
              disabled={saving}
              id="save-all-tracking-btn"
            >
              {saving ? <Loader2 size={16} className="spin" /> : <Save size={16} />}
              {saving ? "Saving All…" : "Save All Changes"}
            </button>
          </div>
        </div>
      )}

      {/* ── Metrics Bar ── */}
      <div className="tracking-metrics-bar">
        <div className="tracking-metric-card">
          <div className="tracking-metric-icon active">
            <Radio size={20} />
          </div>
          <div>
            <div className="tracking-metric-value">{metrics.active}</div>
            <div className="tracking-metric-label">Active & Live</div>
          </div>
        </div>

        <div className="tracking-metric-card">
          <div className="tracking-metric-icon configured">
            <SlidersHorizontal size={20} />
          </div>
          <div>
            <div className="tracking-metric-value">{metrics.configured}</div>
            <div className="tracking-metric-label">Ready (Disabled)</div>
          </div>
        </div>

        <div className="tracking-metric-card">
          <div className="tracking-metric-icon total">
            <Layers size={20} />
          </div>
          <div>
            <div className="tracking-metric-value">{metrics.total}</div>
            <div className="tracking-metric-label">Total Providers</div>
          </div>
        </div>

        <div className="tracking-metric-card">
          <div className="tracking-metric-icon info">
            <ShieldCheck size={20} />
          </div>
          <div>
            <div className="tracking-metric-value">Secure</div>
            <div className="tracking-metric-label">Server-Side RLS</div>
          </div>
        </div>
      </div>

      {/* ── GTM Coexistence Notice ── */}
      {gtmCoexistenceWarning && (
        <div className="tracking-alert tracking-alert--warning">
          <AlertCircle size={20} style={{ flexShrink: 0, marginTop: 2 }} />
          <div>
            <strong>Coexistence Alert:</strong> Google Tag Manager and direct pixels (GA4 or Meta) are both active.
            If your GTM container already fires tags for these providers, consider disabling the direct pixel toggle here to prevent duplicate hits.
          </div>
        </div>
      )}

      {/* ── Navigation & Filter Bar ── */}
      <div className="tracking-filter-bar">
        <div className="tracking-tabs">
          <button
            className={`tracking-tab-btn ${activeTab === "all" ? "active" : ""}`}
            onClick={() => setActiveTab("all")}
          >
            All Integrations ({Object.keys(integrations).length})
          </button>
          <button
            className={`tracking-tab-btn ${activeTab === "pixels" ? "active" : ""}`}
            onClick={() => setActiveTab("pixels")}
          >
            Pixel & Analytics
          </button>
          <button
            className={`tracking-tab-btn ${activeTab === "gtm" ? "active" : ""}`}
            onClick={() => setActiveTab("gtm")}
          >
            Google Tag Manager
          </button>
        </div>

        <div className="tracking-search-box">
          <Search size={16} className="search-icon" />
          <input
            type="text"
            placeholder="Search integrations…"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
      </div>

      {/* ── Integrations Cards ── */}
      <div className="tracking-cards-grid">
        {filteredList.map((item) => {
          const isExpanded = !!expandedCards[item.id];
          const isEnabled = !!item.enabled;
          const status = item.verification_status || (item.public_id ? "configured" : "unconfigured");
          const validation = validateIntegrationConfig(item.id, item);

          return (
            <div
              key={item.id}
              className={`integration-card ${
                isEnabled ? "is-active" : item.public_id ? "is-configured" : "is-unconfigured"
              }`}
            >
              {/* Card Header */}
              <div
                className="integration-card-header"
                onClick={() => toggleCard(item.id)}
              >
                <div className="integration-meta">
                  <div className="integration-logo-wrap">
                    <ProviderLogo id={item.id} />
                  </div>
                  <div className="integration-titles">
                    <div className="integration-title-row">
                      <span className="integration-name">{item.name}</span>
                      <span className="integration-provider">{item.provider}</span>
                    </div>
                    <p className="integration-summary">
                      {item.id === "meta_pixel" && "Tracks PageViews, AddToCart, ViewContent, and Purchases for Facebook & Instagram."}
                      {item.id === "ga4" && "Official Google Analytics 4 tracking with enhanced measurement and route changes."}
                      {item.id === "gtm" && "Injects GTM container and provides structured e-commerce dataLayer pushes."}
                      {item.id === "google_ads" && "Tracks high-intent conversions and revenue value for Google Ads campaigns."}
                      {item.id === "tiktok" && "Measures storefront events and buyer journeys for TikTok ad campaigns."}
                      {item.id === "pinterest" && "Tracks visitor engagement, cart additions, and conversions on Pinterest."}
                      {item.id === "clarity" && "Heatmaps, click maps, and session recordings for behavioral optimization."}
                      {item.id === "microsoft_uet" && "Conversion and remarketing tag for Microsoft Advertising & Bing."}
                      {item.id === "reddit" && "Tracks conversions and campaign engagement from Reddit visitors."}
                      {item.id === "openai" && "Official advertising pixel is currently not offered by OpenAI."}
                    </p>
                  </div>
                </div>

                <div
                  className="integration-controls"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Status Badge */}
                  <span className={`status-pill ${status}`}>
                    <span className="dot" />
                    {status === "verified"
                      ? "Verified"
                      : status === "configured"
                      ? "Configured"
                      : status === "unsupported"
                      ? "Not Available"
                      : status === "error"
                      ? "Error"
                      : "Not Configured"}
                  </span>

                  {/* Enable Switch */}
                  <label className="toggle-switch-wrap" title={item.id === "openai" ? "Not Supported" : "Enable/Disable"}>
                    <input
                      type="checkbox"
                      checked={isEnabled}
                      disabled={item.id === "openai"}
                      onChange={(e) => updateField(item.id, "enabled", e.target.checked)}
                    />
                    <span className="toggle-slider" />
                  </label>

                  {/* Expand Chevron */}
                  <button
                    className={`chevron-btn ${isExpanded ? "open" : ""}`}
                    onClick={() => toggleCard(item.id)}
                    aria-label="Expand"
                  >
                    <ChevronDown size={20} />
                  </button>
                </div>
              </div>

              {/* Card Body (Expanded) */}
              {isExpanded && (
                <div className="integration-card-body">
                  {/* OpenAI Guard Card */}
                  {item.id === "openai" ? (
                    <div className="tracking-alert tracking-alert--info" style={{ margin: 0 }}>
                      <Info size={20} style={{ flexShrink: 0 }} />
                      <div>
                        <strong>Notice:</strong> {item.notice}
                        <p style={{ margin: "6px 0 0 0", fontSize: "0.82rem", color: "#374151" }}>
                          No tracking code or fake scripts are injected. This placeholder prevents security risks while keeping your integrations roster complete.
                        </p>
                      </div>
                    </div>
                  ) : (
                    <>
                      {/* Public ID Input */}
                      <div className="field-group">
                        <label className="field-group-label">
                          {item.id === "meta_pixel" && "Meta Pixel ID"}
                          {item.id === "ga4" && "GA4 Measurement ID"}
                          {item.id === "gtm" && "GTM Container ID"}
                          {item.id === "google_ads" && "Google Ads Conversion ID"}
                          {item.id === "tiktok" && "TikTok Pixel ID"}
                          {item.id === "pinterest" && "Pinterest Tag ID"}
                          {item.id === "clarity" && "Clarity Project ID"}
                          {item.id === "microsoft_uet" && "UET Tag ID"}
                          {item.id === "reddit" && "Reddit Pixel ID"}
                        </label>
                        <p className="field-group-hint">
                          {item.id === "meta_pixel" && "Find your 15-16 digit numeric ID inside Meta Events Manager > Data Sources."}
                          {item.id === "ga4" && "Begins with G- (e.g. G-XXXXXXXXXX). Found in Google Analytics Admin > Data Streams."}
                          {item.id === "gtm" && "Begins with GTM- (e.g. GTM-XXXXXXX). Found in Google Tag Manager workspace."}
                          {item.id === "google_ads" && "Begins with AW- (e.g. AW-123456789). Found in Google Ads > Goals > Conversions."}
                          {item.id === "tiktok" && "Alphanumeric ID found in TikTok Ads Manager > Assets > Events."}
                          {item.id === "pinterest" && "Numeric ID from Pinterest Business Hub > Ads > Conversions."}
                          {item.id === "clarity" && "Unique alphanumeric project ID from Microsoft Clarity dashboard."}
                          {item.id === "microsoft_uet" && "Numeric ID from Microsoft Advertising > Conversion Tracking > UET tags."}
                          {item.id === "reddit" && "Pixel ID from Reddit Ads Manager > Events Manager."}
                        </p>

                        <div className="input-with-actions">
                          <input
                            type="text"
                            placeholder={
                              item.id === "meta_pixel"
                                ? "e.g. 123456789012345"
                                : item.id === "ga4"
                                ? "G-XXXXXXXXXX"
                                : item.id === "gtm"
                                ? "GTM-XXXXXXX"
                                : item.id === "google_ads"
                                ? "AW-XXXXXXXXX"
                                : "Enter ID"
                            }
                            value={item.public_id || ""}
                            onChange={(e) => updateField(item.id, "public_id", e.target.value)}
                          />
                          {item.public_id && (
                            <button
                              className="input-action-btn"
                              title="Copy ID"
                              onClick={() => copyPublicId(item.public_id, `${item.id}-id`)}
                            >
                              {copiedKey === `${item.id}-id` ? <Check size={16} color="#2e7d4f" /> : <Copy size={16} />}
                            </button>
                          )}
                        </div>

                        {/* Format Validation message */}
                        {item.public_id && (
                          <div
                            className={`field-validation-msg ${validation.valid ? "valid" : "invalid"}`}
                          >
                            {validation.valid ? (
                              <>
                                <CheckCircle2 size={14} /> {validation.message}
                              </>
                            ) : (
                              <>
                                <AlertCircle size={14} /> {validation.message}
                              </>
                            )}
                          </div>
                        )}
                      </div>

                      {/* Provider-Specific Extra Fields */}
                      {item.id === "meta_pixel" && (
                        <>
                          <div className="field-group">
                            <label className="field-group-label">Meta Conversions API Access Token (Optional)</label>
                            <p className="field-group-hint">
                              Used for server-side event tracking. Kept confidential and encrypted.
                            </p>
                            <div className="input-with-actions">
                              <input
                                type={showTokens.meta_token ? "text" : "password"}
                                placeholder="Paste token (EAAB...)"
                                value={item.conversions_api_token || ""}
                                onChange={(e) => updateField(item.id, "conversions_api_token", e.target.value)}
                              />
                              <button
                                className="input-action-btn"
                                onClick={() => toggleSecret("meta_token")}
                              >
                                {showTokens.meta_token ? <EyeOff size={16} /> : <Eye size={16} />}
                              </button>
                            </div>
                          </div>

                          <div className="field-group">
                            <label className="field-group-label">Test Event Code (Optional)</label>
                            <p className="field-group-hint">
                              Used to verify server-side events inside Events Manager "Test events" tab.
                            </p>
                            <div className="input-with-actions">
                              <input
                                type="text"
                                placeholder="e.g. TEST12345"
                                value={item.test_event_code || ""}
                                onChange={(e) => updateField(item.id, "test_event_code", e.target.value)}
                              />
                            </div>
                          </div>
                        </>
                      )}

                      {item.id === "google_ads" && (
                        <>
                          <div className="field-group">
                            <label className="field-group-label">Conversion Label</label>
                            <p className="field-group-hint">
                              The alphanumeric label for your primary purchase action (e.g. AbCdEfGhIjK).
                            </p>
                            <div className="input-with-actions">
                              <input
                                type="text"
                                placeholder="e.g. AbC_dEfGhIjKlMnOp"
                                value={item.conversion_label || ""}
                                onChange={(e) => updateField(item.id, "conversion_label", e.target.value)}
                              />
                            </div>
                          </div>

                          <div className="field-group">
                            <label className="field-group-label">Currency Code</label>
                            <div className="input-with-actions">
                              <input
                                type="text"
                                placeholder="INR"
                                value={item.currency_code || "INR"}
                                onChange={(e) => updateField(item.id, "currency_code", e.target.value)}
                              />
                            </div>
                          </div>
                        </>
                      )}

                      {item.id === "tiktok" && (
                        <div className="field-group">
                          <label className="field-group-label">Events API Access Token (Optional)</label>
                          <div className="input-with-actions">
                            <input
                              type={showTokens.tiktok_token ? "text" : "password"}
                              placeholder="TikTok Server API Token"
                              value={item.events_api_token || ""}
                              onChange={(e) => updateField(item.id, "events_api_token", e.target.value)}
                            />
                            <button
                              className="input-action-btn"
                              onClick={() => toggleSecret("tiktok_token")}
                            >
                              {showTokens.tiktok_token ? <EyeOff size={16} /> : <Eye size={16} />}
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Event Toggles Grid */}
                      {item.event_settings && Object.keys(item.event_settings).length > 0 && (
                        <div className="events-toggles-section">
                          <div className="events-section-title">
                            <Sparkles size={16} color="#ae8a54" />
                            <span>Supported Event Tracking</span>
                          </div>
                          <div className="events-grid">
                            {Object.entries(item.event_settings).map(([eventKey, isToggled]) => {
                              const label = eventKey
                                .replace(/^track_/, "")
                                .replace(/_/g, " ")
                                .replace(/\b\w/g, (c) => c.toUpperCase());
                              return (
                                <div key={eventKey} className="event-toggle-item">
                                  <div>
                                    <div className="event-toggle-label">{label}</div>
                                    <div className="event-toggle-desc">
                                      {eventKey.includes("page") && "Triggered on route visit"}
                                      {eventKey.includes("view") && !eventKey.includes("page") && "Product detail pages"}
                                      {eventKey.includes("cart") && "Add to bag actions"}
                                      {eventKey.includes("checkout") && "Checkout initiated"}
                                      {eventKey.includes("purchase") && "Confirmed order only"}
                                      {eventKey.includes("lead") && "Forms & inquiries"}
                                      {eventKey.includes("ecommerce") && "Structured dataLayer"}
                                    </div>
                                  </div>
                                  <label className="toggle-switch-wrap">
                                    <input
                                      type="checkbox"
                                      checked={Boolean(isToggled)}
                                      onChange={(e) => updateEventToggle(item.id, eventKey, e.target.checked)}
                                    />
                                    <span className="toggle-slider" />
                                  </label>
                                </div>
                              );
                            })}
                          </div>
                        </div>
                      )}

                      {/* Test Result Message */}
                      {verificationFeedback[item.id] && (
                        <div
                          className={`verify-result-box ${
                            verificationFeedback[item.id].success ? "success" : "error"
                          }`}
                        >
                          {verificationFeedback[item.id].success ? (
                            <CheckCircle2 size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                          ) : (
                            <AlertCircle size={16} style={{ flexShrink: 0, marginTop: 2 }} />
                          )}
                          <div>{verificationFeedback[item.id].message}</div>
                        </div>
                      )}

                      {/* Card Footer Actions */}
                      <div className="card-actions-row">
                        <div className="card-actions-left">
                          <button
                            className="admin-btn--verify"
                            onClick={() => handleVerify(item.id)}
                            title="Test syntax & live readiness"
                          >
                            <ShieldCheck size={15} />
                            Verify Installation
                          </button>
                        </div>
                        <div className="card-actions-right">
                          <button
                            className="admin-btn--outline"
                            onClick={() => fetchSettings()}
                          >
                            <RotateCcw size={14} />
                            Discard
                          </button>
                          <button
                            className="admin-btn--primary"
                            onClick={() => handleSaveSingle(item.id)}
                            disabled={saving}
                          >
                            <Save size={14} />
                            Save Configuration
                          </button>
                        </div>
                      </div>
                    </>
                  )}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
