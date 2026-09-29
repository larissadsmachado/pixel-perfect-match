import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import type { DiscountCoupon } from "@/types/game";
import { MENU_URL } from "@/data/gameConfig";
import { calculatePlayerRank, createDiscountCoupon, saveGameMatch } from "@/services/gameService";
import { Trophy, Copy, Check, Sparkles, RotateCcw, ShoppingBag, Award } from "lucide-react";
import { toast } from "sonner";

interface Props {
  score: number;
  totalCookies: number;
  onRestart: () => void;
  onOpenRanking: () => void;
  onOpenAuth: () => void;
  user: User | null;
}

export function GameEndScreen({
  score,
  totalCookies,
  onRestart,
  onOpenRanking,
  onOpenAuth,
  user,
}: Props) {
  const [rankPos, setRankPos] = useState<number | null>(null);
  const [coupon, setCoupon] = useState<DiscountCoupon | null>(null);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(true);

  useEffect(() => {
    let isMounted = true;
    const playerName =
      user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Visitante Magisserie";

    async function processMatch() {
      try {
        // Save match
        await saveGameMatch({
          user_id: user?.id || null,
          player_name: playerName,
          score,
          cookies_collected: totalCookies,
          total_cookies: totalCookies,
          reference_month: new Date().toISOString().substring(0, 7),
        });

        // Calculate rank position
        const pos = await calculatePlayerRank(score);
        if (isMounted) setRankPos(pos);

        // Generate coupon (Top 3 gets 5% OFF, or completion reward)
        const isTop3 = pos <= 3;
        const newCoupon = await createDiscountCoupon({
          user_id: user?.id || undefined,
          reason: isTop3 ? `Ranking Mensal - ${pos}º Lugar` : "Desconto Confeitaria Magisserie",
          ranking_position: isTop3 ? pos : undefined,
        });

        if (isMounted) setCoupon(newCoupon);
      } catch (err) {
        console.error("Error processing end of match:", err);
      } finally {
        if (isMounted) setSaving(false);
      }
    }

    processMatch();

    return () => {
      isMounted = false;
    };
  }, [score, totalCookies, user]);

  const handleCopyCode = () => {
    if (!coupon) return;
    navigator.clipboard.writeText(coupon.code);
    setCopied(true);
    toast.success(`Cupom ${coupon.code} copiado com sucesso!`);
    setTimeout(() => setCopied(false), 2500);
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label="Jogo concluído"
      className="absolute inset-0 z-20 flex items-center justify-center rounded-[inherit] bg-foreground/50 p-4 backdrop-blur-md overflow-y-auto"
    >
      <div className="animate-celebrate my-auto w-full max-w-md rounded-3xl border border-border bg-card p-6 text-center shadow-2xl">
        <div className="mx-auto mb-3 flex size-14 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
          <Trophy className="size-7" />
        </div>

        <h2 className="text-2xl font-black text-foreground">
          Você encontrou todos os cookies! 🍪
        </h2>
        <p className="mt-1 text-xs text-muted-foreground">
          Parabéns! Você concluiu o labirinto da Magisserie com perfeição.
        </p>

        {/* Match Stats */}
        <div className="my-4 grid grid-cols-2 gap-2 rounded-2xl bg-muted/50 p-3">
          <div className="rounded-xl bg-card p-2.5 shadow-sm border border-border">
            <span className="block text-[10px] uppercase font-bold text-muted-foreground">Pontuação Final</span>
            <span className="text-xl font-extrabold text-primary">{score} pts</span>
          </div>
          <div className="rounded-xl bg-card p-2.5 shadow-sm border border-border">
            <span className="block text-[10px] uppercase font-bold text-muted-foreground">Posição no Ranking</span>
            <span className="text-xl font-extrabold text-foreground">
              {saving ? "..." : rankPos ? `${rankPos}º Lugar` : "TOP"}
            </span>
          </div>
        </div>

        {/* TOP 3 / Discount Coupon Card */}
        {coupon && (
          <div className="mb-4 text-left rounded-2xl border border-primary/40 bg-gradient-to-br from-primary/10 via-card to-secondary/15 p-4 shadow-sm">
            <div className="flex items-center gap-1.5 text-xs font-bold text-primary mb-1">
              <Sparkles className="size-4" />
              <span>
                {rankPos && rankPos <= 3
                  ? `🎉 Você ficou no TOP 3 (${rankPos}º Lugar)!`
                  : "🎉 Recompensa de Conclusão!"}
              </span>
            </div>

            <p className="text-sm font-extrabold text-foreground">
              Seu desconto: <span className="text-primary">{coupon.discount_percent}% OFF</span>
            </p>
            <p className="text-[11px] text-muted-foreground">{coupon.rules}</p>

            <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-background border border-border p-2">
              <div className="px-1">
                <span className="block text-[9px] font-bold uppercase text-muted-foreground">Cupom</span>
                <span className="text-sm font-mono font-bold text-primary">{coupon.code}</span>
              </div>
              <button
                type="button"
                onClick={handleCopyCode}
                className={`flex items-center gap-1.5 rounded-xl px-3.5 py-1.5 text-xs font-bold transition-all ${
                  copied
                    ? "bg-emerald-500 text-white"
                    : "bg-primary text-primary-foreground hover:brightness-105 active:scale-95"
                }`}
              >
                {copied ? (
                  <>
                    <Check className="size-3.5" />
                    <span>Copiado</span>
                  </>
                ) : (
                  <>
                    <Copy className="size-3.5" />
                    <span>Copiar código</span>
                  </>
                )}
              </button>
            </div>
          </div>
        )}

        {/* Guest prompt to login */}
        {!user && (
          <div className="mb-4 rounded-2xl bg-secondary/20 p-3 text-xs text-foreground flex items-center justify-between gap-2">
            <div className="text-left">
              <p className="font-bold">Quer salvar sua pontuação?</p>
              <p className="text-[10px] text-muted-foreground">Faça login para oficializar sua posição no ranking.</p>
            </div>
            <button
              type="button"
              onClick={onOpenAuth}
              className="shrink-0 rounded-xl bg-secondary px-3 py-1.5 text-xs font-bold text-secondary-foreground hover:brightness-105"
            >
              Cadastrar
            </button>
          </div>
        )}

        {/* Action Buttons */}
        <div className="flex flex-col gap-2">
          <button
            type="button"
            onClick={onRestart}
            className="flex items-center justify-center gap-2 rounded-2xl bg-primary px-6 py-3 text-sm font-bold text-primary-foreground shadow-md transition-all hover:brightness-105 active:scale-95"
          >
            <RotateCcw className="size-4" />
            <span>Jogar novamente</span>
          </button>

          <div className="grid grid-cols-2 gap-2">
            <button
              type="button"
              onClick={onOpenRanking}
              className="flex items-center justify-center gap-1.5 rounded-2xl border border-border bg-secondary px-3 py-2.5 text-xs font-bold text-secondary-foreground transition-colors hover:bg-accent"
            >
              <Award className="size-4" />
              <span>Ver Ranking</span>
            </button>

            <a
              href={MENU_URL}
              target="_blank"
              rel="noreferrer"
              className="flex items-center justify-center gap-1.5 rounded-2xl border border-border bg-card px-3 py-2.5 text-xs font-semibold text-foreground transition-colors hover:bg-muted"
            >
              <ShoppingBag className="size-4 text-primary" />
              <span>Ver Cookies</span>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
