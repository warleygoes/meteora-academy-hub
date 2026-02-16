import React, { useState, useEffect } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, BookOpen, Users, Shield, Search, Globe, User, LogOut, Menu, X, Video, Link2, ExternalLink, Headphones, Calendar, Star, Zap, Rocket, FileText, Settings, MessageSquare, LayoutDashboard, BookOpenCheck, Code, Link, Mail, Phone, Bell, Heart, Image, Map, Music, Play, Target, Award, Coffee, Compass, Database, Download, Eye, Flag, Gift, Hash, Key, Layers, LifeBuoy, Lightbulb, Lock, MapPin, Megaphone, Mic, Monitor, Package, PieChart, Radio, Send, Server, Share2, ShoppingCart, Smartphone, Speaker, Tag, ThumbsUp, Tv, Upload, Wifi, Wrench, Activity, Cpu } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Language } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/integrations/supabase/client';
import meteoraLogo from '@/assets/logo-white-pink.png';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';

const languageLabels: Record<Language, string> = { pt: 'PT', en: 'EN', es: 'ES' };

const ICON_MAP: Record<string, React.FC<{ className?: string }>> = {
  link: Link, 'link-2': Link2, 'external-link': ExternalLink, globe: Globe,
  video: Video, 'book-open': BookOpen, headphones: Headphones,
  'message-square': MessageSquare, calendar: Calendar, star: Star,
  zap: Zap, rocket: Rocket, shield: Shield, settings: Settings,
  users: Users, 'layout-dashboard': LayoutDashboard, 'file-text': FileText,
  home: Home, mail: Mail, phone: Phone, bell: Bell, search: Search,
  heart: Heart, image: Image, map: Map, music: Music, play: Play,
  target: Target, award: Award, coffee: Coffee, compass: Compass,
  database: Database, download: Download, eye: Eye, flag: Flag,
  gift: Gift, hash: Hash, key: Key, layers: Layers, 'life-buoy': LifeBuoy,
  lightbulb: Lightbulb, lock: Lock, 'map-pin': MapPin, megaphone: Megaphone,
  mic: Mic, monitor: Monitor, package: Package, 'pie-chart': PieChart,
  radio: Radio, send: Send, server: Server, 'share-2': Share2,
  'shopping-cart': ShoppingCart, smartphone: Smartphone, speaker: Speaker,
  tag: Tag, 'thumbs-up': ThumbsUp, tv: Tv, upload: Upload, wifi: Wifi,
  wrench: Wrench, activity: Activity, cpu: Cpu,
};

interface CustomLink {
  id: string; title: string; icon: string; url: string;
  open_mode: string; sort_order: number; auto_translate: boolean;
  translatedTitle?: string;
}

