import React, { useState, useEffect } from 'react';
import { HeroBanner } from '@/components/HeroBanner';
import { CourseCarousel } from '@/components/CourseCarousel';
import { useLanguage } from '@/contexts/LanguageContext';
import { useContentProducts } from '@/hooks/useContentProducts';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { Skeleton } from '@/components/ui/skeleton';
import type { ContentProduct } from '@/lib/courseTypes';
import { logSystemEvent } from '@/lib/systemLog';

interface PackageShowcase {
  id: string;
  name: string;
  description: string | null;
  products: ContentProduct[];
}

const Index: React.FC = () => {
  const { t } = useLanguage();
  const { products, loading } = useContentProducts();
  const { user } = useAuth();
  const [packageShowcases, setPackageShowcases] = useState<PackageShowcase[]>([]);
  const [enrolledCourseIds, setEnrolledCourseIds] = useState<Set<string>>(new Set());
  const [freeProductIds, setFreeProductIds] = useState<Set<string>>(new Set());

  // Fetch packages marked with show_in_showcase
  useEffect(() => {
    const fetchPackages = async () => {
      const { data: pkgs } = await supabase
        .from('packages')
        .select('id, name, description')
        .eq('show_in_showcase', true)
        .eq('active', true);

      if (!pkgs || pkgs.length === 0) { setPackageShowcases([]); return; }

      const { data: ppData } = await supabase
        .from('package_products')
        .select('package_id, product_id, sort_order, products(id, name, description, type, thumbnail_url, thumbnail_vertical_url, course_id, saas_url, active, has_content)')
        .in('package_id', pkgs.map(p => p.id))
        .order('sort_order');

      const prodMap: Record<string, ContentProduct[]> = {};
      (ppData || []).forEach((pp: any) => {
        if (!pp.products || !pp.products.active) return;
        if (!prodMap[pp.package_id]) prodMap[pp.package_id] = [];
        prodMap[pp.package_id].push({
          id: pp.products.id,
          name: pp.products.name,
          description: pp.products.description,
          type: pp.products.type,
          thumbnail_url: pp.products.thumbnail_url,
          thumbnail_vertical_url: pp.products.thumbnail_vertical_url,
          course_id: pp.products.course_id,
          saas_url: pp.products.saas_url,
          lesson_count: 0,
          enrollment_count: 0,
        });
      });

      setPackageShowcases(
        pkgs
          .map(p => ({ id: p.id, name: p.name, description: p.description, products: prodMap[p.id] || [] }))
          .filter(p => p.products.length > 0)
      );
    };
    fetchPackages();
  }, []);

  // Fetch free product IDs
  useEffect(() => {
    const fetchFree = async () => {
      const { data } = await supabase.from('offers').select('product_id').eq('price', 0).not('product_id', 'is', null);
      setFreeProductIds(new Set((data || []).map(d => d.product_id!)));
    };
    fetchFree();
  }, []);

  // Fetch user's enrolled courses
  useEffect(() => {
    if (!user) return;
    const fetch = async () => {
      const { data } = await supabase.from('course_enrollments').select('course_id').eq('user_id', user.id);
      setEnrolledCourseIds(new Set((data || []).map(d => d.course_id)));
    };
    fetch();
  }, [user]);

  // Log page view
  useEffect(() => {
    if (user) {
      logSystemEvent({ action: 'Acceso a vitrine', entity_type: 'auth', level: 'info' });
    }
  }, [user]);

  const continueWatching = products.filter(p => p.progress !== undefined && p.progress > 0 && p.progress < 100);
  const myCourses = products.filter(p => p.course_id && enrolledCourseIds.has(p.course_id));
  const freeCourses = products.filter(p => freeProductIds.has(p.id));
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
        {myCourses.length > 0 && (
          <CourseCarousel title={t('myCourses') || 'Meus Cursos'} products={myCourses} />
        )}
        {packageShowcases.map(pkg => (
          <CourseCarousel key={pkg.id} title={`📦 ${pkg.name}`} products={pkg.products} variant="vertical" />
        ))}
        {freeCourses.length > 0 && (
          <CourseCarousel title={`🆓 ${t('freeCourses') || 'Cursos Gratuitos'}`} products={freeCourses} variant="vertical" />
        )}
        {allProducts.length > 0 && (
          <CourseCarousel title={t('recommended') || 'Recomendados'} products={allProducts} variant="vertical" />
        )}
        <CourseCarousel title={t('allContent')} products={allProducts} />
      </div>
    </div>
  );
};

export default Index;
