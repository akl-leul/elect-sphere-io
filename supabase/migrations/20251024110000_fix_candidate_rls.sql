-- Drop the existing policy that only allows viewing approved candidates
DROP POLICY IF EXISTS "Anyone can view approved candidates" ON public.candidates;

-- Create a new policy to allow anyone to view ALL candidates, regardless of approval status
CREATE POLICY "Anyone can view all candidates"
  ON public.candidates FOR SELECT
  USING (true);

-- Create a new policy to allow anyone to view the profiles of users who are candidates
CREATE POLICY "Anyone can view candidate profiles"
  ON public.profiles FOR SELECT
  USING (EXISTS (
    SELECT 1
    FROM public.candidates
    WHERE candidates.user_id = profiles.id
  ));
