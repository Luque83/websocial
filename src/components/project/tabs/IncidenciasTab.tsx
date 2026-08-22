'use client';

import React, { useState } from 'react';
import { 
  AlertTriangle, 
  Plus, 
  Trash2, 
  CheckCircle2, 
  ShieldAlert, 
  ShieldCheck, 
  FileText, 
  Calendar, 
  DollarSign, 
  Paperclip,
  ExternalLink,
  Info
} from 'lucide-react';
import type { ProjectIncidentItem, IncidentCategory, IncidentLegalSeverity } from '@/types/grant-lifecycle';
import styles from '../ProjectWorkspace/ProjectWorkspace.module.css';

interface IncidenciasTabProps {
  incidents: ProjectIncidentItem[];
  onUpdateIncidents: (newIncidents: ProjectIncidentItem[]) => void;
  formatCurrency: (n: number) => string;
}

const CATEGORY_LABELS: Record<IncidentCategory, string> = {
  personal_baja: 'Baja IT / Incapacidad Temporal',
  cambio_personal: 'Sustitución / Cambio de Personal',
  retraso_calendario: 'Retraso en Calendario / Prórroga',
  variacion_presupuesto: 'Trasvase entre Partidas Presupuestarias',
  cambio_actividad: 'Modificación de Metodología / Actividad',
  disminucion_participantes: 'Desviación en Número de Beneficiarios',
  otro: 'Otra Circunstancia Sobrevenida',
};

const SEVERITY_INFO: Record<IncidentLegalSeverity, { label: string; tagClass: string; desc: string }> = {
  informativa: {
    label: 'Informativa (Interna)',
    tagClass: styles.severityTagInformativa,
    desc: 'No altera compromisos sustanciales. No requiere comunicación a la Administración.',
  },
  comunicacion_previa: {
    label: 'Requiere Comunicación',
    tagClass: styles.severityTagComunicacion,
    desc: 'Debe notificarse formalmente al organismo sin esperar resolución expresa.',
  },
  autorizacion_previa: {
    label: 'Requiere Autorización Previa',
    tagClass: styles.severityTagAutorizacion,
    desc: 'No se puede ejecutar el cambio sin el visto bueno expreso del financiador.',
  },
  modificacion_resolucion: {
    label: 'Modificación de Resolución / Convenio',
    tagClass: styles.severityTagAutorizacion,
    desc: 'Afecta a condiciones esenciales. Requiere resolución formal de modificación.',
  },
  riesgo_incumplimiento: {
    label: 'Riesgo de Incumplimiento / Reintegro',
    tagClass: styles.severityTagAutorizacion,
    desc: 'Peligro inminente de penalización o reintegro parcial de la subvención.',
  },
  no_determinado: {
    label: 'No Determinado — Revisar Bases',
    tagClass: styles.severityTagInformativa,
    desc: 'Comprobar las bases reguladoras de la convocatoria.',
  },
};

