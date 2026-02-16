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

/* ── Ecosystem wheel data ─────────────────────────────── */
const segments = [
  {
    icon: BookOpen,
    label: 'Cursos',
    color: 'hsl(349, 100%, 62%)',   // primary / rosa
    branches: ['Formación técnica', 'Estrategia de red', 'Gestión ISP'],
  },
  {
    icon: Users,
    label: 'Mentorías',
    color: 'hsl(349, 80%, 50%)',
    branches: ['Acompañamiento 1:1', 'Sesiones grupales', 'Plan de acción'],
  },
  {
    icon: Monitor,
    label: 'Softwares',
    color: 'hsl(207, 60%, 40%)',
    branches: ['Herramientas exclusivas', 'Automatización', 'Monitoreo'],
  },
  {
    icon: MessageCircle,
    label: 'Comunidad',
    color: 'hsl(207, 50%, 30%)',
    branches: ['Red de ISPs', 'Networking', 'Soporte mutuo'],
  },
  {
    icon: Calendar,
    label: 'Eventos',
    color: 'hsl(207, 70%, 25%)',
    branches: ['Presenciales', 'Virtuales', 'Workshops'],
  },
  {
    icon: Wrench,
    label: 'Implementaciones',
    color: 'hsl(349, 60%, 45%)',
    branches: ['Ejecución directa', 'Infraestructura', 'Optimización'],
  },
];

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

/* ── SVG donut arc helper ──────────────────────────────── */
function describeArc(cx: number, cy: number, r: number, startAngle: number, endAngle: number) {
  const start = ((startAngle - 90) * Math.PI) / 180;
  const end = ((endAngle - 90) * Math.PI) / 180;
  const x1 = cx + r * Math.cos(start);
  const y1 = cy + r * Math.sin(start);
  const x2 = cx + r * Math.cos(end);
  const y2 = cy + r * Math.sin(end);
  const largeArc = endAngle - startAngle > 180 ? 1 : 0;
  return `M ${x1} ${y1} A ${r} ${r} 0 ${largeArc} 1 ${x2} ${y2}`;
}

