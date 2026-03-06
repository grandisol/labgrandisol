import axios from 'axios';

// Configurações
const API_CONFIG = {
  baseURL: '/api',
  timeout: 15000,
  retries: 3,
  retryDelay: 1000,
};

// Cache simples em memória
const cache = new Map();
const CACHE_TTL = 5 * 60 * 1000; // 5 minutos

// Criar instância do Axios
const api = axios.create({
  baseURL: API_CONFIG.baseURL,
  timeout: API_CONFIG.timeout,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de requisição
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  
  // Adicionar timestamp para evitar cache do navegador em GETs
  if (config.method === 'get') {
    config.params = { ...config.params, _t: Date.now() };
  }
  
  return config;
});

// Interceptor de resposta com retry logic
api.interceptors.response.use(
  (response) => {
    // Invalidar cache relacionado após mutation
    const method = response.config.method;
    if (['post', 'put', 'patch', 'delete'].includes(method)) {
      clearCacheByPattern(response.config.url);
    }
    return response;
  },
  async (error) => {
    const originalRequest = error.config;
    
    // Retry para erros de rede ou 5xx
    if (
      !originalRequest._retry &&
      (error.code === 'ECONNABORTED' || 
       error.code === 'ERR_NETWORK' ||
       (error.response?.status >= 500 && error.response?.status < 600))
    ) {
      originalRequest._retry = true;
      originalRequest._retryCount = originalRequest._retryCount || 0;
      
      if (originalRequest._retryCount < API_CONFIG.retries) {
        originalRequest._retryCount++;
        await new Promise(resolve => setTimeout(resolve, API_CONFIG.retryDelay * originalRequest._retryCount));
        return api(originalRequest);
      }
    }
    
    // Tratamento de 401
    const isApiRoute = error.config?.url?.startsWith('/api');
    const isAuthRoute = error.config?.url?.includes('/auth/');
    
    if (error.response?.status === 401 && isApiRoute && !isAuthRoute) {
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_user');
      
      // Disparar evento customizado para o app reagir
      window.dispatchEvent(new CustomEvent('auth:expired'));
      
      // Redirecionar após pequeno delay
      setTimeout(() => {
        if (!window.location.pathname.includes('/login')) {
          window.location.href = '/login';
        }
      }, 100);
    }
    
    // Formatar erro para uso nos componentes
    const formattedError = {
      message: error.response?.data?.error || error.message || 'Erro desconhecido',
      code: error.response?.data?.code || error.code || 'UNKNOWN_ERROR',
      status: error.response?.status,
      details: error.response?.data?.details || null,
    };
    
    return Promise.reject(formattedError);
  }
);

// Funções de cache
function getCacheKey(url, params) {
  return `${url}:${JSON.stringify(params || {})}`;
}

function getFromCache(key) {
  const cached = cache.get(key);
  if (cached && Date.now() - cached.timestamp < CACHE_TTL) {
    return cached.data;
  }
  cache.delete(key);
  return null;
}

function setCache(key, data) {
  cache.set(key, { data, timestamp: Date.now() });
}

function clearCacheByPattern(pattern) {
  for (const key of cache.keys()) {
    if (key.startsWith(pattern)) {
      cache.delete(key);
    }
  }
}

// Wrapper com cache para GETs
const cachedGet = async (url, params = {}, options = {}) => {
  if (options.skipCache) {
    return api.get(url, { params });
  }
  
  const cacheKey = getCacheKey(url, params);
  const cached = getFromCache(cacheKey);
  
  if (cached) {
    return cached;
  }
  
  const response = await api.get(url, { params });
  setCache(cacheKey, response);
  return response;
};

export default api;

// ==================== AUTH ====================
export const authAPI = {
  loginMock: (email) => api.post('/auth/login-mock', { email }),
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (email, password, name) => api.post('/auth/register', { email, password, name }),
  refresh: (refreshToken) => api.post('/auth/refresh', { refreshToken }),
  logout: () => api.post('/auth/logout'),
};

