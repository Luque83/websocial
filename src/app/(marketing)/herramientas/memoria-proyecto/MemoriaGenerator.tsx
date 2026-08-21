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
  cronograma: string;
  evaluacion: string;
  presupuesto: string;
}

interface MemoriaGeneratorProps {
  initialData?: unknown;
  projectId?: string;
  projectName?: string;
  mlData?: unknown;
  costesData?: unknown;
  cronogramaData?: unknown;
  indicadoresData?: unknown;
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
    cronograma: typeof d.cronograma === 'string' ? d.cronograma : '',
    evaluacion: typeof d.evaluacion === 'string' ? d.evaluacion : '',
    presupuesto: typeof d.presupuesto === 'string' ? d.presupuesto : '',
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

function formatCronograma(data: unknown): string {
  if (!data || typeof data !== 'object') return '';
  const c = data as Record<string, unknown>;
  let text = '';
  if (c.durationMonths) {
    text += `Duración estimada del proyecto: ${c.durationMonths} meses.\n\n`;
  }
  if (Array.isArray(c.activities) && c.activities.length > 0) {
    text += `PLANIFICACIÓN TEMPORAL DE ACTIVIDADES:\n`;
    c.activities.forEach((act: Record<string, unknown>) => {
      if (act && typeof act.description === 'string' && act.description) {
        const resp = act.responsible ? ` (Responsable: ${act.responsible})` : '';
        text += `• Mes ${act.startMonth || 1} a Mes ${act.endMonth || 1}: ${act.description}${resp}\n`;
      }
    });
  }
  return text.trim();
}

function formatIndicadores(data: unknown): string {
  if (!data || typeof data !== 'object') return '';
  const indData = data as Record<string, unknown>;
  let text = '';
  if (Array.isArray(indData.indicadores) && indData.indicadores.length > 0) {
    text += `SISTEMA DE INDICADORES DE SEGUIMIENTO E IMPACTO:\n\n`;
    indData.indicadores.forEach((ind: Record<string, unknown>, idx: number) => {
      if (ind && typeof ind.name === 'string' && ind.name) {
        const source = ind.fuenteVerificacion ? ` [Verificación: ${ind.fuenteVerificacion}]` : '';
        text += `${idx + 1}. ${ind.name}\n   - Valor Base: ${ind.baseline ?? 0} | Meta: ${ind.target ?? 0}${source}\n`;
      }
    });
  }
  return text.trim();
}

function formatCostes(data: unknown): string {
  if (!data || typeof data !== 'object') return '';
  const c = data as Record<string, unknown>;
  let text = '';
  
  if (Array.isArray(c.partidas) && c.partidas.length > 0) {
    const directTotal = c.partidas.reduce((acc: number, p: Record<string, unknown>) => acc + (Number(p.monthlyAmount || 0) * Number(p.months || 1)), 0);
    const indirectPct = Number(c.indirectPct) || 0;
    const indirectAmount = (directTotal * indirectPct) / 100;
    const grandTotal = directTotal + indirectAmount;
    const aportacion = Number(c.aportacionPropia) || 0;
    const subvencion = Math.max(0, grandTotal - aportacion);

    const fmt = (n: number) => new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(n);

    text += `RESUMEN PRESUPUESTARIO Y PLAN DE FINANCIACIÓN:\n\n`;
    text += `• Costes Directos de Ejecución: ${fmt(directTotal)}\n`;
    text += `• Costes Indirectos / Gastos Generales (${indirectPct}%): ${fmt(indirectAmount)}\n`;
    text += `• PRESUPUESTO TOTAL: ${fmt(grandTotal)}\n\n`;
    
    if (aportacion > 0) {
      text += `Plan de Financiación:\n`;
      text += `- Subvención solicitada: ${fmt(subvencion)} (${((subvencion / grandTotal) * 100).toFixed(1)}%)\n`;
      text += `- Cofinanciación / Fondos propios: ${fmt(aportacion)} (${((aportacion / grandTotal) * 100).toFixed(1)}%)\n\n`;
    }

    text += `Principales Partidas:\n`;
    c.partidas.slice(0, 8).forEach((p: Record<string, unknown>) => {
      if (p.description) {
        text += `- ${p.description}: ${fmt(Number(p.monthlyAmount || 0) * Number(p.months || 1))}\n`;
      }
    });
  }
  return text.trim();
}

export function MemoriaGenerator({ initialData, projectId, projectName: externalProjectName, mlData, costesData, cronogramaData, indicadoresData }: MemoriaGeneratorProps) {
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
    cronograma: init.cronograma,
    evaluacion: init.evaluacion,
    presupuesto: init.presupuesto,
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

  const syncCronograma = () => {
    const text = formatCronograma(cronogramaData);
    if (text) {
      updateField('cronograma', text);
      showToast('Cronograma importado con éxito', 'success');
    } else {
      showToast('No se encontró cronograma guardado', 'info');
    }
  };

  const syncIndicadores = () => {
    const text = formatIndicadores(indicadoresData);
    if (text) {
      updateField('evaluacion', text);
      showToast('Indicadores y fuentes de verificación importados', 'success');
    } else {
      showToast('No se encontraron indicadores guardados', 'info');
    }
  };

  const syncCostes = () => {
    const text = formatCostes(costesData);
    if (text) {
      updateField('presupuesto', text);
      showToast('Presupuesto y financiación importados', 'success');
    } else {
      showToast('No se encontraron costes guardados', 'info');
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
              <Sparkles size={14} /> Auto-completar desde Marco Lógico
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
              <Sparkles size={14} /> Auto-completar desde Marco Lógico
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
        <div className={styles.label}>
          <span>6. Calendario y Cronograma de Ejecución</span>
          {!!cronogramaData && (
            <button className={styles.syncBtn} onClick={syncCronograma} title="Importar del Cronograma">
              <Sparkles size={14} /> Auto-completar desde Cronograma
            </button>
          )}
        </div>
        <textarea
          className={styles.textarea}
          value={memoria.cronograma}
          onChange={e => updateField('cronograma', e.target.value)}
          placeholder="Planificación temporal, hitos y fases..."
        />
      </div>

      <div className={styles.formGroup}>
        <div className={styles.label}>
          <span>7. Sistema de Evaluación e Indicadores</span>
          {!!indicadoresData && (
            <button className={styles.syncBtn} onClick={syncIndicadores} title="Importar de Indicadores">
              <Sparkles size={14} /> Auto-completar desde Indicadores
            </button>
          )}
        </div>
        <textarea
          className={styles.textarea}
          value={memoria.evaluacion}
          onChange={e => updateField('evaluacion', e.target.value)}
          placeholder="¿Cómo se medirá el éxito del proyecto? Cita algunos de los indicadores principales y las fuentes de verificación..."
        />
      </div>

      <div className={styles.formGroup}>
        <div className={styles.label}>
          <span>8. Presupuesto y Recursos Económicos</span>
          {!!costesData && (
            <button className={styles.syncBtn} onClick={syncCostes} title="Importar de Costes">
              <Sparkles size={14} /> Auto-completar desde Presupuesto
            </button>
          )}
        </div>
        <textarea
          className={styles.textarea}
          value={memoria.presupuesto}
          onChange={e => updateField('presupuesto', e.target.value)}
          placeholder="Desglose presupuestario y justificación económica..."
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

            {memoria.cronograma && (
              <div className={styles.docSection}>
                <h2 className={styles.docH2}>6. Calendario y Cronograma de Ejecución</h2>
                <div className={styles.docText}>{memoria.cronograma}</div>
              </div>
            )}
            
            {memoria.evaluacion && (
              <div className={styles.docSection}>
                <h2 className={styles.docH2}>7. Sistema de Evaluación e Indicadores</h2>
                <div className={styles.docText}>{memoria.evaluacion}</div>
              </div>
            )}

            {memoria.presupuesto && (
              <div className={styles.docSection}>
                <h2 className={styles.docH2}>8. Presupuesto y Recursos Económicos</h2>
                <div className={styles.docText}>{memoria.presupuesto}</div>
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
