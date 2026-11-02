import React, { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { Truck, ExternalLink } from "lucide-react";
import { adminService } from "../adminService";

// Shows an order's Shiprocket shipment, or lets the admin send the order to Shiprocket
// with a weight and box size (pre-filled from the products; editable).
export default function ShiprocketPanel({ order, onSent }) {
  const sr = order.shiprocket;
  const [parcel, setParcel] = useState(null);
  const [sending, setSending] = useState(false);
  const [error, setError] = useState("");

  const blockedReason = ["CANCELLED", "RETURNED"].includes(order.orderStatus)
    ? "Cancelled or returned orders can't be shipped."
    : order.paymentMethodCode !== "COD" && order.paymentStatus !== "PAID"
    ? "This online order isn't paid, so it shouldn't be shipped."
    : "";

  useEffect(() => {
    if (sr?.shiprocket_order_id || blockedReason) return;
    let alive = true;
    adminService
      .shiprocket("preview", { orderId: order.id })
      .then((res) => alive && setParcel(res.suggestion))
      .catch(() => alive && setParcel({ weight: 0.8, length: 30, breadth: 25, height: 5 }));
    return () => {
      alive = false;
    };
  }, [order.id, sr?.shiprocket_order_id, blockedReason]);

  const send = async () => {
    setSending(true);
    setError("");
    try {
      const res = await adminService.shiprocket("create", { orderId: order.id, ...parcel });
      toast.success(`Sent to Shiprocket (order ${res.shiprocket.shiprocket_order_id}). Assign a courier there.`);
      onSent?.(res.shiprocket);
    } catch (err) {
      setError(err.message);
    } finally {
      setSending(false);
    }
  };

  const box = { border: "1px solid var(--admin-border)", borderRadius: 8, padding: "12px 14px", marginBottom: 20 };
  const heading = { fontSize: "0.85rem", color: "var(--admin-text-muted)", textTransform: "uppercase", marginBottom: 8, display: "flex", alignItems: "center", gap: 6 };

  if (sr?.shiprocket_order_id) {
    return (
      <div style={box}>
        <h4 style={heading}>
          <Truck size={15} /> Shiprocket
        </h4>
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 10, fontSize: "0.85rem" }}>
          <div>
            <div style={{ color: "var(--admin-text-muted)", fontSize: "0.75rem" }}>Shiprocket order</div>
            <strong>{sr.shiprocket_order_id}</strong>
          </div>
          <div>
            <div style={{ color: "var(--admin-text-muted)", fontSize: "0.75rem" }}>Status</div>
            <strong>{sr.status || "New"}</strong>
          </div>
          <div>
            <div style={{ color: "var(--admin-text-muted)", fontSize: "0.75rem" }}>Courier</div>
            <strong>{sr.courier || "Not assigned yet"}</strong>
          </div>
          <div>
            <div style={{ color: "var(--admin-text-muted)", fontSize: "0.75rem" }}>AWB (tracking no.)</div>
            <strong>{sr.awb || "—"}</strong>
          </div>
        </div>
        {sr.awb ? (
          <a
            className="aui-link"
            href={sr.tracking_url || `https://shiprocket.co/tracking/${sr.awb}`}
            target="_blank"
            rel="noopener noreferrer"
            style={{ display: "inline-flex", alignItems: "center", gap: 4, marginTop: 10, fontSize: "0.82rem" }}
          >
            Customer tracking link <ExternalLink size={13} />
          </a>
        ) : (
          <p style={{ marginTop: 10, fontSize: "0.8rem", color: "var(--admin-text-muted)" }}>
            Next: in Shiprocket, open this order → <strong>Ship Now</strong> to pick a courier, then print the label and request pickup.
            The tracking number and delivery updates will appear here automatically.
          </p>
        )}
      </div>
    );
  }

  return (
    <div style={box}>
      <h4 style={heading}>
        <Truck size={15} /> Shiprocket
      </h4>
      {blockedReason ? (
        <p style={{ fontSize: "0.85rem", color: "var(--admin-text-muted)" }}>{blockedReason}</p>
      ) : !parcel ? (
        <p style={{ fontSize: "0.85rem", color: "var(--admin-text-muted)" }}>Working out the parcel size…</p>
      ) : (
        <>
          <div style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "flex-end" }}>
            {[
              ["weight", "Weight (kg)", 0.05],
              ["length", "L (cm)", 1],
              ["breadth", "B (cm)", 1],
              ["height", "H (cm)", 1],
            ].map(([key, label, step]) => (
              <label key={key} style={{ display: "flex", flexDirection: "column", gap: 4, fontSize: "0.75rem", color: "var(--admin-text-muted)" }}>
                {label}
                <input
                  type="number"
                  min={step}
                  step={step}
                  className="admin-input"
                  style={{ width: key === "weight" ? 90 : 70, padding: "6px 8px" }}
                  value={parcel[key]}
                  onChange={(e) => setParcel((p) => ({ ...p, [key]: e.target.value }))}
                />
              </label>
            ))}
            <button type="button" className="admin-btn admin-btn-primary icon-left" onClick={send} disabled={sending}>
              <Truck size={15} /> {sending ? "Sending…" : "Send to Shiprocket"}
            </button>
          </div>
          <p style={{ marginTop: 8, fontSize: "0.75rem", color: "var(--admin-text-muted)" }}>
            Weight is worked out from the products (0.8 kg per saree when not set). Courier rates depend on it, so weigh the
            packed parcel if you can. {order.paymentMethodCode === "COD" && order.paymentStatus !== "PAID" ? `Sent as COD — courier collects ₹${Math.round(order.total).toLocaleString("en-IN")}.` : "Sent as Prepaid."}
          </p>
          {error && (
            <div className="aui-error" style={{ marginTop: 8 }}>
              {error}
            </div>
          )}
        </>
      )}
    </div>
  );
}
