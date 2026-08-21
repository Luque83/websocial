'use client';

import React, { useState, useId } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { ResultPanel } from '@/components/tools/ResultPanel';
import { saveToolData } from '@/app/actions/tools';
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
  salary?: string;
  projects?: ProjectEntry[];
}

interface ProrrateoCalculatorProps {
  initialData?: unknown;
  projectId?: string;
}

const parseInit = (data: unknown): ProrrateoData =>
  (data && typeof data === 'object' ? data : {}) as ProrrateoData;

export function ProrrateoCalculator({ initialData, projectId }: ProrrateoCalculatorProps) {
  const uid = useId();
  
  const init = parseInit(initialData);

  const [salary, setSalary] = useState<string>(init.salary || '');
  const [projects, setProjects] = useState<ProjectEntry[]>(init.projects || [
    { id: '1', name: '', hours: 0 },
    { id: '2', name: '', hours: 0 },
  ]);
  const [isSaving, setIsSaving] = useState(false);

  const salaryNum = parseFloat(salary) || 0;
  const totalHours = projects.reduce((acc, p) => acc + (p.hours || 0), 0);

  const results = projects.map(p => {
    const pct = totalHours > 0 ? (p.hours / totalHours) * 100 : 0;
    const monthly = (salaryNum * pct) / 100;
    const annual = monthly * 12;
    return { ...p, pct, monthly, annual };
  });

  const totalMonthly = results.reduce((acc, r) => acc + r.monthly, 0);
  const totalAnnual = totalMonthly * 12;

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
      const payload = { salary, projects };
      await saveToolData(projectId, 'prorrateo-nominas', payload);
      alert('Guardado con éxito');
    } catch {
      alert('Error al guardar');
    }
    setIsSaving(false);
  };

  const copyText = [
    'PRORRATEO DE NÓMINA',
    `Salario bruto mensual: ${formatCurrency(salaryNum)}`,
    `Horas semanales totales: ${totalHours}h`,
    '',
    'Proyecto | Horas/semana | % Jornada | Coste mensual | Coste anual',
    ...results.map(r =>
      `${r.name || '(sin nombre)'} | ${r.hours}h | ${formatPct(r.pct)} | ${formatCurrency(r.monthly)} | ${formatCurrency(r.annual)}`
    ),
    '',
    `TOTAL | ${totalHours}h | 100% | ${formatCurrency(totalMonthly)} | ${formatCurrency(totalAnnual)}`,
  ].join('\n');

  const isEmpty = salaryNum === 0 || totalHours === 0;

  return (
    <div>
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

      <div className={styles.sectionHeader}>Proyectos</div>
      <div className={styles.projectsHeader}>
        <span>Nombre del proyecto</span>
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
            placeholder="Nombre del proyecto"
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
        Añadir proyecto
      </button>

      <ResultPanel
        title="Resultado del prorrateo"
        copyText={isEmpty ? undefined : copyText}
        isEmpty={isEmpty}
        emptyMessage="Introduce el salario y las horas por proyecto para calcular el prorrateo."
      >
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Proyecto</th>
                <th className={styles.numCol}>Horas/sem.</th>
                <th className={styles.numCol}>% Jornada</th>
                <th className={styles.numCol}>Coste mensual</th>
                <th className={styles.numCol}>Coste anual</th>
              </tr>
            </thead>
            <tbody>
              {results.map(r => (
                <tr key={r.id}>
                  <td>{r.name || <em style={{color: 'var(--text-muted)'}}>Sin nombre</em>}</td>
                  <td className={styles.numCol}>{r.hours}h</td>
                  <td className={styles.numCol}>{formatPct(r.pct)}</td>
                  <td className={styles.numCol}>{formatCurrency(r.monthly)}</td>
                  <td className={styles.numCol}>{formatCurrency(r.annual)}</td>
                </tr>
              ))}
            </tbody>
            <tfoot>
              <tr className={styles.totalRow}>
                <td><strong>Total</strong></td>
                <td className={styles.numCol}><strong>{totalHours}h</strong></td>
                <td className={styles.numCol}><strong>100%</strong></td>
                <td className={styles.numCol}><strong>{formatCurrency(totalMonthly)}</strong></td>
                <td className={styles.numCol}><strong>{formatCurrency(totalAnnual)}</strong></td>
              </tr>
            </tfoot>
          </table>
        </div>

        {projectId && (
          <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end' }}>
            <button
              onClick={handleSave}
              disabled={isSaving}
              style={{
                backgroundColor: 'var(--primary-600)',
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
          </div>
        )}
      </ResultPanel>
    </div>
  );
}
