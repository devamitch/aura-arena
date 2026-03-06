import { AnimatePresence, motion } from "framer-motion";
import { ChevronRight } from "lucide-react";
import { useState } from "react";
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

export default function IntroPage() {
  const navigate = useNavigate();
  const [currentIndex, setCurrentIndex] = useState(0);

  const handleNext = () => {
    if (currentIndex < SLIDES.length - 1) {
      setCurrentIndex((prev) => prev + 1);
    } else {
      navigate("/onboarding");
    }
  };

  return (
    <div
      className="page h-screen w-full font-sans overflow-hidden flex flex-col relative"
      style={{ background: "var(--background)" }}
    >
      {/* Cinematic Background */}
      <div className="absolute inset-0 z-0 overflow-hidden bg-black">
        <AnimatePresence mode="popLayout">
          <motion.img
            key={currentIndex}
            initial={{ scale: 1.1, opacity: 0 }}
            animate={{ scale: 1, opacity: 0.8 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 1.5, ease: "easeOut" }}
            src={SLIDES[currentIndex].img}
            className="w-full h-full object-cover mix-blend-luminosity absolute inset-0"
          />
        </AnimatePresence>
        <div
          className="absolute inset-0"
          style={{
            background:
              "linear-gradient(180deg, rgba(1, 8, 10, 0.4) 0%, rgba(1, 8, 10, 0.95) 100%)",
          }}
        />
      </div>

      <div className="relative z-10 flex flex-col h-full pt-20 pb-12 px-6">
        {/* Content Area */}
        <div className="flex-1 flex flex-col justify-end mb-12">
          <AnimatePresence mode="wait">
            <motion.div
              key={currentIndex}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4 }}
              className="max-w-[320px]"
            >
              <h1 className="text-5xl font-black text-white leading-[1.1] tracking-tight mb-4 drop-shadow-xl">
                {SLIDES[currentIndex].title} <br />
                <span className="text-transparent bg-clip-text bg-gradient-to-r from-[var(--ac)] to-[#0088ff] drop-shadow-[0_0_10px_rgba(0,240,255,0.4)]">
                  {SLIDES[currentIndex].highlight}
                </span>
              </h1>
              <p className="text-[15px] text-white/80 leading-relaxed font-medium drop-shadow-md">
                {SLIDES[currentIndex].desc}
              </p>
            </motion.div>
          </AnimatePresence>
        </div>

        {/* Navigation & Controls */}
        <div className="flex items-center justify-between mt-auto">
          {/* Dot Indicators */}
          <div className="flex gap-2">
            {SLIDES.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 rounded-full transition-all duration-500 ${
                  idx === currentIndex
                    ? "w-8 bg-[var(--ac)] shadow-[0_0_10px_var(--ac)]"
                    : "w-2 bg-white/20"
                }`}
              />
            ))}
          </div>

          {/* Action Button */}
          <motion.button
            whileTap={{ scale: 0.95 }}
            onClick={handleNext}
            className="flex items-center gap-4 py-3 px-6 rounded-full border border-[var(--glass-border)] bg-[var(--glass-bg)] group hover:bg-[var(--s2)] transition-colors shadow-xl"
          >
            <span className="font-bold text-[14px] text-white tracking-widest uppercase">
              {currentIndex === SLIDES.length - 1
                ? "Init Sequence"
                : "Keep Sliding"}
            </span>
            <div className="w-8 h-8 rounded-full bg-[var(--ac)] flex items-center justify-center text-black shadow-[0_0_15px_var(--ac)] group-hover:scale-110 transition-transform">
              <ChevronRight className="w-5 h-5 ml-0.5" strokeWidth={3} />
            </div>
          </motion.button>
        </div>
      </div>
    </div>
  );
}
