/**
 * My Loans Page
 * Gerenciar empréstimos do usuário
 */

import React, { useState, useEffect } from 'react';
import '../styles/myLoans.css';

/**
 * @typedef {Object} Loan
 * @property {number} id
 * @property {string} title
 * @property {string} cover_url
 * @property {string} loan_date
 * @property {string} due_date
 * @property {string|null} return_date
 * @property {'active'|'returned'} status
 * @property {number} renewal_count
 * @property {boolean} is_overdue
 */

const MyLoans = () => {
  const [activeLoans, setActiveLoans] = useState([]);
  const [returnedLoans, setReturnedLoans] = useState([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('active');
  const [renewing, setRenewing] = useState(null);

  useEffect(() => {
    const loadLoans = async () => {
      try {
        // Carrega empréstimos ativos
        const activeResponse = await fetch('/api/library/loans?status=active');
        const activeData = await activeResponse.json();
        setActiveLoans(activeData.loans);

        // Carrega empréstimos devolvidos
        const returnedResponse = await fetch('/api/library/loans?status=returned');
        const returnedData = await returnedResponse.json();
        setReturnedLoans(returnedData.loans);
      } catch (error) {
        console.error('Erro carregando empréstimos:', error);
      } finally {
        setLoading(false);
      }
    };

    loadLoans();
  }, []);

  const handleRenew = async (loanId) => {
    setRenewing(loanId);
    try {
      const response = await fetch(`/api/library/loans/${loanId}/renew`, {
        method: 'POST'
      });

      if (response.ok) {
        const updatedLoan = await response.json();
        setActiveLoans(activeLoans.map(l => l.id === loanId ? updatedLoan : l));
        alert('Empréstimo renovado com sucesso!');
      } else {
        alert('Não foi possível renovar este empréstimo');
      }
    } catch (error) {
      console.error('Erro renovando empréstimo:', error);
    } finally {
      setRenewing(null);
    }
  };

  const daysUntilDue = (dueDate) => {
    const due = new Date(dueDate);
    const today = new Date();
    return Math.ceil((due.getTime() - today.getTime()) / (1000 * 60 * 60 * 24));
  };

  const getStatusColor = (loan) => {
    if (loan.is_overdue) return 'overdue';
    const daysLeft = daysUntilDue(loan.due_date);
    if (daysLeft <= 3) return 'warning';
    return 'ok';
  };

  if (loading) return <div className="loading">Carregando empréstimos...</div>;

  return (
    <div className="my-loans-page">
      <div className="loans-header">
        <h1>📚 Meus Empréstimos</h1>
        <p>Acompanhe seus empréstimos e prazos</p>
      </div>

      {/* Tabs */}
      <div className="loans-tabs">
        <button
          className={`tab ${activeTab === 'active' ? 'active' : ''}`}
          onClick={() => setActiveTab('active')}
        >
          Empréstimos Ativos ({activeLoans.length})
        </button>
        <button
          className={`tab ${activeTab === 'history' ? 'active' : ''}`}
          onClick={() => setActiveTab('history')}
        >
          Histórico ({returnedLoans.length})
        </button>
      </div>

      {/* Empréstimos Ativos */}
      {activeTab === 'active' && (
        <div className="loans-container">
          {activeLoans.length > 0 ? (
            <div className="loans-list">
              {activeLoans.map(loan => {
                const daysLeft = daysUntilDue(loan.due_date);
                const statusColor = getStatusColor(loan);

                return (
                  <div key={loan.id} className={`loan-card ${statusColor}`}>
                    <div className="loan-card-cover">
                      <img src={loan.cover_url || '/default-book.png'} alt={loan.title} />
                    </div>

                    <div className="loan-card-content">
                      <h3>{loan.title}</h3>

                      <div className="loan-dates">
                        <div className="date-item">
                          <label>Emprestado em:</label>
                          <span>{new Date(loan.loan_date).toLocaleDateString('pt-BR')}</span>
                        </div>
                        <div className="date-item">
                          <label>Devolução até:</label>
                          <span className={`due-date ${loan.is_overdue ? 'overdue' : ''}`}>
                            {new Date(loan.due_date).toLocaleDateString('pt-BR')}
                          </span>
                        </div>
                      </div>

                      {/* Status */}
                      <div className="loan-status">
                        {loan.is_overdue ? (
                          <span className="status-badge overdue">⚠️ Atrasado</span>
                        ) : daysLeft <= 3 ? (
                          <span className="status-badge warning">⏰ Vence em {daysLeft} dias</span>
                        ) : (
                          <span className="status-badge ok">✓ {daysLeft} dias para devolver</span>
                        )}

                        {loan.renewal_count > 0 && (
                          <span className="renewal-badge">Renovado {loan.renewal_count}x</span>
                        )}
                      </div>

                      <div className="loan-actions">
                        <button
                          className="btn-renew"
                          onClick={() => handleRenew(loan.id)}
                          disabled={renewing === loan.id}
                        >
                          {renewing === loan.id ? 'Renovando...' : '🔄 Renovar'}
                        </button>
                        <button className="btn-return">📤 Devolver</button>
                      </div>
                    </div>

                    {/* Progress Bar */}
                    <div className="progress-bar">
                      <div
                        className="progress-fill"
                        style={{
                          width: `${Math.max(0, Math.min(100, ((14 - Math.max(0, daysLeft)) / 14) * 100))}%`
                        }}
                      ></div>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="empty-state">
              <p>Você não tem empréstimos ativos</p>
              <a href="/library" className="btn-primary">Explorar Biblioteca</a>
            </div>
          )}
        </div>
      )}

      {/* Histórico */}
      {activeTab === 'history' && (
        <div className="loans-container">
          {returnedLoans.length > 0 ? (
            <div className="loans-list history">
              {returnedLoans.map(loan => (
                <div key={loan.id} className="loan-card history">
                  <div className="loan-card-cover">
                    <img src={loan.cover_url || '/default-book.png'} alt={loan.title} />
                  </div>

                  <div className="loan-card-content">
                    <h3>{loan.title}</h3>

                    <div className="loan-dates">
                      <div className="date-item">
                        <label>Emprestado:</label>
                        <span>{new Date(loan.loan_date).toLocaleDateString('pt-BR')}</span>
                      </div>
                      <div className="date-item">
                        <label>Devolvido:</label>
                        <span>{new Date(loan.return_date).toLocaleDateString('pt-BR')}</span>
                      </div>
                    </div>

                    <div className="loan-status">
                      <span className="status-badge returned">✓ Devolvido</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="empty-state">
              <p>Você ainda não devolveu nenhum livro</p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

export default MyLoans;
