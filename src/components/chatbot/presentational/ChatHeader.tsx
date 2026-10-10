import React from 'react';
import { Link } from 'react-router-dom';
import { ShieldCheck, Shield } from 'lucide-react';
import { getAiTrainingConsent, setAiTrainingConsent } from '@/hooks/useEnhancedGeminiTraining';

export function ChatHeader({ title, subtitle }: { title: string; subtitle?: string }) {
  const [consent, setConsent] = React.useState<boolean>(getAiTrainingConsent());

  const toggleConsent = () => {
    const next = !consent;
    setAiTrainingConsent(next);
    setConsent(next);
  };

  return (
    <div className="px-3 py-2 border-b flex items-center justify-between gap-2">
      <div>
        <div className="font-semibold text-sm">{title}</div>
        {subtitle && <div className="text-[11px] text-muted-foreground">{subtitle}</div>}
      </div>

      <div className="flex items-center gap-1.5 shrink-0 text-[10px]">
        <button
          type="button"
          onClick={toggleConsent}
          className={`flex items-center gap-1 px-2 py-0.5 rounded-full border transition-colors ${
            consent
              ? 'bg-emerald-50 text-emerald-700 border-emerald-300 dark:bg-emerald-950 dark:text-emerald-300'
              : 'bg-muted text-muted-foreground border-border hover:bg-muted/80'
          }`}
          title={
            consent
              ? 'AI training enabled. Click to opt out (DPDP compliant).'
              : 'AI training disabled (Private mode). Click to opt in.'
          }
        >
          {consent ? <ShieldCheck className="w-3 h-3 text-emerald-600" /> : <Shield className="w-3 h-3 text-muted-foreground" />}
          <span>{consent ? 'AI Training: On' : 'Private Mode'}</span>
        </button>
        <Link to="/privacy#ai-training" className="text-muted-foreground hover:underline text-[9px]">
          Privacy
        </Link>
      </div>
    </div>
  );
}
