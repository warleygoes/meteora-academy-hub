import React, { useState, useEffect, useCallback } from 'react';
import { Wrench, Plus, Edit, Trash2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { useToast } from '@/hooks/use-toast';
import { supabase } from '@/integrations/supabase/client';

interface Service {
  id: string;
  title: string;
  description: string | null;
  payment_type: string;
  price: number;
  currency: string;
  active: boolean;
}

const AdminServices: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [showEditor, setShowEditor] = useState(false);
  const [editing, setEditing] = useState<Service | null>(null);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteId, setDeleteId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: '', description: '', price: '', payment_type: 'one_time', currency: 'USD',
  });

  const fetchServices = useCallback(async () => {
    setLoading(true);
    const { data } = await supabase.from('services').select('*').order('created_at', { ascending: false });
    if (data) setServices(data);
    setLoading(false);
  }, []);

  useEffect(() => { fetchServices(); }, [fetchServices]);

  const openNew = () => {
    setEditing(null);
    setForm({ title: '', description: '', price: '', payment_type: 'one_time', currency: 'USD' });
    setShowEditor(true);
  };

  const openEdit = (s: Service) => {
    setEditing(s);
    setForm({
      title: s.title,
      description: s.description || '',
      price: s.price.toString(),
      payment_type: s.payment_type,
      currency: s.currency,
    });
    setShowEditor(true);
  };

  const save = async () => {
    if (!form.title.trim() || !form.price.trim()) return;
    const payload = {
      title: form.title,
      description: form.description || null,
      price: parseFloat(form.price),
      payment_type: form.payment_type,
      currency: form.currency,
    };
    if (editing) {
      await supabase.from('services').update(payload).eq('id', editing.id);
      toast({ title: t('serviceUpdated') || 'Servicio actualizado' });
    } else {
      await supabase.from('services').insert({ ...payload, active: true });
      toast({ title: t('serviceCreated') || 'Servicio creado' });
    }
    setShowEditor(false);
    fetchServices();
  };

  const confirmDelete = (id: string) => { setDeleteId(id); setShowDelete(true); };

  const executeDelete = async () => {
    if (!deleteId) return;
    await supabase.from('services').delete().eq('id', deleteId);
    toast({ title: t('serviceDeleted') || 'Servicio eliminado' });
    setShowDelete(false);
    setDeleteId(null);
    fetchServices();
  };

  const toggleActive = async (s: Service) => {
    await supabase.from('services').update({ active: !s.active }).eq('id', s.id);
    fetchServices();
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-display font-bold text-foreground">{t('manageServices') || 'Gestionar Servicios'}</h2>
          <p className="text-sm text-muted-foreground">{t('adminServicesDesc') || 'Servicios que pueden vincularse a planes'}</p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="w-4 h-4" /> {t('addService') || 'Agregar Servicio'}
        </Button>
      </div>

      {loading ? (
        <p className="text-center py-12 text-muted-foreground">{t('loading')}...</p>
      ) : services.length === 0 ? (
        <p className="text-center py-12 text-muted-foreground">{t('noServicesFound') || 'No se encontraron servicios.'}</p>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
          {services.map(s => (
            <div key={s.id} className={`bg-card rounded-xl border p-5 flex flex-col ${s.active ? 'border-primary/30' : 'border-border opacity-70'}`}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <Badge variant={s.active ? 'default' : 'secondary'} className={s.active ? 'bg-green-500/10 text-green-500 border-green-500/20' : ''}>
                    {s.active ? t('active') : t('inactive')}
                  </Badge>
                  <Badge variant="outline" className="text-xs">
                    {s.payment_type === 'monthly' ? (t('monthly') || 'Mensual') : (t('oneTime') || 'Único')}
                  </Badge>
                </div>
                <div className="flex gap-1">
                  <Button variant="ghost" size="sm" onClick={() => openEdit(s)}><Edit className="w-4 h-4" /></Button>
                  <Button variant="ghost" size="sm" onClick={() => confirmDelete(s.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                </div>
              </div>
              <div className="flex items-center gap-2 mb-2">
                <Wrench className="w-4 h-4 text-primary" />
                <h3 className="text-lg font-display font-bold text-foreground">{s.title}</h3>
              </div>
              {s.description && <p className="text-sm text-muted-foreground mb-3">{s.description}</p>}
              <p className="text-2xl font-display font-bold text-foreground">
                {s.currency === 'USD' ? 'U$' : s.currency} {s.price}
                {s.payment_type === 'monthly' && <span className="text-sm font-normal text-muted-foreground">/{t('month')}</span>}
              </p>
              <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => toggleActive(s)}>
                {s.active ? t('deactivate') : t('activate')}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Delete confirmation */}
      <AlertDialog open={showDelete} onOpenChange={setShowDelete}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('deleteServiceConfirm') || '¿Eliminar este servicio?'}</AlertDialogTitle>
            <AlertDialogDescription>{t('deleteServiceDesc') || 'Esta acción es irreversible.'}</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('back') || 'Cancelar'}</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              {t('deleteUser') || 'Eliminar'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Editor */}
      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">{editing ? (t('editService') || 'Editar Servicio') : (t('addService') || 'Agregar Servicio')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('serviceTitle') || 'Nombre del servicio'}</label>
              <Input value={form.title} onChange={e => setForm(f => ({ ...f, title: e.target.value }))} className="bg-secondary border-border" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('planDescription')}</label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="bg-secondary border-border" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">{t('planPrice')} (USD)</label>
                <Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className="bg-secondary border-border" />
              </div>
              <div>
                <label className="text-sm text-muted-foreground mb-1 block">{t('paymentType') || 'Tipo de pago'}</label>
                <Select value={form.payment_type} onValueChange={v => setForm(f => ({ ...f, payment_type: v }))}>
                  <SelectTrigger className="bg-secondary border-border"><SelectValue /></SelectTrigger>
                  <SelectContent>
                    <SelectItem value="monthly">{t('monthly') || 'Mensual'}</SelectItem>
                    <SelectItem value="one_time">{t('oneTime') || 'Pago Único'}</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <Button onClick={save} className="w-full">{t('save')}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminServices;
