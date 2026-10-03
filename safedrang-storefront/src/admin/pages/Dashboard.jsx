import React, { useEffect, useState, useCallback, useRef } from "react";
import axios from "axios";
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
} from "lucide-react";
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import "./AdminPages.css";
import "./Dashboard.css";

const API_BASE = "https://violet-quetzal-133812.hostingersite.com/api/v1";
const REFRESH_INTERVAL = 30; // seconds

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

/* ── Skeleton block ── */
const Skel = ({ w = "100%", h = 20, r = 6, mb = 0 }) => (
  <div
    className="skel-pulse"
    style={{ width: w, height: h, borderRadius: r, marginBottom: mb }}
  />
);

const StatCardSkeleton = () => (
  <div className="admin-stat-card">
    <div className="stat-header">
      <Skel w={48} h={48} r={12} />
      <Skel w={70} h={24} r={12} />
    </div>
    <div className="stat-body" style={{ marginTop: 12 }}>
      <Skel w="60%" h={14} mb={10} />
      <Skel w="80%" h={34} r={4} />
    </div>
  </div>
);

/* ── Custom chart tooltip ── */
const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div className="chart-tooltip">
      <div className="chart-tooltip-label">{label}</div>
      <div className="chart-tooltip-value">
        {formatCurrency(payload[0].value)}
      </div>
    </div>
  );
};

