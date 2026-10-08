import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { load } from "@cashfreepayments/cashfree-js";
import { useCart } from "../context/CartContext";
import { useCurrency } from "../context/CurrencyContext";
import { useAuth } from "../context/AuthContext";
import { ChevronRight, ShieldCheck, Lock, AlertCircle } from "lucide-react";
import { supabase } from "../lib/supabase";
import "./Checkout.css";

const CF_ENV = import.meta.env.VITE_CASHFREE_ENV || "SANDBOX";

export default function Checkout() {
  const { cart, cartCount, clearCart } = useCart();
  const { formatPrice } = useCurrency();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: user?.email || "",
    firstName: user?.user_metadata?.full_name?.split(" ")[0] || "",
    lastName: user?.user_metadata?.full_name?.split(" ").slice(1).join(" ") || "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
  });

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const subtotal = cart.reduce(
    (acc, item) => acc + (item.salePrice || item.price) * item.quantity,
    0
  );
  const total = subtotal; // free shipping

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      const orderId = `SR_${Date.now()}`;
      const customerName = `${formData.firstName} ${formData.lastName}`.trim();

      // ─────────────────────────────────────────────────────────────
      // STEP 1: Create Cashfree order securely via Supabase Edge Function
      // ─────────────────────────────────────────────────────────────
      const { data: edgeData, error: edgeError } = await supabase.functions.invoke('cashfree-order', {
        body: {
          orderDetails: {
            amount: total,
            items: cart.map((item) => ({
              productId: item.id,
              title: item.title,
              quantity: item.quantity,
              price: item.salePrice || item.price,
            }))
          },
          customerDetails: {
            name: customerName,
            email: formData.email,
            phone: formData.phone,
            address: {
              address: formData.address,
              city: formData.city,
              state: formData.state,
              pincode: formData.pincode,
            }
          }
        }
      });

      if (edgeError || (edgeData && edgeData.error)) {
        console.error("Edge function error:", edgeError || edgeData?.error);
        throw new Error(edgeData?.error || edgeError?.message || "Payment initiation failed.");
      }

      const { payment_session_id } = edgeData;

      if (!payment_session_id) {
        throw new Error("No payment session ID received from Cashfree.");
      }

      // ─────────────────────────────────────────────────────────────
      // STEP 2: Load Cashfree JS SDK → redirect to payment page
      // ─────────────────────────────────────────────────────────────
      const cashfree = await load({
        mode: CF_ENV === "PRODUCTION" ? "production" : "sandbox",
      });

      cashfree.checkout({
        paymentSessionId: payment_session_id,
        redirectTarget: "_self",
      });

    } catch (err) {
      console.error("Checkout failed:", err);
      setError(err.message || "Payment initiation failed. Please try again.");
      setLoading(false);
    }
  };

  if (cartCount === 0) {
    return (
      <div className="checkout-empty container">
        <h2>Your Cart is Empty</h2>
        <p>Discover our handcrafted collection of exclusive pieces.</p>
        <Link
          to="/shop"
          className="btn-primary"
          style={{ padding: "12px 24px", display: "inline-block", marginTop: "20px" }}
        >
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
        {/* ── Left: Form ── */}
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
                  placeholder="Phone number (10 digits)"
                  required
                  pattern="[0-9]{10}"
                  value={formData.phone}
                  onChange={handleChange}
                />
              </div>
            </section>

            {error && (
              <div
                className="checkout-error"
                style={{
                  color: "var(--color-rust, #c0392b)",
                  marginBottom: "1rem",
                  display: "flex",
                  alignItems: "flex-start",
                  gap: "0.5rem",
                  padding: "0.75rem",
                  background: "#fff5f5",
                  borderRadius: "6px",
                  border: "1px solid #fecaca",
                }}
              >
                <AlertCircle size={18} style={{ flexShrink: 0, marginTop: 2 }} />
                <span style={{ fontSize: "0.9rem" }}>{error}</span>
              </div>
            )}

            <button
              type="submit"
              className="btn-primary checkout-btn"
              disabled={loading}
              style={{ width: "100%", opacity: loading ? 0.7 : 1 }}
            >
              {loading
                ? "Processing payment..."
                : `Proceed to Pay ${formatPrice(total)}`}
            </button>
            <div className="secure-badge">
              <Lock size={14} /> Secure Cashfree Checkout
            </div>
          </form>
        </div>

        {/* ── Right: Order Summary ── */}
        <div className="checkout-summary-col">
          <div className="order-summary">
            <h2>Order Summary</h2>
            <div className="summary-items">
              {cart.map((item) => (
                <div key={`${item.id}-${item.variantId || ""}`} className="summary-item">
                  <div className="summary-item-img">
                    <img
                      src={item.images?.[0] || item.image}
                      alt={item.title}
                      onError={(e) => {
                        e.target.src = "https://via.placeholder.com/60x80?text=SR";
                      }}
                    />
                    <span className="summary-item-qty">{item.quantity}</span>
                  </div>
                  <div className="summary-item-info">
                    <h4 style={{ textTransform: "capitalize" }}>
                      {item.title?.replace(/"/g, "")}
                    </h4>
                    {item.fabric && <p>{item.fabric}</p>}
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
                <span style={{ color: "green", fontWeight: 500 }}>Free</span>
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
