-- Remove document_url column from election_requirements as we no longer upload files
ALTER TABLE public.election_requirements DROP COLUMN IF EXISTS document_url;