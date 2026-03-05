// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Feed Slice
// Reels feed, likes, comments, bookmarks, discovery state
// ═══════════════════════════════════════════════════════════════════════════════

import { StateCreator } from 'zustand';
import type { Reel } from '@types';

export interface FeedSlice {
  // State
  likedReels:      Set<string>;
  savedReels:      Set<string>;
  reelScrollPos:   number;
  activeReelIndex: number;
  discoverFilter:  string | null;
  feedTab:         'trending' | 'following' | 'nearby';

  // Actions
  toggleLike:      (reelId: string) => void;
  toggleSave:      (reelId: string) => void;
  setReelScrollPos:(n: number) => void;
  setActiveReel:   (n: number) => void;
  setDiscoverFilter:(f: string | null) => void;
  setFeedTab:      (t: FeedSlice['feedTab']) => void;
  isLiked:         (reelId: string) => boolean;
  isSaved:         (reelId: string) => boolean;
}

export const createFeedSlice: StateCreator<
  FeedSlice,
  [['zustand/immer', never]],
  [],
  FeedSlice
> = (set, get) => ({
  likedReels:       new Set(),
  savedReels:       new Set(),
  reelScrollPos:    0,
  activeReelIndex:  0,
  discoverFilter:   null,
  feedTab:          'trending',

  toggleLike: (id) => set((s) => {
    if (s.likedReels.has(id)) s.likedReels.delete(id);
    else s.likedReels.add(id);
  }),

  toggleSave: (id) => set((s) => {
    if (s.savedReels.has(id)) s.savedReels.delete(id);
    else s.savedReels.add(id);
  }),

  setReelScrollPos:  (n) => set((s) => { s.reelScrollPos = n; }),
  setActiveReel:     (n) => set((s) => { s.activeReelIndex = n; }),
  setDiscoverFilter: (f) => set((s) => { s.discoverFilter = f; }),
  setFeedTab:        (t) => set((s) => { s.feedTab = t; }),

  isLiked: (id) => get().likedReels.has(id),
  isSaved: (id) => get().savedReels.has(id),
});
