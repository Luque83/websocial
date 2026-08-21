'use client';

import React, { useState, useId } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { ResultPanel } from '@/components/tools/ResultPanel';
import { saveToolData } from '@/app/actions/tools';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/Toast';
import { ExportPdfButton } from '@/components/ui/ExportPdfButton';
import styles from './indicadores.module.css';

interface Indicador {
  id: string;
  name: string;
  baseline: number;
  target: number;
  current: number;
}

interface IndicadoresData {
  projectName?: string;
  indicadores?: Indicador[];
}

interface IndicadoresGeneratorProps {
  initialData?: unknown;
  projectId?: string;
  projectName?: string;
  mlData?: unknown;
}

interface MLNode {
  indicator?: string;
  results?: MLNode[];
}

interface MLRoot {
  finIndicator?: string;
  propositoIndicator?: string;
  objectives?: MLNode[];
}

function extractMLIndicators(data: unknown): string[] {
  if (!data || typeof data !== 'object') return [];
  const ml = data as MLRoot;
  const rawTexts: string[] = [];
  
  if (typeof ml.finIndicator === 'string') rawTexts.push(ml.finIndicator);
  if (typeof ml.propositoIndicator === 'string') rawTexts.push(ml.propositoIndicator);
  
  if (Array.isArray(ml.objectives)) {
    ml.objectives.forEach(obj => {
      if (typeof obj.indicator === 'string') rawTexts.push(obj.indicator);
      if (Array.isArray(obj.results)) {
        obj.results.forEach(res => {
          if (typeof res.indicator === 'string') rawTexts.push(res.indicator);
        });
      }
    });
  }
  
  return rawTexts
    .flatMap(text => text.split('\n'))
    .map(line => line.replace(/^[\s\-*•]+/, '').trim())
    .filter(line => line.length > 5);
}

const parseInit = (data: unknown): IndicadoresData =>
  (data && typeof data === 'object' ? data : {}) as IndicadoresData;

