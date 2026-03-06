import { AvatarCanvas } from "@/components/3d/AvatarCanvas";
import { SubDisciplineSelector } from "@features/arena/components/SubDisciplineSelector";
import { DynamicIcon } from "@features/shared/components/ui/DynamicIcon";
import { usePersonalization } from "@hooks/usePersonalization";
import { cn } from "@lib/utils";
import { useStore, useUser } from "@store";
import type { DisciplineId, SubDisciplineId } from "@types";
import { DISCIPLINES } from "@utils/constants";
import { getDiscipline } from "@utils/constants/disciplines";
import { ArrowLeft, Save, SlidersHorizontal, Sparkles } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AvatarPage() {
  const navigate = useNavigate();
  const user = useUser();
  const { updateUser, setAvatarConfig } = useStore();
  const { accentColor } = usePersonalization();

  const [arenaName, setArenaName] = useState(user?.arenaName ?? "");
  const [bio, setBio] = useState(user?.bio ?? "");
  const [disciplineId, setDisciplineId] = useState<DisciplineId>(
    user?.discipline ?? "boxing",
  );
  const [subDisciplineId, setSubDisciplineId] = useState<
    SubDisciplineId | undefined
  >(user?.subDiscipline);
  const [saving, setSaving] = useState(false);

  const selectedDisc = getDiscipline(disciplineId);

  const save = async () => {
    setSaving(true);
    updateUser({
      arenaName,
      bio,
      discipline: disciplineId,
      subDiscipline: subDisciplineId,
    });
    await new Promise((r) => setTimeout(r, 600));
    setSaving(false);
    navigate("/profile");
  };

  return (
    <div className="page pb-safe bg-void relative overflow-hidden">
      {/* Atmospheric background */}
      <img
        src="/assets/images/generated/profile_header_glow.svg"
        alt=""
        className="absolute top-0 inset-x-0 w-full h-[300px] object-cover opacity-60 pointer-events-none"
      />
      <div className="absolute top-0 inset-x-0 h-[300px] bg-gradient-to-t from-void via-transparent to-transparent pointer-events-none" />

      <div className="flex items-center gap-3 px-5 pt-6 pb-4">
        <button
          onClick={() => navigate(-1)}
          className="w-9 h-9 rounded-xl bg-card/60 backdrop-blur-xl border-white/10 shadow-sm flex items-center justify-center"
        >
          <ArrowLeft className="w-4 h-4 text-t2" />
        </button>
        <h1 className="font-black text-t1 text-xl">Edit Profile</h1>
      </div>

      <div className="px-5 space-y-6">
        {/* 3D Interactive Avatar Canvas */}
        <div className="flex flex-col items-center gap-2 relative z-10">
          <div
            className="w-full h-[400px] rounded-[32px] overflow-hidden relative shadow-[0_20px_40px_rgba(0,0,0,0.4)]"
            style={{
              background: "rgba(0,0,0,0.3)",
              border: `1px solid rgba(255,255,255,0.1)`,
            }}
          >
            <AvatarCanvas />

            {/* Quick config overlay */}
            <div className="absolute bottom-4 inset-x-4 flex items-center justify-between p-2 rounded-2xl bg-black/40 backdrop-blur-xl border border-white/10">
              <div className="flex gap-2">
                <button
                  onClick={() =>
                    setAvatarConfig({
                      clothingStyle: "default",
                      hairColor: "#333",
                      skinTone: "#f1c27d",
                    })
                  }
                  className="px-3 py-1.5 rounded-lg text-xs font-bold bg-white/5 hover:bg-white/10 text-white transition-colors"
                >
                  Standard
                </button>
                <button
                  onClick={() =>
                    setAvatarConfig({
                      clothingStyle: "cyberpunk",
                      hairColor: "#ff00ff",
                      skinTone: "#3b2f2f",
                    })
                  }
                  className="px-3 py-1.5 rounded-lg text-xs font-bold text-black transition-colors"
                  style={{ background: "var(--ac)" }}
                >
                  Cyberpunk
                </button>
              </div>
              <button className="w-8 h-8 flex items-center justify-center rounded-lg bg-white/5 hover:bg-white/10 text-white/50 transition-colors">
                <Sparkles className="w-4 h-4 text-purple-400" />
              </button>
            </div>
          </div>
          <p className="text-[10px] font-mono text-white/30 uppercase tracking-widest flex items-center gap-2">
            <SlidersHorizontal className="w-3 h-3" /> Live 3D Engine Preview
          </p>
        </div>

        {/* Arena name */}
        <div>
          <label className="text-xs font-mono text-t3 uppercase tracking-widest block mb-2">
            Arena Name
          </label>
          <input
            value={arenaName}
            onChange={(e) => setArenaName(e.target.value)}
            maxLength={20}
            placeholder={user?.displayName ?? "Your arena name…"}
            className="w-full bg-card/60 backdrop-blur-xl border-white/10 shadow-sm rounded-xl px-4 py-3 text-t1 placeholder:text-t3 focus:outline-none focus:border-opacity-60"
          />
        </div>

        {/* Bio */}
        <div>
          <label className="text-xs font-mono text-t3 uppercase tracking-widest block mb-2">
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            maxLength={120}
            placeholder="Tell the arena who you are…"
            rows={3}
            className="w-full bg-card/60 backdrop-blur-xl border-white/10 shadow-sm rounded-xl px-4 py-3 text-t1 placeholder:text-t3 focus:outline-none resize-none"
          />
        </div>

        {/* Discipline picker */}
        <div>
          <label className="text-xs font-mono text-t3 uppercase tracking-widest block mb-2">
            Discipline
          </label>
          <div className="grid grid-cols-3 gap-2">
            {DISCIPLINES.map((d) => (
              <button
                key={d.id}
                onClick={() => {
                  setDisciplineId(d.id);
                  setSubDisciplineId(undefined);
                }}
                className={cn(
                  "py-3 rounded-xl border-2 text-center transition-all",
                  disciplineId === d.id ? "" : "bg-s1 border-b1",
                )}
                style={
                  disciplineId === d.id
                    ? {
                        borderColor: d.color,
                        background: `${d.color}10`,
                      }
                    : {}
                }
              >
                <DynamicIcon
                  name={d.icon}
                  className="w-8 h-8 mb-2 mx-auto opacity-80"
                />
                <p className="text-[10px] text-t2 mt-0.5">{d.name}</p>
              </button>
            ))}
          </div>
        </div>

        {/* Sub-discipline */}
        {selectedDisc.subDisciplines.length > 0 && (
          <SubDisciplineSelector
            disciplineId={disciplineId}
            selected={subDisciplineId}
            onSelect={setSubDisciplineId}
          />
        )}

        {/* Save */}
        <button
          onClick={save}
          disabled={saving}
          className="w-full py-4 rounded-2xl font-black text-void flex items-center justify-center gap-2"
          style={{
            background: `linear-gradient(135deg, ${accentColor}, ${accentColor}bb)`,
          }}
        >
          {saving ? (
            <div className="w-5 h-5 border-2 border-void/40 border-t-void rounded-full animate-spin" />
          ) : (
            <>
              <Save className="w-5 h-5" /> Save Changes
            </>
          )}
        </button>
      </div>
    </div>
  );
}
