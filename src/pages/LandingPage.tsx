import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Star, Users, ChevronRight, Zap, Target, Globe, MessageCircle, ChevronDown, Instagram, Youtube, Linkedin, Mail, CheckCircle2, XCircle, Shield, ArrowRight, Headphones, Heart } from 'lucide-react';
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

const DIAGNOSTIC_URL = '/diagnostico';

const LandingPage: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const [openFaq, setOpenFaq] = useState<number | null>(null);

  const faqKeys = [1, 2, 3, 4, 5, 6];

  const beforeItems = [1, 2, 3, 4, 5, 6].map(n => t(`lpBefore${n}`));
  const afterItems = [1, 2, 3, 4, 5, 6].map(n => t(`lpAfter${n}`));
  const diagItems = [1, 2, 3, 4, 5, 6].map(n => t(`lpDiagItem${n}`));
  const supportItems = [1, 2, 3, 4, 5].map(n => t(`lpSupport${n}`));

  const testimonials = [
    { text: t('lpTestimonial1'), name: t('lpTestimonial1Name'), role: t('lpTestimonial1Role'), img: testimonial1 },
    { text: t('lpTestimonial2'), name: t('lpTestimonial2Name'), role: t('lpTestimonial2Role'), img: testimonial2 },
    { text: t('lpTestimonial3'), name: t('lpTestimonial3Name'), role: t('lpTestimonial3Role'), img: testimonial3 },
  ];

  const proofStats = [
    { value: t('lpProofStat1'), label: t('lpProofStat1Label') },
    { value: t('lpProofStat2'), label: t('lpProofStat2Label') },
    { value: t('lpProofStat3'), label: t('lpProofStat3Label') },
  ];

  return (
    <div className="min-h-screen bg-background overflow-x-hidden">
      {/* Navigation - Fixed header */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-background/80 backdrop-blur-xl border-b border-border/50">
        <div className="max-w-7xl mx-auto px-4 md:px-6 h-14 md:h-16 flex items-center justify-between gap-2">
          <img src={meteoraLogo} alt="Meteora Academy" className="h-6 md:h-8 shrink-0" />
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
              <Button size="sm" variant="secondary" className="font-semibold gap-1.5 text-xs md:text-sm whitespace-nowrap">
                <MessageCircle className="w-3.5 h-3.5 md:w-4 md:h-4" />
                <span className="hidden md:inline">{t('lpNavCommunity')}</span>
                <span className="md:hidden">{t('community')}</span>
              </Button>
            </Link>
          </div>
        </div>
      </nav>

      {/* 1️⃣ HERO SECTION */}
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

            <motion.h1 variants={fadeUp} initial="hidden" animate="visible" custom={1} className="text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-display font-bold leading-[1.15] mb-6 text-foreground">
              {t('lpHeroHeadline')}
            </motion.h1>

            <motion.p variants={fadeUp} initial="hidden" animate="visible" custom={2} className="text-lg md:text-xl text-muted-foreground mb-10 max-w-lg leading-relaxed">
              {t('lpHeroSub')}
            </motion.p>

            <motion.div variants={fadeUp} initial="hidden" animate="visible" custom={3}>
              <Link to={DIAGNOSTIC_URL}>
                <Button size="lg" className="glow-primary font-bold gap-2 text-base px-8">
                  <ArrowRight className="w-5 h-5" /> {t('lpHeroCta')}
                </Button>
              </Link>
            </motion.div>
          </div>
        </div>
      </section>

      {/* 2️⃣ DIAGNOSTIC BLOCK */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="bg-card rounded-3xl p-10 md:p-16 border border-border relative overflow-hidden">
            <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
            <div className="relative z-10">
              <div className="w-14 h-14 rounded-2xl bg-primary/10 flex items-center justify-center mb-6">
                <Target className="w-7 h-7 text-primary" />
              </div>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">
                {t('lpDiagTitle')}
              </h2>
              <p className="text-muted-foreground text-lg mb-6">{t('lpDiagDesc')}</p>
              <div className="grid sm:grid-cols-2 gap-3 mb-10">
                {diagItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                    <span className="text-foreground text-sm">{item}</span>
                  </div>
                ))}
              </div>
              <Link to={DIAGNOSTIC_URL}>
                <Button size="lg" className="glow-primary font-bold gap-2 text-base px-8">
                  <ArrowRight className="w-5 h-5" /> {t('lpDiagCta')}
                </Button>
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 3️⃣ BEFORE vs AFTER */}
      <section className="py-24 px-6 bg-card/30">
        <div className="max-w-6xl mx-auto">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground">
              {t('lpCompareTitle')}
            </h2>
          </motion.div>

          <div className="grid md:grid-cols-2 gap-6 md:gap-8">
            {/* BEFORE */}
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={0} className="bg-card rounded-2xl p-8 md:p-10 border border-border">
              <h3 className="text-xl font-display font-bold text-destructive mb-6 flex items-center gap-2">
                <XCircle className="w-6 h-6" /> {t('lpBeforeTitle')}
              </h3>
              <div className="space-y-4">
                {beforeItems.map((item, i) => (
                  <div key={i} className="flex items-center gap-3">
                    <XCircle className="w-5 h-5 text-destructive/60 shrink-0" />
                    <span className="text-muted-foreground">{item}</span>
                  </div>
                ))}
              </div>
            </motion.div>

            {/* AFTER */}
            <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={1} className="bg-card rounded-2xl p-8 md:p-10 border border-primary/30 relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-primary/5 to-transparent" />
              <div className="relative z-10">
                <h3 className="text-xl font-display font-bold text-primary mb-6 flex items-center gap-2">
                  <CheckCircle2 className="w-6 h-6" /> {t('lpAfterTitle')}
                </h3>
                <div className="space-y-4">
                  {afterItems.map((item, i) => (
                    <div key={i} className="flex items-center gap-3">
                      <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                      <span className="text-foreground">{item}</span>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          </div>

          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mt-12">
            <Link to={DIAGNOSTIC_URL}>
              <Button size="lg" className="glow-primary font-bold gap-2 text-base px-8">
                <ArrowRight className="w-5 h-5" /> {t('lpCompareCta')}
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* 4️⃣ SOCIAL PROOF */}
      <section className="py-24 px-6">
        <div className="max-w-7xl mx-auto">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mb-16">
            <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground">
              {t('lpProofTitle')}
            </h2>
          </motion.div>

          {/* Stats */}
          <div className="grid grid-cols-3 gap-6 md:gap-8 mb-16 max-w-3xl mx-auto">
            {proofStats.map((stat, i) => (
              <motion.div key={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} className="text-center">
                <p className="text-4xl md:text-5xl font-display font-bold text-primary">{stat.value}</p>
                <p className="text-sm text-muted-foreground mt-2">{stat.label}</p>
              </motion.div>
            ))}
          </div>

          {/* Testimonials */}
          <div className="grid md:grid-cols-3 gap-6">
            {testimonials.map((item, i) => (
              <motion.div key={item.name} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} className="bg-card rounded-2xl p-8 border border-border">
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

          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center mt-12">
            <Link to={DIAGNOSTIC_URL}>
              <Button size="lg" className="glow-primary font-bold gap-2 text-base px-8">
                <ArrowRight className="w-5 h-5" /> {t('lpProofCta')}
              </Button>
            </Link>
          </motion.div>
        </div>
      </section>

      {/* 5️⃣ SUPPORT / NOT ALONE */}
      <section className="py-24 px-6 bg-card/30">
        <div className="max-w-4xl mx-auto">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="text-center">
            <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-12">
              {t('lpSupportTitle')}
            </h2>
          </motion.div>

          <div className="grid sm:grid-cols-2 gap-4 max-w-2xl mx-auto mb-12">
            {supportItems.map((item, i) => (
              <motion.div key={i} variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} custom={i} className="flex items-center gap-3 bg-card rounded-xl px-5 py-4 border border-border">
                <CheckCircle2 className="w-5 h-5 text-primary shrink-0" />
                <span className="text-foreground text-sm">{item}</span>
              </motion.div>
            ))}
          </div>

          {/* Network strength */}
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }} className="flex justify-center gap-12 mb-12">
            <div className="text-center">
              <p className="text-3xl font-display font-bold text-primary">600+</p>
              <p className="text-xs text-muted-foreground mt-1">{t('lpProofStat1Label')}</p>
            </div>
            <div className="text-center">
              <p className="text-3xl font-display font-bold text-primary">16</p>
              <p className="text-xs text-muted-foreground mt-1">{t('lpProofStat2Label')}</p>
            </div>
          </motion.div>

          <div className="text-center">
            <Link to={DIAGNOSTIC_URL}>
              <Button size="lg" className="glow-primary font-bold gap-2 text-base px-8">
                <ArrowRight className="w-5 h-5" /> {t('lpSupportCta')}
              </Button>
            </Link>
          </div>
        </div>
      </section>

      {/* 6️⃣ GUARANTEE */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <div className="bg-gradient-to-br from-primary/10 via-card to-card rounded-3xl p-12 md:p-16 border border-primary/20 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-64 h-64 bg-primary/5 rounded-full blur-3xl" />
              <div className="absolute bottom-0 left-0 w-48 h-48 bg-primary/5 rounded-full blur-3xl" />
              <div className="relative z-10">
                <div className="w-16 h-16 rounded-2xl bg-primary/10 flex items-center justify-center mx-auto mb-6">
                  <Shield className="w-8 h-8 text-primary" />
                </div>
                <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-6">
                  {t('lpGuaranteeTitle')}
                </h2>
                <p className="text-lg text-muted-foreground mb-10 max-w-xl mx-auto leading-relaxed">
                  {t('lpGuaranteeText')}
                </p>
                <Link to={DIAGNOSTIC_URL}>
                  <Button size="lg" className="glow-primary font-bold gap-2 text-base px-10">
                    <ArrowRight className="w-5 h-5" /> {t('lpGuaranteeCta')}
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

      {/* 7️⃣ FINAL CTA */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <motion.div variants={fadeUp} initial="hidden" whileInView="visible" viewport={{ once: true }}>
            <h2 className="text-3xl md:text-5xl font-display font-bold text-foreground mb-4">
              {t('lpFinalTitle')}
            </h2>
            <p className="text-muted-foreground text-lg mb-10 max-w-xl mx-auto">{t('lpFinalText')}</p>
            <Link to={DIAGNOSTIC_URL}>
              <Button size="lg" className="glow-primary font-bold gap-2 text-lg px-12 py-6 h-auto">
                <ArrowRight className="w-6 h-6" /> {t('lpFinalCta')}
              </Button>
            </Link>
          </motion.div>
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
                <li><Link to={DIAGNOSTIC_URL} className="hover:text-foreground transition-colors">{t('lpDiagCta')}</Link></li>
                <li><Link to="/login" className="hover:text-foreground transition-colors">{t('community')}</Link></li>
                <li><a href="#faq" className="hover:text-foreground transition-colors">FAQ</a></li>
              </ul>
            </div>
            <div>
              <h4 className="font-display font-semibold text-foreground mb-4 text-sm">{t('institutional')}</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
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
