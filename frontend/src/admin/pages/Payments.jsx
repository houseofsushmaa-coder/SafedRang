import React, { useEffect, useState, useCallback } from "react";
import axios from "axios";
import {
  CreditCard, Search, IndianRupee, Eye, CheckCircle2, XCircle,
  Clock, Loader2, Filter, Download,
} from "lucide-react";
import "./AdminPages.css";

import { API_BASE, getAuthHeaders, formatINR } from "../../config/api.js";

const STATUS_CONFIG = {
  PAID: { label: "Paid", cls: "status-delivered", icon: <CheckCircle2 size={13} /> },
  PENDING: { label: "Pending", cls: "status-pending", icon: <Clock size={13} /> },
  FAILED: { label: "Failed", cls: "status-cancelled", icon: <XCircle size={13} /> },
  REFUNDED: { label: "Refunded", cls: "status-processing", icon: <IndianRupee size={13} /> },
};

const Skel = ({ w = "100%", h = 16, r = 4, mb = 0 }) => (
  <div className="skel-pulse" style={{ width: w, height: h, borderRadius: r, marginBottom: mb }} />
);

const Payments = () => {
  const [payments, setPayments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [page, setPage] = useState(1);
  const [total, setTotal] = useState(0);
  const PER_PAGE = 20;

  const fetchPayments = useCallback(async () => {
    setLoading(true);
    try {
      const res = await axios.get(`${API_BASE}/payments`, {
        headers: getAuthHeaders(),
        params: { page, limit: PER_PAGE, status: statusFilter !== "ALL" ? statusFilter : undefined, search: search || undefined },
      });
      setPayments(res.data.data?.payments ?? res.data.data ?? []);
      setTotal(res.data.meta?.total ?? res.data.total ?? 0);
    } catch (err) {
      console.error("Payments fetch failed:", err);
      // Fallback: try fetching via orders
      setPayments([]);
    } finally {
      setLoading(false);
    }
  }, [page, statusFilter, search]);

  useEffect(() => { fetchPayments(); }, [fetchPayments]);

  const summaryCards = [
    {
      label: "Total Collected",
      value: formatINR(payments.filter((p) => p.status === "PAID").reduce((s, p) => s + (p.amount ?? 0), 0)),
      icon: <IndianRupee size={20} />,
      cls: "revenue",
    },
    {
      label: "Paid",
      value: payments.filter((p) => p.status === "PAID").length,
      icon: <CheckCircle2 size={20} />,
      cls: "orders",
    },
    {
      label: "Pending",
      value: payments.filter((p) => p.status === "PENDING").length,
      icon: <Clock size={20} />,
      cls: "customers",
    },
    {
      label: "Failed",
      value: payments.filter((p) => p.status === "FAILED").length,
      icon: <XCircle size={20} />,
      cls: "refunds",
    },
  ];

  const filtered = payments.filter((p) => {
    const matchStatus = statusFilter === "ALL" || p.status === statusFilter;
    const matchSearch =
      !search ||
      p.id?.toLowerCase().includes(search.toLowerCase()) ||
      p.transactionId?.toLowerCase().includes(search.toLowerCase()) ||
      p.orderId?.toLowerCase().includes(search.toLowerCase());
    return matchStatus && matchSearch;
  });

  return (
    <div className="admin-page">
      {/* Header */}
      <div className="page-header">
        <div>
          <h2>Payments</h2>
          <p className="page-subtitle">Track all payment transactions</p>
        </div>
        <div className="header-actions">
          <button className="admin-btn admin-btn-outline icon-left" onClick={fetchPayments}>
            <Download size={15} /> Export
          </button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="dashboard-stats-grid" style={{ marginBottom: 24 }}>
        {summaryCards.map((c) => (
          <div key={c.label} className="admin-stat-card">
            <div className="stat-header">
              <div className={`stat-icon ${c.cls}`}>{c.icon}</div>
            </div>
            <div className="stat-body">
              <h4>{c.label}</h4>
              <h2>{c.value}</h2>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div className="admin-table-card">
        <div className="table-toolbar">
          <div className="toolbar-search">
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search by order ID, transaction ID…"
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              id="payments-search"
            />
          </div>
          <div style={{ display: "flex", gap: 10, alignItems: "center" }}>
            <Filter size={15} color="var(--admin-text-muted)" />
            <select
              className="admin-select"
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(1); }}
              id="payments-status-filter"
            >
              <option value="ALL">All Status</option>
              <option value="PAID">Paid</option>
              <option value="PENDING">Pending</option>
              <option value="FAILED">Failed</option>
              <option value="REFUNDED">Refunded</option>
            </select>
          </div>
        </div>

        {loading ? (
          <div style={{ padding: "20px 24px" }}>
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} style={{ display: "flex", gap: 16, marginBottom: 20 }}>
                <Skel w="20%" h={14} />
                <Skel w="25%" h={14} />
                <Skel w="15%" h={14} />
                <Skel w="15%" h={22} r={10} />
                <Skel w="15%" h={14} />
              </div>
            ))}
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <CreditCard size={48} className="empty-icon" />
            <h3>No payments found</h3>
            <p>Payment records will appear here once transactions occur.</p>
          </div>
        ) : (
          <>
            <div className="table-responsive">
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Transaction ID</th>
                    <th>Method</th>
                    <th>Amount</th>
                    <th>Status</th>
                    <th>Date</th>
                    <th className="text-right">Action</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((p) => {
                    const sc = STATUS_CONFIG[p.status] ?? STATUS_CONFIG.PENDING;
                    return (
                      <tr key={p.id}>
                        <td className="font-medium order-num">{p.orderId ?? p.id}</td>
                        <td style={{ fontSize: "0.82rem", color: "var(--admin-text-muted)" }}>
                          {p.transactionId ?? "—"}
                        </td>
                        <td>
                          <span className="category-badge">{p.method ?? p.gateway ?? "—"}</span>
                        </td>
                        <td className="font-medium">{formatINR(p.amount)}</td>
                        <td>
                          <span className={`status-badge ${sc.cls}`} style={{ display: "inline-flex", alignItems: "center", gap: 4 }}>
                            {sc.icon} {sc.label}
                          </span>
                        </td>
                        <td style={{ fontSize: "0.85rem", color: "var(--admin-text-muted)" }}>
                          {p.createdAt ? new Date(p.createdAt).toLocaleDateString("en-IN", { day: "2-digit", month: "short", year: "2-digit" }) : "—"}
                        </td>
                        <td>
                          <div className="action-buttons">
                            <button className="action-btn" title="View Order" id={`view-payment-${p.id}`}
                              onClick={() => window.location.href = `/admin/orders`}>
                              <Eye size={15} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {total > PER_PAGE && (
              <div className="pagination-bar">
                <button className="admin-btn admin-btn-outline" disabled={page === 1} onClick={() => setPage((p) => p - 1)}>
                  Prev
                </button>
                <span style={{ fontSize: "0.85rem", color: "var(--admin-text-muted)" }}>
                  Page {page} of {Math.ceil(total / PER_PAGE)}
                </span>
                <button className="admin-btn admin-btn-outline" disabled={page * PER_PAGE >= total} onClick={() => setPage((p) => p + 1)}>
                  Next
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default Payments;
