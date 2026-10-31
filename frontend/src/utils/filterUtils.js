export const normalizeCategoryName = (rawCat) => {
  if (!rawCat) return "Others";
  const c = rawCat.trim();
  const lower = c.toLowerCase();
  if (lower === "dupatta" || lower === "dupattas" || lower === "duppata" || lower === "duppatta") return "Dupattas";
  if (lower === "saree" || lower === "sarees" || lower === "sari") return "Sarees";
  if (lower === "kurta set" || lower === "kurta sets" || lower === "kurta" || lower === "kurtas") return "Kurta Sets";
  if (lower === "blouse" || lower === "blouses") return "Blouses";
  if (lower === "bottom" || lower === "bottoms" || lower === "jewellery" || lower === "jewelry") return "Others";
  return c;
};

export const DEFAULT_SHOP_SORT_SETTINGS = {
  sortMode: "category_first_manual",
  categoryOrder: ["Sarees", "Dupattas", "Kurta Sets", "Blouses", "Others"],
};

export const SORT_OPTIONS = [
  { value: "recommended", label: "Recommended" },
  { value: "price-asc", label: "Price: Low to High" },
  { value: "price-desc", label: "Price: High to Low" },
  { value: "newest", label: "Newest Arrivals" },
  { value: "oldest", label: "Oldest First" },
  { value: "name-asc", label: "Alphabetical: A → Z" },
];

export const PRICE_RANGES = [
  { id: "under-5k", label: "Under ₹5,000", min: 0, max: 5000, test: (p) => p < 5000 },
  { id: "5k-10k", label: "₹5,000 – ₹10,000", min: 5000, max: 10000, test: (p) => p >= 5000 && p < 10000 },
  { id: "10k-15k", label: "₹10,000 – ₹15,000", min: 10000, max: 15000, test: (p) => p >= 10000 && p < 15000 },
  { id: "above-15k", label: "₹15,000 & Above", min: 15000, max: Infinity, test: (p) => p >= 15000 },
];

export const SAREE_SUBCATEGORIES = [
  { id: "All", label: "All Sarees" },
  { id: "Chikankari", label: "Chikankari" },
  { id: "Zardozi", label: "Zardozi" },
  { id: "One of One", label: "One of One" },
];

export const CRAFT_DISPLAY_ORDER = [
  "Lucknowi Chikankari",
  "Zardozi",
  "Mukaish",
  "Bead & Sequin Work",
  "Gota Patti",
  "Plain",
  "Handcrafted",
];

export const FABRIC_DISPLAY_ORDER = [
  "Mul Chanderi",
  "Chanderi Silk",
  "Chanderi Cotton",
  "Organza",
  "Tissue",
  "Georgette",
  "Chiffon",
  "Crepe",
  "Tussar Silk",
  "Silk",
  "Muslin",
  "Mul Cotton",
  "Cotton",
  "Khadi",
  "Linen",
  "Kota",
  "Viscose",
  "Modal",
  "Satin",
  "Semi-precious Stone",
  "Mixed",
];

export function getEffectivePrice(product) {
  if (!product) return NaN;
  const p = product.salePrice ?? product.price;
  if (p === undefined || p === null) return NaN;
  const num = typeof p === "number" ? p : parseFloat(p);
  return isNaN(num) ? NaN : num;
}

export function isProductAvailable(product) {
  if (!product) return false;
  const rawStatus = (product.stockStatus || product.status || "").toLowerCase();
  if (rawStatus === "sold out" || rawStatus === "out of stock") return false;
  if (
    product.stock !== undefined &&
    product.stock !== null &&
    Number(product.stock) <= 0 &&
    (!product.productType || product.productType === "simple")
  ) {
    return false;
  }
  return true;
}

