import { SubDisciplineSelector } from "@features/arena/components/SubDisciplineSelector";
import { usePersonalization } from "@hooks/usePersonalization";
import { cn } from "@lib/utils";
import { useStore, useUser } from "@store";
import type { DisciplineId, SubDisciplineId } from "@types";
import { DISCIPLINES } from "@utils/constants";
import { getDiscipline } from "@utils/constants/disciplines";
import { ArrowLeft, Camera, Save } from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function AvatarPage() {
  const navigate = useNavigate();
  const user = useUser();
  const { updateUser } = useStore();
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
    <div className="min-h-screen bg-void pb-24">
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
        {/* Avatar circle */}
        <div className="flex flex-col items-center gap-3">
          <div
            className="w-24 h-24 rounded-3xl flex items-center justify-center text-5xl relative"
            style={{
              background: `${selectedDisc.color}20`,
              border: `2px solid ${selectedDisc.color}40`,
            }}
          >
            <DynamicIcon
              name={selectedDisc.icon}
              className="w-10 h-10 opacity-80"
            />
            <div className="absolute bottom-0 right-0 w-7 h-7 bg-s2 border border-b1 rounded-xl flex items-center justify-center">
              <Camera className="w-3.5 h-3.5 text-t3" />
            </div>
          </div>
          <p className="text-xs text-t3">Tap to change photo (coming soon)</p>
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
