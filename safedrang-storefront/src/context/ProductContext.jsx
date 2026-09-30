import React, { createContext, useState, useContext, useEffect } from 'react';
import axios from 'axios';

const ProductContext = createContext();

export const ProductProvider = ({ children }) => {
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch products from our new live backend!
  const fetchProducts = async () => {
    try {
      setLoading(true);
      const res = await axios.get('http://localhost:5000/api/v1/products?limit=200');
      
      // Transform backend data to match the frontend shape
      const formattedProducts = res.data.data.map(p => ({
        id: p.id,
        title: p.name,
        category: p.category?.name || 'Uncategorized',
        price: p.price,
        salePrice: p.salePrice,
        description: p.description,
        sku: p.sku,
        image: p.images?.[0]?.url || 'https://via.placeholder.com/450x572?text=No+Image',
        images: p.images?.map(img => img.url) || [],
        stockStatus: p.stock > 0 ? 'In Stock' : 'Out of Stock',
        stock: p.stock
      }));

      setProducts(formattedProducts);
    } catch (error) {
      console.error('Failed to fetch products:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

  const addProduct = async (product) => {
    try {
      await axios.post('http://localhost:5000/api/v1/products', {
        name: product.title,
        price: product.price,
        stock: 10, // Default for now
        description: product.description || ''
      });
      fetchProducts(); // Refresh list
    } catch (error) {
      console.error('Failed to add product', error);
    }
  };

  const deleteProduct = async (id) => {
    try {
      await axios.delete(`http://localhost:5000/api/v1/products/${id}`);
      setProducts(products.filter(p => p.id !== id));
    } catch (error) {
      console.error('Failed to delete', error);
    }
  };

  const updateProduct = async (id, updatedData) => {
    try {
      await axios.put(`http://localhost:5000/api/v1/products/${id}`, {
        name: updatedData.title,
        price: updatedData.price,
        salePrice: updatedData.salePrice,
        description: updatedData.description,
        stock: updatedData.stockStatus === 'In Stock' ? 10 : 0
      });
      fetchProducts();
    } catch (error) {
      console.error('Failed to update', error);
    }
  };

  const importProducts = (newProducts) => {
    // Deprecated for the UI, as we did this directly in backend
    console.log("Import handled via backend now");
  };

  const getAllCategories = () => {
    const categories = new Set(products.map(p => p.category));
    return ['All', ...Array.from(categories)];
  };

  return (
    <ProductContext.Provider value={{ 
      products, loading, addProduct, deleteProduct, importProducts, updateProduct, getAllCategories 
    }}>
      {children}
    </ProductContext.Provider>
  );
};

export const useProducts = () => {
  return useContext(ProductContext);
};
