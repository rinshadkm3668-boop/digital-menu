-- =====================================================================
-- Run this AFTER creating your single owner user in
-- Supabase Dashboard -> Authentication -> Users -> Add user.
-- Replace the email below with YOUR owner email, then run.
-- It registers that one user as the only owner who can write data.
-- It can only be done once (the table holds a single row).
-- =====================================================================

insert into public.owner_config (owner_id)
select id from auth.users
where email = 'REPLACE_WITH_YOUR_OWNER_EMAIL'
limit 1;

-- Check: should return exactly one row
select owner_id from public.owner_config;
