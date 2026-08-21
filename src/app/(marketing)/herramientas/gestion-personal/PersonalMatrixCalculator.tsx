'use client';

import React, { useState, useId } from 'react';
import { Plus, Trash2, User, Briefcase, CheckCircle2, AlertTriangle, AlertCircle, FileSpreadsheet, Building2 } from 'lucide-react';
import { ResultPanel } from '@/components/tools/ResultPanel';
import { saveToolData } from '@/app/actions/tools';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/Toast';
import { ExportPdfButton } from '@/components/ui/ExportPdfButton';
import styles from './personal.module.css';

export interface ProjectAllocation {
  id: string;
  projectName: string;
  weeklyHours: number;
  months: number;
}

export interface Worker {
  id: string;
  name: string;
  role: string;
  category: string;
  salaryMonthly: number;
  pagas: number;
  ssPct: number;
  maxWeeklyHours: number;
  allocations: ProjectAllocation[];
}

export interface PersonalMatrixData {
  organizationName?: string;
  workers?: Worker[];
}

interface PersonalMatrixCalculatorProps {
  initialData?: unknown;
  projectId?: string;
  projectName?: string;
  availableProjects?: Array<{ id: string; name: string }>;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);

const formatPct = (pct: number) =>
  `${pct.toFixed(1).replace('.', ',')}%`;

const parseInit = (data: unknown, currentProjectName?: string): PersonalMatrixData => {
  const d = (data && typeof data === 'object' ? data : {}) as Record<string, unknown>;
  const defaultWorkers: Worker[] = [
    {
      id: '1',
      name: 'María García López',
      role: 'Trabajadora Social',
      category: 'Grupo 1 - Titulada Superior',
      salaryMonthly: 1950,
      pagas: 14,
      ssPct: 31.4,
      maxWeeklyHours: 37.5,
      allocations: [
        { id: 'a1', projectName: currentProjectName || 'Proyecto Inserción IRPF', weeklyHours: 20, months: 12 },
        { id: 'a2', projectName: 'Programa Familias Ayto', weeklyHours: 10, months: 12 },
        { id: 'a3', projectName: 'Sede / Estructura General', weeklyHours: 7.5, months: 12 },
      ]
    },
    {
      id: '2',
      name: 'Carlos Ruiz Morales',
      role: 'Educador Social',
      category: 'Grupo 2 - Titulado Medio',
      salaryMonthly: 1750,
      pagas: 12,
      ssPct: 31.4,
      maxWeeklyHours: 37.5,
      allocations: [
        { id: 'a4', projectName: currentProjectName || 'Proyecto Inserción IRPF', weeklyHours: 25, months: 12 },
        { id: 'a5', projectName: 'Taller Juventud FSE', weeklyHours: 12.5, months: 10 },
      ]
    },
    {
      id: '3',
      name: 'Elena Soria Santos',
      role: 'Coordinadora de Proyectos',
      category: 'Grupo 1 - Dirección Técnica',
      salaryMonthly: 2300,
      pagas: 14,
      ssPct: 31.4,
      maxWeeklyHours: 37.5,
      allocations: [
        { id: 'a6', projectName: currentProjectName || 'Proyecto Inserción IRPF', weeklyHours: 10, months: 12 },
        { id: 'a7', projectName: 'Programa Familias Ayto', weeklyHours: 15, months: 12 },
        { id: 'a8', projectName: 'Sede / Estructura General', weeklyHours: 12.5, months: 12 },
      ]
    }
  ];

  return {
    organizationName: typeof d.organizationName === 'string' ? d.organizationName : 'Entidad Social / ONG',
    workers: Array.isArray(d.workers) && d.workers.length > 0 ? (d.workers as Worker[]) : defaultWorkers,
  };
};