export function matchesCategory(productCategory, selectedCategory) {
  if (!selectedCategory || selectedCategory === "All") return true;
  if (!productCategory) return false;
  const p = productCategory.toLowerCase().trim();
  const s = selectedCategory.toLowerCase().trim();
  if (p === s) return true;

  // Normalized comparison (remove trailing 's' and non-alphanumeric chars)
  const pNorm = p.replace(/s$/, "").replace(/[\s-_+]+/g, "");
  const sNorm = s.replace(/s$/, "").replace(/[\s-_+]+/g, "");
  if (pNorm === sNorm) return true;

  // Handle dupatta / duppata / dupattas variants
  const isPDupatta = pNorm.includes("dupat") || pNorm.includes("duppat");
  const isSDupatta = sNorm.includes("dupat") || sNorm.includes("duppat");
  if (isPDupatta && isSDupatta) return true;

  // Handle kurta set / kurta variants
  const isPKurta = pNorm.includes("kurta");
  const isSKurta = sNorm.includes("kurta");
  if (isPKurta && isSKurta) return true;

  // Handle saree / sarees / sari
  const isPSaree = pNorm.includes("saree") || pNorm.includes("sari");
  const isSSaree = sNorm.includes("saree") || sNorm.includes("sari");
  if (isPSaree && isSSaree) return true;

  return p.includes(s) || s.includes(p);
}

export function matchesSubcategory(product, subcategory) {
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
    return Boolean(product.isOneOfOne);
  }

  return subcat === target || combined.includes(target);
}

export function matchesCategoryFilter(product, activeCategory, activeSubcategory) {
  if (activeCategory && activeCategory !== "All") {
    if (!matchesCategory(product.category, activeCategory)) return false;
  }
  if (activeSubcategory && activeSubcategory !== "All") {
    if (!matchesSubcategory(product, activeSubcategory)) return false;
  }
  return true;
}

export function matchesCraftFilter(product, selectedCrafts) {
  if (!selectedCrafts || selectedCrafts.length === 0 || selectedCrafts.includes("All")) {
    return true;
  }
  const pCraft = (product.craft || "").trim().toLowerCase();
  const text = `${pCraft} ${(product.title || "")} ${(product.description || "")}`.toLowerCase();

  return selectedCrafts.some((c) => {
    const sc = (c || "").trim().toLowerCase();
    if (!sc || sc === "all") return true;

    // Handle generic 'chikankari' query matching Lucknowi Chikankari & Handcrafted Chikankari
    if (sc === "chikankari") {
      return pCraft.includes("chikankari") || text.includes("chikankari");
    }
    // Handle 'zardozi'
    if (sc === "zardozi") {
      return pCraft.includes("zardozi") || text.includes("zardozi");
    }
    // Handle exact or canonical match
    if (pCraft === sc) return true;
    if (sc === "lucknowi chikankari") {
      return pCraft === "lucknowi chikankari" || pCraft.includes("lucknowi chikankari");
    }
    if (sc === "handcrafted chikankari") {
      return pCraft === "handcrafted chikankari";
    }
    if (sc === "handcrafted") {
      return pCraft === "handcrafted";
    }
    if (sc === "gota patti" || sc === "gota-patti") {
      return pCraft === "gota patti" || text.includes("gota patti");
    }
    return pCraft.includes(sc) || sc.includes(pCraft);
  });
}

export function matchesFabricFilter(product, selectedFabrics) {
  if (!selectedFabrics || selectedFabrics.length === 0 || selectedFabrics.includes("All")) {
    return true;
  }
  const pFabric = (product.fabric || product.material || "").trim().toLowerCase();

  return selectedFabrics.some((f) => {
    const sf = (f || "").trim().toLowerCase();
    if (!sf || sf === "all") return true;

    // Fabric families are curated (see FABRIC_DISPLAY_ORDER), so match exactly:
    // ticking "Chanderi Silk" should not also show Mul Chanderi pieces.
    return pFabric === sf;
  });
}

export function matchesPriceFilter(product, selectedPriceRangeIds) {
  if (!selectedPriceRangeIds || selectedPriceRangeIds.length === 0) {
    return true;
  }
  const price = getEffectivePrice(product);
  if (isNaN(price)) return false;

  return selectedPriceRangeIds.some((rangeId) => {
    const range = PRICE_RANGES.find((r) => r.id === rangeId);
    return range ? range.test(price) : false;
  });
}

export function matchesAvailabilityFilter(product, activeAvailability) {
  if (!activeAvailability || activeAvailability === "All") return true;
  if (activeAvailability === "in-stock") return isProductAvailable(product);
  if (activeAvailability === "sold-out") return !isProductAvailable(product);
  return true;
}

