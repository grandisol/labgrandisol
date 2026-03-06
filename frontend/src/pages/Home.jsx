import React, { useState, useEffect } from 'react';
import { useAuthStore } from '../store/auth';
import { client } from '../api/client';
import '../styles/designTokens.css';
import '../styles/global.css';
import '../styles/home.css';

const Home = () => {
  const { user, token } = useAuthStore();
  const [stats, setStats] = useState(null);
  const [recentBooks, setRecentBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isOnline, setIsOnline] = useState(navigator.onLine);

  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        setError(null);
        
        // Buscar estatísticas
        const statsResponse = await client.get('/api/library/stats');
        setStats(statsResponse.data);

        // Buscar livros recentes
        const booksResponse = await client.get('/api/library/books?limit=6');
        setRecentBooks(booksResponse.data.books || []);
      } catch (err) {
        console.error('Erro ao buscar dados:', err);
        setError('Erro ao carregar dados da biblioteca');
        // Não definir loading como false aqui para mostrar erro
      } finally {
        setLoading(false);
      }
    };

    fetchData();

    // Monitorar conexão
    const handleOnline = () => setIsOnline(true);
    const handleOffline = () => setIsOnline(false);

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, [token]);

  const getStatusColor = (status) => {
    switch (status) {
      case 'disponível': return 'success';
      case 'emprestado': return 'warning';
      case 'reservado': return 'info';
      default: return 'secondary';
    }
  };

  const getStatusIcon = (status) => {
    switch (status) {
      case 'disponível': return '✅';
      case 'emprestado': return '📚';
      case 'reservado': return '⏳';
      default: return '📦';
    }
  };

  if (loading) {
    return (
      <div className="home-container">
        <div className="loading-container">
          <div className="loading-spinner"></div>
          <p>Carregando biblioteca...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="home-container">
      {/* Cabeçalho Hero */}
      <section className="hero-section">
        <div className="hero-content">
          <div className="hero-text">
            <h1 className="hero-title">
              Bem-vindo à
              <span className="brand-gradient"> LabGrandisol</span>
            </h1>
            <p className="hero-subtitle">
              Sua biblioteca virtual com tecnologia avançada de gestão e pesquisa acadêmica.
              Acesse milhares de recursos e descubra um novo jeito de aprender.
            </p>
            <div className="hero-actions">
              <a href="/library" className="btn btn-primary btn-lg">
                📚 Explorar Acervo
              </a>
              <a href="/museum" className="btn btn-outline btn-lg">
                🌿 Almanaque Botânico
              </a>
            </div>
          </div>
          <div className="hero-visual">
            <div className="book-stack">
              <div className="book book-1"></div>
              <div className="book book-2"></div>
              <div className="book book-3"></div>
              <div className="book book-4"></div>
            </div>
            <div className="stats-badge">
              <div className="stats-number">{stats?.totalBooks || 0}</div>
              <div className="stats-label">Livros Disponíveis</div>
            </div>
          </div>
        </div>
      </section>

      {/* Status de Conexão */}
      {!isOnline && (
        <div className="connection-status warning">
          <span className="status-icon">⚠️</span>
          <span>Você está offline. Algumas funcionalidades podem estar limitadas.</span>
        </div>
      )}

      {/* Estatísticas Gerais */}
      {stats && (
        <section className="stats-section">
          <div className="container">
            <h2 className="section-title">Estatísticas da Biblioteca</h2>
            <div className="stats-grid">
              <div className="stat-card">
                <div className="stat-icon">📚</div>
                <div className="stat-content">
                  <div className="stat-number">{stats.totalBooks}</div>
                  <div className="stat-label">Total de Livros</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">✅</div>
                <div className="stat-content">
                  <div className="stat-number">{stats.availableBooks}</div>
                  <div className="stat-label">Disponíveis</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">⏳</div>
                <div className="stat-content">
                  <div className="stat-number">{stats.borrowedBooks}</div>
                  <div className="stat-label">Emprestados</div>
                </div>
              </div>
              <div className="stat-card">
                <div className="stat-icon">👥</div>
                <div className="stat-content">
                  <div className="stat-number">{stats.totalUsers}</div>
                  <div className="stat-label">Usuários</div>
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Livros Recentes */}
      {recentBooks.length > 0 && (
        <section className="recent-books-section">
          <div className="container">
            <div className="section-header">
              <h2 className="section-title">Livros Recentes</h2>
              <a href="/library" className="btn btn-outline">
                Ver Todos →
              </a>
            </div>
            <div className="books-grid">
              {recentBooks.slice(0, 6).map((book) => (
                <div key={book.id} className="book-card">
                  <div className="book-cover">
                    <img 
                      src={book.imageUrl || '/api/placeholder/200/300'} 
                      alt={book.title}
                      className="book-image"
                      onError={(e) => {
                        e.target.src = 'data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iMjAwIiBoZWlnaHQ9IjMwMCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48cmVjdCB3aWR0aD0iMTAwJSIgaGVpZ2h0PSIxMDAlIiBmaWxsPSIjZjVmNWY1Ii8+PHRleHQgeD0iNTAlIiB5PSI1MCUiIGZvbnQtZmFtaWx5PSJBcmlhbCwgc2Fucy1zZXJpZiIgZm9udC1zaXplPSIxOCIgZmlsbD0iIzk5OTk5OSIgdGV4dC1hbmNob3I9Im1pZGRsZSIgZHk9Ii01Ij5Db3JlIENhcHJpbmlvPC90ZXh0Pjwvc3ZnPg==';
                      }}
                    />
                    <div className={`status-badge ${getStatusColor(book.status)}`}>
                      {getStatusIcon(book.status)} {book.status}
                    </div>
                  </div>
                  <div className="book-info">
                    <h3 className="book-title" title={book.title}>
                      {book.title}
                    </h3>
                    <p className="book-author">{book.author}</p>
                    <div className="book-meta">
                      <span className="book-category">{book.category}</span>
                      <span className="book-year">({book.year})</span>
                    </div>
                    <div className="book-actions">
                      <a href={`/library/${book.id}`} className="btn btn-primary btn-sm">
                        📖 Detalhes
                      </a>
                      {book.status === 'disponível' && (
                        <button className="btn btn-outline btn-sm">
                          ➕ Reservar
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* Recursos Principais */}
      <section className="features-section">
        <div className="container">
          <h2 className="section-title">Recursos Principais</h2>
          <div className="features-grid">
            <div className="feature-card">
              <div className="feature-icon">🔍</div>
              <h3>Busca Inteligente</h3>
              <p>Encontre livros rapidamente com filtros avançados por autor, categoria, ano e muito mais.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">🌿</div>
              <h3>Almanaque Botânico</h3>
              <p>Explore nossa coleção especializada em botânica e ciências naturais.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">👥</div>
              <h3>Comunidade</h3>
              <p>Conecte-se com outros leitores, compartilhe recomendações e participe de discussões.</p>
            </div>
            <div className="feature-card">
              <div className="feature-icon">📊</div>
              <h3>Relatórios</h3>
              <p>Acompanhe estatísticas de leitura, histórico de empréstimos e métricas da biblioteca.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Mensagem de Boas-vindas Personalizada */}
      {user && (
        <section className="welcome-section">
          <div className="container">
            <div className="welcome-card">
              <div className="welcome-content">
                <h3>Olá, {user.name}! 👋</h3>
                <p>Você tem {user.borrowedBooks || 0} livros emprestados e {user.readingList || 0} livros na sua lista de leitura.</p>
                <div className="welcome-actions">
                  <a href="/my-loans" className="btn btn-primary">
                    📚 Meus Empréstimos
                  </a>
                  <a href="/reading-list" className="btn btn-outline">
                    📖 Minha Lista de Leitura
                  </a>
                </div>
              </div>
              <div className="welcome-illustration">
                <div className="reading-icon">📖</div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* Erro */}
      {error && (
        <div className="error-container">
          <div className="error-content">
            <h3>❌ Erro</h3>
            <p>{error}</p>
            <button onClick={() => window.location.reload()} className="btn btn-primary">
              Tentar Novamente
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

export default Home;