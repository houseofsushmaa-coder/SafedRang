import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useCart } from '../../../context/CartContext';

// ─── Wishlist Tab ─────────────────────────────────────────────────────────────
// Uses CartContext wishlist (already implemented in CartContext).
// If wishlist isn't in CartContext yet, falls back gracefully.

export default function WishlistTab() {
  const navigate = useNavigate();
  const { wishlist, toggleWishlist, addToCart } = useCart();

  const removeFromWishlist = toggleWishlist; // toggleWishlist removes if already in list

  const formatCurrency = (amount) =>
    new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

  return (
    <div>
      <h2 className="patron-section-title">Saved Pieces</h2>
      <p className="patron-section-subtitle">Your curated collection of heirloom sarees</p>

      {wishlist.length === 0 ? (
        <div className="patron-empty-state">
          <svg className="patron-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2">
            <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
          </svg>
          <h3 className="patron-empty-title">No Saved Pieces</h3>
          <p className="patron-empty-desc">
            Tap the heart icon on any product to save it here and revisit later.
          </p>
          <button className="patron-btn-primary" onClick={() => navigate('/shop')}>
            Explore Collection
          </button>
        </div>
      ) : (
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
          gap: '1.2rem',
        }}>
          {wishlist.map((item, i) => (
            <div
              key={item.id || i}
              className="patron-card"
              style={{ padding: 0, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}
            >
              {/* Product Image */}
              <div
                style={{ position: 'relative', aspectRatio: '3/4', overflow: 'hidden', cursor: 'pointer', background: '#F5EDE0' }}
                onClick={() => navigate(`/product/${item.id}`)}
              >
                {item.image || item.images?.[0] ? (
                  <img
                    src={item.image || item.images[0]}
                    alt={item.title || item.name}
                    style={{ width: '100%', height: '100%', objectFit: 'cover', transition: 'transform 0.4s ease' }}
                    onMouseEnter={(e) => e.currentTarget.style.transform = 'scale(1.04)'}
                    onMouseLeave={(e) => e.currentTarget.style.transform = 'scale(1)'}
                  />
                ) : (
                  <div style={{ width: '100%', height: '100%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '3rem' }}>🧵</div>
                )}

                {/* Stock Badge */}
                {item.stock === 0 && (
                  <div style={{
                    position: 'absolute', top: 10, left: 10,
                    background: 'rgba(42,33,29,0.85)', color: '#FAF5EC',
                    fontSize: '0.62rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase',
                    padding: '0.2rem 0.6rem', borderRadius: 4,
                  }}>
                    One of One — Sold
                  </div>
                )}
              </div>

              {/* Info */}
              <div style={{ padding: '1rem', flex: 1, display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                <div
                  style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '0.95rem', fontWeight: 500, color: '#2A211D', cursor: 'pointer', lineHeight: 1.3 }}
                  onClick={() => navigate(`/product/${item.id}`)}
                >
                  {item.title || item.name}
                </div>
                <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.05rem', color: '#AE8A54' }}>
                  {formatCurrency(item.price)}
                </div>
                <div style={{ display: 'flex', gap: '0.5rem', marginTop: 'auto', flexWrap: 'wrap' }}>
                  {addToCart && item.stock !== 0 && (
                    <button
                      className="patron-btn-primary"
                      style={{ flex: 1, fontSize: '0.7rem', padding: '0.55rem 0.8rem' }}
                      onClick={() => addToCart(item)}
                    >
                      Move to Bag
                    </button>
                  )}
                  {removeFromWishlist && (
                    <button
                      className="patron-btn-ghost"
                      style={{ fontSize: '0.7rem', padding: '0.5rem 0.8rem' }}
                      onClick={() => removeFromWishlist(item.id)}
                    >
                      Remove
                    </button>
                  )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
