import React, { useState, useEffect, useMemo } from 'react';
import { useParams, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowRight, CheckCircle2, XCircle, Shield, Zap, Gift, Clock, AlertTriangle, ChevronDown, Play, Star } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { supabase } from '@/integrations/supabase/client';
import meteoraLogo from '@/assets/logo-white-pink.png';

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: (i: number = 0) => ({ opacity: 1, y: 0, transition: { delay: i * 0.1, duration: 0.5, ease: 'easeOut' as const } }),
};

interface Testimonial {
  id: string; person_name: string; role: string | null; country: string | null;
  isp_size: string | null; result_text: string | null; video_url: string | null;
}

const SalesPage: React.FC = () => {
  const { slug } = useParams<{ slug: string }>();
  const [page, setPage] = useState<any>(null);
  const [testimonials, setTestimonials] = useState<Testimonial[]>([]);
  const [loading, setLoading] = useState(true);
  const [countdown, setCountdown] = useState({ days: 0, hours: 0, minutes: 0, seconds: 0 });

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase.from('product_sales_pages').select('*').eq('slug', slug).eq('active', true).maybeSingle();
      if (data) {
        setPage(data);
        const ids = Array.isArray(data.selected_testimonials) ? data.selected_testimonials as string[] : [];
        if (ids.length > 0) {
          const { data: t } = await supabase.from('testimonials').select('*').in('id', ids).eq('active', true);
          setTestimonials(t || []);
        }
      }
      setLoading(false);
    };
    load();
  }, [slug]);

  // Countdown
  useEffect(() => {
    if (!page?.countdown_enabled || !page?.urgency_date) return;
    const target = new Date(page.urgency_date).getTime();
    const tick = () => {
      const now = Date.now();
      const diff = Math.max(0, target - now);
      setCountdown({
        days: Math.floor(diff / 86400000),
        hours: Math.floor((diff % 86400000) / 3600000),
        minutes: Math.floor((diff % 3600000) / 60000),
        seconds: Math.floor((diff % 60000) / 1000),
      });
    };
    tick();
    const id = setInterval(tick, 1000);
    return () => clearInterval(id);
  }, [page?.countdown_enabled, page?.urgency_date]);

  if (loading) return <div className="min-h-screen bg-background flex items-center justify-center"><div className="w-8 h-8 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>;
  if (!page) return <div className="min-h-screen bg-background flex items-center justify-center text-foreground"><p>Página no encontrada</p></div>;

  const d = page;
  const before_points = Array.isArray(d.before_points) ? d.before_points as string[] : [];
  const after_points = Array.isArray(d.after_points) ? d.after_points as string[] : [];
  const problem_bullets = Array.isArray(d.problem_bullet_points) ? d.problem_bullet_points as string[] : [];
  const modules = Array.isArray(d.modules) ? d.modules as any[] : [];
  const core_benefits = Array.isArray(d.core_benefits) ? d.core_benefits as string[] : [];
  const objections = Array.isArray(d.objections) ? d.objections as any[] : [];
  const anchor_items = Array.isArray(d.anchor_items) ? d.anchor_items as any[] : [];
  const bonuses = Array.isArray(d.bonuses) ? d.bonuses as any[] : [];
  const ctaLink = d.price_stripe_link || d.hero_cta_link || '#';
  const ctaText = d.hero_cta_text || 'Comenzar Ahora';

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
          <Link to="/"><img src={meteoraLogo} alt="Logo" className="h-6" /></Link>
          <a href={ctaLink} target="_blank" rel="noopener noreferrer">
            <Button size="sm" className="glow-primary font-bold gap-1.5"><ArrowRight className="w-4 h-4" /> {ctaText}</Button>
          </a>
        </div>
      </nav>

      {/* 1. HERO */}
      {d.hero_headline && (
        <section className="relative min-h-[85vh] flex items-center pt-20 pb-16 px-6" style={d.hero_background_image ? { backgroundImage: `url(${d.hero_background_image})`, backgroundSize: 'cover', backgroundPosition: 'center' } : {}}>
          {d.hero_background_image && <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/60" />}
          <div className="relative z-10 max-w-4xl mx-auto text-center">
            {d.hero_badge_text && (
              <motion.span variants={fadeUp} initial="hidden" animate="visible" custom={0} className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-bold uppercase tracking-wider mb-6">
                <Zap className="w-3 h-3" /> {d.hero_badge_text}
              </motion.span>
            )}
            <motion.h1 variants={fadeUp} initial="hidden" animate="visible" custom={1} className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-tight mb-6 text-foreground">
              {d.hero_headline}
            </motion.h1>
            {d.hero_subheadline && (
              <motion.p variants={fadeUp} initial="hidden" animate="visible" custom={2} className="text-lg md:text-xl text-muted-foreground mb-4 max-w-2xl mx-auto leading-relaxed">
                {d.hero_subheadline}
              </motion.p>
            )}
            {d.hero_context_line && (
              <motion.p variants={fadeUp} initial="hidden" animate="visible" custom={3} className="text-sm text-muted-foreground mb-8">
                {d.hero_context_line}
              </motion.p>
            )}
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={4}>
              <a href={ctaLink} target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="glow-primary font-bold gap-2 text-base px-10 py-6 h-auto text-lg">
                  <ArrowRight className="w-5 h-5" /> {ctaText}
                </Button>
              </a>
            </motion.div>
            {d.hero_social_proof_micro && (
              <motion.p variants={fadeUp} initial="hidden" animate="visible" custom={5} className="mt-6 text-sm text-muted-foreground">
                {d.hero_social_proof_micro}
              </motion.p>
            )}
          </div>
        </section>
      )}

      {/* 2. BEFORE vs AFTER */}
      {(before_points.length > 0 || after_points.length > 0) && (
        <section className="py-20 px-6 bg-card/30">
          <div className="max-w-6xl mx-auto">
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
              {d.problem_title && <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">{d.problem_title}</h2>}
              {d.transformation_title && <p className="text-2xl md:text-3xl font-display font-bold text-primary mt-2">{d.transformation_title}</p>}
            </motion.div>
            <div className="grid md:grid-cols-2 gap-6">
              {before_points.length > 0 && (
                <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="bg-card rounded-2xl p-8 border border-destructive/30 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-destructive/5 to-transparent" />
                  <div className="relative z-10">
                    <h3 className="text-xl font-display font-bold text-destructive mb-6 flex items-center gap-2"><span className="text-2xl">🔴</span> Antes</h3>
                    <div className="space-y-4">
                      {before_points.map((p, i) => (
                        <div key={i} className="flex items-start gap-3"><XCircle className="w-5 h-5 text-red-500 shrink-0 mt-0.5" /><span className="text-muted-foreground">{p}</span></div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
              {after_points.length > 0 && (
                <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="bg-card rounded-2xl p-8 border border-green-500/30 relative overflow-hidden">
                  <div className="absolute inset-0 bg-gradient-to-br from-green-500/10 to-transparent" />
                  <div className="relative z-10">
                    <h3 className="text-xl font-display font-bold text-green-500 mb-6 flex items-center gap-2"><span className="text-2xl">🟢</span> Después</h3>
                    <div className="space-y-4">
                      {after_points.map((p, i) => (
                        <div key={i} className="flex items-start gap-3"><CheckCircle2 className="w-5 h-5 text-green-500 shrink-0 mt-0.5" /><span className="text-foreground font-medium">{p}</span></div>
                      ))}
                    </div>
                  </div>
                </motion.div>
              )}
            </div>
          </div>
        </section>
      )}

      {/* 3. MICRO SOCIAL PROOF */}
      {d.social_micro_number && (
        <section className="py-12 px-6">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="max-w-3xl mx-auto text-center">
            <div className="inline-flex items-center gap-4 bg-card rounded-2xl px-8 py-6 border border-primary/20">
              <span className="text-4xl font-display font-bold text-primary">{d.social_micro_number}</span>
              <div className="text-left">
                <p className="text-foreground font-medium">{d.social_micro_text}</p>
                {d.social_micro_badge && <p className="text-sm text-muted-foreground">{d.social_micro_badge}</p>}
              </div>
            </div>
          </motion.div>
        </section>
      )}

      {/* 4. PROBLEM */}
      {d.problem_explanation_title && (
        <section className="py-20 px-6 bg-card/30">
          <div className="max-w-4xl mx-auto">
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-6">{d.problem_explanation_title}</h2>
              {d.problem_explanation_text && <p className="text-lg text-muted-foreground leading-relaxed mb-8">{d.problem_explanation_text}</p>}
              {problem_bullets.length > 0 && (
                <div className="space-y-3">
                  {problem_bullets.map((b, i) => (
                    <div key={i} className="flex items-start gap-3"><AlertTriangle className="w-5 h-5 text-yellow-500 shrink-0 mt-0.5" /><span className="text-foreground">{b}</span></div>
                  ))}
                </div>
              )}
            </motion.div>
          </div>
        </section>
      )}

      {/* 5. DELIVERABLES */}
      {(d.program_name || modules.length > 0) && (
        <section className="py-20 px-6">
          <div className="max-w-5xl mx-auto">
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-14">
              {d.program_name && <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-2">{d.program_name}</h2>}
              <div className="flex justify-center gap-6 text-sm text-muted-foreground mt-4">
                {d.program_format && <span className="flex items-center gap-1">📋 {d.program_format}</span>}
                {d.program_duration && <span className="flex items-center gap-1">⏱ {d.program_duration}</span>}
                {d.program_access_time && <span className="flex items-center gap-1">🔑 {d.program_access_time}</span>}
              </div>
            </motion.div>

            {modules.length > 0 && (
              <div className="grid md:grid-cols-2 gap-4 mb-12">
                {modules.map((m, i) => (
                  <motion.div key={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} className="bg-card rounded-xl p-6 border border-border">
                    <h3 className="font-display font-bold text-foreground mb-2">{m.name}</h3>
                    {m.description && <p className="text-sm text-muted-foreground mb-2">{m.description}</p>}
                    {m.benefit && <p className="text-sm text-primary font-medium">✨ {m.benefit}</p>}
                  </motion.div>
                ))}
              </div>
            )}

            {core_benefits.length > 0 && (
              <div className="grid sm:grid-cols-2 md:grid-cols-3 gap-3">
                {core_benefits.map((b, i) => (
                  <div key={i} className="flex items-center gap-2 bg-card rounded-lg px-4 py-3 border border-border">
                    <CheckCircle2 className="w-4 h-4 text-primary shrink-0" />
                    <span className="text-sm text-foreground">{b}</span>
                  </div>
                ))}
              </div>
            )}
          </div>
        </section>
      )}

      {/* 6. TESTIMONIALS */}
      {testimonials.length > 0 && (
        <section className="py-20 px-6 bg-card/30">
          <div className="max-w-6xl mx-auto">
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">Lo que dicen nuestros alumnos</h2>
            </motion.div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {testimonials.map((t, i) => (
                <motion.div key={t.id} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} className="bg-card rounded-xl border border-border overflow-hidden">
                  {t.video_url && (
                    <div className="aspect-video bg-secondary">
                      <iframe src={t.video_url} className="w-full h-full" allowFullScreen allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture" />
                    </div>
                  )}
                  <div className="p-5">
                    {t.result_text && <p className="text-foreground italic mb-3">"{t.result_text}"</p>}
                    <p className="font-display font-bold text-foreground">{t.person_name}</p>
                    <div className="flex items-center gap-2 text-xs text-muted-foreground mt-1">
                      {t.role && <span>{t.role}</span>}
                      {t.country && <span>• {t.country}</span>}
                      {t.isp_size && <span>• {t.isp_size}</span>}
                    </div>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 7. OBJECTIONS */}
      {objections.length > 0 && (
        <section className="py-20 px-6">
          <div className="max-w-3xl mx-auto">
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground">Preguntas Frecuentes</h2>
            </motion.div>
            <div className="space-y-3">
              {objections.map((o, i) => (
                <ObjectionItem key={i} question={o.question} answer={o.answer} index={i} />
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 8. VALUE ANCHORING */}
      {anchor_items.length > 0 && (
        <section className="py-20 px-6 bg-card/30">
          <div className="max-w-3xl mx-auto">
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground text-center mb-10">El valor real de lo que recibes</h2>
              <div className="space-y-3 mb-8">
                {anchor_items.map((a, i) => (
                  <div key={i} className="flex justify-between items-center bg-card rounded-lg px-6 py-4 border border-border">
                    <span className="text-foreground">{a.title}</span>
                    <span className="text-muted-foreground line-through font-mono">{a.value}</span>
                  </div>
                ))}
              </div>
              {d.anchor_total_value && (
                <div className="text-center bg-card rounded-xl p-6 border border-primary/30">
                  <p className="text-muted-foreground mb-1">Valor total:</p>
                  <p className="text-3xl font-display font-bold text-muted-foreground line-through">{d.anchor_total_value}</p>
                  {d.anchor_comparison_text && <p className="text-primary font-bold mt-2">{d.anchor_comparison_text}</p>}
                </div>
              )}
            </motion.div>
          </div>
        </section>
      )}

      {/* 9. PRICING */}
      {d.price_display && (
        <section className="py-20 px-6">
          <div className="max-w-xl mx-auto text-center">
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <div className="bg-card rounded-3xl p-10 border-2 border-primary/30 relative overflow-hidden">
                <div className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-primary to-accent" />
                {d.price_highlight_text && (
                  <Badge className="mb-4 bg-primary/10 text-primary border-primary/20">{d.price_highlight_text}</Badge>
                )}
                {d.price_original && <p className="text-xl text-muted-foreground line-through mb-1">{d.price_original}</p>}
                <p className="text-5xl font-display font-bold text-foreground mb-2">{d.price_display}</p>
                {d.price_installments && <p className="text-muted-foreground mb-8">{d.price_installments}</p>}
                <a href={ctaLink} target="_blank" rel="noopener noreferrer">
                  <Button size="lg" className="glow-primary font-bold gap-2 text-lg px-12 py-6 h-auto w-full">
                    <ArrowRight className="w-5 h-5" /> {ctaText}
                  </Button>
                </a>
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* 10. BONUSES */}
      {bonuses.length > 0 && (
        <section className="py-20 px-6 bg-card/30">
          <div className="max-w-4xl mx-auto">
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground flex items-center justify-center gap-3"><Gift className="w-8 h-8 text-primary" /> Bonos Exclusivos</h2>
            </motion.div>
            <div className="space-y-4">
              {bonuses.map((b, i) => (
                <motion.div key={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} className="bg-card rounded-xl p-6 border border-primary/20 flex gap-4">
                  {b.image && <img src={b.image} alt="" className="w-20 h-20 rounded-lg object-cover shrink-0" />}
                  <div className="flex-1">
                    <h3 className="font-display font-bold text-foreground mb-1">{b.name}</h3>
                    {b.description && <p className="text-sm text-muted-foreground mb-2">{b.description}</p>}
                    {b.value && <Badge variant="outline" className="text-primary border-primary/30">Valor: {b.value}</Badge>}
                  </div>
                </motion.div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* 11. GUARANTEE */}
      {d.guarantee_title && (
        <section className="py-20 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <div className="bg-gradient-to-br from-primary/10 via-card to-card rounded-3xl p-12 border border-primary/20">
                <Shield className="w-12 h-12 text-primary mx-auto mb-6" />
                <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">{d.guarantee_title}</h2>
                {d.guarantee_description && <p className="text-lg text-muted-foreground leading-relaxed mb-4">{d.guarantee_description}</p>}
                {d.guarantee_days && <p className="text-primary font-bold text-xl">{d.guarantee_days} días de garantía</p>}
              </div>
            </motion.div>
          </div>
        </section>
      )}

      {/* 12. URGENCY */}
      {d.urgency_text && (
        <section className="py-12 px-6 bg-destructive/5 border-y border-destructive/20">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              {d.countdown_enabled && d.urgency_date && (
                <div className="flex justify-center gap-4 mb-6">
                  {[{ v: countdown.days, l: 'Días' }, { v: countdown.hours, l: 'Horas' }, { v: countdown.minutes, l: 'Min' }, { v: countdown.seconds, l: 'Seg' }].map((c, i) => (
                    <div key={i} className="bg-card rounded-xl px-4 py-3 border border-border min-w-[70px]">
                      <p className="text-2xl font-display font-bold text-destructive">{String(c.v).padStart(2, '0')}</p>
                      <p className="text-xs text-muted-foreground">{c.l}</p>
                    </div>
                  ))}
                </div>
              )}
              <div className="flex items-center justify-center gap-3">
                <Clock className="w-5 h-5 text-destructive" />
                <p className="text-lg font-semibold text-foreground">{d.urgency_text}</p>
              </div>
              {d.urgency_type === 'spots' && d.urgency_spots_remaining && (
                <p className="text-destructive font-bold mt-2">Solo quedan {d.urgency_spots_remaining} cupos</p>
              )}
            </motion.div>
          </div>
        </section>
      )}

      {/* 13. FINAL CTA */}
      {d.final_cta_title && (
        <section className="py-24 px-6">
          <div className="max-w-3xl mx-auto text-center">
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">{d.final_cta_title}</h2>
              {d.final_cta_text && <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto">{d.final_cta_text}</p>}
              <a href={d.final_cta_link || ctaLink} target="_blank" rel="noopener noreferrer">
                <Button size="lg" className="glow-primary font-bold gap-2 text-lg px-12 py-6 h-auto">
                  <ArrowRight className="w-6 h-6" /> {d.final_cta_button_text || ctaText}
                </Button>
              </a>
            </motion.div>
          </div>
        </section>
      )}

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-8 px-6 text-center">
        <Link to="/"><img src={meteoraLogo} alt="Logo" className="h-6 mx-auto mb-3" /></Link>
        <p className="text-xs text-muted-foreground">© {new Date().getFullYear()} Todos los derechos reservados.</p>
      </footer>
    </div>
  );
};

// FAQ Accordion item
const ObjectionItem: React.FC<{ question: string; answer: string; index: number }> = ({ question, answer, index }) => {
  const [open, setOpen] = useState(false);
  return (
    <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={index} className="bg-card rounded-xl border border-border overflow-hidden">
      <button onClick={() => setOpen(!open)} className="w-full flex items-center justify-between px-6 py-5 text-left">
        <span className="font-display font-medium text-foreground pr-4">{question}</span>
        <ChevronDown className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform duration-300 ${open ? 'rotate-180' : ''}`} />
      </button>
      <div className={`overflow-hidden transition-all duration-300 ${open ? 'max-h-60 pb-5' : 'max-h-0'}`}>
        <p className="px-6 text-sm text-muted-foreground leading-relaxed">{answer}</p>
      </div>
    </motion.div>
  );
};

export default SalesPage;
