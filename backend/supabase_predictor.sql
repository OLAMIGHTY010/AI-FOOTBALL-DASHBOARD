-- Create the Predictor Entries table
CREATE TABLE IF NOT EXISTS public.predictor_entries (
  id uuid DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id uuid REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
  week_id text NOT NULL,
  predictions jsonb NOT NULL,
  points integer DEFAULT 0,
  created_at timestamp with time zone DEFAULT timezone('utc'::text, now()) NOT NULL,
  UNIQUE (user_id, week_id) -- One entry per user per week
);

-- RLS Policies for predictor_entries
ALTER TABLE public.predictor_entries ENABLE ROW LEVEL SECURITY;

-- Anyone can read entries (so we can build a leaderboard)
CREATE POLICY "Anyone can view predictor entries"
  ON public.predictor_entries FOR SELECT
  USING ( true );

-- Users can insert their own predictions
CREATE POLICY "Users can insert their own predictions"
  ON public.predictor_entries FOR INSERT
  WITH CHECK ( auth.uid() = user_id );

-- Users can update their own predictions
CREATE POLICY "Users can update their own predictions"
  ON public.predictor_entries FOR UPDATE
  USING ( auth.uid() = user_id );

-- Create a view for the predictor leaderboard (joins with profiles to get usernames)
CREATE OR REPLACE VIEW public.predictor_leaderboard AS
SELECT 
  pe.week_id,
  pe.user_id,
  p.username,
  pe.points,
  pe.created_at
FROM public.predictor_entries pe
JOIN public.profiles p ON pe.user_id = p.id
ORDER BY pe.points DESC, pe.created_at ASC;
