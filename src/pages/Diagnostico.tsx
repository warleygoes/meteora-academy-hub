import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowLeft, ArrowRight, User, Mail, CheckCircle2, AlertCircle, Loader2, Target, TrendingUp, ShieldAlert, BarChart3, Briefcase, Zap, MessageSquare } from 'lucide-react';
import PhoneInput from '@/components/PhoneInput';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
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
  type: 'scale' | 'likert' | 'single_choice' | 'multiple_choice';
  question_text: string;
  description?: string;
  options: any[];
  weight: number;
};

const Diagnostico: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const navigate = useNavigate();

  const [step, setStep] = useState<'lead' | 'questions' | 'processing' | 'results'>('lead');
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
  
  // Results
  const [scores, setScores] = useState<Record<string, number>>({});
  const [generalLevel, setGeneralLevel] = useState('');
  const [advisorUrl, setAdvisorUrl] = useState('');

  useEffect(() => {
    const fetchQuestions = async () => {
      const { data, error } = await supabase
        .from('diagnostic_questions')
        .select('*')
        .order('sort_order', { ascending: true });
      
      if (!error && data) {
        setQuestions(data as Question[]);
      }
    };

    const fetchAdvisorUrl = async () => {
      const { data } = await supabase
        .from('platform_settings')
        .select('value')
        .eq('key', 'whatsapp_advisor_url')
        .maybeSingle();
      if (data) setAdvisorUrl(data.value);
    };

    fetchQuestions();
    fetchAdvisorUrl();
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

      questions.forEach(q => {
        const answer = answers[q.id];
        if (answer === undefined || q.weight === 0) return; // Skip objective data

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
          // Normalize to 0-10 range
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

      // 2. Weighted Index
      const weightedIndex = (
        (finalScores.technical * 0.25) +
        (finalScores.financial * 0.20) +
        (finalScores.scale * 0.25) +
        (finalScores.expansion * 0.15) +
        (finalScores.commitment * 0.15)
      );

      // 3. Level
      let level = 'diagReactive';
      if (weightedIndex >= 9) level = 'diagStructured';
      else if (weightedIndex >= 7) level = 'diagTransition';
      else if (weightedIndex >= 5) level = 'diagInstable';

      setScores(finalScores);
      setGeneralLevel(level);

      // 4. Save to Database
      const { data: diagData, error: diagError } = await supabase.from('diagnostics').insert({
        name, email, phone, country,
        scores: finalScores,
        results: { weightedIndex, level },
        status: 'completed'
      }).select().single();

      if (diagError) throw diagError;

      // 5. Atomic answers
      const answerInserts = Object.entries(answers).map(([qId, val]) => ({
        diagnostic_id: diagData.id,
        question_id: qId,
        answer_value: val
      }));
      await supabase.from('diagnostic_answers').insert(answerInserts);

      // 6. Account Creation (if new)
      const { data: existingUser } = await supabase.from('profiles').select('id').eq('email', email).maybeSingle();
      if (!existingUser && password) {
        const { error: signUpError } = await supabase.auth.signUp({
          email,
          password,
          options: {
            data: { display_name: name, phone, country }
          }
        });
        if (signUpError) console.error('Sign up error:', signUpError);
      }

      setStep('results');
    } catch (err) {
      console.error(err);
      toast({ title: t('errorOccurred'), variant: 'destructive' });
      setStep('lead');
    }
    setLoading(false);
  };

  const currentQuestion = questions[currentQuestionIndex];

  return (
    <div className="min-h-screen bg-background flex flex-col items-center justify-center px-4 py-12">
      <div className="w-full max-w-2xl">
        <div className="text-center mb-8">
          <img src={meteoraLogo} alt="Meteora Academy" className="h-12 mx-auto mb-4" />
        </div>

        <AnimatePresence mode="wait">
          {step === 'lead' && (
            <motion.div key="lead" {...fadeUp} className="space-y-6">
              <Card className="p-8 border-primary/20 bg-secondary/30 backdrop-blur-sm">
                <h2 className="text-2xl font-display font-bold text-center mb-2">{t('diagPersonalTitle')}</h2>
                <div className="space-y-4 mt-6">
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
                    value={country} 
                    onChange={(e) => setCountry(e.target.value)} 
                    className="w-full h-12 bg-background border border-input rounded-md px-3 text-sm focus:ring-2 focus:ring-primary"
                  >
                    <option value="">{t('selectCountry')}</option>
                    {LATAM_COUNTRIES.map(c => <option key={c} value={c}>{c}</option>)}
                  </select>
                  <Input 
                    type="password" 
                    placeholder={t('diagCreatePassword')} 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    className="h-12"
                  />
                  <Button onClick={handleStartQuestions} className="w-full h-12 glow-primary text-lg font-bold" disabled={!name || !email || !phone || !country}>
                    {t('next')} <ArrowRight className="ml-2 w-5 h-5" />
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {step === 'questions' && currentQuestion && (
            <motion.div key="questions" {...fadeUp} className="space-y-6">
              <div className="flex justify-between items-center mb-2">
                <span className="text-sm font-medium text-primary uppercase tracking-wider">{t(`diag${currentQuestion.section.charAt(0).toUpperCase() + currentQuestion.section.slice(1)}`)}</span>
                <span className="text-xs text-muted-foreground">{currentQuestionIndex + 1} / {questions.length}</span>
              </div>
              <Progress value={((currentQuestionIndex + 1) / questions.length) * 100} className="h-1.5" />
              
              <Card className="p-8 border-primary/20 bg-secondary/30">
                <h3 className="text-2xl font-bold mb-4">{currentQuestion.question_text}</h3>
                {currentQuestion.description && <p className="text-muted-foreground mb-6">{currentQuestion.description}</p>}

                <div className="space-y-3">
                  {/* Objective numeric data (weight=0) */}
                  {currentQuestion.type === 'scale' && isObjectiveQuestion(currentQuestion) && (
                    <Input
                      type="number"
                      placeholder="Ingresa el número..."
                      value={answers[currentQuestion.id] || ''}
                      onChange={(e) => handleNumericAnswer(currentQuestion.id, e.target.value)}
                      className="h-14 text-lg"
                    />
                  )}

                  {/* Likert */}
                  {currentQuestion.type === 'likert' && (
                    <div className="grid grid-cols-1 gap-2">
                      {[
                        { val: 2, label: 'Totalmente en desacuerdo' },
                        { val: 4, label: 'En desacuerdo' },
                        { val: 6, label: 'Neutral' },
                        { val: 8, label: 'De acuerdo' },
                        { val: 10, label: 'Totalmente de acuerdo' },
                      ].map(({ val, label }) => (
                        <Button 
                          key={val} 
                          variant={answers[currentQuestion.id] === val ? 'default' : 'outline'}
                          className="justify-start h-12 px-6"
                          onClick={() => handleAnswer(currentQuestion.id, val)}
                        >
                          {label}
                        </Button>
                      ))}
                    </div>
                  )}

                  {/* Scale 1-10 (scored questions only) */}
                  {currentQuestion.type === 'scale' && !isObjectiveQuestion(currentQuestion) && (
                    <div className="flex justify-between items-center gap-2">
                      {[1,2,3,4,5,6,7,8,9,10].map(val => (
                        <button
                          key={val}
                          onClick={() => handleAnswer(currentQuestion.id, val)}
                          className={`w-10 h-10 rounded-full border transition-all ${answers[currentQuestion.id] === val ? 'bg-primary border-primary text-primary-foreground scale-110' : 'border-border hover:border-primary/50'}`}
                        >
                          {val}
                        </button>
                      ))}
                    </div>
                  )}

                  {/* Single Choice */}
                  {currentQuestion.type === 'single_choice' && (
                    <div className="grid gap-3">
                      {currentQuestion.options.map((opt: any) => (
                        <Button
                          key={opt.value}
                          variant={answers[currentQuestion.id] === opt.value ? 'default' : 'outline'}
                          className="justify-start h-auto py-4 px-6 text-left whitespace-normal"
                          onClick={() => handleAnswer(currentQuestion.id, opt.value)}
                        >
                          {opt.label}
                        </Button>
                      ))}
                    </div>
                  )}

                  {/* Multiple Choice */}
                  {currentQuestion.type === 'multiple_choice' && (
                    <div className="grid gap-3">
                      {currentQuestion.options.map((opt: any) => {
                        const selected = Array.isArray(answers[currentQuestion.id]) && answers[currentQuestion.id].includes(opt.value);
                        return (
                          <Button
                            key={opt.value}
                            variant={selected ? 'default' : 'outline'}
                            className="justify-start h-auto py-4 px-6 text-left whitespace-normal"
                            onClick={() => handleMultipleAnswer(currentQuestion.id, opt.value)}
                          >
                            {opt.label}
                          </Button>
                        );
                      })}
                    </div>
                  )}
                </div>

                <div className="flex gap-3 mt-8">
                  {currentQuestionIndex > 0 && (
                    <Button variant="outline" onClick={() => setCurrentQuestionIndex(p => p - 1)} className="flex-1">
                      {t('back')}
                    </Button>
                  )}
                  <Button onClick={nextQuestion} className="flex-1 glow-primary" disabled={
                    currentQuestion.type === 'multiple_choice' 
                      ? !answers[currentQuestion.id] || (Array.isArray(answers[currentQuestion.id]) && answers[currentQuestion.id].length === 0)
                      : !answers[currentQuestion.id] && answers[currentQuestion.id] !== 0
                  }>
                    {currentQuestionIndex === questions.length - 1 ? t('diagSubmit') : t('next')}
                  </Button>
                </div>
              </Card>
            </motion.div>
          )}

          {step === 'processing' && (
            <motion.div key="processing" {...fadeUp} className="text-center py-20">
              <Loader2 className="w-16 h-16 text-primary animate-spin mx-auto mb-6" />
              <h2 className="text-2xl font-bold mb-2">{t('diagProcessing')}</h2>
            </motion.div>
          )}

          {step === 'results' && (
            <motion.div key="results" {...fadeUp} className="space-y-8 pb-12">
              <div className="text-center">
                <h2 className="text-xl text-muted-foreground mb-2">{t('diagLevelTitle')}</h2>
                <div className="inline-block px-8 py-4 rounded-2xl bg-primary/10 border-2 border-primary animate-pulse">
                  <span className="text-4xl font-display font-black text-primary uppercase">{t(generalLevel)}</span>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <Card className="p-6 bg-secondary/20">
                  <h3 className="text-lg font-bold mb-4 flex items-center gap-2">
                    <BarChart3 className="w-5 h-5 text-primary" /> Pillars Analysis
                  </h3>
                  <div className="space-y-4">
                    {Object.entries(scores).map(([key, val]) => (
                      <div key={key}>
                        <div className="flex justify-between text-sm mb-1">
                          <span className="text-muted-foreground">{t(`diag${key.charAt(0).toUpperCase() + key.slice(1)}`)}</span>
                          <span className="font-bold">{val.toFixed(1)}</span>
                        </div>
                        <div className="h-2 w-full bg-border rounded-full overflow-hidden">
                          <div 
                            className={`h-full transition-all duration-1000 ${val < 5 ? 'bg-destructive' : val < 7 ? 'bg-amber-500' : 'bg-green-500'}`} 
                            style={{ width: `${val * 10}%` }} 
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </Card>

                <Card className="p-6 bg-secondary/20 space-y-4">
                  <div>
                    <h4 className="text-sm font-bold text-destructive flex items-center gap-2 mb-1">
                      <ShieldAlert className="w-4 h-4" /> {t('diagMainCritical')}
                    </h4>
                    <p className="text-sm text-muted-foreground">La gestión financiera está limitando tu capacidad de escalar con seguridad.</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-amber-500 flex items-center gap-2 mb-1">
                      <Zap className="w-4 h-4" /> {t('diagSecondaryArea')}
                    </h4>
                    <p className="text-sm text-muted-foreground">Tu proceso comercial necesita estructura para sostener crecimiento acelerado.</p>
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-green-500 flex items-center gap-2 mb-1">
                      <Target className="w-4 h-4" /> {t('diagMainStrength')}
                    </h4>
                    <p className="text-sm text-muted-foreground">Tu mayor ventaja hoy es tu compromiso estratégico. Estás listo para crecer.</p>
                  </div>
                </Card>
              </div>

              <Card className="p-8 border-primary bg-primary/5 text-center">
                <h3 className="text-xl font-bold mb-2">{t('diagNextStepTitle')}</h3>
                <h4 className="text-2xl font-display font-black text-primary mb-4 uppercase">Programa de Gestión ISP</h4>
                <p className="text-muted-foreground mb-8">Este programa está diseñado para resolver exactamente el cuello de botella que hoy limita tu ISP.</p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center">
                  <Button size="lg" className="glow-primary h-14 px-10 text-lg font-bold">
                    {t('diagStartNow')}
                  </Button>
                  {advisorUrl && (
                    <Button size="lg" variant="outline" className="h-14 px-10 text-lg font-bold" onClick={() => window.open(advisorUrl, '_blank')}>
                      <MessageSquare className="mr-2 w-5 h-5" /> {t('diagAdvisorCta')}
                    </Button>
                  )}
                </div>
              </Card>

              <div className="text-center space-y-4">
                <p className="text-sm text-muted-foreground">{t('diagRedo90Days')}</p>
                <Link to="/app" className="text-primary hover:underline font-bold text-lg">
                  {t('diagSuccessBack')}
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

