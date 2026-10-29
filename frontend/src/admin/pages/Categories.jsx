import React, { useEffect, useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import {
  Plus, Search, Edit2, Trash2, Tags, ChevronRight,
  Loader2, FolderOpen, AlertCircle, Package,
} from "lucide-react";
import "./AdminPages.css";
import "./Settings.css";

import { adminService } from "../adminService";
import { useProducts } from "../../context/ProductContext";

const EMPTY_FORM = { name: "", description: "", parentId: "", sortOrder: 0, status: "ACTIVE" };

const Categories = () => {
  const navigate = useNavigate();
  const { products } = useProducts();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(null);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [form, setForm] = useState(EMPTY_FORM);
  const [error, setError] = useState("");
  const [toast, setToast] = useState("");

  // Helper to count products matching a category name (handles singular/plural and spelling variants)
  const getCategoryProductCount = (catName) => {
    if (!catName || !products) return 0;
    const target = catName.toLowerCase().trim();
    const targetNorm = target.replace(/s$/, "");
    return products.filter((p) => {
      const pCat = (p.category || "").toLowerCase().trim();
      const pCatNorm = pCat.replace(/s$/, "");
      if (pCat === target || pCatNorm === targetNorm) return true;
      if (targetNorm.includes("dupat") && (pCatNorm.includes("dupat") || pCatNorm.includes("duppat"))) return true;
      if (targetNorm.includes("saree") && pCatNorm.includes("saree")) return true;
      if (targetNorm.includes("kurta") && pCatNorm.includes("kurta")) return true;
      if (targetNorm.includes("blouse") && pCatNorm.includes("blouse")) return true;
      return false;
    }).length;
  };

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    try {
      const data = await adminService.getCategories();
      setCategories(data || []);
    } catch (err) {
      console.error("Failed to load categories:", err);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  const openCreate = () => {
    setEditItem(null);
    setForm(EMPTY_FORM);
    setError("");
    setShowModal(true);
  };

  const openEdit = (cat) => {
    setEditItem(cat);
    setForm({
      name: cat.name,
      description: cat.description ?? "",
      parentId: cat.parentId ?? "",
      sortOrder: cat.sortOrder ?? 0,
      status: cat.status ?? "ACTIVE",
    });
    setError("");
    setShowModal(true);
  };

  const handleSave = async () => {
    if (!form.name.trim()) { setError("Name is required."); return; }
    setSaving(true);
    try {
      await adminService.saveCategory({
        id: editItem?.id,
        name: form.name.trim(),
        description: form.description || undefined,
        status: form.status,
      });
      showToast(editItem ? "Category updated successfully." : "Category created successfully.");
      setShowModal(false);
      fetchCategories();
    } catch (err) {
      setError(err.message ?? "Failed to save category.");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this category? This cannot be undone.")) return;
    setDeleting(id);
    try {
      await adminService.deleteCategory(id);
      showToast("Category deleted.");
      fetchCategories();
    } catch (err) {
      alert(err.message ?? "Failed to delete category.");
    } finally {
      setDeleting(null);
    }
  };

  // Flatten categories with parent names for display
  const flatList = categories.flatMap((cat) => [
    { ...cat, parentName: null },
    ...(cat.children ?? []).map((c) => ({ ...c, parentName: cat.name })),
  ]);

  const filtered = flatList.filter((c) =>
    c.name.toLowerCase().includes(search.toLowerCase()),
  );

  const parentOptions = categories.filter((c) => !c.parentId);

  return (
    <div className="admin-page">
      {/* Toast */}
      {toast && <div className="admin-toast">{toast}</div>}

      {/* Header */}
      <div className="page-header">
        <div>
          <h2>Categories</h2>
          <p className="page-subtitle">Manage your product taxonomy</p>
        </div>
        <button className="admin-btn icon-left" onClick={openCreate} id="add-category-btn">
          <Plus size={16} /> Add Category
        </button>
      </div>

      {/* Table Card */}
      <div className="admin-table-card">
        <div className="table-toolbar">
          <div className="toolbar-search">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search categories…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              id="category-search"
            />
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
            <span style={{ fontSize: "0.85rem", color: "var(--admin-text-muted)" }}>
              {filtered.length} categor{filtered.length !== 1 ? "ies" : "y"}
            </span>
            <span
              style={{
                fontSize: "0.78rem",
                color: "var(--admin-primary-hover)",
                background: "rgba(174,138,84,0.12)",
                padding: "2px 8px",
                borderRadius: "99px",
                fontWeight: 600,
              }}
            >
              {products.length} products synced
            </span>
          </div>
        </div>

        {loading ? (
          <div className="admin-loading-state">
            <Loader2 size={28} className="spin" style={{ display: "block", margin: "0 auto 8px" }} />
            Loading categories…
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <FolderOpen size={48} className="empty-icon" />
            <h3>No categories found</h3>
            <p>{search ? "Try a different search term." : "Start by adding your first category."}</p>
            {!search && (
              <button className="admin-btn icon-left" onClick={openCreate} style={{ marginTop: 16 }}>
                <Plus size={15} /> Add Category
              </button>
            )}
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Category Name</th>
                <th>Products</th>
                <th>Parent</th>
                <th>Sub-categories</th>
                <th>Sort</th>
                <th>Status</th>
                <th className="text-right">Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((cat) => {
                const prodCount = getCategoryProductCount(cat.name);
                return (
                  <tr key={cat.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        {cat.parentName && <ChevronRight size={14} color="var(--admin-text-muted)" />}
                        <div className="cat-icon-wrap">
                          <Tags size={16} />
                        </div>
                        <div>
                          <span className="font-medium" style={{ display: "block" }}>{cat.name}</span>
                          {cat.description && (
                            <span style={{ fontSize: "0.75rem", color: "var(--admin-text-muted)" }}>
                              {cat.description}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => navigate(`/admin/products?category=${encodeURIComponent(cat.name)}`)}
                        title={`View ${prodCount} product(s) in ${cat.name}`}
                        style={{
                          display: "inline-flex",
                          alignItems: "center",
                          gap: "6px",
                          padding: "4px 10px",
                          borderRadius: "99px",
                          fontSize: "0.78rem",
                          fontWeight: 700,
                          cursor: "pointer",
                          border: "1px solid var(--admin-border)",
                          background: prodCount > 0 ? "rgba(174,138,84,0.12)" : "var(--ivory-deep)",
                          color: prodCount > 0 ? "#7A5C2E" : "var(--admin-text-muted)",
                          transition: "all 0.18s ease",
                        }}
                      >
                        <Package size={13} />
                        <span>{prodCount} {prodCount === 1 ? "product" : "products"}</span>
                      </button>
                    </td>
                    <td style={{ color: "var(--admin-text-muted)", fontSize: "0.85rem" }}>
                      {cat.parentName ?? <span style={{ color: "var(--admin-text-light)" }}>—</span>}
                    </td>
                    <td style={{ color: "var(--admin-text-muted)", fontSize: "0.85rem" }}>
                      {cat.children?.length > 0 ? `${cat.children.length} sub-categories` : "—"}
                    </td>
                    <td style={{ color: "var(--admin-text-muted)", fontSize: "0.85rem" }}>{cat.sortOrder}</td>
                    <td>
                      <span className={`status-badge ${cat.status === "ACTIVE" ? "status-delivered" : "status-cancelled"}`}>
                        {cat.status}
                      </span>
                    </td>
                  <td>
                    <div className="action-buttons">
                      <button className="action-btn" onClick={() => openEdit(cat)} title="Edit" id={`edit-cat-${cat.id}`}>
                        <Edit2 size={15} />
                      </button>
                      <button
                        className="action-btn delete"
                        onClick={() => handleDelete(cat.id)}
                        title="Delete"
                        id={`delete-cat-${cat.id}`}
                        disabled={deleting === cat.id}
                      >
                        {deleting === cat.id ? <Loader2 size={15} className="spin" /> : <Trash2 size={15} />}
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
              <h3>{editItem ? "Edit Category" : "Add Category"}</h3>
              <button className="modal-close-btn" onClick={() => setShowModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {error && (
                <div className="modal-error">
                  <AlertCircle size={15} /> {error}
                </div>
              )}
              <div className="form-group">
                <label>Name <span className="required">*</span></label>
                <input
                  className="admin-input"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  placeholder="e.g. Sarees"
                  id="cat-name-input"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  className="admin-input admin-textarea"
                  value={form.description}
                  onChange={(e) => setForm({ ...form, description: e.target.value })}
                  placeholder="Optional description…"
                  rows={3}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Parent Category</label>
                  <select
                    className="admin-input admin-select-full"
                    value={form.parentId}
                    onChange={(e) => setForm({ ...form, parentId: e.target.value })}
                    id="cat-parent-select"
                  >
                    <option value="">None (top-level)</option>
                    {parentOptions.filter((c) => c.id !== editItem?.id).map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="form-group">
                  <label>Sort Order</label>
                  <input
                    className="admin-input"
                    type="number"
                    min={0}
                    value={form.sortOrder}
                    onChange={(e) => setForm({ ...form, sortOrder: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  className="admin-input admin-select-full"
                  value={form.status}
                  onChange={(e) => setForm({ ...form, status: e.target.value })}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="admin-btn admin-btn-outline" onClick={() => setShowModal(false)}>Cancel</button>
              <button className="admin-btn icon-left" onClick={handleSave} disabled={saving} id="save-category-btn">
                {saving ? <Loader2 size={15} className="spin" /> : <Plus size={15} />}
                {saving ? "Saving…" : editItem ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
