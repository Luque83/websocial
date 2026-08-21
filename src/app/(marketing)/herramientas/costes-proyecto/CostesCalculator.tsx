'use client';

import React, { useState, useId } from 'react';
import { Plus, Trash2, CheckCircle2, AlertTriangle, AlertCircle, FileSpreadsheet, TrendingUp } from 'lucide-react';
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
  // Campos avanzados de personal y justificación
  puesto?: string;
  funciones?: string;
  costeReal?: number; // Gasto real justificado/pagado
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

interface ProrrateoWorker {
  role?: string;
  cost?: number;
}

function extractProrrateoData(data: unknown): ProrrateoWorker | null {
  if (!data || typeof data !== 'object') return null;
  const d = data as Record<string, unknown>;
  const salary = parseFloat(String(d.salary || 0)) || 0;
  const pagas = Number(d.pagas) || 12;
  const ssPct = d.ssPct !== undefined && !isNaN(Number(d.ssPct)) ? Number(d.ssPct) : 31.4;
  const workerRole = typeof d.workerRole === 'string' ? d.workerRole : 'Técnico de Proyecto';
  
  const salarioMes = pagas === 14 ? (salary * 14) / 12 : salary;
  const ssMes = (salarioMes * ssPct) / 100;
  const costeTotalMes = salarioMes + ssMes;

  return {
    role: workerRole,
    cost: costeTotalMes
  };
}

