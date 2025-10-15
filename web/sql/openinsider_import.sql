-- Recreate staging table
DROP TABLE IF EXISTS public.openinsider_raw;
CREATE TABLE public.openinsider_raw (
  transaction_date timestamptz,
  trade_date date,
  ticker text,
  company_name text,
  owner_name text,
  title text,
  transaction_type text,
  last_price text,
  qty text,
  shares_held text,
  owned text,
  value text
);

-- Load CSV into staging (psql meta-command)
\copy public.openinsider_raw FROM '/Users/kenyeung/Documents/Insider Flow/opensecret/insider_trades_2023_2025.csv' CSV HEADER

-- Upsert companies
WITH cleaned AS (
  SELECT trim(r.ticker) AS ticker_clean,
         COALESCE(NULLIF(trim(r.company_name),''), trim(r.ticker)) AS name_clean
  FROM public.openinsider_raw r
  WHERE r.ticker IS NOT NULL AND trim(r.ticker) <> ''
), dedup AS (
  SELECT DISTINCT ON (ticker_clean) ticker_clean, name_clean
  FROM cleaned
  ORDER BY ticker_clean, name_clean
)
INSERT INTO openinsider_companies (id, ticker, name, updated_at)
SELECT gen_random_uuid()::text, d.ticker_clean, d.name_clean, NOW()
FROM dedup d
ON CONFLICT (ticker) DO UPDATE SET name = EXCLUDED.name, updated_at = NOW();

-- Upsert owners
WITH cleaned_o AS (
  SELECT trim(r.owner_name) AS owner_name_clean,
         NULLIF(trim(r.title),'') AS title_clean
  FROM public.openinsider_raw r
  WHERE r.owner_name IS NOT NULL AND trim(r.owner_name) <> ''
), dedup_o AS (
  SELECT DISTINCT ON (owner_name_clean) owner_name_clean, title_clean
  FROM cleaned_o
  ORDER BY owner_name_clean, title_clean
)
INSERT INTO openinsider_owners (id, name, title, updated_at)
SELECT gen_random_uuid()::text, d.owner_name_clean, d.title_clean, NOW()
FROM dedup_o d
ON CONFLICT (name) DO UPDATE SET title = COALESCE(EXCLUDED.title, openinsider_owners.title), updated_at = NOW();

-- Insert transactions
INSERT INTO openinsider_transactions (
  id,
  transaction_date,
  trade_date,
  transaction_type,
  last_price,
  quantity,
  shares_held,
  owned,
  value,
  value_numeric,
  company_id,
  owner_id,
  updated_at
)
SELECT 
  gen_random_uuid()::text,
  r.transaction_date,
  r.trade_date,
  r.transaction_type,
  NULLIF(regexp_replace(r.last_price, '[^0-9\.]', '', 'g'), '')::numeric,
  r.qty,
  r.shares_held,
  r.owned,
  r.value,
  NULLIF(regexp_replace(r.value, '[^0-9\.]', '', 'g'), '')::numeric,
  c.id,
  o.id,
  NOW()
FROM public.openinsider_raw r
JOIN openinsider_companies c ON c.ticker = r.ticker
JOIN openinsider_owners o ON o.name = r.owner_name
ON CONFLICT DO NOTHING;

-- Cleanup optional
-- DROP TABLE public.openinsider_raw;
