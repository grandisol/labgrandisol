import { useState, useEffect, useCallback } from 'react';
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom';
import { adminAPI, libraryAPI } from '../api/client';
import '../styles/designTokens.css';
import '../styles/global.css';
import '../styles/admin.css';

// ==================== ADMIN DASHBOARD ====================
function AdminDashboard() {
  const [stats, setStats] = useState({
    users: 0,
    books: 0,
    loans: 0,
    species: 0,
    families: 0,
    activeUsers: 0,
  });
  const [loading, setLoading] = useState(true);
  const [recentActivity, setRecentActivity] = useState([]);

  useEffect(() => {
    const loadStats = async () => {
      try {
        // Carregar dados do localStorage
        const storedSpecies = JSON.parse(localStorage.getItem('museum_species') || '[]');
        const storedFamilies = JSON.parse(localStorage.getItem('museum_families') || '[]');
        const storedBooks = JSON.parse(localStorage.getItem('library_books') || '[]');
        const users = JSON.parse(localStorage.getItem('labgrandisol_users') || '[]');
        
        setStats({
          users: Math.max(users.length, 2),
          books: storedBooks.length || 12,
          loans: 1,
          species: 10 + storedSpecies.length,
          families: 6 + storedFamilies.length,
          activeUsers: Math.max(users.filter(u => u.status === 'active').length, 1),
        });
        
        // Atividade recente simulada
        setRecentActivity([
          { id: 1, type: 'book', action: 'Livro adicionado', title: 'Novo livro no acervo', time: '2 horas atrás' },
          { id: 2, type: 'user', action: 'Novo usuário', title: 'Usuário registrado', time: '5 horas atrás' },
          { id: 3, type: 'loan', action: 'Empréstimo', title: 'Livro emprestado', time: '1 dia atrás' },
        ]);
      } catch (e) {
        console.error('Erro ao carregar estatísticas:', e);
      } finally {
        setLoading(false);
      }
    };
    loadStats();
  }, []);

  if (loading) {
    return <div className="loading">Carregando painel...</div>;
  }

  return (
    <div className="admin-dashboard">
      <h2>📊 Painel Administrativo</h2>
      
      <div className="admin-stats">
        <div className="admin-stat-card">
          <span className="stat-icon">👥</span>
          <div className="stat-info">
            <span className="stat-value">{stats.users}</span>
            <span className="stat-label">Usuários</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <span className="stat-icon">📚</span>
          <div className="stat-info">
            <span className="stat-value">{stats.books}</span>
            <span className="stat-label">Livros</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <span className="stat-icon">🌿</span>
          <div className="stat-info">
            <span className="stat-value">{stats.species}</span>
            <span className="stat-label">Espécies</span>
          </div>
        </div>
        <div className="admin-stat-card">
          <span className="stat-icon">📖</span>
          <div className="stat-info">
            <span className="stat-value">{stats.loans}</span>
            <span className="stat-label">Empréstimos Ativos</span>
          </div>
        </div>
      </div>

      <div className="admin-section">
        <h3>🎯 Ações Rápidas</h3>
        <div className="quick-actions">
          <NavLink to="/admin/books" className="quick-action-btn">📚 Gerenciar Livros</NavLink>
          <NavLink to="/admin/museum" className="quick-action-btn">🌿 Almanaque Botânico</NavLink>
          <NavLink to="/admin/users" className="quick-action-btn">👥 Usuários</NavLink>
          <NavLink to="/admin/settings" className="quick-action-btn">⚙️ Configurações</NavLink>
        </div>
      </div>

      <div className="admin-section">
        <h3>📋 Atividade Recente</h3>
        <div className="activity-list">
          {recentActivity.map(activity => (
            <div key={activity.id} className="activity-item">
              <span className="activity-icon">
                {activity.type === 'book' ? '📚' : activity.type === 'user' ? '👤' : '📖'}
              </span>
              <div className="activity-content">
                <p className="activity-text">
                  <strong>{activity.action}</strong>: {activity.title}
                </p>
                <span className="activity-time">{activity.time}</span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}

// ==================== ADMIN USERS ====================
function AdminUsers() {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);

  useEffect(() => {
    const loadUsers = () => {
      try {
        const storedUsers = JSON.parse(localStorage.getItem('labgrandisol_users') || '[]');
        const defaultUsers = [
          { id: 1, name: 'Administrador', email: 'admin@labgrandisol.com', role: 'admin', status: 'active', createdAt: '2024-01-01' },
          { id: 2, name: 'João Silva', email: 'usuario@labgrandisol.com', role: 'user', status: 'active', createdAt: '2024-06-15' }
        ];
        setUsers(storedUsers.length > 0 ? storedUsers : defaultUsers);
      } catch (e) {
        console.error('Erro ao carregar usuários:', e);
      } finally {
        setLoading(false);
      }
    };
    loadUsers();
  }, []);

  const handleSaveUser = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const userData = {
      id: editingUser?.id || Date.now(),
      name: formData.get('name'),
      email: formData.get('email'),
      role: formData.get('role'),
      status: formData.get('status'),
      createdAt: editingUser?.createdAt || new Date().toISOString().split('T')[0],
    };

    let updatedUsers;
    if (editingUser) {
      updatedUsers = users.map(u => u.id === editingUser.id ? userData : u);
    } else {
      updatedUsers = [...users, userData];
    }

    setUsers(updatedUsers);
    localStorage.setItem('labgrandisol_users', JSON.stringify(updatedUsers));
    setShowModal(false);
    setEditingUser(null);
  };

  const handleDeleteUser = (id) => {
    if (!window.confirm('Tem certeza que deseja remover este usuário?')) return;
    const filtered = users.filter(u => u.id !== id);
    setUsers(filtered);
    localStorage.setItem('labgrandisol_users', JSON.stringify(filtered));
  };

  const handleEditUser = (user) => {
    setEditingUser(user);
    setShowModal(true);
  };

  if (loading) return <div className="loading">Carregando usuários...</div>;

  return (
    <div className="admin-section">
      <div className="admin-controls">
        <h2>👥 Gerenciar Usuários</h2>
        <button className="btn btn-primary" onClick={() => { setEditingUser(null); setShowModal(true); }}>
          + Novo Usuário
        </button>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Nome</th>
              <th>Email</th>
              <th>Função</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {users.map(user => (
              <tr key={user.id}>
                <td>{user.name}</td>
                <td>{user.email}</td>
                <td>
                  <span className={`role-badge ${user.role}`}>
                    {user.role === 'admin' ? '👑 Admin' : user.role === 'librarian' ? '📚 Bibliotecário' : '👤 Usuário'}
                  </span>
                </td>
                <td>
                  <span className={`status-badge ${user.status}`}>
                    {user.status === 'active' ? '✓ Ativo' : '✗ Inativo'}
                  </span>
                </td>
                <td className="actions-cell">
                  <button className="btn btn-sm btn-secondary" onClick={() => handleEditUser(user)}>
                    ✏️
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDeleteUser(user.id)}>
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <h3>{editingUser ? 'Editar Usuário' : 'Novo Usuário'}</h3>
            <form onSubmit={handleSaveUser}>
              <div className="form-group">
                <label>Nome *</label>
                <input name="name" required defaultValue={editingUser?.name || ''} />
              </div>
              <div className="form-group">
                <label>Email *</label>
                <input name="email" type="email" required defaultValue={editingUser?.email || ''} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Função</label>
                  <select name="role" defaultValue={editingUser?.role || 'user'}>
                    <option value="user">Usuário</option>
                    <option value="librarian">Bibliotecário</option>
                    <option value="admin">Administrador</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Status</label>
                  <select name="status" defaultValue={editingUser?.status || 'active'}>
                    <option value="active">Ativo</option>
                    <option value="inactive">Inativo</option>
                  </select>
                </div>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingUser ? 'Salvar' : 'Criar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== ADMIN BOOKS ====================
function AdminBooks() {
  const [books, setBooks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingBook, setEditingBook] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');

  useEffect(() => {
    const loadBooks = async () => {
      try {
        const stored = JSON.parse(localStorage.getItem('library_books') || '[]');
        const defaultBooks = [
          { id: 1, title: '1984', author: 'George Orwell', category: 'Ficção', isbn: '978-8535902775', year: 1949, pages: 416, available: 3, total: 5 },
          { id: 2, title: 'O Senhor dos Anéis', author: 'J.R.R. Tolkien', category: 'Fantasia', isbn: '978-8533613379', year: 1954, pages: 1200, available: 2, total: 4 },
          { id: 3, title: 'Dom Casmurro', author: 'Machado de Assis', category: 'Literatura Brasileira', isbn: '978-8535914846', year: 1899, pages: 256, available: 5, total: 5 },
        ];
        setBooks(stored.length > 0 ? stored : defaultBooks);
      } catch (e) {
        console.error('Erro ao carregar livros:', e);
      } finally {
        setLoading(false);
      }
    };
    loadBooks();
  }, []);

  const handleSaveBook = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const bookData = {
      id: editingBook?.id || Date.now(),
      title: formData.get('title'),
      author: formData.get('author'),
      category: formData.get('category'),
      isbn: formData.get('isbn'),
      year: parseInt(formData.get('year')) || new Date().getFullYear(),
      pages: parseInt(formData.get('pages')) || 0,
      description: formData.get('description'),
      available: parseInt(formData.get('copies')) || 1,
      total: parseInt(formData.get('copies')) || 1,
      createdAt: editingBook?.createdAt || new Date().toISOString(),
    };

    let updatedBooks;
    if (editingBook) {
      updatedBooks = books.map(b => b.id === editingBook.id ? bookData : b);
    } else {
      updatedBooks = [...books, bookData];
    }

    setBooks(updatedBooks);
    localStorage.setItem('library_books', JSON.stringify(updatedBooks));
    setShowModal(false);
    setEditingBook(null);
  };

  const handleDeleteBook = (id) => {
    if (!window.confirm('Tem certeza que deseja remover este livro?')) return;
    const filtered = books.filter(b => b.id !== id);
    setBooks(filtered);
    localStorage.setItem('library_books', JSON.stringify(filtered));
  };

  const handleEditBook = (book) => {
    setEditingBook(book);
    setShowModal(true);
  };

  const filteredBooks = books.filter(b =>
    b.title?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    b.author?.toLowerCase().includes(searchTerm.toLowerCase())
  );

  if (loading) return <div className="loading">Carregando acervo...</div>;

  return (
    <div className="admin-section">
      <div className="admin-controls">
        <h2>📚 Gerenciar Acervo</h2>
        <div className="controls-right">
          <input
            type="search"
            placeholder="Buscar livros..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="search-input"
          />
          <button className="btn btn-primary" onClick={() => { setEditingBook(null); setShowModal(true); }}>
            + Adicionar Livro
          </button>
        </div>
      </div>

      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Título</th>
              <th>Autor</th>
              <th>Categoria</th>
              <th>Ano</th>
              <th>Disponíveis</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {filteredBooks.map(book => (
              <tr key={book.id}>
                <td><strong>{book.title}</strong></td>
                <td>{book.author}</td>
                <td><span className="category-tag">{book.category}</span></td>
                <td>{book.year}</td>
                <td>
                  <span className={book.available > 0 ? 'text-success' : 'text-danger'}>
                    {book.available}/{book.total}
                  </span>
                </td>
                <td className="actions-cell">
                  <button className="btn btn-sm btn-secondary" onClick={() => handleEditBook(book)}>
                    ✏️
                  </button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDeleteBook(book.id)}>
                    🗑️
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {filteredBooks.length === 0 && (
        <div className="no-data">Nenhum livro encontrado.</div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
            <h3>{editingBook ? 'Editar Livro' : 'Adicionar Livro'}</h3>
            <form onSubmit={handleSaveBook}>
              <div className="form-group">
                <label>Título *</label>
                <input name="title" required defaultValue={editingBook?.title || ''} />
              </div>
              <div className="form-group">
                <label>Autor *</label>
                <input name="author" required defaultValue={editingBook?.author || ''} />
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>Categoria</label>
                  <select name="category" defaultValue={editingBook?.category || 'Ficção'}>
                    <option>Ficção</option>
                    <option>Fantasia</option>
                    <option>Ciência</option>
                    <option>História</option>
                    <option>Tecnologia</option>
                    <option>Literatura Brasileira</option>
                    <option>Poesia</option>
                    <option>Biografia</option>
                  </select>
                </div>
                <div className="form-group">
                  <label>Cópias</label>
                  <input type="number" name="copies" defaultValue={editingBook?.total || 1} min="1" />
                </div>
              </div>
              <div className="form-row">
                <div className="form-group">
                  <label>ISBN</label>
                  <input name="isbn" defaultValue={editingBook?.isbn || ''} />
                </div>
                <div className="form-group">
                  <label>Ano</label>
                  <input type="number" name="year" defaultValue={editingBook?.year || new Date().getFullYear()} />
                </div>
              </div>
              <div className="form-group">
                <label>Páginas</label>
                <input type="number" name="pages" defaultValue={editingBook?.pages || ''} />
              </div>
              <div className="form-group">
                <label>Descrição</label>
                <textarea name="description" rows="2" defaultValue={editingBook?.description || ''}></textarea>
              </div>
              <div className="modal-actions">
                <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>
                  Cancelar
                </button>
                <button type="submit" className="btn btn-primary">
                  {editingBook ? 'Salvar' : 'Adicionar'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== ADMIN LOANS ====================
function AdminLoans() {
  const [loans, setLoans] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const storedLoans = JSON.parse(localStorage.getItem('library_loans') || '[]');
    const defaultLoans = [
      { id: 1, user: 'João Silva', book: '1984', borrowDate: '2024-12-01', dueDate: '2024-12-15', status: 'active' },
      { id: 2, user: 'Maria Santos', book: 'Dom Casmurro', borrowDate: '2024-12-05', dueDate: '2024-12-19', status: 'active' },
    ];
    setLoans(storedLoans.length > 0 ? storedLoans : defaultLoans);
    setLoading(false);
  }, []);

  const handleReturn = (id) => {
    const updated = loans.map(l => l.id === id ? { ...l, status: 'returned', returnDate: new Date().toISOString().split('T')[0] } : l);
    setLoans(updated);
    localStorage.setItem('library_loans', JSON.stringify(updated));
  };

  if (loading) return <div className="loading">Carregando empréstimos...</div>;

  return (
    <div className="admin-section">
      <h2>📖 Gerenciar Empréstimos</h2>
      <div className="table-container">
        <table>
          <thead>
            <tr>
              <th>Usuário</th>
              <th>Livro</th>
              <th>Data Empréstimo</th>
              <th>Devolução</th>
              <th>Status</th>
              <th>Ações</th>
            </tr>
          </thead>
          <tbody>
            {loans.map(loan => (
              <tr key={loan.id} className={loan.status === 'active' && new Date(loan.dueDate) < new Date() ? 'overdue' : ''}>
                <td>{loan.user}</td>
                <td>{loan.book}</td>
                <td>{loan.borrowDate}</td>
                <td>{loan.dueDate}</td>
                <td>
                  <span className={`status-badge ${loan.status}`}>
                    {loan.status === 'active' ? '📖 Ativo' : '✓ Devolvido'}
                  </span>
                </td>
                <td>
                  {loan.status === 'active' && (
                    <button className="btn btn-sm btn-success" onClick={() => handleReturn(loan.id)}>
                      ✓ Devolver
                    </button>
                  )}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      {loans.length === 0 && <div className="no-data">Nenhum empréstimo registrado.</div>}
    </div>
  );
}

// ==================== ADMIN MUSEUM ====================
function AdminMuseum() {
  const [species, setSpecies] = useState([]);
  const [families, setFamilies] = useState([]);
  const [activeTab, setActiveTab] = useState('species');
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);

  const categories = ['medicinal', 'ornamental', 'edible', 'aromatic', 'succulent', 'aquatic', 'rare', 'native'];
  const regions = ['amazonia', 'atlantic', 'cerrado', 'caatinga', 'pantanal', 'pampa'];
  const conservationStatuses = ['extinct', 'critically_endangered', 'endangered', 'vulnerable', 'near_threatened', 'least_concern', 'not_evaluated'];

  useEffect(() => {
    const storedSpecies = JSON.parse(localStorage.getItem('museum_species') || '[]');
    const storedFamilies = JSON.parse(localStorage.getItem('museum_families') || '[]');
    setSpecies(storedSpecies);
    setFamilies(storedFamilies);
  }, []);

  const handleSaveSpecies = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const itemData = {
      id: editingItem?.id || 'sp-' + Date.now(),
      commonName: formData.get('commonName'),
      scientificName: formData.get('scientificName'),
      description: formData.get('description'),
      imageUrl: formData.get('imageUrl'),
      origin: formData.get('origin'),
      habitat: formData.get('habitat'),
      category: formData.get('category'),
      region: formData.get('region'),
      conservationStatus: formData.get('conservationStatus'),
      height: formData.get('height'),
      floweringSeason: formData.get('floweringSeason'),
      tags: formData.get('tags')?.split(',').map(t => t.trim()).filter(Boolean) || [],
      views: editingItem?.views || 0,
      likes: editingItem?.likes || 0,
      featured: formData.get('featured') === 'on',
    };

    let updated;
    if (editingItem) {
      updated = species.map(s => s.id === editingItem.id ? itemData : s);
    } else {
      updated = [...species, itemData];
    }

    setSpecies(updated);
    localStorage.setItem('museum_species', JSON.stringify(updated));
    setShowModal(false);
    setEditingItem(null);
  };

  const handleSaveFamily = (e) => {
    e.preventDefault();
    const formData = new FormData(e.target);
    const itemData = {
      id: editingItem?.id || 'fam-' + Date.now(),
      name: formData.get('name'),
      scientificName: formData.get('scientificName'),
      description: formData.get('description'),
      coverImage: formData.get('coverImage'),
      category: formData.get('category'),
      speciesCount: editingItem?.speciesCount || 0,
      featured: formData.get('featured') === 'on',
    };

    let updated;
    if (editingItem) {
      updated = families.map(f => f.id === editingItem.id ? itemData : f);
    } else {
      updated = [...families, itemData];
    }

    setFamilies(updated);
    localStorage.setItem('museum_families', JSON.stringify(updated));
    setShowModal(false);
    setEditingItem(null);
  };

  const handleDelete = (id, type) => {
    if (!window.confirm('Tem certeza que deseja remover este item?')) return;
    
    if (type === 'species') {
      const filtered = species.filter(s => s.id !== id);
      setSpecies(filtered);
      localStorage.setItem('museum_species', JSON.stringify(filtered));
    } else {
      const filtered = families.filter(f => f.id !== id);
      setFamilies(filtered);
      localStorage.setItem('museum_families', JSON.stringify(filtered));
    }
  };

  const handleEdit = (item, type) => {
    setEditingItem({ ...item, type });
    setActiveTab(type === 'species' ? 'species' : 'families');
    setShowModal(true);
  };

  return (
    <div className="admin-section">
      <h2>🌿 Gerenciar Almanaque Botânico</h2>
      
      <div className="admin-controls">
        <div className="tab-buttons">
          <button className={activeTab === 'species' ? 'active' : ''} onClick={() => setActiveTab('species')}>
            🌱 Espécies ({species.length})
          </button>
          <button className={activeTab === 'families' ? 'active' : ''} onClick={() => setActiveTab('families')}>
            📚 Famílias ({families.length})
          </button>
        </div>
        <button className="btn btn-primary" onClick={() => { setEditingItem(null); setShowModal(true); }}>
          + Adicionar {activeTab === 'species' ? 'Espécie' : 'Família'}
        </button>
      </div>

      {activeTab === 'species' ? (
        <div className="museum-grid">
          {species.map(s => (
            <div key={s.id} className="museum-card">
              <div className="museum-card-image">
                {s.imageUrl ? <img src={s.imageUrl} alt={s.commonName} /> : <span>🌿</span>}
              </div>
              <div className="museum-card-info">
                <h4>{s.commonName}</h4>
                <p className="scientific">{s.scientificName}</p>
                <span className="category-tag">{s.category}</span>
                <div className="card-actions">
                  <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(s, 'species')}>✏️</button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(s.id, 'species')}>🗑️</button>
                </div>
              </div>
            </div>
          ))}
          {species.length === 0 && (
            <div className="no-data">Nenhuma espécie cadastrada. Clique em "Adicionar Espécie" para começar.</div>
          )}
        </div>
      ) : (
        <div className="museum-grid">
          {families.map(f => (
            <div key={f.id} className="museum-card">
              <div className="museum-card-image">
                {f.coverImage ? <img src={f.coverImage} alt={f.name} /> : <span>📚</span>}
              </div>
              <div className="museum-card-info">
                <h4>{f.name}</h4>
                <p className="scientific">{f.scientificName}</p>
                <span className="category-tag">{f.category}</span>
                <div className="card-actions">
                  <button className="btn btn-sm btn-secondary" onClick={() => handleEdit(f, 'families')}>✏️</button>
                  <button className="btn btn-sm btn-danger" onClick={() => handleDelete(f.id, 'families')}>🗑️</button>
                </div>
              </div>
            </div>
          ))}
          {families.length === 0 && (
            <div className="no-data">Nenhuma família cadastrada. Clique em "Adicionar Família" para começar.</div>
          )}
        </div>
      )}

      {showModal && (
        <div className="modal-overlay" onClick={() => setShowModal(false)}>
          <div className="modal-content modal-large" onClick={e => e.stopPropagation()}>
            <h3>
              {editingItem ? 'Editar' : 'Adicionar'}{' '}
              {activeTab === 'species' ? 'Espécie' : 'Família'}
            </h3>
            
            {activeTab === 'species' ? (
              <form onSubmit={handleSaveSpecies}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Nome Comum *</label>
                    <input name="commonName" required defaultValue={editingItem?.commonName || ''} />
                  </div>
                  <div className="form-group">
                    <label>Nome Científico *</label>
                    <input name="scientificName" required defaultValue={editingItem?.scientificName || ''} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Descrição</label>
                  <textarea name="description" rows="2" defaultValue={editingItem?.description || ''}></textarea>
                </div>
                <div className="form-group">
                  <label>URL da Imagem</label>
                  <input name="imageUrl" placeholder="https://..." defaultValue={editingItem?.imageUrl || ''} />
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Categoria</label>
                    <select name="category" defaultValue={editingItem?.category || 'ornamental'}>
                      {categories.map(c => <option key={c} value={c}>{c}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Região</label>
                    <select name="region" defaultValue={editingItem?.region || 'atlantic'}>
                      {regions.map(r => <option key={r} value={r}>{r}</option>)}
                    </select>
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Origem</label>
                    <input name="origin" defaultValue={editingItem?.origin || ''} />
                  </div>
                  <div className="form-group">
                    <label>Habitat</label>
                    <input name="habitat" defaultValue={editingItem?.habitat || ''} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Altura</label>
                    <input name="height" placeholder="Ex: 30-60cm" defaultValue={editingItem?.height || ''} />
                  </div>
                  <div className="form-group">
                    <label>Floração</label>
                    <input name="floweringSeason" placeholder="Ex: Primavera" defaultValue={editingItem?.floweringSeason || ''} />
                  </div>
                </div>
                <div className="form-row">
                  <div className="form-group">
                    <label>Status Conservação</label>
                    <select name="conservationStatus" defaultValue={editingItem?.conservationStatus || 'least_concern'}>
                      {conservationStatuses.map(c => <option key={c} value={c}>{c.replace('_', ' ')}</option>)}
                    </select>
                  </div>
                  <div className="form-group">
                    <label>Tags (separadas por vírgula)</label>
                    <input name="tags" placeholder="Ex: orquídea, rara, nativa" defaultValue={editingItem?.tags?.join(', ') || ''} />
                  </div>
                </div>
                <div className="form-group">
                  <label>
                    <input type="checkbox" name="featured" defaultChecked={editingItem?.featured} />
                    {' '}Destacar na página inicial
                  </label>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary">{editingItem ? 'Salvar' : 'Adicionar'}</button>
                </div>
              </form>
            ) : (
              <form onSubmit={handleSaveFamily}>
                <div className="form-row">
                  <div className="form-group">
                    <label>Nome *</label>
                    <input name="name" required defaultValue={editingItem?.name || ''} />
                  </div>
                  <div className="form-group">
                    <label>Nome Científico *</label>
                    <input name="scientificName" required defaultValue={editingItem?.scientificName || ''} />
                  </div>
                </div>
                <div className="form-group">
                  <label>Descrição</label>
                  <textarea name="description" rows="2" defaultValue={editingItem?.description || ''}></textarea>
                </div>
                <div className="form-group">
                  <label>URL da Imagem</label>
                  <input name="coverImage" placeholder="https://..." defaultValue={editingItem?.coverImage || ''} />
                </div>
                <div className="form-group">
                  <label>Categoria</label>
                  <select name="category" defaultValue={editingItem?.category || 'ornamental'}>
                    {categories.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <div className="form-group">
                  <label>
                    <input type="checkbox" name="featured" defaultChecked={editingItem?.featured} />
                    {' '}Destacar na página inicial
                  </label>
                </div>
                <div className="modal-actions">
                  <button type="button" className="btn btn-secondary" onClick={() => setShowModal(false)}>Cancelar</button>
                  <button type="submit" className="btn btn-primary">{editingItem ? 'Salvar' : 'Adicionar'}</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// ==================== ADMIN SETTINGS ====================
function AdminSettings() {
  const [settings, setSettings] = useState({
    siteName: 'LabGrandisol',
    siteDescription: 'Biblioteca Virtual',
    primaryColor: '#722f37',
    secondaryColor: '#b8860b',
    loanDuration: 14,
    maxRenewals: 3,
    notificationsEnabled: true,
    allowRegistration: true,
    maintenanceMode: false,
  });
  const [message, setMessage] = useState('');

  useEffect(() => {
    const saved = localStorage.getItem('labgrandisol_settings');
    if (saved) setSettings(JSON.parse(saved));
  }, []);

  const handleSave = () => {
    localStorage.setItem('labgrandisol_settings', JSON.stringify(settings));
    setMessage('✅ Configurações salvas com sucesso!');
    setTimeout(() => setMessage(''), 3000);
  };

  const handleReset = () => {
    if (!window.confirm('Restaurar configurações padrão?')) return;
    const defaults = {
      siteName: 'LabGrandisol',
      siteDescription: 'Biblioteca Virtual',
      primaryColor: '#722f37',
      secondaryColor: '#b8860b',
      loanDuration: 14,
      maxRenewals: 3,
      notificationsEnabled: true,
      allowRegistration: true,
      maintenanceMode: false,
    };
    setSettings(defaults);
    localStorage.setItem('labgrandisol_settings', JSON.stringify(defaults));
    setMessage('✅ Configurações restauradas!');
  };

  return (
    <div className="admin-section">
      <h2>⚙️ Configurações do Sistema</h2>
      
      {message && <div className="alert alert-success">{message}</div>}

      <div className="settings-section">
        <h3>🌐 Configurações Gerais</h3>
        <div className="settings-grid">
          <div className="setting-item">
            <label>Nome do Site</label>
            <input value={settings.siteName} onChange={e => setSettings({...settings, siteName: e.target.value})} />
          </div>
          <div className="setting-item">
            <label>Descrição</label>
            <input value={settings.siteDescription} onChange={e => setSettings({...settings, siteDescription: e.target.value})} />
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3>🎨 Aparência</h3>
        <div className="settings-grid">
          <div className="setting-item">
            <label>Cor Primária</label>
            <input type="color" value={settings.primaryColor} onChange={e => setSettings({...settings, primaryColor: e.target.value})} />
          </div>
          <div className="setting-item">
            <label>Cor Secundária</label>
            <input type="color" value={settings.secondaryColor} onChange={e => setSettings({...settings, secondaryColor: e.target.value})} />
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3>📚 Biblioteca</h3>
        <div className="settings-grid">
          <div className="setting-item">
            <label>Prazo de Empréstimo (dias)</label>
            <input type="number" value={settings.loanDuration} onChange={e => setSettings({...settings, loanDuration: parseInt(e.target.value)})} min="1" max="60" />
          </div>
          <div className="setting-item">
            <label>Máximo de Renovações</label>
            <input type="number" value={settings.maxRenewals} onChange={e => setSettings({...settings, maxRenewals: parseInt(e.target.value)})} min="0" max="10" />
          </div>
        </div>
      </div>

      <div className="settings-section">
        <h3>🔧 Sistema</h3>
        <div className="settings-checkboxes">
          <label>
            <input type="checkbox" checked={settings.notificationsEnabled} onChange={e => setSettings({...settings, notificationsEnabled: e.target.checked})} />
            {' '}Notificações Ativas
          </label>
          <label>
            <input type="checkbox" checked={settings.allowRegistration} onChange={e => setSettings({...settings, allowRegistration: e.target.checked})} />
            {' '}Permitir Registro de Novos Usuários
          </label>
          <label>
            <input type="checkbox" checked={settings.maintenanceMode} onChange={e => setSettings({...settings, maintenanceMode: e.target.checked})} />
            {' '}Modo de Manutenção
          </label>
        </div>
      </div>

      <div className="settings-actions">
        <button className="btn btn-secondary" onClick={handleReset}>
          🔄 Restaurar Padrões
        </button>
        <button className="btn btn-primary" onClick={handleSave}>
          💾 Salvar Configurações
        </button>
      </div>
    </div>
  );
}

// ==================== MAIN COMPONENT ====================
export default function Admin() {
  return (
    <div className="admin-page">
      <div className="admin-header">
        <h1>❧ Administração</h1>
        <p>Painel de controle do sistema</p>
      </div>
      <div className="admin-content">
        <aside className="admin-sidebar">
          <nav className="admin-nav">
            <NavLink to="/admin" end className={({ isActive }) => isActive ? 'active' : ''}>📊 Painel</NavLink>
            <NavLink to="/admin/users" className={({ isActive }) => isActive ? 'active' : ''}>👥 Usuários</NavLink>
            <NavLink to="/admin/books" className={({ isActive }) => isActive ? 'active' : ''}>📚 Acervo</NavLink>
            <NavLink to="/admin/loans" className={({ isActive }) => isActive ? 'active' : ''}>📖 Empréstimos</NavLink>
            <NavLink to="/admin/museum" className={({ isActive }) => isActive ? 'active' : ''}>🌿 Almanaque</NavLink>
            <NavLink to="/admin/settings" className={({ isActive }) => isActive ? 'active' : ''}>⚙️ Configurações</NavLink>
            <NavLink to="/alerts" className={({ isActive }) => isActive ? 'active' : ''}>🚨 Alertas</NavLink>
          </nav>
        </aside>
        <main className="admin-main">
          <Routes>
            <Route index element={<AdminDashboard />} />
            <Route path="users" element={<AdminUsers />} />
            <Route path="books" element={<AdminBooks />} />
            <Route path="loans" element={<AdminLoans />} />
            <Route path="museum" element={<AdminMuseum />} />
            <Route path="settings" element={<AdminSettings />} />
          </Routes>
        </main>
      </div>
    </div>
  );
}