import React, { useState, useEffect } from "react";
import axios from "axios";
import { useNavigate } from "react-router-dom";
import {
  Eye,
  Edit,
  Filter,
  Search,
  Download,
  Trash2,
import { ShoppingCart } from "lucide-react";
import "./AdminPages.css";
import { API_BASE, getAuthHeaders, formatINR } from "../../config/api.js";

const Orders = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${API_BASE}/orders`, { headers: getAuthHeaders() });
      setOrders(res.data.data || []);
    } catch (error) {
      console.error("Failed to fetch orders:", error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusClass = (status) => {
    switch (status?.toUpperCase()) {
      case "COMPLETED":
      case "DELIVERED":
        return "status-completed";
      case "PENDING":
        return "status-pending";
      case "PROCESSING":
        return "status-processing";
      case "CANCELLED":
      case "REFUNDED":
        return "status-cancelled";
      default:
        return "status-processing";
    }
  };



  const filteredOrders = orders.filter(
    (o) =>
      o.orderNumber?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      (o.customer &&
        `${o.customer.firstName} ${o.customer.lastName}`
          .toLowerCase()
          .includes(searchTerm.toLowerCase())),
  );

  return (
    <div className="admin-page">
      <div className="page-header">
        <div>
          <h2>Orders</h2>
          <p className="page-subtitle">Manage and track customer orders.</p>
        </div>
        <div className="header-actions">
          <button className="admin-btn admin-btn-outline icon-left">
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
              placeholder="Search by Order ID or Customer Name..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
            />
          </div>
          <div className="toolbar-filters">
            <select className="admin-select" style={{ marginRight: "10px" }}>
              <option value="">All Statuses</option>
              <option value="PENDING">Pending</option>
              <option value="PROCESSING">Processing</option>
              <option value="DELIVERED">Delivered</option>
              <option value="CANCELLED">Cancelled</option>
            </select>
            <button className="admin-btn admin-btn-outline icon-left">
              <Filter size={16} /> More Filters
            </button>
          </div>
        </div>

        {loading ? (
          <div className="admin-loading-state">Loading orders...</div>
        ) : (
          <div className="table-responsive">
            <table className="admin-table">
              <thead>
                <tr>
                  <th width="50">
                    <input type="checkbox" />
                  </th>
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
                    : "Guest Customer";
                  const date = new Date(order.createdAt).toLocaleDateString(
                    "en-IN",
                    { year: "numeric", month: "short", day: "numeric" },
                  );

                  return (
                    <tr key={order.id}>
                      <td>
                        <input type="checkbox" />
                      </td>
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
                          {order.paymentMethod || "Prepaid"}
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
                          <button className="action-btn" title="View Details">
                            <Eye size={16} />
                          </button>
                          <button className="action-btn" title="Edit Status">
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
    </div>
  );
};

export default Orders;
