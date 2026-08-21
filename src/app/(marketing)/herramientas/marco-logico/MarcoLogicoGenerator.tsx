'use client';

import React, { useState } from 'react';
import { Plus, Trash2, ArrowRight, ArrowLeft } from 'lucide-react';
import { ResultPanel } from '@/components/tools/ResultPanel';
import { saveToolData } from '@/app/actions/tools';
import styles from './marco-logico.module.css';

interface Activity {
  id: string;
  description: string;
  resources: string;
  cost: string;
  assumption: string;
}

interface Result {
  id: string;
  description: string;
  indicator: string;
  source: string;
  assumption: string;
  activities: Activity[];
}

interface SpecificObjective {
  id: string;
  description: string;
  indicator: string;
  source: string;
  assumption: string;
  results: Result[];
}

interface MarcoLogico {
  projectName: string;
  finDescription: string;
  finIndicator: string;
  finSource: string;
  finAssumption: string;
  propositoDescription: string;
  propositoIndicator: string;
  propositoSource: string;
  propositoAssumption: string;
  objectives: SpecificObjective[];
}

const generateId = () => Date.now().toString() + Math.random().toString(36).substring(2, 9);

interface MarcoLogicoGeneratorProps {
  initialData?: Partial<MarcoLogico>;
  projectId?: string;
}

