interface Props {
  score: number;
  remaining: number;
  collected: number;
  total: number;
}

export function GameHUD({ score, remaining, collected, total }: Props) {
  return (
    <div className="flex w-full flex-wrap items-center justify-between gap-3">
      <div
        key={score}
        className="animate-score rounded-full bg-card px-5 py-2 text-lg font-bold text-foreground shadow-sm ring-1 ring-border"
      >
        🍪 {score} pontos
      </div>
      <div className="rounded-full bg-secondary px-5 py-2 text-sm font-semibold text-secondary-foreground">
        Cookies restantes: {remaining}
      </div>
      <p aria-live="polite" className="sr-only">
        {collected} de {total} cookies coletados. Pontuação {score}.
      </p>
    </div>
  );
}
