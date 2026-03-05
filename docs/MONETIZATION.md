# AURA ARENA — Monetization Strategy

## Revenue Model Overview

AURA ARENA uses a **freemium + consumables + seasonal** model. The free tier is genuinely valuable — users can fully play and compete forever without paying. Revenue comes from speed, cosmetics, and premium AI features.

---

## Tier 1 — Free Forever

All free users get:
- Unlimited training sessions
- All 10 disciplines + all sub-disciplines
- PvE battles (AI opponents, all difficulties)
- Reels feed (browse and post)
- League leaderboard participation
- Basic AI coaching after each session
- Daily missions + weekly challenges
- Achievement system
- Full gamification (XP, tiers, streaks)
- Offline mode with sync

---

## Tier 2 — AURA PRO ($4.99/month or $39.99/year)

### Training Enhancements
- **Advanced AI Coach**: Unlimited Gemini calls for mid-session coaching (free tier gets 3/day)
- **7-Day Training Plans**: Personalized weekly programs (free tier gets 1/week)
- **Historical Performance Analytics**: 90-day score trends, discipline heatmaps, radar evolution
- **Video Replay**: Save and review sessions with overlay visualization (coming in v2)

### Battle Advantages
- **Priority Matchmaking**: 30% faster live match finding
- **Extended PvE Roster**: Access to 3 additional "Legendary" AI opponents
- **Battle Analytics**: Detailed breakdown of every live battle

### Social
- **Reel Boost**: Pin one reel per week to "Featured" section of Discover
- **Profile Customization**: Custom profile background, animated tier badge, color themes
- **Verified Badge**: Pro members get a subtle verified indicator

### Content
- **Sub-discipline Unlocks**: All sub-disciplines unlocked immediately (free unlocks at tier progression)
- **Cultural Context Tooltips**: Deep cultural history for dance forms, martial arts lineage, etc.
- **Exclusive AI Personas**: Choose your coach's personality (Stern, Mentor, Hype, Zen)

---

## Tier 3 — AURA ELITE ($14.99/month or $99.99/year)

Everything in PRO, plus:

### On-Device AI (WebGPU)
- **Gemma on-device inference**: Real-time coaching mid-session with zero latency and zero API cost
- Works fully offline
- Expression analysis: face mesh → emotional state → coaching adjustment

### Advanced Detection
- **Full Holistic Mode**: Pose + Hands + Face simultaneously in training sessions
- **Object Detection**: Equipment detection (boxing gloves, yoga mat, weights)
- **Audio Analysis**: Music tempo detection for dance disciplines

### Competitive
- **Season Rank Rewards**: Exclusive cosmetic rewards for top 100 in each discipline each season
- **Custom Challenge Creation**: Create and send custom 24h challenges to other athletes
- **Live Spectator Mode**: Watch live battles in real-time with real viewer count

### Data
- **Full Export**: Export all personal session data as CSV/JSON
- **API Access**: Personal data API for building custom dashboards

---

## Consumables (One-Time Purchases)

| Item | Price | Description |
|---|---|---|
| Streak Freeze Pack (5×) | $1.99 | Protect your streak 5 times |
| XP Boost (7 days) | $2.99 | 2× XP earned for 7 days |
| Coaching Session | $0.99 | One premium Gemini coaching deep-dive |
| Reel Feature (24h) | $0.99 | Feature your reel on Discover for 24h |

---

## Seasonal Battle Pass ($9.99/season, 8-week seasons)

Each season has a unique theme (e.g., "Season 3: The Street Era" focused on urban disciplines).

**Free track** (all users):
- XP milestone rewards at levels 1, 5, 10, 15, 20
- Basic cosmetic unlocks

**Premium track** (purchased):
- 30 levels of rewards
- Exclusive animated tier badge skin
- Season-exclusive AI coach persona
- Discipline-specific achievement icons
- Profile frame and background
- Season title (displayed on profile)

---

## Institutional / Studio Tier (Custom Pricing)

For dance studios, martial arts schools, gyms:
- **Multi-user management**: One admin account, unlimited student accounts
- **Progress tracking**: Coach can see all students' sessions, scores, trends
- **Custom drill library**: Upload proprietary training drills
- **Group challenges**: Create cohort-wide weekly challenges
- **White-label option**: Custom app name and branding
- **CSV export**: All student data in bulk

Starting at $49/month for up to 20 students.

---

## Pricing Psychology

1. **Annual discount is significant**: Monthly × 12 vs annual = 33% savings on Pro, 44% on Elite
2. **7-day free trial on Pro**: No credit card required for trial
3. **Family plan**: 2 Pro accounts for $7.99/month (household use case)
4. **Student discount**: 40% off Pro with valid `.edu` email
5. **Discipline-specific promotions**: Partner with dance schools/boxing gyms for bulk discounts

---

## Implementation Roadmap

### MVP (Current)
- Free tier fully functional
- Pro tier paywalled (Supabase function checks subscription status)
- Stripe integration for payments (via Supabase Edge Functions)
- RevenueCat SDK for in-app purchases on iOS/Android (PWA wrapper via Capacitor)

### v2 (3 months post-launch)
- Battle Pass system with seasonal content calendar
- Institutional tier with admin dashboard
- On-device Gemma fully released (WebGPU broadly available)

### v3 (6 months post-launch)
- Creator monetization: popular reel creators earn AURA Coins from view-based revenue share
- Live coaching sessions: book 1:1 video sessions with verified human coaches (15% platform fee)
- NFT achievements (optional, opt-in, separate from main gamification)

---

## Key Metrics to Track

- **DAU / MAU ratio** (target: >30% — indicates daily habit formation)
- **Free→Pro conversion rate** (target: 8-12% within 30 days)
- **Churn rate** (target: <5% monthly for Pro)
- **Sessions per DAU** (target: >2 per day for engaged users)
- **ARPU** (Average Revenue Per User): target $3.50/month blended
- **LTV** (Lifetime Value): target $45 at 12-month horizon

---

## Supabase Integration for Subscriptions

```sql
-- Subscription status in user profile
ALTER TABLE profiles ADD COLUMN subscription_tier TEXT DEFAULT 'free';
ALTER TABLE profiles ADD COLUMN subscription_expires_at TIMESTAMPTZ;
ALTER TABLE profiles ADD COLUMN stripe_customer_id TEXT;

-- RLS: user can only see their own subscription
CREATE POLICY "Users see own subscription"
  ON profiles FOR SELECT USING (auth.uid() = id);
```

Supabase Edge Function `check-subscription` is called on app init and caches result for 1 hour.
