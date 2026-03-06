/**
 * Aura Arena — Asset Registry
 * All paths point to files in /public/assets/
 * All entries are PNGs — zero SVGs.
 */

const BASE = "/assets/images/generated";

export const PREMIUM_ASSETS = {
  // ── Currency ──────────────────────────────────────────────────────────────
  CURRENCY: {
    AURA_COIN: `${BASE}/aura_coin.png`,
    AURA_ORB: `${BASE}/orb_primary.png`,
  },

  // ── AI Coaches ────────────────────────────────────────────────────────────
  COACHES: {
    ARIA: `${BASE}/coach_aria_3d_1772779348000.png`,
    ARIA_ALT: `${BASE}/coach_aria_1772773458785.png`,
    MAX: `${BASE}/coach_max_3d_1772779362546.png`,
    MAX_ALT: `${BASE}/coach_max_1772773481596.png`,
    SENSEI: `${BASE}/coach_sensei_3d_1772779380769.png`,
    SENSEI_ALT: `${BASE}/coach_sensei_1772773498063.png`,
  },

  // ── User Avatars / Portraits ──────────────────────────────────────────────
  AVATARS: {
    FIGHTER: `${BASE}/avatar_fighter_1772773573408.png`,
    ROMAN: `${BASE}/avatar_roman_1772773538703.png`,
    ZEN: `${BASE}/avatar_zen_1772773555845.png`,
  },

  // ── Event Banners ─────────────────────────────────────────────────────────
  EVENTS: {
    BOXING: `${BASE}/event_boxing.png`,
    YOGA: `${BASE}/event_yoga.png`,
    ZEN: `${BASE}/event_zen.png`,
    ZEN_3D: `${BASE}/event_zen_3d_1772779447401.png`,
  },

  // ── Discipline Banners ────────────────────────────────────────────────────
  BANNERS: {
    BOXING: `${BASE}/banner_boxing_teal.png`,
    BOXING_ALT: `${BASE}/banner_boxing.png`,
    YOGA: `${BASE}/banner_yoga_teal.png`,
    YOGA_ALT: `${BASE}/banner_yoga.png`,
    MARTIAL_ARTS: `${BASE}/banner_martial_arts.png`,
    DANCE: `${BASE}/banner_dance.png`,
    GYMNASTICS: `${BASE}/banner_gymnastics.png`,
    BODYBUILDING: `${BASE}/banner_bodybuilding.png`,
    CALISTHENICS: `${BASE}/banner_calisthenics.png`,
    PILATES: `${BASE}/banner_yoga_teal.png`,
    FITNESS: `${BASE}/banner_yoga_teal.png`,
    PARKOUR: `${BASE}/banner_martial_arts.png`,
  },

  // ── Athlete Portraits ─────────────────────────────────────────────────────
  ATHLETES: {
    BOXER: `${BASE}/intro_boxing_athlete.png`,
    YOGI: `${BASE}/intro_yoga_athlete.png`,
    WARRIOR: `${BASE}/intro_martial_arts.png`,
    ARENA: `${BASE}/intro_arena_1.png`,
    REFEREE: `${BASE}/intro_arena_referee.png`,
    AI_REFEREE: `${BASE}/onboarding_ai_referee.png`,
    OCEAN: `${BASE}/intro_ocean_athlete_1772760902138.png`,
  },

  // ── Tier Badges ───────────────────────────────────────────────────────────
  BADGES: {
    BEGINNER: `${BASE}/badge_beginner.png`,
    BEGINNER_3D: `${BASE}/badge_beginner_3d_1772779689515.png`,
    INTERMEDIATE: `${BASE}/badge_intermediate.png`,
    INTERMEDIATE_3D: `${BASE}/badge_intermediate_3d_1772779706435.png`,
    ADVANCED: `${BASE}/badge_advanced.png`,
    ADVANCED_3D: `${BASE}/badge_advanced_3d_1772779724250.png`,
    PROFESSIONAL: `${BASE}/badge_professional.png`,
    PROFESSIONAL_3D: `${BASE}/badge_professional_3d_1772779741014.png`,
  },

  // ── Goal Icons ────────────────────────────────────────────────────────────
  GOALS: {
    FITNESS: `${BASE}/goal_fitness.png`,
    COMPETE: `${BASE}/goal_compete.png`,
    SKILLS: `${BASE}/goal_skills.png`,
    COMMUNITY: `${BASE}/goal_community.png`,
  },

  // ── Atmosphere / Hero Images ──────────────────────────────────────────────
  ATMOSPHERE: {
    DASHBOARD_HERO: `${BASE}/dashboard_hero_teal.png`,
    TRAINING_HUB_HERO: `${BASE}/training_hub_teal.png`,
    BATTLE_ARENA: `${BASE}/battle_arena_teal.png`,
    BATTLE_VICTORY: `${BASE}/battle_victory_3d_1772779463670.png`,
    GLOBAL_ARENA: `${BASE}/onboarding_global_arena.png`,
    AUTH_BG: `${BASE}/auth_thunder_bg_2.png`,
    AUTH_BG_ALT: `${BASE}/auth_thunder_bg_1772760918612.png`,
    PROFILE_GLOW: `${BASE}/profile_header_glow_3d_1772779766320.png`,
    TEAL_STADIUM: `${BASE}/intro_teal_stadium_1772760887170.png`,
    FUTURISTIC_UI: `${BASE}/intro_page_futuristic_ui_1772760533917.png`,
    AURA_LOGO: `${BASE}/aura_arena_typographic_logo_1772728302709.png`,
  },

  // ── Intro / Onboarding Slides ─────────────────────────────────────────────
  INTRO: {
    SLIDE_1: `${BASE}/intro_slide_1_1772753486482.png`,
    SLIDE_2: `${BASE}/intro_slide_2_1772753506206.png`,
    SLIDE_3: `${BASE}/intro_slide_3_1772753526628.png`,
    BOXING_ATHLETE: `${BASE}/intro_boxing_athlete.png`,
    YOGA_ATHLETE: `${BASE}/intro_yoga_athlete.png`,
    MARTIAL_ARTS: `${BASE}/intro_martial_arts.png`,
    ARENA_1: `${BASE}/intro_arena_1.png`,
    ARENA_REFEREE: `${BASE}/intro_arena_referee.png`,
    OCEAN_ATHLETE: `${BASE}/intro_ocean_athlete_1772760902138.png`,
    TEAL_STADIUM: `${BASE}/intro_teal_stadium_1772760887170.png`,
    ONBOARDING_AI: `${BASE}/onboarding_ai_referee.png`,
    ONBOARDING_GLOBAL: `${BASE}/onboarding_global_arena.png`,
  },

  // ── 3D Models ─────────────────────────────────────────────────────────────
  MODELS: {
    AVATAR_VRM: "/assets/models/avatar.vrm",
    XBOT: "/assets/models/Xbot.glb",
    YBOT: "/assets/models/Ybot.glb",
    ROBOT: "/assets/models/RobotExpressive.glb",
  },

  // ── Root-level assets ─────────────────────────────────────────────────────
  BRANDING: {
    LOGO: "/logo.png",
    BANNER: "/banner.png",
    INTRO_1: "/intro-1.png",
    INTRO_2: "/intro-2.png",
    INTRO_3: "/intro-3.png",
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

// Tier-id to badge image (3D variants)
export const TIER_BADGE: Record<string, string> = {
  bronze: PREMIUM_ASSETS.BADGES.BEGINNER_3D,
  silver: PREMIUM_ASSETS.BADGES.INTERMEDIATE_3D,
  gold: PREMIUM_ASSETS.BADGES.ADVANCED_3D,
  plat: PREMIUM_ASSETS.BADGES.PROFESSIONAL_3D,
  champ: PREMIUM_ASSETS.BADGES.PROFESSIONAL_3D,
  elite: PREMIUM_ASSETS.BADGES.PROFESSIONAL_3D,
};

// Avatar presets for user selection
export const AVATAR_PRESETS = [
  { id: "fighter", name: "Fighter", src: PREMIUM_ASSETS.AVATARS.FIGHTER },
  { id: "roman", name: "Roman", src: PREMIUM_ASSETS.AVATARS.ROMAN },
  { id: "zen", name: "Zen Master", src: PREMIUM_ASSETS.AVATARS.ZEN },
  { id: "boxer", name: "Boxer", src: PREMIUM_ASSETS.ATHLETES.BOXER },
  { id: "yogi", name: "Yogi", src: PREMIUM_ASSETS.ATHLETES.YOGI },
  { id: "warrior", name: "Warrior", src: PREMIUM_ASSETS.ATHLETES.WARRIOR },
];

// 3D model options for avatar selection
export const MODEL_OPTIONS = [
  {
    id: "vrm",
    name: "Custom Avatar",
    src: PREMIUM_ASSETS.MODELS.AVATAR_VRM,
    preview: PREMIUM_ASSETS.AVATARS.ZEN,
  },
  {
    id: "xbot",
    name: "X-Bot",
    src: PREMIUM_ASSETS.MODELS.XBOT,
    preview: PREMIUM_ASSETS.AVATARS.FIGHTER,
  },
  {
    id: "robot",
    name: "Robot",
    src: PREMIUM_ASSETS.MODELS.ROBOT,
    preview: PREMIUM_ASSETS.AVATARS.ROMAN,
  },
];
