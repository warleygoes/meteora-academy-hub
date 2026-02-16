import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
};

Deno.serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const { event, data } = await req.json();

    const supabaseUrl = Deno.env.get('SUPABASE_URL')!;
    const supabaseKey = Deno.env.get('SUPABASE_SERVICE_ROLE_KEY')!;
    const supabase = createClient(supabaseUrl, supabaseKey);

    // Check if this event type is enabled
    const { data: eventType } = await supabase
      .from('webhook_event_types')
      .select('enabled')
      .eq('event_key', event)
      .single();

    if (!eventType?.enabled) {
      return new Response(JSON.stringify({ ok: true, skipped: true, reason: 'event not enabled' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    // Get all active webhook endpoints
    const { data: endpoints } = await supabase
      .from('webhook_endpoints')
      .select('id, url, name')
      .eq('active', true);

    if (!endpoints || endpoints.length === 0) {
      return new Response(JSON.stringify({ ok: true, skipped: true, reason: 'no active endpoints' }), {
        headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      });
    }

    const payload = {
      event,
      timestamp: new Date().toISOString(),
      data,
    };

    // Send to all endpoints in parallel
    const results = await Promise.allSettled(
      endpoints.map(async (ep) => {
        const res = await fetch(ep.url, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload),
        });
        return { endpoint: ep.name, status: res.status };
      })
    );

    return new Response(JSON.stringify({ ok: true, results }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      status: 500,
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
    });
  }
});
