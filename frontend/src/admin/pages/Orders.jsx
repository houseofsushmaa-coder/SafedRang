import React, { useState, useEffect } from "react";
import { useSearchParams } from "react-router-dom";
import toast from "react-hot-toast";
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
  Printer,
} from "lucide-react";
import "./AdminPages.css";
import { formatINR } from "../../config/api.js";
import { adminService } from "../adminService";
import Papa from "papaparse";
import { downloadShippingLabels } from "../shippingLabel";
import ShiprocketPanel from "../components/ShiprocketPanel";

// Orders that are paid (or COD) and not yet handed to the courier.
const TO_SHIP = ["PENDING", "CONFIRMED", "PROCESSING", "PACKED"];
const isReadyToShip = (o) =>
  TO_SHIP.includes(o.orderStatus) && (o.paymentMethodCode === "COD" || o.paymentStatus === "PAID");
const canLabel = (o) => !["CANCELLED", "RETURNED"].includes(o.orderStatus);
// Why an order can't be sent to the courier (empty = it can).
const shipBlock = (o) =>
  ["CANCELLED", "RETURNED"].includes(o.orderStatus)
    ? "Cancelled or returned — nothing to ship"
    : o.paymentMethodCode !== "COD" && o.paymentStatus !== "PAID"
    ? "Online payment not received — don't ship"
    : "";

const STATUS_OPTIONS = ["ALL", "PENDING", "PROCESSING", "PACKED", "SHIPPED", "DELIVERED", "CANCELLED", "RETURNED"];

