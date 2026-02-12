import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, User, Mail, Phone, Globe, Building2, Users, Wifi, DollarSign, MessageSquare, Target, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';
import PhoneInput from '@/components/PhoneInput';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import meteoraLogo from '@/assets/logo-white-pink.png';

const LATAM_COUNTRIES = [
  'Argentina', 'Bolivia', 'Brasil', 'Chile', 'Colombia', 'Costa Rica', 'Cuba',
  'Ecuador', 'El Salvador', 'Guatemala', 'Honduras', 'México', 'Nicaragua',
  'Panamá', 'Paraguay', 'Perú', 'República Dominicana', 'Uruguay', 'Venezuela', 'Otro',
];

const fadeUp = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -20 },
  transition: { duration: 0.4 },
};

const Diagnostico: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();

  const [step, setStep] = useState(1);
  const [submitting, setSubmitting] = useState(false);
  const [success, setSuccess] = useState(false);

  // Step 1
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [phoneError, setPhoneError] = useState('');
  const [phoneTouched, setPhoneTouched] = useState(false);

  // Step 2
  const [companyName, setCompanyName] = useState('');
  const [roleType, setRoleType] = useState('');
  const [clientCount, setClientCount] = useState('');
  const [networkType, setNetworkType] = useState('');
  const [cheapestPlan, setCheapestPlan] = useState('');

  // Step 3
  const [mainProblems, setMainProblems] = useState('');
  const [techKnowledge, setTechKnowledge] = useState('');
  const [mainGoals, setMainGoals] = useState('');

  const totalSteps = 3;

  const validatePhone = (value: string): boolean => {
    const cleaned = value.replace(/[\s\-\(\)]/g, '');
    return /^\+\d{10,15}$/.test(cleaned);
  };

  const handlePhoneBlur = () => {
    setPhoneTouched(true);
    if (!phone) {
      setPhoneError(t('phoneRequired'));
    } else if (!validatePhone(phone)) {
      setPhoneError(t('phoneInvalid'));
    } else {
      setPhoneError('');
    }
  };

  const isPhoneValid = phone && validatePhone(phone);
  const canProceedStep1 = name && email && isPhoneValid && country;
  const canProceedStep2 = companyName && roleType && clientCount && networkType;

  const handleSubmit = async () => {
    setSubmitting(true);
    try {
      const { error } = await supabase.from('diagnostics' as any).insert({
        name,
        email,
        phone,
        country,
        company_name: companyName,
        role_type: roleType,
        client_count: clientCount,
        network_type: networkType,
        cheapest_plan: cheapestPlan ? parseFloat(cheapestPlan) : null,
        main_problems: mainProblems,
        tech_knowledge: techKnowledge,
        main_goals: mainGoals,
      } as any);

      if (error) throw error;

      // Try to notify via edge function
      try {
        await supabase.functions.invoke('notify-new-registration', {
          body: { email, displayName: name, companyName, country, roleType, phone, clientCount, networkType, cheapestPlan, mainProblems, mainGoals, type: 'diagnostic' },
        });
      } catch (e) {
        console.error('Failed to notify:', e);
      }

      setSuccess(true);
    } catch (err) {
      console.error(err);
      toast({ title: t('errorOccurred'), variant: 'destructive' });
    }
    setSubmitting(false);
  };

  if (success) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <motion.div {...fadeUp} className="text-center max-w-md">
          <img src={meteoraLogo} alt="Meteora Academy" className="h-10 mx-auto mb-8" />
          <div className="bg-card rounded-2xl p-8 border border-border">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-2">{t('diagSuccessTitle')}</h2>
            <p className="text-muted-foreground text-sm mb-6">{t('diagSuccessMsg')}</p>
            <Button asChild variant="secondary" className="gap-2">
              <Link to="/"><ArrowLeft className="w-4 h-4" /> {t('diagSuccessBack')}</Link>
            </Button>
          </div>
        </motion.div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-primary/5 blur-2xl" />
        <div className="relative z-10 text-center px-16">
          <img src={meteoraLogo} alt="Meteora Academy" className="h-14 mx-auto mb-8" />
          <p className="text-xl text-muted-foreground font-display">{t('diagPageTitle')}</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} className="w-full max-w-md">
          {/* Mobile header */}
          <div className="lg:hidden mb-6">
            <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm mb-4">
              <ArrowLeft className="w-4 h-4" /> {t('diagSuccessBack')}
            </Link>
            <img src={meteoraLogo} alt="Meteora Academy" className="h-10 mb-4" />
          </div>

          {/* Desktop back link */}
          <div className="hidden lg:block mb-4">
            <Link to="/" className="inline-flex items-center gap-2 text-muted-foreground hover:text-foreground text-sm">
              <ArrowLeft className="w-4 h-4" /> {t('diagSuccessBack')}
            </Link>
          </div>

          <h1 className="text-3xl font-display font-bold text-foreground mb-1">{t('diagPageTitle')}</h1>
          <p className="text-muted-foreground mb-6">{t('diagPageSubtitle')}</p>

          {/* Progress bar */}
          <div className="flex items-center gap-2 mb-6">
            {[1, 2, 3].map((s) => (
              <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? 'bg-primary' : 'bg-border'}`} />
            ))}
            <span className="text-xs text-muted-foreground ml-2">
              {t('step')} {step} {t('of')} {totalSteps} — {step === 1 ? t('diagStep1Title') : step === 2 ? t('diagStep2Title') : t('diagStep3Title')}
            </span>
          </div>

          <AnimatePresence mode="wait">
            {/* STEP 1 */}
            {step === 1 && (
              <motion.div key="step1" {...fadeUp} className="space-y-4">
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder={t('diagName')} value={name} onChange={(e) => setName(e.target.value)} className="pl-10 bg-secondary border-border" />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type="email" placeholder={t('diagEmail')} value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 bg-secondary border-border" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">{t('diagPhone')}</label>
                  <PhoneInput
                    value={phone}
                    onChange={(val) => {
                      setPhone(val);
                      if (phoneTouched) {
                        if (!val) setPhoneError(t('phoneRequired'));
                        else if (!validatePhone(val)) setPhoneError(t('phoneInvalid'));
                        else setPhoneError('');
                      }
                    }}
                    onBlur={handlePhoneBlur}
                    error={phoneTouched && !!phoneError}
                    success={phoneTouched && !phoneError && !!phone}
                    defaultCountry={country}
                  />
                  {phoneTouched && phoneError && (
                    <p className="text-xs text-destructive mt-1.5 flex items-center gap-1"><AlertCircle className="w-3 h-3" /> {phoneError}</p>
                  )}
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">{t('diagCountry')}</label>
                  <select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full bg-secondary text-foreground border border-border rounded-md px-3 py-2.5 text-sm">
                    <option value="">{t('selectCountry')}</option>
                    {LATAM_COUNTRIES.map((c) => <option key={c} value={c}>{c}</option>)}
                  </select>
                </div>
                <Button type="button" onClick={() => setStep(2)} className="w-full glow-primary font-semibold gap-2" size="lg" disabled={!canProceedStep1}>
                  {t('diagNext')} <ArrowRight className="w-4 h-4" />
                </Button>
              </motion.div>
            )}

            {/* STEP 2 */}
            {step === 2 && (
              <motion.div key="step2" {...fadeUp} className="space-y-4">
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder={t('diagCompany')} value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="pl-10 bg-secondary border-border" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">{t('diagRole')}</label>
                  <div className="grid grid-cols-2 gap-3">
                    {['owner', 'employee'].map((r) => (
                      <button key={r} type="button" onClick={() => setRoleType(r)}
                        className={`p-3 rounded-xl border text-sm font-medium transition-all ${roleType === r ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-secondary text-muted-foreground hover:border-primary/30'}`}>
                        {r === 'owner' ? t('diagOwner') : t('diagEmployee')}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">{t('diagClients')}</label>
                  <div className="relative">
                    <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder={t('diagClientsPlaceholder')} value={clientCount} onChange={(e) => setClientCount(e.target.value)} className="pl-10 bg-secondary border-border" />
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">{t('diagNetwork')}</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['radio', 'fiber', 'hybrid'].map((type) => (
                      <button key={type} type="button" onClick={() => setNetworkType(type)}
                        className={`p-3 rounded-xl border text-sm font-medium transition-all ${networkType === type ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-secondary text-muted-foreground hover:border-primary/30'}`}>
                        {type === 'radio' ? t('diagRadio') : type === 'fiber' ? t('diagFiber') : t('diagHybrid')}
                      </button>
                    ))}
                  </div>
                </div>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type="number" placeholder={t('diagCheapestPlaceholder')} value={cheapestPlan} onChange={(e) => setCheapestPlan(e.target.value)} className="pl-10 bg-secondary border-border" />
                </div>
                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setStep(1)} className="flex-1 gap-2">
                    <ArrowLeft className="w-4 h-4" /> {t('diagBack')}
                  </Button>
                  <Button type="button" onClick={() => setStep(3)} className="flex-1 glow-primary font-semibold gap-2" disabled={!canProceedStep2}>
                    {t('diagNext')} <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </motion.div>
            )}

            {/* STEP 3 */}
            {step === 3 && (
              <motion.div key="step3" {...fadeUp} className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">{t('diagProblems')}</label>
                  <Textarea placeholder={t('diagProblemsPlaceholder')} value={mainProblems} onChange={(e) => setMainProblems(e.target.value)} className="bg-secondary border-border min-h-[100px]" />
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">{t('diagTechKnowledge')}</label>
                  <div className="grid grid-cols-3 gap-3">
                    {['basic', 'intermediate', 'advanced'].map((level) => (
                      <button key={level} type="button" onClick={() => setTechKnowledge(level)}
                        className={`p-3 rounded-xl border text-sm font-medium transition-all ${techKnowledge === level ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-secondary text-muted-foreground hover:border-primary/30'}`}>
                        {level === 'basic' ? t('diagTechBasic') : level === 'intermediate' ? t('diagTechIntermediate') : t('diagTechAdvanced')}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">{t('diagGoals')}</label>
                  <Textarea placeholder={t('diagGoalsPlaceholder')} value={mainGoals} onChange={(e) => setMainGoals(e.target.value)} className="bg-secondary border-border min-h-[100px]" />
                </div>
                <div className="flex gap-3">
                  <Button type="button" variant="outline" onClick={() => setStep(2)} className="flex-1 gap-2">
                    <ArrowLeft className="w-4 h-4" /> {t('diagBack')}
                  </Button>
                  <Button type="button" onClick={handleSubmit} className="flex-1 glow-primary font-semibold" disabled={submitting || !mainProblems || !techKnowledge || !mainGoals}>
                    {submitting ? t('loading') + '...' : t('diagSubmit')}
                  </Button>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      </div>
    </div>
  );
};

export default Diagnostico;
