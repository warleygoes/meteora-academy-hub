import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Reply, CheckCircle2, HelpCircle, Heart, Clock, BookOpen, Video, ChevronDown, ChevronRight } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';

interface CommentWithContext {
  id: string;
  content: string;
  comment_type: string;
  video_timestamp_seconds: number | null;
  created_at: string;
  lesson_id: string;
  course_id: string;
  user_id: string;
  parent_id: string | null;
  lesson_title?: string;
  course_title?: string;
  user_name?: string;
  user_email?: string;
  replies?: CommentWithContext[];
}

const COMMENT_TYPE_CONFIG: Record<string, { icon: React.ReactNode; label: string; color: string }> = {
  comment: { icon: <MessageSquare className="w-3.5 h-3.5" />, label: 'Comentário', color: 'text-muted-foreground' },
  praise: { icon: <Heart className="w-3.5 h-3.5" />, label: 'Elogio', color: 'text-pink-500' },
  doubt: { icon: <HelpCircle className="w-3.5 h-3.5" />, label: 'Dúvida', color: 'text-yellow-500' },
};

const formatTimestamp = (seconds: number | null) => {
  if (seconds === null || seconds === undefined) return null;
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${s.toString().padStart(2, '0')}`;
};

const AdminComments: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const { user } = useAuth();
  const [comments, setComments] = useState<CommentWithContext[]>([]);
  const [loading, setLoading] = useState(true);
  const [filterType, setFilterType] = useState<string>('all');
  const [filterCourse, setFilterCourse] = useState<string>('all');
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());

  const fetchComments = useCallback(async () => {
    setLoading(true);
    
    // Fetch all top-level comments
    let query = supabase.from('lesson_comments').select('*').is('parent_id', null).order('created_at', { ascending: false });
    const { data: commentsData } = await query;
    
    if (!commentsData || commentsData.length === 0) {
      setComments([]);
      setLoading(false);
      return;
    }

    // Fetch replies
    const commentIds = commentsData.map(c => c.id);
    const { data: repliesData } = await supabase.from('lesson_comments').select('*').in('parent_id', commentIds).order('created_at', { ascending: true });

    // Fetch lesson titles
    const lessonIds = [...new Set(commentsData.map(c => c.lesson_id))];
    const { data: lessons } = await supabase.from('course_lessons').select('id, title').in('id', lessonIds);
    const lessonMap: Record<string, string> = {};
    lessons?.forEach(l => { lessonMap[l.id] = l.title; });

    // Fetch course titles
    const courseIds = [...new Set(commentsData.map(c => c.course_id))];
    const { data: coursesData } = await supabase.from('courses').select('id, title').in('id', courseIds);
    const courseMap: Record<string, string> = {};
    coursesData?.forEach(c => { courseMap[c.id] = c.title; });

    // Fetch user profiles
    const userIds = [...new Set([...commentsData, ...(repliesData || [])].map(c => c.user_id))];
    const { data: profiles } = await supabase.from('profiles').select('user_id, display_name, email').in('user_id', userIds);
    const profileMap: Record<string, { name: string; email: string }> = {};
    profiles?.forEach(p => { profileMap[p.user_id] = { name: p.display_name || '', email: p.email || '' }; });

    const enriched: CommentWithContext[] = commentsData.map(c => ({
      ...c,
      lesson_title: lessonMap[c.lesson_id] || '',
      course_title: courseMap[c.course_id] || '',
      user_name: profileMap[c.user_id]?.name || '',
      user_email: profileMap[c.user_id]?.email || '',
      replies: (repliesData || []).filter(r => r.parent_id === c.id).map(r => ({
        ...r,
        user_name: profileMap[r.user_id]?.name || '',
        user_email: profileMap[r.user_id]?.email || '',
      })),
    }));

    setComments(enriched);
    setLoading(false);
  }, []);

  const fetchCourses = useCallback(async () => {
    const { data } = await supabase.from('courses').select('id, title').order('title');
    if (data) setCourses(data);
  }, []);

  useEffect(() => { fetchComments(); fetchCourses(); }, [fetchComments, fetchCourses]);

  const sendReply = async (parentComment: CommentWithContext) => {
    if (!replyText.trim() || !user) return;
    await supabase.from('lesson_comments').insert({
      content: replyText,
      comment_type: 'comment',
      lesson_id: parentComment.lesson_id,
      course_id: parentComment.course_id,
      user_id: user.id,
      parent_id: parentComment.id,
    });
    setReplyText('');
    setReplyingTo(null);
    fetchComments();
    toast({ title: 'Resposta enviada' });
  };

  const filtered = comments.filter(c => {
    if (filterType !== 'all' && c.comment_type !== filterType) return false;
    if (filterCourse !== 'all' && c.course_id !== filterCourse) return false;
    return true;
  });

  const doubtsCount = comments.filter(c => c.comment_type === 'doubt').length;
  const unrepliedDoubts = comments.filter(c => c.comment_type === 'doubt' && (!c.replies || c.replies.length === 0)).length;

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-display font-bold text-foreground">Comentários</h2>
          <p className="text-sm text-muted-foreground">Todos os comentários das aulas</p>
        </div>
        <div className="flex gap-2">
          {unrepliedDoubts > 0 && (
            <Badge variant="destructive" className="gap-1">
              <HelpCircle className="w-3.5 h-3.5" /> {unrepliedDoubts} dúvida{unrepliedDoubts > 1 ? 's' : ''} sem resposta
            </Badge>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-3 gap-3 mb-6">
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{comments.length}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-yellow-500">{doubtsCount}</p>
          <p className="text-xs text-muted-foreground">Dúvidas</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-pink-500">{comments.filter(c => c.comment_type === 'praise').length}</p>
          <p className="text-xs text-muted-foreground">Elogios</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[160px] bg-secondary border-border"><SelectValue placeholder="Tipo" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os tipos</SelectItem>
            <SelectItem value="comment">Comentários</SelectItem>
            <SelectItem value="praise">Elogios</SelectItem>
            <SelectItem value="doubt">Dúvidas</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCourse} onValueChange={setFilterCourse}>
          <SelectTrigger className="w-[200px] bg-secondary border-border"><SelectValue placeholder="Curso" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">Todos os cursos</SelectItem>
            {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Comments list */}
      {loading ? (
        <p className="text-center py-12 text-muted-foreground">{t('loading')}...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center py-12 text-muted-foreground">Nenhum comentário encontrado</p>
      ) : (
        <div className="space-y-3">
          {filtered.map(comment => {
            const typeConfig = COMMENT_TYPE_CONFIG[comment.comment_type] || COMMENT_TYPE_CONFIG.comment;
            const isExpanded = expandedComments.has(comment.id);
            return (
              <div key={comment.id} className={`bg-card border rounded-xl overflow-hidden ${comment.comment_type === 'doubt' && (!comment.replies || comment.replies.length === 0) ? 'border-yellow-500/40' : 'border-border'}`}>
                <div className="p-4">
                  {/* Header with context */}
                  <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground flex-wrap">
                    <Badge variant="outline" className={`gap-1 ${typeConfig.color}`}>
                      {typeConfig.icon} {typeConfig.label}
                    </Badge>
                    <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {comment.course_title}</span>
                    <span>›</span>
                    <span className="flex items-center gap-1"><Video className="w-3 h-3" /> {comment.lesson_title}</span>
                    {comment.video_timestamp_seconds !== null && (
                      <span className="flex items-center gap-1 text-primary">
                        <Clock className="w-3 h-3" /> {formatTimestamp(comment.video_timestamp_seconds)}
                      </span>
                    )}
                  </div>

                  {/* Author & date */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                      {(comment.user_name || comment.user_email || '?')[0].toUpperCase()}
                    </div>
                    <span className="text-sm font-medium text-foreground">{comment.user_name || comment.user_email}</span>
                    <span className="text-xs text-muted-foreground">{new Date(comment.created_at).toLocaleString()}</span>
                  </div>

                  {/* Content */}
                  <p className="text-sm text-foreground whitespace-pre-wrap">{comment.content}</p>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-3">
                    <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => {
                      setReplyingTo(replyingTo === comment.id ? null : comment.id);
                      setReplyText('');
                    }}>
                      <Reply className="w-3.5 h-3.5" /> Responder
                    </Button>
                    {comment.replies && comment.replies.length > 0 && (
                      <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => {
                        setExpandedComments(prev => {
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
                    <div className="mt-3 space-y-2">
                      <Textarea value={replyText} onChange={e => setReplyText(e.target.value)} placeholder="Escreva sua resposta..."
                        className="bg-secondary border-border min-h-[60px] text-sm" />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => sendReply(comment)} disabled={!replyText.trim()}>Enviar</Button>
                        <Button size="sm" variant="ghost" onClick={() => setReplyingTo(null)}>{t('cancel')}</Button>
                      </div>
                    </div>
                  )}
                </div>

                {/* Replies */}
                {isExpanded && comment.replies && comment.replies.length > 0 && (
                  <div className="border-t border-border bg-secondary/30 p-4 space-y-3">
                    {comment.replies.map(reply => (
                      <div key={reply.id} className="flex gap-3">
                        <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold shrink-0 mt-0.5">
                          {(reply.user_name || reply.user_email || '?')[0].toUpperCase()}
                        </div>
                        <div>
                          <div className="flex items-center gap-2 mb-1">
                            <span className="text-sm font-medium text-foreground">{reply.user_name || reply.user_email}</span>
                            <span className="text-xs text-muted-foreground">{new Date(reply.created_at).toLocaleString()}</span>
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

export default AdminComments;
