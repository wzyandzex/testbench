/**
 * Settings page store
 */

import { create } from 'zustand';
import { subscribeWithSelector } from 'zustand/middleware';
import i18next from 'i18next';
import { settingsPageService, type UserSettings } from './service';

interface SettingsState {
  // 状态
  userSettings: UserSettings | null;
  organizationSettings: any | null;
  loading: boolean;
  saving: boolean;
  error: string | null;

  // Actions
  fetchUserSettings: () => Promise<void>;
  updateUserSettings: (settings: Partial<UserSettings>) => Promise<void>;
  fetchOrganizationSettings: (organizationId: string) => Promise<void>;
  updateOrganizationSettings: (organizationId: string, settings: any) => Promise<void>;
  uploadAvatar: (file: File) => Promise<void>;
  changePassword: (data: { oldPassword: string; newPassword: string }) => Promise<void>;
  clearError: () => void;
}

export const useSettingsPageStore = create<SettingsState>()(
  subscribeWithSelector((set) => ({
    // 初始状态
    userSettings: null,
    organizationSettings: null,
    loading: false,
    saving: false,
    error: null,

    fetchUserSettings: async () => {
      set({ loading: true, error: null });
      try {
        const settings = await settingsPageService.getUserSettings();
        set({ userSettings: settings, loading: false });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : i18next.t('settings:loadFailed'),
          loading: false,
        });
      }
    },

    // Update user settings
    updateUserSettings: async (settings) => {
      set({ saving: true, error: null });
      try {
        const updated = await settingsPageService.updateUserSettings(settings);
        set({ userSettings: updated, saving: false });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : i18next.t('settings:saveFailed'),
          saving: false,
        });
        throw error;
      }
    },

    // Fetch organization settings
    fetchOrganizationSettings: async (organizationId) => {
      set({ loading: true, error: null });
      try {
        const settings = await settingsPageService.getOrganizationSettings(organizationId);
        set({ organizationSettings: settings, loading: false });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : i18next.t('settings:loadFailed'),
          loading: false,
        });
      }
    },

    // Update organization settings
    updateOrganizationSettings: async (organizationId, settings) => {
      set({ saving: true, error: null });
      try {
        const updated = await settingsPageService.updateOrganizationSettings(organizationId, settings);
        set({ organizationSettings: updated, saving: false });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : i18next.t('settings:saveFailed'),
          saving: false,
        });
        throw error;
      }
    },

    // Upload avatar
    uploadAvatar: async (file) => {
      set({ saving: true, error: null });
      try {
        await settingsPageService.uploadAvatar(file);
        set({ saving: false });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : i18next.t('settings:avatar.uploadFailed'),
          saving: false,
        });
        throw error;
      }
    },

    // Change password
    changePassword: async (data) => {
      set({ saving: true, error: null });
      try {
        await settingsPageService.changePassword(data);
        set({ saving: false });
      } catch (error) {
        set({
          error: error instanceof Error ? error.message : i18next.t('settings:modifyFailed'),
          saving: false,
        });
        throw error;
      }
    },

    // Clear error
    clearError: () => {
      set({ error: null });
    },
  }))
);

export default useSettingsPageStore;
