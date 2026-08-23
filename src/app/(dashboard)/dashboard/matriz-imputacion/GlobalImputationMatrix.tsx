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
  DollarSign,
  PieChart,
  Plus,
  Trash2,
  SlidersHorizontal,
  Layers
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

export type ViewMode = 'visual_bars' | 'interactive_editor' | 'matrix360' | 'auditor';

// Paleta de colores consistente y accesible para los proyectos
export const PROJECT_COLORS = [
  { bg: '#2563EB', light: '#EFF6FF', border: '#93C5FD', text: '#FFFFFF', name: 'Azul Real' },
  { bg: '#0D9488', light: '#F0FDFA', border: '#5EEAD4', text: '#FFFFFF', name: 'Verde Turquesa' },
  { bg: '#7C3AED', light: '#F5F3FF', border: '#C4B5FD', text: '#FFFFFF', name: 'Púrpura Violeta' },
  { bg: '#D97706', light: '#FFFBEB', border: '#FCD34D', text: '#FFFFFF', name: 'Ámbar Cálido' },
  { bg: '#DB2777', light: '#FDF2F8', border: '#F472B6', text: '#FFFFFF', name: 'Rosa Magenta' },
  { bg: '#0891B2', light: '#ECFEFF', border: '#67E8F9', text: '#FFFFFF', name: 'Cian Océano' },
  { bg: '#EA580C', light: '#FFF7ED', border: '#FDBA74', text: '#FFFFFF', name: 'Naranja Vivo' },
  { bg: '#4F46E5', light: '#EEF2FF', border: '#A5B4FC', text: '#FFFFFF', name: 'Índigo' },
  { bg: '#64748B', light: '#F8FAFC', border: '#CBD5E1', text: '#FFFFFF', name: 'Sede / Estructura' },
];

export function getProjectTheme(projectId?: string, projectIndex: number = 0) {
  if (!projectId || projectId === 'sede' || projectId.toLowerCase().includes('sede')) {
    return { bg: '#64748B', light: '#F8FAFC', border: '#CBD5E1', text: '#FFFFFF', name: 'Sede / Estructura' };
  }
  return PROJECT_COLORS[Math.abs(projectIndex) % (PROJECT_COLORS.length - 1)];
}

