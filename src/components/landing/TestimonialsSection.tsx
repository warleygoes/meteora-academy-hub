import React, { useState, useEffect, useRef } from 'react';
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
  const scrollRef = useRef<HTMLDivElement>(null);

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

  const featured = testimonials.slice(0, 3);
  const carousel = testimonials.slice(3);

  const scroll = (dir: 'left' | 'right') => {
    scrollRef.current?.scrollBy({ left: dir === 'left' ? -340 : 340, behavior: 'smooth' });
  };

  if (testimonials.length === 0) return null;

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

        {/* Part 1: 3 Featured Videos */}
        {featured.length > 0 && (
          <div className="grid md:grid-cols-3 gap-6 mb-12">
            {featured.map((t, i) => (
              <motion.div key={t.id} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}>
                <VideoCard testimonial={t} featured />
              </motion.div>
            ))}
          </div>
        )}

        {/* Part 2: Carousel */}
        {carousel.length > 0 && (
          <div className="relative mb-12 group/carousel">
            <button onClick={() => scroll('left')} className="absolute left-0 top-0 bottom-0 z-10 w-12 flex items-center justify-center bg-gradient-to-r from-background to-transparent opacity-0 group-hover/carousel:opacity-100 transition-opacity">
              <ChevronLeft className="w-6 h-6 text-foreground" />
            </button>
            <div ref={scrollRef} className="flex gap-6 overflow-x-auto scrollbar-hide pb-4 px-1">
              {carousel.map(t => (
                <div key={t.id} className="flex-shrink-0 w-[320px]">
                  <VideoCard testimonial={t} />
                </div>
              ))}
            </div>
            <button onClick={() => scroll('right')} className="absolute right-0 top-0 bottom-0 z-10 w-12 flex items-center justify-center bg-gradient-to-l from-background to-transparent opacity-0 group-hover/carousel:opacity-100 transition-opacity">
              <ChevronRight className="w-6 h-6 text-foreground" />
            </button>
          </div>
        )}

        {/* Stats bar */}
        <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-10">
          <p className="text-lg text-muted-foreground font-medium">
            <span className="text-primary font-bold text-2xl">600+</span> ISPs en <span className="text-primary font-bold text-2xl">16</span> países ya comenzaron a estructurar su crecimiento.
          </p>
        </motion.div>

        {/* Part 3: Transition + CTA */}
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
