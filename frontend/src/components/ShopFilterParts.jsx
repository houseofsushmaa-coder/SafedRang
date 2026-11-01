import { useEffect, useMemo, useRef, useState } from "react";

const formatRs = (n) => `₹${Math.round(n).toLocaleString("en-IN")}`;

/* ── Collapsible filter section (dropdown) ── */
export function FilterSection({ id, title, summary, open, onToggle, children }) {
  return (
    <section className={`fsec ${open ? "is-open" : ""}`}>
      <h3 className="fsec-heading">
        <button
          type="button"
          className="fsec-head"
          aria-expanded={open}
          aria-controls={`fsec-${id}`}
          onClick={onToggle}
        >
          <span className="fsec-title">{title}</span>
          {summary ? <span className="fsec-summary">{summary}</span> : null}
          <svg className="fsec-chevron" width="12" height="8" viewBox="0 0 12 8" fill="none" aria-hidden="true">
            <path d="M1 1.5L6 6.5L11 1.5" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </button>
      </h3>
      <div className="fsec-body" id={`fsec-${id}`} inert={!open}>
        <div className="fsec-inner">{children}</div>
      </div>
    </section>
  );
}

/* ── Checkbox list with optional search and "show more" ── */
export function CheckList({ name, options, selected, onToggle, limit = 6, searchable = false }) {
  const [query, setQuery] = useState("");
  const [expanded, setExpanded] = useState(false);

  const filtered = useMemo(() => {
    const q = query.trim().toLowerCase();
    return q ? options.filter((o) => o.label.toLowerCase().includes(q)) : options;
  }, [options, query]);

  // Selected options always stay visible, even when the list is collapsed.
  const visible = expanded || query
    ? filtered
    : filtered.filter((o, i) => i < limit || selected.includes(o.value));
  const hiddenCount = filtered.length - visible.length;

  return (
    <div className="fcheck">
      {searchable && options.length > limit && (
        <div className="fcheck-search">
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
            <circle cx="11" cy="11" r="7" />
            <line x1="20" y1="20" x2="16.5" y2="16.5" />
          </svg>
          <input
            type="search"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={`Search ${name.toLowerCase()}…`}
            aria-label={`Search ${name.toLowerCase()}`}
          />
        </div>
      )}

      <ul className="fcheck-list">
        {visible.map((o) => {
          const checked = selected.includes(o.value);
          const disabled = !checked && o.count === 0;
          return (
            <li key={o.value}>
              <label className={`fcheck-item ${checked ? "is-checked" : ""} ${disabled ? "is-disabled" : ""}`}>
                <input type="checkbox" checked={checked} disabled={disabled} onChange={() => onToggle(o.value)} />
                <span className="fcheck-box" aria-hidden="true" />
                <span className="fcheck-label">{o.label}</span>
                <span className="fcheck-count">{o.count}</span>
              </label>
            </li>
          );
        })}
        {visible.length === 0 && <li className="fcheck-empty">No match for “{query}”</li>}
      </ul>

      {!query && (hiddenCount > 0 || expanded) && filtered.length > limit && (
        <button type="button" className="fcheck-more" onClick={() => setExpanded((v) => !v)}>
          {expanded ? "Show less" : `Show all ${filtered.length}`}
        </button>
      )}
    </div>
  );
}

