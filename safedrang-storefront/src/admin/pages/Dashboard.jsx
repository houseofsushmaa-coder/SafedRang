import React, { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
import { Link } from "react-router-dom";
import {
  IndianRupee,
  ShoppingBag,
  Users,
  AlertTriangle,
  ArrowUpRight,
  ArrowDownRight,
  Package,
  RefreshCw,
  TrendingUp,
  Award,
  Wifi,
  WifiOff,
  ShoppingCart,
  Activity,
  Zap,
  ArrowRight,
  Clock,
  CheckCircle2,
  XCircle,
  Loader2,
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  BarChart,
  Bar,
} from "recharts";
import "./AdminPages.css";
import "./Dashboard.css";

const API_BASE = "https://violet-quetzal-133812.hostingersite.com/api/v1";
const REFRESH_INTERVAL = 30;

// helper — reads token from localStorage (fallback if axios default not set yet)
const getAuthHeaders = () => {
  const t = localStorage.getItem("adminToken") || sessionStorage.getItem("adminToken");
  return t ? { Authorization: `Bearer ${t}` } : {};
};

const PERIOD_OPTIONS = [
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "Last 7 Days", value: "last7" },
  { label: "Last 30 Days", value: "last30" },
  { label: "This Month", value: "thisMonth" },
  { label: "Prev Month", value: "prevMonth" },
];

const formatCurrency = (val) =>
  new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(val ?? 0);

const formatChartDate = (dateStr) => {
  const d = new Date(dateStr);
  return d.toLocaleDateString("en-IN", { day: "2-digit", month: "short" });
};

const Skel = ({ w = "100%", h = 20, r = 6, mb = 0 }) => (
  <div
    className="skel-pulse"
    style={{ width: w, height: h, borderRadius: r, marginBottom: mb }}
  />
);

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{label}</div>
      <div className="chart-tooltip-value">{formatCurrency(payload[0].value)}</div>
    </div>
  );
};

