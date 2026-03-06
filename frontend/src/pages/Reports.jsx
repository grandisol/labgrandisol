import { useState, useEffect } from 'react';
import '../styles/designTokens.css';
import '../styles/global.css';
import '../styles/reports.css';

// Importações para suporte multi-linguagem
import { 
  Code, 
  FileText, 
  Database, 
  Cpu, 
  Globe, 
  Terminal,
  FileCode,
  FileBinary,
  FileJson,
  FileXml
} from 'lucide-react';

export default function Reports() {
  const [readingReport, setReadingReport] = useState(null);
  const [collectionsReport, setCollectionsReport] = useState(null);
  const [achievementsReport, setAchievementsReport] = useState(null);
  const [socialReport, setSocialReport] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeSection, setActiveSection] = useState('reading');

  // Get auth token from sessionStorage
  const getAuthHeaders = () => {
    const token = sessionStorage.getItem('auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    loadReports();
  }, []);

  const loadReports = async () => {
    setLoading(true);
    try {
      // Load reading report
      const readingRes = await fetch('/api/reports/reading', {
        headers: getAuthHeaders()
      });
      if (readingRes.ok) {
        const data = await readingRes.json();
        setReadingReport(data);
      }

      // Load collections report
      const collectionsRes = await fetch('/api/reports/collections', {
        headers: getAuthHeaders()
      });
      if (collectionsRes.ok) {
        const data = await collectionsRes.json();
        setCollectionsReport(data);
      }

      // Load achievements report
      const achievementsRes = await fetch('/api/reports/achievements', {
        headers: getAuthHeaders()
      });
      if (achievementsRes.ok) {
        const data = await achievementsRes.json();
        setAchievementsReport(data);
      }

      // Load social report
      const socialRes = await fetch('/api/reports/social', {
        headers: getAuthHeaders()
      });
      if (socialRes.ok) {
        const data = await socialRes.json();
        setSocialReport(data);
      }
    } catch (error) {
      console.error('Erro carregando relatórios:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return <div className="loading">Carregando relatórios...</div>;
  }

  return (
    <div className="reports-page">
      <div className="reports-header">
        <div className="header-content">
          <div className="header-ornament">❧</div>
          <h1>Relatórios e Análises</h1>
          <p>Visualize seu progresso e estatísticas</p>
        </div>
      </div>

      {/* Section Tabs */}
      <div className="section-tabs">
        <button 
          className={`tab-btn ${activeSection === 'reading' ? 'active' : ''}`}
          onClick={() => setActiveSection('reading')}
        >
          📚 Leitura
        </button>
        <button 
          className={`tab-btn ${activeSection === 'collections' ? 'active' : ''}`}
          onClick={() => setActiveSection('collections')}
        >
          📁 Coleções
        </button>
        <button 
          className={`tab-btn ${activeSection === 'achievements' ? 'active' : ''}`}
          onClick={() => setActiveSection('achievements')}
        >
          🏆 Conquistas
        </button>
        <button 
          className={`tab-btn ${activeSection === 'social' ? 'active' : ''}`}
          onClick={() => setActiveSection('social')}
        >
          👥 Social
        </button>
      </div>

      <div className="reports-content">
        {/* Reading Report */}
        {activeSection === 'reading' && readingReport && (
          <div className="report-section">
            <div className="report-header">
              <h2>Relatório de Leitura</h2>
              <span className="period">
                {readingReport.period?.start} até {readingReport.period?.end}
              </span>
            </div>

            {/* Summary Cards */}
            <div className="summary-grid">
              <div className="summary-card">
                <div className="summary-icon">📚</div>
                <div className="summary-info">
                  <span className="summary-value">{readingReport.summary?.total_books_read || 0}</span>
                  <span className="summary-label">Livros Lidos</span>
                </div>
              </div>
              <div className="summary-card">
                <div className="summary-icon">📄</div>
                <div className="summary-info">
                  <span className="summary-value">{readingReport.summary?.total_pages_read || 0}</span>
                  <span className="summary-label">Páginas</span>
                </div>
              </div>
              <div className="summary-card">
                <div className="summary-icon">🔥</div>
                <div className="summary-info">
                  <span className="summary-value">{readingReport.summary?.reading_streak_current || 0}</span>
                  <span className="summary-label">Dias Seguidos</span>
                </div>
              </div>
              <div className="summary-card">
                <div className="summary-icon">⭐</div>
                <div className="summary-info">
                  <span className="summary-value">{readingReport.summary?.favorite_genre || 'N/A'}</span>
                  <span className="summary-label">Gênero Favorito</span>
                </div>
              </div>
            </div>

            {/* Breakdown by Genre */}
            {readingReport.breakdown_by_genre && (
              <div className="chart-section">
                <h3>Por Gênero</h3>
                <div className="bar-chart">
                  {readingReport.breakdown_by_genre.map((item, index) => (
                    <div key={index} className="bar-item">
                      <div className="bar-label">{item.genre}</div>
                      <div className="bar-wrapper">
                        <div 
                          className="bar-fill" 
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                        <span className="bar-value">{item.books} livros</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Insights */}
            {readingReport.insights && (
              <div className="insights-section">
                <h3>Insights</h3>
                <div className="insights-grid">
                  {readingReport.insights.map((insight, index) => (
                    <div key={index} className="insight-card">
                      <span className="insight-icon">{insight.icon}</span>
                      <div className="insight-content">
                        <span className="insight-title">{insight.title}</span>
                        <span className="insight-value">{insight.value}</span>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Code Analysis Section */}
            <div className="code-analysis-section">
              <h3>Análise de Código</h3>
              <div className="code-languages-grid">
                {['HTML', 'CSS', 'JavaScript', 'Python', 'Java', 'PHP', 'C++'].map((lang) => (
                  <div key={lang} className="language-card">
                    <div className="language-header">
                      <span className="language-icon">
                        {lang === 'HTML' && <FileCode className="w-5 h-5" />}
                        {lang === 'CSS' && <FileBinary className="w-5 h-5" />}
                        {lang === 'JavaScript' && <FileText className="w-5 h-5" />}
                        {lang === 'Python' && <FileJson className="w-5 h-5" />}
                        {lang === 'Java' && <FileXml className="w-5 h-5" />}
                        {lang === 'PHP' && <Code className="w-5 h-5" />}
                        {lang === 'C++' && <Terminal className="w-5 h-5" />}
                      </span>
                      <span className="language-name">{lang}</span>
                    </div>
                    <div className="language-stats">
                      <div className="stat-item">
                        <span className="stat-label">Linhas</span>
                        <span className="stat-value">1,234</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Funções</span>
                        <span className="stat-value">45</span>
                      </div>
                      <div className="stat-item">
                        <span className="stat-label">Complexidade</span>
                        <span className="stat-value">3.2</span>
                      </div>
                    </div>
                    <div className="language-progress">
                      <div className="progress-bar">
                        <div className="progress-fill" style={{ width: '65%' }}></div>
                      </div>
                      <span className="progress-text">65% concluído</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}

        {/* Collections Report */}
        {activeSection === 'collections' && collectionsReport && (
          <div className="report-section">
            <div className="report-header">
              <h2>Relatório de Coleções</h2>
            </div>

            <div className="summary-grid">
              <div className="summary-card">
                <div className="summary-icon">📁</div>
                <div className="summary-info">
                  <span className="summary-value">{collectionsReport.total_collections || 0}</span>
                  <span className="summary-label">Coleções</span>
                </div>
              </div>
              <div className="summary-card">
                <div className="summary-icon">📚</div>
                <div className="summary-info">
                  <span className="summary-value">{collectionsReport.total_books_in_collections || 0}</span>
                  <span className="summary-label">Livros</span>
                </div>
              </div>
            </div>

            {collectionsReport.collections && (
              <div className="collections-list">
                {collectionsReport.collections.map((collection, index) => (
                  <div key={index} className="collection-item">
                    <h4>{collection.name}</h4>
                    <div className="collection-stats">
                      <span>{collection.book_count} livros</span>
                      <span>{collection.total_pages} páginas</span>
                      <span>⭐ {collection.average_rating?.toFixed(1) || 'N/A'}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Achievements Report */}
        {activeSection === 'achievements' && achievementsReport && (
          <div className="report-section">
            <div className="report-header">
              <h2>Conquistas</h2>
              <span className="unlock-rate">
                {achievementsReport.unlock_rate_percentage}% desbloqueado
              </span>
            </div>

            {/* Category Progress */}
            <div className="categories-progress">
              {Object.entries(achievementsReport.achievement_categories || {}).map(([key, cat]) => (
                <div key={key} className="category-progress">
                  <div className="category-header">
                    <span className="category-name">{key.charAt(0).toUpperCase() + key.slice(1)}</span>
                    <span className="category-count">{cat.earned}/{cat.total}</span>
                  </div>
                  <div className="progress-bar">
                    <div 
                      className="progress-fill"
                      style={{ width: `${cat.percentage}%` }}
                    ></div>
                  </div>
                </div>
              ))}
            </div>

            {/* Earned Achievements */}
            {achievementsReport.earned_achievements && (
              <div className="achievements-grid">
                {achievementsReport.earned_achievements.map((achievement, index) => (
                  <div key={index} className="achievement-card earned">
                    <span className="achievement-icon">{achievement.icon}</span>
                    <div className="achievement-info">
                      <span className="achievement-name">{achievement.name}</span>
                      <span className="achievement-desc">{achievement.description}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* Next Achievements */}
            {achievementsReport.next_achievements && (
              <div className="next-achievements">
                <h3>Próximas Conquistas</h3>
                {achievementsReport.next_achievements.map((achievement, index) => (
                  <div key={index} className="next-achievement">
                    <span className="achievement-name">{achievement.name}</span>
                    <div className="progress-bar">
                      <div 
                        className="progress-fill"
                        style={{ width: `${achievement.progress}%` }}
                      ></div>
                    </div>
                    <span className="progress-text">{achievement.progress_text}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Social Report */}
        {activeSection === 'social' && socialReport && (
          <div className="report-section">
            <div className="report-header">
              <h2>Relatório Social</h2>
            </div>

            <div className="summary-grid">
              <div className="summary-card">
                <div className="summary-icon">👥</div>
                <div className="summary-info">
                  <span className="summary-value">{socialReport.followers_count || 0}</span>
                  <span className="summary-label">Seguidores</span>
                </div>
              </div>
              <div className="summary-card">
                <div className="summary-icon">➡️</div>
                <div className="summary-info">
                  <span className="summary-value">{socialReport.following_count || 0}</span>
                  <span className="summary-label">Seguindo</span>
                </div>
              </div>
              <div className="summary-card">
                <div className="summary-icon">👁️</div>
                <div className="summary-info">
                  <span className="summary-value">{socialReport.monthly_views || 0}</span>
                  <span className="summary-label">Visualizações</span>
                </div>
              </div>
              <div className="summary-card">
                <div className="summary-icon">💬</div>
                <div className="summary-info">
                  <span className="summary-value">{socialReport.monthly_interactions || 0}</span>
                  <span className="summary-label">Interações</span>
                </div>
              </div>
            </div>

            {socialReport.engagement_rate && (
              <div className="engagement-section">
                <h3>Taxa de Engajamento</h3>
                <div className="engagement-bar">
                  <div 
                    className="engagement-fill"
                    style={{ width: `${socialReport.engagement_rate}%` }}
                  ></div>
                  <span>{socialReport.engagement_rate}%</span>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Empty State */}
        {!readingReport && !collectionsReport && !achievementsReport && !socialReport && (
          <div className="empty-state">
            <div className="empty-icon">📊</div>
            <h3>Nenhum dado disponível</h3>
            <p>Comece a usar o sistema para gerar relatórios!</p>
          </div>
        )}
      </div>
    </div>
  );
}