import React, { useState, useEffect, useCallback } from "react";
import axios from "axios";
import {
  Search,
  Loader2,
  Package,
  CheckCircle,
  XCircle,
  X,
  ArrowUpCircle,
  ArrowDownCircle,
  AlertTriangle,
} from "lucide-react";
import "./AdminPages.css";

const API = "https://violet-quetzal-133812.hostingersite.com/api/v1";

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

/* ── Adjust Stock Modal ── */
const AdjustStockModal = ({ item, onClose, onSuccess }) => {
  // item can be a main product or a variant
  const isVariant = !!item.variantId;

  const [amount, setAmount] = useState("");
  const [operation, setOperation] = useState("add"); // 'add' or 'subtract'
  const [reason, setReason] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");

    const qty = parseInt(amount, 10);
    if (!qty || isNaN(qty) || qty <= 0) {
      setError("Please enter a valid positive number");
      return;
    }

    const payloadQuantity = operation === "add" ? qty : -qty;

    if (operation === "subtract" && qty > item.currentStock) {
      setError(
        `Cannot subtract more than current stock (${item.currentStock})`,
      );
      return;
    }

    setLoading(true);
    try {
      const token = localStorage.getItem("adminToken");
      const payload = {
        quantity: payloadQuantity,
        reason: reason || (operation === "add" ? "Restock" : "Damage/Loss"),
      };
      if (isVariant) {
        payload.variantId = item.variantId;
      }

      await axios.put(`${API}/products/${item.productId}/stock`, payload, {
        headers: { Authorization: `Bearer ${token}` },
      });

      onSuccess(`Stock updated successfully for ${item.name}`);
    } catch (err) {
      setError(err.response?.data?.message || "Failed to update stock");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-box" style={{ maxWidth: "400px" }}>
        <div className="modal-header">
          <h3>
            <Package size={18} /> Adjust Stock
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
              fontSize: "0.95rem",
              color: "var(--admin-text-main)",
            }}
          >
            <strong>{item.name}</strong>
            {item.sku && (
              <div
                style={{ fontSize: "0.8rem", color: "var(--admin-text-muted)" }}
              >
                SKU: {item.sku}
              </div>
            )}
            <div style={{ marginTop: "8px" }}>
              Current Stock:{" "}
              <strong style={{ fontSize: "1.1rem" }}>
                {item.currentStock}
              </strong>
            </div>
          </div>

          <div className="form-row" style={{ gridTemplateColumns: "1fr 1fr" }}>
            <button
              type="button"
              className={`admin-btn ${operation === "add" ? "" : "admin-btn-outline"}`}
              onClick={() => setOperation("add")}
              style={{
                padding: "8px",
                display: "flex",
                gap: "8px",
                justifyContent: "center",
              }}
            >
              <ArrowUpCircle size={16} /> Add
            </button>
            <button
              type="button"
              className={`admin-btn ${operation === "subtract" ? "" : "admin-btn-outline"}`}
              onClick={() => setOperation("subtract")}
              style={{
                padding: "8px",
                display: "flex",
                gap: "8px",
                justifyContent: "center",
                borderColor: operation === "subtract" ? "#dc2626" : "",
                backgroundColor: operation === "subtract" ? "#fef2f2" : "",
                color: operation === "subtract" ? "#dc2626" : "",
              }}
            >
              <ArrowDownCircle size={16} /> Subtract
            </button>
          </div>

          <div className="form-group" style={{ marginTop: "8px" }}>
            <label>Quantity to {operation}</label>
            <input
              type="number"
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              placeholder="0"
              min="1"
              required
            />
          </div>

          <div className="form-group">
            <label>Reason (Optional)</label>
            <input
              type="text"
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              placeholder={
                operation === "add"
                  ? "e.g., Restock from supplier"
                  : "e.g., Damaged item"
              }
            />
          </div>

          <div className="modal-footer" style={{ marginTop: "16px" }}>
            <button
              type="button"
              className="admin-btn admin-btn-outline"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="admin-btn" disabled={loading}>
              {loading ? (
                <Loader2 size={15} className="spin" />
              ) : (
                "Confirm Update"
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

const Inventory = () => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [toast, setToast] = useState(null);

  // itemToAdjust will hold the specific product or variant object we are editing
  const [itemToAdjust, setItemToAdjust] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchInventory = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API}/products?limit=100`);
      setProducts(res.data.data?.products || []);
    } catch (error) {
      console.error("Failed to fetch inventory", error);
      showToast("Failed to load inventory", "error");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchInventory();
  }, [fetchInventory]);

  const handleStockSuccess = (msg) => {
    setItemToAdjust(null);
    showToast(msg, "success");
    fetchInventory();
  };

  const filtered = products.filter(
    (p) =>
      p.title?.toLowerCase().includes(search.toLowerCase()) ||
      p.sku?.toLowerCase().includes(search.toLowerCase()),
  );

  // Flatten the list so that variants show up as individual rows under their parent product if needed,
  // or we can just render them hierarchically in the table.

  return (
    <div className="admin-page">
      <Toast toast={toast} onClose={() => setToast(null)} />

      {itemToAdjust && (
        <AdjustStockModal
          item={itemToAdjust}
          onClose={() => setItemToAdjust(null)}
          onSuccess={handleStockSuccess}
        />
      )}

      <div className="page-header">
        <div>
          <h2>Inventory Management</h2>
          <p className="page-subtitle">
            Track and adjust stock levels across all products and variants.
          </p>
        </div>
        <div className="header-actions">
          <div className="toolbar-search" style={{ width: 300 }}>
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search products or SKU..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
        </div>
      </div>

      <div className="admin-table-card">
        {loading ? (
          <div className="admin-loading-state">
            <Loader2 size={24} className="spin" /> Loading inventory...
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <Package size={40} className="empty-icon" />
            <h3>No inventory found</h3>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>Product / Variant</th>
                <th>SKU</th>
                <th>Status</th>
                <th>Available</th>
                <th style={{ textAlign: "right" }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((product) => {
                const hasVariants =
                  product.variants && product.variants.length > 0;

                // If it has variants, we render a row for the parent (read-only total) and rows for variants
                // If no variants, just render the product row

                const rows = [];

                if (hasVariants) {
                  // Parent row
                  const totalStock = product.variants.reduce(
                    (sum, v) => sum + v.stock,
                    0,
                  );
                  rows.push(
                    <tr
                      key={`p-${product.id}`}
                      style={{ backgroundColor: "#f8fafc" }}
                    >
                      <td>
                        <div className="product-cell">
                          <img
                            src={product.images?.[0]?.url || "/placeholder.png"}
                            alt=""
                            className="product-thumb"
                          />
                          <div className="product-info">
                            <span
                              className="product-title"
                              style={{ fontWeight: 600 }}
                            >
                              {product.title}
                            </span>
                            <span className="product-sku">
                              {product.variants.length} Variants
                            </span>
                          </div>
                        </div>
                      </td>
                      <td>—</td>
                      <td>
                        {totalStock > 0 ? (
                          <span className="status-badge status-completed">
                            In Stock
                          </span>
                        ) : (
                          <span className="status-badge status-cancelled">
                            Out of Stock
                          </span>
                        )}
                      </td>
                      <td style={{ fontWeight: 600 }}>{totalStock}</td>
                      <td
                        style={{
                          textAlign: "right",
                          color: "var(--admin-text-muted)",
                          fontSize: "0.85rem",
                        }}
                      >
                        Adjust variants ↓
                      </td>
                    </tr>,
                  );

                  // Variant rows
                  product.variants.forEach((variant) => {
                    const variantName =
                      [variant.size, variant.color, variant.material]
                        .filter(Boolean)
                        .join(" • ") || "Default";
                    const isLow = variant.stock > 0 && variant.stock <= 5;
                    const isOut = variant.stock === 0;

                    rows.push(
                      <tr key={`v-${variant.id}`}>
                        <td style={{ paddingLeft: "64px" }}>
                          <div
                            style={{
                              display: "flex",
                              alignItems: "center",
                              gap: "8px",
                            }}
                          >
                            <div
                              style={{
                                width: "6px",
                                height: "6px",
                                borderRadius: "50%",
                                backgroundColor: "var(--admin-border)",
                              }}
                            ></div>
                            <span
                              style={{
                                fontSize: "0.9rem",
                                color: "var(--admin-text-main)",
                              }}
                            >
                              {variantName}
                            </span>
                          </div>
                        </td>
                        <td
                          style={{
                            fontFamily: "monospace",
                            fontSize: "0.85rem",
                          }}
                        >
                          {variant.sku || "—"}
                        </td>
                        <td>
                          {isOut ? (
                            <span className="status-badge status-cancelled">
                              Out of Stock
                            </span>
                          ) : isLow ? (
                            <span
                              className="status-badge status-pending"
                              style={{
                                backgroundColor: "#fef9c3",
                                color: "#a16207",
                              }}
                            >
                              <AlertTriangle
                                size={12}
                                style={{ marginRight: "4px" }}
                              />{" "}
                              Low Stock
                            </span>
                          ) : (
                            <span className="status-badge status-completed">
                              In Stock
                            </span>
                          )}
                        </td>
                        <td
                          style={{
                            fontWeight: 500,
                            color: isOut
                              ? "#dc2626"
                              : isLow
                                ? "#a16207"
                                : "inherit",
                          }}
                        >
                          {variant.stock}
                        </td>
                        <td style={{ textAlign: "right" }}>
                          <button
                            className="admin-btn-outline"
                            style={{
                              padding: "4px 12px",
                              fontSize: "0.8rem",
                              height: "auto",
                            }}
                            onClick={() =>
                              setItemToAdjust({
                                productId: product.id,
                                variantId: variant.id,
                                name: `${product.title} - ${variantName}`,
                                sku: variant.sku,
                                currentStock: variant.stock,
                              })
                            }
                          >
                            Adjust
                          </button>
                        </td>
                      </tr>,
                    );
                  });
                } else {
                  // No variants, single product row
                  const isLow = product.stock > 0 && product.stock <= 5;
                  const isOut = product.stock === 0;

                  rows.push(
                    <tr key={`p-${product.id}`}>
                      <td>
                        <div className="product-cell">
                          <img
                            src={product.images?.[0]?.url || "/placeholder.png"}
                            alt=""
                            className="product-thumb"
                          />
                          <div className="product-info">
                            <span className="product-title">
                              {product.title}
                            </span>
                          </div>
                        </div>
                      </td>
                      <td
                        style={{ fontFamily: "monospace", fontSize: "0.85rem" }}
                      >
                        {product.sku || "—"}
                      </td>
                      <td>
                        {isOut ? (
                          <span className="status-badge status-cancelled">
                            Out of Stock
                          </span>
                        ) : isLow ? (
                          <span
                            className="status-badge status-pending"
                            style={{
                              backgroundColor: "#fef9c3",
                              color: "#a16207",
                            }}
                          >
                            <AlertTriangle
                              size={12}
                              style={{ marginRight: "4px" }}
                            />{" "}
                            Low Stock
                          </span>
                        ) : (
                          <span className="status-badge status-completed">
                            In Stock
                          </span>
                        )}
                      </td>
                      <td
                        style={{
                          fontWeight: 500,
                          color: isOut
                            ? "#dc2626"
                            : isLow
                              ? "#a16207"
                              : "inherit",
                        }}
                      >
                        {product.stock}
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <button
                          className="admin-btn-outline"
                          style={{
                            padding: "4px 12px",
                            fontSize: "0.8rem",
                            height: "auto",
                          }}
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
                    </tr>,
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
