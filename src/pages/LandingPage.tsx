import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Play, Star, Users, Award, ChevronRight, Zap, Target, Globe, MessageCircle, ChevronDown, Instagram, Youtube, Linkedin, Mail, Wifi, Server, Headphones, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useLanguage } from '@/contexts/LanguageContext';
import { languageNames, Language } from '@/lib/i18n';
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
  const { t, language, setLanguage } = useLanguage();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const stats = [
    { value: '2.5M', label: t('views') },
    { value: '27k', label: t('subscribers') },
    { value: '682', label: t('videos') },
    { value: '600+', label: t('studentsLabel') },
    { value: '16', label: t('countries') },
    { value: '30k', label: t('ispsImpacted') },
  ];

  const expertiseKeys = ['expertise1', 'expertise2', 'expertise3', 'expertise4', 'expertise5', 'expertise6', 'expertise7'];

  const features = [
    { icon: Wifi, title: t('feat1Title'), desc: t('feat1Desc') },
    { icon: Users, title: t('feat2Title'), desc: t('feat2Desc') },
    { icon: Headphones, title: t('feat3Title'), desc: t('feat3Desc') },
    { icon: Target, title: t('feat4Title'), desc: t('feat4Desc') },
    { icon: Server, title: t('feat5Title'), desc: t('feat5Desc') },
    { icon: Globe, title: t('feat6Title'), desc: t('feat6Desc') },
  ];

  const testimonials = [
    { name: 'Deivis Nibaldo Montes Zambrano', role: 'ISP Owner', img: testimonial1, text: 'La Mentoria me gusta la forma en que nos ayudamos mutuamente y lo que más me impacta es donde nos reunimos y podemos interactuar y resolver nuestras dudas.' },
    { name: 'Lizbeth Hernandez', role: 'ISP Manager', img: testimonial2, text: 'Me gusta la interacción que se tiene entre los compañeros, porque se aprenden cosas nuevas. Y bueno mejorar más en la parte de nuestros ISPs con estas mentorias prácticas.' },
    { name: 'Alumno Meteora', role: 'ISP Owner', img: testimonial3, text: 'Meteora transformó la forma en que gestionamos nuestro ISP. El conocimiento práctico y la comunidad de apoyo hicieron toda la diferencia para escalar nuestro negocio.' },
  ];

  const faqKeys = [1, 2, 3, 4, 5, 6];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Navigation */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center justify-between gap-2">
          <img src={meteoraLogo} alt="Meteora Academy" className="h-6 md:h-8 shrink-0" />
          <div className="hidden lg:flex items-center gap-8 text-sm text-muted-foreground">
            <a href="#sobre" className="hover:text-foreground transition-colors">{t('experienceTitle')}</a>
            <a href="#cursos" className="hover:text-foreground transition-colors">{t('courses')}</a>
            <a href="#oraculo" className="hover:text-foreground transition-colors">{t('feat3Title')}</a>
            <a href="#depoimentos" className="hover:text-foreground transition-colors">{t('testimonialsLabel')}</a>
            <a href="#faq" className="hover:text-foreground transition-colors">FAQ</a>
          </div>
          <div className="flex items-center gap-2 shrink-0">
            <select
              value={language}
              onChange={(e) => setLanguage(e.target.value as Language)}
              className="bg-secondary text-foreground text-xs rounded-md px-1.5 py-1 border border-border cursor-pointer w-[52px]"
            >
              {(Object.keys(languageNames) as Language[]).map((lang) => (
                <option key={lang} value={lang}>{lang.toUpperCase()}</option>
              ))}
            </select>
            <Link to="/login">
              <Button size="sm" className="glow-primary font-semibold gap-1.5 text-xs md:text-sm whitespace-nowrap">
                <MessageCircle className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="hidden md:inline">{t('accessCommunity')}</span>
                <span className="md:hidden">{t('community')}</span>
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="relative min-h-screen flex items-center pt-16">
        <div className="absolute inset-0">
          <video autoPlay loop muted playsInline className="w-full h-full object-cover" poster={landingHero}>
            <source src={vinheta} type="video/mp4" />
          </video>
          <div className="absolute inset-0 bg-gradient-to-r from-background via-background/90 to-background/50" />
          <div className="absolute inset-0 bg-gradient-to-t from-background via-background/20 to-background/70" />
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-6 py-20 w-full">
          <div className="max-w-2xl">
            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={0}>
              <span className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-primary/10 border border-primary/20 text-primary text-xs font-semibold uppercase tracking-wider mb-6">
                <Zap className="w-3 h-3" /> {t('heroTagline')}
              </span>
            </motion.div>

            <motion.h1 variants={fadeUp} initial="hidden" animate="visible" custom={1} className="text-5xl md:text-7xl font-display font-bold leading-[1.1] mb-6">
              <span className="text-foreground">{t('heroTitle')}</span>
              <br />
              <span className="text-gradient">ISP</span>
            </motion.h1>

            <motion.p variants={fadeUp} initial="hidden" animate="visible" custom={2} className="text-lg md:text-xl text-muted-foreground mb-10 max-w-lg leading-relaxed">
              {t('heroSubtitle')}
            </motion.p>

            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3} className="flex flex-col sm:flex-row gap-4">
              <Link to="/login">
                <Button size="lg" className="glow-primary font-bold gap-2 text-base px-8">
                  <Play className="w-5 h-5" /> {t('startNow')}
                </Button>
              </Link>
              <a href="#sobre">
                <Button size="lg" variant="secondary" className="font-semibold gap-2 text-base">
                  {t('learnMore')} <ChevronRight className="w-4 h-4" />
                </Button>
              </a>
            </motion.div>
          </div>
        </div>

        {/* Stats bar */}
        <div className="absolute bottom-0 left-0 right-0 z-10">
          <div className="max-w-7xl mx-auto px-6">
            <motion.div initial={{ opacity: 0, y: 30 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.8, duration: 0.6 }} className="grid grid-cols-3 md:grid-cols-6 gap-px bg-border rounded-t-2xl overflow-hidden">
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
              <span className="text-primary text-sm font-semibold uppercase tracking-wider">{t('experienceTitle')}</span>
              <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mt-3 mb-6">
                {t('experienceHeading')} <span className="text-gradient">{t('experienceHeadingHighlight')}</span>
              </h2>
              <p className="text-muted-foreground text-lg leading-relaxed mb-8">{t('experienceDesc')}</p>
              <div className="space-y-3">
                {expertiseKeys.map((key, i) => (
                  <motion.div key={key} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                    <span className="text-foreground">{t(key)}</span>
                  </motion.div>
                ))}
              </div>
            </motion.div>

            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={2} className="relative">
              <div className="bg-card rounded-3xl p-8 border border-border relative overflow-hidden">
                <div className="absolute top-0 right-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
                <div className="relative z-10">
                  <h3 className="text-2xl font-display font-bold text-foreground mb-3">{t('mission')}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-6">{t('missionText')}</p>
                  <h3 className="text-2xl font-display font-bold text-foreground mb-3">{t('vision')}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed mb-6">{t('visionText')}</p>
                  <h3 className="text-2xl font-display font-bold text-foreground mb-3">{t('values')}</h3>
                  <p className="text-muted-foreground text-sm leading-relaxed">{t('valuesText')}</p>
                </div>
              </div>
            </motion.div>
          </div>
        </div>
      </section>

      {/* Features */}
      <section id="cursos" className="py-24 px-6 bg-card/30">
        <div className="max-w-7xl mx-auto">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
            <span className="text-primary text-sm font-semibold uppercase tracking-wider">{t('featuresLabel')}</span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mt-3 mb-4">
              {t('featuresTitle')}<br /><span className="text-gradient">{t('featuresHighlight')}</span>
            </h2>
            <p className="text-muted-foreground max-w-2xl mx-auto text-lg">{t('featuresDesc')}</p>
          </motion.div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {features.map((f, i) => (
              <motion.div key={f.title} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} className="bg-card rounded-2xl p-8 border border-border hover:border-primary/30 transition-all duration-300 group">
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
                  <span className="text-gradient">{t('feat3Title')}</span>
                </h2>
                <p className="text-xl text-muted-foreground mb-2">{t('oracleDesc')}</p>
                <p className="text-3xl font-display font-bold text-primary mb-8">
                  U$ 39 <span className="text-lg text-muted-foreground font-normal">/ mes</span>
                </p>
                <Link to="/login">
                  <Button size="lg" className="glow-primary font-bold gap-2 text-base px-10">
                    <Headphones className="w-5 h-5" /> {t('oracleBtn')}
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
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
            <span className="text-primary text-sm font-semibold uppercase tracking-wider">{t('testimonialsLabel')}</span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mt-3">
              {t('testimonialsTitle')}<br /><span className="text-gradient">{t('testimonialsHighlight')}</span>
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-3 gap-8">
            {testimonials.map((item, i) => (
              <motion.div key={item.name} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} className="bg-card rounded-2xl p-8 border border-border relative">
                <div className="flex items-center gap-1 mb-4">
                  {[...Array(5)].map((_, j) => (
                    <Star key={j} className="w-4 h-4 text-primary fill-primary" />
                  ))}
                </div>
                <p className="text-muted-foreground leading-relaxed mb-6 text-sm">"{item.text}"</p>
                <div className="flex items-center gap-3">
                  <img src={item.img} alt={item.name} className="w-11 h-11 rounded-full object-cover" />
                  <div>
                    <p className="text-sm font-semibold text-foreground">{item.name}</p>
                    <p className="text-xs text-muted-foreground">{item.role}</p>
                  </div>
                </div>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* Founder */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <div className="bg-card rounded-3xl p-12 md:p-16 border border-border relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
              <div className="max-w-2xl relative z-10">
                <span className="text-primary text-sm font-semibold uppercase tracking-wider">{t('founderLabel')}</span>
                <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mt-3 mb-6">
                  {t('founderTitle')} <span className="text-gradient">{t('founderHighlight')}</span>
                </h2>
                <p className="text-muted-foreground leading-relaxed mb-4">{t('founderP1')}</p>
                <p className="text-muted-foreground leading-relaxed mb-8">{t('founderP2')}</p>
                <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-primary/10 border border-primary/20">
                  <Award className="w-4 h-4 text-primary" />
                  <span className="text-sm font-medium text-primary">{t('founderBadge')}</span>
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
              {t('ctaTitle')} <span className="text-gradient">{t('ctaHighlight')}</span>?
            </h2>
            <p className="text-muted-foreground text-lg mb-8 max-w-xl mx-auto">{t('ctaDesc')}</p>
            <Link to="/login">
              <Button size="lg" className="glow-primary font-bold gap-2 text-base px-10">
                <Play className="w-5 h-5" /> {t('ctaBtn')}
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* FAQ */}
      <section id="faq" className="py-24 px-6 bg-card/30">
        <div className="max-w-3xl mx-auto">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-12">
            <span className="text-primary text-sm font-semibold uppercase tracking-wider">{t('faqLabel')}</span>
            <h2 className="text-4xl md:text-5xl font-display font-bold text-foreground mt-3">
              {t('faqTitle')} <span className="text-gradient">{t('faqHighlight')}</span>
            </h2>
          </motion.div>

          <div className="space-y-3">
            {faqKeys.map((num, i) => (
              <motion.div key={num} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} className="bg-card rounded-xl border border-border overflow-hidden">
                <button onClick={() => setOpenFaq(openFaq === i ? null : i)} className="w-full flex items-center justify-between px-6 py-5 text-left">
                  <span className="font-display font-medium text-foreground pr-4">{t(`faq${num}q`)}</span>
                  <ChevronDown className={`w-5 h-5 text-muted-foreground shrink-0 transition-transform duration-300 ${openFaq === i ? 'rotate-180' : ''}`} />
                </button>
                <div className={`overflow-hidden transition-all duration-300 ${openFaq === i ? 'max-h-40 pb-5' : 'max-h-0'}`}>
                  <p className="px-6 text-sm text-muted-foreground leading-relaxed">{t(`faq${num}a`)}</p>
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
              <p className="text-sm text-muted-foreground leading-relaxed">{t('footerDesc')}</p>
            </div>
            <div>
              <h4 className="font-display font-semibold text-foreground mb-4 text-sm">{t('platform')}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#cursos" className="hover:text-foreground transition-colors">{t('courses')}</a></li>
                <li><a href="#oraculo" className="hover:text-foreground transition-colors">{t('feat3Title')}</a></li>
                <li><Link to="/login" className="hover:text-foreground transition-colors">{t('community')}</Link></li>
                <li><a href="#depoimentos" className="hover:text-foreground transition-colors">{t('testimonialsLabel')}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-semibold text-foreground mb-4 text-sm">{t('institutional')}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><a href="#sobre" className="hover:text-foreground transition-colors">{t('company')}</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">{t('termsOfUse')}</a></li>
                <li><a href="#" className="hover:text-foreground transition-colors">{t('privacyPolicy')}</a></li>
                <li><a href="https://forms.gle/AUMjzehP8guXcYLXA" target="_blank" rel="noopener noreferrer" className="hover:text-foreground transition-colors">{t('workWithUs')}</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-semibold text-foreground mb-4 text-sm">{t('socialMedia')}</h4>
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
            <p className="text-xs text-muted-foreground">© 2025 Meteora Academy. {t('allRightsReserved')}</p>
            <p className="text-xs text-muted-foreground">MISP - Mastering Internet Service Provider</p>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default LandingPage;
