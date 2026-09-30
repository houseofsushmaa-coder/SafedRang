import React, { useState } from 'react';
import { Outlet, Link, useLocation } from 'react-router-dom';
import { 
  LayoutDashboard, ShoppingBag, Tags, Package, ShoppingCart, Users,
  Ticket, CreditCard, Undo2, Truck, Megaphone, ShoppingBasket, Bell,
  BarChart3, LineChart, PieChart, TrendingUp, MonitorSmartphone, Layers,
  FileText, Shield, Settings, FileClock, Menu, X, Search
} from 'lucide-react';
import './AdminLayout.css';

const AdminLayout = () => {
  const location = useLocation();
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

  const navigation = [
    {
      group: "Main",
      items: [
        { path: '/admin', label: 'Dashboard', icon: <LayoutDashboard size={20} /> },
      ]
    },
    {
      group: "Store",
      items: [
        { path: '/admin/products', label: 'Products', icon: <ShoppingBag size={20} /> },
        { path: '/admin/categories', label: 'Categories', icon: <Tags size={20} /> },
        { path: '/admin/inventory', label: 'Inventory', icon: <Package size={20} /> },
        { path: '/admin/orders', label: 'Orders', icon: <ShoppingCart size={20} /> },
        { path: '/admin/customers', label: 'Customers', icon: <Users size={20} /> },
      ]
    },
    {
      group: "Sales",
      items: [
        { path: '/admin/coupons', label: 'Coupons', icon: <Ticket size={20} /> },
        { path: '/admin/payments', label: 'Payments', icon: <CreditCard size={20} /> },
        { path: '/admin/refunds', label: 'Refunds', icon: <Undo2 size={20} /> },
        { path: '/admin/shipping', label: 'Shipping', icon: <Truck size={20} /> },
      ]
    },
    {
      group: "Marketing",
      items: [
        { path: '/admin/campaigns', label: 'Campaigns', icon: <Megaphone size={20} /> },
        { path: '/admin/abandoned-carts', label: 'Abandoned Carts', icon: <ShoppingBasket size={20} /> },
        { path: '/admin/notifications', label: 'Notifications', icon: <Bell size={20} /> },
      ]
    },
    {
      group: "Analytics",
      items: [
        { path: '/admin/analytics', label: 'Overview', icon: <BarChart3 size={20} /> },
        { path: '/admin/analytics/sales', label: 'Sales', icon: <LineChart size={20} /> },
      ]
    },
    {
      group: "Website",
      items: [
        { path: '/admin/website/homepage', label: 'Homepage', icon: <MonitorSmartphone size={20} /> },
        { path: '/admin/website/banners', label: 'Banners', icon: <Layers size={20} /> },
      ]
    },
    {
      group: "System",
      items: [
        { path: '/admin/users', label: 'Users', icon: <Shield size={20} /> },
        { path: '/admin/settings', label: 'Settings', icon: <Settings size={20} /> },
        { path: '/admin/audit-logs', label: 'Audit Logs', icon: <FileClock size={20} /> },
      ]
    }
  ];

  return (
    <div className="admin-container">
      {/* Mobile Overlay */}
      {isMobileMenuOpen && (
        <div className="admin-mobile-overlay" onClick={() => setIsMobileMenuOpen(false)} />
      )}

      {/* Sidebar */}
      <aside className={`admin-sidebar ${isSidebarCollapsed ? 'collapsed' : ''} ${isMobileMenuOpen ? 'mobile-open' : ''}`}>
        <div className="admin-logo">
          <h2>{!isSidebarCollapsed ? 'Safed Admin' : 'S'}</h2>
          <button className="sidebar-toggle-desktop" onClick={() => setIsSidebarCollapsed(!isSidebarCollapsed)}>
            <Menu size={20} />
          </button>
          <button className="sidebar-toggle-mobile" onClick={() => setIsMobileMenuOpen(false)}>
            <X size={24} />
          </button>
        </div>

        <nav className="admin-nav custom-scrollbar">
          {navigation.map((group, idx) => (
            <div key={idx} className="nav-group">
              {!isSidebarCollapsed && <div className="nav-group-title">{group.group}</div>}
              {group.items.map((item) => (
                <Link
                  key={item.path}
                  to={item.path}
                  title={isSidebarCollapsed ? item.label : undefined}
                  className={`admin-nav-item ${location.pathname === item.path ? 'active' : ''}`}
                >
                  <span className="admin-nav-icon">{item.icon}</span>
                  {!isSidebarCollapsed && <span className="admin-nav-label">{item.label}</span>}
                </Link>
              ))}
            </div>
          ))}
        </nav>
        
        <div className="admin-sidebar-footer">
           {!isSidebarCollapsed && <Link to="/" className="view-store-link">View Store</Link>}
           <div className="admin-user-profile">
              <div className="admin-avatar">A</div>
              {!isSidebarCollapsed && (
                <div className="admin-user-info">
                  <div className="admin-user-name">Admin User</div>
                  <div className="admin-user-role">Super Admin</div>
                </div>
              )}
           </div>
        </div>
      </aside>

      {/* Main Content */}
      <main className={`admin-main ${isSidebarCollapsed ? 'expanded' : ''}`}>
        {/* Topbar */}
        <header className="admin-header">
          <div className="admin-header-left">
            <button className="mobile-menu-btn" onClick={() => setIsMobileMenuOpen(true)}>
              <Menu size={24} />
            </button>
            <div className="admin-breadcrumb">
               Admin / <span className="breadcrumb-current">{location.pathname.split('/').pop() || 'Dashboard'}</span>
            </div>
          </div>
          
          <div className="admin-header-right">
            <div className="admin-global-search">
              <Search size={18} className="search-icon" />
              <input type="text" placeholder="Search orders, products..." />
            </div>
            
            <button className="icon-btn notification-btn">
              <Bell size={20} />
              <span className="notification-badge">3</span>
            </button>
          </div>
        </header>

        {/* Page Content */}
        <div className="admin-content custom-scrollbar">
          <Outlet />
        </div>
      </main>
    </div>
  );
};

export default AdminLayout;