export const sortProductsByMode = (
  list,
  mode = "category_first_manual",
  categoryOrder = ["Sarees", "Dupattas", "Kurta Sets", "Blouses", "Others"]
) => {
  const getRank = (cat) => {
    if (!cat) return categoryOrder.length;
    const norm = normalizeCategoryName(cat);
    const idx = categoryOrder.findIndex((c) => matchesCategory(norm, c));
    return idx === -1 ? categoryOrder.length : idx;
  };

  const comparePrio = (a, b) => {
    const prioA = a.displayOrder && a.displayOrder > 0 ? a.displayOrder : Infinity;
    const prioB = b.displayOrder && b.displayOrder > 0 ? b.displayOrder : Infinity;
    if (prioA !== prioB) return prioA - prioB;
    return 0;
  };

  const compareNew = (a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
    if (timeA !== timeB) return timeB - timeA;
    return String(b.id || "").localeCompare(String(a.id || ""));
  };

  const compareOld = (a, b) => {
    const timeA = a.createdAt ? new Date(a.createdAt).getTime() : Infinity;
    const timeB = b.createdAt ? new Date(b.createdAt).getTime() : Infinity;
    if (timeA !== timeB) return timeA - timeB;
    return String(a.id || "").localeCompare(String(b.id || ""));
  };

  const copy = [...list];

  switch (mode) {
    case "category_first_manual":
      return copy.sort((a, b) => {
        const rankA = getRank(a.category);
        const rankB = getRank(b.category);
        if (rankA !== rankB) return rankA - rankB;
        const prio = comparePrio(a, b);
        if (prio !== 0) return prio;
        return compareNew(a, b);
      });

    case "category_oldest":
      return copy.sort((a, b) => {
        const rankA = getRank(a.category);
        const rankB = getRank(b.category);
        if (rankA !== rankB) return rankA - rankB;
        return compareOld(a, b);
      });

    case "category_newest":
      return copy.sort((a, b) => {
        const rankA = getRank(a.category);
        const rankB = getRank(b.category);
        if (rankA !== rankB) return rankA - rankB;
        return compareNew(a, b);
      });

    case "oldest_first":
      return copy.sort((a, b) => compareOld(a, b));

    case "newest_first":
      return copy.sort((a, b) => compareNew(a, b));

    case "manual_priority":
      return copy.sort((a, b) => {
        const prio = comparePrio(a, b);
        if (prio !== 0) return prio;
        return compareNew(a, b);
      });

    default:
      return copy.sort((a, b) => {
        const rankA = getRank(a.category);
        const rankB = getRank(b.category);
        if (rankA !== rankB) return rankA - rankB;
        const prio = comparePrio(a, b);
        if (prio !== 0) return prio;
        return compareNew(a, b);
      });
  }
};

export function sortProducts(list, sortBy, shopSortSettings) {
  const copy = [...list];

  switch (sortBy) {
    case "price-asc":
      return copy.sort((a, b) => {
        const pA = getEffectivePrice(a);
        const pB = getEffectivePrice(b);
        if (pA !== pB) return pA - pB;
        return String(a.id || "").localeCompare(String(b.id || ""));
      });

    case "price-desc":
      return copy.sort((a, b) => {
        const pA = getEffectivePrice(a);
        const pB = getEffectivePrice(b);
        if (pA !== pB) return pB - pA;
        return String(a.id || "").localeCompare(String(b.id || ""));
      });

    case "name-asc":
      return copy.sort((a, b) => {
        const titleA = a.title || "";
        const titleB = b.title || "";
        const cmp = titleA.localeCompare(titleB);
        if (cmp !== 0) return cmp;
        return String(a.id || "").localeCompare(String(b.id || ""));
      });

    case "newest":
      return copy.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (timeA !== timeB) return timeB - timeA;
        return String(b.id || "").localeCompare(String(a.id || ""));
      });

    case "oldest":
      return copy.sort((a, b) => {
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : Infinity;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : Infinity;
        if (timeA !== timeB) return timeA - timeB;
        return String(a.id || "").localeCompare(String(b.id || ""));
      });

    case "recommended":
    default:
      return sortProductsByMode(
        copy,
        shopSortSettings?.sortMode || "category_first_manual",
        shopSortSettings?.categoryOrder || [
          "Sarees",
          "Dupattas",
          "Kurta Sets",
          "Blouses",
          "Others",
        ]
      );
  }
}
