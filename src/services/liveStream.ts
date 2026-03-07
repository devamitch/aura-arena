import { supabase } from "@lib/supabase/client";

export interface TelemetryPayload {
  matchId: string;
  userId: string;
  timestamp: number;
  score: number;
  combo: number;
  exercise: string;
  poseCorrectness: number; // 0-100
  isCorrect: boolean;
  /** Action label from TF.js classifier */
  actionLabel?: string;
  /** Form quality score from poseAnalyzer */
  formScore?: number;
}

const ENABLED = !!(
  (import.meta as any).env?.VITE_SUPABASE_URL &&
  (import.meta as any).env?.VITE_SUPABASE_ANON_KEY
);

class LiveStreamService {
  private buffer: TelemetryPayload[] = [];
  private flushInterval: ReturnType<typeof setInterval> | null = null;
  private isFlushing = false;

  constructor(private flushRateMs = 100) {}

  /**
   * Start the batching interval. Call this when a match begins.
   */
  startStreaming() {
    if (!ENABLED) return;
    this.buffer = [];
    if (this.flushInterval) clearInterval(this.flushInterval);

    // Flush at 10Hz (Default 100ms)
    this.flushInterval = setInterval(() => this.flush(), this.flushRateMs);
  }

  /**
   * Stop the stream and flush remaining buffer. Call on match end.
   */
  async stopStreaming() {
    if (this.flushInterval) {
      clearInterval(this.flushInterval);
      this.flushInterval = null;
    }
    await this.flush();
  }

  /**
   * Enqueue a telemetry frame from the Web Worker.
   */
  enqueue(data: TelemetryPayload) {
    if (!ENABLED) return;
    this.buffer.push(data);
  }

  /**
   * Private batch insert.
   */
  private async flush() {
    if (this.isFlushing || this.buffer.length === 0 || !ENABLED) return;
    this.isFlushing = true;

    // Take current buffer and clear it
    const payload = [...this.buffer];
    this.buffer = [];

    try {
      // Supabase supports bulk insert via array
      const { error } = await supabase.from("match_telemetry").insert(payload);
      if (error) {
        // If it fails, we drop the frames. Live telemetry is ephemeral.
        console.warn(
          "[LiveStream] Bulk telemetry insert failed:",
          error.message,
        );
      }
    } catch (e) {
      console.warn("[LiveStream] Exception during telemetry flush:", e);
    } finally {
      this.isFlushing = false;
    }
  }

  /**
   * Subscribe to a live match's telemetry.
   * Useful for viewers watching the leaderboard or a specific player's stream.
   */
  subscribeToMatch(
    matchId: string,
    onUpdate: (data: TelemetryPayload) => void,
  ) {
    if (!ENABLED) return () => {};

    const channel = supabase
      .channel(`live_telemetry_${matchId}`)
      .on(
        "postgres_changes",
        {
          event: "INSERT",
          schema: "public",
          table: "match_telemetry",
          filter: `matchId=eq.${matchId}`,
        },
        (payload) => {
          onUpdate(payload.new as TelemetryPayload);
        },
      )
      .subscribe();

    // Returns unsubscribe function
    return () => {
      supabase.removeChannel(channel);
    };
  }

  /**
   * Save a complete session analysis report to Supabase Storage.
   * This is the full per-second breakdown for the Gemini AI coach.
   */
  async saveSessionAnalysis(
    matchId: string,
    userId: string,
    report: Record<string, unknown>,
  ) {
    if (!ENABLED) return;
    try {
      const blob = new Blob([JSON.stringify(report)], {
        type: "application/json",
      });
      const path = `analysis/${userId}/${matchId}.json`;
      await supabase.storage.from("match-analysis").upload(path, blob, {
        upsert: true,
        contentType: "application/json",
      });
    } catch (e) {
      console.warn("[LiveStream] Failed to save session analysis:", e);
    }
  }
}

// Export singleton instance
export const liveStream = new LiveStreamService();
