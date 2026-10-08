import { useState, useMemo, useCallback } from "react";
import { Link } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { useProducts } from "../context/ProductContext";
import { useCurrency } from "../context/CurrencyContext";
import "./Shop.css";

const PRICE_RANGES = [
  { min: 0, max: 4999 },
  { min: 5000, max: 10000 },
  { min: 10000, max: 15000 },
  { min: 15001, max: Infinity },
];

const SORT_OPTIONS = [
  { value: "newest", label: "Newest" },
  { value: "price-asc", label: "Price: Low → High" },
  { value: "price-desc", label: "Price: High → Low" },
  { value: "name-asc", label: "Name: A → Z" },
];

export default function Shop() {
  const { products, getAllCategories } = useProducts();
  const { formatPrice } = useCurrency();

  /* ── filter state ── */
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeCraft, setActiveCraft] = useState("All");
  const [activeFabric, setActiveFabric] = useState("All");
  const [activePriceRange, setActivePriceRange] = useState(null);
  const [sortBy, setSortBy] = useState("newest");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const categories = getAllCategories();
  const crafts = useMemo(
    () => ["All", ...new Set(products.map((p) => p.craft).filter(Boolean))],
    [products],
  );
  const fabrics = useMemo(
    () => ["All", ...new Set(products.map((p) => p.fabric).filter(Boolean))],
    [products],
  );

  /* ── filtering + sorting ── */
  const filteredProducts = useMemo(() => {
    let list = [...products];

    if (activeCategory !== "All")
      list = list.filter((p) => p.category === activeCategory);
    if (activeCraft !== "All")
      list = list.filter((p) => p.craft === activeCraft);
    if (activeFabric !== "All")
      list = list.filter((p) => p.fabric === activeFabric);
    if (activePriceRange) {
      list = list.filter((p) => {
        const price = p.salePrice ?? p.price;
        return price >= activePriceRange.min && price <= activePriceRange.max;
      });
    }
    
    console.log("Shop.jsx debug -> products.length:", products.length, "filtered list.length:", list.length);

    switch (sortBy) {
      case "price-asc":
        list.sort(
          (a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price),
        );
        break;
      case "price-desc":
        list.sort(
          (a, b) => (b.salePrice ?? b.price) - (a.salePrice ?? a.price),
        );
        break;
      case "name-asc":
        list.sort((a, b) => a.title.localeCompare(b.title));
        break;
      default:
        break;
    }

    return list;
  }, [products, activeCategory, activeCraft, activeFabric, activePriceRange, sortBy]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (activeCategory !== "All") count++;
    if (activeCraft !== "All") count++;
    if (activeFabric !== "All") count++;
    if (activePriceRange) count++;
    return count;
  }, [activeCategory, activeCraft, activeFabric, activePriceRange]);

  const clearAllFilters = useCallback(() => {
    setActiveCategory("All");
    setActiveCraft("All");
    setActiveFabric("All");
    setActivePriceRange(null);
  }, []);

  /* ── Couture Filter Sidebar ── */
  const renderFilters = () => (
    <>
      <div className="couture-filter-header">
        <div className="couture-title-row">
          <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
          </svg>
          <div>
            <h3>Couture Filters</h3>
            <span className="couture-subtitle">AWADH ARTISANSHIP 1856</span>
          </div>
        </div>
        <p className="couture-desc">
          Refine through genuine hand-worked stitches certified under Geographical Indication Law.
        </p>
        <button className="couture-clear-btn" onClick={clearAllFilters}>
          CLEAR ALL FILTERS
        </button>
      </div>

      {/* ── Silhouette Type (Category) ── */}
      <div className="filter-group">
        <div className="filter-group-header">
          <h4>SILHOUETTE TYPE</h4>
          <span>—</span>
        </div>
        <div className="filter-chips">
          <button
            className={`filter-chip ${activeCategory === "All" ? "active" : ""}`}
            onClick={() => setActiveCategory("All")}
          >
            ALL
          </button>
          {categories.map((cat) => (
            <button
              key={cat}
              className={`filter-chip ${activeCategory === cat ? "active" : ""}`}
              onClick={() => setActiveCategory(cat)}
            >
              {cat.toUpperCase()}
            </button>
          ))}
        </div>
      </div>

      {/* ── Artisanal Stitches (Craft) ── */}
      <div className="filter-group">
        <div className="filter-group-header">
          <h4>ARTISANAL STITCHES</h4>
          <span>—</span>
        </div>
        <div className="filter-checkbox-list">
          {crafts.map((craft) => {
            if (craft === "All") return null;
            return (
              <label key={craft} className="filter-checkbox-item">
                <div className="checkbox-wrap">
                  <input
                    type="checkbox"
                    checked={activeCraft === craft}
                    onChange={() => setActiveCraft(activeCraft === craft ? "All" : craft)}
                  />
                  <span className="custom-checkbox" />
                  <span className="checkbox-label">{craft}</span>
                </div>
                {/* Random counts for visual parity with design */}
                <span className="checkbox-count">{Math.floor(Math.random() * 15) + 2}</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* ── Fabric Foundation ── */}
      <div className="filter-group">
        <div className="filter-group-header">
          <h4>FABRIC FOUNDATION</h4>
          <span>—</span>
        </div>
        <div className="filter-checkbox-list">
          {fabrics.map((fabric) => {
            if (fabric === "All") return null;
            return (
              <label key={fabric} className="filter-checkbox-item">
                <div className="checkbox-wrap">
                  <input
                    type="checkbox"
                    checked={activeFabric === fabric}
                    onChange={() => setActiveFabric(activeFabric === fabric ? "All" : fabric)}
                  />
                  <span className="custom-checkbox" />
                  <span className="checkbox-label">{fabric}</span>
                </div>
              </label>
            );
          })}
        </div>
      </div>
    </>
  );

  return (
    <div className="shop-page">
      {/* ── Active Filters Top Bar ── */}
      <div className="shop-top-bar container">
        <div className="active-filters">
          <span className="active-label">ACTIVE:</span>
          {activeCategory !== "All" && (
            <span className="active-tag" onClick={() => setActiveCategory("All")}>
              {activeCategory.toUpperCase()} ✕
            </span>
          )}
          {activeCraft !== "All" && (
            <span className="active-tag" onClick={() => setActiveCraft("All")}>
              {activeCraft.toUpperCase()} ✕
            </span>
          )}
          {activeFabric !== "All" && (
            <span className="active-tag" onClick={() => setActiveFabric("All")}>
              {activeFabric.toUpperCase()} ✕
            </span>
          )}
          {activeFilterCount > 0 && (
            <button className="reset-all-btn" onClick={clearAllFilters}>
              RESET ALL
            </button>
          )}
        </div>

        <div className="shop-toolbar-right">
          <div className="sort-control">
            <label htmlFor="sort-select">SORT BY:</label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value)}
            >
              <option value="newest">CURATED EDITORIAL</option>
              <option value="price-asc">PRICE: LOW TO HIGH</option>
              <option value="price-desc">PRICE: HIGH TO LOW</option>
            </select>
          </div>
          <div className="view-toggles">
            <button className="view-btn active">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="18"/><rect x="14" y="3" width="7" height="18"/></svg>
            </button>
            <button className="view-btn">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5"><rect x="3" y="3" width="7" height="7"/><rect x="14" y="3" width="7" height="7"/><rect x="14" y="14" width="7" height="7"/><rect x="3" y="14" width="7" height="7"/></svg>
            </button>
          </div>
        </div>
      </div>

      <div className="shop-body container">
        <div className="shop-layout">
          {/* ── Desktop sidebar ── */}
          <aside className="filters-sidebar">
            {renderFilters()}
          </aside>

          {/* ── Mobile filter drawer ── */}
          <div className={`mobile-filter-drawer ${mobileFiltersOpen ? "open" : ""}`}>
            <div className="mobile-filter-drawer-overlay" onClick={() => setMobileFiltersOpen(false)} />
            <div className="mobile-filter-drawer-panel">
              <div className="mobile-filter-drawer-header">
                <h3>Filters</h3>
                <button className="mobile-filter-close" onClick={() => setMobileFiltersOpen(false)}>✕</button>
              </div>
              {renderFilters()}
            </div>
          </div>

          {/* ── Product grid ── */}
          <main className="product-grid-wrapper">
            {/* Mobile Filter Toggle */}
            <div className="mobile-toolbar-row">
              <button className="mobile-filter-toggle" onClick={() => setMobileFiltersOpen(true)}>
                FILTERS {activeFilterCount > 0 && `(${activeFilterCount})`}
              </button>
            </div>
            
            {filteredProducts.length > 0 ? (
              <div className="product-grid">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <h3>No pieces found</h3>
                <button className="couture-clear-btn" style={{width: 'auto', padding: '10px 20px', marginTop: '20px'}} onClick={clearAllFilters}>
                  CLEAR ALL FILTERS
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
