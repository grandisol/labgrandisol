/**
 * Notification Service - LabGrandisol
 * Sistema avançado de notificações em tempo real
 */

import Logger from './logger.js';
import wsManager from './websocket.js';

const logger = new Logger('NotificationService');

// Tipos de notificação
export enum NotificationType {
  // Sistema
  SYSTEM_ALERT = 'system_alert',
  SYSTEM_MAINTENANCE = 'system_maintenance',
  SYSTEM_UPDATE = 'system_update',
  
  // Biblioteca
  BOOK_AVAILABLE = 'book_available',
  BOOK_DUE_SOON = 'book_due_soon',
  BOOK_OVERDUE = 'book_overdue',
  BOOK_RESERVED = 'book_reserved',
  BOOK_RETURNED = 'book_returned',
  NEW_BOOK_ADDED = 'new_book_added',
  
  // Social
  FOLLOWER_NEW = 'follower_new',
  COMMENT_RECEIVED = 'comment_received',
  LIKE_RECEIVED = 'like_received',
  MENTION = 'mention',
  REVIEW_ADDED = 'review_added',
  
  // Usuário
  ACHIEVEMENT_UNLOCKED = 'achievement_unlocked',
  READING_GOAL_ACHIEVED = 'reading_goal_achieved',
  PROFILE_UPDATED = 'profile_updated',
  WELCOME = 'welcome',
  
  // Admin
  ADMIN_USER_REPORT = 'admin_user_report',
  ADMIN_SYSTEM_ALERT = 'admin_system_alert',
  ADMIN_NEW_REGISTRATION = 'admin_new_registration',
  
  // Chat/Mensagens
  DIRECT_MESSAGE = 'direct_message',
  GROUP_MESSAGE = 'group_message'
}

// Prioridades
export enum NotificationPriority {
  LOW = 'low',
  NORMAL = 'normal',
  HIGH = 'high',
  URGENT = 'urgent'
}

// Interface de notificação
export interface Notification {
  id: string;
  type: NotificationType;
  title: string;
  message: string;
  priority: NotificationPriority;
  recipientId: number | 'all' | 'admins';
  senderId?: number;
  senderName?: string;
  data?: Record<string, any>;
  read: boolean;
  readAt?: Date;
  expiresAt?: Date;
  actionUrl?: string;
  actionText?: string;
  icon?: string;
  createdAt: Date;
}

// Configuração por tipo de notificação
interface NotificationConfig {
  icon: string;
  defaultPriority: NotificationPriority;
  ttl: number; // Time to live em segundos
  persistent: boolean;
}

