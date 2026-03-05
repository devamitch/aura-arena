import { useState, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import {
  Flame, Target, Star, Trophy, Check, Lock, Share2,
  Bell, Volume2, Eye, Trash2, Download, AlertTriangle,
  ChevronRight, Calendar, Clock, Shield, Globe, User,
} from 'lucide-react';
import { useUser, useStore, useEarnedAchievements, useSessionHistory, useDailyStreak } from '@store';
import { getDiscipline } from '@utils/constants/disciplines';
import { ACHIEVEMENTS } from '@utils/constants';
import type { Achievement } from '@types';
import { cn } from '@lib/utils';
import { format, parseISO, isToday, isThisWeek } from 'date-fns';
import { EmptyState } from '@shared/components/ui/Select';

// ─── OVERVIEW TAB ─────────────────────────────────────────────────────────────

export function ProfileOverviewTab() {
  const user = useUser();
  const streak = useDailyStreak();
  const sessions = useSessionHistory();
  const disc = user ? getDiscipline(user.discipline) : getDiscipline('boxing');

  // This week sessions
  const weekSessions = sessions.filter((s) => {
    try { return isThisWeek(parseISO(s.createdAt)); } catch { return false; }
  });

  // Recent timeline (last 8 events)
  const timeline = sessions.slice(0, 8).map((s) => ({
    id: s.id,
    type: 'session',
    text: `Completed ${disc.name} training — scored ${s.score}`,
    sub: `Accuracy ${s.accuracy}% · ${format(parseISO(s.createdAt), 'MMM d, h:mm a')}`,
    icon: disc.emoji,
    color: disc.color,
    date: s.createdAt,
  }));

  return (
    <div className="p-4 space-y-5 pb-12">
      {/* Weekly activity summary */}
      <div className="bg-s1 border border-b1 rounded-xl p-4">
        <p className="text-xs font-mono text-t3 uppercase tracking-widest mb-4">This Week</p>
        <div className="grid grid-cols-4 gap-3">
          {[
            { label: 'Sessions', value: weekSessions.length, icon: Target, color: disc.color },
            { label: 'Streak', value: streak, icon: Flame, color: '#f97316', suffix: 'd' },
            { label: 'XP Earned', value: weekSessions.reduce((a, s) => a + s.xpEarned, 0), icon: Star, color: '#fbbf24' },
            { label: 'Reels', value: 0, icon: Trophy, color: '#a855f7' },
          ].map(({ label, value, icon: Icon, color, suffix = '' }) => (
            <div key={label} className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${color}15` }}>
                <Icon className="w-5 h-5" style={{ color }} />
              </div>
              <p className="font-mono font-black text-t1 text-lg leading-none">{value}{suffix}</p>
              <p className="text-[9px] text-t3 text-center leading-none">{label}</p>
            </div>
          ))}
        </div>
      </div>

      {/* Weekly goal arc */}
      <div className="bg-s1 border border-b1 rounded-xl p-4">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-mono text-t3 uppercase tracking-widest">Weekly Goal</p>
          <p className="text-xs font-mono" style={{ color: disc.color }}>{weekSessions.length} / {user?.trainingFrequency ?? 5} sessions</p>
        </div>
        <div className="h-2 bg-s2 rounded-full overflow-hidden">
          <motion.div
            className="h-full rounded-full"
            style={{ background: disc.color }}
            initial={{ width: 0 }}
            animate={{ width: `${Math.min(100, (weekSessions.length / (user?.trainingFrequency ?? 5)) * 100)}%` }}
            transition={{ duration: 1, ease: 'easeOut' }}
          />
        </div>
      </div>

      {/* Discipline card */}
      <div className="rounded-xl overflow-hidden border" style={{ borderColor: `${disc.color}40`, background: `${disc.bg}80` }}>
        <div className="p-4">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ background: `${disc.color}20` }}>
              {disc.emoji}
            </div>
            <div>
              <p className="font-display font-bold text-t1 text-lg">{disc.name}</p>
              <p className="text-xs text-t2">Primary Discipline</p>
            </div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            {[
              { label: disc.statLabels.accuracy, value: user?.averageScore ?? 0 },
              { label: disc.statLabels.stability, value: Math.min(100, (user?.sessionsCompleted ?? 0) * 2) },
              { label: 'Sessions', value: user?.sessionsCompleted ?? 0 },
            ].map((stat) => (
              <div key={stat.label} className="bg-void/40 rounded-lg p-2 text-center">
                <p className="font-mono text-sm font-bold" style={{ color: disc.color }}>{stat.value}</p>
                <p className="text-[9px] text-t3 mt-0.5">{stat.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Activity Timeline */}
      <div>
        <p className="text-xs font-mono text-t3 uppercase tracking-widest mb-3">Recent Activity</p>
        {timeline.length === 0 ? (
          <EmptyState icon="🏟️" title="No activity yet" description="Complete your first training session to see your timeline." />
        ) : (
          <div className="relative space-y-3 pl-5">
            <div className="absolute left-2 top-0 bottom-0 w-0.5 bg-b1" />
            {timeline.map((item, i) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="relative"
              >
                <div
                  className="absolute -left-3.5 top-3 w-3 h-3 rounded-full border-2 border-void"
                  style={{ background: item.color }}
                />
                <div className="bg-s1 border border-b1 rounded-xl p-3 ml-2">
                  <p className="text-sm text-t1 font-medium">{item.icon} {item.text}</p>
                  <p className="text-xs text-t3 mt-0.5">{item.sub}</p>
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {/* Social counts */}
      <div className="grid grid-cols-3 gap-3">
        {[
          { label: 'Followers', value: Math.floor(Math.random() * 200), icon: User },
          { label: 'Following', value: Math.floor(Math.random() * 80), icon: User },
          { label: 'Reels', value: 0, icon: Star },
        ].map(({ label, value, icon: Icon }) => (
          <div key={label} className="bg-s1 border border-b1 rounded-xl p-3 text-center">
            <p className="font-mono font-black text-t1 text-xl">{value}</p>
            <p className="text-xs text-t3 mt-0.5">{label}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── TROPHY ROOM TAB ──────────────────────────────────────────────────────────

const RARITY_GLOW: Record<string, string> = {
  Common: '#ffffff',
  Rare: '#3b82f6',
  Epic: '#a855f7',
  Legendary: '#ffd700',
};

interface AchievementTileProps {
  achievement: Achievement;
  earned: boolean;
  earnedAt?: string;
}

function AchievementTile({ achievement, earned, earnedAt }: AchievementTileProps) {
  const [expanded, setExpanded] = useState(false);
  const glow = RARITY_GLOW[achievement.rarity] ?? '#ffffff';
  const isSecret = achievement.secret && !earned;

  return (
    <motion.button
      whileTap={{ scale: 0.95 }}
      onClick={() => setExpanded(!expanded)}
      className={cn(
        'flex flex-col items-center gap-2 p-3 rounded-xl border text-center transition-all relative overflow-hidden',
        earned ? 'border-opacity-50' : 'bg-s1 border-b1 opacity-50 grayscale'
      )}
      style={earned ? {
        borderColor: `${glow}40`,
        background: `${glow}08`,
        boxShadow: expanded ? `0 0 20px ${glow}30` : undefined,
      } : {}}
    >
      {/* Legendary animated gradient */}
      {earned && achievement.rarity === 'Legendary' && (
        <div
          className="absolute inset-0 opacity-10 pointer-events-none"
          style={{
            background: `linear-gradient(135deg, transparent, ${glow}, transparent)`,
            backgroundSize: '200% 200%',
            animation: 'shimmer 3s infinite',
          }}
        />
      )}

      {/* Icon */}
      <div
        className="w-10 h-10 rounded-xl flex items-center justify-center text-xl relative z-10"
        style={earned ? { background: `${glow}20`, boxShadow: `0 0 12px ${glow}40` } : {}}
      >
        {isSecret ? '🔒' : achievement.icon}
      </div>

      {/* Name */}
      <p className={cn('text-[11px] font-semibold leading-tight relative z-10', earned ? 'text-t1' : 'text-t3')}>
        {isSecret ? '???' : achievement.name}
      </p>

      {/* Rarity badge */}
      <span
        className="text-[9px] font-mono px-1.5 py-0.5 rounded-full relative z-10"
        style={{ background: `${glow}20`, color: glow }}
      >
        {achievement.rarity}
      </span>

      {/* Expanded details */}
      <AnimatePresence>
        {expanded && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className="w-full overflow-hidden"
          >
            <div className="pt-2 border-t border-white/10 text-left">
              {!isSecret && <p className="text-[10px] text-t2 leading-relaxed">{achievement.description}</p>}
              {earned && earnedAt && (
                <p className="text-[9px] text-t3 mt-1 font-mono">
                  Earned {format(parseISO(earnedAt), 'MMM d, yyyy')}
                </p>
              )}
              {earned && (
                <button
                  className="mt-2 flex items-center gap-1 text-[10px] font-semibold"
                  style={{ color: glow }}
                  onClick={(e) => { e.stopPropagation(); navigator.share?.({ title: achievement.name, text: `I earned "${achievement.name}" on AURA ARENA!` }); }}
                >
                  <Share2 className="w-3 h-3" /> Share
                </button>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </motion.button>
  );
}

export function ProfileTrophyRoomTab() {
  const earned = useEarnedAchievements();
  const earnedSet = new Set(earned);

  const earnedCount = ACHIEVEMENTS.filter((a) => earnedSet.has(a.id)).length;

  return (
    <div className="p-4 pb-12">
      {/* Header */}
      <div className="flex items-center justify-between mb-5">
        <div>
          <p className="text-xs font-mono text-t3 uppercase tracking-widest">Trophy Room</p>
          <p className="text-2xl font-display font-black text-t1 mt-0.5">
            {earnedCount} <span className="text-t3 text-lg font-body font-normal">/ {ACHIEVEMENTS.length}</span>
          </p>
        </div>
        <div className="flex gap-1 items-center">
          {Object.entries(RARITY_GLOW).map(([rarity, color]) => {
            const count = ACHIEVEMENTS.filter((a) => a.rarity === rarity && earnedSet.has(a.id)).length;
            return (
              <div key={rarity} className="flex items-center gap-0.5 px-1.5 py-0.5 rounded-full" style={{ background: `${color}15` }}>
                <div className="w-2 h-2 rounded-full" style={{ background: color }} />
                <span className="text-[9px] font-mono" style={{ color }}>{count}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* Achievement grid */}
      <div className="grid grid-cols-3 gap-2">
        {ACHIEVEMENTS.map((achievement) => (
          <AchievementTile
            key={achievement.id}
            achievement={achievement}
            earned={earnedSet.has(achievement.id)}
          />
        ))}
      </div>
    </div>
  );
}

// ─── SETTINGS TAB ─────────────────────────────────────────────────────────────

export function ProfileSettingsTab() {
  const user = useUser();
  const navigate = useNavigate();
  const { setSoundEnabled, setReduceMotion, setMasterVolume, signOut, updateUser } = useStore();
  const soundEnabled = useStore((s) => s.soundEnabled);
  const reduceMotion = useStore((s) => s.reduceMotion);
  const masterVolume = useStore((s) => s.masterVolume);

  const [confirmDelete, setConfirmDelete] = useState<string | null>(null);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-6">
      <p className="text-xs font-mono text-t3 uppercase tracking-widest px-1 mb-2">{title}</p>
      <div className="bg-s1 border border-b1 rounded-xl overflow-hidden divide-y divide-b1/50">
        {children}
      </div>
    </div>
  );

  const Row = ({ icon: Icon, label, sub, right, onClick, danger = false }: any) => (
    <button
      onClick={onClick}
      className={cn(
        'w-full flex items-center gap-3 px-4 py-3.5 text-left transition-colors',
        danger ? 'hover:bg-red-500/10' : 'hover:bg-s2',
        onClick ? 'cursor-pointer' : 'cursor-default'
      )}
    >
      <div className={cn('w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0', danger ? 'bg-red-500/10' : 'bg-s2')}>
        <Icon className={cn('w-4 h-4', danger ? 'text-red-400' : 'text-t2')} />
      </div>
      <div className="flex-1 min-w-0">
        <p className={cn('text-sm font-medium', danger ? 'text-red-400' : 'text-t1')}>{label}</p>
        {sub && <p className="text-xs text-t3 mt-0.5">{sub}</p>}
      </div>
      {right && <div className="flex-shrink-0">{right}</div>}
      {onClick && !right && <ChevronRight className="w-4 h-4 text-t3 flex-shrink-0" />}
    </button>
  );

  const Toggle = ({ value, onChange }: { value: boolean; onChange: (v: boolean) => void }) => (
    <button
      onClick={() => onChange(!value)}
      className={cn('w-10 h-6 rounded-full transition-colors relative', value ? 'bg-accent' : 'bg-s3')}
    >
      <motion.div
        className="absolute top-1 w-4 h-4 rounded-full bg-void"
        animate={{ left: value ? 20 : 4 }}
        transition={{ type: 'spring', stiffness: 500, damping: 30 }}
      />
    </button>
  );

  return (
    <div className="p-4 pb-12">

      {/* Account */}
      <Section title="Account">
        <Row icon={User} label="Display Name" sub={user?.displayName} onClick={() => {}} />
        <Row icon={User} label="Username" sub={`@${user?.username}`} onClick={() => {}} />
        <Row icon={Globe} label="Country" sub={user?.country} onClick={() => {}} />
        <Row icon={User} label="Change Avatar" onClick={() => navigate('/profile/avatar')} />
        <Row icon={Target} label="Change Discipline" sub={user?.discipline} onClick={() => {}} />
      </Section>

      {/* Notifications */}
      <Section title="Notifications">
        {['Training Reminders', 'Battle Challenges', 'Reel Likes & Comments', 'Platform Announcements'].map((label) => (
          <Row key={label} icon={Bell} label={label}
            right={<Toggle value={true} onChange={() => {}} />}
          />
        ))}
      </Section>

      {/* Preferences */}
      <Section title="Preferences">
        <Row icon={Volume2} label="Sound Effects" sub={soundEnabled ? 'On' : 'Off'}
          right={<Toggle value={soundEnabled} onChange={setSoundEnabled} />}
        />
        <Row icon={Eye} label="Reduce Motion" sub="Disables animations"
          right={<Toggle value={reduceMotion} onChange={setReduceMotion} />}
        />
        <Row icon={Volume2} label="Master Volume" sub={`${Math.round(masterVolume * 100)}%`}
          right={
            <input type="range" min={0} max={1} step={0.05} value={masterVolume}
              onChange={(e) => setMasterVolume(parseFloat(e.target.value))}
              className="w-24 accent-accent"
            />
          }
        />
      </Section>

      {/* Privacy */}
      <Section title="Privacy">
        <Row icon={Shield} label="Profile Visibility" sub="Public" onClick={() => {}} />
        <Row icon={Eye} label="Show on Leaderboard" right={<Toggle value={true} onChange={() => {}} />} />
        <Row icon={Globe} label="Show Country Flag" right={<Toggle value={true} onChange={() => {}} />} />
      </Section>

      {/* Data */}
      <Section title="Data">
        <Row icon={Download} label="Import Training Data" sub="Connect Apple Health, Strava & more"
          onClick={() => navigate('/profile/import')} />
        <Row icon={Download} label="Download My Data" sub="Export all your AURA ARENA data as JSON" onClick={() => {}} />
      </Section>

      {/* Danger Zone */}
      <Section title="Danger Zone">
        <Row icon={Trash2} label="Delete All Reels" danger onClick={() => setConfirmDelete('reels')} />
        <Row icon={Trash2} label="Delete Imported Data" danger onClick={() => setConfirmDelete('imports')} />
        <Row icon={AlertTriangle} label="Delete Account" sub="30-day grace period" danger onClick={() => setConfirmDelete('account')} />
      </Section>

      {/* Confirmation dialog */}
      <AnimatePresence>
        {confirmDelete && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 bg-void/80 backdrop-blur-sm flex items-end justify-center z-50 p-4"
            onClick={() => setConfirmDelete(null)}
          >
            <motion.div
              initial={{ y: 100 }}
              animate={{ y: 0 }}
              exit={{ y: 100 }}
              className="w-full max-w-sm bg-s1 border border-red-500/30 rounded-2xl p-5"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center mb-4">
                <div className="w-12 h-12 rounded-full bg-red-500/10 flex items-center justify-center mx-auto mb-3">
                  <AlertTriangle className="w-6 h-6 text-red-400" />
                </div>
                <h3 className="font-display font-bold text-t1 text-lg">
                  {confirmDelete === 'account' ? 'Delete Account?' : `Delete ${confirmDelete}?`}
                </h3>
                <p className="text-sm text-t2 mt-1">
                  {confirmDelete === 'account'
                    ? `Type your username "${user?.username}" to confirm.`
                    : 'This action cannot be undone.'}
                </p>
              </div>
              {confirmDelete === 'account' && (
                <input
                  value={deleteConfirmText}
                  onChange={(e) => setDeleteConfirmText(e.target.value)}
                  placeholder={user?.username}
                  className="w-full h-10 px-3 rounded-xl bg-s2 border border-b1 text-t1 text-sm mb-4 focus:outline-none focus:border-red-500"
                />
              )}
              <div className="flex gap-3">
                <button onClick={() => setConfirmDelete(null)} className="flex-1 h-11 rounded-xl bg-s2 text-t1 text-sm font-semibold">Cancel</button>
                <button
                  onClick={() => { setConfirmDelete(null); }}
                  disabled={confirmDelete === 'account' && deleteConfirmText !== user?.username}
                  className="flex-1 h-11 rounded-xl bg-red-500/20 border border-red-500/40 text-red-400 text-sm font-bold disabled:opacity-40"
                >
                  Delete
                </button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
