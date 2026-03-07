// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Supabase Edge Function: Generate Contest
// Creates dynamic weekly/daily contests based on user activity.
// Deploy: supabase functions deploy generate-contest
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

    const { discipline, contestType = "weekly" } = await req.json();

    // Get top performers for this discipline
    const { data: topUsers } = await supabase
      .from("sessions")
      .select("user_id, score")
      .eq("discipline", discipline)
      .gte("created_at", new Date(Date.now() - 7 * 86400000).toISOString())
      .order("score", { ascending: false })
      .limit(50);

    // Create contest
    const now = new Date();
    const endDate = new Date(now);
    endDate.setDate(endDate.getDate() + (contestType === "weekly" ? 7 : 1));

    const { data: contest, error } = await supabase
      .from("contests")
      .insert({
        discipline,
        type: contestType,
        title: `${discipline.charAt(0).toUpperCase() + discipline.slice(1)} ${contestType} Challenge`,
        description: `Compete for the highest score in ${discipline}!`,
        start_date: now.toISOString(),
        end_date: endDate.toISOString(),
        entry_count: topUsers?.length ?? 0,
        prize_pool: { xp: 500, coins: 100, badge: `${contestType}_champion` },
        leaderboard: (topUsers ?? []).map((u, i) => ({
          rank: i + 1,
          userId: u.user_id,
          score: u.score,
        })),
        status: "active",
      })
      .select()
      .single();

    if (error) throw error;

    return new Response(JSON.stringify({ contest }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
