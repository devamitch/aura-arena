import { WifiOff, RefreshCw } from 'lucide-react';
export default function OfflinePage() {
  return (
    <div className="min-h-screen bg-void flex flex-col items-center justify-center gap-6 px-8 text-center">
      <div className="w-20 h-20 rounded-3xl bg-s1 border border-b1 flex items-center justify-center">
        <WifiOff className="w-10 h-10 text-t3" />
      </div>
      <div>
        <h1 className="text-2xl font-black text-t1 mb-2">You're Offline</h1>
        <p className="text-sm text-t3">Training sessions are saved locally and will sync when you reconnect.</p>
      </div>
      <button
        onClick={() => window.location.reload()}
        className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-s1 border border-b1 text-sm text-t2 font-bold"
      >
        <RefreshCw className="w-4 h-4" /> Try Again
      </button>
    </div>
  );
}
