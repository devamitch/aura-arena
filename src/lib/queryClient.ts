// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — TanStack Query: All queries, mutations, infinite queries
// 100% functional - no classes
// ═══════════════════════════════════════════════════════════════════════════════

import {
  QueryClient,
  useInfiniteQuery,
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";
import type { Reel, ReelComment, SessionData } from "@types";
import { supabase } from "./supabase/client";

// ─── QUERY CLIENT ─────────────────────────────────────────────────────────────

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      gcTime: 5 * 60_000,
      retry: 2,
      refetchOnWindowFocus: false,
    },
  },
});

// ─── QUERY KEYS ───────────────────────────────────────────────────────────────

export const QK = {
  profile: (id: string) => ["profile", id] as const,
  reels: (disc?: string) => ["reels", disc ?? "all"] as const,
  reelComments: (reelId: string) => ["reelComments", reelId] as const,
  leaderboard: (disc?: string) => ["leaderboard", disc ?? "all"] as const,
  sessions: (userId: string) => ["sessions", userId] as const,
  coachHistory: (userId: string) => ["coachHistory", userId] as const,
  leagueSeason: () => ["leagueSeason"] as const,
};

// ─── PROFILE ──────────────────────────────────────────────────────────────────

export const useProfile = (userId: string) =>
  useQuery({
    queryKey: QK.profile(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("profiles")
        .select("*")
        .eq("id", userId)
        .single();
      if (error) throw error;
      return data;
    },
    enabled: !!userId,
  });

export const useUpdateProfile = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      userId,
      updates,
    }: {
      userId: string;
      updates: Record<string, unknown>;
    }) => {
      const { data, error } = await supabase
        .from("profiles")
        .update(updates)
        .eq("id", userId)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (data, { userId }) => {
      qc.setQueryData(QK.profile(userId), data);
    },
  });
};

// ─── SESSION ──────────────────────────────────────────────────────────────────

export const useSaveSession = () =>
  useMutation({
    mutationFn: async (session: Record<string, unknown>) => {
      const { data, error } = await supabase
        .from("sessions")
        .insert(session)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
  });

export const useSessionHistory = (userId: string) =>
  useQuery({
    queryKey: QK.sessions(userId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("sessions")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(50);
      if (error) throw error;
      return data as SessionData[];
    },
    enabled: !!userId,
  });

// ─── REELS ────────────────────────────────────────────────────────────────────

export const useReelsFeed = (discipline?: string) =>
  useInfiniteQuery({
    queryKey: QK.reels(discipline),
    queryFn: async ({ pageParam = 0 }) => {
      let q = supabase
        .from("reels")
        .select("*, profiles(displayName, arenaName, avatar)")
        .order("created_at", { ascending: false })
        .range(pageParam * 10, pageParam * 10 + 9);
      if (discipline) q = q.eq("discipline", discipline);
      const { data, error } = await q;
      if (error) throw error;
      return data as Reel[];
    },
    initialPageParam: 0,
    getNextPageParam: (lastPage, pages) =>
      lastPage.length === 10 ? pages.length : undefined,
  });

export const useReelComments = (reelId: string) =>
  useQuery({
    queryKey: QK.reelComments(reelId),
    queryFn: async () => {
      const { data, error } = await supabase
        .from("reel_comments")
        .select("*, profiles(displayName, arenaName)")
        .eq("reel_id", reelId)
        .order("created_at", { ascending: true });
      if (error) throw error;
      return data as ReelComment[];
    },
    enabled: !!reelId,
  });

export const useLikeReel = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      reelId,
      userId,
    }: {
      reelId: string;
      userId: string;
    }) => {
      const { data, error } = await supabase
        .from("reel_likes")
        .upsert({ reel_id: reelId, user_id: userId })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reels"] }),
  });
};

export const usePostReel = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (reel: Record<string, unknown>) => {
      const { data, error } = await supabase
        .from("reels")
        .insert(reel)
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: () => qc.invalidateQueries({ queryKey: ["reels"] }),
  });
};

export const usePostComment = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({
      reelId,
      userId,
      text,
    }: {
      reelId: string;
      userId: string;
      text: string;
    }) => {
      const { data, error } = await supabase
        .from("reel_comments")
        .insert({ reel_id: reelId, user_id: userId, text })
        .select()
        .single();
      if (error) throw error;
      return data;
    },
    onSuccess: (_, { reelId }) =>
      qc.invalidateQueries({ queryKey: QK.reelComments(reelId) }),
  });
};

// ─── LEADERBOARD ──────────────────────────────────────────────────────────────

export const useLeaderboard = (discipline?: string) =>
  useQuery({
    queryKey: QK.leaderboard(discipline),
    queryFn: async () => {
      let q = supabase
        .from("leaderboard_view")
        .select("*")
        .order("total_points", { ascending: false })
        .limit(100);
      if (discipline) q = q.eq("discipline", discipline);
      const { data, error } = await q;
      if (error) throw error;
      return data;
    },
    staleTime: 60_000,
  });

// ─── TRAINING DATA (Feedback Loop) ───────────────────────────────────────────

export const useTrainingSampleCount = (userId: string) =>
  useQuery({
    queryKey: [...QK.sessions(userId), "training-count"],
    queryFn: async () => {
      const { count, error } = await supabase
        .from("training_samples")
        .select("*", { count: "exact", head: true })
        .eq("user_id", userId);
      if (error) return 0;
      return count ?? 0;
    },
    enabled: !!userId,
    staleTime: 30_000,
  });

export const useSaveTrainingSamples = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      userId: string;
      samples: Array<{
        keypoints: number[][];
        gemini_label: string;
        gemini_score: number;
        discipline: string;
        issues: string[];
      }>;
    }) => {
      const rows = payload.samples.map((s) => ({
        user_id: payload.userId,
        ...s,
      }));
      const { error } = await supabase.from("training_samples").insert(rows);
      if (error) throw error;
      return rows.length;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["training-samples"] });
    },
  });
};

export const useGlobalTrainingSamples = (discipline: string) =>
  useQuery({
    queryKey: ["training-samples", "global", discipline],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("training_samples")
        .select("*")
        .eq("discipline", discipline)
        .order("created_at", { ascending: false })
        .limit(500);
      if (error) return [];
      return data ?? [];
    },
    enabled: !!discipline,
    staleTime: 120_000,
  });

// ─── GEMINI ANALYSIS RESULTS ─────────────────────────────────────────────────

export const useSaveGeminiAnalysis = () => {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload: {
      userId: string;
      matchId: string;
      analysis: Record<string, unknown>;
    }) => {
      const { error } = await supabase.from("gemini_analyses").insert({
        user_id: payload.userId,
        match_id: payload.matchId,
        analysis: payload.analysis,
      });
      if (error) throw error;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["gemini-analyses"] });
    },
  });
};

export const useGeminiAnalysisHistory = (userId: string) =>
  useQuery({
    queryKey: ["gemini-analyses", userId],
    queryFn: async () => {
      const { data, error } = await supabase
        .from("gemini_analyses")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false })
        .limit(20);
      if (error) return [];
      return data ?? [];
    },
    enabled: !!userId,
    staleTime: 60_000,
  });
