import { create } from 'zustand';
import { User } from 'firebase/auth';

export type Role = 'root' | 'sub-admin' | null;

export interface AppUser extends User {
  role?: Role;
}

export interface Language {
  id: string;
  code: string;
  name: string;
  isDefault: boolean;
}

export interface Settings {
  brandName: string;
  hotline: string;
  zalo: string;
  title: string;
  favicon: string;
  logo: string;
  heroTitle: Record<string, string>;
  heroSubtitle: Record<string, string>;
  heroImages: string[];
  aboutTitle: Record<string, string>;
  aboutDescription: Record<string, string>;
}

interface AppState {
  user: AppUser | null;
  settings: Settings | null;
  languages: Language[];
  currentLanguage: string;
  theme: 'light' | 'dark';
  isAuthReady: boolean;
  setUser: (user: AppUser | null) => void;
  setSettings: (settings: Settings) => void;
  setLanguages: (languages: Language[]) => void;
  setCurrentLanguage: (code: string) => void;
  toggleTheme: () => void;
  setAuthReady: (ready: boolean) => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  settings: null,
  languages: [],
  currentLanguage: 'vi', // Default to Vietnamese
  theme: 'light',
  isAuthReady: false,
  setUser: (user) => set({ user }),
  setSettings: (settings) => set({ settings }),
  setLanguages: (languages) => set({ languages }),
  setCurrentLanguage: (code) => set({ currentLanguage: code }),
  toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
  setAuthReady: (ready) => set({ isAuthReady: ready }),
}));
