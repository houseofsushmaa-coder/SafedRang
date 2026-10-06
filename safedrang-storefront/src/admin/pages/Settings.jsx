import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  Settings as SettingsIcon, Save, Loader2, Store, Truck, Percent,
  Bell, Globe, Shield, AlertCircle, CheckCircle2,
} from "lucide-react";
import "./AdminPages.css";
import "./Settings.css";

import { API_BASE, getAuthHeaders, formatINR } from "../../config/api.js";

const TABS = [
  { key: "general", label: "General", icon: <Store size={16} /> },
  { key: "shipping", label: "Shipping", icon: <Truck size={16} /> },
  { key: "tax", label: "Tax & Pricing", icon: <Percent size={16} /> },
  { key: "notifications", label: "Notifications", icon: <Bell size={16} /> },
  { key: "seo", label: "SEO", icon: <Globe size={16} /> },
];

const FormField = ({ label, hint, children }) => (
  <div className="settings-field">
    <div className="settings-field-label">
      <label>{label}</label>
      {hint && <p className="settings-field-hint">{hint}</p>}
    </div>
    <div className="settings-field-input">{children}</div>
  </div>
);

const Settings = () => {
  const [tab, setTab] = useState("general");
  const [settings, setSettings] = useState({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState("");

  const fetchSettings = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/settings`, { headers: getAuthHeaders() });
      setSettings(res.data.data ?? {});
    } catch (err) {
      console.error("Settings fetch failed:", err);
      // Use defaults if API fails
      setSettings({
        general: { store_name: "Safedrang", store_email: "", store_phone: "", currency: "INR" },
        shipping: { free_shipping_threshold: "999", default_shipping_charge: "99" },
        tax: { tax_rate: "5", include_tax: "false" },
        notifications: { order_email: "true", low_stock_email: "true", low_stock_threshold: "5" },
        seo: { meta_title: "Safedrang – Premium Handcrafted Sarees", meta_description: "" },
      });
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchSettings(); }, [fetchSettings]);

  const get = (group, key, fallback = "") =>
    settings[group]?.[key] ?? fallback;

  const set = (group, key, value) => {
    setSettings((prev) => ({
      ...prev,
      [group]: { ...(prev[group] ?? {}), [key]: value },
    }));
  };

  const saveSetting = async (key, value, group = "general") => {
    try {
      await axios.put(`${API_BASE}/settings/${key}`, { value, group }, { headers: getAuthHeaders() });
    } catch (err) {
      throw err;
    }
  };

  const handleSave = async () => {
    setSaving(true);
    setError("");
    try {
      const flat = Object.entries(settings).flatMap(([group, keys]) =>
        Object.entries(keys ?? {}).map(([key, value]) => ({ key, value, group })),
      );
      await Promise.all(flat.map(({ key, value, group }) => saveSetting(key, value, group)));
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      setError(err.response?.data?.message ?? "Failed to save settings. Please try again.");
    } finally {
      setSaving(false);
    }
  };

  const renderTab = () => {
    if (loading) {
      return (
        <div style={{ padding: "40px", textAlign: "center", color: "var(--admin-text-muted)" }}>
          <Loader2 size={28} className="spin" style={{ display: "block", margin: "0 auto 12px" }} />
          Loading settings…
        </div>
      );
    }

    switch (tab) {
      case "general":
        return (
          <div className="settings-section">
            <div className="settings-section-title">Store Information</div>
            <FormField label="Store Name" hint="The name displayed to your customers.">
              <input className="admin-input" value={get("general", "store_name")} onChange={(e) => set("general", "store_name", e.target.value)} id="store-name" />
            </FormField>
            <FormField label="Contact Email" hint="Used for order confirmations and notifications.">
              <input className="admin-input" type="email" value={get("general", "store_email")} onChange={(e) => set("general", "store_email", e.target.value)} id="store-email" />
            </FormField>
            <FormField label="Phone Number">
              <input className="admin-input" value={get("general", "store_phone")} onChange={(e) => set("general", "store_phone", e.target.value)} id="store-phone" />
            </FormField>
            <FormField label="Currency" hint="Primary store currency.">
              <select className="admin-input admin-select-full" value={get("general", "currency", "INR")} onChange={(e) => set("general", "currency", e.target.value)}>
                <option value="INR">Indian Rupee (₹)</option>
                <option value="USD">US Dollar ($)</option>
                <option value="GBP">British Pound (£)</option>
                <option value="EUR">Euro (€)</option>
              </select>
            </FormField>
          </div>
        );

      case "shipping":
        return (
          <div className="settings-section">
            <div className="settings-section-title">Shipping Configuration</div>
            <FormField label="Default Shipping Charge (₹)" hint="Charged on orders below the free shipping threshold.">
              <input className="admin-input" type="number" min={0} value={get("shipping", "default_shipping_charge", "99")} onChange={(e) => set("shipping", "default_shipping_charge", e.target.value)} id="default-shipping" />
            </FormField>
            <FormField label="Free Shipping Threshold (₹)" hint="Orders above this amount get free shipping. Set to 0 to disable.">
              <input className="admin-input" type="number" min={0} value={get("shipping", "free_shipping_threshold", "999")} onChange={(e) => set("shipping", "free_shipping_threshold", e.target.value)} id="free-shipping-threshold" />
            </FormField>
            <FormField label="International Shipping" hint="Enable shipping to international addresses.">
              <label className="toggle-label">
                <input type="checkbox" className="toggle-checkbox" checked={get("shipping", "international_enabled", "false") === "true"} onChange={(e) => set("shipping", "international_enabled", String(e.target.checked))} />
                <span className="toggle-switch" />
                <span className="toggle-text">{get("shipping", "international_enabled") === "true" ? "Enabled" : "Disabled"}</span>
              </label>
            </FormField>
          </div>
        );

      case "tax":
        return (
          <div className="settings-section">
            <div className="settings-section-title">Tax & Pricing</div>
            <FormField label="GST Rate (%)" hint="Applied to all taxable products.">
              <input className="admin-input" type="number" min={0} max={100} step={0.5} value={get("tax", "tax_rate", "5")} onChange={(e) => set("tax", "tax_rate", e.target.value)} id="tax-rate" />
            </FormField>
            <FormField label="Show Prices Inclusive of Tax" hint="If enabled, displayed prices include GST.">
              <label className="toggle-label">
                <input type="checkbox" className="toggle-checkbox" checked={get("tax", "include_tax", "false") === "true"} onChange={(e) => set("tax", "include_tax", String(e.target.checked))} />
                <span className="toggle-switch" />
                <span className="toggle-text">{get("tax", "include_tax") === "true" ? "Inclusive" : "Exclusive"}</span>
              </label>
            </FormField>
          </div>
        );

      case "notifications":
        return (
          <div className="settings-section">
            <div className="settings-section-title">Email Notifications</div>
            <FormField label="Order Confirmation Emails" hint="Send customers an email when they place an order.">
              <label className="toggle-label">
                <input type="checkbox" className="toggle-checkbox" checked={get("notifications", "order_email", "true") === "true"} onChange={(e) => set("notifications", "order_email", String(e.target.checked))} />
                <span className="toggle-switch" />
                <span className="toggle-text">{get("notifications", "order_email") !== "false" ? "Enabled" : "Disabled"}</span>
              </label>
            </FormField>
            <FormField label="Low Stock Alerts" hint="Receive an alert when a product falls below the threshold.">
              <label className="toggle-label">
                <input type="checkbox" className="toggle-checkbox" checked={get("notifications", "low_stock_email", "true") === "true"} onChange={(e) => set("notifications", "low_stock_email", String(e.target.checked))} />
                <span className="toggle-switch" />
                <span className="toggle-text">{get("notifications", "low_stock_email") !== "false" ? "Enabled" : "Disabled"}</span>
              </label>
            </FormField>
            <FormField label="Low Stock Threshold" hint="Alert when stock drops to or below this quantity.">
              <input className="admin-input" type="number" min={1} value={get("notifications", "low_stock_threshold", "5")} onChange={(e) => set("notifications", "low_stock_threshold", e.target.value)} id="low-stock-threshold" />
            </FormField>
          </div>
        );

      case "seo":
        return (
          <div className="settings-section">
            <div className="settings-section-title">SEO & Meta</div>
            <FormField label="Default Page Title" hint="Appears in browser tabs and search results.">
              <input className="admin-input" value={get("seo", "meta_title")} onChange={(e) => set("seo", "meta_title", e.target.value)} placeholder="Safedrang – Premium Handcrafted Sarees" id="meta-title" />
            </FormField>
            <FormField label="Default Meta Description" hint="Short description shown in search results (max 160 chars).">
              <textarea
                className="admin-input admin-textarea"
                rows={3}
                maxLength={160}
                value={get("seo", "meta_description")}
                onChange={(e) => set("seo", "meta_description", e.target.value)}
                placeholder="Discover exquisite Chikankari & Zardozi sarees…"
                id="meta-description"
              />
              <p style={{ fontSize: "0.75rem", color: "var(--admin-text-muted)", marginTop: 4 }}>
                {(get("seo", "meta_description") ?? "").length}/160
              </p>
            </FormField>
            <FormField label="Sitemap URL" hint="Your sitemap URL (auto-generated by the backend).">
              <input className="admin-input" value={`${API_BASE.replace("/api/v1", "")}/sitemap.xml`} readOnly style={{ background: "#f8fafc", color: "var(--admin-text-muted)" }} />
            </FormField>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="admin-page settings-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2>Settings</h2>
          <p className="page-subtitle">Configure your store preferences</p>
        </div>
        <button className="admin-btn icon-left" onClick={handleSave} disabled={saving} id="save-settings-btn">
          {saving ? <Loader2 size={15} className="spin" /> : <Save size={15} />}
          {saving ? "Saving…" : "Save Changes"}
        </button>
      </div>

      {/* Success / Error banners */}
      {saved && (
        <div className="settings-banner settings-banner--success">
          <CheckCircle2 size={16} /> Settings saved successfully!
        </div>
      )}
      {error && (
        <div className="settings-banner settings-banner--error">
          <AlertCircle size={16} /> {error}
        </div>
      )}

      {/* Layout: Tabs + Content */}
      <div className="settings-layout">
        {/* Sidebar tabs */}
        <nav className="settings-tabs">
          {TABS.map((t) => (
            <button
              key={t.key}
              className={`settings-tab-btn ${tab === t.key ? "active" : ""}`}
              onClick={() => setTab(t.key)}
              id={`settings-tab-${t.key}`}
            >
              {t.icon}
              {t.label}
            </button>
          ))}
        </nav>

        {/* Content */}
        <div className="settings-content">{renderTab()}</div>
      </div>
    </div>
  );
};

export default Settings;
