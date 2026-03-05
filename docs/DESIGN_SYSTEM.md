# AURA ARENA — Design System

## Philosophy

**Cold Plasma** — obsidian darkness charged with electric energy. Every color decision, type choice, and motion specification serves the feeling of a professional athlete's arena viewed through a sophisticated AI lens.

Three anti-patterns to avoid at all costs:
1. Generic purple gradients on white (the "AI app" cliché)
2. Generic Inter/Roboto body fonts with no personality
3. Uniform card sizes with identical spacing (grid uniformity = boring)

---

## Color System

### CSS Custom Properties

```css
/* Backgrounds */
--void:  #040610;   /* Absolute darkest — page background */
--s0:    #06080f;   /* Deepest surface */
--s1:    #09101f;   /* Primary card surface */
--s2:    #0d1528;   /* Elevated card */
--s3:    #111c35;   /* Input backgrounds, selected states */
--s4:    #1d2038;   /* Highest surface (modals) */

/* Borders */
--b0:    rgba(255,255,255,0.03);
--b1:    rgba(255,255,255,0.06);
--b2:    rgba(255,255,255,0.09);
--b3:    rgba(255,255,255,0.14);

/* Text */
--t1:    #f4f6ff;   /* Primary text */
--t2:    #9ba8c4;   /* Secondary text */
--t3:    #5a6a8a;   /* Tertiary / labels */
--t4:    #2d3a55;   /* Disabled text */

/* Brand Accent */
--ac:    #00dfff;   /* Electric cyan */
--ac2:   #006eff;   /* Blue complement */
--ac-g:  rgba(0,223,255,0.28);  /* Glow */
--ac-bg: rgba(0,223,255,0.07);  /* Tinted background */
```

### Discipline Colors

Each discipline has a primary color used for borders, glows, and accent elements on discipline-specific pages:

```
Boxing        #ff5722  (deep orange)
Dance         #d946ef  (fuchsia)
Yoga          #10b981  (emerald)
Martial Arts  #ef4444  (red)
Gymnastics    #f43f5e  (rose)
Fitness       #3b82f6  (blue)
Bodybuilding  #f97316  (orange)
Calisthenics  #eab308  (yellow)
Parkour       #84cc16  (lime)
Pilates       #8b5cf6  (violet)
```

### Tier Colors

```
Bronze    #cd7f32
Silver    #9ba8b5
Gold      #fbbf24
Platinum  #38bdf8
Champion  #a78bfa
Elite     #f43f5e
```

---

## Typography

Three distinct font families with clear roles:

### Display: Syne 800
Used for: all headings (h1–h6), arena names, tier names, page titles, score numbers in celebration screens.

```css
font-family: 'Syne', sans-serif;
font-weight: 800;
```

**Characteristics**: Wide, confident, slightly futuristic. Perfect for high-energy contexts.

### Body: DM Sans 300/400/600
Used for: all body copy, labels, descriptions, form inputs, notifications, coaching text.

```css
font-family: 'DM Sans', sans-serif;
font-weight: 400;  /* body */
font-weight: 600;  /* semi-bold emphasis */
```

**Characteristics**: Humanist, highly legible at small sizes, never sterile.

### Mono: Space Mono 700
Used for: all live data (scores, FPS, timers, XP values, stats), HUD labels, progress percentages.

```css
font-family: 'Space Mono', monospace;
font-weight: 700;
font-variant-numeric: tabular-nums;
```

**Characteristics**: Technical authority. When a number appears in Space Mono with `tabular-nums`, it communicates precision.

---

## Utility Classes

```css
.font-display   { font-family: 'Syne', sans-serif; font-weight: 800; }
.font-body      { font-family: 'DM Sans', sans-serif; }
.font-mono      { font-family: 'Space Mono', monospace; }
.tabular        { font-variant-numeric: tabular-nums; }

/* HUD Label: for metric names inside live overlays */
.label-hud {
  font-family: 'Space Mono', monospace;
  font-size: 9px;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: var(--t3);
}

/* Section Label: for card headers, panel titles */
.label-section {
  font-family: 'Space Mono', monospace;
  font-size: 10px;
  letter-spacing: 0.12em;
  text-transform: uppercase;
  color: var(--t3);
}
```

---

## Component Patterns

### Glass Morphism

```css
/* Standard glass — for floating panels */
.glass {
  background: rgba(10, 12, 26, 0.72);
  backdrop-filter: blur(18px);
  border: 1px solid rgba(255,255,255,0.06);
}

/* Heavy glass — for modal overlays */
.glass-heavy {
  background: rgba(10, 12, 26, 0.92);
  backdrop-filter: blur(28px);
  border: 1px solid rgba(255,255,255,0.08);
}
```

### Cards

```css
.card {
  background: var(--s1);
  border: 1px solid var(--b1);
  border-radius: 16px;
  /* Top edge shine effect */
  background-image: linear-gradient(
    180deg,
    rgba(255,255,255,0.03) 0%,
    transparent 24px
  );
}

.card:active {
  transform: scale(0.975);
  transition: transform 100ms ease;
}
```

