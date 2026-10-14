import React, { useState } from 'react';
import { X, MessageSquare, Copy, Check, Phone, Smartphone, AlertCircle } from 'lucide-react';
import type { Referral } from '../../types';

interface SmsFallbackModalProps {
  referral: Referral | null;
  isOpen: boolean;
  onClose: () => void;
}

export const SmsFallbackModal: React.FC<SmsFallbackModalProps> = ({
  referral,
  isOpen,
  onClose
}) => {
  const [copied, setCopied] = useState<boolean>(false);

  if (!isOpen || !referral) return null;

  // Generate standardized rural SMS fallback payload
  const smsBody = `[CARESYNC-EMERGENCY] PT: ${referral.patientName} | Ref: ${referral.referralNumber} | BP: ${referral.keyVitals.bp}, Pulse: ${referral.keyVitals.pulse}, SpO2: ${referral.keyVitals.spo2}% | DANGER: ${referral.reason} | Origin: ${referral.originFacility} | Dest: ${referral.destinationFacility} | Actions: ${referral.actionsTaken} | Contact: +91 94251 10001`;

  const receivingPhone = '+919425130003';

  const handleCopy = () => {
    navigator.clipboard.writeText(smsBody);
    setCopied(true);
    setTimeout(() => setCopied(false), 2500);
  };

  const smsUri = `sms:${receivingPhone}?body=${encodeURIComponent(smsBody)}`;
  const telUri = `tel:${receivingPhone}`;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-xs flex items-center justify-center p-3 sm:p-4 z-50 animate-fadeIn">
      <div className="card-base w-full max-w-lg flex flex-col overflow-hidden shadow-2xl">
        {/* Header */}
        <div className="p-4 sm:p-5 border-b border-[var(--border-main)] flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-amber-500/10 text-amber-500 flex items-center justify-center font-bold">
              <MessageSquare className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-extrabold text-[var(--text-main)]">
                Offline SMS Dispatch Fallback
              </h2>
              <p className="text-xs text-[var(--text-muted)]">
                Zero-Data GSM Fallback when Internet is Down
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-2 rounded-lg text-[var(--text-muted)] hover:bg-black/5 dark:hover:bg-white/5"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-4 sm:p-5 space-y-4 text-xs">
          <div className="p-3 rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-700 dark:text-amber-400 text-xs flex items-center gap-2">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>
              Device is currently offline. Send this pre-formatted clinical SMS directly to the Receiving Desk sister to ensure bed reservation.
            </span>
          </div>

          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-[var(--text-muted)] mb-1.5">
              Standardized SMS Dispatch Message
            </label>
            <div className="p-3.5 rounded-xl border border-[var(--border-main)] bg-[var(--bg-main)] font-mono text-xs leading-relaxed text-[var(--text-main)] relative group">
              {smsBody}
            </div>
          </div>

          <div className="flex flex-col sm:flex-row items-center gap-2 pt-2">
            {/* Copy Button */}
            <button
              type="button"
              onClick={handleCopy}
              className="w-full sm:w-auto flex-1 btn-secondary text-xs font-bold flex items-center justify-center gap-1.5"
            >
              {copied ? <Check className="w-4 h-4 text-emerald-500" /> : <Copy className="w-4 h-4" />}
              <span>{copied ? 'Copied to Clipboard!' : 'Copy SMS Text'}</span>
            </button>

            {/* Native SMS App Launcher */}
            <a
              href={smsUri}
              className="w-full sm:w-auto flex-1 btn-primary text-xs font-bold flex items-center justify-center gap-1.5 !bg-amber-600 hover:!bg-amber-700 text-white"
            >
              <Smartphone className="w-4 h-4" />
              <span>Open Phone SMS App</span>
            </a>

            {/* Direct Phone Call Button */}
            <a
              href={telUri}
              className="w-full sm:w-auto btn-secondary text-xs font-bold flex items-center justify-center gap-1.5 border-emerald-500/30 text-emerald-600 dark:text-emerald-400 hover:bg-emerald-500/10"
              title="Call Rampur District Hospital Desk"
            >
              <Phone className="w-4 h-4" />
              <span>Call Facility</span>
            </a>
          </div>
        </div>

        {/* Footer */}
        <div className="p-3 border-t border-[var(--border-main)] bg-black/5 dark:bg-white/5 text-[11px] text-[var(--text-muted)] text-center">
          Records remain stored in local IndexedDB and will auto-sync when cellular data resumes.
        </div>
      </div>
    </div>
  );
};
