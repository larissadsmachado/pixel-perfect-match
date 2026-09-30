import { useState, useEffect } from "react";
import { RotateCcw, Check, Sparkles, Clock, Heart, Award } from "lucide-react";
import { toast } from "sonner";

interface Ingredient {
  id: string;
  name: string;
  icon: string;
  color: string;
}

const BASES: Ingredient[] = [
  { id: "tradicional", name: "Baunilha Tradicional", icon: "🍪", color: "bg-amber-100 text-amber-900 border-amber-300" },
  { id: "chocolate", name: "Chocolate Cacau", icon: "🍫", color: "bg-amber-950 text-amber-100 border-amber-800" },
  { id: "redvelvet", name: "Red Velvet", icon: "❤️", color: "bg-rose-100 text-rose-900 border-rose-300" },
];

const FILLINGS: Ingredient[] = [
  { id: "nutella", name: "Nutella Cremosa", icon: "🌰", color: "bg-amber-900 text-amber-100 border-amber-700" },
  { id: "docedeleite", name: "Doce de Leite", icon: "🍯", color: "bg-amber-200 text-amber-950 border-amber-400" },
  { id: "pistache", name: "Creme de Pistache", icon: "🟢", color: "bg-emerald-100 text-emerald-950 border-emerald-300" },
  { id: "brigadeiro", name: "Brigadeiro Gourmet", icon: "🍫", color: "bg-[#3e2723] text-white border-[#271510]" },
];

const TOPPINGS: Ingredient[] = [
  { id: "gotas", name: "Gotas de Chocolate", icon: "🍫", color: "bg-amber-800 text-white border-amber-900" },
  { id: "granulado", name: "Granulado Colorido", icon: "🌈", color: "bg-pink-100 text-pink-900 border-pink-300" },
  { id: "morango", name: "Pedaços de Morango", icon: "🍓", color: "bg-rose-500 text-white border-rose-600" },
  { id: "mms", name: "M&Ms Crocantes", icon: "🍬", color: "bg-indigo-100 text-indigo-900 border-indigo-300" },
];

interface Order {
  id: number;
  customerName: string;
  customerAvatar: string;
  base: Ingredient;
  filling: Ingredient;
  topping: Ingredient;
  points: number;
}

function getRandomItem<T>(arr: T[]): T {
  return arr[Math.floor(Math.random() * arr.length)];
}

const CUSTOMER_NAMES = [
  "Clara", "Gabriel", "Beatriz", "Lucas", "Mariana", "Matheus", "Sofia", "Enzo"
];
const CUSTOMER_AVATARS = [
  "👩‍🍳", "👨‍🍳", "😋", "👧", "👦", "😍", "🤩", "🥳"
];

