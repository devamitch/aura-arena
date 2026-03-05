import { cn } from "@lib/utils";
import { Badge } from "@shared/components/ui/badge";
import { Card } from "@shared/components/ui/card";
import type { Discipline, Drill, SubDisciplineId } from "@types";
import { Flame, Play, Timer } from "lucide-react";

interface DrillLibraryProps {
  discipline: Discipline;
  subDisciplineId?: SubDisciplineId;
  selectedId?: string;
  onSelect: (drill: Drill) => void;
  selectedDifficulty: number;
  onDifficultyChange: (diff: number) => void;
}

export function DrillLibrary({
  discipline,
  selectedId,
  onSelect,
}: DrillLibraryProps) {
  const drills = discipline.drills;

  return (
    <div className="space-y-4 h-full flex flex-col">
      <div className="flex items-center justify-between mb-2">
        <h3 className="font-display font-bold text-lg">Available Drills</h3>
        <Badge variant="secondary" className="bg-s3 text-primary border-none">
          {drills.length} Sequences
        </Badge>
      </div>

      <div className="grid grid-cols-1 gap-4 pb-4">
        {drills.map((d) => (
          <Card
            key={d.id}
            onClick={() => onSelect(d)}
            className={cn(
              "relative p-4 cursor-pointer transition-all border overflow-hidden group",
              selectedId === d.id
                ? "bg-s2 border-primary ring-1 ring-primary/30"
                : "bg-s1/50 border-white/5 hover:bg-s2 hover:border-white/10",
            )}
          >
            <div className="flex gap-4">
              <div className="w-16 h-16 rounded-2xl bg-black/40 flex items-center justify-center shrink-0 border border-white/5 group-hover:border-primary/20 transition-colors">
                <Play
                  className={cn(
                    "w-6 h-6 transition-colors",
                    selectedId === d.id
                      ? "text-primary fill-primary/20"
                      : "text-muted-foreground",
                  )}
                />
              </div>

              <div className="flex-1 space-y-1">
                <h4 className="font-display font-bold text-sm leading-tight">
                  {d.name}
                </h4>
                <p className="text-xs text-muted-foreground line-clamp-2 leading-relaxed">
                  {d.description}
                </p>

                <div className="flex items-center gap-3 pt-1">
                  <div className="flex items-center gap-1">
                    <Timer className="w-3 h-3 text-muted-foreground" />
                    <span className="font-mono text-[9px] uppercase tracking-tighter text-muted-foreground">
                      {d.duration}s
                    </span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Flame className="w-3 h-3 text-accent" />
                    <span className="font-mono text-[9px] uppercase tracking-tighter text-muted-foreground">
                      Lv.{(d as any).intensity || 1}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {selectedId === d.id && (
              <div className="absolute top-0 right-0 p-2">
                <div className="w-2 h-2 rounded-full bg-primary shadow-[0_0_8px_var(--ac)]" />
              </div>
            )}

            {/* Background Glow Effect */}
            <div className="absolute inset-x-0 bottom-0 h-1 bg-gradient-to-r from-transparent via-primary/20 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
          </Card>
        ))}
      </div>
    </div>
  );
}
