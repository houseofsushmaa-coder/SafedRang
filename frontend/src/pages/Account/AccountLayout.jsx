import React, { useState } from 'react';
import { Outlet, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import './AccountLayout.css';

// ─── Icons (inline SVG, no dep) ─────────────────────────────────────────────

const IconOverview = () => (
  <svg className="patron-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <rect x="3" y="3" width="7" height="7" rx="1" /><rect x="14" y="3" width="7" height="7" rx="1" />
    <rect x="3" y="14" width="7" height="7" rx="1" /><rect x="14" y="14" width="7" height="7" rx="1" />
  </svg>
);

const IconOrders = () => (
  <svg className="patron-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
    <rect x="9" y="3" width="6" height="4" rx="1" />
    <path d="M9 12h6M9 16h4" />
  </svg>
);

const IconWishlist = () => (
  <svg className="patron-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M20.84 4.61a5.5 5.5 0 00-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 00-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 000-7.78z" />
  </svg>
);

const IconAddress = () => (
  <svg className="patron-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M21 10c0 7-9 13-9 13s-9-6-9-13a9 9 0 0118 0z" />
    <circle cx="12" cy="10" r="3" />
  </svg>
);

const IconSettings = () => (
  <svg className="patron-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <circle cx="12" cy="12" r="3" />
    <path d="M19.4 15a1.65 1.65 0 00.33 1.82l.06.06a2 2 0 010 2.83 2 2 0 01-2.83 0l-.06-.06a1.65 1.65 0 00-1.82-.33 1.65 1.65 0 00-1 1.51V21a2 2 0 01-4 0v-.09A1.65 1.65 0 009 19.4a1.65 1.65 0 00-1.82.33l-.06.06a2 2 0 01-2.83-2.83l.06-.06A1.65 1.65 0 004.68 15a1.65 1.65 0 00-1.51-1H3a2 2 0 010-4h.09A1.65 1.65 0 004.6 9a1.65 1.65 0 00-.33-1.82l-.06-.06a2 2 0 012.83-2.83l.06.06A1.65 1.65 0 009 4.68a1.65 1.65 0 001-1.51V3a2 2 0 014 0v.09a1.65 1.65 0 001 1.51 1.65 1.65 0 001.82-.33l.06-.06a2 2 0 012.83 2.83l-.06.06A1.65 1.65 0 0019.4 9a1.65 1.65 0 001.51 1H21a2 2 0 010 4h-.09a1.65 1.65 0 00-1.51 1z" />
  </svg>
);

const IconSignOut = () => (
  <svg className="patron-nav-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
    <path d="M9 21H5a2 2 0 01-2-2V5a2 2 0 012-2h4M16 17l5-5-5-5M21 12H9" />
  </svg>
);

// ─── Navigation Config ────────────────────────────────────────────────────────

const NAV_ITEMS = [
  { id: 'overview',   label: 'Overview',      path: '/account',           icon: <IconOverview /> },
  { id: 'orders',     label: 'My Orders',     path: '/account/orders',    icon: <IconOrders /> },
  { id: 'wishlist',   label: 'Saved Pieces',  path: '/account/wishlist',  icon: <IconWishlist /> },
  { id: 'addresses',  label: 'Addresses',     path: '/account/addresses', icon: <IconAddress /> },
  { id: 'settings',   label: 'Settings',      path: '/account/settings',  icon: <IconSettings /> },
];

// ─── Protected Customer Route ─────────────────────────────────────────────────

export const ProtectedCustomerRoute = ({ children }) => {
  const { user, session, loading } = useAuth();

  if (loading) {
    return (
      <div className="patron-loading" style={{ minHeight: '100vh', background: '#FAF5EC' }}>
        <div className="patron-spinner" />
        <span className="patron-loading-text">Loading your account…</span>
      </div>
    );
  }

  if (!user && !session) {
    return <Navigate to="/login?redirect=/account" replace />;
  }

  return children;
};

// ─── Account Layout ───────────────────────────────────────────────────────────

export default function AccountLayout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const displayName = user?.name || user?.user_metadata?.full_name || user?.email?.split('@')[0] || 'Patron';
  const joinYear = user?.created_at ? new Date(user.created_at).getFullYear() : new Date().getFullYear();
  const memberSince = `Member Since ${joinYear}`;

  const handleSignOut = async () => {
    await logout();
    navigate('/');
  };

  // Determine active tab by current path
  const activeTab = (() => {
    if (location.pathname === '/account') return 'overview';
    const segment = location.pathname.split('/account/')[1];
    return segment || 'overview';
  })();

  return (
    <div className="patron-portal-page">
      {/* ── Banner ── */}
      <div className="patron-portal-banner">
        <div className="patron-banner-greeting">
          <span className="patron-banner-eyebrow">Patron Portal · Safed Rang</span>
          <h1 className="patron-banner-name">Welcome, {displayName}</h1>
          <p className="patron-banner-id">{memberSince} · {user?.email}</p>
        </div>
        <div className="patron-banner-meta">
          <div className="patron-banner-stat">
            <span className="patron-stat-number">♦</span>
            <span className="patron-stat-label">Curated<br />Patron</span>
          </div>
        </div>
      </div>

      {/* ── Mobile Horizontal Tab Bar ── */}
      <nav className="patron-mobile-tabs" aria-label="Account Navigation">
        {NAV_ITEMS.map((item) => (
          <button
            key={item.id}
            className={`patron-mobile-tab-btn${activeTab === item.id ? ' active' : ''}`}
            onClick={() => navigate(item.path)}
            aria-label={item.label}
          >
            <span className="patron-mobile-tab-icon">{item.icon}</span>
            {item.label}
          </button>
        ))}
      </nav>

      {/* ── 2-col layout ── */}
      <div className="patron-portal-layout">
        {/* Sidebar */}
        <aside className="patron-sidebar">
          <div className="patron-sidebar-header">
            <span className="patron-sidebar-label">Account Navigation</span>
          </div>
          <ul className="patron-nav-list">
            {NAV_ITEMS.map((item) => (
              <li key={item.id} className="patron-nav-item">
                <button
                  className={`patron-nav-btn${activeTab === item.id ? ' active' : ''}`}
                  onClick={() => navigate(item.path)}
                >
                  {item.icon}
                  {item.label}
                </button>
              </li>
            ))}
            <li><div className="patron-nav-divider" /></li>
            <li className="patron-nav-item">
              <button
                className="patron-nav-btn patron-nav-signout"
                onClick={handleSignOut}
              >
                <IconSignOut />
                Sign Out
              </button>
            </li>
          </ul>
        </aside>

        {/* Content */}
        <main className="patron-content-panel">
          <Outlet />
        </main>
      </div>
    </div>
  );
}
