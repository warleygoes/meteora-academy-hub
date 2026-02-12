import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';
import { motion } from 'framer-motion';
import { BookOpen, Users, Clock } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

interface CourseWithMeta {
  id: string;
  title: string;
  description: string | null;
  thumbnail_url: string | null;
  thumbnail_vertical_url: string | null;
  category_id: string | null;
  category_name?: string;
  lesson_count: number;
  enrollment_count: number;
}

const CoursesPage: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<CourseWithMeta[]>([]);
  const [categories, setCategories] = useState<{ id: string; name: string }[]>([]);
  const [activeCategory, setActiveCategory] = useState('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetch = async () => {
      const [{ data: coursesData }, { data: catsData }, { data: enrollments }, { data: lessons }] = await Promise.all([
        supabase.from('courses').select('*, course_categories(name)').eq('status', 'published').order('sort_order'),
        supabase.from('course_categories').select('id, name').order('name'),
        supabase.from('course_enrollments').select('course_id'),
        supabase.from('course_lessons').select('id, module_id, course_modules!inner(course_id)'),
      ]);

      const enrollCount: Record<string, number> = {};
      enrollments?.forEach((e: any) => { enrollCount[e.course_id] = (enrollCount[e.course_id] || 0) + 1; });

      const lessonCount: Record<string, number> = {};
      lessons?.forEach((l: any) => {
        const cid = l.course_modules?.course_id;
        if (cid) lessonCount[cid] = (lessonCount[cid] || 0) + 1;
      });

      setCourses((coursesData || []).map((c: any) => ({
        ...c,
        category_name: c.course_categories?.name,
        lesson_count: lessonCount[c.id] || 0,
        enrollment_count: enrollCount[c.id] || 0,
      })));
      setCategories(catsData || []);
      setLoading(false);
    };
    fetch();
  }, []);

  const filtered = activeCategory === 'all' ? courses : courses.filter(c => c.category_id === activeCategory);

  if (loading) return <div className="flex items-center justify-center min-h-[40vh] text-muted-foreground">{t('loading')}...</div>;

  return (
    <div className="px-6 md:px-12 py-8">
      <h1 className="text-3xl font-display font-bold mb-6">{t('courses')}</h1>

      <div className="flex gap-2 mb-8 flex-wrap">
        <button onClick={() => setActiveCategory('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeCategory === 'all' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>
          {t('allCategories')}
        </button>
        {categories.map(cat => (
          <button key={cat.id} onClick={() => setActiveCategory(cat.id)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeCategory === cat.id ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>
            {cat.name}
          </button>
        ))}
      </div>

      <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5" layout>
        {filtered.map((course, i) => (
          <motion.div key={course.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            onClick={() => navigate(`/app/courses/${course.id}`)}
            className="cursor-pointer group bg-card rounded-xl border border-border overflow-hidden hover:border-primary/40 transition-colors">
            {course.thumbnail_url ? (
              <div className="aspect-video bg-secondary overflow-hidden">
                <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </div>
            ) : (
              <div className="aspect-video bg-secondary flex items-center justify-center">
                <BookOpen className="w-10 h-10 text-muted-foreground" />
              </div>
            )}
            <div className="p-4 space-y-2">
              {course.category_name && <Badge variant="secondary" className="text-xs">{course.category_name}</Badge>}
              <h3 className="font-display font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">{course.title}</h3>
              {course.description && <p className="text-xs text-muted-foreground line-clamp-2">{course.description}</p>}
              <div className="flex gap-3 text-xs text-muted-foreground pt-1">
                <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{course.lesson_count} {t('lessons')}</span>
                <span className="flex items-center gap-1"><Users className="w-3 h-3" />{course.enrollment_count} {t('students')}</span>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      {filtered.length === 0 && <p className="text-center py-12 text-muted-foreground">{t('noCoursesFound')}</p>}
    </div>
  );
};

export default CoursesPage;
