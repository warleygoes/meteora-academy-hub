import React from 'react';
import { motion } from 'framer-motion';
import { Users, BookOpen, DollarSign, TrendingUp, Settings, CreditCard, GraduationCap, BarChart3 } from 'lucide-react';
import { useLanguage } from '@/contexts/LanguageContext';

const AdminPage: React.FC = () => {
  const { t } = useLanguage();

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
  ];

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
            className="bg-card rounded-xl p-6 card-shadow border border-border hover:border-primary/30 transition-colors cursor-pointer group"
          >
            <section.icon className="w-8 h-8 text-primary mb-4 group-hover:scale-110 transition-transform" />
            <h3 className="font-display font-semibold text-foreground mb-1">{section.label}</h3>
            <p className="text-sm text-muted-foreground">{section.description}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

export default AdminPage;
