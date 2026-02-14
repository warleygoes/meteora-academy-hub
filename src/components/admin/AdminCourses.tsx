import React, { useState, useEffect, useCallback, useRef } from 'react';
import { BookOpen, Edit, Trash2, Users, ChevronDown, ChevronRight, Video, FolderPlus, FilePlus, Tag, Filter, X, Image, FileText, Music, Link as LinkIcon, FileDown, Plus, Upload } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { logSystemEvent } from '@/lib/systemLog';

interface Category { id: string; name: string; description: string | null; }

interface LessonContent {
  id: string;
  lesson_id: string;
  type: 'video' | 'text' | 'image' | 'audio' | 'link' | 'pdf';
  title: string;
  content: string | null;
  sort_order: number;
}

interface Lesson {
  id: string; module_id: string; title: string; description: string | null;
  video_url: string | null; duration_minutes: number | null; sort_order: number; is_free: boolean;
  contents?: LessonContent[];
}

interface Module { id: string; course_id: string; title: string; description: string | null; sort_order: number; lessons: Lesson[]; }

interface Course {
  id: string; title: string; description: string | null; thumbnail_url: string | null;
  thumbnail_vertical_url: string | null;
  category_id: string | null; status: string; sort_order: number;
  category?: Category | null; enrollment_count?: number;
}

interface Enrollment {
  id: string; user_id: string; enrolled_at: string;
  profile?: { display_name: string | null; email: string | null; company_name: string | null };
}

const CONTENT_TYPE_ICONS: Record<string, React.ReactNode> = {
  video: <Video className="w-3.5 h-3.5" />,
  text: <FileText className="w-3.5 h-3.5" />,
  image: <Image className="w-3.5 h-3.5" />,
  audio: <Music className="w-3.5 h-3.5" />,
  link: <LinkIcon className="w-3.5 h-3.5" />,
  pdf: <FileDown className="w-3.5 h-3.5" />,
};

const CONTENT_TYPE_LABELS: Record<string, string> = {
  video: 'Video', text: 'Texto', image: 'Imagen', audio: 'Audio', link: 'Link', pdf: 'PDF',
};

