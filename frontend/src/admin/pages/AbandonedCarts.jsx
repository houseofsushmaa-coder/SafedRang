import React, { useEffect, useState, useCallback } from "react";
import {
  ShoppingBasket, MessageSquare, Mail, RefreshCw,
  ExternalLink, CheckCircle2, Clock, Sparkles, AlertCircle,
  TrendingUp, Shield, Zap
} from "lucide-react";
import toast from "react-hot-toast";
import "./AdminPages.css";

import { formatINR } from "../../config/api.js";
import { adminService } from "../adminService.js";

export const AbandonedCarts = () => {
  const [carts, setCarts] = useState([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [activeTab, setActiveTab] = useState("all");

  const fetchCarts = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    else setLoading(true);

    try {
      const data = await adminService.getAbandonedCarts();
      setCarts(data ?? []);
    } catch (err) {
      console.error("Failed to fetch abandoned carts:", err);
      toast.error("Unable to load abandoned carts.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    fetchCarts();
  }, [fetchCarts]);

  const totalLostRevenue = carts.reduce((sum, c) => sum + (c.total || 0), 0);
  const recoverableValue = Math.round(totalLostRevenue * 0.28); // Industry average ~28% recovery with WhatsApp

  const handleMarkRecovered = (id) => {
    setCarts((prev) =>
      prev.map((c) => (c.id === id ? { ...c, recovered: true } : c))
    );
    toast.success("Cart marked as recovered! 🎉");
  };

  return (
    <div className="admin-page abandoned-carts-page">
      {/* Page Header */}
      <div className="page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
            <h2>Abandoned Carts Recovery</h2>
            <span
              style={{
                backgroundColor: "rgba(16, 185, 129, 0.12)",
                color: "#10b981",
                fontSize: "0.75rem",
                fontWeight: "700",
                padding: "3px 8px",
                borderRadius: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              100% Free Marketing
            </span>
          </div>
          <p className="page-subtitle">
            Re-engage shoppers who added luxury items to cart but left before completing payment
          </p>
        </div>
        <div className="header-actions">
          <button
            className="admin-btn admin-btn-outline icon-left"
            onClick={() => fetchCarts(true)}
            disabled={refreshing}
          >
            <RefreshCw size={15} className={refreshing ? "spin" : ""} />
            Refresh Carts
          </button>
        </div>
      </div>

      {/* KPI Summary Cards */}
      <div className="analytics-kpi-row" style={{ marginBottom: "24px" }}>
        <div className="admin-stat-card">
          <div className="stat-header">
            <div className="stat-icon orders">
              <ShoppingBasket size={20} />
            </div>
          </div>
          <div className="stat-body">
            <h4>Abandoned Checkouts</h4>
            <h2>{carts.length}</h2>
            <div className="stat-meta">Pending payment sessions</div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-header">
            <div className="stat-icon revenue">
              <TrendingUp size={20} />
            </div>
          </div>
          <div className="stat-body">
            <h4>Total Abandoned GMV</h4>
            <h2>{formatINR(totalLostRevenue)}</h2>
            <div className="stat-meta">Value left in shopping bags</div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-header">
            <div className="stat-icon aov">
              <Sparkles size={20} />
            </div>
          </div>
          <div className="stat-body">
            <h4>Recoverable Revenue (Est.)</h4>
            <h2 style={{ color: "#10b981" }}>{formatINR(recoverableValue)}</h2>
            <div className="stat-meta">With 1-click WhatsApp nudge</div>
          </div>
        </div>
      </div>

      {/* Free Marketing Channels Integration Blueprint Banner */}
      <div
        style={{
          backgroundColor: "#FDFBF7",
          border: "1px solid #E8DFD0",
          borderRadius: "14px",
          padding: "22px 26px",
          marginBottom: "24px",
          boxShadow: "0 4px 20px rgba(42, 33, 29, 0.04)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: "14px" }}>
          <Zap size={20} color="#AE8A54" />
          <h3 style={{ margin: 0, fontSize: "1.05rem", fontWeight: "700", color: "#2A211D" }}>
            Free Automated Abandoned Cart Tools Blueprint
          </h3>
        </div>
        <p style={{ margin: "0 0 16px 0", fontSize: "0.88rem", color: "#8B7863", lineHeight: "1.5" }}>
          Here are the best verified services to send <strong>100% free automated recovery messages</strong> without paying for expensive Shopify apps or marketing subscriptions:
        </p>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
          {/* Channel 1: WhatsApp 1-Click */}
          <div
            style={{
              padding: "16px",
              backgroundColor: "#FFFFFF",
              borderRadius: "10px",
              border: "1px solid #E8DFD0",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontWeight: "700", color: "#25D366", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: 6 }}>
                <MessageSquare size={16} /> WhatsApp Direct Link
              </span>
              <span style={{ fontSize: "0.72rem", backgroundColor: "#ecfdf5", color: "#059669", padding: "2px 6px", borderRadius: "4px", fontWeight: "700" }}>
                100% FREE FOREVER
              </span>
            </div>
            <p style={{ margin: "0 0 10px 0", fontSize: "0.8rem", color: "#8B7863", lineHeight: "1.4" }}>
              Built right into this table below! Click <strong>"WhatsApp Recover"</strong> to open a pre-filled luxury greeting with a 5% royal discount code.
            </p>
            <span style={{ fontSize: "0.76rem", color: "#AE8A54", fontWeight: "600" }}>
              ⚡ 85%+ open rates across India
            </span>
          </div>

          {/* Channel 2: Brevo */}
          <div
            style={{
              padding: "16px",
              backgroundColor: "#FFFFFF",
              borderRadius: "10px",
              border: "1px solid #E8DFD0",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontWeight: "700", color: "#0092FF", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: 6 }}>
                <Mail size={16} /> Brevo (Sendinblue)
              </span>
              <span style={{ fontSize: "0.72rem", backgroundColor: "#eff6ff", color: "#1d4ed8", padding: "2px 6px", borderRadius: "4px", fontWeight: "700" }}>
                300 EMAILS / DAY FREE
              </span>
            </div>
            <p style={{ margin: "0 0 10px 0", fontSize: "0.8rem", color: "#8B7863", lineHeight: "1.4" }}>
              Free tier includes unlimited contacts + automated abandoned cart email sequences (sends 1 hr &amp; 24 hr after abandonment).
            </p>
            <a
              href="https://www.brevo.com/"
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: "0.78rem", color: "#0092FF", fontWeight: "600", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}
            >
              Visit Brevo.com <ExternalLink size={12} />
            </a>
          </div>

          {/* Channel 3: OneSignal */}
          <div
            style={{
              padding: "16px",
              backgroundColor: "#FFFFFF",
              borderRadius: "10px",
              border: "1px solid #E8DFD0",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
              <span style={{ fontWeight: "700", color: "#e11d48", fontSize: "0.9rem", display: "flex", alignItems: "center", gap: 6 }}>
                <Zap size={16} /> OneSignal Web Push
              </span>
              <span style={{ fontSize: "0.72rem", backgroundColor: "#fff1f2", color: "#be123c", padding: "2px 6px", borderRadius: "4px", fontWeight: "700" }}>
                10,000 FREE USERS
              </span>
            </div>
            <p style={{ margin: "0 0 10px 0", fontSize: "0.8rem", color: "#8B7863", lineHeight: "1.4" }}>
              Delivers browser push notifications to desktop and Android phones even when the store tab is closed!
            </p>
            <a
              href="https://onesignal.com/"
              target="_blank"
              rel="noreferrer"
              style={{ fontSize: "0.78rem", color: "#e11d48", fontWeight: "600", textDecoration: "none", display: "inline-flex", alignItems: "center", gap: 4 }}
            >
              Visit OneSignal.com <ExternalLink size={12} />
            </a>
          </div>
        </div>
      </div>

      {/* Abandoned Carts Table */}
      <div className="admin-table-card">
        <div className="card-header">
          <div>
            <h3>Pending Checkout Sessions</h3>
            <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--admin-text-muted)" }}>
              Contact information captured at checkout. Click to dispatch instant recovery.
            </p>
          </div>
        </div>

        <div className="card-table-wrapper">
          {loading ? (
            <div style={{ padding: "30px", textAlign: "center", color: "#8B7863" }}>
              Loading abandoned sessions…
            </div>
          ) : carts.length === 0 ? (
            <div className="empty-state" style={{ padding: "40px" }}>
              <CheckCircle2 size={40} color="#10b981" />
              <h3 style={{ marginTop: 12 }}>No abandoned carts!</h3>
              <p>All current checkout sessions have completed payments.</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Customer</th>
                  <th>Contact Details</th>
                  <th>Items in Bag</th>
                  <th>Amount</th>
                  <th>Time Elapsed</th>
                  <th style={{ textAlign: "right" }}>Instant Free Recovery</th>
                </tr>
              </thead>
              <tbody>
                {carts.map((cart) => {
                  const elapsedMs = Date.now() - new Date(cart.createdAt).getTime();
                  const mins = Math.floor(elapsedMs / 60000);
                  const timeText =
                    mins < 60
                      ? `${mins}m ago`
                      : mins < 1440
                      ? `${Math.floor(mins / 60)}h ago`
                      : `${Math.floor(mins / 1440)}d ago`;

                  return (
                    <tr key={cart.id} style={{ opacity: cart.recovered ? 0.6 : 1 }}>
                      <td>
                        <strong style={{ color: "#2A211D" }}>{cart.customerName}</strong>
                        {cart.recovered && (
                          <span
                            style={{
                              marginLeft: 6,
                              fontSize: "0.72rem",
                              backgroundColor: "#ecfdf5",
                              color: "#059669",
                              padding: "2px 6px",
                              borderRadius: "4px",
                            }}
                          >
                            Recovered
                          </span>
                        )}
                      </td>
                      <td>
                        <div style={{ fontSize: "0.85rem", color: "#2A211D" }}>
                          {cart.customerPhone || "—"}
                        </div>
                        <div style={{ fontSize: "0.78rem", color: "#8B7863" }}>
                          {cart.customerEmail}
                        </div>
                      </td>
                      <td>
                        <span style={{ fontSize: "0.85rem", color: "#6E1E2A", fontWeight: "500" }}>
                          {cart.itemNames}
                        </span>
                      </td>
                      <td>
                        <strong style={{ color: "#2A211D" }}>{formatINR(cart.total)}</strong>
                      </td>
                      <td>
                        <span style={{ display: "inline-flex", alignItems: "center", gap: 4, color: "#8B7863", fontSize: "0.82rem" }}>
                          <Clock size={13} /> {timeText}
                        </span>
                      </td>
                      <td style={{ textAlign: "right" }}>
                        <div style={{ display: "inline-flex", gap: "8px", alignItems: "center" }}>
                          {cart.waLink ? (
                            <a
                              href={cart.waLink}
                              target="_blank"
                              rel="noreferrer"
                              className="admin-btn"
                              style={{
                                backgroundColor: "#25D366",
                                color: "#FFFFFF",
                                padding: "6px 12px",
                                fontSize: "0.78rem",
                                fontWeight: "600",
                                display: "inline-flex",
                                alignItems: "center",
                                gap: 6,
                                textDecoration: "none",
                              }}
                              onClick={() => handleMarkRecovered(cart.id)}
                            >
                              <MessageSquare size={13} /> WhatsApp Recover
                            </a>
                          ) : (
                            <button
                              disabled
                              className="admin-btn"
                              style={{ padding: "6px 10px", fontSize: "0.75rem", opacity: 0.5 }}
                            >
                              No Phone
                            </button>
                          )}

                          <a
                            href={`mailto:${cart.customerEmail}?subject=Your Safed Rang Handcrafted Bag is Waiting&body=Namaste ${encodeURIComponent(cart.customerName)}, your cart with ${encodeURIComponent(cart.itemNames)} is saved! Complete checkout today with 5% off code ROYAL5 at https://safedrang.com/checkout`}
                            className="admin-btn admin-btn-outline"
                            style={{ padding: "6px 10px", fontSize: "0.78rem" }}
                            title="Send Recovery Email"
                          >
                            <Mail size={13} />
                          </a>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  );
};

export default AbandonedCarts;