### Glow Effects

```css
/* Accent glow on focused elements */
box-shadow: 0 0 16px rgba(0, 223, 255, 0.28);

/* Card shadow */
box-shadow: 0 4px 24px rgba(4, 6, 16, 0.8), 0 1px 0 rgba(255,255,255,0.04) inset;

/* HUD element shadow */
box-shadow: 0 2px 12px rgba(4, 6, 16, 0.6);
```

---

## Animations

### Spring Constants (Framer Motion)

```ts
// Navigation: snappy tab transition
{ type: 'spring', stiffness: 480, damping: 32 }

// Cards: enter with authority
{ type: 'spring', stiffness: 360, damping: 36, mass: 0.85 }

// Sheets: slide up smoothly
{ type: 'spring', stiffness: 340, damping: 30 }

// Number counters: ease out
// Uses cubic ease: 1 - (1 - progress)^3 over 600ms
```

### Keyframe Animations

```css
/* Orb drift: 2 ambient background blobs */
@keyframes orb-drift {
  0%, 100% { transform: translate(0,0) scale(1); opacity: 0.12; }
  33%       { transform: translate(20px,-15px) scale(1.08); opacity: 0.16; }
  66%       { transform: translate(-10px,20px) scale(0.95); opacity: 0.10; }
}

/* Scan beam: camera overlay initialization line */
@keyframes scan-line {
  from { transform: translateY(-110%); }
  to   { transform: translateY(320%); }
}

/* Live pulse: recording indicator */
@keyframes live-pulse {
  0%, 100% { opacity: 1; transform: scale(1); }
  50%      { opacity: 0.5; transform: scale(0.85); }
}

/* Combo pop: score milestone flash */
@keyframes combo-pop {
  0%   { transform: scale(0.6) rotate(-4deg); opacity: 0; }
  60%  { transform: scale(1.12) rotate(2deg); opacity: 1; }
  100% { transform: scale(1) rotate(0deg); opacity: 1; }
}
```

### Stagger Patterns

```tsx
// List entrance: stagger children 60ms apart
const containerVariants = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.06 } }
};

// Plus sheet cards: 45ms stagger
{ delay: index * 0.045, type: 'spring', stiffness: 400, damping: 28 }
```

---

## Spacing System (Tailwind Extensions)

```js
spacing: {
  'nav-h': '62px',      // Bottom nav height
  'safe-b': 'env(safe-area-inset-bottom)',  // iOS safe area
}
```

### Page Layout
- Top padding: `pt-14` (56px) — clears status bar
- Horizontal padding: `px-4` (16px) standard
- Bottom padding: `pb-safe` — `padding-bottom: calc(62px + env(safe-area-inset-bottom))`
- Card gap: `gap-3` (12px)

---

## Motion Principles

1. **Spring over Tween**: Every entrance/exit uses `type: 'spring'`. Tweens only for continuous loops.
2. **No layout properties**: Never animate `width`, `height`, `top`, `left`. Only `transform` and `opacity`.
3. **Velocity-aware**: Gesture release springs adjust stiffness based on throw velocity.
4. **Respect reduce-motion**: When `useStore(s => s.reduceMotion)` is true, all Framer Motion variants use `{ duration: 0.01 }` and direct value sets skip animation.
5. **Stagger with purpose**: Stagger only when multiple items enter simultaneously. Don't stagger persistent UI.

---

## Icon System

All icons from `lucide-react@latest` exclusively. No other icon library.

### Standard sizes:
- Navigation icons: `w-5 h-5` (20px)
- Inline with text: `w-4 h-4` (16px)
- Large feature icons: `w-6 h-6` (24px)
- Hero icons: `w-8 h-8` (32px)

### Icon + label pattern:
```tsx
<div className="flex items-center gap-2">
  <Award className="w-4 h-4 flex-shrink-0" style={{ color: accentColor }} />
  <span className="text-sm text-t2">Drill Name</span>
</div>
```

---

## Discipline Badge System

```tsx
// Each discipline badge:
// - Background: discipline color at 12% opacity
// - Border: discipline color at 25% opacity
// - Text: discipline color
// - Optional: sub-discipline in smaller mono text below
<DisciplineBadge disciplineId="dance" size="md" showSub />
```

## Tier Badge System

```tsx
// Tier badge shows:
// - Emoji icon (🥉🥈🥇💎👑⚡)
// - Tier name in display font
// - Color matches tier constant
// - Glow in active/featured contexts
<TierBadge tierId="gold" size="lg" glow />
```

---

## Scrollbar Customization

```css
/* Hide scrollbar visually while keeping functionality */
.scroll-none {
  scrollbar-width: none;
  -ms-overflow-style: none;
}
.scroll-none::-webkit-scrollbar { display: none; }

/* Custom thin scrollbar for content panels */
::-webkit-scrollbar { width: 3px; height: 3px; }
::-webkit-scrollbar-track { background: transparent; }
::-webkit-scrollbar-thumb { background: var(--b2); border-radius: 3px; }
```
