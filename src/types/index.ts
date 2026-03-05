// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Complete Type System
// Functional, strict, exhaustive
// ═══════════════════════════════════════════════════════════════════════════════

// ─── DISCIPLINE IDs ────────────────────────────────────────────────────────────
export type DisciplineId =
  | "boxing"
  | "dance"
  | "yoga"
  | "bodybuilding"
  | "martialarts"
  | "parkour"
  | "gymnastics"
  | "fitness"
  | "calisthenics"
  | "pilates";

// ─── DANCE SUB-STYLES ──────────────────────────────────────────────────────────
export type DanceStyleId =
  // Indian Classical
  | "bharatnatyam"
  | "kathak"
  | "odissi"
  | "kuchipudi"
  | "manipuri"
  | "mohiniyattam"
  | "sattriya"
  | "bharatanatyam_varnam"
  // Indian Folk
  | "bhangra"
  | "garba"
  | "lavani"
  | "bihu"
  | "ghoomar"
  | "dandiya"
  // Western Classical
  | "ballet"
  | "contemporary"
  | "modern"
  // Street / Urban
  | "hiphop"
  | "breakdance"
  | "popping"
  | "locking"
  | "waacking"
  | "krump"
  | "house"
  | "voguing"
  | "tutting"
  | "boogaloo"
  // Latin
  | "salsa"
  | "bachata"
  | "merengue"
  | "cumbia"
  | "samba"
  | "tango"
  | "flamenco"
  // East Asian
  | "kpop"
  | "japanese_bon"
  | "chinese_fan"
  // Other
  | "belly_dance"
  | "afrobeats"
  | "jazz"
  | "tap"
  | "irish"
  | "freestyle";

// ─── MARTIAL ARTS SUB-STYLES ───────────────────────────────────────────────────
export type MartialArtsStyleId =
  // Striking
  | "karate_shotokan"
  | "karate_kyokushin"
  | "karate_goju_ryu"
  | "karate_wado_ryu"
  | "taekwondo_wtf"
  | "taekwondo_itf"
  | "muay_thai"
  | "kickboxing"
  | "savate"
  | "capoeira"
  | "kung_fu_shaolin"
  | "kung_fu_wing_chun"
  | "kung_fu_wushu"
  | "kung_fu_tai_chi"
  | "silat"
  | "arnis"
  | "kali"
  // Grappling / Ground
  | "judo"
  | "bjj"
  | "wrestling_freestyle"
  | "wrestling_greco"
  | "sambo"
  | "hapkido"
  | "aikido"
  // Japanese
  | "ninjutsu"
  | "kendo"
  | "jujutsu"
  | "sumo"
  // Indian
  | "kalaripayattu"
  | "gatka"
  | "malla_yuddha"
  // Mixed
  | "mma";

// ─── BOXING SUB-STYLES ─────────────────────────────────────────────────────────
export type BoxingStyleId =
  | "orthodox"
  | "southpaw"
  | "switch_hitter"
  | "swarmer"
  | "out_boxer"
  | "slugger"
  | "counter_puncher"
  | "kickboxing_k1"
  | "muay_thai_boxing";

// ─── YOGA SUB-STYLES ───────────────────────────────────────────────────────────
export type YogaStyleId =
  | "hatha"
  | "vinyasa"
  | "ashtanga"
  | "iyengar"
  | "kundalini"
  | "yin"
  | "restorative"
  | "power"
  | "bikram"
  | "sivananda"
  | "anusara"
  | "jivamukti"
  | "aerial";

// ─── GYMNASTICS SUB-STYLES ─────────────────────────────────────────────────────
export type GymnasticsStyleId =
  | "artistic_floor"
  | "artistic_beam"
  | "artistic_vault"
  | "artistic_bars"
  | "rhythmic_ribbon"
  | "rhythmic_hoop"
  | "rhythmic_ball"
  | "rhythmic_clubs"
  | "acrobatic"
  | "trampoline"
  | "power_tumbling"
  | "parkour_gym";

// ─── FITNESS SUB-STYLES ────────────────────────────────────────────────────────
export type FitnessStyleId =
  | "hiit"
  | "crossfit"
  | "functional"
  | "cardio_kickbox"
  | "zumba"
  | "aerobics"
  | "tabata"
  | "circuit"
  | "athletic";

// ─── SUB-DISCIPLINE UNION ──────────────────────────────────────────────────────
export type SubDisciplineId =
  | DanceStyleId
  | MartialArtsStyleId
  | BoxingStyleId
  | YogaStyleId
  | GymnasticsStyleId
  | FitnessStyleId;

// ─── TIER ─────────────────────────────────────────────────────────────────────
export type TierId = "bronze" | "silver" | "gold" | "plat" | "champ" | "elite";
export type AchievementRarity = "Common" | "Rare" | "Epic" | "Legendary";
export type BattlePhase =
  | "select"
  | "prepare"
  | "countdown"
  | "battle"
  | "result";
