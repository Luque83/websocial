'use client';

import React, { useState } from 'react';
import { 
  FileSpreadsheet, 
  Users, 
  FolderKanban, 
  Save, 
  CheckCircle2, 
  AlertTriangle, 
  AlertCircle, 
  Download, 
  ShieldCheck, 
  TrendingUp,
  Building2,
  Clock,
  ArrowRight
} from 'lucide-react';
import Link from 'next/link';
import type { Worker, ProjectAllocation } from '@/config/staff';
import { savePersonalMatrixAction } from '@/app/actions/personal';
import styles from './matriz.module.css';

interface GlobalImputationMatrixProps {
  initialWorkers: Worker[];
  projects: Array<{ id: string; name: string }>;
}

export function GlobalImputationMatrix({ initialWorkers, projects }: GlobalImputationMatrixProps) {
  // Ensure each worker has allocations array for all projects
  const [workers, setWorkers] = useState<Worker[]>(() => {
    return initialWorkers.map(w => {
      const existingAllocations = w.allocations || [];
      const completeAllocations: ProjectAllocation[] = [
        ...projects.map(p => {
          const found = existingAllocations.find(a => a.projectId === p.id);
          return found || {
            id: `alloc-${w.id}-${p.id}`,
            projectId: p.id,
            projectName: p.name,
            weeklyHours: 0,
            months: 12,
          };
        }),
        existingAllocations.find(a => a.projectId === 'sede') || {
          id: `alloc-${w.id}-sede`,
          projectId: 'sede',
          projectName: 'Sede / Estructura General',
          weeklyHours: 0,
          months: 12,
        }
      ];

      return {
        ...w,
        allocations: completeAllocations,
      };
    });
  });

  const [isSaving, setIsSaving] = useState(false);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 4000);
  };

  const handleHourChange = (workerIdx: number, projectTargetId: string, hours: number) => {
    const updated = [...workers];
    const targetWorker = updated[workerIdx];
    const allocIdx = targetWorker.allocations.findIndex(a => a.projectId === projectTargetId);

    if (allocIdx >= 0) {
      targetWorker.allocations[allocIdx].weeklyHours = Math.max(0, hours);
    } else {
      targetWorker.allocations.push({
        id: `alloc-${targetWorker.id}-${projectTargetId}`,
        projectId: projectTargetId,
        projectName: projects.find(p => p.id === projectTargetId)?.name || 'Proyecto',
        weeklyHours: Math.max(0, hours),
        months: 12,
      });
    }

    setWorkers(updated);
  };

  const handleSaveAndSync = async () => {
    setIsSaving(true);
    try {
      const res = await savePersonalMatrixAction({ workers }, undefined, true);
      if (res.success) {
        showToast('¡Matriz sincronizada con éxito con los presupuestos de todos los proyectos!');
      } else {
        alert(res.error || 'Error al guardar la matriz.');
      }
    } catch {
      alert('Error inesperado al sincronizar.');
    } finally {
      setIsSaving(false);
    }
  };

  // KPIs
  const totalAllocatedHours = workers.reduce((acc, w) => {
    return acc + (w.allocations || []).reduce((sum, a) => sum + (a.weeklyHours || 0), 0);
  }, 0);

  const overAllocatedWorkers = workers.filter(w => {
    const sum = (w.allocations || []).reduce((s, a) => s + (a.weeklyHours || 0), 0);
    return sum > (w.maxWeeklyHours || 37.5);
  }).length;

  const underAllocatedWorkers = workers.filter(w => {
    const sum = (w.allocations || []).reduce((s, a) => s + (a.weeklyHours || 0), 0);
    return sum < ((w.maxWeeklyHours || 37.5) * 0.8);
  }).length;

  return (
    <div className={styles.container}>
      {/* Toast Notification */}
      {toastMessage && (
        <div style={{
          position: 'fixed',
          bottom: '24px',
          right: '24px',
          background: '#0D3A5F',
          color: 'white',
          padding: '0.85rem 1.5rem',
          borderRadius: '10px',
          boxShadow: '0 10px 25px rgba(0,0,0,0.2)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          gap: '0.5rem',
          fontSize: '0.875rem',
          fontWeight: 700,
          border: '1.5px solid #16C7B2'
        }}>
          <CheckCircle2 size={18} color="#16C7B2" />
          <span>{toastMessage}</span>
        </div>
      )}

      {/* Header */}
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Matriz de Imputación de Personal Multiproyecto</h1>
          <p className={styles.subtitle}>
            Supervisa y gestiona <strong>de un plumazo</strong> la distribución horaria y económica de tu plantilla entre todos los proyectos y convocatorias activas de tu entidad.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link
            href="/dashboard/personal"
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: '#EAF5FB',
              color: '#0D3A5F',
              border: '1.5px solid #D5ECF8',
              padding: '0.6rem 1.15rem',
              borderRadius: '8px',
              fontSize: '0.875rem',
              fontWeight: 800,
              textDecoration: 'none'
            }}
          >
            <Users size={16} color="#009E96" /> Configurar Plantilla y Salarios
          </Link>
          <button
            type="button"
            onClick={handleSaveAndSync}
            disabled={isSaving}
            className={styles.btnPrimary}
          >
            <Save size={16} /> {isSaving ? 'Sincronizando...' : 'Guardar y Trasladar a Proyectos'}
          </button>
        </div>
      </div>

      {/* KPIs */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard} style={{ borderTop: '4px solid #16C7B2' }}>
          <div className={styles.statIcon} style={{ background: '#EAF5FB', color: '#16C7B2' }}>
            <Users size={24} />
          </div>
          <div>
            <div className={styles.statVal}>{workers.length}</div>
            <div className={styles.statLabel}>Trabajadores en Matriz</div>
          </div>
        </div>

        <div className={styles.statCard} style={{ borderTop: '4px solid #009E96' }}>
          <div className={styles.statIcon} style={{ background: '#EAF5FB', color: '#009E96' }}>
            <FolderKanban size={24} />
          </div>
          <div>
            <div className={styles.statVal}>{projects.length}</div>
            <div className={styles.statLabel}>Proyectos en Ejecución</div>
          </div>
        </div>

        <div className={styles.statCard} style={{ borderTop: '4px solid #0D3A5F' }}>
          <div className={styles.statIcon} style={{ background: '#EAF5FB', color: '#0D3A5F' }}>
            <Clock size={24} />
          </div>
          <div>
            <div className={styles.statVal}>{totalAllocatedHours} h</div>
            <div className={styles.statLabel}>Horas Imputadas / Semana</div>
          </div>
        </div>

        <div className={styles.statCard} style={{ borderTop: `4px solid ${overAllocatedWorkers > 0 ? '#EF4444' : '#10B981'}` }}>
          <div className={styles.statIcon} style={{ background: overAllocatedWorkers > 0 ? '#FEE2E2' : '#DCFCE7', color: overAllocatedWorkers > 0 ? '#DC2626' : '#16A34A' }}>
            {overAllocatedWorkers > 0 ? <AlertTriangle size={24} /> : <ShieldCheck size={24} />}
          </div>
          <div>
            <div className={styles.statVal} style={{ color: overAllocatedWorkers > 0 ? '#DC2626' : '#16A34A' }}>
              {overAllocatedWorkers > 0 ? `${overAllocatedWorkers} En Riesgo` : '0 Sobreimputaciones'}
            </div>
            <div className={styles.statLabel}>
              {overAllocatedWorkers > 0 ? 'Superan el 100% de jornada' : 'Plantilla Conforme a Ley'}
            </div>
          </div>
        </div>
      </div>

      {/* Matriz Table */}
      <div className={styles.matrixCard}>
        <div className={styles.matrixHeader}>
          <h2 className={styles.matrixTitle}>
            <FileSpreadsheet size={20} color="#16C7B2" /> Matriz Cruzada: Trabajadores × Proyectos (Horas / Semana)
          </h2>
          <span style={{ fontSize: '0.8125rem', color: '#5C7E9B', fontWeight: 600 }}>
            {underAllocatedWorkers > 0 && <span style={{ color: '#D97706', marginRight: '1rem' }}>🟡 {underAllocatedWorkers} con horas libres</span>}
            {overAllocatedWorkers > 0 && <span style={{ color: '#DC2626' }}>🔴 {overAllocatedWorkers} con sobreimputación</span>}
          </span>
        </div>

        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th style={{ minWidth: '220px' }}>Trabajador/a y Puesto</th>
                <th style={{ minWidth: '110px' }}>Jornada Max</th>
                {projects.map(p => (
                  <th key={p.id} style={{ minWidth: '140px' }} title={p.name}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                      <FolderKanban size={14} color="#16C7B2" />
                      <span>{p.name.length > 18 ? p.name.substring(0, 18) + '...' : p.name}</span>
                    </div>
                  </th>
                ))}
                <th style={{ minWidth: '140px' }}>Sede / Estructura</th>
                <th style={{ minWidth: '100px' }} className={styles.numCol}>Total Imputado</th>
                <th style={{ minWidth: '80px' }} className={styles.numCol}>% Jornada</th>
                <th style={{ minWidth: '130px' }}>Estado Legal</th>
              </tr>
            </thead>
            <tbody>
              {workers.map((worker, workerIdx) => {
                const allocations = worker.allocations || [];
                const totalHours = allocations.reduce((sum, a) => sum + (a.weeklyHours || 0), 0);
                const maxHours = worker.maxWeeklyHours || 37.5;
                const pct = (totalHours / maxHours) * 100;
                const isOver = totalHours > maxHours;
                const isUnder = pct < 80;

                return (
                  <tr key={worker.id} style={{ background: isOver ? '#FEF2F2' : 'inherit' }}>
                    <td>
                      <div>
                        <strong style={{ color: '#0D3A5F', fontSize: '0.9375rem' }}>{worker.name || 'Sin nombre'}</strong>
                        <div style={{ fontSize: '0.75rem', color: '#5C7E9B' }}>
                          {worker.role} · <span style={{ color: '#009E96', fontWeight: 700 }}>{worker.salaryMonthly} €/m</span>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#475569' }}>
                        {maxHours} h/sem
                      </span>
                    </td>
                    {projects.map(p => {
                      const alloc = allocations.find(a => a.projectId === p.id);
                      const currentHours = alloc?.weeklyHours || 0;

                      return (
                        <td key={p.id}>
                          <input
                            type="number"
                            min="0"
                            max={maxHours}
                            step="0.5"
                            className={styles.inputNumber}
                            value={currentHours}
                            onChange={e => handleHourChange(workerIdx, p.id, parseFloat(e.target.value) || 0)}
                          />
                        </td>
                      );
                    })}
                    <td>
                      {(() => {
                        const sedeAlloc = allocations.find(a => a.projectId === 'sede');
                        const sedeHours = sedeAlloc?.weeklyHours || 0;
                        return (
                          <input
                            type="number"
                            min="0"
                            max={maxHours}
                            step="0.5"
                            className={styles.inputNumber}
                            value={sedeHours}
                            onChange={e => handleHourChange(workerIdx, 'sede', parseFloat(e.target.value) || 0)}
                          />
                        );
                      })()}
                    </td>
                    <td className={styles.numCol}>
                      <strong style={{ fontSize: '0.9375rem', color: isOver ? '#DC2626' : '#0D3A5F' }}>
                        {totalHours} h
                      </strong>
                    </td>
                    <td className={styles.numCol}>
                      <span style={{ 
                        fontSize: '0.875rem', 
                        fontWeight: 800, 
                        color: isOver ? '#DC2626' : pct >= 80 ? '#166534' : '#D97706' 
                      }}>
                        {pct.toFixed(0)}%
                      </span>
                    </td>
                    <td>
                      {isOver ? (
                        <span className={styles.badgeDanger}>
                          <AlertTriangle size={12} /> Exceso ({totalHours - maxHours}h)
                        </span>
                      ) : isUnder ? (
                        <span className={styles.badgeWarn}>
                          <Clock size={12} /> Libre ({(maxHours - totalHours).toFixed(1)}h)
                        </span>
                      ) : (
                        <span className={styles.badgeOk}>
                          <CheckCircle2 size={12} /> 100% Imputado
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>

        <div style={{ marginTop: '1.25rem', padding: '0.85rem 1.25rem', background: '#F8FAFC', borderRadius: '10px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '0.75rem', border: '1px solid #E2E8F0' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: '#475569' }}>
            <ShieldCheck size={18} color="#16C7B2" />
            <span>Al pulsar en <strong>Guardar y Trasladar</strong>, las horas y costes se actualizarán automáticamente en la <strong>Pestaña de Personal y Presupuesto</strong> de cada proyecto.</span>
          </div>
          <button
            type="button"
            onClick={handleSaveAndSync}
            disabled={isSaving}
            className={styles.btnPrimary}
            style={{ fontSize: '0.8125rem', padding: '0.45rem 1rem' }}
          >
            <Save size={14} /> Sincronizar Proyectos
          </button>
        </div>
      </div>
    </div>
  );
}

export default GlobalImputationMatrix;
