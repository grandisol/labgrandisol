import { useState, useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Link, useLocation } from 'react-router-dom';
import { useAuthStore } from './store/auth';
import { useNotificationsStore } from './store/notifications';
import './styles/designTokens.css';
import './styles/global.css';

// Páginas (Lazy Loading)
const Home = React.lazy(() => import('./pages/Home'));
const Login = React.lazy(() => import('./pages/Login'));
const Dashboard = React.lazy(() => import('./pages/Dashboard'));
const Admin = React.lazy(() => import('./pages/Admin'));
const Library = React.lazy(() => import('./pages/Library'));
const BookDetail = React.lazy(() => import('./pages/BookDetail'));
const MyLoans = React.lazy(() => import('./pages/MyLoans'));
const ReadingList = React.lazy(() => import('./pages/ReadingList'));
const Notifications = React.lazy(() => import('./pages/Notifications'));
const Search = React.lazy(() => import('./pages/Search'));
const Social = React.lazy(() => import('./pages/Social'));
const Reports = React.lazy(() => import('./pages/Reports'));
const AdvancedLibrary = React.lazy(() => import('./pages/AdvancedLibrary'));
const Workspace = React.lazy(() => import('./pages/Workspace'));
const Museum = React.lazy(() => import('./pages/Museum'));
const ReadingTracker = React.lazy(() => import('./pages/ReadingTracker'));
const MetricsDashboard = React.lazy(() => import('./pages/MetricsDashboard'));
const Alerts = React.lazy(() => import('./pages/Alerts'));

// Componentes
const LoadingSpinner = () => (
  <div className="loading-container">
    <div className="loading-spinner"></div>
    <p>Carregando...</p>
  </div>
);

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
        <Link to="/" className="navbar-brand">
          <span className="brand-icon">📖</span>
          <div className="brand-text">
            <h1>LabGrandisol</h1>
            <span className="branding-badge">Biblioteca Virtual</span>
          </div>
        </Link>

        <div className={`navbar-menu ${isMenuOpen ? 'open' : ''}`}>
          {user && (
            <>
              <Link to="/" className={`navbar-link ${isActive('/') && location.pathname === '/' ? 'active' : ''}`}>
                Início
              </Link>
              <Link to="/library" className={`navbar-link ${isActive('/library') ? 'active' : ''}`}>
                Biblioteca
              </Link>
              <Link to="/museum" className={`navbar-link ${isActive('/museum') ? 'active' : ''}`}>
                Almanaque
              </Link>
              <Link to="/search" className={`navbar-link ${isActive('/search') ? 'active' : ''}`}>
                Busca
              </Link>
              <Link to="/social" className={`navbar-link ${isActive('/social') ? 'active' : ''}`}>
                Social
              </Link>
              <Link to="/reports" className={`navbar-link ${isActive('/reports') ? 'active' : ''}`}>
                Relatórios
              </Link>
              <Link to="/dashboard" className={`navbar-link ${isActive('/dashboard') ? 'active' : ''}`}>
                Painel
              </Link>
              {user.role === 'admin' && (
                <Link to="/admin" className={`navbar-link admin-link ${isActive('/admin') ? 'active' : ''}`}>
                  Administração
                </Link>
              )}
            </>
          )}
        </div>

        <div className="navbar-right">
          <div className="status-pill">
            <span className={`status-indicator ${cacheStatus}`}></span>
            <span className="status-label">Sistema</span>
          </div>

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
                      <button className="btn-text-sm" onClick={() => markAllAsRead()}>
                        Marcar como lido
                      </button>
                    )}
                  </div>
                  <div className="notification-list">
                    {notifications.length === 0 ? (
                      <p style={{ padding: '16px', textAlign: 'center', color: 'var(--text-muted)' }}>
                        Nenhuma notificação
                      </p>
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

          {user ? (
            <div className="user-dropdown">
              <button className="user-button">
                <div className="avatar">{user.name?.charAt(0).toUpperCase() || 'U'}</div>
                <div className="user-info-brief">
                  <span className="user-name">{user.name}</span>
                  <span className="user-role">{user.role === 'admin' ? 'Administrador' : 'Membro'}</span>
                </div>
              </button>
              <div className="dropdown-menu">
                <Link to="/workspace" className="dropdown-item">⚙️ Workspace</Link>
                <Link to="/advanced" className="dropdown-item">✨ Avançado</Link>
                <Link to="/reading-tracker" className="dropdown-item">📊 Leitura</Link>
                <hr />
                <button className="dropdown-item" onClick={logout}>
                  🚪 Sair
                </button>
              </div>
            </div>
          ) : (
            <Link to="/login" className="btn btn-primary">Entrar</Link>
          )}

          <button 
            className="mobile-menu-btn"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            ☰
          </button>
        </div>
      </nav>
    </header>
  );
}

