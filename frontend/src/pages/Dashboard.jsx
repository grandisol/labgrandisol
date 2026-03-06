import { useState, useEffect } from 'react';
import { useAuthStore } from '../store/auth';
import '../styles/designTokens.css';
import '../styles/global.css';
import '../styles/dashboard.css';

export default function Dashboard() {
  const { user } = useAuthStore();
  const [stats, setStats] = useState({
    totalBooks: 0,
    activeLoans: 0,
    readingList: 0,
    achievements: 0
  });
  const [recentActivity, setRecentActivity] = useState([]);
  const [loading, setLoading] = useState(true);

  // Get auth token from sessionStorage
  const getAuthHeaders = () => {
    const token = sessionStorage.getItem('auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    const loadDashboardData = async () => {
      try {
        // Load loans from library
        const loansResponse = await fetch('/api/library/loans', {
          headers: getAuthHeaders()
        });
        if (loansResponse.ok) {
          const loansData = await loansResponse.json();
          setStats(prev => ({ 
            ...prev, 
            activeLoans: loansData.count || 0,
            totalBooks: 12 // Mock total
          }));
        }

        // Load reading list
        const readingListResponse = await fetch('/api/library/reading-list', {
          headers: getAuthHeaders()
        });
        if (readingListResponse.ok) {
          const readingData = await readingListResponse.json();
          setStats(prev => ({ 
            ...prev, 
            readingList: readingData.count || 0 
          }));
        }

        // Load achievements
        const achievementsResponse = await fetch('/api/advanced/achievements', {
          headers: getAuthHeaders()
        });
        if (achievementsResponse.ok) {
          const achievementsData = await achievementsResponse.json();
          setStats(prev => ({ 
            ...prev, 
            achievements: achievementsData.count || 0 
          }));
        }

        // Set recent activity mock
        setRecentActivity([
          { type: 'loan', description: 'Empréstimo de "1984"', date: 'Há 7 dias' },
          { type: 'reading', description: 'Adicionado à lista de leitura', date: 'Há 5 dias' },
        ]);
      } catch (error) {
        console.error('Erro carregando dados:', error);
      } finally {
        setLoading(false);
      }
    };

    loadDashboardData();
  }, []);

  if (loading) {
    return <div className="loading">Carregando painel...</div>;
  }

  return (
    <div className="dashboard-page">
      <div className="dashboard-header">
        <div className="header-content">
          <div className="header-ornament">❧</div>
          <h1>Painel do Usuário</h1>
          <p>Bem-vindo, {user?.name || 'Leitor'}!</p>
        </div>
      </div>

      <div className="dashboard-content">
        {/* Stats Cards */}
        <section className="stats-section">
          <div className="stats-grid">
            <div className="stat-card">
              <div className="stat-icon">📚</div>
              <div className="stat-info">
                <span className="stat-value">{stats.totalBooks}</span>
                <span className="stat-label">Livros no Acervo</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">📖</div>
              <div className="stat-info">
                <span className="stat-value">{stats.activeLoans}</span>
                <span className="stat-label">Empréstimos Ativos</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🔖</div>
              <div className="stat-info">
                <span className="stat-value">{stats.readingList}</span>
                <span className="stat-label">Lista de Leitura</span>
              </div>
            </div>

            <div className="stat-card">
              <div className="stat-icon">🏆</div>
              <div className="stat-info">
                <span className="stat-value">{stats.achievements}</span>
                <span className="stat-label">Conquistas</span>
              </div>
            </div>
          </div>
        </section>

        {/* Main Content Grid */}
        <div className="dashboard-grid">
          {/* Quick Actions */}
          <section className="dashboard-section quick-actions">
            <h2>Ações Rápidas</h2>
            <div className="actions-grid">
              <a href="/library" className="action-card">
                <span className="action-icon">🔍</span>
                <span className="action-text">Buscar Livros</span>
              </a>
              <a href="/my-loans" className="action-card">
                <span className="action-icon">📖</span>
                <span className="action-text">Meus Empréstimos</span>
              </a>
              <a href="/reading-list" className="action-card">
                <span className="action-icon">📝</span>
                <span className="action-text">Lista de Leitura</span>
              </a>
              <a href="/social" className="action-card">
                <span className="action-icon">👥</span>
                <span className="action-text">Comunidade</span>
              </a>
            </div>
          </section>

          {/* Recent Activity */}
          <section className="dashboard-section recent-activity">
            <h2>Atividade Recente</h2>
            {recentActivity.length > 0 ? (
              <div className="activity-list">
                {recentActivity.map((activity, index) => (
                  <div key={index} className="activity-item">
                    <div className="activity-icon">
                      {activity.type === 'loan' ? '📖' : 
                       activity.type === 'return' ? '✅' : 
                       activity.type === 'review' ? '⭐' : '📚'}
                    </div>
                    <div className="activity-content">
                      <p className="activity-text">{activity.description}</p>
                      <span className="activity-date">{activity.date}</span>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <span className="empty-icon">📭</span>
                <p>Nenhuma atividade recente</p>
              </div>
            )}
          </section>

          {/* Reading Progress */}
          <section className="dashboard-section reading-progress">
            <h2>Progresso de Leitura</h2>
            <div className="progress-card">
              <div className="progress-header">
                <span className="book-title">Meta Mensal</span>
                <span className="progress-text">3 de 5 livros</span>
              </div>
              <div className="progress-bar">
                <div className="progress-fill" style={{ width: '60%' }}></div>
              </div>
              <p className="progress-message">Continue lendo! Você está quase lá.</p>
            </div>
          </section>

          {/* Recommendations */}
          <section className="dashboard-section recommendations">
            <h2>Recomendados para Você</h2>
            <div className="recommendations-list">
              <div className="recommendation-item">
                <div className="book-cover-small">📖</div>
                <div className="book-info-small">
                  <span className="book-title">Dom Casmurro</span>
                  <span className="book-author">Machado de Assis</span>
                </div>
              </div>
              <div className="recommendation-item">
                <div className="book-cover-small">📖</div>
                <div className="book-info-small">
                  <span className="book-title">O Alienista</span>
                  <span className="book-author">Machado de Assis</span>
                </div>
              </div>
              <div className="recommendation-item">
                <div className="book-cover-small">📖</div>
                <div className="book-info-small">
                  <span className="book-title">Iracema</span>
                  <span className="book-author">José de Alencar</span>
                </div>
              </div>
            </div>
          </section>
        </div>
      </div>
    </div>
  );
}