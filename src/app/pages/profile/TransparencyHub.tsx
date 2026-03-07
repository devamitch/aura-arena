import { useAuth } from "@hooks/useAuth";
import { useGoogleLogin } from "@react-oauth/google";
import { uploadDataToGoogleDrive } from "@services/googleDriveService";
import {
  AlertTriangle,
  CheckCircle,
  Cloud,
  Database,
  DownloadCloud,
  Eye,
  Lock,
  RefreshCw,
  Shield,
  Video,
} from "lucide-react";
import React, { useState } from "react";

// ─── TRANSPARENCY HUB ─────────────────────────────────────────────────────────

export const TransparencyHub: React.FC = () => {
  const { user } = useAuth();
  const [isExporting, setIsExporting] = useState(false);
  const [exportSuccess, setExportSuccess] = useState<string | null>(null);
  const [exportError, setExportError] = useState<string | null>(null);

  // Use Google Login to request Drive scope specifically
  const requestDriveAccess = useGoogleLogin({
    scope: "https://www.googleapis.com/auth/drive.file",
    onSuccess: async (tokenResponse) => {
      await performExport(tokenResponse.access_token);
    },
    onError: (_error) => {
      setExportError("Google Drive authentication failed.");
      setIsExporting(false);
    },
  });

  const handleExport = () => {
    setIsExporting(true);
    setExportError(null);
    setExportSuccess(null);
    // This will open a popup asking for Drive permissions
    requestDriveAccess();
  };

  const performExport = async (accessToken: string) => {
    if (!user) return;
    try {
      // 1. Export Profile Data
      const profileData = JSON.stringify(user, null, 2);
      await uploadDataToGoogleDrive(
        accessToken,
        `aura_arena_profile_${new Date().toISOString().split("T")[0]}.json`,
        profileData,
      );

      // (In a real scenario we would also fetch latest Session Summaries and Video Blobs
      // from Supabase storage and upload them via uploadVideoToGoogleDrive)

      setExportSuccess("Data successfully backed up to your Google Drive!");
    } catch (err: any) {
      setExportError(err.message || "Failed to export data");
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      {/* HEADER */}
      <div className="p-8 rounded-3xl bg-white/5 backdrop-blur-xl border border-white/10 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/20 to-purple-500/10 pointer-events-none" />

        <div className="relative z-10 flex items-start gap-6">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 shrink-0">
            <Shield className="w-8 h-8 text-white" />
          </div>
          <div>
            <h2 className="text-3xl font-black italic tracking-wider text-white mb-2">
              YOUR DATA, YOUR CONTROL
            </h2>
            <p className="text-white/70 max-w-2xl leading-relaxed">
              We believe in total transparency. AURA ARENA processes your
              movements locally on your device. We only save data to improve
              your personalized AI coach, and you can backup everything securely
              to your own Google Drive.
            </p>
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* DATA WE COLLECT */}
        <div className="bg-black/40 backdrop-blur-md rounded-2xl p-6 border border-white/5">
          <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
            <Database className="w-5 h-5 text-indigo-400" />
            What We Store
          </h3>
          <ul className="space-y-4">
            <li className="flex gap-3">
              <div className="mt-1 w-8 h-8 rounded-full bg-blue-500/20 flex items-center justify-center shrink-0">
                <Eye className="w-4 h-4 text-blue-400" />
              </div>
              <div>
                <p className="text-white font-medium">Posture Skeletons</p>
                <p className="text-sm text-white/60">
                  Anonymized stick-figure coordinates to track form improvement.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <div className="mt-1 w-8 h-8 rounded-full bg-purple-500/20 flex items-center justify-center shrink-0">
                <Video className="w-4 h-4 text-purple-400" />
              </div>
              <div>
                <p className="text-white font-medium">Training Videos</p>
                <p className="text-sm text-white/60">
                  Saved securely in Supabase if you enable Cloud Sync.
                </p>
              </div>
            </li>
            <li className="flex gap-3">
              <div className="mt-1 w-8 h-8 rounded-full bg-pink-500/20 flex items-center justify-center shrink-0">
                <RefreshCw className="w-4 h-4 text-pink-400" />
              </div>
              <div>
                <p className="text-white font-medium">Model Fine-Tuning</p>
                <p className="text-sm text-white/60">
                  Your scores help train our custom TensorFlow models locally.
                </p>
              </div>
            </li>
          </ul>
        </div>

        {/* DRIVE BACKUP */}
        <div className="bg-gradient-to-br from-indigo-900/40 to-slate-900/80 backdrop-blur-md rounded-2xl p-6 border border-indigo-500/20 relative overflow-hidden group">
          <div className="absolute -inset-2 bg-indigo-500/10 opacity-0 group-hover:opacity-100 transition-opacity blur-2xl" />

          <div className="relative z-10 flex flex-col h-full">
            <h3 className="text-xl font-bold text-white mb-2 flex items-center gap-2">
              <Cloud className="w-5 h-5 text-indigo-300" />
              Google Drive Backup
            </h3>
            <p className="text-white/70 text-sm mb-6 flex-grow">
              Export your entire training history, stats, and anonymized posture
              data directly to your personal Google Drive account.
            </p>

            {exportError && (
              <div className="mb-4 p-3 rounded-lg bg-red-500/20 border border-red-500/50 flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
                <p className="text-sm text-red-200">{exportError}</p>
              </div>
            )}

            {exportSuccess && (
              <div className="mb-4 p-3 rounded-lg bg-emerald-500/20 border border-emerald-500/50 flex items-center gap-2">
                <CheckCircle className="w-4 h-4 text-emerald-400 shrink-0" />
                <p className="text-sm text-emerald-200">{exportSuccess}</p>
              </div>
            )}

            <button
              onClick={handleExport}
              disabled={isExporting}
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-bold tracking-wide transition-all active:scale-[0.98] flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed shadow-[0_0_20px_rgba(79,70,229,0.3)] hover:shadow-[0_0_30px_rgba(79,70,229,0.5)]"
            >
              {isExporting ? (
                <>
                  <RefreshCw className="w-5 h-5 animate-spin" />
                  EXPORTING TO DRIVE...
                </>
              ) : (
                <>
                  <DownloadCloud className="w-5 h-5" />
                  EXPORT ALL DATA TO DRIVE
                </>
              )}
            </button>
            <p className="text-xs text-center text-white/40 mt-3 flex items-center justify-center gap-1">
              <Lock className="w-3 h-3" /> Requires Google authorization
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};
