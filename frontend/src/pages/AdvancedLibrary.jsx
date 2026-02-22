import { useEffect, useState } from 'react';
import { useLibraryStore } from '../store/library';
import '../styles/advancedLibrary.css';

export default function AdvancedLibrary() {
  const { collections, achievements, recommendations, shelves, tags, statistics, loading, fetchAllData } = useLibraryStore();
  const [activeTab, setActiveTab] = useState('collections');
  const [newCollectionName, setNewCollectionName] = useState('');

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  if (loading) {
    return <div className="page-loading">✨ Carregando recursos avançados...</div>;
  }

  return (
    <div className="advanced-library-page">
      <div className="page-header">
        <h1>✨ Biblioteca Avançada</h1>
        <p>Organize, analise e descubra novas funcionalidades</p>
      </div>

      {/* Statistics Banner */}
      <div className="stats-banner">
        <div className="stat-item">
          <h3>📚 {statistics.total_books_read || 0}</h3>
          <p>Livros Lidos</p>
        </div>
        <div className="stat-item">
          <h3>📖 {statistics.currently_reading || 0}</h3>
          <p>Lendo Agora</p>
        </div>
        <div className="stat-item">
          <h3>🎯 {statistics.want_to_read || 0}</h3>
          <p>Desejo Ler</p>
        </div>
        <div className="stat-item">
          <h3>⭐ {statistics.average_rating?.toFixed(1) || 0}</h3>
          <p>Nota Média</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="advanced-tabs">
        <button 
          className={`tab ${activeTab === 'collections' ? 'active' : ''}`}
          onClick={() => setActiveTab('collections')}
        >
          📦 Coleções
        </button>
        <button 
          className={`tab ${activeTab === 'shelves' ? 'active' : ''}`}
          onClick={() => setActiveTab('shelves')}
        >
          📚 Estantes
        </button>
        <button 
          className={`tab ${activeTab === 'recommendations' ? 'active' : ''}`}
          onClick={() => setActiveTab('recommendations')}
        >
          💡 Recomendações
        </button>
        <button 
          className={`tab ${activeTab === 'achievements' ? 'active' : ''}`}
          onClick={() => setActiveTab('achievements')}
        >
          🏆 Conquistas
        </button>
        <button 
          className={`tab ${activeTab === 'tags' ? 'active' : ''}`}
          onClick={() => setActiveTab('tags')}
        >
          🏷️ Tags
        </button>
      </div>

      {/* Content */}
      <div className="advanced-content">
        {/* Collections Tab */}
        {activeTab === 'collections' && (
          <section className="collections-section">
            <h2>📦 Minhas Coleções</h2>
            <div className="create-collection">
              <input
                type="text"
                placeholder="Nome da nova coleção..."
                value={newCollectionName}
                onChange={(e) => setNewCollectionName(e.target.value)}
                className="input-field"
              />
              <button className="btn btn-primary">+ Nova Coleção</button>
            </div>
            <div className="collections-grid">
              {collections.length === 0 ? (
                <p className="empty-state">Nenhuma coleção criada. Crie a primeira!</p>
              ) : (
                collections.map(collection => (
                  <div key={collection.id} className="collection-card">
                    <div className="collection-icon" style={{ backgroundColor: collection.color || '#6366f1' }}>
                      {collection.icon || '📚'}
                    </div>
                    <h3>{collection.name}</h3>
                    <p className="collection-desc">{collection.description}</p>
                    <div className="collection-meta">
                      <span>📚 {collection.books_count || 0} livros</span>
                      {collection.is_public && <span>🌐 Pública</span>}
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* Shelves Tab */}
        {activeTab === 'shelves' && (
          <section className="shelves-section">
            <h2>📚 Minhas Estantes</h2>
            <div className="shelves-grid">
              {shelves.length === 0 ? (
                <p className="empty-state">Nenhuma estante disponível</p>
              ) : (
                shelves.map(shelf => (
                  <div key={shelf.id} className="shelf-card">
                    <h3>{shelf.name}</h3>
                    <p className="shelf-count">📚 {shelf.books_count || 0} livros</p>
                    <button className="btn btn-small">Ver Estante</button>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* Recommendations Tab */}
        {activeTab === 'recommendations' && (
          <section className="recommendations-section">
            <h2>💡 Recomendações Personalizadas</h2>
            <div className="recommendations-list">
              {recommendations.length === 0 ? (
                <p className="empty-state">Nenhuma recomendação no momento</p>
              ) : (
                recommendations.map(rec => (
                  <div key={rec.id} className="recommendation-card">
                    <div className="rec-thumbnail">📖</div>
                    <div className="rec-content">
                      <h4>{rec.title}</h4>
                      <p className="rec-author">{rec.author}</p>
                      <p className="rec-reason">💭 {rec.reason || 'Recomendado para você'}</p>
                    </div>
                    <div className="rec-score">
                      <span className="score-label">Score</span>
                      <span className="score-value">{rec.score?.toFixed(0) || 0}%</span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* Achievements Tab */}
        {activeTab === 'achievements' && (
          <section className="achievements-section">
            <h2>🏆 Suas Conquistas</h2>
            <div className="achievements-grid">
              {achievements.length === 0 ? (
                <p className="empty-state">Comece a ler para desbloquear conquistas!</p>
              ) : (
                achievements.map(achievement => (
                  <div key={achievement.id} className="achievement-card">
                    <div className="achievement-badge">{achievement.icon}</div>
                    <h4>{achievement.name}</h4>
                    <p className="achievement-desc">{achievement.description}</p>
                    {achievement.unlocked_at && (
                      <small className="unlocked-date">
                        ✓ Desbloqueado em {new Date(achievement.unlocked_at).toLocaleDateString('pt-BR')}
                      </small>
                    )}
                  </div>
                ))
              )}
            </div>
          </section>
        )}

        {/* Tags Tab */}
        {activeTab === 'tags' && (
          <section className="tags-section">
            <h2>🏷️ Tags Principais</h2>
            <div className="tags-cloud">
              {tags.length === 0 ? (
                <p className="empty-state">Nenhuma tag ainda</p>
              ) : (
                tags.map((tag, idx) => (
                  <button 
                    key={idx}
                    className="tag-button"
                    style={{ fontSize: `${0.9 + (idx % 3) * 0.15}em` }}
                  >
                    #{tag.name} <span className="tag-count">({tag.count})</span>
                  </button>
                ))
              )}
            </div>
          </section>
        )}
      </div>
    </div>
  );
}