export function GlobalImputationMatrix({
  initialWorkers,
  projects,
  initialLifecycleMap = {},
  initialStats,
}: GlobalImputationMatrixProps) {
  const [activeMode, setActiveMode] = useState<ViewMode>('visual_bars');
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<'all' | 'alert' | 'ok' | 'free'>('all');
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

  // Handler for direct hours change
  const handleHourChange = (workerIdx: number, projectTargetId: string | undefined, hours: number) => {
    if (!projectTargetId) return;
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

  // Handler for percentage change
  const handlePctChange = (workerIdx: number, projectTargetId: string | undefined, pct: number) => {
    if (!projectTargetId) return;
    const targetWorker = workers[workerIdx];
    const maxH = targetWorker.maxWeeklyHours || 37.5;
    const computedHours = Number(((pct / 100) * maxH).toFixed(2));
    handleHourChange(workerIdx, projectTargetId, computedHours);
  };

  const handleSaveAndSync = async () => {
    setIsSaving(true);
    try {
      const res = await savePersonalMatrixAction({ workers }, undefined, true);
      if (res.success) {
        showToast('¡Matriz sincronizada con éxito con los presupuestos y expedientes de todos los proyectos!');
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

  const workersWithFreeCapacity = workers.filter(w => {
    const sum = (w.allocations || []).reduce((s, a) => s + (a.weeklyHours || 0), 0);
    return sum < (w.maxWeeklyHours || 37.5);
  });

  // Export CSV
  const handleExportCSV = () => {
    const headers = [
      'Trabajador',
      'Rol / Categoria',
      'Salario Bruto Mes',
      'Jornada Max (h/sem)',
      ...projects.map(p => `% Imputado (${p.name})`),
      ...projects.map(p => `Horas Imputadas (${p.name})`),
      'Sede / Estructura (h/sem)',
      'Total Horas Asignadas',
      'Porcentaje Total Imputado',
      'Estado Cumplimiento'
    ];

    const rows = workers.map(w => {
      const totalHours = (w.allocations || []).reduce((s, a) => s + (a.weeklyHours || 0), 0);
      const maxH = w.maxWeeklyHours || 37.5;
      const pct = maxH > 0 ? ((totalHours / maxH) * 100).toFixed(1) : '0';
      const sedeHours = w.allocations.find(a => a.projectId === 'sede')?.weeklyHours || 0;

      return [
        `"${w.name}"`,
        `"${w.role}"`,
        w.salaryMonthly,
        maxH,
        ...projects.map(p => {
          const h = w.allocations.find(a => a.projectId === p.id)?.weeklyHours || 0;
          return `"${maxH > 0 ? ((h / maxH) * 100).toFixed(1) : 0}%"`;
        }),
        ...projects.map(p => w.allocations.find(a => a.projectId === p.id)?.weeklyHours || 0),
        sedeHours,
        totalHours,
        `"${pct}%"`,
        totalHours > maxH ? '"SOBREIMPUTACION"' : '"CONFORME"'
      ];
    });

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(';'), ...rows.map(r => r.join(';'))].join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `Matriz_Imputacion_Porcentajes_${new Date().toISOString().slice(0, 10)}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Filtered workers
  const filteredWorkers = workers.filter(w => {
    const matchesSearch = w.name.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          w.role.toLowerCase().includes(searchQuery.toLowerCase());
    const totalHours = (w.allocations || []).reduce((s, a) => s + (a.weeklyHours || 0), 0);
    const maxH = w.maxWeeklyHours || 37.5;
    const isOver = totalHours > maxH;
    const hasFree = totalHours < maxH;

    if (statusFilter === 'alert') return matchesSearch && isOver;
    if (statusFilter === 'ok') return matchesSearch && !isOver && !hasFree;
    if (statusFilter === 'free') return matchesSearch && hasFree;
    return matchesSearch;
  });

  const selectedWorker = workers.find(w => w.id === selectedWorkerId);

  // List of all active projects including Sede
  const allProjectItems = [
    ...projects,
    { id: 'sede', name: 'Sede / Estructura General', phase: 'Estructura', grantAmount: 0 }
  ];

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
          <h1 className={styles.title}>Matriz de Imputación de Personal y Planificación</h1>
          <p className={styles.subtitle}>
            Mapa visual de dedicación horaria y porcentaje de jornada asignada a cada subvención con control de sobreimputación y costes en tiempo real.
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
            <div className={styles.statLabel}>Masa Salarial Imputada (V2)</div>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#F0FDF4', color: '#16A34A' }}>
            <PieChart size={24} />
          </div>
          <div>
            <div className={styles.statVal}>{allProjectItems.length} <span style={{ fontSize: '0.875rem', color: '#5C7E9B', fontWeight: 600 }}>Proyectos</span></div>
            <div className={styles.statLabel}>Centros de Coste Activos</div>
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

      {/* Main Mode Navigation Bar */}
      <nav className={styles.modeNav}>
        <button
          type="button"
          onClick={() => setActiveMode('visual_bars')}
          className={`${styles.modeBtn} ${activeMode === 'visual_bars' ? styles.modeBtnActive : ''}`}
        >
          <Layers size={17} color="#2563EB" />
          <span>1. 🎨 Mapa Visual de Imputación (Barras por Proyecto)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMode('interactive_editor')}
          className={`${styles.modeBtn} ${activeMode === 'interactive_editor' ? styles.modeBtnActive : ''}`}
        >
          <SlidersHorizontal size={17} color="#10B981" />
          <span>2. ⚡ Asignador de Porcentajes por Trabajador</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMode('matrix360')}
          className={`${styles.modeBtn} ${activeMode === 'matrix360' ? styles.modeBtnActive : ''}`}
        >
          <FileSpreadsheet size={17} color="#7C3AED" />
          <span>3. 📋 Matriz Cuadriculada (Fases 1-4 & Nóminas)</span>
        </button>

        <button
          type="button"
          onClick={() => setActiveMode('auditor')}
          className={`${styles.modeBtn} ${activeMode === 'auditor' ? styles.modeBtnActive : ''}`}
        >
          <ShieldCheck size={17} color={overAllocatedWorkers.length > 0 ? '#DC2626' : '#16A34A'} />
          <span>4. 🛡️ Auditor Antifraude de Jornada</span>
        </button>
      </nav>

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* PESTAÑA 1: MAPA VISUAL DE IMPUTACIÓN (STACKED BARS CON COLORES)          */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {activeMode === 'visual_bars' && (
        <div className={styles.visualCard}>
          {/* Project Color Palette Legend */}
          <div className={styles.legendContainer}>
            <div className={styles.legendHeader}>
              <span className={styles.legendTitle}>
                <PieChart size={16} /> Paleta de Colores de Proyectos & Asignación Global
              </span>
              <span style={{ fontSize: '0.75rem', color: '#64748B' }}>
                Cada proyecto tiene un color asignado único para identificar la dedicación de toda la plantilla
              </span>
            </div>

            <div className={styles.legendGrid}>
              {allProjectItems.map((p, pIdx) => {
                const theme = getProjectTheme(p.id, pIdx);
                const totalHoursInProj = workers.reduce((s, w) => {
                  const alloc = w.allocations.find(a => a.projectId === p.id);
                  return s + (alloc?.weeklyHours || 0);
                }, 0);
                const totalWorkersInProj = workers.filter(w => {
                  const alloc = w.allocations.find(a => a.projectId === p.id);
                  return alloc && alloc.weeklyHours > 0;
                }).length;

                return (
                  <div 
                    key={p.id} 
                    className={styles.legendBadge}
                    style={{ 
                      background: theme.light, 
                      borderColor: theme.border,
                      color: '#0D3A5F'
                    }}
                    title={`${p.name}: ${totalHoursInProj.toFixed(1)} h/sem totales asignadas entre ${totalWorkersInProj} trabajador/es`}
                  >
                    <span className={styles.legendColorDot} style={{ background: theme.bg }} />
                    <strong>{p.name.length > 28 ? `${p.name.slice(0, 26)}...` : p.name}</strong>
                    <span style={{ fontSize: '0.75rem', color: '#475569', fontWeight: 600 }}>
                      ({totalHoursInProj.toFixed(1)}h · {totalWorkersInProj} trab.)
                    </span>
                  </div>
                );
              })}
            </div>
          </div>

          {/* Filters and search bar */}
          <div className={styles.filterBar}>
            <div className={styles.filterGroup}>
              <input
                type="text"
                placeholder="🔍 Buscar trabajador o categoría..."
                className={styles.searchInput}
                value={searchQuery}
                onChange={e => setSearchQuery(e.target.value)}
              />
              <select
                className={styles.selectFilter}
                value={statusFilter}
                onChange={e => setStatusFilter(e.target.value as any)}
              >
                <option value="all">Toda la Plantilla ({workers.length})</option>
                <option value="ok">🟢 100% Imputados Completos</option>
                <option value="free">🔵 Con Horas Libres / Disponibles ({workersWithFreeCapacity.length})</option>
                <option value="alert">🔴 Sobreimputados ({overAllocatedWorkers.length})</option>
              </select>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <button
                type="button"
                onClick={() => setActiveMode('interactive_editor')}
                className={styles.btnPrimary}
                style={{ fontSize: '0.8125rem', padding: '0.45rem 0.9rem' }}
              >
                <SlidersHorizontal size={14} /> Asignar Porcentajes Rápido
              </button>
            </div>
          </div>

          {/* List of Workers with Giant Multi-Color Stacked Bar */}
          <div className={styles.visualWorkersList}>
            {filteredWorkers.map((worker, wIdx) => {
              const maxH = worker.maxWeeklyHours || 37.5;
              const totalAllocHours = (worker.allocations || []).reduce((s, a) => s + (a.weeklyHours || 0), 0);
              const totalPct = maxH > 0 ? (totalAllocHours / maxH) * 100 : 0;
              const freeHours = Math.max(0, maxH - totalAllocHours);
              const freePct = maxH > 0 ? (freeHours / maxH) * 100 : 0;
              const overHours = Math.max(0, totalAllocHours - maxH);
              const isOver = totalAllocHours > maxH;

              const salMes = worker.pagas === 14 ? (worker.salaryMonthly * 14) / 12 : worker.salaryMonthly;
              const ssMes = (salMes * (worker.ssPct || 31.4)) / 100;
              const costeEmpresaMes = salMes + ssMes;

              // Filter allocations that have > 0 hours
              const activeAllocations = (worker.allocations || []).filter(a => (a.weeklyHours || 0) > 0);

              return (
                <div key={worker.id} className={styles.workerVisualRow}>
                  {/* Row Header */}
                  <div className={styles.workerVisualHeader}>
                    <div className={styles.workerInfoLeft}>
                      <div className={styles.workerAvatar}>
                        {worker.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                      <div>
                        <h3 className={styles.workerMetaName}>{worker.name}</h3>
                        <div className={styles.workerMetaSub}>
                          <span>{worker.role}</span>
                          <span>·</span>
                          <span style={{ color: '#0D3A5F', fontWeight: 700 }}>Bruto: {formatCurrency(worker.salaryMonthly)}/mes</span>
                          <span>·</span>
                          <span>Coste Empresa: <strong>{formatCurrency(costeEmpresaMes)}/mes</strong></span>
                          <span>·</span>
                          <span>Jornada: <strong>{maxH}h/sem</strong></span>
                        </div>
                      </div>
                    </div>

                    <div className={styles.workerStatusBadgeRight}>
                      {isOver ? (
                        <span className={styles.badgeDanger} style={{ fontSize: '0.8125rem' }}>
                          <AlertTriangle size={14} /> {totalPct.toFixed(1)}% Imputado (+{overHours.toFixed(1)}h Exceso)
                        </span>
                      ) : totalPct >= 99.5 ? (
                        <span className={styles.badgeOk} style={{ fontSize: '0.8125rem' }}>
                          <CheckCircle2 size={14} /> 100% Jornada Completa ({totalAllocHours.toFixed(1)}h)
                        </span>
                      ) : (
                        <span className={styles.badgeWarn} style={{ background: '#EFF6FF', color: '#1E40AF', borderColor: '#BFDBFE', fontSize: '0.8125rem' }}>
                          <Info size={14} /> {totalPct.toFixed(0)}% Asignado · {freePct.toFixed(0)}% Libre ({freeHours.toFixed(1)}h)
                        </span>
                      )}

                      <button
                        type="button"
                        onClick={() => {
                          setSelectedWorkerId(worker.id);
                          setActiveMode('interactive_editor');
                        }}
                        className={styles.btnSecondary}
                        style={{ fontSize: '0.75rem', padding: '0.35rem 0.75rem' }}
                      >
                        <Sliders size={13} /> Ajustar %
                      </button>
                    </div>
                  </div>

                  {/* The Giant Multi-Color Stacked Bar */}
                  <div className={styles.stackedBarTrack} title={`Total imputado: ${totalPct.toFixed(1)}% (${totalAllocHours.toFixed(1)}h de ${maxH}h)`}>
                    {activeAllocations.map((alloc) => {
                      const pIdx = allProjectItems.findIndex(p => p.id === alloc.projectId);
                      const theme = getProjectTheme(alloc.projectId, pIdx >= 0 ? pIdx : 0);
                      const allocPct = maxH > 0 ? (alloc.weeklyHours / maxH) * 100 : 0;
                      const segmentCost = costeEmpresaMes * (allocPct / 100);

                      return (
                        <div
                          key={alloc.id || alloc.projectId}
                          className={styles.stackedSegment}
                          style={{
                            width: `${Math.min(100, allocPct)}%`,
                            background: theme.bg,
                          }}
                          onClick={() => setSelectedWorkerId(worker.id)}
                          title={`${alloc.projectName}: ${alloc.weeklyHours}h/sem (${allocPct.toFixed(1)}% de jornada) · ${formatCurrency(segmentCost)}/mes`}
                        >
                          {allocPct >= 12 ? (
                            <span>{alloc.projectName.slice(0, 16)} · {allocPct.toFixed(0)}% ({alloc.weeklyHours}h)</span>
                          ) : allocPct >= 6 ? (
                            <span>{allocPct.toFixed(0)}%</span>
                          ) : null}
                        </div>
                      );
                    })}

                    {/* Available free capacity segment */}
                    {freePct > 0 && !isOver && (
                      <div 
                        className={styles.stackedSegmentAvailable}
                        style={{ width: `${freePct}%` }}
                        title={`Capacidad disponible: ${freeHours.toFixed(1)}h/sem (${freePct.toFixed(1)}% de jornada libre)`}
                      >
                        {freePct >= 15 && `⚪ ${freePct.toFixed(0)}% Libre (${freeHours.toFixed(1)}h)`}
                      </div>
                    )}

                    {/* Over-allocation warning segment */}
                    {isOver && (
                      <div 
                        className={styles.stackedSegmentOver}
                        style={{ width: `${Math.min(40, ((overHours / maxH) * 100))}%` }}
                        title={`¡ALERTA DE DOBLE FINANCIACIÓN! Exceso de ${overHours.toFixed(1)}h/sem (${((overHours / maxH) * 100).toFixed(0)}%)`}
                      >
                        ⚠️ +{((overHours / maxH) * 100).toFixed(0)}% SOBREIMPUTADO
                      </div>
                    )}
                  </div>

                  {/* Allocation badges list below the bar */}
                  <div className={styles.allocTagsRow}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B' }}>Reparto:</span>
                    {activeAllocations.length === 0 ? (
                      <span style={{ fontSize: '0.75rem', color: '#94A3B8', fontStyle: 'italic' }}>Sin proyectos asignados (100% disponible)</span>
                    ) : (
                      activeAllocations.map(alloc => {
                        const pIdx = allProjectItems.findIndex(p => p.id === alloc.projectId);
                        const theme = getProjectTheme(alloc.projectId, pIdx >= 0 ? pIdx : 0);
                        const allocPct = maxH > 0 ? (alloc.weeklyHours / maxH) * 100 : 0;
                        const segmentCost = costeEmpresaMes * (allocPct / 100);

                        return (
                          <div 
                            key={alloc.projectId}
                            className={styles.allocTagItem}
                            style={{ borderColor: theme.border }}
                          >
                            <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: theme.bg }} />
                            <span>{alloc.projectName}</span>
                            <strong style={{ color: theme.bg }}>{allocPct.toFixed(1)}%</strong>
                            <span style={{ color: '#64748B' }}>({alloc.weeklyHours}h · {formatCurrency(segmentCost)}/mes)</span>
                          </div>
                        );
                      })
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* PESTAÑA 2: ASIGNADOR DE PORCENTAJES POR TRABAJADOR (EDICIÓN INTERACTIVA)  */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {activeMode === 'interactive_editor' && (
        <div className={styles.visualCard}>
          <div style={{ background: '#F0FDFA', border: '1.5px solid #5EEAD4', borderRadius: '12px', padding: '1rem 1.25rem', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <SlidersHorizontal size={22} color="#0D9488" />
              <div>
                <strong style={{ color: '#134E4A', fontSize: '0.9375rem' }}>⚡ Asignador Visual de Porcentajes de Imputación</strong>
                <p style={{ margin: '0.15rem 0 0 0', fontSize: '0.75rem', color: '#115E59' }}>
                  Ajusta los sliders o pulsa en los botones rápidos (+25%, +50%, etc.) para repartir la jornada entre proyectos. La barra y los costes se recalculan en tiempo real.
                </p>
              </div>
            </div>
            <button
              type="button"
              onClick={handleSaveAndSync}
              disabled={isSaving}
              className={styles.btnPrimary}
            >
              <Save size={16} /> {isSaving ? 'Guardando...' : '💾 Guardar y Sincronizar'}
            </button>
          </div>

          {/* Cards Grid */}
          <div className={styles.editorCardsGrid}>
            {filteredWorkers.map((worker) => {
              const realWorkerIdx = workers.findIndex(w => w.id === worker.id);
              const maxH = worker.maxWeeklyHours || 37.5;
              const totalAllocHours = (worker.allocations || []).reduce((s, a) => s + (a.weeklyHours || 0), 0);
              const totalPct = maxH > 0 ? (totalAllocHours / maxH) * 100 : 0;
              const freeHours = Math.max(0, maxH - totalAllocHours);
              const freePct = maxH > 0 ? (freeHours / maxH) * 100 : 0;
              const overHours = Math.max(0, totalAllocHours - maxH);
              const isOver = totalAllocHours > maxH;

              const salMes = worker.pagas === 14 ? (worker.salaryMonthly * 14) / 12 : worker.salaryMonthly;
              const ssMes = (salMes * (worker.ssPct || 31.4)) / 100;
              const costeEmpresaMes = salMes + ssMes;

              // Proyectos ya con horas asignadas
              const assignedAllocations = (worker.allocations || []).filter(a => a.weeklyHours > 0);
              // Proyectos que están en 0 o no asignados para el dropdown
              const unassignedProjects = allProjectItems.filter(p => {
                const existing = worker.allocations.find(a => a.projectId === p.id);
                return !existing || existing.weeklyHours === 0;
              });

              return (
                <div key={worker.id} className={styles.workerEditorCard}>
                  {/* Card Header */}
                  <div className={styles.workerEditorHeader}>
                    <div className={styles.workerEditorHeaderTitle}>
                      <div className={styles.workerAvatar}>
                        {worker.name.split(' ').map(n => n[0]).slice(0, 2).join('')}
                      </div>
                      <div>
                        <h3 style={{ margin: 0, fontSize: '1.125rem', fontWeight: 800, color: '#0D3A5F' }}>{worker.name}</h3>
                        <div style={{ fontSize: '0.8125rem', color: '#64748B', display: 'flex', gap: '0.5rem', marginTop: '0.2rem' }}>
                          <span>{worker.role}</span>
                          <span>·</span>
                          <span>Jornada Base: <strong>{maxH}h/sem</strong></span>
                          <span>·</span>
                          <span>Coste Empresa: <strong>{formatCurrency(costeEmpresaMes)}/mes</strong></span>
                        </div>
                      </div>
                    </div>

                    <div>
                      {isOver ? (
                        <span className={styles.badgeDanger}>
                          <AlertTriangle size={15} /> ¡Sobreimputado! {totalPct.toFixed(1)}% (+{overHours.toFixed(1)}h)
                        </span>
                      ) : totalPct >= 99.5 ? (
                        <span className={styles.badgeOk}>
                          <CheckCircle2 size={15} /> 100% Imputado ({totalAllocHours.toFixed(1)}h)
                        </span>
                      ) : (
                        <span className={styles.badgeWarn} style={{ background: '#EFF6FF', color: '#1E40AF', borderColor: '#BFDBFE' }}>
                          <Info size={15} /> {totalPct.toFixed(0)}% Asignado · {freePct.toFixed(0)}% Libre ({freeHours.toFixed(1)}h)
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Real-time Live Stacked Bar */}
                  <div className={styles.stackedBarTrack}>
                    {assignedAllocations.map((alloc) => {
                      const pIdx = allProjectItems.findIndex(p => p.id === alloc.projectId);
                      const theme = getProjectTheme(alloc.projectId, pIdx >= 0 ? pIdx : 0);
                      const allocPct = maxH > 0 ? (alloc.weeklyHours / maxH) * 100 : 0;

                      return (
                        <div
                          key={alloc.projectId}
                          className={styles.stackedSegment}
                          style={{
                            width: `${Math.min(100, allocPct)}%`,
                            background: theme.bg,
                          }}
                        >
                          {allocPct >= 10 && `${alloc.projectName.slice(0, 14)} · ${allocPct.toFixed(0)}% (${alloc.weeklyHours}h)`}
                        </div>
                      );
                    })}

                    {freePct > 0 && !isOver && (
                      <div className={styles.stackedSegmentAvailable} style={{ width: `${freePct}%` }}>
                        {freePct >= 15 && `⚪ ${freePct.toFixed(0)}% Libre (${freeHours.toFixed(1)}h)`}
                      </div>
                    )}

                    {isOver && (
                      <div className={styles.stackedSegmentOver} style={{ width: `${Math.min(40, ((overHours / maxH) * 100))}%` }}>
                        ⚠️ +{((overHours / maxH) * 100).toFixed(0)}% SOBRECARGA
                      </div>
                    )}
                  </div>

                  {/* Allocation Rows */}
                  <div className={styles.allocationRowsContainer}>
                    {assignedAllocations.length === 0 ? (
                      <div style={{ textAlign: 'center', padding: '1.5rem', background: '#F8FAFC', borderRadius: '10px', color: '#64748B', fontSize: '0.875rem' }}>
                        Este trabajador no tiene ningún proyecto asignado actualmente. Selecciona un proyecto abajo para empezar.
                      </div>
                    ) : (
                      assignedAllocations.map(alloc => {
                        const pIdx = allProjectItems.findIndex(p => p.id === alloc.projectId);
                        const theme = getProjectTheme(alloc.projectId, pIdx >= 0 ? pIdx : 0);
                        const allocPct = maxH > 0 ? (alloc.weeklyHours / maxH) * 100 : 0;
                        const costMonth = costeEmpresaMes * (allocPct / 100);
                        const costYear = costMonth * (alloc.months || 12);

                        return (
                          <div key={alloc.projectId} className={styles.allocationRowCard}>
                            {/* Project Identification */}
                            <div className={styles.projectInfoBlock}>
                              <div className={styles.projectColorSquare} style={{ background: theme.bg }} />
                              <div>
                                <div className={styles.projectNameText}>{alloc.projectName}</div>
                                <div className={styles.projectPhaseSub}>{alloc.projectId === 'sede' ? 'Estructura' : 'Subvención Concedida'}</div>
                              </div>
                            </div>

                            {/* Slider & Quick Buttons */}
                            <div className={styles.sliderControlBlock}>
                              <div className={styles.sliderRow}>
                                <input
                                  type="range"
                                  min="0"
                                  max="100"
                                  step="2.5"
                                  className={styles.customRangeInput}
                                  value={allocPct}
                                  onChange={e => handlePctChange(realWorkerIdx, alloc.projectId, parseFloat(e.target.value) || 0)}
                                />
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                  <input
                                    type="number"
                                    min="0"
                                    max="100"
                                    step="1"
                                    className={styles.inputNumber}
                                    style={{ width: '65px', fontWeight: 800, color: theme.bg }}
                                    value={Number(allocPct.toFixed(1))}
                                    onChange={e => handlePctChange(realWorkerIdx, alloc.projectId, parseFloat(e.target.value) || 0)}
                                  />
                                  <span style={{ fontSize: '0.75rem', fontWeight: 800, color: '#64748B' }}>%</span>
                                </div>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                                  <input
                                    type="number"
                                    min="0"
                                    max={maxH}
                                    step="0.5"
                                    className={styles.inputNumber}
                                    style={{ width: '70px' }}
                                    value={alloc.weeklyHours}
                                    onChange={e => handleHourChange(realWorkerIdx, alloc.projectId, parseFloat(e.target.value) || 0)}
                                  />
                                  <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#64748B' }}>h/sem</span>
                                </div>
                              </div>

                              {/* Quick % Pills */}
                              <div className={styles.quickPillsRow}>
                                <span style={{ fontSize: '0.6875rem', color: '#94A3B8', fontWeight: 700 }}>Asignar rápido:</span>
                                {[10, 25, 33.3, 50, 75, 100].map(pVal => (
                                  <button
                                    key={pVal}
                                    type="button"
                                    onClick={() => handlePctChange(realWorkerIdx, alloc.projectId, pVal)}
                                    className={`${styles.quickPillBtn} ${Math.abs(allocPct - pVal) < 1 ? styles.quickPillBtnActive : ''}`}
                                  >
                                    {pVal === 33.3 ? '1/3' : `${pVal}%`}
                                  </button>
                                ))}
                                {freePct > 0 && (
                                  <button
                                    type="button"
                                    onClick={() => handlePctChange(realWorkerIdx, alloc.projectId, allocPct + freePct)}
                                    className={styles.quickPillBtn}
                                    style={{ background: '#EFF6FF', color: '#2563EB', borderColor: '#93C5FD' }}
                                  >
                                    + Todo Libre ({freePct.toFixed(0)}%)
                                  </button>
                                )}
                              </div>
                            </div>

                            {/* Cost Box */}
                            <div className={styles.economicImpactBox}>
                              <div className={styles.costMonthVal}>{formatCurrency(costMonth)}/mes</div>
                              <div className={styles.costYearSub}>{formatCurrency(costYear)} / año</div>
                            </div>

                            {/* Delete allocation button */}
                            <button
                              type="button"
                              onClick={() => handleHourChange(realWorkerIdx, alloc.projectId, 0)}
                              className={styles.removeAllocBtn}
                              title="Quitar este proyecto"
                            >
                              <Trash2 size={16} />
                            </button>
                          </div>
                        );
                      })
                    )}
                  </div>

                  {/* Add Project to Worker Row */}
                  {unassignedProjects.length > 0 && (
                    <div className={styles.addProjectDropdownRow}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <Plus size={16} color="#0D9488" />
                        <span style={{ fontSize: '0.8125rem', fontWeight: 800, color: '#0D3A5F' }}>
                          Asignar a un nuevo proyecto ({unassignedProjects.length} disponibles):
                        </span>
                      </div>

                      <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap', alignItems: 'center' }}>
                        {unassignedProjects.slice(0, 4).map(up => {
                          const pIdx = allProjectItems.findIndex(p => p.id === up.id);
                          const theme = getProjectTheme(up.id, pIdx >= 0 ? pIdx : 0);
                          const defaultAddPct = freePct > 0 ? Math.min(50, freePct) : 25;

                          return (
                            <button
                              key={up.id}
                              type="button"
                              onClick={() => handlePctChange(realWorkerIdx, up.id, defaultAddPct)}
                              className={styles.btnSecondary}
                              style={{ 
                                fontSize: '0.75rem', 
                                padding: '0.35rem 0.65rem',
                                borderColor: theme.border,
                                background: theme.light
                              }}
                            >
                              <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: theme.bg }} />
                              + {up.name.slice(0, 20)} ({defaultAddPct}%)
                            </button>
                          );
                        })}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* PESTAÑA 3: MATRIZ CUADRICULADA CLÁSICA (DIFF, FASES 1-4 & NÓMINAS)       */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {activeMode === 'matrix360' && (
        <div className={styles.matrixCard}>
          <div className={styles.matrixHeader}>
            <div>
              <h2 className={styles.matrixTitle}>
                <FileSpreadsheet size={20} color="#7C3AED" />
                <span>Matriz Detallada con las 4 Fases del Ciclo de Vida</span>
              </h2>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8125rem', color: '#64748B' }}>
                Vista cuantitativa con las 4 minibarras por celda: 🔵 1. Solicitado | 🟣 2. Reformulado | 🟡 3. Nóminas SEPA | 🟢 4. Justificado RLC.
              </p>
            </div>

            <div style={{ display: 'flex', gap: '0.5rem' }}>
              <button
                type="button"
                onClick={() => setActiveMode('visual_bars')}
                className={styles.btnSecondary}
                style={{ fontSize: '0.8125rem' }}
              >
                <Layers size={14} /> Ver Barras de Colores
              </button>
            </div>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ minWidth: '220px' }}>Trabajador / Categoría</th>
                  <th style={{ minWidth: '110px' }}>Jornada Max</th>
                  {projects.map((p, pIdx) => {
                    const theme = getProjectTheme(p.id, pIdx);
                    return (
                      <th key={p.id} style={{ minWidth: '185px', borderTop: `3px solid ${theme.bg}` }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
                          <span style={{ width: '8px', height: '8px', borderRadius: '50%', background: theme.bg }} />
                          <span>{p.name}</span>
                        </div>
                        <div style={{ fontSize: '0.6875rem', fontWeight: 600, color: '#64748B' }}>{p.phase || 'En Ejecución'}</div>
                      </th>
                    );
                  })}
                  <th style={{ minWidth: '160px', borderTop: '3px solid #64748B' }}>
                    Sede / Estructura
                  </th>
                  <th style={{ minWidth: '140px' }}>Dedicación Total</th>
                  <th style={{ width: '90px' }}>Ficha</th>
                </tr>
              </thead>
              <tbody>
                {filteredWorkers.map((worker) => {
                  const realWorkerIdx = workers.findIndex(w => w.id === worker.id);
                  const maxH = worker.maxWeeklyHours || 37.5;
                  const totalAllocHours = (worker.allocations || []).reduce((s, a) => s + (a.weeklyHours || 0), 0);
                  const isOver = totalAllocHours > maxH;
                  const pct = maxH > 0 ? (totalAllocHours / maxH) * 100 : 0;

                  return (
                    <tr key={worker.id}>
                      <td>
                        <strong style={{ color: '#0D3A5F', fontSize: '0.9375rem' }}>{worker.name}</strong>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{worker.role}</div>
                        <div style={{ fontSize: '0.6875rem', color: '#94A3B8' }}>{formatCurrency(worker.salaryMonthly)}/mes · {worker.contractType || 'Indefinido'}</div>
                      </td>

                      <td style={{ fontWeight: 700, color: '#0D3A5F' }}>
                        {maxH} h/sem
                      </td>

                      {/* Projects cells with 4 Mini-Bars */}
                      {projects.map((p) => {
                        const alloc = worker.allocations.find(a => a.projectId === p.id);
                        const h = alloc?.weeklyHours || 0;
                        const key = `${worker.id}_${p.id}`;
                        const lc = initialLifecycleMap[key];

                        return (
                          <td key={p.id} className={h > 0 ? styles.cellAllocated : undefined}>
                            <div className={styles.cell4BarsContainer}>
                              <div className={styles.cellInputRow}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                                  <input
                                    type="number"
                                    min="0"
                                    max={maxH}
                                    step="0.5"
                                    className={styles.inputNumber}
                                    value={h}
                                    onChange={e => handleHourChange(realWorkerIdx, p.id, parseFloat(e.target.value) || 0)}
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
                                    <div className={styles.barLine} title={`1. Solicitud: ${solH}h/sem`}>
                                      <span className={styles.barTagSol}>1. SOL</span>
                                      <div className={styles.barTrack}>
                                        <div className={styles.barFillSol} style={{ width: `${Math.min(100, solP)}%` }} />
                                      </div>
                                      <span className={styles.barNumber}>{solH}h</span>
                                    </div>
                                    <div className={styles.barLine} title={`2. Reformulación / Concedido: ${h}h/sem`}>
                                      <span className={styles.barTagRef}>2. REF</span>
                                      <div className={styles.barTrack}>
                                        <div className={styles.barFillRef} style={{ width: `${Math.min(100, refP)}%` }} />
                                      </div>
                                      <span className={styles.barNumber}>{h}h</span>
                                    </div>
                                    <div className={styles.barLine} title={`3. Nóminas pagadas: ${pMonths}/${tMonths}m`}>
                                      <span className={styles.barTagEjec}>3. EJE</span>
                                      <div className={styles.barTrack}>
                                        <div className={styles.barFillEjec} style={{ width: `${Math.min(100, ejeP)}%` }} />
                                      </div>
                                      <span className={styles.barNumber}>{pMonths}/{tMonths}m</span>
                                    </div>
                                    <div className={styles.barLine} title={`4. Justificación contable: ${jusP}% liquidado`}>
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

                      {/* Sede / Estructura */}
                      <td>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.3rem' }}>
                          <input
                            type="number"
                            min="0"
                            max={maxH}
                            step="0.5"
                            className={styles.inputNumber}
                            value={worker.allocations.find(a => a.projectId === 'sede')?.weeklyHours || 0}
                            onChange={e => handleHourChange(realWorkerIdx, 'sede', parseFloat(e.target.value) || 0)}
                          />
                          <span className={styles.hoursUnitLabel}>h/sem</span>
                        </div>
                      </td>

                      {/* Dedicación Total */}
                      <td>
                        <div style={{ fontWeight: 800, color: isOver ? '#DC2626' : '#0D3A5F', fontSize: '0.9375rem' }}>
                          {totalAllocHours.toFixed(1)} h/sem
                        </div>
                        <div>
                          {isOver ? (
                            <span className={styles.badgeDanger} style={{ fontSize: '0.6875rem' }}>
                              ⚠️ {pct.toFixed(0)}%
                            </span>
                          ) : (
                            <span className={styles.badgeOk} style={{ fontSize: '0.6875rem' }}>
                              ✓ {pct.toFixed(0)}%
                            </span>
                          )}
                        </div>
                      </td>

                      {/* Drawer Button */}
                      <td>
                        <button
                          type="button"
                          onClick={() => setSelectedWorkerId(worker.id)}
                          className={styles.btnSecondary}
                          style={{ fontSize: '0.75rem', padding: '0.3rem 0.5rem' }}
                        >
                          Ficha 360°
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* PESTAÑA 4: AUDITOR ANTIFRAUDE DE JORNADA                                 */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {activeMode === 'auditor' && (
        <div className={styles.visualCard}>
          <div style={{ background: overAllocatedWorkers.length > 0 ? '#FEF2F2' : '#F0FDF4', border: `1.5px solid ${overAllocatedWorkers.length > 0 ? '#FCA5A5' : '#86EFAC'}`, borderRadius: '12px', padding: '1.25rem', display: 'flex', alignItems: 'center', gap: '1rem' }}>
            <ShieldCheck size={32} color={overAllocatedWorkers.length > 0 ? '#DC2626' : '#16A34A'} />
            <div>
              <strong style={{ color: overAllocatedWorkers.length > 0 ? '#991B1B' : '#166534', fontSize: '1rem' }}>
                {overAllocatedWorkers.length === 0 
                  ? '✅ Toda la Plantilla Cumple Estrictamente la Jornada Laboral Máxima' 
                  : `⚠️ Se han detectado ${overAllocatedWorkers.length} trabajador/es con sobreimputación de jornada`}
              </strong>
              <p style={{ margin: '0.2rem 0 0 0', fontSize: '0.8125rem', color: overAllocatedWorkers.length > 0 ? '#B91C1C' : '#15803D' }}>
                Control preventivo de doble financiación conforme al Art. 34 del Estatuto de los Trabajadores y los Arts. 19 y 31 de la Ley 38/2003 General de Subvenciones.
              </p>
            </div>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Trabajador</th>
                  <th>Jornada Contractual Máxima</th>
                  <th>Horas Imputadas en Proyectos</th>
                  <th>Horas en Sede</th>
                  <th>Horas Totales Asignadas</th>
                  <th>Exceso Ilegal</th>
                  <th>Dictamen</th>
                  <th>Acción</th>
                </tr>
              </thead>
              <tbody>
                {workers.map((w, wIdx) => {
                  const maxH = w.maxWeeklyHours || 37.5;
                  const totalH = (w.allocations || []).reduce((s, a) => s + (a.weeklyHours || 0), 0);
                  const sedeH = w.allocations.find(a => a.projectId === 'sede')?.weeklyHours || 0;
                  const projH = totalH - sedeH;
                  const isOver = totalH > maxH;
                  const diff = totalH - maxH;

                  return (
                    <tr key={w.id} style={{ background: isOver ? '#FFF5F5' : undefined }}>
                      <td>
                        <strong>{w.name}</strong>
                        <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{w.role}</div>
                      </td>
                      <td>{maxH} h/sem</td>
                      <td>{projH.toFixed(1)} h/sem</td>
                      <td>{sedeH.toFixed(1)} h/sem</td>
                      <td>
                        <strong style={{ color: isOver ? '#DC2626' : '#0D3A5F' }}>{totalH.toFixed(1)} h/sem</strong>
                      </td>
                      <td>
                        {isOver ? (
                          <strong style={{ color: '#DC2626' }}>+{diff.toFixed(1)} h/sem</strong>
                        ) : (
                          <span style={{ color: '#16A34A' }}>0 h (Libre: {Math.abs(diff).toFixed(1)}h)</span>
                        )}
                      </td>
                      <td>
                        {isOver ? (
                          <span className={styles.badgeDanger}>⚠️ Riesgo Doble Financiación</span>
                        ) : (
                          <span className={styles.badgeOk}>✓ Conforme a Ley</span>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedWorkerId(w.id);
                            setActiveMode('interactive_editor');
                          }}
                          className={styles.btnSecondary}
                          style={{ fontSize: '0.75rem', padding: '0.3rem 0.6rem' }}
                        >
                          Ajustar %
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {/* DRAWER LATERAL: FICHA 360° DEL TRABAJADOR SELECCIONADO                   */}
      {/* ═════════════════════════════════════════════════════════════════════════ */}
      {selectedWorker && (
        <div className={styles.drawerOverlay} onClick={() => setSelectedWorkerId(null)}>
          <div className={styles.drawerContent} onClick={e => e.stopPropagation()}>
            <div className={styles.drawerHeader}>
              <div>
                <h3 className={styles.drawerTitle}>{selectedWorker.name}</h3>
                <span className={styles.drawerSubtitle}>{selectedWorker.role} · Ficha de Imputación 360°</span>
              </div>
              <button
                type="button"
                onClick={() => setSelectedWorkerId(null)}
                className={styles.closeDrawerBtn}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.drawerBody}>
              {/* Cost Summary */}
              {(() => {
                const maxH = selectedWorker.maxWeeklyHours || 37.5;
                const totalH = (selectedWorker.allocations || []).reduce((s, a) => s + (a.weeklyHours || 0), 0);
                const salMes = selectedWorker.pagas === 14 ? (selectedWorker.salaryMonthly * 14) / 12 : selectedWorker.salaryMonthly;
                const ssMes = (salMes * (selectedWorker.ssPct || 31.4)) / 100;
                const costeEmpresaMes = salMes + ssMes;
                const isOver = totalH > maxH;

                return (
                  <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
                    <div style={{ background: '#F8FAFC', border: '1px solid #E2E8F0', borderRadius: '10px', padding: '1rem', display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '0.75rem' }}>
                      <div>
                        <span style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 800 }}>SALARIO BRUTO</span>
                        <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0D3A5F' }}>{formatCurrency(selectedWorker.salaryMonthly)}/m</div>
                      </div>
                      <div>
                        <span style={{ fontSize: '0.6875rem', color: '#64748B', fontWeight: 800 }}>COSTE EMPRESA MES</span>
                        <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#0D3A5F' }}>{formatCurrency(costeEmpresaMes)}/m</div>
                      </div>
                    </div>

                    {/* Breakdown by project */}
                    <h4 style={{ margin: '0.5rem 0 0 0', fontSize: '0.875rem', fontWeight: 800, color: '#0D3A5F' }}>
                      Reparto de Horas y Costes por Proyecto:
                    </h4>

                    {selectedWorker.allocations.filter(a => a.weeklyHours > 0).map(alloc => {
                      const pIdx = allProjectItems.findIndex(p => p.id === alloc.projectId);
                      const theme = getProjectTheme(alloc.projectId, pIdx >= 0 ? pIdx : 0);
                      const allocPct = maxH > 0 ? (alloc.weeklyHours / maxH) * 100 : 0;
                      const cMes = costeEmpresaMes * (allocPct / 100);

                      return (
                        <div key={alloc.projectId} style={{ background: 'white', border: `1.5px solid ${theme.border}`, borderRadius: '10px', padding: '0.85rem 1rem' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.45rem' }}>
                              <span style={{ width: '10px', height: '10px', borderRadius: '50%', background: theme.bg }} />
                              <strong style={{ fontSize: '0.875rem', color: '#0D3A5F' }}>{alloc.projectName}</strong>
                            </div>
                            <strong style={{ color: theme.bg, fontSize: '0.9375rem' }}>{allocPct.toFixed(1)}% ({alloc.weeklyHours}h)</strong>
                          </div>
                          <div style={{ fontSize: '0.75rem', color: '#64748B', display: 'flex', justifyContent: 'space-between' }}>
                            <span>Coste mensual imputado:</span>
                            <strong>{formatCurrency(cMes)}/mes</strong>
                          </div>
                        </div>
                      );
                    })}

                    <button
                      type="button"
                      onClick={() => {
                        setSelectedWorkerId(null);
                        setActiveMode('interactive_editor');
                      }}
                      className={styles.btnPrimary}
                      style={{ marginTop: '0.5rem' }}
                    >
                      <SlidersHorizontal size={16} /> Abrir en Asignador de Porcentajes
                    </button>
                  </div>
                );
              })()}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
