import React, { useState, useEffect } from 'react';
import { Webhook, Plus, Trash2, Save, RefreshCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Switch } from '@/components/ui/switch';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';
import { Badge } from '@/components/ui/badge';

interface WebhookEndpoint {
  id: string;
  url: string;
  name: string;
  active: boolean;
}

interface EventType {
  id: string;
  event_key: string;
  label: string;
  enabled: boolean;
}

const AdminWebhooks: React.FC = () => {
  const { toast } = useToast();
  const [endpoints, setEndpoints] = useState<WebhookEndpoint[]>([]);
  const [eventTypes, setEventTypes] = useState<EventType[]>([]);
  const [loading, setLoading] = useState(true);
  const [newUrl, setNewUrl] = useState('');
  const [newName, setNewName] = useState('');
  const [saving, setSaving] = useState(false);

  const fetchData = async () => {
    setLoading(true);
    const [{ data: eps }, { data: evts }] = await Promise.all([
      supabase.from('webhook_endpoints').select('*').order('created_at'),
      supabase.from('webhook_event_types').select('*').order('event_key'),
    ]);
    setEndpoints((eps || []) as WebhookEndpoint[]);
    setEventTypes((evts || []) as EventType[]);
    setLoading(false);
  };

  useEffect(() => { fetchData(); }, []);

  const addEndpoint = async () => {
    if (!newUrl.trim()) return;
    const { error } = await supabase.from('webhook_endpoints').insert({
      url: newUrl.trim(),
      name: newName.trim() || newUrl.trim(),
    });
    if (error) {
      toast({ title: 'Error', description: error.message, variant: 'destructive' });
    } else {
      setNewUrl('');
      setNewName('');
      fetchData();
      toast({ title: 'Webhook agregado' });
    }
  };

  const removeEndpoint = async (id: string) => {
    await supabase.from('webhook_endpoints').delete().eq('id', id);
    fetchData();
    toast({ title: 'Webhook eliminado' });
  };

  const toggleEndpoint = async (id: string, active: boolean) => {
    await supabase.from('webhook_endpoints').update({ active }).eq('id', id);
    setEndpoints(prev => prev.map(e => e.id === id ? { ...e, active } : e));
  };

  const toggleEvent = async (id: string, enabled: boolean) => {
    await supabase.from('webhook_event_types').update({ enabled }).eq('id', id);
    setEventTypes(prev => prev.map(e => e.id === id ? { ...e, enabled } : e));
  };

  const testWebhook = async (endpoint: WebhookEndpoint) => {
    setSaving(true);
    try {
      await fetch(endpoint.url, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          event: 'test.ping',
          timestamp: new Date().toISOString(),
          data: { message: 'Test webhook from Meteora Academy' },
        }),
      });
      toast({ title: 'Test enviado', description: `Ping enviado a ${endpoint.name}` });
    } catch {
      toast({ title: 'Error al enviar test', variant: 'destructive' });
    }
    setSaving(false);
  };

  if (loading) return <div className="text-muted-foreground text-sm">Cargando...</div>;

  return (
    <div className="space-y-6 max-w-2xl">
      {/* Event Types */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center gap-2 mb-1">
          <Webhook className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-foreground">Eventos del Sistema</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Seleccione qué eventos desea notificar a los webhooks configurados. Todos los eventos activados serán enviados a todos los webhooks activos.
        </p>
        <div className="space-y-3">
          {eventTypes.map(evt => (
            <div key={evt.id} className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <span className="text-sm text-foreground">{evt.label}</span>
                <Badge variant="outline" className="text-xs font-mono">{evt.event_key}</Badge>
              </div>
              <Switch checked={evt.enabled} onCheckedChange={v => toggleEvent(evt.id, v)} />
            </div>
          ))}
        </div>
      </div>

      {/* Webhook Endpoints */}
      <div className="bg-card rounded-xl border border-border p-6">
        <div className="flex items-center gap-2 mb-1">
          <Webhook className="w-5 h-5 text-primary" />
          <h3 className="font-display font-semibold text-foreground">Webhooks</h3>
        </div>
        <p className="text-xs text-muted-foreground mb-4">
          Agregue uno o más webhooks para recibir notificaciones de los eventos activados. Puede usar n8n, Make, Zapier, o cualquier URL que acepte POST.
        </p>

        {/* Existing endpoints */}
        <div className="space-y-3 mb-4">
          {endpoints.map(ep => (
            <div key={ep.id} className="flex items-center gap-3 p-3 rounded-lg border border-border bg-secondary/30">
              <div className="flex-1 min-w-0">
                <p className="text-sm font-medium text-foreground truncate">{ep.name}</p>
                <p className="text-xs text-muted-foreground font-mono truncate">{ep.url}</p>
              </div>
              <Switch checked={ep.active} onCheckedChange={v => toggleEndpoint(ep.id, v)} />
              <Button variant="ghost" size="sm" onClick={() => testWebhook(ep)} disabled={saving}>
                <RefreshCw className="w-4 h-4" />
              </Button>
              <Button variant="ghost" size="sm" onClick={() => removeEndpoint(ep.id)} className="text-destructive hover:text-destructive">
                <Trash2 className="w-4 h-4" />
              </Button>
            </div>
          ))}
          {endpoints.length === 0 && (
            <p className="text-sm text-muted-foreground text-center py-4">No hay webhooks configurados</p>
          )}
        </div>

        {/* Add new */}
        <div className="flex flex-col gap-2 p-3 rounded-lg border border-dashed border-border">
          <Input
            placeholder="Nombre (ej: n8n, Make, Zapier)"
            value={newName}
            onChange={e => setNewName(e.target.value)}
            className="bg-secondary border-border text-sm"
          />
          <div className="flex gap-2">
            <Input
              placeholder="https://hooks.example.com/webhook/..."
              value={newUrl}
              onChange={e => setNewUrl(e.target.value)}
              className="bg-secondary border-border font-mono text-sm flex-1"
            />
            <Button onClick={addEndpoint} size="sm" disabled={!newUrl.trim()}>
              <Plus className="w-4 h-4 mr-1" /> Agregar
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminWebhooks;
