import { createFileRoute } from "@tanstack/react-router";
import { CookieGame } from "@/components/game/CookieGame";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Magisserie — Caça aos Cookies 🍪 (Mini Game de Labirinto)" },
      {
        name: "description",
        content:
          "Mini game oficial da Magisserie: controle o mascote pelo labirinto da confeitaria, colete cookies e ganhe cupons de 5% OFF no TOP 3 do ranking mensal!",
      },
      { property: "og:title", content: "Magisserie — Caça aos Cookies 🍪" },
      {
        property: "og:description",
        content: "Jogue o mini game de labirinto da Magisserie e concorra a cupons de desconto no ranking mensal!",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="min-h-screen bg-background px-3 py-4 sm:py-8 font-sans">
      <header className="mx-auto mb-4 max-w-3xl text-center">
        <div className="inline-flex items-center gap-1.5 rounded-full border border-primary/30 bg-primary/10 px-3.5 py-1 text-xs font-black uppercase tracking-[0.25em] text-primary">
          <span>🍪 Confeitaria Magisserie</span>
        </div>
        <h1 className="mt-2 text-3xl font-black text-foreground sm:text-4xl">
          Caça aos Cookies
        </h1>
        <p className="mt-1.5 text-xs sm:text-sm text-muted-foreground max-w-lg mx-auto">
          Guie o mascote pelo labirinto artesanal, coma cookies tradicionais e recheados e conquiste o <strong className="text-foreground">TOP 3</strong> no ranking mensal para ganhar <strong className="text-primary">5% OFF</strong>!
        </p>
      </header>

      <CookieGame />
    </main>
  );
}
