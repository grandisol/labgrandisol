import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import '../styles/login.css';

/**
 * Modern Login/Register Component
 * Features:
 * - Toggle between login and register modes
 * - Form validation
 * - Error handling
 * - Loading states
 * - Responsive design
 */
export default function Login() {
  const navigate = useNavigate();
  const { login, register, isLoading, error } = useAuthStore();
  const [isRegister, setIsRegister] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
    name: ''
  });
  const [formError, setFormError] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData({ ...formData, [name]: value });
    setFormError('');
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Validation
    if (!formData.email.trim()) {
      setFormError('Email is required');
      return;
    }
    if (!formData.password.trim()) {
      setFormError('Password is required');
      return;
    }
    if (isRegister && !formData.name.trim()) {
      setFormError('Name is required');
      return;
    }

    try {
      if (isRegister) {
        const result = await register(formData.email, formData.password, formData.name);
        if (result?.token) {
          navigate('/dashboard');
        }
      } else {
        const result = await login(formData.email, formData.password);
        if (result?.token) {
          navigate('/dashboard');
        }
      }
    } catch (err) {
      console.error('Authentication error:', err.message);
    }
  };

  return (
    <div className="login-page">
      {/* Left Section - Branding */}
      <section className="login-branding">
        <div className="branding-content">
          <div className="branding-icon">🔬</div>
          <h1>LabGrandisol</h1>
          <p>Enterprise-Grade Note Management</p>
          
          <div className="branding-features">
            <div className="feature-item">
              <span className="feature-icon">✅</span>
              <span>TypeScript & Type Safety</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">✅</span>
              <span>Redis Caching</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">✅</span>
              <span>Advanced Security</span>
            </div>
            <div className="feature-item">
              <span className="feature-icon">✅</span>
              <span>Real-time Sync</span>
            </div>
          </div>

          <p className="branding-subtitle">Join thousands of developers using LabGrandisol</p>
        </div>
      </section>

      {/* Right Section - Form */}
      <section className="login-form-section">
        <div className="form-container">
          <div className="form-header">
            <h2>{isRegister ? 'Create Account' : 'Welcome Back'}</h2>
            <p>{isRegister ? 'Join our community' : 'Sign in to your account'}</p>
          </div>

          <form className="auth-form" onSubmit={handleSubmit}>
            {isRegister && (
              <div className="form-group">
                <label htmlFor="name">Full Name</label>
                <input
                  id="name"
                  type="text"
                  name="name"
                  placeholder="John Doe"
                  value={formData.name}
                  onChange={handleChange}
                  disabled={isLoading}
                  required={isRegister}
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email Address</label>
              <input
                id="email"
                type="email"
                name="email"
                placeholder="you@example.com"
                value={formData.email}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Password</label>
              <input
                id="password"
                type="password"
                name="password"
                placeholder="Enter your password"
                value={formData.password}
                onChange={handleChange}
                disabled={isLoading}
                required
              />
            </div>

            {(error || formError) && (
              <div className="alert alert-error">
                <span>⚠️</span>
                <span>{error || formError}</span>
              </div>
            )}

            <button type="submit" className="btn btn-primary btn-block" disabled={isLoading}>
              {isLoading ? (
                <>
                  <span className="spinner-small"></span>
                  {isRegister ? 'Creating Account...' : 'Signing In...'}
                </>
              ) : (
                isRegister ? 'Create Account' : 'Sign In'
              )}
            </button>
          </form>

          <div className="form-divider">
            <span>or</span>
          </div>

          <div className="form-toggle">
            {isRegister ? (
              <p>Already have an account? 
                <button 
                  type="button"
                  className="link-btn" 
                  onClick={() => setIsRegister(false)}
                >
                  Sign In
                </button>
              </p>
            ) : (
              <p>Don't have an account? 
                <button 
                  type="button"
                  className="link-btn" 
                  onClick={() => setIsRegister(true)}
                >
                  Create Account
                </button>
              </p>
            )}
          </div>

          <p className="form-disclaimer">
            By {isRegister ? 'creating an account' : 'signing in'}, you agree to our Terms of Service and Privacy Policy
          </p>
        </div>
      </section>
    </div>
  );
}
