import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Trash2, CheckCircle2, XCircle, Search, Eye, Ban, UserCheck,
  Clock, Globe, Building2, Phone, Wifi, Shield, Plus, UserX, KeyRound, Package, Upload
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import UserPackagesManager from './UserPackagesManager';
import ImportUsersDialog from './ImportUsersDialog';

const countryCodes: Record<string, string> = {
  'Argentina': 'ar', 'Brasil': 'br', 'Brazil': 'br', 'Colombia': 'co', 'Venezuela': 've',
  'Perú': 'pe', 'Peru': 'pe', 'Ecuador': 'ec', 'Chile': 'cl', 'Uruguay': 'uy',
  'Paraguay': 'py', 'Bolivia': 'bo', 'México': 'mx', 'Mexico': 'mx', 'Panamá': 'pa',
  'Panama': 'pa', 'Costa Rica': 'cr', 'Guatemala': 'gt', 'Honduras': 'hn',
  'El Salvador': 'sv', 'Nicaragua': 'ni', 'Cuba': 'cu', 'República Dominicana': 'do',
  'Dominican Republic': 'do', 'Puerto Rico': 'pr', 'España': 'es', 'Spain': 'es',
  'United States': 'us', 'Estados Unidos': 'us',
};

const FlagImg: React.FC<{ country: string | null; size?: number }> = ({ country, size = 16 }) => {
  if (!country) return null;
  const code = countryCodes[country];
  if (!code) return <Globe className="w-4 h-4 text-muted-foreground" />;
  return (
    <img src={`https://flagcdn.com/w40/${code}.png`} srcSet={`https://flagcdn.com/w80/${code}.png 2x`}
      width={size} height={Math.round(size * 0.75)} alt={country}
      className="inline-block rounded-sm object-cover" style={{ width: size, height: Math.round(size * 0.75) }} />
  );
};

interface ProfileUser {
  id: string; user_id: string; email: string | null; display_name: string | null;
  company_name: string | null; country: string | null; phone: string | null;
  role_type: string | null; client_count: string | null; network_type: string | null;
  cheapest_plan_usd: number | null; main_problems: string | null; main_desires: string | null;
  approved: boolean; status: string; created_at: string;
}

interface AdminUser { user_id: string; display_name: string | null; email: string | null; }

interface AdminUsersProps {
  stats: { total: number; approved: number; pending: number; rejected: number };
  onStatsUpdate: (stats: { total: number; approved: number; pending: number; rejected: number }) => void;
}

