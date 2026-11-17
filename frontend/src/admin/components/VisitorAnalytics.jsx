import React, { Fragment, useEffect, useMemo, useState } from "react";
import { Area, AreaChart, CartesianGrid, ResponsiveContainer, Tooltip, XAxis, YAxis } from "recharts";
import { Users, Eye, ShoppingBag, MousePointerClick, Target, Timer, ChevronDown, ChevronRight, ExternalLink } from "lucide-react";
import { getVisitorAnalytics } from "../visitorAnalytics";
import { BarList, EmptyState, KpiCard, Notice, Section, formatINR, useThemeColors } from "./AdminUI";
import "./VisitorAnalytics.css";

const EVENT_TEXT = {
  page_view: "Viewed page",
  view_item: "Viewed product",
  search: "Searched",
  add_to_wishlist: "Added to wishlist",
  add_to_cart: "Added to bag",
  remove_from_cart: "Removed from bag",
  begin_checkout: "Started checkout",
  add_payment_info: "Chose payment",
  purchase: "Placed order",
  whatsapp_click: "Tapped WhatsApp",
};

const fmtTime = (iso) =>
  new Date(iso).toLocaleString("en-IN", { day: "numeric", month: "short", hour: "2-digit", minute: "2-digit" });
const fmtDuration = (sec) => (sec < 60 ? `${sec}s` : `${Math.floor(sec / 60)}m ${sec % 60}s`);

const FILTERS = [
  ["all", "All visits"],
  ["added", "Added to bag"],
  ["checkout", "Reached checkout"],
  ["ordered", "Ordered"],
  ["left", "Added but didn't order"],
];

