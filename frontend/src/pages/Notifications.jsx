import { useEffect } from 'react';
import { useNotificationsStore } from '../store/notifications';
import '../styles/notifications.css';

export default function Notifications() {
  const { notifications, unreadCount, loading, fetchNotifications, markAsRead, deleteNotification } = useNotificationsStore();

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  if (loading) {
    return <div className="page-loading">📥 Carregando notificações...</div>;
  }

  return (
    <div className="notifications-page">
      <div className="page-header">
        <h1>🔔 Notificações</h1>
        <p>Você tem {unreadCount} notificações não lidas</p>
      </div>

      <div className="notifications-container">
        {notifications.length === 0 ? (
          <div className="empty-state">
            <p>📭 Nenhuma notificação no momento</p>
          </div>
        ) : (
          <div className="notifications-list">
            {notifications.map(notification => (
              <div 
                key={notification.id} 
                className={`notification-card ${notification.read ? 'read' : 'unread'}`}
              >
                <div className="notification-icon">
                  {notification.type === 'achievement' && '🏆'}
                  {notification.type === 'recommendation' && '💡'}
                  {notification.type === 'social' && '👥'}
                  {notification.type === 'update' && '📢'}
                </div>
                <div className="notification-content">
                  <h3>{notification.title}</h3>
                  <p>{notification.message}</p>
                  {notification.metadata && (
                    <small className="notification-meta">
                      {new Date(notification.created_at).toLocaleDateString('pt-BR')}
                    </small>
                  )}
                </div>
                <div className="notification-actions">
                  {!notification.read && (
                    <button 
                      className="btn-icon"
                      onClick={() => markAsRead(notification.id)}
                      title="Marcar como lido"
                    >
                      ✓
                    </button>
                  )}
                  <button 
                    className="btn-icon danger"
                    onClick={() => deleteNotification(notification.id)}
                    title="Deletar"
                  >
                    ✕
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
