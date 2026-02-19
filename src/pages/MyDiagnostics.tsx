import React, { useState, useEffect } from 'react';
import { ClipboardList, BarChart3, Target, TrendingUp, ShieldAlert, Zap, ChevronDown, ChevronRight, ArrowUpRight } from 'lucide-react';
import { Card } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Progress } from '@/components/ui/progress';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { evaluateConditions, type RuleCondition } from '@/lib/diagnosticComputedFields';
import { motion } from 'framer-motion';

interface DiagnosticRecord {
  id: string;
  created_at: string;
  scores: Record<string, number>;
  results: any;
  client_count: string | null;
}

const LEVEL_CONFIG: Record<string, { color: string; emoji: string; label: string }> = {
  diagReactive: { color: 'text-destructive', emoji: '🔴', label: 'Reactivo' },
  diagInstable: { color: 'text-amber-500', emoji: '🟡', label: 'Inestable' },
  diagTransition: { color: 'text-emerald-500', emoji: '🟢', label: 'En Transición' },
  diagStructured: { color: 'text-primary', emoji: '🔷', label: 'Estructurado' },
};

const SECTION_LABELS: Record<string, string> = {
  technical: 'Arquitectura Técnica',
  financial: 'Gestión Financiera',
  scale: 'Escala Comercial',
  expansion: 'Potencial de Expansión',
  commitment: 'Compromiso Estratégico',
};

