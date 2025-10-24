-- Alter votes table to make voter_id optional
ALTER TABLE public.votes
ALTER COLUMN voter_id DROP NOT NULL;

-- Drop existing unique constraint
ALTER TABLE public.votes
DROP CONSTRAINT votes_voter_id_election_id_position_id_key;

-- Add partial unique indexes
CREATE UNIQUE INDEX authenticated_votes_idx
ON public.votes (voter_id, election_id, position_id)
WHERE voter_id IS NOT NULL;

CREATE UNIQUE INDEX anonymous_votes_idx
ON public.votes (device_fingerprint, election_id, position_id)
WHERE voter_id IS NULL;

-- Drop existing insert policy
DROP POLICY "Users can create their own vote" ON public.votes;

-- Create new insert policies for authenticated and anonymous votes
CREATE POLICY "Authenticated users can vote"
ON public.votes FOR INSERT
TO authenticated
WITH CHECK (auth.uid() = voter_id AND voter_id IS NOT NULL);

CREATE POLICY "Anonymous users can vote"
ON public.votes FOR INSERT
TO anon
WITH CHECK (voter_id IS NULL);

-- Create public function to get election results
CREATE OR REPLACE FUNCTION public.get_election_results(p_election_id UUID)
RETURNS TABLE(position_id UUID, candidate_id UUID, vote_count BIGINT)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM public.elections
    WHERE id = p_election_id AND results_visible = true
  ) THEN
    RETURN;
  END IF;

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

-- Grant execute permission to anon and authenticated
GRANT EXECUTE ON FUNCTION public.get_election_results(UUID) TO anon, authenticated;
