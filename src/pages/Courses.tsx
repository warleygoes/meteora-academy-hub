import React, { useState } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { useContentProducts } from '@/hooks/useContentProducts';
import { motion } from 'framer-motion';
import { BookOpen, Users } from 'lucide-react';
import { Badge } from '@/components/ui/badge';

const CoursesPage: React.FC = () => {
  const { t } = useLanguage();
  const navigate = useNavigate();
  const { products, loading } = useContentProducts();
  const [activeCategory, setActiveCategory] = useState('all');

  // Extract unique categories
  const categories = Array.from(
    new Map(
      products
        .filter(p => p.category_name)
        .map(p => [p.category_name!, p.category_name!])
    ).entries()
  ).map(([name]) => name);

  const filtered = activeCategory === 'all'
    ? products
    : products.filter(p => p.category_name === activeCategory);

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
          <button key={cat} onClick={() => setActiveCategory(cat)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeCategory === cat ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>
            {cat}
          </button>
        ))}
      </div>

      <motion.div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-5" layout>
        {filtered.map((product, i) => (
          <motion.div key={product.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            onClick={() => product.course_id ? navigate(`/app/courses/${product.course_id}`) : null}
            className="cursor-pointer group bg-card rounded-xl border border-border overflow-hidden hover:border-primary/40 transition-colors">
            {product.thumbnail_url ? (
              <div className="aspect-video bg-secondary overflow-hidden">
                <img src={product.thumbnail_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform" />
              </div>
            ) : (
              <div className="aspect-video bg-secondary flex items-center justify-center">
                <BookOpen className="w-10 h-10 text-muted-foreground" />
              </div>
            )}
            <div className="p-4 space-y-2">
              {product.category_name && <Badge variant="secondary" className="text-xs">{product.category_name}</Badge>}
              <h3 className="font-display font-semibold text-foreground group-hover:text-primary transition-colors line-clamp-2">{product.name}</h3>
              {product.description && <p className="text-xs text-muted-foreground line-clamp-2">{product.description}</p>}
              <div className="flex gap-3 text-xs text-muted-foreground pt-1">
                {product.lesson_count > 0 && (
                  <span className="flex items-center gap-1"><BookOpen className="w-3 h-3" />{product.lesson_count} {t('lessons')}</span>
                )}
                {product.enrollment_count > 0 && (
                  <span className="flex items-center gap-1"><Users className="w-3 h-3" />{product.enrollment_count} {t('students')}</span>
                )}
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
