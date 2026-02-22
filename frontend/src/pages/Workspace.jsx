import { useEffect } from 'react';
import { useSaasStore } from '../store/data';
import '../styles/workspace.css';

export default function Workspace() {
  const { workspace, members, usage, loading, fetchAllData } = useSaasStore();

  useEffect(() => {
    fetchAllData();
  }, [fetchAllData]);

  if (loading) {
    return <div className="page-loading">⚙️ Carregando workspace...</div>;
  }

  return (
    <div className="workspace-page">
      <div className="page-header">
        <h1>⚙️ Configurações do Workspace</h1>
        <p>Gerencie seu espaço de trabalho e equipe</p>
      </div>

      <div className="workspace-grid">
        {/* Workspace Info */}
        <section className="workspace-section">
          <h2>📋 Informações do Workspace</h2>
          {workspace ? (
            <div className="workspace-info">
              <div className="info-field">
                <label>Nome:</label>
                <p>{workspace.name || 'Minha Biblioteca'}</p>
              </div>
              <div className="info-field">
                <label>Email:</label>
                <p>{workspace.email || 'N/A'}</p>
              </div>
              <div className="info-field">
                <label>Plano Atual:</label>
                <p className="plan-badge">{workspace.plan || 'Free'}</p>
              </div>
              <div className="info-field">
                <label>Criado em:</label>
                <p>{workspace.created_at ? new Date(workspace.created_at).toLocaleDateString('pt-BR') : 'N/A'}</p>
              </div>
              <button className="btn btn-primary">✏️ Editar Workspace</button>
            </div>
          ) : (
            <p className="empty-state">Nenhum workspace configurado</p>
          )}
        </section>

        {/* Members */}
        <section className="workspace-section">
          <h2>👥 Membros da Equipe</h2>
          {members && members.length > 0 ? (
            <div className="members-list">
              {members.map(member => (
                <div key={member.id} className="member-card">
                  <div className="member-avatar">
                    {member.name?.charAt(0).toUpperCase() || 'M'}
                  </div>
                  <div className="member-info">
                    <h4>{member.name}</h4>
                    <p className="member-email">{member.email}</p>
                    <span className="member-role">{member.role}</span>
                  </div>
                  <div className="member-actions">
                    <button className="btn-icon">⋮</button>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <p className="empty-state">Nenhum membro ainda</p>
          )}
          <button className="btn btn-secondary">+ Convidar Membro</button>
        </section>

        {/* Usage Statistics */}
        <section className="workspace-section usage-section">
          <h2>📊 Uso e Limites</h2>
          {usage ? (
            <div className="usage-stats">
              <div className="usage-item">
                <label>Livros Armazenados:</label>
                <div className="usage-bar">
                  <div className="usage-fill" style={{ width: `${(usage.books_count / usage.books_limit) * 100}%` }}></div>
                </div>
                <p className="usage-text">{usage.books_count} / {usage.books_limit} livros</p>
              </div>
              <div className="usage-item">
                <label>Coleções:</label>
                <div className="usage-bar">
                  <div className="usage-fill" style={{ width: `${(usage.collections_count / usage.collections_limit) * 100}%` }}></div>
                </div>
                <p className="usage-text">{usage.collections_count} / {usage.collections_limit} coleções</p>
              </div>
              <div className="usage-item">
                <label>Armazenamento:</label>
                <div className="usage-bar">
                  <div className="usage-fill" style={{ width: `${(usage.storage_used / usage.storage_limit) * 100}%` }}></div>
                </div>
                <p className="usage-text">{usage.storage_used}MB / {usage.storage_limit}MB</p>
              </div>
            </div>
          ) : (
            <p className="empty-state">Dados de uso não disponíveis</p>
          )}
        </section>

        {/* Settings */}
        <section className="workspace-section settings-section">
          <h2>⚙️ Configurações Gerais</h2>
          <div className="settings-list">
            <div className="setting-item">
              <label>Notificações por Email:</label>
              <input type="checkbox" defaultChecked className="checkbox" />
            </div>
            <div className="setting-item">
              <label>Perfil Público:</label>
              <input type="checkbox" defaultChecked className="checkbox" />
            </div>
            <div className="setting-item">
              <label>Permissões de Coleções:</label>
              <select className="select-field">
                <option>Privado (apenas você)</option>
                <option>Amigos podem ver</option>
                <option>Público</option>
              </select>
            </div>
            <button className="btn btn-primary">💾 Salvar Configurações</button>
          </div>
        </section>
      </div>

      {/* Danger Zone */}
      <div className="danger-zone">
        <h3>⚠️ Zona de Perigo</h3>
        <button className="btn btn-danger">🚪 Sair do Workspace</button>
        <button className="btn btn-danger">🗑️ Deletar Workspace</button>
      </div>
    </div>
  );
}
