'use client';

import React, { useState, useId } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { ResultPanel } from '@/components/tools/ResultPanel';
import { saveToolData } from '@/app/actions/tools';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/Toast';
import { ExportPdfButton } from '@/components/ui/ExportPdfButton';
import { ProjectBridgeBanner } from '@/components/tools/ProjectBridgeBanner';
import styles from './prorrateo.module.css';

interface ProjectEntry {
  id: string;
  name: string;
  hours: number;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(amount);

const formatPct = (pct: number) =>
  `${pct.toFixed(2).replace('.', ',')}%`;

interface ProrrateoData {
  workerRole?: string;
  salary?: string;
  pagas?: number;
  ssPct?: number;
  maxWeeklyHours?: number;
  projects?: ProjectEntry[];
}

interface ProrrateoCalculatorProps {
  initialData?: unknown;
  projectId?: string;
  projectName?: string;
}

const parseInit = (data: unknown): ProrrateoData =>
  (data && typeof data === 'object' ? data : {}) as ProrrateoData;

export function ProrrateoCalculator({ initialData, projectId, projectName }: ProrrateoCalculatorProps) {
  const uid = useId();
  
  const init = parseInit(initialData);
  const { toasts, showToast, removeToast } = useToast();

  const [workerRole, setWorkerRole] = useState<string>(init.workerRole || '');
  const [salary, setSalary] = useState<string>(init.salary || '');
  const [pagas, setPagas] = useState<number>(init.pagas || 12);
  const [ssPct, setSsPct] = useState<number>(init.ssPct !== undefined ? init.ssPct : 31.4);
  const [maxWeeklyHours, setMaxWeeklyHours] = useState<number>(init.maxWeeklyHours || 37.5);

  const [projects, setProjects] = useState<ProjectEntry[]>(init.projects || [
    { id: '1', name: projectName || 'Proyecto Principal', hours: 20 },
    { id: '2', name: 'Otros programas / Sede', hours: 17.5 },
  ]);
  const [isSaving, setIsSaving] = useState(false);

  const salaryNum = parseFloat(salary) || 0;
  
  // Salario bruto anual = mensual * pagas
  const annualGross = pagas === 14 ? salaryNum * 14 : salaryNum * 12;
  const monthlyGrossCost = annualGross / 12;
  
  // SS Empresa
  const monthlySsCost = (monthlyGrossCost * ssPct) / 100;
  const annualSsCost = monthlySsCost * 12;

  // Coste Total Empresa
  const monthlyTotalCost = monthlyGrossCost + monthlySsCost;
  const annualTotalCost = annualGross + annualSsCost;

  const totalHours = projects.reduce((acc, p) => acc + (p.hours || 0), 0);

  const results = projects.map(p => {
    const pct = totalHours > 0 ? (p.hours / totalHours) * 100 : 0;
    const monthlyGross = (monthlyGrossCost * pct) / 100;
    const monthlySs = (monthlySsCost * pct) / 100;
    const monthlyTotal = (monthlyTotalCost * pct) / 100;
    const annualTotal = monthlyTotal * 12;

    return { 
      ...p, 
      pct, 
      monthlyGross, 
      monthlySs, 
      monthlyTotal, 
      annualTotal 
    };
  });

  const totalMonthlyGross = results.reduce((acc, r) => acc + r.monthlyGross, 0);
  const totalMonthlySs = results.reduce((acc, r) => acc + r.monthlySs, 0);
  const totalMonthly = results.reduce((acc, r) => acc + r.monthlyTotal, 0);
  const totalAnnual = results.reduce((acc, r) => acc + r.annualTotal, 0);

  const isOverHours = totalHours > maxWeeklyHours;

  const addProject = () => {
    setProjects(prev => [
      ...prev,
      { id: Date.now().toString(), name: '', hours: 0 },
    ]);
  };

  const removeProject = (id: string) => {
    setProjects(prev => prev.filter(p => p.id !== id));
  };

  const updateProject = (id: string, field: keyof ProjectEntry, value: string | number) => {
    setProjects(prev =>
      prev.map(p => (p.id === id ? { ...p, [field]: value } : p))
    );
  };

  const handleSave = async () => {
    if (!projectId) return;
    setIsSaving(true);
    try {
      const payload = { 
        workerRole,
        salary, 
        pagas, 
        ssPct, 
        maxWeeklyHours, 
        projects,
        summary: {
          monthlyTotalCost,
          annualTotalCost,
          results
        }
      };
      await saveToolData(projectId, 'prorrateo-nominas', payload);
      showToast('Prorrateo guardado con éxito', 'success');
    } catch {
      showToast('Error al guardar el prorrateo', 'error');
    }
    setIsSaving(false);
  };

  const copyText = [
    `PRORRATEO DE NÓMINA Y COSTE EMPRESA${workerRole ? ` - ${workerRole}` : ''}`,
    `Salario bruto mensual: ${formatCurrency(salaryNum)} (${pagas} pagas)`,
    `Seguridad Social Empresa (${ssPct}%): ${formatCurrency(monthlySsCost)}/mes`,
    `Coste total empresa: ${formatCurrency(monthlyTotalCost)}/mes | ${formatCurrency(annualTotalCost)}/año`,
    `Jornada: ${totalHours}h / ${maxWeeklyHours}h semanales`,
    '',
    'Proyecto | Horas/sem | % Jornada | Bruto/mes | SS Emp/mes | Coste Total/mes | Coste Total/año',
    ...results.map(r =>
      `${r.name || '(sin nombre)'} | ${r.hours}h | ${formatPct(r.pct)} | ${formatCurrency(r.monthlyGross)} | ${formatCurrency(r.monthlySs)} | ${formatCurrency(r.monthlyTotal)} | ${formatCurrency(r.annualTotal)}`
    ),
    '',
    `TOTAL | ${totalHours}h | 100% | ${formatCurrency(totalMonthlyGross)} | ${formatCurrency(totalMonthlySs)} | ${formatCurrency(totalMonthly)} | ${formatCurrency(totalAnnual)}`,
  ].join('\n');

  const isEmpty = salaryNum === 0 || totalHours === 0;

  return (
    <div>
      <div className={styles.row2}>
        <div className={styles.formGroup}>
          <label htmlFor={`${uid}-role`} className={styles.label}>
            Puesto / Nombre del trabajador/a
          </label>
          <input
            id={`${uid}-role`}
            type="text"
            className={styles.input}
            value={workerRole}
            onChange={e => setWorkerRole(e.target.value)}
            placeholder="Ej: Educador/a Social - Técnico de Proyecto"
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor={`${uid}-hours-max`} className={styles.label}>
            Jornada completa de convenio (horas/semana)
          </label>
          <input
            id={`${uid}-hours-max`}
            type="number"
            min="1"
            max="40"
            step="0.5"
            className={styles.input}
            value={maxWeeklyHours}
            onChange={e => setMaxWeeklyHours(parseFloat(e.target.value) || 37.5)}
          />
          <span className={styles.helperText}>Habitual 37.5h (Intervención Social) o 40h</span>
        </div>
      </div>

      <div className={styles.row3}>
        <div className={styles.formGroup}>
          <label htmlFor={`${uid}-salary`} className={styles.label}>
            Salario bruto mensual (€)
          </label>
          <input
            id={`${uid}-salary`}
            type="number"
            min="0"
            step="0.01"
            className={styles.input}
            value={salary}
            onChange={e => setSalary(e.target.value)}
            placeholder="Ej: 1.800"
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor={`${uid}-pagas`} className={styles.label}>
            Número de pagas
          </label>
          <select
            id={`${uid}-pagas`}
            className={styles.input}
            value={pagas}
            onChange={e => setPagas(parseInt(e.target.value) || 12)}
          >
            <option value={12}>12 pagas (Prorrateadas)</option>
            <option value={14}>14 pagas (12 + 2 extras)</option>
          </select>
        </div>
        <div className={styles.formGroup}>
          <label htmlFor={`${uid}-ss`} className={styles.label}>
            SS Empresa (% Cuota Patronal)
          </label>
          <input
            id={`${uid}-ss`}
            type="number"
            min="0"
            max="50"
            step="0.1"
            className={styles.input}
            value={ssPct}
            onChange={e => setSsPct(parseFloat(e.target.value) || 0)}
          />
          <span className={styles.helperText}>Media estatal aprox. 31,4%</span>
        </div>
      </div>

      {isOverHours && (
        <div className={styles.alertWarning}>
          ⚠️ <strong>Atención:</strong> La suma de horas ({totalHours}h) supera la jornada completa máxima ({maxWeeklyHours}h/sem). Ajusta las horas para no imputar más del 100% de la jornada.
        </div>
      )}

      <div className={styles.sectionHeader}>Imputación por Proyecto / Actividad</div>
      <div className={styles.projectsHeader}>
        <span>Nombre del proyecto / Imputación</span>
        <span>Horas/semana</span>
        <span></span>
      </div>
      {projects.map(project => (
        <div key={project.id} className={styles.projectRow}>
          <input
            type="text"
            className={styles.input}
            value={project.name}
            onChange={e => updateProject(project.id, 'name', e.target.value)}
            placeholder="Nombre del proyecto o centro de coste"
          />
          <input
            type="number"
            min="0"
            max="40"
            step="0.5"
            className={styles.input}
            value={project.hours || ''}
            onChange={e => updateProject(project.id, 'hours', parseFloat(e.target.value) || 0)}
            placeholder="0"
          />
          <button
            className={styles.deleteBtn}
            onClick={() => removeProject(project.id)}
            aria-label="Eliminar proyecto"
            disabled={projects.length <= 1}
          >
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      <button className={styles.addBtn} onClick={addProject}>
        <Plus size={16} />
        Añadir proyecto o centro de coste
      </button>

      <ResultPanel
        title="Liquidación y Cuadro de Imputación de Personal"
        copyText={isEmpty ? undefined : copyText}
        isEmpty={isEmpty}
        emptyMessage="Introduce el salario, Seguridad Social y horas asignadas para calcular el coste imputable."
      >
        <div id="prorrateo-export-target">
          {workerRole && (
            <div style={{ marginBottom: '1rem', fontWeight: 600, color: 'var(--color-primary-800)' }}>
              Puesto: {workerRole}
            </div>
          )}

          <div className={styles.alertInfo} style={{ marginBottom: '1.5rem' }}>
            <strong>Resumen de Costes del Trabajador:</strong> Salario Bruto Real: {formatCurrency(monthlyGrossCost)}/mes | SS Empresa: {formatCurrency(monthlySsCost)}/mes | <strong>Coste Total Empresa: {formatCurrency(monthlyTotalCost)}/mes ({formatCurrency(annualTotalCost)}/año)</strong>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Proyecto / Centro</th>
                  <th className={styles.numCol}>Horas</th>
                  <th className={styles.numCol}>% Jornada</th>
                  <th className={styles.numCol}>Bruto/mes</th>
                  <th className={styles.numCol}>SS Emp/mes</th>
                  <th className={styles.numCol}>Total Imputable/mes</th>
                  <th className={styles.numCol}>Total Anual</th>
                </tr>
              </thead>
              <tbody>
                {results.map(r => (
                  <tr key={r.id}>
                    <td>{r.name || <em style={{color: 'var(--text-muted)'}}>Sin nombre</em>}</td>
                    <td className={styles.numCol}>{r.hours}h</td>
                    <td className={styles.numCol}>{formatPct(r.pct)}</td>
                    <td className={styles.numCol}>{formatCurrency(r.monthlyGross)}</td>
                    <td className={styles.numCol}>{formatCurrency(r.monthlySs)}</td>
                    <td className={styles.numCol} style={{ fontWeight: 600, color: 'var(--color-primary-700)' }}>{formatCurrency(r.monthlyTotal)}</td>
                    <td className={styles.numCol} style={{ fontWeight: 600 }}>{formatCurrency(r.annualTotal)}</td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className={styles.totalRow}>
                  <td><strong>TOTAL</strong></td>
                  <td className={styles.numCol}><strong>{totalHours}h</strong></td>
                  <td className={styles.numCol}><strong>100%</strong></td>
                  <td className={styles.numCol}><strong>{formatCurrency(totalMonthlyGross)}</strong></td>
                  <td className={styles.numCol}><strong>{formatCurrency(totalMonthlySs)}</strong></td>
                  <td className={styles.numCol}><strong>{formatCurrency(totalMonthly)}</strong></td>
                  <td className={styles.numCol}><strong>{formatCurrency(totalAnnual)}</strong></td>
                </tr>
              </tfoot>
            </table>
          </div>
        </div>

        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }} className="no-print">
          <ExportPdfButton targetId="prorrateo-export-target" filename="prorrateo-nominas" projectName={projectName} />
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
                fontWeight: 500,
                cursor: isSaving ? 'not-allowed' : 'pointer',
                opacity: isSaving ? 0.7 : 1,
                display: 'flex',
                alignItems: 'center',
                gap: '0.5rem'
              }}
            >
              {isSaving ? 'Guardando...' : '💾 Guardar en Proyecto'}
            </button>
          )}
        </div>
      </ResultPanel>

      {!projectId && <ProjectBridgeBanner toolName="Prorrateo de Nóminas" />}
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
