import { useStore, useStore as useStoreRaw } from '@store';
import { motion, AnimatePresence } from 'framer-motion';
import { Download, X } from 'lucide-react';

export const InstallBanner = () => {
  const show    = useStoreRaw((s) => s.showInstallBanner);
  const dismiss = useStore((s) => s.dismissInstall);
  if (!show) return null;
  return (
    <AnimatePresence>
      <motion.div
        initial={{ y: -80, opacity: 0 }} animate={{ y: 0, opacity: 1 }} exit={{ y: -80, opacity: 0 }}
        className="fixed top-4 left-4 right-4 z-50 bg-s1 rounded-2xl border border-b1 p-4 flex items-center gap-3 shadow-xl"
      >
        <div className="w-10 h-10 rounded-xl bg-accent/20 flex items-center justify-center flex-shrink-0">
          <Download className="w-5 h-5 text-accent" />
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-bold text-t1">Install AURA ARENA</p>
          <p className="text-[11px] text-t3">Add to home screen for the best experience</p>
        </div>
        <button onClick={dismiss} className="p-1.5 rounded-lg bg-s2">
          <X className="w-3.5 h-3.5 text-t3" />
        </button>
      </motion.div>
    </AnimatePresence>
  );
};
