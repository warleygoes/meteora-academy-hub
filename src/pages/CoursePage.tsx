import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { ChevronDown, ChevronRight, Video, FileText, Image, Music, Link as LinkIcon, FileDown, CheckCircle2, Circle, ArrowLeft, Lock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import VideoPlayer from '@/components/VideoPlayer';
import LessonComments from '@/components/LessonComments';
import LessonRating from '@/components/LessonRating';
import { ScrollArea } from '@/components/ui/scroll-area';
import { motion } from 'framer-motion';

interface LessonContent {
  id: string; lesson_id: string;
  type: 'video' | 'text' | 'image' | 'audio' | 'link' | 'pdf';
  title: string; content: string | null; sort_order: number;
}

interface Lesson {
  id: string; module_id: string; title: string; description: string | null;
  video_url: string | null; duration_minutes: number | null; sort_order: number;
  is_free: boolean; is_private: boolean;
  contents: LessonContent[];
}

interface Module {
  id: string; course_id: string; title: string; description: string | null; sort_order: number;
  lessons: Lesson[];
}

interface Course {
  id: string; title: string; description: string | null; thumbnail_url: string | null; status: string;
}

const CONTENT_ICONS: Record<string, React.ReactNode> = {
  video: <Video className="w-4 h-4" />, text: <FileText className="w-4 h-4" />,
  image: <Image className="w-4 h-4" />, audio: <Music className="w-4 h-4" />,
  link: <LinkIcon className="w-4 h-4" />, pdf: <FileDown className="w-4 h-4" />,
};

const CoursePage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const [searchParams, setSearchParams] = useSearchParams();
  const { user } = useAuth();
  const { t } = useLanguage();
  const navigate = useNavigate();

  const [course, setCourse] = useState<Course | null>(null);
  const [modules, setModules] = useState<Module[]>([]);
  const [activeLessonId, setActiveLessonId] = useState<string | null>(null);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [completedLessons, setCompletedLessons] = useState<Set<string>>(new Set());
  const [accessiblePrivateLessons, setAccessiblePrivateLessons] = useState<Set<string>>(new Set());
  const [loading, setLoading] = useState(true);

  const allLessons = modules.flatMap(m => m.lessons);
  const activeLesson = allLessons.find(l => l.id === activeLessonId) || null;

  const isResume = searchParams.get('resume') === 'true';

  const fetchData = useCallback(async () => {
    if (!courseId || !user) return;
    setLoading(true);

    const [{ data: courseData }, { data: modulesData }] = await Promise.all([
      supabase.from('courses').select('*').eq('id', courseId).single(),
      supabase.from('course_modules').select('*').eq('course_id', courseId).order('sort_order'),
    ]);

    if (!courseData) { setLoading(false); return; }
    setCourse(courseData);

    const moduleIds = (modulesData || []).map(m => m.id);
    const [{ data: lessonsData }, { data: progressData }, { data: accessData }] = await Promise.all([
      moduleIds.length > 0
        ? supabase.from('course_lessons').select('*').in('module_id', moduleIds).order('sort_order')
        : Promise.resolve({ data: [] as any[] }),
      supabase.from('lesson_progress').select('lesson_id, completed').eq('user_id', user.id).eq('course_id', courseId),
      supabase.from('user_lesson_access').select('lesson_id').eq('user_id', user.id),
    ]);

    // Set accessible private lessons
    setAccessiblePrivateLessons(new Set((accessData || []).map(a => a.lesson_id)));

    const lessonIds = (lessonsData || []).map(l => l.id);
    const { data: contentsData } = lessonIds.length > 0
      ? await supabase.from('lesson_contents').select('*').in('lesson_id', lessonIds).order('sort_order')
      : { data: [] };

    const builtModules: Module[] = (modulesData || []).map(m => ({
      ...m,
      lessons: (lessonsData || []).filter(l => l.module_id === m.id).map(l => ({
        ...l,
        is_private: l.is_private || false,
        contents: ((contentsData || []) as LessonContent[]).filter(c => c.lesson_id === l.id),
      })),
    }));

    setModules(builtModules);

    const completed = new Set<string>();
    (progressData || []).forEach(p => { if (p.completed) completed.add(p.lesson_id); });
    setCompletedLessons(completed);

    const allL = builtModules.flatMap(m => m.lessons);
    const lastProgress = progressData && progressData.length > 0 ? progressData[0] : null;

    if (isResume) {
      // Find the first uncompleted lesson (the "next" lesson to watch)
      const firstUncompleted = allL.find(l => !completed.has(l.id));
      const targetLesson = firstUncompleted || allL[allL.length - 1];
      if (targetLesson) {
        setActiveLessonId(targetLesson.id);
        const parentMod = builtModules.find(m => m.lessons.some(l => l.id === targetLesson.id));
        if (parentMod) setExpandedModules(new Set([parentMod.id]));
      }
      // Clear the resume param so refreshing doesn't re-trigger
      setSearchParams({}, { replace: true });
    } else if (lastProgress) {
      setActiveLessonId(lastProgress.lesson_id);
      const parentMod = builtModules.find(m => m.lessons.some(l => l.id === lastProgress.lesson_id));
      if (parentMod) setExpandedModules(new Set([parentMod.id]));
    } else if (allL.length > 0) {
      setActiveLessonId(allL[0].id);
      if (builtModules.length > 0) setExpandedModules(new Set([builtModules[0].id]));
    }

    setLoading(false);
  }, [courseId, user, isResume]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const canAccessLesson = (lesson: Lesson) => {
    if (!lesson.is_private) return true;
    return accessiblePrivateLessons.has(lesson.id);
  };

  const selectLesson = async (lessonId: string) => {
    const lesson = allLessons.find(l => l.id === lessonId);
    if (lesson && !canAccessLesson(lesson)) return;
    setActiveLessonId(lessonId);
    // Only track which lesson the user is viewing, don't touch completed status
  };

  const toggleComplete = async (lessonId: string) => {
    if (!user || !courseId) return;
    const isCompleted = completedLessons.has(lessonId);
    setCompletedLessons(prev => {
      const next = new Set(prev);
      isCompleted ? next.delete(lessonId) : next.add(lessonId);
      return next;
    });
    await supabase.from('lesson_progress').upsert(
      { user_id: user.id, course_id: courseId, lesson_id: lessonId, completed: !isCompleted, updated_at: new Date().toISOString() },
      { onConflict: 'user_id,course_id,lesson_id' }
    );
  };

  const toggleModuleExpand = (id: string) => {
    setExpandedModules(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  const renderContent = (content: LessonContent) => {
    switch (content.type) {
      case 'video': return content.content ? <VideoPlayer url={content.content} /> : null;
      case 'text': return <div className="prose prose-invert max-w-none text-foreground text-sm leading-relaxed whitespace-pre-wrap">{content.content}</div>;
      case 'image': return content.content ? <img src={content.content} alt={content.title} className="rounded-lg max-w-full" /> : null;
      case 'audio': return content.content ? <audio src={content.content} controls className="w-full" /> : null;
      case 'link': return content.content ? (
        <a href={content.content} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline flex items-center gap-2">
          <LinkIcon className="w-4 h-4" /> {content.content}
        </a>
      ) : null;
      case 'pdf': return content.content ? (
        <div className="space-y-2">
          <iframe src={content.content} className="w-full h-[500px] rounded-lg border border-border" />
          <a href={content.content} target="_blank" rel="noopener noreferrer" className="text-primary hover:underline text-sm flex items-center gap-1">
            <FileDown className="w-3.5 h-3.5" /> {t('downloadPdf') || 'Descargar PDF'}
          </a>
        </div>
      ) : null;
      default: return null;
    }
  };

  if (loading) return <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">{t('loading')}...</div>;
  if (!course) return <div className="flex items-center justify-center min-h-[60vh] text-muted-foreground">{t('courseNotFound')}</div>;

  return (
    <div className="flex flex-col lg:flex-row h-[calc(100vh-64px)]">
      {/* Sidebar */}
      <div className="w-full lg:w-80 xl:w-96 border-b lg:border-b-0 lg:border-r border-border bg-card flex-shrink-0">
        <div className="p-4 border-b border-border">
          <div className="flex items-center gap-2 mb-2">
            <Button variant="ghost" size="sm" onClick={() => navigate('/app/courses')} className="h-7 px-2">
              <ArrowLeft className="w-4 h-4" />
            </Button>
            <h2 className="font-display font-bold text-foreground text-sm truncate">{course.title}</h2>
          </div>
          <div className="flex gap-2 text-xs text-muted-foreground">
            <span>{allLessons.length} {t('lessons')}</span>
            <span>·</span>
            <span>{completedLessons.size}/{allLessons.length} {t('completed') || 'completadas'}</span>
          </div>
          {allLessons.length > 0 && (
            <div className="mt-2 h-1.5 bg-secondary rounded-full overflow-hidden">
              <div className="h-full bg-primary rounded-full transition-all" style={{ width: `${(completedLessons.size / allLessons.length) * 100}%` }} />
            </div>
          )}
        </div>
        <ScrollArea className="h-[200px] lg:h-[calc(100vh-180px)]">
          <div className="p-2 space-y-1">
            {modules.map((mod, mi) => (
              <div key={mod.id}>
                <button onClick={() => toggleModuleExpand(mod.id)}
                  className="w-full flex items-center gap-2 px-3 py-2 rounded-lg hover:bg-secondary/50 text-left transition-colors">
                  {expandedModules.has(mod.id) ? <ChevronDown className="w-4 h-4 text-muted-foreground shrink-0" /> : <ChevronRight className="w-4 h-4 text-muted-foreground shrink-0" />}
                  <span className="text-sm font-medium text-foreground truncate">{mi + 1}. {mod.title}</span>
                  {mod.lessons.length > 0 && mod.lessons.every(l => completedLessons.has(l.id)) ? (
                    <CheckCircle2 className="w-4 h-4 text-green-500 ml-auto shrink-0" />
                  ) : (
                    <Badge variant="secondary" className="text-xs ml-auto shrink-0">{mod.lessons.filter(l => completedLessons.has(l.id)).length}/{mod.lessons.length}</Badge>
                  )}
                </button>
                {expandedModules.has(mod.id) && (
                  <div className="ml-4 space-y-0.5">
                    {mod.lessons.map((lesson, li) => {
                      const hasAccess = canAccessLesson(lesson);
                      return (
                        <button key={lesson.id} onClick={() => hasAccess && selectLesson(lesson.id)}
                          className={`w-full flex items-center gap-2 px-3 py-1.5 rounded-md text-left text-sm transition-colors ${
                            !hasAccess ? 'opacity-50 cursor-not-allowed' :
                            activeLessonId === lesson.id ? 'bg-primary/10 text-primary' : 'hover:bg-secondary/50 text-muted-foreground'
                          }`}>
                          {lesson.is_private && !hasAccess ? (
                            <Lock className="w-4 h-4 text-muted-foreground shrink-0" />
                          ) : completedLessons.has(lesson.id) ? (
                            <CheckCircle2 className="w-4 h-4 text-green-500 shrink-0" />
                          ) : (
                            <Circle className="w-4 h-4 shrink-0" />
                          )}
                          <span className="truncate">{li + 1}. {lesson.title}</span>
                          {lesson.is_private && <Lock className="w-3 h-3 text-muted-foreground shrink-0" />}
                          {lesson.duration_minutes ? <span className="text-xs ml-auto shrink-0">{lesson.duration_minutes}m</span> : null}
                        </button>
                      );
                    })}
                  </div>
                )}
              </div>
            ))}
          </div>
        </ScrollArea>
      </div>

      {/* Main content */}
      <div className="flex-1 overflow-y-auto">
        {activeLesson ? (
          <motion.div key={activeLesson.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="p-6 max-w-4xl mx-auto space-y-6">
            <div className="flex items-center justify-between">
              <h1 className="text-2xl font-display font-bold text-foreground">{activeLesson.title}</h1>
              <Button variant="outline" size="sm" onClick={() => toggleComplete(activeLesson.id)}
                className={completedLessons.has(activeLesson.id) ? 'text-green-500 border-green-500/30' : ''}>
                {completedLessons.has(activeLesson.id) ? <CheckCircle2 className="w-4 h-4 mr-1" /> : <Circle className="w-4 h-4 mr-1" />}
                {completedLessons.has(activeLesson.id) ? (t('completed')) : (t('markComplete'))}
              </Button>
            </div>

            {activeLesson.description && <p className="text-muted-foreground">{activeLesson.description}</p>}

            {activeLesson.video_url && <VideoPlayer url={activeLesson.video_url} />}

            {activeLesson.contents.map(cont => (
              <div key={cont.id} className="space-y-2">
                <div className="flex items-center gap-2 text-sm font-medium text-foreground">
                  <span className="text-muted-foreground">{CONTENT_ICONS[cont.type]}</span>
                  {cont.title}
                </div>
                {renderContent(cont)}
              </div>
            ))}

            {/* Rating */}
            {courseId && <LessonRating lessonId={activeLesson.id} courseId={courseId} />}

            {/* Comments */}
            {courseId && <LessonComments lessonId={activeLesson.id} courseId={courseId} />}

            {/* Navigation */}
            <div className="flex justify-between pt-6 border-t border-border">
              {(() => {
                const idx = allLessons.findIndex(l => l.id === activeLessonId);
                return (
                  <>
                    <Button variant="outline" disabled={idx <= 0} onClick={() => idx > 0 && selectLesson(allLessons[idx - 1].id)}>
                      ← {t('back') || 'Anterior'}
                    </Button>
                    <Button disabled={idx >= allLessons.length - 1} onClick={() => idx < allLessons.length - 1 && selectLesson(allLessons[idx + 1].id)}>
                      {t('next') || 'Siguiente'} →
                    </Button>
                  </>
                );
              })()}
            </div>
          </motion.div>
        ) : (
          <div className="flex items-center justify-center h-full text-muted-foreground">
            {t('selectLesson')}
          </div>
        )}
      </div>
    </div>
  );
};

export default CoursePage;
