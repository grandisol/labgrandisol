import { useEffect } from 'react';
import { useSocialStore } from '../store/social';
import '../styles/social.css';

export default function Social() {
  const { feed, followers, following, stats, loading, fetchFeed, fetchFollowers, fetchFollowing, fetchStats, followUser, unfollowUser } = useSocialStore();

  useEffect(() => {
    fetchFeed();
    fetchFollowers();
    fetchFollowing();
    fetchStats();
  }, [fetchFeed, fetchFollowers, fetchFollowing, fetchStats]);

  if (loading) {
    return <div className="page-loading">👥 Carregando comunidade...</div>;
  }

  return (
    <div className="social-page">
      <div className="page-header">
        <h1>👥 Comunidade</h1>
        <p>Conecte-se com outros leitores</p>
      </div>

      {/* Stats Bar */}
      <div className="stats-bar">
        <div className="stat-card">
          <span className="stat-icon">👥</span>
          <div className="stat-info">
            <h4>Seguidores</h4>
            <p className="stat-number">{stats.followers_count}</p>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">⭐</span>
          <div className="stat-info">
            <h4>Engajamento</h4>
            <p className="stat-number">{stats.engagement_score}</p>
          </div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">🔗</span>
          <div className="stat-info">
            <h4>Seguindo</h4>
            <p className="stat-number">{stats.following_count}</p>
          </div>
        </div>
      </div>

      <div className="social-grid">
        {/* Followers Column */}
        <section className="social-section">
          <h2>👥 Meus Seguidores</h2>
          <div className="user-list">
            {followers.length === 0 ? (
              <p className="empty-state">Você ainda não tem seguidores</p>
            ) : (
              followers.map(user => (
                <div key={user.id} className="user-card">
                  <div className="user-avatar">
                    {user.name?.charAt(0).toUpperCase() || '👤'}
                  </div>
                  <div className="user-info">
                    <h4>{user.name}</h4>
                    <p className="user-role">{user.role}</p>
                  </div>
                  <button className="btn btn-small btn-ghost">✓ Seguindo</button>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Feed Column */}
        <section className="social-section feed-section">
          <h2>📰 Feed de Atividades</h2>
          <div className="feed-list">
            {feed.length === 0 ? (
              <p className="empty-state">Nenhuma atividade no feed</p>
            ) : (
              feed.map((activity, idx) => (
                <div key={activity.id || idx} className="feed-item">
                  <div className="feed-icon">
                    {activity.type === 'review' && '⭐'}
                    {activity.type === 'achievement' && '🏆'}
                    {activity.type === 'collection' && '📚'}
                    {activity.type === 'follow' && '👥'}
                  </div>
                  <div className="feed-content">
                    <p className="feed-message">
                      <strong>{activity.user?.name || 'Usuário'}</strong> {activity.message}
                    </p>
                    <p className="feed-detail">{activity.detail}</p>
                    <small className="feed-time">
                      {new Date(activity.created_at).toLocaleDateString('pt-BR')}
                    </small>
                  </div>
                </div>
              ))
            )}
          </div>
        </section>

        {/* Following Column */}
        <section className="social-section">
          <h2>🔗 Estou Seguindo</h2>
          <div className="user-list">
            {following.length === 0 ? (
              <p className="empty-state">Você não está seguindo ninguém</p>
            ) : (
              following.map(user => (
                <div key={user.id} className="user-card">
                  <div className="user-avatar">
                    {user.name?.charAt(0).toUpperCase() || '👤'}
                  </div>
                  <div className="user-info">
                    <h4>{user.name}</h4>
                    <p className="user-stats">{user.followers || 0} seguidores</p>
                  </div>
                  <button 
                    className="btn btn-small btn-danger"
                    onClick={() => unfollowUser(user.id)}
                  >
                    ✕ Deixar de seguir
                  </button>
                </div>
              ))
            )}
          </div>
        </section>
      </div>
    </div>
  );
}
