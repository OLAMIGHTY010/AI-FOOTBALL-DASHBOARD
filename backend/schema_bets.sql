CREATE TABLE IF NOT EXISTS virtual_bets (
    id UUID PRIMARY KEY DEFAULT uuid_generate_v4(),
    user_id UUID REFERENCES auth.users(id) ON DELETE CASCADE,
    wager DECIMAL(10, 2) NOT NULL,
    combined_odds DECIMAL(10, 2) NOT NULL,
    potential_payout DECIMAL(10, 2) NOT NULL,
    legs JSONB NOT NULL,
    status VARCHAR(20) DEFAULT 'PENDING',
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);
