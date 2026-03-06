import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import '../styles/designTokens.css';
import '../styles/global.css';
import '../styles/myLoans.css';

export default function MyLoans() {
  const navigate = useNavigate();
  const [activeLoans, setActiveLoans] = useState([]);
  const [returnedLoans, setReturnedLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');
  const [renewing, setRenewing] = useState(null);

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
    loadLoans();
  }, []);

  const loadLoans = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/library/loans', {
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        const allLoans = data.loans || [];
        
        // Separate active and returned loans
        const active = allLoans.filter(loan => loan.status === 'active');
        const returned = allLoans.filter(loan => loan.status === 'returned');
        
        setActiveLoans(active);
        setReturnedLoans(returned);
      }
    } catch (error) {
      console.error('Erro carregando empréstimos:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRenew = async (loanId) => {
    setRenewing(loanId);
    try {
      const response = await fetch(`/api/library/loans/${loanId}/renew`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        const data = await response.json();
        alert('Empréstimo renovado com sucesso!');
        loadLoans(); // Reload all loans
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Não foi possível renovar este empréstimo');
      }
    } catch (error) {
      console.error('Erro renovando empréstimo:', error);
      alert('Erro ao renovar empréstimo');
    } finally {
      setRenewing(null);
    }
  };

  const handleReturn = async (loanId) => {
    if (!window.confirm('Confirmar devolução do livro?')) return;
    
    try {
      const response = await fetch(`/api/library/loans/${loanId}/return`, {
        method: 'POST',
        headers: getAuthHeaders()
      });
      
      if (response.ok) {
        alert('Livro devolvido com sucesso!');
        loadLoans(); // Reload all loans
      } else {
        const errorData = await response.json();
        alert(errorData.error || 'Erro ao devolver livro');
      }
    } catch (error) {
      console.error('Erro devolvendo livro:', error);
      alert('Erro ao devolver livro');
    }
  };

  const daysUntilDue = (dueDate) => {
    if (!dueDate) return 0;
    const due = new Date(dueDate);
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    due.setHours(0, 0, 0, 0);
    return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getStatusInfo = (loan) => {
    const daysLeft = daysUntilDue(loan.due_date);
    
    if (loan.status === 'returned') {
      return { class: 'returned', icon: '✓', text: 'Devolvido' };
    }
    
    if (daysLeft < 0) {
      return { class: 'overdue', icon: '⚠️', text: `${Math.abs(daysLeft)} dias atrasado` };
    }
    
    if (daysLeft === 0) {
      return { class: 'warning', icon: '⏰', text: 'Vence hoje!' };
    }
    
    if (daysLeft <= 3) {
      return { class: 'warning', icon: '⏰', text: `Vence em ${daysLeft} dias` };
    }
    
    return { class: 'ok', icon: '✓', text: `${daysLeft} dias restantes` };
  };

  const getBookInfo = (loan) => {
    // Handle both nested book object and flat properties
    return {
      title: loan.book?.title || loan.title || 'Livro',
      author: loan.book?.author || loan.author || 'Autor desconhecido',
      cover_url: loan.book?.cover_url || loan.cover_url || null
    };
  };

  if (loading) return <div className="loading">Carregando empréstimos...</div>;

  return (
    <div className="my-loans-page">
      <div className="loans-header">
        <div className="header-content">
          <div className="header-ornament">❧</div>
          <h1>Meus Empréstimos</h1>
          <p>Gerencie seus livros emprestados</p>
        </div>
      </div>

      <div className="loans-content">
        <div className="loans-tabs">
          <button 
            className={`tab-btn ${activeTab === 'active' ? 'active' : ''}`}
            onClick={() => setActiveTab('active')}
          >
            📖 Ativos ({activeLoans.length})
          </button>
          <button 
            className={`tab-btn ${activeTab === 'history' ? 'active' : ''}`}
            onClick={() => setActiveTab('history')}
          >
            📚 Histórico ({returnedLoans.length})
          </button>
        </div>

        {activeTab === 'active' && (
          <div className="loans-list">
            {activeLoans.length > 0 ? (
              activeLoans.map(loan => {
                const status = getStatusInfo(loan);
                const bookInfo = getBookInfo(loan);
                const daysLeft = daysUntilDue(loan.due_date);
                
                return (
                  <div key={loan.id} className={`loan-card ${status.class}`}>
                    <div className="loan-cover">
                      {bookInfo.cover_url ? (
                        <img src={bookInfo.cover_url} alt={bookInfo.title} />
                      ) : (
                        <div className="cover-placeholder">📖</div>
                      )}
                    </div>
                    
                    <div className="loan-info">
                      <h3>{bookInfo.title}</h3>
                      <p className="loan-author">{bookInfo.author}</p>
                      
                      <div className="loan-dates">
                        <div className="date-block">
                          <span className="date-label">Empréstimo</span>
                          <span className="date-value">
                            {loan.borrow_date ? new Date(loan.borrow_date).toLocaleDateString('pt-BR') : 'N/A'}
                          </span>
                        </div>
                        <div className="date-block">
                          <span className="date-label">Devolução</span>
                          <span className={`date-value ${daysLeft < 0 ? 'overdue' : ''}`}>
                            {loan.due_date ? new Date(loan.due_date).toLocaleDateString('pt-BR') : 'N/A'}
                          </span>
                        </div>
                      </div>

                      <div className="loan-status">
                        <span className={`status-badge ${status.class}`}>
                          {status.icon} {status.text}
                        </span>
                        {loan.renewal_count > 0 && (
                          <span className="renewal-count">Renovado {loan.renewal_count}x</span>
                        )}
                      </div>

                      <div className="progress-bar">
                        <div 
                          className="progress-fill"
                          style={{ 
                            width: `${Math.min(100, Math.max(0, ((14 - daysLeft) / 14) * 100))}%`,
                            backgroundColor: daysLeft < 0 ? 'var(--accent-burgundy)' : 
                                           daysLeft <= 3 ? 'var(--accent-gold)' : 'var(--accent-forest)'
                          }}
                        ></div>
                      </div>

                      <div className="loan-actions">
                        <button 
                          className="btn btn-secondary btn-sm"
                          onClick={() => handleRenew(loan.id)}
                          disabled={renewing === loan.id}
                        >
                          {renewing === loan.id ? 'Renovando...' : '🔄 Renovar'}
                        </button>
                        <button 
                          className="btn btn-primary btn-sm"
                          onClick={() => handleReturn(loan.id)}
                        >
                          📤 Devolver
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-state">
                <span className="empty-icon">📭</span>
                <h3>Nenhum empréstimo ativo</h3>
                <p>Você não tem livros emprestados no momento</p>
                <button className="btn btn-primary" onClick={() => navigate('/library')}>
                  Explorar Biblioteca
                </button>
              </div>
            )}
          </div>
        )}

        {activeTab === 'history' && (
          <div className="loans-list">
            {returnedLoans.length > 0 ? (
              returnedLoans.map(loan => {
                const bookInfo = getBookInfo(loan);
                
                return (
                  <div key={loan.id} className="loan-card returned">
                    <div className="loan-cover">
                      {bookInfo.cover_url ? (
                        <img src={bookInfo.cover_url} alt={bookInfo.title} />
                      ) : (
                        <div className="cover-placeholder">📖</div>
                      )}
                    </div>
                    
                    <div className="loan-info">
                      <h3>{bookInfo.title}</h3>
                      <p className="loan-author">{bookInfo.author}</p>
                      
                      <div className="loan-dates">
                        <div className="date-block">
                          <span className="date-label">Empréstimo</span>
                          <span className="date-value">
                            {loan.borrow_date ? new Date(loan.borrow_date).toLocaleDateString('pt-BR') : 'N/A'}
                          </span>
                        </div>
                        <div className="date-block">
                          <span className="date-label">Devolvido</span>
                          <span className="date-value">
                            {loan.return_date ? new Date(loan.return_date).toLocaleDateString('pt-BR') : 'N/A'}
                          </span>
                        </div>
                      </div>

                      <div className="loan-status">
                        <span className="status-badge returned">✓ Devolvido</span>
                      </div>
                    </div>
                  </div>
                );
              })
            ) : (
              <div className="empty-state">
                <span className="empty-icon">📚</span>
                <h3>Nenhum histórico</h3>
                <p>Você ainda não devolveu nenhum livro</p>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}