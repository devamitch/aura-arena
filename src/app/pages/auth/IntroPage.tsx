import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { useRef, useState } from "react";
import { useNavigate } from "react-router-dom";

const SLIDES = [
  {
    title: "Setting",
    highlight: "ATHLETES FREE",
    desc: "Experience the ultimate Global Online Olympic Arena. Train, compete, and rise through the ranks in a visually stunning virtual environment.",
    img: "/assets/images/generated/intro_arena_1.png",
  },
  {
    title: "Master",
    highlight: "YOUR DISCIPLINE",
    desc: "AI-driven coaching and immersive camera mirrors give you real-time feedback. Perfect your form across dozens of sports.",
    img: "/assets/images/generated/onboarding_ai_referee.png",
  },
  {
    title: "Claim",
    highlight: "THE GLORY",
    desc: "Compete in live global tournaments. Bet on matches, win rewards, and prove your dedication on the world stage.",
    img: "/assets/images/generated/intro_arena_referee.png",
  },
];

// Floating stat cards shown on slide 3
const SLIDE3_STATS = [
  {
    value: "100+",
    label: "Sub-disciplines\nacross 10 sports",
    img: "/assets/images/generated/intro_boxing_athlete.png",
    top: "8%",
    left: "4%",
    width: "w-32",
  },
  {
    value: "AI",
    label: "Real-time scoring\nwith MediaPipe",
    img: "/assets/images/generated/intro_yoga_athlete.png",
    top: "6%",
    right: "4%",
    width: "w-28",
  },
  {
    value: "~30%",
    label: "Better form\nafter 7 sessions",
    img: "/assets/images/generated/onboarding_ai_referee.png",
    top: "48%",
    right: "6%",
    width: "w-32",
  },
];

