import React, { useState, useEffect } from "react";
import { Outlet, Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  ShoppingBag,
  Tags,
  Package,
  ShoppingCart,
  Users,
  Ticket,
  CreditCard,
  ShoppingBasket,
  BarChart3,
  LineChart,
  Shield,
  Settings,
  Menu,
  X,
  Search,
  LogOut,
  ExternalLink,
  ChevronRight,
  Store,
  Activity,
  Sun,
  Moon,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import { supabase } from "../lib/supabase";
import AdminErrorBoundary from "./components/AdminErrorBoundary";
import "./AdminLayout.css";
import "./adminTheme.css";

const THEME_KEY = "sr_admin_theme";

const initialTheme = () => {
  try {
    const saved = localStorage.getItem(THEME_KEY);
    if (saved === "light" || saved === "dark") return saved;
  } catch {}
  return typeof window !== "undefined" && window.matchMedia?.("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

const navigation = [
  {
    group: "Main",
    items: [{ path: "/admin", label: "Dashboard", icon: <LayoutDashboard size={18} /> }],
  },
  {
    group: "Store",
    items: [
      { path: "/admin/products", label: "Products", icon: <ShoppingBag size={18} /> },
      { path: "/admin/categories", label: "Categories", icon: <Tags size={18} /> },
      { path: "/admin/inventory", label: "Inventory", icon: <Package size={18} /> },
      { path: "/admin/orders", label: "Orders", icon: <ShoppingCart size={18} />, countKey: "openOrders" },
      { path: "/admin/customers", label: "Customers", icon: <Users size={18} /> },
    ],
  },
  {
    group: "Sales",
    items: [
      { path: "/admin/payments", label: "Payments", icon: <CreditCard size={18} /> },
      { path: "/admin/abandoned-carts", label: "Abandoned Checkouts", icon: <ShoppingBasket size={18} /> },
      { path: "/admin/coupons", label: "Coupons", icon: <Ticket size={18} /> },
    ],
  },
  {
    group: "Analytics",
    items: [
      { path: "/admin/analytics", label: "Overview", icon: <BarChart3 size={18} /> },
      { path: "/admin/analytics/sales", label: "Sales Report", icon: <LineChart size={18} /> },
    ],
  },
  {
    group: "System",
    items: [
      { path: "/admin/users", label: "Admin Users", icon: <Shield size={18} /> },
      { path: "/admin/settings", label: "Settings", icon: <Settings size={18} />, exact: true },
      { path: "/admin/settings/tracking", label: "Tracking & Pixels", icon: <Activity size={18} /> },
    ],
  },
];

// Breadcrumb labels for pages that aren't in the sidebar.
const EXTRA_LABELS = [
  [/^\/admin\/product\/new$/, "New Product"],
  [/^\/admin\/product\//, "Edit Product"],
  [/^\/admin\/tracking$/, "Tracking & Pixels"],
];

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [theme, setTheme] = useState(initialTheme);
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [counts, setCounts] = useState({});
  const [expandedGroups, setExpandedGroups] = useState({});

  useEffect(() => {
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {}
  }, [theme]);

  // Orders waiting to be processed (refreshed on navigation).
  useEffect(() => {
    let active = true;
    supabase
      .from("orders")
      .select("id", { count: "exact", head: true })
      .in("order_status", ["PENDING", "PROCESSING", "CONFIRMED", "PACKED"])
      .neq("payment_status", "FAILED")
      .then(({ count, error }) => {
        if (active && !error) setCounts({ openOrders: count || 0 });
      });
    return () => {
      active = false;
    };
  }, [location.pathname]);

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  const toggleGroup = (groupName) => {
    if (isSidebarCollapsed) return;
    setExpandedGroups((prev) => ({ ...prev, [groupName]: prev[groupName] === false }));
  };

  const isActive = (item) => {
    if (item.path === "/admin") return location.pathname === "/admin";
    if (item.exact) return location.pathname === item.path;
    return location.pathname.startsWith(item.path);
  };

  const currentPageLabel = (() => {
    for (const [re, label] of EXTRA_LABELS) if (re.test(location.pathname)) return label;
    let best = null;
    for (const group of navigation) {
      for (const item of group.items) {
        if (isActive(item) && (!best || item.path.length > best.path.length)) best = item;
      }
    }
    return best?.label || "Dashboard";
  })();

  // Header search hands off to the Orders or Products page.
  const handleSearch = (e) => {
    e.preventDefault();
    const q = searchQuery.trim();
    if (!q) return;
    const looksLikeOrder = /^(order_|sr_cod_|#)/i.test(q);
    navigate(`/admin/${looksLikeOrder ? "orders" : "products"}?q=${encodeURIComponent(q.replace(/^#/, ""))}`);
    setSearchQuery("");
  };

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || "A";
  const userDisplay = user?.name || user?.email?.split("@")[0] || "Admin";
  const userRole =
    typeof user?.role === "string"
      ? user.role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : "Admin";

  return (
    <div className="admin-container" data-theme={theme}>
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className="admin-mobile-overlay" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* ─── Sidebar ─── */}
      <aside
        className={`admin-sidebar ${isSidebarCollapsed ? "collapsed" : ""} ${isMobileMenuOpen ? "mobile-open" : ""}`}
      >
        <div className="admin-logo-area">
          <Link to="/" className="admin-logo-inner" title="View Storefront">
            <div className="admin-logo-circle">
              <img src="/circle-logo.png" alt="Safed Rang" />
            </div>
            {!isSidebarCollapsed && (
              <div className="admin-logo-text">
                <span className="admin-brand-name">SAFED RANG</span>
                <span className="admin-brand-sub">Admin Console</span>
              </div>
            )}
          </Link>
          <button
            className="sidebar-toggle-desktop"
            onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}
            title={isSidebarCollapsed ? "Expand sidebar" : "Collapse sidebar"}
          >
            <Menu size={17} />
          </button>
          <button className="sidebar-toggle-mobile" onClick={() => setIsMobileMenuOpen(false)} aria-label="Close menu">
            <X size={22} />
          </button>
        </div>

        <nav className="admin-nav custom-scrollbar">
          {navigation.map((group) => {
            const isExpanded = expandedGroups[group.group] !== false;
            return (
              <div key={group.group} className="nav-group">
                {!isSidebarCollapsed && (
                  <button className="nav-group-title" onClick={() => toggleGroup(group.group)}>
                    <span>{group.group}</span>
                    <ChevronRight size={12} className={`nav-group-chevron ${isExpanded ? "rotated" : ""}`} />
                  </button>
                )}
                {(isSidebarCollapsed || isExpanded) &&
                  group.items.map((item) => {
                    const count = item.countKey ? counts[item.countKey] : 0;
                    return (
                      <Link
                        key={item.path}
                        to={item.path}
                        onClick={() => setIsMobileMenuOpen(false)}
                        title={isSidebarCollapsed ? item.label : undefined}
                        className={`admin-nav-item ${isActive(item) ? "active" : ""}`}
                      >
                        <span className="admin-nav-icon">{item.icon}</span>
                        {!isSidebarCollapsed && (
                          <span className="admin-nav-label">
                            {item.label}
                            {count > 0 && (
                              <span className="nav-badge" title={`${count} order${count === 1 ? "" : "s"} to process`}>
                                {count}
                              </span>
                            )}
                          </span>
                        )}
                        {isSidebarCollapsed && count > 0 && <span className="nav-badge-dot" />}
                      </Link>
                    );
                  })}
              </div>
            );
          })}
        </nav>

        <div className="admin-sidebar-footer">
          {!isSidebarCollapsed && (
            <Link to="/" className="view-store-btn" target="_blank">
              <Store size={14} />
              <span>View Storefront</span>
              <ExternalLink size={11} />
            </Link>
          )}
          <div className="admin-user-card">
            <div className="admin-avatar">{userInitial}</div>
            {!isSidebarCollapsed && (
              <div className="admin-user-meta">
                <span className="admin-user-name">{userDisplay}</span>
                <span className="admin-user-role">{userRole}</span>
              </div>
            )}
            <button onClick={handleLogout} className="admin-logout-btn" title="Sign Out" aria-label="Sign out">
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <main className={`admin-main ${isSidebarCollapsed ? "expanded" : ""}`}>
        <header className="admin-header">
          <div className="admin-header-left">
            <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(true)} aria-label="Open menu">
              <Menu size={22} />
            </button>
            <div className="admin-breadcrumb">
              <span className="breadcrumb-root">Admin</span>
              <ChevronRight size={13} className="breadcrumb-sep" />
              <span className="breadcrumb-current">{currentPageLabel}</span>
            </div>
          </div>

          <div className="admin-header-center">
            <form className="admin-global-search" onSubmit={handleSearch} role="search">
              <Search size={16} className="search-icon" />
              <input
                type="search"
                placeholder="Search products, or an order number…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                id="admin-global-search"
                aria-label="Search products or orders"
              />
            </form>
          </div>

          <div className="admin-header-right">
            <button
              type="button"
              className="admin-theme-toggle"
              onClick={() => setTheme((t) => (t === "dark" ? "light" : "dark"))}
              title={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
              aria-label={theme === "dark" ? "Switch to light theme" : "Switch to dark theme"}
            >
              {theme === "dark" ? <Sun size={15} /> : <Moon size={15} />}
              <span>{theme === "dark" ? "Light" : "Dark"}</span>
            </button>

            <Link to="/" className="icon-btn" title="View Storefront" target="_blank">
              <ExternalLink size={18} />
            </Link>

            <div className="admin-header-avatar" title={userDisplay}>
              {userInitial}
            </div>
          </div>
        </header>

        <div className="admin-content custom-scrollbar">
          <AdminErrorBoundary isSubRoute={true}>
            <Outlet />
          </AdminErrorBoundary>
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
