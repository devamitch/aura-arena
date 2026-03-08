// ═══════════════════════════════════════════════════════════════════════════════
// AURA ARENA — Discover (Deep Teal "Courses/Stories" Theme)
// ═══════════════════════════════════════════════════════════════════════════════

import { useUser } from "@store";
import { PREMIUM_ASSETS } from "@utils/assets";
import {
  ChevronLeft,
  Headphones,
  Play,
  Search,
  SlidersHorizontal,
  User as UserIcon,
} from "lucide-react";
import { useState } from "react";
import { useNavigate } from "react-router-dom";

export default function DiscoverPage() {
  const navigate = useNavigate();
  const user = useUser();
  const [activeTab, setActiveTab] = useState("All");

  return (
    <div
      className="page min-h-screen font-sans pb-24"
      style={{
        background: "var(--void)",
        color: "var(--t1)",
      }}
    >
      {/* ── Header Area ── */}
      <div className="pt-12 px-5 pb-6">
        <div className="flex items-center justify-between mb-8 mt-2">
          <div>
            <p
              className="text-[10px] font-bold tracking-widest uppercase mb-0.5"
              style={{ color: "var(--ac)" }}
            >
              Explore
            </p>
            <h1 className="text-xl font-bold text-white leading-none tracking-wide">
              Athletes & Events
            </h1>
          </div>

          <button
            onClick={() => navigate("/profile")}
            className="w-11 h-11 rounded-full overflow-hidden border shadow-sm"
            style={{ background: "var(--s1)", border: "2px solid var(--b2)" }}
          >
            {user?.avatarUrl ? (
              <img
                src={user.avatarUrl}
                alt="Profile"
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <UserIcon className="w-5 h-5" style={{ color: "var(--ac)" }} />
              </div>
            )}
          </button>
        </div>

        {/* Search Bar matching the sleek reference */}
        <div className="flex items-center gap-3 mb-8">
          <div
            className="flex-1 h-12 rounded-[20px] flex items-center px-4 gap-3 border shadow-inner transition-colors"
            style={{ background: "var(--s1)", borderColor: "var(--b1)" }}
          >
            <Search className="w-5 h-5" style={{ color: "var(--t3)" }} />
            <input
              type="text"
              placeholder="Search athletes or events..."
              className="bg-transparent border-none outline-none text-sm text-white placeholder-[var(--t4)] flex-1"
            />
          </div>
          <button
            className="w-12 h-12 rounded-[20px] flex items-center justify-center border shadow-inner transition-colors hover:border-[var(--ac)]"
            style={{ background: "var(--s1)", borderColor: "var(--b1)" }}
          >
            <SlidersHorizontal
              className="w-5 h-5"
              style={{ color: "var(--t2)" }}
            />
          </button>
        </div>

        {/* ── Segmented Tabs ── */}
        <div className="flex items-center gap-2 overflow-x-auto scrollbar-hide pb-2">
          {[
            { label: "All", path: null },
            { label: "Live Events", path: "/battle/live/lobby" },
            { label: "Top Athletes", path: "/discover/league" },
            { label: "Training", path: "/arena/drills" },
            { label: "Past Matches", path: "/battle/pve/select" },
          ].map(({ label, path }) => (
            <button
              key={label}
              onClick={() => {
                if (path) {
                  navigate(path);
                } else {
                  setActiveTab(label);
                }
              }}
              className={`px-5 py-2.5 rounded-full text-[13px] font-bold tracking-wide transition-all whitespace-nowrap border`}
              style={
                activeTab === label
                  ? {
                      background: "var(--ac)",
                      color: "var(--void)",
                      borderColor: "var(--ac)",
                      boxShadow: "0 0 15px var(--ac-glow)",
                    }
                  : {
                      background: "var(--s1)",
                      color: "var(--t3)",
                      borderColor: "var(--b1)",
                    }
              }
            >
              {label}
            </button>
          ))}
        </div>
      </div>

      {/* ── Main Content Area ── */}
      <div className="px-5 space-y-6">
        {/* Featured Card (Matches the large "Featured Story / Business Analytics" module) */}
        <div>
          <h2 className="text-[15px] font-bold text-white tracking-wide mb-4 px-1 -mt-2">
            Featured Athlete
          </h2>
          <div
            className="w-full rounded-[32px] overflow-hidden relative shadow-lg cursor-pointer group border transition-colors"
            style={{
              background: "var(--s1)",
              borderColor: "var(--b1)",
              minHeight: "340px",
            }}
            onClick={() => navigate("/discover/reels")}
          >
            <div
              className="absolute top-0 inset-x-8 h-[1px] opacity-80 z-20"
              style={{ background: "var(--primary-gradient)" }}
            />

            {/* Large background image */}
            <div className="absolute inset-0 opacity-40 group-hover:opacity-60 transition-opacity duration-500 blend-luminosity">
              <img
                src={PREMIUM_ASSETS.ATMOSPHERE.BATTLE_ARENA}
                alt="Featured Athlete"
                className="w-full h-full object-cover"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-[#020a0d] via-[#020a0d]/60 to-transparent" />
            </div>

            {/* Pill Badge top right */}
            <div
              className="absolute top-5 right-5 px-3 py-1.5 rounded-full backdrop-blur-md border flex items-center gap-1.5 shadow-md"
              style={{
                background: "var(--glass-bg)",
                borderColor: "var(--b2)",
              }}
            >
              <div
                className="w-2 h-2 rounded-full animate-pulse"
                style={{ background: "var(--ac)" }}
              />
              <span
                className="text-[10px] font-bold tracking-widest uppercase"
                style={{ color: "var(--ac)" }}
              >
                Live Battle
              </span>
            </div>

            {/* Content Block at bottom */}
            <div className="absolute inset-x-0 bottom-0 p-6 flex flex-col items-start gap-4">
              <div className="space-y-1">
                <p className="text-[12px] font-bold text-[#00f0ff] uppercase tracking-wider">
                  #1 Ranked Boxer
                </p>
                <h3 className="text-[28px] font-black tracking-tight text-white leading-tight">
                  Zoro vs SHDW
                </h3>
                <p className="text-[13px] text-white/70 font-medium tracking-wide">
                  Heavyweight Championship • Round 3
                </p>
              </div>

              {/* Action Buttons */}
              <div className="flex w-full gap-3 mt-2">
                <button
                  className="flex-1 h-14 rounded-full flex items-center justify-center gap-2 font-bold shadow-lg transition-transform"
                  style={{ background: "var(--ac)", color: "var(--void)" }}
                >
                  <Play className="w-5 h-5 fill-current" />
                  <span>Watch Now</span>
                </button>
                <button
                  className="flex-1 h-14 rounded-full flex items-center justify-center gap-2 font-bold border backdrop-blur-sm transition-all shadow-inner hover:bg-white/5"
                  style={{
                    color: "var(--ac)",
                    borderColor: "var(--b2)",
                    background: "var(--s1)",
                  }}
                >
                  <Headphones className="w-5 h-5" />
                  <span>Listen</span>
                </button>
              </div>
            </div>
          </div>
        </div>

        {/* Programs / Your Library List style matches the bottom sections of references */}
        <div>
          <h2 className="text-[15px] font-bold text-white tracking-wide mb-4 px-1 mt-2">
            Upcoming Events
          </h2>
          <div className="space-y-3">
            {[
              {
                title: "Mankirt vs Dilpreet",
                time: "Tomorrow, 8PM EST",
                type: "Sparring",
                img: PREMIUM_ASSETS.EVENTS.BOXING,
              },
              {
                title: "Yoga Challenge",
                time: "Friday, 12PM EST",
                type: "Endurance",
                img: PREMIUM_ASSETS.EVENTS.YOGA,
              },
              {
                title: "Zen Mastery",
                time: "Sun, 9AM EST",
                type: "Focus",
                img: PREMIUM_ASSETS.EVENTS.ZEN,
              },
            ].map((match, i) => (
              <div
                key={i}
                className="w-full rounded-[24px] p-4 flex items-center justify-between border shadow-inner transition-all cursor-pointer group relative overflow-hidden"
                style={{ background: "var(--s1)", borderColor: "var(--b1)" }}
                onClick={() => navigate("/battle/pve/select")}
              >
                <div
                  className="absolute top-0 left-0 bottom-0 w-[2px] opacity-0 group-hover:opacity-100 transition-opacity"
                  style={{ background: "var(--primary-gradient)" }}
                />
                <div className="flex items-center gap-4 relative z-10">
                  <div
                    className="w-14 h-14 rounded-[16px] overflow-hidden shadow-inner border group-hover:scale-105 transition-transform flex-shrink-0"
                    style={{
                      background: "var(--s2)",
                      borderColor: "var(--b2)",
                    }}
                  >
                    <img src={match.img} alt="" className="w-full h-full object-cover" />
                  </div>
                  <div>
                    <h4 className="text-[15px] font-bold text-white leading-snug transition-colors group-hover:text-[var(--ac)]">
                      {match.title}
                    </h4>
                    <p
                      className="text-[12px] tracking-wider mt-0.5"
                      style={{ color: "var(--t3)" }}
                    >
                      {match.type} • {match.time}
                    </p>
                  </div>
                </div>
                <div
                  className="w-10 h-10 rounded-full flex items-center justify-center border transition-colors relative z-10 shadow-sm"
                  style={{ background: "var(--s2)", borderColor: "var(--b1)" }}
                >
                  <ChevronLeft
                    className="w-5 h-5 rotate-180"
                    style={{ color: "var(--ac)" }}
                    strokeWidth={2.5}
                  />
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
