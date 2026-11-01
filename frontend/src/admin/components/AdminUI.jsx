// Small, theme-aware building blocks shared by admin pages.
import React, { useEffect, useState } from "react";
import { ArrowDownRight, ArrowUpRight, Info } from "lucide-react";
import "./AdminUI.css";

export const PERIOD_OPTIONS = [
  { label: "Today", value: "today" },
  { label: "Yesterday", value: "yesterday" },
  { label: "Last 7 days", value: "last7" },
  { label: "Last 30 days", value: "last30" },
  { label: "This month", value: "thisMonth" },
  { label: "Previous month", value: "prevMonth" },
  { label: "Last 90 days", value: "last90" },
  { label: "All time", value: "all" },
];

export const periodLabel = (value) => PERIOD_OPTIONS.find((o) => o.value === value)?.label || "Period";

export const formatINR = (n) =>
  `₹${Number(n || 0).toLocaleString("en-IN", { maximumFractionDigits: 0 })}`;

export function PeriodSelect({ value, onChange, options = PERIOD_OPTIONS }) {
  return (
    <select className="aui-select" value={value} onChange={(e) => onChange(e.target.value)} aria-label="Period">
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
  );
}

/** KPI tile. `change` is a % vs the previous period, or null when not comparable. */
export function KpiCard({ label, value, change = undefined, hint, icon }) {
  const hasChange = typeof change === "number" && Number.isFinite(change);
  return (
    <div className="aui-kpi">
      <div className="aui-kpi-top">
        <span className="aui-kpi-label">{label}</span>
        {icon && <span className="aui-kpi-icon">{icon}</span>}
      </div>
      <div className="aui-kpi-value">{value}</div>
      <div className="aui-kpi-foot">
        {hasChange ? (
          <span className={`aui-change ${change >= 0 ? "is-up" : "is-down"}`}>
            {change >= 0 ? <ArrowUpRight size={13} /> : <ArrowDownRight size={13} />}
            {Math.abs(change)}%
            <span className="aui-change-note">vs previous period</span>
          </span>
        ) : change === null ? (
          <span className="aui-kpi-hint">No earlier data to compare</span>
        ) : null}
        {hint && <span className="aui-kpi-hint">{hint}</span>}
      </div>
    </div>
  );
}

export function Section({ title, subtitle, actions, children, className = "" }) {
  return (
    <section className={`aui-section ${className}`}>
      {(title || actions) && (
        <header className="aui-section-head">
          <div>
            {title && <h3>{title}</h3>}
            {subtitle && <p>{subtitle}</p>}
          </div>
          {actions && <div className="aui-section-actions">{actions}</div>}
        </header>
      )}
      {children}
    </section>
  );
}

/** Horizontal bars, e.g. revenue by category. */
export function BarList({ rows, valueKey = "value", format = (v) => v, labelKey = "label", emptyText = "No data for this period yet." }) {
  const max = Math.max(0, ...rows.map((r) => Number(r[valueKey]) || 0));
  if (!rows.length || max === 0) return <EmptyState text={emptyText} />;
  return (
    <ul className="aui-barlist">
      {rows.map((r, i) => (
        <li key={`${r[labelKey]}-${i}`}>
          <div className="aui-barlist-row">
            <span className="aui-barlist-label" title={r[labelKey]}>{r[labelKey]}</span>
            <span className="aui-barlist-value">{format(r[valueKey], r)}</span>
          </div>
          <div className="aui-barlist-track">
            <span style={{ width: `${Math.max(2, ((Number(r[valueKey]) || 0) / max) * 100)}%` }} />
          </div>
        </li>
      ))}
    </ul>
  );
}

export function EmptyState({ text, children }) {
  return (
    <div className="aui-empty">
      <p>{text}</p>
      {children}
    </div>
  );
}

export function Notice({ children, tone = "info" }) {
  return (
    <div className={`admin-notice ${tone === "warning" ? "is-warning" : ""}`}>
      <Info size={16} />
      <div>{children}</div>
    </div>
  );
}

/** Current theme colours for charts (SVG attributes can't use CSS variables). */
export function useThemeColors() {
  const read = () => {
    const el = document.querySelector(".admin-container") || document.documentElement;
    const cs = getComputedStyle(el);
    const v = (name, fallback) => cs.getPropertyValue(name).trim() || fallback;
    return {
      primary: v("--admin-primary", "#a47e45"),
      accent: v("--admin-accent", "#6e1e2a"),
      text: v("--admin-text-main", "#241b17"),
      muted: v("--admin-text-muted", "#7d6b5a"),
      border: v("--admin-border-light", "#f1ebe2"),
      surface: v("--admin-surface", "#ffffff"),
      success: v("--admin-success", "#2e7d4f"),
      info: v("--admin-info", "#2f5f8a"),
    };
  };
  const [colors, setColors] = useState(read);
  useEffect(() => {
    const el = document.querySelector(".admin-container");
    if (!el) return;
    const observer = new MutationObserver(() => setColors(read()));
    observer.observe(el, { attributes: true, attributeFilter: ["data-theme"] });
    setColors(read());
    return () => observer.disconnect();
  }, []);
  return colors;
}
