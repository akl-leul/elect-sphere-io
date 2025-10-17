-- Create storage buckets for file uploads
INSERT INTO storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
VALUES 
  ('candidate-files', 'candidate-files', true, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document']),
  ('voter-documents', 'voter-documents', false, 5242880, ARRAY['image/jpeg', 'image/png', 'image/webp', 'application/pdf']),
  ('avatars', 'avatars', true, 2097152, ARRAY['image/jpeg', 'image/png', 'image/webp'])
ON CONFLICT (id) DO NOTHING;

-- RLS policies for candidate-files bucket (public read, authenticated write)
CREATE POLICY "Anyone can view approved candidate files"
ON storage.objects FOR SELECT
USING (bucket_id = 'candidate-files');

CREATE POLICY "Users can upload their own candidate files"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'candidate-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own candidate files"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'candidate-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own candidate files"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'candidate-files' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

-- RLS policies for voter-documents bucket (private, admin only)
CREATE POLICY "Admins can view voter documents"
ON storage.objects FOR SELECT
USING (
  bucket_id = 'voter-documents' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

CREATE POLICY "Users can upload their own voter documents"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'voter-documents' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Admins can delete voter documents"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'voter-documents' 
  AND has_role(auth.uid(), 'admin'::app_role)
);

-- RLS policies for avatars bucket (public read, authenticated write)
CREATE POLICY "Anyone can view avatars"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (
  bucket_id = 'avatars' 
  AND auth.uid()::text = (storage.foldername(name))[1]
);