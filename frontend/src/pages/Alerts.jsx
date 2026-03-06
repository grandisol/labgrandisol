import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/auth';
import { useNotificationsStore } from '../store/notifications';
import '../styles/designTokens.css';
import '../styles/global.css';
import '../styles/alerts.css';

function Alerts() {
  const { user } = useAuthStore();
  const { fetchNotifications } = useNotificationsStore();
  const [alerts, setAlerts] = useState([]);
  const [rules, setRules] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (user?.role === 'admin') {
      fetchAlerts();
      fetchRules();
    }
  }, [user]);

  const fetchAlerts = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/admin/alerts/history?limit=100');
      if (!response.ok) throw new Error('Erro ao buscar alertas');
      const data = await response.json();
      setAlerts(data.history || []);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const fetchRules = async () => {
    try {
      const response = await fetch('/api/admin/alerts/rules');
      if (!response.ok) throw new Error('Erro ao buscar regras');
      const data = await response.json();
      setRules(data.rules || []);
    } catch (err) {
      console.error('Erro ao buscar regras:', err);
    }
  };

  const handleRuleToggle = async (ruleId, enabled) => {
    try {
      const endpoint = enabled ? 'enable' : 'disable';
      const response = await fetch(`/api/admin/alerts/rules/${ruleId}/${endpoint}`, {
        method: 'PUT',
      });
      
      if (response.ok) {
        fetchRules();
        fetchAlerts();
      }
    } catch (err) {
      console.error('Erro ao alterar regra:', err);
    }
  };

  const formatSeverity = (severity) => {
    const colors = {
      low: '#22c55e',
      medium: '#f59e0b',
      high: '#ef4444',
      critical: '#dc2626'
    };
    return {
      label: severity.toUpperCase(),
      color: colors[severity] || '#6b7280'
    };
  };

  const formatTimestamp = (timestamp) => {
    return new Date(timestamp).toLocaleString('pt-BR');
  };

  if (!user || user.role !== 'admin') {
    return (
      <div className="alerts-container">
        <div className="alerts-header">
          <h1>🚨 Monitoramento de Sistema</h1>
          <p>Área exclusiva para administradores</p>
        </div>
        <div className="alerts-error">
          <div className="error-icon">🔒</div>
          <h2>Acesso Negado</h2>
          <p>Esta área é exclusiva para administradores do sistema.</p>
        </div>
      </div>
    );
  }

  if (loading) {
    return (
      <div className="alerts-container">
        <div className="alerts-header">
          <h1>🚨 Monitoramento de Sistema</h1>
          <p>Gerenciamento de alertas e regras de monitoramento</p>
        </div>
        <div className="alerts-loading">
          <div className="loading-spinner"></div>
          <p>Carregando alertas...</p>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="alerts-container">
        <div className="alerts-header">
          <h1>🚨 Monitoramento de Sistema</h1>
          <p>Gerenciamento de alertas e regras de monitoramento</p>
        </div>
        <div className="alerts-error">
          <div className="error-icon">⚠️</div>
          <h2>Erro ao Carregar</h2>
          <p>{error}</p>
          <button onClick={fetchAlerts} className="retry-btn">Tentar Novamente</button>
        </div>
      </div>
    );
  }

  return (
    <div className="alerts-container">
      <div className="alerts-header">
        <h1>🚨 Monitoramento de Sistema</h1>
        <p>Gerenciamento de alertas e regras de monitoramento</p>
      </div>

      <div className="alerts-content">
        {/* Regras de Alerta */}
        <div className="alerts-section">
          <div className="section-header">
            <h2>Regras de Alerta</h2>
            <div className="section-actions">
              <button onClick={fetchRules} className="refresh-btn">🔄 Atualizar</button>
            </div>
          </div>
          
          <div className="rules-grid">
            {rules.map(rule => {
              const status = rule.enabled ? 'enabled' : 'disabled';
              return (
                <div key={rule.id} className={`rule-card ${status}`}>
                  <div className="rule-header">
                    <h3>{rule.name}</h3>
                    <span className={`status-badge ${status}`}>
                      {rule.enabled ? 'ATIVA' : 'DESATIVADA'}
                    </span>
                  </div>
                  <p className="rule-description">{rule.description}</p>
                  <div className="rule-meta">
                    <span className="rule-severity">
                      Severidade: {rule.severity.toUpperCase()}
                    </span>
                    <span className="rule-cooldown">
                      Cooldown: {Math.floor(rule.cooldown / 60000)} min
                    </span>
                  </div>
                  <div className="rule-actions">
                    <button 
                      onClick={() => handleRuleToggle(rule.id, !rule.enabled)}
                      className={`toggle-btn ${rule.enabled ? 'btn-danger' : 'btn-success'}`}
                    >
                      {rule.enabled ? 'Desativar' : 'Ativar'}
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Histórico de Alertas */}
        <div className="alerts-section">
          <div className="section-header">
            <h2>Histórico de Alertas</h2>
            <div className="section-actions">
              <button onClick={fetchAlerts} className="refresh-btn">🔄 Atualizar</button>
            </div>
          </div>
          
          <div className="alerts-list">
            {alerts.length === 0 ? (
              <div className="empty-state">
                <div className="empty-icon">📊</div>
                <h3>Nenhum alerta registrado</h3>
                <p>Quando os alertas forem disparados, eles aparecerão aqui.</p>
              </div>
            ) : (
              alerts.map(alert => {
                const severity = formatSeverity(alert.severity);
                return (
                  <div key={`${alert.ruleId}-${alert.timestamp}`} className="alert-item">
                    <div className="alert-header">
                      <span 
                        className="severity-indicator"
                        style={{ backgroundColor: severity.color }}
                      ></span>
                      <div className="alert-title">
                        <h3>{alert.ruleId}</h3>
                        <span className="alert-severity">{severity.label}</span>
                      </div>
                      <span className="alert-time">{formatTimestamp(alert.timestamp)}</span>
                    </div>
                    <div className="alert-message">
                      {alert.message}
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default Alerts;