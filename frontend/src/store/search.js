import { create } from 'zustand';
import { searchAPI } from '../api/client';

export const useSearchStore = create((set, get) => ({
  // State
  results: [],
  suggestions: [],
  trending: [],
  query: '',
  loading: false,
  error: null,
  filters: {
    genre: null,
    author: null,
    minRating: 0,
    maxRating: 5,
    sortBy: 'relevance',
  },

  // Actions
  globalSearch: async (q, filterType = 'all') => {
    if (!q.trim()) {
      set({ results: [], query: '' });
      return;
    }
    set({ loading: true, error: null, query: q });
    try {
      const filters = get().filters;
      const response = await searchAPI.globalSearch(
        q,
        filterType,
        filters.genre,
        filters.author,
        filters.minRating,
        filters.maxRating,
        filters.sortBy
      );
      const results = response.data.rows || response.data;
      set({ results, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  getSuggestions: async (q, type = 'all') => {
    if (!q.trim()) {
      set({ suggestions: [] });
      return;
    }
    try {
      const response = await searchAPI.getSuggestions(q, type, 5);
      const suggestions = response.data.suggestions || response.data;
      set({ suggestions });
    } catch (error) {
      console.error('Error fetching suggestions:', error);
    }
  },

  getTrending: async () => {
    set({ loading: true, error: null });
    try {
      const response = await searchAPI.getTrending();
      const trending = response.data.trending || response.data;
      set({ trending, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  setFilters: (filters) => {
    set((state) => ({
      filters: { ...state.filters, ...filters },
    }));
    // Refazer busca com novos filtros se houver query
    const query = get().query;
    if (query) {
      get().globalSearch(query);
    }
  },

  clearSearch: () => {
    set({
      results: [],
      suggestions: [],
      query: '',
      error: null,
    });
  },

  clearError: () => set({ error: null }),
}));
