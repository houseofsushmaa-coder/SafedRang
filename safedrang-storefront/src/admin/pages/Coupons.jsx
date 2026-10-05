import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  Plus, Search, Edit2, Trash2, Ticket, Loader2,
  Copy, CheckCircle2, Calendar, Percent, IndianRupee, AlertCircle,
} from "lucide-react";
import "./AdminPages.css";
import "./Settings.css";

const API_BASE = "https://violet-quetzal-133812.hostingersite.com/api/v1";

const getAuthHeaders = () => {
  const token = localStorage.getItem("adminToken") || sessionStorage.getItem("adminToken");
  return token ? { Authorization: `Bearer ${token}` } : {};
};

const formatCurrency = (val) =>
  new Intl.NumberFormat("en-IN", { style: "currency", currency: "INR", maximumFractionDigits: 0 }).format(val ?? 0);

const EMPTY_FORM = {
  code: "",
  type: "PERCENTAGE",
  value: "",
  minOrderAmount: "",
  maxDiscount: "",
  usageLimit: "",
  expiresAt: "",
  isActive: true,
};

const Skel = ({ w = "100%", h = 16, r = 4, mb = 0 }) => (
  <div className="skel-pulse" style={{ width: w, height: h, borderRadius: r, marginBottom: mb }} />
);