// Fulfilment steps an admin can set. Payment status is separate (set by
// Cashfree for online orders; a COD order becomes PAID when marked Delivered).
const FULFILMENT_STATUSES = [
  ["PENDING", "Pending"],
  ["PROCESSING", "Processing"],
  ["PACKED", "Packed"],
  ["SHIPPED", "Shipped"],
  ["OUT_FOR_DELIVERY", "Out for delivery"],
  ["DELIVERED", "Delivered"],
  ["CANCELLED", "Cancelled"],
  ["RETURNED", "Returned"],
];

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchParams] = useSearchParams();
  const [searchTerm, setSearchTerm] = useState(searchParams.get("q") || "");
  // Header search (/admin/orders?q=…) updates the filter.
  useEffect(() => {
    const q = searchParams.get("q");
    if (q !== null) setSearchTerm(q);
  }, [searchParams]);
  const [statusFilter, setStatusFilter] = useState("ALL");
  const [selectedOrder, setSelectedOrder] = useState(null);
  const [editingOrder, setEditingOrder] = useState(null);
  const [newStatus, setNewStatus] = useState("");
  const [updating, setUpdating] = useState(false);
  const [labelBusy, setLabelBusy] = useState(false);
  const [shipOrder, setShipOrder] = useState(null);

  const printLabels = async (list) => {
    if (!list.length) return;
    setLabelBusy(true);
    try {
      let sender = { name: "Safed Rang" };
      try {
        sender = (await adminService.getSettings()).store;
      } catch {}
      await downloadShippingLabels(list, sender);
      if (!sender.address) toast("Tip: add your pickup / return address in Settings so it prints on the label.", { icon: "ℹ️" });
    } catch (err) {
      toast.error("Could not create the label: " + err.message);
    } finally {
      setLabelBusy(false);
    }
  };

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
      case "PACKED":
      case "SHIPPED":
      case "OUT_FOR_DELIVERY":
        return "status-processing";
      case "CANCELLED":
      case "RETURNED":
      case "REFUNDED":
      case "FAILED":
      case "AMOUNT_MISMATCH":
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
      toast.error("Could not update the order: " + err.message);
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
        "Payment Status": o.paymentStatus,
        "Payment Method": o.paymentMethod,
        Payment: o.paymentMethod,
        Courier: o.shiprocket?.courier || "",
        AWB: o.shiprocket?.awb || "",
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

  const readyToShip = filteredOrders.filter(isReadyToShip);

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <h2>Orders</h2>
          <p className="page-subtitle">Manage, view, and update customer order fulfillments.</p>
        </div>
        <div className="header-actions">
          <button
            onClick={() => printLabels(readyToShip)}
            className="admin-btn admin-btn-outline icon-left"
            disabled={labelBusy || readyToShip.length === 0}
            title="One 4×6 inch label per order that is paid (or COD) and not yet shipped"
          >
            <Printer size={16} /> {labelBusy ? "Preparing…" : `Labels to ship (${readyToShip.length})`}
          </button>
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
                        <span className="category-badge">{order.paymentMethod}</span>
                        <span
                          className={`status-badge ${getStatusClass(order.paymentStatus)}`}
                          style={{ marginLeft: 6 }}
                          title="Payment status"
                        >
                          {order.paymentStatus === "PAID" ? "Paid" : order.paymentStatus === "PENDING" ? (order.paymentMethodCode === "COD" ? "Due on delivery" : "Unpaid") : order.paymentStatus}
                        </span>
                      </td>
                      <td className="font-medium">
                        {formatINR(order.total)}
                      </td>
                      <td>
                        <span
                          className={`status-badge ${getStatusClass(order.orderStatus)}`}
                        >
                          {order.orderStatus.replace(/_/g, " ")}
                        </span>
                        {order.shiprocket?.shiprocket_order_id && (
                          <div
                            style={{ fontSize: "0.72rem", color: "var(--admin-text-muted)", marginTop: 4 }}
                            title={order.shiprocket.status ? `Shiprocket: ${order.shiprocket.status}` : "In Shiprocket"}
                          >
                            <Truck size={11} style={{ verticalAlign: "-1px" }} />{" "}
                            {order.shiprocket.awb ? `AWB ${order.shiprocket.awb}` : "In Shiprocket"}
                          </div>
                        )}
                      </td>
                      <td className="text-right">
                        <div className="action-buttons">
                          {order.shiprocket?.shiprocket_order_id ? (
                            <button
                              className="action-btn"
                              title={`In Shiprocket${order.shiprocket.awb ? " · AWB " + order.shiprocket.awb : ""} — view shipment`}
                              style={{ color: "var(--admin-success)" }}
                              onClick={() => setShipOrder(order)}
                            >
                              <Truck size={16} />
                            </button>
                          ) : shipBlock(order) ? (
                            <button className="action-btn" title={shipBlock(order)} disabled style={{ opacity: 0.35 }}>
                              <Truck size={16} />
                            </button>
                          ) : (
                            <button
                              type="button"
                              className="admin-btn admin-btn-primary icon-left"
                              style={{ padding: "5px 10px", fontSize: "0.75rem", minHeight: 0 }}
                              title="Send this order to Shiprocket"
                              onClick={() => setShipOrder(order)}
                            >
                              <Truck size={14} /> Ship
                            </button>
                          )}
                          <button
                            className="action-btn"
                            title="View Details"
                            onClick={() => setSelectedOrder(order)}
                          >
                            <Eye size={16} />
                          </button>
                          <button
                            className="action-btn"
                            title={canLabel(order) ? "Download shipping label (PDF)" : "No label for cancelled or returned orders"}
                            disabled={labelBusy || !canLabel(order)}
                            onClick={() => printLabels([order])}
                          >
                            <Printer size={16} />
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
              <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                {canLabel(selectedOrder) && (
                  <button
                    type="button"
                    className="admin-btn admin-btn-outline icon-left"
                    style={{ padding: "6px 12px", fontSize: "0.8rem" }}
                    disabled={labelBusy}
                    onClick={() => printLabels([selectedOrder])}
                  >
                    <Printer size={15} /> {labelBusy ? "Preparing…" : "Shipping label"}
                  </button>
                )}
              <button className="modal-close" onClick={() => setSelectedOrder(null)}>
                <X size={20} />
              </button>
              </div>
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
                    Status: <span className={`status-badge ${getStatusClass(selectedOrder.orderStatus)}`}>{selectedOrder.orderStatus}</span>{" "}· Payment: <span className={`status-badge ${getStatusClass(selectedOrder.paymentStatus)}`}>{selectedOrder.paymentStatus}</span> ({selectedOrder.paymentMethod})
                  </p>
                  <p style={{ fontSize: "0.85rem", marginTop: "4px" }}>Method: {selectedOrder.paymentMethod}</p>
                  <p style={{ fontSize: "0.85rem", fontWeight: 700, marginTop: "4px" }}>Total: {formatINR(selectedOrder.total)}</p>
                </div>
              </div>

              <ShiprocketPanel
                key={selectedOrder.id}
                order={selectedOrder}
                onSent={(shiprocket) => {
                  setSelectedOrder((o) => ({
                    ...o,
                    shiprocket,
                    orderStatus: ["PENDING", "CONFIRMED", "PROCESSING"].includes(o.orderStatus) ? "PACKED" : o.orderStatus,
                  }));
                  fetchOrders();
                }}
              />

              {selectedOrder.shippingAddress && (
                <div style={{ marginBottom: "20px", background: "var(--admin-sidebar-bg, var(--admin-surface-2))", padding: "12px", borderRadius: "6px" }}>
                  <h4 style={{ fontSize: "0.85rem", color: "var(--admin-text-muted)", textTransform: "uppercase", marginBottom: "4px" }}>Shipping Address</h4>
                  <p style={{ fontSize: "0.85rem" }}>
                    {typeof selectedOrder.shippingAddress === "string"
                      ? selectedOrder.shippingAddress
                      : [
                          selectedOrder.shippingAddress.address,
                          selectedOrder.shippingAddress.apartment,
                          selectedOrder.shippingAddress.city,
                          `${selectedOrder.shippingAddress.state || ""} ${selectedOrder.shippingAddress.pincode || ""}`.trim(),
                        ]
                          .filter(Boolean)
                          .join(", ")}
                  </p>
                </div>
              )}

              <div>
                <h4 style={{ fontSize: "0.85rem", color: "var(--admin-text-muted)", textTransform: "uppercase", marginBottom: "8px" }}>Items ({selectedOrder.items?.length || 0})</h4>
                <div style={{ maxHeight: "200px", overflowY: "auto", border: "1px solid var(--admin-border, var(--admin-border))", borderRadius: "6px" }}>
                  {(selectedOrder.items || []).map((item, idx) => (
                    <div
                      key={idx}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        padding: "10px 14px",
                        borderBottom: idx < selectedOrder.items.length - 1 ? "1px solid var(--admin-border, var(--admin-border))" : "none",
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

      {/* ── Ship with Shiprocket ── */}
      {shipOrder && (
        <div className="modal-overlay" onClick={() => setShipOrder(null)}>
          <div className="modal-box" style={{ maxWidth: "560px" }} onClick={(e) => e.stopPropagation()}>
            <div className="modal-header">
              <h3>Ship #{shipOrder.orderNumber}</h3>
              <button className="modal-close" onClick={() => setShipOrder(null)}>
                <X size={20} />
              </button>
            </div>
            <div style={{ padding: "16px 20px 4px" }}>
              <p style={{ fontSize: "0.85rem", marginBottom: 14, color: "var(--admin-text-muted)" }}>
                <strong style={{ color: "var(--admin-text-main)" }}>
                  {shipOrder.shippingAddress?.name || `${shipOrder.customer?.firstName || ""} ${shipOrder.customer?.lastName || ""}`.trim()}
                </strong>
                {" · "}
                {[shipOrder.shippingAddress?.city, shipOrder.shippingAddress?.pincode].filter(Boolean).join(" ")}
                {" · "}
                {(shipOrder.items || []).reduce((n, i) => n + Number(i.quantity || 1), 0)} piece(s) · {formatINR(shipOrder.total)}
              </p>
              <ShiprocketPanel
                key={shipOrder.id}
                order={shipOrder}
                onSent={(shiprocket) => {
                  setShipOrder((o) => ({ ...o, shiprocket }));
                  fetchOrders();
                }}
              />
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
                  {FULFILMENT_STATUSES.map(([value, label]) => (
                    <option key={value} value={value}>{label}</option>
                  ))}
                </select>
                <p className="field-hint" style={{ marginTop: 8, fontSize: "0.78rem", color: "var(--admin-text-muted)" }}>
                  {editingOrder.paymentMethodCode === "COD"
                    ? "Marking a Cash on Delivery order as Delivered records the cash as paid. "
                    : ""}
                  Cancelling or marking returned puts the items back in stock.
                </p>
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
