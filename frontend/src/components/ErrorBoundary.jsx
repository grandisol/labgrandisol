import { Component } from 'react';

/**
 * Error Boundary - Captura erros de renderização React
 * Evita que a aplicação inteira quebre por um erro isolado
 */
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { 
      hasError: false, 
      error: null, 
      errorInfo: null 
    };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    this.setState({ errorInfo });
    
    // Log do erro (em produção, enviar para serviço de monitoramento)
    console.error('ErrorBoundary caught:', error, errorInfo);
    
    // Salvar no localStorage para debug
    try {
      const errorLog = JSON.parse(localStorage.getItem('error_log') || '[]');
      errorLog.push({
        timestamp: new Date().toISOString(),
        message: error.message,
        stack: error.stack,
        componentStack: errorInfo?.componentStack,
        url: window.location.href,
      });
      // Manter apenas os últimos 10 erros
      if (errorLog.length > 10) errorLog.shift();
      localStorage.setItem('error_log', JSON.stringify(errorLog));
    } catch (e) {
      // Ignorar erros de localStorage
    }
  }

  handleReset = () => {
    this.setState({ hasError: false, error: null, errorInfo: null });
    // Limpar cache da API
    if (window.apiUtils?.clearCache) {
      window.apiUtils.clearCache();
    }
  };

  handleReload = () => {
    window.location.reload();
  };

  handleGoHome = () => {
    window.location.href = '/';
  };

  render() {
    if (this.state.hasError) {
      // Fallback UI
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          background: 'linear-gradient(135deg, #f4f1eb 0%, #ebe6dc 100%)',
          padding: '24px',
        }}>
          <div style={{
            background: '#fdfbf7',
            border: '2px solid #722f37',
            borderRadius: '16px',
            padding: '48px',
            maxWidth: '600px',
            textAlign: 'center',
            boxShadow: '0 8px 24px rgba(44, 36, 22, 0.2)',
          }}>
            <div style={{ fontSize: '64px', marginBottom: '24px' }}>📚</div>
            
            <h1 style={{
              fontFamily: 'Playfair Display, serif',
              fontSize: '28px',
              color: '#722f37',
              marginBottom: '16px',
            }}>
              Oops! Algo deu errado
            </h1>
            
            <p style={{
              fontSize: '16px',
              color: '#5c4a32',
              marginBottom: '24px',
              lineHeight: 1.6,
            }}>
              Ocorreu um erro inesperado. Nossa equipe foi notificada e está trabalhando para resolver.
            </p>

            {process.env.NODE_ENV === 'development' && this.state.error && (
              <details style={{
                textAlign: 'left',
                background: '#f5f0e1',
                padding: '16px',
                borderRadius: '8px',
                marginBottom: '24px',
                fontSize: '12px',
                overflow: 'auto',
                maxHeight: '200px',
              }}>
                <summary style={{ cursor: 'pointer', fontWeight: 'bold', marginBottom: '8px' }}>
                  Detalhes técnicos
                </summary>
                <pre style={{ margin: 0, whiteSpace: 'pre-wrap', wordBreak: 'break-word' }}>
                  {this.state.error.toString()}
                  {this.state.errorInfo?.componentStack}
                </pre>
              </details>
            )}

            <div style={{ display: 'flex', gap: '12px', justifyContent: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={this.handleReset}
                style={{
                  padding: '12px 24px',
                  background: '#722f37',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Tentar Novamente
              </button>
              
              <button
                onClick={this.handleGoHome}
                style={{
                  padding: '12px 24px',
                  background: '#fdfbf7',
                  color: '#722f37',
                  border: '2px solid #722f37',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Ir para Início
              </button>
              
              <button
                onClick={this.handleReload}
                style={{
                  padding: '12px 24px',
                  background: '#b8860b',
                  color: 'white',
                  border: 'none',
                  borderRadius: '8px',
                  fontSize: '14px',
                  fontWeight: '600',
                  cursor: 'pointer',
                  transition: 'all 0.2s',
                }}
              >
                Recarregar Página
              </button>
            </div>
          </div>
        </div>
      );
    }

    return this.props.children;
  }
}

export default ErrorBoundary;