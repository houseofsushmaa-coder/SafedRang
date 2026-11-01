import React, { useCallback, useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { Bar, BarChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { IndianRupee, ShoppingBag, Package, TrendingUp, Layers, XCircle, RefreshCw, Download } from "lucide-react";
import { adminService } from "../adminService";
import {
  BarList, EmptyState, KpiCard, PeriodSelect, Section, formatINR, periodLabel, useThemeColors,
} from "../components/AdminUI";
import "./AdminPages.css";

// Sales report built only from orders in the database.
export default function SalesAnalytics() {
  const [period, setPeriod] = useState("last30");
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const colors = useThemeColors();

  const load = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      setData(await adminService.getSalesAnalytics(period));
    } catch (err) {
      setError(err.message || "Could not load the sales report.");
    } finally {
      setLoading(false);
    }
  }, [period]);

  useEffect(() => {
    load();
  }, [load]);

  const label = periodLabel(period);

  const exportCsv = () => {
    if (!data) return;
    const rows = [
      ["Product", "Units sold", "Revenue (INR)", "Stock left"],
      ...data.topProducts.map((p) => [p.name, p.units, p.revenue, p.stock ?? ""]),
    ];
    const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
    const a = document.createElement("a");
    a.href = URL.createObjectURL(new Blob([csv], { type: "text/csv" }));
    a.download = `safedrang-sales-${period}.csv`;
    a.click();
    URL.revokeObjectURL(a.href);
  };

  const chartProps = {
    tooltip: {
      contentStyle: { background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 8, color: colors.text },
      labelStyle: { color: colors.muted },
      cursor: { fill: colors.border },
    },
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <h2>Sales Report</h2>
          <p className="page-subtitle">What sold, when, and how customers paid · {label}</p>
        </div>
        <div className="header-actions">
          <PeriodSelect value={period} onChange={setPeriod} />
          <button className="admin-btn admin-btn-outline icon-left" onClick={exportCsv} disabled={!data?.topProducts?.length}>
            <Download size={15} /> Export CSV
          </button>
          <button className="admin-btn admin-btn-outline icon-left" onClick={load} disabled={loading}>
            <RefreshCw size={15} /> Refresh
          </button>
        </div>
      </div>

      {error && <div className="aui-error">{error}</div>}

      {data && (
        <>
          <div className="aui-grid aui-grid-kpi">
            <KpiCard label="Net sales (paid)" value={formatINR(data.netSales)} hint={`${data.paidOrders} paid orders`} icon={<IndianRupee size={16} />} />
            <KpiCard label="Orders placed" value={formatINR(data.grossSales)} hint={`${data.ordersPlaced} orders, excluding cancelled`} icon={<ShoppingBag size={16} />} />
            <KpiCard label="Units sold" value={data.unitsSold} hint={data.upt ? `${data.upt} per order` : undefined} icon={<Package size={16} />} />
            <KpiCard label="Average order value" value={data.aov ? formatINR(data.aov) : "—"} icon={<TrendingUp size={16} />} />
            <KpiCard label="Cancelled / returned" value={formatINR(data.cancelledValue)} icon={<XCircle size={16} />} />
            <KpiCard
              label="Unsold live pieces"
              value={data.unsoldInStock}
              hint="In stock, no sales this period"
              icon={<Layers size={16} />}
            />
          </div>

          <div className="aui-grid aui-grid-2">
            <Section title="Revenue by category" subtitle="Paid order lines">
              <BarList
                rows={data.categoryData.map((c) => ({ label: c.name, value: c.revenue, units: c.units, share: c.share }))}
                format={(v, r) => `${formatINR(v)} · ${r.units} units · ${r.share}%`}
              />
            </Section>
            <Section title="Payment methods" subtitle="Orders placed, excluding cancelled">
              <BarList
                rows={data.paymentMethods.map((m) => ({ label: m.method, value: m.orders, share: m.share }))}
                format={(v, r) => `${v} order${v === 1 ? "" : "s"} · ${r.share}%`}
              />
            </Section>
          </div>

          <Section
            title="Top products"
            subtitle="By units sold in paid orders"
            actions={<Link className="aui-link" to="/admin/products">All products</Link>}
          >
            {data.topProducts.length ? (
              <div className="table-responsive">
                <table className="aui-table">
                  <thead>
                    <tr>
                      <th>Product</th>
                      <th className="num">Units</th>
                      <th className="num">Revenue</th>
                      <th className="num">Stock left</th>
                    </tr>
                  </thead>
                  <tbody>
                    {data.topProducts.map((p) => (
                      <tr key={p.id}>
                        <td>{p.name.replace(/"/g, "")}</td>
                        <td className="num">{p.units}</td>
                        <td className="num">{formatINR(p.revenue)}</td>
                        <td className="num">{p.stock ?? "—"}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <EmptyState text="Top products appear here once orders are paid." />
            )}
          </Section>

          <div className="aui-grid aui-grid-2">
            <Section title="Time of day" subtitle="Paid orders by hour (your local time)">
              {data.paidOrders ? (
                <div style={{ width: "100%", height: 220 }}>
                  <ResponsiveContainer>
                    <BarChart data={data.hourlyDistribution}>
                      <CartesianGrid strokeDasharray="3 3" stroke={colors.border} vertical={false} />
                      <XAxis dataKey="hour" stroke={colors.muted} fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis allowDecimals={false} stroke={colors.muted} fontSize={11} tickLine={false} axisLine={false} width={28} />
                      <Tooltip {...chartProps.tooltip} formatter={(v) => [v, "Orders"]} />
                      <Bar dataKey="orders" fill={colors.primary} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState text="No paid orders in this period yet." />
              )}
            </Section>
            <Section title="Day of week" subtitle="Paid orders by weekday">
              {data.paidOrders ? (
                <div style={{ width: "100%", height: 220 }}>
                  <ResponsiveContainer>
                    <BarChart data={data.dayOfWeekTrends}>
                      <CartesianGrid strokeDasharray="3 3" stroke={colors.border} vertical={false} />
                      <XAxis dataKey="day" stroke={colors.muted} fontSize={11} tickLine={false} axisLine={false} />
                      <YAxis allowDecimals={false} stroke={colors.muted} fontSize={11} tickLine={false} axisLine={false} width={28} />
                      <Tooltip {...chartProps.tooltip} formatter={(v) => [v, "Orders"]} />
                      <Bar dataKey="orders" fill={colors.accent} radius={[4, 4, 0, 0]} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              ) : (
                <EmptyState text="No paid orders in this period yet." />
              )}
            </Section>
          </div>
        </>
      )}

      {loading && !data && <div className="admin-loading-state">Loading sales report…</div>}
    </div>
  );
}
