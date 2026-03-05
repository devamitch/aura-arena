# AURA ARENA — Audio System

## Overview

The audio system uses `use-sound` (built on Howler.js) for sound playback. Sound is **off by default** and enabled via the Settings toggle. All sounds are short (under 500ms) and mixed to complement rather than dominate.

---

## Sound Inventory

| Sound ID | File | Duration | Volume | Trigger |
|---|---|---|---|---|
| `btn-press` | `/sounds/btn-press.mp3` | 80ms | 0.4 | Any button press |
| `combo-3x` | `/sounds/combo-3x.mp3` | 220ms | 0.6 | 3× combo activated |
| `combo-7x` | `/sounds/combo-7x.mp3` | 320ms | 0.7 | 7× combo activated |
| `combo-15x` | `/sounds/combo-15x.mp3` | 480ms | 0.9 | 15× combo activated |
| `countdown` | `/sounds/countdown.mp3` | 350ms | 0.8 | Battle countdown (each beat) |
| `battle-start` | `/sounds/battle-start.mp3` | 480ms | 0.9 | "FIGHT" moment |
| `victory` | `/sounds/victory.mp3` | 480ms | 0.8 | Battle won |
| `defeat` | `/sounds/defeat.mp3` | 480ms | 0.6 | Battle lost |
| `tier-up` | `/sounds/tier-up.mp3` | 480ms | 1.0 | Tier advancement |
| `achievement` | `/sounds/achievement.mp3` | 380ms | 0.8 | Achievement unlocked |
| `reel-like` | `/sounds/reel-like.mp3` | 120ms | 0.4 | Reel receives a like |
| `session-start` | `/sounds/session-start.mp3` | 280ms | 0.7 | Session begins |
| `session-end` | `/sounds/session-end.mp3` | 420ms | 0.7 | Session completes |
| `error` | `/sounds/error.mp3` | 180ms | 0.4 | Error state |
| `notification` | `/sounds/notification.mp3` | 200ms | 0.5 | Notification arrives |
| `ambient-loop` | `/sounds/ambient.mp3` | loop | 0.15 | Dashboard background ambient |

---

## Implementation

### audioService.ts

```ts
import { Howl, Howler } from 'howler';

type SoundId = 'btn-press' | 'combo-3x' | 'combo-7x' | ...;

const sounds: Record<SoundId, Howl> = {
  'btn-press':  new Howl({ src: ['/sounds/btn-press.mp3'], volume: 0.4 }),
  'combo-3x':   new Howl({ src: ['/sounds/combo-3x.mp3'], volume: 0.6 }),
  // ... all 16 sounds
};

let enabled = false;
let volume = 0.8;

export const playSound = (id: SoundId) => {
  if (!enabled) return;
  sounds[id]?.play();
};

export const setSoundEnabled = (v: boolean) => {
  enabled = v;
  Howler.mute(!v);
};

export const setVolume = (level: number) => {
  volume = level;
  Howler.volume(level);
};
```

### React Integration

```tsx
// In any component:
import { playSound } from '@/lib/audio/audioService';

// Button press
<button onClick={() => { playSound('btn-press'); handleAction(); }}>

// Combo event in training loop
if (combo === 3)  playSound('combo-3x');
if (combo === 7)  playSound('combo-7x');
if (combo === 15) playSound('combo-15x');
```

---

## Sound Design Principles

1. **Never jarring**: All sounds fade in/out, never clipped
2. **Discipline-appropriate**: A yoga session doesn't hear boxing impact sounds
3. **Escalating intensity**: combo-3x < combo-7x < combo-15x in energy
4. **Spatial-aware**: Future: positional audio for specific limb feedback
5. **User controllable**: Independent volume per category in Settings

---

## Sound Source Recommendations

Free sound libraries to source these files:
- [Freesound.org](https://freesound.org) — CC licensed, search by keyword
- [Zapsplat.com](https://zapsplat.com) — free with attribution
- [Mixkit.co](https://mixkit.co/free-sound-effects/) — free for commercial use

### Sound Generation (Alternative)
For a fully original audio experience:
- Combo sounds: synthesized using Web Audio API oscillators
- Achievement: pitched bell or chime sequence
- Tier-up: ascending chord progression (major key)
- Defeat: descending minor chord (dignified, not depressing)

---

## Settings Integration

```tsx
// Settings tab in ProfilePage:
<Switch checked={soundEnabled} onCheckedChange={setSoundEnabled} />
<Slider
  value={[masterVolume]}
  onValueChange={([v]) => setMasterVolume(v)}
  min={0}
  max={1}
  step={0.05}
/>
```

Volume changes apply immediately via `Howler.volume()`. State persisted in Zustand `userSlice` via `persist` middleware.
