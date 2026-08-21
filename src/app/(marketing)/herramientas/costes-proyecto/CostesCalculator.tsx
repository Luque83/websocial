'use client';

import React, { useState, useId } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { ResultPanel } from '@/components/tools/ResultPanel';
import { saveToolData } from '@/app/actions/tools';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/Toast';
import { ExportPdfButton } from '@/components/ui/ExportPdfButton';
import styles from './costes.module.css';

type PartidaCategory = 
  | 'personal' 
  | 'material' 
  | 'actividades' 
  | 'comunicacion' 
  | 'auditoria' 
  | 'alquileres' 
  | 'viajes' 
  | 'otros';

const PARTIDA_LABELS: Record<PartidaCategory, string> = {
  personal: '1. Personal y equipo técnico',
  material: '2. Material y equipamiento',
  actividades: '3. Actividades y talleres con personas usuarias',
  comunicacion: '4. Comunicación y difusión',
  auditoria: '5. Auditoría y evaluación externa',
  alquileres: '6. Alquileres y suministros directos',
  viajes: '7. Dietas y desplazamientos técnicos',
  otros: '8. Otros gastos directos',
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
  aportacionPropia?: number;
  partidas?: PartidaEntry[];
}

interface CostesCalculatorProps {
  initialData?: unknown;
  projectId?: string;
  projectName?: string;
  mlData?: unknown;
  prorrateoData?: unknown;
}

const parseInit = (data: unknown): CostesData =>
  (data && typeof data === 'object' ? data : {}) as CostesData;

interface MLActivity {
  description: string;
  cost: string;
}

interface MLNode {
  description?: string;
  cost?: string | number;
  results?: MLNode[];
  activities?: MLNode[];
}

interface MLRoot {
  objectives?: MLNode[];
}

function extractMLActivities(data: unknown): MLActivity[] {
  if (!data || typeof data !== 'object') return [];
  const ml = data as MLRoot;
  const activities: MLActivity[] = [];
  
  if (Array.isArray(ml.objectives)) {
    ml.objectives.forEach(obj => {
      if (Array.isArray(obj.results)) {
        obj.results.forEach(res => {
          if (Array.isArray(res.activities)) {
            res.activities.forEach(act => {
              if (act && typeof act.description === 'string' && act.description.trim() !== '') {
                activities.push({
                  description: act.description,
                  cost: typeof act.cost === 'string' ? act.cost : typeof act.cost === 'number' ? String(act.cost) : ''
                });
              }
            });
          }
        });
      }
    });
  }
  return activities;
}

interface ProrrateoItem {
  workerRole?: string;
  monthlyTotalCost?: number;
  results?: Array<{
    name: string;
    monthlyTotal: number;
  }>;
}

function extractProrrateoPersonnel(data: unknown, currentProjectName?: string): { description: string; monthlyAmount: number } | null {
  if (!data || typeof data !== 'object') return null;
  const p = data as Record<string, unknown>;
  const role = typeof p.workerRole === 'string' && p.workerRole.trim() ? p.workerRole : 'Técnico de Proyecto (Prorrateo)';
  
  // Si hay summary y results
  const summary = p.summary as ProrrateoItem | undefined;
  if (summary && Array.isArray(summary.results)) {
    const matched = summary.results.find(r => 
      currentProjectName && r.name.toLowerCase().trim() === currentProjectName.toLowerCase().trim()
    );
    if (matched && matched.monthlyTotal > 0) {
      return {
        description: `${role} (${matched.name})`,
        monthlyAmount: matched.monthlyTotal
      };
    }
    if (summary.monthlyTotalCost && summary.monthlyTotalCost > 0) {
      return {
        description: role,
        monthlyAmount: summary.monthlyTotalCost
      };
    }
  }

  // Fallback si solo tiene salary bruto
  const salary = parseFloat(String(p.salary || '0')) || 0;
  const ssPct = parseFloat(String(p.ssPct || '31.4')) || 31.4;
  if (salary > 0) {
    const totalCost = salary * (1 + ssPct / 100);
    return {
      description: role,
      monthlyAmount: totalCost
    };
  }

  return null;
}

