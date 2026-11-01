import React, { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { MessageCircle, Mail, RefreshCw, CheckCircle2, ShoppingBasket, IndianRupee } from "lucide-react";
import { adminService } from "../adminService";
import { EmptyState, KpiCard, Notice, Section, formatINR } from "../components/AdminUI";
import "./AdminPages.css";

// Remembered on this browser only, so you can tick off who you've followed up with.
const CONTACTED_KEY = "sr_admin_contacted_checkouts";
const loadContacted = () => {
  try {
    return new Set(JSON.parse(localStorage.getItem(CONTACTED_KEY) || "[]"));
  } catch {
    return new Set();
  }
};

const timeAgo = (iso) => {
  const mins = Math.round((Date.now() - new Date(iso).getTime()) / 60000);
  if (mins < 60) return `${mins} min ago`;
  const hrs = Math.round(mins / 60);
  if (hrs < 48) return `${hrs} h ago`;
  return new Date(iso).toLocaleDateString("en-IN", { day: "numeric", month: "short" });
};

export default function AbandonedCarts() {
  const [carts, setCarts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [contacted, setContacted] = useState(loadContacted);

  const load = useCallback(async () => {
    setLoading(true);
    setCarts(await adminService.getAbandonedCarts());
    setLoading(false);
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const markContacted = (id) => {
    setContacted((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      try {
        localStorage.setItem(CONTACTED_KEY, JSON.stringify([...next]));
      } catch {}
      return next;
    });
  };

  const totalValue = carts.reduce((s, c) => s + c.total, 0);
  const open = carts.filter((c) => !contacted.has(c.id));

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <h2>Abandoned Checkouts</h2>
          <p className="page-subtitle">Online checkouts that were started but never paid (older than 30 minutes)</p>
        </div>
        <div className="header-actions">
          <button className="admin-btn admin-btn-outline icon-left" onClick={load} disabled={loading}>
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      <div className="aui-grid aui-grid-kpi">
        <KpiCard label="Unpaid checkouts" value={carts.length} hint={`${open.length} not contacted yet`} icon={<ShoppingBasket size={16} />} />
        <KpiCard label="Value not completed" value={formatINR(totalValue)} icon={<IndianRupee size={16} />} />
      </div>

      <Section title="Follow up" subtitle="Cash on Delivery orders aren't listed — they're real orders awaiting delivery.">
        {loading ? (
          <div className="admin-loading-state">Loading…</div>
        ) : carts.length === 0 ? (
          <EmptyState text="No unfinished online checkouts right now." />
        ) : (
          <div className="table-responsive">
            <table className="aui-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Pieces</th>
                  <th className="num">Value</th>
                  <th>Started</th>
                  <th className="num">Follow up</th>
                </tr>
              </thead>
              <tbody>
                {carts.map((c) => {
                  const done = contacted.has(c.id);
                  const mailBody = `Namaste ${c.customerName},\n\nThis is Safed Rang. We noticed your order for "${c.itemNames}" wasn't completed. If something went wrong with the payment, or you have any questions about the piece, just reply to this email — we're happy to help.\n\nhttps://safedrang.com`;
                  return (
                    <tr key={c.id} style={{ opacity: done ? 0.55 : 1 }}>
                      <td>
                        <strong>{c.customerName}</strong>
                        <div style={{ fontSize: "0.78rem", color: "var(--admin-text-muted)" }}>
                          {c.customerPhone || "No phone"} {c.customerEmail && `· ${c.customerEmail}`}
                        </div>
                      </td>
                      <td style={{ maxWidth: 280 }}>{c.itemNames || "—"}</td>
                      <td className="num">{formatINR(c.total)}</td>
                      <td>
                        {timeAgo(c.createdAt)}
                        {c.paymentStatus === "FAILED" && (
                          <div style={{ fontSize: "0.75rem", color: "var(--admin-danger)" }}>Payment failed</div>
                        )}
                      </td>
                      <td className="num">
                        <div className="action-buttons" style={{ justifyContent: "flex-end" }}>
                          {c.waLink && (
                            <a className="action-btn" href={c.waLink} target="_blank" rel="noopener noreferrer" title="Message on WhatsApp">
                              <MessageCircle size={16} />
                            </a>
                          )}
                          {c.customerEmail && (
                            <a
                              className="action-btn"
                              href={`mailto:${c.customerEmail}?subject=${encodeURIComponent("Your Safed Rang order")}&body=${encodeURIComponent(mailBody)}`}
                              title="Send an email"
                            >
                              <Mail size={16} />
                            </a>
                          )}
                          <button
                            type="button"
                            className="action-btn"
                            onClick={() => {
                              markContacted(c.id);
                              if (!done) toast.success("Marked as contacted");
                            }}
                            title={done ? "Mark as not contacted" : "Mark as contacted"}
                            style={done ? { color: "var(--admin-success)" } : undefined}
                          >
                            <CheckCircle2 size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Section>

      <Notice>
        Messages open in your own WhatsApp or email app with a polite note — nothing is sent automatically, and no discount
        is promised (checkout doesn't apply coupon codes yet).
      </Notice>
    </div>
  );
}
