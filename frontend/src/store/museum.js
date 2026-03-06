import { create } from 'zustand';
import api from '../api/client';

const useMuseumStore = create((set, get) => ({
  // Data
  museumInfo: null,
  collections: [],
  items: [],
  exhibitions: [],
  events: [],
  tours: [],
  selectedItem: null,
  selectedCollection: null,
  selectedExhibition: null,
  searchResults: null,
  
  // Loading states
  isLoading: false,
  isLoadingItem: false,
  isLoadingCollection: false,
  isLoadingExhibition: false,
  isSearching: false,
  
  // Filters
  categoryFilter: '',
  searchQuery: '',
  sortBy: 'views',
  
  // Pagination
  totalItems: 0,
  totalCollections: 0,
  currentPage: 1,
  
  // Errors
  error: null,

  // Actions
  fetchMuseumInfo: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/museum');
      set({ museumInfo: response.data, isLoading: false });
    } catch (error) {
      set({ error: error.response?.data?.error || 'Erro ao carregar informações do museu', isLoading: false });
    }
  },

  fetchCollections: async (category, featured) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (category) params.append('category', category);
      if (featured) params.append('featured', 'true');
      
      const response = await api.get(`/museum/collections?${params.toString()}`);
      set({ 
        collections: response.data.collections, 
        totalCollections: response.data.total,
        isLoading: false 
      });
    } catch (error) {
      set({ error: error.response?.data?.error || 'Erro ao carregar coleções', isLoading: false });
    }
  },

  fetchCollection: async (id) => {
    set({ isLoadingCollection: true, error: null });
    try {
      const response = await api.get(`/museum/collections/${id}`);
      set({ 
        selectedCollection: response.data,
        isLoadingCollection: false 
      });
    } catch (error) {
      set({ error: error.response?.data?.error || 'Erro ao carregar coleção', isLoadingCollection: false });
    }
  },

  fetchItems: async (collectionId, featured) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (collectionId) params.append('collectionId', collectionId);
      if (featured) params.append('featured', 'true');
      params.append('sortBy', get().sortBy);
      
      const response = await api.get(`/museum/items?${params.toString()}`);
      set({ 
        items: response.data.items, 
        totalItems: response.data.total,
        isLoading: false 
      });
    } catch (error) {
      set({ error: error.response?.data?.error || 'Erro ao carregar itens', isLoading: false });
    }
  },

  fetchItem: async (id) => {
    set({ isLoadingItem: true, error: null });
    try {
      const response = await api.get(`/museum/items/${id}`);
      set({ 
        selectedItem: response.data,
        isLoadingItem: false 
      });
    } catch (error) {
      set({ error: error.response?.data?.error || 'Erro ao carregar item', isLoadingItem: false });
    }
  },

  fetchExhibitions: async (status) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (status) params.append('status', status);
      
      const response = await api.get(`/museum/exhibitions?${params.toString()}`);
      set({ 
        exhibitions: response.data.exhibitions, 
        isLoading: false 
      });
    } catch (error) {
      set({ error: error.response?.data?.error || 'Erro ao carregar exposições', isLoading: false });
    }
  },

  fetchExhibition: async (id) => {
    set({ isLoadingExhibition: true, error: null });
    try {
      const response = await api.get(`/museum/exhibitions/${id}`);
      set({ 
        selectedExhibition: response.data,
        isLoadingExhibition: false 
      });
    } catch (error) {
      set({ error: error.response?.data?.error || 'Erro ao carregar exposição', isLoadingExhibition: false });
    }
  },

  fetchEvents: async (type) => {
    set({ isLoading: true, error: null });
    try {
      const params = new URLSearchParams();
      if (type) params.append('type', type);
      
      const response = await api.get(`/museum/events?${params.toString()}`);
      set({ 
        events: response.data.events, 
        isLoading: false 
      });
    } catch (error) {
      set({ error: error.response?.data?.error || 'Erro ao carregar eventos', isLoading: false });
    }
  },

  fetchTours: async () => {
    set({ isLoading: true, error: null });
    try {
      const response = await api.get('/museum/tours');
      set({ 
        tours: response.data.tours, 
        isLoading: false 
      });
    } catch (error) {
      set({ error: error.response?.data?.error || 'Erro ao carregar tours', isLoading: false });
    }
  },

  search: async (query) => {
    if (!query.trim()) {
      set({ searchResults: null, isSearching: false });
      return;
    }
    
    set({ isSearching: true, error: null });
    try {
      const response = await api.get(`/museum/search?q=${encodeURIComponent(query)}`);
      set({ 
        searchResults: response.data,
        searchQuery: query,
        isSearching: false 
      });
    } catch (error) {
      set({ error: error.response?.data?.error || 'Erro na busca', isSearching: false });
    }
  },

  likeItem: async (id) => {
    try {
      const response = await api.post(`/museum/items/${id}/like`);
      const { selectedItem, items } = get();
      
      if (selectedItem && selectedItem.id === id) {
        set({ 
          selectedItem: { ...selectedItem, likes: response.data.likes } 
        });
      }
      
      const updatedItems = items.map(item => 
        item.id === id ? { ...item, likes: response.data.likes } : item
      );
      set({ items: updatedItems });
    } catch (error) {
      set({ error: error.response?.data?.error || 'Erro ao curtir item' });
    }
  },

  registerEvent: async (id) => {
    try {
      const response = await api.post(`/museum/events/${id}/register`);
      const { events } = get();
      
      const updatedEvents = events.map(event => 
        event.id === id ? { ...event, registered: event.registered + 1 } : event
      );
      set({ events: updatedEvents });
      
      return response.data;
    } catch (error) {
      set({ error: error.response?.data?.error || 'Erro ao registrar no evento' });
      throw error;
    }
  },

  setCategoryFilter: (category) => {
    set({ categoryFilter: category, currentPage: 1 });
  },

  setSortBy: (sortBy) => {
    set({ sortBy, currentPage: 1 });
  },

  setSearchQuery: (query) => {
    set({ searchQuery: query });
  },

  clearSelections: () => {
    set({ 
      selectedItem: null, 
      selectedCollection: null, 
      selectedExhibition: null,
      searchResults: null,
      searchQuery: ''
    });
  },

  clearErrors: () => {
    set({ error: null });
  },
}));

export default useMuseumStore;