export default function IntroPage() {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);
  const touchStartX = useRef(0);
  const touchStartY = useRef(0);
  const isDragging = useRef(false);

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      navigate("/onboarding");
    }
  };

  const handleTouchStart = (e: React.TouchEvent) => {
    touchStartX.current = e.touches[0].clientX;
    touchStartY.current = e.touches[0].clientY;
    isDragging.current = true;
  };

  const handleTouchEnd = (e: React.TouchEvent) => {
    if (!isDragging.current) return;
    isDragging.current = false;
    const dx = e.changedTouches[0].clientX - touchStartX.current;
    const dy = e.changedTouches[0].clientY - touchStartY.current;
    // Only handle horizontal swipes (not scrolls)
    if (Math.abs(dx) < Math.abs(dy) || Math.abs(dx) < 48) return;
    if (dx < 0 && currentIndex < SLIDES.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else if (dx > 0 && currentIndex > 0) {
      setCurrentIndex((prev) => prev - 1);
    }
  };

  const isLastSlide = currentIndex === SLIDES.length - 1;

  return (
    <div
      className="page w-full font-sans overflow-hidden flex flex-col relative select-none"
      style={{ background: "var(--background)", height: "100dvh" }}
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* ── Cinematic full-bleed background ── */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-black">
        <AnimatePresence mode="popLayout">
          <motion.img
            key={currentIndex}
            initial={{ scale: 1.08, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ opacity: 0, scale: 0.96 }}
            transition={{ duration: 1.4, ease: "easeOut" }}
            src={SLIDES[currentIndex].img}
            className="w-full h-full object-cover absolute inset-0"
            draggable={false}
          />
        </AnimatePresence>
        {/* Bottom scrim */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(1,8,10,0.15) 0%, rgba(1,8,10,0.25) 45%, rgba(1,8,10,0.92) 75%, rgba(1,8,10,1) 100%)",
          }}
        />
        {/* Side vignette */}
        <div
          className="absolute inset-0"
          style={{
            background:
              "radial-gradient(ellipse at center, transparent 40%, rgba(1,8,10,0.5) 100%)",
          }}
        />
      </div>

      {/* ── Floating stat cards (slide 3 only) ── */}
      <AnimatePresence>
        {isLastSlide &&
          SLIDE3_STATS.map((stat, i) => (
            <motion.div
              key={stat.value}
              initial={{ opacity: 0, scale: 0.85, y: 10 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.9 }}
              transition={{
                delay: 0.3 + i * 0.12,
                type: "spring",
                stiffness: 300,
                damping: 26,
              }}
              className={`absolute z-20 ${stat.width} rounded-2xl overflow-hidden`}
              style={{
                top: stat.top,
                left: (stat as { left?: string }).left,
                right: (stat as { right?: string }).right,
                background: "rgba(4,8,20,0.78)",
                border: "1px solid rgba(255,255,255,0.12)",
                backdropFilter: "blur(16px)",
                WebkitBackdropFilter: "blur(16px)",
              }}
            >
              {stat.img && (
                <img
                  src={stat.img}
                  alt=""
                  className="w-full h-20 object-cover object-top"
                />
              )}
              <div className="p-3">
                <p
                  className="text-2xl font-black leading-none"
                  style={{
                    color: "var(--ac)",
                    textShadow: "0 0 12px rgba(0,240,255,0.5)",
                  }}
                >
                  {stat.value}
                </p>
                <p className="text-[10px] text-white/55 font-medium leading-snug mt-0.5 whitespace-pre-line">
                  {stat.label}
                </p>
              </div>
            </motion.div>
          ))}
      </AnimatePresence>

      {/* ── Content anchored to bottom-left ── */}
      <div className="relative z-10 flex flex-col h-full pt-14 pb-10 px-6">
        {/* Logo top-left */}
        <motion.div
          key={`logo-${currentIndex}`}
          initial={{ opacity: 0, y: -8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.4 }}
          className="flex items-center gap-2"
        >
          <img
            src="/logo.png"
            alt="Aura Arena"
            className="w-7 h-7 rounded-lg object-cover"
          />
          <span className="text-white font-black text-sm tracking-tight">
            AURA<span style={{ color: "var(--ac)" }}>ARENA</span>
          </span>
        </motion.div>

        {/* Text anchored to bottom */}
        <div className="flex-1 flex flex-col justify-end mb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 22 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -16 }}
              transition={{ duration: 0.38 }}
              className="max-w-[300px]"
            >
              <h1 className="text-[44px] font-black text-white leading-[1.05] tracking-tight mb-3 drop-shadow-xl">
                {SLIDES[currentIndex].title}
                <br />
                <span
                  className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--ac)] to-[#0088ff]"
                  style={{
                    filter: "drop-shadow(0 0 12px rgba(0,240,255,0.45))",
                  }}
                >
                  {SLIDES[currentIndex].highlight}
                </span>
              </h1>
              <p className="text-[14px] text-white/65 leading-relaxed font-medium drop-shadow-md">
                {SLIDES[currentIndex].desc}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Nav row */}
        <div className="flex items-center justify-between">
          {/* Dot indicators */}
          <div className="flex gap-2 items-center">
            {SLIDES.map((_, idx) => (
              <motion.button
                key={idx}
                onClick={() => setCurrentIndex(idx)}
                animate={{
                  width: idx === currentIndex ? 28 : 8,
                  opacity: idx === currentIndex ? 1 : 0.25,
                }}
                transition={{ duration: 0.35 }}
                className="h-1.5 rounded-full"
                style={{
                  background:
                    idx === currentIndex
                      ? "var(--ac)"
                      : "rgba(255,255,255,0.3)",
                  boxShadow:
                    idx === currentIndex ? "0 0 10px var(--ac)" : "none",
                }}
              />
            ))}
          </div>

          {/* CTA button */}
          <motion.button
            whileTap={{ scale: 0.94 }}
            onClick={handleNext}
            className="flex items-center gap-3 py-3 px-5 rounded-full group transition-colors"
            style={{
              background: "rgba(255,255,255,0.06)",
              border: "1px solid rgba(255,255,255,0.12)",
              backdropFilter: "blur(12px)",
            }}
          >
            <span className="font-bold text-[13px] text-white tracking-widest uppercase">
              {isLastSlide ? "Init Sequence" : "Keep Sliding"}
            </span>
            <div
              className="w-8 h-8 rounded-full flex items-center justify-center text-black shadow-lg group-hover:scale-110 transition-transform"
              style={{
                background: "var(--ac)",
                boxShadow: "0 0 16px rgba(0,240,255,0.5)",
              }}
            >
              <ChevronRight className="w-5 h-5 ml-0.5" strokeWidth={3} />
            </div>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
