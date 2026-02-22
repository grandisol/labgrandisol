/**
 * Reading Lists Page
 * Gerenciar listas de leitura
 */

import React, { useState, useEffect } from 'react';
import '../styles/readingList.css';

/**
 * @typedef {Object} BookInList
 * @property {number} id
 * @property {string} title
 * @property {string} author
 * @property {string} cover_url
 * @property {number} average_rating
 * @property {'want_to_read'|'reading'|'finished'} list_type
 * @property {string} added_at
 */

const ReadingList = () => {
  const [wantToRead, setWantToRead] = useState([]);
  const [reading, setReading] = useState([]);
  const [finished, setFinished] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('want');

  useEffect(() => {
    const loadReadingLists = async () => {
      try {
        const lists = ['want_to_read', 'reading', 'finished'];
        
        for (const listType of lists) {
          const response = await fetch(`/api/library/reading-list?listType=${listType}`);
          const data = await response.json();

          switch (listType) {
            case 'want_to_read':
              setWantToRead(data.readingList);
              break;
            case 'reading':
              setReading(data.readingList);
              break;
            case 'finished':
              setFinished(data.readingList);
              break;
          }
        }
      } catch (error) {
        console.error('Erro carregando listas:', error);
      } finally {
        setLoading(false);
      }
    };

    loadReadingLists();
  }, []);

  const handleRemoveFromList = async (bookId, listType) => {
    try {
      const response = await fetch(`/api/library/reading-list/${bookId}`, {
        method: 'DELETE'
      });

      if (response.ok) {
        switch (listType) {
          case 'want_to_read':
            setWantToRead(wantToRead.filter(b => b.id !== bookId));
            break;
          case 'reading':
            setReading(reading.filter(b => b.id !== bookId));
            break;
          case 'finished':
            setFinished(finished.filter(b => b.id !== bookId));
            break;
        }
      }
    } catch (error) {
      console.error('Erro removendo livro:', error);
    }
  };

  const handleMoveToList = async (bookId, currentList, newList) => {
    try {
      const response = await fetch('/api/library/reading-list', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          bookId,
          listType: newList
        })
      });

      if (response.ok) {
        handleRemoveFromList(bookId, currentList);
        // Reload the new list
        const listResponse = await fetch(`/api/library/reading-list?listType=${newList}`);
        const listData = await listResponse.json();

        switch (newList) {
          case 'want_to_read':
            setWantToRead(listData.readingList);
            break;
          case 'reading':
            setReading(listData.readingList);
            break;
          case 'finished':
            setFinished(listData.readingList);
            break;
        }
      }
    } catch (error) {
      console.error('Erro movendo livro:', error);
    }
  };

  if (loading) return <div className="loading">Carregando listas...</div>;

  const BookCard = ({ book, listType }) => (
    <div className="reading-book-card">
      <div className="book-cover-small">
        <img src={book.cover_url || '/default-book.png'} alt={book.title} />
      </div>

      <div className="book-info-small">
        <h3>{book.title}</h3>
        <p className="author">{book.author}</p>
        {book.average_rating > 0 && (
          <p className="rating">⭐ {book.average_rating.toFixed(1)}</p>
        )}
        <p className="added-date">
          Adicionado em {new Date(book.added_at).toLocaleDateString('pt-BR')}
        </p>
      </div>

      <div className="book-actions">
        <div className="move-btn-group">
          {listType !== 'want_to_read' && (
            <button
              className="btn-small"
              onClick={() => handleMoveToList(book.id, listType, 'want_to_read')}
              title="Voltar para Quero Ler"
            >
              ↓ Quero
            </button>
          )}
          {listType !== 'reading' && (
            <button
              className="btn-small"
              onClick={() => handleMoveToList(book.id, listType, 'reading')}
              title="Mover para Lendo"
            >
              ↓ Lendo
            </button>
          )}
          {listType !== 'finished' && (
            <button
              className="btn-small"
              onClick={() => handleMoveToList(book.id, listType, 'finished')}
              title="Mover para Concluído"
            >
              ↓ Pronto
            </button>
          )}
        </div>

        <button
          className="btn-remove"
          onClick={() => handleRemoveFromList(book.id, listType)}
          title="Remover da lista"
        >
          ✕
        </button>
      </div>
    </div>
  );

  return (
    <div className="reading-list-page">
      <div className="reading-header">
        <h1>📖 Minhas Listas de Leitura</h1>
        <p>Organize seus livros em diferentes categorias</p>
      </div>

      {/* Tabs */}
      <div className="reading-tabs">
        <button
          className={`tab ${activeTab === 'want' ? 'active' : ''}`}
          onClick={() => setActiveTab('want')}
        >
          📚 Quero Ler ({wantToRead.length})
        </button>
        <button
          className={`tab ${activeTab === 'reading' ? 'active' : ''}`}
          onClick={() => setActiveTab('reading')}
        >
          👀 Lendo Agora ({reading.length})
        </button>
        <button
          className={`tab ${activeTab === 'finished' ? 'active' : ''}`}
          onClick={() => setActiveTab('finished')}
        >
          ✓ Concluídos ({finished.length})
        </button>
      </div>

      {/* Quero Ler */}
      {activeTab === 'want' && (
        <div className="reading-list-container">
          {wantToRead.length > 0 ? (
            <div className="books-list">
              {wantToRead.map(book => (
                <BookCard
                  key={book.id}
                  book={book}
                  listType="want_to_read"
                />
              ))}
            </div>
          ) : (
            <div className="empty-list">
              <p>Nenhum livro adicionado</p>
              <a href="/library" className="btn-primary">Explorar Biblioteca</a>
            </div>
          )}
        </div>
      )}

      {/* Lendo Agora */}
      {activeTab === 'reading' && (
        <div className="reading-list-container">
          {reading.length > 0 ? (
            <div className="books-list">
              {reading.map(book => (
                <BookCard
                  key={book.id}
                  book={book}
                  listType="reading"
                />
              ))}
            </div>
          ) : (
            <div className="empty-list">
              <p>Você não está lendo nenhum livro no momento</p>
              <p className="hint">Mova livros de "Quero Ler" para esta seção</p>
            </div>
          )}
        </div>
      )}

      {/* Concluídos */}
      {activeTab === 'finished' && (
        <div className="reading-list-container">
          {finished.length > 0 ? (
            <div className="books-list">
              {finished.map(book => (
                <BookCard
                  key={book.id}
                  book={book}
                  listType="finished"
                />
              ))}
            </div>
          ) : (
            <div className="empty-list">
              <p>Você ainda não marcou nenhum livro como concluído</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default ReadingList;
