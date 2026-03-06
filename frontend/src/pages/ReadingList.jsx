import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/designTokens.css';
import '../styles/global.css';
import '../styles/readingList.css';

export default function ReadingList() {
  const navigate = useNavigate();
  const [lists, setLists] = useState({
    want_to_read: [],
    reading: [],
    finished: []
  });
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('want');

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
    loadLists();
  }, []);

  const loadLists = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/library/reading-list', {
        headers: getAuthHeaders()
      });
      const data = await response.json();
      
      // Group by status
      const readingList = data.reading_list || [];
      setLists({
        want_to_read: readingList.filter(item => item.status === 'want_to_read'),
        reading: readingList.filter(item => item.status === 'reading'),
        finished: readingList.filter(item => item.status === 'finished')
      });
    } catch (error) {
      console.error('Erro carregando listas:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (itemId, listType) => {
    if (!window.confirm('Remover este livro da lista?')) return;
    
    try {
      const response = await fetch(`/api/library/reading-list/${itemId}`, {
        method: 'DELETE',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        setLists(prev => ({
          ...prev,
          [listType]: prev[listType].filter(b => b.id !== itemId)
        }));
      }
    } catch (error) {
      console.error('Erro removendo livro:', error);
    }
  };

  const handleMove = async (item, fromList, toList) => {
    try {
      const response = await fetch('/api/library/reading-list', {
        method: 'POST',
        headers: getAuthHeaders(true),
        body: JSON.stringify({ 
          book_id: item.book_id, 
          status: toList 
        })
      });
      
      if (response.ok) {
        // Remove from old list and add to new
        setLists(prev => ({
          ...prev,
          [fromList]: prev[fromList].filter(b => b.id !== item.id),
          [toList]: [{ ...item, status: toList }, ...prev[toList]]
        }));
      }
    } catch (error) {
      console.error('Erro movendo livro:', error);
    }
  };

  const getBookInfo = (item) => {
    // Handle both nested book object and flat properties
    return {
      id: item.id,
      book_id: item.book_id,
      title: item.book?.title || item.title || 'Livro',
      author: item.book?.author || item.author || 'Autor desconhecido',
      cover_url: item.book?.cover_url || item.cover_url || null,
      average_rating: item.book?.average_rating || item.average_rating || 0,
      added_at: item.created_at || item.added_at
    };
  };

  if (loading) return <div className="loading">Carregando listas...</div>;

  const currentList = lists[activeTab] || [];
  const currentListKey = activeTab === 'want' ? 'want_to_read' : 
                         activeTab === 'reading' ? 'reading' : 'finished';

  return (
    <div className="reading-list-page">
      <div className="reading-header">
        <div className="header-content">
          <div className="header-ornament">❧</div>
          <h1>Lista de Leitura</h1>
          <p>Organize seus livros por status de leitura</p>
        </div>
      </div>

      <div className="reading-content">
        <div className="reading-tabs">
          <button 
            className={`tab-btn ${activeTab === 'want' ? 'active' : ''}`}
            onClick={() => setActiveTab('want')}
          >
            📚 Quero Ler ({lists.want_to_read.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'reading' ? 'active' : ''}`}
            onClick={() => setActiveTab('reading')}
          >
            👀 Lendo ({lists.reading.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'finished' ? 'active' : ''}`}
            onClick={() => setActiveTab('finished')}
          >
            ✓ Concluídos ({lists.finished.length})
          </button>
        </div>

        <div className="books-grid">
          {currentList.length > 0 ? (
            currentList.map(item => {
              const book = getBookInfo(item);
              
              return (
                <div key={item.id} className="reading-book-card">
                  <div className="book-cover" onClick={() => navigate(`/books/${item.book_id}`)}>
                    {book.cover_url ? (
                      <img src={book.cover_url} alt={book.title} />
                    ) : (
                      <div className="cover-placeholder">📖</div>
                    )}
                  </div>
                  
                  <div className="book-info">
                    <h3 onClick={() => navigate(`/books/${item.book_id}`)}>{book.title}</h3>
                    <p className="book-author">{book.author}</p>
                    {book.average_rating > 0 && (
                      <span className="book-rating">⭐ {book.average_rating.toFixed(1)}</span>
                    )}
                    <span className="added-date">
                      Adicionado em {book.added_at ? new Date(book.added_at).toLocaleDateString('pt-BR') : 'Recente'}
                    </span>
                  </div>

                  <div className="book-actions">
                    <div className="move-actions">
                      {activeTab !== 'want' && (
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleMove(item, currentListKey, 'want_to_read')}
                        >
                          📚 Quero Ler
                        </button>
                      )}
                      {activeTab !== 'reading' && (
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleMove(item, currentListKey, 'reading')}
                        >
                          👀 Lendo
                        </button>
                      )}
                      {activeTab !== 'finished' && (
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={() => handleMove(item, currentListKey, 'finished')}
                        >
                          ✓ Concluir
                        </button>
                      )}
                    </div>
                    <button 
                      className="btn btn-ghost btn-sm"
                      onClick={() => handleRemove(item.id, currentListKey)}
                    >
                      ✕ Remover
                    </button>
                  </div>
                </div>
              );
            })
          ) : (
            <div className="empty-state">
              <span className="empty-icon">📚</span>
              <h3>Lista vazia</h3>
              <p>
                {activeTab === 'want' && 'Adicione livros que deseja ler'}
                {activeTab === 'reading' && 'Mova livros para esta lista quando começar a ler'}
                {activeTab === 'finished' && 'Marque livros como concluídos após a leitura'}
              </p>
              {activeTab === 'want' && (
                <button className="btn btn-primary" onClick={() => navigate('/library')}>
                  Explorar Biblioteca
                </button>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}