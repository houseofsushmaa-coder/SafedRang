import React, { createContext, useState, useContext, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { products as staticProducts } from "../data/products";

import {
  normalizeCategoryName,
  DEFAULT_SHOP_SORT_SETTINGS,
  matchesCategory,
  sortProductsByMode,
} from "../utils/filterUtils.js";

const ProductContext = createContext();

export {
  normalizeCategoryName,
  DEFAULT_SHOP_SORT_SETTINGS,
  matchesCategory,
  sortProductsByMode,
};

// Helper to normalize a raw Supabase product row into the frontend shape
const formatProduct = (p) => {
  const isArchived = Boolean(p.is_archived ?? p.isArchived ?? (p.status === "ARCHIVED"));
  const needsReview = Boolean(p.needs_review ?? p.needsReview ?? false);
  const isVariable = p.product_type === "variable" || p.productType === "variable";

  let computedStock = p.stock !== undefined && p.stock !== null ? Number(p.stock) : 2;
  if (isVariable && Array.isArray(p.variations) && p.variations.length > 0) {
    computedStock = p.variations.reduce((sum, v) => sum + (Number(v.stock) || 0), 0);
  }

  const rawStatus = (p.stock_status || p.status || p.stockStatus || "").toLowerCase();
  const isOut = rawStatus === "out of stock" || rawStatus === "sold out" || computedStock <= 0;

  // Resolve images from jsonb column, joined table, or image_url
  let resolvedImages = [];
  if (Array.isArray(p.images) && p.images.length > 0) {
    resolvedImages = p.images
      .map((img) => (typeof img === "string" ? img : img?.url))
      .filter(Boolean);
  } else if (p.images && typeof p.images === "string") {
    try {
      const parsed = JSON.parse(p.images);
      if (Array.isArray(parsed)) resolvedImages = parsed.filter(Boolean);
    } catch {
      resolvedImages = [p.images];
    }
  }

  // Primary image —優先 priority: p.image_url -> p.image -> first in resolvedImages
  const primaryImage =
    p.image_url ||
    p.image ||
    resolvedImages[0] ||
    "https://via.placeholder.com/450x572?text=No+Image";

  // Ensure primary image is always at index 0 of images list
  let finalImages = resolvedImages.slice();
  if (primaryImage && !finalImages.includes(primaryImage)) {
    finalImages.unshift(primaryImage);
  } else if (primaryImage && finalImages[0] !== primaryImage) {
    finalImages = [primaryImage, ...finalImages.filter((x) => x !== primaryImage)];
  }
  if (finalImages.length === 0 && primaryImage) {
    finalImages = [primaryImage];
  }

  return {
    id: String(p.id),
    title: p.name || p.title || "",
    category: normalizeCategoryName(p.category?.name || p.category_name || p.category),
    price: Number(p.price || 0),
    salePrice: p.salePrice ? Number(p.salePrice) : p.sale_price ? Number(p.sale_price) : null,
    description: p.description || "",
    subcategory: p.subcategory || p.sub_category || "",
    craft: p.craft || "",
    fabric: p.fabric || p.material || "",
    image: primaryImage,
    images: finalImages,
    stockStatus: isOut ? "Out of Stock" : (computedStock < 5 ? "Low Stock" : "In Stock"),
    stock: computedStock,
    isArchived,
    needsReview,
    sku: p.sku || "",
    displayOrder: isNaN(displayOrderVal) ? 0 : displayOrderVal,
    createdAt: p.createdAt || p.created_at || null,
    // Variation support
    productType: p.productType || p.product_type || "simple",
    attributeName: p.attributeName || p.attribute_name || "Size",
    variations: Array.isArray(p.variations) ? p.variations : [],
    badge: p.badge || (p.is_one_of_one ? "One of One" : p.bestseller ? "Best Seller" : p.newArrival ? "New Arrival" : null),
    isOneOfOne: Boolean(p.is_one_of_one ?? p.isOneOfOne ?? (p.badge === "One of One")),
  };
};

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);
  const [shopSortSettings, setShopSortSettings] = useState(DEFAULT_SHOP_SORT_SETTINGS);

  const fetchShopSortSettings = async () => {
    try {
      const { data, error } = await supabase
        .from("settings")
        .select("value")
        .eq("key", "shop_sort_settings")
        .maybeSingle();

      if (!error && data && data.value) {
        const val = typeof data.value === "string" ? JSON.parse(data.value) : data.value;
        if (val && val.sortMode) {
          setShopSortSettings(val);
          try {
            localStorage.setItem("safedrang_shop_sort_settings", JSON.stringify(val));
          } catch {}
          return;
        }
      }
    } catch (err) {
      console.warn("Could not fetch shop_sort_settings:", err);
    }

    try {
      const local = localStorage.getItem("safedrang_shop_sort_settings");
      if (local) {
        setShopSortSettings(JSON.parse(local));
      }
    } catch {}
  };

  const updateShopSortSettings = async (newSettings) => {
    const merged = { ...shopSortSettings, ...newSettings };
    setShopSortSettings(merged);
    try {
      localStorage.setItem("safedrang_shop_sort_settings", JSON.stringify(merged));
    } catch {}

    try {
      await supabase.from("settings").upsert(
        {
          id: "setting_shop_sort",
          key: "shop_sort_settings",
          value: merged,
          group: "shop",
          updatedAt: new Date().toISOString(),
        },
        { onConflict: "key" }
      );
    } catch (err) {
      console.warn("Could not persist shop_sort_settings in Supabase:", err);
    }
  };

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setFetchError(null);

      // Fetch products directly with image_url, images, variations, and category
      let { data, error } = await supabase
        .from("products")
        .select("*")
        .limit(300);

      if (error) {
        console.warn("Direct select failed, trying fallback:", error.message);
        throw error;
      }

      if (!data || data.length === 0) {
        console.log("No products found in database, falling back to static products");
        const formattedStatic = staticProducts.map(formatProduct);
        const seen = new Set();
        const deduped = formattedStatic.filter((p) => !seen.has(p.id) && seen.add(p.id));
        setProducts(deduped);
      } else {
        const formatted = data.map(formatProduct);
        const seen = new Set();
        const deduped = [];
        for (const p of formatted) {
          if (!p.id) continue;
          if (!seen.has(p.id)) {
            seen.add(p.id);
            deduped.push(p);
          }
        }
        setProducts(deduped);
        try {
          localStorage.setItem("safedrang_products_cache", JSON.stringify(deduped));
        } catch (e) {}
      }
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setFetchError(err.message);
      // Fallback: check localStorage cache, else staticProducts
      try {
        const cached = localStorage.getItem("safedrang_products_cache");
        if (cached) {
          setProducts(JSON.parse(cached));
          return;
        }
      } catch (e) {}
      setProducts(staticProducts);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
    fetchShopSortSettings();
  }, []);

  const addProduct = async (product) => {
    const formatted = {
      id: product.id || `prod_${Date.now()}_${Math.floor(Math.random() * 1000)}`,
      title: product.title || product.name || "",
      category: normalizeCategoryName(product.category),
      price: Number(product.price || 0),
      salePrice: product.salePrice ? Number(product.salePrice) : null,
      description: product.description || "",
      sku: product.sku || `SR-${Date.now()}`,
      fabric: product.fabric || "",
      image: product.image || product.images?.[0] || "",
      images: product.images || (product.image ? [product.image] : []),
      stockStatus: (product.stock > 0 || product.stockStatus === "In Stock") ? "In Stock" : "Out of Stock",
      stock: product.stock !== undefined ? Number(product.stock) : 10,
      // Variation support
      productType: product.productType || "simple",
      attributeName: product.attributeName || "Size",
      variations: Array.isArray(product.variations) ? product.variations : [],
      badge: product.badge || (product.isOneOfOne ? "One of One" : null),
      isOneOfOne: product.badge === "One of One" || Boolean(product.isOneOfOne),
      isArchived: Boolean(product.isArchived),
      needsReview: Boolean(product.needsReview),
      displayOrder: Number(product.displayOrder ?? product.display_order ?? 0) || 0,
    };

    setProducts((prev) => [formatted, ...prev]);

    try {
      const imagesArr = formatted.images.filter(Boolean);
      const { error } = await supabase.from("products").insert([
        {
          name: formatted.title,
          price: formatted.price,
          sale_price: formatted.salePrice ?? null,
          stock: formatted.stock,
          stock_status: formatted.stockStatus,
          description: formatted.description,
          category_name: formatted.category,
          sku: formatted.sku,
          image_url: imagesArr[0] || formatted.image || null,
          images: imagesArr,
          product_type: formatted.productType || "simple",
          attribute_name: formatted.attributeName || "Size",
          variations: formatted.variations || [],
          badge: formatted.badge || (formatted.isOneOfOne ? "One of One" : null),
          is_one_of_one: Boolean(formatted.isOneOfOne),
          is_archived: Boolean(formatted.isArchived),
          needs_review: Boolean(formatted.needsReview),
          display_order: Number(formatted.displayOrder || 0),
        },
      ]);
      if (error) {
        console.warn("Could not insert product into Supabase:", error.message);
        throw new Error(error.message);
      }
    } catch (err) {
      console.warn("Could not insert product into Supabase:", err);
    }
  };

  const deleteProduct = async (id) => {
    setProducts((prev) => prev.filter((p) => p.id !== id));
    try {
      await supabase.from("products").delete().eq("id", id);
    } catch (err) {
      console.warn("Failed to delete product from Supabase:", err);
    }
  };

  const updateProduct = async (id, updatedData) => {
    // Standardize images array
    const rawImages = Array.isArray(updatedData.images)
      ? updatedData.images.filter(Boolean)
      : updatedData.image
      ? [updatedData.image]
      : [];

    const primaryImage = updatedData.image || rawImages[0] || null;
    const syncedImages = primaryImage
      ? [primaryImage, ...rawImages.filter((x) => x !== primaryImage)]
      : rawImages;

    // Merge into local state immediately (optimistic update)
    const assignedBadge = updatedData.badge !== undefined
      ? (updatedData.badge || null)
      : (updatedData.isOneOfOne ? "One of One" : null);

    const isArchivedVal = updatedData.isArchived !== undefined
      ? Boolean(updatedData.isArchived)
      : Boolean(updatedData.status === "ARCHIVED");
    const needsReviewVal = Boolean(updatedData.needsReview);

    const merged = {
      ...updatedData,
      id: String(id),
      image: primaryImage,
      images: syncedImages,
      badge: assignedBadge,
      isOneOfOne: assignedBadge === "One of One" || Boolean(updatedData.isOneOfOne),
      isArchived: isArchivedVal,
      needsReview: needsReviewVal,
      displayOrder: Number(updatedData.displayOrder ?? updatedData.display_order ?? 0) || 0,
      category: normalizeCategoryName(updatedData.category),
    };

    setProducts((prev) => {
      const next = prev.map((p) => (String(p.id) === String(id) ? { ...p, ...merged } : p));
      try {
        localStorage.setItem("safedrang_products_cache", JSON.stringify(next));
      } catch (e) {}
      return next;
    });

    try {
      const dbPayload = {
        name: updatedData.title,
        price: updatedData.price,
        "salePrice": updatedData.salePrice ?? null,
        description: updatedData.description,
        stock:
          updatedData.productType === "variable"
            ? (updatedData.stock ?? 0)
            : updatedData.stockStatus === "In Stock"
            ? updatedData.stock || 10
            : 0,
        stock_status: updatedData.stockStatus || "In Stock",
        status: "PUBLISHED",
        sku: updatedData.sku || null,
        image_url: primaryImage,
        images: syncedImages,
        category_name: normalizeCategoryName(updatedData.category),
        product_type: updatedData.productType || "simple",
        attribute_name: updatedData.attributeName || "Size",
        variations: Array.isArray(updatedData.variations)
          ? updatedData.variations
          : [],
        badge: assignedBadge,
        is_one_of_one: assignedBadge === "One of One" || Boolean(updatedData.isOneOfOne),
        bestseller: assignedBadge === "Best Seller",
        newArrival: assignedBadge === "New Arrival",
        is_archived: isArchivedVal,
        needs_review: needsReviewVal,
        display_order: Number(updatedData.displayOrder ?? updatedData.display_order ?? 0) || 0,
        "updatedAt": new Date().toISOString(),
      };

      const { error } = await supabase
        .from("products")
        .update(dbPayload)
        .eq("id", id);

      if (error) {
        console.error("Failed to update product in Supabase:", error.message);
        throw new Error(error.message);
      }
    } catch (err) {
      console.warn("Failed to update product in Supabase:", err);
    }
  };

  const importProducts = () => {
    console.log("Import handled via Supabase now");
  };

  const getAllCategories = () => {
    const cats = new Set(products.map((p) => p.category));
    return ["All", ...Array.from(cats)];
  };


  const archiveProduct = async (id) => {
    setProducts((prev) =>
      prev.map((p) => (String(p.id) === String(id) ? { ...p, isArchived: true, status: "ARCHIVED" } : p))
    );
    try {
      await supabase.from("products").update({ is_archived: true, status: "ARCHIVED" }).eq("id", id);
    } catch (err) {
      console.warn("Failed to archive product:", err);
    }
  };

  const restoreProduct = async (id) => {
    setProducts((prev) =>
      prev.map((p) => (String(p.id) === String(id) ? { ...p, isArchived: false, status: "PUBLISHED" } : p))
    );
    try {
      await supabase.from("products").update({ is_archived: false, status: "PUBLISHED" }).eq("id", id);
    } catch (err) {
      console.warn("Failed to restore product:", err);
    }
  };

  const toggleNeedsReview = async (id) => {
    let nextVal = false;
    setProducts((prev) =>
      prev.map((p) => {
        if (String(p.id) === String(id)) {
          nextVal = !p.needsReview;
          return { ...p, needsReview: nextVal };
        }
        return p;
      })
    );
    try {
      await supabase.from("products").update({ needs_review: nextVal }).eq("id", id);
    } catch (err) {
      console.warn("Failed to toggle needs_review:", err);
    }
  };

  const quickUpdateStock = async (id, newStock) => {
    const qty = Math.max(0, Number(newStock));
    const stockStatus = qty > 0 ? "In Stock" : "Out of Stock";
    setProducts((prev) =>
      prev.map((p) => (String(p.id) === String(id) ? { ...p, stock: qty, stockStatus } : p))
    );
    try {
      await supabase.from("products").update({ stock: qty, stock_status: stockStatus }).eq("id", id);
    } catch (err) {
      console.warn("Failed to update stock:", err);
    }
  };

  const bulkArchive = async (ids) => {
    const idSet = new Set(ids.map(String));
    setProducts((prev) =>
      prev.map((p) => (idSet.has(String(p.id)) ? { ...p, isArchived: true, status: "ARCHIVED" } : p))
    );
    try {
      await supabase.from("products").update({ is_archived: true, status: "ARCHIVED" }).in("id", Array.from(idSet));
    } catch (err) {
      console.warn("Failed to bulk archive:", err);
    }
  };

  const bulkRestore = async (ids) => {
    const idSet = new Set(ids.map(String));
    setProducts((prev) =>
      prev.map((p) => (idSet.has(String(p.id)) ? { ...p, isArchived: false, status: "PUBLISHED" } : p))
    );
    try {
      await supabase.from("products").update({ is_archived: false, status: "PUBLISHED" }).in("id", Array.from(idSet));
    } catch (err) {
      console.warn("Failed to bulk restore:", err);
    }
  };

  const bulkUpdateStockStatus = async (ids, newStatus) => {
    const idSet = new Set(ids.map(String));
    const qty = newStatus === "Out of Stock" ? 0 : 2;
    setProducts((prev) =>
      prev.map((p) => (idSet.has(String(p.id)) ? { ...p, stockStatus: newStatus, stock: p.stock > 0 && newStatus === "In Stock" ? p.stock : qty } : p))
    );
    try {
      await supabase.from("products").update({ stock_status: newStatus, stock: qty }).in("id", Array.from(idSet));
    } catch (err) {
      console.warn("Failed to bulk update stock status:", err);
    }
  };

  const bulkDelete = async (ids) => {
    const idSet = new Set(ids.map(String));
    setProducts((prev) => prev.filter((p) => !idSet.has(String(p.id))));
    try {
      await supabase.from("products").delete().in("id", Array.from(idSet));
    } catch (err) {
      console.warn("Failed to bulk delete:", err);
    }
  };

  return (
    <ProductContext.Provider
      value={{
        products,
        loading,
        fetchError,
        addProduct,
        deleteProduct,
        importProducts,
        updateProduct,
        archiveProduct,
        restoreProduct,
        toggleNeedsReview,
        quickUpdateStock,
        bulkArchive,
        bulkRestore,
        bulkUpdateStockStatus,
        bulkDelete,
        getAllCategories,
        shopSortSettings,
        updateShopSortSettings,
        refetch: fetchProducts,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => useContext(ProductContext);
