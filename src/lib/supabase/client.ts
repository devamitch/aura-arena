// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Supabase Client (functional)
// ═══════════════════════════════════════════════════════════════════════════════

import { createClient } from "@supabase/supabase-js";

const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL ?? "";
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY ?? "";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY, {
  auth: {
    persistSession: true,
    autoRefreshToken: true,
    detectSessionInUrl: true,
  },
});

// ─── AUTH HELPERS ─────────────────────────────────────────────────────────────

export const signInWithGoogle = async (accessToken: string) => {
  const { data, error } = await supabase.auth.signInWithIdToken({
    provider: "google",
    token: accessToken,
  });
  if (error) throw error;
  return data;
};

export const signOut = async () => {
  const { error } = await supabase.auth.signOut();
  if (error) throw error;
};

export const getCurrentSession = () => supabase.auth.getSession();
export const getCurrentUser = () => supabase.auth.getUser();