const AdminCourses: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  const [showCategoryEditor, setShowCategoryEditor] = useState(false);
  const [showStudentList, setShowStudentList] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);
  const [showDeleteCategoryConfirm, setShowDeleteCategoryConfirm] = useState(false);

  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [publishCourseId, setPublishCourseId] = useState<string | null>(null);
  const [publishAction, setPublishAction] = useState<'published' | 'draft'>('published');
  const [deleteCategoryId, setDeleteCategoryId] = useState<string | null>(null);
  const [students, setStudents] = useState<Enrollment[]>([]);
  const [expandedCourses, setExpandedCourses] = useState<Set<string>>(new Set());
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());
  const [expandedLessons, setExpandedLessons] = useState<Set<string>>(new Set());
  const [courseModules, setCourseModules] = useState<Record<string, Module[]>>({});
  const [loadingModules, setLoadingModules] = useState<Set<string>>(new Set());

  const [inlineEditingModule, setInlineEditingModule] = useState<string | null>(null);
  const [inlineEditingLesson, setInlineEditingLesson] = useState<string | null>(null);
  const [inlineModuleForm, setInlineModuleForm] = useState({ title: '', description: '' });
  const [inlineLessonForm, setInlineLessonForm] = useState({ title: '', description: '', video_url: '', duration_minutes: 0, is_free: false });

  const [editingContent, setEditingContent] = useState<string | null>(null);
  const [contentForm, setContentForm] = useState({ title: '', type: 'video' as LessonContent['type'], content: '' });

  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });

  // Course image editor
  const [showImageEditor, setShowImageEditor] = useState(false);
  const [imageEditorCourseId, setImageEditorCourseId] = useState<string | null>(null);
  const [imageForm, setImageForm] = useState({ thumbnail_url: '', thumbnail_vertical_url: '' });
  const [uploadingH, setUploadingH] = useState(false);
  const [uploadingV, setUploadingV] = useState(false);
  const fileRefH = useRef<HTMLInputElement>(null);
  const fileRefV = useRef<HTMLInputElement>(null);

  const uploadCourseImage = async (file: File, orientation: 'horizontal' | 'vertical') => {
    const setter = orientation === 'horizontal' ? setUploadingH : setUploadingV;
    setter(true);
    const ext = file.name.split('.').pop();
    const path = `${crypto.randomUUID()}.${ext}`;
    const { error } = await supabase.storage.from('product-images').upload(path, file);
    if (error) {
      toast({ title: t('imageUploadError') || 'Error al subir imagen', description: error.message, variant: 'destructive' });
      setter(false);
      return;
    }
    const { data: { publicUrl } } = supabase.storage.from('product-images').getPublicUrl(path);
    if (orientation === 'horizontal') {
      setImageForm(f => ({ ...f, thumbnail_url: publicUrl }));
    } else {
      setImageForm(f => ({ ...f, thumbnail_vertical_url: publicUrl }));
    }
    setter(false);
    toast({ title: t('imageUploaded') || 'Imagen subida' });
  };

  const openImageEditor = (course: Course) => {
    setImageEditorCourseId(course.id);
    setImageForm({
      thumbnail_url: course.thumbnail_url || '',
      thumbnail_vertical_url: course.thumbnail_vertical_url || '',
    });
    setShowImageEditor(true);
  };

  const saveCourseImages = async () => {
    if (!imageEditorCourseId) return;
    await supabase.from('courses').update({
      thumbnail_url: imageForm.thumbnail_url || null,
      thumbnail_vertical_url: imageForm.thumbnail_vertical_url || null,
    }).eq('id', imageEditorCourseId);
    // Also sync product if linked
    await supabase.from('products').update({
      thumbnail_url: imageForm.thumbnail_url || null,
      thumbnail_vertical_url: imageForm.thumbnail_vertical_url || null,
    }).eq('course_id', imageEditorCourseId);
    toast({ title: t('courseUpdated') || 'Contenido actualizado' });
    setShowImageEditor(false);
    fetchCourses();
  };

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    const { data: coursesData } = await supabase.from('courses').select('*, course_categories(*)').order('sort_order', { ascending: true });
    if (coursesData) {
      const { data: enrollments } = await supabase.from('course_enrollments').select('course_id');
      const countMap: Record<string, number> = {};
      enrollments?.forEach(e => { countMap[e.course_id] = (countMap[e.course_id] || 0) + 1; });
      setCourses(coursesData.map((c: any) => ({ ...c, category: c.course_categories, enrollment_count: countMap[c.id] || 0 })));
    }
    setLoading(false);
  }, []);

  const fetchCategories = useCallback(async () => {
    const { data } = await supabase.from('course_categories').select('*').order('name');
    if (data) setCategories(data);
  }, []);

  useEffect(() => { fetchCourses(); fetchCategories(); }, [fetchCourses, fetchCategories]);

  const fetchCourseModules = async (courseId: string) => {
    setLoadingModules(prev => new Set(prev).add(courseId));
    const { data: modules } = await supabase.from('course_modules').select('*').eq('course_id', courseId).order('sort_order');
    const moduleIds = (modules || []).map(m => m.id);
    const { data: lessons } = moduleIds.length > 0
      ? await supabase.from('course_lessons').select('*').in('module_id', moduleIds).order('sort_order')
      : { data: [] };
    
    const lessonIds = (lessons || []).map(l => l.id);
    const { data: contents } = lessonIds.length > 0
      ? await supabase.from('lesson_contents').select('*').in('lesson_id', lessonIds).order('sort_order')
      : { data: [] };

    setCourseModules(prev => ({
      ...prev,
      [courseId]: (modules || []).map(m => ({
        ...m,
        lessons: (lessons || []).filter(l => l.module_id === m.id).map(l => ({
          ...l,
          contents: ((contents || []) as LessonContent[]).filter(c => c.lesson_id === l.id),
        })),
      })),
    }));
    setLoadingModules(prev => { const next = new Set(prev); next.delete(courseId); return next; });
  };

  const toggleCourseExpand = (courseId: string) => {
    setExpandedCourses(prev => {
      const next = new Set(prev);
      if (next.has(courseId)) { next.delete(courseId); } else { next.add(courseId); if (!courseModules[courseId]) fetchCourseModules(courseId); }
      return next;
    });
  };

  const toggleLessonExpand = (lessonId: string) => {
    setExpandedLessons(prev => { const next = new Set(prev); next.has(lessonId) ? next.delete(lessonId) : next.add(lessonId); return next; });
  };

  // Status toggle
  const confirmToggleStatus = (id: string, currentStatus: string) => { setPublishCourseId(id); setPublishAction(currentStatus === 'published' ? 'draft' : 'published'); setShowPublishConfirm(true); };
  const executeToggleStatus = async () => {
    if (!publishCourseId) return;
    await supabase.from('courses').update({ status: publishAction }).eq('id', publishCourseId);
    logSystemEvent({ action: publishAction === 'published' ? 'Curso publicado' : 'Curso despublicado', entity_type: 'course', entity_id: publishCourseId, level: 'info' });
    toast({ title: publishAction === 'published' ? (t('coursePublished') || 'Curso publicado') : (t('courseDrafted') || 'Curso movido a borrador') });
    setShowPublishConfirm(false); setPublishCourseId(null); fetchCourses();
  };

  // Category CRUD
  const openNewCategory = () => { setEditingCategory(null); setCategoryForm({ name: '', description: '' }); setShowCategoryEditor(true); };
  const openEditCategory = (cat: Category) => { setEditingCategory(cat); setCategoryForm({ name: cat.name, description: cat.description || '' }); setShowCategoryEditor(true); };
  const saveCategory = async () => {
    if (!categoryForm.name.trim()) return;
    if (editingCategory) { await supabase.from('course_categories').update(categoryForm).eq('id', editingCategory.id); }
    else { await supabase.from('course_categories').insert(categoryForm); }
    setShowCategoryEditor(false); fetchCategories(); fetchCourses();
    toast({ title: t('categorySaved') || 'Categoría guardada' });
  };
  const confirmDeleteCategory = (id: string) => { setDeleteCategoryId(id); setShowDeleteCategoryConfirm(true); };
  const executeDeleteCategory = async () => {
    if (!deleteCategoryId) return;
    await supabase.from('course_categories').delete().eq('id', deleteCategoryId);
    fetchCategories(); fetchCourses();
    toast({ title: t('categoryDeleted') || 'Categoría eliminada' });
    setShowDeleteCategoryConfirm(false); setDeleteCategoryId(null);
  };

  // Inline Module CRUD
  const openNewModuleInline = async (courseId: string) => {
    const modules = courseModules[courseId] || [];
    await supabase.from('course_modules').insert({ course_id: courseId, title: t('newModule') || 'Nuevo Módulo', sort_order: modules.length });
    fetchCourseModules(courseId);
    toast({ title: t('moduleSaved') || 'Módulo creado' });
  };
  const startEditModule = (mod: Module) => { setInlineEditingModule(mod.id); setInlineModuleForm({ title: mod.title, description: mod.description || '' }); };
  const saveInlineModule = async (mod: Module) => {
    await supabase.from('course_modules').update({ title: inlineModuleForm.title, description: inlineModuleForm.description || null }).eq('id', mod.id);
    setInlineEditingModule(null); fetchCourseModules(mod.course_id);
    toast({ title: t('moduleSaved') || 'Módulo guardado' });
  };
  const deleteModuleInline = async (mod: Module) => {
    await supabase.from('course_modules').delete().eq('id', mod.id);
    fetchCourseModules(mod.course_id);
    toast({ title: t('moduleDeleted') || 'Módulo eliminado' });
  };

  // Inline Lesson CRUD
  const openNewLessonInline = async (moduleId: string, courseId: string) => {
    const mod = (courseModules[courseId] || []).find(m => m.id === moduleId);
    await supabase.from('course_lessons').insert({ module_id: moduleId, title: t('newLesson') || 'Nueva Aula', sort_order: (mod?.lessons || []).length });
    fetchCourseModules(courseId);
    toast({ title: t('lessonSaved') || 'Aula creada' });
  };
  const startEditLesson = (lesson: Lesson) => {
    setInlineEditingLesson(lesson.id);
    setInlineLessonForm({ title: lesson.title, description: lesson.description || '', video_url: lesson.video_url || '', duration_minutes: lesson.duration_minutes || 0, is_free: lesson.is_free });
  };
  const saveInlineLesson = async (lesson: Lesson, courseId: string) => {
    await supabase.from('course_lessons').update({
      title: inlineLessonForm.title, description: inlineLessonForm.description || null,
      video_url: inlineLessonForm.video_url || null, duration_minutes: inlineLessonForm.duration_minutes || 0, is_free: inlineLessonForm.is_free,
    }).eq('id', lesson.id);
    setInlineEditingLesson(null); fetchCourseModules(courseId);
    toast({ title: t('lessonSaved') || 'Aula guardada' });
  };
  const deleteLessonInline = async (lessonId: string, courseId: string) => {
    await supabase.from('course_lessons').delete().eq('id', lessonId);
    fetchCourseModules(courseId);
    toast({ title: t('lessonDeleted') || 'Aula eliminada' });
  };

  // Lesson Content CRUD
  const addContent = async (lessonId: string, courseId: string) => {
    const { data: existing } = await supabase.from('lesson_contents').select('sort_order').eq('lesson_id', lessonId).order('sort_order', { ascending: false }).limit(1);
    const nextOrder = (existing && existing.length > 0 ? existing[0].sort_order : -1) + 1;
    await supabase.from('lesson_contents').insert({ lesson_id: lessonId, type: 'video', title: t('addContent'), sort_order: nextOrder } as any);
    fetchCourseModules(courseId);
    toast({ title: t('contentAdded') });
  };

  const startEditContent = (c: LessonContent) => {
    setEditingContent(c.id);
    setContentForm({ title: c.title, type: c.type, content: c.content || '' });
  };

  const saveContent = async (contentId: string, courseId: string) => {
    await supabase.from('lesson_contents').update({ title: contentForm.title, type: contentForm.type, content: contentForm.content || null } as any).eq('id', contentId);
    setEditingContent(null);
    fetchCourseModules(courseId);
    toast({ title: t('contentSaved') });
  };

  const deleteContent = async (contentId: string, courseId: string) => {
    await supabase.from('lesson_contents').delete().eq('id', contentId);
    fetchCourseModules(courseId);
    toast({ title: t('contentDeleted') });
  };

  // Students
  const openStudentList = async (courseId: string) => {
    const { data } = await supabase.from('course_enrollments').select('*').eq('course_id', courseId);
    if (data) {
      const enriched: Enrollment[] = [];
      for (const e of data) {
        const { data: p } = await supabase.from('profiles').select('display_name, email, company_name').eq('user_id', e.user_id).single();
        enriched.push({ id: e.id, user_id: e.user_id, enrolled_at: e.enrolled_at, profile: p || undefined });
      }
      setStudents(enriched);
    } else { setStudents([]); }
    setShowStudentList(true);
  };

  const toggleModuleExpand = (id: string) => {
    setExpandedModules(prev => { const next = new Set(prev); next.has(id) ? next.delete(id) : next.add(id); return next; });
  };

  const filtered = courses.filter(c => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (filterCategory !== 'all' && c.category_id !== filterCategory) return false;
    if (search) {
      const s = search.toLowerCase();
      return c.title.toLowerCase().includes(s) || (c.description || '').toLowerCase().includes(s) || (c.category?.name || '').toLowerCase().includes(s);
    }
    return true;
  });

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-display font-bold text-foreground">{t('manageCourses')}</h2>
          <p className="text-sm text-muted-foreground">{t('adminCoursesDesc')}</p>
          <p className="text-xs text-muted-foreground mt-1">{t('contentCreatedViaProducts')}</p>
        </div>
        <Button variant="outline" onClick={openNewCategory} className="gap-2">
          <Tag className="w-4 h-4" /> {t('manageCategories') || 'Categorías'}
        </Button>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder={t('searchCourses')} value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-secondary border-border" />
        </div>
        <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
          <SelectTrigger className="w-[140px] bg-secondary border-border"><Filter className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allFilter') || 'Todos'}</SelectItem>
            <SelectItem value="published">{t('published')}</SelectItem>
            <SelectItem value="draft">{t('draft')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[180px] bg-secondary border-border"><Tag className="w-4 h-4 mr-2" /><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allCategories')}</SelectItem>
            {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
          </SelectContent>
        </Select>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {categories.map(cat => (
            <div key={cat.id} className="inline-flex items-center gap-1 bg-secondary rounded-lg px-3 py-1.5 text-sm border border-border">
              <Tag className="w-3 h-3 text-primary" />
              <span className="text-foreground">{cat.name}</span>
              <button onClick={() => openEditCategory(cat)} className="ml-1 text-muted-foreground hover:text-foreground"><Edit className="w-3 h-3" /></button>
              <button onClick={() => confirmDeleteCategory(cat.id)} className="text-muted-foreground hover:text-destructive"><X className="w-3 h-3" /></button>
            </div>
          ))}
        </div>
      )}

      {/* Course list */}
      {loading ? (
        <p className="text-center py-12 text-muted-foreground">{t('loading')}...</p>
      ) : (
        <div className="space-y-3">
          {filtered.map(course => (
            <div key={course.id} className="bg-card rounded-xl border border-border overflow-hidden">
              <div className="p-5 flex flex-col md:flex-row md:items-center gap-4">
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2 mb-1">
                    <button onClick={() => toggleCourseExpand(course.id)} className="text-muted-foreground hover:text-foreground shrink-0">
                      {expandedCourses.has(course.id) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    </button>
                    <p className="font-display font-semibold text-foreground truncate">{course.title}</p>
                    <Badge variant={course.status === 'published' ? 'default' : 'secondary'}
                      className={course.status === 'published' ? 'bg-green-500/10 text-green-500 border-green-500/20' : ''}>
                      {course.status === 'published' ? t('published') : t('draft')}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground truncate ml-6">{course.description}</p>
                  <div className="flex gap-4 mt-1 text-xs text-muted-foreground ml-6">
                    {course.category && <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{course.category.name}</span>}
                    <span>{course.enrollment_count} {t('students')}</span>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0">
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-muted-foreground">{t('draft')}</span>
                    <Switch checked={course.status === 'published'} onCheckedChange={() => confirmToggleStatus(course.id, course.status)} />
                    <span className="text-xs text-muted-foreground">{t('published')}</span>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => openImageEditor(course)} title={t('horizontalImage')}>
                    <Image className="w-4 h-4" />
                  </Button>
                  <Button variant="ghost" size="sm" onClick={() => openStudentList(course.id)} title={t('students')}>
                    <Users className="w-4 h-4" /><span className="ml-1 text-xs">{course.enrollment_count}</span>
                  </Button>
                </div>
              </div>

              {/* Expandable modules/lessons */}
              {expandedCourses.has(course.id) && (
                <div className="border-t border-border bg-secondary/30 p-4 space-y-2">
                  {loadingModules.has(course.id) ? (
                    <p className="text-sm text-muted-foreground text-center py-4">{t('loading')}...</p>
                  ) : (
                    <>
                      {(courseModules[course.id] || []).map((mod, mi) => (
                        <div key={mod.id} className="border border-border rounded-lg overflow-hidden bg-card">
                          <div className="flex items-center justify-between px-4 py-2.5 bg-secondary/50">
                            <button onClick={() => toggleModuleExpand(mod.id)} className="flex items-center gap-2 flex-1 text-left">
                              {expandedModules.has(mod.id) ? <ChevronDown className="w-4 h-4 text-muted-foreground" /> : <ChevronRight className="w-4 h-4 text-muted-foreground" />}
                              {inlineEditingModule === mod.id ? (
                                <Input value={inlineModuleForm.title} onChange={e => setInlineModuleForm(f => ({ ...f, title: e.target.value }))}
                                  className="bg-background border-border h-7 text-sm w-64" onClick={e => e.stopPropagation()}
                                  onKeyDown={e => { if (e.key === 'Enter') saveInlineModule(mod); if (e.key === 'Escape') setInlineEditingModule(null); }} />
                              ) : (
                                <span className="font-medium text-foreground text-sm">{mi + 1}. {mod.title}</span>
                              )}
                              <Badge variant="secondary" className="text-xs">{mod.lessons.length} {t('lessons')}</Badge>
                            </button>
                            <div className="flex gap-1">
                              {inlineEditingModule === mod.id ? (
                                <>
                                  <Button variant="ghost" size="sm" onClick={() => saveInlineModule(mod)} className="text-green-500 h-7"><span className="text-xs">✓</span></Button>
                                  <Button variant="ghost" size="sm" onClick={() => setInlineEditingModule(null)} className="h-7"><X className="w-3 h-3" /></Button>
                                </>
                              ) : (
                                <>
                                  <Button variant="ghost" size="sm" onClick={() => startEditModule(mod)} className="h-7"><Edit className="w-3 h-3" /></Button>
                                  <Button variant="ghost" size="sm" onClick={() => deleteModuleInline(mod)} className="text-destructive h-7"><Trash2 className="w-3 h-3" /></Button>
                                </>
                              )}
                            </div>
                          </div>

                          {expandedModules.has(mod.id) && (
                            <div className="p-3 space-y-2">
                              {mod.lessons.map((lesson, li) => (
                                <div key={lesson.id} className="rounded-lg bg-background border border-border/50">
                                  <div className="px-3 py-2">
                                    {inlineEditingLesson === lesson.id ? (
                                      <div className="space-y-2">
                                        <Input value={inlineLessonForm.title} onChange={e => setInlineLessonForm(f => ({ ...f, title: e.target.value }))}
                                          className="bg-secondary border-border h-8 text-sm" placeholder={t('lessonTitle') || 'Título'} />
                                        <Input value={inlineLessonForm.video_url} onChange={e => setInlineLessonForm(f => ({ ...f, video_url: e.target.value }))}
                                          className="bg-secondary border-border h-8 text-sm" placeholder={t('videoUrl') || 'URL del video'} />
                                        <div className="flex gap-2 items-center">
                                          <Input type="number" value={inlineLessonForm.duration_minutes}
                                            onChange={e => setInlineLessonForm(f => ({ ...f, duration_minutes: parseInt(e.target.value) || 0 }))}
                                            className="bg-secondary border-border h-8 text-sm w-24" placeholder="min" />
                                          <div className="flex items-center gap-1">
                                            <Switch checked={inlineLessonForm.is_free} onCheckedChange={v => setInlineLessonForm(f => ({ ...f, is_free: v }))} />
                                            <span className="text-xs text-muted-foreground">{t('free') || 'Gratis'}</span>
                                          </div>
                                          <div className="flex gap-1 ml-auto">
                                            <Button size="sm" variant="ghost" onClick={() => saveInlineLesson(lesson, course.id)} className="text-green-500 h-7"><span className="text-xs">✓</span></Button>
                                            <Button size="sm" variant="ghost" onClick={() => setInlineEditingLesson(null)} className="h-7"><X className="w-3 h-3" /></Button>
                                          </div>
                                        </div>
                                      </div>
                                    ) : (
                                      <div className="flex items-center gap-3">
                                        <button onClick={() => toggleLessonExpand(lesson.id)} className="text-muted-foreground hover:text-foreground shrink-0">
                                          {expandedLessons.has(lesson.id) ? <ChevronDown className="w-3.5 h-3.5" /> : <ChevronRight className="w-3.5 h-3.5" />}
                                        </button>
                                        <Video className="w-4 h-4 text-muted-foreground shrink-0" />
                                        <div className="flex-1 min-w-0">
                                          <p className="text-sm font-medium text-foreground truncate">{li + 1}. {lesson.title}</p>
                                          <div className="flex gap-2 text-xs text-muted-foreground">
                                            {lesson.duration_minutes ? <span>{lesson.duration_minutes} min</span> : null}
                                            {lesson.is_free && <Badge variant="secondary" className="text-xs py-0">{t('free') || 'Gratis'}</Badge>}
                                            {lesson.contents && lesson.contents.length > 0 && (
                                              <span className="flex items-center gap-1">
                                                {lesson.contents.length} {lesson.contents.length === 1 ? t('contentCount') : t('contentsCount')}
                                              </span>
                                            )}
                                          </div>
                                        </div>
                                        <Button variant="ghost" size="sm" onClick={() => startEditLesson(lesson)} className="h-7"><Edit className="w-3 h-3" /></Button>
                                        <Button variant="ghost" size="sm" onClick={() => deleteLessonInline(lesson.id, course.id)} className="text-destructive h-7"><Trash2 className="w-3 h-3" /></Button>
                                      </div>
                                    )}
                                  </div>

                                  {/* Lesson contents */}
                                  {expandedLessons.has(lesson.id) && (
                                    <div className="border-t border-border/50 px-3 py-2 space-y-2 bg-secondary/20">
                                      <p className="text-xs font-medium text-muted-foreground uppercase tracking-wider">{t('lessonContents')}</p>
                                      {(lesson.contents || []).map(cont => (
                                        <div key={cont.id} className="flex items-start gap-2 p-2 rounded-md bg-background border border-border/30">
                                          {editingContent === cont.id ? (
                                            <div className="flex-1 space-y-2">
                                              <Input value={contentForm.title} onChange={e => setContentForm(f => ({ ...f, title: e.target.value }))}
                                                className="bg-secondary border-border h-7 text-sm" placeholder={t('contentTitle')} />
                                              <Select value={contentForm.type} onValueChange={(v: any) => setContentForm(f => ({ ...f, type: v }))}>
                                                <SelectTrigger className="h-7 text-sm bg-secondary border-border w-32"><SelectValue /></SelectTrigger>
                                                <SelectContent>
                                                  {Object.entries(CONTENT_TYPE_LABELS).map(([k, v]) => (
                                                    <SelectItem key={k} value={k}>{v}</SelectItem>
                                                  ))}
                                                </SelectContent>
                                              </Select>
                                              {contentForm.type === 'text' ? (
                                                <Textarea value={contentForm.content} onChange={e => setContentForm(f => ({ ...f, content: e.target.value }))}
                                                  className="bg-secondary border-border text-sm min-h-[60px]" placeholder="Texto / Markdown" />
                                              ) : (
                                                <Input value={contentForm.content} onChange={e => setContentForm(f => ({ ...f, content: e.target.value }))}
                                                  className="bg-secondary border-border h-7 text-sm" placeholder="URL" />
                                              )}
                                              <div className="flex gap-1">
                                                <Button size="sm" variant="ghost" onClick={() => saveContent(cont.id, course.id)} className="text-green-500 h-7"><span className="text-xs">✓</span></Button>
                                                <Button size="sm" variant="ghost" onClick={() => setEditingContent(null)} className="h-7"><X className="w-3 h-3" /></Button>
                                              </div>
                                            </div>
                                          ) : (
                                            <>
                                              <span className="text-muted-foreground mt-0.5">{CONTENT_TYPE_ICONS[cont.type]}</span>
                                              <div className="flex-1 min-w-0">
                                                <p className="text-sm font-medium text-foreground truncate">{cont.title}</p>
                                                <p className="text-xs text-muted-foreground">{CONTENT_TYPE_LABELS[cont.type]}</p>
                                              </div>
                                              <Button variant="ghost" size="sm" onClick={() => startEditContent(cont)} className="h-6"><Edit className="w-3 h-3" /></Button>
                                              <Button variant="ghost" size="sm" onClick={() => deleteContent(cont.id, course.id)} className="text-destructive h-6"><Trash2 className="w-3 h-3" /></Button>
                                            </>
                                          )}
                                        </div>
                                      ))}
                                      <Button size="sm" variant="ghost" onClick={() => addContent(lesson.id, course.id)} className="gap-1 w-full text-primary text-xs">
                                        <Plus className="w-3.5 h-3.5" /> {t('addContent')}
                                      </Button>
                                    </div>
                                  )}
                                </div>
                              ))}
                              <Button size="sm" variant="ghost" onClick={() => openNewLessonInline(mod.id, course.id)} className="gap-1 w-full text-primary">
                                <FilePlus className="w-4 h-4" /> {t('addLesson') || 'Agregar Aula'}
                              </Button>
                            </div>
                          )}
                        </div>
                      ))}
                      <Button size="sm" variant="outline" onClick={() => openNewModuleInline(course.id)} className="gap-1 w-full">
                        <FolderPlus className="w-4 h-4" /> {t('addModule') || 'Agregar Módulo'}
                      </Button>
                    </>
                  )}
                </div>
              )}
            </div>
          ))}
          {filtered.length === 0 && <p className="text-center py-12 text-muted-foreground">{t('noCoursesFound')}</p>}
        </div>
      )}

      {/* Category Editor */}
      <Dialog open={showCategoryEditor} onOpenChange={setShowCategoryEditor}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">{editingCategory ? (t('editCategory') || 'Editar Categoría') : (t('addCategory') || 'Nueva Categoría')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('categoryName') || 'Nombre'}</label>
              <Input value={categoryForm.name} onChange={e => setCategoryForm(f => ({ ...f, name: e.target.value }))} className="bg-secondary border-border" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('courseDescription')}</label>
              <Input value={categoryForm.description} onChange={e => setCategoryForm(f => ({ ...f, description: e.target.value }))} className="bg-secondary border-border" />
            </div>
            <Button onClick={saveCategory} className="w-full">{t('save')}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Delete Category Confirm */}
      <AlertDialog open={showDeleteCategoryConfirm} onOpenChange={setShowDeleteCategoryConfirm}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteCategoryConfirm') || '¿Eliminar esta categoría?'}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteCategoryDesc') || 'Los cursos asociados perderán esta categoría.'}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('back') || 'Cancelar'}</AlertDialogCancel>
            <AlertDialogAction onClick={executeDeleteCategory} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">{t('deleteUser') || 'Eliminar'}</AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Publish Confirm */}
      <AlertDialog open={showPublishConfirm} onOpenChange={setShowPublishConfirm}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>{publishAction === 'published' ? (t('publishCourseConfirm') || '¿Publicar este curso?') : (t('unpublishCourseConfirm') || '¿Mover a borrador?')}</AlertDialogTitle>
            <AlertDialogDescription>
              {publishAction === 'published'
                ? (t('publishCourseDesc') || 'El curso será visible para todos los usuarios.')
                : (t('unpublishCourseDesc') || 'El curso dejará de ser visible para los usuarios.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('back') || 'Cancelar'}</AlertDialogCancel>
            <AlertDialogAction onClick={executeToggleStatus}>
              {publishAction === 'published' ? (t('publish') || 'Publicar') : (t('unpublishAction') || 'Mover a Borrador')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Student List */}
      <Dialog open={showStudentList} onOpenChange={setShowStudentList}>
        <DialogContent className="bg-card border-border max-w-lg max-h-[70vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Users className="w-5 h-5 text-primary" /> {t('enrolledStudents') || 'Alumnos Matriculados'} ({students.length})
            </DialogTitle>
          </DialogHeader>
          {students.length === 0 ? (
            <p className="text-sm text-muted-foreground text-center py-6">{t('noStudentsEnrolled') || 'No hay alumnos matriculados.'}</p>
          ) : (
            <div className="space-y-2">
              {students.map(s => (
                <div key={s.id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border">
                  <div className="w-8 h-8 rounded-full bg-primary/10 flex items-center justify-center text-primary text-sm font-bold">
                    {(s.profile?.display_name || s.profile?.email || '?')[0].toUpperCase()}
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{s.profile?.display_name || s.profile?.email || s.user_id}</p>
                    <p className="text-xs text-muted-foreground truncate">{s.profile?.company_name || s.profile?.email}</p>
                  </div>
                  <p className="text-xs text-muted-foreground">{new Date(s.enrolled_at).toLocaleDateString()}</p>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Course Image Editor */}
      <Dialog open={showImageEditor} onOpenChange={setShowImageEditor}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">{t('horizontalImage')} & {t('verticalImage')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('horizontalImage')}</label>
              <div className="flex gap-2 items-center">
                <input ref={fileRefH} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadCourseImage(e.target.files[0], 'horizontal')} />
                <Button variant="outline" size="sm" onClick={() => fileRefH.current?.click()} disabled={uploadingH} className="gap-1 w-full">
                  <Upload className="w-4 h-4" /> {uploadingH ? '...' : (t('uploadImage') || 'Subir')}
                </Button>
              </div>
              {imageForm.thumbnail_url && <img src={imageForm.thumbnail_url} alt="" className="mt-2 h-20 rounded object-cover" />}
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('verticalImage')}</label>
              <div className="flex gap-2 items-center">
                <input ref={fileRefV} type="file" accept="image/*" className="hidden" onChange={e => e.target.files?.[0] && uploadCourseImage(e.target.files[0], 'vertical')} />
                <Button variant="outline" size="sm" onClick={() => fileRefV.current?.click()} disabled={uploadingV} className="gap-1 w-full">
                  <Upload className="w-4 h-4" /> {uploadingV ? '...' : (t('uploadImage') || 'Subir')}
                </Button>
              </div>
              {imageForm.thumbnail_vertical_url && <img src={imageForm.thumbnail_vertical_url} alt="" className="mt-2 h-28 rounded object-cover" />}
            </div>
            <Button onClick={saveCourseImages} className="w-full">{t('save')}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCourses;
