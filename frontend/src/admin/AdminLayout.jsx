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
  Undo2,
  Truck,
  Megaphone,
  ShoppingBasket,
  Bell,
  BarChart3,
  LineChart,
  MonitorSmartphone,
  Layers,
  Shield,
  Settings,
  FileClock,
  Menu,
  X,
  Search,
  LogOut,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Store,
} from "lucide-react";
import { useAuth } from "../context/AuthContext";
import AdminErrorBoundary from "./components/AdminErrorBoundary";
import "./AdminLayout.css";

const AdminLayout = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { user, logout } = useAuth();

  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedGroups, setExpandedGroups] = useState({
    Main: true,
    Store: true,
    Sales: true,
    Marketing: false,
    Analytics: true,
    Website: false,
    System: true,
  });

  // Live clock
  useEffect(() => {
    const timer = setInterval(() => setCurrentTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const handleLogout = () => {
    logout();
    navigate("/admin/login");
  };

  const toggleGroup = (groupName) => {
    if (isSidebarCollapsed) return;
    setExpandedGroups((prev) => ({ ...prev, [groupName]: !prev[groupName] }));
  };

  const isActive = (path) => {
    if (path === "/admin") return location.pathname === "/admin";
    return location.pathname.startsWith(path);
  };

  const navigation = [
    {
      group: "Main",
      items: [
        { path: "/admin", label: "Dashboard", icon: <LayoutDashboard size={18} /> },
      ],
    },
    {
      group: "Store",
      items: [
        { path: "/admin/products", label: "Products", icon: <ShoppingBag size={18} /> },
        { path: "/admin/categories", label: "Categories", icon: <Tags size={18} /> },
        { path: "/admin/inventory", label: "Inventory", icon: <Package size={18} /> },
        { path: "/admin/orders", label: "Orders", icon: <ShoppingCart size={18} />, badge: "New" },
        { path: "/admin/customers", label: "Customers", icon: <Users size={18} /> },
      ],
    },
    {
      group: "Sales",
      items: [
        { path: "/admin/coupons", label: "Coupons", icon: <Ticket size={18} /> },
        { path: "/admin/payments", label: "Payments", icon: <CreditCard size={18} /> },
        { path: "/admin/refunds", label: "Refunds", icon: <Undo2 size={18} />, launchingSoon: true },
        { path: "/admin/shipping", label: "Shipping", icon: <Truck size={18} />, launchingSoon: true },
      ],
    },
    {
      group: "Marketing",
      items: [
        { path: "/admin/campaigns", label: "Campaigns", icon: <Megaphone size={18} />, launchingSoon: true },
        { path: "/admin/abandoned-carts", label: "Abandoned Carts", icon: <ShoppingBasket size={18} /> },
        { path: "/admin/notifications", label: "Notifications", icon: <Bell size={18} />, launchingSoon: true },
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
      group: "Website",
      items: [
        { path: "/admin/website/homepage", label: "Homepage", icon: <MonitorSmartphone size={18} />, launchingSoon: true },
        { path: "/admin/website/banners", label: "Banners", icon: <Layers size={18} />, launchingSoon: true },
      ],
    },
    {
      group: "System",
      items: [
        { path: "/admin/users", label: "Admin Users", icon: <Shield size={18} /> },
        { path: "/admin/settings", label: "Settings", icon: <Settings size={18} /> },
        { path: "/admin/audit-logs", label: "Audit Logs", icon: <FileClock size={18} />, launchingSoon: true },
      ],
    },
  ];

  // Page title from path
  const currentPageLabel = (() => {
    for (const group of navigation) {
      for (const item of group.items) {
        if (isActive(item.path)) return item.label;
      }
    }
    return "Dashboard";
  })();

  const formatTime = (d) =>
    d.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", hour12: true });
  const formatDate = (d) =>
    d.toLocaleDateString("en-IN", { weekday: "short", day: "numeric", month: "short" });

  const userInitial = user?.name ? user.name.charAt(0).toUpperCase() : user?.email?.charAt(0).toUpperCase() || "A";
  const userDisplay = user?.name || user?.email?.split("@")[0] || "Admin";
  const userRole =
    typeof user?.role === "string"
      ? user.role.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())
      : "Super Admin";

  return (
    <div className="admin-container">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div
          className="admin-mobile-overlay"
          onClick={() => setIsMobileMenuOpen(false)}
        />
      )}

      {/* ─── Sidebar ─── */}
      <aside
        className={`admin-sidebar ${isSidebarCollapsed ? "collapsed" : ""} ${
          isMobileMenuOpen ? "mobile-open" : ""
        }`}
      >
        {/* Logo area */}
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
          <button
            className="sidebar-toggle-mobile"
            onClick={() => setIsMobileMenuOpen(false)}
          >
            <X size={22} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="admin-nav custom-scrollbar">
          {navigation.map((group) => {
            const isExpanded = expandedGroups[group.group] !== false;
            return (
              <div key={group.group} className="nav-group">
                {!isSidebarCollapsed && (
                  <button
                    className="nav-group-title"
                    onClick={() => toggleGroup(group.group)}
                  >
                    <span>{group.group}</span>
                    <ChevronRight
                      size={12}
                      className={`nav-group-chevron ${isExpanded ? "rotated" : ""}`}
                    />
                  </button>
                )}
                {(isSidebarCollapsed || isExpanded) &&
                  group.items.map((item) => (
                    <Link
                      key={item.path}
                      to={item.launchingSoon ? "#" : item.path}
                      onClick={(e) => {
                        if (item.launchingSoon) e.preventDefault();
                        else setIsMobileMenuOpen(false);
                      }}
                      title={isSidebarCollapsed ? item.label : undefined}
                      className={`admin-nav-item ${isActive(item.path) ? "active" : ""} ${
                        item.launchingSoon ? "nav-soon" : ""
                      }`}
                    >
                      <span className="admin-nav-icon">{item.icon}</span>
                      {!isSidebarCollapsed && (
                        <span className="admin-nav-label">
                          {item.label}
                          {item.badge && (
                            <span className="nav-badge">{item.badge}</span>
                          )}
                          {item.launchingSoon && (
                            <span className="nav-soon-tag">Soon</span>
                          )}
                        </span>
                      )}
                      {isSidebarCollapsed && item.badge && (
                        <span className="nav-badge-dot" />
                      )}
                    </Link>
                  ))}
              </div>
            );
          })}
        </nav>

        {/* Sidebar Footer */}
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
            <button
              onClick={handleLogout}
              className="admin-logout-btn"
              title="Sign Out"
            >
              <LogOut size={16} />
            </button>
          </div>
        </div>
      </aside>

      {/* ─── Main Content ─── */}
      <main className={`admin-main ${isSidebarCollapsed ? "expanded" : ""}`}>
        {/* Top Header */}
        <header className="admin-header">
          <div className="admin-header-left">
            <button
              className="mobile-menu-btn"
              onClick={() => setIsMobileMenuOpen(true)}
            >
              <Menu size={22} />
            </button>
            <div className="admin-breadcrumb">
              <span className="breadcrumb-root">
                <Sparkles size={13} />
                Admin
              </span>
              <ChevronRight size={13} className="breadcrumb-sep" />
              <span className="breadcrumb-current">{currentPageLabel}</span>
            </div>
          </div>

          <div className="admin-header-center">
            <div className="admin-global-search">
              <Search size={16} className="search-icon" />
              <input
                type="text"
                placeholder="Search orders, products, customers…"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                id="admin-global-search"
              />
              <kbd className="search-kbd">⌘K</kbd>
            </div>
          </div>

          <div className="admin-header-right">
            <div className="admin-clock">
              <span className="clock-time">{formatTime(currentTime)}</span>
              <span className="clock-date">{formatDate(currentTime)}</span>
            </div>

            <div className="admin-header-divider" />

            <button className="icon-btn notification-btn" title="Notifications">
              <Bell size={19} />
              <span className="notification-dot" />
            </button>

            <Link to="/" className="icon-btn" title="View Storefront" target="_blank">
              <ExternalLink size={18} />
            </Link>

            <div className="admin-header-avatar" title={userDisplay}>
              {userInitial}
            </div>
          </div>
        </header>

        {/* Page Content */}
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
