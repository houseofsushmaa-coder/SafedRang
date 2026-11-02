import { useState, useMemo, useCallback, useEffect, useRef } from "react";
import { useSearchParams, useLocation } from "react-router-dom";
import ProductCard from "../components/ProductCard";
import { FilterSection, CheckList, PriceFilter } from "../components/ShopFilterParts";
import { useProducts } from "../context/ProductContext";
import {
  SORT_OPTIONS,
  PRICE_RANGES,
  SAREE_SUBCATEGORIES,
  CRAFT_DISPLAY_ORDER,
  FABRIC_DISPLAY_ORDER,
  getEffectivePrice,
  isProductAvailable,
  isOnSale,
  matchesCategory,
  matchesSubcategory,
  matchesCategoryFilter,
  matchesCraftFilter,
  matchesFabricFilter,
  matchesPriceFilter,
  matchesPriceBounds,
  priceRangesToBounds,
  matchesAvailabilityFilter,
  sortProducts,
} from "../utils/filterUtils";
import { trackEvent, toAnalyticsItem } from "../lib/tracking";
import { applyHead } from "../lib/seo";
import "./Shop.css";
import "./ShopFilters.css";

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

const splitList = (raw) => (raw ? raw.split(",").map((s) => s.trim()).filter(Boolean) : []);
const toPrice = (raw) => {
  const n = parseInt(raw, 10);
  return Number.isFinite(n) && n >= 0 ? n : null;
};
const formatRs = (n) => `₹${Math.round(n).toLocaleString("en-IN")}`;

// Reads ?min=&max=, falling back to the older ?price=under-5k style links.
const priceFromParams = (params) => {
  const min = toPrice(params.get("min"));
  const max = toPrice(params.get("max"));
  if (min !== null || max !== null) return { min, max };
  return priceRangesToBounds(splitList(params.get("price")));
};

// Price quick picks, expressed as min/max (max inclusive).
const PRICE_PRESETS = PRICE_RANGES.map((r) => ({
  id: r.id,
  label: r.label,
  min: r.min > 0 ? r.min : null,
  max: Number.isFinite(r.max) ? r.max - 1 : null,
}));

