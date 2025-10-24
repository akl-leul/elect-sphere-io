-- This is a consolidated migration to fix all RLS and function logic for public results.
-- It is designed to be run once and correct any previous inconsistencies.

-- Step 1: Clean up previous policies and functions to ensure a clean slate.
DROP POLICY IF EXISTS "Anyone can view active elections" ON public.elections;
DROP POLICY IF EXISTS "Anyone can view public elections" ON public.elections;
DROP POLICY IF EXISTS "Anyone can view approved candidates" ON public.candidates;
DROP POLICY IF EXISTS "Anyone can view all candidates" ON public.candidates;
DROP POLICY IF EXISTS "Anyone can view candidate profiles" ON public.profiles;
DROP FUNCTION IF EXISTS public.get_election_results(uuid);


-- Step 2: Recreate the necessary RLS policies with the correct logic.

-- Allow viewing elections if they are active OR if their results are visible.
CREATE POLICY "Anyone can view public elections"
  ON public.elections FOR SELECT
  USING (is_active = true OR results_visible = true);

-- Allow viewing any candidate's data. The results page needs this to map votes to names.
CREATE POLICY "Anyone can view all candidates"
  ON public.candidates FOR SELECT
  USING (true);

-- Allow viewing the public profile of any user who is a candidate.
CREATE POLICY "Anyone can view candidate profiles"
  ON public.profiles FOR SELECT
  USING (EXISTS (
    SELECT 1
    FROM public.candidates
    WHERE candidates.user_id = profiles.id
  ));


-- Step 3: Recreate the database function with the correct security model and logic.

CREATE OR REPLACE FUNCTION public.get_election_results(p_election_id UUID)
RETURNS TABLE(position_id UUID, candidate_id UUID, vote_count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER -- IMPORTANT: Runs with the permissions of the function owner (postgres)
SET search_path = public
AS $$
BEGIN
  -- SECURITY BARRIER: First, check if the results for the requested election are actually public.
  -- This prevents the function from leaking non-public results, even though it runs as an admin.
  IF NOT EXISTS (
    SELECT 1 FROM public.elections
    WHERE id = p_election_id AND results_visible = true
  ) THEN
    -- If results are not visible, return an empty set. DO NOT PROCEED.
    RETURN;
  END IF;

  -- If the security check passes, proceed to count the votes.
  RETURN QUERY
  SELECT
    v.position_id,
    v.candidate_id,
    COUNT(*) as vote_count
  FROM public.votes v
  WHERE v.election_id = p_election_id
  GROUP BY v.position_id, v.candidate_id
  ORDER BY v.position_id, vote_count DESC;
END;
$$;


-- Step 4: Grant permission for anyone to call this function.
-- The security is handled inside the function itself.
GRANT EXECUTE ON FUNCTION public.get_election_results(UUID) TO public;
