// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Supabase Edge Function: Analyze Session
// Receives session data, runs server-side analysis, stores results.
// Deploy: supabase functions deploy analyze-session
// ═══════════════════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS")
    return new Response("ok", { headers: corsHeaders });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const { sessionId, userId, sessionData } = await req.json();
    if (!sessionId || !userId) {
      return new Response(
        JSON.stringify({ error: "Missing sessionId or userId" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // 1. Store session summary
    const { error: sessErr } = await supabase.from("sessions").upsert({
      id: sessionId,
      user_id: userId,
      ...sessionData,
      analyzed_at: new Date().toISOString(),
    });
    if (sessErr) throw sessErr;

    // 2. Update user stats
    const { data: profile } = await supabase
      .from("profiles")
      .select("sessions_completed, total_points, average_score, best_score, xp")
      .eq("id", userId)
      .single();

    if (profile) {
      const score = sessionData.score ?? 0;
      const xpGained = sessionData.xpGained ?? 0;
      const sessions = (profile.sessions_completed ?? 0) + 1;
      const totalPts = (profile.total_points ?? 0) + score;
      const avgScore = Math.round(totalPts / sessions);

      await supabase
        .from("profiles")
        .update({
          sessions_completed: sessions,
          total_points: totalPts,
          average_score: avgScore,
          best_score: Math.max(profile.best_score ?? 0, score),
          xp: (profile.xp ?? 0) + xpGained,
          last_active_date: new Date().toISOString().split("T")[0],
        })
        .eq("id", userId);
    }

    // 3. Update leaderboard
    await supabase
      .rpc("refresh_leaderboard", { p_user_id: userId })
      .catch(() => {});

    return new Response(JSON.stringify({ ok: true }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
