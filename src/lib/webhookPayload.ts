/**
 * Standardized webhook payload interface.
 * All webhooks dispatched from the platform MUST use this structure.
 */

export interface WebhookUser {
  user_id?: string;
  email: string;
  name: string;
  company_name?: string;
  country?: string;
  phone?: string;
  role_type?: string;
  client_count?: string;
  network_type?: string;
}

export interface WebhookPayload {
  event: string;
  timestamp: string;
  data: Record<string, unknown>;
}

/**
 * Build a standardized webhook payload for user-related events.
 * Always uses English property names for consistency with n8n / external integrations.
 */
export function buildUserWebhookData(params: {
  user_id?: string;
  email?: string;
  name?: string;
  display_name?: string;
  company_name?: string;
  country?: string;
  phone?: string;
  role_type?: string;
  client_count?: string;
  network_type?: string;
  cheapest_plan_usd?: string | number;
  main_problems?: string;
  main_desires?: string;
  [key: string]: unknown;
}): WebhookUser & Record<string, unknown> {
  // Normalize: always use "name" (never "nome" or "display_name" at top level)
  const { display_name, nome, ...rest } = params as any;
  return {
    ...rest,
    name: params.name || params.display_name || (params as any).nome || '',
    email: params.email || '',
  };
}
