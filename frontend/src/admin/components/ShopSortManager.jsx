import React, { useState, useEffect } from "react";
import {
  ArrowUpDown,
  MoveUp,
  MoveDown,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Save,
  Sparkles,
  Layers,
  HelpCircle,
  ExternalLink,
  Eye,
} from "lucide-react";
import { useProducts, DEFAULT_SHOP_SORT_SETTINGS, sortProductsByMode } from "../../context/ProductContext";
import "./ShopSortManager.css";

const SORT_MODE_OPTIONS = [
  {
    id: "category_first_manual",
    name: "Category First + Manual Priority (Recommended)",
    description:
      "Displays products grouped by your category sequence (e.g. Sarees → Dupattas → Kurta Sets). Within each category, products with manual priority appear first, followed by newest arrivals.",
  },
  {
    id: "category_newest",
    name: "Category First + Newest First",
    description:
      "Displays products grouped by your category sequence. Within each category, newest products appear first.",
  },
  {
    id: "category_oldest",
    name: "Category First + Oldest First",
    description:
      "Displays products grouped by your category sequence. Within each category, oldest products appear first.",
  },
  {
    id: "manual_priority",
    name: "Manual Priority Only (Storewide)",
    description:
      "Ignores categories and ranks all products strictly by their manual priority number across the entire store.",
  },
  {
    id: "newest_first",
    name: "Newest First (Storewide)",
    description:
      "Lists all products strictly by creation date, newest first, across all categories.",
  },
  {
    id: "oldest_first",
    name: "Oldest First (Storewide)",
    description:
      "Lists all products strictly by creation date, oldest first, across all categories.",
  },
];

