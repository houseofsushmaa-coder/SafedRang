import { useSearchParams, Link } from "react-router-dom";
import { CheckCircle2, Package, Truck, Phone } from "lucide-react";

export default function OrderSuccess() {
  const [searchParams] = useSearchParams();
  const orderId = searchParams.get("order_id");
  const method = searchParams.get("method"); // "cod" or undefined (online)

  const isCOD = method === "cod";

  return (
    <div
      style={{
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "60px 20px",
        textAlign: "center",
      }}
    >
      {/* Icon */}
      <div
        style={{
          width: 80,
          height: 80,
          borderRadius: "50%",
          background: "linear-gradient(135deg, #e8f5e9, #c8e6c9)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          marginBottom: 24,
          boxShadow: "0 8px 24px rgba(46, 125, 50, 0.15)",
        }}
      >
        <CheckCircle2 size={40} color="#2e7d32" />
      </div>

      <h1
        style={{
          fontSize: "2rem",
          fontWeight: 700,
          color: "var(--color-dark-charcoal)",
          marginBottom: 12,
          letterSpacing: "-0.02em",
        }}
      >
        Order Placed Successfully!
      </h1>

      <p
        style={{
          fontSize: "1rem",
          color: "var(--color-warm-taupe)",
          marginBottom: 8,
          maxWidth: 420,
        }}
      >
        {isCOD
          ? "Your Cash on Delivery order has been confirmed. We'll ship your items soon!"
          : "Thank you for your order! Your payment was successful."}
      </p>

      {orderId && (
        <p
          style={{
            fontSize: "0.85rem",
            color: "var(--color-warm-taupe)",
            marginBottom: 32,
            background: "#f5f0e8",
            padding: "8px 20px",
            borderRadius: 20,
            display: "inline-block",
          }}
        >
          Order ID: <strong style={{ color: "var(--color-dark-charcoal)" }}>{orderId}</strong>
        </p>
      )}

      {/* Info cards for COD */}
      {isCOD && (
        <div
          style={{
            display: "flex",
            flexWrap: "wrap",
            gap: 14,
            justifyContent: "center",
            marginBottom: 36,
            maxWidth: 480,
          }}
        >
          {[
            { icon: <Package size={18} />, text: "We'll prepare your order within 1–2 days" },
            { icon: <Truck size={18} />, text: "Delivered in 5–7 business days" },
            { icon: <Phone size={18} />, text: "Our team may call to confirm your address" },
          ].map(({ icon, text }, i) => (
            <div
              key={i}
              style={{
                display: "flex",
                alignItems: "center",
                gap: 8,
                background: "#fff",
                border: "1px solid #e8ddd2",
                borderRadius: 10,
                padding: "10px 16px",
                fontSize: "0.82rem",
                color: "var(--color-dark-charcoal)",
                flex: "1 1 180px",
              }}
            >
              <span style={{ color: "var(--color-antique-gold)", flexShrink: 0 }}>{icon}</span>
              {text}
            </div>
          ))}
        </div>
      )}

      <div style={{ display: "flex", gap: 14, flexWrap: "wrap", justifyContent: "center" }}>
        <Link
          to="/shop"
          className="btn-primary"
          style={{ padding: "13px 28px", display: "inline-block" }}
        >
          Continue Shopping
        </Link>
        <Link
          to="/account"
          style={{
            padding: "13px 28px",
            display: "inline-block",
            background: "transparent",
            border: "1.5px solid var(--color-soft-blush)",
            borderRadius: 8,
            color: "var(--color-dark-charcoal)",
            fontWeight: 600,
            textDecoration: "none",
            fontSize: "0.9rem",
          }}
        >
          View Orders
        </Link>
      </div>
    </div>
  );
}
