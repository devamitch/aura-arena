# Aura Arena — Backend Architecture & Free Tech Stack

> **Goal:** Zero-cost, production-grade backend for Aura Arena — real-time battles, AI coaching, leaderboards, WebSockets, and game-state persistence. Everything free tier, easy to scale.

---

## TL;DR — Recommended Stack

| Layer | Tech | Why | Free Tier |
|-------|------|-----|-----------|
| **Database** | Supabase (PostgreSQL) | Already integrated, Realtime built-in | 500MB + 50k MAU free |
| **API** | Supabase Edge Functions | Deno/TypeScript, zero cold starts | 500k invocations/mo free |
| **Realtime** | Supabase Realtime | WebSocket channels, presence, broadcast | Included in free tier |
| **AI / LLM** | Groq API | Fastest free inference (Llama 3, Mixtral) | 14,400 req/day free |
| **Secondary LLM** | Google Gemini Flash | Already in project | 15 req/min free |
| **Auth** | Supabase Auth | Google OAuth, already integrated | Free |
| **File Storage** | Supabase Storage | Videos, avatars, replays | 1GB free |
| **Background Jobs** | Supabase Cron (pg_cron) | Leaderboard resets, streak updates | Free |
| **Deployment** | No deployment needed | Edge functions deploy with Supabase CLI | Free |

---

## Option 1: Supabase-First (Zero Extra Backend — Recommended)

You already have Supabase. Use it for **everything**. This is the fastest path to a working MVP.

### Architecture

```
React PWA ──► Supabase JS SDK ──► Supabase Platform
                                    ├── PostgreSQL (game data)
                                    ├── Auth (Google OAuth)
                                    ├── Realtime (live battles)
                                    ├── Storage (clips, avatars)
                                    └── Edge Functions (AI, scoring, payments)
```

### Supabase Edge Functions for Game Logic

```bash
# Install Supabase CLI
npm install -g supabase
supabase login
supabase init  # in project root
```

Create edge functions:

```bash
supabase functions new coach-feedback    # AI coaching after session
supabase functions new battle-matchmaker # Real-time 1v1 matching
supabase functions new leaderboard-sync  # XP → tier calculations
supabase functions new session-complete  # Award XP, update stats
```

#### Example: `supabase/functions/coach-feedback/index.ts`

```typescript
import { serve } from "https://deno.land/std@0.208.0/http/server.ts";
import Groq from "npm:groq-sdk";

const groq = new Groq({ apiKey: Deno.env.get("GROQ_API_KEY") });

serve(async (req) => {
  const { discipline, score, accuracy, combo } = await req.json();

  const { choices } = await groq.chat.completions.create({
    model: "llama-3.3-70b-versatile",   // Free, fastest
    messages: [
      {
        role: "system",
        content: `You are an elite ${discipline} performance coach. Give specific, technical feedback in 2 sentences.`,
      },
      {
        role: "user",
        content: `Score: ${score}/100 | Accuracy: ${accuracy}% | Combo: ${combo}x. What should I improve?`,
      },
    ],
    max_tokens: 150,
    temperature: 0.85,
  });

  return new Response(
    JSON.stringify({ feedback: choices[0].message.content }),
    { headers: { "Content-Type": "application/json" } }
  );
});
```

#### Example: Real-time Battle with Supabase Realtime

```typescript
// Frontend: Join battle channel
const channel = supabase.channel(`battle:${roomId}`, {
  config: { broadcast: { self: true } }
});

channel
  .on("broadcast", { event: "score_update" }, ({ payload }) => {
    setOppScore(payload.score);
  })
  .subscribe();

// Broadcast your score every 500ms
const interval = setInterval(() => {
  channel.send({
    type: "broadcast",
    event: "score_update",
    payload: { score: camera.currentScore.overall, userId: user.id }
  });
}, 500);
```

### Database Schema (add to existing Supabase)

```sql
-- Battle rooms for live PvP
create table battle_rooms (
  id uuid primary key default gen_random_uuid(),
  player1_id uuid references profiles(id),
  player2_id uuid references profiles(id),
  discipline text not null,
  status text default 'waiting',  -- waiting | active | completed
  player1_score int default 0,
  player2_score int default 0,
  winner_id uuid,
  duration_seconds int default 60,
  created_at timestamptz default now()
);

-- Leaderboard (materialized view for performance)
create materialized view global_leaderboard as
select
  id, display_name, arena_name, avatar,
  xp, tier, sessions_completed, pve_wins,
  discipline, average_score,
  row_number() over (order by xp desc) as rank
from profiles
where xp > 0
order by xp desc
limit 500;

-- Auto-refresh leaderboard hourly
select cron.schedule('refresh-leaderboard', '0 * * * *',
  'refresh materialized view global_leaderboard;');

-- Session replay data
create table session_frames (
  id uuid primary key default gen_random_uuid(),
  session_id uuid references session_history(id),
  frame_number int,
  score int,
  accuracy int,
  combo int,
  timestamp_ms int,
  created_at timestamptz default now()
);

-- Enable Row Level Security
alter table battle_rooms enable row level security;
create policy "Users see own battles" on battle_rooms
  for all using (auth.uid() in (player1_id, player2_id));
```