const statusConfig = {
  pending: { icon: <Clock size={13} />, label: "Pending", cls: "pill--yellow" },
  processing: { icon: <Loader2 size={13} />, label: "Processing", cls: "pill--blue" },
  delivered: { icon: <CheckCircle2 size={13} />, label: "Delivered", cls: "pill--green" },
  cancelled: { icon: <XCircle size={13} />, label: "Cancelled", cls: "pill--red" },
};

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [chartData, setChartData] = useState([]);
  const [period, setPeriod] = useState("last30");
  const [loading, setLoading] = useState(true);
  const [chartLoading, setChartLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [countdown, setCountdown] = useState(REFRESH_INTERVAL);
  const [isOnline, setIsOnline] = useState(true);
  const [lastUpdated, setLastUpdated] = useState(null);
  const [error, setError] = useState(null);
  const [chartType, setChartType] = useState("area");

  const countdownRef = useRef(null);
  const refreshTimerRef = useRef(null);

  // getAuthHeaders is now module-level above (avoids stale closure).

  const fetchDashboard = useCallback(
    async (isManual = false) => {
      if (isManual) setRefreshing(true);
      setError(null);
      try {
        const res = await axios.get(`${API_BASE}/analytics/dashboard`, {
          params: { filter: period },
          headers: getAuthHeaders(),
        });
        setData(res.data.data);
        setLastUpdated(new Date());
        setIsOnline(true);
      } catch (err) {
        console.error("Dashboard fetch failed:", err);
        setIsOnline(false);
        // Only show error if we have no previous data to show
        setError((prevErr) => (data === null ? "Unable to load dashboard data." : prevErr));
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [period], // intentionally omitting `data` to avoid fetch loop
  );

  const fetchChart = useCallback(async () => {
    setChartLoading(true);
    try {
      const chartFilter = period === "last7" ? "last7" : "last30";
      const res = await axios.get(`${API_BASE}/analytics/sales-chart`, {
        params: { filter: chartFilter },
        headers: getAuthHeaders(),
      });
      const raw = res.data.data ?? [];
      setChartData(
        raw.map((d) => ({ name: formatChartDate(d.date), revenue: d.revenue })),
      );
    } catch (err) {
      console.error("Chart fetch failed:", err);
      setChartData([]);
    } finally {
      setChartLoading(false);
    }
  }, [period]);

  useEffect(() => {
    setLoading(true);
    fetchDashboard();
    fetchChart();
  }, [fetchDashboard, fetchChart]);

  const resetCountdown = useCallback(() => {
    clearInterval(countdownRef.current);
    clearInterval(refreshTimerRef.current);
    setCountdown(REFRESH_INTERVAL);

    countdownRef.current = setInterval(() => {
      setCountdown((c) => (c <= 1 ? REFRESH_INTERVAL : c - 1));
    }, 1000);

    refreshTimerRef.current = setInterval(() => {
      fetchDashboard();
      fetchChart();
      setCountdown(REFRESH_INTERVAL);
    }, REFRESH_INTERVAL * 1000);
  }, [fetchDashboard, fetchChart]);

  useEffect(() => {
    resetCountdown();
    return () => {
      clearInterval(countdownRef.current);
      clearInterval(refreshTimerRef.current);
    };
  }, [resetCountdown]);

  const handleManualRefresh = () => {
    fetchDashboard(true);
    fetchChart();
    resetCountdown();
  };

  const stats = data ?? {
    revenue: { total: 0, refunded: 0, change: 0 },
    orders: { total: 0, pending: 0, processing: 0, delivered: 0, cancelled: 0 },
    customers: { total: 0, new: 0 },
    products: { total: 0, lowStock: 0 },
    avgOrderValue: 0,
    bestSellers: [],
    lowStockProducts: [],
    recentOrders: [],
    refunds: { count: 0, amount: 0 },
  };

  const periodLabel =
    PERIOD_OPTIONS.find((o) => o.value === period)?.label ?? "Period";

  const kpiCards = [
    {
      key: "revenue",
      label: `Revenue (${periodLabel})`,
      value: formatCurrency(stats.revenue.total),
      icon: <IndianRupee size={20} />,
      iconClass: "revenue",
      trend: stats.revenue.change,
      trendLabel: `${Math.abs(stats.revenue.change)}%`,
      meta: stats.revenue.refunded > 0 ? `\u21a9 ${formatCurrency(stats.revenue.refunded)} refunded` : null,
    },
    {
      key: "aov",
      label: "Avg Order Value",
      value: formatCurrency(stats.avgOrderValue),
      icon: <TrendingUp size={20} />,
      iconClass: "aov",
    },
    {
      key: "orders",
      label: `Orders (${periodLabel})`,
      value: stats.orders.total,
      icon: <ShoppingBag size={20} />,
      iconClass: "orders",
      pills: [
        { label: `${stats.orders.pending} pending`, cls: "pill--yellow" },
        { label: `${stats.orders.delivered} delivered`, cls: "pill--green" },
        { label: `${stats.orders.cancelled} cancelled`, cls: "pill--red" },
      ],
    },
    {
      key: "customers",
      label: "Total Customers",
      value: stats.customers.total,
      icon: <Users size={20} />,
      iconClass: "customers",
      trend: stats.customers.new > 0 ? 1 : null,
      trendLabel: `${stats.customers.new} new`,
      meta: `${stats.customers.new} joined this period`,
    },
    {
      key: "products",
      label: "Total Products",
      value: stats.products.total,
      icon: <Package size={20} />,
      iconClass: "products",
      trend: stats.products.lowStock > 0 ? -1 : null,
      trendLabel: `${stats.products.lowStock} low stock`,
    },
    {
      key: "refunds",
      label: `Refunds (${periodLabel})`,
      value: formatCurrency(stats.refunds?.amount ?? 0),
      icon: <ArrowDownRight size={20} />,
      iconClass: "refunds",
      meta: `${stats.refunds?.count ?? 0} refund${stats.refunds?.count !== 1 ? "s" : ""}`,
    },
  ];

  const quickActions = [
    { label: "Products",  to: "/admin/products",  icon: <ShoppingBag size={14} />, color: "action-gold" },
    { label: "Orders",    to: "/admin/orders",    icon: <ShoppingCart size={14} />, color: "action-wine" },
    { label: "Inventory", to: "/admin/inventory", icon: <Package size={14} />,      color: "action-green" },
    { label: "Customers", to: "/admin/customers", icon: <Users size={14} />,        color: "action-indigo" },
    { label: "Analytics", to: "/admin/analytics", icon: <Activity size={14} />,     color: "action-blue" },
    { label: "Settings",  to: "/admin/settings",  icon: <Zap size={14} />,          color: "action-amber" },
  ];

  return (
    <div className="admin-page dashboard-page">
      {/* ── Welcome Banner ── */}
      <div className="dashboard-welcome-banner">
        <div className="welcome-content">
          <div className="welcome-text">
            <h2>Safed Rang — Store Overview</h2>
            <p className="page-subtitle">
              {lastUpdated
                ? `Updated at ${lastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })} · auto-refresh every ${REFRESH_INTERVAL}s`
                : "Connecting to store…"}
            </p>
          </div>
          <div className="header-actions">
            <div className={`live-badge ${isOnline ? "live-badge--online" : "live-badge--offline"}`}>
              {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
              <span>{isOnline ? `Live · ${countdown}s` : "Offline"}</span>
            </div>
            <select
              className="admin-select"
              value={period}
              onChange={(e) => {
                setPeriod(e.target.value);
                setLoading(true);
              }}
            >
              {PERIOD_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>{o.label}</option>
              ))}
            </select>
            <button
              className="admin-btn admin-btn-outline icon-left"
              onClick={handleManualRefresh}
              disabled={refreshing}
            >
              <RefreshCw size={15} className={refreshing ? "spin" : ""} />
              {refreshing ? "Refreshing…" : "Refresh"}
            </button>
          </div>
        </div>

        {/* Quick Actions */}
        <div className="quick-actions">
          {quickActions.map((a) => (
            <Link key={a.to} to={a.to} className={`quick-action-chip ${a.color}`}>
              {a.icon}
              <span>{a.label}</span>
              <ArrowRight size={11} className="chip-arrow" />
            </Link>
          ))}
        </div>
      </div>

      {/* ── Low-stock alert ── */}
      {!loading && stats.lowStockProducts?.length > 0 && (
        <div className="low-stock-strip">
          <AlertTriangle size={15} />
          <strong>
            {stats.lowStockProducts.length} product
            {stats.lowStockProducts.length !== 1 ? "s" : ""} low on stock:
          </strong>
          {stats.lowStockProducts.slice(0, 5).map((p, i) => (
            <span key={p.id} className="low-stock-item">
              {p.name} <em>({p.stock})</em>
              {i < Math.min(stats.lowStockProducts.length, 5) - 1 ? ", " : ""}
            </span>
          ))}
          {stats.lowStockProducts.length > 5 && (
            <span className="low-stock-more">+{stats.lowStockProducts.length - 5} more</span>
          )}
          <Link to="/admin/inventory" className="low-stock-action">View Inventory</Link>
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div className="dashboard-stats-grid">
        {loading
          ? Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="admin-stat-card">
                <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 16 }}>
                  <Skel w={44} h={44} r={12} />
                  <Skel w={60} h={22} r={99} />
                </div>
                <Skel w="55%" h={13} mb={10} />
                <Skel w="70%" h={32} r={4} />
              </div>
            ))
          : kpiCards.map((card) => (
              <div key={card.key} className="admin-stat-card">
                <div className="stat-header">
                  <div className={`stat-icon ${card.iconClass}`}>{card.icon}</div>
                  {card.trend !== null && card.trend !== undefined ? (
                    <span className={`stat-trend ${card.trend > 0 ? "positive" : card.trend < 0 ? "warning" : ""}`}>
                      {card.trend > 0 ? <ArrowUpRight size={13} /> : <AlertTriangle size={13} />}
                      {card.trendLabel}
                    </span>
                  ) : null}
                </div>
                <div className="stat-body">
                  <h4>{card.label}</h4>
                  <h2>{card.value}</h2>
                  {card.pills && (
                    <div className="stat-meta-pills">
                      {card.pills.map((p) => (
                        <span key={p.label} className={`pill ${p.cls}`}>{p.label}</span>
                      ))}
                    </div>
                  )}
                  {card.meta && <div className="stat-meta">{card.meta}</div>}
                </div>
              </div>
            ))}
      </div>

      {/* ── Chart + Right col ── */}
      <div className="dashboard-main-grid">
        {/* Sales Chart */}
        <div className="admin-chart-card">
          <div className="card-header">
            <div>
              <h3>Sales Overview</h3>
              <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--admin-text-muted)" }}>Revenue trend · {periodLabel}</p>
            </div>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <div className="chart-type-toggle">
                <button
                  className={`chart-type-btn ${chartType === "area" ? "active" : ""}`}
                  onClick={() => setChartType("area")}
                >Area</button>
                <button
                  className={`chart-type-btn ${chartType === "bar" ? "active" : ""}`}
                  onClick={() => setChartType("bar")}
                >Bar</button>
              </div>
            </div>
          </div>
          <div className="chart-container" style={{ height: 320, width: "100%", padding: "20px 8px 8px" }}>
            {chartLoading ? (
              <div className="chart-skeleton">
                {Array.from({ length: 12 }).map((_, i) => (
                  <div key={i} className="skel-pulse chart-bar-skel" style={{ height: `${30 + (i % 4) * 15}%` }} />
                ))}
              </div>
            ) : chartData.length === 0 ? (
              <div className="empty-state" style={{ height: "100%" }}>
                <Activity size={40} className="empty-icon" />
                <p>No sales data for this period.</p>
              </div>
            ) : (
              <ResponsiveContainer>
                {chartType === "area" ? (
                  <AreaChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#10b981" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} interval="preserveStartEnd" />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(v) => `\u20b9${(v / 1000).toFixed(0)}k`} width={50} />
                    <Tooltip content={<CustomTooltip />} />
                    <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={2.5} fillOpacity={1} fill="url(#colorRevenue)" dot={false} activeDot={{ r: 5, fill: "#10b981", strokeWidth: 0 }} />
                  </AreaChart>
                ) : (
                  <BarChart data={chartData} margin={{ top: 10, right: 16, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="barGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#10b981" />
                        <stop offset="100%" stopColor="#0891b2" />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#f1f5f9" />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} interval="preserveStartEnd" />
                    <YAxis axisLine={false} tickLine={false} tick={{ fill: "#94a3b8", fontSize: 11 }} tickFormatter={(v) => `\u20b9${(v / 1000).toFixed(0)}k`} width={50} />
                    <Tooltip content={<CustomTooltip />} />
                    <Bar dataKey="revenue" fill="url(#barGrad)" radius={[4, 4, 0, 0]} />
                  </BarChart>
                )}
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right Column */}
        <div className="dashboard-right-col">
          {/* Order Status Breakdown */}
          {!loading && (
            <div className="admin-chart-card order-breakdown-card">
              <div className="card-header">
                <h3>Order Status</h3>
                <Link to="/admin/orders" className="text-link">View All</Link>
              </div>
              <div className="order-breakdown-body">
                {[
                  { key: "pending", count: stats.orders.pending },
                  { key: "processing", count: stats.orders.processing },
                  { key: "delivered", count: stats.orders.delivered },
                  { key: "cancelled", count: stats.orders.cancelled },
                ].map(({ key, count }) => {
                  const total = stats.orders.total || 1;
                  const pct = Math.round((count / total) * 100);
                  const cfg = statusConfig[key];
                  return (
                    <div key={key} className="breakdown-row">
                      <div className={`breakdown-label pill ${cfg.cls}`}>
                        {cfg.icon} {cfg.label}
                      </div>
                      <div className="breakdown-bar-wrap">
                        <div className={`breakdown-bar bar-${key}`} style={{ width: `${pct}%` }} />
                      </div>
                      <span className="breakdown-count">{count}</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Best Sellers */}
          {!loading && stats.bestSellers?.length > 0 && (
            <div className="admin-chart-card best-sellers-card">
              <div className="card-header">
                <h3>
                  <Award size={16} style={{ marginRight: 6, verticalAlign: "middle", color: "#d97706" }} />
                  Best Sellers
                </h3>
                <span className="chart-period-tag">{periodLabel}</span>
              </div>
              <div style={{ padding: "12px 0" }}>
                {stats.bestSellers.map((item, idx) => {
                  const maxQty = stats.bestSellers[0]?._sum?.quantity ?? 1;
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
            </div>
          )}
        </div>
      </div>

      {/* ── Recent Orders Table ── */}
      <div className="admin-table-card" style={{ marginTop: 20 }}>
        <div className="card-header">
          <div>
            <h3>Recent Orders</h3>
            <p style={{ margin: 0, fontSize: "0.8rem", color: "var(--admin-text-muted)" }}>Latest transactions across your store</p>
          </div>
          <Link to="/admin/orders" className="admin-btn admin-btn-outline icon-left" style={{ fontSize: "0.85rem", padding: "6px 14px" }}>
            View All <ArrowRight size={14} />
          </Link>
        </div>
        <div className="card-table-wrapper">
          {loading ? (
            <div style={{ padding: "20px 24px" }}>
              {Array.from({ length: 5 }).map((_, i) => (
                <div key={i} style={{ display: "flex", gap: 12, marginBottom: 18 }}>
                  <Skel w="20%" h={14} />
                  <Skel w="30%" h={14} />
                  <Skel w="20%" h={14} />
                  <Skel w="15%" h={20} r={10} />
                </div>
              ))}
            </div>
          ) : stats.recentOrders.length === 0 ? (
            <div className="empty-state">
              <ShoppingCart size={40} className="empty-icon" />
              <h3>No recent orders</h3>
              <p>Orders will appear here once customers start purchasing.</p>
            </div>
          ) : (
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order</th>
                  <th>Customer</th>
                  <th>Amount</th>
                  <th>Status</th>
                  <th>Date</th>
                </tr>
              </thead>
              <tbody>
                {stats.recentOrders.map((order) => (
                  <tr key={order.id}>
                    <td className="font-medium order-num">{order.orderNumber}</td>
                    <td>{order.customerName}</td>
                    <td className="font-medium">{formatCurrency(order.totalAmount)}</td>
                    <td>
                      <span className={`status-badge status-${order.status?.toLowerCase()}`}>
                        {order.status}
                      </span>
                    </td>
                    <td style={{ color: "var(--admin-text-muted)", fontSize: "0.85rem" }}>
                      {order.createdAt
                        ? new Date(order.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short" })
                        : "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Error notice */}
      {error && (
        <div className="dashboard-error-notice">
          <WifiOff size={16} /> {error}{" "}
          <button className="text-link" onClick={handleManualRefresh}>Retry</button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
