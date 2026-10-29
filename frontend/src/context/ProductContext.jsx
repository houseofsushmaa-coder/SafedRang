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
  const rawStatus = (p.stock_status || p.stockStatus || "").toLowerCase();
  const isOut = rawStatus === "out of stock" || rawStatus === "sold out" || stock <= 0;

  // Resolve images — priority:
  // 1. product_images joined table (array of {url} objects)
  // 2. images column (jsonb array of strings or {url} objects)
  // 3. image_url column (single string)
  let resolvedImages = [];
  if (Array.isArray(p.images) && p.images.length > 0) {
    // Could be [{url: "..."}, ...] from joined table OR ["url", ...] from jsonb column
    resolvedImages = p.images.map((img) =>
      typeof img === "string" ? img : img?.url
    ).filter(Boolean);
  }
  if (resolvedImages.length === 0 && p.image_url) {
    resolvedImages = [p.image_url];
  }

  const primaryImage =
    resolvedImages[0] ||
    "https://via.placeholder.com/450x572?text=No+Image";

  return {
    id: p.id,
    title: p.name || p.title || "",
    category: normalizeCategoryName(p.category?.name || p.category_name || p.category),
    price: Number(p.price || 0),
    salePrice: p.sale_price ? Number(p.sale_price) : p.salePrice ? Number(p.salePrice) : null,
    description: p.description || "",
    subcategory: p.subcategory || p.sub_category || "",
    craft: p.craft || "",
    fabric: p.fabric || p.material || "",
    image: primaryImage,
    images: resolvedImages,
    stockStatus: isOut ? "Out of Stock" : "In Stock",
    stock,
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

      // Fetch products with category join + separate img_gallery alias for product_images table
      // We use 'img_gallery' alias to avoid shadowing the native 'images' column on the products table
      let { data, error } = await supabase
        .from("products")
        .select(
          `*, category:categories(name), img_gallery:product_images(url)`
        )
        .limit(200);

      // If that fails (e.g. joined table doesn't exist), fall back to simple select
      if (error) {
        console.warn("Full join failed, trying simple select:", error.message);
        const fallback = await supabase
          .from("products")
          .select("*")
          .limit(200);

        if (fallback.error) throw fallback.error;
        data = fallback.data;
      }

      if (!data || data.length === 0) {
        console.log("No products found in database, falling back to static products");
        setProducts(staticProducts);
      } else {
        // Normalize: merge img_gallery (joined table) into images field for formatProduct
        const normalized = data.map((row) => {
          const galleryUrls =
            Array.isArray(row.img_gallery) && row.img_gallery.length > 0
              ? row.img_gallery.map((g) => g?.url).filter(Boolean)
              : null;

          return {
            ...row,
            // If product_images table has entries, use those (they take priority over the column)
            images: galleryUrls || row.images || null,
          };
        });
        setProducts(normalized.map(formatProduct));
      }
    } catch (err) {
      console.error("Failed to fetch products:", err);
      setFetchError(err.message);
      // Fallback on error too
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
    // Merge into local state immediately (optimistic update)
    const merged = {
      ...updatedData,
      // Re-normalise category so UI stays consistent
      category: normalizeCategoryName(updatedData.category),
    };
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...merged } : p))
    );

    try {
      // Build the images array — always an array of strings
      const imagesArr = Array.isArray(updatedData.images)
        ? updatedData.images.filter(Boolean)
        : updatedData.image
        ? [updatedData.image]
        : [];

      // Primary image — first of the gallery, or the standalone image field
      const primaryImage = imagesArr[0] || updatedData.image || null;

      const dbPayload = {
        name: updatedData.title,
        price: updatedData.price,
        sale_price: updatedData.salePrice ?? null,
        description: updatedData.description,
        stock:
          updatedData.productType === "variable"
            ? (updatedData.stock ?? 0)
            : updatedData.stockStatus === "In Stock"
            ? updatedData.stock || 10
            : 0,
        stock_status: updatedData.stockStatus || "In Stock",
        sku: updatedData.sku || null,
        image_url: primaryImage,
        // Store the full images array as a JSON column (images[])
        // Works whether the column is jsonb or text[]
        images: imagesArr,
        category_name: normalizeCategoryName(updatedData.category),
        product_type: updatedData.productType || "simple",
        attribute_name: updatedData.attributeName || "Size",
        variations: Array.isArray(updatedData.variations)
          ? updatedData.variations
          : [],
      };

      const { error } = await supabase
        .from("products")
        .update(dbPayload)
        .eq("id", id);

      if (error) {
        // If images column doesn't exist, retry without it
        if (
          error.message?.includes("images") ||
          error.code === "PGRST204" ||
          error.code === "42703"
        ) {
          console.warn(
            "images column not found — retrying without images array:",
            error.message
          );
          const { images: _ignored, ...payloadWithoutImages } = dbPayload;
          const { error: retryError } = await supabase
            .from("products")
            .update(payloadWithoutImages)
            .eq("id", id);
          if (retryError)
            console.error("Retry also failed:", retryError.message);
        } else {
          console.error("Failed to update product in Supabase:", error.message);
        }
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
