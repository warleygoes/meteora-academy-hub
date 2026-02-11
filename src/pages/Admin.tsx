import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Users, BookOpen, DollarSign, TrendingUp, Settings, CreditCard, GraduationCap, BarChart3, Shield, Plus, Trash2, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';

interface AdminUser {
  user_id: string;
  email: string;
  display_name: string | null;
}

const AdminPage: React.FC = () => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [showAdminManager, setShowAdminManager] = useState(false);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [adding, setAdding] = useState(false);

  const stats = [
    { label: t('totalStudents'), value: '2,847', icon: Users, change: '+12%' },
    { label: t('activeCourses'), value: '24', icon: BookOpen, change: '+3' },
    { label: t('revenue'), value: 'R$ 48.290', icon: DollarSign, change: '+18%' },
    { label: t('engagement'), value: '87%', icon: TrendingUp, change: '+5%' },
  ];

  const adminSections = [
    { label: t('manageCourses'), icon: GraduationCap, description: 'Adicionar, editar e organizar cursos' },
    { label: t('managePlans'), icon: CreditCard, description: 'Configurar planos e preços' },
    { label: t('manageUsers'), icon: Users, description: 'Gerenciar alunos e permissões' },
    { label: t('analytics'), icon: BarChart3, description: 'Relatórios e métricas detalhadas' },
    { label: t('settings'), icon: Settings, description: 'Configurações gerais da plataforma' },
    { label: 'Gerenciar Admins', icon: Shield, description: 'Adicionar ou remover administradores', onClick: () => setShowAdminManager(true) },
  ];

  const fetchAdmins = async () => {
    setLoadingAdmins(true);
    const { data: roles } = await supabase
      .from('user_roles')
      .select('user_id')
      .eq('role', 'admin');

    if (roles && roles.length > 0) {
      const userIds = roles.map(r => r.user_id);
      const { data: profiles } = await supabase
        .from('profiles')
        .select('user_id, display_name')
        .in('user_id', userIds);

      // We need emails - fetch from profiles or use display_name
      const adminList: AdminUser[] = (profiles || []).map(p => ({
        user_id: p.user_id,
        email: p.display_name || 'Unknown',
        display_name: p.display_name,
      }));
      setAdmins(adminList);
    } else {
      setAdmins([]);
    }
    setLoadingAdmins(false);
  };

  useEffect(() => {
    if (showAdminManager) fetchAdmins();
  }, [showAdminManager]);

  const addAdmin = async () => {
    if (!newAdminEmail.trim()) return;
    setAdding(true);

    // Find user by checking profiles where display_name might be the email
    // We need to search profiles for users with matching email-like display_name
    const { data: profiles } = await supabase
      .from('profiles')
      .select('user_id, display_name')
      .ilike('display_name', newAdminEmail.trim());

    if (!profiles || profiles.length === 0) {
      toast({ title: 'Usuário não encontrado. O usuário precisa ter uma conta cadastrada.', variant: 'destructive' });
      setAdding(false);
      return;
    }

    const userId = profiles[0].user_id;

    const { error } = await supabase
      .from('user_roles')
      .insert({ user_id: userId, role: 'admin' as any });

    if (error) {
      if (error.code === '23505') {
        toast({ title: 'Este usuário já é administrador.', variant: 'destructive' });
      } else {
        toast({ title: error.message, variant: 'destructive' });
      }
    } else {
      toast({ title: 'Administrador adicionado com sucesso!' });
      setNewAdminEmail('');
      fetchAdmins();
    }
    setAdding(false);
  };

  const removeAdmin = async (userId: string) => {
    const { error } = await supabase
      .from('user_roles')
      .delete()
      .eq('user_id', userId)
      .eq('role', 'admin' as any);

    if (error) {
      toast({ title: error.message, variant: 'destructive' });
    } else {
      toast({ title: 'Administrador removido.' });
      fetchAdmins();
    }
  };

  return (
    <div className="px-6 md:px-12 py-8">
      <h1 className="text-3xl font-display font-bold mb-8">{t('adminPanel')}</h1>

      {/* Stats */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
        {stats.map((stat, i) => (
          <motion.div
            key={stat.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: i * 0.1 }}
            className="bg-card rounded-xl p-5 card-shadow border border-border"
          >
            <div className="flex items-center justify-between mb-3">
              <stat.icon className="w-5 h-5 text-primary" />
              <span className="text-xs font-medium text-success">{stat.change}</span>
            </div>
            <p className="text-2xl font-display font-bold text-foreground">{stat.value}</p>
            <p className="text-sm text-muted-foreground mt-1">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      {/* Admin sections */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {adminSections.map((section, i) => (
          <motion.div
            key={section.label}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 + i * 0.08 }}
            onClick={section.onClick}
            className="bg-card rounded-xl p-6 card-shadow border border-border hover:border-primary/30 transition-colors cursor-pointer group"
          >
            <section.icon className="w-8 h-8 text-primary mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="font-display font-semibold text-foreground mb-1">{section.label}</h3>
            <p className="text-sm text-muted-foreground">{section.description}</p>
          </motion.div>
        ))}
      </div>

      {/* Admin Manager Dialog */}
      <Dialog open={showAdminManager} onOpenChange={setShowAdminManager}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" />
              Gerenciar Administradores
            </DialogTitle>
          </DialogHeader>

          {/* Add admin */}
          <div className="flex gap-2 mt-2">
            <Input
              placeholder="Email do usuário..."
              value={newAdminEmail}
              onChange={(e) => setNewAdminEmail(e.target.value)}
              className="bg-secondary border-border"
            />
            <Button onClick={addAdmin} disabled={adding} size="sm" className="gap-1 shrink-0">
              <Plus className="w-4 h-4" /> Adicionar
            </Button>
          </div>

          {/* Admin list */}
          <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
            {loadingAdmins ? (
              <p className="text-sm text-muted-foreground text-center py-4">Carregando...</p>
            ) : admins.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">Nenhum administrador encontrado.</p>
            ) : (
              admins.map((admin) => (
                <div key={admin.user_id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
                  <div>
                    <p className="text-sm font-medium text-foreground">{admin.display_name || 'Sem nome'}</p>
                    <p className="text-xs text-muted-foreground">{admin.user_id.slice(0, 8)}...</p>
                  </div>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => removeAdmin(admin.user_id)}
                    className="text-destructive hover:text-destructive hover:bg-destructive/10"
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))
            )}
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminPage;
