/**
 * WebSocket Hook - LabGrandisol
 * Hook para conexão em tempo real via WebSocket
 */

import { useState, useEffect, useCallback, useRef } from 'react';
import { useAuthStore } from '../store/auth';
import { useNotificationsStore } from '../store/notifications';

// Estados de conexão
export const ConnectionState = {
  CONNECTING: 'connecting',
  CONNECTED: 'connected',
  DISCONNECTED: 'disconnected',
  RECONNECTING: 'reconnecting',
  ERROR: 'error'
};

// Tipos de eventos WebSocket
const WS_EVENTS = {
  NOTIFICATION: 'notification',
  NOTIFICATION_READ: 'notification_read',
  ALL_NOTIFICATIONS_READ: 'all_notifications_read',
  BOOK_UPDATE: 'book_update',
  LOAN_UPDATE: 'loan_update',
  USER_TYPING: 'user_typing',
  CHAT_MESSAGE: 'chat_message',
  SYSTEM_ALERT: 'system_alert',
  PRESENCE_UPDATE: 'presence_update',
  AUTH_SUCCESS: 'auth_success',
  AUTH_FAILED: 'auth_failed',
  SUBSCRIBED: 'subscribed',
  UNSUBSCRIBED: 'unsubscribed',
  USER_JOINED: 'user_joined',
  USER_LEFT: 'user_left',
  DEVICE_CONNECTED: 'device_connected',
  ERROR: 'error'
};

/**
 * Hook para gerenciar conexão WebSocket
 */
