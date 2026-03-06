/**
 * WebSocket Manager - LabGrandisol
 * Sistema de comunicação em tempo real
 */

import { WebSocketServer, WebSocket } from 'ws';
import { Server } from 'http';
import jwt from 'jsonwebtoken';
import Logger from './logger.js';
import { AuthPayload } from '../types/index.js';

const logger = new Logger('WebSocket');
const JWT_SECRET = process.env.JWT_SECRET || 'sua_chave_super_secreta_aqui_mudeme_em_producao';

interface WebSocketClient extends WebSocket {
  userId?: number;
  userEmail?: string;
  userRole?: string;
  isAlive?: boolean;
  subscriptions?: Set<string>;
  connectedAt?: Date;
  lastActivity?: Date;
}

interface WebSocketMessage {
  type: string;
  payload: any;
  timestamp?: string;
  requestId?: string;
}

interface BroadcastOptions {
  excludeUserId?: number;
  onlyRole?: string;
  room?: string;
}

interface RoomStats {
  name: string;
  members: number;
  lastActivity: Date;
}

class WebSocketManager {
  private wss: WebSocketServer | null = null;
  private clients: Map<number, WebSocketClient[]> = new Map();
  private rooms: Map<string, Set<WebSocketClient>> = new Map();
  private heartbeatInterval: NodeJS.Timeout | null = null;
  private statsInterval: NodeJS.Timeout | null = null;

  /**
   * Inicializa o servidor WebSocket
   */
  initialize(server: Server): void {
    this.wss = new WebSocketServer({ 
      server, 
      path: '/ws',
      clientTracking: true,
      maxPayload: 1024 * 1024 // 1MB max
    });

    this.setupEventHandlers();
    this.startHeartbeat();
    this.startStatsCollector();

    logger.info('✅ WebSocket server initialized on /ws');
  }

  /**
   * Configura os event handlers
   */
  private setupEventHandlers(): void {
    if (!this.wss) return;

    this.wss.on('connection', (ws: WebSocketClient, request) => {
      const ip = request.headers['x-forwarded-for'] || request.socket.remoteAddress || 'unknown';
      
      ws.isAlive = true;
      ws.connectedAt = new Date();
      ws.lastActivity = new Date();
      ws.subscriptions = new Set();

      logger.debug('New WebSocket connection', { ip });

      // Autenticação obrigatória em 30 segundos
      const authTimeout = setTimeout(() => {
        if (!ws.userId) {
          this.sendToClient(ws, {
            type: 'error',
            payload: { code: 'AUTH_TIMEOUT', message: 'Authentication required' }
          });
          ws.close(4001, 'Authentication timeout');
        }
      }, 30000);

      ws.on('message', (data: Buffer) => {
        ws.lastActivity = new Date();
        this.handleMessage(ws, data, authTimeout);
      });

      ws.on('pong', () => {
        ws.isAlive = true;
      });

      ws.on('close', (code, reason) => {
        clearTimeout(authTimeout);
        this.handleDisconnect(ws, code, reason);
      });

      ws.on('error', (error) => {
        logger.error('WebSocket error', error as Error, { userId: ws.userId });
      });

      // Enviar mensagem de boas-vindas
      this.sendToClient(ws, {
        type: 'connected',
        payload: { 
          message: 'Welcome to LabGrandisol WebSocket',
          requireAuth: true 
        }
      });
    });

    this.wss.on('error', (error) => {
      logger.error('WebSocket server error', error as Error);
    });
  }

