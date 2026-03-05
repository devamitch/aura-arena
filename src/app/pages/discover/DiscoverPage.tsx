import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Trophy, TrendingUp, Users } from 'lucide-react';
import { usePersonalization } from '@hooks/usePersonalization';
import { timeAgo } from '@lib/utils';

const TRENDING = [
  { user: 'ShadowPunch',  disc: '🥊', score: 94, likes: 231, sub: 'Orthodox' },
  { user: 'NeonDancer',   disc: '💃', score: 88, likes: 187, sub: 'Bharatnatyam' },
  { user: 'ZenMaster',    disc: '🧘', score: 91, likes: 152, sub: 'Ashtanga' },
  { user: 'KataKenji',    disc: '🥋', score: 86, likes: 198, sub: 'Shotokan' },
  { user: 'FlexElena',    disc: '🤸', score: 96, likes: 312, sub: 'Floor' },
];

export default function DiscoverPage() {
  const navigate = useNavigate();
  const { accentColor } = usePersonalization();

  return (
    <div className="flex-1 overflow-y-auto pb-28 bg-void">
      {/* Header */}
      <div className="px-5 pt-6 pb-4">
        <p className="text-xs font-mono text-t3 uppercase tracking-widest mb-1">Discover</p>
        <h1 className="text-3xl font-black text-t1">Explore</h1>
      </div>

      {/* Quick nav cards */}
      <div className="px-5 grid grid-cols-2 gap-3 mb-6">
        {[
          { label: 'Reels Feed',  icon: Play,      path: '/discover/reels',  grad: 'from-purple-600 to-pink-500', desc: 'Watch & share' },
          { label: 'League',      icon: Trophy,    path: '/discover/league', grad: 'from-yellow-600 to-orange-500', desc: 'Rankings' },
        ].map((card) => {
          const Icon = card.icon;
          return (
            <motion.button
              key={card.label}
              whileTap={{ scale: 0.96 }}
              onClick={() => navigate(card.path)}
              className={`aspect-video rounded-2xl p-4 flex flex-col items-start justify-end relative overflow-hidden bg-gradient-to-br ${card.grad}`}
            >
              <div className="absolute inset-0 bg-void/40" />
              <Icon className="w-7 h-7 text-white mb-2 relative z-10 opacity-90" />
              <p className="font-black text-white text-sm relative z-10">{card.label}</p>
              <p className="text-white/60 text-[10px] relative z-10">{card.desc}</p>
            </motion.button>
          );
        })}
      </div>

      {/* Trending today */}
      <div className="px-5">
        <div className="flex items-center justify-between mb-3">
          <p className="text-xs font-mono text-t3 uppercase tracking-widest">Trending Today</p>
          <button onClick={() => navigate('/discover/reels')} className="text-[11px] text-t3">See all</button>
        </div>
        <div className="space-y-2">
          {TRENDING.map((reel, i) => (
            <motion.button
              key={reel.user}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.06 }}
              whileTap={{ scale: 0.97 }}
              onClick={() => navigate('/discover/reels')}
              className="w-full flex items-center gap-3 p-3 bg-s1 border border-b1 rounded-xl text-left"
            >
              <div className="w-11 h-11 rounded-xl bg-s2 flex items-center justify-center text-2xl flex-shrink-0">
                {reel.disc}
              </div>
              <div className="flex-1 min-w-0">
                <p className="font-semibold text-t1 text-sm">{reel.user}</p>
                <p className="text-[10px] text-t3">{reel.sub} · Score:
                  <span className="font-mono ml-1" style={{ color: accentColor }}>{reel.score}</span>
                </p>
              </div>
              <div className="text-right flex-shrink-0">
                <p className="text-xs font-mono text-t2">❤️ {reel.likes}</p>
              </div>
            </motion.button>
          ))}
        </div>
      </div>

      {/* Community stats */}
      <div className="px-5 mt-6">
        <div className="bg-s1 rounded-2xl p-4 border border-b1">
          <div className="flex items-center gap-2 mb-3">
            <Users className="w-4 h-4" style={{ color: accentColor }} />
            <p className="text-xs font-mono text-t3 uppercase tracking-widest">Community</p>
          </div>
          <div className="grid grid-cols-3 gap-3 text-center">
            {[
              { value: '12.4k', label: 'Athletes' },
              { value: '48k',   label: 'Sessions Today' },
              { value: '2.1k',  label: 'Active Now' },
            ].map((s) => (
              <div key={s.label}>
                <p className="font-black text-t1 text-lg" style={{ color: accentColor }}>{s.value}</p>
                <p className="text-[10px] text-t3">{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
