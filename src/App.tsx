import React, { useState, useEffect } from 'react';
import { LanguageProvider, useLanguage } from './context/LanguageContext';
import { ThemeProvider } from './context/ThemeContext';
import { AuthProvider, useAuth } from './context/AuthContext';
import { NetworkProvider } from './context/NetworkContext';
import { HeroDemoProvider } from './context/HeroDemoContext';

import { GlobalStatusBar } from './components/layout/GlobalStatusBar';
import { Header } from './components/layout/Header';
import { NavigationBar, type AppView } from './components/layout/NavigationBar';
import { SyncPanelModal } from './components/layout/SyncPanelModal';
import { PinLockModal } from './components/modals/PinLockModal';
import { HeroGuideOverlay } from './components/modals/HeroGuideOverlay';
import { AddReadingModal } from './components/modals/AddReadingModal';
import { AddPatientModal } from './components/modals/AddPatientModal';
import { EscalateModal } from './components/modals/EscalateModal';
import { CreateReferralModal } from './components/modals/CreateReferralModal';
import { SmsFallbackModal } from './components/modals/SmsFallbackModal';

import { DashboardView } from './views/DashboardView';
import { PatientDetailView } from './views/PatientDetailView';
import { EscalationsView } from './views/EscalationsView';
import { ReferralsView } from './views/ReferralsView';
import { TasksView } from './views/TasksView';
import { ManagerView } from './views/ManagerView';
import { AuditView } from './views/AuditView';
import { RuleThresholdsView } from './views/RuleThresholdsView';
import { SettingsView } from './views/SettingsView';

import { syncService } from './db/syncService';
import { localDb } from './db/localDb';
import type { Patient, Reading, Alert, Referral, Task } from './types';

