import React from 'react';
import { 
  LayoutDashboard, 
  Users, 
  ArrowUpRight, 
  Truck, 
  CheckSquare, 
  BarChart3, 
  History, 
  Sliders, 
  Settings 
} from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';
import { useAuth } from '../../context/AuthContext';

export type AppView = 
  | 'dashboard' 
  | 'patients' 
  | 'patient-detail'
  | 'escalations' 
  | 'referrals' 
  | 'tasks' 
  | 'manager' 
  | 'audit' 
  | 'rules' 
  | 'settings';

export interface BadgeCounts {
  escalations?: number;
  referrals?: number;
  tasks?: number;
}

interface NavigationBarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  badgeCounts?: BadgeCounts;
}

export const NavigationBar: React.FC<NavigationBarProps> = ({
  currentView,
  onNavigate,
  badgeCounts
}) => {
  const escalations = badgeCounts?.escalations ?? 0;
  const referrals = badgeCounts?.referrals ?? 0;
  const tasks = badgeCounts?.tasks ?? 0;
  const { t } = useLanguage();
  const { currentRole } = useAuth();

  const navItems = [
    { id: 'dashboard', label: t.navDashboard, icon: LayoutDashboard },
    { id: 'patients', label: t.navPatients, icon: Users },
    { 
      id: 'escalations', 
      label: t.navEscalations, 
      icon: ArrowUpRight, 
      badge: escalations,
      highlightForRole: currentRole === 'doctor'
    },
    { 
      id: 'referrals', 
      label: t.navReferrals, 
      icon: Truck, 
      badge: referrals,
      highlightForRole: currentRole === 'hospital'
    },
    { 
      id: 'tasks', 
      label: t.navTasks, 
      icon: CheckSquare, 
      badge: tasks,
      highlightForRole: currentRole === 'nurse'
    },
    { 
      id: 'manager', 
      label: t.navManager, 
      icon: BarChart3,
      highlightForRole: currentRole === 'manager'
    },
    { id: 'audit', label: t.navAudit, icon: History },
    { id: 'rules', label: t.navRules, icon: Sliders },
    { id: 'settings', label: t.navSettings, icon: Settings }
  ];

  return (
    <nav className="bg-[var(--bg-surface)] border-b border-[var(--border-main)] px-3 sm:px-6 transition-colors overflow-x-auto custom-scrollbar">
      <div className="max-w-7xl mx-auto flex items-center gap-1 sm:gap-2 py-1 min-w-max">
        {navItems.map((item) => {
          const isActive = currentView === item.id || (item.id === 'patients' && currentView === 'patient-detail');
          const Icon = item.icon;

          return (
            <button
              key={item.id}
              type="button"
              onClick={() => onNavigate(item.id as AppView)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-xs sm:text-sm font-semibold transition-all relative ${
                isActive
                  ? 'bg-[var(--primary)] text-white shadow-xs'
                  : 'text-[var(--text-muted)] hover:text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/5'
              }`}
            >
              <Icon className="w-4 h-4 shrink-0" />
              <span>{item.label}</span>

              {/* Notification Badges */}
              {Boolean(item.badge && item.badge > 0) && (
                <span
                  className={`text-[10px] px-1.5 py-0.2 rounded-full font-bold leading-none ${
                    isActive
                      ? 'bg-white text-[var(--primary)]'
                      : 'bg-red-500 text-white'
                  }`}
                >
                  {item.badge}
                </span>
              )}

              {/* Role tailored indicator dot */}
              {item.highlightForRole && !isActive && (
                <span className="w-1.5 h-1.5 rounded-full bg-[var(--primary)] absolute top-1.5 right-1.5" />
              )}
            </button>
          );
        })}
      </div>
    </nav>
  );
};
