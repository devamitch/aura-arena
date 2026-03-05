// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Audio Service (100% functional, zero classes)
// WebAudio API with silent fallback when files are missing.
// ═══════════════════════════════════════════════════════════════════════════════

import { useCallback, useRef } from 'react';
import { useStore } from '@store';

// ─── SOUND MANIFEST ───────────────────────────────────────────────────────────

export const SOUNDS = {
  // UI
  buttonPress:    '/sounds/button-press.mp3',
  notification:   '/sounds/notification.mp3',
  error:          '/sounds/error.mp3',
  swipe:          '/sounds/swipe.mp3',
  tabSwitch:      '/sounds/tab-switch.mp3',
  // Session
  sessionStart:   '/sounds/session-start.mp3',
  sessionEnd:     '/sounds/session-end.mp3',
  drillSelected:  '/sounds/drill-select.mp3',
  // Combos
  combo3:         '/sounds/combo-3.mp3',
  combo7:         '/sounds/combo-7.mp3',
  combo15:        '/sounds/combo-15.mp3',
  comboBreak:     '/sounds/combo-break.mp3',
  // Battle
  countdownBeat:  '/sounds/countdown-beat.mp3',
  countdownGo:    '/sounds/countdown-go.mp3',
  battleStart:    '/sounds/battle-start.mp3',
  victory:        '/sounds/victory.mp3',
  defeat:         '/sounds/defeat.mp3',
  dominating:     '/sounds/dominating.mp3',
  // Achievements / Tier
  achievement:    '/sounds/achievement.mp3',
  tierUp:         '/sounds/tier-up.mp3',
  // Social
  reelLike:       '/sounds/reel-like.mp3',
  reelPost:       '/sounds/reel-post.mp3',
  // Ambient
  cameraReady:    '/sounds/camera-ready.mp3',
} as const;

export type SoundKey = keyof typeof SOUNDS;

// Per-sound volume multipliers (applied on top of masterVolume)
const SOUND_VOLUME: Partial<Record<SoundKey, number>> = {
  buttonPress: 0.4,
  swipe: 0.3,
  tabSwitch: 0.25,
  reelLike: 0.35,
  countdownBeat: 0.6,
  combo3: 0.55,
  combo7: 0.7,
  combo15: 0.9,
  achievement: 0.9,
  tierUp: 1.0,
  battleStart: 1.0,
  victory: 1.0,
  defeat: 0.8,
};

// ─── MODULE STATE ─────────────────────────────────────────────────────────────

let _ctx: AudioContext | null = null;
const _buffers: Map<SoundKey, AudioBuffer | null> = new Map();
const _loadPromises: Map<SoundKey, Promise<void>> = new Map();

// ─── AUDIO CONTEXT ────────────────────────────────────────────────────────────

const getCtx = (): AudioContext => {
  if (!_ctx) _ctx = new AudioContext();
  if (_ctx.state === 'suspended') _ctx.resume().catch(() => {});
  return _ctx;
};

// ─── LOAD FUNCTIONS ───────────────────────────────────────────────────────────

export const loadSound = async (key: SoundKey): Promise<void> => {
  if (_buffers.has(key)) return;
  if (_loadPromises.has(key)) return _loadPromises.get(key)!;

  const p = (async () => {
    try {
      const res = await fetch(SOUNDS[key]);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const raw = await res.arrayBuffer();
      const ctx = getCtx();
      const buf = await ctx.decodeAudioData(raw);
      _buffers.set(key, buf);
    } catch {
      _buffers.set(key, null); // null = silent fallback
    }
  })();

  _loadPromises.set(key, p);
  return p;
};

export const preloadSounds = async (keys: SoundKey[]): Promise<void> => {
  await Promise.allSettled(keys.map(loadSound));
};

