import React from 'react';
import { useCommunityFeed } from '@/hooks/useCommunity';
import CreatePostForm from './CreatePostForm';
import PostCard from './PostCard';
import { motion } from 'framer-motion';

interface Props {
  courseId: string;
  courseTitle: string;
}

const CourseCommunityFeed: React.FC<Props> = ({ courseId, courseTitle }) => {
  const { posts, loading, createPost, toggleLike, deletePost } = useCommunityFeed(courseId);

  return (
    <div className="max-w-2xl mx-auto space-y-5">
      <CreatePostForm onSubmit={createPost} />

      {loading ? (
        <p className="text-center py-8 text-muted-foreground">Cargando publicaciones...</p>
      ) : posts.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Aún no hay publicaciones en esta comunidad.</p>
          <p className="text-sm text-muted-foreground mt-1">¡Sé el primero en compartir algo!</p>
        </div>
      ) : (
        posts.map((post, i) => (
          <motion.div key={post.id} initial={{ opacity: 0, y: 15 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.03 }}>
            <PostCard post={post} onLike={toggleLike} onDelete={deletePost} />
          </motion.div>
        ))
      )}
    </div>
  );
};

export default CourseCommunityFeed;
