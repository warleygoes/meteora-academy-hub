import React from 'react';
import { HeroBanner } from '@/components/HeroBanner';
import { CourseCarousel } from '@/components/CourseCarousel';
import { useLanguage } from '@/contexts/LanguageContext';
import { courses } from '@/lib/mockData';

const Index: React.FC = () => {
  const { t } = useLanguage();

  const continueWatching = courses.filter(c => c.progress !== undefined);
  const popular = courses.filter(c => c.isTrending);
  const newCourses = courses.filter(c => c.isNew);

  return (
    <div>
      <HeroBanner />
      <div className="px-6 md:px-12 -mt-16 relative z-10 pb-12">
        {continueWatching.length > 0 && (
          <CourseCarousel title={t('continueWatching')} courses={continueWatching} />
        )}
        <CourseCarousel title={t('popularCourses')} courses={popular} />
        <CourseCarousel title={t('newReleases')} courses={newCourses} />
        <CourseCarousel title={t('recommended')} courses={courses} />
      </div>
    </div>
  );
};

export default Index;
