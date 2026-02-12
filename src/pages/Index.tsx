import React from 'react';
import { HeroBanner } from '@/components/HeroBanner';
import { CourseCarousel } from '@/components/CourseCarousel';
import { useLanguage } from '@/contexts/LanguageContext';
import { useContentProducts } from '@/hooks/useContentProducts';
import { Skeleton } from '@/components/ui/skeleton';

const Index: React.FC = () => {
  const { t } = useLanguage();
  const { products, loading } = useContentProducts();

  const continueWatching = products.filter(p => p.progress !== undefined && p.progress > 0);
  const allProducts = products;

  if (loading) {
    return (
      <div>
        <HeroBanner />
        <div className="px-6 md:px-12 -mt-16 relative z-10 pb-12 space-y-8">
          {[1, 2].map(i => (
            <div key={i}>
              <Skeleton className="h-6 w-48 mb-4" />
              <div className="flex gap-4">
                {[1, 2, 3, 4].map(j => (
                  <Skeleton key={j} className="w-[280px] h-[200px] rounded-lg flex-shrink-0" />
                ))}
              </div>
            </div>
          ))}
        </div>
      </div>
    );
  }

  return (
    <div>
      <HeroBanner />
      <div className="px-6 md:px-12 -mt-16 relative z-10 pb-12">
        {continueWatching.length > 0 && (
          <CourseCarousel title={t('continueWatching')} products={continueWatching} />
        )}
        <CourseCarousel title={t('allContent')} products={allProducts} />
      </div>
    </div>
  );
};

export default Index;
