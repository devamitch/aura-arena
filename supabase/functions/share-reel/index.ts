// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Supabase Edge Function: Share to Reel
// Processes a session into a shareable reel with metadata overlay.
// Deploy: supabase functions deploy share-reel
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

    const {
      userId,
      sessionId,
      discipline,
      subDiscipline,
      drillName,
      score,
      accuracy,
      caption,
      videoUrl,
    } = await req.json();

    if (!userId || !sessionId) {
      return new Response(
        JSON.stringify({ error: "Missing userId or sessionId" }),
        {
          status: 400,
          headers: { ...corsHeaders, "Content-Type": "application/json" },
        },
      );
    }

    // 1. Create reel record
    const { data: reel, error } = await supabase
      .from("reels")
      .insert({
        user_id: userId,
        session_id: sessionId,
        discipline,
        sub_discipline: subDiscipline,
        drill_name: drillName ?? "Training Session",
        score: score ?? 0,
        accuracy: accuracy ?? 0,
        caption: caption ?? `${discipline} training — Score: ${score}/100 🔥`,
        video_url: videoUrl,
        is_public: true,
        likes_count: 0,
        comments_count: 0,
        visibility_score: score ?? 0,
      })
      .select()
      .single();

    if (error) throw error;

    // 2. Award XP for sharing
    const XP_FOR_SHARING = 25;
    await supabase
      .rpc("increment_xp", {
        p_user_id: userId,
        p_amount: XP_FOR_SHARING,
      })
      .catch(() => {
        // Fallback: direct update
        supabase
          .from("profiles")
          .select("xp")
          .eq("id", userId)
          .single()
          .then(({ data: profile }) => {
            if (profile) {
              supabase
                .from("profiles")
                .update({ xp: (profile.xp ?? 0) + XP_FOR_SHARING })
                .eq("id", userId);
            }
          });
      });

    return new Response(JSON.stringify({ reel, xpAwarded: XP_FOR_SHARING }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (err) {
    return new Response(JSON.stringify({ error: String(err) }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
