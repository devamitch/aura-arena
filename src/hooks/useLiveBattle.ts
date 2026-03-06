// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — useLiveBattle: Supabase Realtime matchmaking + live battle
// ─── Flow ─────────────────────────────────────────────────────────────────────
// 1. Join lobby presence channel (battle:lobby:{discipline})
// 2. Track self as "waiting"; watch for another player
// 3. When 2 players meet → generate deterministic roomId → join battle room
// 4. Broadcast own score every 500ms; receive opponent score via broadcast
// 5. 6-second fallback: switch to simulated AI if no real opponent found
// ═══════════════════════════════════════════════════════════════════════════════

import { useCallback, useEffect, useRef, useState } from 'react';
import { supabase } from '@lib/supabase/client';
import type { RealtimeChannel } from '@supabase/supabase-js';

export type MatchPhase = 'searching' | 'found' | 'battling' | 'ai_fallback';

interface PresenceData {
  userId: string;
  arenaName: string;
  ts: number;
}

export interface UseLiveBattleReturn {
  phase: MatchPhase;
  oppName: string;
  oppScore: number;
  isRealOpponent: boolean;
  /** Call every ~500ms during battle with player's current score */
  broadcastScore: (score: number) => void;
  /** Call on battle end / component unmount */
  cleanup: () => void;
}

// Simple physics-based AI fallback
function nextAIScore(cur: number): number {
  const pull = (72 - cur) * 0.08;
  const noise = (Math.random() - 0.42) * 9;
  return Math.max(0, Math.min(99, Math.round(cur + pull + noise)));
}

export function useLiveBattle(
  userId: string | undefined,
  arenaName: string,
  discipline: string,
): UseLiveBattleReturn {
  const [phase, setPhase] = useState<MatchPhase>('searching');
  const [oppName, setOppName] = useState('');
  const [oppScore, setOppScore] = useState(50);
  const [isRealOpponent, setIsRealOpponent] = useState(false);

  const lobbyRef = useRef<RealtimeChannel | null>(null);
  const roomRef = useRef<RealtimeChannel | null>(null);
  const aiTimerRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const phaseRef = useRef<MatchPhase>('searching');
  const matchedRef = useRef(false);

  phaseRef.current = phase;

  const stopAI = () => {
    if (aiTimerRef.current) {
      clearInterval(aiTimerRef.current);
      aiTimerRef.current = null;
    }
  };

  const startAI = useCallback((name: string) => {
    setOppName(name);
    setIsRealOpponent(false);
    setPhase('ai_fallback');
    stopAI();
    let cur = 50;
    aiTimerRef.current = setInterval(() => {
      cur = nextAIScore(cur);
      setOppScore(cur);
    }, 650);
  }, []);

  const joinBattleRoom = useCallback(
    (theirId: string, theirName: string) => {
      if (matchedRef.current) return; // prevent double-join
      matchedRef.current = true;

      setOppName(theirName);
      setIsRealOpponent(true);
      setPhase('found');

      // Deterministic room ID (same for both players)
      const ids = [userId ?? 'anon', theirId].sort();
      const roomId = `${ids[0]}_${ids[1]}`.replace(/[^a-zA-Z0-9_]/g, '_');

      // Brief "found" flash, then enter battle
      setTimeout(() => setPhase('battling'), 1000);

      // Leave lobby
      if (lobbyRef.current) {
        supabase.removeChannel(lobbyRef.current);
        lobbyRef.current = null;
      }

      // Join battle room
      const room = supabase.channel(`battle:room:${roomId}`, {
        config: { broadcast: { self: false } },
      });
      room
        .on('broadcast', { event: 'score_update' }, ({ payload }) => {
          if (payload.userId !== userId) {
            setOppScore(payload.score as number);
          }
        })
        .subscribe();
      roomRef.current = room;
    },
    [userId],
  );

  const broadcastScore = useCallback(
    (score: number) => {
      if (!roomRef.current || !isRealOpponent) return;
      roomRef.current.send({
        type: 'broadcast',
        event: 'score_update',
        payload: { userId, score },
      });
    },
    [userId, isRealOpponent],
  );

  const cleanup = useCallback(() => {
    stopAI();
    if (lobbyRef.current) {
      supabase.removeChannel(lobbyRef.current);
      lobbyRef.current = null;
    }
    if (roomRef.current) {
      supabase.removeChannel(roomRef.current);
      roomRef.current = null;
    }
  }, []);

  useEffect(() => {
    if (!userId) {
      // No auth — use AI immediately
      const AI_NAMES = ['SHDW_X', 'NeonKal', 'ZeroKai', 'PhantomJ', 'CypherK'];
      startAI(AI_NAMES[Math.floor(Math.random() * AI_NAMES.length)]);
      return stopAI;
    }

    // Join lobby presence channel
    const lobby = supabase.channel(`battle:lobby:${discipline}`, {
      config: { presence: { key: userId } },
    });

    lobby.on('presence', { event: 'sync' }, () => {
      if (matchedRef.current) return;
      const state = lobby.presenceState() as Record<string, PresenceData[]>;
      const others = Object.entries(state)
        .filter(([key]) => key !== userId)
        .flatMap(([, arr]) => arr)
        .filter(Boolean)
        .sort((a, b) => a.ts - b.ts);

      if (others.length > 0) {
        const opp = others[0];
        joinBattleRoom(opp.userId, opp.arenaName || 'Rival');
      }
    });

    lobby
      .subscribe(async (status) => {
        if (status === 'SUBSCRIBED') {
          await lobby.track({
            userId,
            arenaName: arenaName || 'Fighter',
            ts: Date.now(),
          });
        }
      });

    lobbyRef.current = lobby;

    // Fallback to AI after 6 seconds if no opponent
    const fallbackTimer = setTimeout(() => {
      if (!matchedRef.current) {
        const AI_NAMES = ['SHDW_X', 'NeonKal', 'ZeroKai', 'PhantomJ', 'CypherK'];
        startAI(AI_NAMES[Math.floor(Math.random() * AI_NAMES.length)]);
      }
    }, 6000);

    return () => {
      clearTimeout(fallbackTimer);
      cleanup();
    };
  }, [userId, discipline]); // eslint-disable-line react-hooks/exhaustive-deps

  return { phase, oppName, oppScore, isRealOpponent, broadcastScore, cleanup };
}
