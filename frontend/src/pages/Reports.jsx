import { useEffect, useState } from 'react';
import { useReportsStore } from '../store/data';
import '../styles/reports.css';

export default function Reports() {
  const { readingReport, collectionsReport, reviewsReport, achievementsReport, socialReport, loading, fetchAllReports, exportReport } = useReportsStore();
  const [selectedReport, setSelectedReport] = useState('reading');
  const [exporting, setExporting] = useState(false);

  useEffect(() => {
    fetchAllReports();
  }, [fetchAllReports]);

  const handleExport = async (format) => {
    setExporting(true);
    try {
      await exportReport(format, selectedReport);
      alert(`✓ Relatório exportado em ${format.toUpperCase()}`);
    } catch (error) {
      alert('✕ Erro ao exportar relatório');
    }
    setExporting(false);
  };

  if (loading) {
    return <div className="page-loading">📊 Gerando relatórios...</div>;
  }

  const reports = {
    reading: readingReport,
    collections: collectionsReport,
    reviews: reviewsReport,
    achievements: achievementsReport,
    social: socialReport,
  };

  const currentReport = reports[selectedReport];

  return (
    <div className="reports-page">
      <div className="page-header">
        <h1>📊 Análises e Relatórios</h1>
        <p>Visualize seus dados de leitura e atividades</p>
      </div>

      {/* Tab Navigation */}
      <div className="report-tabs">
        <button 
          className={`tab ${selectedReport === 'reading' ? 'active' : ''}`}
          onClick={() => setSelectedReport('reading')}
        >
          📚 Leitura
        </button>
        <button 
          className={`tab ${selectedReport === 'collections' ? 'active' : ''}`}
          onClick={() => setSelectedReport('collections')}
        >
          📦 Coleções
        </button>
        <button 
          className={`tab ${selectedReport === 'reviews' ? 'active' : ''}`}
          onClick={() => setSelectedReport('reviews')}
        >
          ⭐ Avaliações
        </button>
        <button 
          className={`tab ${selectedReport === 'achievements' ? 'active' : ''}`}
          onClick={() => setSelectedReport('achievements')}
        >
          🏆 Conquistas
        </button>
        <button 
          className={`tab ${selectedReport === 'social' ? 'active' : ''}`}
          onClick={() => setSelectedReport('social')}
        >
          👥 Social
        </button>
      </div>

      {/* Export Actions */}
      <div className="export-actions">
        <button 
          className="btn btn-secondary"
          onClick={() => handleExport('pdf')}
          disabled={exporting}
        >
          📄 Exportar PDF
        </button>
        <button 
          className="btn btn-secondary"
          onClick={() => handleExport('csv')}
          disabled={exporting}
        >
          📊 Exportar CSV
        </button>
        <button 
          className="btn btn-secondary"
          onClick={() => handleExport('json')}
          disabled={exporting}
        >
          📋 Exportar JSON
        </button>
      </div>

      {/* Report Content */}
      <div className="report-content">
        {currentReport ? (
          <div className="report-section">
            {selectedReport === 'reading' && readingReport && (
              <div className="reading-stats">
                <h2>📚 Estatísticas de Leitura</h2>
                <div className="stats-grid">
                  <div className="stat-box">
                    <h3>{readingReport.total_books_read || 0}</h3>
                    <p>Livros Lidos</p>
                  </div>
                  <div className="stat-box">
                    <h3>{readingReport.total_pages_read || 0}</h3>
                    <p>Páginas Lidas</p>
                  </div>
                  <div className="stat-box">
                    <h3>{readingReport.average_rating?.toFixed(1) || 0}</h3>
                    <p>Classificação Média</p>
                  </div>
                  <div className="stat-box">
                    <h3>{readingReport.reading_streak || 0}</h3>
                    <p>Dias Lendo</p>
                  </div>
                </div>
                {readingReport.insights && (
                  <div className="insights">
                    <h3>💡 Insights</h3>
                    {readingReport.insights.map((insight, idx) => (
                      <p key={idx}>{insight}</p>
                    ))}
                  </div>
                )}
              </div>
            )}

            {selectedReport === 'collections' && collectionsReport && (
              <div className="collections-stats">
                <h2>📦 Estatísticas de Coleções</h2>
                <div className="stats-grid">
                  <div className="stat-box">
                    <h3>{collectionsReport.total_collections || 0}</h3>
                    <p>Coleções</p>
                  </div>
                  <div className="stat-box">
                    <h3>{collectionsReport.total_books || 0}</h3>
                    <p>Livros em Coleções</p>
                  </div>
                  <div className="stat-box">
                    <h3>{collectionsReport.most_used || 'N/A'}</h3>
                    <p>Coleção Mais Usada</p>
                  </div>
                </div>
              </div>
            )}

            {selectedReport === 'reviews' && reviewsReport && (
              <div className="reviews-stats">
                <h2>⭐ Estatísticas de Avaliações</h2>
                <div className="stats-grid">
                  <div className="stat-box">
                    <h3>{reviewsReport.total_reviews || 0}</h3>
                    <p>Avaliações</p>
                  </div>
                  <div className="stat-box">
                    <h3>{reviewsReport.average_rating?.toFixed(1) || 0}</h3>
                    <p>Nota Média</p>
                  </div>
                </div>
              </div>
            )}

            {selectedReport === 'achievements' && achievementsReport && (
              <div className="achievements-stats">
                <h2>🏆 Conquistas Desbloqueadas</h2>
                <div className="achievements-grid">
                  {achievementsReport.unlocked?.map((achievement, idx) => (
                    <div key={idx} className="achievement-badge">
                      <span className="badge-emoji">{achievement.icon}</span>
                      <p className="badge-name">{achievement.name}</p>
                      <p className="badge-desc">{achievement.description}</p>
                    </div>
                  )) || <p>Nenhuma conquista desbloqueada</p>}
                </div>
              </div>
            )}

            {selectedReport === 'social' && socialReport && (
              <div className="social-stats">
                <h2>👥 Estatísticas Social</h2>
                <div className="stats-grid">
                  <div className="stat-box">
                    <h3>{socialReport.followers_count || 0}</h3>
                    <p>Seguidores</p>
                  </div>
                  <div className="stat-box">
                    <h3>{socialReport.following_count || 0}</h3>
                    <p>Seguindo</p>
                  </div>
                  <div className="stat-box">
                    <h3>{socialReport.engagement_score || 0}</h3>
                    <p>Score de Engajamento</p>
                  </div>
                </div>
              </div>
            )}
          </div>
        ) : (
          <div className="empty-state">
            <p>📭 Nenhum dado disponível neste momento</p>
          </div>
        )}
      </div>
    </div>
  );
}