export function CostesCalculator({
  initialData,
  projectId,
  projectName: externalProjectName,
  mlData,
  prorrateoData,
}: CostesCalculatorProps) {
  const uid = useId();
  const init = parseInit(initialData);
  const { toasts, showToast, removeToast } = useToast();

  const [activeTab, setActiveTab] = useState<'presupuesto' | 'seguimiento'>('presupuesto');
  const [projectName, setProjectName] = useState<string>(
    externalProjectName || init.projectName || ''
  );
  const [durationMonths, setDurationMonths] = useState<number>(
    init.durationMonths ?? 12
  );
  const [indirectPct, setIndirectPct] = useState<number>(
    init.indirectPct ?? 10
  );
  const [aportacionPropia, setAportacionPropia] = useState<number>(
    init.aportacionPropia ?? 0
  );
  const [partidas, setPartidas] = useState<PartidaEntry[]>(
    init.partidas && init.partidas.length > 0
      ? init.partidas
      : [
          {
            id: '1',
            category: 'personal',
            description: 'Técnico/a de Proyecto (Trabajador/a Social)',
            puesto: 'Trabajador/a Social',
            funciones: 'Atención directa, acogida, diseño de itinerarios y coordinación de servicios.',
            monthlyAmount: 2100,
            months: 12,
            costeReal: 2100 * 12,
          },
          {
            id: '2',
            category: 'material',
            description: 'Material didáctico y licencias formativas',
            monthlyAmount: 250,
            months: 10,
            costeReal: 2400,
          },
          {
            id: '3',
            category: 'actividades',
            description: 'Talleres de capacitación y salidas comunitarias',
            monthlyAmount: 400,
            months: 8,
            costeReal: 3200,
          },
        ]
  );
  const [isSaving, setIsSaving] = useState(false);

  const mlActivities = extractMLActivities(mlData);
  const prorrateoWorker = extractProrrateoData(prorrateoData);

  const addPartida = () => {
    const newEntry: PartidaEntry = {
      id: String(Date.now()),
      category: 'personal',
      description: '',
      monthlyAmount: 0,
      months: durationMonths,
      puesto: '',
      funciones: '',
      costeReal: 0,
    };
    setPartidas(prev => [...prev, newEntry]);
  };

  const updatePartida = (id: string, field: keyof PartidaEntry, value: unknown) => {
    setPartidas(prev =>
      prev.map(p => {
        if (p.id !== id) return p;
        const updated = { ...p, [field]: value };
        return updated;
      })
    );
  };

  const removePartida = (id: string) => {
    setPartidas(prev => prev.filter(p => p.id !== id));
  };

  const importFromML = () => {
    if (mlActivities.length === 0) {
      showToast('No se encontraron actividades en el Marco Lógico', 'warning');
      return;
    }
    const newPartidas: PartidaEntry[] = mlActivities.map((act, index) => {
      const parsedCost = parseFloat(act.cost) || 0;
      return {
        id: `ml-${Date.now()}-${index}`,
        category: 'actividades',
        description: act.description,
        monthlyAmount: parsedCost > 0 ? parsedCost : 100,
        months: 1,
        costeReal: parsedCost > 0 ? parsedCost : 100,
      };
    });
    setPartidas(prev => [...prev, ...newPartidas]);
    showToast(`Se importaron ${newPartidas.length} actividades del Marco Lógico`, 'success');
  };

  const importFromProrrateo = () => {
    if (!prorrateoWorker) {
      showToast('No se encontraron datos en Prorrateo de Nóminas', 'warning');
      return;
    }
    const newPersonalPartida: PartidaEntry = {
      id: `prorrateo-${Date.now()}`,
      category: 'personal',
      description: `${prorrateoWorker.role || 'Puesto técnico'} (Coste Empresa Prorrateado)`,
      puesto: prorrateoWorker.role || 'Técnico de Proyecto',
      funciones: 'Ejecución técnica y gestión directa del proyecto social.',
      monthlyAmount: Math.round(prorrateoWorker.cost || 0),
      months: durationMonths,
      costeReal: Math.round(prorrateoWorker.cost || 0) * durationMonths,
    };
    setPartidas(prev => [...prev, newPersonalPartida]);
    showToast(`Personal importado desde Prorrateo (${formatCurrency(newPersonalPartida.monthlyAmount)}/mes)`, 'success');
  };

  // Cálculos Presupuestados
  const directCostsPresupuesto = partidas.reduce(
    (sum, p) => sum + (p.monthlyAmount || 0) * (p.months || 0),
    0
  );
  const indirectCostsPresupuesto = (directCostsPresupuesto * indirectPct) / 100;
  const totalProjectCostPresupuesto = directCostsPresupuesto + indirectCostsPresupuesto;
  const subvencionSolicitadaPresupuesto = Math.max(0, totalProjectCostPresupuesto - (aportacionPropia || 0));

  // Cálculos Reales Ejecutados
  const directCostsReal = partidas.reduce(
    (sum, p) => sum + (p.costeReal !== undefined ? p.costeReal : (p.monthlyAmount || 0) * (p.months || 0)),
    0
  );
  const indirectCostsReal = (directCostsReal * indirectPct) / 100;
  const totalProjectCostReal = directCostsReal + indirectCostsReal;
  
  // Desviación Global
  const desviacionTotal = totalProjectCostPresupuesto - totalProjectCostReal;
  const pctEjecucion = totalProjectCostPresupuesto > 0 
    ? (totalProjectCostReal / totalProjectCostPresupuesto) * 100 
    : 0;

  const handleSave = async () => {
    if (!projectId) return;
    setIsSaving(true);
    try {
      const payload: CostesData = {
        projectName,
        durationMonths,
        indirectPct,
        aportacionPropia,
        partidas,
      };
      await saveToolData(projectId, 'costes-proyecto', payload);
      showToast('Presupuesto y seguimiento guardados con éxito', 'success');
    } catch {
      showToast('Error al guardar costes', 'error');
    }
    setIsSaving(false);
  };

  const copyText = [
    `PRESUPUESTO Y LIQUIDACIÓN ECONÓMICA: ${projectName || 'Sin título'}`,
    `Duración: ${durationMonths} meses | Costes Indirectos: ${indirectPct}%`,
    '',
    '--- CUADRO DE EJECUCIÓN FINANCIERA (PRESUPUESTO VS. REAL) ---',
    ...partidas.map(p => {
      const pres = (p.monthlyAmount || 0) * (p.months || 0);
      const real = p.costeReal !== undefined ? p.costeReal : pres;
      const desv = pres - real;
      return `• [${p.category.toUpperCase()}] ${p.description || 'Sin concepto'}${p.funciones ? ` (Funciones: ${p.funciones})` : ''}: Presupuestado: ${formatCurrency(pres)} | Real: ${formatCurrency(real)} | Desviación: ${formatCurrency(desv)}`;
    }),
    '',
    `Costes Directos Presupuestados: ${formatCurrency(directCostsPresupuesto)} | Real: ${formatCurrency(directCostsReal)}`,
    `Costes Indirectos Presupuestados (${indirectPct}%): ${formatCurrency(indirectCostsPresupuesto)} | Real: ${formatCurrency(indirectCostsReal)}`,
    `TOTAL COSTE PROYECTO: Presupuestado: ${formatCurrency(totalProjectCostPresupuesto)} | Real: ${formatCurrency(totalProjectCostReal)}`,
    `EJECUCIÓN FINANCIERA: ${pctEjecucion.toFixed(2)}% | Remanente / Saldo: ${formatCurrency(desviacionTotal)}`,
  ].join('\n');

  return (
    <div id="costes-export-target">
      {/* Pestañas de Vista */}
      <div className={styles.tabBar}>
        <button
          type="button"
          onClick={() => setActiveTab('presupuesto')}
          className={`${styles.tabBtn} ${activeTab === 'presupuesto' ? styles.tabActive : ''}`}
        >
          <FileSpreadsheet size={18} />
          <span>1. Formulación del Presupuesto</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('seguimiento')}
          className={`${styles.tabBtn} ${activeTab === 'seguimiento' ? styles.tabActive : ''}`}
        >
          <TrendingUp size={18} />
          <span>2. Control de Gastos Reales vs. Presupuesto</span>
        </button>
      </div>

      <div className={styles.row2}>
        <div className={styles.formGroup}>
          <label htmlFor={`${uid}-project`} className={styles.label}>
            Nombre del proyecto
          </label>
          <input
            id={`${uid}-project`}
            type="text"
            className={styles.input}
            placeholder="Ej: Programa de Acompañamiento Social"
            value={projectName}
            onChange={e => setProjectName(e.target.value)}
            disabled={!!externalProjectName}
          />
        </div>
        <div className={styles.formGroup}>
          <label htmlFor={`${uid}-duration`} className={styles.label}>
            Duración (meses)
          </label>
          <input
            id={`${uid}-duration`}
            type="number"
            min={1}
            max={60}
            className={styles.input}
            value={durationMonths}
            onChange={e => setDurationMonths(Math.max(1, parseInt(e.target.value) || 1))}
          />
        </div>
      </div>

      <div className={styles.sectionHeader}>
        <span>Partidas de Gasto y Personal</span>
        <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
          {prorrateoWorker && (
            <button type="button" onClick={importFromProrrateo} className={styles.syncBtn}>
              👤 Importar Personal (Prorrateo)
            </button>
          )}
          {mlActivities.length > 0 && (
            <button type="button" onClick={importFromML} className={styles.syncBtn}>
              📥 Importar Actividades (Marco Lógico)
            </button>
          )}
        </div>
      </div>

      <div className={styles.partidasHeader}>
        <span>Categoría</span>
        <span>Concepto / Puesto</span>
        <span>{activeTab === 'presupuesto' ? 'Coste/mes' : 'Presupuest.'}</span>
        <span>Meses</span>
        <span>Total Presup.</span>
        <span>Gasto Real</span>
        <span></span>
      </div>

      {partidas.map((partida) => {
        const partidaTotalPresupuesto = (partida.monthlyAmount || 0) * (partida.months || 0);
        const isPersonal = partida.category === 'personal';

        return (
          <div key={partida.id} className={styles.partidaRowCard}>
            <div className={styles.partidaRow}>
              <select
                className={styles.input}
                value={partida.category}
                onChange={e => updatePartida(partida.id, 'category', e.target.value as PartidaCategory)}
              >
                {(Object.entries(PARTIDA_LABELS) as [PartidaCategory, string][]).map(([key, label]) => (
                  <option key={key} value={key}>{label}</option>
                ))}
              </select>

              <input
                type="text"
                className={styles.input}
                placeholder={isPersonal ? 'Ej: Técnico/a de Proyecto (Trabajador Social)' : 'Descripción de la partida'}
                value={partida.description}
                onChange={e => updatePartida(partida.id, 'description', e.target.value)}
              />

              <input
                type="number"
                min={0}
                step="0.01"
                className={styles.input}
                placeholder="€/mes"
                value={partida.monthlyAmount || ''}
                onChange={e => updatePartida(partida.id, 'monthlyAmount', parseFloat(e.target.value) || 0)}
              />

              <input
                type="number"
                min={1}
                max={60}
                className={styles.input}
                value={partida.months || ''}
                onChange={e => updatePartida(partida.id, 'months', parseInt(e.target.value) || 0)}
              />

              <div className={styles.rowTotal}>{formatCurrency(partidaTotalPresupuesto)}</div>

              <input
                type="number"
                min={0}
                step="0.01"
                className={styles.input}
                placeholder="€ Real"
                style={{ backgroundColor: activeTab === 'seguimiento' ? '#f0fdf4' : undefined, fontWeight: 600 }}
                value={partida.costeReal !== undefined ? partida.costeReal : ''}
                onChange={e => updatePartida(partida.id, 'costeReal', parseFloat(e.target.value) || 0)}
              />

              <button
                type="button"
                onClick={() => removePartida(partida.id)}
                className={styles.deleteBtn}
                title="Eliminar partida"
              >
                <Trash2 size={16} />
              </button>
            </div>

            {/* Ficha de Imputación de Personal si la categoría es Personal */}
            {isPersonal && (
              <div className={styles.personalDetails}>
                <div className={styles.personalField}>
                  <label>Puesto / Categoría Convenio:</label>
                  <input
                    type="text"
                    value={partida.puesto || ''}
                    onChange={e => updatePartida(partida.id, 'puesto', e.target.value)}
                    placeholder="Ej: Grupo 1 - Trabajador/a Social Titulado/a"
                  />
                </div>
                <div className={styles.personalField}>
                  <label>Funciones desempeñadas en el proyecto:</label>
                  <input
                    type="text"
                    value={partida.funciones || ''}
                    onChange={e => updatePartida(partida.id, 'funciones', e.target.value)}
                    placeholder="Ej: Acogida, diagnóstico social y tutorías individuales de seguimiento"
                  />
                </div>
              </div>
            )}
          </div>
        );
      })}

      <button type="button" onClick={addPartida} className={styles.addBtn}>
        <Plus size={16} />
        Añadir partida de gasto
      </button>

      {/* Configuración de Costes Indirectos y Cofinanciación */}
      <div style={{ marginTop: '2rem' }}>
        <div className={styles.sliderGroup}>
          <div className={styles.sliderHeader}>
            <label htmlFor={`${uid}-slider`} className={styles.label} style={{ margin: 0 }}>
              Costes Indirectos y de Estructura (%)
            </label>
            <span className={styles.sliderValue}>{indirectPct}% ({formatCurrency(indirectCostsPresupuesto)})</span>
          </div>
          <input
            id={`${uid}-slider`}
            type="range"
            min={0}
            max={25}
            step={1}
            value={indirectPct}
            onChange={e => setIndirectPct(parseInt(e.target.value) || 0)}
            className={styles.slider}
          />
          <p className={styles.sliderHint}>
            Calculado automáticamente sobre el total de costes directos.
          </p>

          {indirectPct > 15 && (
            <div className={styles.alertWarning}>
              <AlertTriangle size={18} />
              <span><strong>Advertencia de Auditoría:</strong> La mayoría de convocatorias públicas (IRPF, FSE, Ministerios) limitan los costes indirectos a un máximo del <strong>10% o 15%</strong>.</span>
            </div>
          )}
        </div>

        <div className={styles.row2}>
          <div className={styles.formGroup}>
            <label htmlFor={`${uid}-propia`} className={styles.label}>
              Aportación Propia / Cofinanciación de la Entidad (€)
            </label>
            <input
              id={`${uid}-propia`}
              type="number"
              min={0}
              step="0.01"
              className={styles.input}
              placeholder="0,00 €"
              value={aportacionPropia || ''}
              onChange={e => setAportacionPropia(parseFloat(e.target.value) || 0)}
            />
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Subvención Solicitada</label>
            <div className={styles.input} style={{ background: 'var(--color-primary-50)', fontWeight: 700, color: 'var(--color-primary-800)' }}>
              {formatCurrency(subvencionSolicitadaPresupuesto)}
            </div>
          </div>
        </div>
      </div>

      {/* Resultados y Control Presupuestario */}
      <ResultPanel title="Liquidación y Control Financiero del Proyecto" copyText={copyText}>
        <div id="costes-document-target">
          <div className={styles.summaryGrid}>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Total Presupuestado</span>
              <span className={styles.summaryValueLg}>{formatCurrency(totalProjectCostPresupuesto)}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Total Gastado Real</span>
              <span className={styles.summaryValueLg}>{formatCurrency(totalProjectCostReal)}</span>
            </div>
            <div className={styles.summaryItem}>
              <span className={styles.summaryLabel}>Ejecución %</span>
              <span className={styles.summaryValueLg} style={{ color: pctEjecucion > 105 ? '#f87171' : '#34d399' }}>
                {pctEjecucion.toFixed(1)}%
              </span>
            </div>
            <div className={`${styles.summaryItem} ${styles.summaryTotal}`}>
              <span className={styles.summaryLabel}>Saldo / Remanente</span>
              <span className={styles.summaryValueLg}>{formatCurrency(desviacionTotal)}</span>
            </div>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Partida / Personal y Funciones</th>
                  <th className={styles.numCol}>Presupuestado</th>
                  <th className={styles.numCol}>Gasto Real</th>
                  <th className={styles.numCol}>Desviación</th>
                  <th>Estado Auditoría</th>
                </tr>
              </thead>
              <tbody>
                {partidas.map(p => {
                  const pres = (p.monthlyAmount || 0) * (p.months || 0);
                  const real = p.costeReal !== undefined ? p.costeReal : pres;
                  const desv = pres - real;
                  const pct = pres > 0 ? (real / pres) * 100 : 100;

                  let badge = <span className={styles.badgeOk}><CheckCircle2 size={12} /> Correcto ({pct.toFixed(0)}%)</span>;
                  if (pct < 70) {
                    badge = <span className={styles.badgeWarning}><AlertTriangle size={12} /> Infraejecución ({pct.toFixed(0)}%)</span>;
                  } else if (pct > 110) {
                    badge = <span className={styles.badgeDanger}><AlertCircle size={12} /> Sobrecoste ({pct.toFixed(0)}%)</span>;
                  }

                  return (
                    <tr key={p.id}>
                      <td>
                        <strong>{p.description || 'Sin concepto'}</strong>
                        {p.puesto && <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>👤 {p.puesto}</div>}
                        {p.funciones && <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>📋 {p.funciones}</div>}
                      </td>
                      <td className={styles.numCol}>{formatCurrency(pres)}</td>
                      <td className={styles.numCol} style={{ fontWeight: 600 }}>{formatCurrency(real)}</td>
                      <td className={styles.numCol} style={{ color: desv < 0 ? '#dc2626' : '#16a34a' }}>
                        {formatCurrency(desv)}
                      </td>
                      <td>{badge}</td>
                    </tr>
                  );
                })}
                <tr className={styles.subtotalRow}>
                  <td><strong>Costes Indirectos ({indirectPct}%)</strong></td>
                  <td className={styles.numCol}>{formatCurrency(indirectCostsPresupuesto)}</td>
                  <td className={styles.numCol}>{formatCurrency(indirectCostsReal)}</td>
                  <td className={styles.numCol}>{formatCurrency(indirectCostsPresupuesto - indirectCostsReal)}</td>
                  <td>—</td>
                </tr>
                <tr style={{ background: 'var(--color-primary-100)', fontWeight: 700, fontSize: '0.9375rem' }}>
                  <td>TOTAL PROYECTO (DIRECTOS + INDIRECTOS)</td>
                  <td className={styles.numCol}>{formatCurrency(totalProjectCostPresupuesto)}</td>
                  <td className={styles.numCol}>{formatCurrency(totalProjectCostReal)}</td>
                  <td className={styles.numCol} style={{ color: desviacionTotal < 0 ? '#dc2626' : '#16a34a' }}>
                    {formatCurrency(desviacionTotal)}
                  </td>
                  <td>
                    {pctEjecucion >= 85 && pctEjecucion <= 105 ? (
                      <span className={styles.badgeOk}><CheckCircle2 size={12} /> Justificación 100%</span>
                    ) : (
                      <span className={styles.badgeWarning}><AlertTriangle size={12} /> Revisar Desviación</span>
                    )}
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }} className="no-print">
          <ExportPdfButton targetId="costes-document-target" filename="control-presupuestario-justificacion" projectName={projectName} />
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
