import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, Upload, CheckCircle2, AlertCircle, Activity, Apple } from 'lucide-react';
import { usePersonalization } from '@hooks/usePersonalization';
import { generateImportInsight } from '@lib/gemini';
import { saveOfflineSession } from '@lib/pwa/offlineQueue';
import { cn } from '@lib/utils';

type Source = 'strava' | 'garmin' | 'apple' | 'googlefit' | 'csv';
type Phase  = 'select' | 'importing' | 'done' | 'error';

const SOURCES: { id: Source; label: string; icon: string; color: string }[] = [
  { id: 'strava',    label: 'Strava',       icon: '🏃', color: '#FC4C02' },
  { id: 'garmin',    label: 'Garmin',       icon: '⌚', color: '#007CC2' },
  { id: 'apple',     label: 'Apple Health', icon: '🍎', color: '#FF2D55' },
  { id: 'googlefit', label: 'Google Fit',   icon: '🏋️', color: '#4285F4' },
  { id: 'csv',       label: 'CSV File',     icon: '📄', color: '#22c55e' },
];

export default function DataImportPage() {
  const navigate = useNavigate();
  const { accentColor, discipline: disc } = usePersonalization();

  const [source,   setSource]   = useState<Source | null>(null);
  const [phase,    setPhase]    = useState<Phase>('select');
  const [progress, setProgress] = useState(0);
  const [insight,  setInsight]  = useState('');
  const [count,    setCount]    = useState(0);

  const startImport = async () => {
    if (!source) return;
    setPhase('importing');
    setProgress(0);

    // Simulate import progress
    for (let i = 0; i <= 100; i += 5) {
      await new Promise((r) => setTimeout(r, 60));
      setProgress(i);
    }

    const sessionCount = Math.floor(Math.random() * 40) + 8;
    setCount(sessionCount);

    // Generate AI insight
    const msg = await generateImportInsight(
      SOURCES.find((s) => s.id === source)?.label ?? source,
      sessionCount, disc.id,
      'last 90 days'
    ).catch(() => 'Great training history! Keep up the consistency.');

    setInsight(msg);
    setPhase('done');
  };

  return (
    <div className="min-h-screen bg-void pb-24">
      <div className="flex items-center gap-3 px-5 pt-6 pb-4">
        <button onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl bg-s1 border border-b1 flex items-center justify-center">
          <ArrowLeft className="w-4 h-4 text-t2" />
        </button>
        <div>
          <p className="text-xs font-mono text-t3 uppercase tracking-widest">Profile</p>
          <h1 className="font-black text-t1 text-xl">Import Training Data</h1>
        </div>
      </div>

      <AnimatePresence mode="wait">
        {phase === 'select' && (
          <motion.div key="select" initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0 }} className="px-5 space-y-4">
            <p className="text-sm text-t3">Connect your fitness tracker to import your training history and get personalised AI insights.</p>
            <div className="space-y-2">
              {SOURCES.map((s) => (
                <button
                  key={s.id}
                  onClick={() => setSource(s.id)}
                  className={cn(
                    'w-full flex items-center gap-4 p-4 rounded-2xl border-2 transition-all',
                    source === s.id ? '' : 'bg-s1 border-b1'
                  )}
                  style={source === s.id ? {
                    borderColor: s.color, background: `${s.color}10`,
                  } : {}}
                >
                  <div className="w-11 h-11 rounded-xl flex items-center justify-center text-2xl flex-shrink-0"
                    style={{ background: `${s.color}20` }}>
                    {s.icon}
                  </div>
                  <p className="font-bold text-t1">{s.label}</p>
                  {source === s.id && (
                    <CheckCircle2 className="w-5 h-5 ml-auto flex-shrink-0" style={{ color: s.color }} />
                  )}
                </button>
              ))}
            </div>

            <button
              onClick={startImport}
              disabled={!source}
              className={cn(
                'w-full py-4 rounded-2xl font-black text-void flex items-center justify-center gap-2',
                !source && 'opacity-40 cursor-not-allowed'
              )}
              style={source ? {
                background: `linear-gradient(135deg, ${accentColor}, ${accentColor}bb)`,
                boxShadow: `0 0 24px ${accentColor}40`,
              } : { background: '#374151' }}
            >
              <Upload className="w-5 h-5" />
              {source ? `Import from ${SOURCES.find((s) => s.id === source)?.label}` : 'Select a Source'}
            </button>
          </motion.div>
        )}

        {phase === 'importing' && (
          <motion.div key="importing" initial={{ opacity: 0 }} animate={{ opacity: 1 }}
            exit={{ opacity: 0 }} className="px-5 flex flex-col items-center justify-center py-20 gap-6">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ duration: 1.5, repeat: Infinity, ease: 'linear' }}
              className="w-16 h-16 rounded-full border-4 border-transparent"
              style={{ borderTopColor: accentColor, borderRightColor: `${accentColor}40` }}
            />
            <div className="w-full space-y-2">
              <div className="flex justify-between text-xs text-t3">
                <span>Importing sessions…</span>
                <span className="font-mono">{progress}%</span>
              </div>
              <div className="h-2 bg-s2 rounded-full overflow-hidden">
                <motion.div
                  className="h-full rounded-full"
                  style={{ background: accentColor, width: `${progress}%` }}
                />
              </div>
            </div>
          </motion.div>
        )}

        {phase === 'done' && (
          <motion.div key="done" initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
            className="px-5 space-y-4">
            <div className="text-center py-8">
              <CheckCircle2 className="w-16 h-16 mx-auto mb-4 text-green-400" />
              <h2 className="text-2xl font-black text-t1 mb-1">Import Complete!</h2>
              <p className="text-t3 text-sm">{count} sessions imported successfully</p>
            </div>

            {insight && (
              <div className="bg-s1 rounded-2xl p-4 border border-b1">
                <p className="text-xs font-mono text-t3 uppercase tracking-widest mb-2">AI Insight</p>
                <p className="text-sm text-t2 leading-relaxed">{insight}</p>
              </div>
            )}

            <button
              onClick={() => navigate('/profile')}
              className="w-full py-4 rounded-2xl font-black text-void"
              style={{ background: accentColor }}
            >
              View Profile
            </button>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
