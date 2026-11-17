import React, { useCallback, useEffect, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { IndianRupee, ShoppingBag, Repeat, Users, CreditCard, TrendingUp, RefreshCw } from "lucide-react";
import { adminService } from "../adminService";
import {
  BarList, EmptyState, KpiCard, PeriodSelect, Section, formatINR, periodLabel, useThemeColors,
} from "../components/AdminUI";
import VisitorAnalytics from "../components/VisitorAnalytics";
import "./AdminPages.css";

// Overview: sales from real orders, plus first-party visitor analytics
// (visits, sources, funnel, each visitor's journey) from public.site_events.
export default function Analytics() {
  const [period, setPeriod] = useState("last30");
  const [data, setData] = useState(null);
  const [chart, setChart] = useState([]);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [refreshKey, setRefreshKey] = useState(0);
  const colors = useThemeColors();

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [overview, series] = await Promise.all([adminService.getAnalytics(period), adminService.getSalesChart(period)]);
      setData(overview);
      setChart(series);
    } catch (err) {
      setError(err.message || "Could not load analytics.");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    load();
  }, [load]);

  const label = periodLabel(period);
  const hasSales = chart.some((p) => p.revenue > 0);

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <h2>Overview</h2>
          <p className="page-subtitle">Sales from your orders and how visitors use the site · {label}</p>
        </div>
        <div className="header-actions">
          <PeriodSelect value={period} onChange={setPeriod} />
          <button
            className="admin-btn admin-btn-outline icon-left"
            onClick={() => {
              load();
              setRefreshKey((n) => n + 1);
            }}
            disabled={loading}
          >
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      {error && <div className="aui-error">{error}</div>}

      {data && (
        <>
          <div className="aui-grid aui-grid-kpi">
            <KpiCard label="Revenue (paid)" value={formatINR(data.revenue.total)} change={data.revenue.change} icon={<IndianRupee size={16} />} />
            <KpiCard
              label="Orders placed"
              value={data.orders.total}
              change={data.orders.change}
              hint={`${data.orders.paid} paid · ${data.orders.cancelled} cancelled`}
              icon={<ShoppingBag size={16} />}
            />
            <KpiCard label="Average order value" value={data.avgOrderValue ? formatINR(data.avgOrderValue) : "—"} icon={<TrendingUp size={16} />} />
            <KpiCard
              label="Online payment completion"
              value={data.onlineCheckout.rate === null ? "—" : `${data.onlineCheckout.rate}%`}
              hint={`${data.onlineCheckout.paid} of ${data.onlineCheckout.started} online checkouts paid`}
              icon={<CreditCard size={16} />}
            />
            <KpiCard
              label="Repeat customers"
              value={data.repeatCustomerRate === null ? "—" : `${data.repeatCustomerRate}%`}
              hint={`${data.repeatBuyers} of ${data.buyers} buyers ordered again (all time)`}
              icon={<Repeat size={16} />}
            />
            <KpiCard label="Customer accounts" value={data.customers.total} hint={`${data.customers.new} new in this period`} icon={<Users size={16} />} />
          </div>

          <h3 className="va-heading">Visitors &amp; behaviour</h3>
          <VisitorAnalytics period={period} label={label} refreshKey={refreshKey} />

          <h3 className="va-heading">Sales</h3>
          <Section title="Revenue" subtitle={`Paid orders per day · ${label}`}>
            {hasSales ? (
              <div style={{ width: "100%", height: 280 }}>
                <ResponsiveContainer>
                  <AreaChart data={chart} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                    <defs>
                      <linearGradient id="an-rev" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor={colors.primary} stopOpacity={0.35} />
                        <stop offset="100%" stopColor={colors.primary} stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke={colors.border} vertical={false} />
                    <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} stroke={colors.muted} fontSize={11} tickLine={false} axisLine={false} />
                    <YAxis stroke={colors.muted} fontSize={11} tickLine={false} axisLine={false} tickFormatter={(v) => (v >= 1000 ? `₹${Math.round(v / 1000)}k` : `₹${v}`)} width={56} />
                    <Tooltip
                      formatter={(v, name) => (name === "revenue" ? [formatINR(v), "Revenue"] : [v, "Orders"])}
                      contentStyle={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 8, color: colors.text }}
                      labelStyle={{ color: colors.muted }}
                    />
                    <Area type="monotone" dataKey="revenue" stroke={colors.primary} strokeWidth={2} fill="url(#an-rev)" />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            ) : (
              <EmptyState text={`No paid orders in ${label.toLowerCase()} yet.`} />
            )}
          </Section>

          <div className="aui-grid aui-grid-2">
            <Section title="Best sellers" subtitle="Units sold in paid orders">
              <BarList
                rows={data.bestSellers.map((b) => ({ label: b.product.name, value: b._sum.quantity, revenue: b.revenue }))}
                format={(v, r) => `${v} sold · ${formatINR(r.revenue)}`}
                emptyText="Best sellers appear here once orders are paid."
              />
            </Section>

            <Section title="How customers pay" subtitle={`Orders placed · ${label}`}>
              <BarList
                rows={[
                  { label: "Online (UPI, cards, netbanking)", value: data.orders.online },
                  { label: "Cash on Delivery", value: data.orders.cod },
                ]}
                format={(v) => `${v} order${v === 1 ? "" : "s"}`}
                emptyText="No orders in this period yet."
              />
            </Section>
          </div>

        </>
      )}

      {loading && !data && <div className="admin-loading-state">Loading analytics…</div>}
    </div>
  );
}