export const AppSidebar: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const { user, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);
  const [customLinks, setCustomLinks] = useState<CustomLink[]>([]);
  const [avatarUrl, setAvatarUrl] = useState<string | null>(null);

  // Fetch user profile avatar
  useEffect(() => {
    if (!user) return;
    const fetchAvatar = async () => {
      const { data } = await supabase.from('profiles').select('avatar_url').eq('user_id', user.id).maybeSingle();
      if (data?.avatar_url) setAvatarUrl(data.avatar_url);
    };
    fetchAvatar();
  }, [user]);
  useEffect(() => {
    if (!user) return;
    const fetchLinks = async () => {
      // Fetch active links
      const { data: links } = await supabase
        .from('menu_links').select('*').eq('active', true).order('sort_order');
      if (!links || links.length === 0) { setCustomLinks([]); return; }

      // Fetch user's packages and products
      const [{ data: userPlans }, { data: userProds }] = await Promise.all([
        supabase.from('user_plans').select('package_id').eq('user_id', user.id).eq('status', 'active'),
        supabase.from('user_products').select('product_id').eq('user_id', user.id),
      ]);
      const userPkgIds = new Set((userPlans || []).map(p => p.package_id));
      const userProdIds = new Set((userProds || []).map(p => p.product_id));

      // Fetch link visibility rules
      const linkIds = links.map(l => l.id);
      const [{ data: linkPkgs }, { data: linkProds }] = await Promise.all([
        supabase.from('menu_link_packages').select('menu_link_id, package_id').in('menu_link_id', linkIds),
        supabase.from('menu_link_products').select('menu_link_id, product_id').in('menu_link_id', linkIds),
      ]);

      const pkgMap: Record<string, string[]> = {};
      (linkPkgs || []).forEach((r: any) => {
        if (!pkgMap[r.menu_link_id]) pkgMap[r.menu_link_id] = [];
        pkgMap[r.menu_link_id].push(r.package_id);
      });
      const prodMap: Record<string, string[]> = {};
      (linkProds || []).forEach((r: any) => {
        if (!prodMap[r.menu_link_id]) prodMap[r.menu_link_id] = [];
        prodMap[r.menu_link_id].push(r.product_id);
      });

      // Filter: show if no restrictions OR user has matching pkg/prod
      const visible = links.filter(l => {
        const reqPkgs = pkgMap[l.id] || [];
        const reqProds = prodMap[l.id] || [];
        if (reqPkgs.length === 0 && reqProds.length === 0) return true; // visible to all
        if (isAdmin) return true;
        return reqPkgs.some(id => userPkgIds.has(id)) || reqProds.some(id => userProdIds.has(id));
      });

      const mapped: CustomLink[] = visible.map(l => ({
        id: l.id, title: l.title, icon: l.icon, url: l.url,
        open_mode: l.open_mode, sort_order: l.sort_order,
        auto_translate: (l as any).auto_translate || false,
      }));

      setCustomLinks(mapped);

      // Translate links that have auto_translate enabled
      const langNames: Record<string, string> = { pt: 'Portuguese', en: 'English', es: 'Spanish' };
      const targetLang = langNames[language] || 'English';
      
      // Only translate if not default language (es)
      if (language !== 'es') {
        const toTranslate = mapped.filter(l => l.auto_translate);
        if (toTranslate.length > 0) {
          const translations = await Promise.all(
            toTranslate.map(async (l) => {
              try {
                const { data } = await supabase.functions.invoke('translate-category', {
                  body: { text: l.title, targetLanguage: targetLang },
                });
                return { id: l.id, translated: data?.translated || l.title };
              } catch {
                return { id: l.id, translated: l.title };
              }
            })
          );
          setCustomLinks(prev => prev.map(l => {
            const t = translations.find(tr => tr.id === l.id);
            return t ? { ...l, translatedTitle: t.translated } : l;
          }));
        }
      }
    };
    fetchLinks();
  }, [user, isAdmin, language]);

  const navItems = [
    { to: '/app', icon: Home, label: t('home') },
    { to: '/app/courses', icon: BookOpen, label: t('myLibrary') || 'Minha Biblioteca' },
    { to: '/app/community', icon: Users, label: t('community') },
    { to: '/app/meetings', icon: Video, label: t('liveMeetings') },
    ...(isAdmin ? [
      { to: '/app/admin', icon: Shield, label: t('admin') },
    ] : []),
  ];

  const isActive = (path: string) => location.pathname === path;

  const sidebar = (
    <div className={`flex flex-col h-full bg-sidebar border-r border-sidebar-border ${collapsed ? 'w-16' : 'w-60'} transition-all duration-300`}>
      {/* Logo */}
      <div className="px-4 py-5 flex items-center">
        {collapsed ? (
          <div className="w-9 h-9 rounded-lg bg-primary flex items-center justify-center font-display font-bold text-primary-foreground text-lg flex-shrink-0">
            M
          </div>
        ) : (
          <img src={meteoraLogo} alt="Meteora Academy" className="h-8 w-auto" />
        )}
      </div>

      {/* Search */}
      {!collapsed && (
        <div className="px-4 mb-4">
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-sidebar-accent text-muted-foreground text-sm">
            <Search className="w-4 h-4 flex-shrink-0" />
            <input
              placeholder={t('search')}
              className="bg-transparent outline-none w-full text-foreground placeholder:text-muted-foreground text-sm"
            />
          </div>
        </div>
      )}

      {/* Nav */}
      <nav className="flex-1 px-2 overflow-y-auto">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm transition-colors ${
              location.pathname === to
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-sidebar-foreground hover:bg-sidebar-accent'
            }`}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}

        {/* Custom links */}
        {customLinks.length > 0 && !collapsed && (
          <div className="border-t border-sidebar-border my-2 pt-2">
            <span className="px-3 text-xs text-muted-foreground uppercase tracking-wider">Links</span>
          </div>
        )}
        {customLinks.map(link => {
          const IconComp = ICON_MAP[link.icon] || Link2;
          if (link.open_mode === 'embed') {
            const to = `/app/embed/${link.id}`;
            return (
              <NavLink
                key={link.id}
                to={to}
                onClick={() => setMobileOpen(false)}
                className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm transition-colors ${
                  location.pathname === to
                    ? 'bg-primary/10 text-primary font-medium'
                    : 'text-sidebar-foreground hover:bg-sidebar-accent'
                }`}
              >
                <IconComp className="w-5 h-5 flex-shrink-0" />
                {!collapsed && <span>{link.translatedTitle || link.title}</span>}
              </NavLink>
            );
          }
          return (
            <a
              key={link.id}
              href={link.url}
              target={link.open_mode === 'new_tab' ? '_blank' : '_self'}
              rel={link.open_mode === 'new_tab' ? 'noopener noreferrer' : undefined}
              onClick={() => setMobileOpen(false)}
              className="flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm transition-colors text-sidebar-foreground hover:bg-sidebar-accent"
            >
              <IconComp className="w-5 h-5 flex-shrink-0" />
              {!collapsed && (
                <>
                  <span className="flex-1">{link.translatedTitle || link.title}</span>
                  {link.open_mode === 'new_tab' && <ExternalLink className="w-3 h-3 text-muted-foreground" />}
                </>
              )}
            </a>
          );
        })}
      </nav>

      {/* Language + User */}
      <div className="px-2 pb-4 space-y-2">
        {!collapsed && (
          <div className="flex items-center gap-1 px-3 py-2">
            <Globe className="w-4 h-4 text-muted-foreground mr-2" />
            {(['pt', 'en', 'es'] as Language[]).map((lang) => (
              <button
                key={lang}
                onClick={() => setLanguage(lang)}
                className={`px-2 py-1 rounded text-xs font-medium transition-colors ${
                  language === lang
                    ? 'bg-primary text-primary-foreground'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
              >
                {languageLabels[lang]}
              </button>
            ))}
          </div>
        )}

        <NavLink
          to="/app/profile"
          onClick={() => setMobileOpen(false)}
          className={`flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-sidebar-accent transition-colors ${
            isActive('/app/profile') ? 'bg-primary/10' : ''
          }`}
        >
          <Avatar className="w-8 h-8">
            <AvatarImage src={avatarUrl || undefined} alt={user?.user_metadata?.display_name || 'User'} />
            <AvatarFallback className="bg-primary/20 text-primary text-sm font-medium">
              {(user?.user_metadata?.display_name || user?.email || 'U').slice(0, 2).toUpperCase()}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user?.user_metadata?.display_name || 'Aluno'}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          )}
        </NavLink>
        <button
          onClick={() => signOut()}
          className="flex items-center gap-3 px-3 py-2 rounded-lg text-muted-foreground hover:bg-sidebar-accent hover:text-foreground transition-colors w-full text-sm"
        >
          <LogOut className="w-4 h-4 flex-shrink-0" />
          {!collapsed && <span>{t('logout')}</span>}
        </button>
      </div>
    </div>
  );

  return (
    <>
      {/* Mobile toggle */}
      <button
        onClick={() => setMobileOpen(!mobileOpen)}
        className="fixed top-4 left-4 z-50 md:hidden w-10 h-10 rounded-lg bg-card flex items-center justify-center card-shadow"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Menu className="w-5 h-5" />}
      </button>

      {/* Mobile overlay */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 bg-background/80 md:hidden" onClick={() => setMobileOpen(false)} />
      )}

      {/* Mobile sidebar */}
      <div className={`fixed inset-y-0 left-0 z-40 md:hidden transform transition-transform ${mobileOpen ? 'translate-x-0' : '-translate-x-full'}`}>
        {sidebar}
      </div>

      {/* Desktop sidebar */}
      <div className="hidden md:block h-screen sticky top-0">
        {sidebar}
      </div>
    </>
  );
};
