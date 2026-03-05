import { cn } from "@lib/utils";
import { DynamicIcon } from "@shared/components/ui/DynamicIcon";
import type { DisciplineId, SubDisciplineId } from "@types";
import { getSubDisciplines } from "@utils/constants/disciplines";
import { motion } from "framer-motion";
import { Check, Shield } from "lucide-react";

interface SubDisciplineSelectorProps {
  disciplineId: DisciplineId;
  selected?: SubDisciplineId;
  onSelect: (id: SubDisciplineId) => void;
}

export function SubDisciplineSelector({
  disciplineId,
  selected,
  onSelect,
}: SubDisciplineSelectorProps) {
  const subs = getSubDisciplines(disciplineId);

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-3 mb-4">
        <div className="w-10 h-10 rounded-xl bg-primary/10 flex items-center justify-center border border-primary/20">
          <Shield className="w-5 h-5 text-primary" />
        </div>
        <div>
          <h3 className="font-display font-bold text-lg">Select Style</h3>
          <p className="text-xs text-muted-foreground uppercase tracking-wider font-mono">
            Expertise Variant
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 gap-3">
        {subs.map((s: any) => (
          <button
            key={s.id}
            onClick={() => onSelect(s.id)}
            className={cn(
              "relative flex items-center justify-between p-4 rounded-2xl transition-all border text-left",
              selected === s.id
                ? "bg-primary/10 border-primary shadow-[0_0_20px_rgba(0,240,255,0.15)]"
                : "bg-s2/50 border-white/5 hover:border-white/10 hover:bg-s2",
            )}
          >
            <div className="flex items-center gap-3">
              <div
                className={cn(
                  "w-10 h-10 rounded-xl flex items-center justify-center border transition-colors",
                  selected === s.id
                    ? "bg-primary/20 border-primary/30"
                    : "bg-black/20 border-white/5",
                )}
              >
                <DynamicIcon
                  name={s.icon}
                  className={cn(
                    "w-5 h-5",
                    selected === s.id ? "text-primary" : "text-t3",
                  )}
                />
              </div>
              <div className="flex flex-col gap-0.5">
                <span
                  className={cn(
                    "font-display font-bold text-sm",
                    selected === s.id ? "text-primary" : "text-foreground",
                  )}
                >
                  {s.name}
                </span>
                <span className="text-[9px] text-muted-foreground uppercase tracking-widest font-mono">
                  {(s as any).origin || "Standard"}
                </span>
              </div>
            </div>

            {selected === s.id ? (
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                className="w-6 h-6 rounded-full bg-primary flex items-center justify-center"
              >
                <Check className="w-3.5 h-3.5 text-black" />
              </motion.div>
            ) : (
              <div className="w-6 h-6 rounded-full border border-white/10 shrink-0" />
            )}

            {selected === s.id && (
              <motion.div
                layoutId="selector-highlight"
                className="absolute inset-0 rounded-2xl border-2 border-primary pointer-events-none"
                transition={{ type: "spring", bounce: 0.2, duration: 0.6 }}
              />
            )}
          </button>
        ))}
      </div>
    </div>
  );
}