/* ── Donut Wheel Component ─────────────────────────────── */
const EcosystemWheel: React.FC = () => {
  const cx = 300, cy = 300;
  const outerR = 200, innerR = 110;
  const midR = (outerR + innerR) / 2;
  const segAngle = 360 / segments.length;
  const gap = 3;

  // Pre-calculated fixed positions for branches to avoid overlap
  // Each segment gets branches positioned radially outward with enough spacing
  const branchPositions: { x: number; y: number }[][] = segments.map((_, i) => {
    const startA = i * segAngle + gap / 2;
    const endA = (i + 1) * segAngle - gap / 2;
    const midA = (startA + endA) / 2;
    
    // Spread branches along the arc direction with wide spacing
    return [0, 1, 2].map((bi) => {
      const spreadAngle = (bi - 1) * 24; // 24 degrees apart (wider spread)
      const bAngle = (midA + spreadAngle - 90) * (Math.PI / 180);
      const bR = outerR + 85 + Math.abs(bi - 1) * 18; // pushed further out
      return {
        x: cx + bR * Math.cos(bAngle),
        y: cy + bR * Math.sin(bAngle),
      };
    });
  });

  return (
    <div className="relative w-full max-w-[750px] mx-auto" style={{ aspectRatio: '1 / 1.2' }}>
      {/* SVG viewBox expanded to fit branches */}
      <svg viewBox="-80 -80 760 800" className="w-full h-full">
        {/* Segments */}
        {segments.map((seg, i) => {
          const startA = i * segAngle + gap / 2;
          const endA = (i + 1) * segAngle - gap / 2;

          const startOuter = ((startA - 90) * Math.PI) / 180;
          const endOuter = ((endA - 90) * Math.PI) / 180;
          const startInner = ((endA - 90) * Math.PI) / 180;
          const endInner = ((startA - 90) * Math.PI) / 180;

          const ox1 = cx + outerR * Math.cos(startOuter);
          const oy1 = cy + outerR * Math.sin(startOuter);
          const ox2 = cx + outerR * Math.cos(endOuter);
          const oy2 = cy + outerR * Math.sin(endOuter);
          const ix1 = cx + innerR * Math.cos(startInner);
          const iy1 = cy + innerR * Math.sin(startInner);
          const ix2 = cx + innerR * Math.cos(endInner);
          const iy2 = cy + innerR * Math.sin(endInner);

          const largeArc = endA - startA > 180 ? 1 : 0;

          const d = [
            `M ${ox1} ${oy1}`,
            `A ${outerR} ${outerR} 0 ${largeArc} 1 ${ox2} ${oy2}`,
            `L ${ix1} ${iy1}`,
            `A ${innerR} ${innerR} 0 ${largeArc} 0 ${ix2} ${iy2}`,
            'Z',
          ].join(' ');

          const midAngle = ((startA + endA) / 2 - 90) * (Math.PI / 180);
          const iconX = cx + midR * Math.cos(midAngle);
          const iconY = cy + midR * Math.sin(midAngle);

          // Label position
          const labelR = outerR + 30;
          const labelX = cx + labelR * Math.cos(midAngle);
          const labelY = cy + labelR * Math.sin(midAngle);

          // Connector lines from segment edge to branches
          const edgeX = cx + (outerR + 5) * Math.cos(midAngle);
          const edgeY = cy + (outerR + 5) * Math.sin(midAngle);

          return (
            <g key={seg.label}>
              <path d={d} fill={seg.color} opacity="0.9" className="transition-opacity duration-300 hover:opacity-100" />
              <circle cx={iconX} cy={iconY} r="22" fill="hsl(207, 94%, 6%)" fillOpacity="0.6" />

              {/* Connector lines to branches */}
              {branchPositions[i].map((bp, bi) => (
                <line
                  key={bi}
                  x1={edgeX} y1={edgeY}
                  x2={bp.x} y2={bp.y}
                  stroke="hsl(207, 30%, 20%)"
                  strokeWidth="1"
                  strokeDasharray="3 3"
                  opacity="0.4"
                />
              ))}
            </g>
          );
        })}

        {/* Center circle */}
        <circle cx={cx} cy={cy} r={innerR - 8} fill="hsl(207, 60%, 9%)" stroke="hsl(349, 100%, 62%)" strokeWidth="2" opacity="0.95" />

        {/* Branch labels as SVG text for precise positioning */}
        {segments.map((seg, i) =>
          seg.branches.map((branch, bi) => {
            const bp = branchPositions[i][bi];
            return (
              <g key={`${seg.label}-branch-${bi}`}>
                <rect
                  x={bp.x - 55} y={bp.y - 10}
                  width="110" height="20"
                  rx="4"
                  fill="hsl(207, 40%, 14%)"
                  fillOpacity="0.7"
                  stroke="hsl(207, 30%, 20%)"
                  strokeWidth="0.5"
                />
                <text
                  x={bp.x} y={bp.y + 4}
                  textAnchor="middle"
                  fill="hsl(207, 15%, 60%)"
                  fontSize="10"
                  fontFamily="Inter, sans-serif"
                >
                  {branch}
                </text>
              </g>
            );
          })
        )}
      </svg>

      {/* Center content (HTML overlay) — smaller logo */}
      <div className="absolute inset-0 flex items-center justify-center pointer-events-none" style={{ top: '-6%' }}>
        <div className="flex flex-col items-center gap-1">
          <img src={meteoraLogo} alt="Meteora" className="h-6 md:h-9 object-contain" />
          <span className="font-display font-bold text-primary text-[8px] md:text-[11px] tracking-widest uppercase">Ecosistema</span>
        </div>
      </div>

      {/* Segment icons + large category labels (HTML overlay) */}
      {segments.map((seg, i) => {
        const startA = i * segAngle + gap / 2;
        const endA = (i + 1) * segAngle - gap / 2;
        const midAngle = ((startA + endA) / 2 - 90) * (Math.PI / 180);
        const iconX = cx + midR * Math.cos(midAngle);
        const iconY = cy + midR * Math.sin(midAngle);
        const Icon = seg.icon;

        const labelR = outerR + 30;
        const labelX = cx + labelR * Math.cos(midAngle);
        const labelY = cy + labelR * Math.sin(midAngle);

        // Convert to percentage of the expanded viewBox (-80 to 680 = 760 wide, -80 to 720 = 800 tall)
        const toPercX = (v: number) => ((v + 80) / 760) * 100;
        const toPercY = (v: number) => ((v + 80) / 800) * 100;

        return (
          <React.Fragment key={seg.label + '-overlay'}>
            {/* Icon on segment */}
            <div
              className="absolute pointer-events-none"
              style={{
                left: `${toPercX(iconX)}%`,
                top: `${toPercY(iconY)}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <Icon className="w-5 h-5 md:w-6 md:h-6 text-foreground drop-shadow-lg" />
            </div>

            {/* Category Label — LARGE */}
            <div
              className="absolute pointer-events-none"
              style={{
                left: `${toPercX(labelX)}%`,
                top: `${toPercY(labelY)}%`,
                transform: 'translate(-50%, -50%)',
              }}
            >
              <span className="font-display font-bold text-foreground text-sm md:text-base whitespace-nowrap">
                {seg.label}
              </span>
            </div>
          </React.Fragment>
        );
      })}
    </div>
  );
};

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
