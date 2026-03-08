// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — AI Provider Settings
// Choose your AI coach engine + enter BYOK keys
// ═══════════════════════════════════════════════════════════════════════════════

import {
  AIProvider,
  DEFAULT_MODELS,
  PROVIDER_DISPLAY,
  PROVIDER_KEY_HELP,
  PROVIDER_MODELS,
  isValidKey,
} from "@lib/ai/providers";
import { useStore } from "@store";
import { AnimatePresence, motion } from "framer-motion";
import {
  ArrowLeft,
  Check,
  ChevronDown,
  Eye,
  EyeOff,
  ExternalLink,
  KeyRound,
  Trash2,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

const PROVIDERS: AIProvider[] = ["gemini", "claude", "openai", "groq"];

export default function AISettingsPage() {
  const navigate = useNavigate();
  const { aiProvider, aiModel, apiKeys, setAiProvider, setAiModel, setApiKey, clearApiKey } =
    useStore((s) => ({
      aiProvider: s.aiProvider,
      aiModel: s.aiModel,
      apiKeys: s.apiKeys,
      setAiProvider: s.setAiProvider,
      setAiModel: s.setAiModel,
      setApiKey: s.setApiKey,
      clearApiKey: s.clearApiKey,
    }));

  const [editingKey, setEditingKey] = useState<AIProvider | null>(null);
  const [keyDraft, setKeyDraft] = useState("");
  const [showKey, setShowKey] = useState(false);
  const [saved, setSaved] = useState<AIProvider | null>(null);
  const [modelOpen, setModelOpen] = useState(false);

  const activeKey = apiKeys[aiProvider] ?? "";
  const currentModel = aiModel || DEFAULT_MODELS[aiProvider];
  const info = PROVIDER_DISPLAY[aiProvider];
  const keyHelp = PROVIDER_KEY_HELP[aiProvider];
  const models = PROVIDER_MODELS[aiProvider];

  const handleSaveKey = () => {
    if (!editingKey) return;
    setApiKey(editingKey, keyDraft.trim());
    // Switch to that provider if key looks valid
    if (isValidKey(editingKey, keyDraft.trim())) setAiProvider(editingKey);
    setSaved(editingKey);
    setTimeout(() => setSaved(null), 2000);
    setEditingKey(null);
    setKeyDraft("");
  };

  const handleStartEdit = (p: AIProvider) => {
    setEditingKey(p);
    setKeyDraft(apiKeys[p] ?? "");
    setShowKey(false);
  };

  return (
    <div className="page pb-safe text-white flex flex-col" style={{ background: "#040914" }}>
      {/* Header */}
      <div className="flex items-center gap-3 px-5 pt-12 pb-5 flex-shrink-0">
        <motion.button whileTap={{ scale: 0.9 }} onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl flex items-center justify-center"
          style={{ background: "rgba(255,255,255,0.07)", border: "1px solid rgba(255,255,255,0.1)" }}>
          <ArrowLeft className="w-4 h-4 text-white/60" />
        </motion.button>
        <div>
          <p className="text-[9px] font-mono uppercase tracking-[0.35em]" style={{ color: "var(--ac)" }}>AI Coach</p>
          <h1 className="text-xl font-black">AI Settings</h1>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto px-5 space-y-5 pb-8">

        {/* Active provider */}
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-3">Active Provider</p>
          <div className="grid grid-cols-2 gap-2">
            {PROVIDERS.map((p) => {
              const d = PROVIDER_DISPLAY[p];
              const hasKey = !!(apiKeys[p]);
              const isActive = aiProvider === p;
              return (
                <motion.button key={p} whileTap={{ scale: 0.96 }}
                  onClick={() => setAiProvider(p)}
                  className="relative flex flex-col items-start gap-2 p-4 rounded-2xl text-left"
                  style={{
                    background: isActive ? `${d.color}15` : "rgba(255,255,255,0.04)",
                    border: isActive ? `2px solid ${d.color}60` : "1px solid rgba(255,255,255,0.08)",
                  }}>
                  {isActive && (
                    <div className="absolute top-2.5 right-2.5 w-5 h-5 rounded-full flex items-center justify-center"
                      style={{ background: d.color }}>
                      <Check className="w-3 h-3 text-white" strokeWidth={3} />
                    </div>
                  )}
                  <span className="text-lg font-black" style={{ color: isActive ? d.color : "rgba(255,255,255,0.6)" }}>
                    {d.name}
                  </span>
                  <div className="flex items-center gap-1.5">
                    <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full"
                      style={{ background: `${d.color}20`, color: d.color }}>{d.badge}</span>
                    {hasKey && (
                      <span className="text-[9px] font-mono px-1.5 py-0.5 rounded-full bg-green-500/20 text-green-400">
                        Key ✓
                      </span>
                    )}
                  </div>
                </motion.button>
              );
            })}
          </div>
        </div>

        {/* Model selector for active provider */}
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-3">Model</p>
          <div className="relative">
            <button onClick={() => setModelOpen(!modelOpen)}
              className="w-full flex items-center justify-between px-4 py-3 rounded-2xl"
              style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)" }}>
              <div>
                <p className="font-black text-sm text-white">
                  {models.find((m) => m.id === currentModel)?.label ?? currentModel}
                </p>
                <p className="text-[10px] text-white/30">{currentModel}</p>
              </div>
              <motion.div animate={{ rotate: modelOpen ? 180 : 0 }}>
                <ChevronDown className="w-4 h-4 text-white/40" />
              </motion.div>
            </button>
            <AnimatePresence>
              {modelOpen && (
                <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                  className="absolute top-full mt-2 left-0 right-0 rounded-2xl overflow-hidden z-10"
                  style={{ background: "rgba(10,14,30,0.98)", border: "1px solid rgba(255,255,255,0.12)", backdropFilter: "blur(20px)" }}>
                  {models.map((m) => (
                    <button key={m.id} onClick={() => { setAiModel(m.id); setModelOpen(false); }}
                      className="w-full flex items-center justify-between px-4 py-3 text-left hover:bg-white/5 transition-colors">
                      <div>
                        <p className="text-sm font-black text-white">{m.label}</p>
                        <p className="text-[10px] text-white/30 font-mono">{m.id}</p>
                      </div>
                      <div className="flex items-center gap-1.5">
                        {m.fast && (
                          <span className="text-[9px] px-1.5 py-0.5 rounded-full font-black text-[#00f0ff] bg-[#00f0ff]/10">
                            ⚡ Fast
                          </span>
                        )}
                        {m.id === currentModel && (
                          <Check className="w-4 h-4" style={{ color: info.color }} />
                        )}
                      </div>
                    </button>
                  ))}
                </motion.div>
              )}
            </AnimatePresence>
          </div>
        </div>

        {/* API Keys section */}
        <div>
          <p className="text-[10px] font-mono uppercase tracking-widest text-white/30 mb-3">API Keys (BYOK)</p>
          <p className="text-[11px] text-white/30 mb-4">
            Your keys are stored locally on this device and never sent to our servers.
          </p>

          {PROVIDERS.map((p) => {
            const d = PROVIDER_DISPLAY[p];
            const help = PROVIDER_KEY_HELP[p];
            const key = apiKeys[p] ?? "";
            const valid = isValidKey(p, key);
            const isEditing = editingKey === p;

            return (
              <div key={p} className="mb-3 rounded-2xl overflow-hidden"
                style={{ border: `1px solid ${isEditing ? d.color + "40" : "rgba(255,255,255,0.08)"}`, background: "rgba(255,255,255,0.03)" }}>
                {/* Provider row */}
                <div className="flex items-center gap-3 px-4 py-3">
                  <div className="w-2 h-2 rounded-full flex-shrink-0"
                    style={{ background: valid ? "#10b981" : "rgba(255,255,255,0.2)" }} />
                  <div className="flex-1">
                    <p className="text-sm font-black" style={{ color: d.color }}>{d.name}</p>
                    <p className="text-[10px] text-white/30 font-mono">
                      {key ? `${key.slice(0, 8)}${"•".repeat(Math.min(16, key.length - 8))}` : "No key set"}
                    </p>
                  </div>
                  <div className="flex items-center gap-2">
                    {key && (
                      <button onClick={() => clearApiKey(p)}
                        className="w-7 h-7 rounded-lg flex items-center justify-center text-white/30 hover:text-red-400 transition-colors">
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    )}
                    <button onClick={() => isEditing ? setEditingKey(null) : handleStartEdit(p)}
                      className="px-3 py-1.5 rounded-xl text-[11px] font-black"
                      style={{
                        background: isEditing ? `${d.color}20` : "rgba(255,255,255,0.07)",
                        color: isEditing ? d.color : "rgba(255,255,255,0.5)",
                        border: `1px solid ${isEditing ? d.color + "30" : "rgba(255,255,255,0.1)"}`,
                      }}>
                      {isEditing ? "Cancel" : key ? "Edit" : "Add Key"}
                    </button>
                  </div>
                </div>

                {/* Key input (expanded when editing) */}
                <AnimatePresence>
                  {isEditing && (
                    <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: "auto", opacity: 1 }} exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden">
                      <div className="px-4 pb-4 space-y-3">
                        <div className="flex items-center gap-2 px-3 py-2.5 rounded-xl"
                          style={{ background: "rgba(255,255,255,0.05)", border: `1px solid ${d.color}25` }}>
                          <KeyRound className="w-4 h-4 flex-shrink-0" style={{ color: d.color }} />
                          <input
                            type={showKey ? "text" : "password"}
                            value={keyDraft}
                            onChange={(e) => setKeyDraft(e.target.value)}
                            placeholder={help.placeholder}
                            className="flex-1 bg-transparent outline-none text-sm font-mono text-white placeholder-white/20"
                            autoComplete="off"
                            spellCheck={false}
                          />
                          <button onClick={() => setShowKey((v) => !v)} className="text-white/30 hover:text-white/60">
                            {showKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                          </button>
                        </div>

                        <a href={help.link} target="_blank" rel="noopener noreferrer"
                          className="flex items-center gap-1.5 text-[11px]"
                          style={{ color: d.color }}>
                          <ExternalLink className="w-3 h-3" />
                          {help.linkLabel}
                        </a>

                        <motion.button whileTap={{ scale: 0.97 }}
                          onClick={handleSaveKey}
                          disabled={!keyDraft.trim()}
                          className="w-full py-3 rounded-xl font-black text-sm"
                          style={{
                            background: keyDraft.trim() ? `linear-gradient(135deg, ${d.color}, ${d.color}99)` : "rgba(255,255,255,0.05)",
                            color: keyDraft.trim() ? "#040914" : "rgba(255,255,255,0.2)",
                          }}>
                          {saved === p ? "✓ Saved!" : `Save ${d.name} Key`}
                        </motion.button>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })}
        </div>

        {/* Active key status */}
        <div className="rounded-2xl px-4 py-3"
          style={{ background: activeKey ? "rgba(16,185,129,0.07)" : "rgba(245,158,11,0.07)",
            border: `1px solid ${activeKey ? "rgba(16,185,129,0.2)" : "rgba(245,158,11,0.2)"}` }}>
          <p className="text-[11px] font-bold" style={{ color: activeKey ? "#10b981" : "#f59e0b" }}>
            {activeKey
              ? `✓ ${info.name} is active — using your API key`
              : `⚠️ No key for ${info.name} — add one above to use it as your coach`}
          </p>
          {!activeKey && (
            <p className="text-[10px] text-white/30 mt-1">
              Without a key, the app will use Gemini Nano (on-device) or a static fallback.
            </p>
          )}
        </div>
      </div>
    </div>
  );
}
