import React, { useState, useEffect, useCallback } from "react";
import {
  UserPlus,
  Search,
  CheckCircle,
  XCircle,
  X,
  Loader2,
  Shield,
  User,
} from "lucide-react";
import "./AdminPages.css";
import "./Users.css";
import { supabase } from "../../lib/supabase";

const ROLE_OPTIONS = ["CUSTOMER", "MANAGER", "ADMIN", "SUPER_ADMIN"];

const getRoleClass = (role) => {
  switch (role) {
    case "SUPER_ADMIN":
      return "role-badge role-super";
    case "ADMIN":
      return "role-badge role-admin";
    case "MANAGER":
      return "role-badge role-manager";
    default:
      return "role-badge role-customer";
  }
};

const getStatusClass = (status) => {
  switch (status?.toLowerCase()) {
    case "active":
      return "status-completed";
    case "inactive":
      return "status-cancelled";
    default:
      return "status-pending";
  }
};

/* ── Toast ── */
const Toast = ({ toast, onClose }) => {
  if (!toast) return null;
  return (
    <div className={`users-toast users-toast--${toast.type}`}>
      {toast.type === "success" ? (
        <CheckCircle size={18} />
      ) : (
        <XCircle size={18} />
      )}
      <span>{toast.message}</span>
      <button className="toast-close" onClick={onClose}>
        <X size={14} />
      </button>
    </div>
  );
};

