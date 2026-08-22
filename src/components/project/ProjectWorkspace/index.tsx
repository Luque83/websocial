'use client';

import React, { useState, useMemo, useEffect } from 'react';
import Link from 'next/link';
import { 
  ArrowLeft, 
  Save, 
  CheckCircle2, 
  FileText, 
  Target, 
  Users, 
  Calculator, 
  Calendar, 
  Sparkles, 
  Plus, 
  Trash2, 
  Printer, 
  Copy, 
  Check, 
  AlertCircle, 
  Info,
  TrendingUp
} from 'lucide-react';
import { saveProjectWorkspaceAction, type ProjectWorkspaceData } from '@/app/actions/projectWorkspace';
import styles from './ProjectWorkspace.module.css';

interface ProjectWorkspaceProps {
  projectId: string;
  initialProject: {
    id: string;
    name: string;
    description: string;
    created_at: string;
    updated_at: string;
  };
  initialToolsData: Record<string, unknown>;
  generalMatrix?: unknown;
}

export function ProjectWorkspace({
  projectId,
  initialProject,
  initialToolsData,
}: ProjectWorkspaceProps) {
  // 1. INITIALIZE CONSOLIDATED STATE
  const [activeTab, setActiveTab] = useState<'diagnostico' | 'marcoLogico' | 'personal' | 'presupuesto' | 'cronograma' | 'memoria'>('diagnostico');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [copied, setCopied] = useState(false);

  // Restore existing workspace data or fallback to tool-specific data or sensible defaults
  const fullWorkspace = (initialToolsData['project-workspace-full'] as ProjectWorkspaceData) || null;
  const initialML = (initialToolsData['marco-logico'] as ProjectWorkspaceData['marcoLogico']) || null;
  const initialCostes = (initialToolsData['costes-proyecto'] as ProjectWorkspaceData['presupuesto']) || null;
  const initialCron = (initialToolsData['cronograma'] || initialToolsData['cronograma-actividades']) as ProjectWorkspaceData['cronograma'] || null;
  const initialInd = (initialToolsData['indicadores-impacto'] as { indicadores: ProjectWorkspaceData['indicadores'] }) || null;
  const initialPers = (initialToolsData['personal-proyecto'] as { workers: ProjectWorkspaceData['personal'] }) || null;

  // 1.1 Diagnóstico
  const [diagnostico, setDiagnostico] = useState(() => fullWorkspace?.diagnostico || {
    projectName: initialProject.name || '',
    organization: 'Entidad del Tercer Sector',
    callName: 'Convocatoria General 2026',
    targetPopulation: 'Personas en situación de vulnerabilidad social',
    beneficiariesDirect: 50,
    beneficiariesIndirect: 150,
    location: 'Ámbito Local / Autonómico',
    justification: initialProject.description || '',
    diagnosticText: 'Se detecta una necesidad urgente de intervención integral para favorecer la inserción sociolaboral y la autonomía de las personas usuarias.',
  });

  // 1.2 Marco Lógico
  const [marcoLogico, setMarcoLogico] = useState<ProjectWorkspaceData['marcoLogico']>(() => fullWorkspace?.marcoLogico || initialML || {
    fin: 'Mejorar la cohesión social y la calidad de vida de los colectivos vulnerables.',
    proposito: 'Fomentar la empleabilidad y la inclusión social activa de las personas participantes.',
    objectives: [
      {
        id: 'obj-1',
        description: 'Desarrollar itinerarios integrados de orientación y capacitación laboral.',
        indicators: '80% de participantes completan su itinerario formativo',
        sources: 'Partes de asistencia y certificados de aprovechamiento',
        assumptions: 'Compromiso de asistencia y disponibilidad de aulas',
        results: [
          {
            id: 'res-1-1',
            description: '50 personas han recibido orientación laboral individualizada.',
            indicators: '50 diagnósticos de empleabilidad realizados',
            sources: 'Fichas de seguimiento técnico',
            assumptions: 'Derivación adecuada de servicios sociales',
            activities: [
              { id: 'act-1-1-1', description: 'Entrevistas de diagnóstico inicial y diseño del plan de acción', responsible: 'Trabajador/a Social' },
              { id: 'act-1-1-2', description: 'Talleres grupales de competencias digitales y búsqueda activa', responsible: 'Educador/a' },
            ]
          }
        ]
      }
    ]
  });

  // 1.3 Indicadores
  const [indicadores, setIndicadores] = useState<ProjectWorkspaceData['indicadores']>(() => fullWorkspace?.indicadores || initialInd?.indicadores || [
    { id: 'ind-1', name: 'Personas atendidas con itinerario', unit: 'personas', baseline: 0, target: 50, current: 35, source: 'Registro de usuarios' },
    { id: 'ind-2', name: 'Inserciones laborales conseguidas', unit: 'contratos', baseline: 0, target: 20, current: 12, source: 'Contratos laborales firmados' },
  ]);

  // 1.4 Personal
  const [personal, setPersonal] = useState<ProjectWorkspaceData['personal']>(() => fullWorkspace?.personal || initialPers?.workers || [
    {
      id: 'pers-1',
      name: 'Elena Gómez',
      role: 'Trabajadora Social / Coordinadora',
      contractType: 'Indefinido',
      monthlySalary: 2100,
      ssPct: 31.4,
      weeklyHours: 20,
      maxWeeklyHours: 37.5,
      months: 12,
    },
    {
      id: 'pers-2',
      name: 'Carlos Ruiz',
      role: 'Educador Social',
      contractType: 'Temporal',
      monthlySalary: 1850,
      ssPct: 31.4,
      weeklyHours: 18.75,
      maxWeeklyHours: 37.5,
      months: 10,
    }
  ]);

  // 1.5 Presupuesto
  const [presupuesto, setPresupuesto] = useState<ProjectWorkspaceData['presupuesto']>(() => fullWorkspace?.presupuesto || initialCostes || {
    partidas: [
      { id: 'p-1', category: 'personal', description: 'Elena Gómez (Trabajadora Social - 20h/sem)', monthlyAmount: 1471.68, months: 12, costeReal: 1471.68 * 12, workerId: 'pers-1' },
      { id: 'p-2', category: 'personal', description: 'Carlos Ruiz (Educador Social - 18.75h/sem)', monthlyAmount: 1215.45, months: 10, costeReal: 1215.45 * 10, workerId: 'pers-2' },
      { id: 'p-3', category: 'actividades', description: 'Material didáctico y licencias formativas', monthlyAmount: 250, months: 10, costeReal: 2400 },
      { id: 'p-4', category: 'suministros', description: 'Alquiler de aulas y suministros de sede', monthlyAmount: 400, months: 12, costeReal: 4800 },
    ],
    indirectPct: 8,
    grantAmount: 40000,
  });

  // 1.6 Cronograma
  const [cronograma, setCronograma] = useState<ProjectWorkspaceData['cronograma']>(() => fullWorkspace?.cronograma || initialCron || {
    durationMonths: 12,
    activities: [
      { id: 'c-1', description: 'Entrevistas de diagnóstico inicial y diseño del plan de acción', responsible: 'Trabajador/a Social', startMonth: 1, endMonth: 4 },
      { id: 'c-2', description: 'Talleres grupales de competencias digitales y búsqueda activa', responsible: 'Educador/a', startMonth: 3, endMonth: 10 },
      { id: 'c-3', description: 'Seguimiento, evaluación intermedia y prospección de empleo', responsible: 'Coordinación', startMonth: 4, endMonth: 11 },
      { id: 'c-4', description: 'Evaluación final y redacción de memoria justificativa', responsible: 'Equipo Técnico', startMonth: 11, endMonth: 12 },
    ]
  });

  // Track user modifications
  const handleModify = () => {
    setHasChanges(true);
  };

  // 2. REACTIVE SYNC: Sync Personal to Budget
  const syncPersonalToBudget = () => {
    const newPersonalPartidas = personal.map(worker => {
      const costeEmpresaMes = worker.monthlySalary * (1 + worker.ssPct / 100);
      const pct = worker.maxWeeklyHours > 0 ? (worker.weeklyHours / worker.maxWeeklyHours) : 1;
      const costeMesImputado = Number((costeEmpresaMes * pct).toFixed(2));
      return {
        id: `p-${worker.id}`,
        category: 'personal',
        description: `${worker.name} (${worker.role} - ${worker.weeklyHours}h/sem)`,
        monthlyAmount: costeMesImputado,
        months: worker.months || 12,
        costeReal: Number((costeMesImputado * (worker.months || 12)).toFixed(2)),
        workerId: worker.id
      };
    });

    const otherPartidas = presupuesto.partidas.filter(p => p.category !== 'personal');
    setPresupuesto(prev => ({
      ...prev,
      partidas: [...newPersonalPartidas, ...otherPartidas]
    }));
    setHasChanges(true);
  };

  // 3. REACTIVE SYNC: Sync Marco Lógico Activities to Cronograma
  const syncMLToCronograma = () => {
    const mlActivities: Array<{ id: string; description: string; responsible: string; startMonth: number; endMonth: number }> = [];
    
    marcoLogico.objectives.forEach(obj => {
      obj.results.forEach(res => {
        res.activities.forEach(act => {
          if (act.description.trim()) {
            mlActivities.push({
              id: `c-${act.id}`,
              description: act.description,
              responsible: act.responsible || 'Equipo Técnico',
              startMonth: 1,
              endMonth: cronograma.durationMonths || 12
            });
          }
        });
      });
    });

    if (mlActivities.length > 0) {
      setCronograma(prev => ({
        ...prev,
        activities: mlActivities
      }));
      setHasChanges(true);
    }
  };

  // 4. FINANCIAL CALCULATIONS
  const directCost = useMemo(() => {
    return presupuesto.partidas.reduce((acc, p) => acc + (p.monthlyAmount * p.months), 0);
  }, [presupuesto.partidas]);

  const directRealCost = useMemo(() => {
    return presupuesto.partidas.reduce((acc, p) => acc + (p.costeReal !== undefined ? p.costeReal : (p.monthlyAmount * p.months)), 0);
  }, [presupuesto.partidas]);

  const indirectCost = useMemo(() => {
    return directCost * (presupuesto.indirectPct / 100);
  }, [directCost, presupuesto.indirectPct]);

  const indirectRealCost = useMemo(() => {
    return directRealCost * (presupuesto.indirectPct / 100);
  }, [directRealCost, presupuesto.indirectPct]);

  const totalPresupuesto = directCost + indirectCost;
  const totalEjecutadoReal = directRealCost + indirectRealCost;
  const saldoDisponible = (presupuesto.grantAmount || totalPresupuesto) - totalEjecutadoReal;

  // 5. UNIFIED SAVE HANDLER
  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const fullData: ProjectWorkspaceData = {
        diagnostico,
        marcoLogico,
        indicadores,
        personal,
        presupuesto,
        cronograma,
      };

      const result = await saveProjectWorkspaceAction(projectId, fullData);
      if (result.success) {
        setLastSaved(new Date().toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit', second: '2-digit' }));
        setHasChanges(false);
      }
    } catch (err) {
      console.error('Error al guardar el expediente del proyecto:', err);
      alert('Error al guardar los datos del proyecto. Por favor, revisa tu conexión.');
    } finally {
      setIsSaving(false);
    }
  };

  // Copy Memoria to Clipboard
  const handleCopyMemoria = () => {
    const el = document.getElementById('memoria-content');
    if (el) {
      navigator.clipboard.writeText(el.innerText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  };

  // Export Budget to Official CSV
  const exportBudgetToCsv = () => {
    const rows = [
      ['CATEGORIA', 'CONCEPTO', 'IMPORTE_MENSUAL', 'MESES', 'PRESUPUESTADO', 'GASTO_REAL', 'DESVIACION'],
      ...presupuesto.partidas.map(p => {
        const pres = p.monthlyAmount * p.months;
        const real = p.costeReal !== undefined ? p.costeReal : pres;
        return [p.category, `"${p.description.replace(/"/g, '""')}"`, p.monthlyAmount, p.months, pres, real, real - pres];
      }),
      ['SUBTOTAL DIRECTOS', '', '', '', directCost, directRealCost, directRealCost - directCost],
      [`INDIRECTOS (${presupuesto.indirectPct}%)`, '', '', '', indirectCost, indirectRealCost, indirectRealCost - indirectCost],
      ['TOTAL PROYECTO', '', '', '', totalPresupuesto, totalEjecutadoReal, totalEjecutadoReal - totalPresupuesto]
    ];
    const csvContent = 'data:text/csv;charset=utf-8,\uFEFF' + rows.map(e => e.join(';')).join('\n');
    const encodedUri = encodeURI(csvContent);
    const link = document.createElement('a');
    link.setAttribute('href', encodedUri);
    link.setAttribute('download', `anexo-economico-${diagnostico.projectName.toLowerCase().replace(/\s+/g, '-') || 'proyecto'}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const formatCurrency = (val: number) => {
    return new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(val);
  };

  return (
    <div className={styles.workspace}>
      {/* 1. TOP STICKY BAR */}
      <header className={styles.topBar}>
        <div className={styles.titleArea}>
          <Link href="/dashboard" className={styles.backBtn}>
            <ArrowLeft size={16} /> Volver a Proyectos
          </Link>
          <div>
            <h1 className={styles.projectTitle}>{diagnostico.projectName || 'Expediente de Proyecto'}</h1>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              {diagnostico.callName} · {diagnostico.organization}
            </span>
          </div>
        </div>

        <div className={styles.saveArea}>
          {hasChanges && (
            <span style={{ color: '#d97706', fontSize: '0.8125rem', fontWeight: 600, display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
              <AlertCircle size={14} /> Cambios sin guardar
            </span>
          )}
          {lastSaved && !hasChanges && (
            <span className={styles.saveStatus}>
              <CheckCircle2 size={14} color="#16a34a" /> Guardado a las {lastSaved}
            </span>
          )}
          <button
            type="button"
            onClick={handleSaveAll}
            disabled={isSaving}
            className={styles.saveBtn}
          >
            <Save size={16} />
            {isSaving ? 'Guardando Expediente...' : 'Guardar Todo el Proyecto'}
          </button>
        </div>
      </header>

      {/* 2. TABS NAVIGATION */}
      <nav className={styles.tabNav}>
        <button
          type="button"
          onClick={() => setActiveTab('diagnostico')}
          className={`${styles.tabBtn} ${activeTab === 'diagnostico' ? styles.tabActive : ''}`}
        >
          <FileText size={16} />
          <span>1. Diagnóstico</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('marcoLogico')}
          className={`${styles.tabBtn} ${activeTab === 'marcoLogico' ? styles.tabActive : ''}`}
        >
          <Target size={16} />
          <span>2. Marco Lógico</span>
          <span className={styles.tabBadge}>{marcoLogico.objectives.length} obj</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('personal')}
          className={`${styles.tabBtn} ${activeTab === 'personal' ? styles.tabActive : ''}`}
        >
          <Users size={16} />
          <span>3. Equipo / Personal</span>
          <span className={styles.tabBadge}>{personal.length}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('presupuesto')}
          className={`${styles.tabBtn} ${activeTab === 'presupuesto' ? styles.tabActive : ''}`}
        >
          <Calculator size={16} />
          <span>4. Presupuesto</span>
          <span className={styles.tabBadge}>{formatCurrency(totalPresupuesto)}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('cronograma')}
          className={`${styles.tabBtn} ${activeTab === 'cronograma' ? styles.tabActive : ''}`}
        >
          <Calendar size={16} />
          <span>5. Cronograma Gantt</span>
          <span className={styles.tabBadge}>{cronograma.activities.length} act</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('memoria')}
          className={`${styles.tabBtn} ${activeTab === 'memoria' ? styles.tabActive : ''}`}
        >
          <Sparkles size={16} color="#7c3aed" />
          <span style={{ color: activeTab === 'memoria' ? '#7c3aed' : 'inherit', fontWeight: 800 }}>
            6. Memoria Técnica
          </span>
        </button>
      </nav>

      {/* 3. TABS CONTENT */}

      {/* TAB 1: DIAGNÓSTICO Y JUSTIFICACIÓN */}
      {activeTab === 'diagnostico' && (
        <div className={styles.contentCard}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}><FileText size={20} color="#2563eb" /> 1. Diagnóstico de la Realidad y Datos Generales</h2>
              <p className={styles.sectionSubtitle}>Define los datos base de la convocatoria, la entidad y la justificación técnica que sustentará la propuesta.</p>
            </div>
          </div>

          <div className={styles.formGrid2}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Título del Proyecto</label>
              <input
                type="text"
                className={styles.input}
                value={diagnostico.projectName}
                onChange={e => { setDiagnostico({ ...diagnostico, projectName: e.target.value }); handleModify(); }}
                placeholder="Ej. Programa de Inserción Sociolaboral Juventud Activa 2026"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Entidad Solicitante / ONG</label>
              <input
                type="text"
                className={styles.input}
                value={diagnostico.organization}
                onChange={e => { setDiagnostico({ ...diagnostico, organization: e.target.value }); handleModify(); }}
                placeholder="Nombre de la Asociación o Fundación"
              />
            </div>
          </div>

          <div className={styles.formGrid3}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Convocatoria / Organismo Financiador</label>
              <input
                type="text"
                className={styles.input}
                value={diagnostico.callName}
                onChange={e => { setDiagnostico({ ...diagnostico, callName: e.target.value }); handleModify(); }}
                placeholder="Ej. Subvenciones IRPF 2026 / Consejería de Igualdad"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Beneficiarios Directos (nº personas)</label>
              <input
                type="number"
                className={styles.input}
                value={diagnostico.beneficiariesDirect}
                onChange={e => { setDiagnostico({ ...diagnostico, beneficiariesDirect: parseInt(e.target.value) || 0 }); handleModify(); }}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Ámbito Territorial / Ubicación</label>
              <input
                type="text"
                className={styles.input}
                value={diagnostico.location}
                onChange={e => { setDiagnostico({ ...diagnostico, location: e.target.value }); handleModify(); }}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Diagnóstico de Necesidades</label>
            <textarea
              className={styles.textarea}
              rows={4}
              value={diagnostico.diagnosticText}
              onChange={e => { setDiagnostico({ ...diagnostico, diagnosticText: e.target.value }); handleModify(); }}
              placeholder="Explica las problemáticas sociales identificadas y las fuentes estadísticas utilizadas..."
            />
            <span className={styles.hint}>Este texto se integrará automáticamente en el Capítulo 2 de la Memoria Técnica.</span>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Justificación Técnica del Proyecto</label>
            <textarea
              className={styles.textarea}
              rows={4}
              value={diagnostico.justification}
              onChange={e => { setDiagnostico({ ...diagnostico, justification: e.target.value }); handleModify(); }}
              placeholder="Por qué esta intervención es la adecuada para responder al diagnóstico..."
            />
          </div>
        </div>
      )}

      {/* TAB 2: MARCO LÓGICO E INDICADORES */}
      {activeTab === 'marcoLogico' && (
        <div className={styles.contentCard}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}><Target size={20} color="#2563eb" /> 2. Matriz de Marco Lógico y Objetivos</h2>
              <p className={styles.sectionSubtitle}>Estructura verticalmente el impacto, propósito, objetivos específicos, resultados y actividades del proyecto.</p>
            </div>
            <button
              type="button"
              onClick={syncMLToCronograma}
              className={styles.exportBtn}
              title="Vuelca las actividades directamente a la pestaña de Cronograma"
            >
              🔄 Sincronizar con Cronograma
            </button>
          </div>

          <div className={styles.syncNotice}>
            <Info size={18} />
            <span>Las actividades que formules en este marco lógico se vincularán directamente al Cronograma Gantt y a la Memoria Técnica.</span>
          </div>

          <div className={styles.formGrid2}>
            <div className={styles.formGroup}>
              <label className={styles.label}>FIN (Impacto Superior a largo plazo)</label>
              <textarea
                className={styles.textarea}
                rows={2}
                value={marcoLogico.fin}
                onChange={e => { setMarcoLogico({ ...marcoLogico, fin: e.target.value }); handleModify(); }}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>PROPÓSITO (Objetivo General del Proyecto)</label>
              <textarea
                className={styles.textarea}
                rows={2}
                value={marcoLogico.proposito}
                onChange={e => { setMarcoLogico({ ...marcoLogico, proposito: e.target.value }); handleModify(); }}
              />
            </div>
          </div>

          <h3 style={{ fontSize: '1.0625rem', fontWeight: 700, color: 'var(--text-primary)', margin: '1.5rem 0 1rem' }}>
            Objetivos Específicos, Resultados y Actividades
          </h3>

          {marcoLogico.objectives.map((obj, oIdx) => (
            <div key={obj.id} className={styles.objBlock}>
              <div className={styles.objHeader}>
                <span>🎯 Objetivo Específico {oIdx + 1}</span>
                <button
                  type="button"
                  onClick={() => {
                    const newObjs = marcoLogico.objectives.filter(o => o.id !== obj.id);
                    setMarcoLogico({ ...marcoLogico, objectives: newObjs });
                    handleModify();
                  }}
                  className={styles.deleteIconBtn}
                >
                  <Trash2 size={16} />
                </button>
              </div>

              <div className={styles.formGroup}>
                <input
                  type="text"
                  className={styles.input}
                  value={obj.description}
                  onChange={e => {
                    const newObjs = [...marcoLogico.objectives];
                    newObjs[oIdx].description = e.target.value;
                    setMarcoLogico({ ...marcoLogico, objectives: newObjs });
                    handleModify();
                  }}
                  placeholder="Descripción del objetivo específico..."
                />
              </div>

              {/* Resultados */}
              {obj.results.map((res, rIdx) => (
                <div key={res.id} className={styles.resBlock}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#334155' }}>
                      📦 Resultado Esperado {oIdx + 1}.{rIdx + 1}
                    </span>
                    <button
                      type="button"
                      onClick={() => {
                        const newObjs = [...marcoLogico.objectives];
                        newObjs[oIdx].results = newObjs[oIdx].results.filter(r => r.id !== res.id);
                        setMarcoLogico({ ...marcoLogico, objectives: newObjs });
                        handleModify();
                      }}
                      className={styles.deleteIconBtn}
                    >
                      <Trash2 size={14} />
                    </button>
                  </div>
                  <input
                    type="text"
                    className={styles.input}
                    value={res.description}
                    onChange={e => {
                      const newObjs = [...marcoLogico.objectives];
                      newObjs[oIdx].results[rIdx].description = e.target.value;
                      setMarcoLogico({ ...marcoLogico, objectives: newObjs });
                      handleModify();
                    }}
                    placeholder="Resultado medible..."
                  />

                  {/* Actividades asociadas */}
                  <div style={{ marginTop: '0.75rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Actividades del Resultado:
                    </span>
                    {res.activities.map((act, aIdx) => (
                      <div key={act.id} className={styles.actBlock}>
                        <input
                          type="text"
                          className={styles.input}
                          value={act.description}
                          onChange={e => {
                            const newObjs = [...marcoLogico.objectives];
                            newObjs[oIdx].results[rIdx].activities[aIdx].description = e.target.value;
                            setMarcoLogico({ ...marcoLogico, objectives: newObjs });
                            handleModify();
                          }}
                          placeholder="Nombre de la actividad..."
                        />
                        <input
                          type="text"
                          className={styles.input}
                          value={act.responsible}
                          onChange={e => {
                            const newObjs = [...marcoLogico.objectives];
                            newObjs[oIdx].results[rIdx].activities[aIdx].responsible = e.target.value;
                            setMarcoLogico({ ...marcoLogico, objectives: newObjs });
                            handleModify();
                          }}
                          placeholder="Perfil responsable..."
                        />
                        <button
                          type="button"
                          onClick={() => {
                            const newObjs = [...marcoLogico.objectives];
                            newObjs[oIdx].results[rIdx].activities = newObjs[oIdx].results[rIdx].activities.filter(a => a.id !== act.id);
                            setMarcoLogico({ ...marcoLogico, objectives: newObjs });
                            handleModify();
                          }}
                          className={styles.deleteIconBtn}
                        >
                          <Trash2 size={14} />
                        </button>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const newObjs = [...marcoLogico.objectives];
                        newObjs[oIdx].results[rIdx].activities.push({
                          id: `act-${Date.now()}`,
                          description: '',
                          responsible: 'Equipo Técnico'
                        });
                        setMarcoLogico({ ...marcoLogico, objectives: newObjs });
                        handleModify();
                      }}
                      className={styles.addSmallBtn}
                    >
                      <Plus size={14} /> Añadir Actividad
                    </button>
                  </div>
                </div>
              ))}

              <button
                type="button"
                onClick={() => {
                  const newObjs = [...marcoLogico.objectives];
                  newObjs[oIdx].results.push({
                    id: `res-${Date.now()}`,
                    description: '',
                    indicators: '',
                    sources: '',
                    assumptions: '',
                    activities: []
                  });
                  setMarcoLogico({ ...marcoLogico, objectives: newObjs });
                  handleModify();
                }}
                className={styles.addSmallBtn}
                style={{ marginTop: '0.75rem' }}
              >
                <Plus size={14} /> Añadir Resultado al Objetivo
              </button>
            </div>
          ))}

          <button
            type="button"
            onClick={() => {
              setMarcoLogico({
                ...marcoLogico,
                objectives: [
                  ...marcoLogico.objectives,
                  {
                    id: `obj-${Date.now()}`,
                    description: '',
                    indicators: '',
                    sources: '',
                    assumptions: '',
                    results: []
                  }
                ]
              });
              handleModify();
            }}
            className={styles.saveBtn}
            style={{ marginTop: '1rem' }}
          >
            <Plus size={16} /> Añadir Nuevo Objetivo Específico
          </button>
        </div>
      )}

      {/* TAB 3: EQUIPO Y PERSONAL IMPUTADO */}
      {activeTab === 'personal' && (
        <div className={styles.contentCard}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}><Users size={20} color="#2563eb" /> 3. Equipo Técnico y Personal Imputado al Proyecto</h2>
              <p className={styles.sectionSubtitle}>Asigna trabajadores a este proyecto, define sus horas semanales y meses de vinculación.</p>
            </div>
            <button
              type="button"
              onClick={syncPersonalToBudget}
              className={styles.exportBtn}
              title="Vuelca las partidas de personal calculadas directamente al Presupuesto"
            >
              🔄 Trasladar al Presupuesto
            </button>
          </div>

          <div className={styles.syncNotice}>
            <Info size={18} />
            <span>Al pulsar <strong>&ldquo;Trasladar al Presupuesto&rdquo;</strong>, el coste empresa mensual y anual de cada trabajador se convertirá automáticamente en partidas presupuestarias oficiales.</span>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nombre del Trabajador/a</th>
                  <th>Categoría / Función</th>
                  <th>Bruto / Mes</th>
                  <th>SS Patronal (%)</th>
                  <th>Horas/sem</th>
                  <th>Meses</th>
                  <th className={styles.numCol}>Coste Imputado / Mes</th>
                  <th className={styles.numCol}>Total Imputado</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {personal.map((worker, idx) => {
                  const costeEmpresaMes = worker.monthlySalary * (1 + worker.ssPct / 100);
                  const pct = worker.maxWeeklyHours > 0 ? (worker.weeklyHours / worker.maxWeeklyHours) : 1;
                  const costeMesImputado = costeEmpresaMes * pct;
                  const costeTotal = costeMesImputado * (worker.months || 12);

                  return (
                    <tr key={worker.id}>
                      <td>
                        <input
                          type="text"
                          className={styles.input}
                          value={worker.name}
                          onChange={e => {
                            const newP = [...personal];
                            newP[idx].name = e.target.value;
                            setPersonal(newP);
                            handleModify();
                          }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          className={styles.input}
                          value={worker.role}
                          onChange={e => {
                            const newP = [...personal];
                            newP[idx].role = e.target.value;
                            setPersonal(newP);
                            handleModify();
                          }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className={styles.input}
                          style={{ width: '90px' }}
                          value={worker.monthlySalary}
                          onChange={e => {
                            const newP = [...personal];
                            newP[idx].monthlySalary = parseFloat(e.target.value) || 0;
                            setPersonal(newP);
                            handleModify();
                          }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className={styles.input}
                          style={{ width: '70px' }}
                          value={worker.ssPct}
                          onChange={e => {
                            const newP = [...personal];
                            newP[idx].ssPct = parseFloat(e.target.value) || 0;
                            setPersonal(newP);
                            handleModify();
                          }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className={styles.input}
                          style={{ width: '75px' }}
                          value={worker.weeklyHours}
                          onChange={e => {
                            const newP = [...personal];
                            newP[idx].weeklyHours = parseFloat(e.target.value) || 0;
                            setPersonal(newP);
                            handleModify();
                          }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className={styles.input}
                          style={{ width: '65px' }}
                          value={worker.months}
                          onChange={e => {
                            const newP = [...personal];
                            newP[idx].months = parseInt(e.target.value) || 0;
                            setPersonal(newP);
                            handleModify();
                          }}
                        />
                      </td>
                      <td className={styles.numCol}>
                        <strong>{formatCurrency(costeMesImputado)}</strong>
                      </td>
                      <td className={styles.numCol} style={{ color: '#1e3a8a', fontWeight: 800 }}>
                        {formatCurrency(costeTotal)}
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => {
                            setPersonal(personal.filter(p => p.id !== worker.id));
                            handleModify();
                          }}
                          className={styles.deleteIconBtn}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={() => {
              setPersonal([
                ...personal,
                {
                  id: `pers-${Date.now()}`,
                  name: '',
                  role: 'Técnico de Proyecto',
                  contractType: 'Temporal',
                  monthlySalary: 1800,
                  ssPct: 31.4,
                  weeklyHours: 37.5,
                  maxWeeklyHours: 37.5,
                  months: 12,
                }
              ]);
              handleModify();
            }}
            className={styles.addSmallBtn}
          >
            <Plus size={16} /> Añadir Trabajador/a al Proyecto
          </button>
        </div>
      )}
      {/* TAB 4: PRESUPUESTO Y SEGUIMIENTO DE GASTOS */}
      {activeTab === 'presupuesto' && (
        <div className={styles.contentCard}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}><Calculator size={20} color="#2563eb" /> 4. Presupuesto, Partidas y Seguimiento Real</h2>
              <p className={styles.sectionSubtitle}>Gestiona el presupuesto concedido y compara las partidas presupuestadas frente al gasto real ejecutado.</p>
            </div>
            <button
              type="button"
              onClick={exportBudgetToCsv}
              className={styles.exportBtn}
              title="Descarga el anexo económico en formato CSV compatible con Excel"
            >
              📥 Exportar Anexo CSV (Excel)
            </button>
          </div>

          {/* Resumen Financiero */}
          <div className={styles.kpiGrid}>
            <div className={`${styles.kpiCard} ${styles.kpiHighlight}`}>
              <span className={styles.kpiLabel}>Total Proyecto Presupuestado</span>
              <span className={styles.kpiValue}>{formatCurrency(totalPresupuesto)}</span>
            </div>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Subvención Solicitada / Concedida</span>
              <span className={styles.kpiValue}>{formatCurrency(presupuesto.grantAmount)}</span>
            </div>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Gasto Real Ejecutado</span>
              <span className={styles.kpiValue} style={{ color: totalEjecutadoReal > totalPresupuesto ? '#dc2626' : '#16a34a' }}>
                {formatCurrency(totalEjecutadoReal)}
              </span>
            </div>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Saldo Disponible</span>
              <span className={styles.kpiValue} style={{ color: saldoDisponible < 0 ? '#dc2626' : '#2563eb' }}>
                {formatCurrency(saldoDisponible)}
              </span>
            </div>
          </div>

          {/* Costes Indirectos Slider */}
          <div style={{ background: '#f8fafc', padding: '1rem 1.25rem', borderRadius: '10px', marginBottom: '1.5rem', border: '1px solid var(--border-subtle)' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '0.5rem' }}>
              <label className={styles.label}>Costes Indirectos / Estructura: <strong>{presupuesto.indirectPct}%</strong> ({formatCurrency(indirectCost)})</label>
            </div>
            <input
              type="range"
              min="0"
              max="20"
              step="0.5"
              style={{ width: '100%', accentColor: '#2563eb' }}
              value={presupuesto.indirectPct}
              onChange={e => { setPresupuesto({ ...presupuesto, indirectPct: parseFloat(e.target.value) || 0 }); handleModify(); }}
            />
          </div>

          {/* Tabla de Partidas */}
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Categoría</th>
                  <th>Concepto / Partida de Gasto</th>
                  <th>Importe / Mes</th>
                  <th>Meses</th>
                  <th className={styles.numCol}>Presupuestado</th>
                  <th className={styles.numCol}>Gasto Real</th>
                  <th className={styles.numCol}>Desviación</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {presupuesto.partidas.map((partida, pIdx) => {
                  const presupuestado = partida.monthlyAmount * partida.months;
                  const real = partida.costeReal !== undefined ? partida.costeReal : presupuestado;
                  const desviacion = real - presupuestado;
                  const pctDev = presupuestado > 0 ? (desviacion / presupuestado) * 100 : 0;

                  return (
                    <tr key={partida.id}>
                      <td>
                        <select
                          className={styles.select}
                          value={partida.category}
                          onChange={e => {
                            const newP = [...presupuesto.partidas];
                            newP[pIdx].category = e.target.value;
                            setPresupuesto({ ...presupuesto, partidas: newP });
                            handleModify();
                          }}
                        >
                          <option value="personal">Personal</option>
                          <option value="actividades">Actividades / Talleres</option>
                          <option value="suministros">Suministros / Aulas</option>
                          <option value="dietas">Desplazamientos y Dietas</option>
                          <option value="otros">Otros Gastos Directos</option>
                        </select>
                      </td>
                      <td>
                        <input
                          type="text"
                          className={styles.input}
                          value={partida.description}
                          onChange={e => {
                            const newP = [...presupuesto.partidas];
                            newP[pIdx].description = e.target.value;
                            setPresupuesto({ ...presupuesto, partidas: newP });
                            handleModify();
                          }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className={styles.input}
                          style={{ width: '90px' }}
                          value={partida.monthlyAmount}
                          onChange={e => {
                            const newP = [...presupuesto.partidas];
                            newP[pIdx].monthlyAmount = parseFloat(e.target.value) || 0;
                            setPresupuesto({ ...presupuesto, partidas: newP });
                            handleModify();
                          }}
                        />
                      </td>
                      <td>
                        <input
                          type="number"
                          className={styles.input}
                          style={{ width: '65px' }}
                          value={partida.months}
                          onChange={e => {
                            const newP = [...presupuesto.partidas];
                            newP[pIdx].months = parseInt(e.target.value) || 0;
                            setPresupuesto({ ...presupuesto, partidas: newP });
                            handleModify();
                          }}
                        />
                      </td>
                      <td className={styles.numCol}>
                        <strong>{formatCurrency(presupuestado)}</strong>
                      </td>
                      <td>
                        <input
                          type="number"
                          className={styles.input}
                          style={{ width: '105px', textAlign: 'right' }}
                          value={real}
                          onChange={e => {
                            const newP = [...presupuesto.partidas];
                            newP[pIdx].costeReal = parseFloat(e.target.value) || 0;
                            setPresupuesto({ ...presupuesto, partidas: newP });
                            handleModify();
                          }}
                        />
                      </td>
                      <td className={styles.numCol} style={{ color: desviacion > 0 ? '#dc2626' : desviacion < 0 ? '#16a34a' : 'var(--text-muted)', fontWeight: 700 }}>
                        <div>{desviacion > 0 ? `+${formatCurrency(desviacion)}` : formatCurrency(desviacion)}</div>
                        {Math.abs(pctDev) > 10 && (
                          <span style={{ fontSize: '0.6875rem', color: '#92400e', background: '#fef3c7', padding: '1px 5px', borderRadius: '4px', display: 'inline-block', marginTop: '2px' }}>
                            ⚠️ {pctDev > 0 ? `+${pctDev.toFixed(0)}%` : `${pctDev.toFixed(0)}%`}
                          </span>
                        )}
                      </td>
                      <td>
                        <button
                          type="button"
                          onClick={() => {
                            setPresupuesto({
                              ...presupuesto,
                              partidas: presupuesto.partidas.filter(p => p.id !== partida.id)
                            });
                            handleModify();
                          }}
                          className={styles.deleteIconBtn}
                        >
                          <Trash2 size={16} />
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={() => {
              setPresupuesto({
                ...presupuesto,
                partidas: [
                  ...presupuesto.partidas,
                  {
                    id: `p-${Date.now()}`,
                    category: 'actividades',
                    description: '',
                    monthlyAmount: 0,
                    months: 1,
                    costeReal: 0
                  }
                ]
              });
              handleModify();
            }}
            className={styles.addSmallBtn}
          >
            <Plus size={16} /> Añadir Nueva Partida de Gasto
          </button>
        </div>
      )}

      {/* TAB 5: CRONOGRAMA GANTT */}
      {activeTab === 'cronograma' && (
        <div className={styles.contentCard}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}><Calendar size={20} color="#2563eb" /> 5. Cronograma de Ejecución Temporal (Diagrama Gantt)</h2>
              <p className={styles.sectionSubtitle}>Planifica cuándo se ejecutará cada actividad a lo largo de los {cronograma.durationMonths} meses del proyecto.</p>
            </div>
            <div style={{ display: 'flex', gap: '0.5rem', alignItems: 'center' }}>
              <label className={styles.label} style={{ marginBottom: 0 }}>Duración:</label>
              <select
                className={styles.select}
                style={{ width: '110px' }}
                value={cronograma.durationMonths}
                onChange={e => {
                  setCronograma({ ...cronograma, durationMonths: parseInt(e.target.value) || 12 });
                  handleModify();
                }}
              >
                <option value={6}>6 meses</option>
                <option value={9}>9 meses</option>
                <option value={12}>12 meses</option>
                <option value={18}>18 meses</option>
                <option value={24}>24 meses</option>
              </select>
            </div>
          </div>

          {/* Gantt Interactive Table */}
          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th style={{ minWidth: '240px' }}>Actividad</th>
                  <th style={{ minWidth: '140px' }}>Responsable</th>
                  {Array.from({ length: cronograma.durationMonths }, (_, i) => (
                    <th key={i} style={{ textAlign: 'center', width: '36px', minWidth: '36px', padding: '0.4rem 0.2rem' }}>
                      M{i + 1}
                    </th>
                  ))}
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {cronograma.activities.map((act, aIdx) => (
                  <tr key={act.id}>
                    <td>
                      <input
                        type="text"
                        className={styles.input}
                        value={act.description}
                        onChange={e => {
                          const newActs = [...cronograma.activities];
                          newActs[aIdx].description = e.target.value;
                          setCronograma({ ...cronograma, activities: newActs });
                          handleModify();
                        }}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className={styles.input}
                        value={act.responsible}
                        onChange={e => {
                          const newActs = [...cronograma.activities];
                          newActs[aIdx].responsible = e.target.value;
                          setCronograma({ ...cronograma, activities: newActs });
                          handleModify();
                        }}
                      />
                    </td>
                    {Array.from({ length: cronograma.durationMonths }, (_, mIdx) => {
                      const monthNum = mIdx + 1;
                      const isActive = monthNum >= act.startMonth && monthNum <= act.endMonth;
                      return (
                        <td
                          key={mIdx}
                          onClick={() => {
                            const newActs = [...cronograma.activities];
                            if (monthNum < act.startMonth) {
                              newActs[aIdx].startMonth = monthNum;
                            } else if (monthNum > act.endMonth) {
                              newActs[aIdx].endMonth = monthNum;
                            } else {
                              // toggle or shrink
                              if (monthNum === act.startMonth && monthNum < act.endMonth) {
                                newActs[aIdx].startMonth = monthNum + 1;
                              } else {
                                newActs[aIdx].endMonth = monthNum - 1;
                              }
                            }
                            setCronograma({ ...cronograma, activities: newActs });
                            handleModify();
                          }}
                          style={{
                            background: isActive ? '#2563eb' : 'transparent',
                            cursor: 'pointer',
                            textAlign: 'center',
                            color: isActive ? 'white' : 'transparent',
                            fontWeight: 700,
                            userSelect: 'none'
                          }}
                          title={`Click para alternar M${monthNum}`}
                        >
                          {isActive ? '✓' : ''}
                        </td>
                      );
                    })}
                    <td>
                      <button
                        type="button"
                        onClick={() => {
                          setCronograma({
                            ...cronograma,
                            activities: cronograma.activities.filter(a => a.id !== act.id)
                          });
                          handleModify();
                        }}
                        className={styles.deleteIconBtn}
                      >
                        <Trash2 size={16} />
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <button
            type="button"
            onClick={() => {
              setCronograma({
                ...cronograma,
                activities: [
                  ...cronograma.activities,
                  {
                    id: `c-${Date.now()}`,
                    description: '',
                    responsible: 'Equipo Técnico',
                    startMonth: 1,
                    endMonth: 3
                  }
                ]
              });
              handleModify();
            }}
            className={styles.addSmallBtn}
          >
            <Plus size={16} /> Añadir Actividad al Cronograma
          </button>
        </div>
      )}

      {/* TAB 6: MEMORIA TÉCNICA CONSOLIDADA (1-CLICK) */}
      {activeTab === 'memoria' && (
        <div className={styles.contentCard}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}><Sparkles size={20} color="#7c3aed" /> 6. Memoria Técnica Oficial del Proyecto</h2>
              <p className={styles.sectionSubtitle}>Documento técnico consolidado en tiempo real con todos los datos de las capas anteriores.</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem' }}>
              <button
                type="button"
                onClick={handleCopyMemoria}
                className={styles.exportBtn}
              >
                {copied ? <Check size={16} color="#16a34a" /> : <Copy size={16} />}
                {copied ? '¡Copiado!' : 'Copiar Texto'}
              </button>
              <button
                type="button"
                onClick={() => window.print()}
                className={styles.saveBtn}
              >
                <Printer size={16} /> Imprimir / Guardar PDF
              </button>
            </div>
          </div>

          {/* RENDERIZADO DEL DOCUMENTO MEMORIA */}
          <div id="memoria-content" className={styles.memoriaDoc}>
            <div className={styles.docHeader}>
              <h1 className={styles.docH1}>{diagnostico.projectName || 'Memoria de Proyecto Social'}</h1>
              <p style={{ margin: 0, fontSize: '1.125rem', color: '#475569', fontWeight: 600 }}>
                {diagnostico.organization} · {diagnostico.callName}
              </p>
              <p style={{ margin: '0.35rem 0 0', fontSize: '0.875rem', color: '#64748b' }}>
                Ámbito: {diagnostico.location} | Colectivo: {diagnostico.targetPopulation} ({diagnostico.beneficiariesDirect} beneficiarios directos)
              </p>
            </div>

            {/* Cap 1: Identificación y Justificación */}
            <div className={styles.docSection}>
              <h2 className={styles.docH2}>1. Justificación y Diagnóstico de Necesidades</h2>
              <div className={styles.docText}>
                <strong>1.1 Diagnóstico de la Realidad:</strong><br />
                {diagnostico.diagnosticText || 'No definido'}
              </div>
              <div className={styles.docText} style={{ marginTop: '0.75rem' }}>
                <strong>1.2 Justificación de la Intervención:</strong><br />
                {diagnostico.justification || 'No definida'}
              </div>
            </div>

            {/* Cap 2: Marco Lógico */}
            <div className={styles.docSection}>
              <h2 className={styles.docH2}>2. Objetivos, Resultados y Actividades</h2>
              <div className={styles.docText}>
                <strong>Fin (Impacto General):</strong> {marcoLogico.fin}<br />
                <strong>Propósito (Objetivo del Proyecto):</strong> {marcoLogico.proposito}
              </div>

              {marcoLogico.objectives.map((obj, i) => (
                <div key={obj.id} style={{ marginTop: '1rem', paddingLeft: '1rem', borderLeft: '3px solid #2563eb' }}>
                  <strong>Objetivo Específico {i + 1}:</strong> {obj.description}
                  {obj.results.map((res, rI) => (
                    <div key={res.id} style={{ marginTop: '0.5rem', paddingLeft: '0.75rem' }}>
                      <em>Resultado {i + 1}.{rI + 1}:</em> {res.description}
                      <ul style={{ margin: '0.25rem 0 0 1.25rem', padding: 0 }}>
                        {res.activities.map(act => (
                          <li key={act.id}>
                            {act.description} <em>(Responsable: {act.responsible})</em>
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Cap 3: Equipo Humano */}
            <div className={styles.docSection}>
              <h2 className={styles.docH2}>3. Equipo Humano e Imputación de Personal</h2>
              <table className={styles.table} style={{ marginTop: '0.5rem' }}>
                <thead>
                  <tr>
                    <th>Nombre / Perfil</th>
                    <th>Función Técnica</th>
                    <th>Jornada Imputada</th>
                    <th>Meses</th>
                    <th className={styles.numCol}>Coste Imputado</th>
                  </tr>
                </thead>
                <tbody>
                  {personal.map(p => {
                    const costeEmpresaMes = p.monthlySalary * (1 + p.ssPct / 100);
                    const pct = p.maxWeeklyHours > 0 ? (p.weeklyHours / p.maxWeeklyHours) : 1;
                    const total = (costeEmpresaMes * pct) * (p.months || 12);
                    return (
                      <tr key={p.id}>
                        <td><strong>{p.name}</strong></td>
                        <td>{p.role}</td>
                        <td>{p.weeklyHours}h/semana ({(pct * 100).toFixed(0)}%)</td>
                        <td>{p.months} meses</td>
                        <td className={styles.numCol}>{formatCurrency(total)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Cap 4: Cronograma */}
            <div className={styles.docSection}>
              <h2 className={styles.docH2}>4. Cronograma de Ejecución ({cronograma.durationMonths} Meses)</h2>
              <table className={styles.table} style={{ marginTop: '0.5rem' }}>
                <thead>
                  <tr>
                    <th>Actividad</th>
                    <th>Responsable</th>
                    <th>Periodo de Ejecución</th>
                  </tr>
                </thead>
                <tbody>
                  {cronograma.activities.map(c => (
                    <tr key={c.id}>
                      <td>{c.description}</td>
                      <td>{c.responsible}</td>
                      <td>Mes {c.startMonth} al Mes {c.endMonth}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Cap 5: Presupuesto Desglosado */}
            <div className={styles.docSection}>
              <h2 className={styles.docH2}>5. Presupuesto y Plan Financiero</h2>
              <table className={styles.table} style={{ marginTop: '0.5rem' }}>
                <thead>
                  <tr>
                    <th>Categoría</th>
                    <th>Concepto</th>
                    <th className={styles.numCol}>Importe Total</th>
                  </tr>
                </thead>
                <tbody>
                  {presupuesto.partidas.map(p => (
                    <tr key={p.id}>
                      <td style={{ textTransform: 'capitalize' }}>{p.category}</td>
                      <td>{p.description}</td>
                      <td className={styles.numCol}>{formatCurrency(p.monthlyAmount * p.months)}</td>
                    </tr>
                  ))}
                  <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
                    <td colSpan={2}>Costes Directos Subtotal</td>
                    <td className={styles.numCol}>{formatCurrency(directCost)}</td>
                  </tr>
                  <tr style={{ background: '#f8fafc', fontWeight: 700 }}>
                    <td colSpan={2}>Costes Indirectos / Estructura ({presupuesto.indirectPct}%)</td>
                    <td className={styles.numCol}>{formatCurrency(indirectCost)}</td>
                  </tr>
                  <tr style={{ background: '#eff6ff', fontWeight: 800, fontSize: '1rem', color: '#1e3a8a' }}>
                    <td colSpan={2}>PRESUPUESTO TOTAL DEL PROYECTO</td>
                    <td className={styles.numCol}>{formatCurrency(totalPresupuesto)}</td>
                  </tr>
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectWorkspace;