// ==================== LIBRARY ====================
export const libraryAPI = {
  getAllBooks: (limit = 20, offset = 0, options = {}) => 
    cachedGet('/library/books', { limit, offset }, options),
  getBookDetail: (id) => cachedGet(`/library/books/${id}`),
  getCategories: (options = {}) => cachedGet('/library/categories', {}, options),
  getReadingList: () => api.get('/library/reading-list'),
  addToReadingList: (bookId, status) => api.post('/library/reading-list', { book_id: bookId, status }),
  removeFromReadingList: (itemId) => api.delete(`/library/reading-list/${itemId}`),
  borrowBook: (bookId) => api.post('/library/loans', { book_id: bookId }),
  returnBook: (loanId) => api.put(`/library/loans/${loanId}/return`),
  renewLoan: (loanId) => api.put(`/library/loans/${loanId}/renew`),
  submitRating: (bookId, rating, review) => api.post('/library/ratings', { book_id: bookId, rating, review }),
  getMyLoans: (options = {}) => cachedGet('/library/loans', {}, options),
};

// ==================== ADVANCED LIBRARY ====================
export const advancedLibraryAPI = {
  getCollections: (options = {}) => cachedGet('/advanced/collections', {}, options),
  createCollection: (name, description, color, icon, is_public) =>
    api.post('/advanced/collections', { name, description, color, icon, is_public }),
  updateCollection: (id, data) => api.put(`/advanced/collections/${id}`, data),
  deleteCollection: (id) => api.delete(`/advanced/collections/${id}`),

  getStatistics: (options = {}) => cachedGet('/advanced/statistics', {}, options),
  updateStatistics: (data) => api.put('/advanced/statistics', data),
  getAchievements: (options = {}) => cachedGet('/advanced/achievements', {}, options),
  getRecommendations: (limit = 5) => cachedGet('/advanced/recommendations', { limit }),

  getReviews: (sort = 'date', order = 'desc', limit = 10, offset = 0) =>
    cachedGet('/advanced/reviews', { sort, order, limit, offset }),
  createReview: (bookId, rating, title, content, reading_status, spoiler_warning) =>
    api.post('/advanced/reviews', { book_id: bookId, rating, title, content, reading_status, spoiler_warning }),

  getShelves: (options = {}) => cachedGet('/advanced/shelves', {}, options),
  getShelfBooks: (shelfName, limit = 10, offset = 0) =>
    cachedGet(`/advanced/shelves/${shelfName}/books`, { limit, offset }),

  getTags: (sort = 'popularity', limit = 20) => cachedGet('/advanced/tags', { sort, limit }),
  getBookTags: (bookId) => cachedGet(`/advanced/books/${bookId}/tags`),
};

// ==================== MUSEUM ====================
export const museumAPI = {
  getSpecies: (params = {}) => cachedGet('/museum/species', params),
  getFamilies: (params = {}) => cachedGet('/museum/families', params),
  getExpeditions: (params = {}) => cachedGet('/museum/expeditions', params),
  getEvents: (params = {}) => cachedGet('/museum/events', params),
  getSpeciesDetail: (id) => cachedGet(`/museum/species/${id}`),
};

// ==================== SaaS ====================
export const saasAPI = {
  getWorkspace: (options = {}) => cachedGet('/saas/workspace', {}, options),
  updateWorkspace: (data) => api.put('/saas/workspace', data),
  getSubscription: (options = {}) => cachedGet('/saas/subscription', {}, options),
  upgradeSubscription: (planId) => api.post('/saas/subscription/upgrade', { plan_id: planId }),
  getUsage: (options = {}) => cachedGet('/saas/usage', {}, options),
  inviteMember: (email, role) => api.post('/saas/invite-member', { email, role }),
  getMembers: (options = {}) => cachedGet('/saas/members', {}, options),
  getAnalytics: (options = {}) => cachedGet('/saas/analytics', {}, options),
};

// ==================== NOTIFICATIONS ====================
export const notificationsAPI = {
  getNotifications: (params = {}) => api.get('/notifications', { params }),
  getNotification: (id) => api.get(`/notifications/${id}`),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/mark-all/read'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
  deleteOldNotifications: () => api.delete('/notifications/delete-old/all'),
};