  /**
   * Processa mensagens recebidas
   */
  private handleMessage(ws: WebSocketClient, data: Buffer, authTimeout: NodeJS.Timeout): void {
    try {
      const message: WebSocketMessage = JSON.parse(data.toString());
      
      switch (message.type) {
        case 'auth':
          this.handleAuth(ws, message.payload, authTimeout);
          break;
        case 'ping':
          this.sendToClient(ws, { type: 'pong', payload: { timestamp: Date.now() } });
          break;
        case 'subscribe':
          this.handleSubscribe(ws, message.payload);
          break;
        case 'unsubscribe':
          this.handleUnsubscribe(ws, message.payload);
          break;
        case 'notification_read':
          this.handleNotificationRead(ws, message.payload);
          break;
        case 'typing':
          this.handleTyping(ws, message.payload);
          break;
        case 'chat':
          this.handleChat(ws, message.payload);
          break;
        default:
          this.sendToClient(ws, {
            type: 'error',
            payload: { code: 'UNKNOWN_TYPE', message: `Unknown message type: ${message.type}` }
          });
      }
    } catch (error) {
      logger.warn('Invalid WebSocket message', { error: (error as Error).message });
      this.sendToClient(ws, {
        type: 'error',
        payload: { code: 'INVALID_MESSAGE', message: 'Invalid JSON message' }
      });
    }
  }

  /**
   * Autentica o cliente WebSocket
   */
  private handleAuth(ws: WebSocketClient, payload: { token: string }, authTimeout: NodeJS.Timeout): void {
    try {
      const decoded = jwt.verify(payload.token, JWT_SECRET) as AuthPayload;
      
      ws.userId = decoded.id;
      ws.userEmail = decoded.email;
      ws.userRole = decoded.role;

      clearTimeout(authTimeout);

      // Adicionar ao mapa de clientes por usuário
      if (!this.clients.has(decoded.id)) {
        this.clients.set(decoded.id, []);
      }
      this.clients.get(decoded.id)!.push(ws);

      // Auto-inscrever em canais padrão
      ws.subscriptions!.add(`user:${decoded.id}`);
      ws.subscriptions!.add('broadcast');
      if (decoded.role === 'admin') {
        ws.subscriptions!.add('admin');
      }

      this.sendToClient(ws, {
        type: 'auth_success',
        payload: { 
          userId: decoded.id,
          email: decoded.email,
          role: decoded.role,
          subscriptions: Array.from(ws.subscriptions!)
        }
      });

      logger.info('WebSocket authenticated', { userId: decoded.id, email: decoded.email });

      // Notificar outros dispositivos do mesmo usuário
      this.broadcastToUser(decoded.id, {
        type: 'device_connected',
        payload: { timestamp: new Date().toISOString() }
      }, ws);
    } catch (error) {
      logger.warn('WebSocket auth failed', { error: (error as Error).message });
      this.sendToClient(ws, {
        type: 'auth_failed',
        payload: { code: 'INVALID_TOKEN', message: 'Invalid or expired token' }
      });
      ws.close(4002, 'Authentication failed');
    }
  }

  /**
   * Inscreve cliente em uma sala/canal
   */
  private handleSubscribe(ws: WebSocketClient, payload: { room: string }): void {
    if (!ws.userId) {
      this.sendToClient(ws, {
        type: 'error',
        payload: { code: 'NOT_AUTHENTICATED', message: 'Must authenticate first' }
      });
      return;
    }

    const room = payload.room;
    
    // Validar acesso à sala
    if (!this.canJoinRoom(ws, room)) {
      this.sendToClient(ws, {
        type: 'error',
        payload: { code: 'ACCESS_DENIED', message: `Cannot join room: ${room}` }
      });
      return;
    }

    ws.subscriptions!.add(room);
    
    if (!this.rooms.has(room)) {
      this.rooms.set(room, new Set());
    }
    this.rooms.get(room)!.add(ws);

    this.sendToClient(ws, {
      type: 'subscribed',
      payload: { room, members: this.rooms.get(room)!.size }
    });

    // Notificar outros membros da sala
    this.broadcastToRoom(room, {
      type: 'user_joined',
      payload: { userId: ws.userId, timestamp: new Date().toISOString() }
    }, ws);

    logger.debug('Client subscribed', { userId: ws.userId, room });
  }

