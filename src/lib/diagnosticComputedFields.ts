/**
 * Definitions for condition fields available in diagnostic recommendation rules.
 * Includes score criteria, raw answer data, and computed/derived metrics.
 */

// Predefined field_key options for tagging objective questions
export const FIELD_KEY_OPTIONS = [
  { value: 'active_clients', label: 'Clientes Activos' },
  { value: 'monthly_cancellations', label: 'Cancelaciones Mensuales' },
  { value: 'network_capacity', label: 'Capacidad de Red' },
  { value: 'homes_in_region', label: 'Casas en la Región' },
  { value: 'best_plan_price', label: 'Precio Plan Más Vendido (US$)' },
  { value: 'monthly_new_installs', label: 'Nuevas Instalaciones/Mes' },
];

// All condition fields grouped by category
export interface ConditionFieldOption {
  key: string;
  label: string;
  group: string;
  format?: string;
}

export const CONDITION_FIELDS: ConditionFieldOption[] = [
  // Score criteria
  { key: 'technical', label: 'Arquitectura Técnica', group: 'Scores' },
  { key: 'financial', label: 'Gestión Financiera', group: 'Scores' },
  { key: 'scale', label: 'Escala Comercial', group: 'Scores' },
  { key: 'expansion', label: 'Potencial de Expansión', group: 'Scores' },
  { key: 'commitment', label: 'Compromiso Estratégico', group: 'Scores' },
  { key: 'weighted_index', label: 'Índice General', group: 'Scores' },
  // Raw answer data
  { key: 'answer:active_clients', label: 'Clientes Activos', group: 'Datos del ISP' },
  { key: 'answer:monthly_cancellations', label: 'Cancelaciones Mensuales', group: 'Datos del ISP' },
  { key: 'answer:network_capacity', label: 'Capacidad de Red', group: 'Datos del ISP' },
  { key: 'answer:homes_in_region', label: 'Casas en la Región', group: 'Datos del ISP' },
  { key: 'answer:best_plan_price', label: 'Precio Plan Más Vendido (US$)', group: 'Datos del ISP' },
  { key: 'answer:monthly_new_installs', label: 'Nuevas Instalaciones/Mes', group: 'Datos del ISP' },
  // Computed metrics
  { key: 'computed:churn', label: 'Churn (%)', group: 'Métricas Calculadas', format: '%' },
  { key: 'computed:network_occupation', label: 'Ocupación de Red (%)', group: 'Métricas Calculadas', format: '%' },
  { key: 'computed:market_penetration', label: 'Penetración de Mercado (%)', group: 'Métricas Calculadas', format: '%' },
  { key: 'computed:estimated_revenue', label: 'Facturación Estimada (US$)', group: 'Métricas Calculadas', format: 'US$' },
  { key: 'computed:avg_ticket', label: 'Ticket Medio (US$)', group: 'Métricas Calculadas', format: 'US$' },
  { key: 'computed:monthly_client_balance', label: 'Saldo Clientes/Mes', group: 'Métricas Calculadas' },
  { key: 'computed:annual_projection', label: 'Proyección Anual Actual (US$)', group: 'Métricas Calculadas', format: 'US$' },
  { key: 'computed:quinquennial_projection', label: 'Proyección 5 Años Actual (US$)', group: 'Métricas Calculadas', format: 'US$' },
  { key: 'computed:monthly_balance_20', label: 'Saldo Clientes/Mes +20%', group: 'Métricas Potenciales' },
  { key: 'computed:avg_ticket_20', label: 'Ticket Medio +20% (US$)', group: 'Métricas Potenciales', format: 'US$' },
  { key: 'computed:annual_projection_20', label: 'Proyección Anual Potencial +20% (US$)', group: 'Métricas Potenciales', format: 'US$' },
  { key: 'computed:quinquennial_projection_20', label: 'Proyección 5 Años Potencial +20% (US$)', group: 'Métricas Potenciales', format: 'US$' },
];

// Group condition fields by category
export function getGroupedConditionFields(): Record<string, ConditionFieldOption[]> {
  const groups: Record<string, ConditionFieldOption[]> = {};
  for (const f of CONDITION_FIELDS) {
    if (!groups[f.group]) groups[f.group] = [];
    groups[f.group].push(f);
  }
  return groups;
}

