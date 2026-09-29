import { useEffect, useState } from "react";
import type { User } from "@supabase/supabase-js";
import { getAuthenticatedUser, signOutUser } from "@/services/authService";
import { AuthModal } from "./AuthModal";
import { LogIn, LogOut, Ticket, Trophy, User as UserIcon } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/integrations/supabase/client";

interface Props {
  onOpenRanking: () => void;
  onOpenCoupons: () => void;
  user: User | null;
  setUser: (u: User | null) => void;
}

export function UserBar({ onOpenRanking, onOpenCoupons, user, setUser }: Props) {
  const [authModalOpen, setAuthModalOpen] = useState(false);
  const [authMode, setAuthMode] = useState<"login" | "signup">("login");

  useEffect(() => {
    getAuthenticatedUser().then((u) => setUser(u));

    const { data: authListener } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
    });

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [setUser]);

  const handleLogout = async () => {
    try {
      await signOutUser();
      setUser(null);
      toast.info("Você saiu da sua conta.");
    } catch (e) {
      console.error(e);
    }
  };

  const displayName =
    user?.user_metadata?.display_name || user?.email?.split("@")[0] || "Jogador";

  return (
    <>
      <div className="mx-auto mb-4 flex max-w-3xl flex-wrap items-center justify-between gap-2 rounded-2xl border border-border bg-card/80 p-3 backdrop-blur-sm shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex size-9 items-center justify-center rounded-xl bg-secondary text-secondary-foreground font-bold text-sm">
            🍪
          </div>
          {user ? (
            <div>
              <p className="text-xs font-bold text-foreground flex items-center gap-1">
                <UserIcon className="size-3.5 text-primary" />
                {displayName}
              </p>
              <p className="text-[10px] text-muted-foreground">{user.email}</p>
            </div>
          ) : (
            <div>
              <p className="text-xs font-bold text-foreground">Visitante Magisserie</p>
              <p className="text-[10px] text-muted-foreground">Faça login para pontuar no ranking</p>
            </div>
          )}
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={onOpenRanking}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-all hover:bg-secondary hover:text-secondary-foreground active:scale-95"
          >
            <Trophy className="size-3.5 text-amber-500" />
            <span>Ranking</span>
          </button>

          <button
            type="button"
            onClick={onOpenCoupons}
            className="flex items-center gap-1.5 rounded-xl border border-border bg-background px-3 py-1.5 text-xs font-semibold text-foreground transition-all hover:bg-secondary hover:text-secondary-foreground active:scale-95"
          >
            <Ticket className="size-3.5 text-primary" />
            <span>Cupons</span>
          </button>

          {user ? (
            <button
              type="button"
              onClick={handleLogout}
              className="flex items-center gap-1 rounded-xl bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-destructive/10 hover:text-destructive transition-colors"
              title="Sair da conta"
            >
              <LogOut className="size-3.5" />
              <span className="hidden sm:inline">Sair</span>
            </button>
          ) : (
            <div className="flex gap-1">
              <button
                type="button"
                onClick={() => {
                  setAuthMode("login");
                  setAuthModalOpen(true);
                }}
                className="flex items-center gap-1 rounded-xl bg-primary px-3 py-1.5 text-xs font-bold text-primary-foreground shadow-sm hover:brightness-105 transition-all"
              >
                <LogIn className="size-3.5" />
                <span>Entrar</span>
              </button>
            </div>
          )}
        </div>
      </div>

      <AuthModal
        isOpen={authModalOpen}
        onClose={() => setAuthModalOpen(false)}
        initialTab={authMode}
        onSuccess={() => getAuthenticatedUser().then(setUser)}
      />
    </>
  );
}

