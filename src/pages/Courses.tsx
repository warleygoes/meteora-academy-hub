import React, { useState, useEffect } from 'react';
import { useLanguage } from '@/contexts/LanguageContext';
import { useNavigate } from 'react-router-dom';
import { useContentProducts } from '@/hooks/useContentProducts';
import { useTranslateCategory } from '@/hooks/useTranslateCategory';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { motion } from 'framer-motion';
import { BookOpen, Users, ExternalLink } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';

const PRODUCT_TYPE_LABELS: Record<string, Record<string, string>> = {
  es: { course: 'Cursos', service: 'Servicios', consultation: 'Consultorías', implementation: 'Implementaciones', virtual_event: 'Eventos Virtuales', in_person_event: 'Eventos Presenciales', saas: 'SaaS' },
  pt: { course: 'Cursos', service: 'Serviços', consultation: 'Consultorias', implementation: 'Implementações', virtual_event: 'Eventos Virtuais', in_person_event: 'Eventos Presenciais', saas: 'SaaS' },
  en: { course: 'Courses', service: 'Services', consultation: 'Consultations', implementation: 'Implementations', virtual_event: 'Virtual Events', in_person_event: 'In-Person Events', saas: 'SaaS' },
};

const CoursesPage: React.FC = () => {
  const { t, language } = useLanguage();
  const navigate = useNavigate();
  const { products, loading } = useContentProducts();
  const { translateText } = useTranslateCategory();
  const { user } = useAuth();
  const [activeCategory, setActiveCategory] = useState('all');
  const [activeType, setActiveType] = useState('all');
  const [allCategories, setAllCategories] = useState<{ id: string; name: string; translatedName?: string }[]>([]);
  const [accessibleProductIds, setAccessibleProductIds] = useState<Set<string> | null>(null);

  useEffect(() => {
    const fetchCategories = async () => {
      const { data } = await supabase.from('course_categories').select('id, name').order('name');
      if (data) {
        setAllCategories(data.map(c => ({ ...c, translatedName: undefined })));
        if (language !== 'es') {
          const translated = await Promise.all(data.map(async c => ({
            ...c,
            translatedName: await translateText(c.name),
          })));
          setAllCategories(translated);
        }
      }
    };
    fetchCategories();
  }, [language, translateText]);

  // Fetch accessible product IDs for current user
  useEffect(() => {
    if (!user) return;
    const fetchAccess = async () => {
      const accessSet = new Set<string>();

      // Direct product access
      const { data: userProducts } = await supabase.from('user_products').select('product_id').eq('user_id', user.id);
      (userProducts || []).forEach(d => accessSet.add(d.product_id));

      // Package-based access
      const { data: userPlans } = await supabase.from('user_plans').select('package_id').eq('user_id', user.id).eq('status', 'active');
      const packageIds = (userPlans || []).map(d => d.package_id);
      if (packageIds.length > 0) {
        const { data: pkgProducts } = await supabase.from('package_products').select('product_id').in('package_id', packageIds);
        (pkgProducts || []).forEach(pp => accessSet.add(pp.product_id));
      }

      // Free products
      const { data: freeOffers } = await supabase.from('offers').select('product_id').eq('price', 0).not('product_id', 'is', null);
      (freeOffers || []).forEach(o => { if (o.product_id) accessSet.add(o.product_id); });

      setAccessibleProductIds(accessSet);
    };
    fetchAccess();
  }, [user]);

  const productTypes = [...new Set(products.map(p => p.type))];
  const typeLabels = PRODUCT_TYPE_LABELS[language] || PRODUCT_TYPE_LABELS.es;

  // Filter: only show products user has access to
  const accessibleProducts = accessibleProductIds !== null
    ? products.filter(p => accessibleProductIds.has(p.id))
    : products;

  const filtered = accessibleProducts.filter(p => {
    if (activeType !== 'all' && p.type !== activeType) return false;
    if (activeCategory !== 'all' && !(p.category_names || []).includes(activeCategory)) return false;
    return true;
  });

  if (loading || accessibleProductIds === null) return <div className="flex items-center justify-center min-h-[40vh] text-muted-foreground">{t('loading')}...</div>;

  return (
    <div className="px-6 md:px-12 py-8">
      <h1 className="text-3xl font-display font-bold mb-6">{t('myLibrary') || 'Minha Biblioteca'}</h1>

      {/* Product type filter */}
      {productTypes.length > 1 && (
        <div className="flex gap-2 mb-4 flex-wrap">
          <button onClick={() => setActiveType('all')}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeType === 'all' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>
            {t('allFilter') || 'Todos'}
          </button>
          {productTypes.map(type => (
            <button key={type} onClick={() => setActiveType(type)}
              className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeType === type ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>
              {typeLabels[type] || type}
            </button>
          ))}
        </div>
      )}

      {/* Category filter */}
      <div className="flex gap-2 mb-8 flex-wrap">
        <button onClick={() => setActiveCategory('all')}
          className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeCategory === 'all' ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>
          {t('allCategories')}
        </button>
        {allCategories.map(cat => (
          <button key={cat.id} onClick={() => setActiveCategory(cat.name)}
            className={`px-4 py-2 rounded-full text-sm font-medium transition-colors ${activeCategory === cat.name ? 'bg-primary text-primary-foreground' : 'bg-secondary text-secondary-foreground hover:bg-secondary/80'}`}>
            {cat.translatedName || cat.name}
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
              <div className="flex items-center gap-2 flex-wrap">
                <Badge variant="outline" className="text-xs">{typeLabels[product.type] || product.type}</Badge>
                {product.category_name && <Badge variant="secondary" className="text-xs">{product.category_name}</Badge>}
              </div>
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
              {product.type === 'saas' && product.saas_url && (
                <Button size="sm" variant="secondary" className="gap-1 w-full text-xs mt-2"
                  onClick={(e) => { e.stopPropagation(); window.open(product.saas_url!, '_blank', 'noopener'); }}>
                  <ExternalLink className="w-3 h-3" /> Acessar App
                </Button>
              )}
            </div>
          </motion.div>
        ))}
      </motion.div>

      {filtered.length === 0 && <p className="text-center py-12 text-muted-foreground">{t('noCoursesFound')}</p>}
    </div>
  );
};

export default CoursesPage;
