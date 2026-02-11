import React, { useState } from 'react';
import { DollarSign, Plus, Edit, Trash2, CheckCircle2 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Textarea } from '@/components/ui/textarea';
import { useToast } from '@/hooks/use-toast';

interface Plan {
  id: string;
  name: string;
  description: string;
  price: number;
  currency: string;
  interval: 'month' | 'year';
  features: string[];
  active: boolean;
  subscribers: number;
}

const mockPlans: Plan[] = [
  { id: '1', name: 'Comunidad', description: 'Acceso a la comunidad exclusiva de ISPs', price: 29, currency: 'USD', interval: 'month', features: ['Acceso a la comunidad', 'Foros y networking', 'Contenido básico'], active: true, subscribers: 245 },
  { id: '2', name: 'Oráculo', description: 'Sesiones semanales en vivo con especialistas', price: 39, currency: 'USD', interval: 'month', features: ['Todo de Comunidad', 'Sesiones semanales en vivo', 'Grabaciones de sesiones', 'Soporte prioritario'], active: true, subscribers: 128 },
  { id: '3', name: 'Mentoría', description: 'Acompañamiento estratégico personalizado', price: 199, currency: 'USD', interval: 'month', features: ['Todo de Oráculo', 'Mentoría 1-a-1', 'Plan estratégico personalizado', 'Acceso a todos los cursos', 'Soporte directo por WhatsApp'], active: true, subscribers: 42 },
];

const AdminPlans: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [plans, setPlans] = useState<Plan[]>(mockPlans);
  const [showEditor, setShowEditor] = useState(false);
  const [editingPlan, setEditingPlan] = useState<Plan | null>(null);

  const [form, setForm] = useState({ name: '', description: '', price: '', features: '' });

  const openNew = () => {
    setEditingPlan(null);
    setForm({ name: '', description: '', price: '', features: '' });
    setShowEditor(true);
  };

  const openEdit = (plan: Plan) => {
    setEditingPlan(plan);
    setForm({ name: plan.name, description: plan.description, price: plan.price.toString(), features: plan.features.join('\n') });
    setShowEditor(true);
  };

  const savePlan = () => {
    if (!form.name.trim() || !form.price.trim()) return;
    if (editingPlan) {
      setPlans(prev => prev.map(p => p.id === editingPlan.id ? {
        ...p, name: form.name, description: form.description, price: parseFloat(form.price),
        features: form.features.split('\n').filter(f => f.trim())
      } : p));
      toast({ title: 'Plan actualizado' });
    } else {
      setPlans(prev => [...prev, {
        id: Date.now().toString(), name: form.name, description: form.description,
        price: parseFloat(form.price), currency: 'USD', interval: 'month',
        features: form.features.split('\n').filter(f => f.trim()), active: false, subscribers: 0
      }]);
      toast({ title: 'Plan creado' });
    }
    setShowEditor(false);
  };

  const deletePlan = (id: string) => {
    setPlans(prev => prev.filter(p => p.id !== id));
    toast({ title: 'Plan eliminado' });
  };

  const toggleActive = (id: string) => {
    setPlans(prev => prev.map(p => p.id === id ? { ...p, active: !p.active } : p));
  };

  return (
    <div>
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 mb-6">
        <div>
          <h2 className="text-xl font-display font-bold text-foreground">{t('managePlans')}</h2>
          <p className="text-sm text-muted-foreground">{t('adminPlansDesc')}</p>
        </div>
        <Button onClick={openNew} className="gap-2">
          <Plus className="w-4 h-4" /> {t('addPlan')}
        </Button>
      </div>

      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
        {plans.map(plan => (
          <div key={plan.id} className={`bg-card rounded-xl border p-6 flex flex-col ${plan.active ? 'border-primary/30' : 'border-border opacity-70'}`}>
            <div className="flex items-center justify-between mb-3">
              <Badge variant={plan.active ? 'default' : 'secondary'} className={plan.active ? 'bg-green-500/10 text-green-500 border-green-500/20' : ''}>
                {plan.active ? t('active') : t('inactive')}
              </Badge>
              <div className="flex gap-1">
                <Button variant="ghost" size="sm" onClick={() => openEdit(plan)}><Edit className="w-4 h-4" /></Button>
                <Button variant="ghost" size="sm" onClick={() => deletePlan(plan.id)} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
              </div>
            </div>
            <h3 className="text-lg font-display font-bold text-foreground">{plan.name}</h3>
            <p className="text-sm text-muted-foreground mb-3">{plan.description}</p>
            <p className="text-3xl font-display font-bold text-foreground mb-1">
              U$ {plan.price}<span className="text-sm font-normal text-muted-foreground">/{plan.interval === 'month' ? t('month') : t('year')}</span>
            </p>
            <p className="text-xs text-muted-foreground mb-4">{plan.subscribers} {t('subscribers')}</p>
            <ul className="space-y-2 flex-1">
              {plan.features.map((f, i) => (
                <li key={i} className="flex items-start gap-2 text-sm text-foreground">
                  <CheckCircle2 className="w-4 h-4 text-primary shrink-0 mt-0.5" />
                  {f}
                </li>
              ))}
            </ul>
            <Button variant="outline" size="sm" className="mt-4 w-full" onClick={() => toggleActive(plan.id)}>
              {plan.active ? t('deactivate') : t('activate')}
            </Button>
          </div>
        ))}
      </div>

      <Dialog open={showEditor} onOpenChange={setShowEditor}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">{editingPlan ? t('editPlan') : t('addPlan')}</DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('planName')}</label>
              <Input value={form.name} onChange={e => setForm(f => ({ ...f, name: e.target.value }))} className="bg-secondary border-border" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('planDescription')}</label>
              <Input value={form.description} onChange={e => setForm(f => ({ ...f, description: e.target.value }))} className="bg-secondary border-border" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('planPrice')} (USD)</label>
              <Input type="number" value={form.price} onChange={e => setForm(f => ({ ...f, price: e.target.value }))} className="bg-secondary border-border" />
            </div>
            <div>
              <label className="text-sm text-muted-foreground mb-1 block">{t('planFeatures')}</label>
              <Textarea value={form.features} onChange={e => setForm(f => ({ ...f, features: e.target.value }))} className="bg-secondary border-border" rows={4} placeholder={t('planFeaturesPlaceholder')} />
            </div>
            <Button onClick={savePlan} className="w-full">{t('save')}</Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPlans;
