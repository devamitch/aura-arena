// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Gemini Key Setup Component
// Step-by-step guide for users to get and configure their Gemini API key.
// ═══════════════════════════════════════════════════════════════════════════════

import { estimateModelImprovement } from "@/lib/feedbackLoop";
import { testGeminiKey } from "@/services/geminiVideoService";
import { useStore } from "@store";
import { AnimatePresence, motion } from "framer-motion";
import {
  Brain,
  CheckCircle2,
  ExternalLink,
  Eye,
  EyeOff,
  Key,
  Loader2,
  Shield,
  XCircle,
} from "lucide-react";
import { useCallback, useState } from "react";

export function GeminiKeySetup() {
  const geminiApiKey = useStore((s) => s.geminiApiKey);
  const useGeminiVision = useStore((s) => s.useGeminiVision);
  const feedbackDataCount = useStore((s) => s.feedbackDataCount);
  const setGeminiApiKey = useStore((s) => s.setGeminiApiKey);
  const clearGeminiApiKey = useStore((s) => s.clearGeminiApiKey);
  const toggleGeminiVision = useStore((s) => s.toggleGeminiVision);

  const [inputKey, setInputKey] = useState(geminiApiKey);
  const [showKey, setShowKey] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"idle" | "success" | "fail">(
    "idle",
  );

  const handleTest = useCallback(async () => {
    if (!inputKey.trim()) return;
    setTesting(true);
    setTestResult("idle");
    const ok = await testGeminiKey(inputKey.trim());
    setTestResult(ok ? "success" : "fail");
    setTesting(false);
    if (ok) setGeminiApiKey(inputKey.trim());
  }, [inputKey, setGeminiApiKey]);

  const handleClear = useCallback(() => {
    clearGeminiApiKey();
    setInputKey("");
    setTestResult("idle");
  }, [clearGeminiApiKey]);

  const hasKey = geminiApiKey.length > 0;

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center gap-3 mb-2">
        <div className="w-10 h-10 rounded-2xl bg-blue-500/10 flex items-center justify-center">
          <Brain className="w-5 h-5 text-blue-400" />
        </div>
        <div>
          <h3 className="text-sm font-black text-white uppercase tracking-wider">
            Gemini AI Vision
          </h3>
          <p className="text-[10px] text-white/40 font-mono">
            Advanced video analysis powered by Google
          </p>
        </div>
      </div>

      {/* Step-by-step guide */}
      {!hasKey && (
        <div className="rounded-2xl border border-white/10 bg-white/5 p-4 space-y-3">
          <p className="text-xs font-bold text-white/70 uppercase tracking-widest mb-3">
            How to get your free API key
          </p>

          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-black flex-shrink-0">
              1
            </span>
            <div>
              <p className="text-sm text-white/80 font-medium">
                Go to Google AI Studio
              </p>
              <a
                href="https://aistudio.google.com/apikey"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-blue-400 hover:text-blue-300 flex items-center gap-1 mt-0.5"
              >
                aistudio.google.com/apikey <ExternalLink className="w-3 h-3" />
              </a>
            </div>
          </div>

          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-black flex-shrink-0">
              2
            </span>
            <p className="text-sm text-white/80 font-medium">
              Click "Create API Key" and copy it
            </p>
          </div>

          <div className="flex items-start gap-3">
            <span className="w-6 h-6 rounded-full bg-blue-500/20 text-blue-400 flex items-center justify-center text-xs font-black flex-shrink-0">
              3
            </span>
            <p className="text-sm text-white/80 font-medium">
              Paste your key below and test it
            </p>
          </div>
        </div>
      )}

      {/* Key Input */}
      <div className="space-y-3">
        <div className="relative">
          <Key className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-white/30" />
          <input
            type={showKey ? "text" : "password"}
            value={inputKey}
            onChange={(e) => {
              setInputKey(e.target.value);
              setTestResult("idle");
            }}
            placeholder="Paste your Gemini API key here..."
            className="w-full pl-10 pr-12 py-3 rounded-xl bg-white/5 border border-white/10 text-sm text-white placeholder:text-white/20 focus:outline-none focus:border-blue-500/50 focus:ring-1 focus:ring-blue-500/20 font-mono"
          />
          <button
            onClick={() => setShowKey(!showKey)}
            className="absolute right-3 top-1/2 -translate-y-1/2 text-white/30 hover:text-white/60"
          >
            {showKey ? (
              <EyeOff className="w-4 h-4" />
            ) : (
              <Eye className="w-4 h-4" />
            )}
          </button>
        </div>

        {/* Action buttons */}
        <div className="flex gap-2">
          <button
            onClick={handleTest}
            disabled={testing || !inputKey.trim()}
            className="flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl bg-blue-500/20 border border-blue-500/30 text-blue-300 text-sm font-bold hover:bg-blue-500/30 transition-colors disabled:opacity-30"
          >
            {testing ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <CheckCircle2 className="w-4 h-4" />
            )}
            {testing ? "Testing..." : "Test Connection"}
          </button>
          {hasKey && (
            <button
              onClick={handleClear}
              className="px-4 py-2.5 rounded-xl bg-red-500/10 border border-red-500/20 text-red-400 text-sm font-bold hover:bg-red-500/20 transition-colors"
            >
              Remove
            </button>
          )}
        </div>

        {/* Test result */}
        <AnimatePresence>
          {testResult !== "idle" && (
            <motion.div
              initial={{ opacity: 0, y: -5 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm font-bold ${
                testResult === "success"
                  ? "bg-green-500/10 text-green-400"
                  : "bg-red-500/10 text-red-400"
              }`}
            >
              {testResult === "success" ? (
                <CheckCircle2 className="w-4 h-4" />
              ) : (
                <XCircle className="w-4 h-4" />
              )}
              {testResult === "success"
                ? "Connected! Gemini AI is ready."
                : "Invalid key. Please check and try again."}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* Vision toggle */}
      {hasKey && (
        <div className="flex items-center justify-between px-1">
          <div>
            <p className="text-sm text-white/80 font-bold">
              Use Gemini for video analysis
            </p>
            <p className="text-[10px] text-white/40">
              Sends recorded video to Gemini for pro-level coaching
            </p>
          </div>
          <button
            onClick={toggleGeminiVision}
            className={`w-11 h-6 rounded-full transition-colors ${useGeminiVision ? "bg-blue-500" : "bg-white/10"}`}
          >
            <div
              className={`w-5 h-5 rounded-full bg-white shadow-lg transition-transform ${useGeminiVision ? "translate-x-5.5" : "translate-x-0.5"}`}
            />
          </button>
        </div>
      )}

      {/* Feedback data stats */}
      {feedbackDataCount > 0 && (
        <div className="rounded-2xl border border-white/10 bg-white/[0.03] p-4">
          <div className="flex items-center gap-2 mb-2">
            <Brain className="w-4 h-4 text-purple-400" />
            <span className="text-xs font-black uppercase tracking-widest text-white/50">
              Learning Progress
            </span>
          </div>
          <p className="text-2xl font-black text-purple-400">
            {feedbackDataCount}{" "}
            <span className="text-sm text-white/30">samples</span>
          </p>
          <p className="text-[10px] text-white/40 mt-1">
            {estimateModelImprovement(feedbackDataCount)}
          </p>
        </div>
      )}

      {/* Privacy notice */}
      <div className="flex items-start gap-2 px-1">
        <Shield className="w-3.5 h-3.5 text-white/20 mt-0.5 flex-shrink-0" />
        <p className="text-[10px] text-white/25 leading-relaxed">
          Your API key is stored only on this device and is never sent to our
          servers. Video data is sent directly to Google's Gemini API using your
          own key. Training data from analysis is saved to improve your personal
          AI coach.
        </p>
      </div>
    </div>
  );
}
