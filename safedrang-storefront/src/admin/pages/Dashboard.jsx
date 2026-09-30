import React, { useEffect, useState } from 'react';
import axios from 'axios';
import { 
  IndianRupee, ShoppingBag, Users, AlertTriangle, 
  ArrowUpRight, ArrowDownRight, Package 
} from 'lucide-react';
import { 
  AreaChart, Area, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer 
} from 'recharts';
import './AdminPages.css';

const Dashboard = () => {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDashboardData = async () => {
      try {
        // Fetch real analytics data
        const res = await axios.get('https://violet-quetzal-133812.hostingersite.com/api/v1/analytics/dashboard');
        setData(res.data.data);
      } catch (error) {
        console.error("Failed to fetch dashboard data:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchDashboardData();
  }, []);

  if (loading) {
    return <div className="admin-loading-state">Loading dashboard data...</div>;
  }

  // Fallback data structure if API fails
  const stats = data || {
    revenue: { total: 0, change: 0 },
    orders: { total: 0, pending: 0, processing: 0 },
    customers: { total: 0 },
    products: { total: 0, lowStock: 0 },
    recentOrders: []
  };

  // Dummy chart data until we build the real sales-chart endpoint
  const chartData = [
    { name: 'Mon', revenue: 4000 },
    { name: 'Tue', revenue: 3000 },
    { name: 'Wed', revenue: 5000 },
    { name: 'Thu', revenue: 2780 },
    { name: 'Fri', revenue: 9890 },
    { name: 'Sat', revenue: 12390 },
    { name: 'Sun', revenue: 14490 },
  ];

  const formatCurrency = (val) => new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', maximumFractionDigits: 0 }).format(val);

  return (
    <div className="admin-page dashboard-page">
      <div className="page-header">
        <h2>Overview</h2>
        <div className="header-actions">
          <select className="admin-select">
            <option>Today</option>
            <option>Last 7 Days</option>
            <option>This Month</option>
          </select>
        </div>
      </div>

      <div className="dashboard-stats-grid">
        <div className="admin-stat-card">
          <div className="stat-header">
            <div className="stat-icon revenue"><IndianRupee size={24} /></div>
            <span className={`stat-trend ${stats.revenue.change >= 0 ? 'positive' : 'negative'}`}>
              {stats.revenue.change >= 0 ? <ArrowUpRight size={16}/> : <ArrowDownRight size={16}/>}
              {Math.abs(stats.revenue.change)}%
            </span>
          </div>
          <div className="stat-body">
            <h4>Total Revenue</h4>
            <h2>{formatCurrency(stats.revenue.total)}</h2>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-header">
            <div className="stat-icon orders"><ShoppingBag size={24} /></div>
          </div>
          <div className="stat-body">
            <h4>Total Orders</h4>
            <h2>{stats.orders.total}</h2>
            <div className="stat-meta">{stats.orders.pending} pending, {stats.orders.processing} processing</div>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-header">
            <div className="stat-icon customers"><Users size={24} /></div>
          </div>
          <div className="stat-body">
            <h4>Total Customers</h4>
            <h2>{stats.customers.total}</h2>
          </div>
        </div>

        <div className="admin-stat-card">
          <div className="stat-header">
            <div className="stat-icon products"><Package size={24} /></div>
            {stats.products.lowStock > 0 && (
              <span className="stat-trend warning">
                <AlertTriangle size={16}/> {stats.products.lowStock} Low Stock
              </span>
            )}
          </div>
          <div className="stat-body">
            <h4>Total Products</h4>
            <h2>{stats.products.total}</h2>
          </div>
        </div>
      </div>

      <div className="dashboard-main-grid">
        <div className="admin-chart-card">
          <div className="card-header">
            <h3>Sales Overview</h3>
          </div>
          <div className="chart-container" style={{ height: 300, width: '100%' }}>
            <ResponsiveContainer>
              <AreaChart data={chartData} margin={{ top: 10, right: 10, left: 0, bottom: 0 }}>
                <defs>
                  <linearGradient id="colorRevenue" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#10b981" stopOpacity={0.3}/>
                    <stop offset="95%" stopColor="#10b981" stopOpacity={0}/>
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} tickFormatter={(val) => `₹${val}`} />
                <Tooltip 
                  contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                  formatter={(value) => [formatCurrency(value), 'Revenue']}
                />
                <Area type="monotone" dataKey="revenue" stroke="#10b981" strokeWidth={3} fillOpacity={1} fill="url(#colorRevenue)" />
              </AreaChart>
            </ResponsiveContainer>
          </div>
        </div>

        <div className="admin-recent-orders-card">
          <div className="card-header">
            <h3>Recent Orders</h3>
            <button className="text-link">View All</button>
          </div>
          <div className="card-table-wrapper">
            {stats.recentOrders.length === 0 ? (
              <div className="empty-state">No recent orders found.</div>
            ) : (
              <table className="admin-table">
                <thead>
                  <tr>
                    <th>Order ID</th>
                    <th>Customer</th>
                    <th>Amount</th>
                    <th>Status</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.recentOrders.map(order => (
                    <tr key={order.id}>
                      <td className="font-medium">{order.orderNumber}</td>
                      <td>{order.customerName}</td>
                      <td className="font-medium">{formatCurrency(order.totalAmount)}</td>
                      <td><span className={`status-badge status-${order.status.toLowerCase()}`}>{order.status}</span></td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
