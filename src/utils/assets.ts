/**
 * ═══════════════════════════════════════════════════════════════════════════════
 * AURA ARENA — Complete Asset Registry
 * Every image from /public/ is registered here.
 * Arrays are used where multiple variants exist so components can loop/rotate.
 * ═══════════════════════════════════════════════════════════════════════════════
 */

const G = "/assets/images/generated";

// ─── Coaches (arrays for looping) ─────────────────────────────────────────────

export const COACH_ARIA = [
  `${G}/coach_aria_3d_1772779348000.png`,
  `${G}/coach_aria_1772773458785.png`,
];
export const COACH_MAX = [
  `${G}/coach_max_3d_1772779362546.png`,
  `${G}/coach_max_1772773481596.png`,
];
export const COACH_SENSEI = [
  `${G}/coach_sensei_3d_1772779380769.png`,
  `${G}/coach_sensei_1772773498063.png`,
];
export const ALL_COACHES = [...COACH_ARIA, ...COACH_MAX, ...COACH_SENSEI];

// ─── Avatars / Portraits (arrays for looping) ─────────────────────────────────

export const AVATAR_FIGHTER = [`${G}/avatar_fighter_1772773573408.png`];
export const AVATAR_ROMAN = [`${G}/avatar_roman_1772773538703.png`];
export const AVATAR_ZEN = [`${G}/avatar_zen_1772773555845.png`];
export const ALL_AVATARS = [...AVATAR_FIGHTER, ...AVATAR_ROMAN, ...AVATAR_ZEN];

// ─── Athletes / Intro portraits (arrays — each has 2 variants) ────────────────

export const ATHLETE_BOXER = [
  `${G}/intro_boxing_athlete.png`,
  `${G}/intro_boxing_athlete_1772756084893.png`,
];
export const ATHLETE_YOGI = [
  `${G}/intro_yoga_athlete.png`,
  `${G}/intro_yoga_athlete_1772756099695.png`,
];
export const ATHLETE_MARTIAL = [
  `${G}/intro_martial_arts.png`,
  `${G}/intro_martial_arts_1772756124887.png`,
];
export const ATHLETE_ARENA = [
  `${G}/intro_arena_1.png`,
  `${G}/intro_arena_1_1772756895178.png`,
];
export const ATHLETE_REFEREE = [
  `${G}/intro_arena_referee.png`,
  `${G}/intro_arena_referee_1772756914605.png`,
];
export const ATHLETE_OCEAN = [`${G}/intro_ocean_athlete_1772760902138.png`];
export const ALL_ATHLETES = [
  ...ATHLETE_BOXER,
  ...ATHLETE_YOGI,
  ...ATHLETE_MARTIAL,
  ...ATHLETE_ARENA,
  ...ATHLETE_REFEREE,
  ...ATHLETE_OCEAN,
];

// ─── Badges (arrays — flat, 3d, and alt variants) ─────────────────────────────

export const BADGE_BEGINNER = [
  `${G}/badge_beginner.png`,
  `${G}/badge_beginner_3d_1772779689515.png`,
];
export const BADGE_INTERMEDIATE = [
  `${G}/badge_intermediate.png`,
  `${G}/badge_intermediate_3d_1772779706435.png`,
];
export const BADGE_ADVANCED = [
  `${G}/badge_advanced.png`,
  `${G}/badge_advanced_3d_1772779724250.png`,
];
export const BADGE_PROFESSIONAL = [
  `${G}/badge_professional.png`,
  `${G}/badge_professional_1772825000138.png`,
  `${G}/badge_professional_3d_1772779741014.png`,
];
export const ALL_BADGES = [
  ...BADGE_BEGINNER,
  ...BADGE_INTERMEDIATE,
  ...BADGE_ADVANCED,
  ...BADGE_PROFESSIONAL,
];

// ─── Goals ────────────────────────────────────────────────────────────────────

