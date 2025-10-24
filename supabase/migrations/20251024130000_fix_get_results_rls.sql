-- Drop the existing function to recreate it with the SECURITY INVOKER option
DROP FUNCTION IF EXISTS public.get_election_results(uuid);

-- Recreate the function with SECURITY INVOKER to run it with the permissions of the user who calls it
CREATE OR REPLACE FUNCTION public.get_election_results(p_election_id UUID)
RETURNS TABLE(position_id UUID, candidate_id UUID, vote_count BIGINT)
LANGUAGE plpgsql
SECURITY INVOKER -- Changed from SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  -- This function now runs with the caller's permissions, which for anon users, is public access
  -- RLS on the elections table will handle whether the results are visible or not
  RETURN QUERY
  SELECT
    v.position_id,
    v.candidate_id,
    COUNT(*) as vote_count
  FROM public.votes v
  JOIN public.elections e ON v.election_id = e.id
  WHERE v.election_id = p_election_id AND e.results_visible = true
  GROUP BY v.position_id, v.candidate_id
  ORDER BY v.position_id, vote_count DESC;
END;
$$;

-- Ensure execute permission is granted to public roles
GRANT EXECUTE ON FUNCTION public.get_election_results(UUID) TO public;
