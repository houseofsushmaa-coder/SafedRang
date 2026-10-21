import { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import { CheckCircle2, XCircle, Loader2, Sparkles } from "lucide-react";
import { supabase } from "../lib/supabase";
import { useCart } from "../context/CartContext";

export default function PaymentVerify() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  
  const [status, setStatus] = useState("verifying");
  const [error, setError] = useState("");
  
  const orderId = searchParams.get("order_id");

  useEffect(() => {
    if (!orderId) {
      navigate("/");
      return;
    }

    const verifyPayment = async () => {
      try {
        // Call the cashfree-verify edge function
        const { data, error: fnError } = await supabase.functions.invoke("cashfree-verify", {
          body: { order_id: orderId },
        });

        if (fnError) throw new Error(fnError.message);

        const paymentStatus = data?.order_status || data?.paymentStatus || "";

        if (paymentStatus === "PAID") {
          clearCart();

          // Fetch order details to get customer email for provisioning
          const { data: orderRow } = await supabase
            .from("orders")
            .select("customer_email, customer_name, user_id")
            .eq("id", orderId)
            .maybeSingle();

          // Provision customer account & send magic link (if not already a user)
          let isNewUser = false;
          if (orderRow?.customer_email && !orderRow?.user_id) {
            try {
              const { data: provData } = await supabase.functions.invoke("provision-customer", {
                body: {
                  email: orderRow.customer_email,
                  fullName: orderRow.customer_name || "",
                  orderId,
                },
              });
              isNewUser = provData?.isNewUser ?? false;
            } catch (provErr) {
              console.warn("Account provisioning failed (non-fatal):", provErr);
            }
          }

          // Redirect to success page
          const params = new URLSearchParams({ order_id: orderId, method: "online" });
          if (orderRow?.customer_email) params.set("email", orderRow.customer_email);
          if (isNewUser) params.set("new_account", "1");
          navigate(`/order-success?${params.toString()}`, { replace: true });
        } else {
          setStatus("failed");
          setError("Payment was not completed successfully.");
        }
      } catch (err) {
        setStatus("failed");
        setError(err.message || "Payment verification failed.");
      }
    };

    verifyPayment();
  }, [orderId, navigate, clearCart]);

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
              Try Again
            </Link>
            <Link
              to="/about"
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