const NOTIFICATION_CONFIGS: Record<NotificationType, NotificationConfig> = {
  // Sistema
  [NotificationType.SYSTEM_ALERT]: {
    icon: '⚠️',
    defaultPriority: NotificationPriority.HIGH,
    ttl: 86400, // 1 dia
    persistent: true
  },
  [NotificationType.SYSTEM_MAINTENANCE]: {
    icon: '🔧',
    defaultPriority: NotificationPriority.URGENT,
    ttl: 7200, // 2 horas
    persistent: true
  },
  [NotificationType.SYSTEM_UPDATE]: {
    icon: '🆕',
    defaultPriority: NotificationPriority.NORMAL,
    ttl: 604800, // 1 semana
    persistent: false
  },
  
  // Biblioteca
  [NotificationType.BOOK_AVAILABLE]: {
    icon: '📚',
    defaultPriority: NotificationPriority.HIGH,
    ttl: 604800,
    persistent: true
  },
  [NotificationType.BOOK_DUE_SOON]: {
    icon: '⏰',
    defaultPriority: NotificationPriority.HIGH,
    ttl: 259200, // 3 dias
    persistent: true
  },
  [NotificationType.BOOK_OVERDUE]: {
    icon: '🚨',
    defaultPriority: NotificationPriority.URGENT,
    ttl: 604800,
    persistent: true
  },
  [NotificationType.BOOK_RESERVED]: {
    icon: '📌',
    defaultPriority: NotificationPriority.NORMAL,
    ttl: 259200,
    persistent: false
  },
  [NotificationType.BOOK_RETURNED]: {
    icon: '✅',
    defaultPriority: NotificationPriority.LOW,
    ttl: 86400,
    persistent: false
  },
  [NotificationType.NEW_BOOK_ADDED]: {
    icon: '📖',
    defaultPriority: NotificationPriority.LOW,
    ttl: 259200,
    persistent: false
  },
  
  // Social
  [NotificationType.FOLLOWER_NEW]: {
    icon: '👤',
    defaultPriority: NotificationPriority.NORMAL,
    ttl: 259200,
    persistent: false
  },
  [NotificationType.COMMENT_RECEIVED]: {
    icon: '💬',
    defaultPriority: NotificationPriority.NORMAL,
    ttl: 604800,
    persistent: false
  },
  [NotificationType.LIKE_RECEIVED]: {
    icon: '❤️',
    defaultPriority: NotificationPriority.LOW,
    ttl: 259200,
    persistent: false
  },
  [NotificationType.MENTION]: {
    icon: '📢',
    defaultPriority: NotificationPriority.HIGH,
    ttl: 604800,
    persistent: true
  },
  [NotificationType.REVIEW_ADDED]: {
    icon: '⭐',
    defaultPriority: NotificationPriority.NORMAL,
    ttl: 604800,
    persistent: false
  },
  
  // Usuário
  [NotificationType.ACHIEVEMENT_UNLOCKED]: {
    icon: '🏆',
    defaultPriority: NotificationPriority.HIGH,
    ttl: 0, // Não expira
    persistent: true
  },
  [NotificationType.READING_GOAL_ACHIEVED]: {
    icon: '🎯',
    defaultPriority: NotificationPriority.HIGH,
    ttl: 0,
    persistent: true
  },
  [NotificationType.PROFILE_UPDATED]: {
    icon: '✏️',
    defaultPriority: NotificationPriority.LOW,
    ttl: 86400,
    persistent: false
  },
  [NotificationType.WELCOME]: {
    icon: '👋',
    defaultPriority: NotificationPriority.NORMAL,
    ttl: 604800,
    persistent: true
  },
  
  // Admin
  [NotificationType.ADMIN_USER_REPORT]: {
    icon: '🚩',
    defaultPriority: NotificationPriority.HIGH,
    ttl: 2592000, // 30 dias
    persistent: true
  },
  [NotificationType.ADMIN_SYSTEM_ALERT]: {
    icon: '🔔',
    defaultPriority: NotificationPriority.URGENT,
    ttl: 604800,
    persistent: true
  },
  [NotificationType.ADMIN_NEW_REGISTRATION]: {
    icon: '🆕',
    defaultPriority: NotificationPriority.NORMAL,
    ttl: 259200,
    persistent: false
  },
  
  // Chat
  [NotificationType.DIRECT_MESSAGE]: {
    icon: '✉️',
    defaultPriority: NotificationPriority.NORMAL,
    ttl: 259200,
    persistent: false
  },
  [NotificationType.GROUP_MESSAGE]: {
    icon: '👥',
    defaultPriority: NotificationPriority.NORMAL,
    ttl: 259200,
    persistent: false
  }
};

// Armazenamento em memória (em produção usar Redis/DB)
class NotificationStore {
  private notifications: Map<number, Notification[]> = new Map();
  private maxSize: number = 100;

  add(userId: number, notification: Notification): void {
    if (!this.notifications.has(userId)) {
      this.notifications.set(userId, []);
    }
    
    const userNotifications = this.notifications.get(userId)!;
    userNotifications.unshift(notification);
    
    // Limitar tamanho
    if (userNotifications.length > this.maxSize) {
      userNotifications.pop();
    }
  }

  get(userId: number, limit: number = 20, offset: number = 0): Notification[] {
    const userNotifications = this.notifications.get(userId) || [];
    return userNotifications.slice(offset, offset + limit);
  }

  getAll(userId: number): Notification[] {
    return this.notifications.get(userId) || [];
  }

  markAsRead(userId: number, notificationId: string): boolean {
    const userNotifications = this.notifications.get(userId);
    if (!userNotifications) return false;
    
    const notification = userNotifications.find(n => n.id === notificationId);
    if (notification && !notification.read) {
      notification.read = true;
      notification.readAt = new Date();
      return true;
    }
    return false;
  }

  markAllAsRead(userId: number): number {
    const userNotifications = this.notifications.get(userId);
    if (!userNotifications) return 0;
    
    let count = 0;
    userNotifications.forEach(n => {
      if (!n.read) {
        n.read = true;
        n.readAt = new Date();
        count++;
      }
    });
    return count;
  }

  delete(userId: number, notificationId: string): boolean {
    const userNotifications = this.notifications.get(userId);
    if (!userNotifications) return false;
    
    const index = userNotifications.findIndex(n => n.id === notificationId);
    if (index > -1) {
      userNotifications.splice(index, 1);
      return true;
    }
    return false;
  }

  clear(userId: number): void {
    this.notifications.delete(userId);
  }

  getUnreadCount(userId: number): number {
    const userNotifications = this.notifications.get(userId) || [];
    return userNotifications.filter(n => !n.read).length;
  }

  // Limpar notificações expiradas
  cleanup(): number {
    let removed = 0;
    const now = new Date();
    
    this.notifications.forEach((notifications, userId) => {
      const validNotifications = notifications.filter(n => {
        if (n.expiresAt && new Date(n.expiresAt) < now) {
          removed++;
          return false;
        }
        return true;
      });
      
      this.notifications.set(userId, validNotifications);
    });
    
    return removed;
  }
}

