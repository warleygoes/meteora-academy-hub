import { useState, useEffect } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import type { ContentProduct } from '@/lib/courseTypes';

export function useContentProducts() {
  const { user } = useAuth();
  const [products, setProducts] = useState<ContentProduct[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      // Fetch products with content
      const { data: productsData } = await supabase
        .from('products')
        .select('id, name, description, type, thumbnail_url, thumbnail_vertical_url, course_id, saas_url, active, has_content, sort_order')
        .eq('has_content', true)
        .eq('active', true)
        .order('sort_order');

      if (!productsData || productsData.length === 0) {
        setProducts([]);
        setLoading(false);
        return;
      }

      // Get course IDs to fetch categories and lesson counts
      const courseIds = productsData.map(p => p.course_id).filter(Boolean) as string[];

      // Parallel fetches
      const [categoriesResult, lessonsResult, enrollmentsResult, progressResult] = await Promise.all([
        // Categories via courses
        courseIds.length > 0
          ? supabase
              .from('courses')
              .select('id, category_id, course_categories(name)')
              .in('id', courseIds)
          : Promise.resolve({ data: [] }),
        // Lesson counts per course
        courseIds.length > 0
          ? supabase
              .from('course_lessons')
              .select('id, module_id, course_modules!inner(course_id)')
          : Promise.resolve({ data: [] }),
        // Enrollment counts
        courseIds.length > 0
          ? supabase
              .from('course_enrollments')
              .select('course_id')
          : Promise.resolve({ data: [] }),
        // User progress
        user && courseIds.length > 0
          ? supabase
              .from('lesson_progress')
              .select('course_id, lesson_id, completed')
              .eq('user_id', user.id)
          : Promise.resolve({ data: [] }),
      ]);

      // Build category map
      const categoryMap: Record<string, string> = {};
      (categoriesResult.data || []).forEach((c: any) => {
        if (c.course_categories?.name) {
          categoryMap[c.id] = c.course_categories.name;
        }
      });

      // Build lesson count map
      const lessonCountMap: Record<string, number> = {};
      const lessonsByCourse: Record<string, string[]> = {};
      (lessonsResult.data || []).forEach((l: any) => {
        const cid = l.course_modules?.course_id;
        if (cid) {
          lessonCountMap[cid] = (lessonCountMap[cid] || 0) + 1;
          if (!lessonsByCourse[cid]) lessonsByCourse[cid] = [];
          lessonsByCourse[cid].push(l.id);
        }
      });

      // Build enrollment count map
      const enrollCountMap: Record<string, number> = {};
      (enrollmentsResult.data || []).forEach((e: any) => {
        enrollCountMap[e.course_id] = (enrollCountMap[e.course_id] || 0) + 1;
      });

      // Build progress map
      const completedMap: Record<string, number> = {};
      (progressResult.data || []).forEach((p: any) => {
        if (p.completed) {
          completedMap[p.course_id] = (completedMap[p.course_id] || 0) + 1;
        }
      });

      const result: ContentProduct[] = productsData.map((p) => {
        const totalLessons = p.course_id ? (lessonCountMap[p.course_id] || 0) : 0;
        const completedLessons = p.course_id ? (completedMap[p.course_id] || 0) : 0;
        const progress = totalLessons > 0 ? Math.round((completedLessons / totalLessons) * 100) : undefined;

        return {
          id: p.id,
          name: p.name,
          description: p.description,
          type: p.type,
          thumbnail_url: p.thumbnail_url,
          thumbnail_vertical_url: p.thumbnail_vertical_url,
          course_id: p.course_id,
          saas_url: p.saas_url,
          category_name: p.course_id ? categoryMap[p.course_id] : undefined,
          lesson_count: totalLessons,
          enrollment_count: p.course_id ? (enrollCountMap[p.course_id] || 0) : 0,
          progress,
        };
      });

      setProducts(result);
      setLoading(false);
    };

    fetchData();
  }, [user]);

  return { products, loading };
}
