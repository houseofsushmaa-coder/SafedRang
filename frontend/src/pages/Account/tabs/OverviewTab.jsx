import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { getCustomerOrders, getCustomerProfile } from '../../../lib/customerService';

// ─── Icons ─────────────────────────────────────────────────────────────────

const IconPackage = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" />
    <polyline points="3.27,6.96 12,12.01 20.73,6.96" /><line x1="12" y1="22.08" x2="12" y2="12" />
  </svg>
);

const IconStar = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2" />
  </svg>
);

const IconHeart = () => (
  <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
  </svg>
);

const IconArrow = () => (
  <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
    <line x1="5" y1="12" x2="19" y2="12" /><polyline points="12 5 19 12 12 19" />
  </svg>
);

// ─── Status Helpers ─────────────────────────────────────────────────────────

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount);

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' });

const getPaymentBadge = (status) => {
  const s = (status || '').toUpperCase();
  if (s === 'PAID') return { label: 'Paid', cls: 'patron-badge--paid' };
  if (s === 'FAILED' || s === 'REFUNDED') return { label: s, cls: 'patron-badge--failed' };
  return { label: 'Processing', cls: 'patron-badge--pending' };
};

// ─── Overview Tab ───────────────────────────────────────────────────────────

export default function OverviewTab() {
  const { user } = useAuth();
  const navigate = useNavigate();
  const [orders, setOrders] = useState([]);
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user?.email) return;
    const load = async () => {
      try {
        const [o, p] = await Promise.all([
          getCustomerOrders(user.email),
          getCustomerProfile(user.id),
        ]);
        setOrders(o);
        setProfile(p);
      } catch (err) {
        console.warn('Overview load error:', err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [user]);

  if (loading) {
    return (
      <div className="patron-loading">
        <div className="patron-spinner" />
        <span className="patron-loading-text">Loading your overview…</span>
      </div>
    );
  }

  const totalOrders = orders.length;
  const totalPieces = orders.reduce((acc, o) => {
    const items = Array.isArray(o.items) ? o.items : [];
    return acc + items.reduce((s, i) => s + (i.quantity || 1), 0);
  }, 0);
  const latestOrder = orders[0] || null;

  return (
    <div>
      <h2 className="patron-section-title">Overview</h2>
      <p className="patron-section-subtitle">Your atelier journey at a glance</p>

      {/* Quick Stat Tiles */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(140px, 1fr))', gap: '1rem', marginBottom: '2rem' }}>
        <div className="patron-card" style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => navigate('/account/orders')}>
          <div style={{ color: '#AE8A54', marginBottom: '0.6rem' }}><IconPackage /></div>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 500, color: '#2A211D' }}>{totalOrders}</div>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8B7863' }}>Total Orders</div>
        </div>
        <div className="patron-card" style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => navigate('/account/orders')}>
          <div style={{ color: '#AE8A54', marginBottom: '0.6rem' }}><IconStar /></div>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 500, color: '#2A211D' }}>{totalPieces}</div>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8B7863' }}>Pieces Acquired</div>
        </div>
        <div className="patron-card" style={{ textAlign: 'center', cursor: 'pointer' }} onClick={() => navigate('/account/wishlist')}>
          <div style={{ color: '#AE8A54', marginBottom: '0.6rem' }}><IconHeart /></div>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '2rem', fontWeight: 500, color: '#2A211D' }}>—</div>
          <div style={{ fontSize: '0.72rem', fontWeight: 700, letterSpacing: '0.1em', textTransform: 'uppercase', color: '#8B7863' }}>Saved Pieces</div>
        </div>
      </div>

      {/* Latest Order Teaser */}
      {latestOrder ? (
        <div>
          <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.1rem', fontWeight: 500, color: '#2A211D', marginBottom: '0.8rem' }}>
            Most Recent Order
          </h3>
          <div className="patron-card" style={{ display: 'flex', alignItems: 'center', gap: '1.2rem', flexWrap: 'wrap' }}>
            {/* Thumbnail */}
            {Array.isArray(latestOrder.items) && latestOrder.items[0]?.image && (
              <img
                src={latestOrder.items[0].image}
                alt={latestOrder.items[0].title}
                style={{ width: 72, height: 72, objectFit: 'cover', borderRadius: 8, border: '1px solid #EADFCF', flexShrink: 0 }}
              />
            )}
            <div style={{ flex: 1, minWidth: 180 }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.3rem', flexWrap: 'wrap' }}>
                <span style={{ fontWeight: 600, fontSize: '0.85rem', color: '#2A211D' }}>#{latestOrder.id?.slice(0, 18)}…</span>
                <span className={`patron-badge ${getPaymentBadge(latestOrder.payment_status).cls}`}>
                  {getPaymentBadge(latestOrder.payment_status).label}
                </span>
              </div>
              <div style={{ fontSize: '0.8rem', color: '#8B7863', marginBottom: '0.2rem' }}>{formatDate(latestOrder.created_at)}</div>
              <div style={{ fontSize: '0.85rem', fontWeight: 600, color: '#AE8A54' }}>{formatCurrency(latestOrder.total_amount)}</div>
            </div>
            <button className="patron-btn-ghost" onClick={() => navigate('/account/orders')}>
              View Orders <IconArrow />
            </button>
          </div>
        </div>
      ) : (
        <div className="patron-empty-state">
          <svg className="patron-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M21 16V8a2 2 0 00-1-1.73l-7-4a2 2 0 00-2 0l-7 4A2 2 0 003 8v8a2 2 0 001 1.73l7 4a2 2 0 002 0l7-4A2 2 0 0021 16z" /></svg>
          <h3 className="patron-empty-title">No Orders Yet</h3>
          <p className="patron-empty-desc">Discover our handcrafted Chikankari & Zardozi collections and place your first order.</p>
          <button className="patron-btn-primary" onClick={() => navigate('/shop')}>Explore Collection</button>
        </div>
      )}

      {/* Atelier Announcement */}
      <div style={{ marginTop: '2rem', padding: '1.2rem 1.5rem', background: 'linear-gradient(90deg, rgba(174,138,84,0.08) 0%, rgba(110,30,42,0.05) 100%)', border: '1px solid rgba(174,138,84,0.3)', borderRadius: '10px', display: 'flex', gap: '1rem', alignItems: 'flex-start' }}>
        <span style={{ fontSize: '1.3rem', flexShrink: 0 }}>✦</span>
        <div>
          <div style={{ fontFamily: 'Cormorant Garamond, serif', fontWeight: 500, fontSize: '1rem', color: '#2A211D', marginBottom: '0.25rem' }}>Limited Chikankari Drops — Winter Atelier Collection</div>
          <div style={{ fontSize: '0.8rem', color: '#8B7863', lineHeight: 1.6 }}>Our artisans in Lucknow are hand-embroidering an exclusive winter collection. Pieces will be listed as one-of-one items.</div>
        </div>
      </div>
    </div>
  );
}
