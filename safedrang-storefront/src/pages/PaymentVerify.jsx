import { useEffect, useState } from "react";
import { useSearchParams, Link, useNavigate } from "react-router-dom";
import axios from "axios";
import { CheckCircle2, XCircle, Loader2 } from "lucide-react";
import { API_BASE, getAuthHeaders } from "../config/api.js";
import { useCart } from "../context/CartContext";
import "./PaymentVerify.css"; // We'll just style it inline or reuse checkout classes

export default function PaymentVerify() {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const { clearCart } = useCart();
  
  const [status, setStatus] = useState("verifying");
  const [error, setError] = useState("");
  
  const orderId = searchParams.get("order_id");
  const cfOrderId = searchParams.get("cf_order_id");

  useEffect(() => {
    if (!orderId) {
      navigate("/");
      return;
    }

    const verifyPayment = async () => {
      try {
        const token = localStorage.getItem("adminToken"); // Wait, we might need customer token here. Actually the backend does not require auth for verification webhook or verify endpoint, let's see. 
        // We can just call it with user token if available.
        const res = await axios.post(`${API_BASE}/orders/verify-payment`, {
          orderId
        }, { headers: getAuthHeaders() });

        if (res.data.data.paymentStatus === "PAID") {
          setStatus("success");
          clearCart();
        } else {
          setStatus("failed");
          setError("Payment was not completed successfully.");
        }
      } catch (err) {
        setStatus("failed");
        setError(err.response?.data?.message || "Payment verification failed.");
      }
    };

    verifyPayment();
  }, [orderId, cfOrderId, navigate, clearCart]);

  return (
    <div className="payment-verify-page container" style={{ padding: "80px 20px", textAlign: "center", minHeight: "60vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
      {status === "verifying" && (
        <>
          <Loader2 className="spinner" size={48} style={{ color: "var(--color-warm-taupe)", marginBottom: "20px", animation: "spin 1s linear infinite" }} />
          <h2>Verifying Your Payment</h2>
          <p>Please do not close this window or click back.</p>
        </>
      )}

      {status === "success" && (
        <>
          <CheckCircle2 size={64} style={{ color: "var(--color-olive-green)", marginBottom: "20px" }} />
          <h2>Payment Successful!</h2>
          <p style={{ marginBottom: "30px", color: "var(--text-muted)" }}>Your order has been placed successfully. Order ID: {orderId}</p>
          <Link to="/shop" className="btn-primary" style={{ padding: "12px 24px", display: "inline-block" }}>
            Continue Shopping
          </Link>
        </>
      )}

      {status === "failed" && (
        <>
          <XCircle size={64} style={{ color: "var(--color-rust)", marginBottom: "20px" }} />
          <h2>Payment Failed</h2>
          <p style={{ marginBottom: "30px", color: "var(--color-rust)" }}>{error}</p>
          <div style={{ display: "flex", gap: "1rem", justifyContent: "center" }}>
            <Link to="/checkout" className="btn-primary" style={{ padding: "12px 24px", display: "inline-block" }}>
              Try Again
            </Link>
            <Link to="/contact" className="btn-secondary" style={{ padding: "12px 24px", display: "inline-block", background: "transparent", border: "1px solid var(--border-color)", color: "var(--text-color)" }}>
              Contact Support
            </Link>
          </div>
        </>
      )}
      <style>{`
        @keyframes spin {
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
