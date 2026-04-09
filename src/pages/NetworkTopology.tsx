import React, { useState, useEffect, useCallback } from 'react';
import {
  ReactFlow,
  MiniMap,
  Controls,
  Background,
  useNodesState,
  useEdgesState,
  addEdge,
  Connection,
  Node,
  Edge,
  BackgroundVariant,
  Panel,
} from '@xyflow/react';
import '@xyflow/react/dist/style.css';
import { useAuth } from '@/hooks/useAuth';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card } from '@/components/ui/card';
import { Save, Plus, Trash2, Network } from 'lucide-react';
import { useToast } from '@/hooks/use-toast';

const deviceTypes = [
  { value: 'router', label: 'Router', color: '#ef4444' },
  { value: 'switch', label: 'Switch', color: '#3b82f6' },
  { value: 'server', label: 'Server', color: '#8b5cf6' },
  { value: 'firewall', label: 'Firewall', color: '#f97316' },
  { value: 'ap', label: 'Access Point', color: '#22c55e' },
  { value: 'olt', label: 'OLT', color: '#06b6d4' },
  { value: 'onu', label: 'ONU/ONT', color: '#14b8a6' },
  { value: 'client', label: 'Cliente', color: '#6b7280' },
];

const NetworkTopology: React.FC = () => {
  const { user } = useAuth();
  const { t } = useLanguage();
  const { toast } = useToast();
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);
  const [topologyId, setTopologyId] = useState<string | null>(null);
  const [topologyName, setTopologyName] = useState('');
  const [topologies, setTopologies] = useState<{ id: string; name: string }[]>([]);
  const [saving, setSaving] = useState(false);
  const [selectedDevice, setSelectedDevice] = useState('router');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) return;
    supabase
      .from('network_topologies')
      .select('id, name')
      .eq('user_id', user.id)
      .order('created_at', { ascending: false })
      .then(({ data }) => {
        const list = data || [];
        setTopologies(list);
        if (list.length > 0) {
          loadTopology(list[0].id);
        } else {
          setLoading(false);
        }
      });
  }, [user]);

  const loadTopology = async (id: string) => {
    setLoading(true);
    const { data } = await supabase
      .from('network_topologies')
      .select('*')
      .eq('id', id)
      .single();
    if (data) {
      setTopologyId(data.id);
      setTopologyName(data.name);
      const parsed = data.data as unknown as { nodes: Node[]; edges: Edge[] };
      setNodes(parsed.nodes || []);
      setEdges(parsed.edges || []);
    }
    setLoading(false);
  };

  const onConnect = useCallback(
    (params: Connection) => setEdges(eds => addEdge({ ...params, animated: true, style: { stroke: 'hsl(349, 100%, 62%)' } }, eds)),
    [setEdges]
  );

  const addNode = () => {
    const device = deviceTypes.find(d => d.value === selectedDevice)!;
    const newNode: Node = {
      id: `${Date.now()}`,
      type: 'default',
      position: { x: Math.random() * 400 + 100, y: Math.random() * 300 + 100 },
      data: { label: `${device.label}` },
      style: {
        background: device.color,
        color: '#fff',
        border: 'none',
        borderRadius: '8px',
        padding: '8px 16px',
        fontSize: '12px',
        fontWeight: 600,
      },
    };
    setNodes(nds => [...nds, newNode]);
  };

  const handleSave = async () => {
    if (!user) return;
    setSaving(true);
    const payload = { nodes, edges };

    if (topologyId) {
      await supabase
        .from('network_topologies')
        .update({ name: topologyName || 'Minha Topologia', data: payload as unknown as import('@/integrations/supabase/types').Json })
        .eq('id', topologyId);
    } else {
      const { data } = await supabase
        .from('network_topologies')
        .insert([{ user_id: user.id, name: topologyName || 'Minha Topologia', data: payload as unknown as import('@/integrations/supabase/types').Json }])
        .select('id, name')
        .single();
      if (data) {
        setTopologyId(data.id);
        setTopologies(prev => [data, ...prev]);
      }
    }
    toast({ title: t('topologySaved') });
    setSaving(false);
  };

  const handleNew = async () => {
    if (!user) return;
    const { data } = await supabase
      .from('network_topologies')
      .insert([{ user_id: user.id, name: t('newTopology'), data: { nodes: [], edges: [] } as unknown as import('@/integrations/supabase/types').Json }])
      .select('id, name')
      .single();
    if (data) {
      setTopologyId(data.id);
      setTopologyName(data.name);
      setNodes([]);
      setEdges([]);
      setTopologies(prev => [data, ...prev]);
    }
  };

  const handleDelete = async () => {
    if (!topologyId) return;
    await supabase.from('network_topologies').delete().eq('id', topologyId);
    setTopologies(prev => prev.filter(t => t.id !== topologyId));
    setTopologyId(null);
    setNodes([]);
    setEdges([]);
    setTopologyName('');
    toast({ title: t('topologyDeleted') });
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full p-8">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary" />
      </div>
    );
  }

  return (
    <div className="flex flex-col h-[calc(100vh-0px)]">
      {/* Toolbar */}
      <div className="p-4 border-b border-border flex flex-wrap items-center gap-3">
        <Network className="w-5 h-5 text-primary" />
        <h1 className="text-lg font-bold font-display mr-4">{t('networkTopology')}</h1>

        {topologies.length > 0 && (
          <Select value={topologyId || ''} onValueChange={loadTopology}>
            <SelectTrigger className="w-48">
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              {topologies.map(tp => (
                <SelectItem key={tp.id} value={tp.id}>{tp.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        )}

        <Input
          value={topologyName}
          onChange={e => setTopologyName(e.target.value)}
          className="w-40"
          placeholder={t('topologyName')}
        />

        <Select value={selectedDevice} onValueChange={setSelectedDevice}>
          <SelectTrigger className="w-36">
            <SelectValue />
          </SelectTrigger>
          <SelectContent>
            {deviceTypes.map(d => (
              <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
            ))}
          </SelectContent>
        </Select>

        <Button size="sm" variant="outline" onClick={addNode}>
          <Plus className="w-4 h-4 mr-1" /> {t('addDevice')}
        </Button>

        <Button size="sm" onClick={handleSave} disabled={saving}>
          <Save className="w-4 h-4 mr-1" /> {t('save')}
        </Button>

        <Button size="sm" variant="outline" onClick={handleNew}>
          <Plus className="w-4 h-4 mr-1" /> {t('newTopology')}
        </Button>

        {topologyId && (
          <Button size="sm" variant="destructive" onClick={handleDelete}>
            <Trash2 className="w-4 h-4 mr-1" /> {t('deleteUser')}
          </Button>
        )}
      </div>

      {/* Canvas */}
      <div className="flex-1">
        <ReactFlow
          nodes={nodes}
          edges={edges}
          onNodesChange={onNodesChange}
          onEdgesChange={onEdgesChange}
          onConnect={onConnect}
          fitView
          className="bg-background"
        >
          <Controls className="!bg-card !border-border !shadow-lg [&_button]:!bg-card [&_button]:!border-border [&_button]:!text-foreground" />
          <MiniMap
            className="!bg-card !border-border"
            nodeColor={() => 'hsl(349, 100%, 62%)'}
          />
          <Background variant={BackgroundVariant.Dots} gap={20} size={1} color="hsl(207, 15%, 20%)" />
          
          {nodes.length === 0 && (
            <Panel position="top-center">
              <Card className="bg-card/80 backdrop-blur border-border p-6 mt-20 text-center">
                <Network className="w-12 h-12 text-muted-foreground mx-auto mb-3" />
                <p className="text-muted-foreground text-sm">{t('topologyEmpty')}</p>
              </Card>
            </Panel>
          )}
        </ReactFlow>
      </div>
    </div>
  );
};

export default NetworkTopology;
