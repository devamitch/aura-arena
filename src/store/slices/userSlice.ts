// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — User Slice
// Auth, user profile, saved Google accounts, UI preferences
// ═══════════════════════════════════════════════════════════════════════════════

import { StateCreator } from 'zustand';
import type { UserProfile, SavedAccount, DisciplineId, SubDisciplineId } from '@types';

export type NavTab = 'home' | 'arena' | 'discover' | 'profile';

export interface UserSlice {
  // State
  user:            UserProfile | null;
  savedAccounts:   SavedAccount[];
  isLoading:       boolean;
  authError:       string | null;

  // UI preferences (persisted)
  activeTab:       NavTab;
  showPlusSheet:   boolean;
  soundEnabled:    boolean;
  reduceMotion:    boolean;
  masterVolume:    number;
  hapticsEnabled:  boolean;
  installPromptDismissed: boolean;
  showInstallBanner: boolean;
  offlineMode:     boolean;
  theme:           'dark' | 'amoled';

  // Actions
  setUser:         (u: UserProfile | null) => void;
  updateUser:      (updates: Partial<UserProfile>) => void;
  addSavedAccount: (a: SavedAccount) => void;
  removeSavedAccount: (sub: string) => void;
  signOut:         () => void;
  setLoading:      (v: boolean) => void;
  setAuthError:    (e: string | null) => void;

  setActiveTab:    (t: NavTab) => void;
  setShowPlusSheet:(v: boolean) => void;
  setSoundEnabled: (v: boolean) => void;
  setReduceMotion: (v: boolean) => void;
  setMasterVolume: (v: number) => void;
  setHapticsEnabled:(v: boolean) => void;
  dismissInstall:  () => void;
  setOfflineMode:  (v: boolean) => void;
  setTheme:        (t: 'dark' | 'amoled') => void;
}

export const createUserSlice: StateCreator<
  UserSlice,
  [['zustand/immer', never]],
  [],
  UserSlice
> = (set) => ({
  user:            null,
  savedAccounts:   [],
  isLoading:       false,
  authError:       null,

  activeTab:       'home',
  showPlusSheet:   false,
  soundEnabled:    true,
  reduceMotion:    false,
  masterVolume:    0.7,
  hapticsEnabled:  true,
  installPromptDismissed: false,
  showInstallBanner: false,
  offlineMode:     false,
  theme:           'dark',

  setUser: (u) => set((s) => { s.user = u; }),

  updateUser: (updates) => set((s) => {
    if (s.user) Object.assign(s.user, updates);
  }),

  addSavedAccount: (a) => set((s) => {
    const idx = s.savedAccounts.findIndex((x) => x.sub === a.sub);
    if (idx >= 0) s.savedAccounts[idx] = a;
    else s.savedAccounts.unshift(a);
    if (s.savedAccounts.length > 5) s.savedAccounts.length = 5;
  }),

  removeSavedAccount: (sub) => set((s) => {
    s.savedAccounts = s.savedAccounts.filter((a) => a.sub !== sub);
  }),

  signOut: () => set((s) => { s.user = null; s.authError = null; }),

  setLoading:    (v) => set((s) => { s.isLoading = v; }),
  setAuthError:  (e) => set((s) => { s.authError = e; }),

  setActiveTab:   (t) => set((s) => { s.activeTab = t; }),
  setShowPlusSheet:(v) => set((s) => { s.showPlusSheet = v; }),
  setSoundEnabled: (v) => set((s) => { s.soundEnabled = v; }),
  setReduceMotion: (v) => set((s) => { s.reduceMotion = v; }),
  setMasterVolume: (v) => set((s) => { s.masterVolume = v; }),
  setHapticsEnabled:(v) => set((s) => { s.hapticsEnabled = v; }),

  dismissInstall: () => set((s) => {
    s.installPromptDismissed = true;
    s.showInstallBanner      = false;
  }),

  setOfflineMode: (v) => set((s) => { s.offlineMode = v; }),
  setTheme:       (t) => set((s) => { s.theme = t; }),
});
