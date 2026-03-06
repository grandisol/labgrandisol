import React, { useState, useEffect } from 'react';
import { useAuth } from '../store/auth.js';
import { client } from '../api/client.js';
import '../styles/designTokens.css';
import '../styles/global.css';
import '../styles/metricsDashboard.css';

const MetricsDashboard = () => {
  const { user } = useAuth();
  const [metrics, setMetrics] = useState(null);
  const [health, setHealth] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [refreshInterval, setRefreshInterval] = useState(5000);

  const fetchMetrics = async () => {
    try {
      setLoading(true);
      setError(null);
      
      const [metricsResponse, healthResponse] = await Promise.all([
        client.get('/api/metrics'),
        client.get('/api/metrics')
      ]);

      setMetrics(metricsResponse.data.metrics);
      setHealth(metricsResponse.data.health);
    } catch (err) {
      console.error('Erro ao buscar métricas:', err);
      setError('Erro ao carregar métricas');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchMetrics();
    
    const interval = setInterval(fetchMetrics, refreshInterval);
    return () => clearInterval(interval);
  }, [refreshInterval]);

  const formatBytes = (bytes) => {
    if (bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const getHealthColor = (status) => {
    switch (status) {
      case 'healthy': return '#22c55e';
      case 'warning': return '#f59e0b';
      case 'critical': return '#ef4444';
      default: return '#6b7280';
    }
  };

  if (!user) {
    return (
      <div className="metrics-dashboard">
        <div className="metrics-header">
          <h1>Dashboard de Métricas</h1>
          <p>Área exclusiva para administradores</p>
        </div>
        <div className="metrics-content">
          <div className="metrics-card">
            <div className="metrics-error">
              <h3>⚠️ Acesso Negado</h3>
              <p>É necessário estar autenticado para visualizar as métricas do sistema.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="metrics-dashboard">
      <div className="metrics-header">
        <h1>📊 Dashboard de Métricas</h1>
        <div className="metrics-controls">
          <div className="refresh-control">
            <label>Atualização automática:</label>
            <select 
              value={refreshInterval} 
              onChange={(e) => setRefreshInterval(Number(e.target.value))}
            >
              <option value={2000}>2s</option>
              <option value={5000}>5s</option>
              <option value={10000}>10s</option>
              <option value={30000}>30s</option>
              <option value={0}>Desativado</option>
            </select>
          </div>
          <button onClick={fetchMetrics} className="refresh-btn">
            🔄 Atualizar
          </button>
        </div>
      </div>

      <div className="metrics-content">
        {loading && (
          <div className="metrics-loading">
            <div className="loading-spinner"></div>
            <p>Carregando métricas...</p>
          </div>
        )}

        {error && (
          <div className="metrics-error">
            <h3>❌ Erro</h3>
            <p>{error}</p>
            <button onClick={fetchMetrics} className="retry-btn">Tentar novamente</button>
          </div>
        )}

        {!loading && !error && metrics && health && (
          <>
            {/* Health Status */}
            <div className="metrics-grid">
              <div className="metrics-card health-card">
                <h3>🏥 Status de Saúde</h3>
                <div className="health-status">
                  <div 
                    className="health-indicator"
                    style={{ backgroundColor: getHealthColor(health.status) }}
                  >
                    {health.status.toUpperCase()}
                  </div>
                  <div className="health-details">
                    <p>Última verificação: {new Date().toLocaleTimeString()}</p>
                    <p>Tempo de atividade: {Math.floor(process.uptime())}s</p>
                  </div>
                </div>
                
                <div className="health-checks">
                  {Object.entries(health.checks).map(([name, check]) => (
                    <div key={name} className="health-check">
                      <span 
                        className="check-status"
                        style={{ backgroundColor: getHealthColor(check.status) }}
                      ></span>
                      <span className="check-name">{name}</span>
                      <span className="check-value">{check.usage || check.hitRate || check.slowQueries}</span>
                    </div>
                  ))}
                </div>
              </div>

              {/* System Overview */}
              <div className="metrics-card">
                <h3>🖥️ Visão Geral do Sistema</h3>
                <div className="system-metrics">
                  <div className="metric-item">
                    <span className="metric-label">Memória Usada</span>
                    <span className="metric-value">
                      {formatBytes(metrics.system.memoryUsage.heapUsed)}
                    </span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Memória Total</span>
                    <span className="metric-value">
                      {formatBytes(metrics.system.memoryUsage.heapTotal)}
                    </span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Uso de Heap</span>
                    <span className="metric-value">
                      {Math.round((metrics.system.memoryUsage.heapUsed / metrics.system.memoryUsage.heapTotal) * 100)}%
                    </span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Tempo de Atividade</span>
                    <span className="metric-value">
                      {Math.floor(metrics.system.uptime)}s
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Request Metrics */}
            <div className="metrics-grid">
              <div className="metrics-card">
                <h3>📈 Métricas de Requisições</h3>
                <div className="request-metrics">
                  <div className="metric-row">
                    <div className="metric-box">
                      <span className="metric-label">Total</span>
                      <span className="metric-value large">{metrics.requests.total}</span>
                    </div>
                    <div className="metric-box">
                      <span className="metric-label">Sucesso</span>
                      <span className="metric-value success">{metrics.requests.successful}</span>
                    </div>
                    <div className="metric-box">
                      <span className="metric-label">Falhas</span>
                      <span className="metric-value error">{metrics.requests.failed}</span>
                    </div>
                  </div>
                  
                  <div className="metric-row">
                    <div className="metric-box">
                      <span className="metric-label">Tempo Médio</span>
                      <span className="metric-value">
                        {Math.round(metrics.requests.responseTime.reduce((a, b) => a + b, 0) / metrics.requests.responseTime.length || 0)}ms
                      </span>
                    </div>
                    <div className="metric-box">
                      <span className="metric-label">Cache Hit Rate</span>
                      <span className="metric-value">
                        {Math.round(metrics.cache.hitRate)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>

              {/* Database Metrics */}
              <div className="metrics-card">
                <h3>🗄️ Métricas de Banco de Dados</h3>
                <div className="database-metrics">
                  <div className="metric-item">
                    <span className="metric-label">Consultas</span>
                    <span className="metric-value">{metrics.database.queries}</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Tempo Médio</span>
                    <span className="metric-value">{Math.round(metrics.database.avgQueryTime)}ms</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Consultas Lentas</span>
                    <span className="metric-value error">{metrics.database.slowQueries}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Detailed Metrics */}
            <div className="metrics-grid">
              <div className="metrics-card">
                <h3>📊 Detalhes de Requisições</h3>
                <div className="detailed-metrics">
                  <div className="metrics-section">
                    <h4>Métodos HTTP</h4>
                    {Object.entries(metrics.requests.byMethod).map(([method, count]) => (
                      <div key={method} className="method-metric">
                        <span className="method-label">{method}</span>
                        <span className="method-count">{count}</span>
                      </div>
                    ))}
                  </div>
                  
                  <div className="metrics-section">
                    <h4>Endpoints</h4>
                    {Object.entries(metrics.requests.byEndpoint).slice(0, 10).map(([endpoint, count]) => (
                      <div key={endpoint} className="endpoint-metric">
                        <span className="endpoint-label">{endpoint}</span>
                        <span className="endpoint-count">{count}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Cache Metrics */}
              <div className="metrics-card">
                <h3>💾 Métricas de Cache</h3>
                <div className="cache-metrics">
                  <div className="metric-item">
                    <span className="metric-label">Hits</span>
                    <span className="metric-value success">{metrics.cache.hits}</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Misses</span>
                    <span className="metric-value error">{metrics.cache.misses}</span>
                  </div>
                  <div className="metric-item">
                    <span className="metric-label">Taxa de Acerto</span>
                    <span className="metric-value">{Math.round(metrics.cache.hitRate)}%</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div className="metrics-actions">
              <button 
                onClick={() => {
                  client.get('/api/metrics/report').then(response => {
                    const blob = new Blob([response.data], { type: 'text/plain' });
                    const url = URL.createObjectURL(blob);
                    const a = document.createElement('a');
                    a.href = url;
                    a.download = `metrics-report-${new Date().toISOString()}.txt`;
                    document.body.appendChild(a);
                    a.click();
                    document.body.removeChild(a);
                    URL.revokeObjectURL(url);
                  });
                }}
                className="download-btn"
              >
                📄 Download Report
              </button>
              
              <button 
                onClick={() => {
                  // Limpar cache
                  client.post('/api/admin/cache/clear').then(() => {
                    alert('Cache limpo com sucesso!');
                    fetchMetrics();
                  });
                }}
                className="clear-cache-btn"
              >
                🗑️ Limpar Cache
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default MetricsDashboard;