export function MarcoLogicoGenerator({ initialData, projectId }: MarcoLogicoGeneratorProps) {
  const [step, setStep] = useState(1);
  const [isSaving, setIsSaving] = useState(false);
  const [ml, setMl] = useState<MarcoLogico>({
    projectName: '',
    finDescription: '',
    finIndicator: '',
    finSource: '',
    finAssumption: '',
    propositoDescription: '',
    propositoIndicator: '',
    propositoSource: '',
    propositoAssumption: '',
    objectives: [
      {
        id: generateId(),
        description: '',
        indicator: '',
        source: '',
        assumption: '',
        results: [
          {
            id: generateId(),
            description: '',
            indicator: '',
            source: '',
            assumption: '',
            activities: [
              {
                id: generateId(),
                description: '',
                resources: '',
                cost: '',
                assumption: ''
              }
            ]
          }
        ]
      }
    ],
    ...initialData
  });

  const nextStep = () => setStep(s => Math.min(s + 1, 4));
  const prevStep = () => setStep(s => Math.max(s - 1, 1));

  const updateField = <K extends keyof MarcoLogico>(field: K, value: MarcoLogico[K]) => {
    setMl(prev => ({ ...prev, [field]: value }));
  };

  const handleObjChange = <K extends keyof SpecificObjective>(idx: number, field: K, value: SpecificObjective[K]) => {
    const newObjs = [...ml.objectives];
    newObjs[idx] = { ...newObjs[idx], [field]: value };
    updateField('objectives', newObjs);
  };

  const addObj = () => {
    if (ml.objectives.length >= 5) return;
    updateField('objectives', [...ml.objectives, {
      id: generateId(),
      description: '',
      indicator: '',
      source: '',
      assumption: '',
      results: [{ id: generateId(), description: '', indicator: '', source: '', assumption: '', activities: [] }]
    }]);
  };

  const removeObj = (idx: number) => {
    const newObjs = [...ml.objectives];
    newObjs.splice(idx, 1);
    updateField('objectives', newObjs);
  };

  const handleResChange = <K extends keyof Result>(objIdx: number, resIdx: number, field: K, value: Result[K]) => {
    const newObjs = [...ml.objectives];
    newObjs[objIdx].results[resIdx] = { ...newObjs[objIdx].results[resIdx], [field]: value };
    updateField('objectives', newObjs);
  };

  const addRes = (objIdx: number) => {
    const newObjs = [...ml.objectives];
    newObjs[objIdx].results.push({ id: generateId(), description: '', indicator: '', source: '', assumption: '', activities: [] });
    updateField('objectives', newObjs);
  };

  const removeRes = (objIdx: number, resIdx: number) => {
    const newObjs = [...ml.objectives];
    newObjs[objIdx].results.splice(resIdx, 1);
    updateField('objectives', newObjs);
  };

  const handleActChange = <K extends keyof Activity>(objIdx: number, resIdx: number, actIdx: number, field: K, value: Activity[K]) => {
    const newObjs = [...ml.objectives];
    newObjs[objIdx].results[resIdx].activities[actIdx] = { ...newObjs[objIdx].results[resIdx].activities[actIdx], [field]: value };
    updateField('objectives', newObjs);
  };

  const addAct = (objIdx: number, resIdx: number) => {
    const newObjs = [...ml.objectives];
    newObjs[objIdx].results[resIdx].activities.push({ id: generateId(), description: '', resources: '', cost: '', assumption: '' });
    updateField('objectives', newObjs);
  };

  const removeAct = (objIdx: number, resIdx: number, actIdx: number) => {
    const newObjs = [...ml.objectives];
    newObjs[objIdx].results[resIdx].activities.splice(actIdx, 1);
    updateField('objectives', newObjs);
  };

  const copyText = `Matriz de Marco Lógico - ${ml.projectName}

Nivel | Resumen Narrativo | Indicadores | Medios de Verificación | Supuestos
--------------------------------------------------------------------------------
FIN | ${ml.finDescription} | ${ml.finIndicator} | ${ml.finSource} | ${ml.finAssumption}
PROPÓSITO | ${ml.propositoDescription} | ${ml.propositoIndicator} | ${ml.propositoSource} | ${ml.propositoAssumption}
${ml.objectives.map((obj, oIdx) => `
OBJETIVO ${oIdx + 1} | ${obj.description} | ${obj.indicator} | ${obj.source} | ${obj.assumption}
${obj.results.map((res, rIdx) => `
  RESULTADO ${oIdx + 1}.${rIdx + 1} | ${res.description} | ${res.indicator} | ${res.source} | ${res.assumption}
${res.activities.map((act, aIdx) => `
    ACTIVIDAD ${oIdx + 1}.${rIdx + 1}.${aIdx + 1} | ${act.description} | ${act.resources} | ${act.cost} | ${act.assumption}`).join('')}`).join('')}`).join('')}`;

  return (
    <div className={styles.container}>
      <div className={styles.steps}>
        {[1, 2, 3, 4].map(s => (
          <div key={s} className={styles.stepWrapper}>
            <div className={`${styles.stepCircle} ${step === s ? styles.stepActive : step > s ? styles.stepCompleted : ''}`}>
              {s}
            </div>
            {s < 4 && <div className={`${styles.stepConnector} ${step > s ? styles.stepConnectorActive : ''}`} />}
          </div>
        ))}
      </div>

      {step === 1 && (
        <div className={styles.formCard}>
          <div className={styles.formCardTitle}>Paso 1: Fin y Propósito</div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Nombre del Proyecto</label>
            <input className={styles.input} value={ml.projectName} onChange={e => updateField('projectName', e.target.value)} />
          </div>
          
          <div className={styles.sectionDivider}>FIN (Impacto)</div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Descripción</label>
            <textarea className={styles.textarea} value={ml.finDescription} onChange={e => updateField('finDescription', e.target.value)} />
          </div>
          <div className={styles.row2}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Indicadores</label>
              <textarea className={styles.textarea} value={ml.finIndicator} onChange={e => updateField('finIndicator', e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Fuentes de verificación</label>
              <textarea className={styles.textarea} value={ml.finSource} onChange={e => updateField('finSource', e.target.value)} />
            </div>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Supuestos</label>
            <textarea className={styles.textarea} value={ml.finAssumption} onChange={e => updateField('finAssumption', e.target.value)} />
          </div>

          <div className={styles.sectionDivider}>PROPÓSITO (Objetivo General)</div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Descripción</label>
            <textarea className={styles.textarea} value={ml.propositoDescription} onChange={e => updateField('propositoDescription', e.target.value)} />
          </div>
          <div className={styles.row2}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Indicadores</label>
              <textarea className={styles.textarea} value={ml.propositoIndicator} onChange={e => updateField('propositoIndicator', e.target.value)} />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Fuentes</label>
              <textarea className={styles.textarea} value={ml.propositoSource} onChange={e => updateField('propositoSource', e.target.value)} />
            </div>
          </div>
          <div className={styles.formGroup}>
            <label className={styles.label}>Supuestos</label>
            <textarea className={styles.textarea} value={ml.propositoAssumption} onChange={e => updateField('propositoAssumption', e.target.value)} />
          </div>
        </div>
      )}

      {step === 2 && (
        <div className={styles.formCard}>
          <div className={styles.formCardTitle}>Paso 2: Objetivos Específicos y Resultados</div>
          {ml.objectives.map((obj, oIdx) => (
            <div key={obj.id} className={styles.objCard}>
              <div className={styles.objHeader}>
                <strong>Objetivo {oIdx + 1}</strong>
                <button className={styles.iconBtn} onClick={() => removeObj(oIdx)}><Trash2 size={16} /></button>
              </div>
              <div className={styles.formGroup}>
                <label className={styles.label}>Descripción del Objetivo</label>
                <textarea className={styles.textarea} value={obj.description} onChange={e => handleObjChange(oIdx, 'description', e.target.value)} />
              </div>
              <div className={styles.row2}>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Indicadores</label>
                  <textarea className={styles.textarea} value={obj.indicator} onChange={e => handleObjChange(oIdx, 'indicator', e.target.value)} />
                </div>
                <div className={styles.formGroup}>
                  <label className={styles.label}>Fuentes</label>
                  <textarea className={styles.textarea} value={obj.source} onChange={e => handleObjChange(oIdx, 'source', e.target.value)} />
                </div>
              </div>
              
              <div className={styles.resContainer}>
                <label className={styles.label}>Resultados de este objetivo</label>
                {obj.results.map((res, rIdx) => (
                  <div key={res.id} className={styles.resCard}>
                    <div className={styles.resHeader}>
                      <span>Resultado {oIdx + 1}.{rIdx + 1}</span>
                      <button className={styles.iconBtn} onClick={() => removeRes(oIdx, rIdx)}><Trash2 size={16}/></button>
                    </div>
                    <textarea className={styles.textarea} placeholder="Descripción" value={res.description} onChange={e => handleResChange(oIdx, rIdx, 'description', e.target.value)} />
                  </div>
                ))}
                <button className={styles.addBtn} onClick={() => addRes(oIdx)}><Plus size={16}/> Añadir Resultado</button>
              </div>
            </div>
          ))}
          {ml.objectives.length < 5 && (
            <button className={styles.addBtn} onClick={addObj}><Plus size={16}/> Añadir Objetivo Específico</button>
          )}
        </div>
      )}

      {step === 3 && (
        <div className={styles.formCard}>
          <div className={styles.formCardTitle}>Paso 3: Actividades</div>
          {ml.objectives.map((obj, oIdx) => (
            <div key={obj.id} className={styles.actObjContainer}>
              <h4 className={styles.actObjTitle}>Objetivo {oIdx + 1}: {obj.description || 'Sin descripción'}</h4>
              {obj.results.map((res, rIdx) => (
                <div key={res.id} className={styles.actResContainer}>
                  <h5 className={styles.actResTitle}>Resultado {oIdx + 1}.{rIdx + 1}: {res.description || 'Sin descripción'}</h5>
                  {res.activities.map((act, aIdx) => (
                    <div key={act.id} className={styles.actCard}>
                      <div className={styles.actHeader}>
                        <span>Actividad {oIdx + 1}.{rIdx + 1}.{aIdx + 1}</span>
                        <button className={styles.iconBtn} onClick={() => removeAct(oIdx, rIdx, aIdx)}><Trash2 size={14}/></button>
                      </div>
                      <input className={styles.input} placeholder="Descripción de la actividad" value={act.description} onChange={e => handleActChange(oIdx, rIdx, aIdx, 'description', e.target.value)} />
                    </div>
                  ))}
                  <button className={styles.addBtn} onClick={() => addAct(oIdx, rIdx)}><Plus size={16}/> Añadir Actividad</button>
                </div>
              ))}
            </div>
          ))}
        </div>
      )}

      {step === 4 && (
        <ResultPanel title="Matriz de Marco Lógico" copyText={copyText}>
          <div className={styles.tableWrapper}>
            <table className={styles.matrixTable}>
              <thead>
                <tr>
                  <th>Nivel</th>
                  <th>Resumen Narrativo</th>
                  <th>Indicadores</th>
                  <th>Medios de Verificación</th>
                  <th>Supuestos</th>
                </tr>
              </thead>
              <tbody>
                <tr className={styles.rowFin}>
                  <td className={styles.levelCell}>FIN</td>
                  <td>{ml.finDescription}</td>
                  <td>{ml.finIndicator}</td>
                  <td>{ml.finSource}</td>
                  <td>{ml.finAssumption}</td>
                </tr>
                <tr className={styles.rowProposito}>
                  <td className={styles.levelCell}>PROPÓSITO</td>
                  <td>{ml.propositoDescription}</td>
                  <td>{ml.propositoIndicator}</td>
                  <td>{ml.propositoSource}</td>
                  <td>{ml.propositoAssumption}</td>
                </tr>
                {ml.objectives.map((obj, oIdx) => (
                  <React.Fragment key={obj.id}>
                    <tr className={styles.rowObj}>
                      <td className={styles.levelCell}>OBJETIVO {oIdx + 1}</td>
                      <td>{obj.description}</td>
                      <td>{obj.indicator}</td>
                      <td>{obj.source}</td>
                      <td>{obj.assumption}</td>
                    </tr>
                    {obj.results.map((res, rIdx) => (
                      <React.Fragment key={res.id}>
                        <tr className={styles.rowRes}>
                          <td className={styles.levelCell}>RESULTADO {oIdx + 1}.{rIdx + 1}</td>
                          <td>{res.description}</td>
                          <td>{res.indicator}</td>
                          <td>{res.source}</td>
                          <td>{res.assumption}</td>
                        </tr>
                        {res.activities.map((act, aIdx) => (
                          <tr key={act.id} className={styles.rowAct}>
                            <td className={styles.levelCell}>ACTIVIDAD {oIdx + 1}.{rIdx + 1}.{aIdx + 1}</td>
                            <td>{act.description}</td>
                            <td>{act.resources}</td>
                            <td>{act.cost}</td>
                            <td>{act.assumption}</td>
                          </tr>
                        ))}
                      </React.Fragment>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </ResultPanel>
      )}

      <div className={styles.nav}>
        {step > 1 ? (
          <button className={styles.btnSecondary} onClick={prevStep}><ArrowLeft size={16}/> Anterior</button>
        ) : <div />}
        {step < 4 ? (
          <button className={styles.btnPrimary} onClick={nextStep}>{step === 3 ? 'Ver Matriz' : 'Siguiente'} <ArrowRight size={16}/></button>
        ) : (
          <div style={{ display: 'flex', gap: '1rem' }}>
            <button className={styles.btnSecondary} onClick={() => setStep(1)}>Editar Formulario</button>
            {projectId && (
              <button 
                className={styles.btnPrimary} 
                onClick={async () => {
                  setIsSaving(true);
                  try {
                    await saveToolData(projectId, 'marco-logico', ml as unknown as any);
                    alert('Guardado con éxito');
                  } catch (error) {
                    console.error(error);
                    alert('Error al guardar');
                  } finally {
                    setIsSaving(false);
                  }
                }}
                disabled={isSaving}
              >
                {isSaving ? 'Guardando...' : '💾 Guardar en Proyecto'}
              </button>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
