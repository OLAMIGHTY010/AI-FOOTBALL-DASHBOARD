-- CREATE OR REPLACE VIEW for Tipster Leaderboard
CREATE OR REPLACE VIEW public.tipster_leaderboard AS
SELECT 
    p.id AS user_id,
    p.username,
    COUNT(b.id) AS total_bets,
    SUM(CASE WHEN b.status = 'WON' THEN 1 ELSE 0 END) AS bets_won,
    SUM(CASE WHEN b.status = 'LOST' THEN 1 ELSE 0 END) AS bets_lost,
    SUM(CASE 
        WHEN b.status = 'WON' THEN (b.potential_payout - b.wager)
        WHEN b.status = 'LOST' THEN -b.wager
        ELSE 0 
    END) AS net_profit,
    CASE 
        WHEN COUNT(b.id) > 0 
        THEN (SUM(CASE WHEN b.status = 'WON' THEN 1 ELSE 0 END)::decimal / COUNT(b.id)::decimal) * 100
        ELSE 0 
    END AS win_rate
FROM public.profiles p
JOIN public.virtual_bets b ON p.id = b.user_id
WHERE b.status IN ('WON', 'LOST')
GROUP BY p.id, p.username;

-- Grant access to authenticated and anon users so the frontend can read the view
GRANT SELECT ON public.tipster_leaderboard TO anon, authenticated;
