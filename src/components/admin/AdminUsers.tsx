import React, { useState, useEffect, useCallback, useRef } from 'react';
import { motion } from 'framer-motion';
import {
  Users, Trash2, CheckCircle2, XCircle, Search, Eye, Ban, UserCheck,
  Clock, Globe, Building2, Phone, Wifi, Shield, Plus, UserX, KeyRound, Package, Upload, ScrollText, ClipboardList, Link2,
  ArrowUpDown, ArrowUp, ArrowDown, Columns3, GripVertical
} from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { supabase } from '@/integrations/supabase/client';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useToast } from '@/hooks/use-toast';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { ScrollArea } from '@/components/ui/scroll-area';
import { AlertDialog, AlertDialogAction, AlertDialogCancel, AlertDialogContent, AlertDialogDescription, AlertDialogFooter, AlertDialogHeader, AlertDialogTitle } from '@/components/ui/alert-dialog';
import { Popover, PopoverContent, PopoverTrigger } from '@/components/ui/popover';
import { Checkbox } from '@/components/ui/checkbox';
import UserPackagesManager from './UserPackagesManager';
import UserDetailContent from './UserDetailContent';
import ImportUsersDialog from './ImportUsersDialog';
import { logSystemEvent } from '@/lib/systemLog';

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