export function IncidenciasTab({
  incidents,
  onUpdateIncidents,
  formatCurrency,
}: IncidenciasTabProps) {
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<IncidentCategory>('personal_baja');
  const [legalSeverity, setLegalSeverity] = useState<IncidentLegalSeverity>('autorizacion_previa');
  const [budgetImpact, setBudgetImpact] = useState<number>(0);

  const handleAddIncident = () => {
    if (!title || !description) {
      alert('Por favor introduce el título y la descripción de la incidencia.');
      return;
    }

    const newInc: ProjectIncidentItem = {
      id: `inc-${Date.now()}`,
      title,
      description,
      category,
      legalSeverity,
      budgetImpact: budgetImpact || 0,
      status: 'abierta',
      createdAt: new Date().toISOString(),
    };

    onUpdateIncidents([...incidents, newInc]);
    setTitle('');
    setDescription('');
    setBudgetImpact(0);
    setIsAdding(false);
  };

  const handleToggleStatus = (incId: string, status: ProjectIncidentItem['status']) => {
    const updated = incidents.map(i => i.id === incId ? { ...i, status } : i);
    onUpdateIncidents(updated);
  };

  const handleDeleteIncident = (incId: string) => {
    if (confirm('¿Eliminar esta incidencia?')) {
      onUpdateIncidents(incidents.filter(i => i.id !== incId));
    }
  };

  return (
    <div className={styles.contentCard}>
      {/* Header */}
      <div className={styles.sectionHeader}>
        <div>
          <h2 className={styles.sectionTitle}><AlertTriangle size={20} color="#EA580C" /> 7. Gestor de Incidencias y Modificaciones de Ejecución</h2>
          <p className={styles.sectionSubtitle}>
            Registra cualquier desviación durante la ejecución (bajas IT, cambios de técnico, prórrogas o trasvases presupuestarios) y evalúa su régimen legal de autorización.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className={styles.saveBtn}
          style={{ background: '#0D3A5F', color: 'white' }}
        >
          <Plus size={16} /> Registrar Nueva Incidencia
        </button>
      </div>

      {/* Formulario de Alta de Incidencia */}
      {isAdding && (
        <div style={{ background: '#FFF7ED', border: '1.5px solid #FDBA74', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.5rem' }}>
          <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', fontWeight: 800, color: '#9A3412', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
            <AlertTriangle size={18} color="#EA580C" /> Nueva Incidencia / Solicitud de Modificación
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7C2D12', display: 'block', marginBottom: '0.2rem' }}>Título de la Incidencia</label>
              <input
                type="text"
                placeholder="Ej: Baja médica por IT de Elena Gómez y sustitución..."
                className={styles.input}
                value={title}
                onChange={e => setTitle(e.target.value)}
              />
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7C2D12', display: 'block', marginBottom: '0.2rem' }}>Categoría de Incidencia</label>
              <select
                className={styles.select}
                style={{ width: '100%' }}
                value={category}
                onChange={e => setCategory(e.target.value as IncidentCategory)}
              >
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>{v}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7C2D12', display: 'block', marginBottom: '0.2rem' }}>Régimen de Autorización Legal</label>
              <select
                className={styles.select}
                style={{ width: '100%' }}
                value={legalSeverity}
                onChange={e => setLegalSeverity(e.target.value as IncidentLegalSeverity)}
              >
                {Object.entries(SEVERITY_INFO).map(([k, v]) => (
                  <option key={k} value={k}>{v.label}</option>
                ))}
              </select>
            </div>

            <div>
              <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7C2D12', display: 'block', marginBottom: '0.2rem' }}>Impacto Económico Estimado (€)</label>
              <input
                type="number"
                placeholder="0 €"
                className={styles.input}
                value={budgetImpact}
                onChange={e => setBudgetImpact(parseFloat(e.target.value) || 0)}
              />
            </div>
          </div>

          <div style={{ marginBottom: '0.75rem' }}>
            <label style={{ fontSize: '0.75rem', fontWeight: 700, color: '#7C2D12', display: 'block', marginBottom: '0.2rem' }}>Descripción y Justificación Técnica</label>
            <textarea
              placeholder="Explica detalladamente la causa sobrevenida, las medidas correctoras aplicadas y la documentación probatoria..."
              className={styles.textarea}
              style={{ minHeight: '75px' }}
              value={description}
              onChange={e => setDescription(e.target.value)}
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button type="button" onClick={() => setIsAdding(false)} className={styles.exportBtn}>
              Cancelar
            </button>
            <button type="button" onClick={handleAddIncident} className={styles.saveBtn}>
              Guardar Incidencia
            </button>
          </div>
        </div>
      )}

      {/* Lista de Incidencias Registradas */}
      <div className={styles.tableWrapper}>
        <table className={styles.table}>
          <thead>
            <tr>
              <th style={{ minWidth: '220px' }}>Incidencia / Motivo</th>
              <th>Categoría</th>
              <th>Calificación Legal</th>
              <th className={styles.numCol}>Impacto €</th>
              <th>Estado Administrativo</th>
              <th></th>
            </tr>
          </thead>
          <tbody>
            {incidents.length === 0 ? (
              <tr>
                <td colSpan={6} style={{ textAlign: 'center', color: '#64748B', padding: '2.5rem' }}>
                  No se han registrado incidencias en la ejecución. El proyecto avanza conforme al plan inicial.
                </td>
              </tr>
            ) : (
              incidents.map((inc) => {
                const sev = SEVERITY_INFO[inc.legalSeverity] || SEVERITY_INFO.no_determinado;

                return (
                  <tr key={inc.id}>
                    <td>
                      <div>
                        <strong style={{ color: '#0D3A5F', fontSize: '0.9375rem' }}>{inc.title}</strong>
                        <p style={{ margin: '0.25rem 0 0 0', fontSize: '0.8125rem', color: '#475569' }}>
                          {inc.description}
                        </p>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8125rem', color: '#475569', fontWeight: 600 }}>
                        {CATEGORY_LABELS[inc.category] || inc.category}
                      </span>
                    </td>
                    <td>
                      <div>
                        <span className={sev.tagClass}>
                          {sev.label}
                        </span>
                        <div style={{ fontSize: '0.6875rem', color: '#64748B', marginTop: '0.2rem' }}>
                          {sev.desc}
                        </div>
                      </div>
                    </td>
                    <td className={styles.numCol}>
                      <span style={{ fontWeight: 800, color: inc.budgetImpact && inc.budgetImpact > 0 ? '#DC2626' : '#64748B' }}>
                        {formatCurrency(inc.budgetImpact || 0)}
                      </span>
                    </td>
                    <td>
                      <select
                        value={inc.status}
                        onChange={e => handleToggleStatus(inc.id, e.target.value as ProjectIncidentItem['status'])}
                        style={{
                          padding: '0.25rem 0.5rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 800,
                          background: inc.status === 'autorizada' || inc.status === 'resuelta' ? '#DCFCE7' : inc.status === 'solicitada' ? '#EAF5FB' : '#FEF3C7',
                          color: inc.status === 'autorizada' || inc.status === 'resuelta' ? '#166534' : inc.status === 'solicitada' ? '#0D3A5F' : '#92400E',
                          border: '1px solid #CBD5E1'
                        }}
                      >
                        <option value="abierta">⚠️ Abierta</option>
                        <option value="solicitada">📨 Solicitada Autorización</option>
                        <option value="autorizada">✓ Autorizada por Financiador</option>
                        <option value="resuelta">✅ Resuelta</option>
                        <option value="rechazada">✕ Denegada / Desestimada</option>
                      </select>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleDeleteIncident(inc.id)}
                        className={styles.deleteIconBtn}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default IncidenciasTab;
