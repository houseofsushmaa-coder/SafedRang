import {
  BrowserRouter as Router,
  Routes,
  Route,
  Outlet,
  Navigate,
} from "react-router-dom";
import Header from "./components/Header";
import Footer from "./components/Footer";
import Home from "./pages/Home";
import Shop from "./pages/Shop";
import About from "./pages/About";
import Craft from "./pages/Craft";
import ProductDetail from "./pages/ProductDetail";
import Checkout from "./pages/Checkout";
import PaymentVerify from "./pages/PaymentVerify";
import AdminLayout from "./admin/AdminLayout";
import AdminErrorBoundary from "./admin/components/AdminErrorBoundary";
import Dashboard from "./admin/pages/Dashboard";
import Orders from "./admin/pages/Orders";
import Products from "./admin/pages/Products";
import EditProduct from "./admin/pages/EditProduct";
import Users from "./admin/pages/Users";
import AdminLogin from "./admin/pages/AdminLogin";
import Inventory from "./admin/pages/Inventory";
import Analytics from "./admin/pages/Analytics";
import SalesAnalytics from "./admin/pages/SalesAnalytics";
import Categories from "./admin/pages/Categories";
import Payments from "./admin/pages/Payments";
import Settings from "./admin/pages/Settings";
import Coupons from "./admin/pages/Coupons";
import { ProductProvider } from "./context/ProductContext";
import { AuthProvider, useAuth } from "./context/AuthContext";
import { CurrencyProvider } from "./context/CurrencyContext";
import { CartProvider } from "./context/CartContext";

import { Toaster } from "react-hot-toast";
import GoogleAnalytics from "./components/GoogleAnalytics";

const StorefrontLayout = () => (
  <div className="app-layout">
    <Header />
    <main>
      <Outlet />
    </main>
    <Footer />
  </div>
);

const ProtectedAdminRoute = ({ children }) => {
  const { user, session, token, loading, isAdmin } = useAuth();

  if (loading) {
    return (
      <div
        style={{
          minHeight: "100vh",
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#FAF5EC",
          color: "#2A211D",
          fontFamily: '"Manrope", "Inter", system-ui, sans-serif',
        }}
      >
        <div
          style={{
            width: "44px",
            height: "44px",
            border: "3px solid rgba(174, 138, 84, 0.2)",
            borderTopColor: "#AE8A54",
            borderRadius: "50%",
            animation: "adminRouteSpin 0.8s linear infinite",
            marginBottom: "16px",
          }}
        />
        <div style={{ fontSize: "0.95rem", fontWeight: "600", color: "#6E1E2A" }}>
          SAFED RANG
        </div>
        <p style={{ margin: "4px 0 0 0", fontSize: "0.85rem", color: "#8B7863" }}>
          Verifying Admin Access…
        </p>
        <style>{`@keyframes adminRouteSpin { to { transform: rotate(360deg); } }`}</style>
      </div>
    );
  }

  if (!user && !session && !token) return <Navigate to="/admin/login" replace />;

  // Enforce role-based access: Customers cannot view admin dashboard
  if (!isAdmin) {
    return <Navigate to="/admin/login?error=unauthorized" replace />;
  }

  return children;
};

function App() {
  return (
    <AuthProvider>
      <ProductProvider>
        <CurrencyProvider>
          <CartProvider>
            <Router>
              <GoogleAnalytics />
              <Toaster 
                position="bottom-center"
                toastOptions={{
                  style: {
                    background: 'var(--color-dark-charcoal)',
                    color: 'var(--color-white)',
                    fontFamily: 'var(--font-body)',
                    letterSpacing: '0.05em',
                    border: '1px solid var(--color-antique-gold)',
                  },
                  success: {
                    iconTheme: {
                      primary: 'var(--color-antique-gold)',
                      secondary: 'var(--color-dark-charcoal)',
                    },
                  },
                }}
              />
            <Routes>
              <Route path="/admin/login" element={<AdminLogin />} />

              <Route
                path="/admin"
                element={
                  <AdminErrorBoundary>
                    <ProtectedAdminRoute>
                      <AdminLayout />
                    </ProtectedAdminRoute>
                  </AdminErrorBoundary>
                }
              >
                <Route index element={<Dashboard />} />
                <Route path="orders" element={<Orders />} />
                <Route path="products" element={<Products />} />
                <Route path="product/:id" element={<EditProduct />} />
                <Route path="users" element={<Users />} />
                <Route path="customers" element={<Users />} />
                <Route path="inventory" element={<Inventory />} />
                <Route path="analytics" element={<Analytics />} />
                <Route path="analytics/sales" element={<SalesAnalytics />} />
                <Route path="categories" element={<Categories />} />
                <Route path="payments" element={<Payments />} />
                <Route path="settings" element={<Settings />} />
                <Route path="coupons" element={<Coupons />} />
                {/* Placeholder for future routes */}
                <Route
                  path="*"
                  element={
                    <div style={{ padding: "40px" }}>
                      <h2>Coming Soon</h2>
                      <p>This module is under construction.</p>
                    </div>
                  }
                />
              </Route>

              <Route path="/" element={<StorefrontLayout />}>
                <Route index element={<Home />} />
                <Route path="shop" element={<Shop />} />
                <Route path="about" element={<About />} />
                <Route path="craft" element={<Craft />} />
                <Route path="product/:id" element={<ProductDetail />} />
                <Route path="checkout" element={<Checkout />} />
                <Route path="payment/verify" element={<PaymentVerify />} />
              </Route>
            </Routes>
          </Router>
          </CartProvider>
        </CurrencyProvider>
      </ProductProvider>
    </AuthProvider>
  );
}

export default App;
