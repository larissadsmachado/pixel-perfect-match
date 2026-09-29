import { useState } from "react";
import { resetUserPassword, signInUser, signUpUser } from "@/services/authService";
import { toast } from "sonner";
import { User, Lock, Mail, Sparkles, X } from "lucide-react";

interface Props {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
  initialTab?: "login" | "signup" | "reset";
}

export function AuthModal({ isOpen, onClose, onSuccess, initialTab = "login" }: Props) {
  const [tab, setTab] = useState<"login" | "signup" | "reset">(initialTab);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setErrorMsg("");

    try {
      if (tab === "login") {
        await signInUser(email, password);
        toast.success("Login realizado com sucesso! Bem-vindo(a) à Magisserie 🍪");
        onSuccess?.();
        onClose();
      } else if (tab === "signup") {
        if (!name.trim()) {
          setErrorMsg("Por favor, informe seu nome ou apelido.");
          setLoading(false);
          return;
        }
        await signUpUser(email, password, name.trim());
        toast.success("Conta criada com sucesso! Você já está pronto para pontuar.");
        onSuccess?.();
        onClose();
      } else if (tab === "reset") {
        await resetUserPassword(email);
        toast.success("Link de recuperação enviado para o seu e-mail!");
        setTab("login");
      }
    } catch (err: any) {
      console.error(err);
      setErrorMsg(err.message || "Ocorreu um erro ao processar sua solicitação.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center bg-foreground/50 p-4 backdrop-blur-sm"
    >
      <div className="relative w-full max-w-md animate-celebrate rounded-3xl border border-border bg-card p-6 shadow-2xl">
        <button
          type="button"
          onClick={onClose}
          className="absolute right-4 top-4 rounded-full p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
          aria-label="Fechar"
        >
          <X className="size-5" />
        </button>

        <div className="mb-6 text-center">
          <div className="mx-auto mb-2 flex size-12 items-center justify-center rounded-2xl bg-primary/10 text-primary">
            <Sparkles className="size-6" />
          </div>
          <h2 className="text-2xl font-bold text-foreground">
            {tab === "login"
              ? "Entrar no Game Magisserie"
              : tab === "signup"
              ? "Criar sua Conta"
              : "Recuperar Senha"}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {tab === "login"
              ? "Acesse sua conta para salvar suas pontuações no ranking mensal."
              : tab === "signup"
              ? "Cadastre-se para disputar os prêmios e cupons do TOP 3!"
              : "Informe seu e-mail cadastrado para redefinir sua senha."}
          </p>
        </div>

        <div className="mb-6 flex rounded-2xl bg-muted p-1 text-xs font-semibold">
          <button
            type="button"
            onClick={() => {
              setTab("login");
              setErrorMsg("");
            }}
            className={`flex-1 rounded-xl py-2 transition-all ${
              tab === "login" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Entrar
          </button>
          <button
            type="button"
            onClick={() => {
              setTab("signup");
              setErrorMsg("");
            }}
            className={`flex-1 rounded-xl py-2 transition-all ${
              tab === "signup" ? "bg-card text-foreground shadow-sm" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            Cadastrar
          </button>
        </div>

        {errorMsg && (
          <div className="mb-4 rounded-2xl border border-destructive/30 bg-destructive/10 p-3 text-xs text-destructive">
            {errorMsg}
          </div>
        )}

        <form onSubmit={handleSubmit} className="flex flex-col gap-3">
          {tab === "signup" && (
            <div>
              <label className="mb-1 block text-xs font-semibold text-foreground">Nome de Jogador</label>
              <div className="relative">
                <User className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="text"
                  required
                  placeholder="Ex: Chef Cookie"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          )}

          <div>
            <label className="mb-1 block text-xs font-semibold text-foreground">E-mail</label>
            <div className="relative">
              <Mail className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <input
                type="email"
                required
                placeholder="seu@email.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full rounded-2xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
              />
            </div>
          </div>

          {tab !== "reset" && (
            <div>
              <div className="mb-1 flex items-center justify-between">
                <label className="text-xs font-semibold text-foreground">Senha</label>
                {tab === "login" && (
                  <button
                    type="button"
                    onClick={() => {
                      setTab("reset");
                      setErrorMsg("");
                    }}
                    className="text-xs text-primary hover:underline"
                  >
                    Esqueceu a senha?
                  </button>
                )}
              </div>
              <div className="relative">
                <Lock className="absolute left-3.5 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
                <input
                  type="password"
                  required
                  minLength={6}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full rounded-2xl border border-border bg-background py-2.5 pl-10 pr-4 text-sm text-foreground outline-none transition-all focus:border-primary focus:ring-2 focus:ring-primary/20"
                />
              </div>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="mt-2 rounded-2xl bg-primary py-3 text-sm font-bold text-primary-foreground transition-all hover:brightness-105 active:scale-95 disabled:opacity-50"
          >
            {loading
              ? "Carregando..."
              : tab === "login"
              ? "Entrar na Minha Conta"
              : tab === "signup"
              ? "Criar Minha Conta"
              : "Enviar E-mail de Recuperação"}
          </button>
        </form>

        {tab === "reset" && (
          <div className="mt-4 text-center">
            <button
              type="button"
              onClick={() => setTab("login")}
              className="text-xs text-muted-foreground hover:text-foreground hover:underline"
            >
              ← Voltar para o Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
}