const AVAILABILITY_LABELS = { "in-stock": "Ready to ship", "sold-out": "Sold out" };

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
  const { storefrontProducts: products, getAllCategories, shopSortSettings } = useProducts();
  const [searchParams, setSearchParams] = useSearchParams();
  const location = useLocation();
  const pageRef = useRef(null);

  const isOneOfOneRoute =
    location.pathname.includes("one-of-one") ||
    (searchParams.get("category") || "").toLowerCase() === "one-of-one";
  const isArchiveRoute = location.pathname.includes("archive");

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  // The site header is sticky; the filter sidebar sticks just below it.
  useEffect(() => {
    const header = document.querySelector(".site-header");
    const page = pageRef.current;
    if (!header || !page || typeof ResizeObserver === "undefined") return;
    const sync = () => page.style.setProperty("--shop-sticky-top", `${Math.round(header.getBoundingClientRect().height)}px`);
    sync();
    const ro = new ResizeObserver(sync);
    ro.observe(header);
    return () => ro.disconnect();
  }, []);

  // Memoised: a fresh array on every render made the URL-sync effect below run
  // after every render and loop ("Maximum update depth exceeded"), which froze
  // the filters.
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const categories = useMemo(() => getAllCategories(), [products]);

  /* ── Filter state (mirrors the URL) ── */
  const [selectedCrafts, setSelectedCrafts] = useState(() => splitList(searchParams.get("craft")));
  const [selectedFabrics, setSelectedFabrics] = useState(() => splitList(searchParams.get("fabric")));
  const [priceMin, setPriceMin] = useState(() => priceFromParams(searchParams).min);
  const [priceMax, setPriceMax] = useState(() => priceFromParams(searchParams).max);
  const [onSaleOnly, setOnSaleOnly] = useState(() => searchParams.get("sale") === "1");
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

  // Which filter sections are expanded. Sections with an active filter open too.
  const [openSections, setOpenSections] = useState(() => {
    const open = new Set(["category", "price"]);
    if (searchParams.get("craft")) open.add("craft");
    if (searchParams.get("fabric")) open.add("fabric");
    if (searchParams.get("availability") || searchParams.get("sale")) open.add("availability");
    return open;
  });
  const toggleSection = (id) =>
    setOpenSections((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });

  const urlSearch = searchParams.get("search") || "";

  // Synchronize URL search params with component state on navigation changes
  useEffect(() => {
    // Keep the previous array when contents are unchanged so React can skip the re-render.
    const sameList = (next) => (prev) => (prev.join("|") === next.join("|") ? prev : next);

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

    setSelectedCrafts(sameList(splitList(searchParams.get("craft"))));
    setSelectedFabrics(sameList(splitList(searchParams.get("fabric"))));

    const price = priceFromParams(searchParams);
    setPriceMin(price.min);
    setPriceMax(price.max);
    setOnSaleOnly(searchParams.get("sale") === "1");

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
  const orderBy = (preferred) => (a, b) => {
    const idxA = preferred.indexOf(a);
    const idxB = preferred.indexOf(b);
    if (idxA !== -1 && idxB !== -1) return idxA - idxB;
    if (idxA !== -1) return -1;
    if (idxB !== -1) return 1;
    return a.localeCompare(b);
  };

  const availableCrafts = useMemo(() => {
    const present = new Set();
    products.forEach((p) => {
      if (p.craft && p.craft.trim()) present.add(p.craft.trim());
    });
    return Array.from(present).sort(orderBy(CRAFT_DISPLAY_ORDER));
  }, [products]);

  const availableFabrics = useMemo(() => {
    const present = new Set();
    products.forEach((p) => {
      if (p.fabric && p.fabric.trim()) present.add(p.fabric.trim());
    });
    return Array.from(present).sort(orderBy(FABRIC_DISPLAY_ORDER));
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

  /* ── One test per facet; counts for a facet ignore that facet's own selection ── */
  const passes = useCallback(
    (p, skip) =>
      (skip === "category" || matchesCategoryFilter(p, activeCategory, activeSubcategory)) &&
      (skip === "craft" || matchesCraftFilter(p, selectedCrafts)) &&
      (skip === "fabric" || matchesFabricFilter(p, selectedFabrics)) &&
      (skip === "price" || matchesPriceBounds(p, priceMin, priceMax)) &&
      (skip === "sale" || !onSaleOnly || isOnSale(p)) &&
      (skip === "availability" || matchesAvailabilityFilter(p, activeAvailability)),
    [activeCategory, activeSubcategory, selectedCrafts, selectedFabrics, priceMin, priceMax, onSaleOnly, activeAvailability]
  );

  const facetSubset = useCallback((skip) => baseEligibleProducts.filter((p) => passes(p, skip)), [baseEligibleProducts, passes]);

  const categoryCounts = useMemo(() => {
    const subset = facetSubset("category");
    const counts = { All: subset.length };
    categories.forEach((cat) => {
      if (cat === "All") return;
      counts[cat] = subset.filter((p) => matchesCategory(p.category, cat)).length;
    });
    return counts;
  }, [facetSubset, categories]);

  const sareeSubcategoryCounts = useMemo(() => {
    const sarees = facetSubset("category").filter((p) => matchesCategory(p.category, "Sarees"));
    return {
      All: sarees.length,
      Chikankari: sarees.filter((s) => matchesSubcategory(s, "Chikankari")).length,
      Zardozi: sarees.filter((s) => matchesSubcategory(s, "Zardozi")).length,
      "One of One": sarees.filter((s) => matchesSubcategory(s, "One of One")).length,
    };
  }, [facetSubset]);

  const craftOptions = useMemo(() => {
    const subset = facetSubset("craft");
    return availableCrafts.map((craft) => ({
      value: craft,
      label: craft,
      count: subset.filter((p) => matchesCraftFilter(p, [craft])).length,
    }));
  }, [facetSubset, availableCrafts]);

  const fabricOptions = useMemo(() => {
    const subset = facetSubset("fabric");
    return availableFabrics.map((fabric) => ({
      value: fabric,
      label: fabric,
      count: subset.filter((p) => matchesFabricFilter(p, [fabric])).length,
    }));
  }, [facetSubset, availableFabrics]);

  // Slider scale: the whole collection being browsed, rounded to ₹500.
  const priceBounds = useMemo(() => {
    const all = baseEligibleProducts.map(getEffectivePrice).filter(Number.isFinite);
    if (!all.length) return { min: 0, max: 25000 };
    const min = Math.floor(Math.min(...all) / 500) * 500;
    const max = Math.ceil(Math.max(...all) / 500) * 500;
    return { min, max: max > min ? max : min + 500 };
  }, [baseEligibleProducts]);

  const priceSubset = useMemo(() => facetSubset("price"), [facetSubset]);
  const priceHistogram = useMemo(() => priceSubset.map(getEffectivePrice), [priceSubset]);
  const pricePresets = useMemo(
    () =>
      PRICE_PRESETS.map((p) => ({
        ...p,
        active: p.min === priceMin && p.max === priceMax,
        count: priceSubset.filter((prod) => matchesPriceBounds(prod, p.min, p.max)).length,
      })),
    [priceSubset, priceMin, priceMax]
  );

  const stockCounts = useMemo(() => {
    const subset = facetSubset("availability");
    const inStock = subset.filter(isProductAvailable).length;
    return { inStock, soldOut: subset.length - inStock, total: subset.length };
  }, [facetSubset]);

  const saleCount = useMemo(() => facetSubset("sale").filter(isOnSale).length, [facetSubset]);

  const isSareeActive =
    activeCategory === "Sarees" ||
    activeCategory.toLowerCase().includes("saree");

  /* ── Authoritative Unified Filtering Pipeline ── */
  const filteredProducts = useMemo(() => {
    let list = baseEligibleProducts.filter((p) => passes(p));

    // Canonical deduplication guard
    const seenIds = new Set();
    list = list.filter((p) => {
      if (!p.id || seenIds.has(p.id)) return false;
      seenIds.add(p.id);
      return true;
    });

    // Sorting operates strictly on the filtered set
    return sortProducts(list, sortBy, shopSortSettings);
  }, [baseEligibleProducts, passes, sortBy, shopSortSettings]);

  // Name of the list being browsed, for view_item_list / select_item.
  const listName = isOneOfOneRoute
    ? "One of One"
    : isArchiveRoute
    ? "Archive"
    : activeCategory !== "All"
    ? activeCategory
    : "Shop";

  // Page title and meta description for the collection being browsed.
  useEffect(() => {
    if (isOneOfOneRoute) {
      applyHead({
        title: "The One of One Edit — Single-Piece Sarees | Safed Rang",
        description:
          "One of One sarees by Safed Rang: single pieces, each a unique combination of fabric, dye and hand embroidery from Lucknow. Once sold, the design is retired.",
      });
    } else if (matchesCategory(listName, "Jewellery")) {
      applyHead({
        title: "Handcrafted Semi-Precious Stone Jewellery — Rings & Necklaces | Safed Rang",
        description:
          "Shop handcrafted semi-precious stone jewellery from Safed Rang, Lucknow — agate, amethyst, rose quartz, carnelian and turquoise rings, necklaces and bracelets. Free shipping on online payment.",
      });
    } else if (listName !== "Shop" && listName !== "Archive") {
      applyHead({
        title: `Handcrafted ${listName} — Lucknowi Chikankari & Zardozi | Safed Rang`,
        description: `Shop handcrafted ${listName.toLowerCase()} from Safed Rang — Lucknowi chikankari and zardozi, hand-embroidered by karigars in Lucknow. Free shipping on online payment.`,
      });
    } else {
      applyHead({
        title: "Shop Handcrafted Sarees, Kurta Sets & Dupattas | Safed Rang",
        description:
          "Shop hand-embroidered Lucknowi chikankari and zardozi sarees, kurta sets, dupattas and blouses from Safed Rang, Lucknow. Free shipping on online payment.",
      });
    }
  }, [isOneOfOneRoute, listName]);

  // view_item_list once the shopper settles on a result set (first 24 items).
  useEffect(() => {
    if (filteredProducts.length === 0) return;
    const t = setTimeout(() => {
      trackEvent("view_item_list", {
        item_list_name: listName,
        items: filteredProducts.slice(0, 24).map((p, index) => toAnalyticsItem(p, { index, listName })),
      });
    }, 800);
    return () => clearTimeout(t);
  }, [filteredProducts, listName]);

  const hasPriceFilter = priceMin !== null || priceMax !== null;
  const priceLabel = hasPriceFilter
    ? priceMin !== null && priceMax !== null
      ? `${formatRs(priceMin)} – ${formatRs(priceMax)}`
      : priceMin !== null
      ? `${formatRs(priceMin)}+`
      : `Up to ${formatRs(priceMax)}`
    : "";

  const activeFilterCount =
    (urlSearch ? 1 : 0) +
    (activeCategory !== "All" ? 1 : 0) +
    (activeSubcategory !== "All" ? 1 : 0) +
    selectedCrafts.length +
    selectedFabrics.length +
    (hasPriceFilter ? 1 : 0) +
    (onSaleOnly ? 1 : 0) +
    (activeAvailability !== "All" ? 1 : 0);

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

  const trackFilter = (filter_type, filter_value) =>
    trackEvent("filter_apply", { filter_type, filter_value: String(filter_value) });

  const handleCategoryChange = (cat) => {
    trackFilter("category", cat);
    setActiveCategory(cat);
    setActiveSubcategory("All");
    updateParams({
      category: cat !== "All" ? cat : null,
      subcategory: null,
      sub: null,
    });
  };

  const handleSubcategoryChange = (sub) => {
    trackFilter("subcategory", sub);
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
    if (next.length > selectedCrafts.length) trackFilter("craft", craft);
    setSelectedCrafts(next);
    updateParams({ craft: next });
  };

  const toggleFabric = (fabric) => {
    const next = selectedFabrics.includes(fabric)
      ? selectedFabrics.filter((f) => f !== fabric)
      : [...selectedFabrics, fabric];
    if (next.length > selectedFabrics.length) trackFilter("fabric", fabric);
    setSelectedFabrics(next);
    updateParams({ fabric: next });
  };

  const handlePriceChange = (min, max) => {
    if (min !== null || max !== null) trackFilter("price", `${min ?? 0}-${max ?? "max"}`);
    setPriceMin(min);
    setPriceMax(max);
    updateParams({ min, max, price: null });
  };

  const toggleOnSale = () => {
    const next = !onSaleOnly;
    if (next) trackFilter("offer", "on_sale");
    setOnSaleOnly(next);
    updateParams({ sale: next ? "1" : null });
  };

  const handleAvailabilityChange = (val) => {
    trackFilter("availability", val);
    setActiveAvailability(val);
    updateParams({ availability: val !== "All" ? val : null });
  };

  const handleSortChange = (newSort) => {
    trackEvent("sort_change", { sort_option: newSort });
    setSortBy(newSort);
    updateParams({ sort: newSort !== "recommended" ? newSort : null });
  };

  const clearAllFilters = useCallback(() => {
    setActiveCategory("All");
    setActiveSubcategory("All");
    setSelectedCrafts([]);
    setSelectedFabrics([]);
    setPriceMin(null);
    setPriceMax(null);
    setOnSaleOnly(false);
    setActiveAvailability(isArchiveRoute ? "sold-out" : "All");
    setSortBy("recommended");
    setSearchParams({}, { replace: true });
  }, [isArchiveRoute, setSearchParams]);

  const countSummary = (n) => (n ? `${n} selected` : "");

  /* ── Filter Sidebar Render Function ── */
  const renderFilters = (scope = "side") => (
    <>
      <div className="filter-sidebar-top">
        <div className="filter-sidebar-title-wrap">
          <span className="filter-sidebar-title">Filters</span>
          {activeFilterCount > 0 && <span className="filter-sidebar-badge">{activeFilterCount}</span>}
        </div>
        {activeFilterCount > 0 && (
          <button className="filter-sidebar-reset" onClick={clearAllFilters} title="Reset all active filters">
            Clear all
          </button>
        )}
      </div>

      {/* ── Category ── */}
      <FilterSection
        id={`${scope}-category`}
        title="Category"
        summary={activeCategory !== "All" ? activeCategory : ""}
        open={openSections.has("category")}
        onToggle={() => toggleSection("category")}
      >
        <div className="fcat-list">
          {["All", ...categories.filter((c) => c !== "All")].map((cat) => {
            const count = cat === "All" ? categoryCounts.All || 0 : categoryCounts[cat] || 0;
            const isActive = activeCategory === cat;
            return (
              <button
                key={cat}
                type="button"
                className={`fcat ${isActive ? "is-active" : ""}`}
                aria-pressed={isActive}
                disabled={!isActive && count === 0}
                onClick={() => handleCategoryChange(cat)}
              >
                <span>{cat === "All" ? "All creations" : cat}</span>
                <span className="fcat-count">{count}</span>
              </button>
            );
          })}
        </div>

        {isSareeActive && (
          <div className="fcat-sub">
            <span className="fcat-sub-label">Saree edit</span>
            <div className="fpill-row">
              {SAREE_SUBCATEGORIES.map((sub) => {
                const isSelected = activeSubcategory === sub.id;
                return (
                  <button
                    key={sub.id}
                    type="button"
                    className={`fpill ${isSelected ? "is-active" : ""}`}
                    aria-pressed={isSelected}
                    onClick={() => handleSubcategoryChange(sub.id)}
                  >
                    {sub.id === "All" ? "All" : sub.label}
                    <span>{sareeSubcategoryCounts[sub.id] || 0}</span>
                  </button>
                );
              })}
            </div>
          </div>
        )}
      </FilterSection>

      {/* ── Price ── */}
      <FilterSection
        id={`${scope}-price`}
        title="Price"
        summary={priceLabel}
        open={openSections.has("price")}
        onToggle={() => toggleSection("price")}
      >
        <PriceFilter
          bounds={priceBounds}
          min={priceMin}
          max={priceMax}
          prices={priceHistogram}
          presets={pricePresets}
          onCommit={handlePriceChange}
        />
      </FilterSection>

      {/* ── Craft ── */}
      {craftOptions.length > 0 && (
        <FilterSection
          id={`${scope}-craft`}
          title="Craft"
          summary={countSummary(selectedCrafts.length)}
          open={openSections.has("craft")}
          onToggle={() => toggleSection("craft")}
        >
          <CheckList name="Craft" options={craftOptions} selected={selectedCrafts} onToggle={toggleCraft} limit={6} />
        </FilterSection>
      )}

      {/* ── Fabric ── */}
      {fabricOptions.length > 0 && (
        <FilterSection
          id={`${scope}-fabric`}
          title="Fabric"
          summary={countSummary(selectedFabrics.length)}
          open={openSections.has("fabric")}
          onToggle={() => toggleSection("fabric")}
        >
          <CheckList
            name="Fabric"
            options={fabricOptions}
            selected={selectedFabrics}
            onToggle={toggleFabric}
            limit={6}
            searchable
          />
        </FilterSection>
      )}

      {/* ── Availability & offers ── */}
      <FilterSection
        id={`${scope}-availability`}
        title="Availability & offers"
        summary={[AVAILABILITY_LABELS[activeAvailability], onSaleOnly && "On sale"].filter(Boolean).join(", ")}
        open={openSections.has("availability")}
        onToggle={() => toggleSection("availability")}
      >
        <div className="fseg" role="radiogroup" aria-label="Availability">
          {[
            ["All", "All", stockCounts.total],
            ["in-stock", "Ready to ship", stockCounts.inStock],
            ["sold-out", "Sold out", stockCounts.soldOut],
          ].map(([value, label, count]) => (
            <button
              key={value}
              type="button"
              role="radio"
              aria-checked={activeAvailability === value}
              className={activeAvailability === value ? "is-active" : ""}
              onClick={() => handleAvailabilityChange(value)}
            >
              {label}
              <span>{count}</span>
            </button>
          ))}
        </div>

        <label className={`fswitch ${saleCount === 0 && !onSaleOnly ? "is-disabled" : ""}`}>
          <span>
            On sale
            <small>{saleCount} {saleCount === 1 ? "piece" : "pieces"} with a reduced price</small>
          </span>
          <input
            type="checkbox"
            role="switch"
            checked={onSaleOnly}
            disabled={saleCount === 0 && !onSaleOnly}
            onChange={toggleOnSale}
          />
          <i aria-hidden="true" />
        </label>
      </FilterSection>
    </>
  );

  return (
    <div className="shop-page" ref={pageRef}>
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

          {hasPriceFilter && (
            <span className="active-tag" onClick={() => handlePriceChange(null, null)} title="Remove price filter">
              PRICE: {priceLabel} ✕
            </span>
          )}

          {onSaleOnly && (
            <span className="active-tag" onClick={toggleOnSale} title="Remove on-sale filter">
              ON SALE ✕
            </span>
          )}

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
          <aside className="filters-sidebar" aria-label="Filters">{renderFilters()}</aside>

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
                {mobileFiltersOpen && renderFilters("drawer")}
              </div>
              <div className="mobile-drawer-bottom-bar mobile-drawer-actions">
                {activeFilterCount > 0 && (
                  <button className="mobile-clear-btn" onClick={clearAllFilters}>
                    Clear
                  </button>
                )}
                <button
                  className="mobile-apply-btn"
                  onClick={() => setMobileFiltersOpen(false)}
                >
                  VIEW {filteredProducts.length} {filteredProducts.length === 1 ? "PIECE" : "PIECES"}
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
                {filteredProducts.map((product, index) => (
                  <ProductCard
                    key={product.id}
                    product={product}
                    index={index}
                    listName={listName}
                    priority={index < 4}
                  />
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
