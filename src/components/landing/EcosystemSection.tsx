import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BookOpen, Users, Monitor, Calendar, Wrench, MessageCircle, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import meteoraLogo from '@/assets/logo-white.png';

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: "easeOut" as const },
  }),
};

const DIAGNOSTIC_URL = '/diagnostico';

const ecosystemItems = [
  { icon: BookOpen, label: 'Cursos', angle: 0, desc: 'Formación técnica y estratégica' },
  { icon: Users, label: 'Mentorías', angle: 60, desc: 'Acompañamiento personalizado' },
  { icon: Monitor, label: 'Softwares', angle: 120, desc: 'Herramientas exclusivas' },
  { icon: MessageCircle, label: 'Comunidad', angle: 180, desc: 'Red de ISPs conectados' },
  { icon: Calendar, label: 'Eventos', angle: 240, desc: 'Presenciales y virtuales' },
  { icon: Wrench, label: 'Implementaciones', angle: 300, desc: 'Ejecución directa en tu red' },
];

const pillars = [
  {
    title: 'Estabilidad Técnica',
    lines: ['Menos cortes.', 'Mejor arquitectura.', 'Red preparada para expansión.'],
    icon: '🛡️',
  },
  {
    title: 'Control Financiero',
    lines: ['Claridad real de margen.', 'Estructura de costos organizada.', 'Decisiones basadas en números.'],
    icon: '📊',
  },
  {
    title: 'Escala Comercial',
    lines: ['Procesos replicables.', 'Marketing estructurado.', 'Crecimiento planificado.'],
    icon: '🚀',
  },
];

const TYPE_LABELS: Record<string, string> = {
  course: 'Cursos',
  saas: 'Softwares',
  consultation: 'Consultorías',
  service: 'Servicios',
  implementation: 'Implementaciones',
  virtual_event: 'Eventos Virtuales',
  in_person_event: 'Eventos Presenciales',
};

interface HomeProduct {
  id: string;
  name: string;
  description: string | null;
  type: string;
  thumbnail_url: string | null;
  thumbnail_vertical_url: string | null;
}

