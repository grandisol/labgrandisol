import { useState, useEffect } from 'react';
import { useNotificationsStore } from '../store/notifications';
import '../styles/designTokens.css';
import '../styles/global.css';
import '../styles/notifications.css';

export default function Notifications() {
  const { notifications, fetchNotifications, markAsRead, markAllAsRead } = useNotificationsStore();
  const [filter, setFilter] = useState('all');

  useEffect(() => {
    fetchNotifications();
  }, [fetchNotifications]);

  const filteredNotifications = notifications.filter(n => {
    if (filter === 'all') return true;
    if (filter === 'unread') return !n.read;
    return n.type === filter;
  });

  return (
    <div className="notifications-page">
      <div className="notifications-header">
        <div className="header-content">
          <div className="header-ornament">❧</div>
          <h1>Notificações</h1>
          <p>Fique por dentro de todas as novidades</p>
        </div>
      </div>

      <div className="notifications-content">
        <div className="notifications-controls">
          <div className="filter-tabs">
            <button 
              className={`filter-tab ${filter === 'all' ? 'active' : ''}`}
              onClick={() => setFilter('all')}
            >
              Todas
            </button>
            <button 
              className={`filter-tab ${filter === 'unread' ? 'active' : ''}`}
              onClick={() => setFilter('unread')}
            >
              Não Lidas
            </button>
            <button 
              className={`filter-tab ${filter === 'achievement' ? 'active' : ''}`}
              onClick={() => setFilter('achievement')}
            >
              Conquistas
            </button>
          </div>
          <button className="btn btn-secondary btn-sm" onClick={markAllAsRead}>
            Marcar Todas como Lidas
          </button>
        </div>

        <div className="notifications-list">
          {filteredNotifications.length > 0 ? (
            filteredNotifications.map(notification => (
              <div 
                key={notification.id} 
                className={`notification-card ${notification.read ? 'read' : 'unread'}`}
                onClick={() => markAsRead(notification.id)}
              >
                <div className="notification-icon">
                  {notification.type === 'achievement' ? '🏆' : 
                   notification.type === 'warning' ? '⚠️' : 
                   notification.type === 'info' ? 'ℹ️' : '📢'}
                </div>
                <div className="notification-body">
                  <h3>{notification.title}</h3>
                  <p>{notification.message}</p>
                  <span className="notification-time">{notification.createdAt || 'Agora'}</span>
                </div>
                {!notification.read && <span className="unread-dot"></span>}
              </div>
            ))
          ) : (
            <div className="empty-notifications">
              <span className="empty-icon">📭</span>
              <h3>Nenhuma notificação</h3>
              <p>Você está em dia com todas as novidades!</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}