export const GOAL_FITNESS = [`${G}/goal_fitness.png`];
export const GOAL_COMPETE = [`${G}/goal_compete.png`];
export const GOAL_SKILLS = [
  `${G}/goal_skills.png`,
  `${G}/goal_skills_1772831683381.png`,
];
export const GOAL_COMMUNITY = [`${G}/goal_community.png`];
export const ALL_GOALS = [
  ...GOAL_FITNESS,
  ...GOAL_COMPETE,
  ...GOAL_SKILLS,
  ...GOAL_COMMUNITY,
];

// ─── Events (arrays for looping) ──────────────────────────────────────────────

export const EVENT_BOXING = [`${G}/event_boxing.png`];
export const EVENT_YOGA = [`${G}/event_yoga.png`];
export const EVENT_ZEN = [
  `${G}/event_zen.png`,
  `${G}/event_zen_3d_1772779447401.png`,
];
export const ALL_EVENTS = [...EVENT_BOXING, ...EVENT_YOGA, ...EVENT_ZEN];

// ─── Discipline Banners (arrays — teal + original) ────────────────────────────

export const BANNER_BOXING = [
  `${G}/banner_boxing_teal.png`,
  `${G}/banner_boxing.png`,
];
export const BANNER_YOGA = [
  `${G}/banner_yoga_teal.png`,
  `${G}/banner_yoga.png`,
];
export const BANNER_MARTIAL = [`${G}/banner_martial_arts.png`];
export const BANNER_DANCE = [`${G}/banner_dance.png`];
export const BANNER_GYMNASTICS = [`${G}/banner_gymnastics.png`];
export const BANNER_BODYBUILDING = [`${G}/banner_bodybuilding.png`];
export const BANNER_CALISTHENICS = [`${G}/banner_calisthenics.png`];
export const BANNER_FITNESS = [`${G}/banner_fitness.png`];
export const BANNER_WRESTLING = [`${G}/banner_wrestling.png`];
export const BANNER_PILATES = [`${G}/banner_pilates.png`];
export const BANNER_PARKOUR = [`${G}/banner_parkour.png`];
export const BANNER_CAPOEIRA = [`${G}/banner_capoeira.png`];
export const BANNER_SATTRIYA = [`${G}/banner_sattriya.png`];
export const ALL_BANNERS = [
  ...BANNER_BOXING,
  ...BANNER_YOGA,
  ...BANNER_MARTIAL,
  ...BANNER_DANCE,
  ...BANNER_GYMNASTICS,
  ...BANNER_BODYBUILDING,
  ...BANNER_CALISTHENICS,
  ...BANNER_FITNESS,
  ...BANNER_WRESTLING,
  ...BANNER_PILATES,
  ...BANNER_PARKOUR,
  ...BANNER_CAPOEIRA,
  ...BANNER_SATTRIYA,
];

// ─── Currency & Dynamic Icons ───────────────────────────────────────────────────

export const AURA_COINS = [
  `${G}/aura_coin.png`,
  `${G}/aura_coin_1772831535038.png`,
];
export const ORB_PRIMARY = [`${G}/orb_primary.png`];
export const ICON_STREAK = [`${G}/icon_streak.png`];
export const ICON_COMBAT = [`${G}/icon_combat.png`];
export const ICON_SOCIAL = [`${G}/icon_social.png`];

// ─── Atmosphere / Hero / Background ───────────────────────────────────────────

export const HERO_DASHBOARD = [
  `${G}/dashboard_hero_teal.png`,
  `${G}/intro_teal_stadium_1772760887170.png`,
];
export const HERO_TRAINING = [
  `${G}/training_hub_teal.png`,
  `${G}/profile_header_glow_3d_1772779766320.png`,
];
export const HERO_BATTLE = [
  `${G}/battle_arena_teal.png`,
  `${G}/onboarding_global_arena.png`,
];
export const HERO_VICTORY = [`${G}/battle_victory_3d_1772779463670.png`];
export const HERO_PROFILE_GLOW = [
  `${G}/profile_header_glow_3d_1772779766320.png`,
];
export const AUTH_BACKGROUNDS = [
  `${G}/auth_thunder_bg_2.png`,
  `${G}/auth_thunder_bg_1772760918612.png`,
];
export const ALL_HEROES = [
  ...HERO_DASHBOARD,
  ...HERO_TRAINING,
  ...HERO_BATTLE,
  ...HERO_VICTORY,
  ...HERO_PROFILE_GLOW,
  ...AUTH_BACKGROUNDS,
];