const AdminUsers: React.FC<AdminUsersProps> = ({ stats, onStatsUpdate }) => {
  const { t } = useLanguage();
  const { toast } = useToast();
  const [activeTab, setActiveTab] = useState('pending');

  const [pendingUsers, setPendingUsers] = useState<ProfileUser[]>([]);
  const [rejectedUsers, setRejectedUsers] = useState<ProfileUser[]>([]);
  const [approvedUsers, setApprovedUsers] = useState<ProfileUser[]>([]);
  const [loadingPending, setLoadingPending] = useState(true);
  const [loadingRejected, setLoadingRejected] = useState(true);
  const [loadingApproved, setLoadingApproved] = useState(true);
  const [selectedUser, setSelectedUser] = useState<ProfileUser | null>(null);

  const [allUsers, setAllUsers] = useState<ProfileUser[]>([]);
  const [loadingAll, setLoadingAll] = useState(false);
  const [userSearch, setUserSearch] = useState('');
  const [userFilter, setUserFilter] = useState<'all' | 'approved' | 'pending' | 'rejected'>('all');

  const [showAdminManager, setShowAdminManager] = useState(false);
  const [admins, setAdmins] = useState<AdminUser[]>([]);
  const [newAdminEmail, setNewAdminEmail] = useState('');
  const [loadingAdmins, setLoadingAdmins] = useState(false);
  const [adding, setAdding] = useState(false);

  const [adminUserIds, setAdminUserIds] = useState<Set<string>>(new Set());
  const [activePlansCounts, setActivePlansCounts] = useState<Record<string, number>>({});

  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showSuspendConfirm, setShowSuspendConfirm] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [actionUserId, setActionUserId] = useState<string | null>(null);

  const computeStats = useCallback((users: ProfileUser[]) => {
    onStatsUpdate({
      total: users.length,
      approved: users.filter(u => u.status === 'approved').length,
      pending: users.filter(u => u.status === 'pending').length,
      rejected: users.filter(u => u.status === 'rejected').length,
    });
  }, [onStatsUpdate]);

  const fetchPendingUsers = useCallback(async () => {
    setLoadingPending(true);
    const { data } = await supabase.from('profiles').select('*').eq('status', 'pending').order('created_at', { ascending: false });
    setPendingUsers(data || []); setLoadingPending(false);
  }, []);

  const fetchRejectedUsers = useCallback(async () => {
    setLoadingRejected(true);
    const { data } = await supabase.from('profiles').select('*').eq('status', 'rejected').order('created_at', { ascending: false });
    setRejectedUsers(data || []); setLoadingRejected(false);
  }, []);

  const fetchApprovedUsers = useCallback(async () => {
    setLoadingApproved(true);
    const { data } = await supabase.from('profiles').select('*').eq('status', 'approved').order('created_at', { ascending: false });
    setApprovedUsers(data || []); setLoadingApproved(false);
  }, []);

  const fetchAllUsers = useCallback(async () => {
    setLoadingAll(true);
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setAllUsers(data || []); if (data) computeStats(data); setLoadingAll(false);
  }, [computeStats]);

  const fetchAdminUserIds = useCallback(async () => {
    const { data } = await supabase.from('user_roles').select('user_id').eq('role', 'admin' as any);
    setAdminUserIds(new Set((data || []).map(r => r.user_id)));
  }, []);

  const fetchActivePlansCounts = useCallback(async () => {
    const { data } = await supabase.from('user_plans' as any).select('user_id').eq('status', 'active');
    const counts: Record<string, number> = {};
    (data || []).forEach((row: any) => { counts[row.user_id] = (counts[row.user_id] || 0) + 1; });
    setActivePlansCounts(counts);
  }, []);

  useEffect(() => {
    fetchPendingUsers(); fetchRejectedUsers(); fetchApprovedUsers();
    fetchAllUsers(); fetchAdminUserIds(); fetchActivePlansCounts();
  }, [fetchPendingUsers, fetchRejectedUsers, fetchApprovedUsers, fetchAllUsers, fetchAdminUserIds, fetchActivePlansCounts]);

  const approveUser = async (userId: string) => {
    setPendingUsers(prev => prev.filter(u => u.user_id !== userId));
    setRejectedUsers(prev => prev.filter(u => u.user_id !== userId));
    setAllUsers(prev => prev.map(u => u.user_id === userId ? { ...u, approved: true, status: 'approved' } : u));
    setSelectedUser(prev => prev && prev.user_id === userId ? { ...prev, approved: true, status: 'approved' } : prev);
    const { error } = await supabase.from('profiles').update({ approved: true, status: 'approved' }).eq('user_id', userId);
    if (error) { toast({ title: error.message, variant: 'destructive' }); fetchPendingUsers(); fetchRejectedUsers(); fetchApprovedUsers(); fetchAllUsers(); }
    else { toast({ title: t('userApproved') }); fetchApprovedUsers(); fetchAllUsers(); }
  };

  const rejectUser = async (userId: string) => {
    const user = allUsers.find(u => u.user_id === userId) || pendingUsers.find(u => u.user_id === userId);
    const rejectedUser = user ? { ...user, approved: false, status: 'rejected' } : null;
    setPendingUsers(prev => prev.filter(u => u.user_id !== userId));
    if (rejectedUser) setRejectedUsers(prev => [rejectedUser, ...prev]);
    setAllUsers(prev => prev.map(u => u.user_id === userId ? { ...u, approved: false, status: 'rejected' } : u));
    setSelectedUser(prev => prev && prev.user_id === userId ? { ...prev, approved: false, status: 'rejected' } : prev);
    const { error } = await supabase.from('profiles').update({ approved: false, status: 'rejected' }).eq('user_id', userId);
    if (error) { toast({ title: error.message, variant: 'destructive' }); fetchPendingUsers(); fetchRejectedUsers(); fetchApprovedUsers(); fetchAllUsers(); }
    else { toast({ title: t('userRejected') }); fetchApprovedUsers(); fetchAllUsers(); }
  };

  const confirmSuspend = (userId: string) => { setActionUserId(userId); setShowSuspendConfirm(true); };
  const executeSuspend = async () => {
    if (!actionUserId) return;
    setApprovedUsers(prev => prev.filter(u => u.user_id !== actionUserId));
    setAllUsers(prev => prev.map(u => u.user_id === actionUserId ? { ...u, approved: false, status: 'rejected' } : u));
    setSelectedUser(prev => prev && prev.user_id === actionUserId ? { ...prev, approved: false, status: 'rejected' } : prev);
    const { error } = await supabase.from('profiles').update({ approved: false, status: 'rejected' }).eq('user_id', actionUserId);
    if (error) { toast({ title: error.message, variant: 'destructive' }); fetchApprovedUsers(); fetchAllUsers(); }
    else { toast({ title: t('userSuspended') }); fetchAllUsers(); fetchRejectedUsers(); fetchApprovedUsers(); }
    setShowSuspendConfirm(false); setActionUserId(null);
  };

  const confirmDelete = (userId: string) => { setActionUserId(userId); setShowDeleteConfirm(true); };
  const executeDelete = async () => {
    if (!actionUserId) return;
    setAllUsers(prev => prev.filter(u => u.user_id !== actionUserId));
    setPendingUsers(prev => prev.filter(u => u.user_id !== actionUserId));
    setRejectedUsers(prev => prev.filter(u => u.user_id !== actionUserId));
    setApprovedUsers(prev => prev.filter(u => u.user_id !== actionUserId));
    setSelectedUser(null);
    const { error } = await supabase.from('profiles').delete().eq('user_id', actionUserId);
    if (error) { toast({ title: error.message, variant: 'destructive' }); fetchPendingUsers(); fetchRejectedUsers(); fetchAllUsers(); }
    else { toast({ title: t('userDeleted') || 'Usuario eliminado permanentemente.' }); fetchAllUsers(); }
    setShowDeleteConfirm(false); setActionUserId(null);
  };

  const resetUserPassword = async (email: string) => {
    if (!confirm(t('resetPasswordConfirm'))) return;
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/reset-user-password`, {
        method: 'POST', headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ email }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Error');
      toast({ title: t('resetPasswordSuccess') });
    } catch (err: any) {
      toast({ title: t('resetPasswordError'), description: err.message, variant: 'destructive' });
    }
  };

  const toggleAdmin = async (userId: string, isCurrentlyAdmin: boolean) => {
    const confirmMsg = isCurrentlyAdmin ? t('removeAdminConfirm') : t('makeAdminConfirm');
    if (!confirm(confirmMsg)) return;
    if (isCurrentlyAdmin) {
      const { error } = await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', 'admin' as any);
      if (error) { toast({ title: error.message, variant: 'destructive' }); }
      else { toast({ title: t('removeAdminRole') }); fetchAdminUserIds(); fetchAdmins(); }
    } else {
      const { error } = await supabase.from('user_roles').insert({ user_id: userId, role: 'admin' as any });
      if (error) { toast({ title: error.code === '23505' ? 'Ya es administrador.' : error.message, variant: 'destructive' }); }
      else { toast({ title: t('makeAdmin') }); fetchAdminUserIds(); fetchAdmins(); }
    }
  };

  const fetchAdmins = async () => {
    setLoadingAdmins(true);
    const { data: roles } = await supabase.from('user_roles').select('user_id').eq('role', 'admin' as any);
    if (roles && roles.length > 0) {
      const userIds = roles.map(r => r.user_id);
      const { data: profiles } = await supabase.from('profiles').select('user_id, display_name, email').in('user_id', userIds);
      setAdmins((profiles || []).map(p => ({ user_id: p.user_id, display_name: p.display_name, email: p.email })));
    } else { setAdmins([]); }
    setLoadingAdmins(false);
  };

  useEffect(() => { if (showAdminManager) fetchAdmins(); }, [showAdminManager]);

  const addAdmin = async () => {
    if (!newAdminEmail.trim()) return;
    setAdding(true);
    const { data: profiles } = await supabase.from('profiles').select('user_id, display_name').ilike('email', newAdminEmail.trim());
    if (!profiles || profiles.length === 0) { toast({ title: 'Usuário não encontrado.', variant: 'destructive' }); setAdding(false); return; }
    const { error } = await supabase.from('user_roles').insert({ user_id: profiles[0].user_id, role: 'admin' as any });
    if (error) { toast({ title: error.code === '23505' ? 'Ya es administrador.' : error.message, variant: 'destructive' }); }
    else { toast({ title: 'Administrador adicionado!' }); setNewAdminEmail(''); fetchAdmins(); fetchAdminUserIds(); }
    setAdding(false);
  };

  const removeAdmin = async (userId: string) => {
    const { error } = await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', 'admin' as any);
    if (error) { toast({ title: error.message, variant: 'destructive' }); }
    else { toast({ title: 'Administrador removido.' }); fetchAdmins(); fetchAdminUserIds(); }
  };

  const filteredUsers = allUsers.filter(u => {
    const matchesSearch = !userSearch ||
      (u.display_name?.toLowerCase().includes(userSearch.toLowerCase())) ||
      (u.company_name?.toLowerCase().includes(userSearch.toLowerCase())) ||
      (u.country?.toLowerCase().includes(userSearch.toLowerCase()));
    const matchesFilter = userFilter === 'all' ||
      (userFilter === 'approved' && u.status === 'approved') ||
      (userFilter === 'pending' && u.status === 'pending') ||
      (userFilter === 'rejected' && u.status === 'rejected');
    return matchesSearch && matchesFilter;
  });

  const formatDate = (d: string) => new Date(d).toLocaleDateString('es-LA', { day: '2-digit', month: 'short', year: 'numeric' });

  const getStatusBadge = (user: ProfileUser) => {
    if (user.status === 'approved') return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">{t('approved')}</Badge>;
    if (user.status === 'rejected') return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">{t('rejected')}</Badge>;
    return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">{t('pending')}</Badge>;
  };

  // Get action user name for dialogs
  const actionUserName = actionUserId
    ? (allUsers.find(u => u.user_id === actionUserId)?.display_name || allUsers.find(u => u.user_id === actionUserId)?.email || 'este usuario')
    : 'este usuario';

  // Unified user table row - standardized across ALL tabs
  const renderUserTableRow = (user: ProfileUser, showActions: 'pending' | 'approved' | 'rejected' | 'all') => {
    const isAdmin = adminUserIds.has(user.user_id);
    return (
      <tr key={user.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
        <td className="py-3">
          <div className="flex items-center gap-2">
            <p className="font-medium text-foreground">{user.display_name || 'Sin nombre'}</p>
            {user.country && <FlagImg country={user.country} size={14} />}
            {isAdmin && <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">{t('adminBadge')}</Badge>}
          </div>
          <p className="text-xs text-muted-foreground">{user.email || '—'}</p>
        </td>
        <td className="py-3 text-muted-foreground hidden md:table-cell">{user.company_name || '—'}</td>
        <td className="py-3 text-muted-foreground hidden md:table-cell">{user.phone || '—'}</td>
        <td className="py-3 text-muted-foreground hidden lg:table-cell">{user.client_count || '—'}</td>
        <td className="py-3 text-muted-foreground hidden lg:table-cell">{user.network_type || '—'}</td>
        <td className="py-3 text-muted-foreground hidden lg:table-cell">{activePlansCounts[user.user_id] || 0}</td>
        {showActions === 'all' && <td className="py-3">{getStatusBadge(user)}</td>}
        <td className="py-3 text-right">
          <div className="flex items-center justify-end gap-1">
            <Button variant="ghost" size="sm" onClick={() => setSelectedUser(user)} className="text-muted-foreground" title={t('viewDetails')}>
              <Eye className="w-4 h-4" />
            </Button>
            {showActions === 'pending' && (
              <>
                <Button variant="ghost" size="sm" onClick={() => rejectUser(user.user_id)} className="text-red-500 hover:text-red-400" title="Rechazar — El usuario no será aprobado">
                  <XCircle className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => approveUser(user.user_id)} className="text-green-500 hover:text-green-400" title="Aprobar — El usuario podrá acceder a la plataforma">
                  <CheckCircle2 className="w-4 h-4" />
                </Button>
              </>
            )}
            {showActions === 'approved' && (
              <>
                <Button variant="ghost" size="sm" onClick={() => user.email && resetUserPassword(user.email)} className="text-blue-500 hover:text-blue-400" title="Redefinir Contraseña — Envía email de recuperación">
                  <KeyRound className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => toggleAdmin(user.user_id, isAdmin)} className={isAdmin ? "text-primary hover:text-primary" : "text-muted-foreground hover:text-primary"} title={isAdmin ? "Quitar Admin — Revoca permisos administrativos" : "Hacer Admin — Otorga permisos administrativos"}>
                  <Shield className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => confirmSuspend(user.user_id)} className="text-yellow-500 hover:text-yellow-400" title="Suspender — Revoca acceso, el usuario pasa a rechazado">
                  <Ban className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => confirmDelete(user.user_id)} className="text-destructive hover:text-destructive" title="Eliminar — Borra permanentemente el perfil del usuario">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
            {showActions === 'rejected' && (
              <>
                <Button variant="ghost" size="sm" onClick={() => approveUser(user.user_id)} className="text-green-500 hover:text-green-500" title="Aprobar — Reactiva el acceso del usuario">
                  <CheckCircle2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => confirmDelete(user.user_id)} className="text-destructive hover:text-destructive" title="Eliminar — Borra permanentemente el perfil del usuario">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
            {showActions === 'all' && (
              <>
                {user.status === 'approved' ? (
                  <Button variant="ghost" size="sm" onClick={() => confirmSuspend(user.user_id)} className="text-yellow-500 hover:text-yellow-400" title="Suspender">
                    <Ban className="w-4 h-4" />
                  </Button>
                ) : (
                  <Button variant="ghost" size="sm" onClick={() => approveUser(user.user_id)} className="text-green-500 hover:text-green-500" title="Aprobar">
                    <CheckCircle2 className="w-4 h-4" />
                  </Button>
                )}
                <Button variant="ghost" size="sm" onClick={() => confirmDelete(user.user_id)} className="text-destructive hover:text-destructive" title="Eliminar permanentemente">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </td>
      </tr>
    );
  };

  // Unified table columns - same across ALL tabs
  const renderTableHeader = (showStatus: boolean) => (
    <thead>
      <tr className="border-b border-border text-left text-muted-foreground">
        <th className="pb-3 font-medium">{t('displayName')}</th>
        <th className="pb-3 font-medium hidden md:table-cell">{t('companyName')}</th>
        <th className="pb-3 font-medium hidden md:table-cell">{t('phone')}</th>
        <th className="pb-3 font-medium hidden lg:table-cell">{t('clientCount')}</th>
        <th className="pb-3 font-medium hidden lg:table-cell">{t('networkType')}</th>
        <th className="pb-3 font-medium hidden lg:table-cell">{t('activePlans')}</th>
        {showStatus && <th className="pb-3 font-medium">Status</th>}
        <th className="pb-3 font-medium text-right">{t('actions')}</th>
      </tr>
    </thead>
  );

  return (
    <div>
      {/* Stats */}
      <div className="grid grid-cols-2 lg:grid-cols-5 gap-4 mb-8">
        {[
          { label: t('totalStudents'), value: stats.total, icon: Users, color: 'text-primary' },
          { label: t('approvedUsers'), value: stats.approved, icon: UserCheck, color: 'text-green-500' },
          { label: t('pendingUsers'), value: stats.pending, icon: Clock, color: 'text-yellow-500' },
          { label: t('rejectedUsers'), value: stats.rejected, icon: UserX, color: 'text-red-500' },
          { label: t('countries'), value: [...new Set(allUsers.map(u => u.country).filter(Boolean))].length, icon: Globe, color: 'text-blue-500' },
        ].map((stat, i) => (
          <motion.div key={stat.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
            className="bg-card rounded-xl p-5 border border-border">
            <stat.icon className={`w-5 h-5 ${stat.color} mb-2`} />
            <p className="text-2xl font-display font-bold text-foreground">{stat.value}</p>
            <p className="text-sm text-muted-foreground">{stat.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="flex justify-end gap-2 mb-4">
        <Button variant="secondary" size="sm" className="gap-2" onClick={() => setShowImportDialog(true)}>
          <Upload className="w-4 h-4" /> {t('importUsers')}
        </Button>
        <Button variant="secondary" size="sm" className="gap-2" onClick={() => setShowAdminManager(true)}>
          <Shield className="w-4 h-4" /> {t('manageAdmins')}
        </Button>
      </div>

      <Tabs value={activeTab} onValueChange={setActiveTab}>
        <TabsList className="mb-6">
          <TabsTrigger value="pending" className="gap-2">
            <Clock className="w-4 h-4" /> {t('pendingUsers')}
            {stats.pending > 0 && <Badge variant="destructive" className="ml-1 text-xs h-5 min-w-[20px] px-1.5">{stats.pending}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="approved" className="gap-2">
            <UserCheck className="w-4 h-4" /> {t('approvedUsers')}
          </TabsTrigger>
          <TabsTrigger value="rejected" className="gap-2">
            <UserX className="w-4 h-4" /> {t('rejectedUsers')}
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-2">
            <Users className="w-4 h-4" /> {t('allUsers')}
          </TabsTrigger>
        </TabsList>

        {/* Pending Tab - NOW using table format like approved */}
        <TabsContent value="pending">
          {loadingPending ? (
            <div className="text-center py-12 text-muted-foreground">{t('loading')}...</div>
          ) : pendingUsers.length === 0 ? (
            <div className="text-center py-16">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-display font-semibold text-foreground">{t('noPendingUsers')}</p>
              <p className="text-sm text-muted-foreground">{t('noPendingUsersDesc')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                {renderTableHeader(false)}
                <tbody>
                  {pendingUsers.map(user => renderUserTableRow(user, 'pending'))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* Approved Tab */}
        <TabsContent value="approved">
          {loadingApproved ? (
            <div className="text-center py-12 text-muted-foreground">{t('loading')}...</div>
          ) : approvedUsers.length === 0 ? (
            <div className="text-center py-16">
              <UserCheck className="w-12 h-12 text-muted-foreground mx-auto mb-4" />
              <p className="text-lg font-display font-semibold text-foreground">{t('noApprovedUsers')}</p>
              <p className="text-sm text-muted-foreground">{t('noApprovedUsersDesc')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                {renderTableHeader(false)}
                <tbody>
                  {approvedUsers.map(user => renderUserTableRow(user, 'approved'))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* Rejected Tab */}
        <TabsContent value="rejected">
          {loadingRejected ? (
            <div className="text-center py-12 text-muted-foreground">{t('loading')}...</div>
          ) : rejectedUsers.length === 0 ? (
            <div className="text-center py-16">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto mb-4" />
              <p className="text-lg font-display font-semibold text-foreground">{t('noRejectedUsers')}</p>
              <p className="text-sm text-muted-foreground">{t('noRejectedUsersDesc')}</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                {renderTableHeader(false)}
                <tbody>
                  {rejectedUsers.map(user => renderUserTableRow(user, 'rejected'))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* All Users Tab */}
        <TabsContent value="all">
          <div className="flex flex-col sm:flex-row gap-3 mb-6">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input placeholder={t('searchUsers')} value={userSearch} onChange={(e) => setUserSearch(e.target.value)} className="pl-10 bg-secondary border-border" />
            </div>
            <select value={userFilter} onChange={(e) => setUserFilter(e.target.value as any)}
              className="bg-secondary text-foreground border border-border rounded-md px-3 py-2 text-sm">
              <option value="all">{t('allFilter')}</option>
              <option value="approved">{t('approvedFilter')}</option>
              <option value="pending">{t('pendingFilter')}</option>
              <option value="rejected">{t('rejectedFilter')}</option>
            </select>
          </div>

          {loadingAll ? (
            <div className="text-center py-12 text-muted-foreground">{t('loading')}...</div>
          ) : filteredUsers.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">{t('noUsersFound')}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                {renderTableHeader(true)}
                <tbody>
                  {filteredUsers.map(user => renderUserTableRow(user, 'all'))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Delete User Confirmation */}
      <AlertDialog open={showDeleteConfirm} onOpenChange={setShowDeleteConfirm}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Eliminar permanentemente a "{actionUserName}"?</AlertDialogTitle>
            <AlertDialogDescription>
              Se eliminará el perfil, sus datos y todo su historial de la plataforma. Esta acción no se puede deshacer.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={executeDelete} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              <Trash2 className="w-4 h-4 mr-2" /> Eliminar Permanentemente
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Suspend User Confirmation */}
      <AlertDialog open={showSuspendConfirm} onOpenChange={setShowSuspendConfirm}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Suspender a "{actionUserName}"?</AlertDialogTitle>
            <AlertDialogDescription>
              El usuario perderá acceso a la plataforma y pasará a estado "rechazado". Sus datos no se eliminarán y puede ser reaprobado más adelante.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={executeSuspend} className="bg-yellow-600 text-white hover:bg-yellow-700">
              <Ban className="w-4 h-4 mr-2" /> Suspender Usuario
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* User Detail Dialog */}
      <Dialog open={!!selectedUser} onOpenChange={() => setSelectedUser(null)}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display">{selectedUser?.display_name || 'Usuario'}</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-3 text-sm">
                <div className="col-span-2"><span className="text-muted-foreground">Email</span><p className="font-medium text-foreground">{selectedUser.email || '—'}</p></div>
                <div><span className="text-muted-foreground">{t('roleType')}</span><p className="font-medium text-foreground">{selectedUser.role_type === 'owner' ? t('ispOwner') : t('ispEmployee')}</p></div>
                <div><span className="text-muted-foreground">{t('country')}</span><p className="font-medium text-foreground flex items-center gap-1.5">{selectedUser.country ? <><FlagImg country={selectedUser.country} size={18} /> {selectedUser.country}</> : '—'}</p></div>
                <div><span className="text-muted-foreground">{t('companyName')}</span><p className="font-medium text-foreground">{selectedUser.company_name || '—'}</p></div>
                <div><span className="text-muted-foreground">{t('phone')}</span><p className="font-medium text-foreground">{selectedUser.phone || '—'}</p></div>
                <div><span className="text-muted-foreground">{t('clientCount')}</span><p className="font-medium text-foreground">{selectedUser.client_count || '—'}</p></div>
                <div><span className="text-muted-foreground">{t('networkType')}</span><p className="font-medium text-foreground">{selectedUser.network_type || '—'}</p></div>
                {selectedUser.cheapest_plan_usd && (
                  <div><span className="text-muted-foreground">{t('cheapestPlan')}</span><p className="font-medium text-foreground">U$ {selectedUser.cheapest_plan_usd}</p></div>
                )}
                <div><span className="text-muted-foreground">Status</span><p className="font-medium">{getStatusBadge(selectedUser)}</p></div>
              </div>
              {selectedUser.main_problems && (
                <div><p className="text-sm text-muted-foreground mb-1">{t('mainProblems')}</p><p className="text-sm text-foreground bg-secondary/50 rounded-lg p-3 border border-border">{selectedUser.main_problems}</p></div>
              )}
              {selectedUser.main_desires && (
                <div><p className="text-sm text-muted-foreground mb-1">{t('mainDesires')}</p><p className="text-sm text-foreground bg-secondary/50 rounded-lg p-3 border border-border">{selectedUser.main_desires}</p></div>
              )}
              {/* Packages & Products Manager */}
              <div className="border-t border-border pt-4">
                <UserPackagesManager userId={selectedUser.user_id} onUpdate={() => fetchActivePlansCounts()} />
              </div>

              {selectedUser.status !== 'approved' ? (
                <div className="flex flex-col gap-2 pt-2">
                  <div className="flex gap-2">
                    {selectedUser.status !== 'rejected' && (
                      <Button variant="destructive" className="flex-1 gap-2" onClick={() => rejectUser(selectedUser.user_id)}>
                        <XCircle className="w-4 h-4" /> {t('rejectUser')}
                      </Button>
                    )}
                    <Button className="flex-1 gap-2 bg-green-600 hover:bg-green-700 text-white" onClick={() => approveUser(selectedUser.user_id)}>
                      <CheckCircle2 className="w-4 h-4" /> {t('approveUser')}
                    </Button>
                  </div>
                  <Button variant="ghost" className="gap-2 text-destructive hover:text-destructive w-full" onClick={() => confirmDelete(selectedUser.user_id)}>
                    <Trash2 className="w-4 h-4" /> Eliminar Permanentemente
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2 pt-2">
                  <Button variant="outline" className="flex-1 gap-2 text-yellow-500 border-yellow-500/30 hover:bg-yellow-500/10" onClick={() => confirmSuspend(selectedUser.user_id)}>
                    <Ban className="w-4 h-4" /> Suspender
                  </Button>
                  <Button variant="ghost" className="gap-2 text-destructive hover:text-destructive" onClick={() => confirmDelete(selectedUser.user_id)}>
                    <Trash2 className="w-4 h-4" /> Eliminar
                  </Button>
                </div>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Admin Manager Dialog */}
      <Dialog open={showAdminManager} onOpenChange={setShowAdminManager}>
        <DialogContent className="bg-card border-border max-w-lg">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Shield className="w-5 h-5 text-primary" /> {t('manageAdmins')}
            </DialogTitle>
          </DialogHeader>
          <div className="flex gap-2 mb-4">
            <Input placeholder={t('adminEmailPlaceholder')} value={newAdminEmail} onChange={e => setNewAdminEmail(e.target.value)} className="bg-secondary border-border flex-1" />
            <Button onClick={addAdmin} disabled={adding} className="gap-1"><Plus className="w-4 h-4" /> {t('add')}</Button>
          </div>
          {loadingAdmins ? (
            <p className="text-center text-muted-foreground py-4">{t('loading')}...</p>
          ) : admins.length === 0 ? (
            <p className="text-center text-muted-foreground py-4">{t('noAdmins')}</p>
          ) : (
            <div className="space-y-2">
              {admins.map(admin => (
                <div key={admin.user_id} className="flex items-center gap-3 p-3 rounded-lg bg-secondary/50 border border-border">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-foreground truncate">{admin.display_name || admin.email}</p>
                    <p className="text-xs text-muted-foreground">{admin.email}</p>
                  </div>
                  <Button variant="ghost" size="sm" onClick={() => removeAdmin(admin.user_id)} className="text-destructive hover:text-destructive">
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              ))}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Import Users Dialog */}
      <ImportUsersDialog
        open={showImportDialog}
        onOpenChange={setShowImportDialog}
        onImportComplete={() => { fetchAllUsers(); fetchPendingUsers(); fetchApprovedUsers(); fetchRejectedUsers(); }}
      />
    </div>
  );
};

export default AdminUsers;
