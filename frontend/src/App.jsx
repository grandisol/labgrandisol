import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import { useNotificationsStore } from './store/notifications';
import Home from './pages/Home';
import Login from './pages/Login';
import Dashboard from './pages/Dashboard';
import Admin from './pages/Admin';
import Library from './pages/Library';
import BookDetail from './pages/BookDetail';
import MyLoans from './pages/MyLoans';
import ReadingList from './pages/ReadingList';
import Notifications from './pages/Notifications';
import Search from './pages/Search';
import Social from './pages/Social';
import Reports from './pages/Reports';
import AdvancedLibrary from './pages/AdvancedLibrary';
import Workspace from './pages/Workspace';
import Subscription from './pages/Subscription';
import './App.css';

function ProtectedRoute({ children }) {
  const { token } = useAuthStore();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  return children;
}

function AdminRoute({ children }) {
  const { token, user } = useAuthStore();
  if (!token) {
    return <Navigate to="/login" replace />;
  }
  if (user?.role !== 'admin') {
    return <Navigate to="/dashboard" replace />;
  }
  return children;
}

/**
 * Modern App Header com Notificações, Busca e Menu Avançado
 */
function AppHeader() {
  const { token, user, logout } = useAuthStore();
  const { unreadCount, notifications, fetchNotifications, markAllAsRead } = useNotificationsStore();
  const [cacheStatus, setCacheStatus] = useState('connected');
  const [isMenuOpen, setIsMenuOpen] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const location = useLocation();

  useEffect(() => {
    if (token) {
      fetchNotifications();
      const interval = setInterval(fetchNotifications, 30000);
      return () => clearInterval(interval);
    }
  }, [token, fetchNotifications]);

  useEffect(() => {
    const checkHealth = async () => {
      try {
        const headers = token ? { Authorization: `Bearer ${token}` } : {};
        const response = await fetch('/api/health', { headers });
        const data = await response.json();
        setCacheStatus(data.cache?.connected ? 'connected' : 'disconnected');
      } catch {
        setCacheStatus('disconnected');
      }
    };

    checkHealth();
    const interval = setInterval(checkHealth, 30000);
    return () => clearInterval(interval);
  }, [token]);

  const isActive = (path) => location.pathname === path || location.pathname.startsWith(path + '/');

  return (
    <header className="app-header">
      <nav className="navbar">
        {/* Brand */}
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">📚</span>
          <div className="brand-text">
            <h1>LabGrandisol</h1>
            <span className="branding-badge">v2.1</span>
          </div>
        </Link>

        {/* Main Navigation */}
        <div className="navbar-menu" style={{ display: isMenuOpen ? 'flex' : 'none' }}>
          {user && (
            <>
              <Link to="/" className={`navbar-link ${isActive('/') ? 'active' : ''}`}>
                🏠 Home
              </Link>
              <Link to="/library" className={`navbar-link ${isActive('/library') ? 'active' : ''}`}>
                📚 Biblioteca
              </Link>
              <Link to="/search" className={`navbar-link ${isActive('/search') ? 'active' : ''}`}>
                🔍 Busca
              </Link>
              <Link to="/social" className={`navbar-link ${isActive('/social') ? 'active' : ''}`}>
                👥 Social
              </Link>
              <Link to="/reports" className={`navbar-link ${isActive('/reports') ? 'active' : ''}`}>
                📊 Análises
              </Link>
              <Link to="/advanced" className={`navbar-link ${isActive('/advanced') ? 'active' : ''}`}>
                ✨ Avançado
              </Link>
              <Link to="/dashboard" className={`navbar-link ${isActive('/dashboard') ? 'active' : ''}`}>
                📈 Dashboard
              </Link>
              {user.role === 'admin' && (
                <Link to="/admin" className={`navbar-link admin-link ${isActive('/admin') ? 'active' : ''}`}>
                  ⚙️ Admin
                </Link>
              )}
            </>
          )}
        </div>

        {/* Right Side Actions */}
        <div className="navbar-right">
          {/* System Status */}
          <div className="status-pill">
            <span className={`status-indicator ${cacheStatus}`}></span>
            <span className="status-label">{cacheStatus === 'connected' ? '🟢' : '🔴'} Sistema</span>
          </div>

          {/* Notifications Bell */}
          {user && (
            <div className="notification-menu">
              <button 
                className="notification-btn"
                onClick={() => setShowNotifications(!showNotifications)}
              >
                🔔
                {unreadCount > 0 && <span className="notification-badge">{unreadCount}</span>}
              </button>
              
              {showNotifications && (
                <div className="notification-dropdown">
                  <div className="notification-header">
                    <h3>Notificações</h3>
                    {unreadCount > 0 && (
                      <button 
                        className="btn-text-sm"
                        onClick={() => markAllAsRead()}
                      >
                        Marcar tudo como lido
                      </button>
                    )}
                  </div>
                  <div className="notification-list">
                    {notifications.length === 0 ? (
                      <p className="empty-state">Nenhuma notificação</p>
                    ) : (
                      notifications.slice(0, 5).map(n => (
                        <div key={n.id} className={`notification-item ${n.read ? 'read' : 'unread'}`}>
                          <div className="notification-type">{n.type === 'achievement' ? '🏆' : '📢'}</div>
                          <div className="notification-content">
                            <p className="notification-title">{n.title}</p>
                            <p className="notification-message">{n.message}</p>
                          </div>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* User Dropdown */}
          {user ? (
            <div className="user-dropdown">
              <button className="user-button">
                <div className="avatar">{user.name?.charAt(0).toUpperCase() || 'U'}</div>
                <div className="user-info-brief">
                  <span className="user-name">{user.name}</span>
                  <span className="user-role">{user.role === 'admin' ? '⚙️ Admin' : '👤 Usuário'}</span>
                </div>
              </button>
              <div className="dropdown-menu">
                <Link to="/workspace" className="dropdown-item">⚙️ Workspace</Link>
                <Link to="/subscription" className="dropdown-item">💎 Subscription</Link>
                <hr />
                <button className="dropdown-item" onClick={logout}>
                  🚪 Logout
                </button>
              </div>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary">Sign In</Link>
          )}
        </div>

        {/* Mobile Menu Toggle */}
        <button 
          className="mobile-menu-btn"
          onClick={() => setIsMenuOpen(!isMenuOpen)}
        >
          ☰
        </button>
      </nav>
    </header>
  );
}

/**
 * Modern App Footer com Links SaaS
 */
function AppFooter() {
  return (
    <footer className="app-footer">
      <div className="footer-grid">
        <div className="footer-column">
          <h3>📚 LabGrandisol</h3>
          <p>Biblioteca Virtual Inteligente com recursos SaaS avançados</p>
          <div className="tech-badges">
            <span className="tech-badge">React 18</span>
            <span className="tech-badge">TypeScript</span>
            <span className="tech-badge">Zustand</span>
          </div>
        </div>
        <div className="footer-column">
          <h4>Recursos</h4>
          <ul className="footer-links">
            <li><a href="#/">📚 Biblioteca</a></li>
            <li><a href="#/social">👥 Comunidade</a></li>
            <li><a href="#/reports">📊 Análises</a></li>
            <li><a href="#/workspace">⚙️ Workspace</a></li>
          </ul>
        </div>
        <div className="footer-column">
          <h4>Status do Sistema</h4>
          <ul className="status-list">
            <li><span className="status-badge success">✓</span> API Operacional</li>
            <li><span className="status-badge success">✓</span> Cache Online</li>
            <li><span className="status-badge success">✓</span> DB Sincronizado</li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p>&copy; 2024 LabGrandisol. Built with React, TypeScript & Zustand. Enterprise-grade Library Management.</p>
      </div>
    </footer>
  );
}

export default function App() {
  const { token } = useAuthStore();

  return (
    <BrowserRouter>
      <div className="app-wrapper">
        <AppHeader />
        <main className="app-main">
          <Routes>
            {/* Public Routes */}
            <Route path="/" element={<Home />} />
            <Route path="/login" element={<Login />} />

            {/* Protected Routes - Core Library */}
            <Route path="/library" element={<ProtectedRoute><Library /></ProtectedRoute>} />
            <Route path="/books/:id" element={<ProtectedRoute><BookDetail /></ProtectedRoute>} />
            <Route path="/my-loans" element={<ProtectedRoute><MyLoans /></ProtectedRoute>} />
            <Route path="/reading-list" element={<ProtectedRoute><ReadingList /></ProtectedRoute>} />

            {/* Protected Routes - Advanced Features */}
            <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
            <Route path="/social" element={<ProtectedRoute><Social /></ProtectedRoute>} />
            <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
            <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
            <Route path="/advanced" element={<ProtectedRoute><AdvancedLibrary /></ProtectedRoute>} />
            <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
            <Route path="/workspace" element={<ProtectedRoute><Workspace /></ProtectedRoute>} />
            <Route path="/subscription" element={<ProtectedRoute><Subscription /></ProtectedRoute>} />

            {/* Admin Routes */}
            <Route path="/admin/*" element={<AdminRoute><Admin /></AdminRoute>} />

            {/* Catch All */}
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </main>
        <AppFooter />
      </div>
    </BrowserRouter>
  );
}
