'use client';

import React, { useState, useId } from 'react';
import { ResultPanel } from '@/components/tools/ResultPanel';
import { saveToolData } from '@/app/actions/tools';
import { useToast } from '@/hooks/useToast';
import { ToastContainer } from '@/components/ui/Toast';
import { ExportPdfButton } from '@/components/ui/ExportPdfButton';
import { Sparkles } from 'lucide-react';
import styles from './memoria.module.css';

interface MemoriaData {
  projectName?: string;
  contexto: string;
  destinatarios: string;
  objetivos: string;
  metodologia: string;
  actividades: string;
  evaluacion: string;
}

interface MemoriaGeneratorProps {
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
  finDescription?: string;
  propositoDescription?: string;
  objectives?: MLNode[];
}

const parseInit = (data: unknown): MemoriaData => {
  const d = (data && typeof data === 'object' ? data : {}) as Record<string, unknown>;
  return {
    projectName: typeof d.projectName === 'string' ? d.projectName : '',
    contexto: typeof d.contexto === 'string' ? d.contexto : '',
    destinatarios: typeof d.destinatarios === 'string' ? d.destinatarios : '',
    objetivos: typeof d.objetivos === 'string' ? d.objetivos : '',
    metodologia: typeof d.metodologia === 'string' ? d.metodologia : '',
    actividades: typeof d.actividades === 'string' ? d.actividades : '',
    evaluacion: typeof d.evaluacion === 'string' ? d.evaluacion : '',
  };
};

function formatMLObjetivos(data: unknown): string {
  if (!data || typeof data !== 'object') return '';
  const ml = data as MLRoot;
  let text = '';
  if (typeof ml.finDescription === 'string' && ml.finDescription) {
    text += `FIN DEL PROYECTO (Impacto esperado):\n${ml.finDescription}\n\n`;
  }
  if (typeof ml.propositoDescription === 'string' && ml.propositoDescription) {
    text += `OBJETIVO GENERAL:\n${ml.propositoDescription}\n\n`;
  }
  if (Array.isArray(ml.objectives)) {
    text += `OBJETIVOS ESPECÍFICOS:\n`;
    ml.objectives.forEach((obj, i) => {
      if (obj && typeof obj.description === 'string' && obj.description) {
        text += `${i + 1}. ${obj.description}\n`;
      }
    });
  }
  return text.trim();
}

function formatMLActividades(data: unknown): string {
  if (!data || typeof data !== 'object') return '';
  const ml = data as MLRoot;
  let text = '';
  if (Array.isArray(ml.objectives)) {
    ml.objectives.forEach((obj, oIdx) => {
      if (obj && Array.isArray(obj.results)) {
        obj.results.forEach((res, rIdx) => {
          if (res && Array.isArray(res.activities) && res.activities.length > 0) {
            text += `\nPara alcanzar el Resultado ${oIdx + 1}.${rIdx + 1}:\n`;
            res.activities.forEach((act, aIdx) => {
              if (act && typeof act.description === 'string' && act.description) {
                text += `- Actividad ${oIdx + 1}.${rIdx + 1}.${aIdx + 1}: ${act.description}\n`;
              }
            });
          }
        });
      }
    });
  }
  return text.trim();
}

