/**
 * Aura Arena — Asset Registry
 * All paths point to files in /public/assets/images/generated/
 * All entries are PNGs — zero SVGs.
 */

const BASE = "/assets/images/generated";

export const PREMIUM_ASSETS = {
  // ── Currency ──────────────────────────────────────────────────────────────
  CURRENCY: {
    AURA_COIN: `${BASE}/aura_coin.svg`,
    AURA_ORB: `${BASE}/orb_primary.png`,
  },

  // ── AI Coaches ────────────────────────────────────────────────────────────
  COACHES: {
    ARIA: `${BASE}/coach_aria_3d_1772779348000.png`,
    MAX: `${BASE}/coach_max_3d_1772779362546.png`,
    SENSEI: `${BASE}/coach_sensei_3d_1772779380769.png`,
  },

  // ── Event Banners ─────────────────────────────────────────────────────────
  EVENTS: {
    BOXING: `${BASE}/event_boxing.svg`,
    YOGA: `${BASE}/event_yoga.svg`,
    ZEN: `${BASE}/event_zen.svg`,
  },

  // ── Discipline Banners ────────────────────────────────────────────────────
  BANNERS: {
    BOXING: `${BASE}/banner_boxing_teal.png`,
    YOGA: `${BASE}/banner_yoga_teal.png`,
    MARTIAL_ARTS: `${BASE}/banner_martial_arts.png`,
    DANCE: `${BASE}/banner_dance.png`,
    GYMNASTICS: `${BASE}/banner_gymnastics.svg`,
    BODYBUILDING: `${BASE}/banner_bodybuilding.svg`,
    PARKOUR: `${BASE}/banner_martial_arts.svg`,
    CALISTHENICS: `${BASE}/banner_calisthenics.svg`,
    PILATES: `${BASE}/banner_pilates.svg`,
    FITNESS: `${BASE}/banner_yoga_teal.png`,
  },

  // ── Athlete Portraits ─────────────────────────────────────────────────────
  ATHLETES: {
    BOXER: `${BASE}/intro_boxing_athlete.png`,
    YOGI: `${BASE}/intro_yoga_athlete.png`,
    WARRIOR: `${BASE}/intro_martial_arts.png`,
    ARENA: `${BASE}/intro_arena_1.png`,
    REFEREE: `${BASE}/intro_arena_referee.png`,
    AI_REFEREE: `${BASE}/onboarding_ai_referee.png`,
  },

  // ── Tier Badges ───────────────────────────────────────────────────────────
  BADGES: {
    BEGINNER: `${BASE}/badge_beginner.svg`,
    INTERMEDIATE: `${BASE}/badge_intermediate.svg`,
    ADVANCED: `${BASE}/badge_advanced.svg`,
    PROFESSIONAL: `${BASE}/badge_professional.svg`,
  },

  // ── Goal Icons ────────────────────────────────────────────────────────────
  GOALS: {
    FITNESS: `${BASE}/goal_fitness.svg`,
    COMPETE: `${BASE}/goal_compete.svg`,
    SKILLS: `${BASE}/goal_skills.svg`,
    COMMUNITY: `${BASE}/goal_community.svg`,
  },

  // ── Atmosphere / Hero Images ──────────────────────────────────────────────
  ATMOSPHERE: {
    DASHBOARD_HERO: `${BASE}/dashboard_hero_teal.png`,
    TRAINING_HUB_HERO: `${BASE}/training_hub_teal.png`,
    BATTLE_ARENA: `${BASE}/battle_arena_teal.png`,
    GLOBAL_ARENA: `${BASE}/onboarding_global_arena.png`,
    AUTH_BG: `${BASE}/auth_thunder_bg_2.png`,
    PROFILE_GLOW: `${BASE}/profile_header_glow.svg`,
    FLOOR_GRID: `${BASE}/training_floor_grid.svg`,
    VICTORY_FX: `${BASE}/battle_victory_fx.svg`,
  },
};

// Discipline-id to banner image (matches discipline IDs in the data layer)
export const DISCIPLINE_BANNER: Record<string, string> = {
  boxing: PREMIUM_ASSETS.BANNERS.BOXING,
  yoga: PREMIUM_ASSETS.BANNERS.YOGA,
  dance: PREMIUM_ASSETS.BANNERS.DANCE,
  martialarts: PREMIUM_ASSETS.BANNERS.MARTIAL_ARTS,
  gymnastics: PREMIUM_ASSETS.BANNERS.GYMNASTICS,
  fitness: PREMIUM_ASSETS.BANNERS.FITNESS,
  bodybuilding: PREMIUM_ASSETS.BANNERS.BODYBUILDING,
  parkour: PREMIUM_ASSETS.BANNERS.PARKOUR,
  calisthenics: PREMIUM_ASSETS.BANNERS.CALISTHENICS,
  pilates: PREMIUM_ASSETS.BANNERS.PILATES,
};

// Discipline-id to athlete portrait
export const DISCIPLINE_ATHLETE: Record<string, string> = {
  boxing: PREMIUM_ASSETS.ATHLETES.BOXER,
  yoga: PREMIUM_ASSETS.ATHLETES.YOGI,
  pilates: PREMIUM_ASSETS.ATHLETES.YOGI,
  fitness: PREMIUM_ASSETS.ATHLETES.YOGI,
  martialarts: PREMIUM_ASSETS.ATHLETES.WARRIOR,
  dance: PREMIUM_ASSETS.ATHLETES.WARRIOR,
  gymnastics: PREMIUM_ASSETS.ATHLETES.ARENA,
  parkour: PREMIUM_ASSETS.ATHLETES.ARENA,
  bodybuilding: PREMIUM_ASSETS.ATHLETES.BOXER,
  calisthenics: PREMIUM_ASSETS.ATHLETES.REFEREE,
};
