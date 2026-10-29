import React, { useEffect, useState, useCallback } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import {
  Plus, Search, Edit2, Trash2, Tags, ChevronRight,
  Loader2, FolderOpen, AlertCircle, Package, Sparkles, Tag,
} from "lucide-react";
import "./AdminPages.css";
import "./Settings.css";

import { adminService } from "../adminService";
import { useProducts } from "../../context/ProductContext";

const EMPTY_CAT_FORM = { name: "", description: "", parentId: "", sortOrder: 0, status: "ACTIVE" };
const EMPTY_BADGE_FORM = { name: "", description: "", color: "#6E1E2A", status: "ACTIVE", sort_order: 0 };

const PRESET_COLORS = [
  { label: "Luxury Burgundy", hex: "#6E1E2A" },
  { label: "Regal Gold", hex: "#AE8A54" },
  { label: "Emerald Heritage", hex: "#2D5A43" },
  { label: "Rose Plum", hex: "#7A2E5C" },
  { label: "Warm Terracotta", hex: "#A13D2D" },
  { label: "Obsidian Black", hex: "#1A1A1A" },
];

const Categories = () => {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const { products } = useProducts();

  // Active view tab: "categories" or "badges"
  const [activeTab, setActiveTab] = useState(searchParams.get("tab") === "badges" ? "badges" : "categories");

  // ── Categories State ────────────────────────────────────────────────
  const [categories, setCategories] = useState([]);
  const [catLoading, setCatLoading] = useState(true);
  const [catSaving, setCatSaving] = useState(false);
  const [catDeleting, setCatDeleting] = useState(null);
  const [catSearch, setCatSearch] = useState("");
  const [showCatModal, setShowCatModal] = useState(false);
  const [editCatItem, setEditCatItem] = useState(null);
  const [catForm, setCatForm] = useState(EMPTY_CAT_FORM);
  const [catError, setCatError] = useState("");

  // ── Badges State ────────────────────────────────────────────────────
  const [badges, setBadges] = useState([]);
  const [badgeLoading, setBadgeLoading] = useState(true);
  const [badgeSaving, setBadgeSaving] = useState(false);
  const [badgeDeleting, setBadgeDeleting] = useState(null);
  const [badgeSearch, setBadgeSearch] = useState("");
  const [showBadgeModal, setShowBadgeModal] = useState(false);
  const [editBadgeItem, setEditBadgeItem] = useState(null);
  const [badgeForm, setBadgeForm] = useState(EMPTY_BADGE_FORM);
  const [badgeError, setBadgeError] = useState("");

  const [toast, setToast] = useState("");

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  // Sync tab with URL
  const handleTabChange = (newTab) => {
    setActiveTab(newTab);
    setSearchParams(newTab === "badges" ? { tab: "badges" } : {});
  };

  // Helper to count products matching a category name
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

  // Helper to count products matching a badge
  const getBadgeProductCount = (badgeName) => {
    if (!badgeName || !products) return 0;
    const bLower = badgeName.toLowerCase().trim();
    return products.filter((p) => {
      const pBadge = (p.badge || "").toLowerCase().trim();
      if (pBadge === bLower) return true;
      if (bLower === "one of one" && p.isOneOfOne) return true;
      if (bLower === "best seller" && p.bestseller) return true;
      if (bLower === "new arrival" && p.newArrival) return true;
      return false;
    }).length;
  };

  // ── Fetchers ────────────────────────────────────────────────────────
  const fetchCategories = useCallback(async () => {
    setCatLoading(true);
    try {
      const data = await adminService.getCategories();
      setCategories(data || []);
    } catch (err) {
      console.error("Failed to load categories:", err);
    } finally {
      setCatLoading(false);
    }
  }, []);

  const fetchBadges = useCallback(async () => {
    setBadgeLoading(true);
    try {
      const data = await adminService.getBadges();
      setBadges(data || []);
    } catch (err) {
      console.error("Failed to load badges:", err);
    } finally {
      setBadgeLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchCategories();
    fetchBadges();
  }, [fetchCategories, fetchBadges]);

  // ── Category Actions ────────────────────────────────────────────────
  const openCreateCat = () => {
    setEditCatItem(null);
    setCatForm(EMPTY_CAT_FORM);
    setCatError("");
    setShowCatModal(true);
  };

  const openEditCat = (cat) => {
    setEditCatItem(cat);
    setCatForm({
      name: cat.name,
      description: cat.description ?? "",
      parentId: cat.parentId ?? "",
      sortOrder: cat.sortOrder ?? 0,
      status: cat.status ?? "ACTIVE",
    });
    setCatError("");
    setShowCatModal(true);
  };

  const handleSaveCat = async () => {
    if (!catForm.name.trim()) { setCatError("Name is required."); return; }
    setCatSaving(true);
    try {
      await adminService.saveCategory({
        id: editCatItem?.id,
        name: catForm.name.trim(),
        description: catForm.description || undefined,
        status: catForm.status,
      });
      showToast(editCatItem ? "Category updated successfully." : "Category created successfully.");
      setShowCatModal(false);
      fetchCategories();
    } catch (err) {
      setCatError(err.message ?? "Failed to save category.");
    } finally {
      setCatSaving(false);
    }
  };

  const handleDeleteCat = async (id) => {
    if (!window.confirm("Delete this category? This cannot be undone.")) return;
    setCatDeleting(id);
    try {
      await adminService.deleteCategory(id);
      showToast("Category deleted.");
      fetchCategories();
    } catch (err) {
      alert(err.message ?? "Failed to delete category.");
    } finally {
      setCatDeleting(null);
    }
  };

  // ── Badge Actions ───────────────────────────────────────────────────
  const openCreateBadge = () => {
    setEditBadgeItem(null);
    setBadgeForm({ ...EMPTY_BADGE_FORM, sort_order: badges.length });
    setBadgeError("");
    setShowBadgeModal(true);
  };

  const openEditBadge = (b) => {
    setEditBadgeItem(b);
    setBadgeForm({
      name: b.name,
      description: b.description ?? "",
      color: b.color || "#6E1E2A",
      status: b.status ?? "ACTIVE",
      sort_order: b.sort_order ?? 0,
    });
    setBadgeError("");
    setShowBadgeModal(true);
  };

  const handleSaveBadge = async () => {
    if (!badgeForm.name.trim()) { setBadgeError("Badge Name is required."); return; }
    setBadgeSaving(true);
    try {
      await adminService.saveBadge({
        id: editBadgeItem?.id,
        name: badgeForm.name.trim(),
        description: badgeForm.description || undefined,
        color: badgeForm.color || "#6E1E2A",
        status: badgeForm.status,
        sort_order: badgeForm.sort_order,
      });
      showToast(editBadgeItem ? "Badge updated successfully." : "Badge created successfully.");
      setShowBadgeModal(false);
      fetchBadges();
    } catch (err) {
      setBadgeError(err.message ?? "Failed to save badge.");
    } finally {
      setBadgeSaving(false);
    }
  };

  const handleDeleteBadge = async (b) => {
    if (b.name === "One of One") {
      alert("The 'One of One' system badge is linked to the core collection and cannot be deleted. You may edit its description or status.");
      return;
    }
    if (!window.confirm(`Delete the "${b.name}" badge? Products using this badge will retain their regular category.`)) return;
    setBadgeDeleting(b.id);
    try {
      await adminService.deleteBadge(b.id);
      showToast("Badge deleted.");
      fetchBadges();
    } catch (err) {
      alert(err.message ?? "Failed to delete badge.");
    } finally {
      setBadgeDeleting(null);
    }
  };

  // Flatten categories
  const flatCats = categories.flatMap((cat) => [
    { ...cat, parentName: null },
    ...(cat.children ?? []).map((c) => ({ ...c, parentName: cat.name })),
  ]);

  const filteredCats = flatCats.filter((c) =>
    c.name.toLowerCase().includes(catSearch.toLowerCase()),
  );

  const filteredBadges = badges.filter((b) =>
    b.name.toLowerCase().includes(badgeSearch.toLowerCase()) ||
    (b.description || "").toLowerCase().includes(badgeSearch.toLowerCase()),
  );

  const parentOptions = categories.filter((c) => !c.parentId);

  return (
    <div className="admin-page">
      {/* Toast */}
      {toast && <div className="admin-toast">{toast}</div>}

      {/* View Switcher Tabs */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "22px", borderBottom: "1px solid var(--admin-border)", paddingBottom: "12px" }}>
        <button
          type="button"
          onClick={() => handleTabChange("categories")}
          className={`admin-btn ${activeTab === "categories" ? "" : "admin-btn-outline"}`}
          style={{ padding: "8px 18px", fontSize: "0.9rem", display: "inline-flex", alignItems: "center", gap: "8px", fontWeight: 600 }}
        >
          <FolderOpen size={16} /> Categories ({categories.length})
        </button>
        <button
          type="button"
          onClick={() => handleTabChange("badges")}
          className={`admin-btn ${activeTab === "badges" ? "" : "admin-btn-outline"}`}
          style={{ padding: "8px 18px", fontSize: "0.9rem", display: "inline-flex", alignItems: "center", gap: "8px", fontWeight: 600 }}
        >
          <Sparkles size={16} /> Product Badges ({badges.length})
        </button>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 1: CATEGORIES                                             */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === "categories" && (
        <>
          <div className="page-header">
            <div>
              <h2>Categories</h2>
              <p className="page-subtitle">Manage your product taxonomy and department hierarchy</p>
            </div>
            <button className="admin-btn icon-left" onClick={openCreateCat} id="add-category-btn">
              <Plus size={16} /> Add Category
            </button>
          </div>

          <div className="admin-table-card">
            <div className="table-toolbar">
              <div className="toolbar-search">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search categories…"
                  value={catSearch}
                  onChange={(e) => setCatSearch(e.target.value)}
                  id="category-search"
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--admin-text-muted)" }}>
                  {filteredCats.length} categor{filteredCats.length !== 1 ? "ies" : "y"}
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

            {catLoading ? (
              <div className="admin-loading-state">
                <Loader2 size={28} className="spin" style={{ display: "block", margin: "0 auto 8px" }} />
                Loading categories…
              </div>
            ) : filteredCats.length === 0 ? (
              <div className="empty-state">
                <FolderOpen size={48} className="empty-icon" />
                <h3>No categories found</h3>
                <p>{catSearch ? "Try a different search term." : "Start by adding your first category."}</p>
                {!catSearch && (
                  <button className="admin-btn icon-left" onClick={openCreateCat} style={{ marginTop: 16 }}>
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
                  {filteredCats.map((cat) => {
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
                            <button className="action-btn" onClick={() => openEditCat(cat)} title="Edit" id={`edit-cat-${cat.id}`}>
                              <Edit2 size={15} />
                            </button>
                            <button
                              className="action-btn delete"
                              onClick={() => handleDeleteCat(cat.id)}
                              title="Delete"
                              id={`delete-cat-${cat.id}`}
                              disabled={catDeleting === cat.id}
                            >
                              {catDeleting === cat.id ? <Loader2 size={15} className="spin" /> : <Trash2 size={15} />}
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
        </>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* TAB 2: PRODUCT BADGES                                         */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeTab === "badges" && (
        <>
          <div className="page-header">
            <div>
              <h2>Product Badges</h2>
              <p className="page-subtitle">Manage exclusive badges (like One of One) displayed on product cards and storefront filters</p>
            </div>
            <button className="admin-btn icon-left" onClick={openCreateBadge} id="add-badge-btn">
              <Plus size={16} /> Add Badge
            </button>
          </div>

          <div className="admin-table-card">
            <div className="table-toolbar">
              <div className="toolbar-search">
                <Search size={16} className="search-icon" />
                <input
                  type="text"
                  placeholder="Search badges…"
                  value={badgeSearch}
                  onChange={(e) => setBadgeSearch(e.target.value)}
                  id="badge-search"
                />
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                <span style={{ fontSize: "0.85rem", color: "var(--admin-text-muted)" }}>
                  {filteredBadges.length} badge{filteredBadges.length !== 1 ? "s" : ""}
                </span>
                <span
                  style={{
                    fontSize: "0.78rem",
                    color: "#FAF5EC",
                    background: "#6E1E2A",
                    padding: "2px 10px",
                    borderRadius: "99px",
                    fontWeight: 700,
                    letterSpacing: "0.05em",
                  }}
                >
                  STOREFRONT READY
                </span>
              </div>
            </div>

            {badgeLoading ? (
              <div className="admin-loading-state">
                <Loader2 size={28} className="spin" style={{ display: "block", margin: "0 auto 8px" }} />
                Loading product badges…
              </div>
            ) : filteredBadges.length === 0 ? (
              <div className="empty-state">
                <Sparkles size={48} className="empty-icon" />
                <h3>No badges found</h3>
                <p>{badgeSearch ? "Try a different search term." : "Start by adding a new product badge."}</p>
                {!badgeSearch && (
                  <button className="admin-btn icon-left" onClick={openCreateBadge} style={{ marginTop: 16 }}>
                    <Plus size={15} /> Add Badge
                  </button>
                )}
              </div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Badge Name</th>
                    <th>Storefront Display</th>
                    <th>Assigned Products</th>
                    <th>Description</th>
                    <th>Status</th>
                    <th className="text-right">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredBadges.map((badge) => {
                    const count = getBadgeProductCount(badge.name);
                    const isSystem = badge.name === "One of One";
                    return (
                      <tr key={badge.id || badge.name}>
                        <td>
                          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                            <div className="cat-icon-wrap" style={{ background: `${badge.color || '#6E1E2A'}20`, color: badge.color || '#6E1E2A' }}>
                              <Sparkles size={16} />
                            </div>
                            <div>
                              <span className="font-medium" style={{ display: "block", fontSize: "0.92rem" }}>
                                {badge.name}
                              </span>
                              {isSystem && (
                                <span style={{ fontSize: "0.68rem", color: "#6E1E2A", fontWeight: 700, letterSpacing: "0.05em" }}>
                                  SYSTEM / EXCLUSIVE COLLECTION
                                </span>
                              )}
                            </div>
                          </div>
                        </td>
                        <td>
                          {/* Live preview badge tag */}
                          <span
                            style={{
                              display: "inline-block",
                              fontSize: "0.65rem",
                              fontWeight: 700,
                              letterSpacing: "0.08em",
                              backgroundColor: badge.color || "#6E1E2A",
                              color: "#FAF5EC",
                              padding: "3px 8px",
                              borderRadius: "3px",
                              boxShadow: "0 1px 3px rgba(0,0,0,0.12)",
                              lineHeight: 1.2,
                            }}
                          >
                            {badge.name.toUpperCase()}
                          </span>
                        </td>
                        <td>
                          <button
                            type="button"
                            onClick={() => navigate(`/admin/products?badge=${encodeURIComponent(badge.name)}`)}
                            title={`Filter products by badge "${badge.name}"`}
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
                              background: count > 0 ? "rgba(110,30,42,0.08)" : "var(--ivory-deep)",
                              color: count > 0 ? "#6E1E2A" : "var(--admin-text-muted)",
                              transition: "all 0.18s ease",
                            }}
                          >
                            <Package size={13} />
                            <span>{count} {count === 1 ? "product" : "products"}</span>
                          </button>
                        </td>
                        <td style={{ color: "var(--admin-text-muted)", fontSize: "0.85rem", maxWidth: "260px" }}>
                          {badge.description || "—"}
                        </td>
                        <td>
                          <span className={`status-badge ${badge.status === "ACTIVE" ? "status-delivered" : "status-cancelled"}`}>
                            {badge.status || "ACTIVE"}
                          </span>
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button className="action-btn" onClick={() => openEditBadge(badge)} title="Edit Badge">
                              <Edit2 size={15} />
                            </button>
                            {!isSystem && (
                              <button
                                className="action-btn delete"
                                onClick={() => handleDeleteBadge(badge)}
                                title="Delete Badge"
                                disabled={badgeDeleting === badge.id}
                              >
                                {badgeDeleting === badge.id ? <Loader2 size={15} className="spin" /> : <Trash2 size={15} />}
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            )}
          </div>
        </>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* Category Modal                                                */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showCatModal && (
        <div className="admin-modal-overlay" onClick={() => setShowCatModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editCatItem ? "Edit Category" : "Add Category"}</h3>
              <button className="modal-close-btn" onClick={() => setShowCatModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {catError && (
                <div className="modal-error">
                  <AlertCircle size={15} /> {catError}
                </div>
              )}
              <div className="form-group">
                <label>Name <span className="required">*</span></label>
                <input
                  className="admin-input"
                  value={catForm.name}
                  onChange={(e) => setCatForm({ ...catForm, name: e.target.value })}
                  placeholder="e.g. Sarees"
                  id="cat-name-input"
                />
              </div>
              <div className="form-group">
                <label>Description</label>
                <textarea
                  className="admin-input admin-textarea"
                  value={catForm.description}
                  onChange={(e) => setCatForm({ ...catForm, description: e.target.value })}
                  placeholder="Optional description…"
                  rows={3}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Parent Category</label>
                  <select
                    className="admin-input admin-select-full"
                    value={catForm.parentId}
                    onChange={(e) => setCatForm({ ...catForm, parentId: e.target.value })}
                    id="cat-parent-select"
                  >
                    <option value="">None (top-level)</option>
                    {parentOptions.filter((c) => c.id !== editCatItem?.id).map((c) => (
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
                    value={catForm.sortOrder}
                    onChange={(e) => setCatForm({ ...catForm, sortOrder: e.target.value })}
                  />
                </div>
              </div>
              <div className="form-group">
                <label>Status</label>
                <select
                  className="admin-input admin-select-full"
                  value={catForm.status}
                  onChange={(e) => setCatForm({ ...catForm, status: e.target.value })}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="admin-btn admin-btn-outline" onClick={() => setShowCatModal(false)}>Cancel</button>
              <button className="admin-btn icon-left" onClick={handleSaveCat} disabled={catSaving} id="save-category-btn">
                {catSaving ? <Loader2 size={15} className="spin" /> : <Plus size={15} />}
                {catSaving ? "Saving…" : editCatItem ? "Update" : "Create"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ───────────────────────────────────────────────────────────── */}
      {/* Badge Modal                                                   */}
      {/* ───────────────────────────────────────────────────────────── */}
      {showBadgeModal && (
        <div className="admin-modal-overlay" onClick={() => setShowBadgeModal(false)}>
          <div className="admin-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>{editBadgeItem ? "Edit Product Badge" : "Add Product Badge"}</h3>
              <button className="modal-close-btn" onClick={() => setShowBadgeModal(false)}>✕</button>
            </div>
            <div className="modal-body">
              {badgeError && (
                <div className="modal-error">
                  <AlertCircle size={15} /> {badgeError}
                </div>
              )}
              <div className="form-group">
                <label>Badge Name <span className="required">*</span></label>
                <input
                  className="admin-input"
                  value={badgeForm.name}
                  onChange={(e) => setBadgeForm({ ...badgeForm, name: e.target.value })}
                  placeholder="e.g. Limited Edition, Best Seller, Handcrafted"
                  id="badge-name-input"
                />
              </div>

              {/* Live Preview */}
              <div className="form-group" style={{ background: "var(--ivory-deep)", padding: "12px", borderRadius: "8px" }}>
                <span style={{ fontSize: "0.75rem", fontWeight: 600, color: "var(--admin-text-light)", textTransform: "uppercase", display: "block", marginBottom: "6px" }}>
                  Storefront Card Preview:
                </span>
                <span
                  style={{
                    display: "inline-block",
                    fontSize: "0.68rem",
                    fontWeight: 700,
                    letterSpacing: "0.08em",
                    backgroundColor: badgeForm.color || "#6E1E2A",
                    color: "#FAF5EC",
                    padding: "3px 10px",
                    borderRadius: "3px",
                    boxShadow: "0 1px 4px rgba(0,0,0,0.15)",
                    lineHeight: 1.2,
                  }}
                >
                  {(badgeForm.name || "PREVIEW BADGE").toUpperCase()}
                </span>
              </div>

              <div className="form-group">
                <label>Description</label>
                <textarea
                  className="admin-input admin-textarea"
                  value={badgeForm.description}
                  onChange={(e) => setBadgeForm({ ...badgeForm, description: e.target.value })}
                  placeholder="e.g. Exclusive seasonal release with limited pieces…"
                  rows={2}
                />
              </div>

              {/* Color Presets */}
              <div className="form-group">
                <label>Badge Theme Color</label>
                <div style={{ display: "flex", gap: "8px", flexWrap: "wrap", marginTop: "4px", marginBottom: "8px" }}>
                  {PRESET_COLORS.map((preset) => (
                    <button
                      key={preset.hex}
                      type="button"
                      onClick={() => setBadgeForm({ ...badgeForm, color: preset.hex })}
                      title={preset.label}
                      style={{
                        width: "28px",
                        height: "28px",
                        borderRadius: "50%",
                        backgroundColor: preset.hex,
                        border: badgeForm.color === preset.hex ? "3px solid #fff" : "1px solid rgba(0,0,0,0.1)",
                        outline: badgeForm.color === preset.hex ? "2px solid var(--admin-primary)" : "none",
                        cursor: "pointer",
                      }}
                    />
                  ))}
                </div>
                <input
                  type="text"
                  className="admin-input"
                  value={badgeForm.color}
                  onChange={(e) => setBadgeForm({ ...badgeForm, color: e.target.value })}
                  placeholder="#6E1E2A"
                  style={{ maxWidth: "160px", fontSize: "0.85rem" }}
                />
              </div>

              <div className="form-group">
                <label>Status</label>
                <select
                  className="admin-input admin-select-full"
                  value={badgeForm.status}
                  onChange={(e) => setBadgeForm({ ...badgeForm, status: e.target.value })}
                >
                  <option value="ACTIVE">Active</option>
                  <option value="INACTIVE">Inactive</option>
                </select>
              </div>
            </div>
            <div className="modal-footer">
              <button className="admin-btn admin-btn-outline" onClick={() => setShowBadgeModal(false)}>Cancel</button>
              <button className="admin-btn icon-left" onClick={handleSaveBadge} disabled={badgeSaving} id="save-badge-btn">
                {badgeSaving ? <Loader2 size={15} className="spin" /> : <Plus size={15} />}
                {badgeSaving ? "Saving…" : editBadgeItem ? "Update Badge" : "Create Badge"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Categories;
