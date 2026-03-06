import { motion } from "framer-motion";
import { ReactNode } from "react";

export interface MusicXMatchCardProps {
  player1: {
    name: string;
    flag?: string | ReactNode;
    avatar?: string;
    vote?: string;
    badge?: string;
  };
  player2: {
    name: string;
    flag?: string | ReactNode;
    avatar?: string;
    vote?: string;
    badge?: string;
  };
  title: string | ReactNode;
  subtitle: string;
  metrics: {
    primary: string;
    secondary: string;
  };
  footer: {
    matchText: string | ReactNode;
    timerText: string;
  };
  onClick?: () => void;
}

export function MusicXMatchCard({
  player1,
  player2,
  title,
  subtitle,
  metrics,
  footer,
  onClick,
}: MusicXMatchCardProps) {
  return (
    <motion.button
      whileTap={{ scale: 0.98 }}
      onClick={onClick}
      className="w-full text-left rounded-[24px] overflow-hidden mb-4 relative"
      style={{
        background: "#0c171a", // Deep MusicX dark card background
        border: "1px solid #15244b", // Subtle blue-cyan border
      }}
    >
      <div className="p-4 flex gap-4">
        {/* Avatars Section */}
        <div className="relative flex-shrink-0 flex items-start pt-1">
          {/* Avatar 1 (Left, Top) */}
          <div className="relative z-10">
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#0c171a] bg-[#1a2b36]">
              {player1.avatar ? (
                <img
                  src={player1.avatar}
                  alt={player1.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#00f0ff] font-bold text-lg">
                  {player1.name[0]}
                </div>
              )}
            </div>
            {player1.badge && (
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#00f0ff] border-2 border-[#0c171a] flex items-center justify-center">
                <span className="text-[9px] font-bold text-[#040914]">
                  {player1.badge}
                </span>
              </div>
            )}
            <div className="absolute -bottom-5 inset-x-0 flex flex-col items-center justify-center">
              <div className="flex items-center gap-1">
                {typeof player1.flag === "string" ? (
                  <span className="text-[10px]">{player1.flag}</span>
                ) : (
                  player1.flag
                )}
                <span className="text-[10px] font-bold text-white truncate max-w-[40px]">
                  {player1.name}
                </span>
              </div>
              {player1.vote && (
                <span className="text-[9px] font-bold text-[#00f0ff] mt-0.5">
                  {player1.vote}
                </span>
              )}
            </div>
          </div>

          {/* Avatar 2 (Right, Bottom) */}
          <div className="relative -ml-3 mt-3 z-0">
            <div className="w-14 h-14 rounded-full overflow-hidden border-2 border-[#0c171a] bg-[#1a2b36] shadow-xl">
              {player2.avatar ? (
                <img
                  src={player2.avatar}
                  alt={player2.name}
                  className="w-full h-full object-cover"
                />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-[#00f0ff] font-bold text-lg">
                  {player2.name[0]}
                </div>
              )}
            </div>
            {player2.badge && (
              <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-[#00f0ff] border-2 border-[#0c171a] flex items-center justify-center">
                <span className="text-[9px] font-bold text-[#040914]">
                  {player2.badge}
                </span>
              </div>
            )}
            <div className="absolute -bottom-5 inset-x-0 flex flex-col items-center justify-center">
              <div className="flex items-center gap-1">
                {typeof player2.flag === "string" ? (
                  <span className="text-[10px]">{player2.flag}</span>
                ) : (
                  player2.flag
                )}
                <span className="text-[10px] font-bold text-white truncate max-w-[40px]">
                  {player2.name}
                </span>
              </div>
              {player2.vote && (
                <span className="text-[9px] font-bold text-[#00f0ff] mt-0.5">
                  {player2.vote}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Text & Buttons Section */}
        <div className="flex-1 min-w-0 pt-1 pl-2">
          <div className="flex items-center gap-2 mb-1">
            <div className="font-bold text-white text-[13px] truncate flex-1 flex items-center gap-1.5">
              {title}
            </div>
          </div>
          <p className="text-[11px] text-[#8F9A9F] truncate mb-3">{subtitle}</p>

          <div className="flex items-center gap-2">
            <div className="px-3 py-1.5 rounded-lg bg-[#00f0ff] text-[#040914] font-bold text-[10px] tracking-wide">
              {metrics.primary}
            </div>
            <div className="px-3 py-1.5 rounded-lg bg-[#040914] text-[#00f0ff] border border-[#00f0ff]/30 font-bold text-[10px] tracking-wide">
              {metrics.secondary}
            </div>
          </div>
        </div>
      </div>

      {/* Spacer for the avatar labels */}
      <div className="h-6" />

      {/* Footer Strip */}
      <div
        className="px-5 py-3 w-full flex items-center justify-between mt-2"
        style={{
          background: "#06151a",
        }} /* Dark cyan/teal solid bottom strip */
      >
        <div className="text-[9px] font-bold tracking-widest text-[#8F9A9F] flex items-center gap-2 uppercase">
          {footer.matchText}
        </div>
        <div className="font-mono text-[#00f0ff] tracking-[0.2em] font-bold text-[11px] bg-black/30 px-2 py-0.5 rounded">
          {footer.timerText}
        </div>
      </div>
    </motion.button>
  );
}
