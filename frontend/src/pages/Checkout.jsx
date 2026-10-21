import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { load } from "@cashfreepayments/cashfree-js";
import { useCart } from "../context/CartContext";
import { useCurrency } from "../context/CurrencyContext";
import { useAuth } from "../context/AuthContext";
import {
  ChevronRight, ShieldCheck, Lock, AlertCircle, Truck,
  CreditCard, Banknote, X, CheckCircle2, Package, Sparkles,
  Globe, ChevronDown,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { COUNTRIES, COUNTRY_MAP } from "../data/countries";
import "./Checkout.css";

const CF_ENV = import.meta.env.VITE_CASHFREE_ENV || "SANDBOX";
const COD_SHIPPING_INR = 39;          // COD fee always in INR base
const DEFAULT_COUNTRY = COUNTRY_MAP["IN"]; // India default

export default function Checkout() {
  const { cart, cartCount, clearCart } = useCart();
  const { formatPrice, changeCurrency, currency } = useCurrency();
  const { user } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  // ── Country / dial-code state ───────────────────────
  const [selectedCountry, setSelectedCountry] = useState(DEFAULT_COUNTRY);
  const [dialCode, setDialCode] = useState(DEFAULT_COUNTRY.dialCode);
  const [countrySearch, setCountrySearch] = useState("");
  const [showCountryDrop, setShowCountryDrop] = useState(false);
  const [showDialDrop, setShowDialDrop] = useState(false);
  const countryDropRef = useRef(null);
  const dialDropRef = useRef(null);

  // Close dropdowns on outside click
  useEffect(() => {
    const handler = (e) => {
      if (countryDropRef.current && !countryDropRef.current.contains(e.target))
        setShowCountryDrop(false);
      if (dialDropRef.current && !dialDropRef.current.contains(e.target))
        setShowDialDrop(false);
    };
    document.addEventListener("mousedown", handler);
    return () => document.removeEventListener("mousedown", handler);
  }, []);

  // When country changes → update dial code + currency
  const handleCountryChange = (country) => {
    setSelectedCountry(country);
    setDialCode(country.dialCode);
    changeCurrency(country.currency);
    setShowCountryDrop(false);
    setCountrySearch("");
    // Clear state field
    setFormData((prev) => ({ ...prev, state: "" }));
  };

  const filteredCountries = COUNTRIES.filter((c) =>
    c.name.toLowerCase().includes(countrySearch.toLowerCase()) ||
    c.dialCode.includes(countrySearch)
  );

  // ── Form state ──────────────────────────────────────
  const [formData, setFormData] = useState({
    email: user?.email || "",
    firstName: user?.user_metadata?.full_name?.split(" ")[0] || "",
    lastName: user?.user_metadata?.full_name?.split(" ").slice(1).join(" ") || "",
    address: "",
    apartment: "",
    city: "",
    state: "",
    pincode: "",
    phone: "",
  });

  const [step, setStep] = useState("form");
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formErrors, setFormErrors] = useState({});

  // ── Totals ──────────────────────────────────────────
  const subtotal = cart.reduce(
    (acc, item) => acc + (item.salePrice || item.price) * item.quantity,
    0
  );

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (formErrors[e.target.name]) {
      setFormErrors((prev) => ({ ...prev, [e.target.name]: "" }));
    }
  };

  const validateForm = () => {
    const errors = {};
    if (!formData.email) errors.email = "Email is required";
    if (!formData.firstName) errors.firstName = "First name is required";
    if (!formData.lastName) errors.lastName = "Last name is required";
    if (!formData.address) errors.address = "Address is required";
    if (!formData.city) errors.city = "City is required";
    if (!formData.state) errors.state = "State / Province is required";
    if (!formData.pincode) errors.pincode = "Postal / ZIP code is required";
    const phone = formData.phone.replace(/\D/g, "");
    if (!phone || phone.length < 6 || phone.length > 15)
      errors.phone = "Enter a valid phone number";
    return errors;
  };

  const handleContinueToPayment = (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      // Scroll to first error
      document.querySelector(".has-error input")?.scrollIntoView({ behavior: "smooth", block: "center" });
      return;
    }
    setStep("payment");
    setPaymentMethod(null);
    setError("");
  };

  // Full phone number = dialCode + local number
  const fullPhone = `${dialCode}${formData.phone}`;

  // ── Online Payment via Cashfree ─────────────────────
  const handleOnlinePayment = async () => {
    setError("");
    setLoading(true);
    try {
      const customerName = `${formData.firstName} ${formData.lastName}`.trim();

      const { data: edgeData, error: edgeError } =
        await supabase.functions.invoke("cashfree-order", {
          body: {
            orderDetails: {
              amount: subtotal,
              currency: "INR", // Cashfree processes in INR
              items: cart.map((item) => ({
                productId: item.id,
                title: item.title,
                quantity: item.quantity,
                price: item.salePrice || item.price,
              })),
            },
            customerDetails: {
              name: customerName,
              email: formData.email,
              phone: fullPhone,
              address: {
                address: `${formData.address}${formData.apartment ? ", " + formData.apartment : ""}`,
                city: formData.city,
                state: formData.state,
                pincode: formData.pincode,
                country: selectedCountry.name,
              },
            },
          },
        });

      if (edgeError || edgeData?.error) {
        throw new Error(
          edgeData?.error || edgeError?.message || "Payment initiation failed."
        );
      }

      const { payment_session_id } = edgeData;
      if (!payment_session_id)
        throw new Error("No payment session ID received from Cashfree.");

      const cashfree = await load({
        mode: CF_ENV === "PRODUCTION" ? "production" : "sandbox",
      });

      cashfree.checkout({
        paymentSessionId: payment_session_id,
        redirectTarget: "_self",
      });
    } catch (err) {
      console.error("Online payment failed:", err);
      setError(err.message || "Payment initiation failed. Please try again.");
      setLoading(false);
    }
  };

  // ── Cash on Delivery ────────────────────────────────
  const handleCOD = async () => {
    setError("");
    setLoading(true);
    try {
      const orderId = `SR_COD_${Date.now()}`;
      const customerName = `${formData.firstName} ${formData.lastName}`.trim();
      const orderTotal = subtotal + COD_SHIPPING_INR;
      const orderItems = cart.map((item) => ({
        productId: item.id,
        title: item.title,
        quantity: item.quantity,
        price: item.salePrice || item.price,
        selectedSize: item.selectedSize || null,
      }));

      const addressData = {
        address: formData.address,
        apartment: formData.apartment || "",
        city: formData.city,
        state: formData.state,
        pincode: formData.pincode,
        country: selectedCountry.name,
        country_code: selectedCountry.code,
        name: customerName,
        phone: fullPhone,
        email: formData.email,
      };

      // ── 1. Provision customer account (create if new, send magic link) ──
      let isNewUser = false;
      if (!user) {
        try {
          const { data: provData } = await supabase.functions.invoke("provision-customer", {
            body: {
              email: formData.email,
              fullName: customerName,
              orderId,
            },
          });
          isNewUser = provData?.isNewUser ?? false;
        } catch (provErr) {
          console.warn("Account provisioning failed (non-fatal):", provErr);
        }
      }

      // ── 2. Insert COD order ──────────────────────────────────────────────
      const { error: insertError } = await supabase.from("orders").insert([
        {
          id: orderId,
          order_id: orderId,
          orderNumber: orderId,
          customer_name: customerName,
          customer_email: formData.email,
          customer_phone: fullPhone,
          shipping_address: addressData,
          shippingAddress: addressData,
          billingAddress: addressData,
          items: orderItems,
          subtotal,
          shipping_charge: COD_SHIPPING_INR,
          shippingCharge: COD_SHIPPING_INR,
          total: orderTotal,
          total_amount: orderTotal,
          payment_method: "COD",
          paymentMethod: "COD",
          payment_status: "PENDING",
          paymentStatus: "PENDING",
          order_status: "PROCESSING",
          orderStatus: "PROCESSING",
          currency_selected: currency,
          user_id: user?.id || null,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
        },
      ]);

      if (insertError) {
        console.error("COD order insert error:", insertError);
        throw new Error(insertError.message || "Unable to save your order. Please try again.");
      }

      clearCart();
      const params = new URLSearchParams({
        order_id: orderId,
        method: "cod",
        email: formData.email,
      });
      if (isNewUser) params.set("new_account", "1");
      navigate(`/order-success?${params.toString()}`);
    } catch (err) {
      console.error("COD order failed:", err);
      setError(err.message || "Order placement failed. Please try again.");
      setLoading(false);
    }
  };


  const handlePaymentConfirm = () => {
    if (paymentMethod === "online") handleOnlinePayment();
    else if (paymentMethod === "cod") handleCOD();
  };

  // ── Empty cart ──────────────────────────────────────
  if (cartCount === 0) {
    return (
      <div className="checkout-empty container">
        <div className="checkout-empty-icon">
          <Package size={64} strokeWidth={1.2} />
        </div>
        <h2>Your Bag is Empty</h2>
        <p>Discover our handcrafted collection of exclusive pieces.</p>
        <Link to="/shop" className="btn-primary"
          style={{ padding: "14px 32px", display: "inline-block", marginTop: "24px" }}>
          Explore Collection
        </Link>
      </div>
    );
  }

  const isIndia = selectedCountry.code === "IN";

  return (
    <div className="checkout-page container">
      {/* ── Header ─────────────────────────── */}
      <div className="checkout-header">
        <h1>Checkout</h1>
        <div className="breadcrumb">
          <Link to="/cart">Cart</Link>
          <ChevronRight size={14} />
          <span className={step === "form" ? "bc-active" : ""}>Your Details</span>
          <ChevronRight size={14} />
          <span className={step === "payment" ? "bc-active" : ""}>Payment</span>
        </div>
      </div>

      <div className="checkout-grid">
        {/* ── Left: Form ── */}
        <div className="checkout-form-col">
          <form onSubmit={handleContinueToPayment} noValidate>

            {/* ─ 1. Shipping Address ─ */}
            <section className="form-section">
              <h2 className="form-section-title">
                <span className="section-number">1</span>
                Shipping Address
              </h2>

              {/* Name row */}
              <div className="form-row">
                <div className={`form-group ${formErrors.firstName ? "has-error" : ""}`}>
                  <label htmlFor="co-firstName">First Name</label>
                  <input id="co-firstName" type="text" name="firstName"
                    placeholder="First name" value={formData.firstName} onChange={handleChange} />
                  {formErrors.firstName && <span className="field-error">{formErrors.firstName}</span>}
                </div>
                <div className={`form-group ${formErrors.lastName ? "has-error" : ""}`}>
                  <label htmlFor="co-lastName">Last Name</label>
                  <input id="co-lastName" type="text" name="lastName"
                    placeholder="Last name" value={formData.lastName} onChange={handleChange} />
                  {formErrors.lastName && <span className="field-error">{formErrors.lastName}</span>}
                </div>
              </div>

              {/* Country selector */}
              <div className="form-group" ref={countryDropRef}>
                <label>Country / Region</label>
                <div className="country-selector-wrap">
                  <button
                    type="button"
                    className="country-btn"
                    onClick={() => setShowCountryDrop((v) => !v)}
                    id="country-selector-btn"
                  >
                    <Globe size={15} />
                    <span className="country-flag">{selectedCountry.flag}</span>
                    <span className="country-name">{selectedCountry.name}</span>
                    <ChevronDown size={14} className="country-chevron" />
                  </button>
                  {showCountryDrop && (
                    <div className="country-dropdown">
                      <input
                        className="country-search"
                        placeholder="Search country…"
                        value={countrySearch}
                        onChange={(e) => setCountrySearch(e.target.value)}
                        autoFocus
                      />
                      <div className="country-list">
                        {filteredCountries.map((c) => (
                          <button
                            key={c.code}
                            type="button"
                            className={`country-item ${selectedCountry.code === c.code ? "active" : ""}`}
                            onClick={() => handleCountryChange(c)}
                          >
                            <span className="ci-flag">{c.flag}</span>
                            <span className="ci-name">{c.name}</span>
                            <span className="ci-currency">{c.currency}</span>
                          </button>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
                <p className="currency-notice">
                  Prices shown in <strong>{selectedCountry.currency}</strong>. Orders processed in INR.
                </p>
              </div>

              {/* Address lines */}
              <div className={`form-group ${formErrors.address ? "has-error" : ""}`}>
                <label htmlFor="co-address">Street Address</label>
                <input id="co-address" type="text" name="address"
                  placeholder="House/flat no., street, area"
                  value={formData.address} onChange={handleChange} />
                {formErrors.address && <span className="field-error">{formErrors.address}</span>}
              </div>
              <div className="form-group">
                <label htmlFor="co-apartment">Apartment / Suite (optional)</label>
                <input id="co-apartment" type="text" name="apartment"
                  placeholder="Apt, suite, floor, landmark…"
                  value={formData.apartment} onChange={handleChange} />
              </div>

              {/* City + State + Postcode */}
              <div className="form-row form-row-3">
                <div className={`form-group ${formErrors.city ? "has-error" : ""}`}>
                  <label htmlFor="co-city">City</label>
                  <input id="co-city" type="text" name="city"
                    placeholder="City" value={formData.city} onChange={handleChange} />
                  {formErrors.city && <span className="field-error">{formErrors.city}</span>}
                </div>

                {/* State: dropdown for countries with known states, text for others */}
                <div className={`form-group ${formErrors.state ? "has-error" : ""}`}>
                  <label htmlFor="co-state">
                    {isIndia ? "State" : "State / Province"}
                  </label>
                  {selectedCountry.states?.length > 0 ? (
                    <select
                      id="co-state"
                      name="state"
                      value={formData.state}
                      onChange={handleChange}
                      className="state-select"
                    >
                      <option value="">Select…</option>
                      {selectedCountry.states.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  ) : (
                    <input id="co-state" type="text" name="state"
                      placeholder="State / Province"
                      value={formData.state} onChange={handleChange} />
                  )}
                  {formErrors.state && <span className="field-error">{formErrors.state}</span>}
                </div>

                <div className={`form-group ${formErrors.pincode ? "has-error" : ""}`}>
                  <label htmlFor="co-pincode">
                    {isIndia ? "PIN Code" : "Postal / ZIP Code"}
                  </label>
                  <input id="co-pincode" type="text" name="pincode"
                    placeholder={isIndia ? "6-digit PIN" : "Postal code"}
                    value={formData.pincode} onChange={handleChange} />
                  {formErrors.pincode && <span className="field-error">{formErrors.pincode}</span>}
                </div>
              </div>

              {/* International shipping note */}
              {!isIndia && (
                <div className="intl-notice">
                  <Globe size={14} />
                  <span>
                    International orders are processed in INR (₹). Your bank may apply conversion charges.
                    Delivery timeline: 10–21 business days.
                  </span>
                </div>
              )}
            </section>

            {/* ─ 2. Contact Information ─ */}
            <section className="form-section">
              <h2 className="form-section-title">
                <span className="section-number">2</span>
                Contact Information
              </h2>

              <div className={`form-group ${formErrors.email ? "has-error" : ""}`}>
                <label htmlFor="co-email">Email Address</label>
                <input
                  id="co-email" type="email" name="email"
                  placeholder="you@example.com"
                  value={formData.email} onChange={handleChange}
                />
                {formErrors.email && <span className="field-error">{formErrors.email}</span>}
              </div>

              {/* Phone with Dial Code */}
              <div className={`form-group ${formErrors.phone ? "has-error" : ""}`}>
                <label htmlFor="co-phone">Phone Number</label>
                <div className="phone-input-wrap">
                  <div className="dial-picker" ref={dialDropRef}>
                    <button
                      type="button"
                      className="dial-btn"
                      onClick={() => setShowDialDrop((v) => !v)}
                      aria-label="Select dial code"
                    >
                      <span className="dial-flag">{selectedCountry.flag}</span>
                      <span className="dial-code">{dialCode}</span>
                      <ChevronDown size={13} />
                    </button>
                    {showDialDrop && (
                      <div className="dial-dropdown">
                        <input
                          className="dial-search"
                          placeholder="Search country…"
                          value={countrySearch}
                          onChange={(e) => setCountrySearch(e.target.value)}
                          autoFocus
                        />
                        <div className="dial-list">
                          {filteredCountries.map((c) => (
                            <button
                              key={c.code}
                              type="button"
                              className={`dial-item ${dialCode === c.dialCode && selectedCountry.code === c.code ? "active" : ""}`}
                              onClick={() => {
                                setDialCode(c.dialCode);
                                setShowDialDrop(false);
                                setCountrySearch("");
                              }}
                            >
                              <span>{c.flag}</span>
                              <span className="dial-item-name">{c.name}</span>
                              <span className="dial-item-code">{c.dialCode}</span>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>
                  <input
                    id="co-phone" type="tel" name="phone"
                    placeholder="Phone number"
                    value={formData.phone} onChange={handleChange}
                    className="phone-number-input"
                  />
                </div>
                {formErrors.phone && <span className="field-error">{formErrors.phone}</span>}
              </div>
            </section>

            <button type="submit" className="btn-continue" id="continue-to-payment-btn">
              <span>Continue to Payment</span>
              <ChevronRight size={18} />
            </button>
            <div className="secure-badge">
              <Lock size={13} /> 256-bit SSL encrypted &amp; secure checkout
            </div>
          </form>
        </div>

        {/* ── Right: Order Summary ── */}
        <div className="checkout-summary-col">
          <div className="order-summary">
            {/* Currency / Country tag */}
            <div className="summary-currency-tag">
              <span>{selectedCountry.flag} {selectedCountry.name}</span>
              <span className="summary-currency-badge">{currency}</span>
            </div>

            <h2>Order Summary</h2>
            <div className="summary-items">
              {cart.map((item) => (
                <div
                  key={item.cartItemId || `${item.id}-${item.selectedSize || ""}`}
                  className="summary-item"
                >
                  <div className="summary-item-img">
                    <img src={item.images?.[0] || item.image} alt={item.title}
                      onError={(e) => { e.target.src = "https://via.placeholder.com/60x80?text=SR"; }} />
                    <span className="summary-item-qty">{item.quantity}</span>
                  </div>
                  <div className="summary-item-info">
                    <h4 style={{ textTransform: "capitalize" }}>
                      {item.title?.replace(/"/g, "")}
                    </h4>
                    {item.selectedSize && (
                      <p className="size-tag">Size: {item.selectedSize}</p>
                    )}
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
              <div className="summary-row shipping-row">
                <span>Shipping</span>
                <span className="shipping-free">Free (Online)</span>
              </div>
              <div className="summary-row cod-note-row">
                <span className="cod-note">or +{formatPrice(COD_SHIPPING_INR)} for COD</span>
              </div>
              <div className="summary-row total-row">
                <span>Total</span>
                <span>{formatPrice(subtotal)}</span>
              </div>
            </div>

            <div className="checkout-trust">
              <div className="trust-item">
                <ShieldCheck size={18} />
                <div>
                  <h4>Authentic Handloom</h4>
                  <p>100% genuine handcrafted products</p>
                </div>
              </div>
              <div className="trust-item">
                <Truck size={18} />
                <div>
                  <h4>{isIndia ? "Pan-India Delivery" : "Worldwide Shipping"}</h4>
                  <p>{isIndia ? "Free shipping on online payments" : "Ships from India · 10–21 business days"}</p>
                </div>
              </div>
              <div className="trust-item">
                <Sparkles size={18} />
                <div>
                  <h4>SafedRang Quality Promise</h4>
                  <p>Every piece curated with care</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ══════════════════════════════════════════════
          PAYMENT SELECTION MODAL
      ══════════════════════════════════════════════ */}
      {step === "payment" && (
        <div className="payment-modal-overlay" onClick={() => setStep("form")}>
          <div
            className="payment-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog" aria-modal="true" aria-label="Select payment method"
          >
            <div className="modal-header">
              <div>
                <h2 className="modal-title">How would you like to pay?</h2>
                <p className="modal-subtitle">
                  {cart.length} item{cart.length !== 1 ? "s" : ""} ·{" "}
                  Subtotal {formatPrice(subtotal)} ·{" "}
                  {selectedCountry.flag} {selectedCountry.name}
                </p>
              </div>
              <button className="modal-close" onClick={() => setStep("form")} aria-label="Close">
                <X size={20} />
              </button>
            </div>

            <div className="payment-options">
              {/* Online */}
              <label
                className={`payment-card ${paymentMethod === "online" ? "selected" : ""}`}
                htmlFor="pay-online" id="pay-online-card"
              >
                <input type="radio" id="pay-online" name="paymentMethod" value="online"
                  checked={paymentMethod === "online"} onChange={() => setPaymentMethod("online")} />
                <div className="payment-card-icon online-icon">
                  <CreditCard size={24} />
                </div>
                <div className="payment-card-body">
                  <div className="payment-card-title">Pay Online</div>
                  <div className="payment-card-desc">
                    UPI · Cards · Netbanking via Cashfree
                  </div>
                  <div className="payment-card-badges">
                    <span className="badge badge-green">🎉 Free Shipping</span>
                    <span className="badge badge-blue">🔒 Secure</span>
                  </div>
                </div>
                <div className="payment-card-amount">
                  <div className="amount-label">You Pay</div>
                  <div className="amount-value">{formatPrice(subtotal)}</div>
                  <div className="amount-shipping">Shipping Free</div>
                </div>
                <div className="payment-card-check"><CheckCircle2 size={22} /></div>
              </label>

              {/* COD — India only */}
              {isIndia ? (
                <label
                  className={`payment-card ${paymentMethod === "cod" ? "selected" : ""}`}
                  htmlFor="pay-cod" id="pay-cod-card"
                >
                  <input type="radio" id="pay-cod" name="paymentMethod" value="cod"
                    checked={paymentMethod === "cod"} onChange={() => setPaymentMethod("cod")} />
                  <div className="payment-card-icon cod-icon">
                    <Banknote size={24} />
                  </div>
                  <div className="payment-card-body">
                    <div className="payment-card-title">Cash on Delivery</div>
                    <div className="payment-card-desc">Pay at your doorstep when delivered</div>
                    <div className="payment-card-badges">
                      <span className="badge badge-amber">+₹{COD_SHIPPING_INR} Handling Fee</span>
                    </div>
                  </div>
                  <div className="payment-card-amount">
                    <div className="amount-label">You Pay</div>
                    <div className="amount-value">{formatPrice(subtotal + COD_SHIPPING_INR)}</div>
                    <div className="amount-shipping">Incl. ₹{COD_SHIPPING_INR} COD fee</div>
                  </div>
                  <div className="payment-card-check"><CheckCircle2 size={22} /></div>
                </label>
              ) : (
                <div className="cod-unavailable">
                  <Banknote size={18} />
                  <span>Cash on Delivery is available for India only. Please pay online.</span>
                </div>
              )}
            </div>

            {paymentMethod && (
              <div className="modal-total-banner">
                <span>
                  {paymentMethod === "online"
                    ? "✨ Free shipping — Pay online"
                    : "📦 Cash on Delivery — Pay at doorstep"}
                </span>
                <strong>
                  Total:{" "}
                  {formatPrice(paymentMethod === "cod" ? subtotal + COD_SHIPPING_INR : subtotal)}
                </strong>
              </div>
            )}

            {error && (
              <div className="modal-error">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <button
              className="btn-pay-now"
              onClick={handlePaymentConfirm}
              disabled={!paymentMethod || loading}
              id="confirm-payment-btn"
            >
              {loading ? (
                <span className="btn-loading">
                  <span className="loader-dot" />
                  <span className="loader-dot" />
                  <span className="loader-dot" />
                  Processing…
                </span>
              ) : paymentMethod === "online" ? (
                <><Lock size={16} /> Pay {formatPrice(subtotal)} Securely</>
              ) : paymentMethod === "cod" ? (
                <><Package size={16} /> Place COD Order · {formatPrice(subtotal + COD_SHIPPING_INR)}</>
              ) : (
                "Select a Payment Method to Continue"
              )}
            </button>

            <p className="modal-footnote">
              <Lock size={12} /> Your personal &amp; payment information is encrypted and secure.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
