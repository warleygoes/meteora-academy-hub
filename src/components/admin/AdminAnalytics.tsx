import React from 'react';
import { motion } from 'framer-motion';
import { Users, DollarSign, TrendingUp, BookOpen, Globe, UserCheck } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

interface AdminAnalyticsProps {
  stats: { total: number; approved: number; pending: number };
}

const AdminAnalytics: React.FC<AdminAnalyticsProps> = ({ stats }) => {
  const { t } = useLanguage();

  const metrics = [
    { label: t('totalStudents'), value: stats.total, icon: Users, color: 'text-primary', change: '+12%' },
    { label: t('approvedUsers'), value: stats.approved, icon: UserCheck, color: 'text-green-500', change: '+8%' },
    { label: t('pendingUsers'), value: stats.pending, icon: Users, color: 'text-yellow-500', change: '' },
    { label: t('activeCourses'), value: 4, icon: BookOpen, color: 'text-blue-500', change: '+1' },
    { label: t('revenue'), value: 'U$ 12,450', icon: DollarSign, color: 'text-emerald-500', change: '+18%' },
    { label: t('engagement'), value: '78%', icon: TrendingUp, color: 'text-purple-500', change: '+5%' },
  ];

  const topCountries = [
    { country: 'Argentina', users: 45 },
    { country: 'Brasil', users: 38 },
    { country: 'Colombia', users: 29 },
    { country: 'Venezuela', users: 22 },
    { country: 'Perú', users: 18 },
    { country: 'Ecuador', users: 14 },
  ];

  const recentActivity = [
    { action: 'Nuevo registro', detail: 'ISP TechNet - Argentina', time: 'Hace 2h' },
    { action: 'Usuario aprobado', detail: 'RedFibra Solutions', time: 'Hace 4h' },
    { action: 'Pago recibido', detail: 'Plan Oráculo - U$ 39', time: 'Hace 6h' },
    { action: 'Curso completado', detail: 'Conceptos Avanzados ISP', time: 'Hace 8h' },
    { action: 'Nuevo registro', detail: 'NetConnect - Colombia', time: 'Hace 12h' },
  ];

  return (
    <div>
      <h2 className="text-xl font-display font-bold text-foreground mb-2">{t('analytics')}</h2>
      <p className="text-sm text-muted-foreground mb-6">{t('analyticsDesc')}</p>

      {/* Metrics */}
      <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 mb-8">
        {metrics.map((m, i) => (
          <motion.div key={m.label} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.06 }}
            className="bg-card rounded-xl p-5 border border-border">
            <div className="flex items-center justify-between mb-2">
              <m.icon className={`w-5 h-5 ${m.color}`} />
              {m.change && <span className="text-xs text-green-500 font-medium">{m.change}</span>}
            </div>
            <p className="text-2xl font-display font-bold text-foreground">{m.value}</p>
            <p className="text-sm text-muted-foreground">{m.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid md:grid-cols-2 gap-6">
        {/* Top Countries */}
        <div className="bg-card rounded-xl border border-border p-6">
          <div className="flex items-center gap-2 mb-4">
            <Globe className="w-5 h-5 text-primary" />
            <h3 className="font-display font-semibold text-foreground">{t('topCountries')}</h3>
          </div>
          <div className="space-y-3">
            {topCountries.map((c, i) => (
              <div key={c.country} className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <span className="text-sm text-muted-foreground w-5">{i + 1}</span>
                  <span className="text-sm font-medium text-foreground">{c.country}</span>
                </div>
                <div className="flex items-center gap-2">
                  <div className="h-2 rounded-full bg-primary/20 w-24">
                    <div className="h-2 rounded-full bg-primary" style={{ width: `${(c.users / topCountries[0].users) * 100}%` }} />
                  </div>
                  <span className="text-xs text-muted-foreground w-8 text-right">{c.users}</span>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="bg-card rounded-xl border border-border p-6">
          <h3 className="font-display font-semibold text-foreground mb-4">{t('recentActivity')}</h3>
          <div className="space-y-3">
            {recentActivity.map((a, i) => (
              <div key={i} className="flex items-start gap-3">
                <div className="w-2 h-2 rounded-full bg-primary mt-2 shrink-0" />
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-foreground">{a.action}</p>
                  <p className="text-xs text-muted-foreground">{a.detail}</p>
                </div>
                <span className="text-xs text-muted-foreground shrink-0">{a.time}</span>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default AdminAnalytics;
