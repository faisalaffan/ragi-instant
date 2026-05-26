import { create } from 'zustand';
import { persist } from 'zustand/middleware';

export type Theme = 'light' | 'dark' | 'system';
export type FontSize = 'sm' | 'md' | 'lg';
export type Language = 'id' | 'en';

interface UIState {
  // Sidebar State
  sidebarExpanded: boolean;
  toggleSidebar: () => void;
  setSidebarExpanded: (expanded: boolean) => void;

  // Configuration Settings State
  theme: Theme;
  fontSize: FontSize;
  language: Language;
  apiUrl: string;
  setTheme: (theme: Theme) => void;
  setFontSize: (size: FontSize) => void;
  setLanguage: (lang: Language) => void;
  setApiUrl: (url: string) => void;
  resetAllSettings: () => void;
}

export const useUIStore = create<UIState>()(
  persist(
    (set) => ({
      // Defaults
      sidebarExpanded: true,
      theme: 'dark',
      fontSize: 'md',
      language: 'id',
      apiUrl: 'http://vps:8000',

      toggleSidebar: () => set((state) => ({ sidebarExpanded: !state.sidebarExpanded })),
      setSidebarExpanded: (expanded) => set({ sidebarExpanded: expanded }),

      setTheme: (theme) => {
        set({ theme });
        if (typeof window !== 'undefined') {
          const root = window.document.documentElement;
          root.classList.remove('light', 'dark');
          if (theme === 'system') {
            const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
            root.classList.add(systemTheme);
          } else {
            root.classList.add(theme);
          }
        }
      },

      setFontSize: (fontSize) => set({ fontSize }),
      setLanguage: (language) => set({ language }),
      
      setApiUrl: (apiUrl) => {
        set({ apiUrl });
        if (typeof window !== 'undefined') {
          localStorage.setItem('ragi-instant.settings.apiUrl', apiUrl);
        }
      },

      resetAllSettings: () => {
        if (typeof window !== 'undefined') {
          localStorage.removeItem('ragi-instant.settings.apiUrl');
        }
        set({
          sidebarExpanded: true,
          theme: 'dark',
          fontSize: 'md',
          language: 'id',
          apiUrl: 'http://vps:8000',
        });
        
        // Re-apply dark theme class
        if (typeof window !== 'undefined') {
          const root = window.document.documentElement;
          root.classList.remove('light', 'dark');
          root.classList.add('dark');
        }
      }
    }),
    {
      name: 'ragi-instant.ui-settings',
      partialize: (state) => ({
        theme: state.theme,
        fontSize: state.fontSize,
        language: state.language,
        apiUrl: state.apiUrl,
        sidebarExpanded: state.sidebarExpanded,
      }),
    }
  )
);
