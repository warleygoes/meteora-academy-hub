import React, { useState, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronLeft, ChevronRight, ExternalLink } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useAuth } from '@/hooks/useAuth';
import { Button } from '@/components/ui/button';
import heroBannerFallback from '@/assets/hero-banner.jpg';
import meteoraLogo from '@/assets/logo-white-pink.png';
import { useLanguage } from '@/contexts/LanguageContext';

interface BannerSlide {
  id: string; title: string; subtitle: string | null; image_url: string | null;
  video_url: string | null; link_url: string | null; link_label: string | null;
  link_target: string | null;
}

export const HeroBanner: React.FC = () => {
  const { t } = useLanguage();
  const { user } = useAuth();
  const [slides, setSlides] = useState<BannerSlide[]>([]);
  const [current, setCurrent] = useState(0);
  const [loaded, setLoaded] = useState(false);

  useEffect(() => {
    const fetchBanners = async () => {
      const now = new Date().toISOString();
      let query = supabase
        .from('banners')
        .select('id, title, subtitle, image_url, video_url, link_url, link_label, link_target, segment_exclude_product_id, valid_from, valid_until')
        .eq('active', true)
        .order('sort_order');

      const { data } = await query;
      if (!data || data.length === 0) { setLoaded(true); return; }

      // Filter by date validity
      let filtered = data.filter((b: any) => {
        if (b.valid_from && new Date(b.valid_from) > new Date()) return false;
        if (b.valid_until && new Date(b.valid_until) < new Date()) return false;
        return true;
      });

      // Filter by product ownership segmentation
      if (user && filtered.some((b: any) => b.segment_exclude_product_id)) {
        const { data: userProducts } = await supabase.from('user_products').select('product_id').eq('user_id', user.id);
        const ownedIds = new Set((userProducts || []).map((up: any) => up.product_id));
        filtered = filtered.filter((b: any) => !b.segment_exclude_product_id || !ownedIds.has(b.segment_exclude_product_id));
      }

      setSlides(filtered);
      setLoaded(true);
    };
    fetchBanners();
  }, [user]);

  // Auto-advance slides
  useEffect(() => {
    if (slides.length <= 1) return;
    const timer = setInterval(() => setCurrent(c => (c + 1) % slides.length), 6000);
    return () => clearInterval(timer);
  }, [slides.length]);

  const goTo = (dir: 'prev' | 'next') => {
    setCurrent(c => dir === 'next' ? (c + 1) % slides.length : (c - 1 + slides.length) % slides.length);
  };

  // Fallback banner if no slides
  if (loaded && slides.length === 0) {
    return (
      <div className="relative w-full h-[60vh] min-h-[400px] overflow-hidden">
        <img src={heroBannerFallback} alt="Meteora Academy" className="absolute inset-0 w-full h-full object-cover" />
        <div className="absolute inset-0 bg-gradient-to-r from-background via-background/70 to-transparent" />
        <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/30" />
        <div className="relative z-10 flex flex-col justify-end h-full pb-20 px-8 md:px-16 max-w-3xl">
          <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ duration: 0.8 }}>
            <img src={meteoraLogo} alt="Meteora Academy" className="h-12 md:h-16 w-auto mb-4" />
            <p className="text-lg md:text-xl text-muted-foreground mb-2 font-display font-medium">{t('heroTitle')}</p>
            <p className="text-sm md:text-base text-muted-foreground mb-8 max-w-lg leading-relaxed">{t('heroSubtitle')}</p>
          </motion.div>
        </div>
      </div>
    );
  }

  if (!loaded) return <div className="w-full h-[60vh] min-h-[400px] bg-background" />;

  const slide = slides[current];

  return (
    <div className="relative w-full h-[60vh] min-h-[400px] overflow-hidden group">
      <AnimatePresence mode="wait">
        <motion.div
          key={slide.id}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5 }}
          className="absolute inset-0"
        >
          {slide.video_url ? (
            <video src={slide.video_url} autoPlay muted loop playsInline className="absolute inset-0 w-full h-full object-cover" />
          ) : slide.image_url ? (
            <img src={slide.image_url} alt={slide.title} className="absolute inset-0 w-full h-full object-cover" />
          ) : (
            <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-background" />
          )}
        </motion.div>
      </AnimatePresence>

      <div className="absolute inset-0 bg-gradient-to-r from-background via-background/60 to-transparent" />
      <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/20" />

      <div className="relative z-10 flex flex-col justify-end h-full pb-16 px-8 md:px-16 max-w-3xl">
        <AnimatePresence mode="wait">
          <motion.div key={slide.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -10 }} transition={{ duration: 0.4 }}>
            <h2 className="text-2xl md:text-4xl font-display font-bold text-foreground mb-2">{slide.title}</h2>
            {slide.subtitle && <p className="text-base md:text-lg text-muted-foreground mb-6 max-w-xl leading-relaxed">{slide.subtitle}</p>}
            {slide.link_url && (
              <a href={slide.link_url} target={slide.link_target || '_self'} rel="noopener noreferrer">
                <Button size="lg" className="gap-2">
                  {slide.link_label || 'Saiba Mais'}
                  {slide.link_target === '_blank' && <ExternalLink className="w-4 h-4" />}
                </Button>
              </a>
            )}
          </motion.div>
        </AnimatePresence>
      </div>

      {/* Navigation arrows */}
      {slides.length > 1 && (
        <>
          <button onClick={() => goTo('prev')} className="absolute left-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-background/50 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronLeft className="w-5 h-5 text-foreground" />
          </button>
          <button onClick={() => goTo('next')} className="absolute right-4 top-1/2 -translate-y-1/2 z-20 w-10 h-10 rounded-full bg-background/50 backdrop-blur flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
            <ChevronRight className="w-5 h-5 text-foreground" />
          </button>
          {/* Dots */}
          <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 flex gap-2">
            {slides.map((_, i) => (
              <button key={i} onClick={() => setCurrent(i)} className={`w-2 h-2 rounded-full transition-all ${i === current ? 'bg-primary w-6' : 'bg-foreground/30'}`} />
            ))}
          </div>
        </>
      )}
    </div>
  );
};
