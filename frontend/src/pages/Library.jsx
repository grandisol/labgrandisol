import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/designTokens.css';
import '../styles/global.css';
import '../styles/library.css';

 export default function Library() {
  const navigate = useNavigate();
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('title');
  const [loading, setLoading] = useState(false);
  const [limit] = useState(20);
  const [offset, setOffset] = useState(0);

  // Get auth token from sessionStorage
  const getAuthHeaders = () => {
    const token = sessionStorage.getItem('auth_token');
    return token ? { Authorization: `Bearer ${token}` } : {};
  };

  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch('/api/library/categories', {
          headers: getAuthHeaders()
        });
        const data = await response.json();
        setCategories(data.categories || []);
      } catch (error) {
        console.error('Erro carregando categorias:', error);
      }
    };
    loadCategories();
  }, []);

  useEffect(() => {
    const loadBooks = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          limit: limit.toString(),
          offset: offset.toString()
        });

        if (search) params.append('q', search);
        if (selectedCategory) params.append('category', selectedCategory);

        const response = await fetch(`/api/library/books?${params}`, {
          headers: getAuthHeaders()
        });
        
        if (response.ok) {
          const data = await response.json();
          // Combinar com dados do localStorage
          const storedBooks = JSON.parse(localStorage.getItem('library_books') || '[]');
          setBooks([...(data.books || []), ...storedBooks]);
        } else {
          // Usar apenas localStorage se API falhar
          const storedBooks = JSON.parse(localStorage.getItem('library_books') || '[]');
          setBooks(storedBooks);
        }
      } catch (error) {
        console.error('Erro carregando livros:', error);
        // Fallback para localStorage
        const storedBooks = JSON.parse(localStorage.getItem('library_books') || '[]');
        setBooks(storedBooks);
      } finally {
        setLoading(false);
      }
    };

    loadBooks();
  }, [search, selectedCategory, sortBy, offset, limit]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setOffset(0);
  };

  const handleCategorySelect = (categoryName) => {
    setSelectedCategory(selectedCategory === categoryName ? '' : categoryName);
    setOffset(0);
  };

const handleBookClick = (bookId) => {
    navigate(`/library/${bookId}`);
  };

  return (
    <div className="library-page">
      <div className="library-header">
        <div className="header-content">
          <div className="header-ornament">❧</div>
          <h1>Biblioteca</h1>
          <p>Explore nosso acervo de {books.length} obras disponíveis</p>
        </div>
      </div>

      <div className="library-content">
        {/* Sidebar with Categories */}
        <aside className="library-sidebar">
          <div className="sidebar-section">
            <h3>Categorias</h3>
            <div className="category-list">
              <button
                className={`category-item ${selectedCategory === '' ? 'active' : ''}`}
                onClick={() => handleCategorySelect('')}
              >
                <span className="category-icon">📚</span>
                <span>Todas</span>
              </button>
              {categories.map(cat => (
                <button
                  key={cat.id}
                  className={`category-item ${selectedCategory === cat.name ? 'active' : ''}`}
                  onClick={() => handleCategorySelect(cat.name)}
                >
                  <span className="category-icon">{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>
        </aside>

        {/* Main Content */}
        <main className="library-main">
          {/* Search and Controls */}
          <div className="library-controls">
            <div className="search-box">
              <span className="search-icon">🔍</span>
              <input
                type="text"
                placeholder="Buscar por título ou autor..."
                value={search}
                onChange={handleSearch}
                className="search-input"
              />
            </div>

            <div className="sort-control">
              <label>Ordenar por:</label>
              <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
                <option value="title">Título</option>
                <option value="publication_year">Ano</option>
                <option value="average_rating">Avaliação</option>
                <option value="author">Autor</option>
              </select>
            </div>
          </div>

          {/* Books Grid */}
          <div className="books-section">
            {loading ? (
              <div className="loading">
                <span>Carregando acervo...</span>
              </div>
            ) : books.length > 0 ? (
              <div className="books-grid">
                {books.map(book => (
                  <div 
                    key={book.id} 
                    className="book-card"
                    onClick={() => handleBookClick(book.id)}
                  >
                    <div className="book-cover">
                      {book.cover_url ? (
                        <img src={book.cover_url} alt={book.title} />
                      ) : (
                        <div className="book-placeholder">
                          <span>📖</span>
                        </div>
                      )}
                      {book.available_copies > 0 && (
                        <div className="available-badge">Disponível</div>
                      )}
                    </div>
                    <div className="book-info">
                      <h3 className="book-title">{book.title}</h3>
                      <p className="book-author">{book.author}</p>
                      <div className="book-meta">
                        <span className="book-category">{book.category}</span>
                        {book.average_rating > 0 && (
                          <span className="book-rating">⭐ {book.average_rating.toFixed(1)}</span>
                        )}
                      </div>
                      <div className="book-availability">
                        <span className={book.available_copies > 0 ? 'available' : 'unavailable'}>
                          {book.available_copies > 0 
                            ? `${book.available_copies} de ${book.total_copies}` 
                            : 'Indisponível'}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="no-results">
                <div className="no-results-icon">📚</div>
                <h3>Nenhum livro encontrado</h3>
                <p>Tente ajustar os filtros ou a busca</p>
              </div>
            )}
          </div>

          {/* Pagination */}
          {books.length > 0 && (
            <div className="pagination">
              <button
                className="btn btn-secondary"
                disabled={offset === 0}
                onClick={() => setOffset(Math.max(0, offset - limit))}
              >
                ← Anterior
              </button>
              <span className="pagination-info">
                Página {Math.floor(offset / limit) + 1}
              </span>
              <button
                className="btn btn-secondary"
                onClick={() => setOffset(offset + limit)}
                disabled={books.length < limit}
              >
                Próxima →
              </button>
            </div>
          )}
        </main>
      </div>
    </div>
  );
}