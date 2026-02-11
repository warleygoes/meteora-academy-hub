import React, { useState, useCallback } from 'react';
import { Users, BookOpen, DollarSign, TrendingUp, Settings, Shield } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';
import AdminUsers from '@/components/admin/AdminUsers';
import AdminCourses from '@/components/admin/AdminCourses';
import AdminPlans from '@/components/admin/AdminPlans';
import AdminAnalytics from '@/components/admin/AdminAnalytics';
import AdminSettings from '@/components/admin/AdminSettings';
import { cn } from '@/lib/utils';

const AdminPage: React.FC = () => {
  const { t } = useLanguage();
  const [activeSection, setActiveSection] = useState('users');
  const [stats, setStats] = useState({ total: 0, approved: 0, pending: 0 });

  const handleStatsUpdate = useCallback((newStats: { total: number; approved: number; pending: number }) => {
    setStats(newStats);
  }, []);

  const sections = [
    { id: 'courses', label: t('manageCourses'), icon: BookOpen, desc: t('adminCoursesDesc') },
    { id: 'plans', label: t('managePlans'), icon: DollarSign, desc: t('adminPlansDesc') },
    { id: 'users', label: t('manageUsers'), icon: Users, desc: t('adminUsersDesc') },
    { id: 'analytics', label: t('analytics'), icon: TrendingUp, desc: t('analyticsDesc') },
    { id: 'settings', label: t('settingsTitle'), icon: Settings, desc: t('settingsDesc') },
  ];

  return (
    <div className="px-6 md:px-12 py-8 max-w-7xl mx-auto">
      <h1 className="text-3xl font-display font-bold mb-8">{t('adminPanel')}</h1>

      {/* Navigation Cards */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3 mb-8">
        {sections.map(section => (
          <button
            key={section.id}
            onClick={() => setActiveSection(section.id)}
            className={cn(
              "flex flex-col items-center gap-2 p-4 rounded-xl border text-center transition-all",
              activeSection === section.id
                ? "bg-primary/10 border-primary/30 text-primary"
                : "bg-card border-border text-muted-foreground hover:bg-secondary hover:text-foreground"
            )}
          >
            <section.icon className="w-6 h-6" />
            <span className="text-sm font-medium">{section.label}</span>
          </button>
        ))}
      </div>

      {/* Content */}
      {activeSection === 'users' && <AdminUsers stats={stats} onStatsUpdate={handleStatsUpdate} />}
      {activeSection === 'courses' && <AdminCourses />}
      {activeSection === 'plans' && <AdminPlans />}
      {activeSection === 'analytics' && <AdminAnalytics stats={stats} />}
      {activeSection === 'settings' && <AdminSettings />}
    </div>
  );
};

export default AdminPage;
