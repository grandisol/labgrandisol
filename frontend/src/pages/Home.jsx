import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import '../styles/home.css';

/**
 * Modern Home Page Component
 * Features:
 * - Interactive hero section with gradient background
 * - Technology showcase
 * - Call-to-action buttons
 * - Responsive design
 */
export default function Home() {
  const navigate = useNavigate();
  const { token, user } = useAuthStore();

  return (
    <div className="home-page">
      {/* Hero Section */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1>Welcome to <span className="gradient-text">LabGrandisol</span></h1>
            <p className="hero-subtitle">A modern, secure platform built with cutting-edge technology</p>
            <div className="hero-buttons">
              {token ? (
                <>
                  <button onClick={() => navigate('/dashboard')} className="btn btn-primary">
                    🚀 Go to Dashboard
                  </button>
                  <span className="welcome-text">Welcome back, {user?.name || user?.email}!</span>
                </>
              ) : (
                <>
                  <button onClick={() => navigate('/login')} className="btn btn-primary">
                    🔐 Sign In
                  </button>
                  <button onClick={() => navigate('/login')} className="btn btn-secondary">
                    📝 Create Account
                  </button>
                </>
              )}
            </div>
          </div>
          <div className="hero-graphic">
            <div className="floating-card card-1">
              <div className="card-icon">⚙️</div>
              <p>TypeScript</p>
            </div>
            <div className="floating-card card-2">
              <div className="card-icon">💾</div>
              <p>Redis Cache</p>
            </div>
            <div className="floating-card card-3">
              <div className="card-icon">📦</div>
              <p>Bull Queue</p>
            </div>
          </div>
        </div>
      </section>

      {/* Technologies Section */}
      <section className="tech-showcase">
        <div className="section-header">
          <h2>Powered By Modern Stack</h2>
          <p>Enterprise-grade technology for production-ready applications</p>
        </div>

        <div className="tech-grid">
          <div className="tech-card">
            <div className="tech-icon">⚙️</div>
            <h3>TypeScript 5.3</h3>
            <p>Full type safety with strict mode enabled for both backend and frontend development</p>
            <div className="badge">Type Safe</div>
          </div>

          <div className="tech-card">
            <div className="tech-icon">💾</div>
            <h3>Redis Caching</h3>
            <p>70% faster response times with intelligent cache invalidation and TTL management</p>
            <div className="badge">Fast</div>
          </div>

          <div className="tech-card">
            <div className="tech-icon">📦</div>
            <h3>Bull Queue</h3>
            <p>Asynchronous job processing for emails, exports, and background tasks</p>
            <div className="badge">Async</div>
          </div>

          <div className="tech-card">
            <div className="tech-icon">🧪</div>
            <h3>Jest Testing</h3>
            <p>Comprehensive test suite with 60%+ code coverage for reliability</p>
            <div className="badge">Tested</div>
          </div>

          <div className="tech-card">
            <div className="tech-icon">🚀</div>
            <h3>CI/CD Pipeline</h3>
            <p>Automated testing, building, and deployment with GitHub Actions</p>
            <div className="badge">Automated</div>
          </div>

          <div className="tech-card">
            <div className="tech-icon">🔒</div>
            <h3>Security First</h3>
            <p>JWT authentication, bcryptjs hashing, CORS protection, and input validation</p>
            <div className="badge">Secure</div>
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="features-section">
        <div className="section-header">
          <h2>Key Features</h2>
          <p>Everything you need for modern development</p>
        </div>

        <div className="features-grid">
          <div className="feature-card">
            <div className="feature-icon">📝</div>
            <h3>Notes Management</h3>
            <p>Create, organize, and manage notes with full markdown support and real-time updates</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">👥</div>
            <h3>User Management</h3>
            <p>Role-based access control with admin panel for user and permission management</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">📊</div>
            <h3>Analytics Dashboard</h3>
            <p>Real-time performance metrics, cache statistics, and system monitoring</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🔔</div>
            <h3>Real-time Updates</h3>
            <p>Live notifications and cache status indicators for system health</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">⚡</div>
            <h3>High Performance</h3>
            <p>Optimized caching, queue processing, and database queries for speed</p>
          </div>

          <div className="feature-card">
            <div className="feature-icon">🛡️</div>
            <h3>Enterprise Security</h3>
            <p>End-to-end encryption, secure authentication, and compliance ready</p>
          </div>
        </div>
      </section>

      {/* Architecture Section */}
      <section className="architecture-section">
        <div className="section-header">
          <h2>Modern Architecture</h2>
          <p>Built with scalability and maintainability in mind</p>
        </div>

        <div className="architecture-grid">
          <div className="arch-block">
            <h4>🖧 Backend</h4>
            <ul>
              <li>Node.js with Express</li>
              <li>TypeScript with strict mode</li>
              <li>PostgreSQL database</li>
              <li>Redis cache layer</li>
              <li>Bull job queue</li>
            </ul>
          </div>

          <div className="arch-block">
            <h4>🖥️ Frontend</h4>
            <ul>
              <li>React 18+ with Hooks</li>
              <li>Vite for fast builds</li>
              <li>Modern CSS with Grid/Flexbox</li>
              <li>Dark mode support</li>
              <li>Responsive design</li>
            </ul>
          </div>

          <div className="arch-block">
            <h4>🔧 DevOps</h4>
            <ul>
              <li>Docker & Docker Compose</li>
              <li>GitHub Actions CI/CD</li>
              <li>Automated testing</li>
              <li>Code coverage reports</li>
              <li>Containerized deployment</li>
            </ul>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="cta-section">
        <h2>Ready to Get Started?</h2>
        <p>Join thousands of developers using LabGrandisol</p>
        {!token && (
          <button onClick={() => navigate('/login')} className="btn btn-primary btn-large">
            🚀 Create Your Account Now
          </button>
        )}
      </section>
    </div>
  );
}
