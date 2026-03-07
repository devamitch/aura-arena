// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Analytics Worker
// Batches and flushes analytics events to Supabase off main thread.
// Receives events from main thread, queues them, flushes every 10s.
// ═══════════════════════════════════════════════════════════════════════════════

// ─── TYPES ────────────────────────────────────────────────────────────────────

interface InitMessage {
  type: "INIT";
  supabaseUrl: string;
  supabaseKey: string;
}

interface TrackMessage {
  type: "TRACK";
  event: string;
  properties: Record<string, unknown>;
  sessionId: string;
  userId: string | null;
  timestamp: string;
}

interface FlushMessage {
  type: "FLUSH";
}

type AnalyticsMessage = InitMessage | TrackMessage | FlushMessage;

// ─── STATE ────────────────────────────────────────────────────────────────────

let _supabaseUrl = "";
let _supabaseKey = "";
const _queue: Array<{
  event: string;
  properties: Record<string, unknown>;
  session_id: string;
  user_id: string | null;
  created_at: string;
}> = [];

// ─── FLUSH ────────────────────────────────────────────────────────────────────

async function flush() {
  if (_queue.length === 0 || !_supabaseUrl) return;

  const batch = _queue.splice(0, 50);
  try {
    const res = await fetch(`${_supabaseUrl}/rest/v1/analytics_events`, {
      method: "POST",
      headers: {
        apikey: _supabaseKey,
        Authorization: `Bearer ${_supabaseKey}`,
        "Content-Type": "application/json",
        Prefer: "return=minimal",
      },
      body: JSON.stringify(batch),
    });

    if (!res.ok) {
      // Re-queue on failure
      _queue.unshift(...batch);
    }
  } catch {
    _queue.unshift(...batch);
  }
}

// ─── HANDLER ──────────────────────────────────────────────────────────────────

function handleAnalyticsMessage(msg: AnalyticsMessage) {
  switch (msg.type) {
    case "INIT":
      _supabaseUrl = msg.supabaseUrl;
      _supabaseKey = msg.supabaseKey;
      // Auto-flush every 10 seconds
      setInterval(flush, 10_000);
      break;

    case "TRACK":
      _queue.push({
        event: msg.event,
        properties: msg.properties,
        session_id: msg.sessionId,
        user_id: msg.userId,
        created_at: msg.timestamp,
      });
      // Auto-flush when queue hits 10
      if (_queue.length >= 10) flush();
      break;

    case "FLUSH":
      flush();
      break;
  }
}

self.addEventListener("message", (e: MessageEvent) =>
  handleAnalyticsMessage(e.data as AnalyticsMessage),
);
