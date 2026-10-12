import React, { useEffect, useState, useCallback } from "react";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer,
} from "recharts";
import {
  DollarSign, TrendingUp, ShoppingBag, Percent,
  RefreshCw, Calendar, Tag, Clock, CreditCard,
  Package, AlertTriangle, Sparkles, ArrowUpRight,
} from "lucide-react";
import "./AdminPages.css";
import "./Analytics.css";

import { formatINR } from "../../config/api.js";
import { adminService } from "../adminService.js";

const PERIOD_OPTIONS = [
  { label: "Last 7 Days", value: "last7" },
  { label: "Last 30 Days", value: "last30" },
  { label: "This Month", value: "thisMonth" },
  { label: "All Time", value: "all" },
];

const formatChartDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{label}</div>
      {payload.map((p, i) => (
        <div key={i} className="chart-tooltip-value" style={{ color: p.color || "#AE8A54" }}>
          {p.name}: {p.name.includes("Revenue") || p.name.includes("Sales") ? formatINR(p.value) : p.value}
        </div>
      ))}
    </div>
  );
};

const Skel = ({ w = "100%", h = 20, r = 6, mb = 0 }) => (
  <div className="skel-pulse" style={{ width: w, height: h, borderRadius: r, marginBottom: mb }} />
);

export const SalesAnalytics = () => {
  const [period, setPeriod] = useState("last30");
  const [salesData, setSalesData] = useState([]);
  const [salesMetrics, setSalesMetrics] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  const fetchSalesData = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    else setLoading(true);

    try {
      const [chartPoints, metrics] = await Promise.all([
        adminService.getSalesChart(period === "last7" ? "last7" : "last30"),
        adminService.getSalesAnalytics(period),
      ]);

      setSalesData(
        (chartPoints ?? []).map((d) => ({
          name: formatChartDate(d.date),
          Revenue: d.revenue ?? 0,
          Orders: d.orders ?? 0,
        }))
      );
      setSalesMetrics(metrics);
    } catch (err) {
      console.error("SalesAnalytics fetch failed:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  useEffect(() => {
    fetchSalesData();
  }, [fetchSalesData]);

  const m = salesMetrics ?? {
    grossSales: 0,
    netSales: 0,
    refundsAmount: 0,
    discountsTotal: 0,
    unitsSold: 0,
    upt: "1.00",
    aov: 0,
    categoryData: [],
    hourlyDistribution: [],
    dayOfWeekTrends: [],
    paymentMethods: [],
    starProducts: [],
    slowMovers: [],
  };

  const periodLabel = PERIOD_OPTIONS.find((o) => o.value === period)?.label ?? period;

  const kpis = [
    {
      label: "Gross Sales (GMV)",
      value: formatINR(m.grossSales),
      icon: <DollarSign size={20} />,
      cls: "revenue",
      sub: "Total ordered merchandise",
    },
    {
      label: "Net Realized Sales",
      value: formatINR(m.netSales),
      icon: <TrendingUp size={20} />,
      cls: "orders",
      sub: "Settled paid transactions",
    },
    {
      label: "Units Per Order (UPT)",
      value: m.upt,
      icon: <ShoppingBag size={20} />,
      cls: "aov",
      sub: `${m.unitsSold} total units purchased`,
    },
    {
      label: "Discounts & Promo Impact",
      value: formatINR(m.discountsTotal),
      icon: <Percent size={20} />,
      cls: "customers",
      sub: "Coupon & markdown value",
    },
  ];

  return (
    <div className="admin-page analytics-page sales-analytics-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <h2>Sales & Merchandising Intelligence</h2>
            <span
              style={{
                backgroundColor: "rgba(174, 138, 84, 0.12)",
                color: "#AE8A54",
                fontSize: "0.75rem",
                fontWeight: "700",
                padding: "3px 8px",
                borderRadius: "6px",
                textTransform: "uppercase",
                letterSpacing: "0.05em",
              }}
            >
              Revenue Deep-Dive
            </span>
          </div>
          <p className="page-subtitle">
            Category performance, peak shopping windows, and product velocity
          </p>
        </div>
        <div className="header-actions">
          <div style={{ display: "flex", alignItems: "center", gap: 6, color: "var(--admin-text-muted)", fontSize: "0.85rem" }}>
            <Calendar size={15} /> {periodLabel}
          </div>
          <select className="admin-select" value={period} onChange={(e) => setPeriod(e.target.value)}>
            {PERIOD_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>{o.label}</option>
            ))}
          </select>
          <button className="admin-btn admin-btn-outline icon-left" onClick={() => fetchSalesData(true)} disabled={refreshing}>
            <RefreshCw size={15} className={refreshing ? "spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Cards */}
      <div className="analytics-kpi-row">
        {loading
          ? Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="admin-stat-card">
                <Skel w={44} h={44} r={12} mb={16} />
                <Skel w="60%" h={13} mb={10} />
                <Skel w="80%" h={30} r={4} />
              </div>
            ))
          : kpis.map((k) => (
              <div key={k.label} className="admin-stat-card analytics-kpi-card">
                <div className="stat-header">
                  <div className={`stat-icon ${k.cls}`}>{k.icon}</div>
                </div>
                <div className="stat-body">
                  <h4>{k.label}</h4>
                  <h2>{k.value}</h2>
                  <div className="stat-meta">{k.sub}</div>
                </div>
              </div>
            ))}
      </div>

      {/* Revenue Velocity Chart */}
      <div className="admin-chart-card" style={{ marginBottom: "24px" }}>
        <div className="card-header">
          <div>
            <h3>Daily Revenue Velocity</h3>
            <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--admin-text-muted)" }}>
              Revenue generated vs order frequency · {periodLabel}
            </p>
          </div>
        </div>
        <div style={{ height: 320, padding: "20px 8px 8px" }}>
          {loading ? (
            <div className="chart-skeleton">
              {Array.from({ length: 12 }).map((_, i) => (
                <div key={i} className="skel-pulse chart-bar-skel" style={{ height: `${30 + (i % 4) * 15}%` }} />
              ))}
            </div>
          ) : (
            <ResponsiveContainer>
              <AreaChart data={salesData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="salesGrad" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#AE8A54" stopOpacity={0.3} />
                    <stop offset="95%" stopColor="#AE8A54" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} />
                <YAxis
                  axisLine={false}
                  tickLine={false}
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                  width={50}
                />
                <Tooltip content={<CustomTooltip />} />
                <Area type="monotone" dataKey="Revenue" stroke="#AE8A54" strokeWidth={2.5} fill="url(#salesGrad)" />
              </AreaChart>
            </ResponsiveContainer>
          )}
        </div>
      </div>

      {/* 2-Column Merchandising Grid: Category Share + Peak Shopping Times */}
      <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: "24px", marginBottom: "24px" }}>
        {/* Category Merchandising Matrix */}
        <div className="admin-chart-card">
          <div className="card-header">
            <div>
              <h3>Sales by Product Category</h3>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--admin-text-muted)" }}>
                Revenue contribution and unit volume
              </p>
            </div>
            <Tag size={16} color="var(--admin-text-muted)" />
          </div>
          <div style={{ padding: "20px 24px" }}>
            {loading ? (
              <Skel w="100%" h={220} />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                {m.categoryData.map((cat) => (
                  <div key={cat.name} style={{ display: "flex", flexDirection: "column", gap: "6px" }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.88rem" }}>
                      <span style={{ fontWeight: "600", color: "#2A211D" }}>{cat.name}</span>
                      <span style={{ color: "#8B7863" }}>
                        <strong style={{ color: "#2A211D" }}>{formatINR(cat.revenue)}</strong> ({cat.share}%) · {cat.units} units
                      </span>
                    </div>
                    <div style={{ height: "8px", backgroundColor: "#F0E8DC", borderRadius: "4px", overflow: "hidden" }}>
                      <div
                        style={{
                          height: "100%",
                          width: `${Math.min(100, Math.max(5, cat.share))}%`,
                          backgroundColor: cat.color || "#AE8A54",
                          borderRadius: "4px",
                          transition: "width 0.6s ease",
                        }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Peak Shopping Windows (Hourly Trends) */}
        <div className="admin-chart-card">
          <div className="card-header">
            <div>
              <h3>Peak Shopping Windows</h3>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--admin-text-muted)" }}>
                Optimal time for marketing drops & notifications
              </p>
            </div>
            <Clock size={16} color="var(--admin-text-muted)" />
          </div>
          <div style={{ padding: "20px 24px" }}>
            {loading ? (
              <Skel w="100%" h={220} />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
                {m.hourlyDistribution.map((slot) => {
                  const isPeak = slot.revenuePct >= 25;
                  return (
                    <div
                      key={slot.hour}
                      style={{
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "10px 14px",
                        backgroundColor: isPeak ? "rgba(174, 138, 84, 0.08)" : "#FAF5EC",
                        borderRadius: "8px",
                        border: isPeak ? "1px solid rgba(174, 138, 84, 0.3)" : "1px solid transparent",
                      }}
                    >
                      <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                        <span style={{ fontSize: "0.85rem", fontWeight: "700", color: isPeak ? "#6E1E2A" : "#2A211D" }}>
                          {slot.hour}
                        </span>
                        <span style={{ fontSize: "0.8rem", color: "#8B7863" }}>{slot.label}</span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <span style={{ fontSize: "0.82rem", fontWeight: "600", color: "#2A211D" }}>
                          {slot.revenuePct}% of GMV
                        </span>
                        {isPeak && (
                          <span
                            style={{
                              fontSize: "0.72rem",
                              fontWeight: "700",
                              color: "#AE8A54",
                              backgroundColor: "#FFFFFF",
                              padding: "2px 6px",
                              borderRadius: "4px",
                              border: "1px solid rgba(174, 138, 84, 0.3)",
                            }}
                          >
                            PEAK
                          </span>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2-Column: Payment Methods + Product Performance BCG Matrix */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "24px" }}>
        {/* Payment Methods */}
        <div className="admin-chart-card">
          <div className="card-header">
            <div>
              <h3>Payment Method Split</h3>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--admin-text-muted)" }}>
                Prepaid vs Cashflow Reliability
              </p>
            </div>
            <CreditCard size={16} color="var(--admin-text-muted)" />
          </div>
          <div style={{ padding: "20px 24px" }}>
            {loading ? (
              <Skel w="100%" h={180} />
            ) : (
              <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
                {m.paymentMethods.map((pm) => (
                  <div key={pm.method}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", marginBottom: "4px" }}>
                      <span style={{ fontWeight: "500", color: "#2A211D" }}>{pm.method}</span>
                      <span style={{ fontWeight: "700", color: pm.color }}>{pm.share}%</span>
                    </div>
                    <div style={{ height: "6px", backgroundColor: "#F0E8DC", borderRadius: "3px", overflow: "hidden" }}>
                      <div style={{ height: "100%", width: `${pm.share}%`, backgroundColor: pm.color }} />
                    </div>
                  </div>
                ))}
                <div
                  style={{
                    marginTop: "10px",
                    padding: "10px 14px",
                    borderRadius: "8px",
                    backgroundColor: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    fontSize: "0.82rem",
                    color: "#166534",
                  }}
                >
                  💡 <strong>Analyst Note:</strong> Over 90% of your sales are prepaid via UPI & Cards, resulting in near-zero Return-to-Origin (RTO) freight losses!
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Product Performance Matrix */}
        <div className="admin-chart-card">
          <div className="card-header">
            <div>
              <h3>Merchandise Velocity Watch</h3>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--admin-text-muted)" }}>
                Star drivers vs inventory needing sales push
              </p>
            </div>
            <Sparkles size={16} color="#AE8A54" />
          </div>
          <div style={{ padding: "16px 20px" }}>
            {loading ? (
              <Skel w="100%" h={200} />
            ) : (
              <div>
                <h4 style={{ margin: "0 0 10px 0", fontSize: "0.85rem", color: "#6E1E2A", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  🌟 Top Revenue Stars
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px", marginBottom: "20px" }}>
                  {m.starProducts.slice(0, 3).map((p) => (
                    <div
                      key={p.id}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "center",
                        padding: "8px 12px",
                        backgroundColor: "#FAF5EC",
                        borderRadius: "6px",
                      }}
                    >
                      <span style={{ fontSize: "0.85rem", fontWeight: "600", color: "#2A211D" }}>{p.name}</span>
                      <span style={{ fontSize: "0.82rem", fontWeight: "700", color: "#AE8A54" }}>
                        {formatINR(p.revenue)} ({p.sales} sold)
                      </span>
                    </div>
                  ))}
                </div>

                <h4 style={{ margin: "0 0 10px 0", fontSize: "0.85rem", color: "#b45309", textTransform: "uppercase", letterSpacing: "0.05em" }}>
                  ⚠️ Slow Mover Attention
                </h4>
                <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                  {m.slowMovers.slice(0, 2).map((p) => (
                    <div
                      key={p.id}
                      style={{
                        padding: "8px 12px",
                        backgroundColor: "#fffbeb",
                        borderRadius: "6px",
                        border: "1px solid #fef3c7",
                      }}
                    >
                      <div style={{ display: "flex", justifyContent: "space-between", fontSize: "0.85rem", fontWeight: "600", color: "#92400e" }}>
                        <span>{p.name}</span>
                        <span>{p.stock} units in stock</span>
                      </div>
                      <p style={{ margin: "4px 0 0 0", fontSize: "0.78rem", color: "#b45309" }}>
                        👉 {p.suggestion}
                      </p>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default SalesAnalytics;
