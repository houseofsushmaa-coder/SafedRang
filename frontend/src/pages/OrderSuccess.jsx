import { useEffect, useState } from "react";
import { useSearchParams, Link } from "react-router-dom";
import {
  CheckCircle2, Package, Truck, Phone, Mail,
  ShoppingBag, User, Sparkles, ArrowRight, Star,
} from "lucide-react";
import { trackEvent } from "../lib/tracking";

export default function OrderSuccess() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id");
  const method = searchParams.get("method");       // "cod" | "online"
  const email = searchParams.get("email") || "";
  const isNewAccount = searchParams.get("new_account") === "1";

  const isCOD = method === "cod";

  // Confetti / entrance animation + Purchase tracking
  const [visible, setVisible] = useState(false);
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 80);
    if (orderId) {
      trackEvent("purchase", { orderId, method, currency: "INR" });
    }
    return () => clearTimeout(t);
  }, [orderId, method]);

  return (
    <div
      style={{
        minHeight: "80vh",
        background: "linear-gradient(160deg, #FAF5EC 0%, #F5EDE0 60%, #FFFFFF 100%)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 20px 80px",
        textAlign: "center",
      }}
    >
      {/* ── Success Icon ────────────────────────────────────── */}
      <div
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "scale(1) translateY(0)" : "scale(0.7) translateY(20px)",
          transition: "opacity 0.55s cubic-bezier(0.16,1,0.3,1), transform 0.55s cubic-bezier(0.16,1,0.3,1)",
          width: 90,
          height: 90,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #e8f5e9, #c8e6c9)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 28,
          boxShadow: "0 12px 32px rgba(46,125,50,0.18)",
        }}
      >
        <CheckCircle2 size={44} color="#2e7d32" strokeWidth={1.8} />
      </div>

      {/* ── Headline ─────────────────────────────────────────── */}
      <div
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(16px)",
          transition: "opacity 0.55s 0.1s ease, transform 0.55s 0.1s ease",
        }}
      >
        <p
          style={{
            fontFamily: "Manrope, sans-serif",
            fontSize: "0.72rem",
            fontWeight: 700,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "var(--color-antique-gold, #AE8A54)",
            marginBottom: 10,
          }}
        >
          ✦ SAFED RANG · LUCKNOW
        </p>
        <h1
          style={{
            fontFamily: "Cormorant Garamond, serif",
            fontSize: "clamp(2rem, 5vw, 2.8rem)",
            fontWeight: 500,
            color: "var(--color-dark-charcoal, #2A211D)",
            marginBottom: 12,
            lineHeight: 1.15,
          }}
        >
          {isCOD ? "Your Order Is Confirmed" : "Thank You for Your Order"}
        </h1>
        <p
          style={{
            fontSize: "0.95rem",
            color: "var(--color-warm-taupe, #8B7863)",
            maxWidth: 460,
            margin: "0 auto 20px",
            lineHeight: 1.7,
          }}
        >
          {isCOD
            ? "Your Cash on Delivery order has been confirmed. Our artisans will begin preparing your piece shortly."
            : "Your payment was successful and your order is now in our hands. Expect something beautiful."}
        </p>

        {/* Order ID pill */}
        {orderId && (
          <div
            style={{
              display: "inline-flex",
              alignItems: "center",
              gap: 8,
              background: "#fff",
              border: "1px solid #EADFCF",
              borderRadius: 999,
              padding: "8px 20px",
              marginBottom: 36,
              fontSize: "0.82rem",
            }}
          >
            <Package size={14} style={{ color: "#AE8A54" }} />
            <span style={{ color: "#8B7863" }}>Order ID:</span>
            <strong style={{ color: "#2A211D", fontFamily: "monospace" }}>
              {orderId.slice(0, 20)}…
            </strong>
          </div>
        )}
      </div>

      {/* ── New Account Banner ────────────────────────────────── */}
      {isNewAccount && email && (
        <div
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.6s 0.25s ease, transform 0.6s 0.25s ease",
            maxWidth: 520,
            width: "100%",
            marginBottom: 28,
            background: "linear-gradient(135deg, #2A211D 0%, #3D2F27 100%)",
            borderRadius: 16,
            padding: "24px 28px",
            textAlign: "left",
            color: "#fff",
            position: "relative",
            overflow: "hidden",
            boxShadow: "0 16px 40px rgba(42,33,29,0.22)",
          }}
        >
          {/* decorative element */}
          <div
            style={{
              position: "absolute",
              top: -30,
              right: -30,
              width: 120,
              height: 120,
              borderRadius: "50%",
              background: "rgba(174,138,84,0.12)",
            }}
          />
          <div style={{ display: "flex", alignItems: "flex-start", gap: 14, position: "relative" }}>
            <div
              style={{
                width: 42,
                height: 42,
                borderRadius: "50%",
                background: "rgba(174,138,84,0.2)",
                border: "1px solid rgba(174,138,84,0.4)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <Sparkles size={18} style={{ color: "#AE8A54" }} />
            </div>
            <div>
              <h3
                style={{
                  fontFamily: "Cormorant Garamond, serif",
                  fontSize: "1.15rem",
                  fontWeight: 500,
                  color: "#fff",
                  marginBottom: 6,
                }}
              >
                Your Patron Account Is Ready
              </h3>
              <p style={{ fontSize: "0.83rem", color: "rgba(255,255,255,0.75)", lineHeight: 1.65, marginBottom: 14 }}>
                We've created a <strong style={{ color: "#AE8A54" }}>Safed Rang Patron Account</strong> for{" "}
                <strong style={{ color: "#E8DFD0" }}>{email}</strong>. Check your inbox — we've sent a{" "}
                <strong style={{ color: "#AE8A54" }}>magic sign-in link</strong> so you can access your orders, track
                delivery, and manage your account — no password needed.
              </p>
              <div style={{ display: "flex", alignItems: "center", gap: 8, fontSize: "0.78rem", color: "rgba(255,255,255,0.6)" }}>
                <Mail size={13} />
                Check your inbox (or spam) for the sign-in link from Safed Rang
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Existing User: Account CTA ───────────────────────── */}
      {!isNewAccount && email && (
        <div
          style={{
            opacity: visible ? 1 : 0,
            transition: "opacity 0.6s 0.25s ease",
            maxWidth: 520,
            width: "100%",
            marginBottom: 28,
            background: "#fff",
            border: "1px solid #EADFCF",
            borderRadius: 14,
            padding: "18px 22px",
            textAlign: "left",
            display: "flex",
            alignItems: "center",
            gap: 14,
          }}
        >
          <div
            style={{
              width: 40,
              height: 40,
              borderRadius: "50%",
              background: "#FAF5EC",
              border: "1px solid #EADFCF",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <User size={18} style={{ color: "#AE8A54" }} />
          </div>
          <div>
            <p style={{ fontSize: "0.85rem", fontWeight: 600, color: "#2A211D", marginBottom: 3 }}>
              View & track your order anytime
            </p>
            <p style={{ fontSize: "0.78rem", color: "#8B7863" }}>
              Sign in to your Patron account to see delivery updates, past orders, and saved pieces.
            </p>
          </div>
        </div>
      )}

      {/* ── Info Cards (COD) ─────────────────────────────────── */}
      {isCOD && (
        <div
          style={{
            opacity: visible ? 1 : 0,
            transform: visible ? "translateY(0)" : "translateY(20px)",
            transition: "opacity 0.6s 0.35s ease, transform 0.6s 0.35s ease",
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            justifyContent: "center",
            marginBottom: 32,
            maxWidth: 540,
          }}
        >
          {[
            { icon: <Package size={16} />, text: "Order prepared within 1–2 business days" },
            { icon: <Truck size={16} />, text: "Delivered in 5–7 business days" },
            { icon: <Phone size={16} />, text: "Our team may call to confirm your address" },
            { icon: <Star size={16} />, text: "Payment collected at your doorstep" },
          ].map(({ icon, text }, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "#fff",
                border: "1px solid #EADFCF",
                borderRadius: 10,
                padding: "10px 16px",
                fontSize: "0.8rem",
                color: "#2A211D",
                flex: "1 1 200px",
                minWidth: 180,
                textAlign: "left",
              }}
            >
              <span style={{ color: "#AE8A54", flexShrink: 0 }}>{icon}</span>
              {text}
            </div>
          ))}
        </div>
      )}

      {/* ── Online payment info ──────────────────────────────── */}
      {!isCOD && (
        <div
          style={{
            opacity: visible ? 1 : 0,
            transition: "opacity 0.6s 0.35s ease",
            display: "flex",
            flexWrap: "wrap",
            gap: 12,
            justifyContent: "center",
            marginBottom: 32,
            maxWidth: 540,
          }}
        >
          {[
            { icon: <CheckCircle2 size={16} />, text: "Payment confirmed & secured" },
            { icon: <Package size={16} />, text: "Atelier inspection underway" },
            { icon: <Truck size={16} />, text: "Delivery in 5–7 business days" },
            { icon: <Mail size={16} />, text: "Confirmation email on its way" },
          ].map(({ icon, text }, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 10,
                background: "#fff",
                border: "1px solid #EADFCF",
                borderRadius: 10,
                padding: "10px 16px",
                fontSize: "0.8rem",
                color: "#2A211D",
                flex: "1 1 200px",
                minWidth: 180,
                textAlign: "left",
              }}
            >
              <span style={{ color: "#AE8A54", flexShrink: 0 }}>{icon}</span>
              {text}
            </div>
          ))}
        </div>
      )}

      {/* ── CTA Buttons ──────────────────────────────────────── */}
      <div
        style={{
          opacity: visible ? 1 : 0,
          transform: visible ? "translateY(0)" : "translateY(12px)",
          transition: "opacity 0.6s 0.45s ease, transform 0.6s 0.45s ease",
          display: "flex",
          gap: 12,
          flexWrap: "wrap",
          justifyContent: "center",
        }}
      >
        <Link
          to="/account/orders"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "13px 28px",
            background: "var(--color-dark-charcoal, #2A211D)",
            color: "#fff",
            fontFamily: "Manrope, sans-serif",
            fontWeight: 600,
            fontSize: "0.85rem",
            letterSpacing: "0.08em",
            textDecoration: "none",
            borderRadius: 4,
            transition: "background 0.2s ease",
          }}
        >
          <User size={15} />
          View My Orders
          <ArrowRight size={14} />
        </Link>
        <Link
          to="/shop"
          style={{
            display: "inline-flex",
            alignItems: "center",
            gap: 8,
            padding: "13px 28px",
            background: "transparent",
            border: "1.5px solid var(--color-soft-blush, #E8DFD0)",
            color: "var(--color-dark-charcoal, #2A211D)",
            fontFamily: "Manrope, sans-serif",
            fontWeight: 600,
            fontSize: "0.85rem",
            textDecoration: "none",
            borderRadius: 4,
          }}
        >
          <ShoppingBag size={15} />
          Continue Shopping
        </Link>
      </div>

      {/* ── Sign-in nudge (if new account) ──────────────────── */}
      {isNewAccount && (
        <p
          style={{
            marginTop: 28,
            fontSize: "0.78rem",
            color: "#8B7863",
            opacity: visible ? 1 : 0,
            transition: "opacity 0.6s 0.6s ease",
          }}
        >
          Already received the magic link?{" "}
          <Link
            to="/login"
            style={{ color: "var(--color-antique-gold, #AE8A54)", fontWeight: 600, textDecoration: "underline" }}
          >
            Sign in to your account →
          </Link>
        </p>
      )}
    </div>
  );
}
