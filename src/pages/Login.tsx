import React, { useState } from 'react';
import { Navigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Sparkles, Building2, Phone, Globe, Users, Wifi, DollarSign, MessageSquare, Target, ArrowLeft, ArrowRight, CheckCircle2, AlertCircle, HelpCircle } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import meteoraLogo from '@/assets/logo-white-pink.png';

const LATAM_COUNTRIES = [
  'Argentina', 'Bolivia', 'Brasil', 'Chile', 'Colombia', 'Costa Rica', 'Cuba',
  'Ecuador', 'El Salvador', 'Guatemala', 'Honduras', 'México', 'Nicaragua',
  'Panamá', 'Paraguay', 'Perú', 'República Dominicana', 'Uruguay', 'Venezuela', 'Otro',
];

const Login: React.FC = () => {
  const { user, loading, signIn, signUp, signInWithMagicLink } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [mode, setMode] = useState<'login' | 'signup' | 'magic'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pendingApproval, setPendingApproval] = useState(false);
  const [signupComplete, setSignupComplete] = useState(false);
  const [phoneError, setPhoneError] = useState('');
  const [phoneTouched, setPhoneTouched] = useState(false);

  // Signup form fields
  const [step, setStep] = useState(1);
  const [roleType, setRoleType] = useState<'owner' | 'employee' | ''>('');
  const [companyName, setCompanyName] = useState('');
  const [country, setCountry] = useState('');
  const [phone, setPhoneVal] = useState('');
  const [clientCount, setClientCount] = useState('');
  const [networkType, setNetworkType] = useState('');
  const [cheapestPlan, setCheapestPlan] = useState('');
  const [mainProblems, setMainProblems] = useState('');
  const [mainDesires, setMainDesires] = useState('');

  const [approvalChecked, setApprovalChecked] = useState(false);

  if (loading) return null;

  // Check if user is approved
  if (user && !approvalChecked && !pendingApproval) {
    supabase
      .from('profiles')
      .select('approved')
      .eq('user_id', user.id)
      .maybeSingle()
      .then(({ data }) => {
        if (data && !data.approved) {
          setPendingApproval(true);
        }
        setApprovalChecked(true);
      });
  }

  if (user && !approvalChecked) return null; // Wait for approval check

  if (user && pendingApproval) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center max-w-md">
          <img src={meteoraLogo} alt="Meteora Academy" className="h-10 mx-auto mb-8" />
          <div className="bg-card rounded-2xl p-8 border border-border">
            <div className="w-16 h-16 rounded-full bg-primary/10 flex items-center justify-center mx-auto mb-4">
              <Users className="w-8 h-8 text-primary" />
            </div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-2">{t('pendingApproval')}</h2>
            <p className="text-muted-foreground text-sm">{t('pendingApprovalMsg')}</p>
          </div>
        </motion.div>
      </div>
    );
  }

  if (user && approvalChecked && !pendingApproval) {
    return <Navigate to="/app" replace />;
  }

  const totalSteps = 3;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);

    let result: { error: string | null };

    if (mode === 'magic') {
      result = await signInWithMagicLink(email);
      if (!result.error) {
        toast({ title: t('magicLinkSent') });
        setSubmitting(false);
        return;
      }
    } else if (mode === 'signup') {
      // Validate inputs
      if (displayName.length > 100 || companyName.length > 200 || phone.length > 20 || mainProblems.length > 2000 || mainDesires.length > 2000) {
        toast({ title: t('errorOccurred'), variant: 'destructive' });
        setSubmitting(false);
        return;
      }

      result = await signUp(email, password, {
        display_name: displayName,
        role_type: roleType,
        company_name: companyName,
        country,
        phone,
        client_count: clientCount,
        network_type: networkType || undefined,
        cheapest_plan_usd: cheapestPlan || undefined,
        main_problems: mainProblems,
        main_desires: mainDesires,
      });
      if (!result.error) {
        setSignupComplete(true);
        // Trigger n8n workflow notification
        try {
          await supabase.functions.invoke('notify-new-registration', {
            body: { email, displayName, companyName, country, roleType },
          });
        } catch (e) {
          console.error('Failed to notify registration workflow:', e);
        }
        setSubmitting(false);
        return;
      }
    } else {
      result = await signIn(email, password);
      if (!result.error) {
        // Check if approved
        const { data: { user: loggedUser } } = await supabase.auth.getUser();
        if (loggedUser) {
          const { data: profile } = await supabase
            .from('profiles')
            .select('approved')
            .eq('user_id', loggedUser.id)
            .maybeSingle();
          if (profile && !profile.approved) {
            setPendingApproval(true);
            setSubmitting(false);
            return;
          }
        }
      }
    }

    if (result.error) {
      toast({ title: result.error, variant: 'destructive' });
    }
    setSubmitting(false);
  };

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
  const canProceedStep1 = displayName && email && password.length >= 6 && roleType;
  const canProceedStep2 = companyName && country && isPhoneValid;

  // Signup success screen
  if (signupComplete) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center px-6">
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }} className="text-center max-w-md">
          <img src={meteoraLogo} alt="Meteora Academy" className="h-10 mx-auto mb-8" />
          <div className="bg-card rounded-2xl p-8 border border-border">
            <div className="w-16 h-16 rounded-full bg-green-500/10 flex items-center justify-center mx-auto mb-4">
              <CheckCircle2 className="w-8 h-8 text-green-500" />
            </div>
            <h2 className="text-2xl font-display font-bold text-foreground mb-2">{t('signupSuccessTitle')}</h2>
            <p className="text-muted-foreground text-sm mb-6">{t('signupSuccessMsg')}</p>
            <Button onClick={() => window.location.href = '/'} variant="secondary" className="gap-2">
              <ArrowLeft className="w-4 h-4" /> {t('signupSuccessBack')}
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
          <p className="text-xl text-muted-foreground font-display">{t('heroTitle')} ISP</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6 py-8">
        <motion.div
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: 1, x: 0 }}
          className="w-full max-w-md"
        >
          <div className="lg:hidden mb-8">
            <img src={meteoraLogo} alt="Meteora Academy" className="h-10 mb-4" />
          </div>

          <h1 className="text-3xl font-display font-bold text-foreground mb-1">
            {mode === 'signup' ? t('signupTitle') : t('loginTitle')}
          </h1>
          <p className="text-muted-foreground mb-6">
            {mode === 'signup' ? t('signupSubtitle') : t('loginSubtitle')}
          </p>

          {mode === 'signup' && (
            <div className="flex items-center gap-2 mb-6">
              {[1, 2, 3].map((s) => (
                <div key={s} className={`h-1.5 flex-1 rounded-full transition-colors ${s <= step ? 'bg-primary' : 'bg-border'}`} />
              ))}
              <span className="text-xs text-muted-foreground ml-2">{t('step')} {step} {t('of')} {totalSteps}</span>
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {/* LOGIN MODE */}
            {mode === 'login' && (
              <>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type="email" placeholder={t('email')} value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 bg-secondary border-border" required />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type="password" placeholder={t('password')} value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 bg-secondary border-border" required minLength={6} />
                </div>
                <Button type="submit" className="w-full glow-primary font-semibold" size="lg" disabled={submitting}>
                  {t('login')}
                </Button>
              </>
            )}

            {/* MAGIC LINK MODE */}
            {mode === 'magic' && (
              <>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type="email" placeholder={t('email')} value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 bg-secondary border-border" required />
                </div>
                <Button type="submit" className="w-full glow-primary font-semibold" size="lg" disabled={submitting}>
                  {t('magicLink')}
                </Button>
              </>
            )}

            {/* SIGNUP MODE */}
            {mode === 'signup' && step === 1 && (
              <>
                <div className="relative">
                  <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder={t('displayName')} value={displayName} onChange={(e) => setDisplayName(e.target.value)} className="pl-10 bg-secondary border-border" required />
                </div>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type="email" placeholder={t('email')} value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 bg-secondary border-border" required />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input type="password" placeholder={t('password')} value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 bg-secondary border-border" required minLength={6} />
                </div>

                {/* Role selection */}
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">{t('roleType')}</label>
                  <div className="grid grid-cols-2 gap-3">
                    <button type="button" onClick={() => setRoleType('owner')} className={`p-3 rounded-xl border text-sm font-medium transition-all ${roleType === 'owner' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-secondary text-muted-foreground hover:border-primary/30'}`}>
                      {t('ispOwner')}
                    </button>
                    <button type="button" onClick={() => setRoleType('employee')} className={`p-3 rounded-xl border text-sm font-medium transition-all ${roleType === 'employee' ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-secondary text-muted-foreground hover:border-primary/30'}`}>
                      {t('ispEmployee')}
                    </button>
                  </div>
                </div>

                <Button type="button" onClick={() => setStep(2)} className="w-full glow-primary font-semibold gap-2" size="lg" disabled={!canProceedStep1}>
                  {t('next')} <ArrowRight className="w-4 h-4" />
                </Button>
              </>
            )}

            {mode === 'signup' && step === 2 && (
              <>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder={t('companyName')} value={companyName} onChange={(e) => setCompanyName(e.target.value)} className="pl-10 bg-secondary border-border" required />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">{t('country')}</label>
                  <select value={country} onChange={(e) => setCountry(e.target.value)} className="w-full bg-secondary text-foreground border border-border rounded-md px-3 py-2.5 text-sm">
                    <option value="">{t('selectCountry')}</option>
                    {LATAM_COUNTRIES.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>

                <div>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input
                      placeholder={t('phonePlaceholder')}
                      value={phone}
                      onChange={(e) => {
                        setPhoneVal(e.target.value);
                        if (phoneTouched) {
                          if (!e.target.value) setPhoneError(t('phoneRequired'));
                          else if (!validatePhone(e.target.value)) setPhoneError(t('phoneInvalid'));
                          else setPhoneError('');
                        }
                      }}
                      onBlur={handlePhoneBlur}
                      className={`pl-10 bg-secondary border-border ${phoneTouched && phoneError ? 'border-destructive' : phoneTouched && !phoneError && phone ? 'border-green-500' : ''}`}
                      required
                    />
                    {phoneTouched && !phoneError && phone && (
                      <CheckCircle2 className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-green-500" />
                    )}
                    {phoneTouched && phoneError && (
                      <AlertCircle className="absolute right-3 top-1/2 -translate-y-1/2 w-4 h-4 text-destructive" />
                    )}
                  </div>
                  {phoneTouched && phoneError && (
                    <p className="text-xs text-destructive mt-1.5 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {phoneError}
                    </p>
                  )}
                  <p className="text-[11px] text-muted-foreground mt-1">{t('phoneHint')}</p>
                </div>

                <div className="relative">
                  <Users className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                  <Input placeholder={t('clientCountPlaceholder')} value={clientCount} onChange={(e) => setClientCount(e.target.value)} className="pl-10 bg-secondary border-border" />
                </div>

                {roleType === 'owner' && (
                  <>
                    <div>
                      <label className="text-sm font-medium text-foreground mb-2 block">{t('networkType')}</label>
                      <div className="grid grid-cols-3 gap-3">
                        {['radio', 'fiber', 'both'].map((type) => (
                          <button key={type} type="button" onClick={() => setNetworkType(type)} className={`p-2.5 rounded-xl border text-sm font-medium transition-all ${networkType === type ? 'border-primary bg-primary/10 text-primary' : 'border-border bg-secondary text-muted-foreground hover:border-primary/30'}`}>
                            {t(type)}
                          </button>
                        ))}
                      </div>
                    </div>

                    <div className="relative">
                      <DollarSign className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                      <Input type="number" placeholder={t('cheapestPlanPlaceholder')} value={cheapestPlan} onChange={(e) => setCheapestPlan(e.target.value)} className="pl-10 bg-secondary border-border" />
                    </div>
                  </>
                )}

                <div className="flex gap-3">
                  <Button type="button" onClick={() => setStep(1)} variant="secondary" className="flex-1 gap-2" size="lg">
                    <ArrowLeft className="w-4 h-4" /> {t('back')}
                  </Button>
                  <Button type="button" onClick={() => setStep(3)} className="flex-1 glow-primary font-semibold gap-2" size="lg" disabled={!canProceedStep2}>
                    {t('next')} <ArrowRight className="w-4 h-4" />
                  </Button>
                </div>
              </>
            )}

            {mode === 'signup' && step === 3 && (
              <>
                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    {roleType === 'employee' ? t('mainProblemsEmployee') : t('mainProblems')}
                  </label>
                  <textarea value={mainProblems} onChange={(e) => setMainProblems(e.target.value)} className="w-full bg-secondary text-foreground border border-border rounded-md px-3 py-2.5 text-sm min-h-[100px] resize-none placeholder:text-muted-foreground" required />
                </div>

                <div>
                  <label className="text-sm font-medium text-foreground mb-2 block">
                    {roleType === 'employee' ? t('mainDesiresEmployee') : t('mainDesires')}
                  </label>
                  <textarea value={mainDesires} onChange={(e) => setMainDesires(e.target.value)} className="w-full bg-secondary text-foreground border border-border rounded-md px-3 py-2.5 text-sm min-h-[100px] resize-none placeholder:text-muted-foreground" required />
                </div>

                <div className="flex gap-3">
                  <Button type="button" onClick={() => setStep(2)} variant="secondary" className="flex-1 gap-2" size="lg">
                    <ArrowLeft className="w-4 h-4" /> {t('back')}
                  </Button>
                  <Button type="submit" className="flex-1 glow-primary font-semibold" size="lg" disabled={submitting || !mainProblems || !mainDesires}>
                    {t('signup')}
                  </Button>
                </div>
              </>
            )}
          </form>

          <div className="mt-6 space-y-3 text-sm text-center">
            {mode === 'login' && (
              <>
                <button onClick={() => setMode('magic')} className="text-primary hover:underline flex items-center gap-1 mx-auto">
                  <Sparkles className="w-3 h-3" /> {t('loginWithMagicLink')}
                </button>
                <p className="text-muted-foreground">
                  {t('noAccount')}{' '}
                  <button onClick={() => { setMode('signup'); setStep(1); }} className="text-primary hover:underline">{t('signup')}</button>
                </p>
              </>
            )}
            {mode === 'signup' && (
              <>
                <p className="text-muted-foreground">
                  {t('hasAccount')}{' '}
                  <button onClick={() => { setMode('login'); setStep(1); }} className="text-primary hover:underline">{t('login')}</button>
                </p>
                <a
                  href="https://wa.me/5491100000000?text=Hola%2C%20necesito%20ayuda%20para%20registrarme%20en%20Meteora%20Academy"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 text-xs text-muted-foreground hover:text-primary transition-colors"
                >
                  <HelpCircle className="w-3.5 h-3.5" /> {t('needHelp')}
                </a>
              </>
            )}
            {mode === 'magic' && (
              <button onClick={() => setMode('login')} className="text-primary hover:underline">
                {t('loginWithEmail')}
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </div>
  );
};

export default Login;