// ─── Intro / Onboarding slides ───────────────────────────────────────────────

export const INTRO_SLIDES = [
  `${G}/intro_slide_1_1772753486482.png`,
  `${G}/intro_slide_2_1772753506206.png`,
  `${G}/intro_slide_3_1772753526628.png`,
];
export const INTRO_MISC = [
  `${G}/intro_slider_verification_1772755847121.png`,
  `${G}/intro_teal_stadium_1772760887170.png`,
  `${G}/intro_page_futuristic_ui_1772760533917.png`,
  `${G}/onboarding_ai_referee.png`,
  `${G}/onboarding_global_arena.png`,
];

// ─── Branding / Logo ─────────────────────────────────────────────────────────

export const LOGOS = [
  `${G}/aura_arena_typographic_logo_1772979698632.png`,
  "/icons/premium_aura_arena_logo_1772720306119.png",
];
export const ROOT_BANNERS = [HERO_BATTLE[1]];
export const ROOT_INTROS = INTRO_SLIDES;

// ─── PWA Icons ───────────────────────────────────────────────────────────────

export const ICONS = ["/icons/icon-192.png", "/icons/icon-512.png"];

// ─── 3D Models ───────────────────────────────────────────────────────────────

export const MODELS = {
  XBOT: "/assets/models/Xbot.glb",
  YBOT: "/assets/models/Ybot.glb",
  ROBOT: "/assets/models/RobotExpressive.glb",
  SOLDIER: "/assets/models/Soldier.glb",
  NINJA: "/assets/models/ninja.glb",
  HUMAN_MALE: "/assets/models/human_vrm_2.glb",
  HUMAN_FEMALE: "/assets/models/human_vrm_1.glb",
  VROID_MALE: "/assets/models/vroid_male.vrm",
  VROID_FEMALE: "/assets/models/vroid_female.vrm",
};
export const ALL_MODELS = Object.values(MODELS);

// ═════════════════════════════════════════════════════════════════════════════
// PREMIUM_ASSETS — backwards-compatible single-image map
// Components that need a single image use [0] from the arrays above.
// ═════════════════════════════════════════════════════════════════════════════