/* ── Add User Modal ── */
const AddUserModal = ({ onClose, onSuccess }) => {
  const [form, setForm] = useState({
    name: "",
    email: "",
    phone: "",
    password: "",
    role: "ADMIN",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const handleChange = (e) =>
    setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setLoading(true);

    try {
      // 1. Sign up user via Supabase
      const { data: authData, error: authErr } = await supabase.auth.signUp({
        email: form.email,
        password: form.password,
        options: {
          data: {
            full_name: form.name,
            role: form.role.toLowerCase(),
          },
        },
      });

      if (authErr) throw authErr;

      // 2. Insert into profiles table
      if (authData?.user?.id) {
        await supabase.from("profiles").upsert([
          {
            id: authData.user.id,
            email: form.email,
            role: form.role.toLowerCase(),
            full_name: form.name,
          },
        ]);
      }

      onSuccess(`User "${form.name}" created with role ${form.role}!`);
      onClose();
    } catch (err) {
      setError(err.message || "Failed to create user. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="modal-overlay"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="modal-box">
        <div className="modal-header">
          <h3>
            <UserPlus size={18} /> Add New User
          </h3>
          <button className="modal-close" onClick={onClose}>
            <X size={20} />
          </button>
        </div>

        {error && (
          <div className="modal-error">
            <XCircle size={15} /> {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="modal-form">
          <div className="form-row">
            <div className="form-group">
              <label>Full Name *</label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="e.g. Priya Sharma"
                required
              />
            </div>
            <div className="form-group">
              <label>Email *</label>
              <input
                name="email"
                type="email"
                value={form.email}
                onChange={handleChange}
                placeholder="e.g. priya@safedrang.com"
                required
              />
            </div>
          </div>

          <div className="form-row">
            <div className="form-group">
              <label>Phone (optional)</label>
              <input
                name="phone"
                value={form.phone}
                onChange={handleChange}
                placeholder="10-digit mobile number"
              />
            </div>
            <div className="form-group">
              <label>Role *</label>
              <select
                name="role"
                value={form.role}
                onChange={handleChange}
                className="admin-select"
                style={{ width: "100%" }}
              >
                {ROLE_OPTIONS.map((r) => (
                  <option key={r} value={r}>
                    {r.replace("_", " ")}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div className="form-group">
            <label>Password *</label>
            <input
              name="password"
              type="password"
              value={form.password}
              onChange={handleChange}
              placeholder="Min 8 characters"
              minLength={8}
              required
            />
          </div>

          <div className="modal-footer">
            <button
              type="button"
              className="admin-btn admin-btn-outline"
              onClick={onClose}
            >
              Cancel
            </button>
            <button type="submit" className="admin-btn" disabled={loading}>
              {loading ? (
                <>
                  <Loader2 size={15} className="spin" /> Creating...
                </>
              ) : (
                <>
                  <UserPlus size={15} /> Create User
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

/* ════════════════ MAIN ════════════════ */
const Users = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (message, type = "success") => {
    setToast({ message, type });
    setTimeout(() => setToast(null), 4000);
  };

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    try {
      // 1. Fetch from Supabase profiles
      const { data: profiles, error } = await supabase
        .from("profiles")
        .select("*")
        .order("created_at", { ascending: false });

      if (!error && profiles && profiles.length > 0) {
        setUsers(
          profiles.map((p) => ({
            id: p.id,
            name: p.full_name || p.email?.split("@")[0],
            email: p.email,
            role: (p.role || "customer").toUpperCase(),
            status: "Active",
            createdAt: p.created_at,
          })),
        );
        return;
      }

      // 2. If profiles is empty, fallback to empty array
      setUsers([]);
    } catch (err) {
      console.warn("fetchUsers error:", err);
      setUsers([]);
    } finally {
      setLoading(false);
    }
  }, []);

  const handleRoleChange = async (userId, userEmail, newRole) => {
    try {
      const cleanRole = newRole.toLowerCase();
      const { error } = await supabase
        .from("profiles")
        .update({ role: cleanRole, updated_at: new Date().toISOString() })
        .eq("id", userId);

      if (error) {
        showToast("Error updating role: " + error.message, "error");
      } else {
        showToast(`Updated ${userEmail} role to ${newRole}!`, "success");
        fetchUsers();
      }
    } catch (err) {
      showToast("Failed to update role", "error");
    }
  };

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleUserCreated = (msg) => {
    showToast(msg, "success");
    fetchUsers(); // refresh list
  };

  const filtered = users.filter(
    (u) =>
      u.name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase()),
  );

  return (
    <div className="admin-page">
      <Toast toast={toast} onClose={() => setToast(null)} />

      {showModal && (
        <AddUserModal
          onClose={() => setShowModal(false)}
          onSuccess={handleUserCreated}
        />
      )}

      {/* Header */}
      <div className="page-header">
        <div>
          <h2>Manage Users</h2>
          <p className="page-subtitle">
            {loading
              ? "..."
              : `${users.length} user${users.length !== 1 ? "s" : ""} total`}
          </p>
        </div>
        <div className="header-actions">
          <div className="toolbar-search" style={{ width: 260 }}>
            <Search size={16} className="search-icon" />
            <input
              type="text"
              placeholder="Search by name or email..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
            />
          </div>
          <button
            className="admin-btn icon-left"
            onClick={() => setShowModal(true)}
          >
            <UserPlus size={16} /> Add User
          </button>
        </div>
      </div>

      {/* Table */}
      <div className="admin-table-card">
        {loading ? (
          <div className="admin-loading-state">
            <Loader2 size={24} className="spin" /> Loading users...
          </div>
        ) : filtered.length === 0 ? (
          <div className="empty-state">
            <User size={40} className="empty-icon" />
            <h3>
              {search ? "No users match your search." : "No users found."}
            </h3>
            <p>{!search && 'Click "Add User" to create the first one.'}</p>
          </div>
        ) : (
          <table className="admin-table">
            <thead>
              <tr>
                <th>User</th>
                <th>Role</th>
                <th>Status</th>
                <th>Joined</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((user) => (
                <tr key={user.id}>
                  <td>
                    <div className="product-cell">
                      <div className="user-avatar-circle">
                        {user.name?.charAt(0).toUpperCase() ?? "?"}
                      </div>
                      <div className="product-info">
                        <span className="product-title">{user.name}</span>
                        <span className="product-sku">{user.email}</span>
                      </div>
                    </div>
                  </td>
                  <td>
                    <select
                      className={`role-select ${getRoleClass(user.role)}`}
                      value={user.role}
                      onChange={(e) =>
                        handleRoleChange(user.id, user.email, e.target.value)
                      }
                      style={{
                        padding: "5px 10px",
                        borderRadius: "20px",
                        fontSize: "0.75rem",
                        fontWeight: 700,
                        cursor: "pointer",
                        border: "1px solid rgba(0,0,0,0.12)",
                        background: "var(--admin-card-bg, #fff)",
                        color: "inherit",
                        outline: "none",
                      }}
                    >
                      {ROLE_OPTIONS.map((r) => (
                        <option key={r} value={r}>
                          {r.replace("_", " ")}
                        </option>
                      ))}
                    </select>
                  </td>
                  <td>
                    <span
                      className={`status-badge ${getStatusClass(user.status)}`}
                    >
                      {user.status}
                    </span>
                  </td>
                  <td className="text-muted text-sm">
                    {user.createdAt
                      ? new Date(user.createdAt).toLocaleDateString("en-IN", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                        })
                      : "—"}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
};

export default Users;
