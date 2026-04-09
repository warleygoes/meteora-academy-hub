import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { ArrowLeft, Users, BookOpen } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { motion } from 'framer-motion';
import CourseCommunityFeed from '@/components/community/CourseCommunityFeed';

interface CourseInfo {
  id: string;
  title: string;
  thumbnail_url: string | null;
  description: string | null;
  post_count?: number;
}

const CommunityPage: React.FC = () => {
  const { courseId } = useParams<{ courseId: string }>();
  const { t } = useLanguage();
  const navigate = useNavigate();
  const [courses, setCourses] = useState<CourseInfo[]>([]);
  const [selectedCourse, setSelectedCourse] = useState<CourseInfo | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCourses = async () => {
      setLoading(true);
      const { data } = await supabase
        .from('courses')
        .select('id, title, thumbnail_url, description')
        .eq('status', 'published')
        .order('sort_order');

      if (data && data.length > 0) {
        // Get post counts per course
        const courseIds = data.map(c => c.id);
        const { data: postCounts } = await supabase
          .from('community_posts')
          .select('course_id')
          .in('course_id', courseIds);

        const countMap: Record<string, number> = {};
        (postCounts || []).forEach(p => {
          countMap[p.course_id] = (countMap[p.course_id] || 0) + 1;
        });

        const enriched = data.map(c => ({ ...c, post_count: countMap[c.id] || 0 }));
        setCourses(enriched);

        // If courseId param, select that course
        if (courseId) {
          const found = enriched.find(c => c.id === courseId);
          if (found) setSelectedCourse(found);
        }
      }
      setLoading(false);
    };
    fetchCourses();
  }, [courseId]);

  // When navigating to a course community via param
  useEffect(() => {
    if (courseId && courses.length > 0) {
      const found = courses.find(c => c.id === courseId);
      if (found) setSelectedCourse(found);
    }
  }, [courseId, courses]);

  const handleSelectCourse = (course: CourseInfo) => {
    setSelectedCourse(course);
    navigate(`/app/community/${course.id}`, { replace: true });
  };

  const handleBack = () => {
    setSelectedCourse(null);
    navigate('/app/community', { replace: true });
  };

  if (loading) {
    return <div className="flex items-center justify-center min-h-[40vh] text-muted-foreground">{t('loading')}...</div>;
  }

  // Show course community feed
  if (selectedCourse) {
    return (
      <div className="px-6 md:px-12 py-8">
        <div className="flex items-center gap-3 mb-6">
          <Button variant="ghost" size="sm" onClick={handleBack} className="h-8 px-2">
            <ArrowLeft className="w-4 h-4" />
          </Button>
          <div className="flex items-center gap-3">
            {selectedCourse.thumbnail_url && (
              <img src={selectedCourse.thumbnail_url} alt="" className="w-10 h-10 rounded-lg object-cover" />
            )}
            <div>
              <h1 className="text-xl font-display font-bold text-foreground">{selectedCourse.title}</h1>
              <p className="text-xs text-muted-foreground">{t('community')}</p>
            </div>
          </div>
        </div>
        <CourseCommunityFeed courseId={selectedCourse.id} courseTitle={selectedCourse.title} />
      </div>
    );
  }

  // Show course selector
  return (
    <div className="px-6 md:px-12 py-8">
      <h1 className="text-3xl font-display font-bold mb-2">{t('communityTitle')}</h1>
      <p className="text-muted-foreground mb-8">{t('communitySubtitle')}</p>

      {courses.length === 0 ? (
        <p className="text-center py-12 text-muted-foreground">No hay comunidades disponibles</p>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
          {courses.map((course, i) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={() => handleSelectCourse(course)}
              className="cursor-pointer group bg-card rounded-xl border border-border overflow-hidden hover:border-primary/40 transition-colors"
            >
              {course.thumbnail_url ? (
                <div className="aspect-video bg-secondary overflow-hidden">
                  <img src={course.thumbnail_url} alt={course.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
                </div>
              ) : (
                <div className="aspect-video bg-secondary flex items-center justify-center">
                  <Users className="w-10 h-10 text-muted-foreground" />
                </div>
              )}
              <div className="p-4 space-y-2">
                <h3 className="font-display font-semibold text-foreground group-hover:text-primary transition-colors">{course.title}</h3>
                {course.description && (
                  <p className="text-xs text-muted-foreground line-clamp-2">{course.description}</p>
                )}
                <div className="flex gap-3 text-xs text-muted-foreground pt-1">
                  <span className="flex items-center gap-1">
                    <BookOpen className="w-3 h-3" />
                    {course.post_count} publicaciones
                  </span>
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};

export default CommunityPage;