export const PREMIUM_ASSETS = {
  CURRENCY: {
    AURA_COIN: AURA_COINS[0],
    AURA_COIN_ALT: AURA_COINS[1],
    AURA_ORB: ORB_PRIMARY[0],
  },

  COACHES: {
    ARIA: COACH_ARIA[0],
    ARIA_ALT: COACH_ARIA[1],
    MAX: COACH_MAX[0],
    MAX_ALT: COACH_MAX[1],
    SENSEI: COACH_SENSEI[0],
    SENSEI_ALT: COACH_SENSEI[1],
  },

  AVATARS: {
    FIGHTER: AVATAR_FIGHTER[0],
    ROMAN: AVATAR_ROMAN[0],
    ZEN: AVATAR_ZEN[0],
  },

  EVENTS: {
    BOXING: EVENT_BOXING[0],
    YOGA: EVENT_YOGA[0],
    ZEN: EVENT_ZEN[0],
    ZEN_3D: EVENT_ZEN[1],
  },

  BANNERS: {
    BOXING: BANNER_BOXING[0],
    BOXING_ALT: BANNER_BOXING[1],
    YOGA: BANNER_YOGA[0],
    YOGA_ALT: BANNER_YOGA[1],
    MARTIAL_ARTS: BANNER_MARTIAL[0],
    DANCE: BANNER_DANCE[0],
    GYMNASTICS: BANNER_GYMNASTICS[0],
    BODYBUILDING: BANNER_BODYBUILDING[0],
    CALISTHENICS: BANNER_CALISTHENICS[0],
    PILATES: BANNER_PILATES[0],
    FITNESS: BANNER_FITNESS[0],
    PARKOUR: BANNER_PARKOUR[0],
    WRESTLING: BANNER_WRESTLING[0],
  },

  ATHLETES: {
    BOXER: ATHLETE_BOXER[0],
    BOXER_ALT: ATHLETE_BOXER[1],
    YOGI: ATHLETE_YOGI[0],
    YOGI_ALT: ATHLETE_YOGI[1],
    WARRIOR: ATHLETE_MARTIAL[0],
    WARRIOR_ALT: ATHLETE_MARTIAL[1],
    ARENA: ATHLETE_ARENA[0],
    ARENA_ALT: ATHLETE_ARENA[1],
    REFEREE: ATHLETE_REFEREE[0],
    REFEREE_ALT: ATHLETE_REFEREE[1],
    OCEAN: ATHLETE_OCEAN[0],
  },

  BADGES: {
    BEGINNER: BADGE_BEGINNER[0],
    BEGINNER_3D: BADGE_BEGINNER[1],
    INTERMEDIATE: BADGE_INTERMEDIATE[0],
    INTERMEDIATE_3D: BADGE_INTERMEDIATE[1],
    ADVANCED: BADGE_ADVANCED[0],
    ADVANCED_3D: BADGE_ADVANCED[1],
    PROFESSIONAL: BADGE_PROFESSIONAL[0],
    PROFESSIONAL_ALT: BADGE_PROFESSIONAL[1],
    PROFESSIONAL_3D: BADGE_PROFESSIONAL[2],
  },

  GOALS: {
    FITNESS: GOAL_FITNESS[0],
    COMPETE: GOAL_COMPETE[0],
    SKILLS: GOAL_SKILLS[0],
    SKILLS_ALT: GOAL_SKILLS[1],
    COMMUNITY: GOAL_COMMUNITY[0],
  },

  ICONS: {
    STREAK: ICON_STREAK[0],
    COMBAT: ICON_COMBAT[0],
    SOCIAL: ICON_SOCIAL[0],
  },

  ATMOSPHERE: {
    DASHBOARD_HERO: HERO_DASHBOARD[0],
    TRAINING_HUB_HERO: HERO_TRAINING[0],
    BATTLE_ARENA: HERO_BATTLE[0],
    BATTLE_VICTORY: HERO_VICTORY[0],
    GLOBAL_ARENA: INTRO_MISC[4],
    AUTH_BG: AUTH_BACKGROUNDS[0],
    AUTH_BG_ALT: AUTH_BACKGROUNDS[1],
    PROFILE_GLOW: HERO_PROFILE_GLOW[0],
    TEAL_STADIUM: INTRO_MISC[1],
    FUTURISTIC_UI: INTRO_MISC[2],
    AURA_LOGO: LOGOS[0],
    HERO_ROTATION_DASHBOARD: HERO_DASHBOARD,
    HERO_ROTATION_TRAINING: HERO_TRAINING,
    HERO_ROTATION_BATTLE: HERO_BATTLE,
  },

  INTRO: {
    SLIDE_1: INTRO_SLIDES[0],
    SLIDE_2: INTRO_SLIDES[1],
    SLIDE_3: INTRO_SLIDES[2],
    VERIFICATION: INTRO_MISC[0],
    BOXING_ATHLETE: ATHLETE_BOXER[0],
    YOGA_ATHLETE: ATHLETE_YOGI[0],
    MARTIAL_ARTS: ATHLETE_MARTIAL[0],
    ARENA_1: ATHLETE_ARENA[0],
    ARENA_REFEREE: ATHLETE_REFEREE[0],
    OCEAN_ATHLETE: ATHLETE_OCEAN[0],
    TEAL_STADIUM: INTRO_MISC[1],
    ONBOARDING_AI: INTRO_MISC[3],
    ONBOARDING_GLOBAL: INTRO_MISC[4],
  },

  MODELS,

  BRANDING: {
    LOGO: LOGOS[1], // Fallback to premium icon if base logo requested
    LOGO_PREMIUM: LOGOS[1],
    LOGO_TYPOGRAPHIC: LOGOS[0],
    BANNER: ROOT_BANNERS[0],
    INTRO_1: ROOT_INTROS[0],
    INTRO_2: ROOT_INTROS[1],
    INTRO_3: ROOT_INTROS[2],
  },
};