export type SessionPhase = "pre" | "active" | "post";
export type ImportSource =
  | "apple_health"
  | "google_fit"
  | "strava"
  | "garmin"
  | "fitbit"
  | "myfitnesspal"
  | "nike"
  | "samsung"
  | "csv"
  | "xlsx";

// ─── LANDMARK ─────────────────────────────────────────────────────────────────
export interface Landmark {
  x: number; // 0–1 normalised
  y: number; // 0–1 normalised
  z: number; // depth
  visibility?: number; // 0–1
  presence?: number; // 0–1
}

// ─── SCORE SYSTEM ─────────────────────────────────────────────────────────────
export interface FrameScore {
  overall: number; // 0–100 weighted final
  accuracy: number; // joint position vs ideal
  stability: number; // jitter/tremor measure
  timing: number; // rhythm / beat match
  expressiveness: number; // for dance/yoga: artistic quality
  power: number; // for boxing/martial: force indicators
  balance: number; // single-leg / inversion balance
  combo: number; // current combo streak
  raw: RawScoreComponents;
}

export interface RawScoreComponents {
  cosineSimilarity: number; // 0–1
  jitterMagnitude: number; // px/frame avg
  rhythmPhaseError: number; // 0–1 (lower = better)
  symmetryScore: number; // 0–1 bilateral symmetry
  depthScore: number; // 0–1 3d pose quality
  velocityScore: number; // movement speed fit
  keypointConfidence: number; // avg landmark visibility
}

export interface SessionScoreSummary {
  finalScore: number;
  peakScore: number;
  avgScore: number;
  maxCombo: number;
  totalFrames: number;
  accuracy: number;
  stability: number;
  timing: number;
  expressiveness: number;
  power: number;
  balance: number;
  frameHistory: number[]; // frame-by-frame overall scores
  comboHistory: number[]; // frame-by-frame combo counts
  framesScored?: number;
}

// ─── DRILL ────────────────────────────────────────────────────────────────────
export interface Drill {
  id: string;
  name: string;
  nameLocal?: string; // e.g. "ভরতনাট্যম আরঙেত্রম" for Bharatnatyam
  description: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  duration: number; // seconds
  targetKeypoints: number[]; // MediaPipe landmark indices to score
  rhythmBPM?: number; // expected beats per minute
  styleNote?: string; // technique tip
  intensity?: number; // 1-10 power/difficulty level
}

// ─── SUB-DISCIPLINE CONFIG ─────────────────────────────────────────────────────
export interface SubDiscipline {
  id: SubDisciplineId;
  name: string;
  nameLocal?: string;
  parentDiscipline: DisciplineId;
  icon: string; // Lucide icon name or emoji fallback
  color: string;
  origin?: string;
  description: string;
  rhythmBPM?: number;
  coachingStyle: string;
  scoringWeights: ScoringWeights;
  drills: Drill[];
}

// ─── SCORING WEIGHTS ──────────────────────────────────────────────────────────
// Each discipline emphasises different score components
export interface ScoringWeights {
  accuracy: number; // 0–1
  stability: number; // 0–1
  timing: number; // 0–1
  expressiveness: number; // 0–1 (higher for dance/yoga)
  power: number; // 0–1 (higher for boxing/martial)
  balance: number; // 0–1
  // must sum to 1.0
}

// ─── DISCIPLINE ───────────────────────────────────────────────────────────────
export interface Discipline {
  id: DisciplineId;
  name: string;
  icon: string;
  color: string;
  glow: string;
  bg: string;
  description?: string;
  requirements?: string[];
  mediaPipeTasks: MediaPipeTask[];
  accentColor?: string;
  statLabels: Record<string, string>;
  banner?: string;
  drills: Drill[];
  subDisciplines: SubDiscipline[];
  coachingTone:
    | "aggressive"
    | "calm"
    | "technical"
    | "motivational"
    | "spiritual"
    | "rhythmic";
  challengeName: string;
  challengeNames: string[];
  bgMusic: string;
  rhythmBPM: number;
  scoringWeights: ScoringWeights;
}

// ─── MEDIAPIPE TASK TYPES ─────────────────────────────────────────────────────
export type MediaPipeTask =
  | "pose"
  | "hands"
  | "face"
  | "face_detect"
  | "gesture"
  | "object"
  | "holistic"
  | "audio";

// ─── TIER ─────────────────────────────────────────────────────────────────────
export interface Tier {
  id: TierId;
  name: string;
  color: string;
  glowColor: string;
  icon: string;
  xpMin: number;
  xpMax: number;
}

// ─── USER ─────────────────────────────────────────────────────────────────────
export type SkillLevel =
  | "beginner"
  | "intermediate"
  | "advanced"
  | "professional";