export function IndicadoresGenerator({ initialData, projectId, projectName: externalProjectName, mlData }: IndicadoresGeneratorProps) {
  const uid = useId();
  const init = parseInit(initialData);
  const { toasts, showToast, removeToast } = useToast();

  const [localProjectName, setLocalProjectName] = useState<string>(init.projectName || '');
  const projectName = externalProjectName || localProjectName;

  const mlIndicatorsExtracted = React.useMemo(() => extractMLIndicators(mlData), [mlData]);
  
  const [indicadores, setIndicadores] = useState<Indicador[]>(() => {
    if (init.indicadores && init.indicadores.length > 0) return init.indicadores;
    
    if (mlIndicatorsExtracted.length > 0) {
      return mlIndicatorsExtracted.map((ind, idx) => ({
        id: Date.now().toString() + idx,
        name: ind,
        baseline: 0,
        target: 100,
        current: 0
      }));
    }
    
    return [
      { id: '1', name: 'Número de personas atendidas', baseline: 0, target: 50, current: 20 },
      { id: '2', name: 'Talleres realizados', baseline: 0, target: 10, current: 4 },
      { id: '3', name: 'Porcentaje de inserción laboral (%)', baseline: 0, target: 30, current: 15 },
    ];
  });
  
  const [isSaving, setIsSaving] = useState(false);

  const handleSyncML = () => {
    let addedCount = 0;
    const newInds = [...indicadores];
    
    mlIndicatorsExtracted.forEach((indName, idx) => {
      const exists = newInds.some(i => i.name.toLowerCase().trim() === indName.toLowerCase().trim());
      if (!exists && indName.trim()) {
        newInds.push({
          id: Date.now().toString() + 'sync' + idx,
          name: indName,
          baseline: 0,
          target: 100,
          current: 0
        });
        addedCount++;
      }
    });

    if (addedCount > 0) {
      setIndicadores(newInds);
      showToast(`Se han sincronizado ${addedCount} indicadores del Marco Lógico`, 'success');
    } else {
      showToast('No hay indicadores nuevos en el Marco Lógico', 'info');
    }
  };

  const addIndicador = () => {
    setIndicadores(prev => [...prev, {
      id: Date.now().toString(),
      name: '',
      baseline: 0,
      target: 100,
      current: 0
    }]);
  };

  const removeIndicador = (id: string) => setIndicadores(prev => prev.filter(i => i.id !== id));
  
  const updateIndicador = <K extends keyof Indicador>(id: string, field: K, value: Indicador[K]) => {
    setIndicadores(prev => prev.map(ind => {
      if (ind.id !== id) return ind;
      return { ...ind, [field]: value };
    }));
  };

  const handleSave = async () => {
    if (!projectId) return;
    setIsSaving(true);
    try {
      const payload = { projectName, indicadores };
      await saveToolData(projectId, 'indicadores-impacto', payload);
      showToast('Sistema de indicadores guardado', 'success');
    } catch {
      showToast('Error al guardar', 'error');
    }
    setIsSaving(false);
  };

  const isEmpty = indicadores.every(i => !i.name.trim());

  return (
    <div id="indicadores-export-target">
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
      </div>

      <div className={styles.sectionHeader}>Lista de Indicadores</div>
      <div className={styles.indicadoresHeader}>
        <span>Indicador / Métrica</span>
        <span>Valor Base</span>
        <span>Valor Meta</span>
        <span>Valor Actual</span>
        <span></span>
      </div>
      {indicadores.map(ind => (
        <div key={ind.id} className={styles.indicadorRow}>
          <input
            type="text"
            className={styles.input}
            value={ind.name}
            onChange={e => updateIndicador(ind.id, 'name', e.target.value)}
            placeholder="Ej: Número de talleres impartidos"
          />
          <input
            type="number"
            className={styles.input}
            value={ind.baseline === 0 && ind.target === 0 ? '' : ind.baseline}
            onChange={e => updateIndicador(ind.id, 'baseline', parseFloat(e.target.value) || 0)}
            placeholder="Base"
          />
          <input
            type="number"
            className={styles.input}
            value={ind.target === 0 && ind.baseline === 0 ? '' : ind.target}
            onChange={e => updateIndicador(ind.id, 'target', parseFloat(e.target.value) || 0)}
            placeholder="Meta"
          />
          <input
            type="number"
            className={styles.input}
            value={ind.current === 0 && ind.baseline === 0 && ind.target === 0 ? '' : ind.current}
            onChange={e => updateIndicador(ind.id, 'current', parseFloat(e.target.value) || 0)}
            placeholder="Actual"
          />
          <button className={styles.deleteBtn} onClick={() => removeIndicador(ind.id)} aria-label="Eliminar indicador">
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <button className={styles.addBtn} onClick={addIndicador}>
          <Plus size={16} />
          Añadir indicador
        </button>
        {mlIndicatorsExtracted.length > 0 && (
          <button 
            className={styles.addBtn} 
            onClick={handleSyncML}
            style={{ backgroundColor: 'var(--color-surface-hover)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
          >
            Sincronizar del Marco Lógico
          </button>
        )}
      </div>

      <ResultPanel
        title="Panel de Seguimiento y Evaluación"
        isEmpty={isEmpty}
        emptyMessage="Define tus indicadores arriba para visualizar el progreso del proyecto."
      >
        <div id="indicadores-dashboard-target" className={styles.dashboardGrid}>
          {indicadores.filter(i => i.name.trim()).map(ind => {
            const range = ind.target - ind.baseline;
            const progress = ind.current - ind.baseline;
            let percent = range === 0 ? 0 : (progress / range) * 100;
            if (percent < 0) percent = 0;
            
            // Determinamos el color de la barra
            let barColor = 'var(--color-primary-500)';
            if (percent >= 100) barColor = '#10b981'; // green
            else if (percent > 0 && percent < 33) barColor = '#f59e0b'; // orange

            return (
              <div key={ind.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <h4 className={styles.cardTitle}>{ind.name}</h4>
                  <span className={styles.cardPercentage} style={{ color: percent >= 100 ? '#10b981' : undefined }}>
                    {Math.round(percent)}%
                  </span>
                </div>
                
                <div className={styles.progressBarContainer}>
                  <div 
                    className={styles.progressBar} 
                    style={{ width: `${Math.min(percent, 100)}%`, backgroundColor: barColor }} 
                  />
                </div>

                <div className={styles.statsRow}>
                  <div className={styles.statItem}>
                    <span>Base</span>
                    <span className={styles.statValue}>{ind.baseline}</span>
                  </div>
                  <div className={styles.statItem} style={{ textAlign: 'center' }}>
                    <span>Actual</span>
                    <span className={styles.statValue}>{ind.current}</span>
                  </div>
                  <div className={styles.statItem} style={{ textAlign: 'right' }}>
                    <span>Meta</span>
                    <span className={styles.statValue}>{ind.target}</span>
                  </div>
                </div>
              </div>
            );
          })}
        </div>

        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }} className="no-print">
          <ExportPdfButton targetId="indicadores-dashboard-target" filename="cuadro-de-mandos" projectName={projectName} />
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
