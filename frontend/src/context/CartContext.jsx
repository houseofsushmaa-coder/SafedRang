import React, { createContext, useContext, useState, useEffect, useMemo } from "react";
import { useProducts } from "./ProductContext";
import { trackEvent, toAnalyticsItem } from "../lib/tracking";

const CartContext = createContext();

const isVariableProduct = (p) =>
  p?.productType === "variable" && Array.isArray(p?.variations) && p.variations.length > 0;

// Live unit price and available stock for a product/size, matching the
// server-side pricing in supabase/functions/_shared/orders.ts.
export const resolveLine = (product, selectedSize) => {
  if (!product) return { unitPrice: 0, available: 0, purchasable: false };
  const base = product.salePrice > 0 ? product.salePrice : product.price || 0;
  const unavailable =
    product.isArchived || ["out of stock", "sold out"].includes((product.stockStatus || "").toLowerCase());
  if (isVariableProduct(product)) {
    const v = product.variations.find((x) => String(x.size) === String(selectedSize));
    if (!v) return { unitPrice: base, available: 0, purchasable: false };
    const available = Math.max(0, Number(v.stock ?? 0));
    return { unitPrice: base + Number(v.priceModifier || 0), available, purchasable: !product.isArchived && available > 0 };
  }
  const available = Math.max(0, Number(product.stock ?? 0));
  return { unitPrice: base, available, purchasable: !unavailable && available > 0 };
};

export const CartProvider = ({ children }) => {
  const { products, loading: productsLoading } = useProducts();

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

  const productById = useMemo(() => new Map(products.map((p) => [String(p.id), p])), [products]);

  // Cart lines re-priced against the live catalogue. Until the catalogue has
  // loaded we fall back to the price captured when the item was added.
  const cartLines = useMemo(
    () =>
      cart.map((item) => {
        const live = productById.get(String(item.id));
        if (!live) {
          return {
            ...item,
            unitPrice: item.unitPrice ?? (item.salePrice || item.price || 0),
            available: productsLoading ? item.quantity : 0,
            purchasable: productsLoading,
          };
        }
        const { unitPrice, available, purchasable } = resolveLine(live, item.selectedSize);
        return {
          ...item,
          title: live.title || item.title,
          image: live.image || item.image,
          images: live.images?.length ? live.images : item.images,
          unitPrice,
          available,
          purchasable: purchasable && available >= item.quantity,
        };
      }),
    [cart, productById, productsLoading]
  );

  const cartSubtotal = cartLines.reduce((acc, l) => acc + l.unitPrice * l.quantity, 0);
  const hasUnavailableItems = cartLines.some((l) => !l.purchasable);

  // --- Cart Actions ---
  // Returns { ok, reason } so callers can explain why nothing was added.
  const addToCart = (product, quantity = 1) => {
    const live = productById.get(String(product.id)) || product;
    if (isVariableProduct(live) && !product.selectedSize) return { ok: false, reason: "needs_size" };

    const { unitPrice, available, purchasable } = resolveLine(live, product.selectedSize);
    if (!purchasable) return { ok: false, reason: "sold_out" };

    const cartItemId = product.selectedSize ? `${product.id}-${product.selectedSize}` : product.id;
    const inCart = cart.find((item) => (item.cartItemId || item.id) === cartItemId)?.quantity || 0;
    const addable = Math.min(quantity, available - inCart);
    if (addable <= 0) return { ok: false, reason: "max_reached", available };

    setCart((prev) => {
      const existing = prev.find((item) => (item.cartItemId || item.id) === cartItemId);
      if (existing) {
        return prev.map((item) =>
          (item.cartItemId || item.id) === cartItemId ? { ...item, quantity: item.quantity + addable } : item
        );
      }
      return [...prev, { ...product, unitPrice, cartItemId, quantity: addable }];
    });

    trackEvent("add_to_cart", {
      value: unitPrice * addable,
      items: [toAnalyticsItem(live, { price: unitPrice, quantity: addable, variant: product.selectedSize })],
    });
    return { ok: true, capped: addable < quantity, available };
  };

  const removeFromCart = (targetId) => {
    const removed = cartLines.find((item) => (item.cartItemId || item.id) === targetId || item.id === targetId);
    setCart((prev) =>
      prev.filter((item) => (item.cartItemId || item.id) !== targetId && item.id !== targetId)
    );
    if (removed) {
      trackEvent("remove_from_cart", {
        value: removed.unitPrice * removed.quantity,
        items: [toAnalyticsItem(removed, { price: removed.unitPrice, quantity: removed.quantity, variant: removed.selectedSize })],
      });
    }
  };

  const updateQuantity = (targetId, quantity) => {
    if (quantity < 1) return;
    const line = cartLines.find((item) => (item.cartItemId || item.id) === targetId || item.id === targetId);
    const capped = line && !productsLoading ? Math.min(quantity, Math.max(1, line.available)) : quantity;
    setCart((prev) =>
      prev.map((item) =>
        (item.cartItemId || item.id) === targetId || item.id === targetId
          ? { ...item, quantity: capped }
          : item
      )
    );
  };

  const clearCart = () => setCart([]);

  // --- Wishlist Actions ---
  const toggleWishlist = (product) => {
    const exists = wishlist.some((item) => item.id === product.id);
    setWishlist((prev) =>
      exists ? prev.filter((item) => item.id !== product.id) : [...prev, product]
    );
    if (!exists) {
      const { unitPrice } = resolveLine(product, null);
      trackEvent("add_to_wishlist", {
        value: unitPrice,
        items: [toAnalyticsItem(product, { price: unitPrice })],
      });
    }
  };

  const isInWishlist = (id) => {
    return wishlist.some((item) => item.id === id);
  };

  return (
    <CartContext.Provider
      value={{
        cart,
        cartLines,
        cartSubtotal,
        hasUnavailableItems,
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
