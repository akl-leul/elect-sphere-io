-- Add gender to profiles table
ALTER TABLE public.profiles 
ADD COLUMN gender text CHECK (gender IN ('male', 'female'));

-- Update profileSchema validation will be done in code
COMMENT ON COLUMN public.profiles.gender IS 'User gender: male or female';