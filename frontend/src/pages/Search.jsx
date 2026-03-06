import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/designTokens.css';
import '../styles/global.css';
import '../styles/search.css';

export default function Search() {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [results, setResults] = useState([]);
  const [searchType, setSearchType] = useState('all');
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);

  // Get auth token from sessionStorage
  const getAuthHeaders = () => {
    const token = sessionStorage.getItem('auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  const handleSearch = async (e) => {
    e.preventDefault();
    if (!query.trim()) return;

    setLoading(true);
    setHasSearched(true);

    try {
      const params = new URLSearchParams({
        q: query,
        filter_type: searchType
      });

      const response = await fetch(`/api/search?${params}`, {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      setResults(data.results || []);
    } catch (error) {
      console.error('Erro na busca:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleResultClick = (result) => {
    if (result.type === 'book') {
      navigate(`/books/${result.id}`);
    }
  };

  return (
    <div className="search-page">
      <div className="search-header">
        <div className="header-content">
          <div className="header-ornament">❧</div>
          <h1>Busca Avançada</h1>
          <p>Encontre livros, autores e muito mais</p>
        </div>
      </div>

      <div className="search-content">
        <form onSubmit={handleSearch} className="search-form">
          <div className="search-input-wrapper">
            <span className="search-icon">🔍</span>
            <input
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder="Digite sua busca..."
              className="search-input"
            />
            <button type="submit" className="btn btn-primary">
              Buscar
            </button>
          </div>

          <div className="search-filters">
            <label className="filter-label">Buscar em:</label>
            <div className="filter-options">
              {[
                { value: 'all', label: 'Tudo' },
                { value: 'books', label: 'Livros' },
                { value: 'authors', label: 'Autores' },
                { value: 'categories', label: 'Categorias' }
              ].map(option => (
                <button
                  key={option.value}
                  type="button"
                  className={`filter-btn ${searchType === option.value ? 'active' : ''}`}
                  onClick={() => setSearchType(option.value)}
                >
                  {option.label}
                </button>
              ))}
            </div>
          </div>
        </form>

        <div className="search-results">
          {loading ? (
            <div className="loading">Buscando...</div>
          ) : hasSearched ? (
            results.length > 0 ? (
              <>
                <div className="results-header">
                  <span className="results-count">{results.length} resultados encontrados</span>
                </div>
                <div className="results-list">
                  {results.map((result, index) => (
                    <div
                      key={index}
                      className="result-card"
                      onClick={() => handleResultClick(result)}
                    >
                      <div className="result-icon">
                        {result.type === 'book' ? '📖' : 
                         result.type === 'author' ? '✍️' : '📁'}
                      </div>
                      <div className="result-info">
                        <h3 className="result-title">{result.title || result.name}</h3>
                        <p className="result-description">{result.description || result.author}</p>
                        {result.category && (
                          <span className="result-category">{result.category}</span>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </>
            ) : (
              <div className="no-results">
                <div className="no-results-icon">🔍</div>
                <h3>Nenhum resultado encontrado</h3>
                <p>Tente outros termos de busca</p>
              </div>
            )
          ) : (
            <div className="search-placeholder">
              <div className="placeholder-icon">📚</div>
              <h3>Explore o Acervo</h3>
              <p>Digite algo para começar a busca</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}