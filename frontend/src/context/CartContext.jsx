import React, { createContext, useContext, useState, useEffect } from "react";

const CartContext = createContext();

export const CartProvider = ({ children }) => {
  const [cart, setCart] = useState(() => {
    try {
      // Clear legacy cart with old demo items so user bag starts fresh & empty
      localStorage.removeItem("safed_cart");
      const saved = localStorage.getItem("safed_cart_v2");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  const [wishlist, setWishlist] = useState(() => {
    try {
      const saved = localStorage.getItem("safed_wishlist");
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  useEffect(() => {
    try {
      localStorage.setItem("safed_cart_v2", JSON.stringify(cart));
    } catch (e) {
      console.warn("Could not save cart:", e);
    }
  }, [cart]);

  useEffect(() => {
    try {
      localStorage.setItem("safed_wishlist", JSON.stringify(wishlist));
    } catch (e) {
      console.warn("Could not save wishlist:", e);
    }
  }, [wishlist]);

  // --- Cart Actions ---
  const addToCart = (product, quantity = 1) => {
    setCart((prev) => {
      const cartItemId = product.selectedSize
        ? `${product.id}-${product.selectedSize}`
        : product.id;
      const existing = prev.find(
        (item) => (item.cartItemId || item.id) === cartItemId
      );
      if (existing) {
        return prev.map((item) =>
          (item.cartItemId || item.id) === cartItemId
            ? { ...item, quantity: item.quantity + quantity }
            : item
        );
      }
      return [...prev, { ...product, cartItemId, quantity }];
    });
  };

  const removeFromCart = (targetId) => {
    setCart((prev) =>
      prev.filter((item) => (item.cartItemId || item.id) !== targetId && item.id !== targetId)
    );
  };

  const updateQuantity = (targetId, quantity) => {
    if (quantity < 1) return;
    setCart((prev) =>
      prev.map((item) =>
        (item.cartItemId || item.id) === targetId || item.id === targetId
          ? { ...item, quantity }
          : item
      )
    );
  };

  const clearCart = () => setCart([]);

  // --- Wishlist Actions ---
  const toggleWishlist = (product) => {
    setWishlist((prev) => {
      const exists = prev.find((item) => item.id === product.id);
      if (exists) {
        return prev.filter((item) => item.id !== product.id);
      }
      return [...prev, product];
    });
  };

  const isInWishlist = (id) => {
    return wishlist.some((item) => item.id === id);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        addToCart,
        removeFromCart,
        updateQuantity,
        clearCart,
        cartCount: cart.reduce((acc, item) => acc + item.quantity, 0),
        wishlist,
        toggleWishlist,
        isInWishlist,
        wishlistCount: wishlist.length,
      }}
    >
      {children}
    </CartContext.Provider>
  );
};

export const useCart = () => useContext(CartContext);