const Coupons = () => {
  const [coupons, setCoupons] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");
  const [copiedId, setCopiedId] = useState(null);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const copyCode = (code, id) => {
    navigator.clipboard.writeText(code).then(() => {
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 2000);
    });
  };

  const fetchCoupons = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/coupons`, { headers: getAuthHeaders() });
      setCoupons(res.data.data ?? []);
    } catch (err) {
      console.error("Coupons fetch failed:", err);
      setCoupons([]);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCoupons(); }, [fetchCoupons]);

  const openCreate = () => {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setError("");
    setShowModal(true);
  };

  const openEdit = (coupon) => {
    setEditItem(coupon);
    setForm({
      code: coupon.code,
      type: coupon.type ?? "PERCENTAGE",
      value: coupon.value ?? "",
      minOrderAmount: coupon.minOrderAmount ?? "",
      maxDiscount: coupon.maxDiscount ?? "",
      usageLimit: coupon.usageLimit ?? "",
      expiresAt: coupon.expiresAt ? coupon.expiresAt.slice(0, 10) : "",
      isActive: coupon.isActive ?? true,
    });
    setError("");
    setShowModal(true);
  };

  const generateCode = () => {
    const chars = "ABCDEFGHIJKLMNOPQRSTUVWXYZ0123456789";
    const code = Array.from({ length: 8 }, () => chars[Math.floor(Math.random() * chars.length)]).join("");
    setForm((f) => ({ ...f, code }));
  };

  const handleSave = async () => {
    if (!form.code.trim()) { setError("Coupon code is required."); return; }
    if (!form.value || isNaN(Number(form.value))) { setError("A valid discount value is required."); return; }
    setSaving(true);
    try {
      const payload = {
        code: form.code.toUpperCase().trim(),
        type: form.type,
        value: Number(form.value),
        minOrderAmount: form.minOrderAmount ? Number(form.minOrderAmount) : null,
        maxDiscount: form.maxDiscount ? Number(form.maxDiscount) : null,
        usageLimit: form.usageLimit ? Number(form.usageLimit) : null,
        expiresAt: form.expiresAt || null,
        isActive: form.isActive,
      };
      if (editItem) {
        await axios.put(`${API_BASE}/coupons/${editItem.id}`, payload, { headers: getAuthHeaders() });
        showToast("Coupon updated successfully.");
      } else {
        await axios.post(`${API_BASE}/coupons`, payload, { headers: getAuthHeaders() });
        showToast("Coupon created successfully.");
      }
      setShowModal(false);
      fetchCoupons();
    } catch (err) {
      setError(err.response?.data?.message ?? "Failed to save coupon.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this coupon?")) return;
    setDeleting(id);
    try {
      await axios.delete(`${API_BASE}/coupons/${id}`, { headers: getAuthHeaders() });
      showToast("Coupon deleted.");
      fetchCoupons();
    } catch (err) {
      alert(err.response?.data?.message ?? "Failed to delete coupon.");
    } finally {
      setDeleting(null);
    }
  };

  const filtered = coupons.filter((c) =>
    c.code?.toLowerCase().includes(search.toLowerCase()),
  );

  const isExpired = (dateStr) => dateStr && new Date(dateStr) < new Date();

  return (
    <div className="admin-page">
      {/* Toast */}
      {toast && <div className="admin-toast">{toast}</div>}

      {/* Header */}
      <div className="page-header">
        <div>
          <h2>Coupons & Discounts</h2>
          <p className="page-subtitle">Manage promo codes for your store</p>
        </div>
        <button className="admin-btn icon-left" onClick={openCreate} id="add-coupon-btn">
          <Plus size={16} /> Create Coupon
        </button>
      </div>

      {/* Stats Row */}
      <div className="dashboard-stats-grid" style={{ marginBottom: 24 }}>
        {[
          { label: "Total Coupons", value: coupons.length, icon: <Ticket size={20} />, cls: "orders" },
          { label: "Active", value: coupons.filter((c) => c.isActive && !isExpired(c.expiresAt)).length, icon: <CheckCircle2 size={20} />, cls: "revenue" },
          { label: "Expired", value: coupons.filter((c) => isExpired(c.expiresAt)).length, icon: <Calendar size={20} />, cls: "refunds" },
          { label: "Times Used", value: coupons.reduce((s, c) => s + (c.usageCount ?? 0), 0), icon: <Percent size={20} />, cls: "customers" },
        ].map((k) => (
          <div key={k.label} className="admin-stat-card">
            <div className="stat-header">
              <div className={`stat-icon ${k.cls}`}>{k.icon}</div>
            </div>
            <div className="stat-body">
              <h4>{k.label}</h4>
              <h2>{k.value}</h2>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="admin-table-card">
        <div className="table-toolbar">
          <div className="toolbar-search">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search coupon codes…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              id="coupon-search"
            />
          </div>
          <span style={{ fontSize: "0.85rem", color: "var(--admin-text-muted)" }}>
            {filtered.length} coupon{filtered.length !== 1 ? "s" : ""}
          </span>
        </div>

        {loading ? (
          <div style={{ padding: "20px 24px" }}>
            {Array.from({ length: 5 }).map((_, i) => (
              <div key={i} style={{ display: "flex", gap: 16, marginBottom: 20 }}>
                <Skel w="20%" h={26} r={6} />
                <Skel w="15%" h={14} />
                <Skel w="15%" h={14} />
                <Skel w="20%" h={14} />
                <Skel w="15%" h={22} r={10} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <Ticket size={48} className="empty-icon" />
            <h3>No coupons found</h3>
            <p>{search ? "Try a different search term." : "Create your first coupon to start offering discounts."}</p>
            {!search && (
              <button className="admin-btn icon-left" onClick={openCreate} style={{ marginTop: 16 }}>
                <Plus size={15} /> Create Coupon
              </button>
            )}
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Code</th>
                <th>Type</th>
                <th>Discount</th>
                <th>Min Order</th>
                <th>Used / Limit</th>
                <th>Expires</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const expired = isExpired(c.expiresAt);
                return (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                        <span className="coupon-code">{c.code}</span>
                        <button
                          className="action-btn"
                          title="Copy code"
                          onClick={() => copyCode(c.code, c.id)}
                          style={{ padding: "4px" }}
                        >
                          {copiedId === c.id ? <CheckCircle2 size={14} color="#10b981" /> : <Copy size={14} />}
                        </button>
                      </div>
                    </td>
                    <td>
                      <span className="category-badge">
                        {c.type === "PERCENTAGE" ? <Percent size={12} style={{ marginRight: 2 }} /> : <IndianRupee size={12} style={{ marginRight: 2 }} />}
                        {c.type === "PERCENTAGE" ? "%" : "Fixed"}
                      </span>
                    </td>
                    <td className="font-medium">
                      {c.type === "PERCENTAGE"
                        ? `${c.value}%${c.maxDiscount ? ` (max ${formatCurrency(c.maxDiscount)})` : ""}`
                        : formatCurrency(c.value)}
                    </td>
                    <td style={{ color: "var(--admin-text-muted)", fontSize: "0.85rem" }}>
                      {c.minOrderAmount ? formatCurrency(c.minOrderAmount) : "—"}
                    </td>
                    <td style={{ fontSize: "0.85rem" }}>
                      <span style={{ fontWeight: 600 }}>{c.usageCount ?? 0}</span>
                      {c.usageLimit ? <span style={{ color: "var(--admin-text-muted)" }}> / {c.usageLimit}</span> : " / ∞"}
                    </td>
                    <td style={{ fontSize: "0.82rem", color: expired ? "#ef4444" : "var(--admin-text-muted)" }}>
                      {c.expiresAt ? new Date(c.expiresAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "numeric" }) : "Never"}
                    </td>
                    <td>
                      {expired ? (
                        <span className="status-badge status-cancelled">Expired</span>
                      ) : (
                        <span className={`status-badge ${c.isActive ? "status-delivered" : "status-cancelled"}`}>
                          {c.isActive ? "Active" : "Inactive"}
                        </span>
                      )}
                    </td>
                    <td>
                      <div className="action-buttons">
                        <button className="action-btn" onClick={() => openEdit(c)} title="Edit" id={`edit-coupon-${c.id}`}>
                          <Edit2 size={15} />
                        </button>
                        <button
                          className="action-btn delete"
                          onClick={() => handleDelete(c.id)}
                          title="Delete"
                          id={`delete-coupon-${c.id}`}
                          disabled={deleting === c.id}
                        >
                          {deleting === c.id ? <Loader2 size={15} className="spin" /> : <Trash2 size={15} />}
                        </button>
                      </div>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="admin-modal-overlay" onClick={() => setShowModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editItem ? "Edit Coupon" : "Create Coupon"}</h3>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {error && (
                <div className="modal-error">
                  <AlertCircle size={15} /> {error}
                </div>
              )}

              <div className="form-group">
                <label>Coupon Code <span className="required">*</span></label>
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    className="admin-input"
                    value={form.code}
                    onChange={(e) => setForm({ ...form, code: e.target.value.toUpperCase() })}
                    placeholder="e.g. SAFED20"
                    id="coupon-code-input"
                    style={{ flex: 1 }}
                  />
                  <button className="admin-btn admin-btn-outline" onClick={generateCode} type="button">
                    Auto
                  </button>
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Discount Type <span className="required">*</span></label>
                  <select className="admin-input admin-select-full" value={form.type} onChange={(e) => setForm({ ...form, type: e.target.value })}>
                    <option value="PERCENTAGE">Percentage (%)</option>
                    <option value="FIXED">Fixed Amount (₹)</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Discount Value <span className="required">*</span></label>
                  <input
                    className="admin-input"
                    type="number"
                    min={0}
                    value={form.value}
                    onChange={(e) => setForm({ ...form, value: e.target.value })}
                    placeholder={form.type === "PERCENTAGE" ? "e.g. 20" : "e.g. 200"}
                    id="coupon-value-input"
                  />
                </div>
              </div>

              {form.type === "PERCENTAGE" && (
                <div className="form-group">
                  <label>Max Discount Amount (₹)</label>
                  <input
                    className="admin-input"
                    type="number"
                    min={0}
                    value={form.maxDiscount}
                    onChange={(e) => setForm({ ...form, maxDiscount: e.target.value })}
                    placeholder="Leave blank for no cap"
                  />
                </div>
              )}

              <div className="form-row">
                <div className="form-group">
                  <label>Min Order Amount (₹)</label>
                  <input
                    className="admin-input"
                    type="number"
                    min={0}
                    value={form.minOrderAmount}
                    onChange={(e) => setForm({ ...form, minOrderAmount: e.target.value })}
                    placeholder="Leave blank for no minimum"
                  />
                </div>
                <div className="form-group">
                  <label>Usage Limit</label>
                  <input
                    className="admin-input"
                    type="number"
                    min={0}
                    value={form.usageLimit}
                    onChange={(e) => setForm({ ...form, usageLimit: e.target.value })}
                    placeholder="Unlimited if blank"
                  />
                </div>
              </div>

              <div className="form-row">
                <div className="form-group">
                  <label>Expiry Date</label>
                  <input
                    className="admin-input"
                    type="date"
                    value={form.expiresAt}
                    onChange={(e) => setForm({ ...form, expiresAt: e.target.value })}
                    id="coupon-expiry"
                  />
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <label className="toggle-label" style={{ marginTop: 8 }}>
                    <input
                      type="checkbox"
                      className="toggle-checkbox"
                      checked={form.isActive}
                      onChange={(e) => setForm({ ...form, isActive: e.target.checked })}
                    />
                    <span className="toggle-switch" />
                    <span className="toggle-text">{form.isActive ? "Active" : "Inactive"}</span>
                  </label>
                </div>
              </div>
            </div>
            <div className="modal-footer">
              <button className="admin-btn admin-btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="admin-btn icon-left" onClick={handleSave} disabled={saving} id="save-coupon-btn">
                {saving ? <Loader2 size={15} className="spin" /> : <Ticket size={15} />}
                {saving ? "Saving…" : editItem ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Coupons;
