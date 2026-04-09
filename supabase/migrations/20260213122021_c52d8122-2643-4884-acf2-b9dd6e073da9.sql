
-- Community Posts
CREATE TABLE public.community_posts (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  course_id UUID NOT NULL REFERENCES public.courses(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  title TEXT NOT NULL,
  content TEXT NOT NULL,
  image_url TEXT,
  link_url TEXT,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Community Comments (supports replies via parent_id)
CREATE TABLE public.community_comments (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  parent_id UUID REFERENCES public.community_comments(id) ON DELETE CASCADE,
  content TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now()
);

-- Community Likes (on posts)
CREATE TABLE public.community_likes (
  id UUID NOT NULL DEFAULT gen_random_uuid() PRIMARY KEY,
  post_id UUID NOT NULL REFERENCES public.community_posts(id) ON DELETE CASCADE,
  user_id UUID NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT now(),
  UNIQUE(post_id, user_id)
);

-- Indexes
CREATE INDEX idx_community_posts_course ON public.community_posts(course_id, created_at DESC);
CREATE INDEX idx_community_comments_post ON public.community_comments(post_id, created_at);
CREATE INDEX idx_community_likes_post ON public.community_likes(post_id);

-- RLS for community_posts
ALTER TABLE public.community_posts ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view posts"
  ON public.community_posts FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create posts"
  ON public.community_posts FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own posts"
  ON public.community_posts FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own posts"
  ON public.community_posts FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage posts"
  ON public.community_posts FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- RLS for community_comments
ALTER TABLE public.community_comments ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view comments"
  ON public.community_comments FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create comments"
  ON public.community_comments FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can update own comments"
  ON public.community_comments FOR UPDATE
  USING (auth.uid() = user_id);

CREATE POLICY "Users can delete own comments"
  ON public.community_comments FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage comments"
  ON public.community_comments FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- RLS for community_likes
ALTER TABLE public.community_likes ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Authenticated users can view likes"
  ON public.community_likes FOR SELECT
  USING (auth.uid() IS NOT NULL);

CREATE POLICY "Users can create likes"
  ON public.community_likes FOR INSERT
  WITH CHECK (auth.uid() = user_id);

CREATE POLICY "Users can delete own likes"
  ON public.community_likes FOR DELETE
  USING (auth.uid() = user_id);

CREATE POLICY "Admins can manage likes"
  ON public.community_likes FOR ALL
  USING (has_role(auth.uid(), 'admin'));

-- Trigger for updated_at on posts
CREATE TRIGGER update_community_posts_updated_at
  BEFORE UPDATE ON public.community_posts
  FOR EACH ROW
  EXECUTE FUNCTION public.update_updated_at_column();
