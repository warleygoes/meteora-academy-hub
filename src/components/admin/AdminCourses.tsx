import React, { useState, useEffect, useCallback } from 'react';
import { BookOpen, Plus, Edit, Trash2, GripVertical, Eye, ToggleLeft, ToggleRight, Users, ChevronDown, ChevronRight, Video, FolderPlus, FilePlus, Tag, Filter, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogDescription } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Switch } from '@/components/ui/switch';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Category {
  id: string;
  name: string;
  description: string | null;
}

interface Lesson {
  id: string;
  module_id: string;
  title: string;
  description: string | null;
  video_url: string | null;
  duration_minutes: number | null;
  sort_order: number;
  is_free: boolean;
}

interface Module {
  id: string;
  course_id: string;
  title: string;
  description: string | null;
  sort_order: number;
  lessons: Lesson[];
}

interface Course {
  id: string;
  title: string;
  description: string | null;
  category_id: string | null;
  status: string;
  sort_order: number;
  created_at: string;
  updated_at: string;
  category?: Category | null;
  modules?: Module[];
  enrollment_count?: number;
}

interface Enrollment {
  id: string;
  user_id: string;
  enrolled_at: string;
  profile?: { display_name: string | null; email: string | null; company_name: string | null };
}

const AdminCourses: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>([]);
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filterStatus, setFilterStatus] = useState<'all' | 'published' | 'draft'>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');

  // Dialogs
  const [showCourseEditor, setShowCourseEditor] = useState(false);
  const [showCategoryEditor, setShowCategoryEditor] = useState(false);
  const [showCourseDetail, setShowCourseDetail] = useState(false);
  const [showModuleEditor, setShowModuleEditor] = useState(false);
  const [showLessonEditor, setShowLessonEditor] = useState(false);
  const [showStudentList, setShowStudentList] = useState(false);
  const [showPublishConfirm, setShowPublishConfirm] = useState(false);

  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [editingCategory, setEditingCategory] = useState<Category | null>(null);
  const [editingModule, setEditingModule] = useState<Module | null>(null);
  const [editingLesson, setEditingLesson] = useState<Lesson | null>(null);
  const [selectedCourse, setSelectedCourse] = useState<Course | null>(null);
  const [selectedModuleId, setSelectedModuleId] = useState<string | null>(null);
  const [publishCourseId, setPublishCourseId] = useState<string | null>(null);
  const [publishAction, setPublishAction] = useState<'published' | 'draft'>('published');
  const [students, setStudents] = useState<Enrollment[]>([]);
  const [expandedModules, setExpandedModules] = useState<Set<string>>(new Set());

  // Forms
  const [courseForm, setCourseForm] = useState({ title: '', description: '', category_id: '' });
  const [categoryForm, setCategoryForm] = useState({ name: '', description: '' });
  const [moduleForm, setModuleForm] = useState({ title: '', description: '' });
  const [lessonForm, setLessonForm] = useState({ title: '', description: '', video_url: '', duration_minutes: 0, is_free: false });

  const fetchCourses = useCallback(async () => {
    setLoading(true);
    const { data: coursesData } = await supabase
      .from('courses')
      .select('*, course_categories(*)')
      .order('sort_order', { ascending: true });

    if (coursesData) {
      // Get enrollment counts
      const { data: enrollments } = await supabase
        .from('course_enrollments')
        .select('course_id');

      const countMap: Record<string, number> = {};
      enrollments?.forEach(e => {
        countMap[e.course_id] = (countMap[e.course_id] || 0) + 1;
      });

      const mapped = coursesData.map((c: any) => ({
        ...c,
        category: c.course_categories,
        enrollment_count: countMap[c.id] || 0,
      }));
      setCourses(mapped);
    }
    setLoading(false);
  }, []);

  const fetchCategories = useCallback(async () => {
    const { data } = await supabase.from('course_categories').select('*').order('name');
    if (data) setCategories(data);
  }, []);

  useEffect(() => {
    fetchCourses();
    fetchCategories();
  }, [fetchCourses, fetchCategories]);

  // Course CRUD
  const openNewCourse = () => {
    setEditingCourse(null);
    setCourseForm({ title: '', description: '', category_id: '' });
    setShowCourseEditor(true);
  };
  const openEditCourse = (course: Course) => {
    setEditingCourse(course);
    setCourseForm({ title: course.title, description: course.description || '', category_id: course.category_id || '' });
    setShowCourseEditor(true);
  };
  const saveCourse = async () => {
    if (!courseForm.title.trim()) return;
    const payload = {
      title: courseForm.title,
      description: courseForm.description || null,
      category_id: courseForm.category_id || null,
    };
    if (editingCourse) {
      await supabase.from('courses').update(payload).eq('id', editingCourse.id);
      toast({ title: t('courseUpdated') || 'Curso actualizado' });
    } else {
      await supabase.from('courses').insert(payload);
      toast({ title: t('courseCreated') || 'Curso creado como borrador' });
    }
    setShowCourseEditor(false);
    fetchCourses();
  };
  const deleteCourse = async (id: string) => {
    await supabase.from('courses').delete().eq('id', id);
    toast({ title: t('courseDeleted') || 'Curso eliminado' });
    fetchCourses();
  };
  const confirmToggleStatus = (id: string, currentStatus: string) => {
    setPublishCourseId(id);
    setPublishAction(currentStatus === 'published' ? 'draft' : 'published');
    setShowPublishConfirm(true);
  };
  const executeToggleStatus = async () => {
    if (!publishCourseId) return;
    await supabase.from('courses').update({ status: publishAction }).eq('id', publishCourseId);
    toast({ title: publishAction === 'published' ? (t('coursePublished') || 'Curso publicado') : (t('courseDrafted') || 'Curso movido a borrador') });
    setShowPublishConfirm(false);
    setPublishCourseId(null);
    fetchCourses();
  };

  // Category CRUD
  const openNewCategory = () => { setEditingCategory(null); setCategoryForm({ name: '', description: '' }); setShowCategoryEditor(true); };
  const openEditCategory = (cat: Category) => { setEditingCategory(cat); setCategoryForm({ name: cat.name, description: cat.description || '' }); setShowCategoryEditor(true); };
  const saveCategory = async () => {
    if (!categoryForm.name.trim()) return;
    if (editingCategory) {
      await supabase.from('course_categories').update(categoryForm).eq('id', editingCategory.id);
    } else {
      await supabase.from('course_categories').insert(categoryForm);
    }
    setShowCategoryEditor(false);
    fetchCategories();
    fetchCourses();
    toast({ title: t('categorySaved') || 'Categoría guardada' });
  };
  const deleteCategory = async (id: string) => {
    await supabase.from('course_categories').delete().eq('id', id);
    fetchCategories();
    fetchCourses();
    toast({ title: t('categoryDeleted') || 'Categoría eliminada' });
  };

  // Course detail view with modules/lessons
  const openCourseDetail = async (course: Course) => {
    const { data: modules } = await supabase
      .from('course_modules')
      .select('*')
      .eq('course_id', course.id)
      .order('sort_order');

    const { data: lessons } = await supabase
      .from('course_lessons')
      .select('*')
      .in('module_id', (modules || []).map(m => m.id))
      .order('sort_order');

    const modulesWithLessons = (modules || []).map(m => ({
      ...m,
      lessons: (lessons || []).filter(l => l.module_id === m.id),
    }));

    setSelectedCourse({ ...course, modules: modulesWithLessons });
    setShowCourseDetail(true);
  };

  // Module CRUD
  const openNewModule = (courseId: string) => {
    setEditingModule(null);
    setSelectedModuleId(null);
    setModuleForm({ title: '', description: '' });
    setShowModuleEditor(true);
  };
  const openEditModule = (mod: Module) => {
    setEditingModule(mod);
    setModuleForm({ title: mod.title, description: mod.description || '' });
    setShowModuleEditor(true);
  };
  const saveModule = async () => {
    if (!moduleForm.title.trim() || !selectedCourse) return;
    if (editingModule) {
      await supabase.from('course_modules').update({ title: moduleForm.title, description: moduleForm.description || null }).eq('id', editingModule.id);
    } else {
      const maxOrder = (selectedCourse.modules || []).length;
      await supabase.from('course_modules').insert({ course_id: selectedCourse.id, title: moduleForm.title, description: moduleForm.description || null, sort_order: maxOrder });
    }
    setShowModuleEditor(false);
    openCourseDetail(selectedCourse);
    toast({ title: t('moduleSaved') || 'Módulo guardado' });
  };
  const deleteModule = async (id: string) => {
    await supabase.from('course_modules').delete().eq('id', id);
    if (selectedCourse) openCourseDetail(selectedCourse);
    toast({ title: t('moduleDeleted') || 'Módulo eliminado' });
  };

  // Lesson CRUD
  const openNewLesson = (moduleId: string) => {
    setEditingLesson(null);
    setSelectedModuleId(moduleId);
    setLessonForm({ title: '', description: '', video_url: '', duration_minutes: 0, is_free: false });
    setShowLessonEditor(true);
  };
  const openEditLesson = (lesson: Lesson) => {
    setEditingLesson(lesson);
    setSelectedModuleId(lesson.module_id);
    setLessonForm({ title: lesson.title, description: lesson.description || '', video_url: lesson.video_url || '', duration_minutes: lesson.duration_minutes || 0, is_free: lesson.is_free });
    setShowLessonEditor(true);
  };
  const saveLesson = async () => {
    if (!lessonForm.title.trim() || !selectedModuleId) return;
    const payload = {
      title: lessonForm.title,
      description: lessonForm.description || null,
      video_url: lessonForm.video_url || null,
      duration_minutes: lessonForm.duration_minutes || 0,
      is_free: lessonForm.is_free,
    };
    if (editingLesson) {
      await supabase.from('course_lessons').update(payload).eq('id', editingLesson.id);
    } else {
      const mod = selectedCourse?.modules?.find(m => m.id === selectedModuleId);
      const maxOrder = (mod?.lessons || []).length;
      await supabase.from('course_lessons').insert({ ...payload, module_id: selectedModuleId, sort_order: maxOrder || 0 });
    }
    setShowLessonEditor(false);
    if (selectedCourse) openCourseDetail(selectedCourse);
    toast({ title: t('lessonSaved') || 'Aula guardada' });
  };
  const deleteLesson = async (id: string) => {
    await supabase.from('course_lessons').delete().eq('id', id);
    if (selectedCourse) openCourseDetail(selectedCourse);
    toast({ title: t('lessonDeleted') || 'Aula eliminada' });
  };

  // Students
  const openStudentList = async (courseId: string) => {
    const { data } = await supabase
      .from('course_enrollments')
      .select('*, profiles!course_enrollments_user_id_fkey(display_name, email, company_name)')
      .eq('course_id', courseId);

    // If the join doesn't work, fetch profiles separately
    if (data) {
      const enriched: Enrollment[] = [];
      for (const e of data) {
        let profile = (e as any).profiles;
        if (!profile) {
          const { data: p } = await supabase.from('profiles').select('display_name, email, company_name').eq('user_id', e.user_id).single();
          profile = p;
        }
        enriched.push({ id: e.id, user_id: e.user_id, enrolled_at: e.enrolled_at, profile });
      }
      setStudents(enriched);
    } else {
      setStudents([]);
    }
    setShowStudentList(true);
  };

  const toggleModuleExpand = (id: string) => {
    setExpandedModules(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  // Filters
  const filtered = courses.filter(c => {
    if (filterStatus !== 'all' && c.status !== filterStatus) return false;
    if (filterCategory !== 'all' && c.category_id !== filterCategory) return false;
    if (search) {
      const s = search.toLowerCase();
      return c.title.toLowerCase().includes(s) || (c.description || '').toLowerCase().includes(s) || (c.category?.name || '').toLowerCase().includes(s);
    }
    return true;
  });

  const totalLessons = (course: Course) => (course.modules || []).reduce((sum, m) => sum + m.lessons.length, 0);

  return (
    <div>
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-display font-bold text-foreground">{t('manageCourses')}</h2>
          <p className="text-sm text-muted-foreground">{t('adminCoursesDesc')}</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={openNewCategory} className="gap-2">
            <Tag className="w-4 h-4" /> {t('manageCategories') || 'Categorías'}
          </Button>
          <Button onClick={openNewCourse} className="gap-2">
            <Plus className="w-4 h-4" /> {t('addCourse')}
          </Button>
        </div>
      </div>

      {/* Search & Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input placeholder={t('searchCourses')} value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-secondary border-border" />
        </div>
        <Select value={filterStatus} onValueChange={(v: any) => setFilterStatus(v)}>
          <SelectTrigger className="w-[140px] bg-secondary border-border">
            <Filter className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allFilter') || 'Todos'}</SelectItem>
            <SelectItem value="published">{t('published')}</SelectItem>
            <SelectItem value="draft">{t('draft')}</SelectItem>
          </SelectContent>
        </Select>
        <Select value={filterCategory} onValueChange={setFilterCategory}>
          <SelectTrigger className="w-[180px] bg-secondary border-border">
            <Tag className="w-4 h-4 mr-2" />
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">{t('allCategories')}</SelectItem>
            {categories.map(c => (
              <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Categories list (collapsible) */}
      {categories.length > 0 && (
        <div className="mb-6 flex flex-wrap gap-2">
          {categories.map(cat => (
            <div key={cat.id} className="inline-flex items-center gap-1 bg-secondary rounded-lg px-3 py-1.5 text-sm border border-border">
              <Tag className="w-3 h-3 text-primary" />
              <span className="text-foreground">{cat.name}</span>
              <button onClick={() => openEditCategory(cat)} className="ml-1 text-muted-foreground hover:text-foreground">
                <Edit className="w-3 h-3" />
              </button>
              <button onClick={() => deleteCategory(cat.id)} className="text-muted-foreground hover:text-destructive">
                <X className="w-3 h-3" />
              </button>
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
            <div key={course.id} className="bg-card rounded-xl border border-border p-5 flex flex-col md:flex-row md:items-center gap-4">
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 mb-1">
                  <p className="font-display font-semibold text-foreground truncate">{course.title}</p>
                  <Badge variant={course.status === 'published' ? 'default' : 'secondary'}
                    className={course.status === 'published' ? 'bg-green-500/10 text-green-500 border-green-500/20' : ''}>
                    {course.status === 'published' ? t('published') : t('draft')}
                  </Badge>
                </div>
                <p className="text-sm text-muted-foreground truncate">{course.description}</p>
                <div className="flex gap-4 mt-1 text-xs text-muted-foreground">
                  {course.category && <span className="flex items-center gap-1"><Tag className="w-3 h-3" />{course.category.name}</span>}
                  <span>{course.enrollment_count} {t('students')}</span>
                </div>
              </div>
              <div className="flex items-center gap-1 shrink-0">
                <Button variant="ghost" size="sm" onClick={() => openStudentList(course.id)} title={t('students')}>
                  <Users className="w-4 h-4" />
                  <span className="ml-1 text-xs">{course.enrollment_count}</span>
                </Button>
                <Button variant="ghost" size="sm" onClick={() => openCourseDetail(course)} title={t('viewDetails')}>
                  <Eye className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => confirmToggleStatus(course.id, course.status)} title={course.status === 'published' ? t('deactivate') : t('activate')}>
                  {course.status === 'published' ? <ToggleRight className="w-4 h-4 text-green-500" /> : <ToggleLeft className="w-4 h-4" />}
                </Button>
                <Button variant="ghost" size="sm" onClick={() => openEditCourse(course)}>
                  <Edit className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => deleteCourse(course.id)} className="text-destructive hover:text-destructive">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            </div>
          ))}
          {filtered.length === 0 && <p className="text-center py-12 text-muted-foreground">{t('noCoursesFound')}</p>}
        </div>
      )}

      {/* Course Editor Dialog */}
      <Dialog open={showCourseEditor} onOpenChange={setShowCourseEditor}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">{editingCourse ? t('editCourse') : t('addCourse')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('courseTitle')}</label>
              <Input value={courseForm.title} onChange={e => setCourseForm(f => ({ ...f, title: e.target.value }))} className="bg-secondary border-border" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('courseDescription')}</label>
              <Textarea value={courseForm.description} onChange={e => setCourseForm(f => ({ ...f, description: e.target.value }))} className="bg-secondary border-border" rows={3} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('courseCategory')}</label>
              <Select value={courseForm.category_id || 'none'} onValueChange={v => setCourseForm(f => ({ ...f, category_id: v === 'none' ? '' : v }))}>
                <SelectTrigger className="bg-secondary border-border">
                  <SelectValue placeholder={t('courseCategory')} />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="none">—</SelectItem>
                  {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <Button onClick={saveCourse} className="w-full">{t('save')}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Category Editor Dialog */}
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

      {/* Course Detail with Modules & Lessons */}
      <Dialog open={showCourseDetail} onOpenChange={setShowCourseDetail}>
        <DialogContent className="bg-card border-border max-w-2xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <BookOpen className="w-5 h-5 text-primary" />
              {selectedCourse?.title}
            </DialogTitle>
            <DialogDescription>{selectedCourse?.description}</DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display font-semibold text-foreground">{t('modules') || 'Módulos'}</h3>
              <Button size="sm" variant="outline" onClick={() => openNewModule(selectedCourse?.id || '')} className="gap-1">
                <FolderPlus className="w-4 h-4" /> {t('addModule') || 'Agregar Módulo'}
              </Button>
            </div>

            {(selectedCourse?.modules || []).length === 0 && (
              <p className="text-sm text-muted-foreground text-center py-6">{t('noModules') || 'No hay módulos. Agrega uno para empezar.'}</p>
            )}

            {(selectedCourse?.modules || []).map((mod, mi) => (
              <div key={mod.id} className="border border-border rounded-lg overflow-hidden">
                <button
                  onClick={() => toggleModuleExpand(mod.id)}
                  className="w-full flex items-center justify-between px-4 py-3 bg-secondary/50 hover:bg-secondary text-left"
                >
                  <div className="flex items-center gap-2">
                    {expandedModules.has(mod.id) ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                    <span className="font-medium text-foreground text-sm">{mi + 1}. {mod.title}</span>
                    <Badge variant="secondary" className="text-xs">{mod.lessons.length} {t('lessons')}</Badge>
                  </div>
                  <div className="flex gap-1">
                    <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); openEditModule(mod); }}>
                      <Edit className="w-3 h-3" />
                    </Button>
                    <Button variant="ghost" size="sm" onClick={e => { e.stopPropagation(); deleteModule(mod.id); }} className="text-destructive">
                      <Trash2 className="w-3 h-3" />
                    </Button>
                  </div>
                </button>

                {expandedModules.has(mod.id) && (
                  <div className="p-3 space-y-2">
                    {mod.lessons.map((lesson, li) => (
                      <div key={lesson.id} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-background border border-border/50">
                        <Video className="w-4 h-4 text-muted-foreground shrink-0" />
                        <div className="flex-1 min-w-0">
                          <p className="text-sm font-medium text-foreground truncate">{li + 1}. {lesson.title}</p>
                          <div className="flex gap-2 text-xs text-muted-foreground">
                            {lesson.duration_minutes ? <span>{lesson.duration_minutes} min</span> : null}
                            {lesson.is_free && <Badge variant="secondary" className="text-xs py-0">{t('free') || 'Gratis'}</Badge>}
                          </div>
                        </div>
                        <Button variant="ghost" size="sm" onClick={() => openEditLesson(lesson)}>
                          <Edit className="w-3 h-3" />
                        </Button>
                        <Button variant="ghost" size="sm" onClick={() => deleteLesson(lesson.id)} className="text-destructive">
                          <Trash2 className="w-3 h-3" />
                        </Button>
                      </div>
                    ))}
                    <Button size="sm" variant="ghost" onClick={() => openNewLesson(mod.id)} className="gap-1 w-full text-primary">
                      <FilePlus className="w-4 h-4" /> {t('addLesson') || 'Agregar Aula'}
                    </Button>
                  </div>
                )}
              </div>
            ))}
          </div>
        </DialogContent>
      </Dialog>

      {/* Module Editor */}
      <Dialog open={showModuleEditor} onOpenChange={setShowModuleEditor}>
        <DialogContent className="bg-card border-border max-w-sm">
          <DialogHeader>
            <DialogTitle className="font-display">{editingModule ? (t('editModule') || 'Editar Módulo') : (t('addModule') || 'Agregar Módulo')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('moduleTitle') || 'Título del módulo'}</label>
              <Input value={moduleForm.title} onChange={e => setModuleForm(f => ({ ...f, title: e.target.value }))} className="bg-secondary border-border" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('courseDescription')}</label>
              <Input value={moduleForm.description} onChange={e => setModuleForm(f => ({ ...f, description: e.target.value }))} className="bg-secondary border-border" />
            </div>
            <Button onClick={saveModule} className="w-full">{t('save')}</Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Lesson Editor */}
      <Dialog open={showLessonEditor} onOpenChange={setShowLessonEditor}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display">{editingLesson ? (t('editLesson') || 'Editar Aula') : (t('addLesson') || 'Agregar Aula')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('lessonTitle') || 'Título de la aula'}</label>
              <Input value={lessonForm.title} onChange={e => setLessonForm(f => ({ ...f, title: e.target.value }))} className="bg-secondary border-border" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('courseDescription')}</label>
              <Textarea value={lessonForm.description} onChange={e => setLessonForm(f => ({ ...f, description: e.target.value }))} className="bg-secondary border-border" rows={2} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('videoUrl') || 'URL del video'}</label>
              <Input value={lessonForm.video_url} onChange={e => setLessonForm(f => ({ ...f, video_url: e.target.value }))} className="bg-secondary border-border" placeholder="https://..." />
            </div>
            <div className="flex gap-4">
              <div className="flex-1">
                <label className="text-sm text-muted-foreground mb-1 block">{t('duration') || 'Duración (min)'}</label>
                <Input type="number" value={lessonForm.duration_minutes} onChange={e => setLessonForm(f => ({ ...f, duration_minutes: parseInt(e.target.value) || 0 }))} className="bg-secondary border-border" />
              </div>
              <div className="flex items-center gap-2 pt-5">
                <Switch checked={lessonForm.is_free} onCheckedChange={v => setLessonForm(f => ({ ...f, is_free: v }))} />
                <label className="text-sm text-muted-foreground">{t('free') || 'Gratis'}</label>
              </div>
            </div>
            <Button onClick={saveLesson} className="w-full">{t('save')}</Button>
          </div>
        </DialogContent>
      </Dialog>

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
    </div>
  );
};

export default AdminCourses;
