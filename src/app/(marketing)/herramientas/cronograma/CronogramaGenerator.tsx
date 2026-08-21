'use client';

import React, { useState, useId } from 'react';
import { Plus, Trash2 } from 'lucide-react';
import { ResultPanel } from '@/components/tools/ResultPanel';
import { saveToolData } from '@/app/actions/tools';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/Toast';
import { ExportPdfButton } from '@/components/ui/ExportPdfButton';
import styles from './cronograma.module.css';

interface CronogramaActivity {
  id: string;
  description: string;
  responsible: string;
  startMonth: number;
  endMonth: number;
}

interface CronogramaData {
  projectName?: string;
  durationMonths?: number;
  activities?: CronogramaActivity[];
}

interface CronogramaGeneratorProps {
  initialData?: unknown;
  projectId?: string;
  projectName?: string;
  mlData?: unknown;
}

interface MLNode {
  description?: string;
  results?: MLNode[];
  activities?: MLNode[];
}

interface MLRoot {
  objectives?: MLNode[];
}

function extractMLActivities(data: unknown): string[] {
  if (!data || typeof data !== 'object') return [];
  const ml = data as MLRoot;
  const descriptions: string[] = [];
  
  if (Array.isArray(ml.objectives)) {
    ml.objectives.forEach(obj => {
      if (Array.isArray(obj.results)) {
        obj.results.forEach(res => {
          if (Array.isArray(res.activities)) {
            res.activities.forEach(act => {
              if (act && typeof act.description === 'string' && act.description.trim() !== '') {
                descriptions.push(act.description);
              }
            });
          }
        });
      }
    });
  }
  return descriptions;
}

const parseInit = (data: unknown): CronogramaData =>
  (data && typeof data === 'object' ? data : {}) as CronogramaData;

