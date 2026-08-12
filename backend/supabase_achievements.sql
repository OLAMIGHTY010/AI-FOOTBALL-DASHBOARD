-- 1. Add XP and Level to profiles
ALTER TABLE public.profiles
ADD COLUMN IF NOT EXISTS xp INTEGER DEFAULT 0,
ADD COLUMN IF NOT EXISTS level INTEGER DEFAULT 1;

-- 2. Create user_achievements table to store unlocked badges
CREATE TABLE IF NOT EXISTS public.user_achievements (
    id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
    user_id UUID REFERENCES public.profiles(id) ON DELETE CASCADE NOT NULL,
    badge_id TEXT NOT NULL,
    unlocked_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now()) NOT NULL,
    UNIQUE(user_id, badge_id)
);

-- RLS for user_achievements
ALTER TABLE public.user_achievements ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view their own achievements"
ON public.user_achievements FOR SELECT
USING ( auth.uid() = user_id );

CREATE POLICY "Users can unlock their own achievements"
ON public.user_achievements FOR INSERT
WITH CHECK ( auth.uid() = user_id );

-- 3. We also need a fast way to get the leaderboard sorted by XP
-- (We already have the "Anyone can view profiles for leaderboards." policy from earlier, so no new policy needed here)
