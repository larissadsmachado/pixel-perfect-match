import { createFileRoute } from "@tanstack/react-router";
import { CookieGame } from "@/components/game/CookieGame";

export const Route = createFileRoute("/")({
  head: () => ({
    meta: [
      { title: "Magisserie — Caça aos Cookies" },
      {
        name: "description",
        content:
          "Mini game da Magisserie: controle o personagem e colete todos os cookies tradicionais e recheados.",
      },
      { property: "og:title", content: "Magisserie — Caça aos Cookies" },
      {
        property: "og:description",
        content: "Jogue o mini game da Magisserie e colete todos os cookies.",
      },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: Index,
});

function Index() {
  return (
    <main className="min-h-screen bg-background px-4 py-6 sm:py-10">
      <header className="mx-auto mb-6 max-w-3xl text-center">
        <p className="text-xs font-semibold uppercase tracking-[0.3em] text-muted-foreground">
          Magisserie
        </p>
        <h1 className="mt-2 text-3xl font-bold text-foreground sm:text-4xl">
          Caça aos Cookies 🍪
        </h1>
        <p className="mt-2 text-sm text-muted-foreground">
          Percorra a bancada da confeitaria e colete todos os cookies.
        </p>
      </header>
      <CookieGame />
    </main>
  );
}
