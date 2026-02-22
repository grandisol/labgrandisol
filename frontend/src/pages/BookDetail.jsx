/**
 * Book Detail Page
 * Página detalhada de um livro
 */

import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/bookDetail.css';

/**
 * @typedef {Object} Book
 * @property {number} id
 * @property {string} title
 * @property {string} author
 * @property {string} category
 * @property {string} isbn
 * @property {number} publication_year
 * @property {string} publisher
 * @property {number} pages
 * @property {string} language
 * @property {string} description
 * @property {string} cover_url
 * @property {number} average_rating
 * @property {number} available_copies
 * @property {number} total_copies
 */

/**
 * @typedef {Object} Rating
 * @property {number} id
 * @property {number} rating
 * @property {string} review
 * @property {string} name
 * @property {string} created_at
 */

const BookDetail = () => {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [ratings, setRatings] = useState([]);
  const [userRating, setUserRating] = useState(null);
  const [loading, setLoading] = useState(true);
  const [rating, setRating] = useState(5);
  const [review, setReview] = useState('');
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    const loadBook = async () => {
      try {
        const response = await fetch(`/api/library/books/${id}`);
        const data = await response.json();
        setBook(data.book);
        setRatings(data.ratings);
        setUserRating(data.userRating);
      } catch (error) {
        console.error('Erro carregando livro:', error);
      } finally {
        setLoading(false);
      }
    };

    loadBook();
  }, [id]);

  const handleSubmitRating = async (e) => {
    e.preventDefault();
    setSubmitting(true);

    try {
      const response = await fetch('/api/library/ratings', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: id,
          rating,
          review: review || null
        })
      });

      if (response.ok) {
        const newRating = await response.json();
        setUserRating(newRating);
        setReview('');
        // Atualiza lista de ratings
        if (ratings.some(r => r.id === newRating.id)) {
          setRatings(ratings.map(r => r.id === newRating.id ? newRating : r));
        } else {
          setRatings([newRating, ...ratings]);
        }
      }
    } catch (error) {
      console.error('Erro salvando avaliação:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const handleBorrow = async () => {
    try {
      const dueDate = new Date();
      dueDate.setDate(dueDate.getDate() + 14); // 14 dias para devolver

      const response = await fetch('/api/library/loans', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId: id,
          dueDate: dueDate.toISOString().split('T')[0]
        })
      });

      if (response.ok) {
        alert('Livro emprestado com sucesso! Prazo: 14 dias');
        navigate('/my-loans');
      } else {
        alert('Erro ao emprestar livro');
      }
    } catch (error) {
      console.error('Erro emprestando livro:', error);
    }
  };

  if (loading) return <div className="loading">Carregando...</div>;
  if (!book) return <div className="error">Livro não encontrado</div>;

  return (
    <div className="book-detail-page">
      <div className="book-detail-container">
        {/* Header com Voltar */}
        <button className="btn-back" onClick={() => navigate(-1)}>
          ← Voltar
        </button>

        <div className="book-detail-content">
          {/* Coluna Esquerda - Capa */}
          <div className="book-detail-left">
            <div className="book-cover-large">
              <img src={book.cover_url || '/default-book.png'} alt={book.title} />
            </div>
            <button 
              className={`btn-borrow-large ${book.available_copies === 0 ? 'disabled' : ''}`}
              onClick={handleBorrow}
              disabled={book.available_copies === 0}
            >
              {book.available_copies > 0 ? '📚 Emprestar Livro' : '❌ Indisponível'}
            </button>
            <div className="book-availability">
              <p className="availability-text">
                Cópias disponíveis: <strong>{book.available_copies}/{book.total_copies}</strong>
              </p>
            </div>
          </div>

          {/* Coluna Direita - Informações */}
          <div className="book-detail-right">
            <h1 className="book-title">{book.title}</h1>
            
            <div className="book-authors">
              <p>Autor: <strong>{book.author}</strong></p>
            </div>

            {/* Rating */}
            <div className="book-rating">
              <div className="rating-display">
                <span className="rating-stars">
                  {'⭐'.repeat(Math.round(book.average_rating))}
                </span>
                <span className="rating-number">{book.average_rating.toFixed(1)}</span>
                <span className="rating-label">({ratings.length} avaliações)</span>
              </div>
            </div>

            {/* Descrição */}
            <div className="book-description">
              <h2>Sinopse</h2>
              <p>{book.description || 'Descrição não disponível'}</p>
            </div>

            {/* Informações Técnicas */}
            <div className="book-metadata">
              <div className="metadata-section">
                <h3>Detalhes da Publicação</h3>
                <div className="metadata-grid">
                  <div className="metadata-item">
                    <label>Categoria</label>
                    <span className="category-badge">{book.category}</span>
                  </div>
                  <div className="metadata-item">
                    <label>Ano</label>
                    <span>{book.publication_year}</span>
                  </div>
                  <div className="metadata-item">
                    <label>Editora</label>
                    <span>{book.publisher || 'N/A'}</span>
                  </div>
                  <div className="metadata-item">
                    <label>Páginas</label>
                    <span>{book.pages || 'N/A'}</span>
                  </div>
                  {book.isbn && (
                    <div className="metadata-item">
                      <label>ISBN</label>
                      <span className="isbn">{book.isbn}</span>
                    </div>
                  )}
                  {book.language && (
                    <div className="metadata-item">
                      <label>Idioma</label>
                      <span>{book.language}</span>
                    </div>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Seção de Avaliações */}
        <div className="ratings-section">
          <h2>Avaliações e Comentários</h2>

          {/* Formulário de Avaliação */}
          <div className="rating-form">
            <h3>Sua Avaliação</h3>
            <form onSubmit={handleSubmitRating}>
              <div className="form-group">
                <label>Nota:</label>
                <div className="rating-selector">
                  {[1, 2, 3, 4, 5].map(num => (
                    <button
                      key={num}
                      type="button"
                      className={`star ${rating >= num ? 'active' : ''}`}
                      onClick={() => setRating(num)}
                    >
                      {'⭐'}
                    </button>
                  ))}
                </div>
              </div>

              <div className="form-group">
                <label htmlFor="review">Comentário (opcional):</label>
                <textarea
                  id="review"
                  value={review}
                  onChange={(e) => setReview(e.target.value)}
                  placeholder="Compartilhe sua opinião sobre o livro..."
                  maxLength={1000}
                />
              </div>

              <button 
                type="submit" 
                className="btn-submit-rating"
                disabled={submitting}
              >
                {submitting ? 'Salvando...' : 'Enviar Avaliação'}
              </button>
            </form>
          </div>

          {/* Lista de Avaliações */}
          <div className="ratings-list">
            <h3>Avaliações de Leitores ({ratings.length})</h3>
            {ratings.length > 0 ? (
              <div className="ratings-items">
                {ratings.map(r => (
                  <div key={r.id} className="rating-item">
                    <div className="rating-header">
                      <span className="rating-stars">{'⭐'.repeat(r.rating)}</span>
                      <span className="rater-name">{r.name}</span>
                      <span className="rating-date">
                        {new Date(r.created_at).toLocaleDateString('pt-BR')}
                      </span>
                    </div>
                    {r.review && <p className="rating-text">{r.review}</p>}
                  </div>
                ))}
              </div>
            ) : (
              <p className="no-ratings">Seja o primeiro a avaliar este livro!</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default BookDetail;
