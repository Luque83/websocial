'use client';

import React, { useState, useId } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { ResultPanel } from '@/components/tools/ResultPanel';
import { saveToolData } from '@/app/actions/tools';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/Toast';
import { ExportPdfButton } from '@/components/ui/ExportPdfButton';
import styles from './indicadores.module.css';

type IndicadorType = 'cuantitativo' | 'porcentaje' | 'cualitativo';

interface Indicador {
  id: string;
  name: string;
  type: IndicadorType;
  fuenteVerificacion: string;
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
  source?: string;
  results?: MLNode[];
}

interface MLRoot {
  finIndicator?: string;
  finSource?: string;
  propositoIndicator?: string;
  propositoSource?: string;
  objectives?: MLNode[];
}

interface ExtractedMLIndicator {
  name: string;
  source: string;
}

function extractMLIndicators(data: unknown): ExtractedMLIndicator[] {
  if (!data || typeof data !== 'object') return [];
  const ml = data as MLRoot;
  const items: ExtractedMLIndicator[] = [];
  
  if (typeof ml.finIndicator === 'string' && ml.finIndicator.trim()) {
    items.push({ name: ml.finIndicator.trim(), source: ml.finSource || 'Memorias e informes' });
  }
  if (typeof ml.propositoIndicator === 'string' && ml.propositoIndicator.trim()) {
    items.push({ name: ml.propositoIndicator.trim(), source: ml.propositoSource || 'Informes de seguimiento' });
  }
  
  if (Array.isArray(ml.objectives)) {
    ml.objectives.forEach(obj => {
      if (typeof obj.indicator === 'string' && obj.indicator.trim()) {
        items.push({ name: obj.indicator.trim(), source: obj.source || 'Registros de intervención' });
      }
      if (Array.isArray(obj.results)) {
        obj.results.forEach(res => {
          if (typeof res.indicator === 'string' && res.indicator.trim()) {
            items.push({ name: res.indicator.trim(), source: res.source || 'Listados de asistencia' });
          }
        });
      }
    });
  }
  
  return items;
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
    if (init.indicadores && init.indicadores.length > 0) {
      return init.indicadores.map(i => ({
        ...i,
        type: i.type || 'cuantitativo',
        fuenteVerificacion: i.fuenteVerificacion || ''
      }));
    }
    
    if (mlIndicatorsExtracted.length > 0) {
      return mlIndicatorsExtracted.map((ind, idx) => ({
        id: Date.now().toString() + idx,
        name: ind.name,
        type: 'cuantitativo' as IndicadorType,
        fuenteVerificacion: ind.source,
        baseline: 0,
        target: 50,
        current: 0
      }));
    }
    
    return [
      { 
        id: '1', 
        name: 'Personas usuarias atendidas', 
        type: 'cuantitativo', 
        fuenteVerificacion: 'Fichas de acogida y registro de participantes', 
        baseline: 0, 
        target: 50, 
        current: 28 
      },
      { 
        id: '2', 
        name: 'Tasa de inserción sociolaboral', 
        type: 'porcentaje', 
        fuenteVerificacion: 'Contratos laborales e informes de seguimiento', 
        baseline: 0, 
        target: 40, 
        current: 25 
      },
      { 
        id: '3', 
        name: 'Guía de recursos de empleo elaborada', 
        type: 'cualitativo', 
        fuenteVerificacion: 'Ejemplar en PDF y registro de entrega', 
        baseline: 0, 
        target: 1, 
        current: 1 
      },
    ];
  });
  
  const [isSaving, setIsSaving] = useState(false);

  const handleSyncML = () => {
    let addedCount = 0;
    const newInds = [...indicadores];
    
    mlIndicatorsExtracted.forEach((mlInd, idx) => {
      const exists = newInds.some(i => i.name.toLowerCase().trim() === mlInd.name.toLowerCase().trim());
      if (!exists && mlInd.name.trim()) {
        newInds.push({
          id: Date.now().toString() + 'sync' + idx,
          name: mlInd.name,
          type: 'cuantitativo',
          fuenteVerificacion: mlInd.source,
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
      type: 'cuantitativo',
      fuenteVerificacion: '',
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
      showToast('Sistema de indicadores guardado con éxito', 'success');
    } catch {
      showToast('Error al guardar los indicadores', 'error');
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

      <div className={styles.sectionHeader}>Sistema de Indicadores y Fuentes de Verificación</div>
      <div className={styles.indicadoresHeader}>
        <span>Tipo</span>
        <span>Indicador / Métrica</span>
        <span>Fuente de verificación</span>
        <span>Base</span>
        <span>Meta</span>
        <span>Actual</span>
        <span></span>
      </div>
      {indicadores.map(ind => (
        <div key={ind.id} className={styles.indicadorRow}>
          <select
            className={styles.input}
            value={ind.type}
            onChange={e => updateIndicador(ind.id, 'type', e.target.value as IndicadorType)}
          >
            <option value="cuantitativo">Nº Cantidad</option>
            <option value="porcentaje">% Porcentaje</option>
            <option value="cualitativo">Hito (Sí/No)</option>
          </select>
          <input
            type="text"
            className={styles.input}
            value={ind.name}
            onChange={e => updateIndicador(ind.id, 'name', e.target.value)}
            placeholder="Ej: Talleres realizados"
          />
          <input
            type="text"
            className={styles.input}
            value={ind.fuenteVerificacion}
            onChange={e => updateIndicador(ind.id, 'fuenteVerificacion', e.target.value)}
            placeholder="Ej: Listados de asistencia"
          />
          <input
            type="number"
            className={styles.input}
            value={ind.baseline}
            onChange={e => updateIndicador(ind.id, 'baseline', parseFloat(e.target.value) || 0)}
            placeholder="0"
          />
          <input
            type="number"
            className={styles.input}
            value={ind.target}
            onChange={e => updateIndicador(ind.id, 'target', parseFloat(e.target.value) || 0)}
            placeholder="Meta"
          />
          <input
            type="number"
            className={styles.input}
            value={ind.current}
            onChange={e => updateIndicador(ind.id, 'current', parseFloat(e.target.value) || 0)}
            placeholder="Actual"
          />
          <button className={styles.deleteBtn} onClick={() => removeIndicador(ind.id)} aria-label="Eliminar indicador">
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem', flexWrap: 'wrap' }}>
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
            📋 Sincronizar del Marco Lógico
          </button>
        )}
      </div>

      <ResultPanel
        title="Cuadro de Mando y Seguimiento de Impacto"
        isEmpty={isEmpty}
        emptyMessage="Define tus indicadores y fuentes de verificación para visualizar el cuadro de mando."
      >
        <div id="indicadores-dashboard-target" className={styles.dashboardGrid}>
          {indicadores.filter(i => i.name.trim()).map(ind => {
            const range = ind.target - ind.baseline;
            const progress = ind.current - ind.baseline;
            let percent = range === 0 ? 0 : (progress / range) * 100;
            if (percent < 0) percent = 0;
            
            // Color de barra
            let barColor = 'var(--color-primary-500)';
            if (percent >= 100) barColor = '#10b981';
            else if (percent > 0 && percent < 33) barColor = '#f59e0b';

            const unit = ind.type === 'porcentaje' ? '%' : '';

            return (
              <div key={ind.id} className={styles.card}>
                <div className={styles.cardHeader}>
                  <div>
                    <span style={{ 
                      fontSize: '0.7rem', 
                      textTransform: 'uppercase', 
                      fontWeight: 700, 
                      letterSpacing: '0.05em',
                      color: 'var(--color-primary-600)',
                      backgroundColor: 'var(--color-primary-50)',
                      padding: '0.15rem 0.4rem',
                      borderRadius: '4px',
                      display: 'inline-block',
                      marginBottom: '0.35rem'
                    }}>
                      {ind.type === 'porcentaje' ? 'Porcentual' : ind.type === 'cualitativo' ? 'Hito / Entregable' : 'Cuantitativo'}
                    </span>
                    <h4 className={styles.cardTitle}>{ind.name}</h4>
                  </div>
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
                    <span className={styles.statValue}>{ind.baseline}{unit}</span>
                  </div>
                  <div className={styles.statItem} style={{ textAlign: 'center' }}>
                    <span>Actual</span>
                    <span className={styles.statValue}>{ind.current}{unit}</span>
                  </div>
                  <div className={styles.statItem} style={{ textAlign: 'right' }}>
                    <span>Meta</span>
                    <span className={styles.statValue}>{ind.target}{unit}</span>
                  </div>
                </div>

                {ind.fuenteVerificacion && (
                  <div style={{ 
                    fontSize: '0.75rem', 
                    color: 'var(--text-secondary)', 
                    borderTop: '1px dashed var(--border-color)', 
                    paddingTop: '0.5rem',
                    marginTop: '0.25rem'
                  }}>
                    📁 <strong>Verificación:</strong> {ind.fuenteVerificacion}
                  </div>
                )}
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