export default function ShopSortManager() {
  const { products, shopSortSettings, updateShopSortSettings } = useProducts();

  const [sortMode, setSortMode] = useState(
    shopSortSettings?.sortMode || "category_first_manual"
  );
  const [categoriesOrder, setCategoriesOrder] = useState(
    shopSortSettings?.categoryOrder || [
      "Sarees",
      "Dupattas",
      "Kurta Sets",
      "Blouses",
      "Others",
    ]
  );
  const [saving, setSaving] = useState(false);
  const [feedback, setFeedback] = useState({ type: "", message: "" });
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    if (shopSortSettings) {
      if (shopSortSettings.sortMode) setSortMode(shopSortSettings.sortMode);
      if (Array.isArray(shopSortSettings.categoryOrder)) {
        setCategoriesOrder(shopSortSettings.categoryOrder);
      }
    }
  }, [shopSortSettings]);

  const moveCategory = (index, direction) => {
    const targetIndex = index + direction;
    if (targetIndex < 0 || targetIndex >= categoriesOrder.length) return;
    const newOrder = [...categoriesOrder];
    const [moved] = newOrder.splice(index, 1);
    newOrder.splice(targetIndex, 0, moved);
    setCategoriesOrder(newOrder);
  };

  const handleResetToDefault = () => {
    setSortMode(DEFAULT_SHOP_SORT_SETTINGS.sortMode);
    setCategoriesOrder([...DEFAULT_SHOP_SORT_SETTINGS.categoryOrder]);
    setFeedback({
      type: "info",
      message: "Reset to default sequence. Click 'Save Configuration' to apply.",
    });
  };

  const handleSave = async () => {
    setSaving(true);
    setFeedback({ type: "", message: "" });
    try {
      await updateShopSortSettings({
        sortMode,
        categoryOrder: categoriesOrder,
      });
      setFeedback({
        type: "success",
        message: "Shop sorting configuration saved and applied to storefront!",
      });
      setTimeout(() => setFeedback({ type: "", message: "" }), 4000);
    } catch (err) {
      setFeedback({
        type: "error",
        message: "Failed to save configuration. Please try again.",
      });
    } finally {
      setSaving(false);
    }
  };

  // Preview products sorted with current form state
  const activeProducts = products.filter((p) => !p.isArchived);
  const sortedPreview = sortProductsByMode(
    activeProducts,
    sortMode,
    categoriesOrder
  ).slice(0, 10);

  return (
    <div className="shop-sort-manager">
      {/* Header card */}
      <div className="admin-card header-card">
        <div className="header-info">
          <div className="header-icon-wrap">
            <ArrowUpDown size={22} className="header-icon" />
          </div>
          <div>
            <h3 className="card-heading" style={{ margin: 0 }}>
              Storefront Shop Ordering &amp; Category Sequence
            </h3>
            <p className="card-subheading">
              Configure how creations appear when customers visit the{" "}
              <strong>Safed Rang Shop</strong>. Changes synchronize immediately.
            </p>
          </div>
        </div>

        <div className="header-actions">
          <button
            type="button"
            className="admin-btn admin-btn-outline icon-left"
            onClick={() => setShowPreview(!showPreview)}
          >
            <Eye size={15} />
            {showPreview ? "Hide Preview" : "Preview Top 10"}
          </button>
          <button
            type="button"
            className="admin-btn icon-left"
            onClick={handleSave}
            disabled={saving}
          >
            <Save size={15} />
            {saving ? "Saving…" : "Save Configuration"}
          </button>
        </div>
      </div>

      {feedback.message && (
        <div
          className={`settings-banner ${
            feedback.type === "success"
              ? "settings-banner--success"
              : feedback.type === "error"
              ? "settings-banner--error"
              : "settings-banner--info"
          }`}
          style={{ marginBottom: "20px" }}
        >
          {feedback.type === "success" ? (
            <CheckCircle2 size={16} />
          ) : (
            <AlertCircle size={16} />
          )}
          <span>{feedback.message}</span>
        </div>
      )}

      {/* Grid: 2 Columns */}
      <div className="sort-grid">
        {/* Left column: Sort Mode & Product Priority Helper */}
        <div className="sort-grid-col">
          <div className="admin-card">
            <h4 className="section-title">
              <Layers size={17} /> 1. Select Storefront Sorting Mode
            </h4>
            <p className="section-hint">
              This governs the default order when shoppers browse the main Shop page.
            </p>

            <div className="sort-mode-list">
              {SORT_MODE_OPTIONS.map((opt) => {
                const isSelected = sortMode === opt.id;
                return (
                  <label
                    key={opt.id}
                    className={`sort-mode-option ${
                      isSelected ? "selected" : ""
                    }`}
                  >
                    <input
                      type="radio"
                      name="shopSortMode"
                      value={opt.id}
                      checked={isSelected}
                      onChange={() => setSortMode(opt.id)}
                    />
                    <div className="mode-content">
                      <span className="mode-name">{opt.name}</span>
                      <p className="mode-desc">{opt.description}</p>
                    </div>
                  </label>
                );
              })}
            </div>
          </div>

          <div className="admin-card helper-card">
            <h4 className="section-title">
              <Sparkles size={17} /> 2. Individual Product Display Priority
            </h4>
            <p className="helper-text">
              To boost specific products to the very top of their category, open the product in{" "}
              <strong>Admin &gt; Products</strong> and set its{" "}
              <strong>Shop Display Priority</strong> number:
            </p>
            <ul className="helper-list">
              <li>
                <strong>Priority 1, 2, 3...</strong>: Lower numbers appear first (e.g. 1 is the highest priority).
              </li>
              <li>
                <strong>Priority 0 (or empty)</strong>: Standard ordering (chronological / newly added pieces).
              </li>
              <li>
                Prioritised products automatically appear first within their category.
              </li>
            </ul>
            <div style={{ marginTop: "14px" }}>
              <a
                href="/admin/products"
                className="admin-btn admin-btn-outline icon-left"
                style={{ fontSize: "0.82rem", padding: "6px 14px", display: "inline-flex" }}
              >
                Go to Products List <ExternalLink size={13} />
              </a>
            </div>
          </div>
        </div>

        {/* Right column: Category Ordering Sequence */}
        <div className="sort-grid-col">
          <div className="admin-card">
            <div className="card-top-row">
              <div>
                <h4 className="section-title">
                  <ArrowUpDown size={17} /> 3. Category Sequence
                </h4>
                <p className="section-hint">
                  When using <em>Category First</em> mode, products appear in this exact category sequence.
                </p>
              </div>
              <button
                type="button"
                className="admin-btn admin-btn-outline icon-left reset-btn"
                onClick={handleResetToDefault}
                title="Reset to Sarees → Dupattas → Kurta Sets → Blouses → Others"
              >
                <RotateCcw size={13} /> Reset
              </button>
            </div>

            <div className="category-sequence-list">
              {categoriesOrder.map((catName, idx) => {
                const count = activeProducts.filter((p) => {
                  const pCat = (p.category || "").toLowerCase();
                  const c = catName.toLowerCase();
                  return pCat.includes(c) || c.includes(pCat);
                }).length;

                return (
                  <div key={catName} className="sequence-row">
                    <div className="sequence-rank">
                      <span>#{idx + 1}</span>
                    </div>

                    <div className="sequence-info">
                      <strong className="sequence-name">{catName}</strong>
                      <span className="sequence-count">
                        {count} active {count === 1 ? "product" : "products"}
                      </span>
                    </div>

                    <div className="sequence-controls">
                      <button
                        type="button"
                        className="move-btn"
                        onClick={() => moveCategory(idx, -1)}
                        disabled={idx === 0}
                        title="Move Up"
                        aria-label={`Move ${catName} up`}
                      >
                        <MoveUp size={15} />
                      </button>
                      <button
                        type="button"
                        className="move-btn"
                        onClick={() => moveCategory(idx, 1)}
                        disabled={idx === categoriesOrder.length - 1}
                        title="Move Down"
                        aria-label={`Move ${catName} down`}
                      >
                        <MoveDown size={15} />
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="sequence-footer">
              <p className="footer-note">
                Tip: If you're running a festive Dupatta or Kurta Set campaign, move that category to position #1 to greet visitors with that collection first.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Live Preview Modal / Drawer */}
      {showPreview && (
        <div className="admin-card preview-card">
          <div className="preview-header">
            <div>
              <h4 className="section-title">
                <Eye size={17} /> Live Storefront Sequence Preview (Top 10)
              </h4>
              <p className="section-hint">
                Calculated in real-time based on active mode:{" "}
                <strong>{sortMode}</strong> and current category sequence.
              </p>
            </div>
            <button
              type="button"
              className="admin-btn admin-btn-outline"
              onClick={() => setShowPreview(false)}
            >
              Close
            </button>
          </div>

          <div className="preview-table-wrap">
            <table className="admin-table preview-table">
              <thead>
                <tr>
                  <th width="50">Pos</th>
                  <th>Product</th>
                  <th>Category</th>
                  <th>Priority</th>
                  <th>Price</th>
                </tr>
              </thead>
              <tbody>
                {sortedPreview.map((item, idx) => (
                  <tr key={item.id}>
                    <td className="font-medium text-muted">#{idx + 1}</td>
                    <td>
                      <div className="preview-product-cell">
                        {item.image && (
                          <img
                            src={item.image}
                            alt=""
                            className="preview-thumb"
                          />
                        )}
                        <div>
                          <strong className="preview-title">{item.title}</strong>
                          {item.badge && (
                            <span className="preview-badge">{item.badge}</span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td>
                      <span className="category-badge">{item.category}</span>
                    </td>
                    <td>
                      {item.displayOrder > 0 ? (
                        <span className="priority-pill">
                          Priority #{item.displayOrder}
                        </span>
                      ) : (
                        <span className="text-muted">Standard (0)</span>
                      )}
                    </td>
                    <td className="font-medium">₹{item.salePrice || item.price}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );
}