export function PersonalMatrixCalculator({
  initialData,
  projectId,
  projectName,
  availableProjects = [],
}: PersonalMatrixCalculatorProps) {
  const uid = useId();
  const init = parseInit(initialData, projectName);
  const { toasts, showToast, removeToast } = useToast();

  const [activeTab, setActiveTab] = useState<'plantilla' | 'matriz' | 'proyectos'>('plantilla');
  const [organizationName, setOrganizationName] = useState<string>(init.organizationName || 'Entidad Social');
  const [workers, setWorkers] = useState<Worker[]>(init.workers || []);
  const [isSaving, setIsSaving] = useState(false);

  // Cálculos por trabajador
  const calculateWorkerMetrics = (w: Worker) => {
    const salarioMes = w.pagas === 14 ? (w.salaryMonthly * 14) / 12 : w.salaryMonthly;
    const ssMes = (salarioMes * w.ssPct) / 100;
    const costeEmpresaMes = salarioMes + ssMes;
    const costeEmpresaAnual = costeEmpresaMes * 12;
    
    // Horas asignadas
    const totalHorasAsignadas = w.allocations.reduce((acc, a) => acc + (Number(a.weeklyHours) || 0), 0);
    const pctAsignado = w.maxWeeklyHours > 0 ? (totalHorasAsignadas / w.maxWeeklyHours) * 100 : 0;
    
    // Coste por hora (asumiendo jornada anual estándar de 1650 horas o semanal * 44 semanas)
    const horasAnuales = (w.maxWeeklyHours || 37.5) * 44;
    const costeHora = horasAnuales > 0 ? costeEmpresaAnual / horasAnuales : 0;

    return {
      salarioMes,
      ssMes,
      costeEmpresaMes,
      costeEmpresaAnual,
      totalHorasAsignadas,
      pctAsignado,
      costeHora,
    };
  };

  // Acciones de trabajadores
  const addWorker = () => {
    const newWorker: Worker = {
      id: String(Date.now()),
      name: '',
      role: 'Técnico/a de Proyecto',
      category: 'Grupo 1 - Titulado Superior',
      salaryMonthly: 1800,
      pagas: 12,
      ssPct: 31.4,
      maxWeeklyHours: 37.5,
      allocations: [
        { id: `a-${Date.now()}-1`, projectName: projectName || 'Proyecto Principal', weeklyHours: 20, months: 12 }
      ]
    };
    setWorkers(prev => [...prev, newWorker]);
    showToast('Nuevo trabajador añadido a la plantilla', 'info');
  };

  const updateWorker = (id: string, field: keyof Worker, value: unknown) => {
    setWorkers(prev => prev.map(w => w.id === id ? { ...w, [field]: value } : w));
  };

  const removeWorker = (id: string) => {
    setWorkers(prev => prev.filter(w => w.id !== id));
  };

  // Acciones de asignaciones
  const addAllocation = (workerId: string) => {
    setWorkers(prev => prev.map(w => {
      if (w.id !== workerId) return w;
      const newAlloc: ProjectAllocation = {
        id: `alloc-${Date.now()}`,
        projectName: 'Nuevo Proyecto / Subvención',
        weeklyHours: 10,
        months: 12
      };
      return { ...w, allocations: [...w.allocations, newAlloc] };
    }));
  };

  const updateAllocation = (workerId: string, allocId: string, field: keyof ProjectAllocation, value: unknown) => {
    setWorkers(prev => prev.map(w => {
      if (w.id !== workerId) return w;
      const updatedAllocations = w.allocations.map(a => a.id === allocId ? { ...a, [field]: value } : a);
      return { ...w, allocations: updatedAllocations };
    }));
  };

  const removeAllocation = (workerId: string, allocId: string) => {
    setWorkers(prev => prev.map(w => {
      if (w.id !== workerId) return w;
      return { ...w, allocations: w.allocations.filter(a => a.id !== allocId) };
    }));
  };

  // Cálculos Globales
  const totalPlantilla = workers.length;
  const totalCosteEmpresaAnual = workers.reduce((sum, w) => sum + calculateWorkerMetrics(w).costeEmpresaAnual, 0);
  const totalCosteEmpresaMensual = workers.reduce((sum, w) => sum + calculateWorkerMetrics(w).costeEmpresaMes, 0);

  // Lista única de todos los proyectos imputados en la plantilla
  const allProjectNames = Array.from(
    new Set(workers.flatMap(w => w.allocations.map(a => a.projectName.trim())).filter(Boolean))
  );

  const handleSave = async () => {
    setIsSaving(true);
    try {
      const payload: PersonalMatrixData = {
        organizationName,
        workers,
      };
      if (projectId) {
        await saveToolData(projectId, 'gestion-personal', payload);
      }
      showToast('Matriz de personal guardada correctamente', 'success');
    } catch {
      showToast('Error al guardar la matriz de personal', 'error');
    }
    setIsSaving(false);
  };

  const copyText = [
    `MATRIZ GENERAL DE IMPUTACIÓN DE PERSONAL - ${organizationName}`,
    `Total Plantilla: ${totalPlantilla} trabajadores | Coste Anual Total: ${formatCurrency(totalCosteEmpresaAnual)}`,
    '',
    '--- DETALLE DE IMPUTACIÓN POR TRABAJADOR ---',
    ...workers.map(w => {
      const m = calculateWorkerMetrics(w);
      const allocs = w.allocations.map(a => {
        const pct = w.maxWeeklyHours > 0 ? (a.weeklyHours / w.maxWeeklyHours) * 100 : 0;
        const costeImputadoMes = (m.costeEmpresaMes * pct) / 100;
        return `    • ${a.projectName}: ${a.weeklyHours}h/sem (${pct.toFixed(1)}%) -> ${formatCurrency(costeImputadoMes)}/mes (${a.months}m)`;
      }).join('\n');
      return `[${w.name || 'Sin nombre'} - ${w.role}] Coste Empresa: ${formatCurrency(m.costeEmpresaMes)}/mes (${formatCurrency(m.costeEmpresaAnual)}/año)\n${allocs}`;
    }),
    '',
    '=========================================',
    'Documento válido para auditorías de justificación de subvenciones públicas.',
  ].join('\n');

  return (
    <div id="personal-export-target" className={styles.container}>
      <datalist id={`${uid}-projects-list`}>
        {availableProjects.map(p => (
          <option key={p.id} value={p.name} />
        ))}
      </datalist>

      {/* Cabecera de la Entidad */}
      <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border-color)', padding: '1rem 1.5rem', borderRadius: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Building2 size={24} color="#2563eb" />
          <div>
            <label htmlFor={`${uid}-org`} style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--text-secondary)', textTransform: 'uppercase' }}>
              Entidad Social / Organización
            </label>
            <input
              id={`${uid}-org`}
              type="text"
              className={styles.input}
              style={{ fontWeight: 700, fontSize: '1.125rem', padding: '0.25rem 0.5rem', border: '1px solid var(--border-subtle)' }}
              value={organizationName}
              onChange={e => setOrganizationName(e.target.value)}
              placeholder="Nombre de la ONG / Entidad"
            />
          </div>
        </div>
      </div>

      {/* Pestañas de Vista */}
      <div className={styles.tabBar}>
        <button
          type="button"
          onClick={() => setActiveTab('plantilla')}
          className={`${styles.tabBtn} ${activeTab === 'plantilla' ? styles.tabActive : ''}`}
        >
          <User size={18} />
          <span>1. Plantilla y Costes Salariales</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('matriz')}
          className={`${styles.tabBtn} ${activeTab === 'matriz' ? styles.tabActive : ''}`}
        >
          <FileSpreadsheet size={18} />
          <span>2. Matriz Global de Imputación</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('proyectos')}
          className={`${styles.tabBtn} ${activeTab === 'proyectos' ? styles.tabActive : ''}`}
        >
          <Building2 size={18} />
          <span>3. Costes de Personal por Proyecto</span>
        </button>
      </div>

      {/* Tarjetas KPI de la Entidad */}
      <div className={styles.summaryGrid}>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Plantilla Activa</span>
          <span className={styles.summaryValue}>{totalPlantilla} trabajadores</span>
          <span className={styles.summarySubtitle}>Equipo técnico contratado</span>
        </div>
        <div className={styles.summaryCard}>
          <span className={styles.summaryLabel}>Coste Empresa / Mes</span>
          <span className={styles.summaryValue}>{formatCurrency(totalCosteEmpresaMensual)}</span>
          <span className={styles.summarySubtitle}>Bruto + SS Patronal (~31,4%)</span>
        </div>
        <div className={`${styles.summaryCard} ${styles.summaryCardHighlight}`}>
          <span className={styles.summaryLabel}>Coste Total Plantilla / Año</span>
          <span className={styles.summaryValue}>{formatCurrency(totalCosteEmpresaAnual)}</span>
          <span className={styles.summarySubtitle}>Masa salarial total de la entidad</span>
        </div>
      </div>

      {/* VISTA 1: PLANTILLA Y FICHAS DE TRABAJADORES */}
      {activeTab === 'plantilla' && (
        <div>
          {workers.map((worker) => {
            const m = calculateWorkerMetrics(worker);
            let statusBadge = <span className={styles.badgeOk}><CheckCircle2 size={14} /> 100% Imputado ({m.totalHorasAsignadas}h / {worker.maxWeeklyHours}h)</span>;
            
            if (m.totalHorasAsignadas > worker.maxWeeklyHours) {
              statusBadge = <span className={styles.badgeDanger}><AlertCircle size={14} /> Sobreimputación Ilegal ({m.totalHorasAsignadas}h / {worker.maxWeeklyHours}h)</span>;
            } else if (m.totalHorasAsignadas < worker.maxWeeklyHours) {
              statusBadge = <span className={styles.badgeWarning}><AlertTriangle size={14} /> Horas Disponibles ({m.totalHorasAsignadas}h / {worker.maxWeeklyHours}h)</span>;
            }

            return (
              <div key={worker.id} className={styles.workerCard}>
                <div className={styles.workerHeader}>
                  <div className={styles.workerTitle}>
                    <User size={20} color="#2563eb" />
                    <span>{worker.name || 'Nuevo Trabajador/a'}</span>
                    <span style={{ fontSize: '0.875rem', fontWeight: 500, color: 'var(--text-secondary)' }}>({worker.role})</span>
                  </div>
                  <div className={styles.workerKpis}>
                    {statusBadge}
                    <div className={styles.workerKpiItem}>
                      <strong>Coste Empresa:</strong> {formatCurrency(m.costeEmpresaMes)}/mes ({formatCurrency(m.costeEmpresaAnual)}/año)
                    </div>
                    <button
                      type="button"
                      onClick={() => removeWorker(worker.id)}
                      className={styles.deleteBtn}
                      title="Eliminar trabajador"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                {/* Datos Salariales del Trabajador */}
                <div className={styles.row4}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Nombre completo del trabajador</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={worker.name}
                      onChange={e => updateWorker(worker.id, 'name', e.target.value)}
                      placeholder="Ej: Ana Belén Moreno"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Puesto / Perfil</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={worker.role}
                      onChange={e => updateWorker(worker.id, 'role', e.target.value)}
                      placeholder="Ej: Educador/a Social"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Categoría / Convenio</label>
                    <input
                      type="text"
                      className={styles.input}
                      value={worker.category}
                      onChange={e => updateWorker(worker.id, 'category', e.target.value)}
                      placeholder="Ej: Grupo 1 - Titulado Superior"
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Salario Bruto (€/mes)</label>
                    <input
                      type="number"
                      min="0"
                      step="0.01"
                      className={styles.input}
                      value={worker.salaryMonthly || ''}
                      onChange={e => updateWorker(worker.id, 'salaryMonthly', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                </div>

                <div className={styles.row3}>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Pagas Anuales</label>
                    <select
                      className={styles.select}
                      value={worker.pagas}
                      onChange={e => updateWorker(worker.id, 'pagas', parseInt(e.target.value) || 12)}
                    >
                      <option value={12}>12 pagas (Pagas extras prorrateadas)</option>
                      <option value={14}>14 pagas (12 nóminas + 2 extras)</option>
                    </select>
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>SS Patronal Empresa (%)</label>
                    <input
                      type="number"
                      min="0"
                      max="50"
                      step="0.1"
                      className={styles.input}
                      value={worker.ssPct}
                      onChange={e => updateWorker(worker.id, 'ssPct', parseFloat(e.target.value) || 0)}
                    />
                  </div>
                  <div className={styles.formGroup}>
                    <label className={styles.label}>Jornada Semanal Convenio (h)</label>
                    <input
                      type="number"
                      min="1"
                      max="40"
                      step="0.5"
                      className={styles.input}
                      value={worker.maxWeeklyHours}
                      onChange={e => updateWorker(worker.id, 'maxWeeklyHours', parseFloat(e.target.value) || 37.5)}
                    />
                  </div>
                </div>

                {/* Reparto Horario e Imputación a Proyectos */}
                <div className={styles.allocationsSection}>
                  <div className={styles.allocationsHeader}>
                    <span className={styles.allocationsTitle}>
                      <Briefcase size={16} color="#2563eb" />
                      Imputación a Proyectos y Subvenciones
                    </span>
                    <button
                      type="button"
                      onClick={() => addAllocation(worker.id)}
                      className={styles.addBtn}
                    >
                      <Plus size={14} /> Añadir Proyecto
                    </button>
                  </div>

                  <div style={{ display: 'grid', gridTemplateColumns: '2fr 100px 90px 120px 36px', gap: '0.75rem', fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase', marginBottom: '0.5rem' }}>
                    <span>Proyecto / Subvención</span>
                    <span>Horas/sem</span>
                    <span>Meses</span>
                    <span style={{ textAlign: 'right' }}>Coste Imputado</span>
                    <span></span>
                  </div>

                  {worker.allocations.map((alloc) => {
                    const pct = worker.maxWeeklyHours > 0 ? (alloc.weeklyHours / worker.maxWeeklyHours) * 100 : 0;
                    const costeImputadoMes = (m.costeEmpresaMes * pct) / 100;
                    const costeImputadoTotal = costeImputadoMes * (alloc.months || 12);

                    return (
                      <div key={alloc.id} className={styles.allocationRow}>
                        <input
                          type="text"
                          className={styles.input}
                          list={`${uid}-projects-list`}
                          value={alloc.projectName}
                          onChange={e => updateAllocation(worker.id, alloc.id, 'projectName', e.target.value)}
                          placeholder="Nombre del Proyecto o Subvención"
                        />
                        <input
                          type="number"
                          min="0.5"
                          max={worker.maxWeeklyHours}
                          step="0.5"
                          className={styles.input}
                          value={alloc.weeklyHours || ''}
                          onChange={e => updateAllocation(worker.id, alloc.id, 'weeklyHours', parseFloat(e.target.value) || 0)}
                          placeholder="Horas"
                        />
                        <input
                          type="number"
                          min="1"
                          max="12"
                          className={styles.input}
                          value={alloc.months || ''}
                          onChange={e => updateAllocation(worker.id, alloc.id, 'months', parseInt(e.target.value) || 12)}
                          placeholder="Meses"
                        />
                        <div className={styles.allocationCost}>
                          {formatCurrency(costeImputadoTotal)}
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                            {formatPct(pct)} ({formatCurrency(costeImputadoMes)}/m)
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={() => removeAllocation(worker.id, alloc.id)}
                          className={styles.deleteBtn}
                          title="Eliminar asignación"
                        >
                          <Trash2 size={16} />
                        </button>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}

          <button type="button" onClick={addWorker} className={styles.addWorkerBtn}>
            <Plus size={18} /> Añadir Nuevo Trabajador/a a la Plantilla
          </button>
        </div>
      )}

      {/* VISTA 2: MATRIZ GLOBAL DE IMPUTACIÓN */}
      {activeTab === 'matriz' && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Trabajador/a</th>
                <th>Puesto / Categoría</th>
                <th className={styles.numCol}>Coste Empresa / Mes</th>
                {allProjectNames.map(pName => (
                  <th key={pName} className={styles.numCol}>{pName}</th>
                ))}
                <th className={styles.numCol}>Total Imputado</th>
                <th>Estado Auditoría</th>
              </tr>
            </thead>
            <tbody>
              {workers.map(w => {
                const m = calculateWorkerMetrics(w);
                return (
                  <tr key={w.id}>
                    <td><strong>{w.name || 'Sin nombre'}</strong></td>
                    <td>{w.role}</td>
                    <td className={styles.numCol}><strong>{formatCurrency(m.costeEmpresaMes)}</strong></td>
                    {allProjectNames.map(pName => {
                      const alloc = w.allocations.find(a => a.projectName.trim().toLowerCase() === pName.toLowerCase());
                      if (!alloc) return <td key={pName} className={styles.numCol} style={{ color: 'var(--text-muted)' }}>—</td>;
                      const pct = w.maxWeeklyHours > 0 ? (alloc.weeklyHours / w.maxWeeklyHours) * 100 : 0;
                      const costeMes = (m.costeEmpresaMes * pct) / 100;
                      return (
                        <td key={pName} className={styles.numCol}>
                          <div style={{ fontWeight: 700 }}>{formatCurrency(costeMes)}/m</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>{alloc.weeklyHours}h ({formatPct(pct)})</div>
                        </td>
                      );
                    })}
                    <td className={styles.numCol} style={{ fontWeight: 800 }}>
                      {formatPct(m.pctAsignado)}
                    </td>
                    <td>
                      {m.totalHorasAsignadas === w.maxWeeklyHours ? (
                        <span className={styles.badgeOk}><CheckCircle2 size={12} /> 100% OK</span>
                      ) : m.totalHorasAsignadas > w.maxWeeklyHours ? (
                        <span className={styles.badgeDanger}><AlertCircle size={12} /> Sobreimputado</span>
                      ) : (
                        <span className={styles.badgeWarning}><AlertTriangle size={12} /> Parcial</span>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}

      {/* VISTA 3: RESUMEN ECONÓMICO POR PROYECTO */}
      {activeTab === 'proyectos' && (
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Proyecto / Subvención</th>
                <th>Personal Asignado</th>
                <th className={styles.numCol}>Horas/Semana Totales</th>
                <th className={styles.numCol}>Coste Personal / Mes</th>
                <th className={styles.numCol}>Coste Personal Anual Imputado</th>
              </tr>
            </thead>
            <tbody>
              {allProjectNames.map(pName => {
                let totalHoras = 0;
                let totalCosteMes = 0;
                let totalCosteAnual = 0;
                const assignedWorkers: Array<{ name: string; hours: number; costMes: number }> = [];

                workers.forEach(w => {
                  const m = calculateWorkerMetrics(w);
                  w.allocations.forEach(a => {
                    if (a.projectName.trim().toLowerCase() === pName.toLowerCase()) {
                      const pct = w.maxWeeklyHours > 0 ? (a.weeklyHours / w.maxWeeklyHours) * 100 : 0;
                      const cMes = (m.costeEmpresaMes * pct) / 100;
                      const cAnual = cMes * (a.months || 12);
                      totalHoras += a.weeklyHours;
                      totalCosteMes += cMes;
                      totalCosteAnual += cAnual;
                      assignedWorkers.push({ name: w.name || w.role, hours: a.weeklyHours, costMes: cMes });
                    }
                  });
                });

                return (
                  <tr key={pName}>
                    <td>
                      <strong style={{ fontSize: '1rem', color: '#1e3a8a' }}>{pName}</strong>
                    </td>
                    <td>
                      <div style={{ display: 'flex', flexDirection: 'column', gap: '0.2rem' }}>
                        {assignedWorkers.map((aw, i) => (
                          <span key={i} style={{ fontSize: '0.8125rem' }}>
                            • {aw.name}: {aw.hours}h/sem ({formatCurrency(aw.costMes)}/m)
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className={styles.numCol}><strong>{totalHoras} h/sem</strong></td>
                    <td className={styles.numCol}><strong>{formatCurrency(totalCosteMes)}</strong></td>
                    <td className={styles.numCol} style={{ fontWeight: 800, color: '#15803d', fontSize: '1.0625rem' }}>
                      {formatCurrency(totalCosteAnual)}
                    </td>
                  </tr>
                );
              })}
            </tbody>
            <tfoot>
              <tr className={styles.totalRow}>
                <td>TOTAL CONSOLIDADO PLANTILLA</td>
                <td>{totalPlantilla} trabajadores</td>
                <td className={styles.numCol}>—</td>
                <td className={styles.numCol}>{formatCurrency(totalCosteEmpresaMensual)}</td>
                <td className={styles.numCol} style={{ color: '#15803d', fontSize: '1.125rem' }}>
                  {formatCurrency(totalCosteEmpresaAnual)}
                </td>
              </tr>
            </tfoot>
          </table>
        </div>
      )}

      {/* Panel de Resultados y Exportación Oficial */}
      <ResultPanel title="Cuadro Oficial de Imputación de Personal (Auditoría)" copyText={copyText}>
        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }} className="no-print">
          <ExportPdfButton targetId="personal-export-target" filename="matriz-imputacion-personal" projectName={organizationName} />
          {projectId && (
            <button
              onClick={handleSave}
              disabled={isSaving}
              style={{
                backgroundColor: 'var(--color-primary-600)',
                color: 'white',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                fontWeight: 600,
                cursor: isSaving ? 'not-allowed' : 'pointer',
                opacity: isSaving ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem',
              }}
            >
              {isSaving ? 'Guardando...' : '💾 Guardar en Proyecto'}
            </button>
          )}
        </div>
      </ResultPanel>
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