const MainAppContent: React.FC = () => {
  const { t } = useLanguage();
  const { currentRole } = useAuth();

  const [currentView, setCurrentView] = useState<AppView>('dashboard');
  const [selectedPatientId, setSelectedPatientId] = useState<string>('PT-101'); // Default to Lakshmi Devi
  const [selectedPatient, setSelectedPatient] = useState<Patient | null>(null);

  // Modals state
  const [isAddReadingOpen, setIsAddReadingOpen] = useState<boolean>(false);
  const [isAddPatientOpen, setIsAddPatientOpen] = useState<boolean>(false);
  const [isEscalateOpen, setIsEscalateOpen] = useState<boolean>(false);
  const [isReferralOpen, setIsReferralOpen] = useState<boolean>(false);
  const [smsFallbackReferral, setSmsFallbackReferral] = useState<Referral | null>(null);

  const [escalateReading, setEscalateReading] = useState<Reading | undefined>(undefined);
  const [escalateAlert, setEscalateAlert] = useState<Alert | undefined>(undefined);

  const [badgeCounts, setBadgeCounts] = useState({
    escalations: 0,
    referrals: 0,
    tasks: 0
  });

  const refreshCounts = async () => {
    try {
      const pendingEsc = await localDb.escalations.where('status').equals('pending').count();
      const openRef = await localDb.referrals.filter(r => r.state !== 'outcome_recorded').count();
      const overdueTasks = await localDb.tasks.where('status').equals('overdue').count();
      setBadgeCounts({
        escalations: pendingEsc,
        referrals: openRef,
        tasks: overdueTasks
      });
    } catch (e) {
      console.error(e);
    }
  };

  useEffect(() => {
    syncService.initialize().then(() => {
      refreshCounts();
    });
  }, []);

  const handleSelectPatient = async (id: string) => {
    setSelectedPatientId(id);
    const p = await localDb.patients.get(id);
    if (p) setSelectedPatient(p);
  };

  const handleOpenAddReading = async (id?: string) => {
    const targetId = id || selectedPatientId;
    setSelectedPatientId(targetId);
    const p = await localDb.patients.get(targetId);
    if (p) setSelectedPatient(p);
    setIsAddReadingOpen(true);
  };

  const handleOpenEscalate = (patient: Patient, reading?: Reading, alert?: Alert) => {
    setSelectedPatient(patient);
    setEscalateReading(reading);
    setEscalateAlert(alert);
    setIsEscalateOpen(true);
  };

  const handleOpenReferral = (patient: Patient, reading?: Reading) => {
    setSelectedPatient(patient);
    setEscalateReading(reading);
    setIsReferralOpen(true);
  };

  const renderCurrentView = () => {
    switch (currentView) {
      case 'dashboard':
      case 'patients':
        return (
          <DashboardView
            onNavigate={setCurrentView}
            onSelectPatient={handleSelectPatient}
            onOpenAddReading={handleOpenAddReading}
            onOpenAddPatient={() => setIsAddPatientOpen(true)}
          />
        );

      case 'patient-detail':
        return (
          <PatientDetailView
            patientId={selectedPatientId}
            onBack={() => setCurrentView('dashboard')}
            onOpenAddReading={handleOpenAddReading}
            onOpenEscalate={handleOpenEscalate}
            onOpenReferral={handleOpenReferral}
            onNavigate={setCurrentView}
          />
        );

      case 'escalations':
        return (
          <EscalationsView
            onSelectPatient={handleSelectPatient}
            onNavigate={setCurrentView}
          />
        );

      case 'referrals':
        return (
          <ReferralsView
            onSelectPatient={handleSelectPatient}
            onNavigate={setCurrentView}
          />
        );

      case 'tasks':
        return (
          <TasksView
            onSelectPatient={handleSelectPatient}
            onNavigate={setCurrentView}
          />
        );

      case 'manager':
        return (
          <ManagerView
            onSelectPatient={handleSelectPatient}
            onNavigate={setCurrentView}
          />
        );

      case 'audit':
        return <AuditView />;

      case 'rules':
        return <RuleThresholdsView />;

      case 'settings':
        return <SettingsView onNavigate={setCurrentView} />;

      default:
        return (
          <DashboardView
            onNavigate={setCurrentView}
            onSelectPatient={handleSelectPatient}
            onOpenAddReading={handleOpenAddReading}
            onOpenAddPatient={() => setIsAddPatientOpen(true)}
          />
        );
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-[var(--bg-main)] text-[var(--text-main)] transition-colors">
      {/* Top Global Status Bar */}
      <GlobalStatusBar />

      {/* Main App Header with role & theme toggles */}
      <Header />

      {/* Responsive Navigation Bar */}
      <NavigationBar
        currentView={currentView}
        onNavigate={setCurrentView}
        badgeCounts={badgeCounts}
      />

      {/* Main View Area */}
      <main className="flex-1 pb-16">
        {renderCurrentView()}
      </main>

      {/* Persistent Clinical Decision-Support Footer Disclaimer */}
      <footer className="border-t border-[var(--border-main)] bg-[var(--bg-surface)] py-3 px-4 text-center text-xs text-[var(--text-muted)] select-none">
        <div className="max-w-4xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-1">
          <span>{t.disclaimerText}</span>
          <span className="font-mono text-[11px] text-[var(--primary)] font-bold">
            CARESYNC AI v2.4 (PWA Offline Verified)
          </span>
        </div>
      </footer>

      {/* Modals & Overlays */}
      <SyncPanelModal />
      <PinLockModal />
      <HeroGuideOverlay
        onNavigate={setCurrentView}
        onOpenAddReading={handleOpenAddReading}
        onSelectPatient={handleSelectPatient}
      />

      {/* Add Reading Modal */}
      {isAddReadingOpen && selectedPatient && (
        <AddReadingModal
          patient={selectedPatient}
          isOpen={isAddReadingOpen}
          onClose={() => setIsAddReadingOpen(false)}
          onReadingAdded={(reading, alert) => {
            refreshCounts();
            if (currentView === 'dashboard') {
              setCurrentView('patient-detail');
            }
          }}
        />
      )}

      {/* Add Patient Modal */}
      {isAddPatientOpen && (
        <AddPatientModal
          isOpen={isAddPatientOpen}
          onClose={() => setIsAddPatientOpen(false)}
          onPatientAdded={(newPatient) => {
            setSelectedPatientId(newPatient.id);
            setSelectedPatient(newPatient);
            setCurrentView('patient-detail');
            refreshCounts();
          }}
        />
      )}

      {/* Escalate Modal */}
      {isEscalateOpen && selectedPatient && (
        <EscalateModal
          patient={selectedPatient}
          latestReading={escalateReading}
          activeAlert={escalateAlert}
          isOpen={isEscalateOpen}
          onClose={() => setIsEscalateOpen(false)}
          onEscalated={() => {
            refreshCounts();
          }}
        />
      )}

      {/* Create Referral Modal */}
      {isReferralOpen && selectedPatient && (
        <CreateReferralModal
          patient={selectedPatient}
          latestReading={escalateReading}
          isOpen={isReferralOpen}
          onClose={() => setIsReferralOpen(false)}
          onReferralCreated={() => {
            refreshCounts();
          }}
          onOpenSmsFallback={(ref) => {
            setSmsFallbackReferral(ref);
          }}
        />
      )}

      {/* SMS Fallback Modal */}
      {smsFallbackReferral && (
        <SmsFallbackModal
          referral={smsFallbackReferral}
          isOpen={true}
          onClose={() => setSmsFallbackReferral(null)}
        />
      )}
    </div>
  );
};

export default function App() {
  return (
    <ThemeProvider>
      <LanguageProvider>
        <AuthProvider>
          <NetworkProvider>
            <HeroDemoProvider>
              <MainAppContent />
            </HeroDemoProvider>
          </NetworkProvider>
        </AuthProvider>
      </LanguageProvider>
    </ThemeProvider>
  );
}
