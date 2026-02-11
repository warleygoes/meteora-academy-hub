import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Star, Users, BookOpen, Award, ChevronRight, ArrowRight, Zap, Target, Globe, MessageCircle, ChevronDown, Instagram, Youtube, Linkedin, Mail, Wifi, Server, BarChart3, Headphones, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import meteoraLogo from '@/assets/logo-white-pink.png';
import landingHero from '@/assets/landing-hero.jpg';
import testimonial1 from '@/assets/testimonial-1.jpg';
import testimonial2 from '@/assets/testimonial-2.jpg';
import testimonial3 from '@/assets/testimonial-3.jpg';
import vinheta from '@/assets/vinheta.mp4';

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.12, duration: 0.6, ease: "easeOut" as const },
  }),
};

const LandingPage: React.FC = () => {
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const stats = [
    { value: '2.5M', label: 'Visualizações' },
    { value: '27k', label: 'Inscritos' },
    { value: '682', label: 'Vídeos' },
    { value: '600+', label: 'Alunos' },
    { value: '16', label: 'Países' },
    { value: '30k', label: 'ISPs Impactados' },
  ];

  const expertise = [
    'Conceptos avanzados en ISP',
    'Planificación y dimensionamiento de un ISP',
    'Infraestructura de red para ISP',
    'Servicios ofrecidos por los ISP',
    'Gestión y operación de un ISP',
    'Cursos técnicos y formación',
    'Consultoría estratégica',
  ];

  const features = [
    { icon: Wifi, title: 'Cursos para ISPs', desc: 'Conteúdo especializado para provedores de internet, desde conceitos avançados até gestão e operação.' },
    { icon: Users, title: 'Comunidade Exclusiva', desc: 'Conecte-se com mais de 600 alunos e ISPs de 16 países da América Latina.' },
    { icon: Headphones, title: 'Oráculo', desc: 'Sessões semanais ao vivo com especialistas para resolver suas dúvidas em tempo real.' },
    { icon: Target, title: 'Mentoria', desc: 'Leve seu ISP para outro nível com acompanhamento estratégico personalizado.' },
    { icon: Server, title: 'Infraestrutura', desc: 'Domine planejamento, dimensionamento e infraestrutura de rede para seu provedor.' },
    { icon: Globe, title: 'Presença Global', desc: 'Atuamos em toda América Latina — Venezuela, Uruguai, Peru, Paraguai, Equador, Colômbia e Argentina.' },
  ];

  const testimonials = [
    { name: 'Deivis Nibaldo Montes Zambrano', role: 'ISP Owner', img: testimonial1, text: 'La Mentoria me gusta la forma en que nos ayudamos mutuamente y lo que más me impacta es donde nos reunimos y podemos interactuar y resolver nuestras dudas.' },
    { name: 'Lizbeth Hernandez', role: 'ISP Manager', img: testimonial2, text: 'Me gusta la interacción que se tiene entre los compañeros, porque se aprenden cosas nuevas. Y bueno mejorar más en la parte de nuestros ISPs con estas mentorias prácticas.' },
    { name: 'Aluno Meteora', role: 'Provedor de Internet', img: testimonial3, text: 'A Meteora transformou a forma como gerenciamos nosso ISP. O conhecimento prático e a comunidade de apoio fizeram toda a diferença para escalar nosso negócio.' },
  ];

  const faqs = [
    { q: 'O que é a Meteora Academy?', a: 'A Meteora Academy é uma plataforma educacional especializada em provedores de internet (ISPs). Oferecemos cursos, mentoria, comunidade e consultoria estratégica para ajudar seu ISP a crescer e se tornar imparável.' },
    { q: 'Para quem são os cursos?', a: 'Nossos cursos são voltados para donos, gestores e técnicos de provedores de internet (ISPs) de toda América Latina que desejam escalar seus negócios.' },
    { q: 'O que é o Oráculo?', a: 'O Oráculo são sessões semanais ao vivo com um especialista dedicado para resolver suas dúvidas em tempo real. O investimento é de U$ 39/mês.' },
    { q: 'Em quais países a Meteora atua?', a: 'Atuamos em 16 países, incluindo Brasil, Argentina, Colômbia, Peru, Venezuela, Equador, Paraguai, Uruguai e outros países da América Latina.' },
    { q: 'Como funciona a comunidade?', a: 'Nossa comunidade é um espaço exclusivo onde alunos e donos de ISPs interagem, compartilham experiências, fazem networking e se ajudam mutuamente a crescer no mercado.' },
    { q: 'Quem é o fundador?', a: 'Nosso fundador é um brasileiro que vive na Argentina, dono de um ISP e professor de tecnologia. Ele compartilha seus conhecimentos e tem como missão melhorar a internet na América Latina através da educação.' },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <img src={meteoraLogo} alt="Meteora Academy" className="h-8" />
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#sobre" className="hover:text-foreground transition-colors">Sobre</a>
            <a href="#cursos" className="hover:text-foreground transition-colors">Cursos</a>
            <a href="#oraculo" className="hover:text-foreground transition-colors">Oráculo</a>
            <a href="#depoimentos" className="hover:text-foreground transition-colors">Depoimentos</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-3">
            <Link to="/login">
              <Button variant="ghost" size="sm" className="text-muted-foreground hover:text-foreground">
                Entrar
              </Button>
            </Link>
            <Link to="/login">
              <Button size="sm" className="glow-primary font-semibold gap-1">
                <MessageCircle className="w-4 h-4" />
                Comunidade
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-16">
        <div className="absolute inset-0">
          <video
            autoPlay
            loop
            muted
            playsInline
            className="w-full h-full object-cover"
            poster={landingHero}
          >
            <source src={vinheta} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-background/70" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 w-full">
          <div className="max-w-2xl">
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-6">
                <Zap className="w-3 h-3" /> Sea Imparable
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp} initial="hidden" animate="visible" custom={1}
              className="text-5xl md:text-7xl font-display font-bold leading-[1.1] mb-6"
            >
              <span className="text-foreground">Aceleramos el</span>
              <br />
              <span className="text-foreground">crecimiento de</span>
              <br />
              <span className="text-foreground">tu </span>
              <span className="text-gradient">ISP</span>
            </motion.h1>

            <motion.p
              variants={fadeUp} initial="hidden" animate="visible" custom={2}
              className="text-lg md:text-xl text-muted-foreground mb-10 max-w-lg leading-relaxed"
            >
              Los conocimientos necesarios para que tu proveedor de Internet crezca y sea Imparable. Cursos, mentoria y comunidad exclusiva.
            </motion.p>

            <motion.div
              variants={fadeUp} initial="hidden" animate="visible" custom={3}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link to="/login">
                <Button size="lg" className="glow-primary font-bold gap-2 text-base px-8">
                  <Play className="w-5 h-5" /> Comenzar Ahora
                </Button>
              </Link>
              <a href="#sobre">
                <Button size="lg" variant="secondary" className="font-semibold gap-2 text-base">
                  Conocer Meteora <ChevronRight className="w-4 h-4" />
                </Button>
              </a>
            </motion.div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div
              initial={{ opacity: 0, y: 30 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: 0.8, duration: 0.6 }}
              className="grid grid-cols-3 md:grid-cols-6 gap-px bg-border rounded-t-2xl overflow-hidden"
            >
              {stats.map((stat) => (
                <div key={stat.label} className="bg-card/80 backdrop-blur-sm px-4 py-5 text-center">
                  <p className="text-xl md:text-2xl font-display font-bold text-primary">{stat.value}</p>
                  <p className="text-[10px] md:text-xs text-muted-foreground mt-1">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* Expertise Section */}
      <section id="sobre" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid lg:grid-cols-2 gap-16 items-center">
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
              <span className="text-primary text-sm font-semibold uppercase tracking-wider">Experiencia</span>
              <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mt-3 mb-6">
                Experiencia en resolución de <span className="text-gradient">problemas.</span>
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-8">
                Experiencia en resolver desafíos de proveedores de servicios de Internet (ISP), transformando obstáculos en oportunidades de crecimiento.
              </p>
              <div className="space-y-3">
                {expertise.map((item, i) => (
                  <motion.div
                    key={i}
                    variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
                    className="flex items-center gap-3"
                  >
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                    <span className="text-foreground">{item}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div
              variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={2}
              className="relative"
            >
              <div className="bg-card rounded-3xl p-8 border border-border relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
                <div className="relative z-10">
                  <h3 className="text-2xl font-display font-bold text-foreground mb-3">
                    Missão
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                    Proporcionar conexões sólidas que vão além da mera transmissão de dados, tornando-nos facilitadores de experiências enriquecedoras e vitais para a vida moderna.
                  </p>
                  <h3 className="text-2xl font-display font-bold text-foreground mb-3">
                    Visão
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-6">
                    Aspiramos a ser pioneiros na transformação digital, destacando-nos como líderes no setor de provedores de serviços de Internet.
                  </p>
                  <h3 className="text-2xl font-display font-bold text-foreground mb-3">
                    Valores
                  </h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">
                    Inovação, Integridade, Colaboração, Responsabilidade Social. Esses valores são a bússola que orienta nosso caminho para o sucesso sustentável.
                  </p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="cursos" className="py-24 px-6 bg-card/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-primary text-sm font-semibold uppercase tracking-wider">O que oferecemos</span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mt-3 mb-4">
              Tudo que seu ISP precisa<br />
              <span className="text-gradient">em um só lugar.</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Cursos, mentoria, comunidade e consultoria para provedores de internet de toda América Latina.
            </p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div
                key={f.title}
                variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
                className="bg-card rounded-2xl p-8 border border-border hover:border-primary/30 transition-all duration-300 group"
              >
                <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-5 group-hover:bg-primary/20 transition-colors">
                  <f.icon className="w-6 h-6 text-primary" />
                </div>
                <h3 className="text-lg font-display font-semibold text-foreground mb-2">{f.title}</h3>
                <p className="text-sm text-muted-foreground leading-relaxed">{f.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Oráculo */}
      <section id="oraculo" className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <div className="bg-gradient-to-br from-primary/10 via-card to-card rounded-3xl p-12 md:p-16 border border-primary/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
              <div className="relative z-10">
                <span className="text-4xl mb-4 block">🔮</span>
                <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">
                  <span className="text-gradient">Oráculo</span>
                </h2>
                <p className="text-xl text-muted-foreground mb-2">
                  Sesiones semanales con un especialista para resolver dudas.
                </p>
                <p className="text-3xl font-display font-bold text-primary mb-8">
                  U$ 39 <span className="text-lg text-muted-foreground font-normal">/ mes</span>
                </p>
                <Link to="/login">
                  <Button size="lg" className="glow-primary font-bold gap-2 text-base px-10">
                    <Headphones className="w-5 h-5" /> Quiero el Oráculo
                  </Button>
                </Link>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="depoimentos" className="py-24 px-6 bg-card/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-primary text-sm font-semibold uppercase tracking-wider">Mentoria</span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mt-3">
              Ellos usan nuestra mentoria para llevar su<br />
              <span className="text-gradient">negocio a otro nivel.</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((t, i) => (
              <motion.div
                key={t.name}
                variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
                className="bg-card rounded-2xl p-8 border border-border relative"
              >
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-primary fill-primary" />
                  ))}
                </div>
                <p className="text-muted-foreground leading-relaxed mb-6 text-sm">"{t.text}"</p>
                <div className="flex items-center gap-3">
                  <img src={t.img} alt={t.name} className="w-11 h-11 rounded-full object-cover" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{t.name}</p>
                    <p className="text-xs text-muted-foreground">{t.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA - Founder */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <div className="bg-card rounded-3xl p-12 md:p-16 border border-border relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
              <div className="max-w-2xl relative z-10">
                <span className="text-primary text-sm font-semibold uppercase tracking-wider">Fundador</span>
                <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mt-3 mb-6">
                  Conozca a nuestro <span className="text-gradient">Fundador</span>
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">
                  Brasileño que vive en Argentina, dueño de un ISP y profesor de tecnología. Comparte sus conocimientos en las redes sociales y tiene como misión mejorar Internet en América Latina a través de la educación y el entrenamiento de pequeños ISPs.
                </p>
                <p className="text-muted-foreground leading-relaxed mb-8">
                  Fundador de la empresa MISP (Mastering Internet Service Provider), que ofrece entrenamientos tanto pagos como gratuitos.
                </p>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                  <Award className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-primary">El curso mejor valorado en Latinoamérica</span>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">
              ¿Listo para ser <span className="text-gradient">Imparable</span>?
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
              Únete a miles de ISPs que ya están transformando sus negocios con la Meteora Academy.
            </p>
            <Link to="/login">
              <Button size="lg" className="glow-primary font-bold gap-2 text-base px-10">
                <Play className="w-5 h-5" /> Quiero Hacer Parte
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-6 bg-card/30">
        <div className="max-w-3xl mx-auto">
          <motion.div
            variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-center mb-12"
          >
            <span className="text-primary text-sm font-semibold uppercase tracking-wider">Dúvidas</span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mt-3">
              Perguntas <span className="text-gradient">Frequentes</span>
            </h2>
          </motion.div>

          <div className="space-y-3">
            {faqs.map((faq, i) => (
              <motion.div
                key={i}
                variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
                className="bg-card rounded-xl border border-border overflow-hidden"
              >
                <button
                  onClick={() => setOpenFaq(openFaq === i ? null : i)}
                  className="w-full flex items-center justify-between px-6 py-5 text-left"
                >
                  <span className="font-display font-medium text-foreground pr-4">{faq.q}</span>
                  <ChevronDown className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? 'max-h-40 pb-5' : 'max-h-0'}`}>
                  <p className="px-6 text-sm text-muted-foreground leading-relaxed">{faq.a}</p>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="border-t border-border bg-card/50 py-16 px-6">
        <div className="max-w-7xl mx-auto">
          <div className="grid md:grid-cols-4 gap-10 mb-12">
            <div>
              <img src={meteoraLogo} alt="Meteora Academy" className="h-7 mb-4" />
              <p className="text-sm text-muted-foreground leading-relaxed">
                Estamos ayudando a construir el futuro de los ISP. Educación, comunidad y tecnología para provedores de internet.
              </p>
            </div>
            <div>
              <h4 className="font-display font-semibold text-foreground mb-4 text-sm">Plataforma</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#cursos" className="hover:text-foreground transition-colors">Cursos</a></li>
                <li><a href="#oraculo" className="hover:text-foreground transition-colors">Oráculo</a></li>
                <li><Link to="/login" className="hover:text-foreground transition-colors">Comunidade</Link></li>
                <li><a href="#depoimentos" className="hover:text-foreground transition-colors">Mentoria</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-semibold text-foreground mb-4 text-sm">Institucional</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#sobre" className="hover:text-foreground transition-colors">Empresa</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Política de Privacidade</a></li>
                <li><a href="https://forms.gle/AUMjzehP8guXcYLXA" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">Trabalhe Conosco</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-semibold text-foreground mb-4 text-sm">Redes Sociais</h4>
              <div className="flex gap-3">
                <a href="#" className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                  <Instagram className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                  <Youtube className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                  <Linkedin className="w-5 h-5" />
                </a>
                <a href="#" className="w-10 h-10 rounded-lg bg-secondary flex items-center justify-center text-muted-foreground hover:text-primary hover:bg-primary/10 transition-colors">
                  <Mail className="w-5 h-5" />
                </a>
              </div>
            </div>
          </div>
          <div className="border-t border-border pt-8 flex flex-col md:flex-row items-center justify-between gap-4">
            <p className="text-xs text-muted-foreground">© 2025 Meteora Academy. Todos os direitos reservados.</p>
            <p className="text-xs text-muted-foreground">MISP - Mastering Internet Service Provider</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
