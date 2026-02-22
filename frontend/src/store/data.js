import { create } from 'zustand';
import { reportsAPI, saasAPI } from '../api/client';

export const useReportsStore = create((set, get) => ({
  // State
  readingReport: null,
  collectionsReport: null,
  reviewsReport: null,
  achievementsReport: null,
  socialReport: null,
  loading: false,
  error: null,

  // Actions
  fetchReadingReport: async () => {
    set({ loading: true, error: null });
    try {
      const response = await reportsAPI.getReadingReport();
      const readingReport = response.data;
      set({ readingReport, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchCollectionsReport: async () => {
    set({ loading: true, error: null });
    try {
      const response = await reportsAPI.getCollectionsReport();
      const collectionsReport = response.data;
      set({ collectionsReport, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchReviewsReport: async () => {
    set({ loading: true, error: null });
    try {
      const response = await reportsAPI.getReviewsReport();
      const reviewsReport = response.data;
      set({ reviewsReport, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchAchievementsReport: async () => {
    set({ loading: true, error: null });
    try {
      const response = await reportsAPI.getAchievementsReport();
      const achievementsReport = response.data;
      set({ achievementsReport, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchSocialReport: async () => {
    set({ loading: true, error: null });
    try {
      const response = await reportsAPI.getSocialReport();
      const socialReport = response.data;
      set({ socialReport, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchAllReports: async () => {
    set({ loading: true, error: null });
    try {
      await Promise.all([
        get().fetchReadingReport(),
        get().fetchCollectionsReport(),
        get().fetchReviewsReport(),
        get().fetchAchievementsReport(),
        get().fetchSocialReport(),
      ]);
      set({ loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  exportReport: async (format = 'pdf', report_type = 'reading') => {
    try {
      const response = await reportsAPI.exportReport(format, report_type);
      return response.data;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  clearError: () => set({ error: null }),
}));

export const useSaasStore = create((set, get) => ({
  // State
  workspace: null,
  subscription: null,
  usage: null,
  members: [],
  analytics: null,
  loading: false,
  error: null,

  // Actions
  fetchWorkspace: async () => {
    set({ loading: true, error: null });
    try {
      const response = await saasAPI.getWorkspace();
      const workspace = response.data;
      set({ workspace, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  updateWorkspace: async (data) => {
    set({ loading: true, error: null });
    try {
      const response = await saasAPI.updateWorkspace(data);
      const workspace = response.data;
      set({ workspace, loading: false });
      return workspace;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  fetchSubscription: async () => {
    set({ loading: true, error: null });
    try {
      const response = await saasAPI.getSubscription();
      const subscription = response.data;
      set({ subscription, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  upgradeSubscription: async (planId) => {
    set({ loading: true, error: null });
    try {
      const response = await saasAPI.upgradeSubscription(planId);
      const subscription = response.data;
      set({ subscription, loading: false });
      return subscription;
    } catch (error) {
      set({ error: error.message, loading: false });
      throw error;
    }
  },

  fetchUsage: async () => {
    set({ loading: true, error: null });
    try {
      const response = await saasAPI.getUsage();
      const usage = response.data;
      set({ usage, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchMembers: async () => {
    set({ loading: true, error: null });
    try {
      const response = await saasAPI.getMembers();
      const members = response.data.members || response.data;
      set({ members, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  fetchAnalytics: async () => {
    set({ loading: true, error: null });
    try {
      const response = await saasAPI.getAnalytics();
      const analytics = response.data;
      set({ analytics, loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  inviteMember: async (email, role) => {
    try {
      const response = await saasAPI.inviteMember(email, role);
      await get().fetchMembers();
      return response.data;
    } catch (error) {
      set({ error: error.message });
      throw error;
    }
  },

  fetchAllData: async () => {
    set({ loading: true, error: null });
    try {
      await Promise.all([
        get().fetchWorkspace(),
        get().fetchSubscription(),
        get().fetchUsage(),
        get().fetchMembers(),
        get().fetchAnalytics(),
      ]);
      set({ loading: false });
    } catch (error) {
      set({ error: error.message, loading: false });
    }
  },

  clearError: () => set({ error: null }),
}));
