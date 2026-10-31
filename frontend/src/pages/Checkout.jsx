import { useState, useEffect, useRef } from "react";
import { Link, useNavigate } from "react-router-dom";
import { load } from "@cashfreepayments/cashfree-js";
import { useCart } from "../context/CartContext";
import { useCurrency } from "../context/CurrencyContext";
import { useAuth } from "../context/AuthContext";
import {
  ChevronRight, ShieldCheck, Lock, AlertCircle, Truck,
  CreditCard, Banknote, X, CheckCircle2, Package, Sparkles,
  Globe, ChevronDown, Minus, Plus, Trash2,
} from "lucide-react";
import { supabase } from "../lib/supabase";
import { COUNTRIES, COUNTRY_MAP } from "../data/countries";
import { trackEvent, toAnalyticsItem } from "../lib/tracking";
import "./Checkout.css";

const CF_ENV = import.meta.env.VITE_CASHFREE_ENV || "SANDBOX";
const DEFAULT_COD_FEE_INR = 39;       // Fallback only — Admin → Settings → Shipping is the source of truth
const DEFAULT_COUNTRY = COUNTRY_MAP["IN"]; // India default
const FORM_STORAGE_KEY = "sr_checkout_details";

const EMPTY_FORM = {
  email: "", firstName: "", lastName: "", address: "", apartment: "",
  city: "", state: "", pincode: "", phone: "",
};

// Keeps shopper details for this tab only, so a failed payment or a trip back
// to the shop doesn't wipe the form.
const loadSavedForm = () => {
  try {
    return JSON.parse(sessionStorage.getItem(FORM_STORAGE_KEY) || "null");
  } catch {
    return null;
  }
};

const cartToAnalyticsItems = (lines) =>
  lines.map((l) => toAnalyticsItem(l, { price: l.unitPrice, quantity: l.quantity, variant: l.selectedSize }));

