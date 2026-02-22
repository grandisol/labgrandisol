import axios from 'axios';

const api = axios.create({
  baseURL: '/api',
  timeout: 10000,
  headers: {
    'Content-Type': 'application/json',
  },
});

// Interceptor de requisição para adicionar token
api.interceptors.request.use((config) => {
  const token = sessionStorage.getItem('auth_token');
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// Interceptor de resposta para tratamento de erros
api.interceptors.response.use(
  (response) => response,
  (error) => {
    if (error.response?.status === 401) {
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_user');
      setTimeout(() => {
        window.location.href = '/login';
      }, 100);
    }
    return Promise.reject(error);
  }
);

export default api;

// ==================== AUTH ====================
export const authAPI = {
  loginMock: (email) => api.post('/auth/login-mock', { email }),
  login: (email, password) => api.post('/auth/login', { email, password }),
  register: (email, password, name) => api.post('/auth/register', { email, password, name }),
};

// ==================== LIBRARY ====================
export const libraryAPI = {
  getAllBooks: (limit = 20, offset = 0) => api.get('/library/books', { params: { limit, offset } }),
  getBookDetail: (id) => api.get(`/library/books/${id}`),
  getCategories: () => api.get('/library/categories'),
  getReadingList: () => api.get('/library/reading-list'),
  addToReadingList: (bookId, status) => api.post('/library/reading-list', { book_id: bookId, status }),
  removeFromReadingList: (itemId) => api.delete(`/library/reading-list/${itemId}`),
  borrowBook: (bookId) => api.post('/library/loans', { book_id: bookId }),
  submitRating: (bookId, rating, review) => api.post('/library/ratings', { book_id: bookId, rating, review }),
  getMyLoans: () => api.get('/library/loans'),
};

// ==================== ADVANCED LIBRARY ====================
export const advancedLibraryAPI = {
  // Collections
  getCollections: () => api.get('/advanced/collections'),
  createCollection: (name, description, color, icon, is_public) =>
    api.post('/advanced/collections', { name, description, color, icon, is_public }),
  updateCollection: (id, data) => api.put(`/advanced/collections/${id}`, data),
  deleteCollection: (id) => api.delete(`/advanced/collections/${id}`),

  // Statistics
  getStatistics: () => api.get('/advanced/statistics'),
  updateStatistics: (data) => api.put('/advanced/statistics', data),

  // Achievements
  getAchievements: () => api.get('/advanced/achievements'),

  // Recommendations
  getRecommendations: (limit = 5) => api.get('/advanced/recommendations', { params: { limit } }),

  // Reviews
  getReviews: (sort = 'date', order = 'desc', limit = 10, offset = 0) =>
    api.get('/advanced/reviews', { params: { sort, order, limit, offset } }),
  createReview: (bookId, rating, title, content, reading_status, spoiler_warning) =>
    api.post('/advanced/reviews', { book_id: bookId, rating, title, content, reading_status, spoiler_warning }),

  // Shelves
  getShelves: () => api.get('/advanced/shelves'),
  getShelfBooks: (shelfName, limit = 10, offset = 0) =>
    api.get(`/advanced/shelves/${shelfName}/books`, { params: { limit, offset } }),

  // Tags
  getTags: (sort = 'popularity', limit = 20) => api.get('/advanced/tags', { params: { sort, limit } }),
  getBookTags: (bookId) => api.get(`/advanced/books/${bookId}/tags`),
};

// ==================== SaaS ====================
export const saasAPI = {
  getWorkspace: () => api.get('/saas/workspace'),
  updateWorkspace: (data) => api.put('/saas/workspace', data),
  getSubscription: () => api.get('/saas/subscription'),
  upgradeSubscription: (planId) => api.post('/saas/subscription/upgrade', { plan_id: planId }),
  getUsage: () => api.get('/saas/usage'),
  inviteMember: (email, role) => api.post('/saas/invite-member', { email, role }),
  getMembers: () => api.get('/saas/members'),
  getAnalytics: () => api.get('/saas/analytics'),
};

// ==================== NOTIFICATIONS ====================
export const notificationsAPI = {
  getNotifications: (unread_only = false, type = null, limit = 20, offset = 0) =>
    api.get('/notifications', { params: { unread_only, type, limit, offset } }),
  getNotification: (id) => api.get(`/notifications/${id}`),
  markAsRead: (id) => api.put(`/notifications/${id}/read`),
  markAllAsRead: () => api.put('/notifications/mark-all/read'),
  deleteNotification: (id) => api.delete(`/notifications/${id}`),
  deleteOldNotifications: () => api.delete('/notifications/delete-old/all'),
};

// ==================== SEARCH ====================
export const searchAPI = {
  globalSearch: (q, filter_type = 'all', genre = null, author = null, min_rating = 0, max_rating = 5, sort_by = 'relevance', limit = 10, offset = 0) =>
    api.get('/search', { params: { q, filter_type, genre, author, min_rating, max_rating, sort_by, limit, offset } }),
  advancedSearch: (query, limit = 10, offset = 0) =>
    api.get('/search/advanced', { params: { query, limit, offset } }),
  getSuggestions: (q, type = 'all', limit = 5) =>
    api.get('/search/suggestions', { params: { q, type, limit } }),
  getTrending: () => api.get('/search/trending'),
};

// ==================== SOCIAL ====================
export const socialAPI = {
  getFollowers: (limit = 20, offset = 0) => api.get('/social/followers', { params: { limit, offset } }),
  getFollowing: (limit = 20, offset = 0) => api.get('/social/following', { params: { limit, offset } }),
  followUser: (userId) => api.post(`/social/follow/${userId}`),
  unfollowUser: (userId) => api.delete(`/social/unfollow/${userId}`),
  getFeed: (limit = 10, offset = 0, filter = null) => api.get('/social/feed', { params: { limit, offset, filter } }),
  getTrendingActivities: () => api.get('/social/feed/trending'),
  getStats: () => api.get('/social/stats'),
};

// ==================== REPORTS ====================
export const reportsAPI = {
  getReadingReport: (start_date = null, end_date = null) =>
    api.get('/reports/reading', { params: { start_date, end_date } }),
  getCollectionsReport: () => api.get('/reports/collections'),
  getReviewsReport: () => api.get('/reports/reviews'),
  getAchievementsReport: () => api.get('/reports/achievements'),
  getSocialReport: () => api.get('/reports/social'),
  exportReport: (format = 'pdf', report_type = 'reading') =>
    api.get(`/reports/export/${format}`, { params: { report_type } }),
};

// ==================== ADMIN ====================
export const adminAPI = {
  getDashboard: () => api.get('/admin/dashboard'),
  getUsers: (limit = 20, offset = 0) => api.get('/admin/users', { params: { limit, offset } }),
  createNote: (title, content) => api.post('/admin/notes', { title, content }),
  getNotes: () => api.get('/admin/notes'),
};

// ==================== HEALTH ====================
export const healthAPI = {
  check: () => api.get('/health'),
};
