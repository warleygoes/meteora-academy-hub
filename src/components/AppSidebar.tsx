import React, { useState } from 'react';
import { NavLink, useLocation } from 'react-router-dom';
import { Home, BookOpen, Users, Shield, Search, Globe, User, LogOut, Menu, X } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import { Language } from '@/lib/i18n';
import { useAuth } from '@/hooks/useAuth';
import meteoraLogo from '@/assets/logo-white-pink.png';

const languageLabels: Record<Language, string> = { pt: 'PT', en: 'EN', es: 'ES' };

export const AppSidebar: React.FC = () => {
  const { t, language, setLanguage } = useLanguage();
  const { user, isAdmin, signOut } = useAuth();
  const location = useLocation();
  const [collapsed, setCollapsed] = useState(false);
  const [mobileOpen, setMobileOpen] = useState(false);

  const navItems = [
    { to: '/', icon: Home, label: t('home') },
    { to: '/courses', icon: BookOpen, label: t('courses') },
    { to: '/community', icon: Users, label: t('community') },
    ...(isAdmin ? [{ to: '/admin', icon: Shield, label: t('admin') }] : []),
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
      <nav className="flex-1 px-2">
        {navItems.map(({ to, icon: Icon, label }) => (
          <NavLink
            key={to}
            to={to}
            onClick={() => setMobileOpen(false)}
            className={`flex items-center gap-3 px-3 py-2.5 rounded-lg mb-1 text-sm transition-colors ${
              isActive(to)
                ? 'bg-primary/10 text-primary font-medium'
                : 'text-sidebar-foreground hover:bg-sidebar-accent'
            }`}
          >
            <Icon className="w-5 h-5 flex-shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
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

        <div className="flex items-center gap-3 px-3 py-2 rounded-lg hover:bg-sidebar-accent transition-colors cursor-pointer">
          <div className="w-8 h-8 rounded-full bg-primary/20 flex items-center justify-center">
            <User className="w-4 h-4 text-primary" />
          </div>
          {!collapsed && (
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium text-foreground truncate">{user?.user_metadata?.display_name || 'Aluno'}</p>
              <p className="text-xs text-muted-foreground truncate">{user?.email}</p>
            </div>
          )}
        </div>
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
