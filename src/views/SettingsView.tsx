import React, { useState } from 'react';
import { 
  Settings as SettingsIcon, 
  Sun, 
  Moon, 
  Monitor, 
  Globe, 
  UserCheck, 
  Lock, 
  RotateCcw, 
  PlayCircle, 
  CheckCircle2, 
  Database, 
  ShieldCheck,
  Smartphone
} from 'lucide-react';
import { useTheme } from '../context/ThemeContext';
import { useLanguage } from '../context/LanguageContext';
import { useAuth, ROLE_PROFILES } from '../context/AuthContext';
import { useHeroDemo } from '../context/HeroDemoContext';
import { syncService } from '../db/syncService';
import type { RoleType } from '../types';

interface SettingsViewProps {
  onNavigate: (view: any) => void;
}

export const SettingsView: React.FC<SettingsViewProps> = ({ onNavigate }) => {
  const { theme, setTheme, isDark } = useTheme();
  const { language, setLanguage, t } = useLanguage();
  const { currentRole, switchRole, isPinEnabled, togglePinProtection, lockApp } = useAuth();
  const { startDemo } = useHeroDemo();

  const [resetMsg, setResetMsg] = useState<string | null>(null);

  const handleResetData = async () => {
    if (window.confirm('Reset all databases (Local & Cloud IndexedDB) to pristine demo seed state?')) {
      await syncService.resetToSeed();
      setResetMsg('Database successfully restored to clean seed state.');
      setTimeout(() => setResetMsg(null), 3000);
    }
  };

  const handleLaunchHero = () => {
    switchRole('nurse');
    startDemo();
    onNavigate('dashboard');
  };

  return (
    <div className="max-w-4xl mx-auto p-3 sm:p-6 space-y-6 animate-fadeIn">
      {/* Header */}
      <div className="card-base p-4 sm:p-5 flex items-center gap-3">
        <div className="w-10 h-10 rounded-xl bg-[var(--primary)]/10 text-[var(--primary)] flex items-center justify-center font-bold">
          <SettingsIcon className="w-5 h-5" />
        </div>
        <div>
          <h2 className="text-lg sm:text-xl font-black text-[var(--text-main)]">
            System Settings &amp; Configuration
          </h2>
          <p className="text-xs text-[var(--text-muted)]">
            Device preferences, user profiles, security lock, and demo reset utilities
          </p>
        </div>
      </div>

      {resetMsg && (
        <div className="p-3.5 rounded-xl bg-teal-500/10 border border-teal-500/30 text-xs text-[var(--primary)] font-bold flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4" />
          <span>{resetMsg}</span>
        </div>
      )}

      {/* Hero Scenario Launcher Banner */}
      <div className="card-base p-4 sm:p-5 border-2 border-indigo-500/40 bg-indigo-500/5 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2">
            <span className="w-2.5 h-2.5 rounded-full bg-indigo-600 animate-ping" />
            <h3 className="font-extrabold text-sm text-[var(--text-main)]">
              Guided 11-Step Hero Scenario Walkthrough
            </h3>
          </div>
          <p className="text-xs text-[var(--text-muted)]">
            Automatically guides through Lakshmi Devi's severe pre-eclampsia care loop from offline warning to hospital handover &amp; follow-up.
          </p>
        </div>

        <button
          type="button"
          onClick={handleLaunchHero}
          className="btn-primary !bg-indigo-600 hover:!bg-indigo-700 text-xs font-bold shrink-0 flex items-center gap-1.5 shadow-md"
        >
          <PlayCircle className="w-4 h-4 text-amber-300" />
          <span>Launch Hero Scenario</span>
        </button>
      </div>

      {/* Role Switcher */}
      <div className="card-base p-4 sm:p-5 space-y-3">
        <h3 className="text-sm font-extrabold text-[var(--text-main)] uppercase tracking-wider">
          Active Clinical Role (1-Tap Switch)
        </h3>
        <p className="text-xs text-[var(--text-muted)]">
          Each role experiences tailored views and clinical capabilities appropriate to their facility.
        </p>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-1">
          {(Object.keys(ROLE_PROFILES) as RoleType[]).map((rKey) => {
            const role = ROLE_PROFILES[rKey];
            const isSelected = currentRole === rKey;

            return (
              <button
                key={rKey}
                type="button"
                onClick={() => switchRole(rKey)}
                className={`p-3.5 rounded-2xl border text-left transition-all cursor-pointer flex flex-col justify-between gap-2 ${
                  isSelected
                    ? 'border-[var(--primary)] bg-[var(--primary)]/10 shadow-sm'
                    : 'border-[var(--border-main)] bg-[var(--bg-main)] hover:border-[var(--primary)]'
                }`}
              >
                <div>
                  <div className="flex items-center justify-between">
                    <span className="font-extrabold text-sm text-[var(--text-main)]">
                      {role.name}
                    </span>
                    {isSelected && (
                      <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-[var(--primary)] text-white">
                        Active
                      </span>
                    )}
                  </div>
                  <div className="text-xs font-semibold text-[var(--primary)] mt-0.5">
                    {role.title}
                  </div>
                  <div className="text-[11px] text-[var(--text-muted)] mt-1">
                    Facility: {role.facility}
                  </div>
                </div>

                <p className="text-[11px] text-[var(--text-muted)] line-clamp-2 mt-1">
                  {role.description}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Display & Language Preferences */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {/* Theme Settings */}
        <div className="card-base p-4 sm:p-5 space-y-3">
          <h3 className="text-sm font-extrabold text-[var(--text-main)] uppercase tracking-wider">
            Appearance &amp; Theme
          </h3>
          <p className="text-xs text-[var(--text-muted)]">
            High-contrast color tokens with smooth 200ms transitions.
          </p>

          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              type="button"
              onClick={() => setTheme('light')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-xs font-bold transition-all ${
                theme === 'light'
                  ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)] shadow-xs'
                  : 'border-[var(--border-main)] hover:border-[var(--primary)]'
              }`}
            >
              <Sun className="w-5 h-5 text-amber-500" />
              <span>Light</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('dark')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-xs font-bold transition-all ${
                theme === 'dark'
                  ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)] shadow-xs'
                  : 'border-[var(--border-main)] hover:border-[var(--primary)]'
              }`}
            >
              <Moon className="w-5 h-5 text-indigo-400" />
              <span>Dark</span>
            </button>

            <button
              type="button"
              onClick={() => setTheme('system')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1.5 text-xs font-bold transition-all ${
                theme === 'system'
                  ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)] shadow-xs'
                  : 'border-[var(--border-main)] hover:border-[var(--primary)]'
              }`}
            >
              <Monitor className="w-5 h-5 text-[var(--text-muted)]" />
              <span>System</span>
            </button>
          </div>
        </div>

        {/* Language Selection */}
        <div className="card-base p-4 sm:p-5 space-y-3">
          <h3 className="text-sm font-extrabold text-[var(--text-main)] uppercase tracking-wider">
            Language / மொழி / भाषा
          </h3>
          <p className="text-xs text-[var(--text-muted)]">
            Main navigation, badges, and button labels update instantly.
          </p>

          <div className="grid grid-cols-3 gap-2 pt-1">
            <button
              type="button"
              onClick={() => setLanguage('en')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 text-xs font-bold transition-all ${
                language === 'en'
                  ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)] shadow-xs'
                  : 'border-[var(--border-main)] hover:border-[var(--primary)]'
              }`}
            >
              <span className="text-base">English</span>
              <span className="text-[10px] text-[var(--text-muted)]">EN</span>
            </button>

            <button
              type="button"
              onClick={() => setLanguage('ta')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 text-xs font-bold transition-all ${
                language === 'ta'
                  ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)] shadow-xs'
                  : 'border-[var(--border-main)] hover:border-[var(--primary)]'
              }`}
            >
              <span className="text-base">தமிழ்</span>
              <span className="text-[10px] text-[var(--text-muted)]">Tamil</span>
            </button>

            <button
              type="button"
              onClick={() => setLanguage('hi')}
              className={`p-3 rounded-xl border flex flex-col items-center justify-center gap-1 text-xs font-bold transition-all ${
                language === 'hi'
                  ? 'border-[var(--primary)] bg-[var(--primary)]/10 text-[var(--primary)] shadow-xs'
                  : 'border-[var(--border-main)] hover:border-[var(--primary)]'
              }`}
            >
              <span className="text-base">हिंदी</span>
              <span className="text-[10px] text-[var(--text-muted)]">Hindi</span>
            </button>
          </div>
        </div>
      </div>

      {/* Security & PIN Lock */}
      <div className="card-base p-4 sm:p-5 space-y-3">
        <div className="flex items-center justify-between">
          <div className="space-y-0.5">
            <h3 className="text-sm font-extrabold text-[var(--text-main)] uppercase tracking-wider flex items-center gap-2">
              <Lock className="w-4 h-4 text-amber-500" />
              <span>Local Device PIN Lock Protection</span>
            </h3>
            <p className="text-xs text-[var(--text-muted)]">
              Simulates shared tablet device security for rural sub-centre kiosks. Default PIN: <strong>1234</strong>
            </p>
          </div>

          <label className="relative inline-flex items-center cursor-pointer">
            <input
              type="checkbox"
              checked={isPinEnabled}
              onChange={(e) => togglePinProtection(e.target.checked)}
              className="sr-only peer"
            />
            <div className="w-11 h-6 bg-black/20 peer-focus:outline-none rounded-full peer dark:bg-white/20 peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[var(--primary)]" />
          </label>
        </div>

        {isPinEnabled && (
          <div className="pt-2 flex items-center gap-3">
            <button
              type="button"
              onClick={lockApp}
              className="btn-secondary text-xs font-bold flex items-center gap-1.5"
            >
              <Lock className="w-3.5 h-3.5 text-amber-500" />
              <span>Test Lock Screen Now</span>
            </button>
            <span className="text-xs text-[var(--text-muted)]">
              Enter 1234 on keypad to unlock.
            </span>
          </div>
        )}
      </div>

      {/* Reset & Storage Info */}
      <div className="card-base p-4 sm:p-5 space-y-3">
        <h3 className="text-sm font-extrabold text-[var(--text-main)] uppercase tracking-wider flex items-center gap-2">
          <Database className="w-4 h-4 text-[var(--primary)]" />
          <span>Local Storage &amp; Seed Data Reset</span>
        </h3>
        <p className="text-xs text-[var(--text-muted)]">
          All records exist purely in client-side IndexedDB databases (CareSyncLocalDB and simulated CareSyncCloudDB).
        </p>

        <div className="pt-2 flex items-center gap-3">
          <button
            type="button"
            onClick={handleResetData}
            className="btn-secondary text-xs font-bold text-red-500 border-red-500/30 hover:bg-red-500/10 flex items-center gap-1.5"
          >
            <RotateCcw className="w-3.5 h-3.5" />
            <span>Reset Database to Pristine Seed</span>
          </button>
        </div>
      </div>
    </div>
  );
};
