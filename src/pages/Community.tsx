import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Heart, MessageCircle, Share2, Send, Image } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { communityPosts, CommunityPost } from '@/lib/mockData';
import { Button } from '@/components/ui/button';

const CommunityPage: React.FC = () => {
  const { t } = useLanguage();
  const [posts, setPosts] = useState<CommunityPost[]>(communityPosts);
  const [newPost, setNewPost] = useState('');

  const handlePost = () => {
    if (!newPost.trim()) return;
    const post: CommunityPost = {
      id: String(Date.now()),
      author: 'Você',
      avatar: 'VC',
      content: newPost,
      timestamp: 'Agora',
      likes: 0,
      comments: 0,
    };
    setPosts([post, ...posts]);
    setNewPost('');
  };

  const toggleLike = (id: string) => {
    setPosts(posts.map(p =>
      p.id === id ? { ...p, liked: !p.liked, likes: p.liked ? p.likes - 1 : p.likes + 1 } : p
    ));
  };

  return (
    <div className="px-6 md:px-12 py-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-display font-bold mb-2">{t('communityTitle')}</h1>
      <p className="text-muted-foreground mb-8">{t('communitySubtitle')}</p>

      {/* Create post */}
      <div className="bg-card rounded-xl p-5 mb-8 card-shadow border border-border">
        <div className="flex gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0">
            VC
          </div>
          <div className="flex-1">
            <textarea
              value={newPost}
              onChange={(e) => setNewPost(e.target.value)}
              placeholder={t('writePost')}
              className="w-full bg-transparent text-foreground placeholder:text-muted-foreground outline-none resize-none text-sm min-h-[80px]"
            />
            <div className="flex items-center justify-between mt-3 pt-3 border-t border-border">
              <button className="text-muted-foreground hover:text-foreground transition-colors">
                <Image className="w-5 h-5" />
              </button>
              <Button size="sm" onClick={handlePost} className="gap-2">
                <Send className="w-4 h-4" />
                {t('publish')}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Posts */}
      <div className="space-y-4">
        {posts.map((post, i) => (
          <motion.div
            key={post.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
            className="bg-card rounded-xl p-5 card-shadow border border-border"
          >
            <div className="flex gap-3 mb-3">
              <div className="w-10 h-10 rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm flex-shrink-0">
                {post.avatar}
              </div>
              <div>
                <p className="font-semibold text-sm text-foreground">{post.author}</p>
                <p className="text-xs text-muted-foreground">{post.timestamp}</p>
              </div>
            </div>

            <p className="text-sm text-foreground/90 mb-4 leading-relaxed">{post.content}</p>

            <div className="flex items-center gap-6 text-muted-foreground">
              <button
                onClick={() => toggleLike(post.id)}
                className={`flex items-center gap-1.5 text-sm transition-colors hover:text-primary ${post.liked ? 'text-primary' : ''}`}
              >
                <Heart className={`w-4 h-4 ${post.liked ? 'fill-primary' : ''}`} />
                {post.likes}
              </button>
              <button className="flex items-center gap-1.5 text-sm hover:text-foreground transition-colors">
                <MessageCircle className="w-4 h-4" />
                {post.comments}
              </button>
              <button className="flex items-center gap-1.5 text-sm hover:text-foreground transition-colors">
                <Share2 className="w-4 h-4" />
                {t('share')}
              </button>
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default CommunityPage;
