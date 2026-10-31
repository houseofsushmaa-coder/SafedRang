import { useCallback, useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { XCircle, Loader2 } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useCart } from "../context/CartContext";
import { trackEvent, toAnalyticsItem } from "../lib/tracking";

export default function PaymentVerify() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();

  // verifying | pending | failed
  const [status, setStatus] = useState("verifying");
  const [error, setError] = useState("");

  const orderId = searchParams.get("order_id");

  // The redirect itself proves nothing — the server asks Cashfree for the real status.
  const verifyPayment = useCallback(async () => {
    setStatus("verifying");
    try {
      const { data, error: fnError } = await supabase.functions.invoke("cashfree-verify", {
        body: { order_id: orderId },
      });
      if (fnError) throw new Error("We couldn't confirm your payment yet.");

      const paymentStatus = data?.order_status || "";

      if (paymentStatus === "PAID") {
        trackEvent("purchase", {
          transaction_id: orderId,
          value: Number(data.order_amount) || 0,
          shipping: 0,
          payment_type: "Online",
          items: (data.items || []).map((i) =>
            toAnalyticsItem({ id: i.productId, title: i.title }, { price: i.price, quantity: i.quantity, variant: i.selectedSize })
          ),
        });
        clearCart();
        try { sessionStorage.removeItem("sr_checkout_details"); } catch {}

        const params = new URLSearchParams({ order_id: orderId, method: "online" });
        navigate(`/order-success?${params.toString()}`, { replace: true });
      } else if (paymentStatus === "PENDING") {
        setStatus("pending");
      } else {
        setStatus("failed");
        setError(
          paymentStatus === "AMOUNT_MISMATCH"
            ? "We couldn't match your payment to this order. Please contact us — you will not be charged twice."
            : "Your payment was not completed. No money has been taken for this order."
        );
      }
    } catch (err) {
      setStatus("failed");
      setError(err.message || "Payment verification failed.");
    }
  }, [orderId, navigate, clearCart]);

  useEffect(() => {
    if (!orderId) {
      navigate("/");
      return;
    }
    verifyPayment();
  }, [orderId, navigate, verifyPayment]);

  return (
    <div
      style={{
        minHeight: "70vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        padding: "80px 20px",
        textAlign: "center",
        background: "var(--color-warm-ivory, #FAF5EC)",
      }}
    >
      {status === "verifying" && (
        <>
          {/* Animated spinner */}
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #FAF5EC, #F2EBDD)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 24,
              boxShadow: "0 8px 24px rgba(174,138,84,0.15)",
            }}
          >
            <Loader2
              size={34}
              style={{
                color: "var(--color-antique-gold, #AE8A54)",
                animation: "spin 0.9s linear infinite",
              }}
            />
          </div>
          <h2
            style={{
              fontFamily: "Cormorant Garamond, serif",
              fontSize: "1.6rem",
              fontWeight: 500,
              color: "var(--color-dark-charcoal, #2A211D)",
              marginBottom: 10,
            }}
          >
            Confirming Your Payment
          </h2>
          <p style={{ fontSize: "0.9rem", color: "var(--color-warm-taupe, #8B7863)", maxWidth: 380 }}>
            Please wait — do not close this window or press back. We're setting up your order and account.
          </p>
        </>
      )}

      {status === "pending" && (
        <>
          <h2
            style={{
              fontFamily: "Cormorant Garamond, serif",
              fontSize: "1.6rem",
              fontWeight: 500,
              color: "var(--color-dark-charcoal, #2A211D)",
              marginBottom: 10,
            }}
          >
            Your Payment Is Still Processing
          </h2>
          <p style={{ fontSize: "0.9rem", color: "#8B7863", marginBottom: 28, maxWidth: 420 }}>
            If you approved the payment in your UPI or banking app, it can take a minute to confirm.
            Please don't pay again — check the status below.
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            <button type="button" className="btn-primary" style={{ padding: "13px 28px" }} onClick={verifyPayment}>
              Check Payment Status
            </button>
            <Link to="/contact" style={{ padding: "13px 28px", color: "var(--color-dark-charcoal, #2A211D)", fontWeight: 600 }}>
              Contact Support
            </Link>
          </div>
        </>
      )}

      {status === "failed" && (
        <>
          <div
            style={{
              width: 72,
              height: 72,
              borderRadius: "50%",
              background: "linear-gradient(135deg, #fef2f2, #fee2e2)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              marginBottom: 24,
              boxShadow: "0 8px 24px rgba(220,38,38,0.12)",
            }}
          >
            <XCircle size={36} style={{ color: "#dc2626" }} />
          </div>
          <h2
            style={{
              fontFamily: "Cormorant Garamond, serif",
              fontSize: "1.6rem",
              fontWeight: 500,
              color: "var(--color-dark-charcoal, #2A211D)",
              marginBottom: 10,
            }}
          >
            Payment Unsuccessful
          </h2>
          <p style={{ fontSize: "0.9rem", color: "#8B7863", marginBottom: 28, maxWidth: 380 }}>
            {error}
          </p>
          <div style={{ display: "flex", gap: 12, flexWrap: "wrap", justifyContent: "center" }}>
            <Link
              to="/checkout"
              className="btn-primary"
              style={{ padding: "13px 28px", display: "inline-block" }}
            >
              Return to Checkout
            </Link>
            <Link
              to="/contact"
              style={{
                padding: "13px 28px",
                display: "inline-block",
                background: "transparent",
                border: "1.5px solid var(--color-soft-blush, #E8DFD0)",
                color: "var(--color-dark-charcoal, #2A211D)",
                fontWeight: 600,
                textDecoration: "none",
                fontSize: "0.9rem",
              }}
            >
              Contact Support
            </Link>
          </div>
        </>
      )}

      <style>{`
        @keyframes spin { 100% { transform: rotate(360deg); } }
      `}</style>
    </div>
  );
}
