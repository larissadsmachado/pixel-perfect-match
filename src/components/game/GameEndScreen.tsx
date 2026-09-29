import { MENU_URL } from "@/data/gameConfig";

interface Props {
  score: number;
  onRestart: () => void;
}

export function GameEndScreen({ score, onRestart }: Props) {
  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Jogo concluído"
      className="absolute inset-0 z-10 flex items-center justify-center rounded-[inherit] bg-foreground/45 p-4 backdrop-blur-sm"
    >
      <div className="animate-celebrate w-full max-w-sm rounded-3xl bg-card p-6 text-center shadow-xl ring-1 ring-border">
        <h2 className="text-2xl font-bold text-foreground">
          Você encontrou todos os cookies! 🍪
        </h2>
        <p className="mt-2 text-sm text-muted-foreground">
          Agora só falta escolher os seus favoritos.
        </p>
        <p className="mt-4 text-lg font-bold text-primary">{score} pontos</p>
        <div className="mt-6 flex flex-col gap-2">
          <button
            type="button"
            onClick={onRestart}
            className="rounded-full bg-primary px-6 py-3 text-base font-bold text-primary-foreground transition-transform hover:brightness-105 active:scale-95"
          >
            Jogar novamente
          </button>
          <a
            href={MENU_URL}
            className="rounded-full border border-border bg-secondary px-6 py-3 text-base font-semibold text-secondary-foreground transition-colors hover:bg-accent"
          >
            Conhecer os cookies
          </a>
        </div>
      </div>
    </div>
  );
}