// ═════════════════════════════════════════════════════════════════════════════
// LOOPING ARRAYS — Use these where components rotate through images
// ═════════════════════════════════════════════════════════════════════════════

/** Map of coach name → all their image variants */
export const COACH_IMAGES: Record<string, string[]> = {
  Aria: COACH_ARIA,
  Max: COACH_MAX,
  Sensei: COACH_SENSEI,
};

/** Map of discipline id → all banner variants */
export const DISCIPLINE_BANNERS: Record<string, string[]> = {
  boxing: BANNER_BOXING,
  yoga: BANNER_YOGA,
  dance: BANNER_DANCE,
  martialarts: BANNER_MARTIAL,
  gymnastics: BANNER_GYMNASTICS,
  fitness: BANNER_FITNESS,
  bodybuilding: BANNER_BODYBUILDING,
  parkour: BANNER_PARKOUR,
  calisthenics: BANNER_CALISTHENICS,
  pilates: BANNER_PILATES,
  wrestling: BANNER_WRESTLING,
  capoeira: BANNER_CAPOEIRA,
  sattriya: BANNER_SATTRIYA,
};

/** Map of discipline id → all athlete portrait variants */
export const DISCIPLINE_ATHLETES: Record<string, string[]> = {
  boxing: ATHLETE_BOXER,
  yoga: ATHLETE_YOGI,
  pilates: ATHLETE_YOGI,
  fitness: ATHLETE_YOGI,
  martialarts: ATHLETE_MARTIAL,
  dance: ATHLETE_MARTIAL,
  gymnastics: ATHLETE_ARENA,
  parkour: ATHLETE_ARENA,
  bodybuilding: ATHLETE_BOXER,
  calisthenics: ATHLETE_REFEREE,
};

/** Map of tier id → all badge variants */
export const TIER_BADGES: Record<string, string[]> = {
  bronze: BADGE_BEGINNER,
  silver: BADGE_INTERMEDIATE,
  gold: BADGE_ADVANCED,
  plat: BADGE_PROFESSIONAL,
  champ: BADGE_PROFESSIONAL,
  elite: BADGE_PROFESSIONAL,
};

/** Map of goal id → all goal image variants */
export const GOAL_IMAGES: Record<string, string[]> = {
  fitness: GOAL_FITNESS,
  compete: GOAL_COMPETE,
  skills: GOAL_SKILLS,
  community: GOAL_COMMUNITY,
};

/** Map of event type → all event image variants */
export const EVENT_IMAGES: Record<string, string[]> = {
  boxing: EVENT_BOXING,
  yoga: EVENT_YOGA,
  zen: EVENT_ZEN,
};

/** All hero/atmosphere images for background rotation */
export const HERO_ROTATION = [
  ...HERO_DASHBOARD,
  ...HERO_TRAINING,
  ...HERO_BATTLE,
  ...HERO_VICTORY,
  ...HERO_PROFILE_GLOW,
];

/** All intro/onboarding images for slideshow */
export const INTRO_ROTATION = [
  ...INTRO_SLIDES,
  ...INTRO_MISC,
  ...ATHLETE_BOXER,
  ...ATHLETE_YOGI,
  ...ATHLETE_MARTIAL,
  ...ATHLETE_ARENA,
  ...ATHLETE_REFEREE,
];

// ═════════════════════════════════════════════════════════════════════════════
// Single-value backward-compatible maps
// ═════════════════════════════════════════════════════════════════════════════

/** Discipline id → first banner image */
export const DISCIPLINE_BANNER: Record<string, string> = Object.fromEntries(
  Object.entries(DISCIPLINE_BANNERS).map(([k, v]) => [k, v[0]]),
);

/** Discipline id → first athlete portrait */
export const DISCIPLINE_ATHLETE: Record<string, string> = Object.fromEntries(
  Object.entries(DISCIPLINE_ATHLETES).map(([k, v]) => [k, v[0]]),
);

