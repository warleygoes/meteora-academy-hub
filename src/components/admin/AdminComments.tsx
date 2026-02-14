import React, { useState, useEffect, useCallback } from 'react';
import { MessageSquare, Reply, HelpCircle, Heart, Clock, BookOpen, Video, ChevronDown, ChevronRight, Filter, Layers, ExternalLink, Trash2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import UserDetailContent from './UserDetailContent';

interface CommentWithContext {
  id: string; content: string; comment_type: string;
  video_timestamp_seconds: number | null; created_at: string;
  lesson_id: string; course_id: string; user_id: string; parent_id: string | null;
  lesson_title?: string; course_title?: string; module_title?: string;
  user_name?: string; user_email?: string;
  replies?: CommentWithContext[];
}

interface ProfileUser {
  id: string; user_id: string; email: string | null; display_name: string | null;
  company_name: string | null; country: string | null; phone: string | null;
  role_type: string | null; client_count: string | null; network_type: string | null;
  cheapest_plan_usd: number | null; main_problems: string | null; main_desires: string | null;
  approved: boolean; status: string; created_at: string;
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
  const [filterReplied, setFilterReplied] = useState<string>('all');
  const [courses, setCourses] = useState<{ id: string; title: string }[]>([]);
  const [replyingTo, setReplyingTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState('');
  const [expandedComments, setExpandedComments] = useState<Set<string>>(new Set());
  const [selectedUser, setSelectedUser] = useState<ProfileUser | null>(null);
  const [deleteCommentId, setDeleteCommentId] = useState<string | null>(null);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    let query = supabase.from('lesson_comments').select('*').is('parent_id', null).order('created_at', { ascending: false });
    const { data: commentsData } = await query;
    
    if (!commentsData || commentsData.length === 0) { setComments([]); setLoading(false); return; }

    const commentIds = commentsData.map(c => c.id);
    const { data: repliesData } = await supabase.from('lesson_comments').select('*').in('parent_id', commentIds).order('created_at', { ascending: true });

    const lessonIds = [...new Set(commentsData.map(c => c.lesson_id))];
    const { data: lessons } = await supabase.from('course_lessons').select('id, title, module_id').in('id', lessonIds);
    const lessonMap: Record<string, { title: string; module_id: string }> = {};
    lessons?.forEach(l => { lessonMap[l.id] = { title: l.title, module_id: l.module_id }; });

    const moduleIds = [...new Set(Object.values(lessonMap).map(l => l.module_id))];
    const { data: modulesData } = moduleIds.length > 0
      ? await supabase.from('course_modules').select('id, title').in('id', moduleIds)
      : { data: [] };
    const moduleMap: Record<string, string> = {};
    modulesData?.forEach(m => { moduleMap[m.id] = m.title; });

    const courseIds = [...new Set(commentsData.map(c => c.course_id))];
    const { data: coursesData } = await supabase.from('courses').select('id, title').in('id', courseIds);
    const courseMap: Record<string, string> = {};
    coursesData?.forEach(c => { courseMap[c.id] = c.title; });

    const userIds = [...new Set([...commentsData, ...(repliesData || [])].map(c => c.user_id))];
    const { data: profiles } = await supabase.from('profiles').select('user_id, display_name, email').in('user_id', userIds);
    const profileMap: Record<string, { name: string; email: string }> = {};
    profiles?.forEach(p => { profileMap[p.user_id] = { name: p.display_name || '', email: p.email || '' }; });

    const enriched: CommentWithContext[] = commentsData.map(c => {
      const lessonInfo = lessonMap[c.lesson_id];
      return {
        ...c,
        lesson_title: lessonInfo?.title || '',
        module_title: lessonInfo ? moduleMap[lessonInfo.module_id] || '' : '',
        course_title: courseMap[c.course_id] || '',
        user_name: profileMap[c.user_id]?.name || '',
        user_email: profileMap[c.user_id]?.email || '',
        replies: (repliesData || []).filter(r => r.parent_id === c.id).map(r => ({
          ...r,
          user_name: profileMap[r.user_id]?.name || '',
          user_email: profileMap[r.user_id]?.email || '',
        })),
      };
    });

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
      content: replyText, comment_type: 'comment',
      lesson_id: parentComment.lesson_id, course_id: parentComment.course_id,
      user_id: user.id, parent_id: parentComment.id,
    });
    setReplyText(''); setReplyingTo(null);
    fetchComments();
    toast({ title: t('replyComment') || 'Resposta enviada' });
  };

  const confirmDeleteComment = (id: string) => {
    setDeleteCommentId(id);
    setShowDeleteConfirm(true);
  };

  const executeDeleteComment = async () => {
    if (!deleteCommentId) return;
    // Delete replies first, then the comment
    await supabase.from('lesson_comments').delete().eq('parent_id', deleteCommentId);
    await supabase.from('lesson_comments').delete().eq('id', deleteCommentId);
    toast({ title: 'Comentário excluído' });
    setShowDeleteConfirm(false);
    setDeleteCommentId(null);
    fetchComments();
  };

  const deleteReply = async (replyId: string) => {
    await supabase.from('lesson_comments').delete().eq('id', replyId);
    toast({ title: 'Resposta excluída' });
    fetchComments();
  };

  const openUserProfile = async (userId: string) => {
    const { data } = await supabase.from('profiles').select('*').eq('user_id', userId).single();
    if (data) setSelectedUser(data as any);
  };

  const filtered = comments.filter(c => {
    if (filterType !== 'all' && c.comment_type !== filterType) return false;
    if (filterCourse !== 'all' && c.course_id !== filterCourse) return false;
    if (filterReplied === 'unreplied' && c.replies && c.replies.length > 0) return false;
    if (filterReplied === 'replied' && (!c.replies || c.replies.length === 0)) return false;
    return true;
  });

  const doubtsCount = comments.filter(c => c.comment_type === 'doubt').length;
  const unrepliedDoubts = comments.filter(c => c.comment_type === 'doubt' && (!c.replies || c.replies.length === 0)).length;
  const unrepliedTotal = comments.filter(c => !c.replies || c.replies.length === 0).length;
  const repliedTotal = comments.filter(c => c.replies && c.replies.length > 0).length;

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-display font-bold text-foreground">{t('allComments') || 'Comentários'}</h2>
          <p className="text-sm text-muted-foreground">{t('allCommentsDesc') || 'Todos os comentários das aulas'}</p>
        </div>
        <div className="flex gap-2">
          {unrepliedDoubts > 0 && (
            <button onClick={() => { setFilterType('doubt'); setFilterReplied('unreplied'); }}>
              <Badge variant="destructive" className="gap-1 cursor-pointer hover:opacity-80">
                <HelpCircle className="w-3.5 h-3.5" /> {unrepliedDoubts} {t('unrepliedDoubts') || `dúvida${unrepliedDoubts > 1 ? 's' : ''} sem resposta`}
              </Badge>
            </button>
          )}
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-foreground">{comments.length}</p>
          <p className="text-xs text-muted-foreground">Total</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-yellow-500">{doubtsCount}</p>
          <p className="text-xs text-muted-foreground">{t('commentTypeQuestion') || 'Dúvidas'}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center">
          <p className="text-2xl font-bold text-pink-500">{comments.filter(c => c.comment_type === 'praise').length}</p>
          <p className="text-xs text-muted-foreground">{t('commentTypePraise') || 'Elogios'}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center cursor-pointer hover:border-primary/30" onClick={() => { setFilterReplied('unreplied'); setFilterType('all'); }}>
          <p className="text-2xl font-bold text-orange-500">{unrepliedTotal}</p>
          <p className="text-xs text-muted-foreground">{t('unreplied') || 'Sem resposta'}</p>
        </div>
        <div className="bg-card border border-border rounded-xl p-4 text-center cursor-pointer hover:border-primary/30" onClick={() => { setFilterReplied('replied'); setFilterType('all'); }}>
          <p className="text-2xl font-bold text-green-500">{repliedTotal}</p>
          <p className="text-xs text-muted-foreground">{t('replied') || 'Respondidos'}</p>
        </div>
      </div>

      {/* Filters */}
      <div className="flex gap-3 mb-6 flex-wrap">
        <Select value={filterType} onValueChange={setFilterType}>
          <SelectTrigger className="w-[160px] bg-secondary border-border"><SelectValue placeholder={t('commentTypeComment') || 'Tipo'} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allFilter') || 'Todos os tipos'}</SelectItem>
            <SelectItem value="comment">{t('commentTypeComment') || 'Comentários'}</SelectItem>
            <SelectItem value="praise">{t('commentTypePraise') || 'Elogios'}</SelectItem>
            <SelectItem value="doubt">{t('commentTypeQuestion') || 'Dúvidas'}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCourse} onValueChange={setFilterCourse}>
          <SelectTrigger className="w-[200px] bg-secondary border-border"><SelectValue placeholder={t('courseCategory') || 'Curso'} /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allFilter') || 'Todos os cursos'}</SelectItem>
            {courses.map(c => <SelectItem key={c.id} value={c.id}>{c.title}</SelectItem>)}
          </SelectContent>
        </Select>
        <Select value={filterReplied} onValueChange={setFilterReplied}>
          <SelectTrigger className="w-[180px] bg-secondary border-border"><SelectValue placeholder="Status" /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allFilter') || 'Todos'}</SelectItem>
            <SelectItem value="unreplied">{t('unreplied') || 'Sem resposta'}</SelectItem>
            <SelectItem value="replied">{t('replied') || 'Respondidos'}</SelectItem>
          </SelectContent>
        </Select>
        {(filterType !== 'all' || filterCourse !== 'all' || filterReplied !== 'all') && (
          <Button variant="ghost" size="sm" onClick={() => { setFilterType('all'); setFilterCourse('all'); setFilterReplied('all'); }}>
            {t('clearFilters') || 'Limpar filtros'}
          </Button>
        )}
      </div>

      {/* Comments list */}
      {loading ? (
        <p className="text-center py-12 text-muted-foreground">{t('loading')}...</p>
      ) : filtered.length === 0 ? (
        <p className="text-center py-12 text-muted-foreground">{t('noCommentsFound') || 'Nenhum comentário encontrado'}</p>
      ) : (
        <div className="space-y-3">
          {filtered.map(comment => {
            const typeConfig = COMMENT_TYPE_CONFIG[comment.comment_type] || COMMENT_TYPE_CONFIG.comment;
            const isExpanded = expandedComments.has(comment.id);
            return (
              <div key={comment.id} className={`bg-card border rounded-xl overflow-hidden ${comment.comment_type === 'doubt' && (!comment.replies || comment.replies.length === 0) ? 'border-yellow-500/40' : 'border-border'}`}>
                <div className="p-4">
                  {/* Context */}
                  <div className="flex items-center gap-2 mb-2 text-xs text-muted-foreground flex-wrap">
                    <Badge variant="outline" className={`gap-1 ${typeConfig.color}`}>
                      {typeConfig.icon} {typeConfig.label}
                    </Badge>
                    <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" /> {comment.course_title}</span>
                    <span>›</span>
                    <span className="flex items-center gap-1"><Layers className="w-3 h-3" /> {comment.module_title}</span>
                    <span>›</span>
                    <a
                      href={`/app/courses/${comment.course_id}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary hover:underline cursor-pointer"
                    >
                      <Video className="w-3 h-3" /> {comment.lesson_title}
                      <ExternalLink className="w-2.5 h-2.5" />
                    </a>
                    {comment.video_timestamp_seconds !== null && (
                      <span className="flex items-center gap-1 text-primary">
                        <Clock className="w-3 h-3" /> {formatTimestamp(comment.video_timestamp_seconds)}
                      </span>
                    )}
                  </div>

                  {/* Author */}
                  <div className="flex items-center gap-2 mb-2">
                    <div className="w-6 h-6 rounded-full bg-primary/10 flex items-center justify-center text-primary text-xs font-bold">
                      {(comment.user_name || comment.user_email || '?')[0].toUpperCase()}
                    </div>
                    <button
                      onClick={() => openUserProfile(comment.user_id)}
                      className="text-sm font-medium text-primary hover:underline cursor-pointer"
                    >
                      {comment.user_name || comment.user_email}
                    </button>
                    <span className="text-xs text-muted-foreground">{new Date(comment.created_at).toLocaleString()}</span>
                  </div>

                  <p className="text-sm text-foreground whitespace-pre-wrap">{comment.content}</p>

                  {/* Actions */}
                  <div className="flex items-center gap-2 mt-3">
                    <Button variant="ghost" size="sm" className="gap-1 text-xs" onClick={() => {
                      setReplyingTo(replyingTo === comment.id ? null : comment.id);
                      setReplyText('');
                    }}>
                      <Reply className="w-3.5 h-3.5" /> {t('replyComment') || 'Responder'}
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
                        {comment.replies.length} {t('repliesCount') || 'resposta'}{comment.replies.length > 1 ? 's' : ''}
                      </Button>
                    )}
                    <Button variant="ghost" size="sm" className="gap-1 text-xs text-destructive hover:text-destructive ml-auto" onClick={() => confirmDeleteComment(comment.id)}>
                      <Trash2 className="w-3.5 h-3.5" /> Excluir
                    </Button>
                  </div>

                  {/* Reply form */}
                  {replyingTo === comment.id && (
                    <div className="mt-3 space-y-2">
                      <Textarea value={replyText} onChange={e => setReplyText(e.target.value)}
                        placeholder={t('writeReply') || 'Escreva sua resposta...'}
                        className="bg-secondary border-border min-h-[60px] text-sm" />
                      <div className="flex gap-2">
                        <Button size="sm" onClick={() => sendReply(comment)} disabled={!replyText.trim()}>{t('send') || 'Enviar'}</Button>
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
                        <div className="flex-1">
                          <div className="flex items-center gap-2 mb-1">
                            <button onClick={() => openUserProfile(reply.user_id)} className="text-sm font-medium text-primary hover:underline">{reply.user_name || reply.user_email}</button>
                            <span className="text-xs text-muted-foreground">{new Date(reply.created_at).toLocaleString()}</span>
                            <Button variant="ghost" size="sm" className="h-6 w-6 p-0 text-destructive hover:text-destructive ml-auto" onClick={() => deleteReply(reply.id)}>
                              <Trash2 className="w-3 h-3" />
                            </Button>
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

      {/* Delete Comment Confirm */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>Excluir comentário?</AlertDialogTitle>
            <AlertDialogDescription>O comentário e todas as suas respostas serão excluídos permanentemente.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={executeDeleteComment} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              <Trash2 className="w-4 h-4 mr-2" /> Excluir
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* User Profile Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[85vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{selectedUser?.display_name || selectedUser?.email || 'Perfil'}</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <UserDetailContent
              user={selectedUser}
              t={t}
              getStatusBadge={(u) => <Badge variant={u.status === 'approved' ? 'default' : 'secondary'}>{u.status}</Badge>}
              approveUser={() => {}}
              rejectUser={() => {}}
              confirmSuspend={() => {}}
              confirmDelete={() => {}}
              fetchActivePlansCounts={() => {}}
            />
          )}
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminComments;