export function MemoriaGenerator({ initialData, projectId, projectName: externalProjectName, mlData }: MemoriaGeneratorProps) {
  const uid = useId();
  const init = parseInit(initialData);
  const { toasts, showToast, removeToast } = useToast();

  const [memoria, setMemoria] = useState<MemoriaData>({
    projectName: externalProjectName || init.projectName || '',
    contexto: init.contexto,
    destinatarios: init.destinatarios,
    objetivos: init.objetivos,
    metodologia: init.metodologia,
    actividades: init.actividades,
    evaluacion: init.evaluacion
  });

  const [isSaving, setIsSaving] = useState(false);

  const updateField = <K extends keyof MemoriaData>(field: K, value: string) => {
    setMemoria(prev => ({ ...prev, [field]: value }));
  };

  const syncObjetivos = () => {
    const text = formatMLObjetivos(mlData);
    if (text) {
      updateField('objetivos', text);
      showToast('Objetivos importados del Marco Lógico', 'success');
    } else {
      showToast('No se encontraron objetivos en el Marco Lógico', 'info');
    }
  };

  const syncActividades = () => {
    const text = formatMLActividades(mlData);
    if (text) {
      updateField('actividades', text);
      showToast('Actividades importadas del Marco Lógico', 'success');
    } else {
      showToast('No se encontraron actividades en el Marco Lógico', 'info');
    }
  };

  const handleSave = async () => {
    if (!projectId) return;
    setIsSaving(true);
    try {
      await saveToolData(projectId, 'memoria-proyecto', memoria);
      showToast('Memoria guardada con éxito', 'success');
    } catch {
      showToast('Error al guardar la memoria', 'error');
    }
    setIsSaving(false);
  };

  const isEmpty = !memoria.contexto && !memoria.objetivos && !memoria.actividades;

  return (
    <div id="memoria-export-target">
      <div className={styles.row2}>
        <div className={styles.formGroup}>
          <label htmlFor={`${uid}-name`} className={styles.label}>Nombre del proyecto</label>
          <input
            id={`${uid}-name`}
            type="text"
            className={styles.input}
            value={memoria.projectName}
            onChange={e => updateField('projectName', e.target.value)}
            disabled={!!externalProjectName}
            placeholder="Ej: Proyecto de inserción laboral 2026"
          />
        </div>
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>1. Contexto y Justificación</label>
        <textarea
          className={styles.textarea}
          value={memoria.contexto}
          onChange={e => updateField('contexto', e.target.value)}
          placeholder="Describe el problema social que pretendes resolver, los antecedentes y por qué es necesario este proyecto..."
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>2. Población Destinataria</label>
        <textarea
          className={styles.textarea}
          value={memoria.destinatarios}
          onChange={e => updateField('destinatarios', e.target.value)}
          placeholder="¿A quién va dirigido el proyecto? Perfil sociodemográfico, número estimado de beneficiarios directos e indirectos..."
        />
      </div>

      <div className={styles.formGroup}>
        <div className={styles.label}>
          <span>3. Objetivos del Proyecto</span>
          {!!mlData && (
            <button className={styles.syncBtn} onClick={syncObjetivos} title="Importar del Marco Lógico">
              <Sparkles size={14} /> Auto-completar
            </button>
          )}
        </div>
        <textarea
          className={styles.textarea}
          value={memoria.objetivos}
          onChange={e => updateField('objetivos', e.target.value)}
          placeholder="Objetivo General y Objetivos Específicos..."
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>4. Metodología de Intervención</label>
        <textarea
          className={styles.textarea}
          value={memoria.metodologia}
          onChange={e => updateField('metodologia', e.target.value)}
          placeholder="¿Cómo se va a trabajar? Modelos de intervención, enfoque transversal (perspectiva de género, etc.)..."
        />
      </div>

      <div className={styles.formGroup}>
        <div className={styles.label}>
          <span>5. Actividades Principales</span>
          {!!mlData && (
            <button className={styles.syncBtn} onClick={syncActividades} title="Importar del Marco Lógico">
              <Sparkles size={14} /> Auto-completar
            </button>
          )}
        </div>
        <textarea
          className={styles.textarea}
          value={memoria.actividades}
          onChange={e => updateField('actividades', e.target.value)}
          placeholder="Descripción detallada de las acciones que se llevarán a cabo..."
        />
      </div>

      <div className={styles.formGroup}>
        <label className={styles.label}>6. Sistema de Evaluación e Indicadores</label>
        <textarea
          className={styles.textarea}
          value={memoria.evaluacion}
          onChange={e => updateField('evaluacion', e.target.value)}
          placeholder="¿Cómo se medirá el éxito del proyecto? Cita algunos de los indicadores principales y las fuentes de verificación..."
        />
      </div>

      <ResultPanel
        title="Previsualización del Documento"
        isEmpty={isEmpty}
        emptyMessage="Rellena los apartados superiores para ver el documento final."
      >
        <div id="memoria-document-target">
          <div className={styles.documentWrapper}>
            <h1 className={styles.docTitle}>{memoria.projectName || 'Memoria del Proyecto'}</h1>
            
            {memoria.contexto && (
              <div className={styles.docSection}>
                <h2 className={styles.docH2}>1. Contexto y Justificación</h2>
                <div className={styles.docText}>{memoria.contexto}</div>
              </div>
            )}
            
            {memoria.destinatarios && (
              <div className={styles.docSection}>
                <h2 className={styles.docH2}>2. Población Destinataria</h2>
                <div className={styles.docText}>{memoria.destinatarios}</div>
              </div>
            )}
            
            {memoria.objetivos && (
              <div className={styles.docSection}>
                <h2 className={styles.docH2}>3. Objetivos del Proyecto</h2>
                <div className={styles.docText}>{memoria.objetivos}</div>
              </div>
            )}
            
            {memoria.metodologia && (
              <div className={styles.docSection}>
                <h2 className={styles.docH2}>4. Metodología de Intervención</h2>
                <div className={styles.docText}>{memoria.metodologia}</div>
              </div>
            )}
            
            {memoria.actividades && (
              <div className={styles.docSection}>
                <h2 className={styles.docH2}>5. Actividades Principales</h2>
                <div className={styles.docText}>{memoria.actividades}</div>
              </div>
            )}
            
            {memoria.evaluacion && (
              <div className={styles.docSection}>
                <h2 className={styles.docH2}>6. Sistema de Evaluación</h2>
                <div className={styles.docText}>{memoria.evaluacion}</div>
              </div>
            )}
          </div>
        </div>

        <div style={{ marginTop: '1.5rem', display: 'flex', justifyContent: 'flex-end', gap: '1rem' }} className="no-print">
          <ExportPdfButton targetId="memoria-document-target" filename="memoria-narrativa" projectName={memoria.projectName} />
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
