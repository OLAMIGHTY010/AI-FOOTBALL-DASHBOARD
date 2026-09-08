-- ============================================================
-- Responsible Gambling & Financial Safety — Supabase Migrations
-- ============================================================
-- Run these in your Supabase SQL Editor to add the required
-- columns and functions for responsible gambling compliance.
-- ============================================================

-- 1. Add responsible gambling columns to profiles table
ALTER TABLE profiles
  ADD COLUMN IF NOT EXISTS is_self_excluded BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS self_exclusion_until TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS daily_deposit_limit NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS weekly_deposit_limit NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS monthly_deposit_limit NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS daily_loss_limit NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS daily_losses_today NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deposits_today NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deposits_this_week NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS deposits_this_month NUMERIC DEFAULT 0,
  ADD COLUMN IF NOT EXISTS last_deposit_reset DATE DEFAULT CURRENT_DATE,
  ADD COLUMN IF NOT EXISTS session_start TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS age_verified BOOLEAN DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS accepted_terms_at TIMESTAMPTZ NULL,
  ADD COLUMN IF NOT EXISTS is_vip BOOLEAN DEFAULT FALSE;


-- 2. Atomic wager deduction function (prevents race conditions / double-spending)
CREATE OR REPLACE FUNCTION deduct_wager(p_user_id UUID, p_amount NUMERIC)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET bankroll = bankroll - p_amount
  WHERE id = p_user_id
    AND bankroll >= p_amount
    AND is_self_excluded = FALSE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Insufficient funds, user not found, or account is self-excluded.';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 3. Atomic credit function (for payouts)
CREATE OR REPLACE FUNCTION credit_wallet(p_user_id UUID, p_amount NUMERIC)
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET bankroll = bankroll + p_amount
  WHERE id = p_user_id;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found.';
  END IF;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 4. Atomic deposit function (checks limits before crediting)
CREATE OR REPLACE FUNCTION process_deposit(p_user_id UUID, p_amount NUMERIC)
RETURNS VOID AS $$
DECLARE
  v_profile profiles%ROWTYPE;
BEGIN
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found.';
  END IF;

  IF v_profile.is_self_excluded THEN
    RAISE EXCEPTION 'Account is self-excluded. Deposits are not allowed.';
  END IF;

  -- Check daily deposit limit
  IF v_profile.daily_deposit_limit > 0
     AND (v_profile.deposits_today + p_amount) > v_profile.daily_deposit_limit THEN
    RAISE EXCEPTION 'Daily deposit limit of % exceeded.', v_profile.daily_deposit_limit;
  END IF;

  -- Check weekly deposit limit
  IF v_profile.weekly_deposit_limit > 0
     AND (v_profile.deposits_this_week + p_amount) > v_profile.weekly_deposit_limit THEN
    RAISE EXCEPTION 'Weekly deposit limit of % exceeded.', v_profile.weekly_deposit_limit;
  END IF;

  -- Check monthly deposit limit
  IF v_profile.monthly_deposit_limit > 0
     AND (v_profile.deposits_this_month + p_amount) > v_profile.monthly_deposit_limit THEN
    RAISE EXCEPTION 'Monthly deposit limit of % exceeded.', v_profile.monthly_deposit_limit;
  END IF;

  -- All checks passed — credit the account
  UPDATE profiles
  SET bankroll = bankroll + p_amount,
      deposits_today = deposits_today + p_amount,
      deposits_this_week = deposits_this_week + p_amount,
      deposits_this_month = deposits_this_month + p_amount
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 5. Daily counter reset function (call via Supabase cron or Edge Function)
CREATE OR REPLACE FUNCTION reset_daily_counters()
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET daily_losses_today = 0,
      deposits_today = 0,
      last_deposit_reset = CURRENT_DATE
  WHERE last_deposit_reset < CURRENT_DATE OR last_deposit_reset IS NULL;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 6. Weekly counter reset (call weekly)
CREATE OR REPLACE FUNCTION reset_weekly_counters()
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET deposits_this_week = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;


-- 7. Monthly counter reset (call monthly)
CREATE OR REPLACE FUNCTION reset_monthly_counters()
RETURNS VOID AS $$
BEGIN
  UPDATE profiles
  SET deposits_this_month = 0;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

-- 8. Atomic withdrawal function (checks balance before deducting)
CREATE OR REPLACE FUNCTION process_withdrawal(p_user_id UUID, p_amount NUMERIC)
RETURNS VOID AS $$
DECLARE
  v_profile profiles%ROWTYPE;
BEGIN
  SELECT * INTO v_profile FROM profiles WHERE id = p_user_id FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'User not found.';
  END IF;

  IF v_profile.bankroll < p_amount THEN
    RAISE EXCEPTION 'Insufficient bankroll.';
  END IF;

  UPDATE profiles
  SET bankroll = bankroll - p_amount
  WHERE id = p_user_id;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
