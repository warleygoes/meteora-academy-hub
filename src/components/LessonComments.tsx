import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Heart, HelpCircle, Reply, Clock, ChevronDown, ChevronRight, Send } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { useToast } from '@/hooks/use-toast';

interface Comment {
  id: string;
  content: string;
  comment_type: string;
  video_timestamp_seconds: number | null;
  created_at: string;
  user_id: string;
  course_id: string;
  parent_id: string | null;
  user_name?: string;
  user_avatar?: string;
  replies?: Comment[];
}

interface LessonCommentsProps {
  lessonId: string;
  courseId: string;
  currentVideoTime?: number; // seconds
}

const COMMENT_TYPES = [
  { value: 'comment', label: 'Comentário', icon: <MessageSquare className="w-3.5 h-3.5" />, color: 'text-muted-foreground' },
  { value: 'praise', label: 'Elogio', icon: <Heart className="w-3.5 h-3.5" />, color: 'text-pink-500' },
  { value: 'doubt', label: 'Dúvida', icon: <HelpCircle className="w-3.5 h-3.5" />, color: 'text-yellow-500' },
];

const formatTimestamp = (seconds: number | null) => {
  if (seconds === null || seconds === undefined) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const LessonComments: React.FC<LessonCommentsProps> = ({ lessonId, courseId, currentVideoTime }) => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [comments, setComments] = useState<Comment[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState('');
  const [commentType, setCommentType] = useState('comment');
  const [includeTimestamp, setIncludeTimestamp] = useState(false);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [expandedReplies, setExpandedReplies] = useState<Set<string>>(new Set());
  const [submitting, setSubmitting] = useState(false);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    // Fetch top-level comments
    const { data: topLevel } = await supabase
      .from('lesson_comments')
      .select('*')
      .eq('lesson_id', lessonId)
      .is('parent_id', null)
      .order('created_at', { ascending: false });

    if (!topLevel || topLevel.length === 0) {
      setComments([]);
      setLoading(false);
      return;
    }

    const commentIds = topLevel.map(c => c.id);
    const { data: replies } = await supabase
      .from('lesson_comments')
      .select('*')
      .in('parent_id', commentIds)
      .order('created_at', { ascending: true });

    // Get user profiles
    const allUserIds = [...new Set([...topLevel, ...(replies || [])].map(c => c.user_id))];
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, display_name, avatar_url')
      .in('user_id', allUserIds);
    const profileMap: Record<string, { name: string; avatar: string }> = {};
    profiles?.forEach(p => { profileMap[p.user_id] = { name: p.display_name || '', avatar: p.avatar_url || '' }; });

    const enriched: Comment[] = topLevel.map(c => ({
      ...c,
      user_name: profileMap[c.user_id]?.name || '',
      user_avatar: profileMap[c.user_id]?.avatar || '',
      replies: (replies || []).filter(r => r.parent_id === c.id).map(r => ({
        ...r,
        user_name: profileMap[r.user_id]?.name || '',
        user_avatar: profileMap[r.user_id]?.avatar || '',
      })),
    }));

    setComments(enriched);
    setLoading(false);
  }, [lessonId]);

  useEffect(() => { fetchComments(); }, [fetchComments]);

  const submitComment = async () => {
    if (!newComment.trim() || !user) return;
    setSubmitting(true);
    await supabase.from('lesson_comments').insert({
      content: newComment,
      comment_type: commentType,
      lesson_id: lessonId,
      course_id: courseId,
      user_id: user.id,
      video_timestamp_seconds: includeTimestamp && currentVideoTime !== undefined ? Math.floor(currentVideoTime) : null,
    });
    setNewComment('');
    setIncludeTimestamp(false);
    setSubmitting(false);
    fetchComments();
    toast({ title: 'Comentário enviado!' });
  };

  const submitReply = async (parentId: string) => {
    if (!replyText.trim() || !user) return;
    setSubmitting(true);
    const parent = comments.find(c => c.id === parentId);
    await supabase.from('lesson_comments').insert({
      content: replyText,
      comment_type: 'comment',
      lesson_id: lessonId,
      course_id: parent?.course_id || courseId,
      user_id: user.id,
      parent_id: parentId,
    });
    setReplyText('');
    setReplyingTo(null);
    setSubmitting(false);
    fetchComments();
    toast({ title: 'Resposta enviada!' });
  };

  const typeConfig = COMMENT_TYPES.find(t => t.value === commentType) || COMMENT_TYPES[0];

  return (
    <div className="space-y-4">
      <h3 className="text-lg font-display font-bold text-foreground flex items-center gap-2">
        <MessageSquare className="w-5 h-5" /> Comentários ({comments.length})
      </h3>

      {/* New comment form */}
      {user && (
        <div className="space-y-3 p-4 rounded-xl border border-border bg-card">
          <div className="flex items-center gap-3">
            <Select value={commentType} onValueChange={setCommentType}>
              <SelectTrigger className="w-[140px] bg-secondary border-border h-8 text-sm">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {COMMENT_TYPES.map(ct => (
                  <SelectItem key={ct.value} value={ct.value}>
                    <span className="flex items-center gap-2">{ct.icon} {ct.label}</span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            {currentVideoTime !== undefined && currentVideoTime > 0 && (
              <label className="flex items-center gap-2 text-xs text-muted-foreground cursor-pointer">
                <input type="checkbox" checked={includeTimestamp} onChange={e => setIncludeTimestamp(e.target.checked)} className="rounded" />
                <Clock className="w-3.5 h-3.5" /> {formatTimestamp(Math.floor(currentVideoTime))}
              </label>
            )}
          </div>

          <Textarea
            value={newComment}
            onChange={e => setNewComment(e.target.value)}
            placeholder={commentType === 'doubt' ? 'Descreva sua dúvida...' : commentType === 'praise' ? 'Deixe seu elogio...' : 'Escreva um comentário...'}
            className="bg-secondary border-border min-h-[60px] text-sm"
          />

          <Button size="sm" onClick={submitComment} disabled={!newComment.trim() || submitting} className="gap-1">
            <Send className="w-3.5 h-3.5" /> Enviar
          </Button>
        </div>
      )}

      {/* Comments list */}
      {loading ? (
        <p className="text-sm text-muted-foreground text-center py-4">Carregando...</p>
      ) : comments.length === 0 ? (
        <p className="text-sm text-muted-foreground text-center py-6">Nenhum comentário ainda. Seja o primeiro!</p>
      ) : (
        <div className="space-y-3">
          {comments.map(comment => {
            const ct = COMMENT_TYPES.find(t => t.value === comment.comment_type) || COMMENT_TYPES[0];
            const isExpanded = expandedReplies.has(comment.id);
            return (
              <div key={comment.id} className={`rounded-xl border overflow-hidden ${
                comment.comment_type === 'doubt' ? 'border-yellow-500/30 bg-yellow-500/5' :
                comment.comment_type === 'praise' ? 'border-pink-500/30 bg-pink-500/5' :
                'border-border bg-card'
              }`}>
                <div className="p-4">
                  {/* Header */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-7 h-7 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                      {(comment.user_name || '?')[0].toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-foreground">{comment.user_name || 'Anônimo'}</span>
                    <Badge variant="outline" className={`gap-1 text-xs ${ct.color}`}>
                      {ct.icon} {ct.label}
                    </Badge>
                    {comment.video_timestamp_seconds !== null && (
                      <span className="text-xs text-primary flex items-center gap-1">
                        <Clock className="w-3 h-3" /> {formatTimestamp(comment.video_timestamp_seconds)}
                      </span>
                    )}
                    <span className="text-xs text-muted-foreground ml-auto">
                      {new Date(comment.created_at).toLocaleDateString()}
                    </span>
                  </div>

                  {/* Content */}
                  <p className="text-sm text-foreground whitespace-pre-wrap ml-9">{comment.content}</p>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-2 ml-9">
                    <Button variant="ghost" size="sm" className="gap-1 text-xs h-7" onClick={() => {
                      setReplyingTo(replyingTo === comment.id ? null : comment.id);
                      setReplyText('');
                    }}>
                      <Reply className="w-3.5 h-3.5" /> Responder
                    </Button>
                    {comment.replies && comment.replies.length > 0 && (
                      <Button variant="ghost" size="sm" className="gap-1 text-xs h-7" onClick={() => {
                        setExpandedReplies(prev => {
                          const next = new Set(prev);
                          next.has(comment.id) ? next.delete(comment.id) : next.add(comment.id);
                          return next;
                        });
                      }}>
                        {isExpanded ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                        {comment.replies.length} resposta{comment.replies.length > 1 ? 's' : ''}
                      </Button>
                    )}
                  </div>

                  {/* Reply form */}
                  {replyingTo === comment.id && (
                    <div className="mt-3 ml-9 space-y-2">
                      <Textarea value={replyText} onChange={e => setReplyText(e.target.value)}
                        placeholder="Sua resposta..." className="bg-secondary border-border min-h-[50px] text-sm" />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => submitReply(comment.id)} disabled={!replyText.trim() || submitting}>Enviar</Button>
                        <Button size="sm" variant="ghost" onClick={() => setReplyingTo(null)}>Cancelar</Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Replies */}
                {isExpanded && comment.replies && comment.replies.length > 0 && (
                  <div className="border-t border-border/50 bg-secondary/20 p-4 space-y-3">
                    {comment.replies.map(reply => (
                      <div key={reply.id} className="flex gap-3 ml-4">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0">
                          {(reply.user_name || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-foreground">{reply.user_name || 'Anônimo'}</span>
                            <span className="text-xs text-muted-foreground">{new Date(reply.created_at).toLocaleDateString()}</span>
                          </div>
                          <p className="text-sm text-foreground whitespace-pre-wrap">{reply.content}</p>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default LessonComments;
