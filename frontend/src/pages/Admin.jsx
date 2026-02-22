import { useEffect, useState } from 'react';
import { Routes, Route, Link, useNavigate } from 'react-router-dom';
import api from '../api/client';
import '../styles/admin.css';

/**
 * Admin Dashboard Component
 * Displays system statistics and health
 */
function AdminDashboard() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDashboard();
  }, []);

  const fetchDashboard = async () => {
    try {
      const { data } = await api.get('/admin/dashboard');
      setStats(data);
    } catch (err) {
      console.error('Error fetching dashboard:', err);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="admin-section">
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading dashboard...</p>
        </div>
      </div>
    );
  }

  if (!stats) {
    return (
      <div className="admin-section">
        <div className="alert alert-error">Failed to load dashboard data</div>
      </div>
    );
  }

  return (
    <div className="admin-dashboard">
      <div className="dashboard-header">
        <h2>📊 System Dashboard</h2>
        <p>Real-time system metrics and monitoring</p>
      </div>

      <div className="stats-grid">
        <div className="stat-card">
          <div className="stat-icon">👥</div>
          <div className="stat-info">
            <p className="stat-label">Total Users</p>
            <p className="stat-value">{stats.stats?.totalUsers || 0}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">📝</div>
          <div className="stat-info">
            <p className="stat-label">Total Notes</p>
            <p className="stat-value">{stats.stats?.totalNotes || 0}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">💾</div>
          <div className="stat-info">
            <p className="stat-label">Storage Used</p>
            <p className="stat-value">{stats.stats?.storageUsed || '0 B'}</p>
          </div>
        </div>
        <div className="stat-card">
          <div className="stat-icon">🟢</div>
          <div className="stat-info">
            <p className="stat-label">Active Today</p>
            <p className="stat-value">{stats.stats?.activeToday || 0}</p>
          </div>
        </div>
      </div>

      {stats.recentActivity && stats.recentActivity.length > 0 && (
        <div className="activity-section">
          <h3>📢 Recent Activity</h3>
          <div className="activity-list">
            {stats.recentActivity.slice(0, 5).map((activity, index) => (
              <div key={index} className="activity-item">
                <span className="activity-icon">●</span>
                <span className="activity-text">
                  <strong>{activity.action}</strong> by {activity.user}
                </span>
                <span className="activity-time">{activity.time}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {stats.systemHealth && (
        <div className="health-section">
          <h3>🔧 System Health</h3>
          <div className="health-grid">
            {Object.entries(stats.systemHealth).map(([key, value]) => (
              <div key={key} className={`health-item health-${value?.toLowerCase() || 'unknown'}`}>
                <span className="health-status"></span>
                <span className="health-label">{key}</span>
                <span className="health-value">{String(value).toUpperCase()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Admin Users Management Component
 * Displays user list and management utilities
 */
function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchUsers();
  }, []);

  const fetchUsers = async () => {
    try {
      const { data } = await api.get('/admin/users');
      setUsers(data.users || []);
    } catch (err) {
      console.error('Error fetching users:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-section">
      <div className="section-header">
        <h2>👥 User Management</h2>
        <p>View and manage user accounts</p>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading users...</p>
        </div>
      ) : users.length > 0 ? (
        <div className="table-responsive">
          <table className="admin-table">
            <thead>
              <tr>
                <th>Email</th>
                <th>Name</th>
                <th>Role</th>
                <th>Created</th>
                <th>Last Login</th>
              </tr>
            </thead>
            <tbody>
              {users.map((user) => (
                <tr key={user.id}>
                  <td>{user.email}</td>
                  <td>{user.name}</td>
                  <td>
                    <span className={`role-badge role-${user.role}`}>
                      {user.role}
                    </span>
                  </td>
                  <td>{new Date(user.createdAt).toLocaleDateString()}</td>
                  <td>{user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      ) : (
        <div className="empty-state">
          <p>No users found</p>
        </div>
      )}
    </div>
  );
}

/**
 * Admin Settings Component
 * Displays system settings and configuration
 */
function AdminSettings() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchSettings();
  }, []);

  const fetchSettings = async () => {
    try {
      const { data } = await api.get('/admin/settings');
      setSettings(data);
    } catch (err) {
      console.error('Error fetching settings:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="admin-section">
      <div className="section-header">
        <h2>⚙️ System Settings</h2>
        <p>Configure application behavior</p>
      </div>

      {loading ? (
        <div className="loading-state">
          <div className="spinner"></div>
          <p>Loading settings...</p>
        </div>
      ) : settings ? (
        <div className="settings-grid">
          {Object.entries(settings).map(([key, value]) => (
            <div key={key} className="setting-item">
              <label className="setting-label">
                {key.replace(/([A-Z])/g, ' $1').toLowerCase()}
              </label>
              <span className="setting-value">{String(value)}</span>
            </div>
          ))}
        </div>
      ) : (
        <div className="empty-state">
          <p>No settings found</p>
        </div>
      )}
    </div>
  );
}

/**
 * Main Admin Panel Component
 * Provides navigation between admin sections
 */
export default function Admin() {
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="admin-wrapper">
      <aside className={`admin-sidebar ${sidebarOpen ? 'open' : 'closed'}`}>
        <div className="sidebar-header">
          <div className="sidebar-brand">
            <span className="brand-icon">🛠️</span>
            <h2>Admin Panel</h2>
          </div>
          <button 
            className="sidebar-toggle" 
            onClick={() => setSidebarOpen(!sidebarOpen)}
            aria-label="Toggle sidebar"
          >
            ☰
          </button>
        </div>

        <nav className="sidebar-nav">
          <Link to="/admin/" className="nav-link">
            <span className="nav-icon">📊</span>
            <span className="nav-label">Dashboard</span>
          </Link>
          <Link to="/admin/users" className="nav-link">
            <span className="nav-icon">👥</span>
            <span className="nav-label">Users</span>
          </Link>
          <Link to="/admin/settings" className="nav-link">
            <span className="nav-icon">⚙️</span>
            <span className="nav-label">Settings</span>
          </Link>
        </nav>

        <div className="sidebar-footer">
          <button 
            onClick={() => navigate('/dashboard')} 
            className="btn btn-secondary btn-sm"
          >
            ← Back to Dashboard
          </button>
        </div>
      </aside>

      <main className="admin-main">
        <Routes>
          <Route path="/" element={<AdminDashboard />} />
          <Route path="/users" element={<AdminUsers />} />
          <Route path="/settings" element={<AdminSettings />} />
        </Routes>
      </main>
    </div>
  );
}
