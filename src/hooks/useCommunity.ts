import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

export interface CommunityPost {
  id: string;
  course_id: string;
  user_id: string;
  title: string;
  content: string;
  image_url: string | null;
  link_url: string | null;
  created_at: string;
  updated_at: string;
  author_name: string;
  author_avatar: string | null;
  like_count: number;
  comment_count: number;
  liked_by_me: boolean;
}

export interface CommunityComment {
  id: string;
  post_id: string;
  user_id: string;
  parent_id: string | null;
  content: string;
  created_at: string;
  author_name: string;
  author_avatar: string | null;
  replies?: CommunityComment[];
}

export function useCommunityFeed(courseId: string | undefined) {
  const { user } = useAuth();
  const [posts, setPosts] = useState<CommunityPost[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchPosts = useCallback(async () => {
    if (!courseId || !user) return;
    setLoading(true);

    const { data: postsData } = await supabase
      .from('community_posts')
      .select('*')
      .eq('course_id', courseId)
      .order('created_at', { ascending: false });

    if (!postsData || postsData.length === 0) {
      setPosts([]);
      setLoading(false);
      return;
    }

    const userIds = [...new Set(postsData.map(p => p.user_id))];
    const postIds = postsData.map(p => p.id);

    const [profilesRes, likesRes, myLikesRes, commentsRes] = await Promise.all([
      supabase.from('profiles').select('user_id, display_name, avatar_url').in('user_id', userIds),
      supabase.from('community_likes').select('post_id').in('post_id', postIds),
      supabase.from('community_likes').select('post_id').in('post_id', postIds).eq('user_id', user.id),
      supabase.from('community_comments').select('post_id').in('post_id', postIds),
    ]);

    const profileMap: Record<string, { name: string; avatar: string | null }> = {};
    (profilesRes.data || []).forEach((p: any) => {
      profileMap[p.user_id] = { name: p.display_name || 'Anónimo', avatar: p.avatar_url };
    });

    const likeCountMap: Record<string, number> = {};
    (likesRes.data || []).forEach((l: any) => {
      likeCountMap[l.post_id] = (likeCountMap[l.post_id] || 0) + 1;
    });

    const myLikeSet = new Set((myLikesRes.data || []).map((l: any) => l.post_id));

    const commentCountMap: Record<string, number> = {};
    (commentsRes.data || []).forEach((c: any) => {
      commentCountMap[c.post_id] = (commentCountMap[c.post_id] || 0) + 1;
    });

    setPosts(postsData.map(p => ({
      ...p,
      author_name: profileMap[p.user_id]?.name || 'Anónimo',
      author_avatar: profileMap[p.user_id]?.avatar || null,
      like_count: likeCountMap[p.id] || 0,
      comment_count: commentCountMap[p.id] || 0,
      liked_by_me: myLikeSet.has(p.id),
    })));

    setLoading(false);
  }, [courseId, user]);

  useEffect(() => { fetchPosts(); }, [fetchPosts]);

  const createPost = async (title: string, content: string, imageUrl?: string, linkUrl?: string) => {
    if (!user || !courseId) return;
    await supabase.from('community_posts').insert({
      course_id: courseId,
      user_id: user.id,
      title,
      content,
      image_url: imageUrl || null,
      link_url: linkUrl || null,
    });
    fetchPosts();
  };

  const toggleLike = async (postId: string) => {
    if (!user) return;
    const post = posts.find(p => p.id === postId);
    if (!post) return;

    if (post.liked_by_me) {
      await supabase.from('community_likes').delete().eq('post_id', postId).eq('user_id', user.id);
    } else {
      await supabase.from('community_likes').insert({ post_id: postId, user_id: user.id });
    }

    setPosts(prev => prev.map(p =>
      p.id === postId
        ? { ...p, liked_by_me: !p.liked_by_me, like_count: p.liked_by_me ? p.like_count - 1 : p.like_count + 1 }
        : p
    ));
  };

  const deletePost = async (postId: string) => {
    await supabase.from('community_posts').delete().eq('id', postId);
    setPosts(prev => prev.filter(p => p.id !== postId));
  };

  return { posts, loading, createPost, toggleLike, deletePost, refetch: fetchPosts };
}

export function usePostComments(postId: string | null) {
  const { user } = useAuth();
  const [comments, setComments] = useState<CommunityComment[]>([]);
  const [loading, setLoading] = useState(false);

  const fetchComments = useCallback(async () => {
    if (!postId) return;
    setLoading(true);

    const { data } = await supabase
      .from('community_comments')
      .select('*')
      .eq('post_id', postId)
      .order('created_at', { ascending: true });

    if (!data || data.length === 0) {
      setComments([]);
      setLoading(false);
      return;
    }

    const userIds = [...new Set(data.map(c => c.user_id))];
    const { data: profiles } = await supabase.from('profiles').select('user_id, display_name, avatar_url').in('user_id', userIds);
    const profileMap: Record<string, { name: string; avatar: string | null }> = {};
    (profiles || []).forEach((p: any) => {
      profileMap[p.user_id] = { name: p.display_name || 'Anónimo', avatar: p.avatar_url };
    });

    const enriched: CommunityComment[] = data.map(c => ({
      ...c,
      author_name: profileMap[c.user_id]?.name || 'Anónimo',
      author_avatar: profileMap[c.user_id]?.avatar || null,
    }));

    // Build tree: top-level + replies
    const topLevel = enriched.filter(c => !c.parent_id);
    const replies = enriched.filter(c => c.parent_id);
    topLevel.forEach(c => {
      c.replies = replies.filter(r => r.parent_id === c.id);
    });

    setComments(topLevel);
    setLoading(false);
  }, [postId]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const addComment = async (content: string, parentId?: string) => {
    if (!user || !postId) return;
    await supabase.from('community_comments').insert({
      post_id: postId,
      user_id: user.id,
      content,
      parent_id: parentId || null,
    });
    fetchComments();
  };

  const deleteComment = async (commentId: string) => {
    await supabase.from('community_comments').delete().eq('id', commentId);
    fetchComments();
  };

  return { comments, loading, addComment, deleteComment, refetch: fetchComments };
}
