import toast from "react-hot-toast";
import React, { useState, useRef, useEffect, useMemo } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useProducts } from "../../context/ProductContext";
import { adminService } from "../adminService";
import {
  Edit,
  Trash2,
  Plus,
  Download,
  Upload,
  Search,
  Package,
  Loader2,
  FileSpreadsheet,
  CheckCircle2,
  AlertCircle,
  ChevronDown,
  Tag,
  RefreshCw,
  Archive,
  RotateCcw,
  Flag,
  Layers,
} from "lucide-react";
import Papa from "papaparse";
import "./AdminPages.css";
import "./Products.css";

// ── Known field aliases for auto-matching ──────────────────────────────
const FIELD_ALIASES = {
  title:       ["title", "name", "product name", "product_name", "product title"],
  sku:         ["sku", "stock keeping unit", "product_sku", "item_sku"],
  category:    ["category", "categories", "cat", "type"],
  price:       ["price", "regular price", "regular_price", "mrp"],
  salePrice:   ["saleprice", "sale price", "sale_price", "discounted_price", "offer_price"],
  stock:       ["stock", "quantity", "qty", "inventory"],
  stockStatus: ["stockstatus", "stock_status", "status", "in stock?", "in_stock"],
  description: ["description", "desc", "short description", "short_description"],
  image:       ["image", "images", "image url", "featured image", "image_url", "featured_image"],
};

const ALL_TARGETS = Object.keys(FIELD_ALIASES);

function matchColumn(header) {
  const h = header.toLowerCase().trim();
  for (const [target, aliases] of Object.entries(FIELD_ALIASES)) {
    if (aliases.includes(h)) return target;
  }
  return "";
}

const LABEL_MAP = {
  title:       "Product Title",
  sku:         "SKU",
  category:    "Category",
  price:       "Regular Price (₹)",
  salePrice:   "Sale Price (₹)",
  stock:       "Stock Quantity",
  stockStatus: "Stock Status",
  description: "Description",
  image:       "Featured Image URL",
};