/* ── Price: histogram + two-thumb slider + min/max boxes + quick picks ── */
export function PriceFilter({ bounds, min, max, prices, presets, onCommit }) {
  const lo = min ?? bounds.min;
  const hi = max ?? bounds.max;
  const [draft, setDraft] = useState([lo, hi]);
  const [text, setText] = useState([String(lo), String(hi)]);
  const timer = useRef(null);

  useEffect(() => {
    setDraft([lo, hi]);
    setText([String(lo), String(hi)]);
  }, [lo, hi]);

  useEffect(() => () => clearTimeout(timer.current), []);

  const span = Math.max(1, bounds.max - bounds.min);
  const pct = (v) => ((v - bounds.min) / span) * 100;

  const commit = (a, b) => {
    clearTimeout(timer.current);
    const nextMin = a <= bounds.min ? null : a;
    const nextMax = b >= bounds.max ? null : b;
    if (nextMin !== min || nextMax !== max) onCommit(nextMin, nextMax);
  };

  // While dragging, update the view immediately and apply once the hand pauses.
  const slide = (which) => (e) => {
    const v = Number(e.target.value);
    const next = which === 0 ? [Math.min(v, draft[1] - 100), draft[1]] : [draft[0], Math.max(v, draft[0] + 100)];
    setDraft(next);
    setText([String(next[0]), String(next[1])]);
    clearTimeout(timer.current);
    timer.current = setTimeout(() => commit(next[0], next[1]), 400);
  };

  const applyText = () => {
    let a = parseInt(String(text[0]).replace(/[^\d]/g, ""), 10);
    let b = parseInt(String(text[1]).replace(/[^\d]/g, ""), 10);
    if (!Number.isFinite(a)) a = bounds.min;
    if (!Number.isFinite(b)) b = bounds.max;
    a = Math.max(bounds.min, Math.min(a, bounds.max));
    b = Math.max(bounds.min, Math.min(b, bounds.max));
    if (a > b) [a, b] = [b, a];
    setDraft([a, b]);
    setText([String(a), String(b)]);
    commit(a, b);
  };

  // Small histogram of where pieces sit on the price scale.
  const BUCKETS = 24;
  const bars = useMemo(() => {
    const counts = new Array(BUCKETS).fill(0);
    prices.forEach((p) => {
      if (!Number.isFinite(p)) return;
      const i = Math.min(BUCKETS - 1, Math.max(0, Math.floor(((p - bounds.min) / span) * BUCKETS)));
      counts[i] += 1;
    });
    const peak = Math.max(1, ...counts);
    return counts.map((c) => c / peak);
  }, [prices, bounds.min, span]);

  return (
    <div className="fprice">
      <div className="fprice-hist" aria-hidden="true">
        {bars.map((h, i) => {
          const centre = bounds.min + ((i + 0.5) / BUCKETS) * span;
          const inRange = centre >= draft[0] && centre <= draft[1];
          return <span key={i} className={inRange ? "in" : ""} style={{ height: `${Math.max(h * 100, h ? 8 : 3)}%` }} />;
        })}
      </div>

      <div className="fprice-slider">
        <div className="fprice-track" />
        <div className="fprice-fill" style={{ left: `${pct(draft[0])}%`, right: `${100 - pct(draft[1])}%` }} />
        <input
          type="range"
          min={bounds.min}
          max={bounds.max}
          step={100}
          value={draft[0]}
          onChange={slide(0)}
          aria-label="Minimum price"
          aria-valuetext={formatRs(draft[0])}
        />
        <input
          type="range"
          min={bounds.min}
          max={bounds.max}
          step={100}
          value={draft[1]}
          onChange={slide(1)}
          aria-label="Maximum price"
          aria-valuetext={formatRs(draft[1])}
        />
      </div>

      <form
        className="fprice-inputs"
        onSubmit={(e) => {
          e.preventDefault();
          applyText();
        }}
      >
        <label>
          <span>Min</span>
          <div className="fprice-box">
            <i>₹</i>
            <input
              inputMode="numeric"
              value={text[0]}
              onChange={(e) => setText([e.target.value, text[1]])}
              onBlur={applyText}
              aria-label="Minimum price in rupees"
            />
          </div>
        </label>
        <span className="fprice-dash">–</span>
        <label>
          <span>Max</span>
          <div className="fprice-box">
            <i>₹</i>
            <input
              inputMode="numeric"
              value={text[1]}
              onChange={(e) => setText([text[0], e.target.value])}
              onBlur={applyText}
              aria-label="Maximum price in rupees"
            />
          </div>
        </label>
        <button type="submit" hidden />
      </form>

      <div className="fprice-presets">
        {presets.map((p) => (
          <button
            key={p.id}
            type="button"
            className={`fpill ${p.active ? "is-active" : ""}`}
            disabled={!p.active && p.count === 0}
            onClick={() => (p.active ? onCommit(null, null) : onCommit(p.min, p.max))}
          >
            {p.label}
            <span>{p.count}</span>
          </button>
        ))}
      </div>
    </div>
  );
}
