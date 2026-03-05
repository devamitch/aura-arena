// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Tier-Up Celebration Overlay
// ═══════════════════════════════════════════════════════════════════════════════

import { useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TIERS } from '@utils/constants';
import type { TierId } from '@types';

interface TierUpCelebrationProps {
  tier: TierId;
  accentColor: string;
  onClose: () => void;
}

export const TierUpCelebration = ({ tier, accentColor, onClose }: TierUpCelebrationProps) => {
  const tierData = TIERS.find((t) => t.id === tier) ?? TIERS[0];

  useEffect(() => {
    const t = setTimeout(onClose, 4000);
    return () => clearTimeout(t);
  }, [onClose]);

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[100] flex items-center justify-center bg-void/90 backdrop-blur-md"
      onClick={onClose}
    >
      {/* Particle rings */}
      {[0, 1, 2].map((i) => (
        <motion.div
          key={i}
          initial={{ scale: 0.3, opacity: 0.8 }}
          animate={{ scale: 2.5 + i * 0.5, opacity: 0 }}
          transition={{ duration: 1.5, delay: i * 0.2, ease: 'easeOut' }}
          className="absolute w-48 h-48 rounded-full border-2"
          style={{ borderColor: tierData.color }}
        />
      ))}

      <motion.div
        initial={{ scale: 0.5, opacity: 0, y: 20 }}
        animate={{ scale: 1, opacity: 1, y: 0 }}
        transition={{ type: 'spring', stiffness: 300, damping: 20, delay: 0.1 }}
        className="text-center relative z-10 px-8"
      >
        {/* Badge */}
        <motion.div
          animate={{ rotate: [0, -10, 10, -5, 5, 0] }}
          transition={{ duration: 0.6, delay: 0.3 }}
          className="text-8xl mb-4"
        >
          {tierData.icon}
        </motion.div>

        <motion.div
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <p className="text-sm font-mono uppercase tracking-widest mb-1"
            style={{ color: tierData.color }}>
            Tier Unlocked
          </p>
          <h2 className="text-4xl font-black text-t1 mb-2">{tierData.name}</h2>
          <p className="text-sm text-t3 mb-6">You've reached a new level of mastery</p>

          <div
            className="inline-block px-6 py-3 rounded-2xl font-bold text-void text-sm"
            style={{
              background: `linear-gradient(135deg, ${tierData.color}, ${tierData.color}99)`,
              boxShadow: `0 0 30px ${tierData.color}60`,
            }}
          >
            ✨ Welcome to {tierData.name}
          </div>
        </motion.div>
      </motion.div>
    </motion.div>
  );
};
