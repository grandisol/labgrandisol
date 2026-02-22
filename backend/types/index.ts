/**
 * Type Definitions - LabGrandisol
 * Tipos centralizados para toda a aplicação
 */

// ==================== USER TYPES ====================

export interface User {
  id: number;
  email: string;
  password_hash: string;
  name: string;
  avatar_url?: string;
  bio?: string;
  role: 'admin' | 'moderator' | 'user';
  status: 'active' | 'inactive' | 'banned';
  subscription_tier: 'free' | 'pro' | 'enterprise';
  subscription_expires_at?: Date;
  workspace_id?: number;
  preferences: UserPreferences;
  reading_goal?: number;
  created_at: Date;
  updated_at: Date;
  deleted_at?: Date;
}

export interface UserPreferences {
  theme: 'light' | 'dark' | 'auto';
  language: string;
  notifications_enabled: boolean;
  email_digest: 'weekly' | 'monthly' | 'never';
  privacy_level: 'private' | 'friends_only' | 'public';
}

export interface UserPublic extends Omit<User, 'password_hash'> {}

export type UserRole = 'admin' | 'moderator' | 'user';
export type UserStatus = 'active' | 'inactive' | 'banned';
export type SubscriptionTier = 'free' | 'pro' | 'enterprise';

// ==================== WORKSPACE/MULTI-TENANT ====================

export interface Workspace {
  id: number;
  name: string;
  slug: string;
  logo_url?: string;
  owner_id: number;
  plan: SubscriptionTier;
  members_count: number;
  storage_used: number;
  storage_limit: number;
  custom_domain?: string;
  settings: WorkspaceSettings;
  created_at: Date;
  updated_at: Date;
}

export interface WorkspaceSettings {
  allow_public_libraries: boolean;
  allow_social_features: boolean;
  max_books: number;
  max_collaborators: number;
  api_rate_limit: number;
}

export interface WorkspaceMember {
  id: number;
  workspace_id: number;
  user_id: number;
  role: 'owner' | 'admin' | 'editor' | 'viewer';
  permissions: Permission[];
  joined_at: Date;
}

export interface Permission {
  name: string;
  resource: string;
  action: 'create' | 'read' | 'update' | 'delete';
}

// ==================== AUTH TYPES ====================

export interface AuthPayload {
  id: number;
  email: string;
  name: string;
  role: UserRole;
  workspace_id?: number;
}

export interface LoginRequest {
  email: string;
  password: string;
}

export interface LoginResponse {
  token: string;
  refreshToken: string;
  user: UserPublic;
  workspace?: Workspace;
  expiresIn: number;
}

export interface RegisterRequest {
  email: string;
  password: string;
  name: string;
  workspace_name?: string;
}

export interface RegisterResponse extends LoginResponse {
  message: string;
}

export interface RefreshRequest {
  refreshToken: string;
}

export interface RefreshResponse {
  token: string;
  refreshToken: string;
  expiresIn: number;
}

// ==================== NOTE TYPES ====================

export interface Note {
  id: number;
  user_id: number;
  title: string;
  content: string;
  created_at: Date;
  updated_at: Date;
}

export interface CreateNoteRequest {
  title: string;
  content: string;
}

export interface UpdateNoteRequest {
  title?: string;
  content?: string;
}

export interface NoteResponse extends Note {}

// ==================== PAGINATION ====================

export interface PaginationQuery {
  limit?: number;
  offset?: number;
}

export interface PaginationMeta {
  limit: number;
  offset: number;
  total: number;
  hasMore: boolean;
}

export interface PaginatedResponse<T> {
  data: T[];
  pagination: PaginationMeta;
}

// ==================== AUDIT TYPES ====================

export interface AuditLog {
  id: number;
  user_id?: number;
  action: string;
  resource: string;
  details?: Record<string, any>;
  ip_address: string;
  created_at: Date;
}

export type AuditAction = 'LOGIN' | 'LOGOUT' | 'CREATE' | 'UPDATE' | 'DELETE' | 'ACCESS_DENIED';

// ==================== SESSION TYPES ====================

export interface Session {
  id: number;
  user_id: number;
  token_hash: string;
  refresh_token_hash?: string;
  ip_address: string;
  user_agent: string;
  expires_at: Date;
  created_at: Date;
}

// ==================== API RESPONSE TYPES ====================

export interface ApiSuccessResponse<T> {
  success: true;
  data: T;
  message?: string;
}

