import { useEffect, useState } from "react";
import type { RankingEntry } from "@/types/game";
import { formatMonthName, getCurrentMonthString, getMonthlyRanking } from "@/services/gameService";
import { Trophy, Medal, Award, Calendar, Sparkles, X } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  currentUserId?: string | null;
}

export function RankingModal({ isOpen, onClose, currentUserId }: Props) {
  const [selectedMonth, setSelectedMonth] = useState(getCurrentMonthString());
  const [rankings, setRankings] = useState<RankingEntry[]>([]);
  const [loading, setLoading] = useState(false);

  // Generate list of available months (current month + 5 previous months)
  const availableMonths: string[] = [];
  const now = new Date();
  for (let i = 0; i < 6; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    const yr = d.getFullYear();
    const mo = String(d.getMonth() + 1).padStart(2, "0");
    availableMonths.push(`${yr}-${mo}`);
  }

  useEffect(() => {
    if (!isOpen) return;
    setLoading(true);
    getMonthlyRanking(selectedMonth).then((data) => {
      setRankings(data);
      setLoading(false);
    });
  }, [isOpen, selectedMonth]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-lg max-h-[90vh] flex flex-col animate-celebrate rounded-3xl border border-border bg-card p-6 shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-border pb-4">
          <div className="flex items-center gap-2">
            <div className="flex size-10 items-center justify-center rounded-2xl bg-amber-500/10 text-amber-500">
              <Trophy className="size-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-foreground">Ranking Mensal Magisserie</h2>
              <p className="text-xs text-muted-foreground">Competição oficial dos caçadores de cookies</p>
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

        {/* Top 3 Reward Info Banner */}
        <div className="my-4 rounded-2xl border border-primary/30 bg-primary/10 p-3.5 flex items-start gap-3">
          <Sparkles className="size-5 text-primary shrink-0 mt-0.5" />
          <div className="text-xs">
            <p className="font-bold text-foreground">🏆 Recompensa Especial do TOP 3!</p>
            <p className="text-muted-foreground mt-0.5">
              Ao final de cada mês, os 3 primeiros colocados ganham um cupom de <strong>5% OFF</strong> em qualquer cookie da Magisserie!
            </p>
          </div>
        </div>

        {/* Month Selector */}
        <div className="mb-4 flex items-center gap-2">
          <Calendar className="size-4 text-muted-foreground shrink-0" />
          <select
            value={selectedMonth}
            onChange={(e) => setSelectedMonth(e.target.value)}
            className="w-full rounded-2xl border border-border bg-background px-3 py-2 text-xs font-semibold text-foreground outline-none focus:border-primary focus:ring-2 focus:ring-primary/20"
          >
            {availableMonths.map((m) => (
              <option key={m} value={m}>
                {formatMonthName(m)} {m === getCurrentMonthString() ? "(Mês Atual)" : ""}
              </option>
            ))}
          </select>
        </div>

        {/* Leaderboard List */}
        <div className="flex-1 overflow-y-auto pr-1">
          {loading ? (
            <div className="py-12 text-center text-xs text-muted-foreground">Carregando pontuações...</div>
          ) : rankings.length === 0 ? (
            <div className="py-12 text-center text-xs text-muted-foreground">
              Nenhuma pontuação registrada para {formatMonthName(selectedMonth)} ainda. Seja o primeiro a jogar! 🍪
            </div>
          ) : (
            <div className="flex flex-col gap-2">
              {rankings.map((entry) => {
                const isTop1 = entry.position === 1;
                const isTop2 = entry.position === 2;
                const isTop3 = entry.position === 3;
                const isCurrentUser = currentUserId && entry.id === currentUserId;

                return (
                  <div
                    key={entry.id + entry.position}
                    className={`flex items-center justify-between rounded-2xl p-3 border transition-all ${
                      isTop1
                        ? "bg-amber-500/10 border-amber-500/30 text-amber-900"
                        : isTop2
                        ? "bg-slate-500/10 border-slate-500/30 text-slate-900"
                        : isTop3
                        ? "bg-orange-500/10 border-orange-500/30 text-amber-800"
                        : isCurrentUser
                        ? "bg-primary/10 border-primary/30"
                        : "bg-background border-border"
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex size-8 items-center justify-center font-bold text-sm shrink-0">
                        {isTop1 ? (
                          <Trophy className="size-6 text-amber-500" />
                        ) : isTop2 ? (
                          <Medal className="size-6 text-slate-400" />
                        ) : isTop3 ? (
                          <Award className="size-6 text-amber-700" />
                        ) : (
                          <span className="text-muted-foreground">{entry.position}º</span>
                        )}
                      </div>
                      <div>
                        <p className="text-xs font-bold text-foreground flex items-center gap-1.5">
                          {entry.player_name}
                          {(isTop1 || isTop2 || isTop3) && (
                            <span className="rounded-full bg-primary/20 px-2 py-0.5 text-[10px] font-semibold text-primary">
                              TOP {entry.position} (Cupom 5% OFF)
                            </span>
                          )}
                        </p>
                        <p className="text-[10px] text-muted-foreground">
                          {entry.cookies_collected} cookies coletados
                        </p>
                      </div>
                    </div>

                    <div className="text-right">
                      <p className="text-sm font-extrabold text-foreground">{entry.score} pts</p>
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