export function CostesCalculator({ initialData, projectId, projectName: externalProjectName, mlData, prorrateoData }: CostesCalculatorProps) {
  const uid = useId();
  
  const init = parseInit(initialData);
  const { toasts, showToast, removeToast } = useToast();

  const [localProjectName, setLocalProjectName] = useState<string>(init.projectName || '');
  const projectName = externalProjectName || localProjectName;

  const [durationMonths, setDurationMonths] = useState<number>(init.durationMonths || 12);
  const [indirectPct, setIndirectPct] = useState<number>(init.indirectPct !== undefined ? init.indirectPct : 10);
  const [aportacionPropia, setAportacionPropia] = useState<number>(init.aportacionPropia || 0);
  
  const mlActivities = React.useMemo(() => extractMLActivities(mlData), [mlData]);
  const prorrateoPersonnel = React.useMemo(() => extractProrrateoPersonnel(prorrateoData, projectName), [prorrateoData, projectName]);
  
  const [partidas, setPartidas] = useState<PartidaEntry[]>(() => {
    if (init.partidas && init.partidas.length > 0) return init.partidas;
    
    // Si no hay datos guardados pero hay actividades en ML, usarlas
    if (mlActivities.length > 0) {
      return mlActivities.map((act, idx) => ({
        id: Date.now().toString() + idx,
        category: 'actividades',
        description: act.description,
        monthlyAmount: parseFloat(act.cost) || 0,
        months: 1
      }));
    }
    
    // Por defecto
    return [
      { id: '1', category: 'personal', description: 'Coordinador/a de proyecto (Coste empresa)', monthlyAmount: 1650, months: 12 },
      { id: '2', category: 'material', description: 'Material fungible y de oficina', monthlyAmount: 150, months: 1 },
    ];
  });
  const [isSaving, setIsSaving] = useState(false);

  const handleSyncML = () => {
    let addedCount = 0;
    const newPartidas = [...partidas];
    
    mlActivities.forEach((mlAct, idx) => {
      const exists = newPartidas.some(p => p.description.toLowerCase().trim() === mlAct.description.toLowerCase().trim());
      if (!exists && mlAct.description.trim()) {
        newPartidas.push({
          id: Date.now().toString() + 'sync' + idx,
          category: 'actividades',
          description: mlAct.description,
          monthlyAmount: parseFloat(mlAct.cost) || 0,
          months: 1
        });
        addedCount++;
      }
    });

    if (addedCount > 0) {
      setPartidas(newPartidas);
      showToast(`Se han sincronizado ${addedCount} actividades del Marco Lógico`, 'success');
    } else {
      showToast('No hay actividades nuevas en el Marco Lógico', 'info');
    }
  };

  const handleSyncProrrateo = () => {
    if (!prorrateoPersonnel) {
      showToast('No se encontraron datos de personal en el Prorrateo', 'info');
      return;
    }

    const newPartidas = [...partidas];
    const exists = newPartidas.some(p => p.description.toLowerCase().includes(prorrateoPersonnel.description.toLowerCase()));

    if (exists) {
      showToast('El puesto de personal ya está en el presupuesto', 'info');
      return;
    }

    newPartidas.unshift({
      id: Date.now().toString() + 'prorrateo',
      category: 'personal',
      description: prorrateoPersonnel.description,
      monthlyAmount: Math.round(prorrateoPersonnel.monthlyAmount * 100) / 100,
      months: durationMonths
    });

    setPartidas(newPartidas);
    showToast(`Personal importado: ${prorrateoPersonnel.description}`, 'success');
  };

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
      const payload = { projectName, durationMonths, indirectPct, aportacionPropia, partidas };
      await saveToolData(projectId, 'costes-proyecto', payload);
      showToast('Costes guardados con éxito', 'success');
    } catch {
      showToast('Error al guardar los costes', 'error');
    }
    setIsSaving(false);
  };

  const directTotal = partidas.reduce((acc, p) => acc + (p.monthlyAmount * p.months), 0);
  const indirectAmount = directTotal * indirectPct / 100;
  const grandTotal = directTotal + indirectAmount;
  const subvencionSolicitada = Math.max(0, grandTotal - aportacionPropia);

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
    <div id="costes-export-target">
      <div className={styles.row2}>
        <div className={styles.formGroup}>
          <label htmlFor={`${uid}-name`} className={styles.label}>Nombre del proyecto</label>
          <input
            id={`${uid}-name`}
            type="text"
            className={styles.input}
            value={projectName}
            onChange={e => setLocalProjectName(e.target.value)}
            disabled={!!externalProjectName}
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
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
        <button className={styles.addBtn} onClick={addPartida}>
          <Plus size={16} />
          Añadir partida
        </button>
        {mlActivities.length > 0 && (
          <button 
            className={styles.syncBtn} 
            onClick={handleSyncML}
            title="Importar actividades como partidas del presupuesto"
          >
            📋 Sincronizar Actividades (Marco Lógico)
          </button>
        )}
        {prorrateoPersonnel && (
          <button 
            className={styles.syncBtn} 
            onClick={handleSyncProrrateo}
            title="Importar coste imputado del trabajador"
          >
            👤 Importar Personal (Prorrateo)
          </button>
        )}
      </div>

      <div className={styles.sectionHeader}>Costes indirectos y Financiación</div>
      <div className={styles.row2}>
        <div className={styles.sliderGroup}>
          <div className={styles.sliderHeader}>
            <label htmlFor={`${uid}-indirect`} className={styles.label}>Costes indirectos (% gastos generales)</label>
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
          {indirectPct > 15 ? (
            <div className={styles.alertWarning}>
              ⚠️ <strong>Tope habitual excedido:</strong> El {indirectPct}% supera el 10-15% fijado como límite en la mayoría de convocatorias públicas (IRPF, Ministerios, FSE). Revisa las bases.
            </div>
          ) : indirectPct > 10 ? (
            <div className={styles.alertWarning}>
              ℹ️ <strong>Nota de convocatoria:</strong> El {indirectPct}% está entre el 10% y el 15%. Algunas bases locales o autonómicas exigen un máximo estricto del 10%.
            </div>
          ) : (
            <p className={styles.sliderHint}>Dentro de los límites habituales aceptados (hasta el 10%).</p>
          )}
        </div>

        <div className={styles.formGroup}>
          <label htmlFor={`${uid}-aportacion`} className={styles.label}>
            Aportación propia / Cofinanciación (€)
          </label>
          <input
            id={`${uid}-aportacion`}
            type="number"
            min="0"
            step="0.01"
            className={styles.input}
            value={aportacionPropia || ''}
            onChange={e => setAportacionPropia(parseFloat(e.target.value) || 0)}
            placeholder="0 € (Fondos propios entidad)"
          />
          <span className={styles.sliderHint}>Importe que asume la entidad u otros financiadores privados.</span>
        </div>
      </div>

      <ResultPanel
        title="Presupuesto y Plan Financiero del Proyecto"
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
            <span className={styles.summaryLabel}>Coste total del proyecto</span>
            <span className={styles.summaryValueLg}>{formatCurrency(grandTotal)}</span>
          </div>
        </div>

        {aportacionPropia > 0 && (
          <div className={styles.alertSuccess} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <span><strong>Subvención solicitada al financiador:</strong> {formatCurrency(subvencionSolicitada)} ({((subvencionSolicitada / (grandTotal || 1)) * 100).toFixed(1)}%)</span>
            <span><strong>Aportación propia:</strong> {formatCurrency(aportacionPropia)} ({((aportacionPropia / (grandTotal || 1)) * 100).toFixed(1)}%)</span>
          </div>
        )}

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
        
        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }} className="no-print">
          <ExportPdfButton targetId="costes-export-target" filename="presupuesto" projectName={projectName} />
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
      <ToastContainer toasts={toasts} removeToast={removeToast} />
    </div>
  );
}
