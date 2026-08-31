'use client';

import React, { useState, useTransition } from 'react';
import { 
  Clock, 
  Plus, 
  Trash2,
  CheckCircle2,
  AlertTriangle,
} from 'lucide-react';
import type { DeadlineItem } from '@/types/grant-lifecycle';
import { saveGlobalDeadlinesAction } from '@/app/actions/grant-lifecycle';
import styles from '../personal/personal.module.css';

interface DeadlinesManagerProps {
  initialDeadlines: DeadlineItem[];
}

const TYPE_LABELS: Record<DeadlineItem['deadlineType'], { label: string; color: string; bg: string }> = {
  solicitud: { label: 'Cierre de Solicitud', color: '#1D4ED8', bg: '#EFF6FF' },
  subsanacion: { label: 'Subsanación Urgente', color: '#DC2626', bg: '#FEE2E2' },
  reformulacion: { label: 'Plazo de Reformulación', color: '#0D9488', bg: '#F0FDFA' },
  informe_intermedio: { label: 'Informe de Avance', color: '#D97706', bg: '#FEF3C7' },
  justificacion_final: { label: 'Justificación Oficial Final', color: '#9333EA', bg: '#FAF5FF' },
  alegaciones: { label: 'Plazo de Alegaciones', color: '#475569', bg: '#F1F5F9' },
};

