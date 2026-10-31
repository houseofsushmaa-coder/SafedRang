import React, { useState, useEffect, useMemo, useRef } from "react";
import {
  Search,
  Loader2,
  Package,
  CheckCircle,
  CheckCircle2,
  XCircle,
  X,
  ArrowUpCircle,
  ArrowDownCircle,
  AlertTriangle,
  Check,
  Edit2,
} from "lucide-react";
import "./AdminPages.css";

import { adminService } from "../adminService";
import { useProducts } from "../../context/ProductContext";

const Toast = ({ toast, onClose }) => {
  if (!toast) return null;
  return (
    <div className={`users-toast users-toast--${toast.type}`}>
      {toast.type === "success" ? (
        <CheckCircle size={18} />
      ) : (
        <XCircle size={18} />
      )}
      <span>{toast.message}</span>
      <button className="toast-close" onClick={onClose}>
        <X size={14} />
      </button>
    </div>
  );
};

/* ── Adjust Stock Modal (Set Exact / Add / Subtract) ── */
const AdjustStockModal = ({ item, onClose, onSuccess, onUpdateStock }) => {
  const [operation, setOperation] = useState("set"); // 'set' | 'add' | 'subtract'
  const [amount, setAmount] = useState(
    operation === "set" ? String(item.currentStock ?? 0) : ""
  );
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleOpChange = (newOp) => {
    setOperation(newOp);
    setError("");
    if (newOp === "set") {
      setAmount(String(item.currentStock ?? 0));
    } else {
      setAmount("");
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const val = parseInt(amount, 10);
    if (isNaN(val) || val < 0) {
      setError("Please enter a valid non-negative number");
      return;
    }

    let newTotal = val;
    if (operation === "add") {
      if (val === 0) {
        setError("Please enter a number greater than 0 to add");
        return;
      }
      newTotal = (item.currentStock || 0) + val;
    } else if (operation === "subtract") {
      if (val === 0) {
        setError("Please enter a number greater than 0 to subtract");
        return;
      }
      if (val > (item.currentStock || 0)) {
        setError(`Cannot subtract more than current stock (${item.currentStock})`);
        return;
      }
      newTotal = Math.max(0, (item.currentStock || 0) - val);
    }

    setLoading(true);
    try {
      if (onUpdateStock) {
        await onUpdateStock(item.productId, newTotal, item.variantId);
      } else {
        await adminService.updateStock(item.productId, newTotal);
      }
      onSuccess(
        `Stock updated for ${item.name} → ${newTotal} units`,
        item.productId,
        newTotal,
        item.variantId
      );
    } catch (err) {
      setError(err.message || "Failed to update stock in database");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-box" style={{ maxWidth: "440px" }}>
        <div className="modal-header">
          <h3>
            <Package size={18} /> Adjust Stock Quantity
          </h3>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="modal-error">
            <XCircle size={15} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          <div
            style={{
              marginBottom: "16px",
              padding: "10px 14px",
              background: "var(--ivory)",
              borderRadius: "6px",
              border: "1px solid var(--admin-border)",
            }}
          >
            <div style={{ fontWeight: 700, color: "var(--admin-text-main)", fontSize: "0.95rem" }}>
              {item.name}
            </div>
            {item.sku && (
              <div style={{ fontSize: "0.8rem", color: "var(--admin-text-muted)", marginTop: "2px" }}>
                SKU: {item.sku}
              </div>
            )}
            <div style={{ marginTop: "6px", fontSize: "0.88rem" }}>
              Current stock:{" "}
              <strong style={{ fontSize: "1.05rem", color: item.currentStock === 0 ? "#DC2626" : "var(--admin-text-main)" }}>
                {item.currentStock} units
              </strong>
            </div>
          </div>

          <label style={{ fontSize: "0.8rem", fontWeight: 700, marginBottom: "6px", display: "block" }}>
            Adjustment Action
          </label>
          <div className="form-row" style={{ gridTemplateColumns: "1fr 1fr 1fr", gap: "6px", marginBottom: "16px" }}>
            <button
              type="button"
              className={`admin-btn ${operation === "set" ? "" : "admin-btn-outline"}`}
              onClick={() => handleOpChange("set")}
              style={{ padding: "8px 6px", fontSize: "0.82rem", justifyContent: "center" }}
            >
              Set Exact
            </button>
            <button
              type="button"
              className={`admin-btn ${operation === "add" ? "" : "admin-btn-outline"}`}
              onClick={() => handleOpChange("add")}
              style={{ padding: "8px 6px", fontSize: "0.82rem", justifyContent: "center" }}
            >
              <ArrowUpCircle size={14} style={{ marginRight: 4 }} /> + Add
            </button>
            <button
              type="button"
              className={`admin-btn ${operation === "subtract" ? "" : "admin-btn-outline"}`}
              onClick={() => handleOpChange("subtract")}
              style={{
                padding: "8px 6px",
                fontSize: "0.82rem",
                justifyContent: "center",
                borderColor: operation === "subtract" ? "#dc2626" : "",
                backgroundColor: operation === "subtract" ? "#fef2f2" : "",
                color: operation === "subtract" ? "#dc2626" : "",
              }}
            >
              <ArrowDownCircle size={14} style={{ marginRight: 4 }} /> - Deduct
            </button>
          </div>

          <div className="form-group">
            <label>
              {operation === "set"
                ? "New Total Stock Quantity"
                : operation === "add"
                ? "Units to Add (+)"
                : "Units to Deduct (-)"}
            </label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              min="0"
              autoFocus
              required
              className="admin-input"
              style={{ fontSize: "1rem", fontWeight: 700 }}
            />
          </div>

          <div className="modal-footer" style={{ marginTop: "20px" }}>
            <button
              type="button"
              className="admin-btn admin-btn-outline"
              onClick={onClose}
              disabled={loading}
            >
              Cancel
            </button>
            <button type="submit" className="admin-btn" disabled={loading}>
              {loading ? <Loader2 size={15} className="spin" /> : "Save Changes"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Inventory = () => {
  const {
    products: contextProducts,
    quickUpdateStock,
    bulkSetStock,
    bulkUpdateStockStatus,
  } = useProducts();

  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);
  const [viewFilter, setViewFilter] = useState("all"); // 'all' | 'instock' | 'lowstock' | 'outofstock'
  const [sortField, setSortField] = useState("title");
  const [sortDirection, setSortDirection] = useState("asc");

  const handleSort = (field) => {
    if (sortField === field) {
      setSortDirection((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortField(field);
      setSortDirection("asc");
    }
  };

  // Selection for bulk actions
  const [selectedIds, setSelectedIds] = useState(new Set());
  const [bulkQtyVal, setBulkQtyVal] = useState("1");
  const [isBulkApplying, setIsBulkApplying] = useState(false);

  // Modal edit
  const [itemToAdjust, setItemToAdjust] = useState(null);

  // Inline table editing
  const [inlineEditingKey, setInlineEditingKey] = useState(null); // 'prodId' or 'prodId-variantId'
  const [inlineVal, setInlineVal] = useState("");
  const [inlineSavingKey, setInlineSavingKey] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  // ONE-TIME load: hasFetchedRef gates this effect to run only once after mount.
  // It waits for contextProducts to be non-empty (dep needed), but the ref
  // prevents re-running when contextProducts changes due to stock saves.
  // This is the permanent fix for "stock auto-reverts after edit" bug.
  const hasFetchedRef = useRef(false);

  useEffect(() => {
    if (hasFetchedRef.current) return; // already loaded once — never overwrite user edits
    if (!contextProducts || contextProducts.length === 0) return; // wait for data

    hasFetchedRef.current = true;

    const mapped = contextProducts.map((p) => {
      const isVariable =
        p.productType === "variable" &&
        Array.isArray(p.variations) &&
        p.variations.length > 0;

      const variants = isVariable
        ? p.variations.map((v, idx) => ({
            id: v.id || `${p.id}-v${idx}`,
            size: v.size || "",
            sku: v.sku || "",
            stock: Number(v.stock) || 0,
            priceModifier: Number(v.priceModifier) || 0,
          }))
        : [];

      const totalStock = isVariable
        ? variants.reduce((sum, v) => sum + v.stock, 0)
        : p.stock !== undefined && p.stock !== null
        ? Number(p.stock)
        : 1;

      return {
        id: p.id,
        title: p.title,
        sku: p.sku || `SR-${p.id}`,
        category: p.category,
        stock: totalStock,
        stockStatus:
          totalStock <= 0
            ? "Out of Stock"
            : totalStock < 5
            ? "Low Stock"
            : "In Stock",
        price: p.price,
        image: p.image || p.images?.[0] || "",
        hasVariants: isVariable,
        variants,
      };
    });

    setProducts(mapped);
    setLoading(false);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextProducts]); // dep kept so effect fires when data arrives; ref prevents re-fires

  const handleStockSuccess = (msg, prodId, newTotal, variantId = null) => {
    setItemToAdjust(null);
    showToast(msg, "success");

    if (prodId && newTotal !== undefined) {
      setProducts((prev) =>
        prev.map((p) => {
          if (String(p.id) !== String(prodId)) return p;
          if (variantId && p.variants && p.variants.length > 0) {
            const updatedVars = p.variants.map((v) =>
              String(v.id) === String(variantId) || String(v.size) === String(variantId)
                ? { ...v, stock: newTotal }
                : v
            );
            const sumStock = updatedVars.reduce((s, v) => s + (Number(v.stock) || 0), 0);
            return {
              ...p,
              stock: sumStock,
              stockStatus: sumStock <= 0 ? "Out of Stock" : sumStock < 5 ? "Low Stock" : "In Stock",
              variants: updatedVars,
            };
          }
          return {
            ...p,
            stock: newTotal,
            stockStatus: newTotal <= 0 ? "Out of Stock" : newTotal < 5 ? "Low Stock" : "In Stock",
          };
        })
      );
    }
  };

  // ── Inline Save ──
  const handleInlineSave = async (product, variant = null) => {
    const val = parseInt(inlineVal, 10);
    if (isNaN(val) || val < 0) {
      showToast("Please enter a valid stock quantity (0 or more)", "error");
      return;
    }

    const key = variant ? `${product.id}-${variant.id}` : product.id;
    setInlineSavingKey(key);

    try {
      await quickUpdateStock(product.id, val, variant?.id || null);
      handleStockSuccess(
        `Stock set to ${val} units`,
        product.id,
        val,
        variant?.id || null
      );
      setInlineEditingKey(null);
    } catch (err) {
      showToast(`Error updating stock: ${err.message}`, "error");
    } finally {
      setInlineSavingKey(null);
    }
  };

  // ── Bulk Actions ──
  const handleBulkSetQty = async () => {
    const qty = parseInt(bulkQtyVal, 10);
    if (isNaN(qty) || qty < 0) {
      showToast("Please enter a valid stock number", "error");
      return;
    }

    setIsBulkApplying(true);
    try {
      await bulkSetStock(Array.from(selectedIds), qty);
      showToast(`Updated stock to ${qty} units for ${selectedIds.size} products!`, "success");
      setSelectedIds(new Set());
    } catch (err) {
      showToast(`Failed bulk update: ${err.message}`, "error");
    } finally {
      setIsBulkApplying(false);
    }
  };

  const handleBulkStatus = async (status) => {
    setIsBulkApplying(true);
    try {
      await bulkUpdateStockStatus(Array.from(selectedIds), status);
      showToast(`Marked ${selectedIds.size} products as "${status}"`, "success");
      setSelectedIds(new Set());
    } catch (err) {
      showToast(`Failed bulk status update: ${err.message}`, "error");
    } finally {
      setIsBulkApplying(false);
    }
  };

  // ── Filtering & Metrics ──
  const auditMetrics = useMemo(() => {
    let inStock = 0,
      lowStock = 0,
      outOfStock = 0;
    products.forEach((p) => {
      if (p.stock <= 0) outOfStock++;
      else if (p.stock < 5) lowStock++;
      else inStock++;
    });
    return { total: products.length, inStock, lowStock, outOfStock };
  }, [products]);

  const filtered = useMemo(() => {
    return products.filter((p) => {
      // Search
      const matchSearch =
        !search ||
        p.title?.toLowerCase().includes(search.toLowerCase()) ||
        p.sku?.toLowerCase().includes(search.toLowerCase()) ||
        p.category?.toLowerCase().includes(search.toLowerCase());

      if (!matchSearch) return false;

      // Status tab filter
      if (viewFilter === "instock") return p.stock > 0;
      if (viewFilter === "lowstock") return p.stock > 0 && p.stock < 5;
      if (viewFilter === "outofstock") return p.stock <= 0;
      return true;
    });
  }, [products, search, viewFilter]);

  const sortedFiltered = useMemo(() => {
    return [...filtered].sort((a, b) => {
      let valA, valB;
      if (sortField === "stock") {
        valA = Number(a.stock) || 0;
        valB = Number(b.stock) || 0;
      } else if (sortField === "status") {
        valA = a.stockStatus || "";
        valB = b.stockStatus || "";
      } else if (sortField === "category") {
        valA = a.category || "";
        valB = b.category || "";
      } else if (sortField === "sku") {
        valA = a.sku || "";
        valB = b.sku || "";
      } else {
        valA = a.title || "";
        valB = b.title || "";
      }
      if (typeof valA === "number") {
        return sortDirection === "asc" ? valA - valB : valB - valA;
      }
      return sortDirection === "asc"
        ? String(valA).localeCompare(String(valB))
        : String(valB).localeCompare(String(valA));
    });
  }, [filtered, sortField, sortDirection]);

  const handleSelectAll = (checked) => {
    if (checked) {
      setSelectedIds(new Set(filtered.map((p) => p.id)));
    } else {
      setSelectedIds(new Set());
    }
  };

  const handleToggleSelect = (id) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div className="admin-page">
      <Toast toast={toast} onClose={() => setToast(null)} />

      {itemToAdjust && (
        <AdjustStockModal
          item={itemToAdjust}
          onClose={() => setItemToAdjust(null)}
          onSuccess={handleStockSuccess}
          onUpdateStock={quickUpdateStock}
        />
      )}

      {/* ── Page Header ── */}
      <div className="page-header">
        <div>
          <h2>Inventory Management</h2>
          <p className="page-subtitle">
            Audit inventory levels, edit stock quantities instantly, and perform bulk updates.
          </p>
        </div>
        <div className="header-actions">
          <div className="toolbar-search" style={{ width: 320 }}>
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search by title, SKU, or category…"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      {/* ── Audit Metric Cards / Filter Tabs ── */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))",
          gap: "12px",
          marginBottom: "16px",
        }}
      >
        <div
          onClick={() => setViewFilter("all")}
          style={{
            background: viewFilter === "all" ? "var(--admin-border-subtle, #f3ede4)" : "#fff",
            border: viewFilter === "all" ? "2px solid #6E1E2A" : "1px solid var(--admin-border)",
            padding: "12px 16px",
            borderRadius: "8px",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <div style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700, color: "var(--admin-text-muted)" }}>
            Total Tracked
          </div>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#6E1E2A", marginTop: "2px" }}>
            {auditMetrics.total}
          </div>
        </div>

        <div
          onClick={() => setViewFilter("instock")}
          style={{
            background: viewFilter === "instock" ? "#f0fdf4" : "#fff",
            border: viewFilter === "instock" ? "2px solid #16a34a" : "1px solid var(--admin-border)",
            padding: "12px 16px",
            borderRadius: "8px",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <div style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700, color: "#16a34a" }}>
            In Stock
          </div>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#16a34a", marginTop: "2px" }}>
            {auditMetrics.inStock}
          </div>
        </div>

        <div
          onClick={() => setViewFilter("lowstock")}
          style={{
            background: viewFilter === "lowstock" ? "#fefce8" : "#fff",
            border: viewFilter === "lowstock" ? "2px solid #ca8a04" : "1px solid var(--admin-border)",
            padding: "12px 16px",
            borderRadius: "8px",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <div style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700, color: "#a16207" }}>
            Low Stock (&lt; 5)
          </div>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#ca8a04", marginTop: "2px" }}>
            {auditMetrics.lowStock}
          </div>
        </div>

        <div
          onClick={() => setViewFilter("outofstock")}
          style={{
            background: viewFilter === "outofstock" ? "#fef2f2" : "#fff",
            border: viewFilter === "outofstock" ? "2px solid #dc2626" : "1px solid var(--admin-border)",
            padding: "12px 16px",
            borderRadius: "8px",
            cursor: "pointer",
            transition: "all 0.15s ease",
          }}
        >
          <div style={{ fontSize: "0.75rem", textTransform: "uppercase", fontWeight: 700, color: "#dc2626" }}>
            Out of Stock
          </div>
          <div style={{ fontSize: "1.4rem", fontWeight: 800, color: "#dc2626", marginTop: "2px" }}>
            {auditMetrics.outOfStock}
          </div>
        </div>
      </div>

      {/* ── Bulk Actions Floating / Top Bar ── */}
      {selectedIds.size > 0 && (
        <div
          style={{
            background: "rgba(110, 30, 42, 0.08)",
            border: "1px solid rgba(110, 30, 42, 0.25)",
            padding: "12px 18px",
            borderRadius: "8px",
            marginBottom: "16px",
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            flexWrap: "wrap",
            gap: "12px",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <span style={{ fontWeight: 800, color: "#6E1E2A", fontSize: "0.92rem" }}>
              {selectedIds.size} item{selectedIds.size !== 1 ? "s" : ""} selected
            </span>
            <button
              type="button"
              className="text-link"
              style={{ fontSize: "0.82rem", color: "#6E1E2A", textDecoration: "underline", cursor: "pointer", background: "none", border: "none" }}
              onClick={() => setSelectedIds(new Set())}
            >
              Clear selection
            </button>
          </div>

          <div style={{ display: "flex", alignItems: "center", gap: "10px", flexWrap: "wrap" }}>
            {/* Bulk set exact stock */}
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
                style={{ fontSize: "0.8rem", padding: "6px 12px" }}
                disabled={isBulkApplying}
                onClick={handleBulkSetQty}
              >
                {isBulkApplying ? <Loader2 size={13} className="spin" /> : "Apply Qty"}
              </button>
            </div>

            <button
              type="button"
              className="admin-btn admin-btn-outline icon-left"
              style={{ fontSize: "0.8rem", padding: "6px 12px" }}
              disabled={isBulkApplying}
              onClick={() => handleBulkStatus("In Stock")}
            >
              <CheckCircle2 size={14} color="#16a34a" /> Mark In Stock
            </button>

            <button
              type="button"
              className="admin-btn admin-btn-outline icon-left"
              style={{ fontSize: "0.8rem", padding: "6px 12px", borderColor: "#fca5a5", color: "#b91c1c" }}
              disabled={isBulkApplying}
              onClick={() => handleBulkStatus("Out of Stock")}
            >
              <XCircle size={14} color="#dc2626" /> Mark Out of Stock
            </button>
          </div>
        </div>
      )}

      {/* ── Table Card ── */}
      <div className="admin-table-card">
        {loading ? (
          <div className="admin-loading-state">
            <Loader2 size={24} className="spin" /> Loading inventory catalog...
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <Package size={40} className="empty-icon" />
            <h3>No inventory items found</h3>
            <p>Try clearing your search or status filter.</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th style={{ width: "36px" }}>
                  <input
                    type="checkbox"
                    checked={selectedIds.size > 0 && selectedIds.size === sortedFiltered.length}
                    onChange={(e) => handleSelectAll(e.target.checked)}
                    aria-label="Select all products"
                    style={{ cursor: "pointer" }}
                  />
                </th>
                <th onClick={() => handleSort("title")} style={{ cursor: "pointer", userSelect: "none" }} title="Click to sort by Product Name">
                  Product / Variant {sortField === "title" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                </th>
                <th onClick={() => handleSort("sku")} style={{ cursor: "pointer", userSelect: "none" }} title="Click to sort by SKU">
                  SKU {sortField === "sku" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                </th>
                <th onClick={() => handleSort("category")} style={{ cursor: "pointer", userSelect: "none" }} title="Click to sort by Category">
                  Category {sortField === "category" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                </th>
                <th onClick={() => handleSort("status")} style={{ cursor: "pointer", userSelect: "none" }} title="Click to sort by Status">
                  Status {sortField === "status" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                </th>
                <th onClick={() => handleSort("stock")} style={{ cursor: "pointer", userSelect: "none" }} title="Click to sort by Stock Quantity">
                  Available Units {sortField === "stock" ? (sortDirection === "asc" ? "▲" : "▼") : ""}
                </th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {sortedFiltered.map((product) => {
                const isSelected = selectedIds.has(product.id);
                const hasVariants = product.hasVariants && product.variants.length > 0;
                const rows = [];

                if (hasVariants) {
                  // Parent variable row
                  rows.push(
                    <tr
                      key={`p-${product.id}`}
                      style={{
                        backgroundColor: isSelected ? "rgba(110, 30, 42, 0.05)" : "#f8fafc",
                        fontWeight: 600,
                      }}
                    >
                      <td>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(product.id)}
                          style={{ cursor: "pointer" }}
                        />
                      </td>
                      <td>
                        <div className="product-cell">
                          <img
                            src={product.image || "/placeholder.png"}
                            alt=""
                            className="product-thumb"
                            style={{
                              width: "48px",
                              height: "48px",
                              minWidth: "48px",
                              maxWidth: "48px",
                              minHeight: "48px",
                              maxHeight: "48px",
                              objectFit: "cover",
                              borderRadius: "8px",
                              border: "1px solid var(--admin-border)",
                              backgroundColor: "var(--ivory)",
                              flexShrink: 0,
                              display: "block",
                            }}
                            onError={(e) => { e.currentTarget.src = "/placeholder.png"; }}
                          />
                          <div className="product-info">
                            <span className="product-title" style={{ fontWeight: 700 }}>
                              {product.title}
                            </span>
                            <span className="product-sku" style={{ color: "#6E1E2A", fontWeight: 600 }}>
                              {product.variants.length} Sizes/Variants
                            </span>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontFamily: "monospace", fontSize: "0.85rem" }}>
                        {product.sku || "—"}
                      </td>
                      <td>{product.category || "—"}</td>
                      <td>
                        {product.stock > 0 ? (
                          <span className="status-badge status-completed">In Stock</span>
                        ) : (
                          <span className="status-badge status-cancelled">Out of Stock</span>
                        )}
                      </td>
                      <td style={{ fontWeight: 800, fontSize: "0.95rem" }}>
                        {product.stock} units total
                      </td>
                      <td style={{ textAlign: "right", color: "var(--admin-text-muted)", fontSize: "0.82rem" }}>
                        Adjust individual sizes ↓
                      </td>
                    </tr>
                  );

                  // Child variant rows
                  product.variants.forEach((variant) => {
                    const isLow = variant.stock > 0 && variant.stock <= 5;
                    const isOut = variant.stock === 0;
                    const inlineKey = `${product.id}-${variant.id}`;
                    const isEditing = inlineEditingKey === inlineKey;
                    const isSaving = inlineSavingKey === inlineKey;

                    rows.push(
                      <tr key={`v-${variant.id}`} style={{ backgroundColor: "#fff" }}>
                        <td></td>
                        <td style={{ paddingLeft: "54px" }}>
                          <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                            <div
                              style={{
                                width: "6px",
                                height: "6px",
                                borderRadius: "50%",
                                backgroundColor: isOut ? "#dc2626" : isLow ? "#ca8a04" : "#16a34a",
                              }}
                            />
                            <span style={{ fontSize: "0.88rem", fontWeight: 600, color: "var(--admin-text-main)" }}>
                              Size / Option: {variant.size || "Standard"}
                            </span>
                          </div>
                        </td>
                        <td style={{ fontFamily: "monospace", fontSize: "0.82rem", color: "var(--admin-text-muted)" }}>
                          {variant.sku || "—"}
                        </td>
                        <td>—</td>
                        <td>
                          {isOut ? (
                            <span className="status-badge status-cancelled">Out of Stock</span>
                          ) : isLow ? (
                            <span
                              className="status-badge status-pending"
                              style={{ backgroundColor: "#fef9c3", color: "#a16207" }}
                            >
                              <AlertTriangle size={11} style={{ marginRight: 3 }} /> Low ({variant.stock})
                            </span>
                          ) : (
                            <span className="status-badge status-completed">In Stock</span>
                          )}
                        </td>
                        <td>
                          {isEditing ? (
                            <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                              <input
                                type="number"
                                min="0"
                                value={inlineVal}
                                onChange={(e) => setInlineVal(e.target.value)}
                                autoFocus
                                onKeyDown={(e) => {
                                  if (e.key === "Enter") handleInlineSave(product, variant);
                                  else if (e.key === "Escape") setInlineEditingKey(null);
                                }}
                                style={{
                                  width: "60px",
                                  padding: "3px 6px",
                                  border: "1px solid var(--admin-border)",
                                  borderRadius: "4px",
                                  fontWeight: 700,
                                  fontSize: "0.85rem",
                                }}
                                disabled={isSaving}
                              />
                              <button
                                type="button"
                                onClick={() => handleInlineSave(product, variant)}
                                disabled={isSaving}
                                style={{
                                  padding: "4px 6px",
                                  background: "#6E1E2A",
                                  color: "#fff",
                                  border: "none",
                                  borderRadius: "4px",
                                  cursor: "pointer",
                                }}
                              >
                                {isSaving ? <Loader2 size={12} className="spin" /> : <Check size={12} />}
                              </button>
                              <button
                                type="button"
                                onClick={() => setInlineEditingKey(null)}
                                style={{
                                  padding: "4px 6px",
                                  background: "none",
                                  border: "1px solid var(--admin-border)",
                                  borderRadius: "4px",
                                  cursor: "pointer",
                                }}
                              >
                                <X size={12} />
                              </button>
                            </div>
                          ) : (
                            <div
                              style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px" }}
                              onClick={() => {
                                setInlineEditingKey(inlineKey);
                                setInlineVal(String(variant.stock));
                              }}
                              title="Click to quickly edit stock"
                            >
                              <strong style={{ color: isOut ? "#dc2626" : "inherit" }}>
                                {variant.stock} units
                              </strong>
                              <Edit2 size={11} style={{ color: "var(--admin-text-muted)" }} />
                            </div>
                          )}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            className="admin-btn-outline"
                            style={{ padding: "4px 10px", fontSize: "0.78rem" }}
                            onClick={() =>
                              setItemToAdjust({
                                productId: product.id,
                                variantId: variant.id,
                                name: `${product.title} (${variant.size})`,
                                sku: variant.sku,
                                currentStock: variant.stock,
                              })
                            }
                          >
                            Adjust
                          </button>
                        </td>
                      </tr>
                    );
                  });
                } else {
                  // Simple product row
                  const isLow = product.stock > 0 && product.stock <= 5;
                  const isOut = product.stock === 0;
                  const isEditing = inlineEditingKey === product.id;
                  const isSaving = inlineSavingKey === product.id;

                  rows.push(
                    <tr
                      key={`p-${product.id}`}
                      style={{
                        backgroundColor: isSelected ? "rgba(110, 30, 42, 0.05)" : undefined,
                      }}
                    >
                      <td>
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleToggleSelect(product.id)}
                          style={{ cursor: "pointer" }}
                        />
                      </td>
                      <td>
                        <div className="product-cell">
                          <img
                            src={product.image || "/placeholder.png"}
                            alt=""
                            className="product-thumb"
                            style={{
                              width: "48px",
                              height: "48px",
                              minWidth: "48px",
                              maxWidth: "48px",
                              minHeight: "48px",
                              maxHeight: "48px",
                              objectFit: "cover",
                              borderRadius: "8px",
                              border: "1px solid var(--admin-border)",
                              backgroundColor: "var(--ivory)",
                              flexShrink: 0,
                              display: "block",
                            }}
                            onError={(e) => { e.currentTarget.src = "/placeholder.png"; }}
                          />
                          <div className="product-info">
                            <span className="product-title" style={{ fontWeight: 600 }}>
                              {product.title}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td style={{ fontFamily: "monospace", fontSize: "0.85rem" }}>
                        {product.sku || "—"}
                      </td>
                      <td>{product.category || "—"}</td>
                      <td>
                        {isOut ? (
                          <span className="status-badge status-cancelled">Out of Stock</span>
                        ) : isLow ? (
                          <span
                            className="status-badge status-pending"
                            style={{ backgroundColor: "#fef9c3", color: "#a16207" }}
                          >
                            <AlertTriangle size={12} style={{ marginRight: "3px" }} /> Low Stock
                          </span>
                        ) : (
                          <span className="status-badge status-completed">In Stock</span>
                        )}
                      </td>
                      <td>
                        {isEditing ? (
                          <div style={{ display: "flex", alignItems: "center", gap: "4px" }}>
                            <input
                              type="number"
                              min="0"
                              value={inlineVal}
                              onChange={(e) => setInlineVal(e.target.value)}
                              autoFocus
                              onKeyDown={(e) => {
                                if (e.key === "Enter") handleInlineSave(product);
                                else if (e.key === "Escape") setInlineEditingKey(null);
                              }}
                              style={{
                                width: "65px",
                                padding: "4px 6px",
                                border: "1px solid var(--admin-border)",
                                borderRadius: "4px",
                                fontWeight: 700,
                                fontSize: "0.85rem",
                              }}
                              disabled={isSaving}
                            />
                            <button
                              type="button"
                              onClick={() => handleInlineSave(product)}
                              disabled={isSaving}
                              style={{
                                padding: "4px 8px",
                                background: "#6E1E2A",
                                color: "#fff",
                                border: "none",
                                borderRadius: "4px",
                                cursor: "pointer",
                              }}
                            >
                              {isSaving ? <Loader2 size={12} className="spin" /> : <Check size={12} />}
                            </button>
                            <button
                              type="button"
                              onClick={() => setInlineEditingKey(null)}
                              style={{
                                padding: "4px 6px",
                                background: "none",
                                border: "1px solid var(--admin-border)",
                                borderRadius: "4px",
                                cursor: "pointer",
                              }}
                            >
                              <X size={12} />
                            </button>
                          </div>
                        ) : (
                          <div
                            style={{ cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "5px" }}
                            onClick={() => {
                              setInlineEditingKey(product.id);
                              setInlineVal(String(product.stock));
                            }}
                            title="Click to edit stock quantity"
                          >
                            <strong style={{ fontWeight: 800, color: isOut ? "#dc2626" : "inherit" }}>
                              {product.stock} units
                            </strong>
                            <Edit2 size={11} style={{ color: "var(--admin-text-muted)" }} />
                          </div>
                        )}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          className="admin-btn-outline"
                          style={{ padding: "4px 12px", fontSize: "0.8rem", height: "auto" }}
                          onClick={() =>
                            setItemToAdjust({
                              productId: product.id,
                              name: product.title,
                              sku: product.sku,
                              currentStock: product.stock,
                            })
                          }
                        >
                          Adjust
                        </button>
                      </td>
                    </tr>
                  );
                }

                return rows;
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Inventory;
