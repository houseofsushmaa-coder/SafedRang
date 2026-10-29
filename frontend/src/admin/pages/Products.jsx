import React, { useState, useRef, useEffect } from "react";
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
  Sparkles,
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
  stock:       "Stock Qty",
  stockStatus: "Stock Status",
  description: "Description",
  image:       "Image URL",
};

// ── CSV Template download helper ───────────────────────────────────────
function downloadTemplate() {
  const headers = [
    "Title","SKU","Category","Price","SalePrice",
    "Stock","StockStatus","Description","Image",
  ];
  const sample = [
    [
      "Chanderi Chikankari Dupatta Green","SR-DUP-001","Dupattas",
      "1499","1299","10","In Stock",
      "Enhance your look with this green Chanderi dupatta handcrafted with intricate thread embroidery.",
      "https://example.com/image.jpg",
    ],
    [
      "Pure Georgette Chikankari Saree","SR-SAR-001","Sarees",
      "8999","","5","Low Stock",
      "Elegant saree in luxurious georgette with traditional Chikankari embroidery.",
      "",
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
  const { products, deleteProduct, addProduct, updateProduct, loading } = useProducts();
  const [togglingOneOfOneId, setTogglingOneOfOneId] = useState(null);

  const handleToggleOneOfOne = async (product, e) => {
    e.stopPropagation();
    try {
      setTogglingOneOfOneId(product.id);
      await updateProduct(product.id, {
        ...product,
        isOneOfOne: !product.isOneOfOne,
      });
    } catch (err) {
      console.error("Failed to toggle One of One:", err);
    } finally {
      setTogglingOneOfOneId(null);
    }
  };
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  // ── Filter state ───────────────────────────────────────────────────
  const [searchTerm, setSearchTerm]         = useState("");
  const [categoryFilter, setCategoryFilter] = useState(searchParams.get("category") || "all");
  const [statusFilter, setStatusFilter]     = useState("all");
  const [oneOfOneFilter, setOneOfOneFilter] = useState("all");
  const [categories, setCategories]         = useState([]);

  useEffect(() => {
    const urlCat = searchParams.get("category");
    if (urlCat) {
      setCategoryFilter(urlCat);
    }
  }, [searchParams]);

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

  // ── Fetch categories for filter dropdown ───────────────────────────
  useEffect(() => {
    adminService.getCategories().then((cats) => setCategories(cats || []));
  }, []);

  const categoryOptions = categories.length > 0
    ? categories.map((c) => c.name)
    : [...new Set(products.map((p) => p.category).filter(Boolean))];

  // ── Status helpers ─────────────────────────────────────────────────
  const getStatusClass = (status) => {
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

  // ── Filtered products ──────────────────────────────────────────────
  const filteredProducts = products.filter((p) => {
    const matchSearch =
      (p.title || "").toLowerCase().includes(searchTerm.toLowerCase()) ||
      (p.sku && p.sku.toLowerCase().includes(searchTerm.toLowerCase()));

    let matchCat = categoryFilter === "all";
    if (!matchCat) {
      const pCat = (p.category || "").toLowerCase().trim();
      const fCat = categoryFilter.toLowerCase().trim();
      matchCat = pCat === fCat || pCat.replace(/s$/, "") === fCat.replace(/s$/, "");
    }

    const matchStatus = statusFilter === "all" ||
      (p.stockStatus || "").toLowerCase() === statusFilter.toLowerCase();

    let matchOneOfOne = true;
    if (oneOfOneFilter === "one-of-one") {
      matchOneOfOne = Boolean(p.isOneOfOne);
    } else if (oneOfOneFilter === "regular") {
      matchOneOfOne = !p.isOneOfOne;
    }

    return matchSearch && matchCat && matchStatus && matchOneOfOne;
  });

  // ── Export ────────────────────────────────────────────────────────
  const handleExport = () => {
    try {
      const csvData = filteredProducts.map((p) => ({
        Title: p.title || "", SKU: p.sku || "", Category: p.category || "",
        Price: p.price || 0, SalePrice: p.salePrice || "",
        Stock: p.stock || 0, StockStatus: p.stockStatus || "",
        Description: p.description || "", Image: p.image || "",
      }));
      const csv = Papa.unparse(csvData);
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
      error: (err) => { alert("CSV parse error: " + err.message); setImporting(false); },
    });
  };

  const progressPct = importProgress.total > 0
    ? Math.round((importProgress.done / importProgress.total) * 100) : 0;

  return (
    <div className="admin-page">
      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <h2>Products</h2>
          <p className="page-subtitle">Manage your store's inventory — {products.length} total</p>
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

      {/* ── Table Card ── */}
      <div className="admin-table-card">
        <div className="table-toolbar">
          <div className="toolbar-search">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search by name or SKU…"
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
            {/* One of One Collection filter */}
            <div className="filter-select-wrap">
              <select className="filter-select" value={oneOfOneFilter} onChange={(e) => setOneOfOneFilter(e.target.value)}>
                <option value="all">All Products</option>
                <option value="one-of-one">One of One</option>
                <option value="regular">Regular Products</option>
              </select>
              <ChevronDown size={13} className="filter-chevron" />
            </div>
            {(categoryFilter !== "all" || statusFilter !== "all" || oneOfOneFilter !== "all" || searchTerm) && (
              <button
                className="admin-btn admin-btn-outline icon-left"
                style={{ padding: "6px 10px", fontSize: "0.8rem" }}
                onClick={() => { setCategoryFilter("all"); setStatusFilter("all"); setOneOfOneFilter("all"); setSearchTerm(""); }}
              >
                <RefreshCw size={13} /> Clear
              </button>
            )}
            <span className="filter-count">{filteredProducts.length} of {products.length}</span>
          </div>
        </div>

        {loading ? (
          <div className="admin-loading-state">
            <Loader2 size={24} className="spin" style={{ display: "block", margin: "0 auto 8px" }} />
            Loading products…
          </div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th width="50"><input type="checkbox" /></th>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Price</th>
                  <th>Stock</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product) => (
                  <tr key={product.id}>
                    <td><input type="checkbox" /></td>
                    <td>
                      <div className="product-cell">
                        <div className="product-img" style={{ backgroundImage: `url(${product.image})` }} />
                        <div className="product-info">
                          <span className="product-title">{product.title}</span>
                          <div style={{ display: "flex", alignItems: "center", gap: "6px", flexWrap: "wrap", marginTop: "4px" }}>
                            <span className="product-sku">{product.sku || product.id?.substring(0, 8)}</span>
                            <button
                              type="button"
                              onClick={(e) => handleToggleOneOfOne(product, e)}
                              disabled={togglingOneOfOneId === product.id}
                              title={product.isOneOfOne ? "Click to remove from One of One" : "Click to mark as One of One"}
                              style={{
                                fontSize: "0.62rem",
                                fontWeight: 700,
                                letterSpacing: "0.07em",
                                backgroundColor: product.isOneOfOne ? "#6E1E2A" : "transparent",
                                color: product.isOneOfOne ? "#FAF5EC" : "var(--admin-text-light)",
                                border: product.isOneOfOne ? "1px solid #6E1E2A" : "1px dashed var(--admin-border)",
                                padding: "2px 7px",
                                borderRadius: "4px",
                                cursor: "pointer",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: "4px",
                                lineHeight: 1.2,
                                transition: "all 0.15s ease",
                                opacity: togglingOneOfOneId === product.id ? 0.6 : 1
                              }}
                            >
                              <Sparkles size={10} />
                              {product.isOneOfOne ? "ONE OF ONE" : "+ One of One"}
                            </button>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td><span className="category-badge">{product.category || "—"}</span></td>
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
                      <div className="inventory-cell">
                        <span className="stock-count">{product.stock ?? 0}</span>
                        <span className="stock-label"> units</span>
                      </div>
                    </td>
                    <td>
                      <span className={`status-badge ${getStatusClass(product.stockStatus)}`}>
                        {product.stockStatus || "Active"}
                      </span>
                    </td>
                    <td className="text-right">
                      <div className="action-buttons">
                        <button className="action-btn" title="Edit" onClick={() => navigate(`/admin/product/${product.id}`)}>
                          <Edit size={16} />
                        </button>
                        <button
                          className="action-btn delete" title="Delete"
                          onClick={() => { if (window.confirm("Delete this product?")) deleteProduct(product.id); }}
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filteredProducts.length === 0 && (
          <div className="empty-state">
            <Package size={48} className="empty-icon" />
            <h3>No products found</h3>
            <p>Try adjusting your search or filters.</p>
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
