import { create } from 'zustand';
import { advancedLibraryAPI, libraryAPI } from '../api/client';

export const useLibraryStore = create((set, get) => ({
  // State
  books: [],
  collections: [],
  shelves: [],
  achievements: [],
  recommendations: [],
  tags: [],
  statistics: {
    total_books_read: 0,
    currently_reading: 0,
    want_to_read: 0,
    total_pages_read: 0,
    average_rating: 0,
  },
  loading: false,
  error: null,

  // Actions - Collections
  fetchCollections: async () => {
    set({ loading: true, error: null });
    try {
      const response = await advancedLibraryAPI.getCollections();
      const collections = response.data.collections || response.data;
      set({ collections, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  createCollection: async (name, description, color = '#000000', icon = 'folder', is_public = false) => {
    try {
      const response = await advancedLibraryAPI.createCollection(name, description, color, icon, is_public);
      const newCollection = response.data.collection || response.data;
      const collections = [...get().collections, newCollection];
      set({ collections });
      return newCollection;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  deleteCollection: async (id) => {
    try {
      await advancedLibraryAPI.deleteCollection(id);
      const collections = get().collections.filter(c => c.id !== id);
      set({ collections });
    } catch (error) {
      set({ error: error.message });
    }
  },

  // Actions - Shelves
  fetchShelves: async () => {
    set({ loading: true, error: null });
    try {
      const response = await advancedLibraryAPI.getShelves();
      const shelves = response.data.shelves || response.data;
      set({ shelves, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  // Actions - Achievements
  fetchAchievements: async () => {
    set({ loading: true, error: null });
    try {
      const response = await advancedLibraryAPI.getAchievements();
      const achievements = response.data.achievements || response.data;
      set({ achievements, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  // Actions - Recommendations
  fetchRecommendations: async () => {
    set({ loading: true, error: null });
    try {
      const response = await advancedLibraryAPI.getRecommendations(5);
      const recommendations = response.data.recommendations || response.data;
      set({ recommendations, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  // Actions - Statistics
  fetchStatistics: async () => {
    set({ loading: true, error: null });
    try {
      const response = await advancedLibraryAPI.getStatistics();
      const statistics = response.data.statistics || response.data;
      set({ statistics, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  // Actions - Tags
  fetchTags: async () => {
    set({ loading: true, error: null });
    try {
      const response = await advancedLibraryAPI.getTags('popularity', 20);
      const tags = response.data.tags || response.data;
      set({ tags, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  // Actions - Books
  fetchBooks: async () => {
    set({ loading: true, error: null });
    try {
      const response = await libraryAPI.getAllBooks(20, 0);
      const books = response.data.rows || response.data;
      set({ books, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  // Helper - Fetch all data
  fetchAllData: async () => {
    set({ loading: true, error: null });
    try {
      await Promise.all([
        get().fetchBooks(),
        get().fetchCollections(),
        get().fetchShelves(),
        get().fetchAchievements(),
        get().fetchRecommendations(),
        get().fetchStatistics(),
        get().fetchTags(),
      ]);
      set({ loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
