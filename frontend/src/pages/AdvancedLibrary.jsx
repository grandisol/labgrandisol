import { useState, useEffect } from 'react';
import '../styles/designTokens.css';
import '../styles/global.css';
import '../styles/advancedLibrary.css';

export default function AdvancedLibrary() {
  const [activeTab, setActiveTab] = useState('analytics');
  const [analytics, setAnalytics] = useState(null);

  // Get auth token from sessionStorage
  const getAuthHeaders = () => {
    const token = sessionStorage.getItem('auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    const loadAnalytics = async () => {
      try {
        const response = await fetch('/api/advanced/analytics', {
          headers: getAuthHeaders()
        });
        const data = await response.json();
        setAnalytics(data);
      } catch (error) {
        console.error('Erro:', error);
      }
    };
    if (activeTab === 'analytics') loadAnalytics();
  }, [activeTab]);

  return (
    <div className="advanced-page">
      <div className="advanced-header">
        <div className="header-content">
          <div className="header-ornament">❧</div>
          <h1>Recursos Avançados</h1>
          <p>Ferramentas premium para usuários avançados</p>
        </div>
      </div>

      <div className="advanced-content">
        <div className="advanced-tabs">
          <button 
            className={`tab-btn ${activeTab === 'analytics' ? 'active' : ''}`}
            onClick={() => setActiveTab('analytics')}
          >
            📊 Análises
          </button>
          <button 
            className={`tab-btn ${activeTab === 'export' ? 'active' : ''}`}
            onClick={() => setActiveTab('export')}
          >
            📤 Exportar
          </button>
          <button 
            className={`tab-btn ${activeTab === 'import' ? 'active' : ''}`}
            onClick={() => setActiveTab('import')}
          >
            📥 Importar
          </button>
          <button 
            className={`tab-btn ${activeTab === 'api' ? 'active' : ''}`}
            onClick={() => setActiveTab('api')}
          >
            🔌 API
          </button>
        </div>

        <div className="advanced-panel">
          {activeTab === 'analytics' && (
            <div className="panel-content">
              <h2>Análises Avançadas</h2>
              <div className="analytics-grid">
                <div className="analytics-card">
                  <h3>📚 Tendências de Leitura</h3>
                  <div className="chart-placeholder">
                    <span>Gráfico de tendências</span>
                  </div>
                </div>
                <div className="analytics-card">
                  <h3>⏱️ Tempo Médio de Leitura</h3>
                  <div className="metric">
                    <span className="metric-value">2.5h</span>
                    <span className="metric-label">por semana</span>
                  </div>
                </div>
                <div className="analytics-card">
                  <h3>📖 Gêneros Favoritos</h3>
                  <ul className="genre-list">
                    <li><span>Romance</span><span>45%</span></li>
                    <li><span>Ficção</span><span>30%</span></li>
                    <li><span>Clássicos</span><span>25%</span></li>
                  </ul>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'export' && (
            <div className="panel-content">
              <h2>Exportar Dados</h2>
              <p className="panel-desc">Exporte seus dados em diferentes formatos</p>
              <div className="export-options">
                <div className="export-card">
                  <span className="export-icon">📄</span>
                  <h4>PDF</h4>
                  <p>Relatório completo em PDF</p>
                  <button className="btn btn-secondary">Exportar</button>
                </div>
                <div className="export-card">
                  <span className="export-icon">📊</span>
                  <h4>CSV</h4>
                  <p>Dados em planilha</p>
                  <button className="btn btn-secondary">Exportar</button>
                </div>
                <div className="export-card">
                  <span className="export-icon">📋</span>
                  <h4>JSON</h4>
                  <p>Dados estruturados</p>
                  <button className="btn btn-secondary">Exportar</button>
                </div>
              </div>
            </div>
          )}

          {activeTab === 'import' && (
            <div className="panel-content">
              <h2>Importar Dados</h2>
              <p className="panel-desc">Importe listas de livros de outras plataformas</p>
              <div className="import-zone">
                <span className="import-icon">📁</span>
                <p>Arraste arquivos aqui ou clique para selecionar</p>
                <p className="import-formats">Formatos aceitos: CSV, JSON</p>
              </div>
            </div>
          )}

          {activeTab === 'api' && (
            <div className="panel-content">
              <h2>API de Integração</h2>
              <p className="panel-desc">Integre suas aplicações com a LabGrandisol</p>
              <div className="api-section">
                <h4>Sua Chave de API</h4>
                <div className="api-key">
                  <code>sk-xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx</code>
                  <button className="btn btn-sm btn-secondary">Copiar</button>
                </div>
                <div className="api-docs">
                  <h4>Documentação</h4>
                  <p>Consulte nossa documentação completa para integrar com seus sistemas.</p>
                  <a href="/api/docs" className="btn btn-primary">Ver Documentação</a>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}