  /**
   * Remove cliente de uma sala/canal
   */
  private handleUnsubscribe(ws: WebSocketClient, payload: { room: string }): void {
    const room = payload.room;
    
    ws.subscriptions!.delete(room);
    
    if (this.rooms.has(room)) {
      this.rooms.get(room)!.delete(ws);
      
      this.broadcastToRoom(room, {
        type: 'user_left',
        payload: { userId: ws.userId, timestamp: new Date().toISOString() }
      });

      if (this.rooms.get(room)!.size === 0) {
        this.rooms.delete(room);
      }
    }

    this.sendToClient(ws, {
      type: 'unsubscribed',
      payload: { room }
    });
  }

  /**
   * Processa notificação de leitura
   */
  private handleNotificationRead(ws: WebSocketClient, payload: { notificationIds: string[] }): void {
    if (!ws.userId) return;

    // Notificar outros dispositivos do usuário
    this.broadcastToUser(ws.userId, {
      type: 'notifications_read',
      payload: { notificationIds: payload.notificationIds }
    }, ws);
  }

  /**
   * Broadcast de digitação
   */
  private handleTyping(ws: WebSocketClient, payload: { room: string; isTyping: boolean }): void {
    if (!ws.userId) return;

    this.broadcastToRoom(payload.room, {
      type: 'user_typing',
      payload: { 
        userId: ws.userId, 
        isTyping: payload.isTyping,
        timestamp: new Date().toISOString()
      }
    }, ws);
  }

  /**
   * Mensagem de chat
   */
  private handleChat(ws: WebSocketClient, payload: { room: string; message: string }): void {
    if (!ws.userId) return;

    // Validar mensagem
    if (!payload.message || payload.message.trim().length === 0) {
      return;
    }

    const sanitizedMessage = payload.message.trim().substring(0, 1000);

    this.broadcastToRoom(payload.room, {
      type: 'chat_message',
      payload: {
        userId: ws.userId,
        userName: ws.userEmail,
        message: sanitizedMessage,
        timestamp: new Date().toISOString()
      }
    });
  }

  /**
   * Trata desconexão do cliente
   */
  private handleDisconnect(ws: WebSocketClient, code: number, reason: Buffer): void {
    if (ws.userId) {
      // Remover do mapa de clientes
      const userClients = this.clients.get(ws.userId);
      if (userClients) {
        const index = userClients.indexOf(ws);
        if (index > -1) {
          userClients.splice(index, 1);
        }
        if (userClients.length === 0) {
          this.clients.delete(ws.userId);
        }
      }

      // Remover de todas as salas
      ws.subscriptions?.forEach(room => {
        if (this.rooms.has(room)) {
          this.rooms.get(room)!.delete(ws);
          if (this.rooms.get(room)!.size === 0) {
            this.rooms.delete(room);
          }
        }
      });

      logger.info('WebSocket disconnected', { 
        userId: ws.userId, 
        code, 
        reason: reason.toString(),
        connectedDuration: ws.connectedAt ? Date.now() - ws.connectedAt.getTime() : 0
      });
    }
  }

  /**
   * Verifica se cliente pode entrar na sala
   */
  private canJoinRoom(ws: WebSocketClient, room: string): boolean {
    // Salas de usuário - apenas o próprio usuário
    if (room.startsWith('user:') && room !== `user:${ws.userId}`) {
      return false;
    }
    
    // Sala de admin - apenas admins
    if (room === 'admin' && ws.userRole !== 'admin') {
      return false;
    }

    return true;
  }

  /**
   * Envia mensagem para um cliente específico
   */
  private sendToClient(ws: WebSocketClient, message: WebSocketMessage): void {
    if (ws.readyState === WebSocket.OPEN) {
      ws.send(JSON.stringify({
        ...message,
        timestamp: new Date().toISOString()
      }));
    }
  }

  /**
   * Inicia o heartbeat para detectar conexões mortas
   */
  private startHeartbeat(): void {
    this.heartbeatInterval = setInterval(() => {
      if (!this.wss) return;

      this.wss.clients.forEach((ws: WebSocketClient) => {
        if (!ws.isAlive) {
          logger.debug('Terminating dead connection', { userId: ws.userId });
          return ws.terminate();
        }

        ws.isAlive = false;
        ws.ping();
      });
    }, 30000); // 30 segundos
  }

