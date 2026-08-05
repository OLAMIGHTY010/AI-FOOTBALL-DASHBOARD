-- Create the user_tactics table to store the user's selected formation and tactical style
CREATE TABLE IF NOT EXISTS user_tactics (
    user_id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
    formation VARCHAR(50) NOT NULL DEFAULT '4-3-3',
    style VARCHAR(50) NOT NULL DEFAULT 'Balanced',
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT timezone('utc'::text, now())
);

-- Note: In Supabase, auth.users is the standard table for authenticated users.
