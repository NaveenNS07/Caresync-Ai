import React from 'react';
import type { Severity } from '../../types';
import { AlertTriangle, AlertOctagon, CheckCircle2, Info } from 'lucide-react';
import { useLanguage } from '../../context/LanguageContext';

interface SeverityBadgeProps {
  severity: Severity;
  showIcon?: boolean;
  size?: 'sm' | 'md' | 'lg';
  customLabel?: string;
}

export const SeverityBadge: React.FC<SeverityBadgeProps> = ({
  severity,
  showIcon = true,
  size = 'md',
  customLabel
}) => {
  const { t } = useLanguage();

  const config = {
    critical: {
      label: customLabel || t.severityCritical,
      icon: AlertOctagon,
      classes: 'badge-critical'
    },
    warning: {
      label: customLabel || t.severityWarning,
      icon: AlertTriangle,
      classes: 'badge-warning'
    },
    stable: {
      label: customLabel || t.severityStable,
      icon: CheckCircle2,
      classes: 'badge-stable'
    },
    info: {
      label: customLabel || t.severityInfo,
      icon: Info,
      classes: 'badge-info'
    }
  }[severity];

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1 font-medium rounded-md',
    md: 'text-sm px-3 py-1 gap-1.5 font-semibold rounded-lg',
    lg: 'text-base px-4 py-1.5 gap-2 font-bold rounded-xl'
  }[size];

  const IconComponent = config.icon;

  return (
    <span
      className={`inline-flex items-center ${sizeClasses} ${config.classes} shadow-xs select-none`}
      role="status"
      aria-label={config.label}
    >
      {showIcon && <IconComponent className={size === 'sm' ? 'w-3.5 h-3.5' : size === 'lg' ? 'w-5 h-5' : 'w-4 h-4'} />}
      <span>{config.label}</span>
    </span>
  );
};
