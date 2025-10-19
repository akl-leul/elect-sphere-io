-- Create table for election requirements
CREATE TABLE public.election_requirements (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  election_id UUID NOT NULL REFERENCES public.elections(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  document_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE public.election_requirements ENABLE ROW LEVEL SECURITY;

-- Admins can manage requirements
CREATE POLICY "Admins can manage requirements"
ON public.election_requirements
FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

-- Anyone can view requirements
CREATE POLICY "Anyone can view requirements"
ON public.election_requirements
FOR SELECT
USING (true);

-- Add agreed_to_requirements column to candidates table
ALTER TABLE public.candidates
ADD COLUMN agreed_to_requirements BOOLEAN DEFAULT false NOT NULL;

-- Add trigger for updated_at
CREATE TRIGGER update_election_requirements_updated_at
BEFORE UPDATE ON public.election_requirements
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();