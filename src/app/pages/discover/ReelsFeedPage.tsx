// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Reels Feed
// Full-screen vertical TikTok-style feed
// Gestures: framer-motion drag + velocity snap
// ═══════════════════════════════════════════════════════════════════════════════

import {
  useState, useRef, useCallback, useEffect, memo,
  type CSSProperties, type TouchEvent as RTE,
} from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, useMotionValue, animate, AnimatePresence, useTransform } from 'framer-motion';
import {
  Heart, MessageCircle, Share2, Bookmark, ArrowLeft,
  Volume2, VolumeX, Award, Sparkles,
} from 'lucide-react';
import { useStore } from '@store';
import { cn } from '@lib/utils';

// ─── Mock data ─────────────────────────────────────────────────────────────────

const REELS = [
  {
    id:'r1', username:'@shadowpunch', arenaName:'ShadowPunch',
    discipline:'Boxing', disciplineEmoji:'🥊', subDiscipline:'Orthodox',
    score:94.2, drillName:'Hook & Uppercut Series',
    caption:'New personal best 🔥 the timing finally clicked after 3 weeks. tag a boxer who needs to see this',
    likes:2314, comments:187, tier:'Champion', tierColor:'#a78bfa',
    accentColor:'#ff5722',
    bg:`radial-gradient(ellipse at 30% 30%, rgba(255,87,34,0.4) 0%, transparent 55%),
        radial-gradient(ellipse at 80% 70%, rgba(255,87,34,0.2) 0%, transparent 50%),
        linear-gradient(170deg, #040610 0%, #0a0c1a 100%)`,
    duration:23, isVerified:true,
  },
  {
    id:'r2', username:'@neondancer', arenaName:'NeonDancer',
    discipline:'Dance', disciplineEmoji:'💃', subDiscipline:'Bharatanatyam',
    score:88.7, drillName:'Mudra Flow — Alarippu',
    caption:'Classical meets contemporary. the floor lights up when this sequence hits 🪷',
    likes:1873, comments:241, tier:'Platinum', tierColor:'#38bdf8',
    accentColor:'#d946ef',
    bg:`radial-gradient(ellipse at 60% 25%, rgba(217,70,239,0.45) 0%, transparent 55%),
        linear-gradient(160deg, #040610 0%, #0a0c1a 100%)`,
    duration:31, isVerified:false,
  },
  {
    id:'r3', username:'@zenkenji', arenaName:'ZenKenji',
    discipline:'Martial Arts', disciplineEmoji:'🥋', subDiscipline:'Shotokan',
    score:91.8, drillName:'Kata Heian Shodan — Full',
    caption:'Kata is not about fighting. it is about perfecting movement. every angle matters.',
    likes:3102, comments:328, tier:'Elite', tierColor:'#f43f5e',
    accentColor:'#ef4444',
    bg:`radial-gradient(ellipse at 50% 40%, rgba(239,68,68,0.4) 0%, transparent 55%),
        linear-gradient(155deg, #040610 0%, #0a0c1a 100%)`,
    duration:45, isVerified:true,
  },
  {
    id:'r4', username:'@yogapriya', arenaName:'PriyaDev',
    discipline:'Yoga', disciplineEmoji:'🧘', subDiscipline:'Ashtanga',
    score:96.1, drillName:'Warrior III → Bound Angle',
    caption:'Balance is a conversation with gravity, not a fight 🌿 breath is everything',
    likes:891, comments:73, tier:'Gold', tierColor:'#fbbf24',
    accentColor:'#10b981',
    bg:`radial-gradient(ellipse at 40% 50%, rgba(16,185,129,0.35) 0%, transparent 55%),
        linear-gradient(165deg, #040610 0%, #050e0a 100%)`,
    duration:38, isVerified:false,
  },
  {
    id:'r5', username:'@flexelena', arenaName:'FlexElena',
    discipline:'Gymnastics', disciplineEmoji:'🤸', subDiscipline:'Floor',
    score:97.4, drillName:'Round-Off Back Tuck',
    caption:'first clean landing in 2 months. everything clicks today ✨',
    likes:5421, comments:604, tier:'Elite', tierColor:'#f43f5e',
    accentColor:'#f43f5e',
    bg:`radial-gradient(ellipse at 60% 30%, rgba(244,63,94,0.45) 0%, transparent 55%),
        linear-gradient(160deg, #040610 0%, #0a0c1a 100%)`,
    duration:12, isVerified:true,
  },
];

type Reel = typeof REELS[number];

const fmtN = (n: number) => n >= 1000 ? `${(n / 1000).toFixed(1)}k` : String(n);