/**
 * Extract raw data from diagnostic answers using field_key mapping.
 * @param questions - list of questions with field_key
 * @param answers - map of question_id → answer value
 */
export function extractRawData(
  questions: Array<{ id: string; field_key?: string | null }>,
  answers: Record<string, any>
): Record<string, number> {
  const raw: Record<string, number> = {};
  for (const q of questions) {
    if (q.field_key && answers[q.id] !== undefined) {
      raw[q.field_key] = Number(answers[q.id]) || 0;
    }
  }
  return raw;
}

/**
 * Compute derived metrics from raw answer data.
 */
export function computeDerivedMetrics(raw: Record<string, number>): Record<string, number> {
  const ac = raw.active_clients || 0;
  const mc = raw.monthly_cancellations || 0;
  const nc = raw.network_capacity || 0;
  const hr = raw.homes_in_region || 0;
  const bp = raw.best_plan_price || 0;
  const ni = raw.monthly_new_installs || 0;

  const churn = ac > 0 ? (mc / ac) * 100 : 0;
  const networkOccupation = nc > 0 ? (ac / nc) * 100 : 0;
  const marketPenetration = hr > 0 ? (ac / hr) * 100 : 0;
  const estimatedRevenue = bp * ac;
  const avgTicket = bp;
  const monthlyBalance = ni - mc;
  const annualProjection = monthlyBalance * 12 * avgTicket;
  const quinquennialProjection = annualProjection * 5;

  const monthlyBalance20 = (ni * 1.2) - (mc * 0.8);
  const avgTicket20 = avgTicket * 1.2;
  const annualProjection20 = monthlyBalance20 * 12 * avgTicket20;
  const quinquennialProjection20 = annualProjection20 * 5;

  return {
    churn: Math.round(churn * 100) / 100,
    network_occupation: Math.round(networkOccupation * 100) / 100,
    market_penetration: Math.round(marketPenetration * 100) / 100,
    estimated_revenue: Math.round(estimatedRevenue * 100) / 100,
    avg_ticket: avgTicket,
    monthly_client_balance: monthlyBalance,
    annual_projection: Math.round(annualProjection * 100) / 100,
    quinquennial_projection: Math.round(quinquennialProjection * 100) / 100,
    monthly_balance_20: Math.round(monthlyBalance20 * 100) / 100,
    avg_ticket_20: Math.round(avgTicket20 * 100) / 100,
    annual_projection_20: Math.round(annualProjection20 * 100) / 100,
    quinquennial_projection_20: Math.round(quinquennialProjection20 * 100) / 100,
  };
}

/**
 * Resolve a condition field value from the available data sources.
 */
export function resolveFieldValue(
  fieldKey: string,
  scores: Record<string, number>,
  rawData: Record<string, number>,
  computed: Record<string, number>
): number {
  if (fieldKey === 'weighted_index') {
    return (
      (scores.technical ?? 0) * 0.25 +
      (scores.financial ?? 0) * 0.20 +
      (scores.scale ?? 0) * 0.25 +
      (scores.expansion ?? 0) * 0.15 +
      (scores.commitment ?? 0) * 0.15
    );
  }
  if (fieldKey.startsWith('answer:')) {
    return rawData[fieldKey.replace('answer:', '')] ?? 0;
  }
  if (fieldKey.startsWith('computed:')) {
    return computed[fieldKey.replace('computed:', '')] ?? 0;
  }
  // Score criteria
  return scores[fieldKey] ?? 0;
}

export interface RuleCondition {
  field: string;
  operator: string;
  value: number;
}

/**
 * Evaluate a set of conditions against data.
 */
export function evaluateConditions(
  conditions: RuleCondition[],
  logic: 'and' | 'or',
  scores: Record<string, number>,
  rawData: Record<string, number>,
  computed: Record<string, number>
): boolean {
  if (!conditions || conditions.length === 0) return false;

  const evalOne = (c: RuleCondition): boolean => {
    const val = resolveFieldValue(c.field, scores, rawData, computed);
    switch (c.operator) {
      case '<': return val < c.value;
      case '<=': return val <= c.value;
      case '>': return val > c.value;
      case '>=': return val >= c.value;
      case '=': return val === c.value;
      default: return false;
    }
  };

  return logic === 'or' ? conditions.some(evalOne) : conditions.every(evalOne);
}
