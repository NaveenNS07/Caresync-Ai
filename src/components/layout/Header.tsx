import React from 'react';
import { 
  HeartHandshake, 
  Sun, 
  Moon, 
  Globe, 
  UserCheck, 
  PlayCircle, 
  Lock, 
  Building2,
  ChevronDown
} from 'lucide-react';
import { useAuth, ROLE_PROFILES } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import { useLanguage } from '../../context/LanguageContext';
import { useHeroDemo } from '../../context/HeroDemoContext';
import type { RoleType } from '../../types';

export const Header: React.FC = () => {
  const { currentRole, profile, switchRole, isPinEnabled, lockApp } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { startDemo, isActive: isHeroActive } = useHeroDemo();

  return (
    <header className="bg-[var(--bg-surface)] border-b border-[var(--border-main)] px-3 sm:px-6 py-3 transition-colors shadow-xs">
      <div className="max-w-7xl mx-auto flex flex-col md:flex-row md:items-center justify-between gap-3">
        {/* Brand & Tagline */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-xl bg-[var(--primary)] flex items-center justify-center text-white shadow-md shadow-teal-500/20 shrink-0">
              <HeartHandshake className="w-6 h-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-lg sm:text-xl font-extrabold tracking-tight text-[var(--text-main)]">
                  {t.appName}
                </h1>
                <span className="text-[10px] uppercase font-bold tracking-wider px-2 py-0.5 rounded-full bg-[var(--primary)]/10 text-[var(--primary)] border border-[var(--primary)]/20">
                  Rural Care Loop
                </span>
              </div>
              <p className="text-xs text-[var(--text-muted)] line-clamp-1">
                {t.tagline}
              </p>
            </div>
          </div>

          {/* Mobile Hero & Theme Controls */}
          <div className="flex md:hidden items-center gap-1.5">
            <button
              type="button"
              onClick={toggleTheme}
              className="p-2 rounded-lg border border-[var(--border-main)] text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/5"
              aria-label="Toggle Theme"
            >
              {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
            </button>
          </div>
        </div>

        {/* Center / Right controls: Role Selector, Facilities, Language, Theme, Hero */}
        <div className="flex flex-wrap items-center gap-2 sm:gap-3">
          {/* Active Facility Badge */}
          <div className="hidden lg:flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-black/5 dark:bg-white/5 border border-[var(--border-main)] text-xs text-[var(--text-muted)]">
            <Building2 className="w-3.5 h-3.5 text-[var(--primary)]" />
            <span className="font-semibold text-[var(--text-main)]">{profile.facility}</span>
          </div>

          {/* Role Switcher */}
          <div className="relative inline-flex items-center">
            <label htmlFor="role-select" className="sr-only">Switch Role</label>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-xl border border-[var(--border-main)] bg-[var(--bg-main)] text-xs">
              <UserCheck className="w-4 h-4 text-[var(--primary)] shrink-0" />
              <select
                id="role-select"
                value={currentRole}
                onChange={(e) => switchRole(e.target.value as RoleType)}
                className="bg-transparent font-bold text-[var(--text-main)] outline-none cursor-pointer pr-4 appearance-none"
              >
                <option value="nurse">Nurse Meena (Sub-Centre)</option>
                <option value="doctor">Dr. Arun (PHC Doctor)</option>
                <option value="hospital">Sister Priya (District Hospital)</option>
                <option value="manager">Dr. Verma (District Manager)</option>
              </select>
              <ChevronDown className="w-3 h-3 text-[var(--text-muted)] -ml-3 pointer-events-none" />
            </div>
          </div>

          {/* Language Switcher */}
          <div className="flex items-center gap-1 px-2 py-1 rounded-xl border border-[var(--border-main)] bg-[var(--bg-main)] text-xs">
            <Globe className="w-3.5 h-3.5 text-[var(--text-muted)] shrink-0" />
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                language === 'en' ? 'bg-[var(--primary)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              EN
            </button>
            <button
              type="button"
              onClick={() => setLanguage('ta')}
              className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                language === 'ta' ? 'bg-[var(--primary)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              தமிழ்
            </button>
            <button
              type="button"
              onClick={() => setLanguage('hi')}
              className={`px-1.5 py-0.5 rounded text-[11px] font-bold ${
                language === 'hi' ? 'bg-[var(--primary)] text-white' : 'text-[var(--text-muted)] hover:text-[var(--text-main)]'
              }`}
            >
              हिंदी
            </button>
          </div>

          {/* Theme Toggle (Desktop) */}
          <button
            type="button"
            onClick={toggleTheme}
            className="hidden md:flex p-2 rounded-xl border border-[var(--border-main)] text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer transition-colors"
            title="Toggle Light / Dark mode"
            aria-label="Toggle Theme"
          >
            {isDark ? <Sun className="w-4 h-4 text-amber-400" /> : <Moon className="w-4 h-4 text-indigo-500" />}
          </button>

          {/* Lock Screen Button (if PIN enabled) */}
          {isPinEnabled && (
            <button
              type="button"
              onClick={lockApp}
              className="p-2 rounded-xl border border-[var(--border-main)] text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/5 cursor-pointer"
              title="Lock device with PIN"
            >
              <Lock className="w-4 h-4 text-amber-500" />
            </button>
          )}

          {/* Run Hero Demo Button */}
          <button
            type="button"
            onClick={startDemo}
            className={`btn-primary text-xs !py-2 !px-3 font-bold shadow-md cursor-pointer ${
              isHeroActive ? 'ring-2 ring-indigo-500 animate-pulse' : ''
            }`}
          >
            <PlayCircle className="w-4 h-4 text-amber-300" />
            <span>{t.btnRunHero}</span>
          </button>
        </div>
      </div>
    </header>
  );
};
