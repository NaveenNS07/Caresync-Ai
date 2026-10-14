import React, { useState } from 'react';
import { Lock, Delete, ShieldCheck, AlertCircle } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';

export const PinLockModal: React.FC = () => {
  const { isPinLocked, unlockWithPin, profile } = useAuth();
  const [pin, setPin] = useState<string>('');
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  if (!isPinLocked) return null;

  const handleKeyPress = (num: string) => {
    if (pin.length < 4) {
      const nextPin = pin + num;
      setPin(nextPin);
      setErrorMsg(null);
      if (nextPin.length === 4) {
        const success = unlockWithPin(nextPin);
        if (!success) {
          setErrorMsg('Incorrect PIN. Demo PIN is: 1234');
          setTimeout(() => setPin(''), 600);
        }
      }
    }
  };

  const handleBackspace = () => {
    setPin(prev => prev.slice(0, -1));
    setErrorMsg(null);
  };

  return (
    <div className="fixed inset-0 bg-[var(--bg-main)] z-50 flex flex-col items-center justify-center p-4 select-none">
      <div className="card-base p-6 sm:p-8 w-full max-w-sm text-center shadow-2xl">
        <div className="w-14 h-14 rounded-2xl bg-[var(--primary)]/10 text-[var(--primary)] mx-auto flex items-center justify-center mb-4">
          <Lock className="w-7 h-7" />
        </div>

        <h2 className="text-xl font-extrabold text-[var(--text-main)] mb-1">
          CareSync Lock
        </h2>
        <p className="text-xs text-[var(--text-muted)] mb-6">
          Logged in as <strong>{profile.name} ({profile.title})</strong>
        </p>

        {/* PIN Dots */}
        <div className="flex justify-center gap-3 mb-6">
          {[0, 1, 2, 3].map((idx) => (
            <div
              key={idx}
              className={`w-4 h-4 rounded-full border-2 transition-all ${
                pin.length > idx
                  ? 'bg-[var(--primary)] border-[var(--primary)] scale-110'
                  : 'border-[var(--border-main)]'
              }`}
            />
          ))}
        </div>

        {errorMsg && (
          <div className="flex items-center justify-center gap-1.5 text-xs text-red-500 font-semibold mb-4">
            <AlertCircle className="w-4 h-4" />
            <span>{errorMsg}</span>
          </div>
        )}

        {/* Numeric Keypad */}
        <div className="grid grid-cols-3 gap-3 mb-4">
          {['1', '2', '3', '4', '5', '6', '7', '8', '9'].map((digit) => (
            <button
              key={digit}
              type="button"
              onClick={() => handleKeyPress(digit)}
              className="touch-target rounded-2xl border border-[var(--border-main)] text-lg font-bold text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-transform"
            >
              {digit}
            </button>
          ))}
          <div />
          <button
            type="button"
            onClick={() => handleKeyPress('0')}
            className="touch-target rounded-2xl border border-[var(--border-main)] text-lg font-bold text-[var(--text-main)] hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-transform"
          >
            0
          </button>
          <button
            type="button"
            onClick={handleBackspace}
            className="touch-target rounded-2xl border border-[var(--border-main)] flex items-center justify-center text-[var(--text-muted)] hover:bg-black/5 dark:hover:bg-white/5 active:scale-95 transition-transform"
          >
            <Delete className="w-5 h-5" />
          </button>
        </div>

        <div className="text-[11px] text-[var(--text-muted)] bg-teal-500/10 p-2 rounded-xl text-center">
          Default Demo PIN: <strong>1234</strong>
        </div>
      </div>
    </div>
  );
};