function downloadTemplate() {
  const headers = [
    "Product Title",
    "SKU",
    "Category",
    "Regular Price",
    "Sale Price",
    "Stock",
    "Stock Status",
    "Description",
    "Featured Image URL",
  ];
  const sample = [
    [
      "Lucknowi Chanderi Silk Saree",
      "SR-SAREE-001",
      "Sarees",
      "12999",
      "10999",
      "5",
      "In Stock",
      "Handcrafted pure Chanderi silk saree with intricate Chikankari embroidery.",
      "https://example.com/images/saree1.jpg",
    ],
    [
      "Embroidered Silk Blouse Size 38",
      "SR-BLOUSE-038",
      "Blouses",
      "3499",
      "",
      "3",
      "In Stock",
      "Premium padded blouse with delicate handwork.",
      "https://example.com/images/blouse1.jpg",
    ],
  ];
  const csv = Papa.unparse({ fields: headers, data: sample });
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = "safedrang-product-template.csv";
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

const Products = () => {
  const {
    products,
    deleteProduct,
    addProduct,
    archiveProduct,
    restoreProduct,
    toggleNeedsReview,
    quickUpdateStock,
    bulkSetStock,
    bulkArchive,
    bulkRestore,
    bulkUpdateStockStatus,
    bulkDelete,
    loading,
  } = useProducts();

  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const [bulkQtyVal, setBulkQtyVal] = useState("1");
  const [isBulkQtyApplying, setIsBulkQtyApplying] = useState(false);

  // ── Navigation View Tabs: all | instock | outofstock | archived | needsreview ──
  const [viewTab, setViewTab] = useState(searchParams.get("tab") || "all");

  // ── Filter state ───────────────────────────────────────────────────
  const [searchTerm, setSearchTerm]         = useState("");
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get("category") || "all");
  const [statusFilter, setStatusFilter]     = useState("all");
  const [badgeFilter, setBadgeFilter]       = useState(searchParams.get("badge") || "all");
  const [categories, setCategories]         = useState([]);
  const [badges, setBadges]                 = useState([]);

  // ── Bulk selection state ───────────────────────────────────────────
  const [selectedIds, setSelectedIds]       = useState(new Set());

  // ── Fetch metadata ─────────────────────────────────────────────────
  useEffect(() => {
    adminService.getCategories().then((cats) => setCategories(cats || []));
    adminService.getBadges().then((b) => setBadges(b || []));
  }, []);

  useEffect(() => {
    const urlCat = searchParams.get("category");
    if (urlCat) setCategoryFilter(urlCat);
    const urlBadge = searchParams.get("badge");
    if (urlBadge) setBadgeFilter(urlBadge);
    const urlTab = searchParams.get("tab");
    if (urlTab) setViewTab(urlTab);
  }, [searchParams]);

  const handleTabChange = (tabKey) => {
    setViewTab(tabKey);
    setSelectedIds(new Set());
    setSearchParams((prev) => {
      const p = new URLSearchParams(prev);
      if (tabKey === "all") p.delete("tab");
      else p.set("tab", tabKey);
      return p;
    });
  };

  // ── Dynamic live counts ────────────────────────────────────────────
  const counts = useMemo(() => {
    let all = 0, inStock = 0, outOfStock = 0, archived = 0, needsReview = 0;
    products.forEach((p) => {
      if (p.isArchived) {
        archived++;
      } else {
        all++;
        const isOut = p.stockStatus === "Out of Stock" || (p.stock !== undefined && Number(p.stock) <= 0);
        if (isOut) {
          outOfStock++;
        } else {
          inStock++;
        }
      }
      if (p.needsReview) {
        needsReview++;
      }
    });
    return { all, inStock, outOfStock, archived, needsReview };
  }, [products]);

  // ── Filtered products ──────────────────────────────────────────────
  const filteredProducts = useMemo(() => {
    return products.filter((p) => {
      // 1. Tab filtering
      if (viewTab === "archived") {
        if (!p.isArchived) return false;
      } else if (viewTab === "needsreview") {
        if (!p.needsReview) return false;
      } else {
        if (p.isArchived) return false;
        const isOut = p.stockStatus === "Out of Stock" || (p.stock !== undefined && Number(p.stock) <= 0);
        if (viewTab === "instock" && isOut) return false;
        if (viewTab === "outofstock" && !isOut) return false;
      }

      // 2. Search
      if (searchTerm.trim()) {
        const term = searchTerm.toLowerCase().trim();
        const matchesTitle = (p.title || "").toLowerCase().includes(term);
        const matchesSku = (p.sku || "").toLowerCase().includes(term);
        if (!matchesTitle && !matchesSku) return false;
      }

      // 3. Category
      if (categoryFilter !== "all") {
        const pCat = (p.category || "").toLowerCase().trim();
        const fCat = categoryFilter.toLowerCase().trim();
        if (pCat !== fCat && pCat.replace(/s$/, "") !== fCat.replace(/s$/, "")) {
          return false;
        }
      }

      // 4. Status dropdown
      if (statusFilter !== "all") {
        const pStatus = (p.stockStatus || "").toLowerCase();
        if (pStatus !== statusFilter.toLowerCase()) return false;
      }

      // 5. Badge / One of One dropdown
      if (badgeFilter === "one-of-one" || badgeFilter === "One of One") {
        if (!p.isOneOfOne && p.badge !== "One of One") return false;
      } else if (badgeFilter === "regular") {
        if (p.isOneOfOne || p.badge) return false;
      } else if (badgeFilter !== "all") {
        if ((p.badge || "").toLowerCase() !== badgeFilter.toLowerCase()) return false;
      }

      return true;
    });
  }, [products, viewTab, searchTerm, categoryFilter, statusFilter, badgeFilter]);

  // ── Selection Handlers ─────────────────────────────────────────────
  const isAllSelected = filteredProducts.length > 0 && filteredProducts.every((p) => selectedIds.has(p.id));

  const handleSelectAll = (e) => {
    if (e.target.checked) {
      setSelectedIds(new Set(filteredProducts.map((p) => p.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const toggleSelectOne = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleBulkArchive = async () => {
    if (!window.confirm(`Archive ${selectedIds.size} selected products? They will be retired from the storefront.`)) return;
    await bulkArchive(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const handleBulkRestore = async () => {
    await bulkRestore(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const handleBulkStockStatus = async (status) => {
    await bulkUpdateStockStatus(Array.from(selectedIds), status);
    setSelectedIds(new Set());
  };

  const handleBulkDelete = async () => {
    if (!window.confirm(`Permanently delete ${selectedIds.size} selected products? This action cannot be undone.`)) return;
    await bulkDelete(Array.from(selectedIds));
    setSelectedIds(new Set());
  };

  const handleBulkSetQty = async () => {
    const val = parseInt(bulkQtyVal, 10);
    if (isNaN(val) || val < 0) {
      toast.error("Please enter a valid non-negative number for stock.");
      return;
    }
    setIsBulkQtyApplying(true);
    try {
      if (bulkSetStock) {
        await bulkSetStock(Array.from(selectedIds), val);
      }
      toast.success(`Set stock to ${val} units for ${selectedIds.size} selected products`);
      setSelectedIds(new Set());
    } catch (err) {
      toast.error(`Failed to bulk set stock: ${err.message}`);
    } finally {
      setIsBulkQtyApplying(false);
    }
  };



  // ── Inline Stock Editing State ────────────────────────────────────
  const [editingStockId, setEditingStockId] = useState(null);
  const [editingStockVal, setEditingStockVal] = useState("");
  const [stockSavingId, setStockSavingId]   = useState(null);

  const saveStockChange = async (productId, valStr, productTitle) => {
    const val = parseInt(valStr, 10);
    if (isNaN(val) || val < 0) {
      toast.error("Please enter a valid non-negative number for stock.");
      return;
    }
    setStockSavingId(productId);
    try {
      await quickUpdateStock(productId, val);
      toast.success(`Stock for "${productTitle}" set to ${val} unit${val === 1 ? "" : "s"}`);
      setEditingStockId(null);
    } catch (err) {
      toast.error(`Failed to update stock: ${err.message || "Database update error"}`);
    } finally {
      setStockSavingId(null);
    }
  };

  const handleQuickStock = async (product) => {
    setEditingStockId(product.id);
    setEditingStockVal(String(product.stock ?? 0));
  };

  // ── Bulk import state ──────────────────────────────────────────────
  const [showImportModal, setShowImportModal] = useState(false);
  const [csvFile, setCsvFile]               = useState(null);
  const [csvHeaders, setCsvHeaders]         = useState([]);
  const [csvRows, setCsvRows]               = useState([]);
  const [mapping, setMapping]               = useState({});
  const [importing, setImporting]           = useState(false);
  const [importProgress, setImportProgress] = useState({ done: 0, total: 0 });
  const [importResult, setImportResult]     = useState(null);

  const csvPickerRef = useRef(null);

  const categoryOptions = categories.length > 0
    ? categories.map((c) => c.name)
    : [...new Set(products.map((p) => p.category).filter(Boolean))];

  const getStatusClass = (status, isArchived) => {
    if (isArchived) return "status-cancelled";
    switch (status?.toLowerCase()) {
      case "in stock":   return "status-completed";
      case "low stock":  return "status-pending";
      case "out of stock":
      case "sold out":   return "status-cancelled";
      default:           return "status-processing";
    }
  };

  const formatCurrency = (val) =>
    new Intl.NumberFormat("en-IN", {
      style: "currency", currency: "INR", maximumFractionDigits: 0,
    }).format(val);

  // ── Export ────────────────────────────────────────────────────────
  const handleExport = () => {
    try {
      const rows = filteredProducts.map((p) => ({
        "Product Title":      p.title,
        "SKU":                p.sku,
        "Category":           p.category,
        "Regular Price":      p.price,
        "Sale Price":         p.salePrice || "",
        "Stock":              p.stock,
        "Stock Status":       p.stockStatus,
        "Product Type":       p.productType || "simple",
        "Badge":              p.badge || (p.isOneOfOne ? "One of One" : ""),
        "Is Archived":        p.isArchived ? "YES" : "NO",
        "Needs Review":       p.needsReview ? "YES" : "NO",
        "Description":        p.description,
        "Featured Image URL": p.image,
      }));
      const csv = Papa.unparse(rows);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `safedrang-products-${new Date().toISOString().split("T")[0]}.csv`;
      document.body.appendChild(a); a.click(); document.body.removeChild(a);
    } catch (err) { console.error("Export error:", err); alert("Failed to export."); }
  };

  // ── Open import modal ─────────────────────────────────────────────
  const openImportModal = () => {
    setCsvFile(null); setCsvHeaders([]); setCsvRows([]);
    setMapping({}); setImportResult(null); setImportProgress({ done: 0, total: 0 });
    setShowImportModal(true);
  };

  // ── Parse CSV on file selection ────────────────────────────────────
  const handleCsvPick = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCsvFile(file); setImportResult(null);
    Papa.parse(file, {
      header: true, skipEmptyLines: true, preview: 5,
      complete: (results) => {
        const headers = results.meta.fields || [];
        setCsvHeaders(headers); setCsvRows(results.data);
        const autoMap = {};
        headers.forEach((h) => { const m = matchColumn(h); if (m) autoMap[m] = h; });
        setMapping(autoMap);
      },
      error: (err) => alert("Could not parse CSV: " + err.message),
    });
    e.target.value = null;
  };

  // ── Run import ────────────────────────────────────────────────────
  const runImport = async () => {
    if (!csvFile) return;
    setImporting(true); setImportResult(null);
    Papa.parse(csvFile, {
      header: true, skipEmptyLines: true,
      complete: async (results) => {
        const rows = results.data;
        const errors = []; let count = 0;
        setImportProgress({ done: 0, total: rows.length });
        for (let i = 0; i < rows.length; i++) {
          const row = rows[i];
          const get = (field) => { const col = mapping[field]; return col ? (row[col] || "").trim() : ""; };
          const title = get("title");
          if (!title) { errors.push(`Row ${i + 2}: Missing title — skipped`); continue; }
          const price       = parseFloat(get("price")) || 0;
          const salePrice   = parseFloat(get("salePrice")) || null;
          const sku         = get("sku") || `SR-${Date.now()}-${i}`;
          const category    = get("category") || "Uncategorized";
          const stock       = parseInt(get("stock"), 10) || 10;
          const stockStatus = get("stockStatus") || (stock > 0 ? "In Stock" : "Out of Stock");
          const description = get("description") || "";
          const image       = get("image") || "";
          try {
            await addProduct({ title, price, salePrice, sku, category, stock, stockStatus, description, image, images: image ? [image] : [] });
            count++;
          } catch (err) { errors.push(`Row ${i + 2} "${title}": ${err.message}`); }
          setImportProgress({ done: i + 1, total: rows.length });
        }
        setImportResult({ success: count, errors });
        setImporting(false);
      },
      error: (err) => { alert("Failed to read CSV: " + err.message); setImporting(false); },
    });
  };

  const progressPct = importProgress.total > 0 ? Math.round((importProgress.done / importProgress.total) * 100) : 0;

  return (
    <div className="admin-page">
      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <h2>Products</h2>
          <p className="page-subtitle">Manage inventory, stock availability, sizes, and collection badges</p>
        </div>
        <div className="header-actions">
          <button className="admin-btn admin-btn-outline icon-left" onClick={downloadTemplate} title="Download CSV template">
            <FileSpreadsheet size={16} /> CSV Template
          </button>
          <button className="admin-btn admin-btn-outline icon-left" onClick={openImportModal}>
            <Upload size={16} /> Bulk Import
          </button>
          <button className="admin-btn admin-btn-outline icon-left" onClick={handleExport}>
            <Download size={16} /> Export
          </button>
          <button className="admin-btn icon-left" onClick={() => navigate("/admin/product/new")}>
            <Plus size={16} /> Add Product
          </button>
        </div>
      </div>

      {/* ── Segmented Navigation View Tabs ── */}
      <div style={{ display: "flex", gap: "10px", marginBottom: "16px", flexWrap: "wrap" }}>
        <button
          type="button"
          onClick={() => handleTabChange("all")}
          className={`admin-btn ${viewTab === "all" ? "" : "admin-btn-outline"}`}
          style={{ padding: "8px 16px", fontSize: "0.88rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "8px" }}
        >
          <Layers size={15} /> All Products ({counts.all})
        </button>
        <button
          type="button"
          onClick={() => handleTabChange("instock")}
          className={`admin-btn ${viewTab === "instock" ? "" : "admin-btn-outline"}`}
          style={{ padding: "8px 16px", fontSize: "0.88rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "8px" }}
        >
          <CheckCircle2 size={15} color="#16a34a" /> In Stock ({counts.inStock})
        </button>
        <button
          type="button"
          onClick={() => handleTabChange("outofstock")}
          className={`admin-btn ${viewTab === "outofstock" ? "" : "admin-btn-outline"}`}
          style={{ padding: "8px 16px", fontSize: "0.88rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "8px" }}
        >
          <AlertCircle size={15} color="#dc2626" /> Out of Stock ({counts.outOfStock})
        </button>
        <button
          type="button"
          onClick={() => handleTabChange("archived")}
          className={`admin-btn ${viewTab === "archived" ? "" : "admin-btn-outline"}`}
          style={{ padding: "8px 16px", fontSize: "0.88rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "8px" }}
        >
          <Archive size={15} color="#6b7280" /> Archived ({counts.archived})
        </button>
        <button
          type="button"
          onClick={() => handleTabChange("needsreview")}
          className={`admin-btn ${viewTab === "needsreview" ? "" : "admin-btn-outline"}`}
          style={{ padding: "8px 16px", fontSize: "0.88rem", fontWeight: 600, display: "inline-flex", alignItems: "center", gap: "8px" }}
        >
          <Flag size={15} color="#d97706" /> Needs Review ({counts.needsReview})
        </button>
      </div>

      {/* ── Bulk Actions Banner (appears when items are selected) ── */}
      {selectedIds.size > 0 && (
        <div style={{
          background: "rgba(110, 30, 42, 0.08)",
          border: "1px solid rgba(110, 30, 42, 0.2)",
          padding: "10px 18px",
          borderRadius: "8px",
          marginBottom: "16px",
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          flexWrap: "wrap",
          gap: "12px"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontWeight: 700, color: "#6E1E2A", fontSize: "0.9rem" }}>
              {selectedIds.size} product{selectedIds.size !== 1 ? "s" : ""} selected
            </span>
            <button
              type="button"
              className="text-link"
              style={{ fontSize: "0.82rem", color: "#6E1E2A", textDecoration: "underline" }}
              onClick={() => setSelectedIds(new Set())}
            >
              Clear selection
            </button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", flexWrap: "wrap" }}>
            {viewTab === "archived" ? (
              <button
                className="admin-btn admin-btn-outline icon-left"
                style={{ fontSize: "0.82rem", padding: "6px 12px" }}
                onClick={handleBulkRestore}
              >
                <RotateCcw size={14} /> Restore to Active
              </button>
            ) : (
              <button
                className="admin-btn admin-btn-outline icon-left"
                style={{ fontSize: "0.82rem", padding: "6px 12px" }}
                onClick={handleBulkArchive}
              >
                <Archive size={14} /> Archive Selected
              </button>
            )}
            <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <span style={{ fontSize: "0.82rem", fontWeight: 600 }}>Set Qty:</span>
              <input
                type="number"
                min="0"
                value={bulkQtyVal}
                onChange={(e) => setBulkQtyVal(e.target.value)}
                style={{
                  width: "55px",
                  padding: "5px 6px",
                  borderRadius: "4px",
                  border: "1px solid var(--admin-border)",
                  fontSize: "0.85rem",
                  fontWeight: 700,
                  textAlign: "center",
                }}
              />
              <button
                type="button"
                className="admin-btn icon-left"
                style={{ fontSize: "0.82rem", padding: "6px 12px" }}
                disabled={isBulkQtyApplying}
                onClick={handleBulkSetQty}
              >
                {isBulkQtyApplying ? <Loader2 size={13} className="spin" /> : "Apply Qty"}
              </button>
            </div>

            <button
              className="admin-btn admin-btn-outline icon-left"
              style={{ fontSize: "0.82rem", padding: "6px 12px" }}
              onClick={() => handleBulkStockStatus("In Stock")}
            >
              <CheckCircle2 size={14} color="#16a34a" /> Mark In Stock
            </button>
            <button
              className="admin-btn admin-btn-outline icon-left"
              style={{ fontSize: "0.82rem", padding: "6px 12px" }}
              onClick={() => handleBulkStockStatus("Out of Stock")}
            >
              <AlertCircle size={14} color="#dc2626" /> Mark Out of Stock
            </button>
            <button
              className="admin-btn admin-btn-outline icon-left"
              style={{ fontSize: "0.82rem", padding: "6px 12px", color: "#dc2626", borderColor: "#fca5a5" }}
              onClick={handleBulkDelete}
            >
              <Trash2 size={14} /> Delete Selected
            </button>
          </div>
        </div>
      )}

      {/* ── Table Card ── */}
      <div className="admin-table-card">
        <div className="table-toolbar">
          <div className="toolbar-search">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search by product name or SKU…"
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="toolbar-filters">
            {/* Category filter */}
            <div className="filter-select-wrap">
              <Tag size={13} className="filter-icon" />
              <select className="filter-select" value={categoryFilter} onChange={(e) => setCategoryFilter(e.target.value)}>
                <option value="all">All Categories</option>
                {categoryOptions.map((cat) => <option key={cat} value={cat}>{cat}</option>)}
              </select>
              <ChevronDown size={13} className="filter-chevron" />
            </div>

            {/* Badges / Collections filter */}
            <div className="filter-select-wrap">
              <select className="filter-select" value={badgeFilter} onChange={(e) => setBadgeFilter(e.target.value)}>
                <option value="all">All Badges</option>
                <option value="one-of-one">One of One</option>
                {badges.filter((b) => b.name !== "One of One").map((b) => (
                  <option key={b.id || b.name} value={b.name}>{b.name}</option>
                ))}
                <option value="regular">Regular (No Badge)</option>
              </select>
              <ChevronDown size={13} className="filter-chevron" />
            </div>

            {/* Status filter */}
            <div className="filter-select-wrap">
              <select className="filter-select" value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)}>
                <option value="all">All Statuses</option>
                <option value="in stock">In Stock</option>
                <option value="low stock">Low Stock</option>
                <option value="out of stock">Out of Stock</option>
              </select>
              <ChevronDown size={13} className="filter-chevron" />
            </div>

            {(categoryFilter !== "all" || statusFilter !== "all" || badgeFilter !== "all" || searchTerm || viewTab !== "all") && (
              <button
                className="admin-btn admin-btn-outline icon-left"
                style={{ padding: "6px 10px", fontSize: "0.8rem" }}
                onClick={() => { setCategoryFilter("all"); setStatusFilter("all"); setBadgeFilter("all"); setSearchTerm(""); setViewTab("all"); }}
              >
                <RefreshCw size={13} /> Reset
              </button>
            )}
            <span className="filter-count">{filteredProducts.length} results</span>
          </div>
        </div>

        {loading ? (
          <div className="admin-loading-state">
            <Loader2 size={24} className="spin" style={{ display: "block", margin: "0 auto 8px" }} />
            Loading catalogue…
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th width="45">
                    <input
                      type="checkbox"
                      checked={isAllSelected}
                      onChange={handleSelectAll}
                      style={{ cursor: "pointer" }}
                    />
                  </th>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock Quantity</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => {
                  const isChecked = selectedIds.has(product.id);
                  const isVariable = product.productType === "variable" || (product.variations && product.variations.length > 0);
                  const varCount = product.variations?.length || 0;
                  return (
                    <tr key={product.id} style={{ backgroundColor: isChecked ? "rgba(110, 30, 42, 0.03)" : undefined }}>
                      <td>
                        <input
                          type="checkbox"
                          checked={isChecked}
                          onChange={() => toggleSelectOne(product.id)}
                          style={{ cursor: "pointer" }}
                        />
                      </td>
                      <td>
                        <div className="product-cell">
                          <div
                            className="product-img"
                            style={{ backgroundImage: `url(${product.image})`, cursor: "pointer" }}
                            onClick={() => navigate(`/admin/product/${product.id}`)}
                          />
                          <div className="product-info">
                            <span
                              className="product-title"
                              style={{ cursor: "pointer" }}
                              onClick={() => navigate(`/admin/product/${product.id}`)}
                            >
                              {product.title}
                            </span>
                            <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginTop: "3px" }}>
                              <span className="product-sku">{product.sku || product.id?.substring(0, 8)}</span>

                              {/* Variable Product Pill */}
                              {isVariable ? (
                                <span style={{
                                  fontSize: "0.62rem",
                                  fontWeight: 700,
                                  background: "#EEF2FF",
                                  color: "#4338CA",
                                  padding: "2px 6px",
                                  borderRadius: "3px",
                                  border: "1px solid #C7D2FE",
                                  lineHeight: 1.2,
                                }}>
                                  Variable ({varCount} sizes)
                                </span>
                              ) : (
                                <span style={{
                                  fontSize: "0.62rem",
                                  fontWeight: 600,
                                  background: "#F3F4F6",
                                  color: "#4B5563",
                                  padding: "2px 6px",
                                  borderRadius: "3px",
                                  lineHeight: 1.2,
                                }}>
                                  Simple
                                </span>
                              )}

                              {/* Assigned Storefront Badge */}
                              {(product.badge || product.isOneOfOne) && (
                                <span
                                  style={{
                                    fontSize: "0.62rem",
                                    fontWeight: 700,
                                    letterSpacing: "0.08em",
                                    backgroundColor: "#6E1E2A",
                                    color: "#FAF5EC",
                                    padding: "2px 6px",
                                    borderRadius: "3px",
                                    display: "inline-block",
                                    lineHeight: 1.2,
                                  }}
                                >
                                  {(product.badge || "ONE OF ONE").toUpperCase()}
                                </span>
                              )}

                              {/* Manual Priority Badge */}
                              {product.displayOrder > 0 && (
                                <span
                                  style={{
                                    fontSize: "0.62rem",
                                    fontWeight: 700,
                                    letterSpacing: "0.05em",
                                    backgroundColor: "#EFF6FF",
                                    color: "#1D4ED8",
                                    border: "1px solid #BFDBFE",
                                    padding: "2px 6px",
                                    borderRadius: "3px",
                                    display: "inline-block",
                                    lineHeight: 1.2,
                                  }}
                                  title={`Shop Display Priority #${product.displayOrder}`}
                                >
                                  PRIORITY #{product.displayOrder}
                                </span>
                              )}

                              {/* Needs Review Pill */}
                              {product.needsReview && (
                                <span
                                  style={{
                                    fontSize: "0.62rem",
                                    fontWeight: 700,
                                    letterSpacing: "0.05em",
                                    backgroundColor: "#FEF3C7",
                                    color: "#92400E",
                                    border: "1px solid #FCD34D",
                                    padding: "2px 6px",
                                    borderRadius: "3px",
                                    display: "inline-flex",
                                    alignItems: "center",
                                    gap: "3px",
                                    lineHeight: 1.2,
                                  }}
                                >
                                  <Flag size={10} color="#92400E" /> REVIEW
                                </span>
                              )}
                            </div>
                          </div>
                        </div>
                      </td>

                      <td>
                        <span className="category-badge">{product.category || "—"}</span>
                      </td>

                      <td className="font-medium">
                        {product.salePrice ? (
                          <div>
                            <span className="sale-price">{formatCurrency(product.salePrice)}</span>
                            <span className="original-price">{formatCurrency(product.price)}</span>
                          </div>
                        ) : (
                          <span>{formatCurrency(product.price)}</span>
                        )}
                      </td>

                      <td>
                        {editingStockId === product.id ? (
                          <div
                            className="stock-inline-edit-box"
                            onClick={(e) => e.stopPropagation()}
                            style={{ display: "flex", alignItems: "center", gap: "4px" }}
                          >
                            <input
                              type="number"
                              min="0"
                              value={editingStockVal}
                              autoFocus
                              onChange={(e) => setEditingStockVal(e.target.value)}
                              onKeyDown={async (e) => {
                                if (e.key === "Enter") {
                                  e.preventDefault();
                                  await saveStockChange(product.id, editingStockVal, product.title);
                                } else if (e.key === "Escape") {
                                  setEditingStockId(null);
                                }
                              }}
                              style={{
                                width: "64px",
                                padding: "4px 6px",
                                border: "1px solid var(--admin-border)",
                                borderRadius: "4px",
                                fontSize: "0.85rem",
                                fontWeight: 700,
                                textAlign: "center",
                                outline: "none",
                              }}
                              disabled={stockSavingId === product.id}
                            />
                            <button
                              type="button"
                              title="Save stock"
                              style={{
                                padding: "4px 8px",
                                background: "#6E1E2A",
                                color: "#fff",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "0.75rem",
                                fontWeight: 600,
                              }}
                              disabled={stockSavingId === product.id}
                              onClick={async () => {
                                await saveStockChange(product.id, editingStockVal, product.title);
                              }}
                            >
                              {stockSavingId === product.id ? <Loader2 size={12} className="spin" /> : "✓"}
                            </button>
                            <button
                              type="button"
                              title="Cancel"
                              style={{
                                padding: "4px 6px",
                                background: "none",
                                border: "1px solid var(--admin-border)",
                                borderRadius: "4px",
                                cursor: "pointer",
                                fontSize: "0.75rem",
                                color: "var(--admin-text-muted)",
                              }}
                              disabled={stockSavingId === product.id}
                              onClick={() => setEditingStockId(null)}
                            >
                              ✕
                            </button>
                          </div>
                        ) : (
                          <div
                            className="inventory-cell"
                            style={{ cursor: "pointer" }}
                            onClick={() => handleQuickStock(product)}
                            title="Click to quickly update stock quantity"
                          >
                            <span
                              className="stock-count"
                              style={{
                                fontWeight: 700,
                                color: (product.stock ?? 0) <= 0 ? "#DC2626" : "inherit"
                              }}
                            >
                              {product.stock ?? 0}
                            </span>
                            <span className="stock-label"> units</span>
                            <span style={{ fontSize: "0.75rem", color: "var(--admin-text-light)", marginLeft: 4 }}>✎</span>
                          </div>
                        )}
                      </td>

                      <td>
                        <span className={`status-badge ${getStatusClass(product.stockStatus, product.isArchived)}`}>
                          {product.isArchived ? "Archived" : product.stockStatus || "In Stock"}
                        </span>
                      </td>

                      <td className="text-right">
                        <div className="action-buttons">
                          {/* Edit */}
                          <button
                            className="action-btn"
                            title="Edit product"
                            onClick={() => navigate(`/admin/product/${product.id}`)}
                          >
                            <Edit size={15} />
                          </button>

                          {/* Archive or Restore */}
                          {product.isArchived ? (
                            <button
                              className="action-btn"
                              title="Restore to active catalogue"
                              onClick={() => restoreProduct(product.id)}
                            >
                              <RotateCcw size={15} color="#16a34a" />
                            </button>
                          ) : (
                            <button
                              className="action-btn"
                              title="Archive product (retire from shop)"
                              onClick={() => {
                                if (window.confirm(`Archive "${product.title}"? It will be hidden from the storefront.`)) {
                                  archiveProduct(product.id);
                                }
                              }}
                            >
                              <Archive size={15} color="#6b7280" />
                            </button>
                          )}

                          {/* Toggle Needs Review */}
                          <button
                            className="action-btn"
                            title={product.needsReview ? "Unflag Review" : "Flag for Review"}
                            onClick={() => toggleNeedsReview(product.id)}
                          >
                            <Flag size={14} color={product.needsReview ? "#D97706" : "var(--admin-text-light)"} />
                          </button>

                          {/* Delete */}
                          <button
                            className="action-btn delete"
                            title="Delete permanently"
                            onClick={() => {
                              if (window.confirm(`Permanently delete "${product.title}"? This cannot be undone.`)) {
                                deleteProduct(product.id);
                              }
                            }}
                          >
                            <Trash2 size={15} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filteredProducts.length === 0 && (
          <div className="empty-state">
            <Package size={48} className="empty-icon" />
            <h3>No products found</h3>
            <p>Try adjusting your search, filters, or selected tab.</p>
          </div>
        )}
      </div>

      {/* ════════════════════════ BULK IMPORT MODAL ════════════════════════ */}
      {showImportModal && (
        <div className="admin-modal-overlay" onClick={() => !importing && setShowImportModal(false)}>
          <div className="admin-modal import-modal" onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <div>
                <h3>Bulk Import Products</h3>
                <p style={{ margin: 0, fontSize: "0.82rem", color: "var(--admin-text-muted)" }}>
                  Upload CSV → verify mapping → import. Add images manually after.
                </p>
              </div>
              {!importing && (
                <button className="modal-close-btn" onClick={() => setShowImportModal(false)}>✕</button>
              )}
            </div>

            <div className="modal-body import-modal-body">
              {/* Step 1 — Pick file */}
              {!csvFile && (
                <div
                  className="import-drop-zone"
                  onClick={() => csvPickerRef.current?.click()}
                >
                  <FileSpreadsheet size={40} className="import-drop-icon" />
                  <p className="import-drop-title">Click to choose your CSV file</p>
                  <p className="import-drop-hint">
                    Columns are auto-matched. Need a template?{" "}
                    <button
                      className="text-link"
                      onClick={(e) => { e.stopPropagation(); downloadTemplate(); }}
                    >
                      Download CSV template
                    </button>
                  </p>
                  <input
                    ref={csvPickerRef}
                    type="file"
                    accept=".csv"
                    style={{ display: "none" }}
                    onChange={handleCsvPick}
                  />
                </div>
              )}

              {/* Step 2 — Mapping + preview */}
              {csvFile && !importResult && (
                <>
                  <div className="import-file-banner">
                    <FileSpreadsheet size={15} />
                    <span className="import-file-name">{csvFile.name}</span>
                    <span className="import-file-rows">{csvRows.length} preview rows</span>
                    {!importing && (
                      <button
                        className="text-link"
                        style={{ marginLeft: "auto" }}
                        onClick={() => { setCsvFile(null); setCsvHeaders([]); setCsvRows([]); setMapping({}); }}
                      >
                        Change file
                      </button>
                    )}
                  </div>

                  <div className="mapping-section">
                    <h4 className="mapping-title">Column Mapping</h4>
                    <p className="mapping-hint">Auto-matched where possible — adjust if needed.</p>
                    <div className="mapping-grid">
                      {ALL_TARGETS.map((target) => (
                        <div className="mapping-row" key={target}>
                          <span className="mapping-label">{LABEL_MAP[target]}</span>
                          <select
                            className="admin-input mapping-select"
                            value={mapping[target] || ""}
                            onChange={(e) => setMapping((prev) => ({ ...prev, [target]: e.target.value }))}
                          >
                            <option value="">— Skip —</option>
                            {csvHeaders.map((h) => <option key={h} value={h}>{h}</option>)}
                          </select>
                          {mapping[target] && <span className="mapping-matched">✓</span>}
                        </div>
                      ))}
                    </div>
                  </div>

                  {csvRows.length > 0 && (
                    <div className="preview-section">
                      <h4 className="mapping-title">Data Preview</h4>
                      <div className="preview-table-wrap">
                        <table className="preview-table">
                          <thead>
                            <tr>
                              {ALL_TARGETS.filter((t) => mapping[t]).map((t) => (
                                <th key={t}>{LABEL_MAP[t]}</th>
                              ))}
                            </tr>
                          </thead>
                          <tbody>
                            {csvRows.map((row, idx) => (
                              <tr key={idx}>
                                {ALL_TARGETS.filter((t) => mapping[t]).map((t) => (
                                  <td key={t}>
                                    {(row[mapping[t]] || "").substring(0, 50)}
                                    {(row[mapping[t]] || "").length > 50 ? "…" : ""}
                                  </td>
                                ))}
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {importing && (
                    <div className="import-progress-wrap">
                      <div className="import-progress-bar">
                        <div className="import-progress-fill" style={{ width: `${progressPct}%` }} />
                      </div>
                      <span className="import-progress-label">
                        Importing {importProgress.done} / {importProgress.total}…
                      </span>
                    </div>
                  )}
                </>
              )}

              {/* Step 3 — Result */}
              {importResult && (
                <div className="import-result">
                  <CheckCircle2 size={44} color="var(--admin-success)" style={{ marginBottom: 12 }} />
                  <h4 className="import-result-title">
                    {importResult.success} product{importResult.success !== 1 ? "s" : ""} imported successfully!
                  </h4>
                  {importResult.errors.length > 0 && (
                    <div className="import-errors">
                      <div className="import-errors-header">
                        <AlertCircle size={14} /> {importResult.errors.length} row{importResult.errors.length !== 1 ? "s" : ""} had issues:
                      </div>
                      <ul>{importResult.errors.map((err, i) => <li key={i}>{err}</li>)}</ul>
                    </div>
                  )}
                  <p className="import-images-note">
                    ✅ All done! Open each product in the editor to add images manually.
                  </p>
                </div>
              )}
            </div>

            <div className="modal-footer">
              {!importResult ? (
                <>
                  <button className="admin-btn admin-btn-outline" onClick={() => setShowImportModal(false)} disabled={importing}>
                    Cancel
                  </button>
                  {csvFile && (
                    <button className="admin-btn icon-left" onClick={runImport} disabled={importing || !mapping.title}>
                      {importing
                        ? <><Loader2 size={15} className="spin" /> Importing…</>
                        : <><Upload size={15} /> Import All</>
                      }
                    </button>
                  )}
                </>
              ) : (
                <button className="admin-btn" onClick={() => setShowImportModal(false)}>Done</button>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default Products;
