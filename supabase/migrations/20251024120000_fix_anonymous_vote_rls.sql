-- Drop the existing policy that only allows anonymous users to vote
DROP POLICY IF EXISTS "Anonymous users can vote" ON public.votes;

-- Create a new policy to allow any user (logged in or not) to vote anonymously
CREATE POLICY "Allow anonymous votes from any user"
  ON public.votes FOR INSERT
  TO public
  WITH CHECK (voter_id IS NULL);
