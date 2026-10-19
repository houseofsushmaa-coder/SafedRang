import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { Link, useSearchParams } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { useProducts } from "../context/ProductContext";
import { useCurrency } from "../context/CurrencyContext";
import "./Shop.css";

const SORT_OPTIONS = [
  { value: "newest", label: "New Arrivals" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "name-asc", label: "Alphabetical: A → Z" },
];

const PRICE_RANGES = [
  { id: "under-5k", min: 0, max: 4999, label: "Under ₹5,000" },
  { id: "5k-10k", min: 5000, max: 10000, label: "₹5,000 – ₹10,000" },
  { id: "10k-15k", min: 10000, max: 15000, label: "₹10,000 – ₹15,000" },
  { id: "above-15k", min: 15001, max: Infinity, label: "₹15,000 & Above" },
];

const SAREE_SUBCATEGORIES = [
  { id: "All", label: "All Sarees" },
  { id: "Chikankari", label: "Chikankari" },
  { id: "Zardozi", label: "Zardozi" },
  { id: "One of One", label: "One of One" },
];

function matchesSubcategory(product, subcategory) {
  if (!subcategory || subcategory === "All") return true;

  const target = subcategory.toLowerCase().trim();
  const title = (product.title || "").toLowerCase();
  const desc = (product.description || "").toLowerCase();
  const craft = (product.craft || "").toLowerCase();
  const subcat = (product.subcategory || "").toLowerCase();
  const combined = `${title} ${desc} ${craft} ${subcat}`;

  if (target === "zardozi") {
    return (
      subcat === "zardozi" ||
      craft.includes("zardozi") ||
      combined.includes("zardozi")
    );
  }

  if (target === "chikankari") {
    return (
      subcat === "chikankari" ||
      craft.includes("chikankari") ||
      combined.includes("chikankari") ||
      combined.includes("tepchi") ||
      combined.includes("mukaish") ||
      combined.includes("bakhiya") ||
      craft === "lucknowi chikankari"
    );
  }

  if (target === "one of one" || target === "one-of-one") {
    return (
      Boolean(product.isOneOfOne) ||
      subcat.includes("one of one") ||
      subcat.includes("one-of-one") ||
      combined.includes("one of one") ||
      combined.includes("one-of-one") ||
      combined.includes("exclusive") ||
      combined.includes("masterpiece") ||
      product.price >= 14000
    );
  }

  return subcat === target || combined.includes(target);
}

