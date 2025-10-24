-- Drop the existing policy on the elections table that is too restrictive
DROP POLICY IF EXISTS "Anyone can view active elections" ON public.elections;

-- Create a new, more permissive policy that allows viewing active elections OR elections with visible results
CREATE POLICY "Anyone can view public elections"
  ON public.elections FOR SELECT
  USING (is_active = true OR results_visible = true);

-- Drop the existing function to change its security model from INVOKER back to DEFINER
DROP FUNCTION IF EXISTS public.get_election_results(uuid);

-- Recreate the function with SECURITY DEFINER to allow it to securely access the votes table
CREATE OR REPLACE FUNCTION public.get_election_results(p_election_id UUID)
RETURNS TABLE(position_id UUID, candidate_id UUID, vote_count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER -- This is crucial for allowing the function to read vote counts securely
SET search_path = public
AS $$
BEGIN
  -- This function now runs as the database admin, so it can access the votes table.
  -- We must add a security check inside the function to ensure we only return results for public elections.
  IF NOT EXISTS (
    SELECT 1 FROM public.elections
    WHERE id = p_election_id AND results_visible = true
  ) THEN
    RETURN; -- If the election's results are not public, return no rows.
  END IF;

  -- If the results are public, proceed with counting the votes.
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

-- Grant execute permission to all public roles, so anyone can call this function
GRANT EXECUTE ON FUNCTION public.get_election_results(UUID) TO public;