export const preloadCritical = (): Promise<void> =>
  preloadSounds([
    'buttonPress', 'sessionStart', 'sessionEnd',
    'combo3', 'combo7', 'combo15',
    'countdownBeat', 'countdownGo',
    'achievement', 'tierUp', 'battleStart', 'victory',
  ]);

// ─── PLAY FUNCTIONS ───────────────────────────────────────────────────────────

export interface PlayOptions {
  volume?: number;  // 0–1, overrides default
  pitch?: number;   // playbackRate, default 1.0
  delay?: number;   // seconds
}

export const playSound = async (
  key: SoundKey,
  masterVolume: number,
  options: PlayOptions = {}
): Promise<void> => {
  if (masterVolume <= 0) return;

  // Ensure loaded
  if (!_buffers.has(key)) await loadSound(key);

  const buf = _buffers.get(key);
  if (!buf) return; // silent fallback

  try {
    const ctx = getCtx();
    const source = ctx.createBufferSource();
    const gain = ctx.createGain();

    source.buffer = buf;
    source.playbackRate.value = options.pitch ?? 1.0;

    const vol = (options.volume ?? (SOUND_VOLUME[key] ?? 0.7)) * masterVolume;
    gain.gain.value = Math.max(0, Math.min(1, vol));

    source.connect(gain);
    gain.connect(ctx.destination);
    source.start(ctx.currentTime + (options.delay ?? 0));
  } catch {
    // Non-fatal — browser may block autoplay
  }
};

// Convenience: play combo sound based on streak count
export const playComboSound = (
  combo: number, masterVolume: number
): void => {
  if (combo >= 15)      playSound('combo15', masterVolume);
  else if (combo >= 7)  playSound('combo7', masterVolume);
  else if (combo >= 3)  playSound('combo3', masterVolume);
};

// Countdown beeps: call once per second for 3 seconds
export const playCountdown = (beat: number, masterVolume: number): void => {
  if (beat === 0) playSound('countdownGo', masterVolume, { pitch: 1.2 });
  else            playSound('countdownBeat', masterVolume, { pitch: 1 + (3 - beat) * 0.1 });
};

// Achievement sound with rarity-scaled volume
export const playAchievementSound = (
  rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary',
  masterVolume: number
): void => {
  const vol = { Common: 0.6, Rare: 0.75, Epic: 0.88, Legendary: 1.0 }[rarity] ?? 0.7;
  playSound('achievement', masterVolume, { volume: vol });
};

// ─── useAudio HOOK ────────────────────────────────────────────────────────────
// Functional hook — no class, reads store for settings

export const useAudio = () => {
  const soundEnabled = useStore((s) => s.soundEnabled);
  const masterVolume = useStore((s) => s.masterVolume);
  const lastPlayTimes = useRef<Partial<Record<SoundKey, number>>>({});

  const play = useCallback((key: SoundKey, options?: PlayOptions & { debounceMs?: number }) => {
    if (!soundEnabled) return;
    const { debounceMs, ...playOpts } = options ?? {};
    if (debounceMs) {
      const last = lastPlayTimes.current[key] ?? 0;
      if (Date.now() - last < debounceMs) return;
      lastPlayTimes.current[key] = Date.now();
    }
    playSound(key, masterVolume, playOpts);
  }, [soundEnabled, masterVolume]);

  const playCombo = useCallback((combo: number) => {
    if (!soundEnabled) return;
    playComboSound(combo, masterVolume);
  }, [soundEnabled, masterVolume]);

  const countdown = useCallback((beat: number) => {
    if (!soundEnabled) return;
    playCountdown(beat, masterVolume);
  }, [soundEnabled, masterVolume]);

  const achievement = useCallback((rarity: 'Common' | 'Rare' | 'Epic' | 'Legendary') => {
    if (!soundEnabled) return;
    playAchievementSound(rarity, masterVolume);
  }, [soundEnabled, masterVolume]);

  const preload = useCallback(() => preloadCritical(), []);

  return { play, playCombo, countdown, achievement, preload, soundEnabled, masterVolume };
};