// ==================== SEARCH ====================
export const searchAPI = {
  globalSearch: (params) => api.get('/search', { params }),
  advancedSearch: (query, limit = 10, offset = 0) =>
    api.get('/search/advanced', { params: { query, limit, offset } }),
  getSuggestions: (q, type = 'all', limit = 5) =>
    cachedGet('/search/suggestions', { q, type, limit }),
  getTrending: (options = {}) => cachedGet('/search/trending', {}, options),
};

// ==================== SOCIAL ====================
export const socialAPI = {
  getFollowers: (limit = 20, offset = 0) => cachedGet('/social/followers', { limit, offset }),
  getFollowing: (limit = 20, offset = 0) => cachedGet('/social/following', { limit, offset }),
  followUser: (userId) => api.post(`/social/follow/${userId}`),
  unfollowUser: (userId) => api.delete(`/social/unfollow/${userId}`),
  getFeed: (params = {}) => api.get('/social/feed', { params }),
  getTrendingActivities: (options = {}) => cachedGet('/social/feed/trending', {}, options),
  getStats: (options = {}) => cachedGet('/social/stats', {}, options),
};

// ==================== REPORTS ====================
export const reportsAPI = {
  getReadingReport: (params = {}) => cachedGet('/reports/reading', params),
  getCollectionsReport: (options = {}) => cachedGet('/reports/collections', {}, options),
  getReviewsReport: (options = {}) => cachedGet('/reports/reviews', {}, options),
  getAchievementsReport: (options = {}) => cachedGet('/reports/achievements', {}, options),
  getSocialReport: (options = {}) => cachedGet('/reports/social', {}, options),
  exportReport: (format = 'pdf', report_type = 'reading') =>
    api.get(`/reports/export/${format}`, { params: { report_type }, responseType: 'blob' }),
};

// ==================== ADMIN ====================
export const adminAPI = {
  getDashboard: (options = {}) => cachedGet('/admin/dashboard', {}, options),
  getUsers: (limit = 20, offset = 0) => cachedGet('/admin/users', { limit, offset }),
  getUser: (id) => cachedGet(`/admin/users/${id}`),
  updateUser: (id, data) => api.put(`/admin/users/${id}`, data),
  deleteUser: (id) => api.delete(`/admin/users/${id}`),
  createNote: (title, content) => api.post('/admin/notes', { title, content }),
  getNotes: (options = {}) => cachedGet('/admin/notes', {}, options),
  updateNote: (id, data) => api.put(`/admin/notes/${id}`, data),
  deleteNote: (id) => api.delete(`/admin/notes/${id}`),
  getSettings: (options = {}) => cachedGet('/admin/settings', {}, options),
  updateSettings: (data) => api.put('/admin/settings', data),
};

// ==================== READING TRACKER ====================
export const readingAPI = {
  getProgress: (options = {}) => cachedGet('/reading/progress', {}, options),
  startTracking: (bookId, currentPage, totalPages, notes) => 
    api.post('/reading/progress', { book_id: bookId, current_page: currentPage, total_pages: totalPages, notes }),
  updateProgress: (bookId, currentPage, notes, completed) => 
    api.put(`/reading/progress/${bookId}`, { current_page: currentPage, notes, completed }),
  
  getSessions: (options = {}) => cachedGet('/reading/sessions', {}, options),
  logSession: (bookId, startPage, endPage, durationMinutes, notes) => 
    api.post('/reading/sessions', { 
      book_id: bookId, 
      start_page: startPage, 
      end_page: endPage, 
      duration_minutes: durationMinutes, 
      notes 
    }),
  
  getGoals: (options = {}) => cachedGet('/reading/goals', {}, options),
  updateGoals: (dailyPages, weeklyBooks, monthlyBooks) => 
    api.put('/reading/goals', { daily_pages: dailyPages, weekly_books: weeklyBooks, monthly_books: monthlyBooks }),
  
  getStats: (options = {}) => cachedGet('/reading/stats', {}, options),
};

// ==================== HEALTH ====================
export const healthAPI = {
  check: () => api.get('/health'),
};

// Utilitários exportados
export const apiUtils = {
  clearCache: () => cache.clear(),
  clearCacheFor: (pattern) => clearCacheByPattern(pattern),
};
