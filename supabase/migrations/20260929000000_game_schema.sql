-- Schema definitions for Magisserie Caça aos Cookies Mini Game

-- Table for match scores
CREATE TABLE IF NOT EXISTS public.game_matches (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  player_name TEXT NOT NULL,
  score INT NOT NULL,
  cookies_collected INT NOT NULL,
  total_cookies INT NOT NULL,
  reference_month TEXT NOT NULL, -- Format: YYYY-MM
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Index for monthly rankings query
CREATE INDEX IF NOT EXISTS idx_game_matches_month_score ON public.game_matches (reference_month, score DESC);

-- Table for discount coupons
CREATE TABLE IF NOT EXISTS public.coupons (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  code TEXT UNIQUE NOT NULL,
  discount_percent INT NOT NULL DEFAULT 5,
  reason TEXT NOT NULL,
  ranking_position INT,
  reference_month TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'available',
  rules TEXT NOT NULL DEFAULT '5% de desconto em qualquer cookie da Magisserie',
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Row Level Security setup
ALTER TABLE public.game_matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.coupons ENABLE ROW LEVEL SECURITY;

-- RLS Policies
CREATE POLICY "Public read game matches" ON public.game_matches
  FOR SELECT USING (true);

CREATE POLICY "Insert game matches" ON public.game_matches
  FOR INSERT WITH CHECK (true);

CREATE POLICY "Public read coupons" ON public.coupons
  FOR SELECT USING (true);

CREATE POLICY "Insert coupons" ON public.coupons
  FOR INSERT WITH CHECK (true);