/* ── Custom Luxury Sort Dropdown ── */
function CustomSortDropdown({ value, onChange, options }) {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  const selectedOption =
    options.find((opt) => opt.value === value) || options[0];

  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    function handleKeyDown(event) {
      if (event.key === "Escape") {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    document.addEventListener("keydown", handleKeyDown);
    return () => {
      document.removeEventListener("mousedown", handleClickOutside);
      document.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  return (
    <div className="custom-sort-dropdown" ref={dropdownRef}>
      <span className="sort-label">SORT BY:</span>
      <button
        type="button"
        className={`sort-trigger ${isOpen ? "open" : ""}`}
        onClick={() => setIsOpen((prev) => !prev)}
        aria-haspopup="listbox"
        aria-expanded={isOpen}
      >
        <span className="sort-trigger-text">{selectedOption.label}</span>
        <svg
          className={`sort-chevron ${isOpen ? "rotate" : ""}`}
          width="10"
          height="6"
          viewBox="0 0 10 6"
          fill="none"
        >
          <path
            d="M1 1L5 5L9 1"
            stroke="currentColor"
            strokeWidth="1.5"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </button>

      {isOpen && (
        <ul className="sort-menu" role="listbox">
          {options.map((opt) => {
            const isSelected = opt.value === value;
            return (
              <li
                key={opt.value}
                className={`sort-menu-item ${isSelected ? "selected" : ""}`}
                role="option"
                aria-selected={isSelected}
                onClick={() => {
                  onChange(opt.value);
                  setIsOpen(false);
                }}
              >
                <span>{opt.label}</span>
                {isSelected && (
                  <svg
                    className="sort-checkmark"
                    width="14"
                    height="14"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2.5"
                  >
                    <polyline points="20 6 9 17 4 12" />
                  </svg>
                )}
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

export default function Shop() {
  const { products, getAllCategories } = useProducts();
  const { formatPrice } = useCurrency();
  const [searchParams, setSearchParams] = useSearchParams();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  const urlSearch = searchParams.get("search") || "";
  const urlCategory = searchParams.get("category") || "";
  const urlSubcategory = searchParams.get("subcategory") || searchParams.get("sub") || "";
  const urlCraft = searchParams.get("craft") || "";
  const urlFabric = searchParams.get("fabric") || "";

  const categories = getAllCategories();

  /* ── Filter state ── */
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeSubcategory, setActiveSubcategory] = useState("All");
  const [activeCraft, setActiveCraft] = useState("All");
  const [activeFabric, setActiveFabric] = useState("All");
  const [activePriceRange, setActivePriceRange] = useState(null);
  const [activeAvailability, setActiveAvailability] = useState("All"); // "All" | "in-stock" | "sold-out"
  const [sortBy, setSortBy] = useState("newest");
  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  // Sync URL params to filter state
  useEffect(() => {
    if (urlCategory) {
      const cleanUrlCat = urlCategory.toLowerCase().replace(/[\s-_+]+/g, "");
      const matched = categories.find(
        (c) =>
          c.toLowerCase() === urlCategory.toLowerCase() ||
          c.toLowerCase().replace(/[\s-_+]+/g, "") === cleanUrlCat ||
          c.toLowerCase().includes(urlCategory.toLowerCase()) ||
          urlCategory.toLowerCase().includes(c.toLowerCase())
      );
      if (matched) {
        setActiveCategory(matched);
      } else {
        setActiveCategory(urlCategory);
      }
    } else {
      setActiveCategory("All");
    }

    if (urlSubcategory) {
      const matchedSub = SAREE_SUBCATEGORIES.find(
        (s) => s.id.toLowerCase() === urlSubcategory.toLowerCase()
      );
      setActiveSubcategory(matchedSub ? matchedSub.id : urlSubcategory);
    } else {
      setActiveSubcategory("All");
    }

    if (urlCraft) {
      setActiveCraft(urlCraft);
    } else {
      setActiveCraft("All");
    }

    if (urlFabric) {
      setActiveFabric(urlFabric);
    } else {
      setActiveFabric("All");
    }
  }, [urlCategory, urlSubcategory, urlCraft, urlFabric, categories]);

  /* ── Derived lists of crafts & fabrics ── */
  const crafts = useMemo(
    () => ["All", ...new Set(products.map((p) => p.craft).filter(Boolean))],
    [products]
  );
  const fabrics = useMemo(
    () => ["All", ...new Set(products.map((p) => p.fabric).filter(Boolean))],
    [products]
  );

  /* ── Real calculated counts (NO Math.random!) ── */
  const categoryCounts = useMemo(() => {
    const counts = {};
    products.forEach((p) => {
      const cat = p.category || "Uncategorized";
      counts[cat] = (counts[cat] || 0) + 1;
    });
    return counts;
  }, [products]);

  const craftCounts = useMemo(() => {
    const counts = {};
    products.forEach((p) => {
      if (p.craft) {
        counts[p.craft] = (counts[p.craft] || 0) + 1;
      }
    });
    return counts;
  }, [products]);

  const fabricCounts = useMemo(() => {
    const counts = {};
    products.forEach((p) => {
      if (p.fabric) {
        counts[p.fabric] = (counts[p.fabric] || 0) + 1;
      }
    });
    return counts;
  }, [products]);

  const priceRangeCounts = useMemo(() => {
    const counts = {};
    PRICE_RANGES.forEach((range) => {
      counts[range.id] = products.filter((p) => {
        const price = p.salePrice ?? p.price;
        return price >= range.min && price <= range.max;
      }).length;
    });
    return counts;
  }, [products]);

  const stockCounts = useMemo(() => {
    const inStock = products.filter(
      (p) => p.stockStatus !== "Sold Out" && p.stockStatus !== "Out of Stock"
    ).length;
    const soldOut = products.length - inStock;
    return { inStock, soldOut };
  }, [products]);

  const sareeSubcategoryCounts = useMemo(() => {
    const sarees = products.filter(
      (p) =>
        (p.category || "").toLowerCase() === "sarees" ||
        (p.category || "").toLowerCase().includes("saree")
    );
    return {
      All: sarees.length,
      Chikankari: sarees.filter((s) => matchesSubcategory(s, "Chikankari")).length,
      Zardozi: sarees.filter((s) => matchesSubcategory(s, "Zardozi")).length,
      "One of One": sarees.filter((s) => matchesSubcategory(s, "One of One")).length,
    };
  }, [products]);

  const isSareeActive =
    activeCategory === "Sarees" ||
    activeCategory.toLowerCase().includes("saree");

  /* ── Filtering + Sorting ── */
  const filteredProducts = useMemo(() => {
    let list = [...products];

    // Filter by search query
    if (urlSearch.trim()) {
      const q = urlSearch.toLowerCase().trim();
      list = list.filter(
        (p) =>
          (p.title || "").toLowerCase().includes(q) ||
          (p.description || "").toLowerCase().includes(q) ||
          (p.category || "").toLowerCase().includes(q) ||
          (p.fabric || "").toLowerCase().includes(q) ||
          (p.craft || "").toLowerCase().includes(q)
      );
    }

    // Filter by Category
    if (activeCategory !== "All") {
      list = list.filter((p) => p.category === activeCategory);
    }

    // Filter by Sub-Category
    if (activeSubcategory !== "All") {
      list = list.filter((p) => matchesSubcategory(p, activeSubcategory));
    }

    // Filter by Craft
    if (activeCraft !== "All") {
      list = list.filter((p) => p.craft === activeCraft);
    }

    // Filter by Fabric
    if (activeFabric !== "All") {
      list = list.filter((p) => p.fabric === activeFabric);
    }

    // Filter by Price Range
    if (activePriceRange) {
      list = list.filter((p) => {
        const price = p.salePrice ?? p.price;
        return price >= activePriceRange.min && price <= activePriceRange.max;
      });
    }

    // Filter by Availability
    if (activeAvailability === "in-stock") {
      list = list.filter(
        (p) => p.stockStatus !== "Sold Out" && p.stockStatus !== "Out of Stock"
      );
    } else if (activeAvailability === "sold-out") {
      list = list.filter(
        (p) => p.stockStatus === "Sold Out" || p.stockStatus === "Out of Stock"
      );
    }

    // Sorting
    switch (sortBy) {
      case "price-asc":
        list.sort(
          (a, b) => (a.salePrice ?? a.price) - (b.salePrice ?? b.price)
        );
        break;
      case "price-desc":
        list.sort(
          (a, b) => (b.salePrice ?? b.price) - (a.salePrice ?? a.price)
        );
        break;
      case "name-asc":
        list.sort((a, b) => (a.title || "").localeCompare(b.title || ""));
        break;
      case "newest":
      default:
        list.sort((a, b) =>
          String(b.id || "").localeCompare(String(a.id || ""))
        );
        break;
    }

    return list;
  }, [
    products,
    urlSearch,
    activeCategory,
    activeSubcategory,
    activeCraft,
    activeFabric,
    activePriceRange,
    activeAvailability,
    sortBy,
  ]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (urlSearch) count++;
    if (activeCategory !== "All") count++;
    if (activeSubcategory !== "All") count++;
    if (activeCraft !== "All") count++;
    if (activeFabric !== "All") count++;
    if (activePriceRange) count++;
    if (activeAvailability !== "All") count++;
    return count;
  }, [
    urlSearch,
    activeCategory,
    activeSubcategory,
    activeCraft,
    activeFabric,
    activePriceRange,
    activeAvailability,
  ]);

  const handleCategoryChange = (cat) => {
    setActiveCategory(cat);
    setActiveSubcategory("All");
    const newParams = new URLSearchParams(searchParams);
    if (cat === "All") {
      newParams.delete("category");
    } else {
      newParams.set("category", cat);
    }
    newParams.delete("subcategory");
    newParams.delete("sub");
    setSearchParams(newParams);
  };

  const handleSubcategoryChange = (sub) => {
    setActiveSubcategory(sub);
    const newParams = new URLSearchParams(searchParams);
    if (sub === "All") {
      newParams.delete("subcategory");
      newParams.delete("sub");
    } else {
      newParams.set("subcategory", sub);
    }
    setSearchParams(newParams);
  };

  const clearAllFilters = useCallback(() => {
    setActiveCategory("All");
    setActiveSubcategory("All");
    setActiveCraft("All");
    setActiveFabric("All");
    setActivePriceRange(null);
    setActiveAvailability("All");
    setSearchParams({});
  }, [setSearchParams]);

  /* ── Couture Filter Sidebar ── */
  const renderFilters = () => (
    <>
      {/* ── Clean Minimal Filter Header ── */}
      <div className="filter-sidebar-top">
        <div className="filter-sidebar-title-wrap">
          <span className="filter-sidebar-title">FILTERS</span>
          <span className="filter-sidebar-gem">✦</span>
        </div>
        {activeFilterCount > 0 && (
          <button className="filter-sidebar-reset" onClick={clearAllFilters} title="Reset all active filters">
            RESET ALL ({activeFilterCount})
          </button>
        )}
      </div>

      {/* ── 1. Silhouette / Category ── */}
      <div className="filter-group">
        <div className="filter-group-header">
          <h4>SILHOUETTE / CATEGORY</h4>
          <span className="group-count">{products.length}</span>
        </div>
        <div className="filter-chips">
          <button
            className={`filter-chip ${activeCategory === "All" ? "active" : ""}`}
            onClick={() => handleCategoryChange("All")}
          >
            ALL <span className="chip-count">({products.length})</span>
          </button>
          {categories.map((cat) => {
            if (cat === "All") return null;
            const count = categoryCounts[cat] || 0;
            return (
              <button
                key={cat}
                className={`filter-chip ${activeCategory === cat ? "active" : ""}`}
                onClick={() => handleCategoryChange(cat)}
              >
                {cat.toUpperCase()}{" "}
                <span className="chip-count">({count})</span>
              </button>
            );
          })}
        </div>
        {/* Nested Saree Edit: Appears ONLY when Saree is selected */}
        {isSareeActive && (
          <div className="category-sub-nested">
            <span className="nested-sub-label">Saree Edit:</span>
            <div className="filter-chips">
              {SAREE_SUBCATEGORIES.map((sub) => {
                const isSelected = activeSubcategory === sub.id;
                const count = sareeSubcategoryCounts[sub.id] || 0;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    className={`filter-chip sub-chip ${isSelected ? "active" : ""}`}
                    onClick={() => handleSubcategoryChange(sub.id)}
                  >
                    {sub.label.toUpperCase()}{" "}
                    <span className="chip-count">({count})</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </div>

      {/* ── 2. Artisanal Stitches (Craft) ── */}
      <div className="filter-group">
        <div className="filter-group-header">
          <h4>ARTISANAL CRAFT</h4>
          <span>—</span>
        </div>
        <div className="filter-checkbox-list">
          {crafts.map((craft) => {
            if (craft === "All") return null;
            const count = craftCounts[craft] || 0;
            const isChecked = activeCraft === craft;
            return (
              <label key={craft} className="filter-checkbox-item">
                <div className="checkbox-wrap">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() =>
                      setActiveCraft(isChecked ? "All" : craft)
                    }
                  />
                  <span className="custom-checkbox" />
                  <span className="checkbox-label">{craft}</span>
                </div>
                <span className="checkbox-count">({count})</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* ── 3. Luxury Fabric (Fabric Foundation) ── */}
      <div className="filter-group">
        <div className="filter-group-header">
          <h4>LUXURY FABRIC</h4>
          <span>—</span>
        </div>
        <div className="filter-checkbox-list">
          {fabrics.map((fabric) => {
            if (fabric === "All") return null;
            const count = fabricCounts[fabric] || 0;
            const isChecked = activeFabric === fabric;
            return (
              <label key={fabric} className="filter-checkbox-item">
                <div className="checkbox-wrap">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() =>
                      setActiveFabric(isChecked ? "All" : fabric)
                    }
                  />
                  <span className="custom-checkbox" />
                  <span className="checkbox-label">{fabric}</span>
                </div>
                <span className="checkbox-count">({count})</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* ── 4. Investment / Price Range ── */}
      <div className="filter-group">
        <div className="filter-group-header">
          <h4>PRICE RANGE</h4>
          <span>—</span>
        </div>
        <div className="filter-checkbox-list">
          {PRICE_RANGES.map((range) => {
            const count = priceRangeCounts[range.id] || 0;
            const isSelected = activePriceRange?.id === range.id;
            return (
              <label key={range.id} className="filter-checkbox-item">
                <div className="checkbox-wrap">
                  <input
                    type="checkbox"
                    checked={isSelected}
                    onChange={() =>
                      setActivePriceRange(isSelected ? null : range)
                    }
                  />
                  <span className="custom-checkbox" />
                  <span className="checkbox-label">{range.label}</span>
                </div>
                <span className="checkbox-count">({count})</span>
              </label>
            );
          })}
        </div>
      </div>

      {/* ── 5. Availability ── */}
      <div className="filter-group">
        <div className="filter-group-header">
          <h4>AVAILABILITY</h4>
          <span>—</span>
        </div>
        <div className="filter-checkbox-list">
          <label className="filter-checkbox-item">
            <div className="checkbox-wrap">
              <input
                type="radio"
                name="availability"
                checked={activeAvailability === "All"}
                onChange={() => setActiveAvailability("All")}
              />
              <span className="custom-radio" />
              <span className="checkbox-label">All Creations</span>
            </div>
            <span className="checkbox-count">({products.length})</span>
          </label>
          <label className="filter-checkbox-item">
            <div className="checkbox-wrap">
              <input
                type="radio"
                name="availability"
                checked={activeAvailability === "in-stock"}
                onChange={() =>
                  setActiveAvailability(
                    activeAvailability === "in-stock" ? "All" : "in-stock"
                  )
                }
              />
              <span className="custom-radio" />
              <span className="checkbox-label">Ready to Ship</span>
            </div>
            <span className="checkbox-count">({stockCounts.inStock})</span>
          </label>
          <label className="filter-checkbox-item">
            <div className="checkbox-wrap">
              <input
                type="radio"
                name="availability"
                checked={activeAvailability === "sold-out"}
                onChange={() =>
                  setActiveAvailability(
                    activeAvailability === "sold-out" ? "All" : "sold-out"
                  )
                }
              />
              <span className="custom-radio" />
              <span className="checkbox-label">Archive (Sold Out)</span>
            </div>
            <span className="checkbox-count">({stockCounts.soldOut})</span>
          </label>
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

          {activeFilterCount === 0 && (
            <span className="active-empty-hint">
              ALL CREATIONS ({filteredProducts.length})
            </span>
          )}

          {urlSearch && (
            <span
              className="active-tag"
              onClick={() => {
                const newParams = new URLSearchParams(searchParams);
                newParams.delete("search");
                setSearchParams(newParams);
              }}
              title="Remove search filter"
            >
              SEARCH: &quot;{urlSearch.toUpperCase()}&quot; ✕
            </span>
          )}

          {activeCategory !== "All" && (
            <span
              className="active-tag"
              onClick={() => handleCategoryChange("All")}
              title="Remove category filter"
            >
              CATEGORY: {activeCategory.toUpperCase()} ✕
            </span>
          )}

          {activeSubcategory !== "All" && (
            <span
              className="active-tag"
              onClick={() => handleSubcategoryChange("All")}
              title="Remove subcategory filter"
            >
              SUB-CATEGORY: {activeSubcategory.toUpperCase()} ✕
            </span>
          )}

          {activeCraft !== "All" && (
            <span
              className="active-tag"
              onClick={() => {
                setActiveCraft("All");
                const newParams = new URLSearchParams(searchParams);
                newParams.delete("craft");
                setSearchParams(newParams);
              }}
              title="Remove craft filter"
            >
              CRAFT: {activeCraft.toUpperCase()} ✕
            </span>
          )}

          {activeFabric !== "All" && (
            <span
              className="active-tag"
              onClick={() => {
                setActiveFabric("All");
                const newParams = new URLSearchParams(searchParams);
                newParams.delete("fabric");
                setSearchParams(newParams);
              }}
              title="Remove fabric filter"
            >
              FABRIC: {activeFabric.toUpperCase()} ✕
            </span>
          )}

          {activePriceRange && (
            <span
              className="active-tag"
              onClick={() => setActivePriceRange(null)}
              title="Remove price range filter"
            >
              PRICE: {activePriceRange.label.toUpperCase()} ✕
            </span>
          )}

          {activeAvailability !== "All" && (
            <span
              className="active-tag"
              onClick={() => setActiveAvailability("All")}
              title="Remove availability filter"
            >
              {activeAvailability === "in-stock"
                ? "READY TO SHIP"
                : "ARCHIVE (SOLD OUT)"}{" "}
              ✕
            </span>
          )}

          {activeFilterCount > 0 && (
            <button className="reset-all-btn" onClick={clearAllFilters}>
              RESET ALL ({activeFilterCount})
            </button>
          )}
        </div>

        <div className="shop-toolbar-right">
          <div className="result-count-label">
            <strong>{filteredProducts.length}</strong>{" "}
            {filteredProducts.length === 1 ? "Creation" : "Creations"}
          </div>

          <CustomSortDropdown
            value={sortBy}
            onChange={setSortBy}
            options={SORT_OPTIONS}
          />
        </div>
      </div>

      <div className="shop-body container">
        <div className="shop-layout">
          {/* ── Desktop sidebar ── */}
          <aside className="filters-sidebar">{renderFilters()}</aside>

          {/* ── Mobile filter drawer ── */}
          <div
            className={`mobile-filter-drawer ${
              mobileFiltersOpen ? "open" : ""
            }`}
          >
            <div
              className="mobile-filter-drawer-overlay"
              onClick={() => setMobileFiltersOpen(false)}
            />
            <div className="mobile-filter-drawer-panel">
              <div className="mobile-filter-drawer-header">
                <div>
                  <h3>Filters</h3>
                  <span className="mobile-filter-count">
                    {filteredProducts.length} pieces available
                  </span>
                </div>
                <button
                  className="mobile-filter-close"
                  onClick={() => setMobileFiltersOpen(false)}
                  aria-label="Close filters"
                >
                  ✕
                </button>
              </div>
              <div className="mobile-drawer-scrollable">
                {renderFilters()}
              </div>
              <div className="mobile-drawer-bottom-bar">
                <button
                  className="mobile-apply-btn"
                  onClick={() => setMobileFiltersOpen(false)}
                >
                  VIEW {filteredProducts.length} PIECES
                </button>
              </div>
            </div>
          </div>

          {/* ── Product grid ── */}
          <main className="product-grid-wrapper">
            {/* Mobile Filter Toggle & Sort Row */}
            <div className="mobile-toolbar-row">
              <button
                className="mobile-filter-toggle"
                onClick={() => setMobileFiltersOpen(true)}
              >
                <svg
                  width="14"
                  height="14"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <line x1="4" y1="21" x2="4" y2="14" />
                  <line x1="4" y1="10" x2="4" y2="3" />
                  <line x1="12" y1="21" x2="12" y2="12" />
                  <line x1="12" y1="8" x2="12" y2="3" />
                  <line x1="20" y1="21" x2="20" y2="16" />
                  <line x1="20" y1="12" x2="20" y2="3" />
                  <line x1="1" y1="14" x2="7" y2="14" />
                  <line x1="9" y1="8" x2="15" y2="8" />
                  <line x1="17" y1="16" x2="23" y2="16" />
                </svg>
                FILTERS {activeFilterCount > 0 && `(${activeFilterCount})`}
              </button>

              <div className="mobile-sort-wrap">
                <CustomSortDropdown
                  value={sortBy}
                  onChange={setSortBy}
                  options={SORT_OPTIONS}
                />
              </div>
            </div>

            {/* Saree Sub-Category Quick Tabs Bar */}
            {isSareeActive && (
              <div className="saree-subcat-nav">
                <div className="subcat-nav-inner">
                  <span className="subcat-nav-eyebrow">SAREE EDIT:</span>
                  <div className="subcat-pills">
                    {SAREE_SUBCATEGORIES.map((sub) => {
                      const isSelected = activeSubcategory === sub.id;
                      const count = sareeSubcategoryCounts[sub.id] || 0;
                      return (
                        <button
                          key={sub.id}
                          type="button"
                          className={`subcat-pill ${isSelected ? "active" : ""}`}
                          onClick={() => handleSubcategoryChange(sub.id)}
                        >
                          <span className="pill-name">{sub.label.toUpperCase()}</span>
                          <span className="pill-count">({count})</span>
                        </button>
                      );
                    })}
                  </div>
                </div>
              </div>
            )}

            {filteredProducts.length > 0 ? (
              <div className="product-grid">
                {filteredProducts.map((product) => (
                  <ProductCard key={product.id} product={product} />
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon-wrap">
                  <svg
                    width="32"
                    height="32"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.2"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <h3>No pieces found matching your criteria</h3>
                <p>
                  Try clearing some filters or browse our complete collection of
                  heirloom sarees and dupattas.
                </p>
                <button
                  className="couture-clear-btn"
                  style={{
                    width: "auto",
                    padding: "12px 28px",
                    marginTop: "16px",
                  }}
                  onClick={clearAllFilters}
                >
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
