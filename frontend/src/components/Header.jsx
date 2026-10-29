import React, { useState, useEffect, useRef, useMemo } from "react";
import { Link, useNavigate } from "react-router-dom";
import {
  Search,
  ShoppingBag,
  Heart,
  User,
  Menu,
  X,
  Trash2,
  ArrowRight,
  Sparkles,
  ShoppingBasket,
  ChevronRight,
} from "lucide-react";
import { useCurrency } from "../context/CurrencyContext";
import { useCart } from "../context/CartContext";
import { useAuth } from "../context/AuthContext";
import { useProducts } from "../context/ProductContext";
import toast from "react-hot-toast";
import "./Header.css";

const POPULAR_SEARCH_TAGS = [
  "Chikankari Kurta",
  "Chanderi Dupatta",
  "Silk Saree",
  "White Chikankari",
  "Handcrafted Suit",
];

export default function Header() {
  const { currency, changeCurrency, supportedCurrencies, loadingRates, formatPrice } = useCurrency();
  const {
    cart,
    cartCount,
    wishlist,
    wishlistCount,
    toggleWishlist,
    addToCart,
    removeFromCart,
    clearCart,
  } = useCart();
  const { user, session, token, isAdmin } = useAuth();
  const { products = [] } = useProducts();
  const navigate = useNavigate();

  // Modals & Drawers state
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isWishlistOpen, setIsWishlistOpen] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const searchInputRef = useRef(null);

  const isLoggedIn = !!(user || session || token);
  const accountDestination = isLoggedIn 
    ? (isAdmin ? "/admin" : "/account") 
    : "/login";
  const accountTitle = isLoggedIn 
    ? (isAdmin ? "Admin Dashboard" : "My Account") 
    : "Sign In / Create Account";

  // Focus search input when search modal opens
  useEffect(() => {
    if (isSearchOpen) {
      document.body.style.overflow = "hidden";
      setTimeout(() => {
        searchInputRef.current?.focus();
      }, 100);
    } else {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isSearchOpen]);

  // Lock scroll when Wishlist or Mobile Menu open
  useEffect(() => {
    if (isWishlistOpen || isMobileMenuOpen) {
      document.body.style.overflow = "hidden";
    } else if (!isSearchOpen) {
      document.body.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
    };
  }, [isWishlistOpen, isMobileMenuOpen, isSearchOpen]);

  // Close modals on Escape key
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === "Escape") {
        setIsSearchOpen(false);
        setIsWishlistOpen(false);
        setIsMobileMenuOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, []);

  // AJAX live filter for products
  const searchResults = useMemo(() => {
    const query = searchQuery.trim().toLowerCase();
    if (!query) return [];

    return products
      .filter((p) => {
        const titleMatch = (p.title || "").toLowerCase().includes(query);
        const categoryMatch = (p.category || "").toLowerCase().includes(query);
        const fabricMatch = (p.fabric || "").toLowerCase().includes(query);
        const descMatch = (p.description || "").toLowerCase().includes(query);
        return titleMatch || categoryMatch || fabricMatch || descMatch;
      })
      .slice(0, 8); // Top 8 immediate matches
  }, [searchQuery, products]);

  const handleSearchResultClick = (productId) => {
    setIsSearchOpen(false);
    setSearchQuery("");
    navigate(`/product/${productId}`);
  };

  const handleMoveToBag = (product) => {
    addToCart(product, 1);
    toast.success(`"${product.title}" added to your bag`, {
      icon: "🛍️",
      duration: 2500,
    });
  };

  return (
    <>
      <header className="site-header">
        {/* Top Announcement Bar */}
        <div className="announcement-bar">
          <div className="announcement-content">
            <span>HANDCRAFTED IN LUCKNOW · WORLDWIDE SHIPPING</span>
            <span className="hidden-mobile">
              SLOW FASHION · HERITAGE CHIKANKARI
            </span>
          </div>
        </div>

        {/* Main Header Row: Left Menu · Center Logo · Right Actions (Full Width) */}
        <div className="header-main">
          {/* 1. LEFT: Desktop Navigation & Mobile Toggle */}
          <div className="header-left">
            <button
              className="mobile-menu-toggle"
              onClick={() => setIsMobileMenuOpen(true)}
              aria-label="Open Navigation Menu"
            >
              <Menu size={22} />
            </button>

            <nav className="desktop-nav" aria-label="Main Navigation">
              <ul>
                <li>
                  <Link to="/shop">SHOP</Link>
                </li>
                <li>
                  <Link to="/one-of-one">ONE-OF-ONE</Link>
                </li>
                <li>
                  <Link to="/craft">THE CRAFT</Link>
                </li>
                <li>
                  <Link to="/about">ABOUT US</Link>
                </li>
                <li>
                  <Link to="/journey">JOURNEY</Link>
                </li>
              </ul>
            </nav>
          </div>

          {/* 2. CENTER: Brand Logo Mathematically Centered */}
          <div className="header-center logo">
            <Link to="/" style={{ textDecoration: "none" }} aria-label="Safed Rang Boutique Home">
              <img
                src="/logo.png"
                alt="Safed Rang"
                className="site-logo-img"
              />
            </Link>
          </div>

          {/* 3. RIGHT: Actions (Currency, Search, Wishlist, Account, Cart) */}
          <div className="header-right header-actions">
            {/* Currency Selector (Desktop) */}
            <div className="currency-selector hidden-mobile">
              <select
                value={currency}
                onChange={(e) => changeCurrency(e.target.value)}
                disabled={loadingRates}
                aria-label="Select Currency"
              >
                {Object.keys(supportedCurrencies).map((code) => (
                  <option key={code} value={code}>
                    {code} ({supportedCurrencies[code].symbol})
                  </option>
                ))}
              </select>
            </div>

            {/* AJAX Live Search Trigger Button */}
            <button
              onClick={() => setIsSearchOpen(true)}
              className="header-action-btn search-trigger-btn"
              aria-label="Search Handcrafted Collection"
              title="Search Collection"
            >
              <Search size={20} />
            </button>

            {/* Wishlist Drawer Trigger Button */}
            <button
              onClick={() => setIsWishlistOpen(true)}
              className="header-action-btn wishlist-trigger-btn"
              aria-label={`Wishlist (${wishlistCount})`}
              title="Saved Wishlist"
            >
              <Heart size={20} />
              {wishlistCount > 0 && (
                <span className="cart-count wishlist-count">{wishlistCount}</span>
              )}
            </button>

            {/* User Account / Admin Dashboard */}
            <Link
              to={accountDestination}
              aria-label={accountTitle}
              title={accountTitle}
              className="header-action-btn header-account-btn"
            >
              <User size={20} />
              {isLoggedIn && <span className="account-status-dot" />}
            </Link>

            {/* Shopping Bag Button & Hover Mini-Cart Dropdown */}
            <div className="cart-wrapper">
              <Link
                to="/checkout"
                aria-label={`Shopping Bag (${cartCount} items)`}
                className="header-action-btn cart-btn"
              >
                <ShoppingBag size={20} />
                {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
              </Link>

              <div className="cart-dropdown">
                <div className="cart-dropdown-header">
                  <h4>Shopping Bag</h4>
                  {cart.length > 0 && (
                    <button
                      type="button"
                      className="cart-dropdown-clear-btn"
                      onClick={(e) => {
                        e.preventDefault();
                        e.stopPropagation();
                        clearCart();
                        toast.success("Shopping bag cleared");
                      }}
                      title="Clear all items from bag"
                    >
                      Clear Bag
                    </button>
                  )}
                </div>
                {cart.length === 0 ? (
                  <p className="empty-cart">Your shopping bag is currently empty.</p>
                ) : (
                  <div className="cart-items">
                    {cart.map((item) => {
                      const itemKey = item.cartItemId || item.id;
                      return (
                        <div key={itemKey} className="cart-item">
                          <img
                            src={item.images?.[0] || item.image || "https://via.placeholder.com/60x80?text=SR"}
                            alt={item.title}
                            onError={(e) => {
                              e.currentTarget.src = "/saree_category.jpeg";
                            }}
                          />
                          <div className="cart-item-info">
                            <div className="cart-item-title">{item.title.replace(/"/g, "")}</div>
                            {item.selectedSize && (
                              <div className="cart-item-variant">
                                Size: <strong>{item.selectedSize}</strong>
                              </div>
                            )}
                            <div className="cart-item-price">
                              {formatPrice(item.salePrice || item.price)} × {item.quantity}
                            </div>
                          </div>
                          <button
                            type="button"
                            className="cart-item-remove-btn"
                            onClick={(e) => {
                              e.preventDefault();
                              e.stopPropagation();
                              removeFromCart(itemKey);
                            }}
                            title="Remove item"
                            aria-label={`Remove ${item.title}`}
                          >
                            <X size={14} />
                          </button>
                        </div>
                      );
                    })}
                    <div className="cart-dropdown-footer">
                      <div className="cart-subtotal">
                        <span>Subtotal</span>
                        <span>
                          {formatPrice(
                            cart.reduce(
                              (acc, item) => acc + (item.salePrice || item.price) * item.quantity,
                              0
                            )
                          )}
                        </span>
                      </div>
                      <Link to="/checkout" className="btn-primary checkout-btn-dropdown">
                        Proceed to Checkout
                      </Link>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* =========================================================================
          1. LIVE AJAX SEARCH OVERLAY MODAL (LUXURY EDITORIAL THEME)
          ========================================================================= */}
      {isSearchOpen && (
        <div className="ajax-search-overlay" role="dialog" aria-modal="true">
          <div className="ajax-search-backdrop" onClick={() => setIsSearchOpen(false)} />
          
          <div className="ajax-search-container">
            {/* Search Header */}
            <div className="ajax-search-header">
              <div className="ajax-search-bar-wrapper">
                <Search size={22} className="ajax-search-icon" />
                <input
                  ref={searchInputRef}
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search for Lucknowi Chikankari kurtas, sarees, chanderi dupattas…"
                  className="ajax-search-input"
                  autoComplete="off"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="ajax-search-clear-btn"
                    aria-label="Clear Search Input"
                  >
                    <X size={18} />
                  </button>
                )}
              </div>

              <button
                type="button"
                onClick={() => setIsSearchOpen(false)}
                className="ajax-search-close-btn"
                aria-label="Close Search"
              >
                <X size={22} />
              </button>
            </div>

            {/* Popular Suggestion Pills */}
            <div className="ajax-popular-tags">
              <span className="tags-label">Trending Searches:</span>
              <div className="tags-pills">
                {POPULAR_SEARCH_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSearchQuery(tag)}
                    className={`tag-pill ${searchQuery.toLowerCase() === tag.toLowerCase() ? "active" : ""}`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </div>

            {/* Search Results Area */}
            <div className="ajax-search-results-area">
              {searchQuery.trim() === "" ? (
                <div className="ajax-search-empty-state">
                  <Sparkles size={28} className="empty-sparkle-icon" />
                  <h4>Explore Slow Fashion Craftsmanship</h4>
                  <p>Type keywords to discover authentic handcrafted pieces from Lucknow’s master artisans.</p>
                </div>
              ) : searchResults.length > 0 ? (
                <>
                  <div className="ajax-results-count">
                    <span>Showing {searchResults.length} creations for &ldquo;{searchQuery}&rdquo;</span>
                  </div>
                  <div className="ajax-results-grid">
                    {searchResults.map((item) => (
                      <div
                        key={item.id}
                        className="ajax-result-card"
                        onClick={() => handleSearchResultClick(item.id)}
                      >
                        <div className="ajax-result-thumb">
                          <img
                            src={item.images?.[0] || item.image}
                            alt={item.title}
                            loading="lazy"
                          />
                        </div>
                        <div className="ajax-result-details">
                          <span className="ajax-result-cat">{item.category}</span>
                          <h4 className="ajax-result-title">{item.title.replace(/"/g, "")}</h4>
                          <div className="ajax-result-pricing">
                            <span className="ajax-result-price">
                              {formatPrice(item.salePrice || item.price)}
                            </span>
                            {item.salePrice && item.salePrice < item.price && (
                              <span className="ajax-result-old-price">
                                {formatPrice(item.price)}
                              </span>
                            )}
                          </div>
                          {item.fabric && (
                            <span className="ajax-result-fabric">Fabric: {item.fabric}</span>
                          )}
                        </div>
                        <ChevronRight size={18} className="ajax-result-arrow" />
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="ajax-search-not-found">
                  <h4>No handcrafted pieces found for &ldquo;{searchQuery}&rdquo;</h4>
                  <p>Check your spelling or explore our catalog for traditional embroidery creations.</p>
                  <Link
                    to="/shop"
                    onClick={() => setIsSearchOpen(false)}
                    className="ajax-view-all-btn"
                  >
                    View All Collections <ArrowRight size={16} />
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* =========================================================================
          2. SLIDE-OUT WISHLIST DRAWER (LUXURY BRAND EXPERIENCE)
          ========================================================================= */}
      {isWishlistOpen && (
        <div className="wishlist-drawer-wrapper" role="dialog" aria-modal="true">
          <div className="wishlist-backdrop" onClick={() => setIsWishlistOpen(false)} />
          
          <div className="wishlist-drawer">
            {/* Wishlist Header */}
            <div className="wishlist-drawer-header">
              <div className="wishlist-header-title">
                <Heart size={20} className="wishlist-header-heart" />
                <h3>FAVOURITES & WISHLIST ({wishlistCount})</h3>
              </div>
              <button
                type="button"
                onClick={() => setIsWishlistOpen(false)}
                className="drawer-close-btn"
                aria-label="Close Wishlist"
              >
                <X size={22} />
              </button>
            </div>

            {/* Wishlist Items List */}
            <div className="wishlist-drawer-content">
              {wishlist.length === 0 ? (
                <div className="wishlist-empty-view">
                  <div className="wishlist-empty-circle">
                    <Heart size={32} />
                  </div>
                  <h4>Your Wishlist is Empty</h4>
                  <p>
                    Save the handcrafted creations you adore to easily revisit them later or add
                    them to your bag.
                  </p>
                  <Link
                    to="/shop"
                    onClick={() => setIsWishlistOpen(false)}
                    className="btn-primary"
                    style={{ textDecoration: "none", marginTop: "16px", display: "inline-block" }}
                  >
                    Explore Boutique Collections
                  </Link>
                </div>
              ) : (
                <div className="wishlist-items-list">
                  {wishlist.map((item) => (
                    <div key={item.id} className="wishlist-item-card">
                      <Link
                        to={`/product/${item.id}`}
                        onClick={() => setIsWishlistOpen(false)}
                        className="wishlist-item-img-link"
                      >
                        <img
                          src={item.images?.[0] || item.image}
                          alt={item.title}
                          className="wishlist-item-img"
                        />
                      </Link>

                      <div className="wishlist-item-info">
                        <span className="wishlist-item-category">{item.category}</span>
                        <h4 className="wishlist-item-title">
                          <Link
                            to={`/product/${item.id}`}
                            onClick={() => setIsWishlistOpen(false)}
                          >
                            {item.title.replace(/"/g, "")}
                          </Link>
                        </h4>
                        <div className="wishlist-item-price">
                          {formatPrice(item.salePrice || item.price)}
                        </div>

                        <div className="wishlist-item-actions">
                          <button
                            type="button"
                            onClick={() => handleMoveToBag(item)}
                            className="wishlist-add-bag-btn"
                          >
                            <ShoppingBasket size={15} /> Move to Bag
                          </button>
                          <button
                            type="button"
                            onClick={() => toggleWishlist(item)}
                            className="wishlist-remove-btn"
                            title="Remove from Wishlist"
                          >
                            <Trash2 size={16} />
                          </button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Wishlist Footer */}
            {wishlist.length > 0 && (
              <div className="wishlist-drawer-footer">
                <Link
                  to="/checkout"
                  onClick={() => setIsWishlistOpen(false)}
                  className="btn-primary"
                  style={{ textDecoration: "none", textAlign: "center", display: "block", width: "100%" }}
                >
                  View Shopping Bag ({cartCount})
                </Link>
              </div>
            )}
          </div>
        </div>
      )}

      {/* =========================================================================
          3. SLIDE-OUT MOBILE NAVIGATION DRAWER
          ========================================================================= */}
      {isMobileMenuOpen && (
        <div className="mobile-nav-wrapper" role="dialog" aria-modal="true">
          <div className="mobile-nav-backdrop" onClick={() => setIsMobileMenuOpen(false)} />
          
          <div className="mobile-nav-drawer">
            <div className="mobile-nav-header">
              <Link to="/" onClick={() => setIsMobileMenuOpen(false)}>
                <img
                  src="/logo.png"
                  alt="Safed Rang"
                  style={{ height: "38px", width: "auto" }}
                />
              </Link>
              <button
                type="button"
                onClick={() => setIsMobileMenuOpen(false)}
                className="drawer-close-btn"
                aria-label="Close Navigation"
              >
                <X size={22} />
              </button>
            </div>

            {/* Mobile Nav Links */}
            <div className="mobile-nav-links">
              <ul>
                <li>
                  <Link to="/shop" onClick={() => setIsMobileMenuOpen(false)}>
                    SHOP
                  </Link>
                </li>
                <li>
                  <Link to="/one-of-one" onClick={() => setIsMobileMenuOpen(false)}>
                    ONE-OF-ONE
                  </Link>
                </li>
                <li>
                  <Link to="/craft" onClick={() => setIsMobileMenuOpen(false)}>
                    THE CRAFT
                  </Link>
                </li>
                <li>
                  <Link to="/about" onClick={() => setIsMobileMenuOpen(false)}>
                    ABOUT US
                  </Link>
                </li>
                <li>
                  <Link to="/journey" onClick={() => setIsMobileMenuOpen(false)}>
                    JOURNEY
                  </Link>
                </li>
              </ul>
            </div>

            {/* Mobile Nav Quick Actions */}
            <div className="mobile-nav-actions">
              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsSearchOpen(true);
                }}
                className="mobile-action-link"
              >
                <Search size={18} />
                <span>Search Collections</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  setIsMobileMenuOpen(false);
                  setIsWishlistOpen(true);
                }}
                className="mobile-action-link"
              >
                <Heart size={18} />
                <span>Wishlist ({wishlistCount})</span>
              </button>

              <Link
                to={accountDestination}
                onClick={() => setIsMobileMenuOpen(false)}
                className="mobile-action-link"
              >
                <User size={18} />
                <span>{isLoggedIn ? (isAdmin ? "Admin Portal" : "My Dashboard") : "Sign In / Register"}</span>
              </Link>
            </div>

            {/* Mobile Currency Switcher */}
            <div className="mobile-currency-section">
              <label>Select Currency</label>
              <select
                value={currency}
                onChange={(e) => changeCurrency(e.target.value)}
                disabled={loadingRates}
                className="mobile-currency-select"
              >
                {Object.keys(supportedCurrencies).map((code) => (
                  <option key={code} value={code}>
                    {code} ({supportedCurrencies[code].symbol})
                  </option>
                ))}
              </select>
            </div>

            <div className="mobile-nav-footer">
              <p>Handcrafted with slow fashion heritage · Lucknow</p>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
