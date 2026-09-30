import { Search, ShoppingBag, Heart, User, Menu } from 'lucide-react';
import { Link } from 'react-router-dom';
import './Header.css';

export default function Header() {
  return (
    <header className="site-header">
      <div className="announcement-bar">
        <div className="container announcement-content">
          <span>HANDCRAFTED IN LUCKNOW - WORLDWIDE SHIPPING</span>
          <span className="hidden-mobile">A RICHER WORLD THROUGH SLOW FASHION</span>
        </div>
      </div>
      
      <div className="header-main container">
        <div className="mobile-menu-toggle">
          <button aria-label="Open Menu"><Menu size={24} /></button>
        </div>

        <div className="logo">
          <Link to="/" style={{ textDecoration: 'none' }}>
            <div className="logo-circle">
              <span className="script-font">safedrang</span>
            </div>
          </Link>
        </div>

        <nav className="desktop-nav">
          <ul>
            <li><Link to="/shop">SHOP</Link></li>
            <li><Link to="/one-of-one">ONE-OF-ONE</Link></li>
            <li><Link to="/craft">THE CRAFT</Link></li>
            <li><Link to="/about">ABOUT US</Link></li>
            <li><Link to="/journal">JOURNAL</Link></li>
          </ul>
        </nav>

        <div className="header-actions">
          <button aria-label="Search"><Search size={20} /></button>
          <button aria-label="Wishlist" className="hidden-mobile"><Heart size={20} /></button>
          <button aria-label="Account" className="hidden-mobile"><User size={20} /></button>
          <button aria-label="Cart" className="cart-btn">
            <ShoppingBag size={20} />
            <span className="cart-count">0</span>
          </button>
        </div>
      </div>
    </header>
  );
}
