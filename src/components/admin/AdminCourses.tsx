import React, { useState } from 'react';
import { BookOpen, Plus, Edit, Trash2, GripVertical, Eye } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface Course {
  id: string;
  title: string;
  description: string;
  category: string;
  lessons: number;
  students: number;
  status: 'published' | 'draft';
}

const mockCourses: Course[] = [
  { id: '1', title: 'Conceptos Avanzados en ISP', description: 'Domina los fundamentos avanzados de un proveedor de internet.', category: 'Técnico', lessons: 24, students: 312, status: 'published' },
  { id: '2', title: 'Gestión y Operación de ISP', description: 'Aprende a gestionar tu ISP de forma eficiente.', category: 'Gestión', lessons: 18, students: 245, status: 'published' },
  { id: '3', title: 'Infraestructura de Red', description: 'Planificación y dimensionamiento de infraestructura.', category: 'Técnico', lessons: 32, students: 189, status: 'published' },
  { id: '4', title: 'Marketing para ISPs', description: 'Estrategias de marketing digital para proveedores.', category: 'Marketing', lessons: 12, students: 0, status: 'draft' },
];

const AdminCourses: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [courses, setCourses] = useState<Course[]>(mockCourses);
  const [showEditor, setShowEditor] = useState(false);
  const [editingCourse, setEditingCourse] = useState<Course | null>(null);
  const [search, setSearch] = useState('');

  const [form, setForm] = useState({ title: '', description: '', category: '' });

  const openNew = () => {
    setEditingCourse(null);
    setForm({ title: '', description: '', category: '' });
    setShowEditor(true);
  };

  const openEdit = (course: Course) => {
    setEditingCourse(course);
    setForm({ title: course.title, description: course.description, category: course.category });
    setShowEditor(true);
  };

  const saveCourse = () => {
    if (!form.title.trim()) return;
    if (editingCourse) {
      setCourses(prev => prev.map(c => c.id === editingCourse.id ? { ...c, ...form } : c));
      toast({ title: 'Curso actualizado' });
    } else {
      setCourses(prev => [...prev, { id: Date.now().toString(), ...form, lessons: 0, students: 0, status: 'draft' }]);
      toast({ title: 'Curso creado como borrador' });
    }
    setShowEditor(false);
  };

  const deleteCourse = (id: string) => {
    setCourses(prev => prev.filter(c => c.id !== id));
    toast({ title: 'Curso eliminado' });
  };

  const toggleStatus = (id: string) => {
    setCourses(prev => prev.map(c => c.id === id ? { ...c, status: c.status === 'published' ? 'draft' : 'published' } : c));
  };

  const filtered = courses.filter(c => !search || c.title.toLowerCase().includes(search.toLowerCase()) || c.category.toLowerCase().includes(search.toLowerCase()));

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-display font-bold text-foreground">{t('manageCourses')}</h2>
          <p className="text-sm text-muted-foreground">{t('adminCoursesDesc')}</p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="w-4 h-4" /> {t('addCourse')}
        </Button>
      </div>

      <div className="relative mb-6">
        <BookOpen className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input placeholder={t('searchCourses')} value={search} onChange={e => setSearch(e.target.value)} className="pl-10 bg-secondary border-border" />
      </div>

      <div className="space-y-3">
        {filtered.map(course => (
          <div key={course.id} className="bg-card rounded-xl border border-border p-5 flex flex-col md:flex-row md:items-center gap-4">
            <GripVertical className="w-4 h-4 text-muted-foreground hidden md:block cursor-grab" />
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
                <span>{course.lessons} {t('lessons')}</span>
                <span>{course.students} {t('students')}</span>
                <span>{course.category}</span>
              </div>
            </div>
            <div className="flex items-center gap-1 shrink-0">
              <Button variant="ghost" size="sm" onClick={() => toggleStatus(course.id)}>
                <Eye className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => openEdit(course)}>
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

      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">{editingCourse ? t('editCourse') : t('addCourse')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('courseTitle')}</label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="bg-secondary border-border" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('courseDescription')}</label>
              <Textarea value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="bg-secondary border-border" rows={3} />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('courseCategory')}</label>
              <Input value={form.category} onChange={e => setForm(f => ({ ...f, category: e.target.value }))} className="bg-secondary border-border" placeholder="Técnico, Gestión, Marketing..." />
            </div>
            <Button onClick={saveCourse} className="w-full">{t('save')}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminCourses;
