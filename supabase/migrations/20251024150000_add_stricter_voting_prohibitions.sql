-- Add a registration_id column to the profiles table
ALTER TABLE public.profiles
ADD COLUMN registration_id TEXT UNIQUE;

-- Drop the existing unique indexes on the votes table
DROP INDEX IF EXISTS authenticated_votes_idx;
DROP INDEX IF EXISTS anonymous_votes_idx;

-- Add a new, stricter unique constraint to the votes table
CREATE UNIQUE INDEX stricter_anonymous_votes_idx
ON public.votes (election_id, position_id, COALESCE(voter_id::text, device_fingerprint, ip_address));