/** Tier id → first (3D) badge */
export const TIER_BADGE: Record<string, string> = Object.fromEntries(
  Object.entries(TIER_BADGES).map(([k, v]) => [k, v[v.length - 1]]),
);

// ─── Avatar presets ──────────────────────────────────────────────────────────

export const AVATAR_PRESETS = [
  { id: "fighter", name: "Fighter", src: AVATAR_FIGHTER[0] },
  { id: "roman", name: "Roman", src: AVATAR_ROMAN[0] },
  { id: "zen", name: "Zen Master", src: AVATAR_ZEN[0] },
  { id: "boxer", name: "Boxer", src: ATHLETE_BOXER[0] },
  { id: "yogi", name: "Yogi", src: ATHLETE_YOGI[0] },
  { id: "warrior", name: "Warrior", src: ATHLETE_MARTIAL[0] },
  { id: "ocean", name: "Ocean", src: ATHLETE_OCEAN[0] },
  { id: "arena", name: "Champion", src: ATHLETE_ARENA[0] },
  { id: "referee", name: "Referee", src: ATHLETE_REFEREE[0] },
];

// ─── Model options ───────────────────────────────────────────────────────────

export const MODEL_OPTIONS = [
  { id: "xbot",    name: "XBot Alpha",    src: MODELS.XBOT,    preview: PREMIUM_ASSETS.AVATARS.FIGHTER },
  { id: "soldier", name: "Soldier",       src: MODELS.SOLDIER, preview: PREMIUM_ASSETS.ATHLETES.WARRIOR },
  { id: "robot",   name: "Android Mk.II", src: MODELS.ROBOT,   preview: PREMIUM_ASSETS.ATHLETES.ARENA },
  { id: "ninja",   name: "Ninja",         src: MODELS.NINJA,   preview: PREMIUM_ASSETS.AVATARS.ZEN },
];

// ─── Helper: cycle through an image array ─────────────────────────────────────
/** Returns a function that cycles through images on each call */
export function createImageCycler(images: string[]) {
  let idx = 0;
  return () => {
    const img = images[idx % images.length];
    idx++;
    return img;
  };
}

// ─── Helper: React hook-friendly — pick image by index ────────────────────────
/** Given an array and an index (e.g. from setInterval counter), returns the image */
export function pickImage(images: string[], index: number): string {
  return images[index % images.length];
}

// ═════════════════════════════════════════════════════════════════════════════
// SUB-DISCIPLINE BANNERS
// ═════════════════════════════════════════════════════════════════════════════

export const SUB_BANNER_BHARATNATYAM = [`${G}/banner_bharatnatyam.png`];
export const SUB_BANNER_KATHAK = [`${G}/banner_kathak.png`];
export const SUB_BANNER_ODISSI = [`${G}/banner_odissi.png`];
export const SUB_BANNER_KUCHIPUDI = [`${G}/banner_kuchipudi.png`];
export const SUB_BANNER_MANIPURI = [`${G}/banner_manipuri.png`];
export const SUB_BANNER_MOHINIYATTAM = [`${G}/banner_mohiniyattam.png`];
export const SUB_BANNER_BHANGRA = [`${G}/banner_bhangra.png`];
export const SUB_BANNER_BALLET = [`${G}/banner_ballet.png`];
export const SUB_BANNER_HIPHOP = [`${G}/banner_hiphop.png`];
export const SUB_BANNER_SALSA = [`${G}/banner_salsa.png`];
export const SUB_BANNER_FLAMENCO = [`${G}/banner_flamenco.png`];
export const SUB_BANNER_KALARIPAYATTU = [`${G}/banner_kalaripayattu.png`];
export const SUB_BANNER_MUAY_THAI = [`${G}/banner_muay_thai.png`];

