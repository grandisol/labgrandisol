import { useState, useEffect } from 'react';
import '../styles/designTokens.css';
import '../styles/global.css';
import '../styles/readingTracker.css';

export default function ReadingTracker() {
  const [progress, setProgress] = useState([]);
  const [sessions, setSessions] = useState([]);
  const [goals, setGoals] = useState(null);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('progress');

  // Get auth token from sessionStorage
  const getAuthHeaders = () => {
    const token = sessionStorage.getItem('auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    const loadData = async () => {
      setLoading(true);
      try {
        const [progressRes, sessionsRes, goalsRes, statsRes] = await Promise.all([
          fetch('/api/reading/progress', { headers: getAuthHeaders() }),
          fetch('/api/reading/sessions', { headers: getAuthHeaders() }),
          fetch('/api/reading/goals', { headers: getAuthHeaders() }),
          fetch('/api/reading/stats', { headers: getAuthHeaders() })
        ]);

        const progressData = await progressRes.json();
        const sessionsData = await sessionsRes.json();
        const goalsData = await goalsRes.json();
        const statsData = await statsRes.json();

        setProgress(progressData.progress || []);
        setSessions(sessionsData.sessions || []);
        setGoals(goalsData);
        setStats(statsData);
      } catch (error) {
        console.error('Erro carregando dados:', error);
      } finally {
        setLoading(false);
      }
    };
    loadData();
  }, []);

  if (loading) {
    return <div className="loading">Carregando progresso de leitura...</div>;
  }

  return (
    <div className="reading-tracker-page">
      <div className="reading-header">
        <div className="header-content">
          <div className="header-ornament">❧</div>
          <h1>Acompanhamento de Leitura</h1>
          <p>Monitor seu progresso e estabeleça metas</p>
        </div>
      </div>

      <div className="reading-content">
        {/* Stats Overview */}
        <section className="stats-overview">
          <div className="stats-grid">
            <div className="stat-card highlight">
              <div className="stat-icon">📖</div>
              <div className="stat-info">
                <span className="stat-value">{stats?.overview?.total_books_completed || 0}</span>
                <span className="stat-label">Livros Concluídos</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">📄</div>
              <div className="stat-info">
                <span className="stat-value">{stats?.overview?.total_pages_read || 0}</span>
                <span className="stat-label">Páginas Lidas</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">⏱️</div>
              <div className="stat-info">
                <span className="stat-value">{Math.round((stats?.overview?.total_reading_time_minutes || 0) / 60)}h</span>
                <span className="stat-label">Tempo de Leitura</span>
              </div>
            </div>
            <div className="stat-card">
              <div className="stat-icon">🔥</div>
              <div className="stat-info">
                <span className="stat-value">{stats?.reading_streak || 0}</span>
                <span className="stat-label">Dias Seguidos</span>
              </div>
            </div>
          </div>
        </section>

        {/* Today's Goal */}
        {goals && (
          <section className="daily-goal-section">
            <h2>Meta de Hoje</h2>
            <div className="goal-progress-card">
              <div className="goal-header">
                <span className="goal-title">Páginas Hoje</span>
                <span className="goal-progress-text">
                  {goals.today?.pages_read || 0} / {goals.goals?.daily_pages || 20} páginas
                </span>
              </div>
              <div className="progress-bar large">
                <div 
                  className="progress-fill" 
                  style={{ width: `${Math.min(100, goals.today?.goal_progress || 0)}%` }}
                ></div>
              </div>
              <div className="goal-stats">
                <span>⏱️ {goals.today?.minutes_read || 0} minutos hoje</span>
                <span>📚 {goals.today?.sessions || 0} sessões</span>
              </div>
            </div>
          </section>
        )}

        {/* Tabs */}
        <div className="reading-tabs">
          <button 
            className={`tab-btn ${activeTab === 'progress' ? 'active' : ''}`}
            onClick={() => setActiveTab('progress')}
          >
            📚 Livros em Leitura
          </button>
          <button 
            className={`tab-btn ${activeTab === 'sessions' ? 'active' : ''}`}
            onClick={() => setActiveTab('sessions')}
          >
            📊 Sessões
          </button>
          <button 
            className={`tab-btn ${activeTab === 'stats' ? 'active' : ''}`}
            onClick={() => setActiveTab('stats')}
          >
            📈 Estatísticas
          </button>
        </div>

        {/* Tab Content */}
        <div className="tab-content">
          {activeTab === 'progress' && (
            <div className="progress-list">
              {progress.length > 0 ? (
                progress.map(item => (
                  <div key={item.id} className="reading-progress-card">
                    <div className="book-cover-small">
                      <span>📖</span>
                    </div>
                    <div className="progress-info">
                      <h3>{item.book_title}</h3>
                      <p className="book-author">{item.book_author}</p>
                      <div className="progress-bar small">
                        <div 
                          className="progress-fill"
                          style={{ width: `${item.percentage}%` }}
                        ></div>
                      </div>
                      <div className="progress-details">
                        <span>Página {item.current_page} de {item.total_pages}</span>
                        <span className="percentage">{item.percentage}%</span>
                      </div>
                    </div>
                    <button className="btn btn-primary btn-sm">
                      Atualizar
                    </button>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <span className="empty-icon">📚</span>
                  <h3>Nenhum livro em acompanhamento</h3>
                  <p>Comece a acompanhar seu progresso de leitura</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'sessions' && (
            <div className="sessions-list">
              {sessions.length > 0 ? (
                sessions.map(session => (
                  <div key={session.id} className="session-card">
                    <div className="session-date">
                      <span className="date-day">{new Date(session.date).getDate()}</span>
                      <span className="date-month">{new Date(session.date).toLocaleDateString('pt-BR', { month: 'short' })}</span>
                    </div>
                    <div className="session-info">
                      <h4>Páginas {session.start_page} - {session.end_page}</h4>
                      <p className="session-notes">{session.notes || 'Sem notas'}</p>
                    </div>
                    <div className="session-duration">
                      <span>⏱️</span>
                      <span>{session.duration_minutes} min</span>
                    </div>
                  </div>
                ))
              ) : (
                <div className="empty-state">
                  <span className="empty-icon">⏱️</span>
                  <h3>Nenhuma sessão registrada</h3>
                  <p>Registre suas sessões de leitura para acompanhar seu progresso</p>
                </div>
              )}
            </div>
          )}

          {activeTab === 'stats' && stats && (
            <div className="stats-detail">
              <div className="stats-section">
                <h3>Esta Semana</h3>
                <div className="mini-stats-grid">
                  <div className="mini-stat">
                    <span className="value">{stats.weekly?.pages || 0}</span>
                    <span className="label">Páginas</span>
                  </div>
                  <div className="mini-stat">
                    <span className="value">{stats.weekly?.minutes || 0}</span>
                    <span className="label">Minutos</span>
                  </div>
                  <div className="mini-stat">
                    <span className="value">{stats.weekly?.sessions || 0}</span>
                    <span className="label">Sessões</span>
                  </div>
                </div>
              </div>

              <div className="stats-section">
                <h3>Este Mês</h3>
                <div className="mini-stats-grid">
                  <div className="mini-stat">
                    <span className="value">{stats.monthly?.pages || 0}</span>
                    <span className="label">Páginas</span>
                  </div>
                  <div className="mini-stat">
                    <span className="value">{stats.monthly?.minutes || 0}</span>
                    <span className="label">Minutos</span>
                  </div>
                  <div className="mini-stat">
                    <span className="value">{stats.monthly?.sessions || 0}</span>
                    <span className="label">Sessões</span>
                  </div>
                </div>
              </div>

              <div className="stats-section">
                <h3>Por Gênero</h3>
                <div className="genre-breakdown">
                  {stats.genre_breakdown?.map((genre, index) => (
                    <div key={index} className="genre-item">
                      <div className="genre-info">
                        <span className="genre-name">{genre.genre}</span>
                        <span className="genre-count">{genre.books} livros</span>
                      </div>
                      <div className="genre-bar">
                        <div 
                          className="genre-fill" 
                          style={{ width: `${genre.percentage}%` }}
                        ></div>
                      </div>
                      <span className="genre-percentage">{genre.percentage}%</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
