import React, { useState } from 'react';
import { Navigate, Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Mail, Lock, User, Sparkles } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import meteoraLogo from '@/assets/logo-white-pink.png';

const Login: React.FC = () => {
  const { user, loading, signIn, signUp, signInWithMagicLink } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [mode, setMode] = useState<'login' | 'signup' | 'magic'>('login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [displayName, setDisplayName] = useState('');
  const [submitting, setSubmitting] = useState(false);

  if (loading) return null;
  if (user) return <Navigate to="/" replace />;

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
      result = await signUp(email, password, displayName);
      if (!result.error) {
        toast({ title: t('checkEmail') });
        setSubmitting(false);
        return;
      }
    } else {
      result = await signIn(email, password);
    }

    if (result.error) {
      toast({ title: result.error, variant: 'destructive' });
    }
    setSubmitting(false);
  };

  return (
    <div className="min-h-screen bg-background flex">
      {/* Left decorative panel */}
      <div className="hidden lg:flex flex-1 relative items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-primary/20 via-background to-background" />
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-primary/10 blur-3xl" />
        <div className="absolute bottom-1/4 right-1/4 w-64 h-64 rounded-full bg-primary/5 blur-2xl" />
        <div className="relative z-10 text-center px-16">
          <img src={meteoraLogo} alt="Meteora Academy" className="h-14 mx-auto mb-8" />
          <p className="text-xl text-muted-foreground font-display">{t('heroTitle')}</p>
        </div>
      </div>

      {/* Right form panel */}
      <div className="flex-1 flex items-center justify-center px-6">
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
          <p className="text-muted-foreground mb-8">
            {mode === 'signup' ? t('signupSubtitle') : t('loginSubtitle')}
          </p>

          <form onSubmit={handleSubmit} className="space-y-4">
            {mode === 'signup' && (
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  placeholder={t('displayName')}
                  value={displayName}
                  onChange={(e) => setDisplayName(e.target.value)}
                  className="pl-10 bg-secondary border-border"
                  required
                />
              </div>
            )}

            <div className="relative">
              <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                type="email"
                placeholder={t('email')}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="pl-10 bg-secondary border-border"
                required
              />
            </div>

            {mode !== 'magic' && (
              <div className="relative">
                <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                <Input
                  type="password"
                  placeholder={t('password')}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="pl-10 bg-secondary border-border"
                  required
                  minLength={6}
                />
              </div>
            )}

            <Button type="submit" className="w-full glow-primary font-semibold" size="lg" disabled={submitting}>
              {mode === 'magic' ? t('magicLink') : mode === 'signup' ? t('signup') : t('login')}
            </Button>
          </form>

          <div className="mt-6 space-y-3 text-sm text-center">
            {mode === 'login' && (
              <>
                <button onClick={() => setMode('magic')} className="text-primary hover:underline flex items-center gap-1 mx-auto">
                  <Sparkles className="w-3 h-3" /> {t('loginWithMagicLink')}
                </button>
                <p className="text-muted-foreground">
                  {t('noAccount')}{' '}
                  <button onClick={() => setMode('signup')} className="text-primary hover:underline">{t('signup')}</button>
                </p>
              </>
            )}
            {mode === 'signup' && (
              <p className="text-muted-foreground">
                {t('hasAccount')}{' '}
                <button onClick={() => setMode('login')} className="text-primary hover:underline">{t('login')}</button>
              </p>
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
