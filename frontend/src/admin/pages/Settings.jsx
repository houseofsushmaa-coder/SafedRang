import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Save, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { adminService } from "../adminService";
import { Notice, Section } from "../components/AdminUI";
import "./AdminPages.css";
import "./Settings.css";

// Only settings that the store actually uses are shown here.
export default function Settings() {
  const [form, setForm] = useState(null);
  const [initial, setInitial] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    adminService
      .getSettings()
      .then((s) => {
        setForm(s);
        setInitial(JSON.stringify(s));
      })
      .catch((err) => setError(err.message || "Could not load settings."));
  }, []);

  const dirty = form && JSON.stringify(form) !== initial;
  const set = (group, key, value) => setForm((prev) => ({ ...prev, [group]: { ...prev[group], [key]: value } }));

  const handleSave = async (e) => {
    e.preventDefault();
    const fee = Number(form.cod.fee);
    if (!Number.isFinite(fee) || fee < 0) {
      toast.error("COD fee must be 0 or more.");
      return;
    }
    setSaving(true);
    try {
      await adminService.saveSettings({ ...form, cod: { ...form.cod, fee } });
      setInitial(JSON.stringify({ ...form, cod: { ...form.cod, fee } }));
      toast.success("Settings saved — checkout uses them immediately.");
    } catch (err) {
      toast.error(`Could not save: ${err.message}`);
    } finally {
      setSaving(false);
    }
  };

  return (
    <form className="admin-page settings-page" onSubmit={handleSave}>
      <div className="page-header">
        <div>
          <h2>Settings</h2>
          <p className="page-subtitle">Store details and Cash on Delivery rules</p>
        </div>
        <div className="header-actions">
          <button type="submit" className="admin-btn icon-left" disabled={!dirty || saving}>
            {dirty ? <Save size={16} /> : <CheckCircle2 size={16} />}
            {saving ? "Saving…" : dirty ? "Save changes" : "Saved"}
          </button>
        </div>
      </div>

      {error && <div className="aui-error">{error}</div>}

      {form && (
        <>
          <Section title="Cash on Delivery" subtitle="Used by checkout and the order server straight away">
            <div className="settings-grid">
              <label className="settings-row">
                <span>
                  <strong>Offer Cash on Delivery</strong>
                  <small>India only. Turning this off hides COD at checkout.</small>
                </span>
                <input
                  type="checkbox"
                  className="settings-switch"
                  checked={Boolean(form.cod.enabled)}
                  onChange={(e) => set("cod", "enabled", e.target.checked)}
                />
              </label>
              <label className="settings-row">
                <span>
                  <strong>COD handling fee (₹)</strong>
                  <small>Added to the order total when a customer chooses COD. Online payments have free shipping.</small>
                </span>
                <input
                  type="number"
                  min="0"
                  step="1"
                  className="admin-input settings-number"
                  value={form.cod.fee}
                  disabled={!form.cod.enabled}
                  onChange={(e) => set("cod", "fee", e.target.value)}
                />
              </label>
            </div>
          </Section>

          <Section title="Store details" subtitle="Your business name and contact details, kept on record">
            <div className="settings-grid">
              <label className="settings-field-stack">
                <span>Store name</span>
                <input className="admin-input" value={form.store.name} onChange={(e) => set("store", "name", e.target.value)} />
              </label>
              <label className="settings-field-stack">
                <span>Contact email</span>
                <input type="email" className="admin-input" value={form.store.email} onChange={(e) => set("store", "email", e.target.value)} placeholder="contact@safedrang.com" />
              </label>
              <label className="settings-field-stack">
                <span>Contact phone</span>
                <input type="tel" className="admin-input" value={form.store.phone} onChange={(e) => set("store", "phone", e.target.value)} placeholder="+91 …" />
              </label>
            </div>
          </Section>

          <Notice>
            Analytics and ad pixels are set up in <Link className="aui-link" to="/admin/settings/tracking">Tracking &amp; Pixels</Link>.
            Search titles and descriptions are set on each product. Shop ordering is managed on the{" "}
            <Link className="aui-link" to="/admin/categories">Categories</Link> page.
          </Notice>
        </>
      )}

      {!form && !error && <div className="admin-loading-state">Loading settings…</div>}
    </form>
  );
}
