import { useState, useEffect, useCallback } from 'react';
import { museumAPI } from '../api/client';
import '../styles/designTokens.css';
import '../styles/global.css';
import '../styles/museum.css';

// Dados de fallback quando API não está disponível
const FALLBACK_CATEGORIES = [
  { id: 'medicinal', name: 'Medicinais', icon: '💊', description: 'Plantas com propriedades terapêuticas' },
  { id: 'ornamental', name: 'Ornamentais', icon: '🌸', description: 'Plantas decorativas para jardins' },
  { id: 'edible', name: 'Comestíveis', icon: '🍎', description: 'Plantas alimentícias' },
  { id: 'aromatic', name: 'Aromáticas', icon: '🌿', description: 'Plantas aromáticas e condimentares' },
  { id: 'succulent', name: 'Suculentas', icon: '🌵', description: 'Plantas suculentas e cactos' },
  { id: 'aquatic', name: 'Aquáticas', icon: '🪷', description: 'Plantas de ambientes aquáticos' },
  { id: 'rare', name: 'Raras', icon: '🔮', description: 'Espécies raras ou ameaçadas' },
  { id: 'native', name: 'Nativas', icon: '🌴', description: 'Plantas nativas do Brasil' },
];

const FALLBACK_REGIONS = [
  { id: 'amazonia', name: 'Amazônia', icon: '🌴', description: 'Floresta Amazônica' },
  { id: 'atlantic', name: 'Mata Atlântica', icon: '🌳', description: 'Floresta Atlântica' },
  { id: 'cerrado', name: 'Cerrado', icon: '🌾', description: 'Savana brasileira' },
  { id: 'caatinga', name: 'Caatinga', icon: '🌵', description: 'Vegetação semiárida' },
  { id: 'pantanal', name: 'Pantanal', icon: '🦜', description: 'Planície alagável' },
  { id: 'pampa', name: 'Pampa', icon: '🌾', description: 'Campos sulinos' },
];

const CONSERVATION_STATUS = {
  extinct: { label: 'Extinta', color: '#000000', icon: '💀' },
  critically_endangered: { label: 'Criticamente Ameaçada', color: '#8b0000', icon: '🔴' },
  endangered: { label: 'Em Perigo', color: '#ff4500', icon: '🟠' },
  vulnerable: { label: 'Vulnerável', color: '#ffd700', icon: '🟡' },
  near_threatened: { label: 'Quase Ameaçada', color: '#9acd32', icon: '🟢' },
  least_concern: { label: 'Pouco Preocupante', color: '#228b22', icon: '✅' },
  not_evaluated: { label: 'Não Avaliada', color: '#808080', icon: '❓' },
};