export function DeadlinesManager({ initialDeadlines }: DeadlinesManagerProps) {
  const [deadlines, setDeadlines] = useState<DeadlineItem[]>(initialDeadlines);
  const [isAdding, setIsAdding] = useState(false);
  const [title, setTitle] = useState('');
  const [deadlineDate, setDeadlineDate] = useState('');
  const [deadlineType, setDeadlineType] = useState<DeadlineItem['deadlineType']>('solicitud');
  const [toast, setToast] = useState<string | null>(null);
  const [isPending, startTransition] = useTransition();

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3500);
  };

  const persistDeadlines = (updated: DeadlineItem[]) => {
    startTransition(async () => {
      const res = await saveGlobalDeadlinesAction(updated);
      if (!res.success) {
        showToast('Error al guardar los plazos. Inténtalo de nuevo.');
      }
    });
  };

  const handleAdd = () => {
    if (!title || !deadlineDate) {
      showToast('Por favor introduce el título y la fecha límite');
      return;
    }

    const newD: DeadlineItem = {
      id: crypto.randomUUID(),
      title,
      deadlineDate,
      deadlineType,
      isCompleted: false,
      reminderDays: 5,
    };

    const updated = [...deadlines, newD];
    setDeadlines(updated);
    persistDeadlines(updated);
    setTitle('');
    setDeadlineDate('');
    setIsAdding(false);
    showToast('Plazo guardado correctamente');
  };

  const handleToggleCompleted = (id: string) => {
    const updated = deadlines.map(d => d.id === id ? { ...d, isCompleted: !d.isCompleted } : d);
    setDeadlines(updated);
    persistDeadlines(updated);
  };

  const handleDelete = (id: string) => {
    const updated = deadlines.filter(d => d.id !== id);
    setDeadlines(updated);
    persistDeadlines(updated);
    showToast('Plazo eliminado');
  };

  return (
    <div className={styles.container}>
      {/* Toast */}
      {toast && (
        <div style={{
          position: 'fixed', bottom: '24px', right: '24px',
          background: '#0D3A5F', color: 'white',
          padding: '0.85rem 1.5rem', borderRadius: '10px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          zIndex: 9999, fontSize: '0.875rem', fontWeight: 700,
          border: '1.5px solid #16C7B2'
        }}>
          {toast}
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Motor de Plazos y Alertas Críticas</h1>
          <p className={styles.subtitle}>
            Supervisión centralizada de fechas límite de presentación, requerimientos de subsanación, informes intermedios y justificaciones finales.
          </p>
        </div>
        <button
          type="button"
          onClick={() => setIsAdding(true)}
          className={styles.btnPrimary}
        >
          <Plus size={16} /> Añadir Hito o Plazo
        </button>
      </div>

      {isAdding && (
        <div style={{ background: '#F8FAFC', border: '1.5px solid #CBD5E1', borderRadius: '12px', padding: '1.25rem', marginBottom: '1.25rem' }}>
          <h3 style={{ margin: '0 0 0.75rem 0', fontSize: '1rem', fontWeight: 800, color: '#0D3A5F' }}>
            Nuevo Plazo Administrativo
          </h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.75rem', marginBottom: '0.75rem' }}>
            <input
              type="text"
              placeholder="Descripción del hito o requerimiento..."
              className={styles.input}
              value={title}
              onChange={e => setTitle(e.target.value)}
            />
            <select
              className={styles.select}
              value={deadlineType}
              onChange={e => setDeadlineType(e.target.value as DeadlineItem['deadlineType'])}
            >
              {Object.entries(TYPE_LABELS).map(([k, v]) => (
                <option key={k} value={k}>{v.label}</option>
              ))}
            </select>
            <input
              type="date"
              className={styles.input}
              value={deadlineDate}
              onChange={e => setDeadlineDate(e.target.value)}
            />
          </div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.5rem' }}>
            <button type="button" onClick={() => setIsAdding(false)} className={styles.btnSecondary} style={{ background: '#e2e8f0', color: '#334155' }}>
              Cancelar
            </button>
            <button type="button" onClick={handleAdd} className={styles.btnPrimary} disabled={isPending}>
              {isPending ? 'Guardando...' : 'Guardar Plazo'}
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className={styles.tableCard}>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Hito / Evento Administrativo</th>
                <th>Tipo de Plazo</th>
                <th>Fecha Límite</th>
                <th>Cuenta Atrás</th>
                <th>Estado</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {deadlines.length === 0 && (
                <tr>
                  <td colSpan={6} style={{ textAlign: 'center', padding: '2rem', color: '#94A3B8', fontSize: '0.875rem' }}>
                    No hay plazos registrados. Añade el primer hito con el botón superior.
                  </td>
                </tr>
              )}
              {deadlines.map(d => {
                const deadline = new Date(d.deadlineDate);
                const now = new Date();
                const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));
                const isUrgent = diffDays <= 5 && !d.isCompleted;
                const isPast = diffDays < 0 && !d.isCompleted;
                const typeInfo = TYPE_LABELS[d.deadlineType] || TYPE_LABELS.solicitud;

                return (
                  <tr key={d.id} style={{ background: isPast ? '#FFF5F5' : isUrgent ? '#FFFBEB' : 'inherit' }}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        {isPast ? <AlertTriangle size={18} color="#DC2626" /> : <Clock size={18} color={isUrgent ? '#D97706' : '#0D3A5F'} />}
                        <strong style={{ color: d.isCompleted ? '#64748B' : '#0D3A5F', textDecoration: d.isCompleted ? 'line-through' : 'none' }}>
                          {d.title}
                        </strong>
                      </div>
                    </td>
                    <td>
                      <span style={{ background: typeInfo.bg, color: typeInfo.color, fontWeight: 800, fontSize: '0.75rem', padding: '0.2rem 0.55rem', borderRadius: '6px' }}>
                        {typeInfo.label}
                      </span>
                    </td>
                    <td>
                      <strong style={{ color: isPast ? '#DC2626' : 'inherit' }}>{d.deadlineDate}</strong>
                    </td>
                    <td>
                      {d.isCompleted ? (
                        <span style={{ color: '#166534', fontWeight: 800, fontSize: '0.75rem' }}>✓ Completado</span>
                      ) : isPast ? (
                        <span style={{ color: '#DC2626', fontWeight: 800, fontSize: '0.75rem' }}>⚠️ Vencido hace {Math.abs(diffDays)} días</span>
                      ) : (
                        <span style={{ color: isUrgent ? '#D97706' : '#166534', fontWeight: 800, fontSize: '0.75rem' }}>
                          {diffDays === 0 ? '¡Vence Hoy!' : `${diffDays} días restantes`}
                        </span>
                      )}
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleToggleCompleted(d.id)}
                        disabled={isPending}
                        style={{
                          background: d.isCompleted ? '#DCFCE7' : '#F1F5F9',
                          color: d.isCompleted ? '#166534' : '#475569',
                          border: '1px solid #CBD5E1',
                          padding: '0.25rem 0.6rem',
                          borderRadius: '6px',
                          fontSize: '0.75rem',
                          fontWeight: 700,
                          cursor: isPending ? 'wait' : 'pointer',
                        }}
                      >
                        {d.isCompleted ? <CheckCircle2 size={14} style={{ display: 'inline', marginRight: '4px' }} /> : null}
                        {d.isCompleted ? 'Hecho' : 'Marcar Hecho'}
                      </button>
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => handleDelete(d.id)}
                        disabled={isPending}
                        className={styles.deleteBtn}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

export default DeadlinesManager;
