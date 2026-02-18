import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, User, Mail, CheckCircle2, Loader2, Target, TrendingUp, ShieldAlert, BarChart3, Zap, MessageSquare, Lock, AlertTriangle, Sparkles, ArrowUpRight } from 'lucide-react';
import PhoneInput from '@/components/PhoneInput';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import meteoraLogo from '@/assets/logo-white-pink.png';
import { Card } from '@/components/ui/card';
import { Progress } from '@/components/ui/progress';

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

type Question = {
  id: string;
  section: string;
  type: 'scale' | 'likert' | 'single_choice' | 'multiple_choice' | 'text_open';
  question_text: string;
  description?: string;
  options: any[];
  weight: number;
};

const LEVEL_CONFIG: Record<string, { color: string; emoji: string; subtexto: string }> = {
  diagReactive: {
    color: 'text-destructive',
    emoji: '🔴',
    subtexto: 'Tu ISP opera en modo supervivencia. Sin estructura, cada crecimiento genera más caos que rentabilidad.',
  },
  diagInstable: {
    color: 'text-amber-500',
    emoji: '🟡',
    subtexto: 'Tu ISP tiene capacidad de crecimiento, pero la falta de estructura en áreas clave está limitando tu rentabilidad y estabilidad.',
  },
  diagTransition: {
    color: 'text-emerald-500',
    emoji: '🟢',
    subtexto: 'Tu ISP está avanzando. Con ajustes estratégicos en los puntos débiles, puedes acelerar significativamente.',
  },
  diagStructured: {
    color: 'text-primary',
    emoji: '🔷',
    subtexto: 'Tu ISP tiene bases sólidas. El siguiente paso es optimizar y escalar con estrategia avanzada.',
  },
};

const CONSEQUENCE_MESSAGES: Record<string, string> = {
  technical: 'Sin estructura técnica sólida, cualquier crecimiento aumentará el riesgo de cortes, desgaste interno y pérdida de clientes.',
  financial: 'Sin claridad financiera, cada decisión será un tiro al aire. Tu ISP crecerá en clientes pero no en rentabilidad.',
  scale: 'Si no estructuras tu sistema comercial, tu crecimiento dependerá del azar y terminará generando más presión operativa que resultados.',
  expansion: 'Tienes mercado disponible, pero sin preparación operativa, la expansión puede colapsar tu estructura actual.',
  commitment: 'Sin compromiso estratégico definido, los cambios serán superficiales y no generarán transformación real.',
};

