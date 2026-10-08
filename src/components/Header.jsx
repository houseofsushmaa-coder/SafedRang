import { Search, ShoppingBag, Heart, User, Menu } from "lucide-react";
import { Link } from "react-router-dom";
import { useCurrency } from "../context/CurrencyContext";
import { useCart } from "../context/CartContext";
import "./Header.css";

export default function Header() {
  const { currency, changeCurrency, supportedCurrencies, loadingRates, formatPrice } = useCurrency();
  const { cart, cartCount, wishlistCount } = useCart();
  return (
    <header className="site-header">
      <div className="announcement-bar">
        <div className="container announcement-content">
          <span>HANDCRAFTED IN LUCKNOW - WORLDWIDE SHIPPING</span>
          <span className="hidden-mobile">
            A RICHER WORLD THROUGH SLOW FASHION
          </span>
        </div>
      </div>

      <div className="header-main container">
        <div className="mobile-menu-toggle">
          <button aria-label="Open Menu">
            <Menu size={24} />
          </button>
        </div>

        <div className="logo">
          <Link to="/" style={{ textDecoration: "none" }}>
            <img 
              src="/logo.png" 
              alt="Safedrang" 
              style={{ height: "45px", width: "auto", objectFit: "contain" }} 
            />
          </Link>
        </div>

        <nav className="desktop-nav">
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
              <Link to="/journal">JOURNAL</Link>
            </li>
          </ul>
        </nav>

        <div className="header-actions">
          <div className="currency-selector hidden-mobile" style={{ marginRight: '15px' }}>
            <select 
              value={currency} 
              onChange={(e) => changeCurrency(e.target.value)}
              style={{
                background: 'transparent',
                border: 'none',
                fontSize: '13px',
                fontWeight: '600',
                cursor: 'pointer',
                outline: 'none',
                color: 'var(--text-main)'
              }}
              disabled={loadingRates}
            >
              {Object.keys(supportedCurrencies).map(code => (
                <option key={code} value={code}>
                  {code} ({supportedCurrencies[code].symbol})
                </option>
              ))}
            </select>
          </div>
          <button aria-label="Search">
            <Search size={20} />
          </button>
          <button aria-label="Wishlist" className="hidden-mobile">
            <Heart size={20} />
            {wishlistCount > 0 && <span className="cart-count wishlist-count">{wishlistCount}</span>}
          </button>
          <button aria-label="Account" className="hidden-mobile">
            <User size={20} />
          </button>
          <div className="cart-wrapper">
            <Link to="/checkout" aria-label="Cart" className="cart-btn" style={{ textDecoration: 'none' }}>
              <ShoppingBag size={20} />
              {cartCount > 0 && <span className="cart-count">{cartCount}</span>}
            </Link>

            <div className="cart-dropdown">
              <h4>Your Cart</h4>
              {cart.length === 0 ? (
                <p className="empty-cart">Your cart is currently empty.</p>
              ) : (
                <div className="cart-items">
                  {cart.map((item) => (
                    <div key={item.id} className="cart-item">
                      <img src={item.images?.[0] || item.image} alt={item.title} />
                      <div className="cart-item-info">
                        <div className="cart-item-title">{item.title.replace(/"/g, "")}</div>
                        <div className="cart-item-price">
                          {formatPrice(item.salePrice || item.price)} × {item.quantity}
                        </div>
                      </div>
                    </div>
                  ))}
                  <div className="cart-dropdown-footer">
                    <div className="cart-subtotal">
                      <span>Subtotal</span>
                      <span>
                        {formatPrice(
                          cart.reduce((acc, item) => acc + (item.salePrice || item.price) * item.quantity, 0)
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
  );
}
