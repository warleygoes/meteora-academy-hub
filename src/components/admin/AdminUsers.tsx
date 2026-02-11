import React, { useState, useEffect, useCallback } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Trash2, CheckCircle2, XCircle, Search, Eye, Ban, UserCheck,
  Clock, Globe, Building2, Phone, Wifi, Shield, Plus, UserX
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

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
    <img
      src={`https://flagcdn.com/w40/${code}.png`}
      srcSet={`https://flagcdn.com/w80/${code}.png 2x`}
      width={size}
      height={Math.round(size * 0.75)}
      alt={country}
      className="inline-block rounded-sm object-cover"
      style={{ width: size, height: Math.round(size * 0.75) }}
    />
  );
};

interface ProfileUser {
  id: string;
  user_id: string;
  email: string | null;
  display_name: string | null;
  company_name: string | null;
  country: string | null;
  phone: string | null;
  role_type: string | null;
  client_count: string | null;
  network_type: string | null;
  cheapest_plan_usd: number | null;
  main_problems: string | null;
  main_desires: string | null;
  approved: boolean;
  status: string;
  created_at: string;
}

interface AdminUser {
  user_id: string;
  display_name: string | null;
}

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
  const [loadingPending, setLoadingPending] = useState(true);
  const [loadingRejected, setLoadingRejected] = useState(true);
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
    setPendingUsers(data || []);
    setLoadingPending(false);
  }, []);

  const fetchRejectedUsers = useCallback(async () => {
    setLoadingRejected(true);
    const { data } = await supabase.from('profiles').select('*').eq('status', 'rejected').order('created_at', { ascending: false });
    setRejectedUsers(data || []);
    setLoadingRejected(false);
  }, []);

  const fetchAllUsers = useCallback(async () => {
    setLoadingAll(true);
    const { data } = await supabase.from('profiles').select('*').order('created_at', { ascending: false });
    setAllUsers(data || []);
    if (data) computeStats(data);
    setLoadingAll(false);
  }, [computeStats]);

  useEffect(() => {
    fetchPendingUsers();
    fetchRejectedUsers();
    fetchAllUsers();
  }, [fetchPendingUsers, fetchRejectedUsers, fetchAllUsers]);

  const approveUser = async (userId: string) => {
    setPendingUsers(prev => prev.filter(u => u.user_id !== userId));
    setRejectedUsers(prev => prev.filter(u => u.user_id !== userId));
    setAllUsers(prev => prev.map(u => u.user_id === userId ? { ...u, approved: true, status: 'approved' } : u));
    setSelectedUser(prev => prev && prev.user_id === userId ? { ...prev, approved: true, status: 'approved' } : prev);

    const { error } = await supabase.from('profiles').update({ approved: true, status: 'approved' }).eq('user_id', userId);
    if (error) {
      toast({ title: error.message, variant: 'destructive' });
      fetchPendingUsers(); fetchRejectedUsers(); fetchAllUsers();
    } else {
      toast({ title: t('userApproved') });
      fetchAllUsers();
    }
  };

  const rejectUser = async (userId: string) => {
    const user = allUsers.find(u => u.user_id === userId) || pendingUsers.find(u => u.user_id === userId);
    const rejectedUser = user ? { ...user, approved: false, status: 'rejected' } : null;
    
    setPendingUsers(prev => prev.filter(u => u.user_id !== userId));
    if (rejectedUser) setRejectedUsers(prev => [rejectedUser, ...prev]);
    setAllUsers(prev => prev.map(u => u.user_id === userId ? { ...u, approved: false, status: 'rejected' } : u));
    setSelectedUser(prev => prev && prev.user_id === userId ? { ...prev, approved: false, status: 'rejected' } : prev);

    const { error } = await supabase.from('profiles').update({ approved: false, status: 'rejected' }).eq('user_id', userId);
    if (error) {
      toast({ title: error.message, variant: 'destructive' });
      fetchPendingUsers(); fetchRejectedUsers(); fetchAllUsers();
    } else {
      toast({ title: t('userRejected') });
      fetchAllUsers();
    }
  };

  const suspendUser = async (userId: string) => {
    setAllUsers(prev => prev.map(u => u.user_id === userId ? { ...u, approved: false, status: 'rejected' } : u));
    setSelectedUser(prev => prev && prev.user_id === userId ? { ...prev, approved: false, status: 'rejected' } : prev);

    const { error } = await supabase.from('profiles').update({ approved: false, status: 'rejected' }).eq('user_id', userId);
    if (error) {
      toast({ title: error.message, variant: 'destructive' });
      fetchAllUsers();
    } else {
      toast({ title: t('userSuspended') });
      fetchAllUsers(); fetchRejectedUsers();
    }
  };

  const deleteUser = async (userId: string) => {
    setAllUsers(prev => prev.filter(u => u.user_id !== userId));
    setPendingUsers(prev => prev.filter(u => u.user_id !== userId));
    setRejectedUsers(prev => prev.filter(u => u.user_id !== userId));
    setSelectedUser(null);

    const { error } = await supabase.from('profiles').delete().eq('user_id', userId);
    if (error) {
      toast({ title: error.message, variant: 'destructive' });
      fetchPendingUsers(); fetchRejectedUsers(); fetchAllUsers();
    } else {
      toast({ title: t('userDeleted') || 'Usuario eliminado permanentemente.' });
      fetchAllUsers();
    }
  };

  const fetchAdmins = async () => {
    setLoadingAdmins(true);
    const { data: roles } = await supabase.from('user_roles').select('user_id').eq('role', 'admin');
    if (roles && roles.length > 0) {
      const userIds = roles.map(r => r.user_id);
      const { data: profiles } = await supabase.from('profiles').select('user_id, display_name').in('user_id', userIds);
      setAdmins((profiles || []).map(p => ({ user_id: p.user_id, display_name: p.display_name })));
    } else { setAdmins([]); }
    setLoadingAdmins(false);
  };

  useEffect(() => { if (showAdminManager) fetchAdmins(); }, [showAdminManager]);

  const addAdmin = async () => {
    if (!newAdminEmail.trim()) return;
    setAdding(true);
    const { data: profiles } = await supabase.from('profiles').select('user_id, display_name').ilike('display_name', newAdminEmail.trim());
    if (!profiles || profiles.length === 0) { toast({ title: 'Usuário não encontrado.', variant: 'destructive' }); setAdding(false); return; }
    const { error } = await supabase.from('user_roles').insert({ user_id: profiles[0].user_id, role: 'admin' as any });
    if (error) { toast({ title: error.code === '23505' ? 'Ya es administrador.' : error.message, variant: 'destructive' }); }
    else { toast({ title: 'Administrador adicionado!' }); setNewAdminEmail(''); fetchAdmins(); }
    setAdding(false);
  };

  const removeAdmin = async (userId: string) => {
    const { error } = await supabase.from('user_roles').delete().eq('user_id', userId).eq('role', 'admin' as any);
    if (error) { toast({ title: error.message, variant: 'destructive' }); }
    else { toast({ title: 'Administrador removido.' }); fetchAdmins(); }
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

      <div className="flex justify-end mb-4">
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
          <TabsTrigger value="rejected" className="gap-2">
            <UserX className="w-4 h-4" /> {t('rejectedUsers')}
            {stats.rejected > 0 && <Badge variant="secondary" className="ml-1 text-xs h-5 min-w-[20px] px-1.5">{stats.rejected}</Badge>}
          </TabsTrigger>
          <TabsTrigger value="all" className="gap-2">
            <Users className="w-4 h-4" /> {t('allUsers')}
          </TabsTrigger>
        </TabsList>

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
            <div className="space-y-3">
              {pendingUsers.map((user) => (
                <motion.div key={user.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="bg-card rounded-xl border border-border p-5 flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-display font-semibold text-foreground truncate">{user.display_name || 'Sin nombre'}</p>
                      <Badge variant="outline" className="text-xs shrink-0">
                        {user.role_type === 'owner' ? t('ispOwner') : t('ispEmployee')}
                      </Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {user.company_name && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{user.company_name}</span>}
                      {user.country && <span className="flex items-center gap-1"><FlagImg country={user.country} size={14} />{user.country}</span>}
                      {user.phone && <span className="flex items-center gap-1"><Phone className="w-3 h-3" />{user.phone}</span>}
                      {user.client_count && <span className="flex items-center gap-1"><Users className="w-3 h-3" />{user.client_count} clientes</span>}
                      {user.network_type && <span className="flex items-center gap-1"><Wifi className="w-3 h-3" />{user.network_type}</span>}
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(user.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedUser(user)} className="gap-1 text-muted-foreground">
                      <Eye className="w-4 h-4" /> {t('viewDetails')}
                    </Button>
                    <Button variant="destructive" size="sm" onClick={() => rejectUser(user.user_id)} className="gap-1">
                      <XCircle className="w-4 h-4" /> {t('rejectUser')}
                    </Button>
                    <Button size="sm" onClick={() => approveUser(user.user_id)} className="gap-1 bg-green-600 hover:bg-green-700 text-white">
                      <CheckCircle2 className="w-4 h-4" /> {t('approveUser')}
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

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
            <div className="space-y-3">
              {rejectedUsers.map((user) => (
                <motion.div key={user.id} initial={{ opacity: 0 }} animate={{ opacity: 1 }}
                  className="bg-card rounded-xl border border-border p-5 flex flex-col md:flex-row md:items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <p className="font-display font-semibold text-foreground truncate">{user.display_name || 'Sin nombre'}</p>
                      <Badge className="bg-red-500/10 text-red-500 border-red-500/20 text-xs shrink-0">{t('rejected')}</Badge>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-muted-foreground">
                      {user.company_name && <span className="flex items-center gap-1"><Building2 className="w-3 h-3" />{user.company_name}</span>}
                      {user.country && <span className="flex items-center gap-1"><FlagImg country={user.country} size={14} />{user.country}</span>}
                      {user.email && <span>{user.email}</span>}
                      <span className="flex items-center gap-1"><Clock className="w-3 h-3" />{formatDate(user.created_at)}</span>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 shrink-0">
                    <Button variant="ghost" size="sm" onClick={() => setSelectedUser(user)} className="gap-1 text-muted-foreground">
                      <Eye className="w-4 h-4" />
                    </Button>
                    <Button size="sm" onClick={() => approveUser(user.user_id)} className="gap-1 bg-green-600 hover:bg-green-700 text-white">
                      <CheckCircle2 className="w-4 h-4" /> {t('approveUser')}
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => { if (confirm('¿Eliminar permanentemente?')) deleteUser(user.user_id); }} className="text-destructive hover:text-destructive">
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </TabsContent>

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
                <thead>
                  <tr className="border-b border-border text-left text-muted-foreground">
                    <th className="pb-3 font-medium">{t('displayName')}</th>
                    <th className="pb-3 font-medium hidden md:table-cell">{t('companyName')}</th>
                    <th className="pb-3 font-medium hidden lg:table-cell">{t('country')}</th>
                    <th className="pb-3 font-medium hidden lg:table-cell">{t('clientCount')}</th>
                    <th className="pb-3 font-medium">Status</th>
                    <th className="pb-3 font-medium text-right">{t('actions')}</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredUsers.map((user) => (
                    <tr key={user.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
                      <td className="py-3">
                        <p className="font-medium text-foreground">{user.display_name || 'Sin nombre'}</p>
                        <p className="text-xs text-muted-foreground">{user.role_type === 'owner' ? t('ispOwner') : t('ispEmployee')}</p>
                      </td>
                      <td className="py-3 hidden md:table-cell text-muted-foreground">{user.company_name || '—'}</td>
                      <td className="py-3 hidden lg:table-cell text-muted-foreground">{user.country || '—'}</td>
                      <td className="py-3 hidden lg:table-cell text-muted-foreground">{user.client_count || '—'}</td>
                      <td className="py-3">{getStatusBadge(user)}</td>
                      <td className="py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <Button variant="ghost" size="sm" onClick={() => setSelectedUser(user)}><Eye className="w-4 h-4" /></Button>
                          {user.status === 'approved' ? (
                            <Button variant="ghost" size="sm" onClick={() => suspendUser(user.user_id)} className="text-destructive hover:text-destructive"><Ban className="w-4 h-4" /></Button>
                          ) : (
                            <Button variant="ghost" size="sm" onClick={() => approveUser(user.user_id)} className="text-green-500 hover:text-green-500"><CheckCircle2 className="w-4 h-4" /></Button>
                          )}
                          <Button variant="ghost" size="sm" onClick={() => { if (confirm('¿Eliminar este usuario permanentemente?')) deleteUser(user.user_id); }} className="text-destructive hover:text-destructive"><Trash2 className="w-4 h-4" /></Button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>
      </Tabs>

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
                  <Button variant="ghost" className="gap-2 text-destructive hover:text-destructive w-full" onClick={() => { if (confirm('¿Eliminar este usuario permanentemente?')) deleteUser(selectedUser.user_id); }}>
                    <Trash2 className="w-4 h-4" /> {t('deleteUser') || 'Eliminar permanentemente'}
                  </Button>
                </div>
              ) : (
                <div className="flex gap-2 pt-2">
                  <Button variant="destructive" className="flex-1 gap-2" onClick={() => suspendUser(selectedUser.user_id)}>
                    <Ban className="w-4 h-4" /> {t('suspendUser')}
                  </Button>
                  <Button variant="ghost" className="gap-2 text-destructive hover:text-destructive" onClick={() => { if (confirm('¿Eliminar este usuario permanentemente?')) deleteUser(selectedUser.user_id); }}>
                    <Trash2 className="w-4 h-4" /> {t('deleteUser') || 'Eliminar'}
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
          <div className="flex gap-2 mt-2">
            <Input placeholder={t('adminNamePlaceholder')} value={newAdminEmail} onChange={(e) => setNewAdminEmail(e.target.value)} className="bg-secondary border-border" />
            <Button onClick={addAdmin} disabled={adding} size="sm" className="gap-1 shrink-0">
              <Plus className="w-4 h-4" /> {t('add')}
            </Button>
          </div>
          <div className="mt-4 space-y-2 max-h-64 overflow-y-auto">
            {loadingAdmins ? (
              <p className="text-sm text-muted-foreground text-center py-4">{t('loading')}...</p>
            ) : admins.length === 0 ? (
              <p className="text-sm text-muted-foreground text-center py-4">{t('noAdmins')}</p>
            ) : (
              admins.map((admin) => (
                <div key={admin.user_id} className="flex items-center justify-between p-3 rounded-lg bg-secondary/50 border border-border">
                  <p className="text-sm font-medium text-foreground">{admin.display_name || 'Sin nombre'}</p>
                  <Button variant="ghost" size="sm" onClick={() => removeAdmin(admin.user_id)} className="text-destructive hover:text-destructive hover:bg-destructive/10">
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

export default AdminUsers;
