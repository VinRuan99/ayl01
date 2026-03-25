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

export interface NotificationActionConfig {
  message: string;
  imageUrl: string;
}

export interface AdminNotificationSettings {
  create: NotificationActionConfig;
  update: NotificationActionConfig;
  delete: NotificationActionConfig;
  reorder: NotificationActionConfig;
  position: 'top-left' | 'top-right' | 'bottom-left' | 'bottom-right' | 'top-center' | 'bottom-center';
  duration: number;
  showImage: boolean;
  imagePosition: 'left' | 'right';
  fontBold: boolean;
  textAlign: 'left' | 'center' | 'right';
  textShadow: boolean;
  textColor: string;
  borderRadius: string;
  borderWidth: number;
  borderColor: string;
  backgroundColor: string;
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
  adminNotifications?: AdminNotificationSettings;
}

interface AppState {
  user: AppUser | null;
  settings: Settings | null;
  languages: Language[];
  currentLanguage: string;
  theme: 'light' | 'dark';
  isAuthReady: boolean;
  adminNotification: { message: string, type: 'create' | 'update' | 'delete' | 'reorder' | 'success' } | null;
  setUser: (user: AppUser | null) => void;
  setSettings: (settings: Settings) => void;
  setLanguages: (languages: Language[]) => void;
  setCurrentLanguage: (code: string) => void;
  toggleTheme: () => void;
  setAuthReady: (ready: boolean) => void;
  showAdminNotification: (message: string, type: 'create' | 'update' | 'delete' | 'reorder' | 'success') => void;
  hideAdminNotification: () => void;
}

export const useStore = create<AppState>((set) => ({
  user: null,
  settings: null,
  languages: [],
  currentLanguage: 'vi', // Default to Vietnamese
  theme: 'light',
  isAuthReady: false,
  adminNotification: null,
  setUser: (user) => set({ user }),
  setSettings: (settings) => set({ settings }),
  setLanguages: (languages) => set({ languages }),
  setCurrentLanguage: (code) => set({ currentLanguage: code }),
  toggleTheme: () => set((state) => ({ theme: state.theme === 'light' ? 'dark' : 'light' })),
  setAuthReady: (ready) => set({ isAuthReady: ready }),
  showAdminNotification: (message, type) => set({ adminNotification: { message, type } }),
  hideAdminNotification: () => set({ adminNotification: null }),
}));