  /**
   * Coleta estatísticas periódicas
   */
  private startStatsCollector(): void {
    this.statsInterval = setInterval(() => {
      const stats = this.getStats();
      logger.debug('WebSocket stats', stats);
    }, 60000); // 1 minuto
  }

  /**
   * Retorna estatísticas do WebSocket
   */
  getStats(): {
    totalConnections: number;
    authenticatedUsers: number;
    rooms: RoomStats[];
    uptime: number;
  } {
    const roomsStats: RoomStats[] = [];
    
    this.rooms.forEach((clients, name) => {
      roomsStats.push({
        name,
        members: clients.size,
        lastActivity: new Date()
      });
    });

    return {
      totalConnections: this.wss?.clients.size || 0,
      authenticatedUsers: this.clients.size,
      rooms: roomsStats,
      uptime: process.uptime()
    };
  }

  // ==================== MÉTODOS PÚBLICOS DE BROADCAST ====================

  /**
   * Envia notificação para um usuário específico
   */
  notifyUser(userId: number, notification: any): void {
    this.broadcastToUser(userId, {
      type: 'notification',
      payload: notification
    });
  }

  /**
   * Envia notificação para múltiplos usuários
   */
  notifyUsers(userIds: number[], notification: any): void {
    userIds.forEach(userId => this.notifyUser(userId, notification));
  }

  /**
   * Broadcast para todos os usuários
   */
  broadcast(message: WebSocketMessage, options?: BroadcastOptions): void {
    this.wss?.clients.forEach((ws: WebSocketClient) => {
      if (!ws.userId) return;
      if (options?.excludeUserId === ws.userId) return;
      if (options?.onlyRole && ws.userRole !== options.onlyRole) return;
      
      this.sendToClient(ws as WebSocketClient, message);
    });
  }

  /**
   * Broadcast para um usuário específico (todos os dispositivos)
   */
  broadcastToUser(userId: number, message: WebSocketMessage, excludeWs?: WebSocketClient): void {
    const userClients = this.clients.get(userId);
    if (!userClients) return;

    userClients.forEach(ws => {
      if (excludeWs !== ws) {
        this.sendToClient(ws, message);
      }
    });
  }

  /**
   * Broadcast para uma sala específica
   */
  broadcastToRoom(room: string, message: WebSocketMessage, excludeWs?: WebSocketClient): void {
    const roomClients = this.rooms.get(room);
    if (!roomClients) return;

    roomClients.forEach(ws => {
      if (excludeWs !== ws) {
        this.sendToClient(ws, message);
      }
    });
  }

  /**
   * Envia alerta de sistema
   */
  sendSystemAlert(message: string, severity: 'info' | 'warning' | 'error' = 'info'): void {
    this.broadcast({
      type: 'system_alert',
      payload: { message, severity }
    });
  }

  /**
   * Envia atualização de livro
   */
  sendBookUpdate(bookId: number, action: 'created' | 'updated' | 'deleted', data?: any): void {
    this.broadcast({
      type: 'book_update',
      payload: { bookId, action, data }
    });
  }

  /**
   * Envia atualização de empréstimo
   */
  sendLoanUpdate(userId: number, action: 'created' | 'returned' | 'overdue', data?: any): void {
    this.broadcastToUser(userId, {
      type: 'loan_update',
      payload: { action, data }
    });
  }

  /**
   * Envia atualização de presença (online/offline)
   */
  sendPresenceUpdate(userId: number, status: 'online' | 'offline'): void {
    this.broadcast({
      type: 'presence_update',
      payload: { userId, status, timestamp: new Date().toISOString() }
    });
  }

  /**
   * Fecha o servidor WebSocket
   */
  close(): void {
    if (this.heartbeatInterval) {
      clearInterval(this.heartbeatInterval);
    }
    if (this.statsInterval) {
      clearInterval(this.statsInterval);
    }
    if (this.wss) {
      this.wss.close(() => {
        logger.info('WebSocket server closed');
      });
    }
  }
}

// Singleton
export const wsManager = new WebSocketManager();
export default wsManager;