### Row Level Security Policies

```sql
-- Profiles: anyone can read, only self can write
create policy "Public profiles" on profiles for select using (true);
create policy "Own profile" on profiles for update using (auth.uid() = id);

-- Sessions: only owner can see
create policy "Own sessions" on session_history
  for all using (auth.uid() = user_id);
```

---

## Option 2: Python FastAPI (For More Complex Game Logic)

Use this if you need: complex matchmaking algorithms, ML-based scoring, WebSocket server.

### Free Deployment Options

| Platform | Free Tier | Best For |
|----------|-----------|----------|
| **Railway** | $5/month free credits (500h) | FastAPI + background workers |
| **Render** | 750h/month, sleeps after 15min | Simple REST APIs |
| **Fly.io** | 3 shared VMs free | WebSocket servers, always-on |
| **Deno Deploy** | 100k req/day | Edge functions (TypeScript) |
| **Cloudflare Workers** | 100k req/day | Ultra-fast edge compute |

### FastAPI Setup

```bash
mkdir aura-arena-api && cd aura-arena-api
python -m venv venv && source venv/bin/activate
pip install fastapi uvicorn supabase groq python-dotenv
```

#### `main.py`

```python
from fastapi import FastAPI, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from groq import Groq
from supabase import create_client
import os, asyncio, random

app = FastAPI(title="Aura Arena API", version="1.0.0")

app.add_middleware(CORSMiddleware,
    allow_origins=["https://yourdomain.com", "http://localhost:5173"],
    allow_methods=["*"], allow_headers=["*"])

groq_client = Groq(api_key=os.environ["GROQ_API_KEY"])
supabase = create_client(os.environ["SUPABASE_URL"], os.environ["SUPABASE_SERVICE_KEY"])

# ─── AI Coach Endpoint ────────────────────────────────────────────────────────
@app.post("/api/coach/feedback")
async def coach_feedback(body: dict):
    response = groq_client.chat.completions.create(
        model="llama-3.3-70b-versatile",
        messages=[
            {"role": "system", "content": f"You are an elite {body['discipline']} coach."},
            {"role": "user", "content": f"Score: {body['score']}/100. Give 2-sentence feedback."},
        ],
        max_tokens=150
    )
    return {"feedback": response.choices[0].message.content}

# ─── WebSocket Battle Room ────────────────────────────────────────────────────
connected: dict[str, list[WebSocket]] = {}

@app.websocket("/ws/battle/{room_id}")
async def battle_socket(websocket: WebSocket, room_id: str):
    await websocket.accept()
    if room_id not in connected:
        connected[room_id] = []
    connected[room_id].append(websocket)

    try:
        while True:
            data = await websocket.receive_json()
            # Broadcast to all others in room
            for conn in connected[room_id]:
                if conn != websocket:
                    await conn.send_json(data)
    except WebSocketDisconnect:
        connected[room_id].remove(websocket)

# ─── Leaderboard ─────────────────────────────────────────────────────────────
@app.get("/api/leaderboard")
async def leaderboard(discipline: str = None, limit: int = 50):
    query = supabase.table("profiles") \
        .select("id,display_name,avatar,xp,tier,discipline,pve_wins") \
        .order("xp", desc=True) \
        .limit(limit)
    if discipline:
        query = query.eq("discipline", discipline)
    data = query.execute()
    return {"leaderboard": data.data}

# ─── Session Completion ───────────────────────────────────────────────────────
@app.post("/api/session/complete")
async def session_complete(body: dict):
    user_id = body["user_id"]
    score = body["score"]
    difficulty = body["difficulty"]
    xp_gained = round(50 * (score / 100) * difficulty)

    # Update user stats in Supabase
    supabase.rpc("increment_user_stats", {
        "p_user_id": user_id,
        "p_xp": xp_gained,
        "p_sessions": 1
    }).execute()

    return {"xp_gained": xp_gained, "message": "Session recorded"}
```

#### `Dockerfile`

```dockerfile
FROM python:3.12-slim
WORKDIR /app
COPY requirements.txt .
RUN pip install -r requirements.txt
COPY . .
CMD ["uvicorn", "main:app", "--host", "0.0.0.0", "--port", "8000"]
```

#### Deploy to Railway (free)

```bash
# Install Railway CLI
npm install -g @railway/cli
railway login
railway init
railway up
# Set env vars in Railway dashboard
```

---

## Option 3: Gaming LLM Integration (Free)

### Groq — Fastest Free Inference

Best for: real-time coaching, dynamic commentary, battle trash talk.

