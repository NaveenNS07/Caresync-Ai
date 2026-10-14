import React, { createContext, useContext, useState, useEffect } from 'react';
import type { RoleType, RoleProfile } from '../types';

export const ROLE_PROFILES: Record<RoleType, RoleProfile> = {
  nurse: {
    id: 'nurse',
    name: 'Meena',
    title: 'Nurse / ANM',
    facility: 'Asha Nagar Village Sub-Centre',
    facilityType: 'subcentre',
    avatarInitials: 'MN',
    description: 'Frontline village health worker. Detects danger signs, records vitals, initiates escalations and transfers.'
  },
  doctor: {
    id: 'doctor',
    name: 'Dr. Arun',
    title: 'Medical Officer / PHC Doctor',
    facility: 'Shanti Puram Primary Health Centre',
    facilityType: 'phc',
    avatarInitials: 'DA',
    description: 'Primary clinical reviewer. Evaluates SBAR escalations, authorizes emergency transfers and medical protocols.'
  },
  hospital: {
    id: 'hospital',
    name: 'Sister Priya',
    title: 'Emergency Receiving Desk Staff',
    facility: 'Rampur District Hospital (FRU)',
    facilityType: 'hospital',
    avatarInitials: 'SP',
    description: 'District receiving team. Accepts/declines referrals, signs clinical handover, and documents delivery/outcomes.'
  },
  manager: {
    id: 'manager',
    name: 'Dr. Rajesh Verma',
    title: 'Chief District Health Officer',
    facility: 'District Health Administration HQ',
    facilityType: 'district',
    avatarInitials: 'RV',
    description: 'District oversight. Monitors Care Continuity Index, identifies loop drop-offs, and resolves bottlenecks.'
  }
};

interface AuthContextType {
  currentRole: RoleType;
  profile: RoleProfile;
  switchRole: (role: RoleType) => void;
  isPinLocked: boolean;
  isPinEnabled: boolean;
  unlockWithPin: (pin: string) => boolean;
  lockApp: () => void;
  togglePinProtection: (enable: boolean) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [currentRole, setCurrentRole] = useState<RoleType>(() => {
    const saved = localStorage.getItem('caresync_role') as RoleType;
    return saved && ROLE_PROFILES[saved] ? saved : 'nurse';
  });

  const [isPinEnabled, setIsPinEnabled] = useState<boolean>(() => {
    return localStorage.getItem('caresync_pin_enabled') === 'true';
  });

  const [isPinLocked, setIsPinLocked] = useState<boolean>(false);

  const switchRole = (role: RoleType) => {
    setCurrentRole(role);
    localStorage.setItem('caresync_role', role);
  };

  const lockApp = () => {
    if (isPinEnabled) {
      setIsPinLocked(true);
    }
  };

  const unlockWithPin = (pin: string): boolean => {
    if (pin === '1234') {
      setIsPinLocked(false);
      return true;
    }
    return false;
  };

  const togglePinProtection = (enable: boolean) => {
    setIsPinEnabled(enable);
    localStorage.setItem('caresync_pin_enabled', enable ? 'true' : 'false');
    if (!enable) {
      setIsPinLocked(false);
    }
  };

  return (
    <AuthContext.Provider
      value={{
        currentRole,
        profile: ROLE_PROFILES[currentRole],
        switchRole,
        isPinLocked,
        isPinEnabled,
        unlockWithPin,
        lockApp,
        togglePinProtection
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
