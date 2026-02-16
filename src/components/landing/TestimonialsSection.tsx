import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Play, ChevronLeft, ChevronRight, ArrowRight, Quote, Globe, Users } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Link } from 'react-router-dom';
import { supabase } from '@/integrations/supabase/client';

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: "easeOut" as const },
  }),
};

interface Testimonial {
  id: string;
  video_url: string | null;
  person_name: string;
  role: string | null;
  country: string | null;
  isp_size: string | null;
  result_text: string | null;
}

const VideoCard: React.FC<{ testimonial: Testimonial; featured?: boolean }> = ({ testimonial, featured = false }) => {
  const [playing, setPlaying] = useState(false);

  const getEmbedUrl = (url: string) => {
    // YouTube
    const ytMatch = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?/]+)/);
    if (ytMatch) return `https://www.youtube.com/embed/${ytMatch[1]}?autoplay=1`;
    // Vimeo
    const vimeoMatch = url.match(/vimeo\.com\/(\d+)/);
    if (vimeoMatch) return `https://player.vimeo.com/video/${vimeoMatch[1]}?autoplay=1`;
    return url;
  };

  return (
    <div className={`relative rounded-2xl overflow-hidden bg-card border border-border group ${featured ? 'col-span-1' : ''}`}>
      <div className={`relative ${featured ? 'aspect-video' : 'aspect-video'} bg-secondary`}>
        {playing && testimonial.video_url ? (
          <iframe
            src={getEmbedUrl(testimonial.video_url)}
            className="w-full h-full"
            allow="autoplay; encrypted-media"
            allowFullScreen
          />
        ) : (
          <button onClick={() => testimonial.video_url && setPlaying(true)} className="w-full h-full flex items-center justify-center bg-gradient-to-br from-background/80 to-background/40 hover:from-background/60 hover:to-background/20 transition-all">
            <div className="w-16 h-16 rounded-full bg-primary/90 flex items-center justify-center shadow-lg shadow-primary/30 group-hover:scale-110 transition-transform">
              <Play className="w-7 h-7 text-primary-foreground ml-1" />
            </div>
          </button>
        )}
      </div>
      <div className="p-5">
        {testimonial.result_text && (
          <p className="text-sm text-foreground leading-relaxed mb-4 italic">
            "{testimonial.result_text}"
          </p>
        )}
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-full bg-primary/10 flex items-center justify-center">
            <span className="text-primary font-bold text-sm">{testimonial.person_name.charAt(0)}</span>
          </div>
          <div>
            <p className="text-sm font-semibold text-foreground">— {testimonial.person_name}</p>
            <p className="text-xs text-muted-foreground">
              {[testimonial.role, testimonial.isp_size && `${testimonial.isp_size}`, testimonial.country].filter(Boolean).join(' | ')}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

const TestimonialsSection: React.FC = () => {
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [page, setPage] = useState(0);

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('testimonials')
        .select('id, video_url, person_name, role, country, isp_size, result_text')
        .eq('active', true)
        .contains('destinations', ['home'])
        .order('sort_order');
      setTestimonials((data || []) as Testimonial[]);
    };
    fetch();
  }, []);

  if (testimonials.length === 0) return null;

  const perPage = 3;
  const totalPages = Math.ceil(testimonials.length / perPage);
  const showArrows = testimonials.length > perPage;
  const visibleItems = testimonials.slice(page * perPage, page * perPage + perPage);

  const prev = () => setPage(p => (p - 1 + totalPages) % totalPages);
  const next = () => setPage(p => (p + 1) % totalPages);

  return (
    <section className="py-24 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Title */}
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
          <span className="text-primary text-sm font-semibold uppercase tracking-wider">Prova Social</span>
          <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mt-3">
            Esto no es teoría.
          </h2>
          <p className="text-xl md:text-2xl font-display text-muted-foreground mt-2">
            Son ISPs reales que ya estructuraron su crecimiento.
          </p>
        </motion.div>

        {/* Video Carousel - 3 per page */}
        <div className="relative mb-12">
          {showArrows && (
            <button onClick={prev} className="absolute -left-4 md:-left-6 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors">
              <ChevronLeft className="w-5 h-5" />
            </button>
          )}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {visibleItems.map((t, i) => (
              <motion.div key={t.id} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}>
                <VideoCard testimonial={t} featured />
              </motion.div>
            ))}
          </div>
          {showArrows && (
            <button onClick={next} className="absolute -right-4 md:-right-6 top-1/2 -translate-y-1/2 z-10 w-10 h-10 rounded-full bg-card border border-border flex items-center justify-center text-muted-foreground hover:text-foreground hover:border-primary/50 transition-colors">
              <ChevronRight className="w-5 h-5" />
            </button>
          )}
        </div>

        {/* Page dots */}
        {totalPages > 1 && (
          <div className="flex justify-center gap-2 mb-12">
            {Array.from({ length: totalPages }).map((_, i) => (
              <button key={i} onClick={() => setPage(i)} className={`w-2 h-2 rounded-full transition-colors ${i === page ? 'bg-primary' : 'bg-border'}`} />
            ))}
          </div>
        )}

        {/* Stats bar */}
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-10">
          <p className="text-lg text-muted-foreground font-medium">
            <span className="text-primary font-bold text-2xl">600+</span> ISPs en <span className="text-primary font-bold text-2xl">16</span> países ya comenzaron a estructurar su crecimiento.
          </p>
        </motion.div>

        {/* Transition + CTA */}
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center">
          <p className="text-2xl md:text-3xl font-display font-bold text-foreground mb-8">
            Si ellos pudieron estructurar su ISP,<br />
            <span className="text-primary">tú también puedes.</span>
          </p>
          <Link to="/diagnostico">
            <Button size="lg" className="glow-primary font-bold gap-2 text-base px-8">
              <ArrowRight className="w-5 h-5" /> Hacer Evaluación Estratégica
            </Button>
          </Link>
        </motion.div>
      </div>
    </section>
  );
};

export default TestimonialsSection;
