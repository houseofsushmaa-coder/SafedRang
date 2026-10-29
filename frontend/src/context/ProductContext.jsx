import React, { createContext, useState, useContext, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { products as staticProducts } from "../data/products";

const ProductContext = createContext();

// Helper to normalize a raw Supabase product row into the frontend shape
const formatProduct = (p) => {
  const stock = p.stock !== undefined && p.stock !== null ? Number(p.stock) : 2;
  const rawStatus = (p.stock_status || p.stockStatus || "").toLowerCase();
  const isOut = rawStatus === "out of stock" || rawStatus === "sold out" || stock <= 0;

  return {
    id: p.id,
    title: p.name || p.title || "",
    category: p.category?.name || p.category_name || p.category || "Uncategorized",
    price: Number(p.price || 0),
    salePrice: p.sale_price ? Number(p.sale_price) : p.salePrice ? Number(p.salePrice) : null,
    description: p.description || "",
    subcategory: p.subcategory || p.sub_category || "",
    craft: p.craft || "",
    fabric: p.fabric || p.material || "",
    // Images can come from a joined table or a direct column
    image:
      p.images?.[0]?.url ||
      p.images?.[0] ||
      p.image_url ||
      p.image ||
      "https://via.placeholder.com/450x572?text=No+Image",
    images:
      Array.isArray(p.images)
        ? p.images.map((img) => (typeof img === "string" ? img : img.url))
        : p.image_url
        ? [p.image_url]
        : [],
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

      // Try with joined images table first
      let { data, error } = await supabase
        .from("products")
        .select(
          `*, category:categories(name), images:product_images(url)`
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
        setProducts((data || []).map(formatProduct));
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
      category: product.category || "Uncategorized",
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
      await supabase.from("products").insert([
        {
          name: formatted.title,
          price: formatted.price,
          sale_price: formatted.salePrice,
          stock: formatted.stock,
          description: formatted.description,
          category_name: formatted.category,
          sku: formatted.sku,
          image_url: formatted.image,
        },
      ]);
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
    setProducts((prev) =>
      prev.map((p) => (p.id === id ? { ...p, ...updatedData } : p))
    );

    try {
      await supabase
        .from("products")
        .update({
          name: updatedData.title,
          price: updatedData.price,
          sale_price: updatedData.salePrice,
          description: updatedData.description,
          stock: updatedData.stockStatus === "In Stock" ? (updatedData.stock || 10) : 0,
          sku: updatedData.sku,
          image_url: updatedData.image,
        })
        .eq("id", id);
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