export function useWebSocket() {
  const [connectionState, setConnectionState] = useState(ConnectionState.DISCONNECTED);
  const [lastMessage, setLastMessage] = useState(null);
  const [subscriptions, setSubscriptions] = useState([]);
  const [stats, setStats] = useState(null);
  
  const wsRef = useRef(null);
  const reconnectAttempts = useRef(0);
  const maxReconnectAttempts = 5;
  const reconnectDelay = useRef(1000);
  const pingInterval = useRef(null);
  
  const { token, user } = useAuthStore();
  const { addNotification, markAsRead: markNotificationRead } = useNotificationsStore();

  // URL do WebSocket
  const getWsUrl = useCallback(() => {
    const protocol = window.location.protocol === 'https:' ? 'wss:' : 'ws:';
    return `${protocol}//${window.location.host}/ws`;
  }, []);

  // Enviar mensagem
  const sendMessage = useCallback((type, payload = {}) => {
    if (wsRef.current?.readyState === WebSocket.OPEN) {
      wsRef.current.send(JSON.stringify({ type, payload }));
      return true;
    }
    console.warn('WebSocket not connected');
    return false;
  }, []);

  // Conectar
  const connect = useCallback(() => {
    if (wsRef.current?.readyState === WebSocket.OPEN) return;
    
    setConnectionState(ConnectionState.CONNECTING);
    
    try {
      const ws = new WebSocket(getWsUrl());
      wsRef.current = ws;

      ws.onopen = () => {
        console.log('🔌 WebSocket connected');
        setConnectionState(ConnectionState.CONNECTED);
        reconnectAttempts.current = 0;
        reconnectDelay.current = 1000;

        // Autenticar
        if (token) {
          sendMessage('auth', { token });
        }

        // Iniciar ping para manter conexão
        pingInterval.current = setInterval(() => {
          sendMessage('ping');
        }, 30000);
      };

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data);
          setLastMessage(message);
          handleMessage(message);
        } catch (error) {
          console.error('Failed to parse WebSocket message:', error);
        }
      };

      ws.onclose = (event) => {
        console.log('🔌 WebSocket disconnected', event.code, event.reason);
        setConnectionState(ConnectionState.DISCONNECTED);
        clearInterval(pingInterval.current);

        // Tentar reconectar se não foi fechamento intencional
        if (event.code !== 1000 && reconnectAttempts.current < maxReconnectAttempts) {
          setConnectionState(ConnectionState.RECONNECTING);
          reconnectAttempts.current++;
          
          setTimeout(() => {
            console.log(`Reconnecting... (${reconnectAttempts.current}/${maxReconnectAttempts})`);
            connect();
          }, reconnectDelay.current);
          
          // Backoff exponencial
          reconnectDelay.current = Math.min(reconnectDelay.current * 2, 30000);
        }
      };

      ws.onerror = (error) => {
        console.error('WebSocket error:', error);
        setConnectionState(ConnectionState.ERROR);
      };
    } catch (error) {
      console.error('Failed to create WebSocket:', error);
      setConnectionState(ConnectionState.ERROR);
    }
  }, [token, getWsUrl, sendMessage]);

  // Desconectar
  const disconnect = useCallback(() => {
    if (wsRef.current) {
      clearInterval(pingInterval.current);
      wsRef.current.close(1000, 'User disconnect');
      wsRef.current = null;
      setConnectionState(ConnectionState.DISCONNECTED);
    }
  }, []);

  // Processar mensagens recebidas
  const handleMessage = useCallback((message) => {
    const { type, payload } = message;

    switch (type) {
      case WS_EVENTS.AUTH_SUCCESS:
        console.log('✅ WebSocket authenticated', payload);
        setSubscriptions(payload.subscriptions || []);
        break;

      case WS_EVENTS.AUTH_FAILED:
        console.error('❌ WebSocket auth failed', payload);
        disconnect();
        break;

      case WS_EVENTS.NOTIFICATION:
        console.log('📬 New notification', payload);
        addNotification(payload);
        // Mostrar notificação do navegador se permitido
        showBrowserNotification(payload);
        break;

      case WS_EVENTS.NOTIFICATION_READ:
        markNotificationRead(payload.notificationId);
        break;

      case WS_EVENTS.ALL_NOTIFICATIONS_READ:
        console.log(`📬 Marked ${payload.count} notifications as read`);
        break;

      case WS_EVENTS.BOOK_UPDATE:
        console.log('📚 Book update', payload);
        // Disparar evento customizado para componentes interessados
        window.dispatchEvent(new CustomEvent('bookUpdate', { detail: payload }));
        break;

      case WS_EVENTS.LOAN_UPDATE:
        console.log('📖 Loan update', payload);
        window.dispatchEvent(new CustomEvent('loanUpdate', { detail: payload }));
        break;

      case WS_EVENTS.CHAT_MESSAGE:
        console.log('💬 Chat message', payload);
        window.dispatchEvent(new CustomEvent('chatMessage', { detail: payload }));
        break;

      case WS_EVENTS.USER_TYPING:
        window.dispatchEvent(new CustomEvent('userTyping', { detail: payload }));
        break;

      case WS_EVENTS.SYSTEM_ALERT:
        console.log('🚨 System alert', payload);
        showBrowserNotification({
          title: 'Alerta do Sistema',
          message: payload.message,
          icon: payload.severity === 'error' ? '🚨' : '⚠️'
        });
        break;

      case WS_EVENTS.PRESENCE_UPDATE:
        window.dispatchEvent(new CustomEvent('presenceUpdate', { detail: payload }));
        break;

      case WS_EVENTS.SUBSCRIBED:
        setSubscriptions(prev => [...prev, payload.room]);
        break;

      case WS_EVENTS.UNSUBSCRIBED:
        setSubscriptions(prev => prev.filter(r => r !== payload.room));
        break;

      case WS_EVENTS.ERROR:
        console.error('WebSocket error message:', payload);
        break;

      default:
        console.debug('Unknown WebSocket message type:', type);
    }
  }, [addNotification, markNotificationRead, disconnect]);

  // Subscrever a uma sala
  const subscribe = useCallback((room) => {
    return sendMessage('subscribe', { room });
  }, [sendMessage]);

  // Cancelar subscrição
  const unsubscribe = useCallback((room) => {
    return sendMessage('unsubscribe', { room });
  }, [sendMessage]);

  // Enviar notificação de digitação
  const sendTyping = useCallback((room, isTyping) => {
    return sendMessage('typing', { room, isTyping });
  }, [sendMessage]);

  // Enviar mensagem de chat
  const sendChatMessage = useCallback((room, message) => {
    return sendMessage('chat', { room, message });
  }, [sendMessage]);

  // Marcar notificação como lida via WebSocket
  const markAsRead = useCallback((notificationIds) => {
    return sendMessage('notification_read', { notificationIds });
  }, [sendMessage]);

  // Conectar quando houver token
  useEffect(() => {
    if (token && user) {
      connect();
    } else {
      disconnect();
    }

    return () => {
      disconnect();
    };
  }, [token, user, connect, disconnect]);

  // Reconectar quando a página voltar a ficar visível
  useEffect(() => {
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible' && token && wsRef.current?.readyState !== WebSocket.OPEN) {
        connect();
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [token, connect]);

  return {
    connectionState,
    isConnected: connectionState === ConnectionState.CONNECTED,
    lastMessage,
    subscriptions,
    stats,
    connect,
    disconnect,
    sendMessage,
    subscribe,
    unsubscribe,
    sendTyping,
    sendChatMessage,
    markAsRead
  };
}

