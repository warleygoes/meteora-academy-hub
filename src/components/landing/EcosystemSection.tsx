import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Link } from 'react-router-dom';
import { BookOpen, ArrowRight, ChevronLeft, ChevronRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { supabase } from '@/integrations/supabase/client';
import ecosystemDiagram from '@/assets/diagrama-ecossistema.png';

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number = 0) => ({
    opacity: 1, y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: "easeOut" as const },
  }),
};

const DIAGNOSTIC_URL = '/diagnostico';

const pillars = [
  {
    title: 'Estabilidad Técnica',
    lines: ['Menos cortes.', 'Mejor arquitectura.', 'Red preparada para expansión.'],
    icon: '🛡️',
    pillar: 'Pilar 01',
  },
  {
    title: 'Control Financiero',
    lines: ['Claridad real de margen.', 'Estructura de costos organizada.', 'Decisiones basadas en números.'],
    icon: '📊',
    pillar: 'Pilar 02',
  },
  {
    title: 'Escala Comercial',
    lines: ['Procesos replicables.', 'Marketing estructurado.', 'Crecimiento planificado.'],
    icon: '🚀',
    pillar: 'Pilar 03',
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

/* ── Ecosystem diagram — static image ─────────────────── */
const EcosystemWheel: React.FC = () => (
  <div className="flex justify-center">
    <img
      src={ecosystemDiagram}
      alt="Ecosistema Meteora Academy — Cursos, Mentorías, Softwares, Comunidad, Eventos, Implementaciones"
      className="w-full max-w-[700px] h-auto"
      loading="lazy"
    />
  </div>
);

/* ── Main Section ──────────────────────────────────────── */
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

          {/* Donut Ecosystem Wheel */}
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="mb-20">
            <EcosystemWheel />
          </motion.div>

          {/* 3 Pillars */}
          <div className="grid md:grid-cols-3 gap-6">
            {pillars.map((p, i) => (
              <motion.div key={p.title} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
                className="bg-card rounded-2xl p-8 border border-border hover:border-primary/30 transition-colors">
                <span className="text-xs font-semibold uppercase tracking-widest text-primary mb-3 block">{p.pillar}</span>
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
