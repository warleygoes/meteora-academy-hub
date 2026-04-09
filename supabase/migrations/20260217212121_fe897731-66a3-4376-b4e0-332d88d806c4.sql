
-- Create community-images bucket for user-generated content
INSERT INTO storage.buckets (id, name, public) VALUES ('community-images', 'community-images', true)
ON CONFLICT (id) DO NOTHING;

-- Allow authenticated users to upload to community-images
CREATE POLICY "Authenticated users can upload community images"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'community-images' AND auth.uid() IS NOT NULL);

-- Allow public read access to community images
CREATE POLICY "Community images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'community-images');

-- Allow users to delete their own community images
CREATE POLICY "Users can delete own community images"
ON storage.objects FOR DELETE
USING (bucket_id = 'community-images' AND auth.uid() IS NOT NULL);
