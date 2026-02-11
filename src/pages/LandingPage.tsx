import React from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Star, Users, BookOpen, Award, ChevronRight, ArrowRight, Zap, Target, Globe, MessageCircle, ChevronDown, Instagram, Youtube, Linkedin, Mail } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import meteoraLogo from '@/assets/logo-white-pink.png';
import landingHero from '@/assets/landing-hero.jpg';
import testimonial1 from '@/assets/testimonial-1.jpg';
import testimonial2 from '@/assets/testimonial-2.jpg';
import testimonial3 from '@/assets/testimonial-3.jpg';

const fadeUp = {
  hidden: { opacity: 0, y: 40 },
  visible: (i: number = 0) => ({
    opacity: 1,
    y: 0,
    transition: { delay: i * 0.15, duration: 0.7, ease: "easeOut" as const },
  }),
};

const LandingPage: React.FC = () => {
  const { t } = useLanguage();

  const stats = [
    { value: '10.000+', label: 'Alunos Ativos' },
    { value: '150+', label: 'Aulas Exclusivas' },
    { value: '98%', label: 'Satisfação' },
    { value: '24/7', label: 'Suporte' },
  ];

  const features = [
    { icon: BookOpen, title: 'Cursos Premium', desc: 'Conteúdo de alta qualidade produzido por especialistas do mercado com metodologia comprovada.' },
    { icon: Users, title: 'Comunidade Ativa', desc: 'Conecte-se com milhares de alunos, troque experiências e faça networking de verdade.' },
    { icon: Zap, title: 'Aprendizado Acelerado', desc: 'Metodologia prática e objetiva para você dominar novas habilidades em tempo recorde.' },
    { icon: Award, title: 'Certificação', desc: 'Certificados reconhecidos pelo mercado que valorizam seu currículo profissional.' },
    { icon: Target, title: 'Foco em Resultados', desc: 'Nossos alunos não apenas aprendem — eles aplicam e transformam suas carreiras.' },
    { icon: Globe, title: 'Acesso Global', desc: 'Estude de qualquer lugar do mundo, no seu ritmo, com suporte em português, inglês e espanhol.' },
  ];

  const courses = [
    { title: 'Marketing Digital Avançado', category: 'Marketing', students: '2.3k', rating: 4.9 },
    { title: 'Liderança & Gestão de Equipes', category: 'Gestão', students: '1.8k', rating: 4.8 },
    { title: 'Vendas de Alta Performance', category: 'Vendas', students: '3.1k', rating: 4.9 },
    { title: 'Mindset & Produtividade', category: 'Desenvolvimento', students: '2.7k', rating: 4.7 },
  ];

  const testimonials = [
    { name: 'Camila Oliveira', role: 'Empreendedora Digital', img: testimonial1, text: 'A Meteora mudou completamente a minha visão de negócios. Em 3 meses triplicamos o faturamento da minha empresa seguindo as estratégias dos cursos.' },
    { name: 'Rafael Mendes', role: 'CEO, TechStart', img: testimonial2, text: 'A comunidade é o maior diferencial. O networking que fiz na Meteora me abriu portas que eu jamais imaginaria. Recomendo de olhos fechados.' },
    { name: 'Dra. Patricia Santos', role: 'Consultora de Carreira', img: testimonial3, text: 'Qualidade excepcional. Os instrutores são referências no mercado e o suporte é impecável. É investimento, não gasto.' },
  ];

  const faqs = [
    { q: 'Como funciona a Meteora Academy?', a: 'A Meteora é uma plataforma de educação premium com cursos online, comunidade exclusiva e certificação. Ao se tornar membro, você tem acesso a todo o conteúdo e à nossa comunidade de alunos.' },
    { q: 'Posso acessar de qualquer dispositivo?', a: 'Sim! Nossa plataforma é 100% responsiva e funciona em computadores, tablets e smartphones. Estude onde e quando quiser.' },
    { q: 'Como funciona a comunidade?', a: 'Nossa comunidade funciona como um fórum exclusivo onde membros podem interagir, compartilhar experiências, fazer networking e tirar dúvidas diretamente com instrutores.' },
    { q: 'Existe garantia de satisfação?', a: 'Sim, oferecemos 7 dias de garantia incondicional. Se não estiver satisfeito, devolvemos 100% do valor investido.' },
    { q: 'Recebo certificado?', a: 'Sim! Ao concluir cada curso, você recebe um certificado digital reconhecido que pode ser compartilhado no LinkedIn e adicionado ao seu currículo.' },
  ];

  const [openFaq, setOpenFaq] = React.useState<number | null>(null);

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
          <img src={meteoraLogo} alt="Meteora Academy" className="h-8" />
          <div className="hidden md:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#sobre" className="hover:text-foreground transition-colors">Sobre</a>
            <a href="#cursos" className="hover:text-foreground transition-colors">Cursos</a>
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
          <img src={landingHero} alt="" className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/85 to-background/40" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-transparent to-background/60" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 w-full">
          <div className="max-w-2xl">
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-6">
                <Zap className="w-3 h-3" /> Seja Imparável
              </span>
            </motion.div>

            <motion.h1
              variants={fadeUp} initial="hidden" animate="visible" custom={1}
              className="text-5xl md:text-7xl font-display font-bold leading-[1.1] mb-6"
            >
              <span className="text-foreground">Transforme sua</span>
              <br />
              <span className="text-gradient">carreira</span>
              <span className="text-foreground"> com quem</span>
              <br />
              <span className="text-foreground">já chegou lá.</span>
            </motion.h1>

            <motion.p
              variants={fadeUp} initial="hidden" animate="visible" custom={2}
              className="text-lg md:text-xl text-muted-foreground mb-10 max-w-lg leading-relaxed"
            >
              A Meteora Academy reúne os melhores cursos, uma comunidade exclusiva e mentoria de especialistas para acelerar seus resultados.
            </motion.p>

            <motion.div
              variants={fadeUp} initial="hidden" animate="visible" custom={3}
              className="flex flex-col sm:flex-row gap-4"
            >
              <Link to="/login">
                <Button size="lg" className="glow-primary font-bold gap-2 text-base px-8">
                  <Play className="w-5 h-5" /> Começar Agora
                </Button>
              </Link>
              <a href="#sobre">
                <Button size="lg" variant="secondary" className="font-semibold gap-2 text-base">
                  Conhecer a Meteora <ChevronRight className="w-4 h-4" />
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
              className="grid grid-cols-2 md:grid-cols-4 gap-px bg-border rounded-t-2xl overflow-hidden"
            >
              {stats.map((stat) => (
                <div key={stat.label} className="bg-card/80 backdrop-blur-sm px-6 py-5 text-center">
                  <p className="text-2xl md:text-3xl font-display font-bold text-primary">{stat.value}</p>
                  <p className="text-xs text-muted-foreground mt-1">{stat.label}</p>
                </div>
              ))}
            </motion.div>
          </div>
        </div>
      </section>

      {/* About / Features */}
      <section id="sobre" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-primary text-sm font-semibold uppercase tracking-wider">Por que a Meteora?</span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mt-3 mb-4">
              Mais do que cursos.<br />
              <span className="text-gradient">Uma transformação completa.</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">
              Combinamos educação de excelência, comunidade engajada e suporte contínuo para que você alcance resultados reais.
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

      {/* Featured Courses */}
      <section id="cursos" className="py-24 px-6 bg-card/30">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="flex items-end justify-between mb-12"
          >
            <div>
              <span className="text-primary text-sm font-semibold uppercase tracking-wider">Cursos</span>
              <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mt-3">
                Cursos em <span className="text-gradient">Destaque</span>
              </h2>
            </div>
            <Link to="/login" className="hidden md:flex items-center gap-1 text-primary hover:underline font-medium text-sm">
              Ver todos <ArrowRight className="w-4 h-4" />
            </Link>
          </motion.div>

          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-6">
            {courses.map((c, i) => (
              <motion.div
                key={c.title}
                variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i}
                className="bg-card rounded-2xl overflow-hidden border border-border hover:border-primary/30 transition-all duration-300 group cursor-pointer"
              >
                <div className="aspect-video bg-gradient-to-br from-primary/20 via-secondary to-card flex items-center justify-center">
                  <BookOpen className="w-10 h-10 text-primary/40 group-hover:text-primary/60 transition-colors" />
                </div>
                <div className="p-5">
                  <span className="text-xs font-medium text-primary uppercase tracking-wider">{c.category}</span>
                  <h3 className="font-display font-semibold text-foreground mt-1 mb-3 leading-snug">{c.title}</h3>
                  <div className="flex items-center gap-4 text-xs text-muted-foreground">
                    <span className="flex items-center gap-1">
                      <Star className="w-3 h-3 text-primary fill-primary" /> {c.rating}
                    </span>
                    <span className="flex items-center gap-1">
                      <Users className="w-3 h-3" /> {c.students}
                    </span>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials */}
      <section id="depoimentos" className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div
            variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}
            className="text-center mb-16"
          >
            <span className="text-primary text-sm font-semibold uppercase tracking-wider">Depoimentos</span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mt-3">
              Quem faz parte, <span className="text-gradient">recomenda.</span>
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

      {/* CTA */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <div className="bg-gradient-to-br from-primary/10 via-card to-card rounded-3xl p-12 md:p-16 border border-primary/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
              <div className="relative z-10">
                <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">
                  Pronto para ser <span className="text-gradient">imparável</span>?
                </h2>
                <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">
                  Junte-se a milhares de alunos que já estão transformando suas carreiras com a Meteora Academy.
                </p>
                <Link to="/login">
                  <Button size="lg" className="glow-primary font-bold gap-2 text-base px-10">
                    <Play className="w-5 h-5" /> Quero Fazer Parte
                  </Button>
                </Link>
              </div>
            </div>
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
                Educação de excelência para transformar carreiras e vidas.
              </p>
            </div>
            <div>
              <h4 className="font-display font-semibold text-foreground mb-4 text-sm">Plataforma</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#cursos" className="hover:text-foreground transition-colors">Cursos</a></li>
                <li><a href="#sobre" className="hover:text-foreground transition-colors">Comunidade</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Planos</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Certificados</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-semibold text-foreground mb-4 text-sm">Institucional</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#sobre" className="hover:text-foreground transition-colors">Sobre</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Termos de Uso</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Política de Privacidade</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">Contato</a></li>
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
            <p className="text-xs text-muted-foreground">CNPJ: 00.000.000/0001-00</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
