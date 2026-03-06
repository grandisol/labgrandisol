import { useState, useEffect } from 'react';
import '../styles/designTokens.css';
import '../styles/global.css';
import '../styles/social.css';

export default function Social() {
  const [feed, setFeed] = useState([]);
  const [followers, setFollowers] = useState([]);
  const [following, setFollowing] = useState([]);
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('feed');

  // Get auth token from sessionStorage
  const getAuthHeaders = (includeContentType = false) => {
    const token = sessionStorage.getItem('auth_token');
    const headers = token ? { Authorization: `Bearer ${token}` } : {};
    if (includeContentType) {
      headers['Content-Type'] = 'application/json';
    }
    return headers;
  };

  useEffect(() => {
    loadSocialData();
  }, []);

  const loadSocialData = async () => {
    setLoading(true);
    try {
      // Load stats
      const statsRes = await fetch('/api/social/stats', {
        headers: getAuthHeaders()
      });
      if (statsRes.ok) {
        const statsData = await statsRes.json();
        setStats(statsData);
      }

      // Load feed
      const feedRes = await fetch('/api/social/feed', {
        headers: getAuthHeaders()
      });
      if (feedRes.ok) {
        const feedData = await feedRes.json();
        setFeed(feedData.feed || []);
      }

      // Load followers
      const followersRes = await fetch('/api/social/followers', {
        headers: getAuthHeaders()
      });
      if (followersRes.ok) {
        const followersData = await followersRes.json();
        setFollowers(followersData.followers || []);
      }

      // Load following
      const followingRes = await fetch('/api/social/following', {
        headers: getAuthHeaders()
      });
      if (followingRes.ok) {
        const followingData = await followingRes.json();
        setFollowing(followingData.following || []);
      }
    } catch (error) {
      console.error('Erro carregando dados sociais:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFollow = async (userId) => {
    try {
      const response = await fetch(`/api/social/follow/${userId}`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        loadSocialData();
      }
    } catch (error) {
      console.error('Erro seguindo usuário:', error);
    }
  };

  const handleUnfollow = async (userId) => {
    try {
      const response = await fetch(`/api/social/unfollow/${userId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        loadSocialData();
      }
    } catch (error) {
      console.error('Erro deixando de seguir:', error);
    }
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'Recente';
    const date = new Date(dateString);
    const now = new Date();
    const diffMs = now - date;
    const diffMins = Math.floor(diffMs / 60000);
    const diffHours = Math.floor(diffMs / 3600000);
    const diffDays = Math.floor(diffMs / 86400000);
    
    if (diffMins < 1) return 'Agora';
    if (diffMins < 60) return `${diffMins}m atrás`;
    if (diffHours < 24) return `${diffHours}h atrás`;
    if (diffDays < 7) return `${diffDays}d atrás`;
    return date.toLocaleDateString('pt-BR');
  };

  if (loading) return <div className="loading">Carregando comunidade...</div>;

  return (
    <div className="social-page">
      <div className="social-header">
        <div className="header-content">
          <div className="header-ornament">❧</div>
          <h1>Comunidade</h1>
          <p>Conecte-se com outros leitores</p>
        </div>
      </div>

      {/* Stats Bar */}
      {stats && (
        <div className="stats-bar">
          <div className="stat-item">
            <span className="stat-value">{stats.followers_count || 0}</span>
            <span className="stat-label">Seguidores</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.following_count || 0}</span>
            <span className="stat-label">Seguindo</span>
          </div>
          <div className="stat-item">
            <span className="stat-value">{stats.posts_count || 0}</span>
            <span className="stat-label">Posts</span>
          </div>
          {stats.engagement_score && (
            <div className="stat-item">
              <span className="stat-value">{stats.engagement_score}%</span>
              <span className="stat-label">Engajamento</span>
            </div>
          )}
        </div>
      )}

      <div className="social-content">
        <div className="social-tabs">
          <button 
            className={`tab-btn ${activeTab === 'feed' ? 'active' : ''}`}
            onClick={() => setActiveTab('feed')}
          >
            📰 Feed
          </button>
          <button 
            className={`tab-btn ${activeTab === 'followers' ? 'active' : ''}`}
            onClick={() => setActiveTab('followers')}
          >
            👥 Seguidores ({followers.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'following' ? 'active' : ''}`}
            onClick={() => setActiveTab('following')}
          >
            ➡️ Seguindo ({following.length})
          </button>
        </div>

        {activeTab === 'feed' && (
          <div className="feed-section">
            {feed.length > 0 ? (
              <div className="activity-list">
                {feed.map((item, index) => (
                  <article key={index} className="activity-card">
                    <div className="activity-header">
                      <div className="user-avatar">
                        {item.user_name?.charAt(0) || 'U'}
                      </div>
                      <div className="activity-info">
                        <span className="user-name">{item.user_name || 'Usuário'}</span>
                        <span className="activity-action">
                          {item.icon} {item.action} <strong>{item.target}</strong>
                        </span>
                      </div>
                      <span className="activity-date">{formatDate(item.created_at)}</span>
                    </div>
                    {item.rating && (
                      <div className="activity-rating">
                        {'★'.repeat(item.rating)}{'☆'.repeat(5 - item.rating)}
                      </div>
                    )}
                  </article>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">📝</div>
                <h3>Nenhuma atividade ainda</h3>
                <p>Siga outros leitores para ver suas atividades aqui!</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'followers' && (
          <div className="users-section">
            {followers.length > 0 ? (
              <div className="users-list">
                {followers.map((user, index) => (
                  <div key={index} className="user-card">
                    <div className="user-avatar">
                      {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </div>
                    <div className="user-info">
                      <span className="user-name">{user.name || 'Usuário'}</span>
                      <span className="user-email">{user.email || ''}</span>
                    </div>
                    <span className="follow-date">
                      Segue desde {user.followed_at ? new Date(user.followed_at).toLocaleDateString('pt-BR') : 'Recente'}
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">👥</div>
                <h3>Nenhum seguidor ainda</h3>
                <p>Continue ativo na comunidade para ganhar seguidores!</p>
              </div>
            )}
          </div>
        )}

        {activeTab === 'following' && (
          <div className="users-section">
            {following.length > 0 ? (
              <div className="users-list">
                {following.map((user, index) => (
                  <div key={index} className="user-card">
                    <div className="user-avatar">
                      {user.name?.charAt(0) || user.email?.charAt(0) || 'U'}
                    </div>
                    <div className="user-info">
                      <span className="user-name">{user.name || 'Usuário'}</span>
                      <span className="user-email">{user.email || ''}</span>
                    </div>
                    <button 
                      className="btn btn-secondary btn-sm"
                      onClick={() => handleUnfollow(user.id)}
                    >
                      Deixar de seguir
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <div className="empty-state">
                <div className="empty-icon">🔍</div>
                <h3>Você não segue ninguém</h3>
                <p>Encontre outros leitores para seguir!</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}