function AppFooter() {
  return (
    <footer className="app-footer">
      <div className="footer-grid">
        <div className="footer-column">
          <h3>📖 LabGrandisol</h3>
          <p>Sistema de Biblioteca Virtual com recursos avançados de gestão e pesquisa acadêmica.</p>
          <div className="tech-badges">
            <span className="tech-badge">React</span>
            <span className="tech-badge">Node.js</span>
            <span className="tech-badge">PostgreSQL</span>
          </div>
        </div>
        <div className="footer-column">
          <h4>Recursos</h4>
          <ul className="footer-links">
            <li><Link to="/library">📚 Acervo</Link></li>
            <li><Link to="/museum">🌿 Almanaque Botânico</Link></li>
            <li><Link to="/social">👥 Comunidade</Link></li>
            <li><Link to="/reports">📊 Relatórios</Link></li>
          </ul>
        </div>
        <div className="footer-column">
          <h4>Status do Sistema</h4>
          <ul className="status-list">
            <li><span className="status-badge success">✓</span> API Operacional</li>
            <li><span className="status-badge success">✓</span> Banco de Dados Online</li>
            <li><span className="status-badge success">✓</span> Cache Ativo</li>
          </ul>
        </div>
      </div>
      <div className="footer-bottom">
        <p>© 2024 LabGrandisol — Sistema de Gestão de Biblioteca Virtual</p>
      </div>
    </footer>
  );
}

export default function App() {
  return (
    <BrowserRouter>
      <div className="app-wrapper">
        <AppHeader />
        <main className="app-main">
          <React.Suspense fallback={<LoadingSpinner />}>
            <Routes>
              {/* Páginas Públicas */}
              <Route path="/" element={<Home />} />
              <Route path="/login" element={<Login />} />
              
              {/* Biblioteca (pública) */}
              <Route path="/library" element={<Library />} />
              <Route path="/books" element={<Navigate to="/library" replace />} />
              <Route path="/library/:id" element={<BookDetail />} />
              
              {/* Almanaque Botânico (público) */}
              <Route path="/museum" element={<Museum />} />
              
              {/* Páginas Protegidas */}
              <Route path="/search" element={<ProtectedRoute><Search /></ProtectedRoute>} />
              <Route path="/social" element={<ProtectedRoute><Social /></ProtectedRoute>} />
              <Route path="/notifications" element={<ProtectedRoute><Notifications /></ProtectedRoute>} />
              <Route path="/reports" element={<ProtectedRoute><Reports /></ProtectedRoute>} />
              <Route path="/advanced" element={<ProtectedRoute><AdvancedLibrary /></ProtectedRoute>} />
              <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
              <Route path="/workspace" element={<ProtectedRoute><Workspace /></ProtectedRoute>} />
              <Route path="/reading-tracker" element={<ProtectedRoute><ReadingTracker /></ProtectedRoute>} />
              <Route path="/my-loans" element={<ProtectedRoute><MyLoans /></ProtectedRoute>} />
              <Route path="/reading-list" element={<ProtectedRoute><ReadingList /></ProtectedRoute>} />
              
              {/* Admin (requer permissão) */}
              <Route path="/admin/*" element={<AdminRoute><Admin /></AdminRoute>} />
              <Route path="/metrics" element={<AdminRoute><MetricsDashboard /></AdminRoute>} />
              <Route path="/alerts" element={<AdminRoute><Alerts /></AdminRoute>} />
              
              {/* Redirecionamento */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </React.Suspense>
        </main>
        <AppFooter />
      </div>
    </BrowserRouter>
  );
}