/**
 * Notificação do navegador
 */
function showBrowserNotification(notification) {
  if (!('Notification' in window)) return;
  
  if (Notification.permission === 'granted') {
    new Notification(notification.title, {
      body: notification.message,
      icon: notification.icon || '📚',
      tag: notification.id,
      data: notification
    });
  } else if (Notification.permission !== 'denied') {
    Notification.requestPermission().then(permission => {
      if (permission === 'granted') {
        new Notification(notification.title, {
          body: notification.message,
          icon: notification.icon || '📚'
        });
      }
    });
  }
}

/**
 * Hook para presence (online/offline)
 */
export function usePresence(roomId) {
  const [users, setUsers] = useState([]);
  const [isTyping, setIsTyping] = useState({});
  const { subscribe, unsubscribe, sendTyping } = useWebSocket();

  useEffect(() => {
    if (roomId) {
      subscribe(`room:${roomId}`);

      const handlePresenceUpdate = (event) => {
        const { userId, status } = event.detail;
        setUsers(prev => {
          if (status === 'online') {
            return [...prev.filter(u => u.id !== userId), { id: userId, status }];
          }
          return prev.filter(u => u.id !== userId);
        });
      };

      const handleUserTyping = (event) => {
        const { userId, isTyping } = event.detail;
        setIsTyping(prev => ({
          ...prev,
          [userId]: isTyping
        }));
      };

      window.addEventListener('presenceUpdate', handlePresenceUpdate);
      window.addEventListener('userTyping', handleUserTyping);

      return () => {
        unsubscribe(`room:${roomId}`);
        window.removeEventListener('presenceUpdate', handlePresenceUpdate);
        window.removeEventListener('userTyping', handleUserTyping);
      };
    }
  }, [roomId, subscribe, unsubscribe]);

  const setTyping = useCallback((isTyping) => {
    sendTyping(`room:${roomId}`, isTyping);
  }, [roomId, sendTyping]);

  return { users, isTyping, setTyping };
}

/**
 * Hook para chat em tempo real
 */
export function useChat(roomId) {
  const [messages, setMessages] = useState([]);
  const { subscribe, unsubscribe, sendChatMessage, sendTyping, isConnected } = useWebSocket();

  useEffect(() => {
    if (roomId) {
      subscribe(`chat:${roomId}`);

      const handleChatMessage = (event) => {
        const message = event.detail;
        setMessages(prev => [...prev, message]);
      };

      window.addEventListener('chatMessage', handleChatMessage);

      return () => {
        unsubscribe(`chat:${roomId}`);
        window.removeEventListener('chatMessage', handleChatMessage);
      };
    }
  }, [roomId, subscribe, unsubscribe]);

  const sendMessage = useCallback((message) => {
    if (isConnected) {
      sendChatMessage(`chat:${roomId}`, message);
      return true;
    }
    return false;
  }, [roomId, sendChatMessage, isConnected]);

  const setTyping = useCallback((isTyping) => {
    sendTyping(`chat:${roomId}`, isTyping);
  }, [roomId, sendTyping]);

  return { messages, sendMessage, setTyping, isConnected };
}

/**
 * Hook para atualizações de livros
 */
export function useBookUpdates() {
  const [updates, setUpdates] = useState([]);
  const { isConnected } = useWebSocket();

  useEffect(() => {
    const handleBookUpdate = (event) => {
      setUpdates(prev => [event.detail, ...prev].slice(0, 50));
    };

    window.addEventListener('bookUpdate', handleBookUpdate);
    return () => window.removeEventListener('bookUpdate', handleBookUpdate);
  }, []);

  return { updates, isConnected };
}

export default useWebSocket;