export default function Checkout() {
  const {
    cartLines, cartSubtotal, cartCount, hasUnavailableItems,
    clearCart, updateQuantity, removeFromCart,
  } = useCart();
  const { formatPrice, changeCurrency, currency } = useCurrency();
  const { user } = useAuth();
  const navigate = useNavigate();

  const [saved] = useState(loadSavedForm);

  useEffect(() => {
    window.scrollTo({ top: 0, left: 0, behavior: "instant" });
  }, []);

  // begin_checkout once per visit, with the bag's real value.
  const beganCheckout = useRef(false);
  useEffect(() => {
    if (beganCheckout.current || cartLines.length === 0) return;
    beganCheckout.current = true;
    trackEvent("begin_checkout", { value: cartSubtotal, items: cartToAnalyticsItems(cartLines) });
  }, [cartLines, cartSubtotal]);

  // ── COD rules (admin-controlled) ────────────────────
  const [codRules, setCodRules] = useState({ enabled: true, fee: DEFAULT_COD_FEE_INR });
  useEffect(() => {
    supabase
      .from("settings")
      .select("key, value")
      .eq("group", "shipping")
      .in("key", ["cod_charge", "cod_enabled"])
      .then(({ data }) => {
        if (!data) return;
        const byKey = Object.fromEntries(
          data.map((r) => [r.key, typeof r.value === "string" ? JSON.parse(r.value) : r.value])
        );
        const fee = Number(byKey.cod_charge?.amount);
        setCodRules({
          enabled: byKey.cod_enabled?.enabled !== false,
          fee: Number.isFinite(fee) && fee >= 0 ? fee : DEFAULT_COD_FEE_INR,
        });
      });
  }, []);
  const codFee = codRules.fee;

  // ── Country / dial-code state ───────────────────────
  const initialCountry = COUNTRY_MAP[saved?.countryCode] || DEFAULT_COUNTRY;
  const [selectedCountry, setSelectedCountry] = useState(initialCountry);
  const [dialCode, setDialCode] = useState(saved?.dialCode || initialCountry.dialCode);
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
  const [formData, setFormData] = useState(() => ({
    ...EMPTY_FORM,
    email: user?.email || "",
    firstName: user?.user_metadata?.full_name?.split(" ")[0] || "",
    lastName: user?.user_metadata?.full_name?.split(" ").slice(1).join(" ") || "",
    ...(saved?.form || {}),
  }));

  useEffect(() => {
    try {
      sessionStorage.setItem(
        FORM_STORAGE_KEY,
        JSON.stringify({ form: formData, countryCode: selectedCountry.code, dialCode })
      );
    } catch {}
  }, [formData, selectedCountry, dialCode]);

  const [step, setStep] = useState("form");
  // Mobile: the bag summary sits above the form, collapsed to one line.
  const [mobileSummaryOpen, setMobileSummaryOpen] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [formErrors, setFormErrors] = useState({});

  const isIndia = selectedCountry.code === "IN";

  // ── Validation ──────────────────────────────────────
  const validateField = (name, data = formData) => {
    const v = (data[name] || "").trim();
    switch (name) {
      case "email":
        if (!v) return "Email is required";
        return /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/.test(v) ? "" : "Please enter a valid email address";
      case "firstName": return v ? "" : "First name is required";
      case "lastName": return v ? "" : "Last name is required";
      case "address": return v ? "" : "Address is required";
      case "city": return v ? "" : "City is required";
      case "state": return v ? "" : "State / Province is required";
      case "pincode":
        if (!v) return isIndia ? "PIN code is required" : "Postal / ZIP code is required";
        return isIndia && !/^[1-9]\d{5}$/.test(v) ? "Please enter a valid 6-digit PIN code" : "";
      case "phone": {
        const digits = v.replace(/\D/g, "");
        if (!digits) return "Phone number is required";
        if (isIndia && dialCode === "+91") {
          return /^[6-9]\d{9}$/.test(digits.replace(/^0/, ""))
            ? "" : "Please enter a 10-digit mobile number";
        }
        return digits.length >= 6 && digits.length <= 15 ? "" : "Enter a valid phone number";
      }
      default: return "";
    }
  };

  const validateForm = () => {
    const errors = {};
    ["firstName", "lastName", "address", "city", "state", "pincode", "email", "phone"].forEach((f) => {
      const msg = validateField(f);
      if (msg) errors[f] = msg;
    });
    return errors;
  };

  const handleChange = (e) => {
    setFormData((prev) => ({ ...prev, [e.target.name]: e.target.value }));
    if (formErrors[e.target.name]) {
      setFormErrors((prev) => ({ ...prev, [e.target.name]: "" }));
    }
  };

  // Inline validation once the shopper leaves a field they've typed in.
  const handleBlur = (e) => {
    const { name, value } = e.target;
    if (!value) return;
    const msg = validateField(name, { ...formData, [name]: value });
    setFormErrors((prev) => ({ ...prev, [name]: msg }));
  };

  const handleContinueToPayment = (e) => {
    e.preventDefault();
    const errors = validateForm();
    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      // Scroll to first error
      setTimeout(() => {
        document.querySelector(".has-error input, .has-error select")?.scrollIntoView({ behavior: "smooth", block: "center" });
      }, 0);
      return;
    }
    trackEvent("add_shipping_info", {
      value: cartSubtotal,
      items: cartToAnalyticsItems(cartLines),
      shipping_tier: isIndia ? "India" : "International",
    });
    setStep("payment");
    setPaymentMethod(null);
    setError("");
  };

  // Full phone number = dialCode + local number
  const localPhone = formData.phone.replace(/\D/g, "").replace(/^0/, "");
  const fullPhone = `${dialCode}${localPhone}`;
  const customerName = `${formData.firstName} ${formData.lastName}`.trim();

  const customerDetails = {
    name: customerName,
    email: formData.email.trim(),
    phone: fullPhone,
    address: {
      address: formData.address,
      apartment: formData.apartment || "",
      city: formData.city,
      state: formData.state,
      pincode: formData.pincode.trim(),
      country: selectedCountry.name,
      country_code: selectedCountry.code,
    },
  };
  const orderLines = cartLines.map((l) => ({
    productId: l.id,
    quantity: l.quantity,
    selectedSize: l.selectedSize || null,
  }));

  // Edge-function errors carry a shopper-readable message in the JSON body.
  const readFunctionError = async (fnError, data) => {
    if (data?.error) return data.error;
    try {
      const body = await fnError?.context?.json?.();
      if (body?.error) return body.error;
    } catch {}
    return "We couldn't place your order. Please try again.";
  };

  // ── Online Payment via Cashfree ─────────────────────
  const handleOnlinePayment = async () => {
    setError("");
    setLoading(true);
    try {
      // The server prices the order from the catalogue — no amount is sent.
      const { data: edgeData, error: edgeError } =
        await supabase.functions.invoke("cashfree-order", {
          body: {
            orderDetails: { items: orderLines },
            customerDetails,
            currencySelected: currency,
          },
        });

      if (edgeError || edgeData?.error) {
        throw new Error(await readFunctionError(edgeError, edgeData));
      }

      const { payment_session_id } = edgeData;
      if (!payment_session_id)
        throw new Error("We couldn't start the payment. Please try again.");

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
      const { data, error: fnError } = await supabase.functions.invoke("place-cod-order", {
        body: { items: orderLines, customerDetails, currencySelected: currency },
      });
      if (fnError || data?.error || !data?.order_id) {
        throw new Error(await readFunctionError(fnError, data));
      }

      // The order now exists server-side — this is a confirmed COD purchase.
      trackEvent("purchase", {
        transaction_id: data.order_id,
        value: Number(data.total),
        shipping: codFee,
        payment_type: "COD",
        items: (data.items || []).map((i) =>
          toAnalyticsItem({ id: i.productId, title: i.title }, { price: i.price, quantity: i.quantity, variant: i.selectedSize })
        ),
      });

      clearCart();
      try { sessionStorage.removeItem(FORM_STORAGE_KEY); } catch {}
      const params = new URLSearchParams({ order_id: data.order_id, method: "cod" });
      if (data.isNewUser) params.set("new_account", "1");
      navigate(`/order-success?${params.toString()}`);
    } catch (err) {
      console.error("COD order failed:", err);
      setError(err.message || "Order placement failed. Please try again.");
      setLoading(false);
    }
  };

  const handlePaymentConfirm = () => {
    trackEvent("add_payment_info", {
      value: paymentMethod === "cod" ? cartSubtotal + codFee : cartSubtotal,
      payment_type: paymentMethod === "cod" ? "COD" : "Online",
      items: cartToAnalyticsItems(cartLines),
    });
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

  const codAvailable = isIndia && codRules.enabled;

  const fieldProps = (name) => ({
    name,
    value: formData[name],
    onChange: handleChange,
    onBlur: handleBlur,
    "aria-invalid": Boolean(formErrors[name]),
    "aria-describedby": formErrors[name] ? `co-${name}-error` : undefined,
  });
  const fieldError = (name) =>
    formErrors[name] && <span className="field-error" id={`co-${name}-error`} role="alert">{formErrors[name]}</span>;

  return (
    <div className="checkout-page container">
      {/* ── Header ─────────────────────────── */}
      <div className="checkout-header">
        <h1>Checkout</h1>
        <div className="breadcrumb">
          <Link to="/shop">Continue Shopping</Link>
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
                  <input id="co-firstName" type="text" autoComplete="given-name"
                    placeholder="First name" {...fieldProps("firstName")} />
                  {fieldError("firstName")}
                </div>
                <div className={`form-group ${formErrors.lastName ? "has-error" : ""}`}>
                  <label htmlFor="co-lastName">Last Name</label>
                  <input id="co-lastName" type="text" autoComplete="family-name"
                    placeholder="Last name" {...fieldProps("lastName")} />
                  {fieldError("lastName")}
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
                <input id="co-address" type="text" autoComplete="address-line1"
                  placeholder="House/flat no., street, area" {...fieldProps("address")} />
                {fieldError("address")}
              </div>
              <div className="form-group">
                <label htmlFor="co-apartment">Apartment / Suite (optional)</label>
                <input id="co-apartment" type="text" name="apartment" autoComplete="address-line2"
                  placeholder="Apt, suite, floor, landmark…"
                  value={formData.apartment} onChange={handleChange} />
              </div>

              {/* City + State + Postcode */}
              <div className="form-row form-row-3">
                <div className={`form-group ${formErrors.city ? "has-error" : ""}`}>
                  <label htmlFor="co-city">City</label>
                  <input id="co-city" type="text" autoComplete="address-level2"
                    placeholder="City" {...fieldProps("city")} />
                  {fieldError("city")}
                </div>

                {/* State: dropdown for countries with known states, text for others */}
                <div className={`form-group ${formErrors.state ? "has-error" : ""}`}>
                  <label htmlFor="co-state">
                    {isIndia ? "State" : "State / Province"}
                  </label>
                  {selectedCountry.states?.length > 0 ? (
                    <select
                      id="co-state"
                      className="state-select"
                      autoComplete="address-level1"
                      {...fieldProps("state")}
                    >
                      <option value="">Select…</option>
                      {selectedCountry.states.map((s) => (
                        <option key={s} value={s}>{s}</option>
                      ))}
                    </select>
                  ) : (
                    <input id="co-state" type="text" autoComplete="address-level1"
                      placeholder="State / Province" {...fieldProps("state")} />
                  )}
                  {fieldError("state")}
                </div>

                <div className={`form-group ${formErrors.pincode ? "has-error" : ""}`}>
                  <label htmlFor="co-pincode">
                    {isIndia ? "PIN Code" : "Postal / ZIP Code"}
                  </label>
                  <input id="co-pincode" type="text" autoComplete="postal-code"
                    inputMode={isIndia ? "numeric" : "text"} maxLength={isIndia ? 6 : 12}
                    placeholder={isIndia ? "6-digit PIN" : "Postal code"} {...fieldProps("pincode")} />
                  {fieldError("pincode")}
                </div>
              </div>

              {/* International shipping note */}
              {!isIndia && (
                <div className="intl-notice">
                  <Globe size={14} />
                  <span>
                    International orders are processed in INR (₹). Your bank may apply conversion charges.
                    Delivery timeline: 7–12 business days after dispatch.
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
                  id="co-email" type="email" autoComplete="email" inputMode="email"
                  placeholder="you@example.com" {...fieldProps("email")}
                />
                {fieldError("email")}
                {!user && (
                  <p className="currency-notice">
                    No account needed — we'll email you a secure link to view your order.
                  </p>
                )}
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
                    id="co-phone" type="tel" autoComplete="tel-national" inputMode="tel"
                    placeholder={isIndia ? "10-digit mobile number" : "Phone number"}
                    className="phone-number-input" {...fieldProps("phone")}
                  />
                </div>
                {fieldError("phone")}
                <p className="currency-notice">Used only for delivery updates from our courier.</p>
              </div>
            </section>

            {hasUnavailableItems && (
              <div className="modal-error" role="alert" style={{ marginBottom: 16 }}>
                <AlertCircle size={16} />
                <span>Some pieces in your bag are no longer available in the quantity selected. Please update your bag to continue.</span>
              </div>
            )}

            <button type="submit" className="btn-continue" id="continue-to-payment-btn" disabled={hasUnavailableItems}>
              <span>Continue to Payment</span>
              <ChevronRight size={18} />
            </button>
            <div className="secure-badge">
              <Lock size={13} /> Secure checkout · Payments processed by Cashfree
            </div>
          </form>
        </div>

        {/* ── Right: Order Summary ── */}
        <div className={`checkout-summary-col ${mobileSummaryOpen ? "is-open" : ""}`}>
          <div className="order-summary">
            <button
              type="button"
              className="mobile-summary-toggle"
              aria-expanded={mobileSummaryOpen}
              onClick={() => setMobileSummaryOpen((v) => !v)}
            >
              <span>
                {mobileSummaryOpen ? "Hide" : "Review"} your bag ({cartCount})
                <ChevronDown size={14} className={mobileSummaryOpen ? "is-flipped" : ""} />
              </span>
              <strong>{formatPrice(cartSubtotal)}</strong>
            </button>
            {/* Currency / Country tag */}
            <div className="summary-currency-tag">
              <span>{selectedCountry.flag} {selectedCountry.name}</span>
              <span className="summary-currency-badge">{currency}</span>
            </div>

            <h2>Your Bag ({cartCount})</h2>
            <div className="summary-items">
              {cartLines.map((item) => {
                const lineId = item.cartItemId || item.id;
                const atMax = item.quantity >= item.available;
                return (
                  <div key={lineId} className={`summary-item ${item.purchasable ? "" : "summary-item-unavailable"}`}>
                    <Link to={`/product/${item.id}`} className="summary-item-img">
                      <img src={item.images?.[0] || item.image} alt={item.title}
                        onError={(e) => { e.currentTarget.src = "/logo.png"; }} />
                      <span className="summary-item-qty">{item.quantity}</span>
                    </Link>
                    <div className="summary-item-info">
                      <h4 style={{ textTransform: "capitalize" }}>
                        <Link to={`/product/${item.id}`}>{item.title?.replace(/"/g, "")}</Link>
                      </h4>
                      {item.selectedSize && (
                        <p className="size-tag">Size: {item.selectedSize}</p>
                      )}
                      {item.fabric && <p>{item.fabric}</p>}
                      {!item.purchasable && (
                        <p className="summary-item-warning">
                          {item.available > 0 ? `Only ${item.available} available` : "No longer available"}
                        </p>
                      )}
                      <div className="summary-qty-controls">
                        <button type="button" aria-label={`Decrease quantity of ${item.title}`}
                          disabled={item.quantity <= 1}
                          onClick={() => updateQuantity(lineId, item.quantity - 1)}>
                          <Minus size={12} />
                        </button>
                        <span aria-live="polite">{item.quantity}</span>
                        <button type="button" aria-label={`Increase quantity of ${item.title}`}
                          disabled={atMax}
                          title={atMax ? "No more available" : undefined}
                          onClick={() => updateQuantity(lineId, item.quantity + 1)}>
                          <Plus size={12} />
                        </button>
                        <button type="button" className="summary-remove-btn"
                          aria-label={`Remove ${item.title} from bag`}
                          onClick={() => removeFromCart(lineId)}>
                          <Trash2 size={13} /> Remove
                        </button>
                      </div>
                    </div>
                    <div className="summary-item-price">
                      {formatPrice(item.unitPrice * item.quantity)}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="summary-totals">
              <div className="summary-row">
                <span>Subtotal</span>
                <span>{formatPrice(cartSubtotal)}</span>
              </div>
              <div className="summary-row shipping-row">
                <span>Shipping</span>
                <span className="shipping-free">Free with online payment</span>
              </div>
              {codAvailable && (
                <div className="summary-row cod-note-row">
                  <span className="cod-note">Cash on Delivery adds a {formatPrice(codFee)} handling fee</span>
                </div>
              )}
              <div className="summary-row total-row">
                <span>Total</span>
                <span>{formatPrice(cartSubtotal)}</span>
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
                  <p>{isIndia ? "Free shipping on online payments" : "Ships from Lucknow · 7–12 business days"}</p>
                </div>
              </div>
              <div className="trust-item">
                <Sparkles size={18} />
                <div>
                  <h4>Questions before you order?</h4>
                  <p>
                    <a href="https://wa.me/919151566602?text=Hello%2C%20I%20have%20a%20question%20about%20my%20order."
                      target="_blank" rel="noopener noreferrer">Chat with us on WhatsApp</a>
                  </p>
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
        <div className="payment-modal-overlay" onClick={() => !loading && setStep("form")}>
          <div
            className="payment-modal"
            onClick={(e) => e.stopPropagation()}
            role="dialog" aria-modal="true" aria-label="Select payment method"
          >
            <div className="modal-header">
              <div>
                <h2 className="modal-title">How would you like to pay?</h2>
                <p className="modal-subtitle">
                  {cartCount} item{cartCount !== 1 ? "s" : ""} ·{" "}
                  Subtotal {formatPrice(cartSubtotal)} ·{" "}
                  {selectedCountry.flag} {selectedCountry.name}
                </p>
              </div>
              <button className="modal-close" onClick={() => setStep("form")} aria-label="Close" disabled={loading}>
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
                    <span className="badge badge-green">Free Shipping</span>
                    <span className="badge badge-blue">Secure</span>
                  </div>
                </div>
                <div className="payment-card-amount">
                  <div className="amount-label">You Pay</div>
                  <div className="amount-value">{formatPrice(cartSubtotal)}</div>
                  <div className="amount-shipping">Shipping Free</div>
                </div>
                <div className="payment-card-check"><CheckCircle2 size={22} /></div>
              </label>

              {/* COD — India only, when enabled in admin settings */}
              {codAvailable ? (
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
                      <span className="badge badge-amber">+{formatPrice(codFee)} Handling Fee</span>
                    </div>
                  </div>
                  <div className="payment-card-amount">
                    <div className="amount-label">You Pay</div>
                    <div className="amount-value">{formatPrice(cartSubtotal + codFee)}</div>
                    <div className="amount-shipping">Incl. {formatPrice(codFee)} COD fee</div>
                  </div>
                  <div className="payment-card-check"><CheckCircle2 size={22} /></div>
                </label>
              ) : (
                <div className="cod-unavailable">
                  <Banknote size={18} />
                  <span>
                    {isIndia
                      ? "Cash on Delivery is currently unavailable. Please pay online."
                      : "Cash on Delivery is available for India only. Please pay online."}
                  </span>
                </div>
              )}
            </div>

            {paymentMethod && (
              <div className="modal-total-banner">
                <span>
                  {paymentMethod === "online"
                    ? "Free shipping — Pay online"
                    : "Cash on Delivery — Pay at doorstep"}
                </span>
                <strong>
                  Total:{" "}
                  {formatPrice(paymentMethod === "cod" ? cartSubtotal + codFee : cartSubtotal)}
                </strong>
              </div>
            )}

            {error && (
              <div className="modal-error" role="alert">
                <AlertCircle size={16} />
                <span>{error}</span>
              </div>
            )}

            <button
              className="btn-pay-now"
              onClick={handlePaymentConfirm}
              disabled={!paymentMethod || loading || hasUnavailableItems}
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
                <><Lock size={16} /> Pay {formatPrice(cartSubtotal)} Securely</>
              ) : paymentMethod === "cod" ? (
                <><Package size={16} /> Place COD Order · {formatPrice(cartSubtotal + codFee)}</>
              ) : (
                "Select a Payment Method to Continue"
              )}
            </button>

            <p className="modal-footnote">
              <Lock size={12} /> Card and UPI details are entered on Cashfree's secure page — we never see or store them.
            </p>
          </div>
        </div>
      )}
    </div>
  );
}
