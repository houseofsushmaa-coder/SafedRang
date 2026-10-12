import React, { useState, useEffect } from "react";
import {
  Eye,
  Edit,
  Filter,
  Search,
  Download,
  Trash2,
  ShoppingCart,
  X,
  CheckCircle,
  Clock,
  Truck,
  Package,
} from "lucide-react";
import "./AdminPages.css";
import { formatINR } from "../../config/api.js";
import { adminService } from "../adminService";
import Papa from "papaparse";

const STATUS_OPTIONS = ["ALL", "PENDING", "PAID", "PROCESSING", "SHIPPED", "DELIVERED", "CANCELLED"];

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [updating, setUpdating] = useState(false);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const data = await adminService.getOrders();
      setOrders(data || []);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (status) => {
    switch (status?.toUpperCase()) {
      case "PAID":
      case "COMPLETED":
      case "DELIVERED":
        return "status-completed";
      case "PENDING":
        return "status-pending";
      case "PROCESSING":
      case "SHIPPED":
        return "status-processing";
      case "CANCELLED":
      case "REFUNDED":
      case "FAILED":
        return "status-cancelled";
      default:
        return "status-processing";
    }
  };

  const handleStatusUpdate = async (e) => {
    e.preventDefault();
    if (!editingOrder || !newStatus) return;

    setUpdating(true);
    try {
      await adminService.updateOrderStatus(editingOrder.id, newStatus);
      setEditingOrder(null);
      fetchOrders();
    } catch (err) {
      alert("Failed to update status: " + err.message);
    } finally {
      setUpdating(false);
    }
  };

  const handleExport = () => {
    try {
      const csvData = filteredOrders.map((o) => ({
        "Order ID": o.id,
        Date: new Date(o.createdAt).toLocaleString("en-IN"),
        Customer: `${o.customer?.firstName || ""} ${o.customer?.lastName || ""}`.trim(),
        Email: o.customer?.email || "",
        Phone: o.customer?.phone || "",
        Total: o.total,
        Status: o.orderStatus,
        Payment: o.paymentMethod,
        Items: o.items?.map((it) => `${it.title} (x${it.quantity})`).join(", ") || "",
      }));

      const csv = Papa.unparse(csvData);
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.setAttribute("download", `Safedrang_Orders_${Date.now()}.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (err) {
      alert("Failed to export orders.");
    }
  };

  const filteredOrders = orders.filter((o) => {
    const matchesSearch =
      o.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      o.id?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      `${o.customer?.firstName} ${o.customer?.lastName}`
        .toLowerCase()
        .includes(searchTerm.toLowerCase()) ||
      o.customer?.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus =
      statusFilter === "ALL" ||
      (o.orderStatus || "").toUpperCase() === statusFilter.toUpperCase();

    return matchesSearch && matchesStatus;
  });

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <h2>Orders</h2>
          <p className="page-subtitle">Manage, view, and update customer order fulfillments.</p>
        </div>
        <div className="header-actions">
          <button
            onClick={handleExport}
            className="admin-btn admin-btn-outline icon-left"
            disabled={orders.length === 0}
          >
            <Download size={16} /> Export Orders
          </button>
        </div>
      </div>

      <div className="admin-table-card">
        <div className="table-toolbar">
          <div className="toolbar-search">
            <Search size={18} className="search-icon" />
            <input
              type="text"
              placeholder="Search by Order ID, Customer, or Email..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="toolbar-filters">
            <select
              className="admin-select"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              {STATUS_OPTIONS.map((st) => (
                <option key={st} value={st}>
                  {st === "ALL" ? "All Statuses" : st}
                </option>
              ))}
            </select>
          </div>
        </div>

        {loading ? (
          <div className="admin-loading-state">Loading orders...</div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th>Order ID</th>
                  <th>Date</th>
                  <th>Customer</th>
                  <th>Payment</th>
                  <th>Total</th>
                  <th>Status</th>
                  <th className="text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredOrders.map((order) => {
                  const customerName = order.customer
                    ? `${order.customer.firstName} ${order.customer.lastName || ""}`.trim()
                    : "Customer";
                  const date = order.createdAt
                    ? new Date(order.createdAt).toLocaleDateString("en-IN", {
                        year: "numeric",
                        month: "short",
                        day: "2-digit",
                      })
                    : "—";

                  return (
                    <tr key={order.id}>
                      <td className="font-medium text-link">
                        {order.orderNumber}
                      </td>
                      <td>{date}</td>
                      <td>
                        <div className="product-info">
                          <span className="product-title">{customerName}</span>
                          {order.customer?.email && (
                            <span className="product-sku">
                              {order.customer.email}
                            </span>
                          )}
                        </div>
                      </td>
                      <td>
                        <span className="category-badge">
                          {order.paymentMethod || "Cashfree / UPI"}
                        </span>
                      </td>
                      <td className="font-medium">
                        {formatINR(order.total)}
                      </td>
                      <td>
                        <span
                          className={`status-badge ${getStatusClass(order.orderStatus)}`}
                        >
                          {order.orderStatus}
                        </span>
                      </td>
                      <td className="text-right">
                        <div className="action-buttons">
                          <button
                            className="action-btn"
                            title="View Details"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            className="action-btn"
                            title="Edit Status"
                            onClick={() => {
                              setEditingOrder(order);
                              setNewStatus(order.orderStatus);
                            }}
                          >
                            <Edit size={16} />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {!loading && filteredOrders.length === 0 && (
          <div className="empty-state">
            <ShoppingCart size={48} className="empty-icon" />
            <h3>No orders found</h3>
            <p>You haven't received any orders matching your criteria yet.</p>
          </div>
        )}
      </div>

      {/* ── Order Details Modal ── */}
      {selectedOrder && (
        <div className="modal-overlay" onClick={() => setSelectedOrder(null)}>
          <div
            className="modal-box"
            style={{ maxWidth: "650px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Order #{selectedOrder.orderNumber}</h3>
              <button className="modal-close" onClick={() => setSelectedOrder(null)}>
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: "16px 20px" }}>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "16px", marginBottom: "20px" }}>
                <div>
                  <h4 style={{ fontSize: "0.85rem", color: "var(--admin-text-muted)", textTransform: "uppercase" }}>Customer</h4>
                  <p style={{ fontWeight: 600, marginTop: "4px" }}>
                    {selectedOrder.customer?.firstName} {selectedOrder.customer?.lastName}
                  </p>
                  <p style={{ fontSize: "0.85rem", color: "var(--admin-text-muted)" }}>{selectedOrder.customer?.email}</p>
                  <p style={{ fontSize: "0.85rem", color: "var(--admin-text-muted)" }}>{selectedOrder.customer?.phone}</p>
                </div>
                <div>
                  <h4 style={{ fontSize: "0.85rem", color: "var(--admin-text-muted)", textTransform: "uppercase" }}>Payment & Status</h4>
                  <p style={{ marginTop: "4px" }}>
                    Status: <span className={`status-badge ${getStatusClass(selectedOrder.orderStatus)}`}>{selectedOrder.orderStatus}</span>
                  </p>
                  <p style={{ fontSize: "0.85rem", marginTop: "4px" }}>Method: {selectedOrder.paymentMethod}</p>
                  <p style={{ fontSize: "0.85rem", fontWeight: 700, marginTop: "4px" }}>Total: {formatINR(selectedOrder.total)}</p>
                </div>
              </div>

              {selectedOrder.shippingAddress && (
                <div style={{ marginBottom: "20px", background: "var(--admin-sidebar-bg, #f8fafc)", padding: "12px", borderRadius: "6px" }}>
                  <h4 style={{ fontSize: "0.85rem", color: "var(--admin-text-muted)", textTransform: "uppercase", marginBottom: "4px" }}>Shipping Address</h4>
                  <p style={{ fontSize: "0.85rem" }}>
                    {typeof selectedOrder.shippingAddress === "string"
                      ? selectedOrder.shippingAddress
                      : `${selectedOrder.shippingAddress.address || ""}, ${selectedOrder.shippingAddress.city || ""} ${selectedOrder.shippingAddress.state || ""} ${selectedOrder.shippingAddress.pincode || ""}`}
                  </p>
                </div>
              )}

              <div>
                <h4 style={{ fontSize: "0.85rem", color: "var(--admin-text-muted)", textTransform: "uppercase", marginBottom: "8px" }}>Items ({selectedOrder.items?.length || 0})</h4>
                <div style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid var(--admin-border, #e2e8f0)", borderRadius: "6px" }}>
                  {(selectedOrder.items || []).map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "10px 14px",
                        borderBottom: idx < selectedOrder.items.length - 1 ? "1px solid var(--admin-border, #e2e8f0)" : "none",
                      }}
                    >
                      <div>
                        <div style={{ fontWeight: 600, fontSize: "0.9rem" }}>{item.title || item.name || "Product"}</div>
                        <div style={{ fontSize: "0.8rem", color: "var(--admin-text-muted)" }}>Qty: {item.quantity || 1}</div>
                      </div>
                      <div style={{ fontWeight: 600 }}>{formatINR((item.price || 0) * (item.quantity || 1))}</div>
                    </div>
                  ))}
                  {(!selectedOrder.items || selectedOrder.items.length === 0) && (
                    <div style={{ padding: "16px", textAlign: "center", color: "var(--admin-text-muted)" }}>
                      No item breakdown recorded.
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ── Status Edit Modal ── */}
      {editingOrder && (
        <div className="modal-overlay" onClick={() => setEditingOrder(null)}>
          <div
            className="modal-box"
            style={{ maxWidth: "420px" }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="modal-header">
              <h3>Update Status</h3>
              <button className="modal-close" onClick={() => setEditingOrder(null)}>
                <X size={20} />
              </button>
            </div>
            <form onSubmit={handleStatusUpdate} style={{ padding: "16px 20px" }}>
              <p style={{ fontSize: "0.9rem", marginBottom: "12px" }}>
                Update status for Order <strong>#{editingOrder.orderNumber}</strong>:
              </p>
              <div style={{ marginBottom: "20px" }}>
                <select
                  className="admin-select"
                  style={{ width: "100%", padding: "10px" }}
                  value={newStatus}
                  onChange={(e) => setNewStatus(e.target.value)}
                >
                  <option value="PENDING">PENDING</option>
                  <option value="PAID">PAID</option>
                  <option value="PROCESSING">PROCESSING</option>
                  <option value="SHIPPED">SHIPPED</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="CANCELLED">CANCELLED</option>
                </select>
              </div>
              <div style={{ display: "flex", gap: "10px", justifyContent: "flex-end" }}>
                <button
                  type="button"
                  className="admin-btn admin-btn-outline"
                  onClick={() => setEditingOrder(null)}
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="admin-btn admin-btn-primary"
                  disabled={updating}
                >
                  {updating ? "Updating..." : "Save Status"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Orders;