/* ════════════════════════════════════════════════════════
   DASHBOARD
═══════════════════════════════════════════════════════════ */
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

  const countdownRef = useRef(null);
  const refreshTimerRef = useRef(null);

  const getAuthHeaders = () => {
    const token =
      localStorage.getItem("adminToken") ||
      sessionStorage.getItem("adminToken");
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  /* ── Fetch KPI data ── */
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
        if (!data) setError("Unable to load dashboard data.");
      } finally {
        setLoading(false);
        setRefreshing(false);
      }
    },
    [period],
  ); // eslint-disable-line react-hooks/exhaustive-deps

  /* ── Fetch chart data ── */
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

  /* ── Initial + period-change load ── */
  useEffect(() => {
    setLoading(true);
    fetchDashboard();
    fetchChart();
  }, [fetchDashboard, fetchChart]);

  /* ── Auto-refresh timer ── */
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

  /* ── Fallback stats ── */
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

  /* ════════════════════ RENDER ════════════════════ */
  return (
    <div className="admin-page dashboard-page">
      {/* ── Header ── */}
      <div className="page-header">
        <div>
          <h2>Dashboard</h2>
          <p className="page-subtitle">
            {lastUpdated
              ? `Updated: ${lastUpdated.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}`
              : "Loading…"}
          </p>
        </div>

        <div className="header-actions">
          {/* Live indicator */}
          <div
            className={`live-badge ${isOnline ? "live-badge--online" : "live-badge--offline"}`}
          >
            {isOnline ? <Wifi size={13} /> : <WifiOff size={13} />}
            <span>{isOnline ? `Live · ${countdown}s` : "Offline"}</span>
          </div>

          {/* Period selector */}
          <select
            className="admin-select"
            value={period}
            onChange={(e) => {
              setPeriod(e.target.value);
              setLoading(true);
            }}
          >
            {PERIOD_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </select>

          {/* Manual refresh */}
          <button
            className="admin-btn admin-btn-outline icon-left"
            onClick={handleManualRefresh}
            disabled={refreshing}
            title="Refresh now"
          >
            <RefreshCw size={16} className={refreshing ? "spin" : ""} />
            {refreshing ? "Refreshing…" : "Refresh"}
          </button>
        </div>
      </div>

      {/* ── Low-stock alert strip ── */}
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
            <span className="low-stock-more">
              +{stats.lowStockProducts.length - 5} more
            </span>
          )}
        </div>
      )}

      {/* ── KPI Cards ── */}
      <div className="dashboard-stats-grid">
        {loading ? (
          Array.from({ length: 6 }).map((_, i) => <StatCardSkeleton key={i} />)
        ) : (
          <>
            {/* Revenue */}
            <div className="admin-stat-card">
              <div className="stat-header">
                <div className="stat-icon revenue">
                  <IndianRupee size={22} />
                </div>
                <span
                  className={`stat-trend ${stats.revenue.change >= 0 ? "positive" : "negative"}`}
                >
                  {stats.revenue.change >= 0 ? (
                    <ArrowUpRight size={15} />
                  ) : (
                    <ArrowDownRight size={15} />
                  )}
                  {Math.abs(stats.revenue.change)}%
                </span>
              </div>
              <div className="stat-body">
                <h4>Revenue ({periodLabel})</h4>
                <h2>{formatCurrency(stats.revenue.total)}</h2>
                {stats.revenue.refunded > 0 && (
                  <div className="stat-meta">
                    ↩ {formatCurrency(stats.revenue.refunded)} refunded
                  </div>
                )}
              </div>
            </div>

            {/* Avg Order Value */}
            <div className="admin-stat-card">
              <div className="stat-header">
                <div className="stat-icon aov">
                  <TrendingUp size={22} />
                </div>
              </div>
              <div className="stat-body">
                <h4>Avg Order Value</h4>
                <h2>{formatCurrency(stats.avgOrderValue)}</h2>
              </div>
            </div>

            {/* Orders */}
            <div className="admin-stat-card">
              <div className="stat-header">
                <div className="stat-icon orders">
                  <ShoppingBag size={22} />
                </div>
              </div>
              <div className="stat-body">
                <h4>Orders ({periodLabel})</h4>
                <h2>{stats.orders.total}</h2>
                <div className="stat-meta-pills">
                  <span className="pill pill--yellow">
                    {stats.orders.pending} pending
                  </span>
                  <span className="pill pill--green">
                    {stats.orders.delivered} delivered
                  </span>
                  <span className="pill pill--red">
                    {stats.orders.cancelled} cancelled
                  </span>
                </div>
              </div>
            </div>

            {/* Customers */}
            <div className="admin-stat-card">
              <div className="stat-header">
                <div className="stat-icon customers">
                  <Users size={22} />
                </div>
                {stats.customers.new > 0 && (
                  <span className="stat-trend positive">
                    <ArrowUpRight size={15} /> {stats.customers.new} new
                  </span>
                )}
              </div>
              <div className="stat-body">
                <h4>Total Customers</h4>
                <h2>{stats.customers.total}</h2>
                <div className="stat-meta">
                  {stats.customers.new} joined this period
                </div>
              </div>
            </div>

            {/* Products */}
            <div className="admin-stat-card">
              <div className="stat-header">
                <div className="stat-icon products">
                  <Package size={22} />
                </div>
                {stats.products.lowStock > 0 && (
                  <span className="stat-trend warning">
                    <AlertTriangle size={15} /> {stats.products.lowStock} low
                  </span>
                )}
              </div>
              <div className="stat-body">
                <h4>Total Products</h4>
                <h2>{stats.products.total}</h2>
              </div>
            </div>

            {/* Refunds */}
            <div className="admin-stat-card">
              <div className="stat-header">
                <div className="stat-icon refunds">
                  <ArrowDownRight size={22} />
                </div>
              </div>
              <div className="stat-body">
                <h4>Refunds ({periodLabel})</h4>
                <h2>{formatCurrency(stats.refunds?.amount ?? 0)}</h2>
                <div className="stat-meta">
                  {stats.refunds?.count ?? 0} refund
                  {stats.refunds?.count !== 1 ? "s" : ""}
                </div>
              </div>
            </div>
          </>
        )}
      </div>

      {/* ── Main 2-col grid ── */}
      <div className="dashboard-main-grid">
        {/* Left: Sales Chart */}
        <div className="admin-chart-card">
          <div className="card-header">
            <h3>Sales Overview</h3>
            <span className="chart-period-tag">{periodLabel}</span>
          </div>
          <div
            className="chart-container"
            style={{ height: 300, width: "100%", padding: "16px 8px 8px" }}
          >
            {chartLoading ? (
              <div className="chart-skeleton">
                {Array.from({ length: 10 }).map((_, i) => (
                  <div
                    key={i}
                    className="skel-pulse chart-bar-skel"
                    style={{ height: `${35 + (i % 3) * 20}%` }}
                  />
                ))}
              </div>
            ) : chartData.length === 0 ? (
              <div className="empty-state" style={{ height: "100%" }}>
                <p>No sales data for this period.</p>
              </div>
            ) : (
              <ResponsiveContainer>
                <AreaChart
                  data={chartData}
                  margin={{ top: 10, right: 10, left: 0, bottom: 0 }}
                >
                  <defs>
                    <linearGradient
                      id="colorRevenue"
                      x1="0"
                      y1="0"
                      x2="0"
                      y2="1"
                    >
                      <stop
                        offset="5%"
                        stopColor="#10b981"
                        stopOpacity={0.25}
                      />
                      <stop offset="95%" stopColor="#10b981" stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid
                    strokeDasharray="3 3"
                    vertical={false}
                    stroke="#e2e8f0"
                  />
                  <XAxis
                    dataKey="name"
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    interval="preserveStartEnd"
                  />
                  <YAxis
                    axisLine={false}
                    tickLine={false}
                    tick={{ fill: "#64748b", fontSize: 11 }}
                    tickFormatter={(v) => `₹${(v / 1000).toFixed(0)}k`}
                    width={48}
                  />
                  <Tooltip content={<CustomTooltip />} />
                  <Area
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={2.5}
                    fillOpacity={1}
                    fill="url(#colorRevenue)"
                    dot={false}
                    activeDot={{ r: 5, fill: "#10b981", strokeWidth: 0 }}
                  />
                </AreaChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Right col */}
        <div className="dashboard-right-col">
          {/* Recent Orders */}
          <div className="admin-recent-orders-card">
            <div className="card-header">
              <h3>Recent Orders</h3>
              <button
                className="text-link"
                onClick={() => (window.location.href = "/admin/orders")}
              >
                View All
              </button>
            </div>
            <div className="card-table-wrapper">
              {loading ? (
                <div style={{ padding: "16px 24px" }}>
                  {Array.from({ length: 4 }).map((_, i) => (
                    <div
                      key={i}
                      style={{ display: "flex", gap: 12, marginBottom: 14 }}
                    >
                      <Skel w="30%" h={14} />
                      <Skel w="30%" h={14} />
                      <Skel w="20%" h={14} />
                      <Skel w="15%" h={20} r={10} />
                    </div>
                  ))}
                </div>
              ) : stats.recentOrders.length === 0 ? (
                <div className="empty-state">
                  <p>No recent orders found.</p>
                </div>
              ) : (
                <table className="admin-table">
                  <thead>
                    <tr>
                      <th>Order</th>
                      <th>Customer</th>
                      <th>Amount</th>
                      <th>Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {stats.recentOrders.map((order) => (
                      <tr key={order.id}>
                        <td className="font-medium order-num">
                          {order.orderNumber}
                        </td>
                        <td>{order.customerName}</td>
                        <td className="font-medium">
                          {formatCurrency(order.totalAmount)}
                        </td>
                        <td>
                          <span
                            className={`status-badge status-${order.status?.toLowerCase()}`}
                          >
                            {order.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>

          {/* Best Sellers */}
          {!loading && stats.bestSellers?.length > 0 && (
            <div className="admin-chart-card best-sellers-card">
              <div className="card-header">
                <h3>
                  <Award
                    size={16}
                    style={{
                      marginRight: 6,
                      verticalAlign: "middle",
                      color: "#d97706",
                    }}
                  />
                  Best Sellers
                </h3>
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
                        <div className="bs-name">
                          {item.product?.name ?? "Unknown"}
                        </div>
                        <div className="bs-bar-wrap">
                          <div
                            className="bs-bar"
                            style={{ width: `${pct}%` }}
                          />
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

      {/* Error notice */}
      {error && (
        <div className="dashboard-error-notice">
          <WifiOff size={16} /> {error}{" "}
          <button className="text-link" onClick={handleManualRefresh}>
            Retry
          </button>
        </div>
      )}
    </div>
  );
};

export default Dashboard;
