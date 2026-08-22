'use client';

import React from 'react';
import { 
  FileEdit, 
  Send, 
  AlertCircle, 
  Sliders, 
  Award, 
  PlayCircle, 
  ClipboardCheck, 
  CheckCircle2,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';
import type { GrantLifecycleStage } from '@/types/grant-lifecycle';
import styles from '../ProjectWorkspace/ProjectWorkspace.module.css';

interface GrantLifecycleNavProps {
  currentStage: GrantLifecycleStage;
  onStageChange: (newStage: GrantLifecycleStage) => void;
  auditScore?: number;
  auditErrorCount?: number;
  onOpenAuditor?: () => void;
}

const STAGES: Array<{ key: GrantLifecycleStage; label: string; icon: React.ComponentType<{ size?: number }> }> = [
  { key: 'borrador', label: '1. Formulación / Borrador', icon: FileEdit },
  { key: 'solicitado', label: '2. Solicitud Presentada', icon: Send },
  { key: 'subsanacion', label: '3. Subsanación', icon: AlertCircle },
  { key: 'reformulacion', label: '4. Reformulación', icon: Sliders },
  { key: 'concedido', label: '5. Concedido / Baseline', icon: Award },
  { key: 'en_ejecucion', label: '6. En Ejecución', icon: PlayCircle },
  { key: 'en_justificacion', label: '7. En Justificación', icon: ClipboardCheck },
  { key: 'cerrado', label: '8. Justificado / Cerrado', icon: CheckCircle2 },
];

export function GrantLifecycleNav({
  currentStage,
  onStageChange,
  auditScore = 100,
  auditErrorCount = 0,
  onOpenAuditor,
}: GrantLifecycleNavProps) {
  const currentIdx = STAGES.findIndex(s => s.key === currentStage);

  return (
    <div style={{ background: '#FFFFFF', border: '1.5px solid #D5ECF8', borderRadius: '12px', padding: '0.75rem 1.25rem', marginBottom: '1.25rem', boxShadow: '0 2px 6px rgba(13,58,95,0.04)' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.65rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#5C7E9B', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Ciclo de Vida de la Subvención:
          </span>
          <strong style={{ fontSize: '0.875rem', color: '#0D3A5F', background: '#EAF5FB', padding: '0.2rem 0.6rem', borderRadius: '6px' }}>
            {STAGES.find(s => s.key === currentStage)?.label || currentStage}
          </strong>
        </div>

        {onOpenAuditor && (
          <button
            type="button"
            onClick={onOpenAuditor}
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.35rem',
              background: auditErrorCount > 0 ? '#FEE2E2' : '#DCFCE7',
              color: auditErrorCount > 0 ? '#991B1B' : '#166534',
              border: `1px solid ${auditErrorCount > 0 ? '#FCA5A5' : '#86EFAC'}`,
              padding: '0.25rem 0.65rem',
              borderRadius: '9999px',
              fontSize: '0.75rem',
              fontWeight: 800,
              cursor: 'pointer'
            }}
          >
            {auditErrorCount > 0 ? <AlertTriangle size={13} /> : <ShieldCheck size={13} />}
            Auditor de Coherencia: {auditScore}/100 {auditErrorCount > 0 ? `(${auditErrorCount} avisos)` : '✓ Conforme'}
          </button>
        )}
      </div>

      <div className={styles.lifecycleStepper}>
        {STAGES.map((st, idx) => {
          const Icon = st.icon;
          const isActive = st.key === currentStage;
          const isDone = idx < currentIdx;

          let stepClass = styles.stageStepPending;
          if (isActive) stepClass = styles.stageStepActive;
          else if (isDone) stepClass = styles.stageStepDone;

          return (
            <button
              key={st.key}
              type="button"
              onClick={() => onStageChange(st.key)}
              className={`${styles.stageStep} ${stepClass}`}
              title={`Cambiar estado del proyecto a: ${st.label}`}
            >
              <Icon size={14} />
              <span>{st.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default GrantLifecycleNav;
