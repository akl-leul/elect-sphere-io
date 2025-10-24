-- Change the data type of the social_links column from JSONB to JSON
ALTER TABLE public.candidates
ALTER COLUMN social_links TYPE JSON USING social_links::json;
