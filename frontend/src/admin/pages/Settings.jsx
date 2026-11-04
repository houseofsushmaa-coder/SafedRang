import React, { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Save, CheckCircle2, Mail, Send } from "lucide-react";
import toast from "react-hot-toast";
import { adminService, EMAIL_EVENTS } from "../adminService";
import { Notice, Section } from "../components/AdminUI";
import "./AdminPages.css";
import "./Settings.css";

// Only settings that the store actually uses are shown here.
export default function Settings() {
  const [form, setForm] = useState(null);
  const [initial, setInitial] = useState(null);
  const [error, setError] = useState("");
  const [saving, setSaving] = useState(false);
  const [emailStatus, setEmailStatus] = useState(null);
  const [adminEmailsText, setAdminEmailsText] = useState("");
  const [testTo, setTestTo] = useState("");
  const [testing, setTesting] = useState(false);

  useEffect(() => {
    adminService
      .orderEmail("status")
      .then(setEmailStatus)
      .catch((err) => setEmailStatus({ ready: false, error: err.message }));
  }, []);

  useEffect(() => {
    adminService
      .getSettings()
      .then((s) => {
        setForm(s);
        setInitial(JSON.stringify(s));
        setAdminEmailsText(s.email.adminEmails.join(", "));
      })
      .catch((err) => setError(err.message || "Could not load settings."));
  }, []);

  const dirty = form && JSON.stringify(form) !== initial;
  const set = (group, key, value) => setForm((prev) => ({ ...prev, [group]: { ...prev[group], [key]: value } }));
  const setEmailToggle = (event, who, value) =>
    setForm((prev) => ({
      ...prev,
      email: { ...prev.email, events: { ...prev.email.events, [event]: { ...prev.email.events[event], [who]: value } } },
    }));
  const onAdminEmails = (text) => {
    setAdminEmailsText(text);
    const list = text.split(/[\s,;]+/).map((e) => e.trim().toLowerCase()).filter(Boolean);
    set("email", "adminEmails", [...new Set(list)]);
  };
  const badAdminEmails = (form?.email?.adminEmails || []).filter((e) => !/^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(e));

  const sendTest = async () => {
    if (dirty) {
      toast.error("Save your changes first, then send the test.");
      return;
    }
    setTesting(true);
    try {
      const res = await adminService.orderEmail("test", { to: testTo.trim() || undefined });
      toast.success(`Test emails sent to ${res.to} — check the inbox (and spam folder).`);
    } catch (err) {
      toast.error(`Test failed: ${err.message}`);
    } finally {
      setTesting(false);
    }
  };

  const handleSave = async (e) => {
    e.preventDefault();
    const fee = Number(form.cod.fee);
    if (!Number.isFinite(fee) || fee < 0) {
      toast.error("COD fee must be 0 or more.");
      return;
    }
    if (badAdminEmails.length) {
      toast.error(`Check the admin email address: ${badAdminEmails.join(", ")}`);
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
              <label className="settings-field-stack">
                <span>Pickup / return address</span>
                <textarea
                  className="admin-input"
                  rows={3}
                  value={form.store.address}
                  onChange={(e) => set("store", "address", e.target.value)}
                  placeholder="House / shop, street, area, Lucknow, Uttar Pradesh 226001"
                />
                <small style={{ color: "var(--admin-text-muted)" }}>Printed as the "From / Return to" address on parcel labels.</small>
              </label>
            </div>
          </Section>

          <Section title="Emails" subtitle="Order emails sent automatically to your customers and to you">
            <div className={`email-provider ${emailStatus?.ready ? "is-ok" : "is-off"}`}>
              <Mail size={16} />
              {emailStatus == null
                ? "Checking the email connection…"
                : emailStatus.ready
                ? `Connected — sending through ${emailStatus.provider === "resend" ? "Resend" : "your mailbox (SMTP)"}.`
                : "Not connected yet — emails will not send until RESEND_API_KEY is added in Supabase → Edge Functions → Secrets."}
            </div>

            <div className="settings-grid">
              <label className="settings-field-stack">
                <span>Admin email(s) — where new-order alerts go</span>
                <input
                  className="admin-input"
                  value={adminEmailsText}
                  onChange={(e) => onAdminEmails(e.target.value)}
                  placeholder="you@safedrang.com, partner@gmail.com"
                />
                <small style={{ color: badAdminEmails.length ? "var(--admin-danger)" : "var(--admin-text-muted)" }}>
                  {badAdminEmails.length
                    ? `Not a valid address: ${badAdminEmails.join(", ")}`
                    : "Separate several addresses with commas. Leave empty to use the contact email above."}
                </small>
              </label>
              <label className="settings-field-stack">
                <span>Sender name</span>
                <input className="admin-input" value={form.email.fromName} onChange={(e) => set("email", "fromName", e.target.value)} placeholder="Safed Rang" />
              </label>
              <label className="settings-field-stack">
                <span>Sender address</span>
                <input
                  type="email"
                  className="admin-input"
                  value={form.email.fromEmail}
                  onChange={(e) => set("email", "fromEmail", e.target.value)}
                  placeholder="orders@safedrang.com"
                />
                <small style={{ color: "var(--admin-text-muted)" }}>Must be on a domain verified with your email provider (safedrang.com).</small>
              </label>
              <label className="settings-field-stack">
                <span>Customer replies go to</span>
                <input
                  type="email"
                  className="admin-input"
                  value={form.email.replyTo}
                  onChange={(e) => set("email", "replyTo", e.target.value)}
                  placeholder={form.store.email || "support@safedrang.com"}
                />
              </label>
            </div>

            <div className="table-responsive" style={{ marginTop: 18 }}>
              <table className="aui-table email-events">
                <thead>
                  <tr>
                    <th>Email</th>
                    <th className="num">Customer</th>
                    <th className="num">Admin</th>
                  </tr>
                </thead>
                <tbody>
                  {EMAIL_EVENTS.map(([key, label, hint]) => (
                    <tr key={key}>
                      <td>
                        <strong>{label}</strong>
                        <div style={{ fontSize: "0.76rem", color: "var(--admin-text-muted)" }}>{hint}</div>
                      </td>
                      <td className="num">
                        <input
                          type="checkbox"
                          className="settings-switch"
                          aria-label={`${label} email to customer`}
                          checked={Boolean(form.email.events[key]?.customer)}
                          onChange={(e) => setEmailToggle(key, "customer", e.target.checked)}
                        />
                      </td>
                      <td className="num">
                        <input
                          type="checkbox"
                          className="settings-switch"
                          aria-label={`${label} email to admin`}
                          checked={Boolean(form.email.events[key]?.admin)}
                          onChange={(e) => setEmailToggle(key, "admin", e.target.checked)}
                        />
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            <div className="email-test-row">
              <input
                type="email"
                className="admin-input"
                value={testTo}
                onChange={(e) => setTestTo(e.target.value)}
                placeholder="Send test to (default: your login email)"
              />
              <button type="button" className="admin-btn admin-btn-outline icon-left" onClick={sendTest} disabled={testing || !emailStatus?.ready}>
                <Send size={15} /> {testing ? "Sending…" : "Send test email"}
              </button>
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
