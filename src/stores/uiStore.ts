import { create } from 'zustand';
import { persist } from 'zustand/middleware';

type Theme = 'light' | 'dark';
type Language = 'zh-CN' | 'en-US';
export type UiStyle = 'enterprise' | 'modern' | 'developer';
export type LayoutMode = 'classic' | 'modern';

interface UiState {
  // 侧边栏
  sidebarCollapsed: boolean;
  toggleSidebar: () => void;
  setSidebarCollapsed: (collapsed: boolean) => void;

  // 主题
  theme: Theme;
  setTheme: (theme: Theme) => void;

  // 布局模式
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;

  // 全局加载
  globalLoading: boolean;
  setGlobalLoading: (loading: boolean) => void;

  // 语言
  language: Language;
  setLanguage: (language: Language) => void;

  // 通知中心
  notificationVisible: boolean;
  notificationCount: number;
  setNotificationVisible: (visible: boolean) => void;
  setNotificationCount: (count: number) => void;
  incrementNotification: () => void;

  // UI 风格 (用于预览)
  uiStyle: UiStyle;
  setUiStyle: (style: UiStyle) => void;
}

export const useUiStore = create<UiState>()(
  persist(
    (set) => ({
      // 侧边栏
      sidebarCollapsed: false,
      toggleSidebar: () => set((state) => ({ sidebarCollapsed: !state.sidebarCollapsed })),
      setSidebarCollapsed: (collapsed) => set({ sidebarCollapsed: collapsed }),

      // 主题
      theme: 'dark',
      setTheme: (theme) => set({ theme }),

      // 布局模式
      layoutMode: 'classic',
      setLayoutMode: (mode) => set({ layoutMode: mode }),

      // 全局加载
      globalLoading: false,
      setGlobalLoading: (loading) => set({ globalLoading: loading }),

      // 语言
      language: 'zh-CN',
      setLanguage: (language) => set({ language }),

      // 通知中心
      notificationVisible: false,
      notificationCount: 0,
      setNotificationVisible: (visible) => set({ notificationVisible: visible }),
      setNotificationCount: (count) => set({ notificationCount: count }),
      incrementNotification: () => set((state) => ({ notificationCount: state.notificationCount + 1 })),

      // UI 风格
      uiStyle: 'enterprise',
      setUiStyle: (style) => set({ uiStyle: style }),
    }),
    {
      name: 'ui-store',
      partialize: (state) => ({
        theme: state.theme,
        language: state.language,
        layoutMode: state.layoutMode,
        sidebarCollapsed: state.sidebarCollapsed,
        uiStyle: state.uiStyle,
      }),
    },
  ),
);
