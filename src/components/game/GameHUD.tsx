import { Progress } from "@/components/ui/progress";

interface Props {
  score: number;
  remaining: number;
  collected: number;
  total: number;
  mapName: string;
}

export function GameHUD({ score, remaining, collected, total, mapName }: Props) {
  const percent = total > 0 ? Math.round((collected / total) * 100) : 0;

  return (
    <div className="flex w-full flex-col gap-2 rounded-3xl border border-border bg-card p-4 shadow-sm">
      <div className="flex flex-wrap items-center justify-between gap-2">
        <div
          key={score}
          className="animate-score flex items-center gap-2 rounded-2xl bg-primary/10 border border-primary/30 px-4 py-2 text-base font-black text-primary"
        >
          <span className="text-xl">🍪</span>
          <span>{score} pts</span>
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
        <Progress value={percent} className="h-2.5 flex-1 bg-muted" />
        <span className="text-xs font-bold text-muted-foreground min-w-12 text-right">
          {percent}% ({collected}/{total})
        </span>
      </div>

      <p aria-live="polite" className="sr-only">
        {collected} de {total} cookies coletados. Pontuação {score}. Progresso {percent}%.
      </p>
    </div>
  );
}
