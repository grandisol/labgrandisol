import { useState, useEffect } from 'react';
import '../styles/designTokens.css';
import '../styles/global.css';
import '../styles/workspace.css';

export default function Workspace() {
  const [preferences, setPreferences] = useState({
    theme: 'vintage',
    notifications: true,
    emailUpdates: false,
    language: 'pt-BR'
  });

  // Get auth token from sessionStorage
  const getAuthHeaders = () => {
    const token = sessionStorage.getItem('auth_token');
    return token ? { Authorization: `Bearer ${token}`, 'Content-Type': 'application/json' } : { 'Content-Type': 'application/json' };
  };

  const handleSave = async () => {
    try {
      await fetch('/api/saas/preferences', {
        method: 'POST',
        headers: getAuthHeaders(),
        body: JSON.stringify(preferences)
      });
      alert('Preferências salvas com sucesso!');
    } catch (error) {
      console.error('Erro:', error);
    }
  };

  return (
    <div className="workspace-page">
      <div className="workspace-header">
        <div className="header-content">
          <div className="header-ornament">❧</div>
          <h1>Meu Workspace</h1>
          <p>Personalize sua experiência</p>
        </div>
      </div>

      <div className="workspace-content">
        <section className="workspace-section">
          <h2>Preferências de Leitura</h2>
          <div className="preferences-grid">
            <div className="preference-item">
              <label>Tema</label>
              <select 
                value={preferences.theme}
                onChange={(e) => setPreferences({...preferences, theme: e.target.value})}
              >
                <option value="vintage">Vintage Clássico</option>
                <option value="light">Claro</option>
                <option value="dark">Escuro</option>
              </select>
            </div>
            <div className="preference-item">
              <label>Idioma</label>
              <select 
                value={preferences.language}
                onChange={(e) => setPreferences({...preferences, language: e.target.value})}
              >
                <option value="pt-BR">Português (Brasil)</option>
                <option value="en">English</option>
                <option value="es">Español</option>
              </select>
            </div>
          </div>
        </section>

        <section className="workspace-section">
          <h2>Notificações</h2>
          <div className="toggle-list">
            <div className="toggle-item">
              <div className="toggle-info">
                <span className="toggle-title">Notificações do Sistema</span>
                <span className="toggle-desc">Receba alertas sobre empréstimos e devoluções</span>
              </div>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={preferences.notifications}
                  onChange={(e) => setPreferences({...preferences, notifications: e.target.checked})}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
            <div className="toggle-item">
              <div className="toggle-info">
                <span className="toggle-title">Atualizações por Email</span>
                <span className="toggle-desc">Receba novidades e recomendações</span>
              </div>
              <label className="toggle-switch">
                <input 
                  type="checkbox" 
                  checked={preferences.emailUpdates}
                  onChange={(e) => setPreferences({...preferences, emailUpdates: e.target.checked})}
                />
                <span className="toggle-slider"></span>
              </label>
            </div>
          </div>
        </section>

        <section className="workspace-section">
          <h2>Estatísticas Pessoais</h2>
          <div className="personal-stats">
            <div className="personal-stat">
              <span className="stat-value">47</span>
              <span className="stat-label">Livros Lidos</span>
            </div>
            <div className="personal-stat">
              <span className="stat-value">12</span>
              <span className="stat-label">Este Ano</span>
            </div>
            <div className="personal-stat">
              <span className="stat-value">156</span>
              <span className="stat-label">Horas de Leitura</span>
            </div>
          </div>
        </section>

        <div className="workspace-actions">
          <button className="btn btn-primary" onClick={handleSave}>
            Salvar Preferências
          </button>
        </div>
      </div>
    </div>
  );
}