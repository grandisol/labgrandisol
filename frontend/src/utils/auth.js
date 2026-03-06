/**
 * Utility functions for authentication
 * Centralized auth helpers to avoid code duplication
 */

/**
 * Get authentication headers from session storage
 * @param {boolean} includeContentType - Whether to include Content-Type header
 * @returns {Object} Headers object with Authorization token
 */
export function getAuthHeaders(includeContentType = false) {
  const token = sessionStorage.getItem('auth_token');
  const headers = token ? { Authorization: `Bearer ${token}` } : {};
  if (includeContentType) {
    headers['Content-Type'] = 'application/json';
  }
  return headers;
}

/**
 * Check if user is authenticated
 * @returns {boolean} True if user has a valid token
 */
export function isAuthenticated() {
  return !!sessionStorage.getItem('auth_token');
}

/**
 * Get current user from session storage
 * @returns {Object|null} User object or null
 */
export function getCurrentUser() {
  try {
    const stored = sessionStorage.getItem('auth_user');
    return stored ? JSON.parse(stored) : null;
  } catch {
    return null;
  }
}

/**
 * Clear authentication data from session storage
 */
export function clearAuth() {
  sessionStorage.removeItem('auth_token');
  sessionStorage.removeItem('auth_user');
}