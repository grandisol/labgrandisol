import { useState, useEffect } from 'react';
import { useSearchStore } from '../store/search';
import '../styles/search.css';

export default function Search() {
  const { results, suggestions, trending, query, loading, filters, globalSearch, getSuggestions, getTrending, setFilters, clearSearch } = useSearchStore();
  const [inputValue, setInputValue] = useState('');
  const [activeTab, setActiveTab] = useState('search'); // search, trending, suggestions

  useEffect(() => {
    getTrending();
  }, [getTrending]);

  const handleSearch = (e) => {
    e.preventDefault();
    if (inputValue.trim()) {
      globalSearch(inputValue);
      setActiveTab('search');
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);
    if (value.trim()) {
      getSuggestions(value);
    }
  };

  const handleSuggestionClick = (suggestion) => {
    setInputValue(suggestion);
    globalSearch(suggestion);
    setActiveTab('search');
  };

  return (
    <div className="search-page">
      <div className="search-header">
        <h1>🔍 Busca Avançada</h1>
        <p>Encontre livros, autores, coleções e muito mais</p>
      </div>

      {/* Search Form */}
      <form onSubmit={handleSearch} className="search-form">
        <div className="search-input-group">
          <input
            type="text"
            placeholder="Buscar livros, autores, tags..."
            value={inputValue}
            onChange={handleInputChange}
            className="search-input"
          />
          <button type="submit" className="btn btn-primary">
            🔍 Buscar
          </button>
          {query && (
            <button 
              type="button" 
              className="btn btn-ghost"
              onClick={() => {
                clearSearch();
                setInputValue('');
              }}
            >
              Limpar
            </button>
          )}
        </div>

        {/* Filters */}
        <div className="search-filters">
          <div className="filter-group">
            <label>Classificação Mínima:</label>
            <input
              type="range"
              min="0"
              max="5"
              step="0.5"
              value={filters.minRating}
              onChange={(e) => setFilters({ minRating: parseFloat(e.target.value) })}
              className="filter-range"
            />
            <span className="filter-value">⭐ {filters.minRating}</span>
          </div>
          <div className="filter-group">
            <label>Ordenar por:</label>
            <select 
              value={filters.sortBy}
              onChange={(e) => setFilters({ sortBy: e.target.value })}
              className="filter-select"
            >
              <option value="relevance">Relevância</option>
              <option value="title">Título</option>
              <option value="author">Autor</option>
              <option value="rating">Classificação</option>
              <option value="recent">Recentes</option>
            </select>
          </div>
        </div>
      </form>

      {/* Tabs */}
      <div className="search-tabs">
        <button 
          className={`tab ${activeTab === 'search' ? 'active' : ''}`}
          onClick={() => setActiveTab('search')}
        >
          Resultados ({results.length})
        </button>
        <button 
          className={`tab ${activeTab === 'trending' ? 'active' : ''}`}
          onClick={() => setActiveTab('trending')}
        >
          Em Alta
        </button>
        {suggestions.length > 0 && (
          <button 
            className={`tab ${activeTab === 'suggestions' ? 'active' : ''}`}
            onClick={() => setActiveTab('suggestions')}
          >
            Sugestões
          </button>
        )}
      </div>

      {/* Content */}
      <div className="search-content">
        {loading && <div className="page-loading">⏳ Buscando...</div>}

        {activeTab === 'search' && !loading && (
          <div className="results-grid">
            {results.length === 0 ? (
              <div className="empty-state">
                <p>📚 {query ? 'Nenhum resultado encontrado' : 'Digite para buscar'}</p>
              </div>
            ) : (
              results.map(book => (
                <div key={book.id} className="result-card">
                  <div className="result-image">{book.cover || '📖'}</div>
                  <h3>{book.title}</h3>
                  <p className="result-author">{book.author}</p>
                  {book.rating && (
                    <p className="result-rating">
                      {'⭐'.repeat(Math.round(book.rating))} {book.rating.toFixed(1)}
                    </p>
                  )}
                  <a href={`/books/${book.id}`} className="btn btn-small btn-primary">
                    Ver detalhes
                  </a>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'trending' && (
          <div className="trending-list">
            {trending.length === 0 ? (
              <p className="empty-state">Nenhum livro em alta no momento</p>
            ) : (
              trending.map((item, idx) => (
                <div key={idx} className="trending-item">
                  <span className="trending-rank">#{idx + 1}</span>
                  <div className="trending-info">
                    <h4>{item.title}</h4>
                    <p>{item.author}</p>
                  </div>
                  <span className="trending-score">👁️ {item.views || 0}</span>
                </div>
              ))
            )}
          </div>
        )}

        {activeTab === 'suggestions' && (
          <div className="suggestions-list">
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                className="suggestion-item"
                onClick={() => handleSuggestionClick(suggestion)}
              >
                💡 {suggestion}
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
