-- Run this script in your Supabase SQL Editor

-- 1. Add Legal Full Name to profiles
ALTER TABLE profiles ADD COLUMN IF NOT EXISTS full_name TEXT;

-- 2. Ensure it's empty by default
-- The application will prompt the user to set this before withdrawal.
