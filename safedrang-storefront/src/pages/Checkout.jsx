import { useState, useEffect } from "react";
import { Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { load } from "@cashfreepayments/cashfree-js";
import { useCart } from "../context/CartContext";
import { useCurrency } from "../context/CurrencyContext";
import { useAuth } from "../context/AuthContext";
import { ChevronRight, ShieldCheck, Lock, AlertCircle } from "lucide-react";
import { API_BASE, getAuthHeaders } from "../config/api.js";
import "./Checkout.css";

export default function Checkout() {
  const { cart, cartCount, clearCart } = useCart();
  const { formatPrice } = useCurrency();
  const { user, token, loading: authLoading } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: user?.email || "",
    firstName: user?.name?.split(" ")[0] || "",
    lastName: user?.name?.split(" ")[1] || "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!authLoading && !user) {
      navigate("/login?redirect=/checkout");
    }
  }, [user, authLoading, navigate]);

  const subtotal = cart.reduce((acc, item) => acc + (item.salePrice || item.price) * item.quantity, 0);
  const shipping = subtotal > 0 ? 0 : 0; // Free shipping for simplicity
  const total = subtotal + shipping;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) {
      navigate("/login?redirect=/checkout");
      return;
    }

    setError("");
    setLoading(true);

    try {
      // 1. Create order in backend
      const orderData = {
        items: cart.map(item => ({
          productId: item.id,
          variantId: item.variantId,
          quantity: item.quantity
        })),
        shippingAddress: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          address: formData.address,
          city: formData.city,
          state: formData.state,
          pincode: formData.pincode,
          phone: formData.phone
        },
        paymentMethod: "CASHFREE"
      };

      const headers = { Authorization: `Bearer ${token}` };
      const orderRes = await axios.post(`${API_BASE}/orders`, orderData, { headers });
      const orderId = orderRes.data.data.id;

      // 2. Init Cashfree Payment Session
      const cfRes = await axios.post(`${API_BASE}/orders/cashfree-order`, {
        orderId,
        customerDetails: {
          name: `${formData.firstName} ${formData.lastName}`.trim(),
          email: formData.email,
          phone: formData.phone
        }
      }, { headers });

      const { paymentSessionId, cfEnvironment } = cfRes.data.data;

      // 3. Load Cashfree SDK and redirect
      const cashfree = await load({
        mode: cfEnvironment === "production" ? "production" : "sandbox",
      });

      cashfree.checkout({
        paymentSessionId,
        redirectTarget: "_self"
      });

    } catch (err) {
      console.error("Checkout failed:", err);
      setError(err.response?.data?.message || "Failed to initiate payment. Please try again.");
      setLoading(false);
    }
  };

  if (cartCount === 0) {
    return (
      <div className="checkout-empty container">
        <h2>Your Cart is Empty</h2>
        <p>Discover our handcrafted collection of exclusive pieces.</p>
        <Link to="/shop" className="btn-primary" style={{ padding: "12px 24px", display: "inline-block", marginTop: "20px" }}>
          Continue Shopping
        </Link>
      </div>
    );
  }

  return (
    <div className="checkout-page container">
      <div className="checkout-header">
        <h1>Checkout</h1>
        <div className="breadcrumb">
          <Link to="/cart">Cart</Link> <ChevronRight size={14} />
          <span>Checkout</span>
        </div>
      </div>

      <div className="checkout-grid">
        {/* Left: Form */}
        <div className="checkout-form-col">
          <form onSubmit={handleSubmit} className="checkout-form">
            <section className="form-section">
              <h2>Contact Information</h2>
              <div className="form-group">
                <input
                  type="email"
                  name="email"
                  placeholder="Email address"
                  required
                  value={formData.email}
                  onChange={handleChange}
                />
              </div>
            </section>

            <section className="form-section">
              <h2>Shipping Address</h2>
              <div className="form-row">
                <div className="form-group">
                  <input
                    type="text"
                    name="firstName"
                    placeholder="First name"
                    required
                    value={formData.firstName}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <input
                    type="text"
                    name="lastName"
                    placeholder="Last name"
                    required
                    value={formData.lastName}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="form-group">
                <input
                  type="text"
                  name="address"
                  placeholder="Address"
                  required
                  value={formData.address}
                  onChange={handleChange}
                />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <input
                    type="text"
                    name="city"
                    placeholder="City"
                    required
                    value={formData.city}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <input
                    type="text"
                    name="state"
                    placeholder="State"
                    required
                    value={formData.state}
                    onChange={handleChange}
                  />
                </div>
                <div className="form-group">
                  <input
                    type="text"
                    name="pincode"
                    placeholder="PIN Code"
                    required
                    value={formData.pincode}
                    onChange={handleChange}
                  />
                </div>
              </div>
              <div className="form-group">
                <input
                  type="tel"
                  name="phone"
                  placeholder="Phone number"
                  required
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </section>

            {error && (
              <div className="checkout-error" style={{ color: "var(--color-rust)", marginBottom: "1rem", display: "flex", alignItems: "center", gap: "0.5rem" }}>
                <AlertCircle size={18} />
                <span>{error}</span>
              </div>
            )}

            <button type="submit" className="btn-primary checkout-btn" disabled={loading}>
              {loading ? "Processing..." : `Proceed to Pay ${formatPrice(total)}`}
            </button>
            <div className="secure-badge">
              <Lock size={14} /> Secure Cashfree Checkout
            </div>
          </form>
        </div>

        {/* Right: Order Summary */}
        <div className="checkout-summary-col">
          <div className="order-summary">
            <h2>Order Summary</h2>
            <div className="summary-items">
              {cart.map((item) => (
                <div key={item.id} className="summary-item">
                  <div className="summary-item-img">
                    <img src={item.images?.[0] || item.image} alt={item.title} />
                    <span className="summary-item-qty">{item.quantity}</span>
                  </div>
                  <div className="summary-item-info">
                    <h4 style={{ textTransform: "capitalize" }}>{item.title.replace(/"/g, "")}</h4>
                    <p>{item.fabric}</p>
                  </div>
                  <div className="summary-item-price">
                    {formatPrice((item.salePrice || item.price) * item.quantity)}
                  </div>
                </div>
              ))}
            </div>

            <div className="summary-totals">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
              <div className="summary-row">
                <span>Shipping</span>
                <span>{shipping === 0 ? "Free" : formatPrice(shipping)}</span>
              </div>
              <div className="summary-row total-row">
                <span>Total</span>
                <span>{formatPrice(total)}</span>
              </div>
            </div>

            <div className="checkout-trust">
              <div className="trust-item">
                <ShieldCheck size={20} />
                <div>
                  <h4>Authentic Handloom</h4>
                  <p>100% genuine handcrafted products</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