export interface User {
  id: string;
  email: string;
  displayName: string;
  username: string;
  arenaName: string;
  avatarUrl: string | null;
  bio: string;
  country: string;
  discipline: DisciplineId;
  subDiscipline?: SubDisciplineId;
  isPremium?: boolean;
  aiCoachNameCustom?: string;
  experienceLevel: SkillLevel;
  goals: string[];
  trainingFrequency: number;
  sessionDuration: number;
  aiCoachName: string;
  tier: TierId;
  xp: number;
  totalPoints: number;
  averageScore: number;
  sessionsCompleted: number;
  pveWins: number;
  pveLosses: number;
  winStreak: number;
  bestStreak: number;
  bestScore: number;
  dailyStreak: number;
  streakFreezeCount: number;
  lastActiveDate: string | null;
  onboardingComplete: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SavedAccount {
  sub: string;
  email: string;
  displayName: string;
  avatarUrl: string | null;
  lastUsed: number;
}

// ─── SESSION ──────────────────────────────────────────────────────────────────
export interface SessionData {
  id: string;
  userId: string;
  discipline: DisciplineId;
  subDiscipline?: SubDisciplineId;
  drillId: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  score: number;
  accuracy: number;
  stability: number;
  timing: number;
  expressiveness: number;
  power: number;
  balance: number;
  duration: number; // seconds
  bestCombo: number;
  xpEarned: number;
  pointsEarned: number;
  coachingText: string;
  frameHistory: number[];
  createdAt: string;
}

export interface SessionMetrics {
  liveScore: number;
  accuracy: number;
  stability: number;
  timing: number;
  expressiveness: number;
  power: number;
  balance: number;
  combo: number;
  timer: number; // seconds elapsed
}

// ─── BATTLE ───────────────────────────────────────────────────────────────────
export interface AiOpponent {
  id: string;
  name: string;
  discipline: DisciplineId;
  subDiscipline?: SubDisciplineId;
  targetScore: number;
  color: string;
  difficulty: 1 | 2 | 3 | 4 | 5;
  description: string;
  styleNote: string;
  usersBeaten: number;
  avatar: string;
}

export interface BattleResult {
  won: boolean;
  playerScore: number;
  opponentScore: number;
  accuracy: number;
  stability: number;
  timing: number;
  expressiveness: number;
  power: number;
  bestCombo: number;
  xpEarned: number;
  pointsEarned: number;
  coachNote: string;
}

export interface LiveComment {
  id: string;
  userId: string;
  username: string;
  color: string;
  text: string;
  reactions: Record<string, number>;
  isMe: boolean;
  timestamp: number;
}

// ─── REEL ─────────────────────────────────────────────────────────────────────
export interface Reel {
  id: string;
  userId: string;
  user?: Pick<User, "displayName" | "username" | "avatarUrl" | "discipline">;
  sessionId: string | null;
  discipline: DisciplineId;
  subDiscipline?: SubDisciplineId;
  drillName: string;
  score: number;
  accuracy: number;
  caption: string;
  likesCount: number;
  commentsCount: number;
  visibilityScore: number;
  isPublic: boolean;
  isLiked: boolean;
  isSaved: boolean;
  createdAt: string;
}

export interface ReelComment {
  id: string;
  reelId: string;
  userId: string;
  username: string;
  avatarUrl: string | null;
  text: string;
  likesCount: number;
  createdAt: string;
}

// ─── GAMIFICATION ─────────────────────────────────────────────────────────────
export interface Achievement {
  id: string;
  name: string;
  icon: string;
  description: string;
  condition: string;
  rarity: AchievementRarity;
  xpReward: number;
  secret: boolean;
  category:
    | "training"
    | "battle"
    | "social"
    | "progression"
    | "mastery"
    | "special";
}

export interface DailyMission {
  id: number;
  icon: string;
  name: string;
  description: string;
  type:
    | "sessions"
    | "accuracy"
    | "pve_win"
    | "reel"
    | "likes"
    | "combo"
    | "difficulty"
    | "duration";
  target: number;
  current: number;
  reward: number;
  complete: boolean;
  missionDate: string;
}

export interface WeeklyChallenge {
  id: number;
  icon: string;
  name: string;
  description: string;
  type: string;
  target: number;
  current: number;
  reward: number;
  complete: boolean;
  weekStart: string;
}

export interface Notification {
  id: string;
  type:
    | "achievement"
    | "tier"
    | "reel_likes"
    | "challenge"
    | "season"
    | "weekly"
    | "coaching"
    | "import"
    | "announcement";
  title: string;
  body: string;
  data: Record<string, unknown>;
  isRead: boolean;
  createdAt: string;
}

// ─── LEADERBOARD ──────────────────────────────────────────────────────────────
export interface LeaderboardEntry {
  id: number;
  rank: number;
  userId: string;
  displayName: string;
  username: string;
  avatarUrl: string | null;
  discipline: DisciplineId;
  subDiscipline?: SubDisciplineId;
  tier: TierId;
  totalPoints: number;
  country: string;
  isCurrentUser?: boolean;
}

// ─── IMPORT ───────────────────────────────────────────────────────────────────
export interface ImportedSession {
  id: string;
  userId: string;
  sourceApp: ImportSource;
  activityDate: string;
  activityType: string;
  disciplineMapped: DisciplineId | null;
  durationMinutes: number;
  performanceData: Record<string, unknown>;
  importedAt: string;
}

export interface ImportPreview {
  totalActivities: number;
  dateRange: { start: string; end: string };
  disciplineActivities: number;
  estimatedSessions: number;
}

// ─── POSE LANDMARK (aliased for compat) ───────────────────────────────────────
export type PoseLandmark = Landmark;

// ─── STORE SLICES ─────────────────────────────────────────────────────────────
export interface UserSlice {
  user: User | null;
  savedAccounts: SavedAccount[];
  isLoading: boolean;
  authError: string | null;
  setUser: (user: User | null) => void;
  updateUser: (updates: Partial<User>) => void;
  addSavedAccount: (account: SavedAccount) => void;
  removeSavedAccount: (sub: string) => void;
  setLoading: (v: boolean) => void;
  setAuthError: (e: string | null) => void;
  signOut: () => void;
}

export interface GameSlice {
  xp: number;
  totalPoints: number;
  tier: TierId;
  dailyStreak: number;
  streakFreezeCount: number;
  dailyMissions: DailyMission[];
  weeklyChallenges: WeeklyChallenge[];
  earnedAchievements: string[];
  notifications: Notification[];
  unreadCount: number;
  pendingTierUp: TierId | null;
  addXP: (amount: number) => void;
  addPoints: (amount: number) => void;
  updateMissionProgress: (type: DailyMission["type"], amount: number) => void;
  markNotificationRead: (id: string) => void;
  markAllRead: () => void;
  addNotification: (n: Omit<Notification, "id" | "createdAt">) => void;
  unlockAchievement: (id: string) => void;
  clearTierUp: () => void;
  useStreakFreeze: () => void;
}

export interface SessionSlice {
  currentSession: Partial<SessionData> | null;
  sessionHistory: SessionData[];
  sessionPhase: SessionPhase;
  metrics: SessionMetrics;
  selectedDrill: Drill | null;
  selectedDifficulty: 1 | 2 | 3 | 4 | 5;
  cameraActive: boolean;
  poseLandmarks: Landmark[];
  setSessionPhase: (p: SessionPhase) => void;
  updateMetrics: (m: Partial<SessionMetrics>) => void;
  setDrill: (d: Drill) => void;
  setDifficulty: (d: 1 | 2 | 3 | 4 | 5) => void;
  setCameraActive: (v: boolean) => void;
  setPoseLandmarks: (lm: Landmark[]) => void;
  startSession: () => void;
  endSession: (summary: SessionScoreSummary) => void;
  resetSession: () => void;
}

export interface BattleSlice {
  battlePhase: BattlePhase;
  selectedOpponent: AiOpponent | null;
  playerScore: number;
  opponentScore: number;
  battleTime: number;
  battleResult: BattleResult | null;
  liveComments: LiveComment[];
  viewerCount: number;
  clipPoints: number[];
  setBattlePhase: (p: BattlePhase) => void;
  selectOpponent: (o: AiOpponent) => void;
  updateBattleScores: (p: number, o: number) => void;
  setBattleTime: (t: number) => void;
  setBattleResult: (r: BattleResult) => void;
  addComment: (c: LiveComment) => void;
  setViewerCount: (v: number) => void;
  addClipPoint: (t: number) => void;
  resetBattle: () => void;
}

export interface UISlice {
  activeTab: "home" | "arena" | "discover" | "profile";
  showPlusSheet: boolean;
  showNotifications: boolean;
  soundEnabled: boolean;
  reduceMotion: boolean;
  masterVolume: number;
  installPromptDismissed: boolean;
  showInstallBanner: boolean;
  offlineMode: boolean;
  setActiveTab: (t: UISlice["activeTab"]) => void;
  setShowPlusSheet: (v: boolean) => void;
  setShowNotifications: (v: boolean) => void;
  setSoundEnabled: (v: boolean) => void;
  setReduceMotion: (v: boolean) => void;
  setMasterVolume: (v: number) => void;
  dismissInstall: () => void;
  setOfflineMode: (v: boolean) => void;
}

export type AppStore = UserSlice &
  GameSlice &
  SessionSlice &
  BattleSlice &
  UISlice;

export type DetectionMode = MediaPipeTask;
export type UserProfile = User;
