import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { IndianRupee, ShoppingBag, Repeat, Users, CreditCard, TrendingUp, RefreshCw } from "lucide-react";
import { adminService } from "../adminService";
import { loadTrackingIntegrations } from "../../lib/tracking";
import {
  BarList, EmptyState, KpiCard, Notice, PeriodSelect, Section, formatINR, periodLabel, useThemeColors,
} from "../components/AdminUI";
import "./AdminPages.css";

// Overview analytics from real orders. Visitor traffic, sources and funnel
// steps need an analytics tool (GA4), so they're linked rather than estimated.
export default function Analytics() {
  const [period, setPeriod] = useState("last30");
  const [data, setData] = useState(null);
  const [chart, setChart] = useState([]);
  const [ga4, setGa4] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const colors = useThemeColors();

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const [overview, series, tracking] = await Promise.all([
        adminService.getAnalytics(period),
        adminService.getSalesChart(period),
        loadTrackingIntegrations().catch(() => null),
      ]);
      setData(overview);
      setChart(series);
      setGa4(tracking?.ga4?.enabled && tracking.ga4.public_id ? tracking.ga4.public_id : null);
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
          <p className="page-subtitle">Sales and customer figures from your orders · {label}</p>
        </div>
        <div className="header-actions">
          <PeriodSelect value={period} onChange={setPeriod} />
          <button className="admin-btn admin-btn-outline icon-left" onClick={load} disabled={loading}>
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

          <Section title="Visitors, traffic sources & funnel">
            {ga4 ? (
              <Notice>
                Google Analytics 4 is connected ({ga4}). Visitor numbers, traffic sources and the shopping funnel
                (product views → add to cart → checkout → purchase) are reported there.{" "}
                <a className="aui-link" href="https://analytics.google.com/analytics/web/" target="_blank" rel="noopener noreferrer">
                  Open Google Analytics
                </a>
              </Notice>
            ) : (
              <Notice tone="warning">
                Visitor and traffic data isn't being collected yet, so it isn't shown here (nothing is estimated). Add your
                Google Analytics 4 Measurement ID in{" "}
                <Link className="aui-link" to="/admin/settings/tracking">Tracking &amp; Pixels</Link> — the store already sends
                product views, add-to-cart, checkout and purchase events.
              </Notice>
            )}
          </Section>
        </>
      )}

      {loading && !data && <div className="admin-loading-state">Loading analytics…</div>}
    </div>
  );
}
