import { BrowserRouter as Router, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import Header from './components/Header';
import Footer from './components/Footer';
import Home from './pages/Home';
import Shop from './pages/Shop';
import About from './pages/About';
import Craft from './pages/Craft';
import ProductDetail from './pages/ProductDetail';
import AdminLayout from './admin/AdminLayout';
import Dashboard from './admin/pages/Dashboard';
import Orders from './admin/pages/Orders';
import Products from './admin/pages/Products';
import EditProduct from './admin/pages/EditProduct';
import Users from './admin/pages/Users';
import AdminLogin from './admin/pages/AdminLogin';
import { ProductProvider } from './context/ProductContext';
import { AuthProvider, useAuth } from './context/AuthContext';

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
  const { token, loading } = useAuth();
  
  if (loading) return <div>Loading...</div>;
  if (!token) return <Navigate to="/admin/login" replace />;
  
  return children;
};

function App() {
  return (
    <AuthProvider>
      <ProductProvider>
        <Router>
          <Routes>
            <Route path="/admin/login" element={<AdminLogin />} />
            
            <Route path="/admin" element={
              <ProtectedAdminRoute>
                <AdminLayout />
              </ProtectedAdminRoute>
            }>
              <Route index element={<Dashboard />} />
              <Route path="orders" element={<Orders />} />
              <Route path="products" element={<Products />} />
              <Route path="product/:id" element={<EditProduct />} />
              <Route path="users" element={<Users />} />
              {/* Future routes to be implemented */}
              <Route path="*" element={<div style={{padding: '40px'}}><h2>Coming Soon</h2><p>This module is under construction.</p></div>} />
            </Route>

            <Route path="/" element={<StorefrontLayout />}>
              <Route index element={<Home />} />
              <Route path="shop" element={<Shop />} />
              <Route path="about" element={<About />} />
              <Route path="craft" element={<Craft />} />
              <Route path="product/:id" element={<ProductDetail />} />
            </Route>
          </Routes>
        </Router>
      </ProductProvider>
    </AuthProvider>
  );
}

export default App;
