/**
 * Library Page - Books Catalog
 * Catálogo de livros com busca e filtros
 */

import React, { useState, useEffect } from 'react';
import '../styles/library.css';

/**
 * @typedef {Object} Book
 * @property {number} id
 * @property {string} title
 * @property {string} author
 * @property {string} category
 * @property {string} cover_url
 * @property {number} average_rating
 * @property {number} available_copies
 * @property {number} total_copies
 */

/**
 * @typedef {Object} Category
 * @property {number} id
 * @property {string} name
 * @property {string} icon
 * @property {string} color
 * @property {number} book_count
 */

const Library = () => {
  const [books, setBooks] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [selectedAuthor, setSelectedAuthor] = useState('');
  const [sortBy, setSortBy] = useState('title');
  const [loading, setLoading] = useState(false);
  const [limit] = useState(20);
  const [offset, setOffset] = useState(0);

  // Carrega categorias ao montar
  useEffect(() => {
    const loadCategories = async () => {
      try {
        const response = await fetch('/api/library/categories');
        const data = await response.json();
        setCategories(data.categories);
      } catch (error) {
        console.error('Erro carregando categorias:', error);
      }
    };
    loadCategories();
  }, []);

  // Busca livros
  useEffect(() => {
    const loadBooks = async () => {
      setLoading(true);
      try {
        const params = new URLSearchParams({
          limit: limit.toString(),
          offset: offset.toString(),
          sortBy
        });

        if (search) params.append('search', search);
        if (selectedCategory) params.append('category', selectedCategory);
        if (selectedAuthor) params.append('author', selectedAuthor);

        const response = await fetch(`/api/library/books?${params}`);
        const data = await response.json();
        setBooks(data.books);
      } catch (error) {
        console.error('Erro carregando livros:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBooks();
  }, [search, selectedCategory, selectedAuthor, sortBy, offset, limit]);

  const handleSearch = (e) => {
    setSearch(e.target.value);
    setOffset(0);
  };

  const handleCategorySelect = (categoryName) => {
    setSelectedCategory(selectedCategory === categoryName ? '' : categoryName);
    setOffset(0);
  };

  return (
    <div className="library-page">
      <div className="library-header">
        <h1>📚 Biblioteca de Livros</h1>
        <p>Acervo completo com {books.length} livros disponíveis</p>
      </div>

      <div className="library-controls">
        {/* Search Bar */}
        <div className="search-container">
          <input
            type="text"
            placeholder="Buscar livros por título ou autor..."
            value={search}
            onChange={handleSearch}
            className="search-input"
          />
          <svg className="search-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor">
            <circle cx="11" cy="11" r="8"></circle>
            <path d="m21 21-4.35-4.35"></path>
          </svg>
        </div>

        {/* Filters */}
        <div className="filters-section">
          <div className="filter-group">
            <label>Categoria:</label>
            <div className="category-buttons">
              {categories.map(cat => (
                <button
                  key={cat.id}
                  className={`category-btn ${selectedCategory === cat.name ? 'active' : ''}`}
                  onClick={() => handleCategorySelect(cat.name)}
                  style={{
                    color: selectedCategory === cat.name ? 'white' : cat.color,
                    borderColor: cat.color,
                    backgroundColor: selectedCategory === cat.name ? cat.color : 'transparent'
                  }}
                  title={`${cat.book_count} livros`}
                >
                  <span className="category-icon">{cat.icon}</span>
                  <span>{cat.name}</span>
                </button>
              ))}
            </div>
          </div>

          <div className="filter-group">
            <label>Ordenar por:</label>
            <select value={sortBy} onChange={(e) => setSortBy(e.target.value)} className="sort-select">
              <option value="title">Título (A-Z)</option>
              <option value="publication_year">Ano de Publicação</option>
              <option value="average_rating">Avaliação</option>
              <option value="author">Autor</option>
            </select>
          </div>
        </div>
      </div>

      {/* Books Grid */}
      <div className="books-container">
        {loading ? (
          <div className="loading">Carregando livros...</div>
        ) : books.length > 0 ? (
          <div className="books-grid">
            {books.map(book => (
              <div key={book.id} className="book-card">
                <div className="book-cover">
                  <img src={book.cover_url || '/default-book.png'} alt={book.title} />
                  <div className="book-overlay">
                    <button className="btn-details">Ver Detalhes</button>
                    <button className="btn-borrow">Emprestar</button>
                  </div>
                </div>
                <div className="book-info">
                  <h3 className="book-title">{book.title}</h3>
                  <p className="book-author">{book.author}</p>
                  <div className="book-meta">
                    <span className="category">{book.category}</span>
                    {book.average_rating > 0 && (
                      <span className="rating">⭐ {book.average_rating.toFixed(1)}</span>
                    )}
                  </div>
                  <div className="book-status">
                    <span className={`availability ${book.available_copies > 0 ? 'available' : 'unavailable'}`}>
                      {book.available_copies > 0 
                        ? `${book.available_copies}/${book.total_copies} disponíveis` 
                        : 'Indisponível'}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="no-results">
            <p>Nenhum livro encontrado com esses critérios</p>
          </div>
        )}
      </div>

      {/* Pagination */}
      {books.length > 0 && (
        <div className="pagination">
          <button
            disabled={offset === 0}
            onClick={() => setOffset(Math.max(0, offset - limit))}
            className="btn-pagination"
          >
            ← Anterior
          </button>
          <span className="pagination-info">
            Página {Math.floor(offset / limit) + 1} • Mostrando {books.length} livros
          </span>
          <button
            onClick={() => setOffset(offset + limit)}
            className="btn-pagination"
          >
            Próxima →
          </button>
        </div>
      )}
    </div>
  );
};

export default Library;
