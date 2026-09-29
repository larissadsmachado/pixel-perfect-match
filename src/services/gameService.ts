import { supabase } from "@/integrations/supabase/client";
import type { DiscountCoupon, GameMatch, RankingEntry } from "@/types/game";

const LOCAL_STORAGE_MATCHES = "magisserie_matches_v1";
const LOCAL_STORAGE_COUPONS = "magisserie_coupons_v1";

/** Get current month string in YYYY-MM format */
export function getCurrentMonthString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  return `${year}-${month}`;
}

/** Format month for display e.g. "Setembro 2026" */
export function formatMonthName(monthStr: string): string {
  const [yearStr, monthStrNum] = monthStr.split("-");
  const monthIndex = parseInt(monthStrNum, 10) - 1;
  const monthNames = [
    "Janeiro",
    "Fevereiro",
    "Março",
    "Abril",
    "Maio",
    "Junho",
    "Julho",
    "Agosto",
    "Setembro",
    "Outubro",
    "Novembro",
    "Dezembro",
  ];
  return `${monthNames[monthIndex] || monthStrNum} ${yearStr}`;
}

/** Generate unique coupon code format: MAGI5-XXXXX */
export function generateCouponCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "MAGI5-";
  for (let i = 0; i < 5; i++) {
    code += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return code;
}

/** Fallback helper: get local stored matches */
function getLocalMatches(): GameMatch[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_MATCHES);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Fallback helper: save local match */
function saveLocalMatch(match: GameMatch): void {
  try {
    const list = getLocalMatches();
    list.push({
      ...match,
      id: match.id || `local_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
      created_at: match.created_at || new Date().toISOString(),
    });
    localStorage.setItem(LOCAL_STORAGE_MATCHES, JSON.stringify(list));
  } catch (e) {
    console.error("Error saving local match:", e);
  }
}

/** Save a game match to Supabase & local storage */
export async function saveGameMatch(match: GameMatch): Promise<GameMatch> {
  const matchToSave = {
    user_id: match.user_id || null,
    player_name: match.player_name || "Jogador Magisserie",
    score: match.score,
    cookies_collected: match.cookies_collected,
    total_cookies: match.total_cookies,
    reference_month: match.reference_month || getCurrentMonthString(),
    created_at: new Date().toISOString(),
  };

  // Always save to local fallback as well
  saveLocalMatch(matchToSave);

  try {
    const { data, error } = await supabase
      .from("game_matches")
      .insert([matchToSave])
      .select()
      .single();

    if (error) {
      console.warn("Supabase insert error (using local fallback):", error.message);
      return matchToSave;
    }

    return data as GameMatch;
  } catch (err) {
    console.warn("Supabase exception (using local fallback):", err);
    return matchToSave;
  }
}

/** Fetch monthly rankings from Supabase (or local fallback) */
export async function getMonthlyRanking(monthStr: string = getCurrentMonthString()): Promise<RankingEntry[]> {
  try {
    const { data, error } = await supabase
      .from("game_matches")
      .select("*")
      .eq("reference_month", monthStr)
      .order("score", { ascending: false })
      .limit(50);

    if (!error && data && data.length > 0) {
      // Group best score per player or list top scores
      return (data as GameMatch[]).map((m, index) => ({
        position: index + 1,
        id: m.id || `match_${index}`,
        player_name: m.player_name || "Confeiteiro Anônimo",
        score: m.score,
        cookies_collected: m.cookies_collected,
        reference_month: m.reference_month,
        created_at: m.created_at || new Date().toISOString(),
      }));
    }
  } catch (e) {
    console.warn("Could not fetch ranking from Supabase, using local data:", e);
  }

  // Local fallback aggregation
  const localMatches = getLocalMatches().filter((m) => m.reference_month === monthStr);
  localMatches.sort((a, b) => b.score - a.score);

  return localMatches.map((m, index) => ({
    position: index + 1,
    id: m.id || `local_${index}`,
    player_name: m.player_name || "Jogador Magisserie",
    score: m.score,
    cookies_collected: m.cookies_collected,
    reference_month: m.reference_month,
    created_at: m.created_at || new Date().toISOString(),
  }));
}

/** Calculate ranking position for a given score in the month */
export async function calculatePlayerRank(score: number, monthStr: string = getCurrentMonthString()): Promise<number> {
  const ranking = await getMonthlyRanking(monthStr);
  const pos = ranking.findIndex((r) => r.score <= score);
  if (pos === -1) return ranking.length + 1;
  return pos + 1;
}

/** Fallback helper: get local coupons */
function getLocalCoupons(): DiscountCoupon[] {
  try {
    const raw = localStorage.getItem(LOCAL_STORAGE_COUPONS);
    return raw ? JSON.parse(raw) : [];
  } catch {
    return [];
  }
}

/** Fallback helper: save local coupon */
function saveLocalCoupon(coupon: DiscountCoupon): void {
  try {
    const list = getLocalCoupons();
    if (!list.some((c) => c.code === coupon.code)) {
      list.push(coupon);
      localStorage.setItem(LOCAL_STORAGE_COUPONS, JSON.stringify(list));
    }
  } catch (e) {
    console.error("Error saving local coupon:", e);
  }
}

/** Issue or fetch discount coupon for user */
export async function createDiscountCoupon(params: {
  user_id?: string;
  reason: string;
  ranking_position?: number;
  monthStr?: string;
}): Promise<DiscountCoupon> {
  const monthStr = params.monthStr || getCurrentMonthString();
  const newCoupon: DiscountCoupon = {
    id: `coup_${Date.now()}_${Math.random().toString(36).substring(2, 6)}`,
    user_id: params.user_id,
    code: generateCouponCode(),
    discount_percent: 5,
    reason: params.reason,
    ranking_position: params.ranking_position || null,
    reference_month: monthStr,
    status: "available",
    rules: "5% de desconto em qualquer cookie da Magisserie.",
    created_at: new Date().toISOString(),
  };

  saveLocalCoupon(newCoupon);

  try {
    const { data, error } = await supabase
      .from("coupons")
      .insert([
        {
          user_id: params.user_id || null,
          code: newCoupon.code,
          discount_percent: newCoupon.discount_percent,
          reason: newCoupon.reason,
          ranking_position: newCoupon.ranking_position,
          reference_month: newCoupon.reference_month,
          status: newCoupon.status,
          rules: newCoupon.rules,
        },
      ])
      .select()
      .single();

    if (!error && data) {
      return data as DiscountCoupon;
    }
  } catch (err) {
    console.warn("Could not insert coupon to Supabase (using local):", err);
  }

  return newCoupon;
}

/** Get all coupons for a user */
export async function getUserCoupons(userId?: string): Promise<DiscountCoupon[]> {
  if (userId) {
    try {
      const { data, error } = await supabase
        .from("coupons")
        .select("*")
        .eq("user_id", userId)
        .order("created_at", { ascending: false });

      if (!error && data) {
        return data as DiscountCoupon[];
      }
    } catch (e) {
      console.warn("Error getting user coupons from Supabase:", e);
    }
  }

  return getLocalCoupons();
}

