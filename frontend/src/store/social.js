import { create } from 'zustand';
import { socialAPI } from '../api/client';

export const useSocialStore = create((set, get) => ({
  // State
  feed: [],
  followers: [],
  following: [],
  trending: [],
  stats: {
    followers_count: 0,
    following_count: 0,
    engagement_score: 0,
  },
  loading: false,
  error: null,

  // Actions
  fetchFeed: async () => {
    set({ loading: true, error: null });
    try {
      const response = await socialAPI.getFeed(10, 0);
      const feed = response.data.feed || response.data;
      set({ feed, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchFollowers: async () => {
    set({ loading: true, error: null });
    try {
      const response = await socialAPI.getFollowers(20, 0);
      const followers = response.data.followers || response.data;
      set({ followers, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchFollowing: async () => {
    set({ loading: true, error: null });
    try {
      const response = await socialAPI.getFollowing(20, 0);
      const following = response.data.following || response.data;
      set({ following, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchTrendingActivities: async () => {
    set({ loading: true, error: null });
    try {
      const response = await socialAPI.getTrendingActivities();
      const trending = response.data.trending || response.data;
      set({ trending, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchStats: async () => {
    set({ loading: true, error: null });
    try {
      const response = await socialAPI.getStats();
      const stats = response.data;
      set({ stats, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  followUser: async (userId) => {
    try {
      await socialAPI.followUser(userId);
      const following = [...get().following, { id: userId }];
      const stats = { ...get().stats, following_count: following.length };
      set({ following, stats });
    } catch (error) {
      set({ error: error.message });
    }
  },

  unfollowUser: async (userId) => {
    try {
      await socialAPI.unfollowUser(userId);
      const following = get().following.filter(u => u.id !== userId);
      const stats = { ...get().stats, following_count: following.length };
      set({ following, stats });
    } catch (error) {
      set({ error: error.message });
    }
  },

  addFeedItem: (item) => {
    const feed = [item, ...get().feed];
    set({ feed });
  },

  clearError: () => set({ error: null }),
}));
