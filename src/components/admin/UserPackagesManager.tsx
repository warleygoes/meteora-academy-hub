import React, { useState, useEffect, useCallback } from 'react';
import { Package, Plus, Trash2, ShoppingBag } from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { useLanguage } from '@/contexts/LanguageContext';
import { useToast } from '@/hooks/use-toast';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import {
  Select, SelectContent, SelectItem, SelectTrigger, SelectValue,
} from '@/components/ui/select';
import {
  AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent,
  AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle,
} from '@/components/ui/alert-dialog';

interface UserPlan {
  id: string;
  package_id: string;
  status: string;
  starts_at: string;
  expires_at: string | null;
  package_name?: string;
}

interface AvailablePackage {
  id: string;
  name: string;
  description: string | null;
}

interface AvailableProduct {
  id: string;
  name: string;
  type: string;
}

interface UserProduct {
  id: string; // offer or package_products id
  product_id: string;
  product_name: string;
  product_type: string;
  source: string; // package name or "direct"
}

interface Props {
  userId: string;
  onUpdate?: () => void;
}

const UserPackagesManager: React.FC<Props> = ({ userId, onUpdate }) => {
  const { t } = useLanguage();
  const { toast } = useToast();

  const [userPlans, setUserPlans] = useState<UserPlan[]>([]);
  const [userProducts, setUserProducts] = useState<UserProduct[]>([]);
  const [availablePackages, setAvailablePackages] = useState<AvailablePackage[]>([]);
  const [availableProducts, setAvailableProducts] = useState<AvailableProduct[]>([]);
  const [loading, setLoading] = useState(true);

  const [selectedPackageId, setSelectedPackageId] = useState('');
  const [addingPackage, setAddingPackage] = useState(false);

  const [removePlanId, setRemovePlanId] = useState<string | null>(null);
  const [removePlanName, setRemovePlanName] = useState('');

  const fetchData = useCallback(async () => {
    setLoading(true);

    const [{ data: plans }, { data: packages }, { data: products }] = await Promise.all([
      supabase.from('user_plans').select('*').eq('user_id', userId).order('created_at', { ascending: false }),
      supabase.from('packages').select('id, name, description'),
      supabase.from('products').select('id, name, type').eq('active', true),
    ]);

    // Enrich plans with package names
    const enrichedPlans: UserPlan[] = (plans || []).map(p => ({
      ...p,
      package_name: (packages || []).find(pkg => pkg.id === p.package_id)?.name || 'Pacote desconhecido',
    }));
    setUserPlans(enrichedPlans);
    setAvailablePackages(packages || []);
    setAvailableProducts(products || []);

    // Get products through packages
    const packageIds = (plans || []).map(p => p.package_id);
    if (packageIds.length > 0) {
      const { data: pkgProducts } = await supabase
        .from('package_products')
        .select('id, package_id, product_id')
        .in('package_id', packageIds);

      const productList: UserProduct[] = (pkgProducts || []).map(pp => {
        const prod = (products || []).find(p => p.id === pp.product_id);
        const pkg = (packages || []).find(p => p.id === pp.package_id);
        return {
          id: pp.id,
          product_id: pp.product_id,
          product_name: prod?.name || '—',
          product_type: prod?.type || '—',
          source: pkg?.name || '—',
        };
      });
      setUserProducts(productList);
    } else {
      setUserProducts([]);
    }

    setLoading(false);
  }, [userId]);

  useEffect(() => { fetchData(); }, [fetchData]);

  const addPackage = async () => {
    if (!selectedPackageId) return;
    setAddingPackage(true);
    const { error } = await supabase.from('user_plans').insert({
      user_id: userId,
      package_id: selectedPackageId,
      status: 'active',
      starts_at: new Date().toISOString(),
    });
    if (error) {
      toast({ title: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('packageAdded') || 'Pacote adicionado com sucesso!' });
      setSelectedPackageId('');
      fetchData();
      onUpdate?.();
    }
    setAddingPackage(false);
  };

  const confirmRemovePlan = (planId: string, name: string) => {
    setRemovePlanId(planId);
    setRemovePlanName(name);
  };

  const executeRemovePlan = async () => {
    if (!removePlanId) return;
    const { error } = await supabase.from('user_plans').delete().eq('id', removePlanId);
    if (error) {
      toast({ title: error.message, variant: 'destructive' });
    } else {
      toast({ title: t('packageRemoved') || 'Pacote removido.' });
      fetchData();
      onUpdate?.();
    }
    setRemovePlanId(null);
  };

  const productTypeLabels: Record<string, string> = {
    course: t('typeCourse') || 'Curso',
    service: t('typeService') || 'Serviço',
    consultation: t('typeConsultation') || 'Consultoria',
    implementation: t('typeImplementation') || 'Implementação',
    virtual_event: t('typeVirtualEvent') || 'Evento Virtual',
    in_person_event: t('typeInPersonEvent') || 'Evento Presencial',
  };

  if (loading) return <p className="text-sm text-muted-foreground py-2">{t('loading')}...</p>;

  return (
    <div className="space-y-4">
      {/* Packages Section */}
      <div>
        <p className="text-sm font-medium text-foreground flex items-center gap-1.5 mb-2">
          <Package className="w-4 h-4 text-primary" /> {t('packages') || 'Pacotes'}
        </p>

        {userPlans.length === 0 ? (
          <p className="text-xs text-muted-foreground mb-2">{t('noPackagesAssigned') || 'Nenhum pacote atribuído.'}</p>
        ) : (
          <div className="space-y-1.5 mb-2">
            {userPlans.map(plan => (
              <div key={plan.id} className="flex items-center justify-between gap-2 p-2 rounded-md bg-secondary/50 border border-border">
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-foreground truncate">{plan.package_name}</p>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Badge variant={plan.status === 'active' ? 'default' : 'secondary'} className="text-xs h-5">
                      {plan.status === 'active' ? (t('active') || 'Ativo') : plan.status}
                    </Badge>
                    <span>{new Date(plan.starts_at).toLocaleDateString()}</span>
                    {plan.expires_at && <span>→ {new Date(plan.expires_at).toLocaleDateString()}</span>}
                  </div>
                </div>
                <Button variant="ghost" size="sm" className="text-destructive hover:text-destructive shrink-0"
                  onClick={() => confirmRemovePlan(plan.id, plan.package_name || '')}>
                  <Trash2 className="w-4 h-4" />
                </Button>
              </div>
            ))}
          </div>
        )}

        {/* Add Package */}
        <div className="flex gap-2">
          <Select value={selectedPackageId} onValueChange={setSelectedPackageId}>
            <SelectTrigger className="flex-1 bg-secondary border-border text-sm h-9">
              <SelectValue placeholder={t('selectPackage') || 'Selecionar pacote...'} />
            </SelectTrigger>
            <SelectContent>
              {availablePackages.map(pkg => (
                <SelectItem key={pkg.id} value={pkg.id}>{pkg.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button size="sm" className="gap-1 h-9" onClick={addPackage} disabled={!selectedPackageId || addingPackage}>
            <Plus className="w-4 h-4" /> {t('add') || 'Adicionar'}
          </Button>
        </div>
      </div>

      {/* Products through packages */}
      {userProducts.length > 0 && (
        <div>
          <p className="text-sm font-medium text-foreground flex items-center gap-1.5 mb-2">
            <ShoppingBag className="w-4 h-4 text-primary" /> {t('productsViaPackages') || 'Produtos (via pacotes)'}
          </p>
          <div className="space-y-1">
            {userProducts.map(prod => (
              <div key={prod.id} className="flex items-center gap-2 text-xs p-1.5 rounded bg-secondary/30">
                <Badge variant="outline" className="text-xs h-5">{productTypeLabels[prod.product_type] || prod.product_type}</Badge>
                <span className="text-foreground truncate">{prod.product_name}</span>
                <span className="text-muted-foreground ml-auto shrink-0">← {prod.source}</span>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Remove Confirmation */}
      <AlertDialog open={!!removePlanId} onOpenChange={() => setRemovePlanId(null)}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>{t('removePackageConfirm') || `Remover pacote "${removePlanName}"?`}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('removePackageDesc') || 'O usuário perderá acesso aos produtos incluídos neste pacote.'}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('cancel') || 'Cancelar'}</AlertDialogCancel>
            <AlertDialogAction onClick={executeRemovePlan} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              <Trash2 className="w-4 h-4 mr-2" /> {t('remove') || 'Remover'}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
};

export default UserPackagesManager;
