import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuthStore } from '../store/auth';
import '../styles/designTokens.css';
import '../styles/global.css';
import '../styles/login.css';

export default function Login() {
  const navigate = useNavigate();
  const { login, register, isLoading, error } = useAuthStore();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [isRegister, setIsRegister] = useState(false);
  const [name, setName] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [localError, setLocalError] = useState(null);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLocalError(null);
    
    if (!email || !password) {
      setLocalError('Por favor, preencha todos os campos.');
      return;
    }

    if (isRegister && !name) {
      setLocalError('Por favor, informe seu nome.');
      return;
    }

    if (password.length < 6) {
      setLocalError('A senha deve ter pelo menos 6 caracteres.');
      return;
    }

    try {
      if (isRegister) {
        await register(email, password, name);
      } else {
        await login(email, password);
      }
      navigate('/library');
    } catch (err) {
      // Error is handled by the store
    }
  };

  const handleDemoLogin = async (type) => {
    if (type === 'admin') {
      setEmail('admin@labgrandisol.com');
      setPassword('admin123');
      try {
        await login('admin@labgrandisol.com', 'admin123');
        navigate('/library');
      } catch (err) {
        // Error handled by store
      }
    } else {
      setEmail('usuario@labgrandisol.com');
      setPassword('user123');
      try {
        await login('usuario@labgrandisol.com', 'user123');
        navigate('/library');
      } catch (err) {
        // Error handled by store
      }
    }
  };

  return (
    <div className="login-page">
      <div className="login-container">
        <div className="login-decoration">
          <div className="decoration-pattern"></div>
          <div className="decoration-content">
            <div className="decoration-icon">📖</div>
            <h2>LabGrandisol</h2>
            <p>Biblioteca Virtual</p>
            <div className="decoration-quote">
              <span className="quote-mark">"</span>
              <p>Um livro deve ser o machado que quebra o mar gelado dentro de nós.</p>
              <span className="quote-author">— Franz Kafka</span>
            </div>
          </div>
        </div>

        <div className="login-form-container">
          <div className="login-header">
            <div className="login-ornament">❧</div>
            <h1>{isRegister ? 'Criar Conta' : 'Bem-vindo de volta'}</h1>
            <p>{isRegister ? 'Junte-se à nossa comunidade de leitores' : 'Entre para explorar o acervo'}</p>
          </div>

          {error && (
            <div className="alert alert-danger" role="alert" aria-live="polite">
              <span aria-hidden="true">⚠️</span>
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="login-form">
            {isRegister && (
              <div className="form-group">
                <label htmlFor="name">Nome Completo</label>
                <input
                  type="text"
                  id="name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  placeholder="Seu nome"
                  autoComplete="name"
                  required={isRegister}
                  aria-required={isRegister}
                />
              </div>
            )}

            <div className="form-group">
              <label htmlFor="email">Email</label>
              <input
                type="email"
                id="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="seu@email.com"
                autoComplete="email"
                required
                aria-required="true"
              />
            </div>

            <div className="form-group">
              <label htmlFor="password">Senha</label>
              <div className="password-input-wrapper">
                <input
                  type={showPassword ? 'text' : 'password'}
                  id="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder="••••••••"
                  autoComplete={isRegister ? 'new-password' : 'current-password'}
                  required
                  aria-required="true"
                  minLength="6"
                />
                <button
                  type="button"
                  className="password-toggle"
                  onClick={() => setShowPassword(!showPassword)}
                  aria-label={showPassword ? 'Ocultar senha' : 'Mostrar senha'}
                >
                  {showPassword ? '👁️' : '👁️‍🗨️'}
                </button>
              </div>
              <small className="password-hint">Mínimo de 6 caracteres</small>
            </div>

            <button 
              type="submit" 
              className="btn btn-primary btn-large w-100"
              disabled={isLoading}
            >
              {isLoading ? (
                <>Carregando...</>
              ) : isRegister ? (
                <>✨ Criar Conta</>
              ) : (
                <>🔐 Entrar</>
              )}
            </button>
          </form>

          <div className="login-divider">
            <span>ou</span>
          </div>

          <div className="demo-buttons">
            <button 
              type="button"
              className="btn btn-secondary demo-btn"
              onClick={() => handleDemoLogin('admin')}
              disabled={isLoading}
            >
              👑 Entrar como Admin
            </button>
            <button 
              type="button"
              className="btn btn-ghost demo-btn"
              onClick={() => handleDemoLogin('user')}
              disabled={isLoading}
            >
              👤 Entrar como Usuário
            </button>
          </div>

          <div className="login-switch">
            <p>
              {isRegister ? 'Já tem uma conta?' : 'Ainda não tem conta?'}
              <button 
                type="button"
                className="btn-text"
                onClick={() => {
                  setIsRegister(!isRegister);
                  setLocalError(null);
                }}
              >
                {isRegister ? 'Fazer Login' : 'Criar Conta'}
              </button>
            </p>
          </div>

          <div className="login-footer">
            <p>Sistema de demonstração</p>
            <p className="footer-small">
              Credenciais: admin@labgrandisol.com / admin123
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}