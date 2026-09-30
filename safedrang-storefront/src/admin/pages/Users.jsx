import React from 'react';
import './AdminPages.css';

const Users = () => {
  const users = [
    { id: 'USR-01', name: 'John Doe', email: 'john@example.com', role: 'Admin', status: 'Active' },
    { id: 'USR-02', name: 'Sarah Johnson', email: 'sarah@example.com', role: 'Customer', status: 'Active' },
    { id: 'USR-03', name: 'Michael Chen', email: 'michael@example.com', role: 'Customer', status: 'Inactive' },
  ];

  const getStatusClass = (status) => {
    switch(status.toLowerCase()) {
      case 'active': return 'status-completed';
      case 'inactive': return 'status-cancelled';
      default: return '';
    }
  };

  return (
    <div className="admin-page">
      <div className="page-header">
        <h2>Manage Users</h2>
        <div className="header-actions">
          <input type="text" placeholder="Search users..." className="admin-input" />
          <button className="admin-btn">+ Add User</button>
        </div>
      </div>

      <div className="admin-card mt-4">
        <table className="admin-table">
          <thead>
            <tr>
              <th>User Info</th>
              <th>Role</th>
              <th>Status</th>
              <th>Actions</th>
            </tr>
          </thead>
          <tbody>
            {users.map((user) => (
              <tr key={user.id}>
                <td>
                  <div className="user-info-cell">
                    <div className="user-avatar-small">{user.name.charAt(0)}</div>
                    <div>
                      <div className="font-medium">{user.name}</div>
                      <div className="text-xs text-gray">{user.email}</div>
                    </div>
                  </div>
                </td>
                <td>{user.role}</td>
                <td><span className={`status-badge ${getStatusClass(user.status)}`}>{user.status}</span></td>
                <td>
                  <button className="admin-btn-icon" title="Edit">✏️</button>
                  <button className="admin-btn-icon text-danger" title="Delete">🗑️</button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Users;