```bash
# Free: 14,400 requests/day
# Models: llama-3.3-70b, llama-3.1-8b, mixtral-8x7b
GROQ_API_KEY=your_key_here
```

```typescript
// src/lib/groqClient.ts
import Groq from "groq-sdk";

const client = new Groq({ apiKey: import.meta.env.VITE_GROQ_API_KEY });

export const streamCoachFeedback = async (
  discipline: string,
  score: number,
  onChunk: (text: string) => void
) => {
  const stream = client.chat.completions.stream({
    model: "llama-3.3-70b-versatile",
    messages: [
      { role: "system", content: `You are a ${discipline} performance coach.` },
      { role: "user", content: `My score was ${score}/100. Quick tip in 1 sentence?` },
    ],
    max_tokens: 80,
    stream: true,
  });

  for await (const chunk of stream) {
    const text = chunk.choices[0]?.delta?.content ?? "";
    if (text) onChunk(text);
  }
};
```

### Ollama — Run LLM Locally (Zero Cost Forever)

```bash
curl -fsSL https://ollama.ai/install.sh | sh
ollama pull llama3.2       # 2GB, fast on CPU
ollama pull phi3           # 2.3GB, faster
ollama serve               # Starts on localhost:11434
```

```typescript
// Use for dev/offline — no API costs at all
const response = await fetch("http://localhost:11434/api/generate", {
  method: "POST",
  body: JSON.stringify({
    model: "llama3.2",
    prompt: `You are a boxing coach. Score: ${score}/100. Give tip.`,
    stream: false
  })
});
const { response: text } = await response.json();
```

### Hugging Face Inference API (Free Tier)

```typescript
// 30k characters/month free
const response = await fetch(
  "https://api-inference.huggingface.co/models/mistralai/Mistral-7B-Instruct-v0.3",
  {
    headers: { Authorization: `Bearer ${import.meta.env.VITE_HF_TOKEN}` },
    method: "POST",
    body: JSON.stringify({ inputs: `[INST] Give a boxing tip for score ${score}/100 [/INST]` }),
  }
);
```

---

## Recommended `.env` for Full Stack

```bash
# Frontend (.env.local)
VITE_SUPABASE_URL=https://xxxx.supabase.co
VITE_SUPABASE_ANON_KEY=eyJ...
VITE_GEMINI_API_KEY=AIza...
VITE_GROQ_API_KEY=gsk_...
VITE_GOOGLE_CLIENT_ID=xxx.apps.googleusercontent.com

# Backend (Railway / Render)
SUPABASE_URL=https://xxxx.supabase.co
SUPABASE_SERVICE_KEY=eyJ...  # Service role (never expose to frontend)
GROQ_API_KEY=gsk_...
GEMINI_API_KEY=AIza...
```

---

## Realtime Battle Flow (Production)

```
Player A joins room ──► Supabase Realtime channel "battle:{roomId}"
Player B joins room ──► Same channel (presence tracking)
Both connected ──────► Start countdown broadcast
Every 500ms ─────────► Each player broadcasts their score
End of battle ───────► Server-side function determines winner
                        Supabase Edge Function awards XP
                        Updates leaderboard materialized view
```

### Presence (know who's online)

```typescript
const channel = supabase.channel("online_athletes", {
  config: { presence: { key: user.id } }
});

channel.on("presence", { event: "sync" }, () => {
  const onlineUsers = Object.values(channel.presenceState());
  setViewerCount(onlineUsers.length);
});

await channel.subscribe(async (status) => {
  if (status === "SUBSCRIBED") {
    await channel.track({ user_id: user.id, discipline: disc.id });
  }
});
```

---

## Cost Breakdown at Scale

| Users/Month | Supabase | Groq API | Total/month |
|-------------|----------|----------|-------------|
| 0 – 500 | Free | Free | **$0** |
| 500 – 5,000 | Free | Free | **$0** |
| 5,000 – 25,000 | Free | ~$10 | **~$10** |
| 25k+ | $25 Pro | ~$30 | **~$55** |

---

## Quick Start Checklist

- [ ] `supabase db push` to apply new schema
- [ ] Create `supabase/functions/coach-feedback/index.ts`
- [ ] Add `GROQ_API_KEY` to Supabase Secrets (`supabase secrets set GROQ_API_KEY=...`)
- [ ] Deploy functions: `supabase functions deploy coach-feedback`
- [ ] Test realtime: open 2 browser tabs, join same battle room
- [ ] Enable `pg_cron` extension in Supabase Dashboard → Extensions
- [ ] Set up leaderboard materialized view with hourly refresh

---

## Community & Learning Resources

- **Supabase Docs**: https://supabase.com/docs
- **Groq Console**: https://console.groq.com (free API keys)
- **FastAPI Docs**: https://fastapi.tiangolo.com
- **Railway Deploy**: https://railway.app
- **Supabase Discord**: 30k+ members, very active
- **Ollama**: https://ollama.ai (local LLMs for development)