export function CronogramaGenerator({ initialData, projectId, projectName: externalProjectName, mlData }: CronogramaGeneratorProps) {
  const uid = useId();
  
  const init = parseInit(initialData);
  const { toasts, showToast, removeToast } = useToast();

  const [localProjectName, setLocalProjectName] = useState<string>(init.projectName || '');
  const projectName = externalProjectName || localProjectName;

  const [durationMonths, setDurationMonths] = useState<number>(init.durationMonths || 12);
  
  const mlDescriptions = React.useMemo(() => extractMLActivities(mlData), [mlData]);
  
  const [activities, setActivities] = useState<CronogramaActivity[]>(() => {
    if (init.activities && init.activities.length > 0) return init.activities;
    
    if (mlDescriptions.length > 0) {
      return mlDescriptions.map((desc, idx) => ({
        id: Date.now().toString() + idx,
        description: desc,
        responsible: '',
        startMonth: 1,
        endMonth: 1
      }));
    }
    
    return [
      { id: '1', description: 'Reunión inicial de coordinación', responsible: 'Coordinador', startMonth: 1, endMonth: 1 },
      { id: '2', description: 'Ejecución de talleres', responsible: 'Educador/a', startMonth: 2, endMonth: 10 },
      { id: '3', description: 'Evaluación final y memoria', responsible: 'Coordinador', startMonth: 11, endMonth: 12 },
    ];
  });
  
  const [isSaving, setIsSaving] = useState(false);

  const handleSyncML = () => {
    let addedCount = 0;
    const newActs = [...activities];
    
    mlDescriptions.forEach((desc, idx) => {
      const exists = newActs.some(a => a.description.toLowerCase().trim() === desc.toLowerCase().trim());
      if (!exists && desc.trim()) {
        newActs.push({
          id: Date.now().toString() + 'sync' + idx,
          description: desc,
          responsible: '',
          startMonth: 1,
          endMonth: 1
        });
        addedCount++;
      }
    });

    if (addedCount > 0) {
      setActivities(newActs);
      showToast(`Se han sincronizado ${addedCount} actividades del Marco Lógico`, 'success');
    } else {
      showToast('No hay actividades nuevas en el Marco Lógico', 'info');
    }
  };

  const addActivity = () => {
    setActivities(prev => [...prev, {
      id: Date.now().toString(),
      description: '',
      responsible: '',
      startMonth: 1,
      endMonth: 1
    }]);
  };

  const removeActivity = (id: string) => setActivities(prev => prev.filter(a => a.id !== id));
  
  const updateActivity = <K extends keyof CronogramaActivity>(id: string, field: K, value: CronogramaActivity[K]) => {
    setActivities(prev => prev.map(a => {
      if (a.id !== id) return a;
      const updated = { ...a, [field]: value };
      
      // Auto-correct invalid ranges
      if (field === 'startMonth' && updated.startMonth > updated.endMonth) {
        updated.endMonth = updated.startMonth;
      }
      if (field === 'endMonth' && updated.endMonth < updated.startMonth) {
        updated.startMonth = updated.endMonth;
      }
      return updated;
    }));
  };

  const handleSave = async () => {
    if (!projectId) return;
    setIsSaving(true);
    try {
      const payload = { projectName, durationMonths, activities };
      await saveToolData(projectId, 'cronograma-actividades', payload);
      showToast('Cronograma guardado con éxito', 'success');
    } catch {
      showToast('Error al guardar el cronograma', 'error');
    }
    setIsSaving(false);
  };

  const isEmpty = activities.every(a => !a.description.trim());

  return (
    <div id="cronograma-export-target">
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

      <div className={styles.sectionHeader}>Lista de Actividades</div>
      <div className={styles.actividadesHeader}>
        <span>Descripción de la actividad</span>
        <span>Responsable</span>
        <span>Mes inicio</span>
        <span>Mes fin</span>
        <span></span>
      </div>
      {activities.map(a => (
        <div key={a.id} className={styles.actividadRow}>
          <input
            type="text"
            className={styles.input}
            value={a.description}
            onChange={e => updateActivity(a.id, 'description', e.target.value)}
            placeholder="¿Qué se va a hacer?"
          />
          <input
            type="text"
            className={styles.input}
            value={a.responsible}
            onChange={e => updateActivity(a.id, 'responsible', e.target.value)}
            placeholder="¿Quién lo hará?"
          />
          <input
            type="number"
            min="1"
            max={durationMonths}
            className={styles.input}
            value={a.startMonth || ''}
            onChange={e => updateActivity(a.id, 'startMonth', parseInt(e.target.value) || 1)}
          />
          <input
            type="number"
            min="1"
            max={durationMonths}
            className={styles.input}
            value={a.endMonth || ''}
            onChange={e => updateActivity(a.id, 'endMonth', parseInt(e.target.value) || 1)}
          />
          <button className={styles.deleteBtn} onClick={() => removeActivity(a.id)} aria-label="Eliminar actividad">
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      <div style={{ display: 'flex', gap: '1rem', marginTop: '1rem' }}>
        <button className={styles.addBtn} onClick={addActivity}>
          <Plus size={16} />
          Añadir actividad
        </button>
        {mlDescriptions.length > 0 && (
          <button 
            className={styles.addBtn} 
            onClick={handleSyncML}
            style={{ backgroundColor: 'var(--color-surface-hover)', color: 'var(--text-primary)', border: '1px solid var(--border-color)' }}
          >
            Sincronizar Actividades (Marco Lógico)
          </button>
        )}
      </div>

      <ResultPanel
        title="Diagrama de Gantt"
        isEmpty={isEmpty}
        emptyMessage="Añade actividades para visualizar el cronograma del proyecto."
      >
        <div id="cronograma-gantt-target">
          <div className={styles.ganttWrapper}>
            <table className={styles.ganttTable}>
              <thead>
                <tr>
                  <th>Actividad</th>
                  <th>Responsable</th>
                  {Array.from({ length: durationMonths }).map((_, i) => (
                    <th key={i} className={styles.monthCell}>M{i + 1}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {activities.map(a => (
                  <tr key={a.id}>
                    <td>{a.description || <em style={{color: 'var(--text-muted)'}}>Sin descripción</em>}</td>
                    <td>{a.responsible}</td>
                    {Array.from({ length: durationMonths }).map((_, i) => {
                      const m = i + 1;
                      const isActive = m >= a.startMonth && m <= a.endMonth;
                      return (
                        <td key={i} className={styles.monthCell}>
                          <div className={`${styles.monthCellInner} ${isActive ? styles.activeMonth : ''}`} />
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }} className="no-print">
          <ExportPdfButton targetId="cronograma-gantt-target" filename="cronograma" projectName={projectName} />
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
