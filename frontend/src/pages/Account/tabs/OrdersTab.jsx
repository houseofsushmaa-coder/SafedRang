import React, { useState, useEffect } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { getCustomerOrders } from '../../../lib/customerService';

// ─── Helpers ─────────────────────────────────────────────────────────────────

const formatCurrency = (amount) =>
  new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(amount || 0);

const formatDate = (iso) =>
  new Date(iso).toLocaleDateString('en-IN', { day: 'numeric', month: 'long', year: 'numeric' });

const getPaymentBadge = (status) => {
  const s = (status || '').toUpperCase();
  if (s === 'PAID') return { label: 'Paid', cls: 'patron-badge--paid' };
  if (s === 'FAILED') return { label: 'Failed', cls: 'patron-badge--failed' };
  if (s === 'REFUNDED') return { label: 'Refunded', cls: 'patron-badge--failed' };
  return { label: 'Processing', cls: 'patron-badge--pending' };
};

// ─── Order Status Stepper ────────────────────────────────────────────────────

const STEPS = [
  { key: 'placed',     label: 'Order Placed & Paid',           desc: 'Payment confirmed. Your order has been received.' },
  { key: 'atelier',   label: 'Atelier Quality Inspection',     desc: 'Our artisans in Lucknow are verifying the piece.' },
  { key: 'dispatched',label: 'Dispatched / Courier Assigned',  desc: 'Your order is on its way to you.' },
  { key: 'delivered', label: 'Delivered',                      desc: 'Enjoy your heirloom piece.' },
];

const getStepStatus = (order, stepIndex) => {
  const ps = (order.payment_status || '').toUpperCase();
  // Map payment_status + shipping_status to a step index
  let currentStep = 0;
  if (ps === 'PAID') currentStep = 1;
  const ss = (order.shipping_status || order.order_status || '').toLowerCase();
  if (ss.includes('dispatch') || ss.includes('shipped') || ss.includes('transit')) currentStep = 2;
  if (ss.includes('deliver')) currentStep = 3;

  if (stepIndex < currentStep) return 'step-done';
  if (stepIndex === currentStep) return 'step-active';
  return 'step-pending';
};

const CheckIcon = () => (
  <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
    <polyline points="20 6 9 17 4 12" />
  </svg>
);

// ─── Order Detail Modal ──────────────────────────────────────────────────────