export interface ApiErrorResponse {
  success: false;
  error: string;
  code?: string;
  details?: Record<string, any>;
}

export type ApiResponse<T> = ApiSuccessResponse<T> | ApiErrorResponse;

// ==================== REQUEST/RESPONSE ====================

export interface HealthCheckResponse {
  status: 'healthy' | 'unhealthy';
  timestamp: string;
  uptime: number;
  environment: string;
  database?: {
    status: string;
  };
}

export interface ProfileResponse {
  user: UserPublic;
  timestamp: string;
}

export interface StatusResponse {
  status: 'online';
  user: UserPublic & { authenticatedAt: string };
  server: {
    uptime: number;
    environment: string;
    timestamp: string;
  };
}

// ==================== ADMIN TYPES ====================

export interface AdminDashboardStats {
  totalUsers: number;
  activeUsers: number;
  totalNotes: number;
  lastLogin: Date;
}

export interface UpdateUserRequest {
  userId: number;
  role?: UserRole;
  status?: UserStatus;
}

// ==================== LOGGER TYPES ====================

export type LogLevel = 'DEBUG' | 'INFO' | 'WARN' | 'ERROR' | 'CRITICAL';

export interface LogEntry {
  timestamp: string;
  level: LogLevel;
  module: string;
  message: string;
  [key: string]: any;
}

// ==================== CACHE TYPES ====================

export interface CacheOptions {
  ttl?: number; // seconds
  tags?: string[];
}

export interface CacheItem<T> {
  value: T;
  expiresAt: number;
}

// ==================== QUEUE TYPES ====================

export interface QueueJob<T> {
  id: string;
  data: T;
  status: 'pending' | 'processing' | 'completed' | 'failed';
  attempts: number;
  createdAt: Date;
  completedAt?: Date;
}

export interface EmailJobData {
  email: string;
  subject: string;
  body: string;
  userId?: number;
}

export interface NotificationJobData {
  userId: number;
  type: 'note_created' | 'note_updated' | 'user_mentioned';
  message: string;
}

// ==================== ERROR TYPES ====================

export class CustomError extends Error {
  constructor(
    public statusCode: number,
    public code: string,
    message: string,
    public details?: Record<string, any>
  ) {
    super(message);
    Object.setPrototypeOf(this, CustomError.prototype);
  }
}

export class ValidationError extends CustomError {
  constructor(message: string, details?: Record<string, any>) {
    super(400, 'VALIDATION_ERROR', message, details);
  }
}

export class AuthenticationError extends CustomError {
  constructor(message: string = 'Não autenticado') {
    super(401, 'AUTHENTICATION_ERROR', message);
  }
}

export class AuthorizationError extends CustomError {
  constructor(message: string = 'Acesso negado') {
    super(403, 'AUTHORIZATION_ERROR', message);
  }
}

export class NotFoundError extends CustomError {
  constructor(resource: string) {
    super(404, 'NOT_FOUND', `${resource} não encontrado`);
  }
}

export class ConflictError extends CustomError {
  constructor(message: string) {
    super(409, 'CONFLICT', message);
  }
}

// ==================== ENVIRONMENT TYPES ====================

export interface EnvironmentConfig {
  NODE_ENV: 'development' | 'staging' | 'production';
  PORT: number;
  LOG_LEVEL: LogLevel;
  
  // Database
  POSTGRES_USER: string;
  POSTGRES_PASSWORD: string;
  POSTGRES_DB: string;
  POSTGRES_HOST: string;
  POSTGRES_PORT: number;
  
  // Redis
  REDIS_HOST: string;
  REDIS_PORT: number;
  REDIS_PASSWORD?: string;
  
  // JWT
  JWT_SECRET: string;
  JWT_EXPIRY: string;
  REFRESH_TOKEN_EXPIRY: string;
  
  // App
  FRONTEND_URL: string;
  ALLOWED_ORIGINS: string[];
}

// ==================== ROUTE CONTEXT ====================

export interface RequestContext {
  user?: AuthPayload;
  ip: string;
  userAgent: string;
  requestId: string;
  startTime: number;
}

// Type guard functions
export function isUser(obj: any): obj is User {
  return obj && typeof obj.id === 'number' && typeof obj.email === 'string';
}

export function isAuthPayload(obj: any): obj is AuthPayload {
  return obj && typeof obj.id === 'number' && typeof obj.email === 'string';
}

export function isValidationError(err: any): err is ValidationError {
  return err instanceof CustomError && err.code === 'VALIDATION_ERROR';
}
