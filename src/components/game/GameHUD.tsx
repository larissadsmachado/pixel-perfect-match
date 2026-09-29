import { Progress } from "@/components/ui/progress";
import { Heart } from "lucide-react";

interface Props {
  score: number;
  remaining: number;
  collected: number;
  total: number;
  mapName: string;
  lives: number;
}

export function GameHUD({ score, remaining, collected, total, mapName, lives }: Props) {
  const percent = total > 0 ? Math.round((collected / total) * 100) : 0;

  return (
    <div className="flex w-full flex-col gap-2 rounded-3xl border border-border bg-card p-3.5 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          {/* Score */}
          <div
            key={score}
            className="animate-score flex items-center gap-1.5 rounded-2xl bg-primary/10 border border-primary/30 px-3.5 py-1.5 text-sm font-black text-primary"
          >
            <span className="text-base">🍪</span>
            <span>{score} pts</span>
          </div>

          {/* Lives Counter */}
          <div className="flex items-center gap-1 rounded-2xl bg-rose-500/10 border border-rose-500/20 px-3 py-1.5">
            {[1, 2, 3].map((heartIndex) => (
              <Heart
                key={heartIndex}
                className={`size-4 transition-all ${
                  heartIndex <= lives
                    ? "fill-rose-500 text-rose-500 scale-100"
                    : "fill-muted text-muted-foreground/30 scale-90"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="rounded-xl bg-secondary/20 px-3 py-1.5 text-xs font-bold text-foreground">
            {mapName}
          </span>
          <span className="rounded-xl bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground">
            Restantes: <strong className="text-foreground">{remaining}</strong>
          </span>
        </div>
      </div>

      <div className="flex items-center gap-3">
        <Progress value={percent} className="h-2 flex-1 bg-muted" />
        <span className="text-[11px] font-bold text-muted-foreground min-w-12 text-right">
          {percent}% ({collected}/{total})
        </span>
      </div>
    </div>
  );
}