export function CookieAssemblyGame() {
  const [currentOrder, setCurrentOrder] = useState<Order | null>(null);
  const [selectedBase, setSelectedBase] = useState<Ingredient | null>(null);
  const [selectedFilling, setSelectedFilling] = useState<Ingredient | null>(null);
  const [selectedTopping, setSelectedTopping] = useState<Ingredient | null>(null);

  const [score, setScore] = useState(0);
  const [deliveredCount, setDeliveredCount] = useState(0);
  const [combo, setCombo] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [gameOver, setGameOver] = useState(false);
  const [feedback, setFeedback] = useState<string | null>(null);

  // Generate new random order
  const generateNewOrder = () => {
    const base = getRandomItem(BASES);
    const filling = getRandomItem(FILLINGS);
    const topping = getRandomItem(TOPPINGS);
    const name = getRandomItem(CUSTOMER_NAMES);
    const avatar = getRandomItem(CUSTOMER_AVATARS);

    setCurrentOrder({
      id: Date.now(),
      customerName: name,
      customerAvatar: avatar,
      base,
      filling,
      topping,
      points: 100,
    });
    setSelectedBase(null);
    setSelectedFilling(null);
    setSelectedTopping(null);
    setTimeLeft(15);
  };

  useEffect(() => {
    generateNewOrder();
  }, []);

  // Timer loop for orders
  useEffect(() => {
    if (gameOver || !currentOrder) return;

    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          // Time expired for this order
          setCombo(0);
          setFeedback("⏰ Tempo esgotado! O cliente foi embora...");
          setTimeout(() => {
            setFeedback(null);
            generateNewOrder();
          }, 1200);
          return 15;
        }
        return t - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [currentOrder, gameOver]);

  // Handle deliver cookie
  const handleDeliver = () => {
    if (!currentOrder || !selectedBase || !selectedFilling || !selectedTopping) {
      toast.error("Monte o cookie completo antes de entregar!");
      return;
    }

    const isMatch =
      selectedBase.id === currentOrder.base.id &&
      selectedFilling.id === currentOrder.filling.id &&
      selectedTopping.id === currentOrder.topping.id;

    if (isMatch) {
      const bonusCombo = combo * 20;
      const earned = currentOrder.points + bonusCombo;
      setScore((s) => s + earned);
      setDeliveredCount((c) => c + 1);
      setCombo((c) => c + 1);
      toast.success(`🎉 Pedido Perfeito! +${earned} pts!`);
      setFeedback(`😋 ${currentOrder.customerName} adorou o cookie! +${earned} pts`);

      setTimeout(() => {
        setFeedback(null);
        generateNewOrder();
      }, 1000);
    } else {
      setCombo(0);
      setFeedback("😅 Ops! A receita não está igual ao pedido do cliente!");
      toast.error("Pedido incorreto! Verifique a receita.");
      setTimeout(() => {
        setFeedback(null);
      }, 1500);
    }
  };

  const handleReset = () => {
    setScore(0);
    setDeliveredCount(0);
    setCombo(0);
    setGameOver(false);
    setFeedback(null);
    generateNewOrder();
  };

  return (
    <div className="flex w-full flex-col items-center gap-4">
      {/* Top Stats Bar */}
      <div className="flex w-full flex-wrap items-center justify-between gap-2 rounded-3xl border border-border bg-card p-3.5 shadow-sm">
        <div className="flex items-center gap-2">
          <div className="flex items-center gap-1.5 rounded-2xl bg-primary/10 border border-primary/30 px-3.5 py-1.5 text-sm font-black text-primary">
            <span>🍪</span>
            <span>{score} pts</span>
          </div>
          <div className="flex items-center gap-1 rounded-2xl bg-secondary/20 px-3 py-1.5 text-xs font-bold text-foreground">
            <span>Entregues: {deliveredCount}</span>
          </div>
        </div>

        {combo > 1 && (
          <div className="animate-bounce rounded-2xl bg-amber-500/20 border border-amber-500/40 px-3 py-1 text-xs font-black text-amber-700">
            🔥 COMBO x{combo}!
          </div>
        )}

        <button
          type="button"
          onClick={handleReset}
          className="flex items-center gap-1 rounded-xl bg-muted px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:bg-secondary"
        >
          <RotateCcw className="size-3.5" />
          <span>Reiniciar</span>
        </button>
      </div>

      {/* Customer Order Ticket Card */}
      {currentOrder && (
        <div className="relative w-full rounded-3xl border-2 border-primary/30 bg-gradient-to-r from-primary/10 via-card to-secondary/15 p-4 shadow-md text-left">
          <div className="flex items-center justify-between mb-3 border-b border-border/60 pb-2">
            <div className="flex items-center gap-2">
              <span className="text-2xl">{currentOrder.customerAvatar}</span>
              <div>
                <h3 className="text-sm font-black text-foreground">
                  Pedido de {currentOrder.customerName}
                </h3>
                <p className="text-[11px] text-muted-foreground">Monte a receita exata pedida pelo cliente!</p>
              </div>
            </div>

            {/* Timer Badge */}
            <div className={`flex items-center gap-1.5 rounded-2xl px-3 py-1 text-xs font-black ${
              timeLeft <= 5 ? "bg-rose-500 text-white animate-pulse" : "bg-card border border-border text-foreground"
            }`}>
              <Clock className="size-3.5" />
              <span>{timeLeft}s</span>
            </div>
          </div>

          {/* Requested Recipe Requirements */}
          <div className="grid grid-cols-3 gap-2">
            <div className="rounded-2xl bg-background/80 p-2 border border-border text-center">
              <span className="block text-[9px] uppercase font-bold text-muted-foreground">1. Massa Base</span>
              <span className="text-sm font-bold text-foreground flex items-center justify-center gap-1 mt-0.5">
                <span>{currentOrder.base.icon}</span>
                <span className="truncate">{currentOrder.base.name}</span>
              </span>
            </div>

            <div className="rounded-2xl bg-background/80 p-2 border border-border text-center">
              <span className="block text-[9px] uppercase font-bold text-muted-foreground">2. Recheio</span>
              <span className="text-sm font-bold text-foreground flex items-center justify-center gap-1 mt-0.5">
                <span>{currentOrder.filling.icon}</span>
                <span className="truncate">{currentOrder.filling.name}</span>
              </span>
            </div>

            <div className="rounded-2xl bg-background/80 p-2 border border-border text-center">
              <span className="block text-[9px] uppercase font-bold text-muted-foreground">3. Cobertura</span>
              <span className="text-sm font-bold text-foreground flex items-center justify-center gap-1 mt-0.5">
                <span>{currentOrder.topping.icon}</span>
                <span className="truncate">{currentOrder.topping.name}</span>
              </span>
            </div>
          </div>
        </div>
      )}

      {/* Live Assembly Counter & Cookie Preview */}
      <div className="relative w-full rounded-3xl border-2 border-border bg-board p-5 shadow-lg flex flex-col items-center justify-center gap-3">
        <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
          Bancada de Montagem Magisserie
        </h4>

        {/* Live Cookie Preview Visual */}
        <div className="relative flex size-28 items-center justify-center rounded-full border-4 border-dashed border-primary/40 bg-card shadow-inner transition-all duration-300">
          {selectedBase ? (
            <div className="relative flex size-full items-center justify-center rounded-full p-2">
              <span className="text-5xl">{selectedBase.icon}</span>
              {selectedFilling && (
                <span className="absolute text-2xl animate-ping opacity-75">{selectedFilling.icon}</span>
              )}
              {selectedTopping && (
                <span className="absolute top-1 right-1 text-xl animate-bounce">{selectedTopping.icon}</span>
              )}
            </div>
          ) : (
            <span className="text-xs text-muted-foreground text-center px-2 font-semibold">
              Selecione os ingredientes abaixo
            </span>
          )}
        </div>

        {feedback && (
          <div className="animate-bounce text-xs font-bold text-primary bg-primary/10 px-3 py-1 rounded-full">
            {feedback}
          </div>
        )}
      </div>

      {/* Ingredient Selectors */}
      <div className="w-full flex flex-col gap-3">
        {/* Step 1: Base */}
        <div>
          <label className="block text-xs font-bold text-foreground mb-1 text-left">
            1. Selecione a Massa Base:
          </label>
          <div className="grid grid-cols-3 gap-2">
            {BASES.map((b) => (
              <button
                key={b.id}
                type="button"
                onClick={() => setSelectedBase(b)}
                className={`flex items-center justify-center gap-1.5 rounded-2xl p-2.5 text-xs font-bold border transition-all ${
                  selectedBase?.id === b.id
                    ? "bg-primary text-primary-foreground border-primary shadow-md scale-95"
                    : "bg-card border-border hover:bg-secondary/20"
                }`}
              >
                <span>{b.icon}</span>
                <span className="truncate">{b.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Step 2: Filling */}
        <div>
          <label className="block text-xs font-bold text-foreground mb-1 text-left">
            2. Selecione o Recheio Especial:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {FILLINGS.map((f) => (
              <button
                key={f.id}
                type="button"
                onClick={() => setSelectedFilling(f)}
                className={`flex items-center justify-center gap-1.5 rounded-2xl p-2.5 text-xs font-bold border transition-all ${
                  selectedFilling?.id === f.id
                    ? "bg-primary text-primary-foreground border-primary shadow-md scale-95"
                    : "bg-card border-border hover:bg-secondary/20"
                }`}
              >
                <span>{f.icon}</span>
                <span className="truncate">{f.name}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Step 3: Topping */}
        <div>
          <label className="block text-xs font-bold text-foreground mb-1 text-left">
            3. Selecione a Cobertura / Topping:
          </label>
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            {TOPPINGS.map((t) => (
              <button
                key={t.id}
                type="button"
                onClick={() => setSelectedTopping(t)}
                className={`flex items-center justify-center gap-1.5 rounded-2xl p-2.5 text-xs font-bold border transition-all ${
                  selectedTopping?.id === t.id
                    ? "bg-primary text-primary-foreground border-primary shadow-md scale-95"
                    : "bg-card border-border hover:bg-secondary/20"
                }`}
              >
                <span>{t.icon}</span>
                <span className="truncate">{t.name}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      {/* Deliver Button */}
      <button
        type="button"
        onClick={handleDeliver}
        className="w-full rounded-2xl bg-gradient-to-r from-primary via-amber-500 to-orange-500 py-3.5 text-sm font-black text-white shadow-lg transition-all hover:brightness-105 active:scale-95 flex items-center justify-center gap-2"
      >
        <Sparkles className="size-5" />
        <span>Assar & Entregar Cookie ao Cliente</span>
      </button>
    </div>
  );
}