// Isolated component to prevent parent re-renders on every keystroke
const CreateUserForm: React.FC<{
  newUser: { name: string; email: string; password: string; phone: string };
  setNewUser: React.Dispatch<React.SetStateAction<{ name: string; email: string; password: string; phone: string }>>;
  createUser: () => void;
  creatingUser: boolean;
  t: (key: string) => string;
}> = React.memo(({ newUser, setNewUser, createUser, creatingUser, t }) => {
  const [localName, setLocalName] = useState(newUser.name);
  const [localEmail, setLocalEmail] = useState(newUser.email);
  const [localPassword, setLocalPassword] = useState(newUser.password);
  const [localPhone, setLocalPhone] = useState(newUser.phone);

  // Sync back to parent only on blur or submit
  const syncToParent = useCallback(() => {
    setNewUser({ name: localName, email: localEmail, password: localPassword, phone: localPhone });
  }, [localName, localEmail, localPassword, localPhone, setNewUser]);

  const handleSubmit = () => {
    setNewUser({ name: localName, email: localEmail, password: localPassword, phone: localPhone });
    setTimeout(createUser, 0);
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">{t('displayName')} *</label>
        <Input value={localName} onChange={e => setLocalName(e.target.value)} onBlur={syncToParent} placeholder={t('displayName')} className="bg-secondary border-border" autoComplete="off" />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">{t('email')} *</label>
        <Input type="email" value={localEmail} onChange={e => setLocalEmail(e.target.value)} onBlur={syncToParent} placeholder="usuario@email.com" className="bg-secondary border-border" autoComplete="off" />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">{t('password')} *</label>
        <Input type="password" value={localPassword} onChange={e => setLocalPassword(e.target.value)} onBlur={syncToParent} placeholder={t('passwordMinChars')} className="bg-secondary border-border" autoComplete="new-password" />
      </div>
      <div>
        <label className="text-sm font-medium text-foreground mb-1 block">{t('phone')}</label>
        <Input value={localPhone} onChange={e => setLocalPhone(e.target.value)} onBlur={syncToParent} placeholder="+55 11 99999-9999" className="bg-secondary border-border" autoComplete="off" />
      </div>
      <Button onClick={handleSubmit} disabled={creatingUser} className="w-full gap-2">
        {creatingUser ? <Clock className="w-4 h-4 animate-spin" /> : <Plus className="w-4 h-4" />}
        {creatingUser ? (t('creating') || 'Creando...') : (t('createUser') || 'Crear Usuario')}
      </Button>
    </div>
  );
});

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
  const [showApproveAllConfirm, setShowApproveAllConfirm] = useState(false);
  const [showImportDialog, setShowImportDialog] = useState(false);
  const [showCreateUser, setShowCreateUser] = useState(false);
  const [newUser, setNewUser] = useState({ name: '', email: '', password: '', phone: '' });
  const [creatingUser, setCreatingUser] = useState(false);
  const [actionUserId, setActionUserId] = useState<string | null>(null);
  const [globalSearch, setGlobalSearch] = useState('');

  // Flexible column configuration
  type SortDir = 'asc' | 'desc' | null;
  const [sortColumn, setSortColumn] = useState<string | null>(null);
  const [sortDir, setSortDir] = useState<SortDir>(null);
  const [columnVisibility, setColumnVisibility] = useState<Record<string, boolean>>({
    name: true, company: true, country: true, phone: true, clients: true, network: true, plans: true, created: true,
  });
  const [columnWidths, setColumnWidths] = useState<Record<string, number>>({});
  const resizingRef = useRef<{ col: string; startX: number; startW: number } | null>(null);

  const columnDefs = [
    { id: 'name', label: t('displayName'), minWidth: 140 },
    { id: 'company', label: t('companyName'), minWidth: 100 },
    { id: 'country', label: t('country'), minWidth: 80 },
    { id: 'phone', label: t('phone'), minWidth: 100 },
    { id: 'clients', label: t('clientCount'), minWidth: 80 },
    { id: 'network', label: t('networkType'), minWidth: 80 },
    { id: 'plans', label: t('activePlans'), minWidth: 60 },
    { id: 'created', label: t('createdAt') || 'Fecha de Registro', minWidth: 130 },
  ];

  const getColumnValue = (user: ProfileUser, colId: string): string | number => {
    switch (colId) {
      case 'name': return user.display_name || '';
      case 'company': return user.company_name || '';
      case 'country': return user.country || '';
      case 'phone': return user.phone || '';
      case 'clients': return user.client_count || '';
      case 'network': return user.network_type || '';
      case 'plans': return activePlansCounts[user.user_id] || 0;
      case 'created': return user.created_at || '';
      default: return '';
    }
  };

  const handleSort = (colId: string) => {
    if (sortColumn === colId) {
      if (sortDir === 'asc') setSortDir('desc');
      else if (sortDir === 'desc') { setSortColumn(null); setSortDir(null); }
    } else {
      setSortColumn(colId); setSortDir('asc');
    }
  };

  const sortUsers = (users: ProfileUser[]) => {
    if (!sortColumn || !sortDir) return users;
    return [...users].sort((a, b) => {
      const va = getColumnValue(a, sortColumn);
      const vb = getColumnValue(b, sortColumn);
      const cmp = typeof va === 'number' && typeof vb === 'number'
        ? va - vb
        : String(va).localeCompare(String(vb), undefined, { sensitivity: 'base' });
      return sortDir === 'asc' ? cmp : -cmp;
    });
  };

  const handleResizeStart = (colId: string, e: React.MouseEvent) => {
    e.preventDefault();
    const startX = e.clientX;
    const startW = columnWidths[colId] || columnDefs.find(c => c.id === colId)?.minWidth || 120;
    resizingRef.current = { col: colId, startX, startW };
    const onMove = (ev: MouseEvent) => {
      if (!resizingRef.current) return;
      const diff = ev.clientX - resizingRef.current.startX;
      const minW = columnDefs.find(c => c.id === colId)?.minWidth || 60;
      setColumnWidths(prev => ({ ...prev, [colId]: Math.max(minW, resizingRef.current!.startW + diff) }));
    };
    const onUp = () => { resizingRef.current = null; window.removeEventListener('mousemove', onMove); window.removeEventListener('mouseup', onUp); };
    window.addEventListener('mousemove', onMove);
    window.addEventListener('mouseup', onUp);
  };

  const toggleColumn = (colId: string) => {
    setColumnVisibility(prev => ({ ...prev, [colId]: !prev[colId] }));
  };

  const visibleColumns = columnDefs.filter(c => columnVisibility[c.id]);

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
    else { logSystemEvent({ action: 'Usuario aprobado', entity_type: 'user', entity_id: userId, level: 'success', webhookEvent: 'user.approved', webhookData: { user_id: userId } }); toast({ title: t('userApproved') }); fetchApprovedUsers(); fetchAllUsers(); }
  };

  
  const approveAllPending = async () => {
    const userIds = pendingUsers.map(u => u.user_id);
    if (userIds.length === 0) return;
    setPendingUsers([]);
    setAllUsers(prev => prev.map(u => userIds.includes(u.user_id) ? { ...u, approved: true, status: 'approved' } : u));
    const { error } = await supabase.from('profiles').update({ approved: true, status: 'approved' }).in('user_id', userIds);
    if (error) { toast({ title: error.message, variant: 'destructive' }); fetchPendingUsers(); fetchApprovedUsers(); fetchAllUsers(); }
    else { toast({ title: `${userIds.length} usuarios aprobados` }); fetchApprovedUsers(); fetchAllUsers(); }
    setShowApproveAllConfirm(false);
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
    else { logSystemEvent({ action: 'Usuario rechazado', entity_type: 'user', entity_id: userId, level: 'warning', webhookEvent: 'user.rejected', webhookData: { user_id: userId } }); toast({ title: t('userRejected') }); fetchApprovedUsers(); fetchAllUsers(); }
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
    
    // Delete user completely via edge function (profile + auth + related data)
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/import-users`, {
        method: 'DELETE',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ user_id: actionUserId }),
      });
      const result = await res.json();
      if (!res.ok || result.error) {
        toast({ title: result.error || 'Error al eliminar usuario', variant: 'destructive' });
        fetchPendingUsers(); fetchRejectedUsers(); fetchAllUsers();
      } else {
        logSystemEvent({ action: 'Usuario eliminado', entity_type: 'user', entity_id: actionUserId, level: 'warning', webhookEvent: 'user.deleted', webhookData: { user_id: actionUserId } });
        toast({ title: t('userDeleted') || 'Usuario eliminado permanentemente.' });
        fetchAllUsers();
      }
    } catch (err) {
      toast({ title: 'Error al eliminar usuario', variant: 'destructive' });
      fetchPendingUsers(); fetchRejectedUsers(); fetchAllUsers();
    }
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

  const createUser = async () => {
    if (!newUser.name.trim() || !newUser.email.trim() || !newUser.password.trim()) {
      toast({ title: t('fillRequiredFields') || 'Preencha todos os campos obrigatórios.', variant: 'destructive' });
      return;
    }
    if (newUser.password.length < 6) {
      toast({ title: t('passwordMin6') || 'La contraseña debe tener al menos 6 caracteres.', variant: 'destructive' });
      return;
    }
    setCreatingUser(true);
    try {
      const { data: { session } } = await supabase.auth.getSession();
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/import-users`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${session?.access_token}` },
        body: JSON.stringify({ users: [{ name: newUser.name, email: newUser.email, phone: newUser.phone || undefined }], defaultPassword: newUser.password }),
      });
      const result = await res.json();
      if (!res.ok) throw new Error(result.error || 'Error');
      if (result.created > 0) {
        toast({ title: t('userCreatedSuccess') || 'Usuario creado exitosamente.' });
        logSystemEvent({ action: 'Usuario creado manualmente', entity_type: 'user', details: newUser.email, level: 'success', webhookEvent: 'user.registered', webhookData: { email: newUser.email, name: newUser.name } });
      } else if (result.exists > 0) {
        toast({ title: t('userAlreadyExists') || 'Este email ya está registrado.', variant: 'destructive' });
      } else {
        toast({ title: result.results?.[0]?.message || 'Error', variant: 'destructive' });
      }
      setNewUser({ name: '', email: '', password: '', phone: '' });
      setShowCreateUser(false);
      fetchAllUsers(); fetchPendingUsers(); fetchApprovedUsers(); fetchRejectedUsers();
    } catch (err: any) {
      toast({ title: err.message, variant: 'destructive' });
    }
    setCreatingUser(false);
  };


  // Global search filter function - searches across all fields
  const matchesGlobalSearch = (u: ProfileUser) => {
    if (!globalSearch) return true;
    const s = globalSearch.toLowerCase();
    return (
      (u.display_name?.toLowerCase().includes(s)) ||
      (u.email?.toLowerCase().includes(s)) ||
      (u.company_name?.toLowerCase().includes(s)) ||
      (u.country?.toLowerCase().includes(s)) ||
      (u.phone?.toLowerCase().includes(s)) ||
      (u.client_count?.toLowerCase().includes(s)) ||
      (u.network_type?.toLowerCase().includes(s)) ||
      (u.role_type?.toLowerCase().includes(s))
    );
  };

  const filteredPending = sortUsers(pendingUsers.filter(matchesGlobalSearch));
  const filteredApproved = sortUsers(approvedUsers.filter(matchesGlobalSearch));
  const filteredRejected = sortUsers(rejectedUsers.filter(matchesGlobalSearch));

  const filteredUsers = sortUsers(allUsers.filter(u => {
    if (!matchesGlobalSearch(u)) return false;
    const matchesFilter = userFilter === 'all' ||
      (userFilter === 'approved' && u.status === 'approved') ||
      (userFilter === 'pending' && u.status === 'pending') ||
      (userFilter === 'rejected' && u.status === 'rejected');
    return matchesFilter;
  }));

  const formatDateTime = (d: string) => {
    const date = new Date(d);
    return date.toLocaleDateString('es-LA', { day: '2-digit', month: 'short', year: 'numeric' }) + ' ' + date.toLocaleTimeString('es-LA', { hour: '2-digit', minute: '2-digit' });
  };

  const getStatusBadge = (user: ProfileUser) => {
    if (user.status === 'approved') return <Badge className="bg-green-500/10 text-green-500 border-green-500/20">{t('approved')}</Badge>;
    if (user.status === 'rejected') return <Badge className="bg-red-500/10 text-red-500 border-red-500/20">{t('rejected')}</Badge>;
    return <Badge className="bg-yellow-500/10 text-yellow-500 border-yellow-500/20">{t('pending')}</Badge>;
  };

  // Get action user name for dialogs
  const actionUserName = actionUserId
    ? (allUsers.find(u => u.user_id === actionUserId)?.display_name || allUsers.find(u => u.user_id === actionUserId)?.email || 'este usuario')
    : 'este usuario';

  // Render cell content based on column id
  const renderCellContent = (user: ProfileUser, colId: string) => {
    const isAdmin = adminUserIds.has(user.user_id);
    switch (colId) {
      case 'name':
        return (
          <div>
            <div className="flex items-center gap-2">
              <p className="font-medium text-foreground">{user.display_name || 'Sin nombre'}</p>
              {isAdmin && <Badge className="bg-primary/10 text-primary border-primary/20 text-xs">{t('adminBadge')}</Badge>}
            </div>
            <p className="text-xs text-muted-foreground">{user.email || '—'}</p>
          </div>
        );
      case 'country':
        return (
          <div className="flex items-center gap-1.5 text-muted-foreground">
            <FlagImg country={user.country} size={14} />
            <span>{user.country || '—'}</span>
          </div>
        );
      case 'company': return <span className="text-muted-foreground">{user.company_name || '—'}</span>;
      case 'phone': return <span className="text-muted-foreground">{user.phone || '—'}</span>;
      case 'clients': return <span className="text-muted-foreground">{user.client_count || '—'}</span>;
      case 'network': return <span className="text-muted-foreground">{user.network_type || '—'}</span>;
      case 'plans': return <span className="text-muted-foreground">{activePlansCounts[user.user_id] || 0}</span>;
      case 'created': return <span className="text-xs text-muted-foreground whitespace-nowrap">{formatDateTime(user.created_at)}</span>;
      default: return null;
    }
  };

  // Unified user table row
  const renderUserTableRow = (user: ProfileUser, showActions: 'pending' | 'approved' | 'rejected' | 'all') => {
    const isAdmin = adminUserIds.has(user.user_id);
    return (
      <tr key={user.id} className="border-b border-border/50 hover:bg-secondary/30 transition-colors">
        {visibleColumns.map(col => (
          <td key={col.id} className="py-3 px-2" style={columnWidths[col.id] ? { width: columnWidths[col.id], minWidth: col.minWidth } : { minWidth: col.minWidth }}>
            {renderCellContent(user, col.id)}
          </td>
        ))}
        {showActions === 'all' && <td className="py-3 px-2">{getStatusBadge(user)}</td>}
        <td className="py-3 px-2 text-right">
          <div className="flex items-center justify-end gap-1">
            <Button variant="ghost" size="sm" onClick={() => setSelectedUser(user)} className="text-muted-foreground" title={t('viewDetails')}>
              <Eye className="w-4 h-4" />
            </Button>
            {showActions === 'pending' && (
              <>
                <Button variant="ghost" size="sm" onClick={() => rejectUser(user.user_id)} className="text-red-500 hover:text-red-400" title="Rechazar">
                  <XCircle className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => approveUser(user.user_id)} className="text-green-500 hover:text-green-400" title="Aprobar">
                  <CheckCircle2 className="w-4 h-4" />
                </Button>
              </>
            )}
            {showActions === 'approved' && (
              <>
                <Button variant="ghost" size="sm" onClick={() => user.email && resetUserPassword(user.email)} className="text-blue-500 hover:text-blue-400" title="Redefinir Contraseña">
                  <KeyRound className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => toggleAdmin(user.user_id, isAdmin)} className={isAdmin ? "text-primary hover:text-primary" : "text-muted-foreground hover:text-primary"} title={isAdmin ? "Quitar Admin" : "Hacer Admin"}>
                  <Shield className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => confirmSuspend(user.user_id)} className="text-yellow-500 hover:text-yellow-400" title="Suspender">
                  <Ban className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => confirmDelete(user.user_id)} className="text-destructive hover:text-destructive" title="Eliminar">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
            {showActions === 'rejected' && (
              <>
                <Button variant="ghost" size="sm" onClick={() => approveUser(user.user_id)} className="text-green-500 hover:text-green-500" title="Aprobar">
                  <CheckCircle2 className="w-4 h-4" />
                </Button>
                <Button variant="ghost" size="sm" onClick={() => confirmDelete(user.user_id)} className="text-destructive hover:text-destructive" title="Eliminar">
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
                <Button variant="ghost" size="sm" onClick={() => confirmDelete(user.user_id)} className="text-destructive hover:text-destructive" title="Eliminar">
                  <Trash2 className="w-4 h-4" />
                </Button>
              </>
            )}
          </div>
        </td>
      </tr>
    );
  };

  // Flexible table header with sort + resize
  const renderTableHeader = (showStatus: boolean) => (
    <thead>
      <tr className="border-b border-border text-left text-muted-foreground">
        {visibleColumns.map(col => (
          <th
            key={col.id}
            className="pb-3 px-2 font-medium relative select-none group"
            style={columnWidths[col.id] ? { width: columnWidths[col.id], minWidth: col.minWidth } : { minWidth: col.minWidth }}
          >
            <button
              type="button"
              onClick={() => handleSort(col.id)}
              className="inline-flex items-center gap-1 hover:text-foreground transition-colors"
            >
              {col.label}
              {sortColumn === col.id ? (
                sortDir === 'asc' ? <ArrowUp className="w-3 h-3" /> : <ArrowDown className="w-3 h-3" />
              ) : (
                <ArrowUpDown className="w-3 h-3 opacity-0 group-hover:opacity-50 transition-opacity" />
              )}
            </button>
            <div
              className="absolute right-0 top-0 bottom-0 w-1.5 cursor-col-resize hover:bg-primary/30 transition-colors"
              onMouseDown={(e) => handleResizeStart(col.id, e)}
            />
          </th>
        ))}
        {showStatus && <th className="pb-3 px-2 font-medium">Status</th>}
        <th className="pb-3 px-2 font-medium text-right">{t('actions')}</th>
      </tr>
    </thead>
  );

  // Column visibility toggle button - stays open until clicking outside
  const [columnPopoverOpen, setColumnPopoverOpen] = useState(false);
  const ColumnToggle = () => (
    <Popover open={columnPopoverOpen} onOpenChange={setColumnPopoverOpen}>
      <PopoverTrigger asChild>
        <Button variant="outline" size="sm" className="gap-2 border-border">
          <Columns3 className="w-4 h-4" /> {t('columns') || 'Columnas'}
        </Button>
      </PopoverTrigger>
      <PopoverContent className="w-52 bg-card border-border p-3" align="end" onInteractOutside={() => setColumnPopoverOpen(false)}>
        <p className="text-xs font-medium text-muted-foreground mb-2">{t('toggleColumns') || 'Mostrar/Ocultar columnas'}</p>
        <div className="space-y-2">
          {columnDefs.map(col => (
            <label key={col.id} className="flex items-center gap-2 text-sm cursor-pointer" onClick={(e) => e.stopPropagation()}>
              <Checkbox
                checked={columnVisibility[col.id]}
                onCheckedChange={() => toggleColumn(col.id)}
              />
              <span className="text-foreground">{col.label}</span>
            </label>
          ))}
        </div>
      </PopoverContent>
    </Popover>
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

      {/* Global search + actions */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Buscar por nombre, email, empresa, país, teléfono, red..."
            value={globalSearch}
            onChange={(e) => setGlobalSearch(e.target.value)}
            className="pl-10 bg-secondary border-border"
          />
        </div>
        <div className="flex gap-2 flex-wrap">
          <ColumnToggle />
          <Button size="sm" className="gap-2" onClick={() => setShowCreateUser(true)}>
            <Plus className="w-4 h-4" /> {t('addUser') || 'Agregar Usuario'}
          </Button>
          <Button variant="secondary" size="sm" className="gap-2" onClick={() => setShowImportDialog(true)}>
            <Upload className="w-4 h-4" /> {t('importUsers')}
          </Button>
          <Button variant="secondary" size="sm" className="gap-2" onClick={() => setShowAdminManager(true)}>
            <Shield className="w-4 h-4" /> {t('manageAdmins')}
          </Button>
        </div>
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

        {/* Pending Tab */}
        <TabsContent value="pending">
          {pendingUsers.length > 0 && (
            <div className="flex justify-end mb-4">
              <Button size="sm" className="gap-2 bg-green-600 hover:bg-green-700 text-white" onClick={() => setShowApproveAllConfirm(true)}>
                <CheckCircle2 className="w-4 h-4" /> Aprobar Todos ({pendingUsers.length})
              </Button>
            </div>
          )}
          {loadingPending ? (
            <div className="text-center py-12 text-muted-foreground">{t('loading')}...</div>
          ) : filteredPending.length === 0 ? (
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
                  {filteredPending.map(user => renderUserTableRow(user, 'pending'))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* Approved Tab */}
        <TabsContent value="approved">
          {loadingApproved ? (
            <div className="text-center py-12 text-muted-foreground">{t('loading')}...</div>
          ) : filteredApproved.length === 0 ? (
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
                  {filteredApproved.map(user => renderUserTableRow(user, 'approved'))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* Rejected Tab */}
        <TabsContent value="rejected">
          {loadingRejected ? (
            <div className="text-center py-12 text-muted-foreground">{t('loading')}...</div>
          ) : filteredRejected.length === 0 ? (
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
                  {filteredRejected.map(user => renderUserTableRow(user, 'rejected'))}
                </tbody>
              </table>
            </div>
          )}
        </TabsContent>

        {/* All Users Tab */}
        <TabsContent value="all">
          <div className="flex gap-3 mb-6">
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

      {/* Approve All Confirmation */}
      <AlertDialog open={showApproveAllConfirm} onOpenChange={setShowApproveAllConfirm}>
        <AlertDialogContent className="bg-card border-border">
          <AlertDialogHeader>
            <AlertDialogTitle>¿Aprobar todos los usuarios pendientes?</AlertDialogTitle>
            <AlertDialogDescription>
              Se aprobarán {pendingUsers.length} usuario(s) pendiente(s). Todos podrán acceder a la plataforma inmediatamente.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancelar</AlertDialogCancel>
            <AlertDialogAction onClick={approveAllPending} className="bg-green-600 text-white hover:bg-green-700">
              <CheckCircle2 className="w-4 h-4 mr-2" /> Aprobar Todos
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
        <DialogContent className="bg-card border-border max-w-2xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle className="font-display">{selectedUser?.display_name || 'Usuario'}</DialogTitle>
          </DialogHeader>
          {selectedUser && (
            <UserDetailContent
              user={selectedUser}
              t={t}
              getStatusBadge={getStatusBadge}
              approveUser={approveUser}
              rejectUser={rejectUser}
              confirmSuspend={confirmSuspend}
              confirmDelete={confirmDelete}
              fetchActivePlansCounts={fetchActivePlansCounts}
            />
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

      {/* Create User Dialog */}
      <Dialog open={showCreateUser} onOpenChange={setShowCreateUser}>
        <DialogContent className="bg-card border-border max-w-md">
          <DialogHeader>
            <DialogTitle className="font-display flex items-center gap-2">
              <Plus className="w-5 h-5 text-primary" /> {t('addUser') || 'Agregar Usuario'}
            </DialogTitle>
          </DialogHeader>
          <CreateUserForm
            newUser={newUser}
            setNewUser={setNewUser}
            createUser={createUser}
            creatingUser={creatingUser}
            t={t}
          />
        </DialogContent>
      </Dialog>
    </div>
  );
};

export default AdminUsers;
