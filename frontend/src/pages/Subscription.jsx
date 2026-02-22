import { useEffect } from 'react';
import { useSaasStore } from '../store/data';
import '../styles/subscription.css';

export default function Subscription() {
  const { subscription, loading, fetchAllData, upgradeSubscription } = useSaasStore();

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  const plans = [
    {
      id: 'free',
      name: 'Gratuito',
      price: 'R$ 0',
      period: '/mês',
      description: 'Perfeito para começar',
      features: [
        '📚 Até 100 livros',
        '📦 1 coleção',
        '🏷️ Tags ilimitadas',
        '⭐ Avaliações básicas',
        '👥 Sem recursos sociais',
      ],
    },
    {
      id: 'premium',
      name: 'Premium',
      price: 'R$ 29',
      period: '/mês',
      description: 'Mais recursos e poder',
      features: [
        '📚 Livros ilimitados',
        '📦 Coleções ilimitadas',
        '🏷️ Tags e organizações avançadas',
        '⭐ Avaliações detalhadas com resenhas',
        '👥 Acesso social básico',
        '📊 Análises avançadas',
        '🏆 Sistema de conquistas',
      ],
      popular: true,
    },
    {
      id: 'enterprise',
      name: 'Enterprise',
      price: 'Contato',
      period: '',
      description: 'Solução completa',
      features: [
        '📚 Recursos ilimitados',
        '📦 Espaços de trabalho múltiplos',
        '👥 Colaboração em equipe',
        '📊 Dashboard analítico completo',
        '🔐 Segurança e backup premium',
        '⚡ Suporte prioritário 24/7',
        '🎯 Customizações personalizadas',
      ],
    },
  ];

  const handleUpgrade = (planId) => {
    if (planId === 'enterprise') {
      alert('Entre em contato conosco para planos Enterprise!');
      return;
    }
    upgradeSubscription(planId).then(() => {
      alert('✓ Plano atualizado com sucesso!');
    });
  };

  if (loading) {
    return <div className="page-loading">💳 Carregando planos...</div>;
  }

  return (
    <div className="subscription-page">
      <div className="page-header">
        <h1>💎 Planos de Subscription</h1>
        <p>Escolha o plano perfeito para suas necessidades</p>
      </div>

      {/* Current Subscription Info */}
      {subscription && (
        <div className="current-subscription">
          <div className="subscription-info">
            <h3>Plano Atual: <span className="plan-name">{subscription.plan_name}</span></h3>
            <p>Renovação em: {new Date(subscription.renews_at).toLocaleDateString('pt-BR')}</p>
            {subscription.trial_remaining > 0 && (
              <p className="trial-info">🎁 {subscription.trial_remaining} dias de teste restantes</p>
            )}
          </div>
          <div className="subscription-billing">
            <h4>Faturamento</h4>
            <p>Próxima cobrança: <strong>{new Date(subscription.next_billing_date).toLocaleDateString('pt-BR')}</strong></p>
            <p>Valor: <strong>{subscription.amount_paid || 'R$ 0'}</strong></p>
          </div>
        </div>
      )}

      {/* Plans Grid */}
      <div className="plans-grid">
        {plans.map(plan => (
          <div 
            key={plan.id} 
            className={`plan-card ${plan.popular ? 'popular' : ''} ${subscription?.plan_id === plan.id ? 'current' : ''}`}
          >
            {plan.popular && <span className="popular-badge">⭐ Mais Popular</span>}
            {subscription?.plan_id === plan.id && <span className="current-badge">✓ Plano Atual</span>}
            
            <h3>{plan.name}</h3>
            <div className="price">
              <span className="amount">{plan.price}</span>
              {plan.period && <span className="period">{plan.period}</span>}
            </div>
            <p className="description">{plan.description}</p>

            <ul className="features-list">
              {plan.features.map((feature, idx) => (
                <li key={idx}>
                  <span className="feature-check">✓</span>
                  {feature}
                </li>
              ))}
            </ul>

            <button 
              className={`btn ${
                subscription?.plan_id === plan.id 
                  ? 'btn-disabled' 
                  : plan.popular 
                  ? 'btn-primary' 
                  : 'btn-secondary'
              }`}
              onClick={() => handleUpgrade(plan.id)}
              disabled={subscription?.plan_id === plan.id}
            >
              {subscription?.plan_id === plan.id ? '✓ Seu Plano Atual' : 'Escolher Plano'}
            </button>
          </div>
        ))}
      </div>

      {/* FAQ Section */}
      <section className="faq-section">
        <h2>❓ Perguntas Frequentes</h2>
        <div className="faq-list">
          <div className="faq-item">
            <h4>Posso cancelar meu plano a qualquer momento?</h4>
            <p>Sim! Você pode cancelar sua assinatura a qualquer momento e seu acesso continuará até o final do período de faturamento.</p>
          </div>
          <div className="faq-item">
            <h4>Qual é a diferença entre Premium e Enterprise?</h4>
            <p>Premium é para usuários individuais com muitos livros e análises avançadas. Enterprise é para organizações que precisam de múltiplos espaços de trabalho e suporte dedicado.</p>
          </div>
          <div className="faq-item">
            <h4>Vocês oferecem período de teste gratuito?</h4>
            <p>Sim! O plano Gratuito oferece acesso completo a funcionalidades básicas. Para Premium e Enterprise, entre em contato conosco.</p>
          </div>
          <div className="faq-item">
            <h4>Como funciona o faturamento?</h4>
            <p>O faturamento é feito mensalmente no dia inicial de sua assinatura. Você receberá uma confirmação por email antes de cada cobrança.</p>
          </div>
        </div>
      </section>

      {/* Contact Section */}
      <div className="contact-section">
        <h2>💬 Precisa de Ajuda?</h2>
        <p>Tem dúvidas sobre nossos planos? Entre em contato conosco!</p>
        <button className="btn btn-primary">📧 Contate-nos</button>
      </div>
    </div>
  );
}
