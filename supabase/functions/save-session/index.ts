// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Edge Function: save-session
// Saves full session (scores + pose frames + training samples) to Supabase
// and refreshes leaderboard cache.
// Deploy: supabase functions deploy save-session
// ═══════════════════════════════════════════════════════════════════════════════

import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from "https://esm.sh/@supabase/supabase-js@2.39.0";

const CORS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
};

serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: CORS });

  try {
    const supabase = createClient(
      Deno.env.get("SUPABASE_URL") ?? "",
      Deno.env.get("SUPABASE_SERVICE_ROLE_KEY") ?? "",
    );

    const {
      userId,
      session,      // SessionPayload
      poseFrames,   // PoseFrame[] — optional, can be empty
      trainingSamples, // TrainingSample[] — optional
    } = await req.json();

    if (!userId || !session) {
      return new Response(JSON.stringify({ error: "Missing userId or session" }), {
        status: 400, headers: { ...CORS, "Content-Type": "application/json" },
      });
    }

    // 1. Insert session history
    const { data: sessionRow, error: sessErr } = await supabase
      .from("session_history")
      .insert({
        user_id:          userId,
        discipline:       session.discipline,
        sub_discipline:   session.subDiscipline ?? null,
        difficulty:       session.difficulty ?? 3,
        score:            session.score ?? 0,
        accuracy:         session.accuracy ?? 0,
        timing:           session.timing ?? 0,
        power:            session.power ?? 0,
        stability:        session.stability ?? 0,
        expressiveness:   session.expressiveness ?? 0,
        balance:          session.balance ?? 0,
        combo:            session.combo ?? 0,
        peak_score:       session.peakScore ?? 0,
        total_frames:     session.totalFrames ?? 0,
        duration_seconds: session.duration ?? 0,
        xp_gained:        session.xpGained ?? 0,
        drill_name:       session.drillName ?? null,
        grade:            session.grade ?? null,
        ai_feedback:      session.aiFeedback ?? {},
      })
      .select("id")
      .single();

    if (sessErr) throw sessErr;
    const sessionId = sessionRow.id;

    // 2. Batch-insert pose frames (if any)
    if (poseFrames?.length > 0) {
      const rows = poseFrames.map((f: any) => ({
        user_id:        userId,
        session_id:     sessionId,
        discipline:     session.discipline,
        sub_discipline: session.subDiscipline ?? null,
        frame_second:   f.second,
        landmarks:      f.landmarks,
        hand_landmarks: f.handLandmarks ?? null,
        frame_score:    f.score ?? null,
        label:          f.label ?? null,
        is_correct:     f.isCorrect ?? null,
        issues:         f.issues ?? [],
        gemini_feedback: f.geminiFeedback ?? null,
      }));
      // Insert in chunks of 100 to stay within edge function limits
      for (let i = 0; i < rows.length; i += 100) {
        await supabase.from("pose_frames").insert(rows.slice(i, i + 100));
      }
    }

    // 3. Batch-insert training samples (normalised keypoints for TF fine-tuning)
    if (trainingSamples?.length > 0) {
      const rows = trainingSamples.map((s: any) => ({
        user_id:    userId,
        discipline: session.discipline,
        label:      s.label,
        keypoints:  s.keypoints, // float4[] — 132 floats
        score:      s.score ?? null,
        is_correct: s.isCorrect ?? null,
        source:     s.source ?? "live",
      }));
      for (let i = 0; i < rows.length; i += 100) {
        await supabase.from("training_samples").insert(rows.slice(i, i + 100));
      }
    }

    // 4. Update profile aggregate stats (non-blocking — don't fail if RPC errors)
    await supabase.rpc("increment_user_stats", {
      p_user_id:    userId,
      p_xp:         session.xpGained ?? 0,
      p_sessions:   1,
      p_best_score: session.score ?? 0,
      p_pve_wins:   0,
    }).maybeSingle();

    // 5. Refresh global leaderboard (lightweight — only top 200 rows)
    await supabase.rpc("refresh_leaderboard", { p_discipline: "all" });
    if (session.discipline) {
      await supabase.rpc("refresh_leaderboard", { p_discipline: session.discipline });
    }

    return new Response(
      JSON.stringify({ ok: true, sessionId }),
      { status: 200, headers: { ...CORS, "Content-Type": "application/json" } },
    );
  } catch (err: any) {
    console.error("[save-session]", err);
    return new Response(
      JSON.stringify({ error: err.message ?? "Internal error" }),
      { status: 500, headers: { ...CORS, "Content-Type": "application/json" } },
    );
  }
});