// Serviço de notificação
class NotificationService {
  private store: NotificationStore;
  private cleanupInterval: NodeJS.Timeout | null = null;

  constructor() {
    this.store = new NotificationStore();
    this.startCleanup();
  }

  private startCleanup(): void {
    // Executar limpeza a cada hora
    this.cleanupInterval = setInterval(() => {
      const removed = this.store.cleanup();
      if (removed > 0) {
        logger.debug(`Cleaned up ${removed} expired notifications`);
      }
    }, 3600000);
  }

  /**
   * Gera ID único para notificação
   */
  private generateId(): string {
    return `notif_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  /**
   * Cria e envia uma notificação
   */
  create(params: {
    type: NotificationType;
    title: string;
    message: string;
    recipientId: number | 'all' | 'admins';
    senderId?: number;
    senderName?: string;
    data?: Record<string, any>;
    priority?: NotificationPriority;
    actionUrl?: string;
    actionText?: string;
    customIcon?: string;
    ttl?: number;
  }): Notification {
    const config = NOTIFICATION_CONFIGS[params.type];
    
    const notification: Notification = {
      id: this.generateId(),
      type: params.type,
      title: params.title,
      message: params.message,
      priority: params.priority || config.defaultPriority,
      recipientId: params.recipientId,
      senderId: params.senderId,
      senderName: params.senderName,
      data: params.data,
      read: false,
      actionUrl: params.actionUrl,
      actionText: params.actionText,
      icon: params.customIcon || config.icon,
      createdAt: new Date()
    };

    // Definir expiração
    const ttl = params.ttl !== undefined ? params.ttl : config.ttl;
    if (ttl > 0) {
      notification.expiresAt = new Date(Date.now() + ttl * 1000);
    }

    // Processar destinatários
    if (params.recipientId === 'all') {
      // Broadcast para todos
      this.broadcastToAll(notification);
    } else if (params.recipientId === 'admins') {
      // Enviar para admins
      this.sendToAdmins(notification);
    } else {
      // Enviar para usuário específico
      this.sendToUser(params.recipientId, notification);
    }

    logger.debug('Notification created', {
      id: notification.id,
      type: notification.type,
      recipientId: params.recipientId
    });

    return notification;
  }

  /**
   * Envia notificação para usuário específico
   */
  private sendToUser(userId: number, notification: Notification): void {
    this.store.add(userId, notification);
    wsManager.notifyUser(userId, notification);
  }

  /**
   * Envia notificação para todos os usuários
   */
  private broadcastToAll(notification: Notification): void {
    wsManager.broadcast({
      type: 'notification',
      payload: notification
    });
  }

  /**
   * Envia notificação para administradores
   */
  private sendToAdmins(notification: Notification): void {
    wsManager.broadcast({
      type: 'notification',
      payload: notification
    }, { onlyRole: 'admin' });
  }

  /**
   * Busca notificações do usuário
   */
  getForUser(userId: number, limit?: number, offset?: number): Notification[] {
    return this.store.get(userId, limit, offset);
  }

  /**
   * Conta notificações não lidas
   */
  getUnreadCount(userId: number): number {
    return this.store.getUnreadCount(userId);
  }

  /**
   * Marca notificação como lida
   */
  markAsRead(userId: number, notificationId: string): boolean {
    const result = this.store.markAsRead(userId, notificationId);
    
    if (result) {
      // Notificar outros dispositivos do usuário
      wsManager.broadcastToUser(userId, {
        type: 'notification_read',
        payload: { notificationId }
      });
    }
    
    return result;
  }

  /**
   * Marca todas como lidas
   */
  markAllAsRead(userId: number): number {
    const count = this.store.markAllAsRead(userId);
    
    if (count > 0) {
      wsManager.broadcastToUser(userId, {
        type: 'all_notifications_read',
        payload: { count }
      });
    }
    
    return count;
  }

  /**
   * Deleta notificação
   */
  delete(userId: number, notificationId: string): boolean {
    return this.store.delete(userId, notificationId);
  }

  /**
   * Limpa todas as notificações do usuário
   */
  clearAll(userId: number): void {
    this.store.clear(userId);
  }

  // ==================== MÉTODOS DE CONVENIÊNCIA ====================

  /**
   * Notificação de boas-vindas
   */
  sendWelcome(userId: number, userName: string): Notification {
    return this.create({
      type: NotificationType.WELCOME,
      title: 'Bem-vindo ao LabGrandisol!',
      message: `Olá ${userName}! Estamos felizes em ter você conosco. Explore nossa biblioteca virtual!`,
      recipientId: userId,
      actionUrl: '/library',
      actionText: 'Explorar Biblioteca'
    });
  }

  /**
   * Notificação de livro disponível
   */
  sendBookAvailable(userId: number, bookTitle: string, bookId: number): Notification {
    return this.create({
      type: NotificationType.BOOK_AVAILABLE,
      title: 'Livro disponível!',
      message: `O livro "${bookTitle}" está disponível para empréstimo.`,
      recipientId: userId,
      data: { bookId },
      actionUrl: `/library/${bookId}`,
      actionText: 'Ver Livro'
    });
  }

  /**
   * Notificação de vencimento de empréstimo
   */
  sendDueReminder(userId: number, bookTitle: string, bookId: number, daysLeft: number): Notification {
    const isOverdue = daysLeft < 0;
    return this.create({
      type: isOverdue ? NotificationType.BOOK_OVERDUE : NotificationType.BOOK_DUE_SOON,
      title: isOverdue ? 'Empréstimo vencido!' : 'Empréstimo prestes a vencer',
      message: isOverdue
        ? `O livro "${bookTitle}" está com empréstimo vencido há ${Math.abs(daysLeft)} dias.`
        : `O empréstimo do livro "${bookTitle}" vence em ${daysLeft} dias.`,
      recipientId: userId,
      priority: isOverdue ? NotificationPriority.URGENT : NotificationPriority.HIGH,
      data: { bookId, daysLeft },
      actionUrl: '/my-loans',
      actionText: 'Ver Empréstimos'
    });
  }

  /**
   * Notificação de conquista
   */
  sendAchievement(userId: number, achievementName: string, achievementDescription: string): Notification {
    return this.create({
      type: NotificationType.ACHIEVEMENT_UNLOCKED,
      title: '🏆 Nova Conquista!',
      message: `Você desbloqueou: ${achievementName}. ${achievementDescription}`,
      recipientId: userId,
      priority: NotificationPriority.HIGH
    });
  }

  /**
   * Notificação de meta de leitura
   */
  sendReadingGoalAchieved(userId: number, booksRead: number): Notification {
    return this.create({
      type: NotificationType.READING_GOAL_ACHIEVED,
      title: '🎯 Meta de Leitura Alcançada!',
      message: `Parabéns! Você leu ${booksRead} livros e alcançou sua meta!`,
      recipientId: userId,
      priority: NotificationPriority.HIGH
    });
  }

  /**
   * Alerta de sistema
   */
  sendSystemAlert(message: string, priority: NotificationPriority = NotificationPriority.HIGH): Notification {
    return this.create({
      type: NotificationType.SYSTEM_ALERT,
      title: 'Alerta do Sistema',
      message,
      recipientId: 'all',
      priority
    });
  }

  /**
   * Alerta de manutenção
   */
  sendMaintenanceAlert(scheduledTime: Date, duration: number): Notification {
    return this.create({
      type: NotificationType.SYSTEM_MAINTENANCE,
      title: 'Manutenção Programada',
      message: `O sistema passará por manutenção em ${scheduledTime.toLocaleString('pt-BR')}. Duração estimada: ${duration} minutos.`,
      recipientId: 'all',
      priority: NotificationPriority.URGENT
    });
  }

  /**
   * Notificação de novo seguidor
   */
  sendNewFollower(userId: number, followerId: number, followerName: string): Notification {
    return this.create({
      type: NotificationType.FOLLOWER_NEW,
      title: 'Novo seguidor',
      message: `${followerName} começou a seguir você.`,
      recipientId: userId,
      senderId: followerId,
      senderName: followerName,
      actionUrl: `/social/followers`,
      actionText: 'Ver Seguidores'
    });
  }

  /**
   * Notificação de menção
   */
  sendMention(userId: number, mentionedBy: string, context: string, url: string): Notification {
    return this.create({
      type: NotificationType.MENTION,
      title: 'Você foi mencionado',
      message: `${mentionedBy} mencionou você: "${context}"`,
      recipientId: userId,
      senderName: mentionedBy,
      actionUrl: url,
      actionText: 'Ver Contexto'
    });
  }

  /**
   * Notificação de admin - novo registro
   */
  notifyAdminNewRegistration(newUserEmail: string, newUserName: string): Notification {
    return this.create({
      type: NotificationType.ADMIN_NEW_REGISTRATION,
      title: 'Novo Usuário Registrado',
      message: `${newUserName} (${newUserEmail}) se registrou no sistema.`,
      recipientId: 'admins',
      data: { email: newUserEmail, name: newUserName }
    });
  }

  /**
   * Para o serviço
   */
  stop(): void {
    if (this.cleanupInterval) {
      clearInterval(this.cleanupInterval);
    }
    logger.info('Notification service stopped');
  }
}

// Singleton
export const notificationService = new NotificationService();
export default notificationService;