import { useEffect, useState } from "react";
import type { DiscountCoupon } from "@/types/game";
import { getUserCoupons } from "@/services/gameService";
import { Copy, Check, Ticket, Sparkles, X } from "lucide-react";
import { toast } from "sonner";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  userId?: string | null;
}

export function CouponsModal({ isOpen, onClose, userId }: Props) {
  const [coupons, setCoupons] = useState<DiscountCoupon[]>([]);
  const [loading, setLoading] = useState(false);
  const [copiedCode, setCopiedCode] = useState<string | null>(null);

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    getUserCoupons(userId || undefined).then((data) => {
      setCoupons(data);
      setLoading(false);
    });
  }, [isOpen, userId]);

  const handleCopy = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    toast.success(`Cupom ${code} copiado para a área de transferência!`);
    setTimeout(() => setCopiedCode(null), 2500);
  };

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-md max-h-[90vh] flex flex-col animate-celebrate rounded-3xl border border-border bg-card p-6 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4 mb-4">
          <div className="flex items-center gap-2">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-primary/10 text-primary">
              <Ticket className="size-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Seus Cupons de Desconto</h2>
              <p className="text-xs text-muted-foreground">Recompensas e prêmios conquistados no mini game</p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="rounded-full p-2 text-muted-foreground hover:bg-muted hover:text-foreground transition-colors"
          >
            <X className="size-5" />
          </button>
        </div>

        {/* Coupons List */}
        <div className="flex-1 overflow-y-auto pr-1">
          {loading ? (
            <div className="py-12 text-center text-xs text-muted-foreground">Carregando cupons...</div>
          ) : coupons.length === 0 ? (
            <div className="py-10 text-center text-xs text-muted-foreground flex flex-col items-center gap-2">
              <Sparkles className="size-8 text-primary/40" />
              <p className="font-semibold text-foreground">Nenhum cupom gerado ainda.</p>
              <p className="max-w-xs">
                Jogue e fique entre os 3 primeiros colocados do ranking mensal para ganhar cupons de 5% OFF!
              </p>
            </div>
          ) : (
            <div className="flex flex-col gap-3">
              {coupons.map((coupon) => {
                const isCopied = copiedCode === coupon.code;

                return (
                  <div
                    key={coupon.id}
                    className="relative overflow-hidden rounded-2xl border border-primary/30 bg-gradient-to-r from-primary/10 via-card to-secondary/10 p-4 shadow-sm"
                  >
                    <div className="flex items-start justify-between gap-2">
                      <div>
                        <span className="inline-block rounded-full bg-primary/20 px-2.5 py-0.5 text-[10px] font-bold text-primary">
                          {coupon.ranking_position
                            ? `🎉 TOP ${coupon.ranking_position} no Ranking Mensal`
                            : "🎉 Recompensa Especial"}
                        </span>
                        <h3 className="mt-1 text-base font-extrabold text-foreground">
                          Seu desconto: {coupon.discount_percent}% OFF
                        </h3>
                        <p className="text-xs text-muted-foreground mt-0.5">{coupon.rules}</p>
                      </div>
                    </div>

                    <div className="mt-3 flex items-center justify-between gap-2 rounded-xl bg-background border border-border p-2.5">
                      <div>
                        <span className="block text-[10px] text-muted-foreground uppercase tracking-wider font-semibold">
                          Código do Cupom
                        </span>
                        <span className="text-base font-mono font-bold tracking-wider text-primary">
                          {coupon.code}
                        </span>
                      </div>
                      <button
                        type="button"
                        onClick={() => handleCopy(coupon.code)}
                        className={`flex items-center gap-1.5 rounded-xl px-4 py-2 text-xs font-bold transition-all ${
                          isCopied
                            ? "bg-emerald-500 text-white"
                            : "bg-primary text-primary-foreground hover:brightness-105 active:scale-95"
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <Check className="size-4" />
                            <span>Copiado!</span>
                          </>
                        ) : (
                          <>
                            <Copy className="size-4" />
                            <span>Copiar código</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

