import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import '../styles/designTokens.css';
import '../styles/global.css';
import '../styles/bookDetail.css';

export default function BookDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [book, setBook] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const loadBook = async () => {
      try {
        setLoading(true);

        // Tentar carregar da API
        const token = sessionStorage.getItem('auth_token');
        const headers = token ? { Authorization: `Bearer ${token}` } : {};

        try {
          const response = await fetch(`/api/library/books/${id}`, { headers });
          if (response.ok) {
            const data = await response.json();
            setBook(data.book);
            setLoading(false);
            return;
          }
        } catch (e) {
          console.log('API não disponível, usando dados locais');
        }

        // Fallback: buscar do localStorage ou usar dados mock
        const storedBooks = JSON.parse(localStorage.getItem('library_books') || '[]');
        const localBook = storedBooks.find(b => b.id == id);
        
        if (localBook) {
          setBook(localBook);
        } else {
          // Dados mock de fallback
          const mockBooks = [
            { id: 1, title: '1984', author: 'George Orwell', category: 'Ficção', description: 'Um romance distópico sobre um regime totalitário.', cover_url: 'https://images.unsplash.com/photo-1544947950-fa07a98d237f?w=400', pages: 328, published_year: 1949, available_copies: 3, total_copies: 5, isbn: '978-0451524935' },
            { id: 2, title: 'O Senhor dos Anéis', author: 'J.R.R. Tolkien', category: 'Ficção', description: 'Uma jornada épica através de um mundo mágico.', cover_url: 'https://images.unsplash.com/photo-1512820790803-83ca734da794?w=400', pages: 1216, published_year: 1954, available_copies: 2, total_copies: 4, isbn: '978-0544003415' },
            { id: 3, title: 'Uma Breve História do Tempo', author: 'Stephen Hawking', category: 'Ciência', description: 'Uma exploração acessível dos buracos negros e do universo.', cover_url: 'https://images.unsplash.com/photo-1462536943532-57a629f6cc60?w=400', pages: 256, published_year: 1988, available_copies: 4, total_copies: 5, isbn: '978-0553380163' },
          ];
          const foundBook = mockBooks.find(b => b.id == id);
          setBook(foundBook || null);
        }
      } catch (err) {
        console.error('Erro:', err);
        setBook(null);
      } finally {
        setLoading(false);
      }
    };

    if (id) loadBook();
  }, [id]);

  const handleBorrow = () => {
    alert('Livro emprestado com sucesso! Prazo: 14 dias');
    navigate('/my-loans');
  };

  const handleAddToList = () => {
    alert('Adicionado à lista de leitura!');
  };

  if (loading) {
    return <div className="book-detail-page"><div className="loading">Carregando livro...</div></div>;
  }

  if (!book) {
    return (
      <div className="book-detail-page">
        <div className="book-not-found">
          <span className="not-found-icon">📚</span>
          <h2>Livro não encontrado</h2>
          <button className="btn btn-primary" onClick={() => navigate('/library')}>Voltar à Biblioteca</button>
        </div>
      </div>
    );
  }

  return (
    <div className="book-detail-page">
      <div className="book-detail-header">
        <button className="btn btn-secondary" onClick={() => navigate(-1)}>← Voltar</button>
      </div>

      <div className="book-detail-content">
        <aside className="book-cover-section">
          <div className="book-cover-wrapper">
            {book.cover_url ? <img src={book.cover_url} alt={book.title} /> : <div className="book-cover-placeholder"><span>📖</span></div>}
          </div>
          <div className="book-actions">
            <button className={`btn ${book.available_copies > 0 ? 'btn-primary' : 'btn-secondary'}`} onClick={handleBorrow} disabled={book.available_copies === 0}>
              {book.available_copies > 0 ? '📚 Emprestar' : 'Indisponível'}
            </button>
            <button className="btn btn-secondary" onClick={handleAddToList}>🔖 Lista de Leitura</button>
          </div>
          <div className="book-availability-info">
            <span className={`status ${book.available_copies > 0 ? 'available' : 'unavailable'}`}>
              {book.available_copies > 0 ? '✓ Disponível' : '✗ Indisponível'}
            </span>
            <p>{book.available_copies || 0} de {book.total_copies || 1} cópias</p>
          </div>
        </aside>

        <main className="book-info-section">
          <div className="book-title-block">
            <span className="book-category">{book.category || 'Geral'}</span>
            <h1>{book.title}</h1>
            <p className="book-author">por <strong>{book.author || 'Autor desconhecido'}</strong></p>
          </div>

          <div className="book-description-block">
            <h2>Sinopse</h2>
            <p>{book.description || 'Descrição não disponível.'}</p>
          </div>

          <div className="book-metadata-block">
            <h2>Informações</h2>
            <div className="metadata-grid">
              <div className="metadata-item"><span className="meta-label">Ano</span><span className="meta-value">{book.published_year || 'N/A'}</span></div>
              <div className="metadata-item"><span className="meta-label">Páginas</span><span className="meta-value">{book.pages || 'N/A'}</span></div>
              {book.isbn && <div className="metadata-item"><span className="meta-label">ISBN</span><span className="meta-value isbn">{book.isbn}</span></div>}
            </div>
          </div>
        </main>
      </div>

      <section className="ratings-section">
        <h2>Avaliações</h2>
        <div className="no-ratings"><span>📝</span><p>Seja o primeiro a avaliar este livro!</p></div>
      </section>
    </div>
  );
}