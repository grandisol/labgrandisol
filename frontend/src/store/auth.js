import { create } from 'zustand';
import api from '../api/client';

export const useAuthStore = create((set, get) => ({
  token: sessionStorage.getItem('auth_token') || null,
  user: (() => {
    try {
      const stored = sessionStorage.getItem('auth_user');
      return stored ? JSON.parse(stored) : null;
    } catch {
      return null;
    }
  })(),
  isLoading: false,
  error: null,

  setToken: (token, user) => {
    console.log('🔐 Setting token and user:', { token: !!token, user: user?.email });
    if (token) {
      sessionStorage.setItem('auth_token', token);
      sessionStorage.setItem('auth_user', JSON.stringify(user));
    } else {
      sessionStorage.removeItem('auth_token');
      sessionStorage.removeItem('auth_user');
    }
    set({ token, user, error: null });
  },

  login: async (email, password) => {
    set({ isLoading: true, error: null });
    try {
      console.log('🔄 Attempting login for:', email);
      const { data } = await api.post('/auth/login', { email, password });
      console.log('✅ Login successful, token:', data.token?.substring(0, 20) + '...');
      get().setToken(data.token, data.user);
      return data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Erro ao fazer login';
      console.error('❌ Login failed:', errorMsg);
      set({ error: errorMsg, token: null, user: null });
      throw new Error(errorMsg);
    } finally {
      set({ isLoading: false });
    }
  },

  register: async (email, password, name) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/auth/register', { email, password, name });
      get().setToken(data.token, data.user);
      return data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Erro ao registrar';
      set({ error: errorMsg, token: null, user: null });
      throw new Error(errorMsg);
    } finally {
      set({ isLoading: false });
    }
  },

  loginMock: async (email) => {
    set({ isLoading: true, error: null });
    try {
      const { data } = await api.post('/auth/login-mock', { email });
      get().setToken(data.token, data.user);
      return data;
    } catch (err) {
      const errorMsg = err.response?.data?.error || 'Mock login failed';
      set({ error: errorMsg, token: null, user: null });
      throw new Error(errorMsg);
    } finally {
      set({ isLoading: false });
    }
  },

  logout: () => {
    sessionStorage.removeItem('auth_token');
    sessionStorage.removeItem('auth_user');
    set({ token: null, user: null, error: null });
  }
}));
