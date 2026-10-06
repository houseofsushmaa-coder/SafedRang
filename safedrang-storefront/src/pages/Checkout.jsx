import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { useCart } from "../context/CartContext";
import { useCurrency } from "../context/CurrencyContext";
import { ChevronRight, ShieldCheck, CreditCard, Lock } from "lucide-react";
import "./Checkout.css";

export default function Checkout() {
  const { cart, cartCount, clearCart } = useCart();
  const { formatPrice } = useCurrency();
  const navigate = useNavigate();

  const [formData, setFormData] = useState({
    email: "",
    firstName: "",
    lastName: "",
    address: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
  });

  const [loading, setLoading] = useState(false);

  const subtotal = cart.reduce((acc, item) => acc + (item.salePrice || item.price) * item.quantity, 0);
  const shipping = subtotal > 0 ? 0 : 0; // Free shipping for simplicity
  const total = subtotal + shipping;

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setLoading(true);
    // Simulate payment processing
    setTimeout(() => {
      setLoading(false);
      clearCart();
      alert("Order placed successfully! This is a demo checkout.");
      navigate("/");
    }, 1500);
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

            <section className="form-section payment-section">
              <h2>Payment</h2>
              <p className="payment-subtitle">All transactions are secure and encrypted.</p>
              <div className="payment-box">
                <div className="payment-option">
                  <input type="radio" id="pay-cc" name="payment" defaultChecked />
                  <label htmlFor="pay-cc" className="payment-label">
                    <span>Credit Card / Debit Card</span>
                    <CreditCard size={18} color="var(--color-warm-taupe)" />
                  </label>
                </div>
                <div className="payment-details">
                  <div className="form-group">
                    <input type="text" placeholder="Card number" />
                  </div>
                  <div className="form-row">
                    <div className="form-group">
                      <input type="text" placeholder="Expiration date (MM/YY)" />
                    </div>
                    <div className="form-group">
                      <input type="text" placeholder="Security code" />
                    </div>
                  </div>
                  <div className="form-group">
                    <input type="text" placeholder="Name on card" />
                  </div>
                </div>
              </div>
            </section>

            <button type="submit" className="btn-primary checkout-btn" disabled={loading}>
              {loading ? "Processing..." : `Pay ${formatPrice(total)}`}
            </button>
            <div className="secure-badge">
              <Lock size={14} /> Secure Checkout
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
