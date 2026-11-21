-- Candidate only. Keep the public badge projection and restrict internal review records.
revoke select on public.company_verifications from public, anon, authenticated;
drop policy if exists verification_read on public.company_verifications;

-- The view owner reads the underlying table. Callers receive only the company ID
-- for current verifications; they need no privileges on internal review records.
alter view public.verified_companies set (security_invoker = false, security_barrier = true);
