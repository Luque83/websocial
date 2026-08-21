'use client';

import React, { useState, useId } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { ResultPanel } from '@/components/tools/ResultPanel';
import { saveToolData } from '@/app/actions/tools';
import styles from './costes.module.css';

type PartidaCategory = 'personal' | 'material' | 'actividades' | 'comunicacion' | 'otros';

const PARTIDA_LABELS: Record<PartidaCategory, string> = {
  personal: 'Personal',
  material: 'Material y equipamiento',
  actividades: 'Actividades y eventos',
  comunicacion: 'Comunicación y difusión',
  otros: 'Otros gastos directos',
};

interface PartidaEntry {
  id: string;
  category: PartidaCategory;
  description: string;
  monthlyAmount: number;
  months: number;
}

const formatCurrency = (n: number) =>
  new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);

interface CostesData {
  projectName?: string;
  durationMonths?: number;
  indirectPct?: number;
  partidas?: PartidaEntry[];
}

interface CostesCalculatorProps {
  initialData?: unknown;
  projectId?: string;
}

const parseInit = (data: unknown): CostesData =>
  (data && typeof data === 'object' ? data : {}) as CostesData;

export function CostesCalculator({ initialData, projectId }: CostesCalculatorProps) {
  const uid = useId();
  
  const init = parseInit(initialData);

  const [projectName, setProjectName] = useState<string>(init.projectName || '');
  const [durationMonths, setDurationMonths] = useState<number>(init.durationMonths || 12);
  const [indirectPct, setIndirectPct] = useState<number>(init.indirectPct !== undefined ? init.indirectPct : 10);
  const [partidas, setPartidas] = useState<PartidaEntry[]>(init.partidas || [
    { id: '1', category: 'personal', description: 'Coordinador/a de proyecto (50% jornada)', monthlyAmount: 1200, months: 12 },
    { id: '2', category: 'material', description: 'Material de oficina', monthlyAmount: 150, months: 1 },
  ]);
  const [isSaving, setIsSaving] = useState(false);

  const addPartida = () => {
    setPartidas(prev => [...prev, {
      id: Date.now().toString(),
      category: 'personal',
      description: '',
      monthlyAmount: 0,
      months: durationMonths,
    }]);
  };

  const removePartida = (id: string) => setPartidas(prev => prev.filter(p => p.id !== id));

  const updatePartida = (id: string, field: keyof PartidaEntry, value: unknown) => {
    setPartidas(prev => prev.map(p => p.id === id ? { ...p, [field]: value } : p));
  };

  const handleSave = async () => {
    if (!projectId) return;
    setIsSaving(true);
    try {
      const payload = { projectName, durationMonths, indirectPct, partidas };
      await saveToolData(projectId, 'costes-proyecto', payload);
      alert('Guardado con éxito');
    } catch {
      alert('Error al guardar');
    }
    setIsSaving(false);
  };

  const directTotal = partidas.reduce((acc, p) => acc + (p.monthlyAmount * p.months), 0);
  const indirectAmount = directTotal * indirectPct / 100;
  const grandTotal = directTotal + indirectAmount;

  const byCategory = (Object.keys(PARTIDA_LABELS) as PartidaCategory[]).map(cat => ({
    category: cat,
    label: PARTIDA_LABELS[cat],
    items: partidas.filter(p => p.category === cat),
    subtotal: partidas.filter(p => p.category === cat).reduce((acc, p) => acc + p.monthlyAmount * p.months, 0),
  })).filter(g => g.items.length > 0);

  const copyText = [
    `PRESUPUESTO: ${projectName || 'Sin nombre'}`,
    `Duración: ${durationMonths} meses`,
    '',
    ...byCategory.flatMap(g => [
      `## ${g.label}`,
      ...g.items.map(p => `  ${p.description || '(sin descripción)'}: ${formatCurrency(p.monthlyAmount)} x ${p.months} meses = ${formatCurrency(p.monthlyAmount * p.months)}`),
      `  Subtotal ${g.label}: ${formatCurrency(g.subtotal)}`,
      '',
    ]),
    `Subtotal costes directos: ${formatCurrency(directTotal)}`,
    `Costes indirectos (${indirectPct}%): ${formatCurrency(indirectAmount)}`,
    `TOTAL PRESUPUESTO: ${formatCurrency(grandTotal)}`,
  ].join('\n');

  const isEmpty = partidas.every(p => p.monthlyAmount === 0);

  return (
    <div>
      <div className={styles.row2}>
        <div className={styles.formGroup}>
          <label htmlFor={`${uid}-name`} className={styles.label}>Nombre del proyecto</label>
          <input
            id={`${uid}-name`}
            type="text"
            className={styles.input}
            value={projectName}
            onChange={e => setProjectName(e.target.value)}
            placeholder="Ej: Proyecto de inserción laboral 2026"
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor={`${uid}-dur`} className={styles.label}>Duración (meses)</label>
          <input
            id={`${uid}-dur`}
            type="number"
            min="1"
            max="60"
            className={styles.input}
            value={durationMonths}
            onChange={e => setDurationMonths(parseInt(e.target.value) || 12)}
          />
        </div>
      </div>

      <div className={styles.sectionHeader}>Partidas presupuestarias</div>
      <div className={styles.partidasHeader}>
        <span>Categoría</span>
        <span>Descripción</span>
        <span>€/mes</span>
        <span>Meses</span>
        <span>Total</span>
        <span></span>
      </div>
      {partidas.map(p => (
        <div key={p.id} className={styles.partidaRow}>
          <select
            className={styles.input}
            value={p.category}
            onChange={e => updatePartida(p.id, 'category', e.target.value as PartidaCategory)}
          >
            {(Object.entries(PARTIDA_LABELS) as [PartidaCategory, string][]).map(([k, v]) => (
              <option key={k} value={k}>{v}</option>
            ))}
          </select>
          <input
            type="text"
            className={styles.input}
            value={p.description}
            onChange={e => updatePartida(p.id, 'description', e.target.value)}
            placeholder="Descripción"
          />
          <input
            type="number"
            min="0"
            step="0.01"
            className={styles.input}
            value={p.monthlyAmount || ''}
            onChange={e => updatePartida(p.id, 'monthlyAmount', parseFloat(e.target.value) || 0)}
            placeholder="0"
          />
          <input
            type="number"
            min="1"
            max="60"
            className={styles.input}
            value={p.months || ''}
            onChange={e => updatePartida(p.id, 'months', parseInt(e.target.value) || 1)}
          />
          <span className={styles.rowTotal}>{formatCurrency(p.monthlyAmount * p.months)}</span>
          <button className={styles.deleteBtn} onClick={() => removePartida(p.id)} aria-label="Eliminar partida">
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      <button className={styles.addBtn} onClick={addPartida}>
        <Plus size={16} />
        Añadir partida
      </button>

      <div className={styles.sectionHeader}>Costes indirectos</div>
      <div className={styles.sliderGroup}>
        <div className={styles.sliderHeader}>
          <label htmlFor={`${uid}-indirect`} className={styles.label}>Porcentaje de costes indirectos</label>
          <span className={styles.sliderValue}>{indirectPct}%</span>
        </div>
        <input
          id={`${uid}-indirect`}
          type="range"
          min="0"
          max="25"
          step="1"
          className={styles.slider}
          value={indirectPct}
          onChange={e => setIndirectPct(parseInt(e.target.value))}
        />
        <p className={styles.sliderHint}>Los costes indirectos cubren gastos generales de la entidad (alquiler, administración, etc.) imputables al proyecto.</p>
      </div>

      <ResultPanel
        title="Presupuesto del proyecto"
        copyText={isEmpty ? undefined : copyText}
        isEmpty={isEmpty}
        emptyMessage="Añade partidas con importes para calcular el presupuesto."
      >
        <div className={styles.summaryGrid}>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Costes directos</span>
            <span className={styles.summaryValue}>{formatCurrency(directTotal)}</span>
          </div>
          <div className={styles.summaryItem}>
            <span className={styles.summaryLabel}>Costes indirectos ({indirectPct}%)</span>
            <span className={styles.summaryValue}>{formatCurrency(indirectAmount)}</span>
          </div>
          <div className={`${styles.summaryItem} ${styles.summaryTotal}`}>
            <span className={styles.summaryLabel}>Total presupuesto</span>
            <span className={styles.summaryValueLg}>{formatCurrency(grandTotal)}</span>
          </div>
        </div>
        {byCategory.length > 0 && (
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Partida</th>
                  <th>Descripción</th>
                  <th className={styles.numCol}>€/mes</th>
                  <th className={styles.numCol}>Meses</th>
                  <th className={styles.numCol}>Total</th>
                </tr>
              </thead>
              <tbody>
                {byCategory.map(group => (
                  <React.Fragment key={group.category}>
                    <tr className={styles.categoryRow}>
                      <td colSpan={5}><strong>{group.label}</strong></td>
                    </tr>
                    {group.items.map(item => (
                      <tr key={item.id}>
                        <td></td>
                        <td>{item.description || '—'}</td>
                        <td className={styles.numCol}>{formatCurrency(item.monthlyAmount)}</td>
                        <td className={styles.numCol}>{item.months}</td>
                        <td className={styles.numCol}>{formatCurrency(item.monthlyAmount * item.months)}</td>
                      </tr>
                    ))}
                    <tr className={styles.subtotalRow}>
                      <td colSpan={4} style={{textAlign: 'right', paddingRight: 'var(--space-4)'}}>Subtotal {group.label}:</td>
                      <td className={styles.numCol}><strong>{formatCurrency(group.subtotal)}</strong></td>
                    </tr>
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        )}
        
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
