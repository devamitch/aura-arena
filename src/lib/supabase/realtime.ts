// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Supabase Realtime (fully functional, zero classes)
// Subscriptions: notifications, reel likes, live battle comments, leaderboard
// ═══════════════════════════════════════════════════════════════════════════════

import { useEffect, useRef } from 'react';
import { supabase } from './client';

type UnsubFn = () => void;

// ─── NOTIFICATIONS ────────────────────────────────────────────────────────────

export const subscribeToNotifications = (
  userId: string,
  onNew: (n: any) => void
): UnsubFn => {
  const ch = supabase
    .channel(`notifs:${userId}`)
    .on('postgres_changes', {
      event: 'INSERT', schema: 'public', table: 'notifications',
      filter: `user_id=eq.${userId}`,
    }, (p) => onNew(p.new))
    .subscribe();
  return () => supabase.removeChannel(ch);
};

// ─── REEL LIKES ───────────────────────────────────────────────────────────────

export const subscribeToReelLikes = (
  reelId: string,
  onUpdate: (likes: number) => void
): UnsubFn => {
  const ch = supabase
    .channel(`reel_likes:${reelId}`)
    .on('postgres_changes', {
      event: '*', schema: 'public', table: 'reel_likes',
      filter: `reel_id=eq.${reelId}`,
    }, async () => {
      const { count } = await supabase
        .from('reel_likes')
        .select('*', { count: 'exact', head: true })
        .eq('reel_id', reelId);
      if (count !== null) onUpdate(count);
    })
    .subscribe();
  return () => supabase.removeChannel(ch);
};

// ─── BATTLE COMMENTS ──────────────────────────────────────────────────────────

export const subscribeToBattleComments = (
  battleId: string,
  onComment: (c: any) => void
): UnsubFn => {
  const ch = supabase
    .channel(`battle_comments:${battleId}`)
    .on('postgres_changes', {
      event: 'INSERT', schema: 'public', table: 'battle_comments',
      filter: `battle_id=eq.${battleId}`,
    }, (p) => onComment(p.new))
    .subscribe();
  return () => supabase.removeChannel(ch);
};

// ─── VIEWER COUNT (Presence) ──────────────────────────────────────────────────

export const subscribeToBattleViewers = (
  battleId: string,
  userId: string,
  onCount: (n: number) => void
): UnsubFn => {
  const ch = supabase.channel(`viewers:${battleId}`, {
    config: { presence: { key: userId } },
  });

  ch.on('presence', { event: 'sync' }, () => {
    const state = ch.presenceState();
    onCount(Object.keys(state).length);
  })
    .subscribe(async (status) => {
      if (status === 'SUBSCRIBED') await ch.track({ userId, joined: Date.now() });
    });

  return () => supabase.removeChannel(ch);
};

// ─── LEADERBOARD CHANGES ──────────────────────────────────────────────────────

export const subscribeToLeaderboard = (
  discipline: string | null,
  onUpdate: (entry: any) => void
): UnsubFn => {
  const ch = supabase
    .channel(`leaderboard${discipline ? `:${discipline}` : ''}`)
    .on('postgres_changes', {
      event: '*', schema: 'public', table: 'leaderboard_view',
      ...(discipline ? { filter: `discipline=eq.${discipline}` } : {}),
    }, (p) => onUpdate(p.new))
    .subscribe();
  return () => supabase.removeChannel(ch);
};

// ─── HOOKS ────────────────────────────────────────────────────────────────────

export const useRealtimeNotifications = (
  userId: string | undefined,
  onNew: (n: any) => void
) => {
  useEffect(() => {
    if (!userId) return;
    const unsub = subscribeToNotifications(userId, onNew);
    return unsub;
  }, [userId]);
};

export const useRealtimeReelLikes = (
  reelId: string,
  onUpdate: (likes: number) => void
) => {
  useEffect(() => {
    const unsub = subscribeToReelLikes(reelId, onUpdate);
    return unsub;
  }, [reelId]);
};

export const useRealtimeBattleViewers = (
  battleId: string,
  userId: string,
  onCount: (n: number) => void
) => {
  useEffect(() => {
    if (!battleId || !userId) return;
    const unsub = subscribeToBattleViewers(battleId, userId, onCount);
    return unsub;
  }, [battleId, userId]);
};