export default function VisitorAnalytics({ period, label, refreshKey }) {
  const [data, setData] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState("all");
  const [query, setQuery] = useState("");
  const [open, setOpen] = useState(null);
  const [limit, setLimit] = useState(50);
  const colors = useThemeColors();

  useEffect(() => {
    let alive = true;
    setLoading(true);
    setError("");
    getVisitorAnalytics(period)
      .then((d) => alive && setData(d))
      .catch((err) => alive && setError(err.message || "Could not load visitor data."))
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, [period, refreshKey]);

  const sessions = useMemo(() => {
    if (!data?.sessions) return [];
    const q = query.trim().toLowerCase();
    return data.sessions.filter((s) => {
      if (filter === "added" && !s.adds) return false;
      if (filter === "checkout" && !s.checkout) return false;
      if (filter === "ordered" && !s.orderId) return false;
      if (filter === "left" && (!s.adds || s.orderId)) return false;
      if (q && ![s.ip, s.location, s.source, s.device, s.browser, s.landing].some((v) => String(v || "").toLowerCase().includes(q))) return false;
      return true;
    });
  }, [data, filter, query]);

  if (loading && !data) return <div className="admin-loading-state">Loading visitors…</div>;
  if (error) return <div className="aui-error">{error}</div>;
  if (!data) return null;

  if (data.missing) {
    return (
      <Notice tone="warning">
        Visitor tracking is installed on the site but its table isn't created yet. Run{" "}
        <strong>supabase/analytics_and_orders_setup.sql</strong> in Supabase → SQL Editor, and visits will start appearing here.
      </Notice>
    );
  }

  const t = data.totals;
  const hasTraffic = t.sessions > 0;

  return (
    <div className="va">
      <div className="aui-grid aui-grid-kpi">
        <KpiCard label="Visitors" value={t.visitors} hint={`${t.sessions} visits · ${t.returning} from returning visitors`} icon={<Users size={16} />} />
        <KpiCard label="Page views" value={t.pageViews} hint={`${t.productViews} product views`} icon={<Eye size={16} />} />
        <KpiCard label="Added to bag" value={t.addToCarts} hint={`${data.funnel[2].value} visits added something`} icon={<ShoppingBag size={16} />} />
        <KpiCard label="Reached checkout" value={t.checkouts} hint={`${t.orders} placed an order`} icon={<MousePointerClick size={16} />} />
        <KpiCard
          label="Conversion rate"
          value={t.conversion === null ? "—" : `${t.conversion}%`}
          hint="Visits that ended in an order"
          icon={<Target size={16} />}
        />
        <KpiCard
          label="Time on site"
          value={hasTraffic ? fmtDuration(t.avgDuration) : "—"}
          hint={t.bounceRate === null ? "Average per visit" : `${t.bounceRate}% left after one page`}
          icon={<Timer size={16} />}
        />
      </div>

      {!hasTraffic ? (
        <Section title="Visitors">
          <EmptyState text={`No visits recorded in ${label.toLowerCase()} yet. Visits appear here within a minute of someone opening the site (your own browser is not counted).`} />
        </Section>
      ) : (
        <>
          <Section title="Visitors per day" subtitle={label}>
            <div style={{ width: "100%", height: 220 }}>
              <ResponsiveContainer>
                <AreaChart data={data.dailySeries} margin={{ top: 8, right: 8, left: 0, bottom: 0 }}>
                  <defs>
                    <linearGradient id="va-vis" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="0%" stopColor={colors.accent || colors.primary} stopOpacity={0.3} />
                      <stop offset="100%" stopColor={colors.accent || colors.primary} stopOpacity={0} />
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" stroke={colors.border} vertical={false} />
                  <XAxis dataKey="date" tickFormatter={(d) => d.slice(5)} stroke={colors.muted} fontSize={11} tickLine={false} axisLine={false} />
                  <YAxis allowDecimals={false} stroke={colors.muted} fontSize={11} tickLine={false} axisLine={false} width={32} />
                  <Tooltip
                    formatter={(v) => [v, "Visitors"]}
                    contentStyle={{ background: colors.surface, border: `1px solid ${colors.border}`, borderRadius: 8, color: colors.text }}
                    labelStyle={{ color: colors.muted }}
                  />
                  <Area type="monotone" dataKey="visitors" stroke={colors.accent || colors.primary} strokeWidth={2} fill="url(#va-vis)" />
                </AreaChart>
              </ResponsiveContainer>
            </div>
          </Section>

          <Section title="Shopping funnel" subtitle="How far visits get — the biggest drop is where to improve first">
            <div className="va-funnel">
              {data.funnel.map((step, i) => (
                <div key={step.label} className="va-funnel-step">
                  <div className="va-funnel-head">
                    <span>{step.label}</span>
                    <strong>{step.value}</strong>
                  </div>
                  <div className="va-funnel-track">
                    <span style={{ width: `${Math.max(step.value ? 2 : 0, step.ofTotal ?? 0)}%` }} />
                  </div>
                  <div className="va-funnel-meta">
                    {i === 0 ? "100% of visits" : `${step.ofTotal ?? 0}% of visits · ${step.fromPrev ?? 0}% of the step before`}
                  </div>
                </div>
              ))}
            </div>
          </Section>

          <div className="aui-grid aui-grid-2">
            <Section title="Where visitors come from" subtitle="By visit (UTM tag or referring site)">
              <BarList rows={data.sources} format={(v) => `${v} visit${v === 1 ? "" : "s"}`} />
            </Section>
            <Section title="Location" subtitle="From IP country, or the visitor's time zone">
              <BarList rows={data.locations} format={(v) => `${v} visit${v === 1 ? "" : "s"}`} />
            </Section>
          </div>

          <div className="aui-grid aui-grid-2">
            <Section title="Devices & browsers">
              <BarList rows={data.devices} format={(v) => `${v} visit${v === 1 ? "" : "s"}`} />
              <div style={{ height: 14 }} />
              <BarList rows={data.browsers} format={(v) => `${v}`} />
            </Section>
            <Section title="Landing pages" subtitle="First page of each visit">
              <BarList rows={data.landings} format={(v) => `${v}`} />
            </Section>
          </div>

          <div className="aui-grid aui-grid-2">
            <Section title="Most viewed products">
              <BarList rows={data.productViews} format={(v) => `${v} view${v === 1 ? "" : "s"}`} emptyText="No product views yet." />
            </Section>
            <Section title="Most added to bag">
              <BarList rows={data.productAdds} format={(v) => `${v} added`} emptyText="Nothing added to a bag yet." />
            </Section>
          </div>

          <div className="aui-grid aui-grid-2">
            <Section title="Viewed often, rarely added" subtitle="Worth checking photos, price, size info or description">
              {data.lookedNotBought.length ? (
                <BarList rows={data.lookedNotBought} format={(v, r) => `${v} views · ${r.adds} added (${r.rate ?? 0}%)`} />
              ) : (
                <EmptyState text="Shows products with 3+ views once there's enough traffic." />
              )}
            </Section>
            <Section title="What people searched for">
              <BarList rows={data.searches} format={(v) => `${v}×`} emptyText="No searches yet." />
            </Section>
          </div>

          <Section
            title="Visitors"
            subtitle={`${sessions.length} of ${data.sessions.length} visits · click a row to see the visit step by step`}
            actions={
              <input
                className="admin-input va-search"
                placeholder="Search IP, place, source…"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
              />
            }
          >
            <div className="va-filters">
              {FILTERS.map(([key, text]) => (
                <button key={key} type="button" className={`va-chip ${filter === key ? "is-active" : ""}`} onClick={() => setFilter(key)}>
                  {text}
                </button>
              ))}
            </div>
            <div className="table-responsive">
              <table className="aui-table va-table">
                <thead>
                  <tr>
                    <th />
                    <th>When</th>
                    <th>IP address</th>
                    <th>Location</th>
                    <th>Device</th>
                    <th>Came from</th>
                    <th className="num">Pages</th>
                    <th className="num">Products</th>
                    <th>Outcome</th>
                  </tr>
                </thead>
                <tbody>
                  {sessions.slice(0, limit).map((s) => (
                    <Fragment key={s.id}>
                      <tr className={`va-row ${open === s.id ? "is-open" : ""}`} onClick={() => setOpen(open === s.id ? null : s.id)}>
                        <td>{open === s.id ? <ChevronDown size={14} /> : <ChevronRight size={14} />}</td>
                        <td>
                          {fmtTime(s.start)}
                          <div className="va-sub">{fmtDuration(s.durationSec)}{s.returning ? " · returning" : ""}</div>
                        </td>
                        <td className="va-mono">{s.ip || "—"}</td>
                        <td>{s.location}</td>
                        <td>
                          {s.device}
                          <div className="va-sub">{[s.os, s.browser].filter(Boolean).join(" · ")}</div>
                        </td>
                        <td>
                          {s.source}
                          {s.campaign && <div className="va-sub">{s.campaign}</div>}
                        </td>
                        <td className="num">{s.pages}</td>
                        <td className="num">{s.views}</td>
                        <td>
                          {s.orderId ? (
                            <span className="va-tag is-ordered">Ordered{s.orderValue ? ` · ${formatINR(s.orderValue)}` : ""}</span>
                          ) : s.checkout ? (
                            <span className="va-tag is-checkout">Left at checkout</span>
                          ) : s.adds ? (
                            <span className="va-tag is-added">Left with {s.adds} in bag</span>
                          ) : (
                            <span className="va-tag">Browsed</span>
                          )}
                        </td>
                      </tr>
                      {open === s.id && (
                        <tr className="va-journey-row">
                          <td />
                          <td colSpan={8}>
                            <ol className="va-journey">
                              {s.events.map((e) => (
                                <li key={e.id}>
                                  <span className="va-journey-time">
                                    {new Date(e.created_at).toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit", second: "2-digit" })}
                                  </span>
                                  <span className="va-journey-event">{EVENT_TEXT[e.event] || e.event}</span>
                                  <span className="va-journey-detail">
                                    {e.product_title || e.search_term || (e.order_id ? `Order ${e.order_id}` : "") || e.path}
                                    {e.event === "add_to_cart" && e.quantity > 1 ? ` × ${e.quantity}` : ""}
                                  </span>
                                </li>
                              ))}
                            </ol>
                            <div className="va-sub" style={{ marginTop: 6 }}>
                              Visitor {s.visitor.slice(0, 8)} · Landing: {s.landing || "—"}
                            </div>
                          </td>
                        </tr>
                      )}
                    </Fragment>
                  ))}
                </tbody>
              </table>
            </div>
            {sessions.length === 0 && <EmptyState text="No visits match this filter." />}
            {sessions.length > limit && (
              <button type="button" className="admin-btn admin-btn-outline" style={{ marginTop: 12 }} onClick={() => setLimit((n) => n + 100)}>
                Show more ({sessions.length - limit} left)
              </button>
            )}
          </Section>
        </>
      )}

      <Notice>
        Want to watch how people actually use the site (scrolls, taps, rage-clicks)? Session recordings and heatmaps are in{" "}
        <a className="aui-link" href="https://clarity.microsoft.com/projects" target="_blank" rel="noopener noreferrer">
          Microsoft Clarity <ExternalLink size={12} style={{ verticalAlign: "-1px" }} />
        </a>
        . IP addresses are personal data — mention visitor analytics in your privacy policy.
        {data.truncated ? " Showing the first 30,000 events of this period." : ""}
      </Notice>
    </div>
  );
}
