import { supabase } from '@/integrations/supabase/client';

export async function logSystemEvent(params: {
  action: string;
  entity_type: string;
  entity_id?: string;
  details?: string;
  level?: 'info' | 'success' | 'warning' | 'error';
}) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    await supabase.from('system_logs').insert({
      action: params.action,
      entity_type: params.entity_type,
      entity_id: params.entity_id || null,
      details: params.details || null,
      level: params.level || 'info',
      performed_by: user?.id || null,
      performer_email: user?.email || null,
    });
  } catch (e) {
    console.error('Failed to log system event:', e);
  }
}
