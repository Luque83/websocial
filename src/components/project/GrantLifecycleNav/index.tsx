'use client';

import React from 'react';
import { 
  FileEdit, 
  AlertCircle, 
  Sliders, 
  PlayCircle, 
  ClipboardCheck, 
  CheckCircle2,
  ShieldCheck,
  AlertTriangle
} from 'lucide-react';

export type LifecyclePhase = 
  | 'solicitud'
  | 'subsanacion'
  | 'reformulacion'
  | 'ejecucion'
  | 'justificacion'
  | 'cierre';

interface GrantLifecycleNavProps {
  currentPhase: LifecyclePhase;
  onPhaseChange: (phase: LifecyclePhase) => void;
  auditScore?: number;
  auditErrorCount?: number;
  onOpenAuditor?: () => void;
}

export const LIFECYCLE_PHASES: Array<{
  key: LifecyclePhase;
  num: string;
  label: string;
  badge?: string;
  icon: React.ComponentType<{ size?: number; color?: string }>;
}> = [
  { key: 'solicitud', num: '1', label: 'Formulación y Solicitud', icon: FileEdit },
  { key: 'subsanacion', num: '2', label: 'Subsanaciones', icon: AlertCircle },
  { key: 'reformulacion', num: '3', label: 'Reformulación', icon: Sliders },
  { key: 'ejecucion', num: '4', label: 'Ejecución Real', icon: PlayCircle },
  { key: 'justificacion', num: '5', label: 'Justificación Final', icon: ClipboardCheck },
  { key: 'cierre', num: '6', label: 'Cierre y Liquidación', icon: CheckCircle2 },
];

export function GrantLifecycleNav({
  currentPhase,
  onPhaseChange,
  auditScore = 100,
  auditErrorCount = 0,
  onOpenAuditor,
}: GrantLifecycleNavProps) {
  return (
    <div style={{
      background: '#FFFFFF',
      border: '2px solid #CBD5E1',
      borderTop: '4px solid #0D3A5F',
      borderRadius: '14px',
      padding: '1rem 1.25rem',
      marginBottom: '1rem',
      boxShadow: '0 4px 14px rgba(15, 23, 42, 0.06)'
    }}>
      {/* Header bar of the Lifecycle */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.85rem', flexWrap: 'wrap', gap: '0.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#475569', textTransform: 'uppercase', letterSpacing: '0.06em' }}>
            Fase Actual del Expediente:
          </span>
          <span style={{
            fontSize: '0.875rem',
            fontWeight: 800,
            color: '#0D3A5F',
            background: '#EAF5FB',
            padding: '0.25rem 0.75rem',
            borderRadius: '8px',
            border: '1px solid #D5ECF8'
          }}>
            {LIFECYCLE_PHASES.find(p => p.key === currentPhase)?.label}
          </span>
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
              border: `1.5px solid ${auditErrorCount > 0 ? '#FCA5A5' : '#86EFAC'}`,
              padding: '0.3rem 0.85rem',
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

      {/* Primary Phase Selector Bar */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
        gap: '0.5rem'
      }}>
        {LIFECYCLE_PHASES.map((phase) => {
          const Icon = phase.icon;
          const isActive = phase.key === currentPhase;

          return (
            <button
              key={phase.key}
              type="button"
              onClick={() => onPhaseChange(phase.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.65rem 0.85rem',
                borderRadius: '10px',
                border: isActive ? '2px solid #16C7B2' : '1.5px solid #E2E8F0',
                background: isActive ? '#0D3A5F' : '#F8FAFC',
                color: isActive ? '#FFFFFF' : '#334155',
                fontWeight: 800,
                fontSize: '0.8125rem',
                cursor: 'pointer',
                transition: 'all 0.15s',
                boxShadow: isActive ? '0 4px 12px rgba(13, 58, 95, 0.25)' : 'none',
                textAlign: 'left'
              }}
            >
              <div style={{
                width: '24px',
                height: '24px',
                borderRadius: '6px',
                background: isActive ? 'rgba(22, 199, 178, 0.2)' : '#E2E8F0',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                flexShrink: 0
              }}>
                <Icon size={14} color={isActive ? '#16C7B2' : '#475569'} />
              </div>
              <span style={{ lineHeight: 1.2 }}>{phase.num}. {phase.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}

export default GrantLifecycleNav;
