import React from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { courses } from '@/lib/mockData';
import { CourseCard } from '@/components/CourseCard';
import { motion } from 'framer-motion';

const CoursesPage: React.FC = () => {
  const { t } = useLanguage();
  const categories = ['all', ...new Set(courses.map(c => c.category))];
  const [activeCategory, setActiveCategory] = React.useState('all');
  const filtered = activeCategory === 'all' ? courses : courses.filter(c => c.category === activeCategory);

  return (
    <div className="px-6 md:px-12 py-8">
      <h1 className="text-3xl font-display font-bold mb-6">{t('courses')}</h1>

      <div className="flex gap-2 mb-8 flex-wrap">
        {categories.map(cat => (
          <button
            key={cat}
            onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${
              activeCategory === cat
                ? 'bg-primary text-primary-foreground'
                : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'
            }`}
          >
            {cat === 'all' ? t('allCategories') : cat}
          </button>
        ))}
      </div>

      <motion.div
        className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5"
        layout
      >
        {filtered.map((course, i) => (
          <motion.div
            key={course.id}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.05 }}
          >
            <CourseCard course={course} />
          </motion.div>
        ))}
      </motion.div>
    </div>
  );
};

export default CoursesPage;