/** Map of sub-discipline id → banner images (with fallbacks) */
export const SUB_DISCIPLINE_BANNERS: Record<string, string[]> = {
  // ─── Indian Classical Dance ────────────────────────────────────────────
  bharatnatyam: SUB_BANNER_BHARATNATYAM,
  bharatanatyam_varnam: SUB_BANNER_BHARATNATYAM,
  kathak: SUB_BANNER_KATHAK,
  odissi: SUB_BANNER_ODISSI,
  kuchipudi: SUB_BANNER_KUCHIPUDI,
  manipuri: SUB_BANNER_MANIPURI,
  mohiniyattam: SUB_BANNER_MOHINIYATTAM,
  sattriya: SUB_BANNER_ODISSI, // fallback: closest classical style

  // ─── Indian Folk Dance ─────────────────────────────────────────────────
  bhangra: SUB_BANNER_BHANGRA,
  garba: SUB_BANNER_BHANGRA, // folk energy fallback
  lavani: SUB_BANNER_BHARATNATYAM, // Indian classical fallback
  dandiya: SUB_BANNER_BHANGRA,
  bihu: SUB_BANNER_BHANGRA,
  ghoomar: SUB_BANNER_MANIPURI,

  // ─── Western Classical ─────────────────────────────────────────────────
  ballet: SUB_BANNER_BALLET,
  contemporary: SUB_BANNER_BALLET,
  modern: SUB_BANNER_BALLET,

  // ─── Street / Urban ────────────────────────────────────────────────────
  hiphop: SUB_BANNER_HIPHOP,
  breakdance: SUB_BANNER_HIPHOP,
  popping: SUB_BANNER_HIPHOP,
  locking: SUB_BANNER_HIPHOP,
  waacking: SUB_BANNER_HIPHOP,
  krump: SUB_BANNER_HIPHOP,
  house: SUB_BANNER_HIPHOP,
  voguing: SUB_BANNER_HIPHOP,
  tutting: SUB_BANNER_HIPHOP,
  boogaloo: SUB_BANNER_HIPHOP,

  // ─── Latin ─────────────────────────────────────────────────────────────
  salsa: SUB_BANNER_SALSA,
  bachata: SUB_BANNER_SALSA,
  merengue: SUB_BANNER_SALSA,
  cumbia: SUB_BANNER_SALSA,
  samba: SUB_BANNER_SALSA,
  tango: SUB_BANNER_FLAMENCO,
  flamenco: SUB_BANNER_FLAMENCO,

  // ─── East Asian ────────────────────────────────────────────────────────
  kpop: SUB_BANNER_HIPHOP,
  japanese_bon: SUB_BANNER_MANIPURI,
  chinese_fan: SUB_BANNER_ODISSI,

  // ─── Other Dance ───────────────────────────────────────────────────────
  belly_dance: SUB_BANNER_MOHINIYATTAM,
  afrobeats: SUB_BANNER_BHANGRA,
  jazz: SUB_BANNER_BALLET,
  tap: SUB_BANNER_KATHAK, // rhythm-heavy like Kathak
  irish: SUB_BANNER_KATHAK,
  freestyle: SUB_BANNER_HIPHOP,

  // ─── Martial Arts — Striking ───────────────────────────────────────────
  muay_thai: SUB_BANNER_MUAY_THAI,
  muay_thai_boxing: SUB_BANNER_MUAY_THAI,
  kickboxing: SUB_BANNER_MUAY_THAI,
  kickboxing_k1: SUB_BANNER_MUAY_THAI,
  karate_shotokan: BANNER_MARTIAL,
  karate_kyokushin: BANNER_MARTIAL,
  karate_goju_ryu: BANNER_MARTIAL,
  karate_wado_ryu: BANNER_MARTIAL,
  taekwondo_wtf: BANNER_MARTIAL,
  taekwondo_itf: BANNER_MARTIAL,
  savate: SUB_BANNER_MUAY_THAI,
  capoeira: SUB_BANNER_KALARIPAYATTU,
  kung_fu_shaolin: BANNER_MARTIAL,
  kung_fu_wing_chun: BANNER_MARTIAL,
  kung_fu_wushu: BANNER_MARTIAL,
  kung_fu_tai_chi: BANNER_MARTIAL,
  silat: SUB_BANNER_KALARIPAYATTU,
  arnis: BANNER_MARTIAL,
  kali: BANNER_MARTIAL,

  // ─── Martial Arts — Grappling ──────────────────────────────────────────
  judo: BANNER_WRESTLING,
  bjj: BANNER_WRESTLING,
  wrestling_freestyle: BANNER_WRESTLING,
  wrestling_greco: BANNER_WRESTLING,
  sambo: BANNER_WRESTLING,
  hapkido: BANNER_MARTIAL,
  aikido: BANNER_MARTIAL,

  // ─── Martial Arts — Japanese ───────────────────────────────────────────
  ninjutsu: BANNER_MARTIAL,
  kendo: BANNER_MARTIAL,
  jujutsu: BANNER_WRESTLING,
  sumo: BANNER_WRESTLING,

  // ─── Martial Arts — Indian ─────────────────────────────────────────────
  kalaripayattu: SUB_BANNER_KALARIPAYATTU,
  gatka: SUB_BANNER_KALARIPAYATTU,
  malla_yuddha: BANNER_WRESTLING,
  mma: BANNER_BOXING,

  // ─── Boxing ────────────────────────────────────────────────────────────
  orthodox: BANNER_BOXING,
  southpaw: BANNER_BOXING,
  switch_hitter: BANNER_BOXING,
  swarmer: BANNER_BOXING,
  out_boxer: BANNER_BOXING,
  slugger: BANNER_BOXING,
  counter_puncher: BANNER_BOXING,

  // ─── Yoga ──────────────────────────────────────────────────────────────
  hatha: BANNER_YOGA,
  vinyasa: BANNER_YOGA,
  ashtanga: BANNER_YOGA,
  iyengar: BANNER_YOGA,
  kundalini: BANNER_YOGA,
  yin: BANNER_YOGA,
  restorative: BANNER_YOGA,
  power: BANNER_YOGA,
  bikram: BANNER_YOGA,
  sivananda: BANNER_YOGA,
  anusara: BANNER_YOGA,
  jivamukti: BANNER_YOGA,
  aerial: BANNER_GYMNASTICS,

  // ─── Gymnastics ────────────────────────────────────────────────────────
  artistic_floor: BANNER_GYMNASTICS,
  artistic_beam: BANNER_GYMNASTICS,
  artistic_vault: BANNER_GYMNASTICS,
  artistic_bars: BANNER_GYMNASTICS,
  rhythmic_ribbon: BANNER_GYMNASTICS,
  rhythmic_hoop: BANNER_GYMNASTICS,
  rhythmic_ball: BANNER_GYMNASTICS,
  rhythmic_clubs: BANNER_GYMNASTICS,
  acrobatic: BANNER_GYMNASTICS,
  trampoline: BANNER_GYMNASTICS,
  power_tumbling: BANNER_GYMNASTICS,
  parkour_gym: BANNER_PARKOUR,

  // ─── Fitness ───────────────────────────────────────────────────────────
  hiit: BANNER_FITNESS,
  crossfit: BANNER_FITNESS,
  functional: BANNER_FITNESS,
  cardio_kickbox: BANNER_FITNESS,
  zumba: BANNER_FITNESS,
  aerobics: BANNER_FITNESS,
  tabata: BANNER_FITNESS,
  circuit: BANNER_FITNESS,
  athletic: BANNER_FITNESS,
};

/** Sub-discipline id → first banner image */
export const SUB_DISCIPLINE_BANNER: Record<string, string> = Object.fromEntries(
  Object.entries(SUB_DISCIPLINE_BANNERS).map(([k, v]) => [k, v[0]]),
);

/** Get banner for any level — tries sub-discipline first, then discipline */
export function getBanner(discipline?: string, subDiscipline?: string): string {
  if (subDiscipline && SUB_DISCIPLINE_BANNER[subDiscipline]) {
    return SUB_DISCIPLINE_BANNER[subDiscipline];
  }
  if (discipline && DISCIPLINE_BANNER[discipline]) {
    return DISCIPLINE_BANNER[discipline];
  }
  return BANNER_BOXING[0]; // ultimate fallback
}