// ─── Haptics ──────────────────────────────────────────────────────────────────

const haptic = (ms = 10) => { try { navigator.vibrate(ms); } catch {} };

// ─── Score Ring ───────────────────────────────────────────────────────────────

const ScoreRing = memo(({ score, color }: { score: number; color: string }) => {
  const r = 22;
  const circ = 2 * Math.PI * r;
  const filled = (score / 100) * circ;
  return (
    <div className="relative w-14 h-14 flex items-center justify-center">
      <svg className="absolute inset-0 -rotate-90" width="56" height="56">
        <circle cx="28" cy="28" r={r} fill="none" stroke="rgba(255,255,255,0.10)" strokeWidth="3" />
        <circle cx="28" cy="28" r={r} fill="none" stroke={color} strokeWidth="3"
          strokeDasharray={`${filled} ${circ}`} strokeLinecap="round"
          style={{ filter: `drop-shadow(0 0 6px ${color})`, transition: 'stroke-dasharray 0.7s ease' }} />
      </svg>
      <p className="relative z-10 text-[13px] font-black tabular-nums text-white">{Math.round(score)}</p>
    </div>
  );
});

// ─── Action Button ────────────────────────────────────────────────────────────

const ActionBtn = memo(({ icon: Icon, count, active, activeColor, onPress, filled }: {
  icon: typeof Heart; count?: number; active?: boolean;
  activeColor?: string; onPress: () => void; filled?: boolean;
}) => {
  const [bounce, setBounce] = useState(false);
  return (
    <button
      onClick={() => { haptic(10); setBounce(true); setTimeout(() => setBounce(false), 350); onPress(); }}
      className="flex flex-col items-center gap-1.5 select-none"
    >
      <motion.div
        animate={bounce ? { scale: [1, 1.55, 0.88, 1.05, 1] } : {}}
        transition={{ duration: 0.35 }}
        className="w-11 h-11 rounded-2xl flex items-center justify-center"
        style={{ background: 'rgba(0,0,0,0.4)', backdropFilter: 'blur(10px)', WebkitBackdropFilter: 'blur(10px)', border: '1px solid rgba(255,255,255,0.07)' }}
      >
        <Icon
          className="w-[19px] h-[19px]"
          style={{ color: active && activeColor ? activeColor : 'rgba(255,255,255,0.88)' }}
          fill={active && activeColor ? activeColor : 'none'}
          strokeWidth={active ? 0 : 2}
        />
      </motion.div>
      {count !== undefined && (
        <span className="text-[10px] font-mono text-white/60 tabular-nums leading-none">{fmtN(count)}</span>
      )}
    </button>
  );
});

// ─── Single Reel ──────────────────────────────────────────────────────────────

