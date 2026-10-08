import React, { createContext, useState, useContext, useEffect } from "react";
import { supabase } from "../lib/supabase";
import { products as staticProducts } from "../data/products";

const ProductContext = createContext();

// Helper to normalize a raw Supabase product row into the frontend shape
const formatProduct = (p) => ({
  id: p.id,
  title: p.name || p.title || "",
  category: p.category?.name || p.category_name || p.category || "Uncategorized",
  price: Number(p.price || 0),
  salePrice: p.sale_price ? Number(p.sale_price) : p.salePrice ? Number(p.salePrice) : null,
  description: p.description || "",
  sku: p.sku || "",
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
  stockStatus: (p.stock > 0 || p.in_stock) ? "In Stock" : "Out of Stock",
  stock: p.stock ?? 0,
});

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
    try {
      const { error } = await supabase.from("products").insert([
        {
          name: product.title,
          price: product.price,
          stock: 10,
          description: product.description || "",
        },
      ]);
      if (error) throw error;
      fetchProducts();
    } catch (err) {
      console.error("Failed to add product:", err);
    }
  };

  const deleteProduct = async (id) => {
    try {
      const { error } = await supabase.from("products").delete().eq("id", id);
      if (error) throw error;
      setProducts((prev) => prev.filter((p) => p.id !== id));
    } catch (err) {
      console.error("Failed to delete product:", err);
    }
  };

  const updateProduct = async (id, updatedData) => {
    try {
      const { error } = await supabase
        .from("products")
        .update({
          name: updatedData.title,
          price: updatedData.price,
          sale_price: updatedData.salePrice,
          description: updatedData.description,
          stock: updatedData.stockStatus === "In Stock" ? 10 : 0,
        })
        .eq("id", id);
      if (error) throw error;
      fetchProducts();
    } catch (err) {
      console.error("Failed to update product:", err);
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