const EcosystemSection: React.FC = () => {
  const [productsByType, setProductsByType] = useState<Record<string, HomeProduct[]>>({});

  useEffect(() => {
    const fetch = async () => {
      const { data } = await supabase
        .from('products')
        .select('id, name, description, type, thumbnail_url, thumbnail_vertical_url')
        .eq('active', true)
        .eq('show_on_home', true)
        .order('sort_order');
      if (!data) return;
      const grouped: Record<string, HomeProduct[]> = {};
      data.forEach((p: any) => {
        if (!grouped[p.type]) grouped[p.type] = [];
        grouped[p.type].push(p);
      });
      setProductsByType(grouped);
    };
    fetch();
  }, []);

  const scrollRef = React.useRef<Record<string, HTMLDivElement | null>>({});

  const scroll = (type: string, dir: 'left' | 'right') => {
    const el = scrollRef.current[type];
    if (el) el.scrollBy({ left: dir === 'left' ? -300 : 300, behavior: 'smooth' });
  };

  return (
    <>
      {/* ECOSYSTEM DIAGRAM */}
      <section className="py-24 px-6 bg-secondary/30">
        <div className="max-w-6xl mx-auto">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">
              El sistema completo detrás de un ISP que crece sin colapsar
            </h2>
            <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
              No resolvemos solo un problema. Construimos la base técnica, financiera y comercial para que tu proveedor pueda escalar con estabilidad.
            </p>
          </motion.div>

          {/* Professional Circular Ecosystem Diagram */}
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="flex justify-center mb-20">
            <div className="relative w-[340px] h-[340px] md:w-[520px] md:h-[520px]">
              {/* Outer decorative ring */}
              <div className="absolute inset-0 rounded-full border border-border/20" />
              {/* Middle ring */}
              <div className="absolute inset-8 md:inset-12 rounded-full border border-border/30" />
              {/* Inner glow ring */}
              <div className="absolute inset-16 md:inset-24 rounded-full border border-primary/20 shadow-[0_0_60px_hsl(349_100%_62%/0.08)]" />
              
              {/* Connecting lines from center to each node */}
              <svg className="absolute inset-0 w-full h-full" viewBox="0 0 520 520">
                {ecosystemItems.map((item) => {
                  const rad = (item.angle - 90) * (Math.PI / 180);
                  const r = 220;
                  const x = 260 + r * Math.cos(rad);
                  const y = 260 + r * Math.sin(rad);
                  return (
                    <line
                      key={item.label + '-line'}
                      x1="260" y1="260"
                      x2={x} y2={y}
                      stroke="hsl(207 30% 16%)"
                      strokeWidth="1"
                      strokeDasharray="4 4"
                      opacity="0.5"
                    />
                  );
                })}
              </svg>

              {/* Center - Logo */}
              <div className="absolute inset-0 flex items-center justify-center z-10">
                <div className="w-28 h-28 md:w-40 md:h-40 rounded-full bg-gradient-to-br from-card via-card to-secondary border-2 border-primary/30 flex flex-col items-center justify-center shadow-[0_0_50px_hsl(349_100%_62%/0.2)] gap-2">
                  <img src={meteoraLogo} alt="Meteora" className="h-8 md:h-12 object-contain" />
                  <span className="font-display font-bold text-foreground text-xs md:text-sm tracking-wider uppercase">Ecosistema</span>
                </div>
              </div>

              {/* Orbital Items */}
              {ecosystemItems.map((item, i) => {
                const rad = (item.angle - 90) * (Math.PI / 180);
                const r = 42;
                const x = 50 + r * Math.cos(rad);
                const y = 50 + r * Math.sin(rad);
                const Icon = item.icon;
                return (
                  <motion.div
                    key={item.label}
                    initial={{ opacity: 0, scale: 0 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    viewport={{ once: true }}
                    transition={{ delay: 0.3 + i * 0.12, duration: 0.5, type: 'spring', stiffness: 200 }}
                    className="absolute flex flex-col items-center gap-1.5"
                    style={{ left: `${x}%`, top: `${y}%`, transform: 'translate(-50%, -50%)' }}
                  >
                    <div className="w-14 h-14 md:w-[72px] md:h-[72px] rounded-2xl bg-card border border-border/60 flex items-center justify-center shadow-[0_4px_20px_hsl(0_0%_0%/0.3)] hover:border-primary/50 hover:shadow-[0_0_25px_hsl(349_100%_62%/0.2)] transition-all duration-300 group cursor-default">
                      <Icon className="w-6 h-6 md:w-7 md:h-7 text-primary group-hover:scale-110 transition-transform duration-300" />
                    </div>
                    <span className="text-[11px] md:text-sm font-display font-semibold text-foreground whitespace-nowrap">{item.label}</span>
                    <span className="text-[9px] md:text-xs text-muted-foreground whitespace-nowrap hidden md:block">{item.desc}</span>
                  </motion.div>
                );
              })}
            </div>
          </motion.div>

          {/* 3 Pillars */}
          <div className="grid md:grid-cols-3 gap-6">
            {pillars.map((p, i) => (
              <motion.div key={p.title} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
                className="bg-card rounded-2xl p-8 border border-border hover:border-primary/30 transition-colors">
                <span className="text-3xl mb-4 block">{p.icon}</span>
                <h3 className="font-display font-bold text-foreground text-lg mb-4">{p.title}</h3>
                <div className="space-y-2">
                  {p.lines.map((line, j) => (
                    <p key={j} className="text-sm text-muted-foreground">{line}</p>
                  ))}
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* PRODUCT CAROUSEL BY TYPE */}
      {Object.keys(productsByType).length > 0 && (
        <section className="py-16 px-6 bg-card/50">
          <div className="max-w-6xl mx-auto">
            {Object.entries(productsByType).map(([type, products]) => (
              <div key={type} className="mb-10 group/carousel">
                <h3 className="text-xl font-display font-semibold text-foreground mb-4 px-1">
                  {TYPE_LABELS[type] || type}
                </h3>
                <div className="relative">
                  <button onClick={() => scroll(type, 'left')}
                    className="absolute left-0 top-0 bottom-0 z-10 w-10 flex items-center justify-center bg-gradient-to-r from-background to-transparent opacity-0 group-hover/carousel:opacity-100 transition-opacity">
                    <ChevronLeft className="w-5 h-5 text-foreground" />
                  </button>
                  <div
                    ref={el => { scrollRef.current[type] = el; }}
                    className="flex gap-4 overflow-x-auto scrollbar-hide pb-4 px-1"
                  >
                    {products.map(product => (
                      <div key={product.id} className="flex-shrink-0 w-[220px]">
                        <div className="bg-card rounded-xl border border-border overflow-hidden hover:border-primary/30 transition-all group">
                          <div className="aspect-[16/10] bg-secondary overflow-hidden">
                            {product.thumbnail_url ? (
                              <img src={product.thumbnail_url} alt={product.name} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                            ) : (
                              <div className="w-full h-full flex items-center justify-center">
                                <BookOpen className="w-8 h-8 text-muted-foreground" />
                              </div>
                            )}
                          </div>
                          <div className="p-4">
                            <h4 className="font-display font-semibold text-foreground text-sm line-clamp-2 mb-1">{product.name}</h4>
                            {product.description && (
                              <p className="text-xs text-muted-foreground line-clamp-2 mb-3">{product.description}</p>
                            )}
                            <Link to="/login">
                              <Button variant="outline" size="sm" className="w-full text-xs gap-1">
                                Ver más <ArrowRight className="w-3 h-3" />
                              </Button>
                            </Link>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  <button onClick={() => scroll(type, 'right')}
                    className="absolute right-0 top-0 bottom-0 z-10 w-10 flex items-center justify-center bg-gradient-to-l from-background to-transparent opacity-0 group-hover/carousel:opacity-100 transition-opacity">
                    <ChevronRight className="w-5 h-5 text-foreground" />
                  </button>
                </div>
              </div>
            ))}

            {/* Closing phrase + CTA */}
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mt-12">
              <p className="text-lg md:text-xl text-muted-foreground mb-2">
                No importa en qué punto estés.
              </p>
              <p className="text-lg md:text-xl font-display font-bold text-foreground mb-8">
                Siempre hay un siguiente paso claro.
              </p>
              <Link to={DIAGNOSTIC_URL}>
                <Button size="lg" className="bg-green-600 hover:bg-green-700 text-white font-bold gap-2 text-base px-8">
                  <ArrowRight className="w-5 h-5" /> 👉 Hacer Evaluación Estratégica — Gratis
                </Button>
              </Link>
            </motion.div>
          </div>
        </section>
      )}
    </>
  );
};

export default EcosystemSection;