const ReelView = memo(({ reel, active }: { reel: Reel; active: boolean }) => {
  const { toggleLike, toggleSave } = useStore();
  const liked = useStore((s) => s.likedReels.has(reel.id));
  const saved = useStore((s) => s.savedReels.has(reel.id));
  const [doubleTapHeart, setDoubleTapHeart] = useState<{ x: number; y: number } | null>(null);
  const [expanded, setExpanded] = useState(false);
  const lastTap = useRef(0);

  const handleTap = (e: React.MouseEvent) => {
    const now = Date.now();
    if (now - lastTap.current < 280) {
      const rect = (e.currentTarget as HTMLElement).getBoundingClientRect();
      setDoubleTapHeart({ x: e.clientX - rect.left, y: e.clientY - rect.top });
      setTimeout(() => setDoubleTapHeart(null), 950);
      if (!liked) { toggleLike(reel.id); haptic(20); }
    }
    lastTap.current = now;
  };

  const shortCaption = reel.caption.length > 90 ? reel.caption.slice(0, 88) + '…' : reel.caption;

  return (
    <div className="absolute inset-0 overflow-hidden" onClick={handleTap}>
      {/* Procedural BG */}
      <div className="absolute inset-0" style={{ background: reel.bg }} />

      {/* Noise grain */}
      <div className="absolute inset-0 opacity-[0.018]"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23n)'/%3E%3C/svg%3E")`,
          backgroundSize: '256px 256px',
        }}
      />

      {/* Disc watermark */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 -translate-y-1/2 text-[160px] select-none pointer-events-none"
        style={{ opacity: 0.04 }}>
        {reel.disciplineEmoji}
      </div>

      {/* Bottom fade */}
      <div className="absolute inset-0"
        style={{ background: 'linear-gradient(0deg, rgba(4,6,16,0.95) 0%, rgba(4,6,16,0.45) 45%, transparent 65%)' }} />

      {/* Score ring — top right (below top bar) */}
      <div className="absolute top-[5.5rem] right-4 flex flex-col items-center gap-1.5">
        <ScoreRing score={reel.score} color={reel.accentColor} />
        <div className="px-2 py-0.5 rounded-full text-[9px] font-mono uppercase tracking-widest"
          style={{ background: `${reel.accentColor}22`, color: reel.accentColor, border: `1px solid ${reel.accentColor}35` }}>
          {reel.discipline}
        </div>
      </div>

      {/* Double-tap heart */}
      <AnimatePresence>
        {doubleTapHeart && (
          <motion.div
            initial={{ scale: 0.3, opacity: 0.95 }}
            animate={{ scale: [0.3, 1.5, 1.2] }}
            exit={{ scale: 1.4, opacity: 0 }}
            transition={{ duration: 0.5 }}
            style={{ position: 'absolute', left: doubleTapHeart.x - 44, top: doubleTapHeart.y - 44, fontSize: 88, pointerEvents: 'none' }}
          >
            ❤️
          </motion.div>
        )}
      </AnimatePresence>

      {/* Info — bottom left */}
      <div className="absolute bottom-0 left-0 right-[4.5rem] px-5 pb-10">
        {/* User row */}
        <div className="flex items-center gap-2.5 mb-2.5">
          <div className="w-8 h-8 rounded-2xl font-black text-sm flex items-center justify-center flex-shrink-0"
            style={{ background: `${reel.accentColor}25`, border: `1.5px solid ${reel.accentColor}50`, color: reel.accentColor }}>
            {reel.arenaName[0]}
          </div>
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-1.5">
              <p className="text-sm font-black text-white truncate">{reel.arenaName}</p>
              {reel.isVerified && (
                <div className="w-3.5 h-3.5 rounded-full flex items-center justify-center flex-shrink-0"
                  style={{ background: reel.tierColor }}>
                  <svg className="w-2 h-2" fill="white" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                  </svg>
                </div>
              )}
            </div>
            <p className="text-[10px] font-mono mt-0.5 truncate" style={{ color: `${reel.accentColor}cc` }}>
              {reel.username} · {reel.subDiscipline}
            </p>
          </div>
          <div className="px-2 py-0.5 rounded-full flex-shrink-0 text-[9px] font-mono"
            style={{ background: `${reel.tierColor}18`, color: reel.tierColor, border: `1px solid ${reel.tierColor}30` }}>
            {reel.tier}
          </div>
        </div>

        {/* Drill */}
        <div className="flex items-center gap-1.5 mb-2">
          <Award className="w-3 h-3 flex-shrink-0" style={{ color: `${reel.accentColor}cc` }} />
          <p className="text-[11px] font-mono truncate" style={{ color: `${reel.accentColor}cc` }}>
            {reel.drillName}
          </p>
          <span className="text-white/25 text-[11px]">·</span>
          <p className="text-[11px] text-white/40 font-mono">{reel.duration}s</p>
        </div>

        {/* Caption */}
        <p className="text-[13px] text-white/82 leading-snug">
          {expanded ? reel.caption : shortCaption}
          {reel.caption.length > 90 && (
            <button
              onClick={(e) => { e.stopPropagation(); setExpanded(v => !v); }}
              className="text-white/45 ml-1.5 text-[12px]"
            >
              {expanded ? 'less' : 'more'}
            </button>
          )}
        </p>
      </div>

      {/* Action rail — right */}
      <div className="absolute right-3 bottom-16 flex flex-col items-center gap-4">
        <ActionBtn
          icon={Heart} count={reel.likes + (liked ? 1 : 0)}
          active={liked} activeColor="#ff3b5c"
          onPress={() => toggleLike(reel.id)}
        />
        <ActionBtn icon={MessageCircle} count={reel.comments} onPress={() => {}} />
        <ActionBtn icon={Share2} onPress={() => haptic(12)} />
        <ActionBtn
          icon={Bookmark}
          active={saved} activeColor="#fbbf24"
          onPress={() => { toggleSave(reel.id); haptic(10); }}
        />
        <ActionBtn icon={Sparkles} onPress={() => {}} />
      </div>
    </div>
  );
});

// ─── Feed Page ────────────────────────────────────────────────────────────────

