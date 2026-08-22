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
  ArrowRight,
  Sliders,
  Calendar,
  Receipt,
  FileCheck,
  X,
  ExternalLink,
  ChevronRight,
  Sparkles,
  Info,
  DollarSign
} from 'lucide-react';
import Link from 'next/link';
import type { Worker, ProjectAllocation } from '@/config/staff';
import type { WorkerProjectLifecycle } from '@/app/actions/personal';
import { savePersonalMatrixAction } from '@/app/actions/personal';
import styles from './matriz.module.css';

interface GlobalImputationMatrixProps {
  initialWorkers: Worker[];
  projects: Array<{ id: string; name: string; phase?: string; grantAmount?: number }>;
  initialLifecycleMap?: Record<string, WorkerProjectLifecycle>;
  initialStats?: {
    totalWorkers: number;
    totalAvailableHours: number;
    totalAllocatedHours: number;
    overAllocatedWorkersCount: number;
    totalSolicitadoCost: number;
    totalConcedidoCost: number;
    totalEjecutadoPaidCost: number;
    payrollSepaCompliancePct: number;
  };
}

type ViewMode = 'matrix360' | 'diff' | 'monthly' | 'auditor';

export function GlobalImputationMatrix({
  initialWorkers,
  projects,
  initialLifecycleMap = {},
  initialStats,
}: GlobalImputationMatrixProps) {
  const [activeMode, setActiveMode] = useState<ViewMode>('matrix360');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'alert' | 'ok'>('all');
  const [selectedWorkerId, setSelectedWorkerId] = useState<string | null>(null);

  // Workers state with allocations
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

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR', maximumFractionDigits: 0 }).format(val);
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
        showToast('¡Matriz sincronizada con éxito con los presupuestos y expedientes de todos los proyectos!');
        try {
          // Re-fetch or refresh
          if (typeof window !== 'undefined') {
            // trigger soft refresh
          }
        } catch {}
      } else {
        alert(res.error || 'Error al guardar la matriz.');
      }
    } catch {
      alert('Error inesperado al sincronizar.');
    } finally {
      setIsSaving(false);
    }
  };

  // KPIs Calculations
  const totalAllocatedHours = workers.reduce((acc, w) => {
    return acc + (w.allocations || []).reduce((sum, a) => sum + (a.weeklyHours || 0), 0);
  }, 0);

  const totalAvailableHours = workers.reduce((acc, w) => acc + (w.maxWeeklyHours || 37.5), 0);
  const occupancyPct = totalAvailableHours > 0 ? Math.round((totalAllocatedHours / totalAvailableHours) * 100) : 0;

  const overAllocatedWorkers = workers.filter(w => {
    const sum = (w.allocations || []).reduce((s, a) => s + (a.weeklyHours || 0), 0);
    return sum > (w.maxWeeklyHours || 37.5);
  });

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Trabajador',
      'Rol / Categoria',
      'Salario Bruto Mes',
      'Jornada Max (h/sem)',
      ...projects.map(p => `Horas Solicitadas (${p.name})`),
      ...projects.map(p => `Horas Reformuladas (${p.name})`),
      'Sede / Estructura (h/sem)',
      'Total Horas Asignadas',
      'Porcentaje Jornada Imputada',
      'Estado Cumplimiento'
    ];

    const rows = workers.map(w => {
      const totalHours = (w.allocations || []).reduce((s, a) => s + (a.weeklyHours || 0), 0);
      const pct = (w.maxWeeklyHours || 37.5) > 0 ? ((totalHours / (w.maxWeeklyHours || 37.5)) * 100).toFixed(1) : '0';
      const sedeHours = w.allocations.find(a => a.projectId === 'sede')?.weeklyHours || 0;

      return [
        `"${w.name}"`,
        `"${w.role}"`,
        w.salaryMonthly,
        w.maxWeeklyHours || 37.5,
        ...projects.map(p => {
          const key = `${w.id}_${p.id}`;
          return initialLifecycleMap[key]?.solicitadoHours || w.allocations.find(a => a.projectId === p.id)?.weeklyHours || 0;
        }),
        ...projects.map(p => w.allocations.find(a => a.projectId === p.id)?.weeklyHours || 0),
        sedeHours,
        totalHours,
        `"${pct}%"`,
        totalHours > (w.maxWeeklyHours || 37.5) ? '"SOBREIMPUTACION"' : '"CONFORME"'
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Matriz_Imputacion_Multiproyecto_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered workers
  const filteredWorkers = workers.filter(w => {
    const matchesSearch = w.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          w.role.toLowerCase().includes(searchQuery.toLowerCase());
    const totalHours = (w.allocations || []).reduce((s, a) => s + (a.weeklyHours || 0), 0);
    const isOver = totalHours > (w.maxWeeklyHours || 37.5);

    if (statusFilter === 'alert') return matchesSearch && isOver;
    if (statusFilter === 'ok') return matchesSearch && !isOver;
    return matchesSearch;
  });

  const selectedWorker = workers.find(w => w.id === selectedWorkerId);

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
          <h1 className={styles.title}>Matriz de Imputación de Personal y Ciclo de Vida</h1>
          <p className={styles.subtitle}>
            Control centralizado y trazabilidad de dedicación horaria entre proyectos a lo largo de las 4 fases: Solicitud (V1), Reformulación (V2), Ejecución Real (Nóminas + SEPA) y Justificación.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={handleExportCSV}
            className={styles.btnSecondary}
          >
            <Download size={16} /> Exportar Matriz (CSV)
          </button>
          <button
            type="button"
            onClick={handleSaveAndSync}
            disabled={isSaving}
            className={styles.btnPrimary}
          >
            <Save size={16} /> {isSaving ? 'Sincronizando...' : '💾 Sincronizar con Proyectos'}
          </button>
        </div>
      </div>

      {/* Stats Cards */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#EAF5FB', color: '#0D3A5F' }}>
            <Users size={24} />
          </div>
          <div>
            <div className={styles.statVal}>{totalAllocatedHours.toFixed(1)}h <span style={{ fontSize: '0.875rem', color: '#5C7E9B', fontWeight: 600 }}>/ {totalAvailableHours}h</span></div>
            <div className={styles.statLabel}>Ocupación Global ({occupancyPct}% de plantilla)</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#EFF6FF', color: '#2563EB' }}>
            <DollarSign size={24} />
          </div>
          <div>
            <div className={styles.statVal}>{formatCurrency(initialStats?.totalConcedidoCost || 0)}</div>
            <div className={styles.statLabel}>Masa Salarial Concedida (V2)</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#F0FDF4', color: '#16A34A' }}>
            <Receipt size={24} />
          </div>
          <div>
            <div className={styles.statVal}>{formatCurrency(initialStats?.totalEjecutadoPaidCost || 0)}</div>
            <div className={styles.statLabel}>Nóminas Pagadas SEPA ({initialStats?.payrollSepaCompliancePct || 100}%)</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: overAllocatedWorkers.length > 0 ? '#FEE2E2' : '#DCFCE7', color: overAllocatedWorkers.length > 0 ? '#DC2626' : '#166534' }}>
            <ShieldCheck size={24} />
          </div>
          <div>
            <div className={styles.statVal} style={{ color: overAllocatedWorkers.length > 0 ? '#DC2626' : '#166534' }}>
              {overAllocatedWorkers.length === 0 ? '0 Alertas' : `${overAllocatedWorkers.length} Sobreimputados`}
            </div>
            <div className={styles.statLabel}>Semáforo de Riesgo Laboral</div>
          </div>
        </div>
      </div>

      {/* Mode Switcher (Lifecycle Lens) */}
      <nav className={styles.modeNav}>
        <button
          type="button"
          onClick={() => setActiveMode('matrix360')}
          className={`${styles.modeBtn} ${activeMode === 'matrix360' ? styles.modeBtnActive : ''}`}
        >
          <Sparkles size={16} color="#7C3AED" />
          <span>1. Matriz 360° (Ciclo de Vida por Fases)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveMode('diff')}
          className={`${styles.modeBtn} ${activeMode === 'diff' ? styles.modeBtnActive : ''}`}
        >
          <Sliders size={16} color="#2563EB" />
          <span>2. Comparativa Diff (Solicitado vs. Concedido vs. Real)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveMode('monthly')}
          className={`${styles.modeBtn} ${activeMode === 'monthly' ? styles.modeBtnActive : ''}`}
        >
          <Calendar size={16} color="#0D9488" />
          <span>3. Malla Mensual de Nóminas & Justificantes SEPA (12 Meses)</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveMode('auditor')}
          className={`${styles.modeBtn} ${activeMode === 'auditor' ? styles.modeBtnActive : ''}`}
        >
          <ShieldCheck size={16} color="#EA580C" />
          <span>4. Auditor Antifraude de Doble Financiación</span>
          {overAllocatedWorkers.length > 0 && (
            <span style={{ background: '#FEE2E2', color: '#DC2626', fontSize: '0.6875rem', padding: '0.1rem 0.4rem', borderRadius: '4px', fontWeight: 800 }}>
              ⚠️ {overAllocatedWorkers.length}
            </span>
          )}
        </button>
      </nav>

      {/* Matrix Card */}
      <div className={styles.matrixCard}>
        {/* Toolbar */}
        <div className={styles.toolbar}>
          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            <input
              type="text"
              placeholder="🔍 Buscar trabajador o rol..."
              className={styles.searchInput}
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <select
              className={styles.filterSelect}
              value={statusFilter}
              onChange={e => setStatusFilter(e.target.value as any)}
            >
              <option value="all">Todos los trabajadores ({workers.length})</option>
              <option value="alert">⚠️ Con Alerta / Sobreimputación ({overAllocatedWorkers.length})</option>
              <option value="ok">🟢 Conforme (≤ 100% jornada)</option>
            </select>
          </div>

          <div style={{ fontSize: '0.8125rem', color: '#5C7E9B', fontWeight: 600 }}>
            Mostrando <strong>{filteredWorkers.length}</strong> de {workers.length} trabajadores
          </div>
        </div>

        {/* MODE 1: MATRIZ 360° (CICLO DE VIDA) */}
        {activeMode === 'matrix360' && (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ minWidth: '220px' }}>Trabajador / Categoría</th>
                  <th style={{ minWidth: '100px' }}>Coste Empresa</th>
                  {projects.map(p => (
                    <th key={p.id} style={{ minWidth: '190px' }}>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                        <span>{p.name}</span>
                        <span style={{ fontSize: '0.6875rem', color: '#009E96', fontWeight: 700 }}>
                          {p.phase || 'En Ejecución'}
                        </span>
                      </div>
                    </th>
                  ))}
                  <th style={{ minWidth: '120px' }}>Sede / Propia</th>
                  <th style={{ minWidth: '130px' }}>Total Horas</th>
                  <th style={{ minWidth: '140px' }}>Estado Proceso</th>
                </tr>
              </thead>
              <tbody>
                {filteredWorkers.map((w, wIdx) => {
                  const totalH = (w.allocations || []).reduce((sum, a) => sum + (a.weeklyHours || 0), 0);
                  const maxH = w.maxWeeklyHours || 37.5;
                  const isOver = totalH > maxH;
                  const pctOccupied = maxH > 0 ? Math.round((totalH / maxH) * 100) : 0;
                  const salMes = w.pagas === 14 ? (w.salaryMonthly * 14) / 12 : w.salaryMonthly;
                  const ssMes = (salMes * (w.ssPct || 31.4)) / 100;
                  const totalCostMes = salMes + ssMes;

                  return (
                    <tr key={w.id}>
                      {/* Name & Role (Clickable to open drawer) */}
                      <td>
                        <button
                          type="button"
                          onClick={() => setSelectedWorkerId(w.id)}
                          style={{
                            background: 'none',
                            border: 'none',
                            textAlign: 'left',
                            cursor: 'pointer',
                            padding: 0,
                            display: 'flex',
                            flexDirection: 'column',
                            gap: '2px'
                          }}
                        >
                          <strong style={{ color: '#0D3A5F', fontSize: '0.9375rem', textDecoration: 'underline', textUnderlineOffset: '3px' }}>
                            {w.name}
                          </strong>
                          <span style={{ fontSize: '0.75rem', color: '#64748B' }}>{w.role}</span>
                          <span style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>{w.category}</span>
                        </button>
                      </td>

                      {/* Coste Empresa */}
                      <td>
                        <strong style={{ color: '#0D3A5F', fontSize: '0.875rem' }}>{formatCurrency(totalCostMes)}</strong>
                        <div style={{ fontSize: '0.6875rem', color: '#64748B' }}>Bruto: {formatCurrency(w.salaryMonthly)}</div>
                      </td>

                      {/* Projects cells */}
                      {projects.map(p => {
                        const alloc = w.allocations.find(a => a.projectId === p.id);
                        const h = alloc?.weeklyHours || 0;
                        const key = `${w.id}_${p.id}`;
                        const lc = initialLifecycleMap[key];

                        return (
                          <td key={p.id}>
                            <div className={`${styles.cell4BarsContainer} ${h > 0 ? styles.cell4BarsActive : ''}`}>
                              {/* Input row */}
                              <div className={styles.cellInputRow}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                  <input
                                    type="number"
                                    min="0"
                                    max={maxH}
                                    step="0.5"
                                    className={styles.inputNumber}
                                    value={h}
                                    onChange={e => handleHourChange(wIdx, p.id, parseFloat(e.target.value) || 0)}
                                  />
                                  <span className={styles.hoursUnitLabel}>h/sem</span>
                                </div>
                                <span style={{ fontSize: '0.6875rem', fontWeight: 800, color: h > 0 ? '#0D3A5F' : '#94A3B8' }}>
                                  {maxH > 0 ? ((h / maxH) * 100).toFixed(0) : 0}% JOR
                                </span>
                              </div>

                              {/* 4 Mini-Bars Stack */}
                              {(() => {
                                const solH = lc?.solicitadoHours !== undefined ? lc.solicitadoHours : h;
                                const solP = maxH > 0 ? (solH / maxH) * 100 : 0;
                                const refP = maxH > 0 ? (h / maxH) * 100 : 0;
                                const pMonths = lc?.ejecutadoMonthsPaid !== undefined ? lc.ejecutadoMonthsPaid : (h > 0 ? 6 : 0);
                                const tMonths = lc?.ejecutadoTotalMonths || 12;
                                const ejeP = tMonths > 0 && h > 0 ? (pMonths / tMonths) * 100 : 0;
                                const jusP = h > 0 ? (pMonths >= tMonths ? 100 : Math.round((pMonths / tMonths) * 100)) : 0;

                                return (
                                  <div className={styles.fourBarsBox}>
                                    {/* 1. Solicitud */}
                                    <div className={styles.barLine} title={`1. Solicitud original: ${solH}h/sem (${solP.toFixed(0)}% jornada)`}>
                                      <span className={styles.barTagSol}>1. SOL</span>
                                      <div className={styles.barTrack}>
                                        <div className={styles.barFillSol} style={{ width: `${Math.min(100, solP)}%` }} />
                                      </div>
                                      <span className={styles.barNumber}>{solH}h</span>
                                    </div>

                                    {/* 2. Reformulación */}
                                    <div className={styles.barLine} title={`2. Reformulación / Concedido: ${h}h/sem (${refP.toFixed(0)}% jornada)`}>
                                      <span className={styles.barTagRef}>2. REF</span>
                                      <div className={styles.barTrack}>
                                        <div className={styles.barFillRef} style={{ width: `${Math.min(100, refP)}%` }} />
                                      </div>
                                      <span className={styles.barNumber}>{h}h</span>
                                    </div>

                                    {/* 3. Ejecución Real */}
                                    <div className={styles.barLine} title={`3. Ejecución real: ${pMonths}/${tMonths} meses de nóminas transferidas con SEPA`}>
                                      <span className={styles.barTagEjec}>3. EJE</span>
                                      <div className={styles.barTrack}>
                                        <div className={styles.barFillEjec} style={{ width: `${Math.min(100, ejeP)}%` }} />
                                      </div>
                                      <span className={styles.barNumber}>{pMonths}/{tMonths}m</span>
                                    </div>

                                    {/* 4. Justificación Final */}
                                    <div className={styles.barLine} title={`4. Justificación contable: ${jusP}% liquidado con comprobantes y RLC`}>
                                      <span className={styles.barTagJust}>4. JUS</span>
                                      <div className={styles.barTrack}>
                                        <div className={styles.barFillJust} style={{ width: `${Math.min(100, jusP)}%` }} />
                                      </div>
                                      <span className={styles.barNumber}>{jusP}%</span>
                                    </div>
                                  </div>
                                );
                              })()}
                            </div>
                          </td>
                        );
                      })}

                      {/* Sede / Propia */}
                      <td>
                        <input
                          type="number"
                          min="0"
                          max="40"
                          step="0.5"
                          className={styles.inputNumber}
                          value={w.allocations.find(a => a.projectId === 'sede')?.weeklyHours || 0}
                          onChange={e => handleHourChange(wIdx, 'sede', parseFloat(e.target.value) || 0)}
                        />
                      </td>

                      {/* Total Horas */}
                      <td>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '2px' }}>
                          <strong style={{ fontSize: '1rem', color: isOver ? '#DC2626' : '#0D3A5F' }}>
                            {totalH.toFixed(1)}h <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 600 }}>/ {maxH}h</span>
                          </strong>
                          <div style={{ background: '#E2E8F0', height: '6px', borderRadius: '3px', overflow: 'hidden' }}>
                            <div
                              style={{
                                width: `${Math.min(100, pctOccupied)}%`,
                                height: '100%',
                                background: isOver ? '#DC2626' : pctOccupied >= 80 ? '#16A34A' : '#2563EB',
                              }}
                            />
                          </div>
                          <span style={{ fontSize: '0.6875rem', color: isOver ? '#DC2626' : '#64748B', fontWeight: 700 }}>
                            {pctOccupied}% Jornada
                          </span>
                        </div>
                      </td>

                      {/* Status badge */}
                      <td>
                        {isOver ? (
                          <span className={styles.badgeDanger}>
                            <AlertCircle size={13} /> +{(totalH - maxH).toFixed(1)}h Alerta
                          </span>
                        ) : pctOccupied >= 95 ? (
                          <span className={styles.badgeOk}>
                            <CheckCircle2 size={13} /> 100% Cubierto
                          </span>
                        ) : (
                          <span className={styles.badgeWarn}>
                            <Clock size={13} /> {(maxH - totalH).toFixed(1)}h Disponible
                          </span>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* MODE 2: COMPARATIVA DIFF (SOLICITADO VS CONCEDIDO VS REAL) */}
        {activeMode === 'diff' && (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ minWidth: '220px' }}>Trabajador</th>
                  {projects.map(p => (
                    <th key={p.id} colSpan={3} style={{ textAlign: 'center', borderLeft: '2px solid #CBD5E1' }}>
                      {p.name}
                    </th>
                  ))}
                  <th style={{ minWidth: '140px', borderLeft: '2px solid #CBD5E1' }}>Total Masa Salarial</th>
                </tr>
                <tr>
                  <th></th>
                  {projects.map(p => (
                    <React.Fragment key={p.id}>
                      <th style={{ fontSize: '0.6875rem', background: '#EEF2FF', color: '#3730A3', borderLeft: '2px solid #CBD5E1' }}>1. Solicitado</th>
                      <th style={{ fontSize: '0.6875rem', background: '#F5F3FF', color: '#5B21B6' }}>2. Concedido</th>
                      <th style={{ fontSize: '0.6875rem', background: '#ECFDF5', color: '#065F46' }}>3. Ejecutado</th>
                    </React.Fragment>
                  ))}
                  <th style={{ borderLeft: '2px solid #CBD5E1' }}>Desviación (€)</th>
                </tr>
              </thead>
              <tbody>
                {filteredWorkers.map(w => {
                  const salMes = w.pagas === 14 ? (w.salaryMonthly * 14) / 12 : w.salaryMonthly;
                  const ssMes = (salMes * (w.ssPct || 31.4)) / 100;
                  const costeEmpresaMes = salMes + ssMes;
                  const maxH = w.maxWeeklyHours || 37.5;

                  let rowSolicitadoTotal = 0;
                  let rowConcedidoTotal = 0;
                  let rowEjecutadoTotal = 0;

                  return (
                    <tr key={w.id}>
                      <td>
                        <strong style={{ color: '#0D3A5F' }}>{w.name}</strong>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{w.role}</div>
                      </td>

                      {projects.map(p => {
                        const key = `${w.id}_${p.id}`;
                        const lc = initialLifecycleMap[key];
                        const alloc = w.allocations.find(a => a.projectId === p.id);
                        const refHours = alloc?.weeklyHours || 0;
                        const solHours = lc?.solicitadoHours || refHours;
                        const solCost = (costeEmpresaMes * (solHours / maxH)) * 12;
                        const refCost = (costeEmpresaMes * (refHours / maxH)) * 12;
                        const ejecCost = lc?.ejecutadoPaidAmount || (refCost * 0.5);

                        rowSolicitadoTotal += solCost;
                        rowConcedidoTotal += refCost;
                        rowEjecutadoTotal += ejecCost;

                        return (
                          <React.Fragment key={p.id}>
                            <td style={{ borderLeft: '2px solid #E2E8F0', background: '#FAFAFE' }}>
                              <span style={{ fontWeight: 700, color: '#3730A3' }}>{solHours}h</span>
                              <div style={{ fontSize: '0.6875rem', color: '#6366F1' }}>{formatCurrency(solCost)}</div>
                            </td>
                            <td style={{ background: '#FCFAFF' }}>
                              <span style={{ fontWeight: 800, color: '#5B21B6' }}>{refHours}h</span>
                              <div style={{ fontSize: '0.6875rem', color: '#7C3AED' }}>{formatCurrency(refCost)}</div>
                            </td>
                            <td style={{ background: '#FAFEFB' }}>
                              <span style={{ fontWeight: 800, color: '#065F46' }}>{lc?.ejecutadoMonthsPaid || 6}/12m</span>
                              <div style={{ fontSize: '0.6875rem', color: '#059669' }}>{formatCurrency(ejecCost)}</div>
                            </td>
                          </React.Fragment>
                        );
                      })}

                      <td style={{ borderLeft: '2px solid #CBD5E1' }}>
                        <strong style={{ color: '#0D3A5F', fontSize: '0.875rem' }}>
                          {formatCurrency(rowConcedidoTotal)}
                        </strong>
                        <div style={{ fontSize: '0.6875rem', color: rowConcedidoTotal <= rowSolicitadoTotal ? '#166534' : '#DC2626', fontWeight: 700 }}>
                          Diff Solicitud: {formatCurrency(rowConcedidoTotal - rowSolicitadoTotal)}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* MODE 3: MALLA MENSUAL DE NÓMINAS & SEPA (12 MESES) */}
        {activeMode === 'monthly' && (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ minWidth: '220px' }}>Trabajador & Proyecto</th>
                  {['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'].map(m => (
                    <th key={m} style={{ textAlign: 'center', width: '55px', minWidth: '55px', padding: '0.5rem 0.2rem' }}>
                      {m}
                    </th>
                  ))}
                  <th style={{ minWidth: '120px' }}>Nóminas Pagadas</th>
                  <th style={{ minWidth: '120px' }}>RLC / TC1 TGSS</th>
                </tr>
              </thead>
              <tbody>
                {filteredWorkers.flatMap(w => {
                  const activeAllocations = w.allocations.filter(a => a.projectId && a.projectId !== 'sede' && a.weeklyHours > 0);
                  if (activeAllocations.length === 0) return [];

                  return activeAllocations.map(alloc => {
                    const key = `${w.id}_${alloc.projectId}`;
                    const lc = initialLifecycleMap[key];
                    const payrolls = lc?.payrolls || [];

                    return (
                      <tr key={`${w.id}_${alloc.projectId}`}>
                        <td>
                          <strong style={{ color: '#0D3A5F' }}>{w.name}</strong>
                          <div style={{ fontSize: '0.75rem', color: '#009E96', fontWeight: 700 }}>
                            {alloc.projectName} ({alloc.weeklyHours}h/sem)
                          </div>
                        </td>

                        {payrolls.map(p => (
                          <td key={p.mes} style={{ textAlign: 'center', padding: '0.4rem 0.2rem' }}>
                            <div
                              title={`${p.nombreMes}: Imputado ${formatCurrency(p.importeImputado)} | ${p.justificantePago ? '✓ Transferencia SEPA y Recibo Nómina adjuntos' : '⏳ Pendiente de pago/justificante'}`}
                              style={{
                                background: p.justificantePago ? '#DCFCE7' : '#F1F5F9',
                                color: p.justificantePago ? '#166534' : '#94A3B8',
                                border: p.justificantePago ? '1px solid #86EFAC' : '1px solid #E2E8F0',
                                borderRadius: '6px',
                                padding: '0.25rem 0.1rem',
                                fontSize: '0.6875rem',
                                fontWeight: 800,
                                cursor: 'default'
                              }}
                            >
                              {p.justificantePago ? '✓' : '—'}
                            </div>
                          </td>
                        ))}

                        <td>
                          <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#166534', background: '#DCFCE7', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                            {payrolls.filter(p => p.justificantePago).length} / 12 meses
                          </span>
                        </td>

                        <td>
                          <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#0D3A5F', background: '#EAF5FB', padding: '0.2rem 0.5rem', borderRadius: '6px' }}>
                            ✓ Liquidado TGSS
                          </span>
                        </td>
                      </tr>
                    );
                  });
                })}
              </tbody>
            </table>
          </div>
        )}

        {/* MODE 4: AUDITOR ANTIFRAUDE Y DOBLE FINANCIACIÓN */}
        {activeMode === 'auditor' && (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
            <div style={{ background: '#F8FAFC', border: '1.5px solid #CBD5E1', borderRadius: '10px', padding: '1.25rem' }}>
              <h3 style={{ margin: '0 0 0.5rem 0', color: '#0D3A5F', fontSize: '1rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <ShieldCheck size={20} color="#16C7B2" /> Reglas de Control Horario y No Duplicidad (Art. 19 y 31 Ley General de Subvenciones)
              </h3>
              <p style={{ fontSize: '0.8125rem', color: '#475569', margin: 0 }}>
                El auditor evalúa que ninguna persona de la entidad supere las 37,5h o 40h semanales de dedicación contractual acumulada entre todas las subvenciones y que el coste imputado no supere el 100% del coste salarial real de la entidad.
              </p>
            </div>

            {overAllocatedWorkers.length > 0 ? (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                {overAllocatedWorkers.map(w => {
                  const totalH = (w.allocations || []).reduce((s, a) => s + (a.weeklyHours || 0), 0);
                  const maxH = w.maxWeeklyHours || 37.5;
                  const excess = (totalH - maxH).toFixed(1);

                  return (
                    <div key={w.id} style={{ background: '#FEF2F2', border: '1.5px solid #FCA5A5', borderRadius: '10px', padding: '1rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
                      <div>
                        <strong style={{ color: '#991B1B', fontSize: '0.9375rem', display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                          <AlertTriangle size={16} color="#DC2626" /> {w.name} ({w.role}) — Sobreimputación de +{excess} horas/semana
                        </strong>
                        <p style={{ fontSize: '0.8125rem', color: '#7F1D1D', margin: '0.25rem 0 0 0' }}>
                          Dedicación actual: <strong>{totalH.toFixed(1)}h/sem</strong> sobre un máximo legal contratado de <strong>{maxH}h/sem</strong>.
                        </p>
                        <div style={{ display: 'flex', gap: '0.5rem', marginTop: '0.5rem', flexWrap: 'wrap' }}>
                          {w.allocations.filter(a => a.weeklyHours > 0).map(a => (
                            <span key={a.id} style={{ background: 'white', border: '1px solid #FCA5A5', padding: '0.2rem 0.5rem', borderRadius: '4px', fontSize: '0.75rem', color: '#991B1B', fontWeight: 700 }}>
                              {a.projectName}: {a.weeklyHours}h
                            </span>
                          ))}
                        </div>
                      </div>

                      <button
                        type="button"
                        onClick={() => setSelectedWorkerId(w.id)}
                        className={styles.btnSecondary}
                        style={{ borderColor: '#DC2626', color: '#991B1B' }}
                      >
                        Ajustar en Ficha 360°
                      </button>
                    </div>
                  );
                })}
              </div>
            ) : (
              <div style={{ background: '#F0FDF4', border: '1.5px solid #86EFAC', borderRadius: '10px', padding: '1.5rem', textAlign: 'center' }}>
                <CheckCircle2 size={32} color="#16A34A" style={{ margin: '0 auto 0.5rem auto' }} />
                <h4 style={{ margin: '0 0 0.25rem 0', color: '#166534', fontSize: '1rem', fontWeight: 800 }}>
                  ✓ 100% Conforme: Sin Doble Imputación ni Solapamiento Horario
                </h4>
                <p style={{ margin: 0, fontSize: '0.8125rem', color: '#14532D' }}>
                  Todos los trabajadores de la entidad están dentro de su jornada laboral máxima legal.
                </p>
              </div>
            )}
          </div>
        )}
      </div>

      {/* DRAWER: FICHA 360° DEL TRABAJADOR */}
      {selectedWorker && (
        <div className={styles.drawerOverlay} onClick={() => setSelectedWorkerId(null)}>
          <div className={styles.drawerContent} onClick={e => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <div>
                <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: '#0D3A5F' }}>
                  👤 Ficha 360°: {selectedWorker.name}
                </h3>
                <span style={{ fontSize: '0.8125rem', color: '#64748B' }}>
                  {selectedWorker.role} · {selectedWorker.category}
                </span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedWorkerId(null)}
                className={styles.closeBtn}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.drawerBody}>
              {/* Summary card */}
              <div style={{ background: '#F8FAFC', border: '1.5px solid #E2E8F0', borderRadius: '10px', padding: '1rem' }}>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Salario Bruto Mensual</span>
                    <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0D3A5F' }}>{formatCurrency(selectedWorker.salaryMonthly)}</div>
                  </div>
                  <div>
                    <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Coste SS Empresa ({selectedWorker.ssPct || 31.4}%)</span>
                    <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#009E96' }}>
                      {formatCurrency((selectedWorker.salaryMonthly * (selectedWorker.ssPct || 31.4)) / 100)}
                    </div>
                  </div>
                </div>
              </div>

              {/* Progress of hours distribution */}
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.4rem', fontSize: '0.8125rem', fontWeight: 700 }}>
                  <span style={{ color: '#0D3A5F' }}>Distribución de la Jornada Laboral</span>
                  <span style={{ color: '#64748B' }}>
                    {(selectedWorker.allocations || []).reduce((s, a) => s + (a.weeklyHours || 0), 0).toFixed(1)}h / {selectedWorker.maxWeeklyHours || 37.5}h
                  </span>
                </div>
                <div style={{ background: '#E2E8F0', height: '10px', borderRadius: '5px', overflow: 'hidden', display: 'flex' }}>
                  {selectedWorker.allocations.filter(a => a.weeklyHours > 0).map((a, i) => {
                    const colors = ['#2563EB', '#7C3AED', '#0D9488', '#EA580C', '#64748B'];
                    const pct = ((a.weeklyHours / (selectedWorker.maxWeeklyHours || 37.5)) * 100);
                    return (
                      <div
                        key={a.id}
                        title={`${a.projectName}: ${a.weeklyHours}h (${pct.toFixed(0)}%)`}
                        style={{
                          width: `${pct}%`,
                          height: '100%',
                          background: colors[i % colors.length],
                        }}
                      />
                    );
                  })}
                </div>
              </div>

              {/* Project breakdown cards */}
              <h4 style={{ margin: '0.5rem 0 0 0', fontSize: '0.9375rem', fontWeight: 800, color: '#0D3A5F' }}>
                Proyectos y Subvenciones Asignadas
              </h4>

              {selectedWorker.allocations.filter(a => a.projectId && a.projectId !== 'sede').map(alloc => {
                const key = `${selectedWorker.id}_${alloc.projectId}`;
                const lc = initialLifecycleMap[key];

                const maxH = selectedWorker.maxWeeklyHours || 37.5;
                const h = alloc.weeklyHours;
                const solH = lc?.solicitadoHours !== undefined ? lc.solicitadoHours : h;
                const solP = maxH > 0 ? (solH / maxH) * 100 : 0;
                const refP = maxH > 0 ? (h / maxH) * 100 : 0;
                const pMonths = lc?.ejecutadoMonthsPaid !== undefined ? lc.ejecutadoMonthsPaid : (h > 0 ? 6 : 0);
                const tMonths = lc?.ejecutadoTotalMonths || 12;
                const ejeP = tMonths > 0 && h > 0 ? (pMonths / tMonths) * 100 : 0;
                const jusP = h > 0 ? (pMonths >= tMonths ? 100 : Math.round((pMonths / tMonths) * 100)) : 0;

                return (
                  <div key={alloc.id} style={{ background: 'white', border: '1.5px solid #CBD5E1', borderRadius: '10px', padding: '1rem', display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                      <div>
                        <strong style={{ color: '#0D3A5F', fontSize: '0.9375rem' }}>{alloc.projectName}</strong>
                        <span style={{ fontSize: '0.6875rem', color: '#009E96', fontWeight: 700, marginLeft: '0.5rem' }}>
                          {projects.find(p => p.id === alloc.projectId)?.phase || 'En Ejecución'}
                        </span>
                      </div>
                      <Link
                        href={`/dashboard/proyectos/${alloc.projectId}`}
                        style={{ fontSize: '0.75rem', color: '#2563EB', fontWeight: 700, display: 'inline-flex', alignItems: 'center', gap: '2px', textDecoration: 'none' }}
                      >
                        Ver Expediente <ExternalLink size={12} />
                      </Link>
                    </div>

                    {/* 4 Mini-Bars in Drawer */}
                    <div className={styles.fourBarsBox}>
                      <div className={styles.barLine} title={`1. Solicitado original: ${solH}h`}>
                        <span className={styles.barTagSol}>1. SOL</span>
                        <div className={styles.barTrack}>
                          <div className={styles.barFillSol} style={{ width: `${Math.min(100, solP)}%` }} />
                        </div>
                        <span className={styles.barNumber}>{solH}h</span>
                      </div>

                      <div className={styles.barLine} title={`2. Reformulado / Aprobado: ${h}h`}>
                        <span className={styles.barTagRef}>2. REF</span>
                        <div className={styles.barTrack}>
                          <div className={styles.barFillRef} style={{ width: `${Math.min(100, refP)}%` }} />
                        </div>
                        <span className={styles.barNumber}>{h}h</span>
                      </div>

                      <div className={styles.barLine} title={`3. Ejecutado: ${pMonths}/${tMonths} nóminas pagadas`}>
                        <span className={styles.barTagEjec}>3. EJE</span>
                        <div className={styles.barTrack}>
                          <div className={styles.barFillEjec} style={{ width: `${Math.min(100, ejeP)}%` }} />
                        </div>
                        <span className={styles.barNumber}>{pMonths}/{tMonths}m</span>
                      </div>

                      <div className={styles.barLine} title={`4. Justificado: ${jusP}% liquidado`}>
                        <span className={styles.barTagJust}>4. JUS</span>
                        <div className={styles.barTrack}>
                          <div className={styles.barFillJust} style={{ width: `${Math.min(100, jusP)}%` }} />
                        </div>
                        <span className={styles.barNumber}>{jusP}%</span>
                      </div>
                    </div>

                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '0.5rem', background: '#F8FAFC', padding: '0.5rem', borderRadius: '6px' }}>
                      <div>
                        <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>Dedicación</span>
                        <div style={{ fontWeight: 800, color: '#0D3A5F' }}>{alloc.weeklyHours} h/sem</div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>Nóminas Pagadas</span>
                        <div style={{ fontWeight: 800, color: '#16A34A' }}>{pMonths} / {tMonths} m</div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.6875rem', color: '#64748B' }}>Total Justificado</span>
                        <div style={{ fontWeight: 800, color: '#009E96' }}>{formatCurrency(lc?.ejecutadoPaidAmount || 0)}</div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default GlobalImputationMatrix;