export default function Museum() {
  const [categories, setCategories] = useState([]);
  const [regions, setRegions] = useState([]);
  const [species, setSpecies] = useState([]);
  const [families, setFamilies] = useState([]);
  const [expeditions, setExpeditions] = useState([]);
  const [events, setEvents] = useState([]);
  const [stats, setStats] = useState({ totalSpecies: 0, totalFamilies: 0, totalExpeditions: 0 });
  
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeTab, setActiveTab] = useState('species');
  const [filters, setFilters] = useState({ category: '', region: '', search: '' });
  const [selectedItem, setSelectedItem] = useState(null);
  const [likedSpecies, setLikedSpecies] = useState(new Set());

  // Carregar dados iniciais
  useEffect(() => {
    const initializeData = async () => {
      setLoading(true);
      setError(null);
      
      try {
        // Carregar dados do localStorage
        const storedSpecies = JSON.parse(localStorage.getItem('museum_species') || '[]');
        const storedFamilies = JSON.parse(localStorage.getItem('museum_families') || '[]');
        
        // Tentar carregar da API
        try {
          const [speciesRes, familiesRes, expeditionsRes, eventsRes] = await Promise.all([
            museumAPI.getSpecies().catch(() => null),
            museumAPI.getFamilies().catch(() => null),
            museumAPI.getExpeditions().catch(() => null),
            museumAPI.getEvents().catch(() => null),
          ]);
          
          if (speciesRes?.data) {
            setSpecies([...(speciesRes.data.species || []), ...storedSpecies]);
            setCategories(speciesRes.data.categories || FALLBACK_CATEGORIES);
            setRegions(speciesRes.data.regions || FALLBACK_REGIONS);
          } else {
            setSpecies(storedSpecies);
            setCategories(FALLBACK_CATEGORIES);
            setRegions(FALLBACK_REGIONS);
          }
          
          if (familiesRes?.data) {
            setFamilies([...(familiesRes.data.families || []), ...storedFamilies]);
          } else {
            setFamilies(storedFamilies);
          }
          
          if (expeditionsRes?.data) {
            setExpeditions(expeditionsRes.data.expeditions || []);
          }
          
          if (eventsRes?.data) {
            setEvents(eventsRes.data.events || []);
          }
          
          // Calcular estatísticas
          setStats({
            totalSpecies: species.length + storedSpecies.length,
            totalFamilies: families.length + storedFamilies.length,
            totalExpeditions: expeditions.length,
          });
          
        } catch (apiError) {
          console.warn('API não disponível, usando dados locais:', apiError);
          setCategories(FALLBACK_CATEGORIES);
          setRegions(FALLBACK_REGIONS);
          setSpecies(storedSpecies);
          setFamilies(storedFamilies);
        }
        
      } catch (e) {
        console.error('Erro ao carregar almanaque:', e);
        setError('Não foi possível carregar o almanaque. Tente novamente.');
      } finally {
        setLoading(false);
      }
    };
    
    initializeData();
  }, []);

  // Filtrar espécies
  const filteredSpecies = species.filter(s => {
    if (filters.category && s.category !== filters.category) return false;
    if (filters.region && s.region !== filters.region) return false;
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return (
        s.commonName?.toLowerCase().includes(search) ||
        s.scientificName?.toLowerCase().includes(search) ||
        s.description?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  // Filtrar famílias
  const filteredFamilies = families.filter(f => {
    if (filters.category && f.category !== filters.category) return false;
    if (filters.search) {
      const search = filters.search.toLowerCase();
      return (
        f.name?.toLowerCase().includes(search) ||
        f.scientificName?.toLowerCase().includes(search) ||
        f.description?.toLowerCase().includes(search)
      );
    }
    return true;
  });

  // Handler para like
  const handleLike = useCallback((id, e) => {
    e?.stopPropagation();
    
    const isLiked = likedSpecies.has(id);
    const newLiked = new Set(likedSpecies);
    
    if (isLiked) {
      newLiked.delete(id);
    } else {
      newLiked.add(id);
    }
    
    setLikedSpecies(newLiked);
    
    // Atualizar no localStorage
    const storedSpecies = JSON.parse(localStorage.getItem('museum_species') || '[]');
    const updatedSpecies = storedSpecies.map(s => {
      if (s.id === id) {
        return { ...s, likes: (s.likes || 0) + (isLiked ? -1 : 1) };
      }
      return s;
    });
    localStorage.setItem('museum_species', JSON.stringify(updatedSpecies));
    
    // Atualizar estado local
    setSpecies(prev => prev.map(s => {
      if (s.id === id) {
        return { ...s, likes: (s.likes || 0) + (isLiked ? -1 : 1) };
      }
      return s;
    }));
  }, [likedSpecies]);

  // Handler para inscrição em evento
  const handleRegisterEvent = useCallback((eventId) => {
    setEvents(prev => prev.map(e => {
      if (e.id === eventId && e.registered < e.capacity) {
        return { ...e, registered: e.registered + 1 };
      }
      return e;
    }));
    alert('✅ Inscrição realizada com sucesso!');
  }, []);

  // Handler para limpar filtros
  const clearFilters = () => {
    setFilters({ category: '', region: '', search: '' });
  };

  if (loading) {
    return (
      <div className="museum-page">
        <div className="loading">
          <span>🌿 Carregando Almanaque Botânico...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="museum-page">
      {/* Header */}
      <header className="museum-header">
        <div className="header-content">
          <span className="header-icon">🌿</span>
          <h1>Almanaque Botânico</h1>
          <p>Enciclopédia digital de plantas e expedições botânicas</p>
          <div className="stats-row">
            <span>🌱 {filteredSpecies.length} espécies</span>
            <span>📚 {filteredFamilies.length} famílias</span>
            <span>🧭 {expeditions.length} expedições</span>
          </div>
        </div>
      </header>

      {/* Filtros */}
      <div className="museum-filters">
        <input
          type="search"
          placeholder="🔍 Buscar plantas, famílias..."
          value={filters.search}
          onChange={(e) => setFilters({ ...filters, search: e.target.value })}
        />
        <select 
          value={filters.category} 
          onChange={(e) => setFilters({ ...filters, category: e.target.value })}
        >
          <option value="">Todas categorias</option>
          {categories.map(c => (
            <option key={c.id} value={c.id}>{c.icon} {c.name}</option>
          ))}
        </select>
        <select 
          value={filters.region} 
          onChange={(e) => setFilters({ ...filters, region: e.target.value })}
        >
          <option value="">Todas regiões</option>
          {regions.map(r => (
            <option key={r.id} value={r.id}>{r.icon} {r.name}</option>
          ))}
        </select>
        {(filters.category || filters.region || filters.search) && (
          <button className="btn btn-secondary btn-sm" onClick={clearFilters}>
            ✕ Limpar filtros
          </button>
        )}
      </div>

      {/* Tabs */}
      <div className="museum-tabs">
        <button 
          className={activeTab === 'species' ? 'active' : ''} 
          onClick={() => setActiveTab('species')}
        >
          🌱 Espécies ({filteredSpecies.length})
        </button>
        <button 
          className={activeTab === 'families' ? 'active' : ''} 
          onClick={() => setActiveTab('families')}
        >
          📚 Famílias ({filteredFamilies.length})
        </button>
        <button 
          className={activeTab === 'expeditions' ? 'active' : ''} 
          onClick={() => setActiveTab('expeditions')}
        >
          🧭 Expedições ({expeditions.length})
        </button>
        <button 
          className={activeTab === 'events' ? 'active' : ''} 
          onClick={() => setActiveTab('events')}
        >
          📅 Eventos ({events.length})
        </button>
      </div>

      {/* Conteúdo */}
      <main className="museum-content">
        {error && (
          <div className="alert alert-warning" style={{ marginBottom: 'var(--spacing-lg)' }}>
            {error}
          </div>
        )}

        {/* Espécies */}
        {activeTab === 'species' && (
          filteredSpecies.length > 0 ? (
            <div className="species-grid">
              {filteredSpecies.map(s => (
                <div 
                  key={s.id} 
                  className="species-card" 
                  onClick={() => setSelectedItem(s)}
                >
                  <div className="species-image">
                    {s.imageUrl ? (
                      <img src={s.imageUrl} alt={s.commonName} loading="lazy" />
                    ) : (
                      <span>🌿</span>
                    )}
                  </div>
                  <div className="species-info">
                    <h3>{s.commonName}</h3>
                    <p className="scientific">{s.scientificName}</p>
                    <div className="species-meta">
                      <span className="category-tag">{s.category}</span>
                      <div className="species-stats">
                        <span title="Visualizações">👁️ {s.views || 0}</span>
                        <button 
                          className={`like-btn ${likedSpecies.has(s.id) ? 'liked' : ''}`}
                          onClick={(e) => handleLike(s.id, e)}
                          title="Curtir"
                        >
                          ❤️ {s.likes || 0}
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-icon">🌱</span>
              <h3>Nenhuma espécie encontrada</h3>
              <p>Tente ajustar os filtros ou adicione novas espécies pelo painel administrativo.</p>
            </div>
          )
        )}

        {/* Famílias */}
        {activeTab === 'families' && (
          filteredFamilies.length > 0 ? (
            <div className="families-grid">
              {filteredFamilies.map(f => (
                <div key={f.id} className="family-card">
                  <div className="family-image">
                    {f.coverImage ? (
                      <img src={f.coverImage} alt={f.name} loading="lazy" />
                    ) : (
                      <span>📚</span>
                    )}
                  </div>
                  <div className="family-info">
                    <h3>{f.name}</h3>
                    <p className="scientific">{f.scientificName}</p>
                    {f.description && <p>{f.description}</p>}
                    <span className="species-count">
                      {f.speciesCount || 0} espécies
                    </span>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-icon">📚</span>
              <h3>Nenhuma família encontrada</h3>
              <p>Adicione famílias botânicas pelo painel administrativo.</p>
            </div>
          )
        )}

        {/* Expedições */}
        {activeTab === 'expeditions' && (
          expeditions.length > 0 ? (
            <div className="expeditions-grid">
              {expeditions.map(e => (
                <div key={e.id} className="expedition-card">
                  <div className="expedition-image">
                    {e.coverImage ? (
                      <img src={e.coverImage} alt={e.title} loading="lazy" />
                    ) : (
                      <span>🧭</span>
                    )}
                  </div>
                  <div className="expedition-info">
                    <span className={`status ${e.status}`}>
                      {e.status === 'active' ? '✅ Ativa' : e.status === 'upcoming' ? '📅 Em breve' : '✔️ Concluída'}
                    </span>
                    <h3>{e.title}</h3>
                    <p>{e.description}</p>
                    <div className="expedition-meta">
                      <span>📍 {e.location}</span>
                      {e.curator && <span>👤 {e.curator}</span>}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-icon">🧭</span>
              <h3>Nenhuma expedição disponível</h3>
              <p>Nova expedições serão anunciadas em breve.</p>
            </div>
          )
        )}

        {/* Eventos */}
        {activeTab === 'events' && (
          events.length > 0 ? (
            <div className="events-grid">
              {events.map(e => {
                const eventDate = new Date(e.date);
                const isFull = e.registered >= e.capacity;
                const isPast = eventDate < new Date();
                
                return (
                  <div key={e.id} className="event-card">
                    <div className="event-date">
                      <span className="day">{eventDate.getDate()}</span>
                      <span className="month">
                        {eventDate.toLocaleDateString('pt-BR', { month: 'short' })}
                      </span>
                    </div>
                    <div className="event-info">
                      <span className="event-type">
                        {e.type === 'workshop' ? '🛠️ Workshop' : 
                         e.type === 'lecture' ? '🎤 Palestra' : 
                         e.type === 'excursion' ? '🥾 Excursão' : '📅 Evento'}
                      </span>
                      <h3>{e.title}</h3>
                      <p>{e.description}</p>
                      <div className="event-meta">
                        {e.speaker && <span>👤 {e.speaker}</span>}
                        <span>👥 {e.registered}/{e.capacity}</span>
                      </div>
                      <button 
                        className="btn btn-primary" 
                        onClick={() => handleRegisterEvent(e.id)} 
                        disabled={isFull || isPast}
                      >
                        {isPast ? 'Realizado' : isFull ? 'Lotado' : 'Inscrever-se'}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <span className="empty-icon">📅</span>
              <h3>Nenhum evento programado</h3>
              <p>Novos eventos serão divulgados em breve.</p>
            </div>
          )
        )}
      </main>

      {/* Modal de detalhes da espécie */}
      {selectedItem && (
        <div className="modal-overlay" onClick={() => setSelectedItem(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <button className="modal-close" onClick={() => setSelectedItem(null)}>×</button>
            <div className="modal-image">
              {selectedItem.imageUrl ? (
                <img src={selectedItem.imageUrl} alt={selectedItem.commonName} />
              ) : (
                <span>🌿</span>
              )}
            </div>
            <div className="modal-info">
              <h2>{selectedItem.commonName}</h2>
              <p className="scientific">{selectedItem.scientificName}</p>
              
              {selectedItem.description && (
                <p className="description">{selectedItem.description}</p>
              )}
              
              <div className="details-grid">
                {selectedItem.origin && (
                  <div><strong>Origem:</strong> {selectedItem.origin}</div>
                )}
                {selectedItem.habitat && (
                  <div><strong>Habitat:</strong> {selectedItem.habitat}</div>
                )}
                {selectedItem.height && (
                  <div><strong>Altura:</strong> {selectedItem.height}</div>
                )}
                {selectedItem.floweringSeason && (
                  <div><strong>Floração:</strong> {selectedItem.floweringSeason}</div>
                )}
                {selectedItem.region && (
                  <div><strong>Região:</strong> {selectedItem.region}</div>
                )}
                {selectedItem.conservationStatus && (
                  <div>
                    <strong>Conservação:</strong>{' '}
                    <span style={{ 
                      color: CONSERVATION_STATUS[selectedItem.conservationStatus]?.color 
                    }}>
                      {CONSERVATION_STATUS[selectedItem.conservationStatus]?.icon}{' '}
                      {CONSERVATION_STATUS[selectedItem.conservationStatus]?.label}
                    </span>
                  </div>
                )}
              </div>
              
              {selectedItem.tags?.length > 0 && (
                <div className="tags">
                  {selectedItem.tags.map((t, i) => (
                    <span key={i} className="tag">{t}</span>
                  ))}
                </div>
              )}
              
              <div className="modal-actions" style={{ marginTop: 'var(--spacing-lg)' }}>
                <button 
                  className={`btn ${likedSpecies.has(selectedItem.id) ? 'btn-danger' : 'btn-secondary'}`}
                  onClick={(e) => handleLike(selectedItem.id, e)}
                >
                  {likedSpecies.has(selectedItem.id) ? '❤️ Curtido' : '🤍 Curtir'}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}