const MyDiagnostics: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const [diagnostics, setDiagnostics] = useState<DiagnosticRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [rules, setRules] = useState<any[]>([]);

  useEffect(() => {
    if (!user?.email) return;
    const fetchData = async () => {
      const [{ data: diagData }, { data: rulesData }] = await Promise.all([
        supabase.from('diagnostics').select('id, created_at, scores, results, client_count').eq('email', user.email!).order('created_at', { ascending: false }),
        supabase.from('diagnostic_recommendation_rules').select('*').order('priority', { ascending: true }),
      ]);
      setDiagnostics((diagData || []) as unknown as DiagnosticRecord[]);
      setRules(rulesData || []);
      setLoading(false);
    };
    fetchData();
  }, [user?.email]);

  const getMatchedRules = (d: DiagnosticRecord) => {
    const scores = d.scores || {};
    const raw = d.results?.rawData || {};
    const computed = d.results?.computed || {};
    return rules.filter(rule => {
      const conds: RuleCondition[] = rule.conditions?.length > 0
        ? rule.conditions
        : [{ field: rule.condition_field, operator: rule.condition_operator, value: rule.condition_value }];
      const logic = (rule.conditions_logic || 'and') as 'and' | 'or';
      return evaluateConditions(conds, logic, scores, raw, computed);
    });
  };

  if (loading) return <div className="p-8 text-center text-muted-foreground">Cargando...</div>;

  return (
    <div className="p-4 sm:p-6 lg:p-8 max-w-4xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <ClipboardList className="w-6 h-6 text-primary" />
        <h1 className="text-2xl font-display font-bold">Mis Diagnósticos</h1>
      </div>

      {diagnostics.length === 0 ? (
        <Card className="p-8 text-center">
          <ClipboardList className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">Aún no tienes diagnósticos realizados.</p>
          <Button className="mt-4" onClick={() => window.location.href = '/diagnostico'}>
            Realizar Diagnóstico
          </Button>
        </Card>
      ) : (
        <div className="space-y-4">
          {diagnostics.map((d) => {
            const level = d.results?.level || 'diagInstable';
            const cfg = LEVEL_CONFIG[level] || LEVEL_CONFIG.diagInstable;
            const wi = d.results?.weightedIndex || 0;
            const isExpanded = expanded === d.id;
            const matched = getMatchedRules(d);

            return (
              <Card key={d.id} className="overflow-hidden">
                <button
                  onClick={() => setExpanded(isExpanded ? null : d.id)}
                  className="w-full flex items-center gap-4 p-5 text-left hover:bg-secondary/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    {isExpanded ? <ChevronDown className="w-4 h-4" /> : <ChevronRight className="w-4 h-4" />}
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-sm font-medium">{new Date(d.created_at).toLocaleDateString('es-LA', { day: '2-digit', month: 'short', year: 'numeric' })}</span>
                      <Badge className={`text-xs ${level === 'diagReactive' ? 'bg-destructive/10 text-destructive border-destructive/20' : level === 'diagInstable' ? 'bg-amber-500/10 text-amber-500 border-amber-500/20' : level === 'diagTransition' ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-primary/10 text-primary border-primary/20'}`}>
                        {cfg.emoji} {cfg.label}
                      </Badge>
                    </div>
                    <span className="text-xs text-muted-foreground">Índice: {wi.toFixed(1)}/10</span>
                  </div>
                  <div className="w-24">
                    <Progress value={wi * 10} className="h-2" />
                  </div>
                </button>

                {isExpanded && (
                  <motion.div initial={{ height: 0, opacity: 0 }} animate={{ height: 'auto', opacity: 1 }} className="border-t border-border p-5 space-y-5">
                    {/* Scores */}
                    <div className="space-y-3">
                      <h4 className="text-sm font-semibold flex items-center gap-2"><BarChart3 className="w-4 h-4 text-primary" /> Pilares</h4>
                      {Object.entries(d.scores || {}).map(([key, val]) => (
                        <div key={key}>
                          <div className="flex justify-between text-xs mb-1">
                            <span className="text-muted-foreground">{SECTION_LABELS[key] || key}</span>
                            <span className={`font-bold ${val < 5 ? 'text-destructive' : val < 7 ? 'text-amber-500' : 'text-emerald-500'}`}>{val.toFixed(1)}</span>
                          </div>
                          <div className="h-2 w-full bg-border rounded-full overflow-hidden">
                            <div className={`h-full rounded-full ${val < 5 ? 'bg-destructive' : val < 7 ? 'bg-amber-500' : 'bg-emerald-500'}`} style={{ width: `${val * 10}%` }} />
                          </div>
                        </div>
                      ))}
                    </div>

                    {/* Computed Metrics */}
                    {d.results?.computed && (
                      <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                        {d.results.computed.churn !== undefined && (
                          <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                            <span className="text-xs text-muted-foreground">Churn</span>
                            <p className="text-sm font-bold">{d.results.computed.churn.toFixed(1)}%</p>
                          </div>
                        )}
                        {d.results.computed.network_occupation !== undefined && (
                          <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                            <span className="text-xs text-muted-foreground">Ocupación Red</span>
                            <p className="text-sm font-bold">{d.results.computed.network_occupation.toFixed(1)}%</p>
                          </div>
                        )}
                        {d.results.computed.estimated_revenue !== undefined && d.results.computed.estimated_revenue > 0 && (
                          <div className="p-3 rounded-lg bg-secondary/50 border border-border">
                            <span className="text-xs text-muted-foreground">Facturación Est.</span>
                            <p className="text-sm font-bold">US$ {d.results.computed.estimated_revenue.toLocaleString()}</p>
                          </div>
                        )}
                      </div>
                    )}

                    {/* Recommendations */}
                    {matched.length > 0 && (
                      <div className="space-y-2">
                        <h4 className="text-sm font-semibold flex items-center gap-2"><Target className="w-4 h-4 text-primary" /> Recomendaciones</h4>
                        {matched.slice(0, 3).map(rule => (
                          <div key={rule.id} className="flex items-center gap-3 p-3 rounded-lg bg-primary/5 border border-primary/20">
                            <TrendingUp className="w-4 h-4 text-primary shrink-0" />
                            <div className="flex-1 min-w-0">
                              <span className="text-sm font-medium">{rule.title}</span>
                              {rule.description && <p className="text-xs text-muted-foreground truncate">{rule.description}</p>}
                            </div>
                            {rule.cta_text && rule.cta_url && (
                              <Button size="sm" variant="outline" onClick={() => window.open(rule.cta_url, '_blank')} className="shrink-0 gap-1">
                                <ArrowUpRight className="w-3 h-3" /> {rule.cta_text}
                              </Button>
                            )}
                          </div>
                        ))}
                      </div>
                    )}
                  </motion.div>
                )}
              </Card>
            );
          })}
        </div>
      )}
    </div>
  );
};

export default MyDiagnostics;
