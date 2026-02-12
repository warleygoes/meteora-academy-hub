
-- Storage bucket for avatars
INSERT INTO storage.buckets (id, name, public) VALUES ('avatars', 'avatars', true);

-- Avatar storage policies
CREATE POLICY "Avatar images are publicly accessible"
ON storage.objects FOR SELECT
USING (bucket_id = 'avatars');

CREATE POLICY "Users can upload their own avatar"
ON storage.objects FOR INSERT
WITH CHECK (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can update their own avatar"
ON storage.objects FOR UPDATE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

CREATE POLICY "Users can delete their own avatar"
ON storage.objects FOR DELETE
USING (bucket_id = 'avatars' AND auth.uid()::text = (storage.foldername(name))[1]);

-- Network topologies table
CREATE TABLE public.network_topologies (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID NOT NULL,
  name TEXT NOT NULL DEFAULT 'Minha Topologia',
  data JSONB NOT NULL DEFAULT '{"nodes":[],"edges":[]}',
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.network_topologies ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can view own topologies"
ON public.network_topologies FOR SELECT
USING (auth.uid() = user_id);

CREATE POLICY "Users can create own topologies"
ON public.network_topologies FOR INSERT
WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own topologies"
ON public.network_topologies FOR UPDATE
USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own topologies"
ON public.network_topologies FOR DELETE
USING (auth.uid() = user_id);

CREATE TRIGGER update_network_topologies_updated_at
BEFORE UPDATE ON public.network_topologies
FOR EACH ROW
EXECUTE FUNCTION public.update_updated_at_column();

-- Plan meetings table (Encontro de Dúvidas)
CREATE TABLE public.plan_meetings (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  plan_id UUID NOT NULL REFERENCES public.plans(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT,
  meeting_link TEXT NOT NULL,
  meeting_date TIMESTAMP WITH TIME ZONE NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

ALTER TABLE public.plan_meetings ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Admins can manage plan_meetings"
ON public.plan_meetings FOR ALL
USING (has_role(auth.uid(), 'admin'::app_role));

CREATE POLICY "Users can view meetings for their plans"
ON public.plan_meetings FOR SELECT
USING (
  EXISTS (
    SELECT 1 FROM public.user_plans up
    WHERE up.user_id = auth.uid()
      AND up.plan_id = plan_meetings.plan_id
      AND up.status = 'active'
  )
);
