import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  AreaChart, Area, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Legend,
} from "recharts";
import {
  TrendingUp, IndianRupee, ShoppingBag, Users,
  RefreshCw, BarChart3, Calendar,
} from "lucide-react";
import "./AdminPages.css";
import "./Analytics.css";

import { API_BASE, getAuthHeaders, formatINR } from "../../config/api.js";

const PERIOD_OPTIONS = [
  { label: "Last 7 Days", value: "last7" },
  { label: "Last 30 Days", value: "last30" },
  { label: "This Month", value: "thisMonth" },
  { label: "Prev Month", value: "prevMonth" },
];

const PIE_COLORS = ["#10b981", "#6366f1", "#f59e0b", "#ef4444", "#0891b2", "#a855f7"];



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
        <div key={i} className="chart-tooltip-value" style={{ color: p.color }}>
          {p.name}: {p.name === "Revenue" ? formatINR(p.value) : p.value}
        </div>
      ))}
    </div>
  );
};

const Skel = ({ w = "100%", h = 20, r = 6, mb = 0 }) => (
  <div className="skel-pulse" style={{ width: w, height: h, borderRadius: r, marginBottom: mb }} />
);

const Analytics = () => {
  const [period, setPeriod] = useState("last30");
  const [salesData, setSalesData] = useState([]);
  const [dashData, setDashData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);



  const fetchAll = useCallback(async (manual = false) => {
    if (manual) setRefreshing(true);
    else setLoading(true);
    try {
      const [chartRes, dashRes] = await Promise.all([
        axios.get(`${API_BASE}/analytics/sales-chart`, {
          params: { filter: period === "last7" ? "last7" : "last30" },
          headers: getAuthHeaders(),
        }),
        axios.get(`${API_BASE}/analytics/dashboard`, {
          params: { filter: period },
          headers: getAuthHeaders(),
        }),
      ]);
      setSalesData((chartRes.data.data ?? []).map((d) => ({
        name: formatChartDate(d.date),
        Revenue: d.revenue ?? 0,
        Orders: d.orders ?? 0,
      })));
      setDashData(dashRes.data.data);
    } catch (err) {
      console.error("Analytics fetch failed:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [period]);

  useEffect(() => { fetchAll(); }, [fetchAll]);

  const d = dashData ?? {};
  const periodLabel = PERIOD_OPTIONS.find((o) => o.value === period)?.label ?? period;

  const orderStatusData = d.orders
    ? [
        { name: "Pending", value: d.orders.pending ?? 0 },
        { name: "Processing", value: d.orders.processing ?? 0 },
        { name: "Delivered", value: d.orders.delivered ?? 0 },
        { name: "Cancelled", value: d.orders.cancelled ?? 0 },
      ].filter((x) => x.value > 0)
    : [];

  const kpis = [
    { label: "Total Revenue", value: formatINR(d.revenue?.total), icon: <IndianRupee size={20} />, cls: "revenue", sub: `${(d.revenue?.change ?? 0) >= 0 ? "+" : ""}${d.revenue?.change ?? 0}% vs prev period` },
    { label: "Total Orders", value: d.orders?.total ?? 0, icon: <ShoppingBag size={20} />, cls: "orders", sub: `${d.orders?.pending ?? 0} pending` },
    { label: "Avg Order Value", value: formatINR(d.avgOrderValue), icon: <TrendingUp size={20} />, cls: "aov", sub: "Per transaction" },
    { label: "Total Customers", value: d.customers?.total ?? 0, icon: <Users size={20} />, cls: "customers", sub: `${d.customers?.new ?? 0} new this period` },
  ];

  return (
    <div className="admin-page analytics-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2>Analytics</h2>
          <p className="page-subtitle">Performance overview for your store</p>
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
          <button className="admin-btn admin-btn-outline icon-left" onClick={() => fetchAll(true)} disabled={refreshing}>
            <RefreshCw size={15} className={refreshing ? "spin" : ""} />
            Refresh
          </button>
        </div>
      </div>

      {/* KPI Row */}
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

      {/* Charts Row */}
      <div className="analytics-charts-row">
        {/* Revenue Area Chart */}
        <div className="admin-chart-card analytics-big-chart">
          <div className="card-header">
            <div>
              <h3>Revenue Trend</h3>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--admin-text-muted)" }}>Daily revenue · {periodLabel}</p>
            </div>
            <BarChart3 size={18} color="var(--admin-text-muted)" />
          </div>
          <div style={{ height: 300, padding: "20px 8px 8px" }}>
            {loading ? (
              <div className="chart-skeleton">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="skel-pulse chart-bar-skel" style={{ height: `${25 + (i % 4) * 18}%` }} />
                ))}
              </div>
            ) : (
              <ResponsiveContainer>
                <AreaChart data={salesData} margin={{ top: 5, right: 16, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#10b981" stopOpacity={0.28} />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} interval="preserveStartEnd" />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(v) => `\u20b9${(v / 1000).toFixed(0)}k`} width={50} />
                  <Tooltip content={<CustomTooltip />} />
                  <Area type="monotone" dataKey="Revenue" stroke="#10b981" strokeWidth={2.5} fill="url(#revGrad)" dot={false} activeDot={{ r: 5 }} />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Orders Bar Chart */}
        <div className="admin-chart-card analytics-small-chart">
          <div className="card-header">
            <h3>Order Volume</h3>
          </div>
          <div style={{ height: 300, padding: "20px 8px 8px" }}>
            {loading ? (
              <div className="chart-skeleton">
                {Array.from({ length: 8 }).map((_, i) => (
                  <div key={i} className="skel-pulse chart-bar-skel" style={{ height: `${30 + (i % 3) * 20}%` }} />
                ))}
              </div>
            ) : (
              <ResponsiveContainer>
                <BarChart data={salesData} margin={{ top: 5, right: 16, left: 0, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} interval="preserveStartEnd" />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} width={30} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="Orders" fill="#6366f1" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>
      </div>

      {/* Bottom Row */}
      <div className="analytics-bottom-row">
        {/* Order Status Pie */}
        <div className="admin-chart-card analytics-pie-card">
          <div className="card-header">
            <h3>Order Status Breakdown</h3>
          </div>
          <div style={{ padding: "20px 24px" }}>
            {loading ? (
              <Skel w="100%" h={200} r={8} />
            ) : orderStatusData.length === 0 ? (
              <div className="empty-state" style={{ padding: "40px 0" }}>
                <p>No order data available.</p>
              </div>
            ) : (
              <>
                <ResponsiveContainer width="100%" height={200}>
                  <PieChart>
                    <Pie data={orderStatusData} cx="50%" cy="50%" outerRadius={80} dataKey="value" label={({ name, percent }) => `${name} ${(percent * 100).toFixed(0)}%`} labelLine={false} fontSize={12}>
                      {orderStatusData.map((_, index) => (
                        <Cell key={index} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip />
                  </PieChart>
                </ResponsiveContainer>
                <div className="pie-legend">
                  {orderStatusData.map((item, i) => (
                    <div key={item.name} className="pie-legend-item">
                      <span className="pie-dot" style={{ background: PIE_COLORS[i] }} />
                      <span>{item.name}</span>
                      <span className="pie-count">{item.value}</span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Best Sellers Table */}
        <div className="admin-chart-card analytics-bestsellers">
          <div className="card-header">
            <h3>Top Products</h3>
            <span className="chart-period-tag">{periodLabel}</span>
          </div>
          {loading ? (
            <div style={{ padding: "16px 24px" }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ display: "flex", gap: 12, marginBottom: 16 }}>
                  <Skel w={28} h={28} r={8} />
                  <div style={{ flex: 1 }}>
                    <Skel w="70%" h={12} mb={8} />
                    <Skel w="90%" h={6} r={3} />
                  </div>
                  <Skel w={40} h={14} />
                </div>
              ))}
            </div>
          ) : !d.bestSellers?.length ? (
            <div className="empty-state" style={{ padding: "40px 0" }}>
              <p>No sales data for this period.</p>
            </div>
          ) : (
            <div style={{ padding: "12px 0" }}>
              {d.bestSellers.map((item, idx) => {
                const maxQty = d.bestSellers[0]?._sum?.quantity ?? 1;
                const qty = item._sum?.quantity ?? 0;
                const pct = maxQty > 0 ? (qty / maxQty) * 100 : 0;
                return (
                  <div key={item.productId} className="best-seller-row">
                    <span className="bs-rank">#{idx + 1}</span>
                    <div className="bs-info">
                      <div className="bs-name">{item.product?.name ?? "Unknown"}</div>
                      <div className="bs-bar-wrap">
                        <div className="bs-bar" style={{ width: `${pct}%` }} />
                      </div>
                    </div>
                    <span className="bs-qty">{qty} sold</span>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default Analytics;
