import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { useProducts } from "../context/ProductContext";
import {
  SORT_OPTIONS,
  PRICE_RANGES,
  SAREE_SUBCATEGORIES,
  CRAFT_DISPLAY_ORDER,
  FABRIC_DISPLAY_ORDER,
  getEffectivePrice,
  isProductAvailable,
  matchesCategory,
  matchesSubcategory,
  matchesCategoryFilter,
  matchesCraftFilter,
  matchesFabricFilter,
  matchesPriceFilter,
  matchesAvailabilityFilter,
  sortProducts,
} from "../utils/filterUtils";
import "./Shop.css";

// Re-export for any consumers or tests
export {
  SORT_OPTIONS,
  PRICE_RANGES,
  SAREE_SUBCATEGORIES,
  matchesCategory,
  matchesSubcategory,
  matchesCategoryFilter,
  matchesCraftFilter,
  matchesFabricFilter,
  matchesPriceFilter,
  matchesAvailabilityFilter,
  getEffectivePrice,
  isProductAvailable,
  sortProducts,
};

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
  const { products, getAllCategories, shopSortSettings } = useProducts();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();

  const isOneOfOneRoute =
    location.pathname.includes("one-of-one") ||
    (searchParams.get("category") || "").toLowerCase() === "one-of-one";
  const isArchiveRoute = location.pathname.includes("archive");

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  const categories = getAllCategories();

  /* ── Filter state with full multi-select support ── */
  const [selectedCrafts, setSelectedCrafts] = useState(() => {
    const raw = searchParams.get("craft");
    return raw ? raw.split(",").map((s) => s.trim()).filter(Boolean) : [];
  });

  const [selectedFabrics, setSelectedFabrics] = useState(() => {
    const raw = searchParams.get("fabric");
    return raw ? raw.split(",").map((s) => s.trim()).filter(Boolean) : [];
  });

  const [selectedPriceRanges, setSelectedPriceRanges] = useState(() => {
    const raw = searchParams.get("price");
    return raw ? raw.split(",").map((s) => s.trim()).filter(Boolean) : [];
  });

  const [activeAvailability, setActiveAvailability] = useState(() => {
    return searchParams.get("availability") || (isArchiveRoute ? "sold-out" : "All");
  });

  const [activeCategory, setActiveCategory] = useState(() => {
    return searchParams.get("category") || "All";
  });

  const [activeSubcategory, setActiveSubcategory] = useState(() => {
    return searchParams.get("subcategory") || searchParams.get("sub") || "All";
  });

  const [sortBy, setSortBy] = useState(() => {
    return searchParams.get("sort") || "recommended";
  });

  const [mobileFiltersOpen, setMobileFiltersOpen] = useState(false);

  const urlSearch = searchParams.get("search") || "";

  // Synchronize URL search params with component state on navigation changes
  useEffect(() => {
    const urlCat = searchParams.get("category");
    if (urlCat) {
      const matched = categories.find((c) => matchesCategory(c, urlCat));
      setActiveCategory(matched || urlCat);
    } else {
      setActiveCategory("All");
    }

    const urlSub = searchParams.get("subcategory") || searchParams.get("sub");
    if (urlSub) {
      const matchedSub = SAREE_SUBCATEGORIES.find(
        (s) => s.id.toLowerCase() === urlSub.toLowerCase()
      );
      setActiveSubcategory(matchedSub ? matchedSub.id : urlSub);
    } else {
      setActiveSubcategory("All");
    }

    const urlCr = searchParams.get("craft");
    if (urlCr) {
      setSelectedCrafts(urlCr.split(",").map((s) => s.trim()).filter(Boolean));
    } else {
      setSelectedCrafts([]);
    }

    const urlFab = searchParams.get("fabric");
    if (urlFab) {
      setSelectedFabrics(urlFab.split(",").map((s) => s.trim()).filter(Boolean));
    } else {
      setSelectedFabrics([]);
    }

    const urlPr = searchParams.get("price");
    if (urlPr) {
      setSelectedPriceRanges(urlPr.split(",").map((s) => s.trim()).filter(Boolean));
    } else {
      setSelectedPriceRanges([]);
    }

    const urlAv = searchParams.get("availability");
    if (urlAv) {
      setActiveAvailability(urlAv);
    } else if (isArchiveRoute) {
      setActiveAvailability("sold-out");
    } else {
      setActiveAvailability("All");
    }

    const urlSort = searchParams.get("sort");
    if (urlSort) {
      setSortBy(urlSort);
    }
  }, [searchParams, isArchiveRoute, categories]);

  /* ── Dynamic available crafts and fabrics derived from catalogue ── */
  const availableCrafts = useMemo(() => {
    const present = new Set();
    products.forEach((p) => {
      if (p.craft && p.craft.trim()) present.add(p.craft.trim());
    });
    return Array.from(present).sort((a, b) => {
      const idxA = CRAFT_DISPLAY_ORDER.indexOf(a);
      const idxB = CRAFT_DISPLAY_ORDER.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [products]);

  const availableFabrics = useMemo(() => {
    const present = new Set();
    products.forEach((p) => {
      if (p.fabric && p.fabric.trim()) present.add(p.fabric.trim());
    });
    return Array.from(present).sort((a, b) => {
      const idxA = FABRIC_DISPLAY_ORDER.indexOf(a);
      const idxB = FABRIC_DISPLAY_ORDER.indexOf(b);
      if (idxA !== -1 && idxB !== -1) return idxA - idxB;
      if (idxA !== -1) return -1;
      if (idxB !== -1) return 1;
      return a.localeCompare(b);
    });
  }, [products]);

  /* ── Storefront Authoritative Eligible Collection ── */
  const baseEligibleProducts = useMemo(() => {
    let list = products.filter((p) => !p.isArchived);

    // Search query filter
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

    // Dedicated One-of-One Collection Route
    if (isOneOfOneRoute) {
      list = list.filter((p) => Boolean(p.isOneOfOne));
    }

    // Archive Collection Route
    if (isArchiveRoute) {
      list = list.filter((p) => !isProductAvailable(p));
    }

    return list;
  }, [products, urlSearch, isOneOfOneRoute, isArchiveRoute]);

  /* ── Dynamic Facet Counts (Context-aware excluding facet's own selection) ── */
  const categoryCounts = useMemo(() => {
    const subset = baseEligibleProducts.filter(
      (p) =>
        matchesCraftFilter(p, selectedCrafts) &&
        matchesFabricFilter(p, selectedFabrics) &&
        matchesPriceFilter(p, selectedPriceRanges) &&
        matchesAvailabilityFilter(p, activeAvailability)
    );
    const counts = { All: subset.length };
    categories.forEach((cat) => {
      if (cat === "All") return;
      counts[cat] = subset.filter((p) => matchesCategory(p.category, cat)).length;
    });
    return counts;
  }, [
    baseEligibleProducts,
    selectedCrafts,
    selectedFabrics,
    selectedPriceRanges,
    activeAvailability,
    categories,
  ]);

  const craftCounts = useMemo(() => {
    const subset = baseEligibleProducts.filter(
      (p) =>
        matchesCategoryFilter(p, activeCategory, activeSubcategory) &&
        matchesFabricFilter(p, selectedFabrics) &&
        matchesPriceFilter(p, selectedPriceRanges) &&
        matchesAvailabilityFilter(p, activeAvailability)
    );
    const counts = {};
    availableCrafts.forEach((craft) => {
      counts[craft] = subset.filter((p) => matchesCraftFilter(p, [craft])).length;
    });
    return counts;
  }, [
    baseEligibleProducts,
    activeCategory,
    activeSubcategory,
    selectedFabrics,
    selectedPriceRanges,
    activeAvailability,
    availableCrafts,
  ]);

  const fabricCounts = useMemo(() => {
    const subset = baseEligibleProducts.filter(
      (p) =>
        matchesCategoryFilter(p, activeCategory, activeSubcategory) &&
        matchesCraftFilter(p, selectedCrafts) &&
        matchesPriceFilter(p, selectedPriceRanges) &&
        matchesAvailabilityFilter(p, activeAvailability)
    );
    const counts = {};
    availableFabrics.forEach((fabric) => {
      counts[fabric] = subset.filter((p) => matchesFabricFilter(p, [fabric])).length;
    });
    return counts;
  }, [
    baseEligibleProducts,
    activeCategory,
    activeSubcategory,
    selectedCrafts,
    selectedPriceRanges,
    activeAvailability,
    availableFabrics,
  ]);

  const priceRangeCounts = useMemo(() => {
    const subset = baseEligibleProducts.filter(
      (p) =>
        matchesCategoryFilter(p, activeCategory, activeSubcategory) &&
        matchesCraftFilter(p, selectedCrafts) &&
        matchesFabricFilter(p, selectedFabrics) &&
        matchesAvailabilityFilter(p, activeAvailability)
    );
    const counts = {};
    PRICE_RANGES.forEach((range) => {
      counts[range.id] = subset.filter((p) => matchesPriceFilter(p, [range.id])).length;
    });
    return counts;
  }, [
    baseEligibleProducts,
    activeCategory,
    activeSubcategory,
    selectedCrafts,
    selectedFabrics,
    activeAvailability,
  ]);

  const stockCounts = useMemo(() => {
    const subset = baseEligibleProducts.filter(
      (p) =>
        matchesCategoryFilter(p, activeCategory, activeSubcategory) &&
        matchesCraftFilter(p, selectedCrafts) &&
        matchesFabricFilter(p, selectedFabrics) &&
        matchesPriceFilter(p, selectedPriceRanges)
    );
    const inStock = subset.filter(isProductAvailable).length;
    const soldOut = subset.length - inStock;
    return { inStock, soldOut, total: subset.length };
  }, [
    baseEligibleProducts,
    activeCategory,
    activeSubcategory,
    selectedCrafts,
    selectedFabrics,
    selectedPriceRanges,
  ]);

  const sareeSubcategoryCounts = useMemo(() => {
    const sarees = baseEligibleProducts.filter(
      (p) =>
        matchesCategory(p.category, "Sarees") &&
        matchesCraftFilter(p, selectedCrafts) &&
        matchesFabricFilter(p, selectedFabrics) &&
        matchesPriceFilter(p, selectedPriceRanges) &&
        matchesAvailabilityFilter(p, activeAvailability)
    );
    return {
      All: sarees.length,
      Chikankari: sarees.filter((s) => matchesSubcategory(s, "Chikankari")).length,
      Zardozi: sarees.filter((s) => matchesSubcategory(s, "Zardozi")).length,
      "One of One": sarees.filter((s) => matchesSubcategory(s, "One of One")).length,
    };
  }, [
    baseEligibleProducts,
    selectedCrafts,
    selectedFabrics,
    selectedPriceRanges,
    activeAvailability,
  ]);

  const isSareeActive =
    activeCategory === "Sarees" ||
    activeCategory.toLowerCase().includes("saree");

  /* ── Authoritative Unified Filtering Pipeline ── */
  const filteredProducts = useMemo(() => {
    let list = baseEligibleProducts.filter(
      (p) =>
        matchesCategoryFilter(p, activeCategory, activeSubcategory) &&
        matchesCraftFilter(p, selectedCrafts) &&
        matchesFabricFilter(p, selectedFabrics) &&
        matchesPriceFilter(p, selectedPriceRanges) &&
        matchesAvailabilityFilter(p, activeAvailability)
    );

    // Canonical deduplication guard
    const seenIds = new Set();
    list = list.filter((p) => {
      if (!p.id || seenIds.has(p.id)) return false;
      seenIds.add(p.id);
      return true;
    });

    // Sorting operates strictly on the filtered set
    return sortProducts(list, sortBy, shopSortSettings);
  }, [
    baseEligibleProducts,
    activeCategory,
    activeSubcategory,
    selectedCrafts,
    selectedFabrics,
    selectedPriceRanges,
    activeAvailability,
    sortBy,
    shopSortSettings,
  ]);

  const activeFilterCount = useMemo(() => {
    let count = 0;
    if (urlSearch) count++;
    if (activeCategory !== "All") count++;
    if (activeSubcategory !== "All") count++;
    count += selectedCrafts.length;
    count += selectedFabrics.length;
    count += selectedPriceRanges.length;
    if (activeAvailability !== "All") count++;
    return count;
  }, [
    urlSearch,
    activeCategory,
    activeSubcategory,
    selectedCrafts,
    selectedFabrics,
    selectedPriceRanges,
    activeAvailability,
  ]);

  /* ── URL and State Helpers ── */
  const updateParams = useCallback(
    (updates) => {
      setSearchParams(
        (prevParams) => {
          const next = new URLSearchParams(prevParams);
          Object.entries(updates).forEach(([key, val]) => {
            if (
              val === null ||
              val === undefined ||
              val === "" ||
              (Array.isArray(val) && val.length === 0)
            ) {
              next.delete(key);
            } else if (Array.isArray(val)) {
              next.set(key, val.join(","));
            } else {
              next.set(key, String(val));
            }
          });
          return next;
        },
        { replace: true }
      );
    },
    [setSearchParams]
  );

  const handleCategoryChange = (cat) => {
    setActiveCategory(cat);
    setActiveSubcategory("All");
    updateParams({
      category: cat !== "All" ? cat : null,
      subcategory: null,
      sub: null,
    });
  };

  const handleSubcategoryChange = (sub) => {
    setActiveSubcategory(sub);
    updateParams({
      subcategory: sub !== "All" ? sub : null,
      sub: null,
    });
  };

  const toggleCraft = (craft) => {
    const next = selectedCrafts.includes(craft)
      ? selectedCrafts.filter((c) => c !== craft)
      : [...selectedCrafts, craft];
    setSelectedCrafts(next);
    updateParams({ craft: next });
  };

  const toggleFabric = (fabric) => {
    const next = selectedFabrics.includes(fabric)
      ? selectedFabrics.filter((f) => f !== fabric)
      : [...selectedFabrics, fabric];
    setSelectedFabrics(next);
    updateParams({ fabric: next });
  };

  const togglePriceRange = (rangeId) => {
    const next = selectedPriceRanges.includes(rangeId)
      ? selectedPriceRanges.filter((id) => id !== rangeId)
      : [...selectedPriceRanges, rangeId];
    setSelectedPriceRanges(next);
    updateParams({ price: next });
  };

  const handleAvailabilityChange = (val) => {
    setActiveAvailability(val);
    updateParams({ availability: val !== "All" ? val : null });
  };

  const handleSortChange = (newSort) => {
    setSortBy(newSort);
    updateParams({ sort: newSort !== "recommended" ? newSort : null });
  };

  const clearAllFilters = useCallback(() => {
    setActiveCategory("All");
    setActiveSubcategory("All");
    setSelectedCrafts([]);
    setSelectedFabrics([]);
    setSelectedPriceRanges([]);
    setActiveAvailability(isArchiveRoute ? "sold-out" : "All");
    setSortBy("recommended");
    setSearchParams({}, { replace: true });
  }, [isArchiveRoute, setSearchParams]);

  /* ── Filter Sidebar Render Function ── */
  const renderFilters = () => (
    <>
      {/* ── Filter Header ── */}
      <div className="filter-sidebar-top">
        <div className="filter-sidebar-title-wrap">
          <span className="filter-sidebar-title">FILTERS</span>
          <span className="filter-sidebar-gem">✦</span>
        </div>
        {activeFilterCount > 0 && (
          <button
            className="filter-sidebar-reset"
            onClick={clearAllFilters}
            title="Reset all active filters"
          >
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
            type="button"
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
                type="button"
                className={`filter-chip ${activeCategory === cat ? "active" : ""}`}
                onClick={() => handleCategoryChange(cat)}
              >
                {cat.toUpperCase()}{" "}
                <span className="chip-count">({count})</span>
              </button>
            );
          })}
        </div>

        {/* Nested Saree Edit: Quick filters when Saree is selected */}
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

      {/* ── 2. Artisanal Craft (Multi-select OR logic) ── */}
      <div className="filter-group">
        <div className="filter-group-header">
          <h4>ARTISANAL CRAFT</h4>
          <span>—</span>
        </div>
        <div className="filter-checkbox-list">
          {availableCrafts.map((craft) => {
            const count = craftCounts[craft] || 0;
            const isChecked = selectedCrafts.includes(craft);
            return (
              <label key={craft} className="filter-checkbox-item">
                <div className="checkbox-wrap">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleCraft(craft)}
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

      {/* ── 3. Luxury Fabric (Multi-select OR logic) ── */}
      <div className="filter-group">
        <div className="filter-group-header">
          <h4>LUXURY FABRIC</h4>
          <span>—</span>
        </div>
        <div className="filter-checkbox-list">
          {availableFabrics.map((fabric) => {
            const count = fabricCounts[fabric] || 0;
            const isChecked = selectedFabrics.includes(fabric);
            return (
              <label key={fabric} className="filter-checkbox-item">
                <div className="checkbox-wrap">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => toggleFabric(fabric)}
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

      {/* ── 4. Price Range (Multi-select non-overlapping tiers) ── */}
      <div className="filter-group">
        <div className="filter-group-header">
          <h4>PRICE RANGE</h4>
          <span>—</span>
        </div>
        <div className="filter-checkbox-list">
          {PRICE_RANGES.map((range) => {
            const count = priceRangeCounts[range.id] || 0;
            const isChecked = selectedPriceRanges.includes(range.id);
            return (
              <label key={range.id} className="filter-checkbox-item">
                <div className="checkbox-wrap">
                  <input
                    type="checkbox"
                    checked={isChecked}
                    onChange={() => togglePriceRange(range.id)}
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
                onChange={() => handleAvailabilityChange("All")}
              />
              <span className="custom-radio" />
              <span className="checkbox-label">All Creations</span>
            </div>
            <span className="checkbox-count">({stockCounts.total})</span>
          </label>
          <label className="filter-checkbox-item">
            <div className="checkbox-wrap">
              <input
                type="radio"
                name="availability"
                checked={activeAvailability === "in-stock"}
                onChange={() =>
                  handleAvailabilityChange(
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
                  handleAvailabilityChange(
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
      {/* ── Active Filters Top Bar with Individual Dismiss Tags ── */}
      <div className="shop-top-bar container">
        <div className="active-filters">
          <span className="active-label">ACTIVE:</span>

          {isOneOfOneRoute && (
            <span
              className="active-tag"
              style={{
                backgroundColor: "#6E1E2A",
                color: "#FFFFFF",
                borderColor: "#6E1E2A",
                fontWeight: 600,
                letterSpacing: "0.08em",
              }}
            >
              COLLECTION: ONE OF ONE ({filteredProducts.length})
            </span>
          )}

          {activeFilterCount === 0 && !isOneOfOneRoute && (
            <span className="active-empty-hint">
              ALL CREATIONS ({filteredProducts.length})
            </span>
          )}

          {urlSearch && (
            <span
              className="active-tag"
              onClick={() => updateParams({ search: null })}
              title="Remove search query"
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

          {selectedCrafts.map((craft) => (
            <span
              key={craft}
              className="active-tag"
              onClick={() => toggleCraft(craft)}
              title={`Remove craft: ${craft}`}
            >
              CRAFT: {craft.toUpperCase()} ✕
            </span>
          ))}

          {selectedFabrics.map((fabric) => (
            <span
              key={fabric}
              className="active-tag"
              onClick={() => toggleFabric(fabric)}
              title={`Remove fabric: ${fabric}`}
            >
              FABRIC: {fabric.toUpperCase()} ✕
            </span>
          ))}

          {selectedPriceRanges.map((rangeId) => {
            const r = PRICE_RANGES.find((x) => x.id === rangeId);
            return (
              <span
                key={rangeId}
                className="active-tag"
                onClick={() => togglePriceRange(rangeId)}
                title={`Remove price filter: ${r?.label}`}
              >
                PRICE: {r ? r.label.toUpperCase() : rangeId.toUpperCase()} ✕
              </span>
            );
          })}

          {activeAvailability !== "All" && (
            <span
              className="active-tag"
              onClick={() => handleAvailabilityChange("All")}
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
              CLEAR ALL
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
            onChange={handleSortChange}
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
                  onChange={handleSortChange}
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
                    width="36"
                    height="36"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.2"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <line x1="21" y1="21" x2="16.65" y2="16.65" />
                  </svg>
                </div>
                <h3>No creations found</h3>
                <p>
                  Try adjusting your filters to discover more of the Safed Rang collection.
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
                  CLEAR FILTERS
                </button>
              </div>
            )}
          </main>
        </div>
      </div>
    </div>
  );
}