const Diagnostico: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState<'lead' | 'questions' | 'processing' | 'auth' | 'results'>('lead');
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<Question[]>([]);
  const [currentQuestionIndex, setCurrentQuestionIndex] = useState(0);
  const [answers, setAnswers] = useState<Record<string, any>>({});
  
  // Lead Data
  const [name, setName] = useState('');
  const [email, setEmail] = useState('');
  const [phone, setPhone] = useState('');
  const [country, setCountry] = useState('');
  const [password, setPassword] = useState('');
  const [existingUser, setExistingUser] = useState(false);
  
  // Results
  const [scores, setScores] = useState<Record<string, number>>({});
  const [generalLevel, setGeneralLevel] = useState('');
  const [weightedIndex, setWeightedIndex] = useState(0);
  const [advisorUrl, setAdvisorUrl] = useState('');
  const [recommendations, setRecommendations] = useState<any[]>([]);
  const [clientCount, setClientCount] = useState(0);

  useEffect(() => {
    const fetchQuestions = async () => {
      const { data } = await supabase.from('diagnostic_questions').select('*').order('sort_order', { ascending: true });
      if (data) setQuestions(data as Question[]);
    };
    const fetchAdvisorUrl = async () => {
      const { data } = await supabase.from('platform_settings').select('value').eq('key', 'whatsapp_advisor_url').maybeSingle();
      if (data) setAdvisorUrl(data.value || '');
    };
    const fetchRules = async () => {
      const { data } = await supabase.from('diagnostic_recommendation_rules').select('*, products:recommended_product_id(id, name, thumbnail_url)').order('priority', { ascending: true });
      if (data) setRecommendations(data);
    };
    fetchQuestions();
    fetchAdvisorUrl();
    fetchRules();
  }, []);

  const validatePhone = (value: string): boolean => {
    const cleaned = value.replace(/[\s\-\(\)]/g, '');
    return /^\+\d{10,15}$/.test(cleaned);
  };

  const handleStartQuestions = () => {
    if (!name || !email || !validatePhone(phone) || !country) {
      toast({ title: t('fillRequiredFields'), variant: 'destructive' });
      return;
    }
    setStep('questions');
  };

  const handleAnswer = (questionId: string, value: any) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const handleMultipleAnswer = (questionId: string, value: string) => {
    setAnswers(prev => {
      const current = prev[questionId] || [];
      const arr = Array.isArray(current) ? current : [];
      return { ...prev, [questionId]: arr.includes(value) ? arr.filter((v: string) => v !== value) : [...arr, value] };
    });
  };

  const handleNumericAnswer = (questionId: string, value: string) => {
    setAnswers(prev => ({ ...prev, [questionId]: value }));
  };

  const isObjectiveQuestion = (q: Question) => q.weight === 0;

  const nextQuestion = () => {
    if (currentQuestionIndex < questions.length - 1) {
      setCurrentQuestionIndex(prev => prev + 1);
    } else {
      calculateAndSaveResults();
    }
  };

  const calculateAndSaveResults = async () => {
    setStep('processing');
    setLoading(true);

    try {
      const sectionScores: Record<string, number[]> = {
        technical: [], financial: [], scale: [], expansion: [], commitment: []
      };

      // Extract client count from objective questions
      let detectedClientCount = 0;
      questions.forEach(q => {
        const answer = answers[q.id];
        if (answer === undefined) return;
        
        // Capture client count for special logic
        if (q.weight === 0 && q.section === 'financial' && q.question_text.toLowerCase().includes('clientes domiciliarios')) {
          detectedClientCount = Number(answer) || 0;
        }
        
        if (q.weight === 0) return; // Skip objective data from scoring

        let scoreValue = 0;
        if (q.type === 'scale') {
          scoreValue = Number(answer);
        } else if (q.type === 'likert') {
          scoreValue = Number(answer);
        } else if (q.type === 'single_choice') {
          const option = q.options.find((o: any) => o.value === answer);
          scoreValue = option?.score || 0;
        } else if (q.type === 'multiple_choice') {
          const selected = Array.isArray(answer) ? answer : [];
          let total = 0;
          selected.forEach((val: string) => {
            const opt = q.options.find((o: any) => o.value === val);
            total += opt?.score || 0;
          });
          const maxPossible = q.options.reduce((sum: number, o: any) => sum + Math.max(0, o.score || 0), 0);
          const minPossible = q.options.reduce((sum: number, o: any) => sum + Math.min(0, o.score || 0), 0);
          const range = maxPossible - minPossible;
          scoreValue = range > 0 ? ((total - minPossible) / range) * 10 : 5;
        }
        sectionScores[q.section]?.push(scoreValue);
      });

      const finalScores: Record<string, number> = {};
      Object.keys(sectionScores).forEach(section => {
        const vals = sectionScores[section];
        finalScores[section] = vals.length > 0 ? vals.reduce((a, b) => a + b, 0) / vals.length : 5;
      });

      const wi = (
        (finalScores.technical * 0.25) +
        (finalScores.financial * 0.20) +
        (finalScores.scale * 0.25) +
        (finalScores.expansion * 0.15) +
        (finalScores.commitment * 0.15)
      );

      let level = 'diagReactive';
      if (wi >= 9) level = 'diagStructured';
      else if (wi >= 7) level = 'diagTransition';
      else if (wi >= 5) level = 'diagInstable';

      setScores(finalScores);
      setGeneralLevel(level);
      setWeightedIndex(wi);
      setClientCount(detectedClientCount);

      // Save to DB
      const { data: diagData, error: diagError } = await supabase.from('diagnostics').insert({
        name, email, phone, country,
        client_count: detectedClientCount.toString(),
        scores: finalScores,
        results: { weightedIndex: wi, level },
        status: 'completed'
      }).select().single();

      if (diagError) throw diagError;

      // Atomic answers
      const answerInserts = Object.entries(answers).map(([qId, val]) => ({
        diagnostic_id: diagData.id,
        question_id: qId,
        answer_value: val
      }));
      await supabase.from('diagnostic_answers').insert(answerInserts);

      // Create lead tracking record
      const sorted = Object.entries(finalScores).sort(([, a], [, b]) => a - b);
      const criticalArea = sorted[0]?.[0] || 'technical';
      
      // Determine auto lead temperature
      let autoTemp = 'cold';
      if (finalScores.commitment >= 8) autoTemp = 'hot';
      else if (finalScores.commitment >= 5) autoTemp = 'warm';

      // Match recommendations for auto product
      const matchedRules = recommendations.filter(rule => {
        const fieldVal = finalScores[rule.condition_field] ?? 0;
        switch (rule.condition_operator) {
          case '<': return fieldVal < rule.condition_value;
          case '<=': return fieldVal <= rule.condition_value;
          case '>': return fieldVal > rule.condition_value;
          case '>=': return fieldVal >= rule.condition_value;
          case '=': return fieldVal === rule.condition_value;
          default: return false;
        }
      });

      await supabase.from('diagnostic_lead_tracking').insert({
        diagnostic_id: diagData.id,
        lead_temperature: autoTemp,
        commercial_status: 'new',
        assigned_level_auto: level.replace('diag', ''),
        recommended_product_auto: matchedRules[0]?.title || null,
        last_action: 'Completó diagnóstico',
        last_action_at: new Date().toISOString(),
      });

      // Check if user already exists
      const { data: profileData } = await supabase.from('profiles').select('id').eq('email', email).maybeSingle();
      setExistingUser(!!profileData);

      // Move to auth step (password creation)
      setStep('auth');
    } catch (err) {
      console.error(err);
      toast({ title: t('errorOccurred'), variant: 'destructive' });
      setStep('lead');
    }
    setLoading(false);
  };

  const handleAuthAndShowResults = async () => {
    setLoading(true);
    try {
      if (existingUser) {
        // Try to sign in
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) {
          toast({ title: 'Contraseña incorrecta', variant: 'destructive' });
          setLoading(false);
          return;
        }
      } else {
        // Sign up
        if (password.length < 6) {
          toast({ title: 'La contraseña debe tener al menos 6 caracteres', variant: 'destructive' });
          setLoading(false);
          return;
        }
        const { error } = await supabase.auth.signUp({
          email, password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: name, phone, country }
          }
        });
        if (error) {
          toast({ title: error.message, variant: 'destructive' });
          setLoading(false);
          return;
        }
      }
      setStep('results');
    } catch (err) {
      console.error(err);
      toast({ title: t('errorOccurred'), variant: 'destructive' });
    }
    setLoading(false);
  };

  const currentQuestion = questions[currentQuestionIndex];

  // Get matched rules for results
  const matchedRules = recommendations.filter(rule => {
    const fieldVal = scores[rule.condition_field] ?? 0;
    switch (rule.condition_operator) {
      case '<': return fieldVal < rule.condition_value;
      case '<=': return fieldVal <= rule.condition_value;
      case '>': return fieldVal > rule.condition_value;
      case '>=': return fieldVal >= rule.condition_value;
      case '=': return fieldVal === rule.condition_value;
      default: return false;
    }
  });

  const sorted = Object.entries(scores).sort(([, a], [, b]) => a - b);
  const worst = sorted[0];
  const second = sorted[1];
  const best = sorted[sorted.length - 1];
  const sectionLabel = (key: string) => t(`diag${key.charAt(0).toUpperCase() + key.slice(1)}`);
  const levelCfg = LEVEL_CONFIG[generalLevel] || LEVEL_CONFIG.diagInstable;

  // Section labels & icons for step headers
  const SECTION_META: Record<string, { icon: string; label: string; step: number }> = {
    technical: { icon: '🔧', label: 'Arquitectura Técnica', step: 1 },
    financial: { icon: '💰', label: 'Gestión Financiera', step: 2 },
    scale: { icon: '📈', label: 'Escala Comercial', step: 3 },
    expansion: { icon: '🚀', label: 'Potencial de Expansión', step: 4 },
    commitment: { icon: '🎯', label: 'Compromiso Estratégico', step: 5 },
  };

  // Calculate accelerated progress (feels faster at start, slower at end)
  const calcProgress = () => {
    const raw = (currentQuestionIndex + 1) / questions.length;
    // Ease-out curve: feels fast initially
    return Math.round((1 - Math.pow(1 - raw, 0.6)) * 100);
  };

  // Get current section info
  const currentSectionMeta = currentQuestion ? SECTION_META[currentQuestion.section] || { icon: '📋', label: currentQuestion.section, step: 0 } : null;

  // Detect section transitions
  const prevSection = currentQuestionIndex > 0 ? questions[currentQuestionIndex - 1]?.section : null;
  const isNewSection = currentQuestion && currentQuestion.section !== prevSection;

  // Questions remaining in current section
  const questionsInSection = currentQuestion ? questions.filter(q => q.section === currentQuestion.section).length : 0;
  const currentInSection = currentQuestion ? questions.filter(q => q.section === currentQuestion.section).indexOf(currentQuestion) + 1 : 0;

  // Encouragement messages
  const getEncouragement = () => {
    const pct = ((currentQuestionIndex + 1) / questions.length) * 100;
    if (pct >= 90) return '🏁 ¡Ya casi terminas!';
    if (pct >= 75) return '💪 ¡Falta muy poco!';
    if (pct >= 50) return '🔥 ¡Vas por la mitad!';
    if (pct >= 25) return '⚡ ¡Buen ritmo!';
    return null;
  };

  const LIKERT_OPTIONS = [
    { val: 10, label: 'Totalmente de acuerdo', emoji: '💚', color: 'border-emerald-500/40 hover:bg-emerald-500/10' },
    { val: 8, label: 'De acuerdo', emoji: '👍', color: 'border-emerald-400/30 hover:bg-emerald-400/5' },
    { val: 6, label: 'Neutral', emoji: '😐', color: 'border-amber-400/30 hover:bg-amber-400/5' },
    { val: 4, label: 'En desacuerdo', emoji: '👎', color: 'border-orange-400/30 hover:bg-orange-400/5' },
    { val: 2, label: 'Totalmente en desacuerdo', emoji: '❌', color: 'border-destructive/30 hover:bg-destructive/5' },
  ];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <img src={meteoraLogo} alt="Meteora Academy" className="h-12 mx-auto mb-4" />
        </div>

        <AnimatePresence mode="wait">
          {/* === LEAD CAPTURE === */}
          {step === 'lead' && (
            <motion.div key="lead" {...fadeUp} className="space-y-6">
              <Card className="p-8 border-primary/20 bg-secondary/30 backdrop-blur-sm">
                <h2 className="text-2xl font-display font-bold text-center mb-2">{t('diagPersonalTitle')}</h2>
                <p className="text-sm text-muted-foreground text-center mb-6">Para enviarte tu diagnóstico personalizado y guardar tu progreso</p>
                <div className="space-y-4">
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input placeholder={t('displayName')} value={name} onChange={(e) => setName(e.target.value)} className="pl-10 h-12" />
                  </div>
                  <div className="relative">
                    <Mail className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <Input type="email" placeholder={t('email')} value={email} onChange={(e) => setEmail(e.target.value)} className="pl-10 h-12" />
                  </div>
                  <PhoneInput value={phone} onChange={setPhone} className="h-12" />
                  <select 
                    value={country} onChange={(e) => setCountry(e.target.value)} 
                    className="w-full h-12 bg-background border border-input rounded-md px-3 text-sm focus:ring-2 focus:ring-primary"
                  >
                    <option value="">{t('selectCountry')}</option>
                    {LATAM_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <Button onClick={handleStartQuestions} className="w-full h-12 glow-primary text-lg font-bold" disabled={!name || !email || !phone || !country}>
                    Comenzar Diagnóstico <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* === QUESTIONS === */}
          {step === 'questions' && currentQuestion && (
            <motion.div key={`q-${currentQuestionIndex}`} {...fadeUp} className="space-y-5">
              {/* Section header with steps */}
              <div className="space-y-3">
                {/* 5 criteria step indicators */}
                <div className="flex items-center justify-between gap-1">
                  {Object.entries(SECTION_META).map(([key, meta]) => {
                    const isCurrent = currentQuestion.section === key;
                    const sectionQuestions = questions.filter(q => q.section === key);
                    const firstIdx = questions.indexOf(sectionQuestions[0]);
                    const isPast = currentQuestionIndex > firstIdx + sectionQuestions.length - 1;
                    return (
                      <div key={key} className={`flex-1 text-center transition-all ${isCurrent ? 'scale-105' : ''}`}>
                        <div className={`text-lg ${isPast ? 'opacity-60' : isCurrent ? '' : 'opacity-30'}`}>{meta.icon}</div>
                        <div className={`text-[10px] mt-0.5 leading-tight font-medium ${isCurrent ? 'text-primary' : isPast ? 'text-muted-foreground' : 'text-muted-foreground/50'}`}>
                          {meta.label.split(' ').slice(0, 2).join(' ')}
                        </div>
                        <div className={`h-1 rounded-full mt-1 ${isPast ? 'bg-primary/60' : isCurrent ? 'bg-primary' : 'bg-border'}`} />
                      </div>
                    );
                  })}
                </div>

                {/* Progress bar with accelerated feel */}
                <div className="flex items-center gap-3">
                  <Progress value={calcProgress()} className="h-2 flex-1" />
                  <span className="text-xs text-muted-foreground font-mono whitespace-nowrap">{currentQuestionIndex + 1}/{questions.length}</span>
                </div>

                {/* Encouragement message */}
                {getEncouragement() && (
                  <motion.p 
                    initial={{ opacity: 0, scale: 0.95 }} 
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center text-sm font-medium text-primary"
                  >
                    {getEncouragement()}
                  </motion.p>
                )}
              </div>

              {/* New section intro card */}
              {isNewSection && currentSectionMeta && (
                <motion.div
                  initial={{ opacity: 0, y: 10 }}
                  animate={{ opacity: 1, y: 0 }}
                  className="p-4 rounded-xl bg-primary/5 border border-primary/20 text-center"
                >
                  <span className="text-2xl">{currentSectionMeta.icon}</span>
                  <h3 className="font-bold text-sm mt-1">Criterio {currentSectionMeta.step} de 5: {currentSectionMeta.label}</h3>
                  <p className="text-xs text-muted-foreground mt-1">{questionsInSection} preguntas en esta sección</p>
                </motion.div>
              )}
              
              <Card className="p-6 sm:p-8 border-primary/20 bg-secondary/30">
                <div className="flex items-start gap-2 mb-1">
                  <span className="text-xs font-medium text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
                    {currentInSection}/{questionsInSection}
                  </span>
                </div>
                <h3 className="text-xl sm:text-2xl font-bold mb-4">{currentQuestion.question_text}</h3>
                {currentQuestion.description && <p className="text-muted-foreground mb-6">{currentQuestion.description}</p>}

                <div className="space-y-3">
                  {currentQuestion.type === 'text_open' && (
                    <Textarea placeholder="Escribe tu respuesta..." value={answers[currentQuestion.id] || ''} onChange={(e) => handleAnswer(currentQuestion.id, e.target.value)} className="min-h-[120px] text-base" />
                  )}
                  {currentQuestion.type === 'scale' && isObjectiveQuestion(currentQuestion) && (
                    <Input type="number" placeholder="Ingresa el número..." value={answers[currentQuestion.id] || ''} onChange={(e) => handleNumericAnswer(currentQuestion.id, e.target.value)} className="h-14 text-lg" />
                  )}

                  {/* Likert with emojis & reversed order (agree first) */}
                  {currentQuestion.type === 'likert' && (
                    <div className="grid grid-cols-1 gap-2">
                      {LIKERT_OPTIONS.map(({ val, label, emoji, color }) => {
                        const isSelected = answers[currentQuestion.id] === val;
                        return (
                          <button
                            key={val}
                            onClick={() => handleAnswer(currentQuestion.id, val)}
                            className={`flex items-center gap-3 w-full text-left px-5 py-3.5 rounded-xl border-2 transition-all duration-200 ${
                              isSelected 
                                ? 'border-primary bg-primary/10 ring-2 ring-primary/20 scale-[1.02]' 
                                : `border-border ${color}`
                            }`}
                          >
                            <span className="text-xl shrink-0">{emoji}</span>
                            <span className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>{label}</span>
                            {isSelected && <CheckCircle2 className="w-5 h-5 text-primary ml-auto shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {currentQuestion.type === 'scale' && !isObjectiveQuestion(currentQuestion) && (
                    <div>
                      <div className="flex justify-between items-center gap-1.5 sm:gap-2">
                        {[1,2,3,4,5,6,7,8,9,10].map(val => (
                          <button key={val} onClick={() => handleAnswer(currentQuestion.id, val)}
                            className={`w-9 h-9 sm:w-10 sm:h-10 rounded-full border-2 transition-all text-sm font-bold ${
                              answers[currentQuestion.id] === val 
                                ? 'bg-primary border-primary text-primary-foreground scale-110 shadow-lg shadow-primary/30' 
                                : val <= 4 ? 'border-destructive/30 hover:border-destructive/60 hover:bg-destructive/5'
                                : val <= 7 ? 'border-amber-400/30 hover:border-amber-400/60 hover:bg-amber-400/5'
                                : 'border-emerald-500/30 hover:border-emerald-500/60 hover:bg-emerald-500/5'
                            }`}>
                            {val}
                          </button>
                        ))}
                      </div>
                      <div className="flex justify-between text-xs text-muted-foreground mt-2 px-1">
                        <span>😟 Muy bajo</span>
                        <span>🌟 Excelente</span>
                      </div>
                    </div>
                  )}

                  {currentQuestion.type === 'single_choice' && (
                    <div className="grid gap-2.5">
                      {currentQuestion.options.map((opt: any, idx: number) => {
                        const isSelected = answers[currentQuestion.id] === opt.value;
                        return (
                          <button
                            key={opt.value}
                            onClick={() => handleAnswer(currentQuestion.id, opt.value)}
                            className={`flex items-center gap-3 w-full text-left px-5 py-4 rounded-xl border-2 transition-all duration-200 ${
                              isSelected
                                ? 'border-primary bg-primary/10 ring-2 ring-primary/20 scale-[1.02]'
                                : 'border-border hover:border-primary/30 hover:bg-primary/5'
                            }`}
                          >
                            <span className={`w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold shrink-0 ${
                              isSelected ? 'border-primary bg-primary text-primary-foreground' : 'border-muted-foreground/30 text-muted-foreground'
                            }`}>
                              {String.fromCharCode(65 + idx)}
                            </span>
                            <span className={`text-sm font-medium ${isSelected ? 'text-primary' : 'text-foreground'}`}>{opt.label}</span>
                            {isSelected && <CheckCircle2 className="w-5 h-5 text-primary ml-auto shrink-0" />}
                          </button>
                        );
                      })}
                    </div>
                  )}

                  {currentQuestion.type === 'multiple_choice' && (
                    <div className="space-y-2.5">
                      <p className="text-xs text-muted-foreground flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5" /> Puedes seleccionar varias opciones
                      </p>
                      <div className="grid gap-2.5">
                        {currentQuestion.options.map((opt: any) => {
                          const selected = Array.isArray(answers[currentQuestion.id]) && answers[currentQuestion.id].includes(opt.value);
                          return (
                            <button
                              key={opt.value}
                              onClick={() => handleMultipleAnswer(currentQuestion.id, opt.value)}
                              className={`flex items-center gap-3 w-full text-left px-5 py-4 rounded-xl border-2 transition-all duration-200 ${
                                selected
                                  ? 'border-primary bg-primary/10 ring-2 ring-primary/20'
                                  : 'border-border hover:border-primary/30 hover:bg-primary/5'
                              }`}
                            >
                              <div className={`w-5 h-5 rounded border-2 flex items-center justify-center shrink-0 transition-all ${
                                selected ? 'border-primary bg-primary' : 'border-muted-foreground/30'
                              }`}>
                                {selected && <CheckCircle2 className="w-4 h-4 text-primary-foreground" />}
                              </div>
                              <span className={`text-sm font-medium ${selected ? 'text-primary' : 'text-foreground'}`}>{opt.label}</span>
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-8">
                  {currentQuestionIndex > 0 && (
                    <Button variant="outline" onClick={() => setCurrentQuestionIndex(p => p - 1)} className="flex-1">{t('back')}</Button>
                  )}
                  <Button onClick={nextQuestion} className="flex-1 glow-primary" disabled={
                    currentQuestion.type === 'text_open'
                      ? !answers[currentQuestion.id] || (typeof answers[currentQuestion.id] === 'string' && answers[currentQuestion.id].trim() === '')
                      : currentQuestion.type === 'multiple_choice' 
                        ? !answers[currentQuestion.id] || (Array.isArray(answers[currentQuestion.id]) && answers[currentQuestion.id].length === 0)
                        : !answers[currentQuestion.id] && answers[currentQuestion.id] !== 0
                  }>
                    {currentQuestionIndex === questions.length - 1 ? t('diagSubmit') : t('next')}
                    <ArrowRight className="w-4 h-4 ml-1" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {/* === PROCESSING === */}
          {step === 'processing' && (
            <motion.div key="processing" {...fadeUp} className="text-center py-20">
              <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto mb-6" />
              <h2 className="text-2xl font-bold mb-2">Estamos procesando tu diagnóstico…</h2>
              <p className="text-muted-foreground">Analizando tus respuestas para generar tu informe personalizado</p>
            </motion.div>
          )}

          {/* === AUTH STEP (post-diagnostic) === */}
          {step === 'auth' && (
            <motion.div key="auth" {...fadeUp} className="space-y-6">
              <Card className="p-8 border-primary/20 bg-secondary/30 backdrop-blur-sm text-center">
                <CheckCircle2 className="w-16 h-16 text-primary mx-auto mb-4" />
                <h2 className="text-2xl font-display font-bold mb-2">¡Tu diagnóstico está listo!</h2>
                {existingUser ? (
                  <>
                    <p className="text-muted-foreground mb-6">Tu cuenta ya existe. Solo confirma tu acceso para ver los resultados.</p>
                    <div className="space-y-4 max-w-sm mx-auto">
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input type="password" placeholder="Tu contraseña" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 h-12" />
                      </div>
                      <Button onClick={handleAuthAndShowResults} disabled={loading || !password} className="w-full h-12 glow-primary text-lg font-bold">
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Ver Mi Diagnóstico'}
                      </Button>
                    </div>
                  </>
                ) : (
                  <>
                    <p className="text-muted-foreground mb-6">Crea tu contraseña para acceder a tu diagnóstico completo y guardarlo en tu cuenta.</p>
                    <div className="space-y-4 max-w-sm mx-auto">
                      <div className="relative">
                        <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                        <Input type="password" placeholder="Crea tu contraseña (mín. 6 caracteres)" value={password} onChange={(e) => setPassword(e.target.value)} className="pl-10 h-12" />
                      </div>
                      <Button onClick={handleAuthAndShowResults} disabled={loading || password.length < 6} className="w-full h-12 glow-primary text-lg font-bold">
                        {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Crear Cuenta y Ver Resultado'}
                      </Button>
                    </div>
                  </>
                )}
              </Card>
            </motion.div>
          )}

          {/* === RESULTS === */}
          {step === 'results' && (
            <motion.div key="results" {...fadeUp} className="space-y-8 pb-12">
              {/* BLOQUE 1 — Nivel General */}
              <div className="text-center">
                <h2 className="text-lg text-muted-foreground mb-3">Tu ISP hoy está en el nivel:</h2>
                <div className={`inline-block px-10 py-5 rounded-2xl bg-primary/10 border-2 border-primary`}>
                  <span className={`text-4xl font-display font-black uppercase ${levelCfg.color}`}>
                    {levelCfg.emoji} {t(generalLevel)}
                  </span>
                </div>
                <p className="text-muted-foreground mt-4 max-w-lg mx-auto">{levelCfg.subtexto}</p>
              </div>

              {/* BLOQUE 2 — Mapa Visual de los 5 Pilares */}
              <Card className="p-6 bg-secondary/20">
                <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                  <BarChart3 className="w-5 h-5 text-primary" /> Análisis de los 5 Pilares
                </h3>
                <div className="space-y-4">
                  {Object.entries(scores).map(([key, val]) => (
                    <div key={key}>
                      <div className="flex justify-between text-sm mb-1">
                        <span className="text-muted-foreground">{sectionLabel(key)}</span>
                        <span className={`font-bold ${val < 5 ? 'text-destructive' : val < 7 ? 'text-amber-500' : 'text-emerald-500'}`}>{val.toFixed(1)}</span>
                      </div>
                      <div className="h-3 w-full bg-border rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${val * 10}%` }}
                          transition={{ duration: 1, delay: 0.2 }}
                          className={`h-full rounded-full ${val < 5 ? 'bg-destructive' : val < 7 ? 'bg-amber-500' : 'bg-emerald-500'}`}
                        />
                      </div>
                    </div>
                  ))}
                </div>
                <div className="text-center mt-4 pt-4 border-t border-border">
                  <span className="text-sm text-muted-foreground">Índice General Ponderado: </span>
                  <span className={`text-xl font-bold ${weightedIndex < 5 ? 'text-destructive' : weightedIndex < 7 ? 'text-amber-500' : 'text-emerald-500'}`}>{weightedIndex.toFixed(1)}/10</span>
                </div>
              </Card>

              {/* BLOQUE 3 — Diagnóstico Interpretado */}
              <Card className="p-6 bg-secondary/20 space-y-5">
                {best && (
                  <div className="p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                    <h4 className="text-sm font-bold text-emerald-500 flex items-center gap-2 mb-1">
                      <Target className="w-4 h-4" /> Fortaleza Principal
                    </h4>
                    <p className="text-sm text-foreground">
                      Tu mayor ventaja hoy es <strong>{sectionLabel(best[0]).toLowerCase()}</strong> ({best[1].toFixed(1)}/10). Esta es tu base para crecer.
                    </p>
                  </div>
                )}
                {worst && (
                  <div className="p-4 rounded-xl bg-destructive/10 border border-destructive/20">
                    <h4 className="text-sm font-bold text-destructive flex items-center gap-2 mb-1">
                      <ShieldAlert className="w-4 h-4" /> Área Crítica Principal
                    </h4>
                    <p className="text-sm text-foreground">
                      <strong>{sectionLabel(worst[0])}</strong> ({worst[1].toFixed(1)}/10) está limitando tu capacidad de escalar con seguridad.
                    </p>
                  </div>
                )}
                {second && (
                  <div className="p-4 rounded-xl bg-amber-500/10 border border-amber-500/20">
                    <h4 className="text-sm font-bold text-amber-500 flex items-center gap-2 mb-1">
                      <Zap className="w-4 h-4" /> Área Secundaria
                    </h4>
                    <p className="text-sm text-foreground">
                      <strong>{sectionLabel(second[0])}</strong> ({second[1].toFixed(1)}/10) necesita estructura para sostener crecimiento acelerado.
                    </p>
                  </div>
                )}
              </Card>

              {/* BLOQUE 4 — Consecuencia si no actúa */}
              {worst && worst[1] < 7 && (
                <Card className="p-6 border-destructive/30 bg-destructive/5">
                  <div className="flex items-start gap-3">
                    <AlertTriangle className="w-6 h-6 text-destructive shrink-0 mt-0.5" />
                    <div>
                      <h4 className="font-bold text-foreground mb-1">¿Qué pasa si no actúas?</h4>
                      <p className="text-sm text-muted-foreground">{CONSEQUENCE_MESSAGES[worst[0]] || CONSEQUENCE_MESSAGES.technical}</p>
                    </div>
                  </div>
                </Card>
              )}

              {/* BLOQUE 5 — Recomendación Principal */}
              {matchedRules.length > 0 && (
                <Card className="p-8 border-primary bg-primary/5">
                  <h3 className="text-xl font-bold mb-2 text-center">Tu próximo paso estratégico es:</h3>
                  <div className="p-6 rounded-xl bg-background/50 border border-primary/30 mt-4">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center shrink-0">
                        <Target className="w-6 h-6 text-primary" />
                      </div>
                      <div className="flex-1">
                        <h4 className="font-bold text-xl">{matchedRules[0].title}</h4>
                        {matchedRules[0].description && <p className="text-muted-foreground mt-1">{matchedRules[0].description}</p>}
                        <p className="text-sm text-muted-foreground mt-2">Este programa está diseñado para resolver exactamente el cuello de botella que hoy limita tu ISP.</p>
                      </div>
                    </div>
                    {matchedRules[0].cta_text && (
                      <Button className="w-full mt-6 h-12 text-lg font-bold glow-primary">
                        <ArrowUpRight className="w-5 h-5 mr-2" /> {matchedRules[0].cta_text}
                      </Button>
                    )}
                  </div>
                </Card>
              )}

              {/* BLOQUE 6 — Recomendación Secundaria */}
              {matchedRules.length > 1 && (
                <Card className="p-6 bg-secondary/20">
                  <h4 className="text-sm font-bold text-muted-foreground mb-3">También podrías comenzar con:</h4>
                  <div className="space-y-3">
                    {matchedRules.slice(1, 3).map(rule => (
                      <div key={rule.id} className="flex items-center gap-3 p-3 rounded-lg bg-background/50 border border-border">
                        <TrendingUp className="w-5 h-5 text-primary shrink-0" />
                        <div className="flex-1">
                          <span className="font-medium text-sm">{rule.title}</span>
                          {rule.description && <p className="text-xs text-muted-foreground">{rule.description}</p>}
                        </div>
                        {rule.cta_text && <Button size="sm" variant="outline">{rule.cta_text}</Button>}
                      </div>
                    ))}
                  </div>
                </Card>
              )}

              {/* BLOQUE 7 — Micro CTA Emocional */}
              <div className="text-center py-4">
                <p className="text-lg font-display font-semibold text-foreground italic">
                  La claridad ya la tienes.<br />
                  <span className="text-primary">Ahora necesitas estructura.</span>
                </p>
              </div>

              {/* Personalización por compromiso */}
              {scores.commitment >= 8 && (
                <Card className="p-5 border-primary/30 bg-primary/5 text-center">
                  <Sparkles className="w-6 h-6 text-primary mx-auto mb-2" />
                  <p className="text-sm font-medium">Estás en un momento ideal para acelerar de forma estructurada. No dejes pasar esta fase.</p>
                </Card>
              )}
              {scores.commitment < 5 && scores.commitment > 0 && (
                <Card className="p-5 border-border bg-secondary/30 text-center">
                  <p className="text-sm text-muted-foreground">Tu ISP necesita estructura progresiva. Empieza paso a paso con recursos accesibles.</p>
                </Card>
              )}

              {/* BLOQUE 10 — ISP 1000+ Special */}
              {clientCount > 500 && scores.expansion >= 7 && (
                <Card className="p-6 border-primary bg-gradient-to-br from-primary/10 to-primary/5 text-center">
                  <h3 className="text-lg font-bold mb-2">🚀 Tu ISP tiene potencial real de convertirse en referente regional.</h3>
                  <p className="text-sm text-muted-foreground mb-4">Con más de {clientCount} clientes y alto potencial, calificas para nuestro programa premium.</p>
                  <Button className="glow-primary h-12 px-8 text-lg font-bold">
                    Aplicar al Programa ISP 1000+
                  </Button>
                </Card>
              )}

              {/* BLOQUE 8 — Botones Finales */}
              <div className="flex flex-col sm:flex-row gap-3">
                {matchedRules.length > 0 && matchedRules[0].cta_text && (
                  <Button className="flex-1 h-14 text-lg font-bold glow-primary">
                    <ArrowRight className="w-5 h-5 mr-2" /> Comenzar Ahora
                  </Button>
                )}
                {scores.commitment >= 7 && advisorUrl && (
                  <Button variant="outline" className="flex-1 h-14 text-lg font-bold" onClick={() => window.open(advisorUrl, '_blank')}>
                    <MessageSquare className="w-5 h-5 mr-2" /> Hablar con un Asesor
                  </Button>
                )}
              </div>

              {/* Footer */}
              <div className="text-center space-y-4 pt-4">
                <p className="text-sm text-muted-foreground">Tu diagnóstico inicial ya está guardado. En 90 días puedes rehacerlo y medir tu evolución.</p>
                <Link to="/app" className="text-primary hover:underline font-bold text-lg">
                  Ir a Mi Cuenta →
                </Link>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </div>
    </div>
  );
};

export default Diagnostico;