function OrderModal({ order, onClose }) {
  const items = Array.isArray(order.items) ? order.items : [];
  const addr = order.shipping_address || {};

  return (
    <div className="patron-modal-overlay" onClick={onClose}>
      <div className="patron-modal" onClick={(e) => e.stopPropagation()} style={{ maxWidth: 600 }}>
        <div className="patron-modal-header">
          <h2 className="patron-modal-title">Order Details</h2>
          <button className="patron-modal-close" onClick={onClose} aria-label="Close">
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round">
              <line x1="18" y1="6" x2="6" y2="18" /><line x1="6" y1="6" x2="18" y2="18" />
            </svg>
          </button>
        </div>

        {/* Order ID & Date */}
        <div style={{ marginBottom: '1.2rem', padding: '0.8rem 1rem', background: '#FAF5EC', borderRadius: 8, display: 'flex', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.5rem' }}>
          <div>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8B7863' }}>Order ID</div>
            <div style={{ fontFamily: 'monospace', fontSize: '0.82rem', color: '#2A211D', wordBreak: 'break-all' }}>{order.id}</div>
          </div>
          <div style={{ textAlign: 'right' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#8B7863' }}>Placed On</div>
            <div style={{ fontSize: '0.82rem', color: '#2A211D' }}>{formatDate(order.created_at)}</div>
          </div>
        </div>

        {/* Items */}
        <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1rem', fontWeight: 500, color: '#2A211D', marginBottom: '0.8rem' }}>
          Pieces in This Order
        </h3>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '0.8rem', marginBottom: '1.5rem' }}>
          {items.map((item, i) => (
            <div key={i} style={{ display: 'flex', gap: '0.8rem', alignItems: 'center', padding: '0.8rem', background: '#FDFAF5', borderRadius: 8, border: '1px solid #EADFCF' }}>
              {item.image && (
                <img src={item.image} alt={item.title} style={{ width: 56, height: 56, objectFit: 'cover', borderRadius: 6, flexShrink: 0 }} />
              )}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ fontWeight: 600, fontSize: '0.88rem', color: '#2A211D', marginBottom: '0.1rem' }}>{item.title || item.name}</div>
                <div style={{ fontSize: '0.78rem', color: '#8B7863' }}>Qty: {item.quantity || 1} · {formatCurrency(item.price)}</div>
              </div>
            </div>
          ))}
        </div>

        {/* Tracking Stepper */}
        <h3 style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1rem', fontWeight: 500, color: '#2A211D', marginBottom: '0.5rem' }}>
          Order Journey
        </h3>
        <div className="patron-stepper">
          {STEPS.map((step, i) => {
            const status = getStepStatus(order, i);
            return (
              <div key={step.key} className={`patron-step ${status}`}>
                <div className="patron-step-dot">
                  {status === 'step-done' && <CheckIcon />}
                  {status === 'step-active' && <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#6E1E2A' }} />}
                </div>
                <div className="patron-step-body">
                  <div className="patron-step-title">{step.label}</div>
                  <div className="patron-step-desc">{step.desc}</div>
                </div>
              </div>
            );
          })}
        </div>

        {/* Shipping Address */}
        {(addr.address || addr.city) && (
          <div style={{ marginTop: '1rem', padding: '1rem', background: '#FAF5EC', borderRadius: 8, border: '1px solid #EADFCF' }}>
            <div style={{ fontSize: '0.68rem', fontWeight: 700, letterSpacing: '0.12em', textTransform: 'uppercase', color: '#AE8A54', marginBottom: '0.4rem' }}>Shipped To</div>
            <div style={{ fontSize: '0.85rem', color: '#2A211D', lineHeight: 1.6 }}>
              {order.customer_name && <div style={{ fontWeight: 600 }}>{order.customer_name}</div>}
              {addr.address && <div>{addr.address}</div>}
              {(addr.city || addr.state || addr.pincode) && (
                <div>{[addr.city, addr.state, addr.pincode].filter(Boolean).join(', ')}</div>
              )}
            </div>
          </div>
        )}

        {/* Total */}
        <div style={{ marginTop: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderTop: '1px solid #EADFCF', paddingTop: '1rem' }}>
          <span style={{ fontSize: '0.82rem', fontWeight: 600, color: '#5A4A42' }}>Order Total</span>
          <span style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.3rem', fontWeight: 500, color: '#AE8A54' }}>{formatCurrency(order.total_amount)}</span>
        </div>
      </div>
    </div>
  );
}

// ─── Orders Tab ───────────────────────────────────────────────────────────────

const FILTERS = [
  { label: 'All Orders', value: 'all' },
  { label: 'In Transit',  value: 'transit' },
  { label: 'Delivered',   value: 'delivered' },
];

export default function OrdersTab() {
  const { user } = useAuth();
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState('all');
  const [selectedOrder, setSelectedOrder] = useState(null);

  useEffect(() => {
    if (!user?.email) return;
    getCustomerOrders(user.email)
      .then(setOrders)
      .catch((e) => console.warn('Orders load error:', e))
      .finally(() => setLoading(false));
  }, [user]);

  const filtered = orders.filter((o) => {
    if (filter === 'all') return true;
    const ss = (o.shipping_status || o.order_status || '').toLowerCase();
    if (filter === 'transit') return ss.includes('dispatch') || ss.includes('shipped') || ss.includes('transit') || (o.payment_status === 'PAID' && !ss.includes('deliver'));
    if (filter === 'delivered') return ss.includes('deliver');
    return true;
  });

  if (loading) {
    return (
      <div className="patron-loading">
        <div className="patron-spinner" />
        <span className="patron-loading-text">Fetching your orders…</span>
      </div>
    );
  }

  return (
    <div>
      <h2 className="patron-section-title">My Orders</h2>
      <p className="patron-section-subtitle">Your complete handcrafted purchase history</p>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.5rem', flexWrap: 'wrap' }}>
        {FILTERS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilter(f.value)}
            style={{
              padding: '0.45rem 1rem',
              borderRadius: 20,
              border: `1px solid ${filter === f.value ? '#AE8A54' : '#EADFCF'}`,
              background: filter === f.value ? '#AE8A54' : 'transparent',
              color: filter === f.value ? '#FFFFFF' : '#5A4A42',
              fontFamily: 'Manrope, sans-serif',
              fontSize: '0.78rem',
              fontWeight: 600,
              letterSpacing: '0.05em',
              cursor: 'pointer',
              transition: 'all 0.18s ease',
            }}
          >
            {f.label}
          </button>
        ))}
      </div>

      {/* Order List */}
      {filtered.length === 0 ? (
        <div className="patron-empty-state">
          <svg className="patron-empty-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.2"><path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" /><rect x="9" y="3" width="6" height="4" rx="1" /></svg>
          <h3 className="patron-empty-title">No Orders Found</h3>
          <p className="patron-empty-desc">
            {filter === 'all' ? "You haven't placed any orders yet." : `No orders matching "${FILTERS.find(f=>f.value===filter)?.label}".`}
          </p>
        </div>
      ) : (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          {filtered.map((order) => {
            const items = Array.isArray(order.items) ? order.items : [];
            const badge = getPaymentBadge(order.payment_status);
            return (
              <div
                key={order.id}
                className="patron-card"
                style={{ display: 'flex', gap: '1rem', alignItems: 'center', flexWrap: 'wrap', cursor: 'pointer', transition: 'box-shadow 0.2s ease' }}
                onClick={() => setSelectedOrder(order)}
                onMouseEnter={(e) => e.currentTarget.style.boxShadow = '0 4px 18px rgba(42,33,29,0.1)'}
                onMouseLeave={(e) => e.currentTarget.style.boxShadow = '0 1px 6px rgba(42,33,29,0.04)'}
              >
                {/* Product thumbnails */}
                <div style={{ display: 'flex', gap: '0.4rem', flexShrink: 0 }}>
                  {items.slice(0, 2).map((item, i) => (
                    item.image ? (
                      <img key={i} src={item.image} alt={item.title} style={{ width: 60, height: 60, objectFit: 'cover', borderRadius: 8, border: '1px solid #EADFCF' }} />
                    ) : (
                      <div key={i} style={{ width: 60, height: 60, background: '#F5EDE0', borderRadius: 8, border: '1px solid #EADFCF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '1.2rem' }}>🧵</div>
                    )
                  ))}
                  {items.length > 2 && (
                    <div style={{ width: 60, height: 60, background: '#FAF5EC', borderRadius: 8, border: '1px solid #EADFCF', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.72rem', fontWeight: 700, color: '#8B7863' }}>
                      +{items.length - 2}
                    </div>
                  )}
                </div>

                {/* Order Info */}
                <div style={{ flex: 1, minWidth: 160 }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap', marginBottom: '0.3rem' }}>
                    <span style={{ fontFamily: 'monospace', fontSize: '0.75rem', color: '#2A211D', fontWeight: 600 }}>
                      #{order.id?.slice(0, 16)}…
                    </span>
                    <span className={`patron-badge ${badge.cls}`}>{badge.label}</span>
                  </div>
                  <div style={{ fontSize: '0.8rem', color: '#8B7863', marginBottom: '0.2rem' }}>
                    {formatDate(order.created_at)} · {items.length} {items.length === 1 ? 'piece' : 'pieces'}
                  </div>
                  <div style={{ fontFamily: 'Cormorant Garamond, serif', fontSize: '1.05rem', fontWeight: 500, color: '#AE8A54' }}>
                    {formatCurrency(order.total_amount)}
                  </div>
                </div>

                {/* CTA */}
                <button
                  className="patron-btn-ghost"
                  onClick={(e) => { e.stopPropagation(); setSelectedOrder(order); }}
                  style={{ flexShrink: 0 }}
                >
                  View Details
                </button>
              </div>
            );
          })}
        </div>
      )}

      {/* Order Modal */}
      {selectedOrder && (
        <OrderModal order={selectedOrder} onClose={() => setSelectedOrder(null)} />
      )}
    </div>
  );
}
