import React, { useState } from 'react';
import { Heart, MessageCircle, Share2, Trash2, ExternalLink, ChevronDown, ChevronUp, Send, Reply } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/useAuth';
import { usePostComments, type CommunityPost, type CommunityComment } from '@/hooks/useCommunity';
import { formatDistanceToNow } from 'date-fns';
import { es } from 'date-fns/locale';
import { useToast } from '@/hooks/use-toast';

interface PostCardProps {
  post: CommunityPost;
  onLike: (postId: string) => void;
  onDelete: (postId: string) => void;
}

const Avatar: React.FC<{ name: string; url: string | null; size?: string }> = ({ name, url, size = 'w-10 h-10' }) => {
  if (url) return <img src={url} alt={name} className={`${size} rounded-full object-cover shrink-0`} />;
  const initials = name.split(' ').map(w => w[0]).join('').slice(0, 2).toUpperCase();
  return (
    <div className={`${size} rounded-full bg-primary/20 flex items-center justify-center text-primary font-semibold text-sm shrink-0`}>
      {initials}
    </div>
  );
};

const CommentItem: React.FC<{
  comment: CommunityComment;
  onReply: (parentId: string) => void;
  onDelete: (id: string) => void;
  isOwner: boolean;
  depth?: number;
}> = ({ comment, onReply, onDelete, isOwner, depth = 0 }) => (
  <div className={`${depth > 0 ? 'ml-8 border-l-2 border-border pl-4' : ''}`}>
    <div className="flex gap-2 py-2">
      <Avatar name={comment.author_name} url={comment.author_avatar} size="w-7 h-7" />
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2">
          <span className="text-sm font-medium text-foreground">{comment.author_name}</span>
          <span className="text-xs text-muted-foreground">
            {formatDistanceToNow(new Date(comment.created_at), { addSuffix: true, locale: es })}
          </span>
        </div>
        <p className="text-sm text-foreground/90 mt-0.5">{comment.content}</p>
        <div className="flex gap-3 mt-1">
          <button onClick={() => onReply(comment.id)} className="text-xs text-muted-foreground hover:text-primary flex items-center gap-1">
            <Reply className="w-3 h-3" /> Responder
          </button>
          {isOwner && (
            <button onClick={() => onDelete(comment.id)} className="text-xs text-muted-foreground hover:text-destructive flex items-center gap-1">
              <Trash2 className="w-3 h-3" /> Eliminar
            </button>
          )}
        </div>
      </div>
    </div>
    {comment.replies?.map(r => (
      <CommentItem key={r.id} comment={r} onReply={onReply} onDelete={onDelete} isOwner={r.user_id === comment.user_id} depth={depth + 1} />
    ))}
  </div>
);

const PostCard: React.FC<PostCardProps> = ({ post, onLike, onDelete }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const { comments, loading: commentsLoading, addComment, deleteComment } = usePostComments(showComments ? post.id : null);

  const timeAgo = formatDistanceToNow(new Date(post.created_at), { addSuffix: true, locale: es });

  const handleSubmitComment = async () => {
    if (!commentText.trim()) return;
    await addComment(commentText.trim(), replyTo || undefined);
    setCommentText('');
    setReplyTo(null);
  };

  const handleShare = () => {
    navigator.clipboard.writeText(window.location.href + `#post-${post.id}`);
    toast({ title: 'Link copiado' });
  };

  return (
    <div className="bg-card rounded-xl border border-border overflow-hidden" id={`post-${post.id}`}>
      <div className="p-5">
        {/* Author header */}
        <div className="flex items-start gap-3 mb-3">
          <Avatar name={post.author_name} url={post.author_avatar} />
          <div className="flex-1 min-w-0">
            <p className="font-semibold text-sm text-foreground">{post.author_name}</p>
            <p className="text-xs text-muted-foreground">{timeAgo}</p>
          </div>
          {user?.id === post.user_id && (
            <Button variant="ghost" size="sm" onClick={() => onDelete(post.id)} className="text-muted-foreground hover:text-destructive h-8 w-8 p-0">
              <Trash2 className="w-4 h-4" />
            </Button>
          )}
        </div>

        {/* Title */}
        <h3 className="text-lg font-display font-bold text-foreground mb-2">{post.title}</h3>

        {/* Content */}
        <p className="text-sm text-foreground/90 leading-relaxed whitespace-pre-wrap mb-3">{post.content}</p>

        {/* Image */}
        {post.image_url && (
          <img src={post.image_url} alt="" className="rounded-lg w-full max-h-96 object-cover mb-3" />
        )}

        {/* Link */}
        {post.link_url && (
          <a href={post.link_url} target="_blank" rel="noopener noreferrer"
            className="flex items-center gap-2 text-primary text-sm hover:underline mb-3">
            <ExternalLink className="w-4 h-4" /> {post.link_url}
          </a>
        )}

        {/* Actions */}
        <div className="flex items-center gap-5 pt-3 border-t border-border text-muted-foreground">
          <button onClick={() => onLike(post.id)}
            className={`flex items-center gap-1.5 text-sm transition-colors hover:text-primary ${post.liked_by_me ? 'text-primary' : ''}`}>
            <Heart className={`w-4 h-4 ${post.liked_by_me ? 'fill-primary' : ''}`} />
            {post.like_count}
          </button>
          <button onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 text-sm hover:text-foreground transition-colors">
            <MessageCircle className="w-4 h-4" />
            {post.comment_count}
            {showComments ? <ChevronUp className="w-3 h-3" /> : <ChevronDown className="w-3 h-3" />}
          </button>
          <button onClick={handleShare} className="flex items-center gap-1.5 text-sm hover:text-foreground transition-colors">
            <Share2 className="w-4 h-4" /> Compartir
          </button>
        </div>
      </div>

      {/* Comments section */}
      {showComments && (
        <div className="border-t border-border bg-secondary/30 px-5 py-4">
          {commentsLoading ? (
            <p className="text-sm text-muted-foreground text-center py-2">Cargando...</p>
          ) : (
            <div className="space-y-1">
              {comments.map(c => (
                <CommentItem
                  key={c.id}
                  comment={c}
                  onReply={(parentId) => { setReplyTo(parentId); }}
                  onDelete={deleteComment}
                  isOwner={c.user_id === user?.id}
                />
              ))}
              {comments.length === 0 && (
                <p className="text-sm text-muted-foreground text-center py-2">Sin comentarios aún</p>
              )}
            </div>
          )}

          {/* Comment input */}
          <div className="mt-3 flex gap-2">
            <div className="flex-1">
              {replyTo && (
                <div className="text-xs text-muted-foreground mb-1 flex items-center gap-1">
                  <Reply className="w-3 h-3" /> Respondiendo...
                  <button onClick={() => setReplyTo(null)} className="text-primary hover:underline ml-1">Cancelar</button>
                </div>
              )}
              <input
                value={commentText}
                onChange={e => setCommentText(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handleSubmitComment()}
                placeholder="Escribe un comentario..."
                className="w-full bg-card border border-border rounded-lg px-3 py-2 text-sm text-foreground placeholder:text-muted-foreground outline-none focus:border-primary/50"
              />
            </div>
            <Button size="sm" onClick={handleSubmitComment} disabled={!commentText.trim()} className="h-9 self-end">
              <Send className="w-4 h-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  );
};

export default PostCard;
