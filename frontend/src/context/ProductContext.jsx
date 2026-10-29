import React, { createContext, useState, useContext, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { products as staticProducts } from "../data/products";

const ProductContext = createContext();

// Helper to normalize category names across CSV imports, database, and UI
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

// Helper to normalize a raw Supabase product row into the frontend shape
const formatProduct = (p) => {
  const stock = p.stock !== undefined && p.stock !== null ? Number(p.stock) : 2;
  const rawStatus = (p.stock_status || p.status || p.stockStatus || "").toLowerCase();
  const isOut = rawStatus === "out of stock" || rawStatus === "sold out" || stock <= 0;

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
    stockStatus: isOut ? "Out of Stock" : "In Stock",
    stock,
    sku: p.sku || "",
    // Variation support
    productType: p.productType || p.product_type || "simple",
    attributeName: p.attributeName || p.attribute_name || "Size",
    variations: Array.isArray(p.variations) ? p.variations : [],
  };
};

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

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
        setProducts(staticProducts);
      } else {
        const formatted = data.map(formatProduct);
        setProducts(formatted);
        try {
          localStorage.setItem("safedrang_products_cache", JSON.stringify(formatted));
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
        },
      ]);
      if (error) console.warn("Could not insert product into Supabase:", error.message);
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
    const merged = {
      ...updatedData,
      id: String(id),
      image: primaryImage,
      images: syncedImages,
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
        "updatedAt": new Date().toISOString(),
      };

      const { error } = await supabase
        .from("products")
        .update(dbPayload)
        .eq("id", id);

      if (error) {
        console.error("Failed to update product in Supabase:", error.message);
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
        getAllCategories,
        refetch: fetchProducts,
      }}
    >
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => useContext(ProductContext);