export default function ReelsFeedPage() {
  const navigate = useNavigate();
  const [index, setIndex] = useState(0);
  const [muted,  setMuted] = useState(false);
  const [dragging, setDragging] = useState(false);
  const H = typeof window !== 'undefined' ? window.innerHeight : 844;
  const y = useMotionValue(0);
  const TOTAL = REELS.length;

  const goTo = useCallback((next: number, vel = 0) => {
    const i = Math.max(0, Math.min(TOTAL - 1, next));
    setIndex(i);
    animate(y, -i * H, {
      type: 'spring',
      stiffness: 360 + Math.abs(vel) * 20,
      damping: 36,
      mass: 0.85,
    });
    haptic(8);
  }, [H, TOTAL, y]);

  // Touch gesture state
  const touchStart = useRef<{ y: number; t: number } | null>(null);

  const onTouchStart = (e: RTE) => {
    touchStart.current = { y: e.touches[0].clientY, t: Date.now() };
    setDragging(true);
  };

  const onTouchMove = (e: RTE) => {
    if (!touchStart.current) return;
    const dy = e.touches[0].clientY - touchStart.current.y;
    y.set(-index * H + dy * 0.92); // slight resistance
  };

  const onTouchEnd = (e: RTE) => {
    setDragging(false);
    if (!touchStart.current) return;
    const endY = e.changedTouches[0].clientY;
    const dy   = endY - touchStart.current.y;
    const dt   = Date.now() - touchStart.current.t;
    const vel  = Math.abs(dy) / dt; // px/ms
    touchStart.current = null;

    const isSwipe = Math.abs(dy) > H * 0.18 || vel > 0.6;
    if (isSwipe) goTo(index + (dy < 0 ? 1 : -1), vel);
    else animate(y, -index * H, { type: 'spring', stiffness: 400, damping: 38 });
  };

  // Keyboard
  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === 'ArrowDown') goTo(index + 1);
      if (e.key === 'ArrowUp')   goTo(index - 1);
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [index, goTo]);

  return (
    <div className="fixed inset-0 bg-void overflow-hidden"
      onTouchStart={onTouchStart}
      onTouchMove={onTouchMove}
      onTouchEnd={onTouchEnd}
    >
      {/* Stacked reels */}
      <motion.div style={{ y, height: H * TOTAL }} className="w-full will-change-transform">
        {REELS.map((reel, i) => (
          <div key={reel.id} style={{ height: H, position: 'relative' }}>
            <ReelView reel={reel} active={i === index} />
          </div>
        ))}
      </motion.div>

      {/* Top chrome */}
      <div className="absolute top-0 left-0 right-0 z-20 pointer-events-none">
        <div className="absolute inset-0 h-32"
          style={{ background: 'linear-gradient(180deg, rgba(4,6,16,0.8) 0%, transparent 100%)' }} />
      </div>
      <div className="absolute top-0 left-0 right-0 z-30">
        <div className="flex items-center justify-between px-4 pt-14 pb-3">
          <button
            onClick={() => navigate(-1)}
            className="w-10 h-10 rounded-2xl flex items-center justify-center pointer-events-auto"
            style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            <ArrowLeft className="w-4 h-4 text-white" />
          </button>

          <div className="flex items-center gap-2">
            <p className="text-sm font-black text-white tracking-wide">Reels</p>
            <span className="text-[10px] font-mono text-white/40 px-1.5 py-0.5 rounded-md"
              style={{ background: 'rgba(255,255,255,0.08)' }}>
              {index + 1}/{TOTAL}
            </span>
          </div>

          <button
            onClick={() => setMuted(!muted)}
            className="w-10 h-10 rounded-2xl flex items-center justify-center pointer-events-auto"
            style={{ background: 'rgba(0,0,0,0.45)', backdropFilter: 'blur(12px)', WebkitBackdropFilter: 'blur(12px)', border: '1px solid rgba(255,255,255,0.07)' }}
          >
            {muted ? <VolumeX className="w-4 h-4 text-white/60" /> : <Volume2 className="w-4 h-4 text-white" />}
          </button>
        </div>
      </div>

      {/* Right edge progress pips */}
      <div className="absolute right-1 top-1/2 -translate-y-1/2 z-20 flex flex-col gap-1.5 pointer-events-none">
        {REELS.map((r, i) => (
          <motion.div
            key={i}
            animate={{
              height: i === index ? 20 : 5,
              opacity: i === index ? 1 : 0.25,
            }}
            transition={{ type: 'spring', stiffness: 480, damping: 32 }}
            className="w-[3px] rounded-full"
            style={{ background: i === index ? REELS[i].accentColor : 'rgba(255,255,255,0.5)' }}
          />
        ))}
      </div>
    </div>
  );
}
