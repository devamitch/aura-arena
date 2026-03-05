import { motion } from 'framer-motion';
export const FullScreenLoader = () => (
  <div className="fixed inset-0 flex items-center justify-center z-50" style={{ background: 'var(--void)' }}>
    <div className="flex flex-col items-center gap-4">
      <motion.div
        animate={{ rotate: 360 }}
        transition={{ duration: 0.9, repeat: Infinity, ease: 'linear' }}
        className="w-10 h-10 rounded-full border-2 border-transparent"
        style={{ borderTopColor: 'var(--accent)', borderRightColor: 'rgba(0,229,255,0.3)' }}
      />
      <p className="font-mono text-[9px] tracking-[0.2em] uppercase text-[var(--t3)]">AURA ARENA</p>
    </div>
  </div>
);
