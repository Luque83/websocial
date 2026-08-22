'use client';

import React, { useState, useMemo } from 'react';
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
  Building2,
  Receipt,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  Clock
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
  // 1. STATE INITIALIZATION
  const [activeTab, setActiveTab] = useState<'subvencion' | 'diagnostico' | 'marcoLogico' | 'personal' | 'presupuesto' | 'facturas' | 'cronograma' | 'memoria'>('subvencion');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [copied, setCopied] = useState(false);

  // Restore existing workspace data or fallback to tool-specific data
  const fullWorkspace = (initialToolsData['project-workspace-full'] as ProjectWorkspaceData) || null;
  const initialML = (initialToolsData['marco-logico'] as ProjectWorkspaceData['marcoLogico']) || null;
  const initialCostes = (initialToolsData['costes-proyecto'] as ProjectWorkspaceData['presupuesto']) || null;
  const initialCron = (initialToolsData['cronograma'] || initialToolsData['cronograma-actividades']) as ProjectWorkspaceData['cronograma'] || null;
  const initialInd = (initialToolsData['indicadores-impacto'] as { indicadores: ProjectWorkspaceData['indicadores'] }) || null;
  const initialPers = (initialToolsData['personal-proyecto'] as { workers: ProjectWorkspaceData['personal'] }) || null;

  // 1.1 Subvención y Expediente
  const [subvencion, setSubvencion] = useState<ProjectWorkspaceData['subvencion']>(() => fullWorkspace?.subvencion || {
    organismo: 'Consejería de Inclusión Social / IRPF Autonómico',
    linea: 'Línea 1: Programas de Inserción Sociolaboral para Colectivos Vulnerables',
    expedienteNum: 'EXP-2026/0491-IRPF',
    importeSolicitado: 42000,
    importeConcedido: 40000,
    aportacionPropia: 5000,
    fechaInicio: '2026-01-01',
    fechaFin: '2026-12-31',
    fechaLimiteJustificacion: '2027-03-31',
    estadoSubvencion: 'ejecucion',
  });

  // 1.2 Diagnóstico
  const [diagnostico, setDiagnostico] = useState(() => fullWorkspace?.diagnostico || {
    projectName: initialProject.name || 'Programa de Inserción Sociolaboral Juventud Activa 2026',
    organization: 'Asociación Acción e Inclusión Social',
    callName: 'Subvenciones del 0,7% IRPF Social 2026',
    targetPopulation: 'Jóvenes en situación de vulnerabilidad y desempleo de larga duración',
    beneficiariesDirect: 50,
    beneficiariesIndirect: 150,
    location: 'Ámbito Autonómico / Comarcal',
    justification: initialProject.description || 'El proyecto responde a la urgente necesidad de capacitación técnica y acompañamiento individualizado para superar la brecha sociolaboral.',
    diagnosticText: 'Se detecta un incremento del 35% en la tasa de desempleo juvenil en el territorio y falta de itinerarios personalizados adaptados al mercado digital.',
  });

  // 1.3 Marco Lógico con Evidencias
  const [marcoLogico, setMarcoLogico] = useState<ProjectWorkspaceData['marcoLogico']>(() => fullWorkspace?.marcoLogico || initialML || {
    fin: 'Mejorar la cohesión social y la calidad de vida de los colectivos vulnerables.',
    proposito: 'Fomentar la empleabilidad y la inclusión social activa de las personas participantes.',
    objectives: [
      {
        id: 'obj-1',
        description: 'Desarrollar itinerarios integrados de orientación y capacitación laboral.',
        indicators: '80% de participantes completan su itinerario formativo (50 personas)',
        sources: 'Partes de asistencia y certificados de aprovechamiento',
        assumptions: 'Compromiso de asistencia y disponibilidad de aulas formativas',
        results: [
          {
            id: 'res-1-1',
            description: '50 personas han recibido orientación laboral individualizada.',
            indicators: '50 diagnósticos de empleabilidad realizados',
            sources: 'Fichas de seguimiento técnico',
            assumptions: 'Derivación adecuada de servicios sociales de referencia',
            activities: [
              { 
                id: 'act-1-1-1', 
                description: 'Entrevistas de diagnóstico inicial y diseño del plan de acción', 
                responsible: 'Trabajador/a Social',
                evidencias: [
                  { id: 'ev-1', tipo: 'firmas', descripcion: 'Fichas de acogida y consentimiento firmadas', estado: 'aportada' },
                  { id: 'ev-2', tipo: 'informe', descripcion: 'Informe de valoración diagnóstica individual', estado: 'validada' }
                ]
              },
              { 
                id: 'act-1-1-2', 
                description: 'Talleres grupales de competencias digitales y búsqueda activa de empleo', 
                responsible: 'Educador/a Social',
                evidencias: [
                  { id: 'ev-3', tipo: 'firmas', descripcion: 'Listados de asistencia diarios con DNI y firma', estado: 'aportada' },
                  { id: 'ev-4', tipo: 'fotos', descripcion: 'Dossier fotográfico y capturas de sesiones', estado: 'pendiente' }
                ]
              },
            ]
          }
        ]
      }
    ]
  });

  // 1.4 Indicadores
  const [indicadores, setIndicadores] = useState<ProjectWorkspaceData['indicadores']>(() => fullWorkspace?.indicadores || initialInd?.indicadores || [
    { id: 'ind-1', name: 'Personas atendidas con itinerario completo', unit: 'personas', baseline: 0, target: 50, current: 38, source: 'Fichas de acogida y registro técnico' },
    { id: 'ind-2', name: 'Inserciones laborales logradas', unit: 'contratos', baseline: 0, target: 20, current: 14, source: 'Contratos laborales y altas en SS' },
    { id: 'ind-3', name: 'Talleres formativos ejecutados', unit: 'talleres', baseline: 0, target: 4, current: 3, source: 'Memoria pedagógica y hojas de firmas' },
  ]);

  // 1.5 Personal
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

  // 1.6 Presupuesto
  const [presupuesto, setPresupuesto] = useState<ProjectWorkspaceData['presupuesto']>(() => fullWorkspace?.presupuesto || initialCostes || {
    partidas: [
      { id: 'p-1', category: 'personal', description: 'Elena Gómez (Trabajadora Social - 20h/sem)', monthlyAmount: 1471.68, months: 12, costeReal: 17660.16, workerId: 'pers-1' },
      { id: 'p-2', category: 'personal', description: 'Carlos Ruiz (Educador Social - 18.75h/sem)', monthlyAmount: 1215.45, months: 10, costeReal: 12154.50, workerId: 'pers-2' },
      { id: 'p-3', category: 'actividades', description: 'Material didáctico y licencias formativas', monthlyAmount: 250, months: 10, costeReal: 2400 },
      { id: 'p-4', category: 'suministros', description: 'Alquiler de aulas y suministros de sede', monthlyAmount: 400, months: 12, costeReal: 4800 },
    ],
    indirectPct: 8,
    grantAmount: 40000,
  });

  // 1.7 Gastos y Facturas Detalladas
  const [gastosFacturas, setGastosFacturas] = useState<ProjectWorkspaceData['gastosFacturas']>(() => fullWorkspace?.gastosFacturas || [
    {
      id: 'fac-1',
      proveedor: 'Formación y Tecnología S.L.',
      nif: 'B-98765432',
      numFactura: 'FAC-2026/089',
      fecha: '2026-03-15',
      concepto: 'Licencias de software didáctico y aula virtual',
      totalFactura: 1452.00,
      pctImputado: 100,
      importeImputado: 1452.00,
      partidaId: 'p-3',
      justificantePago: true,
    },
    {
      id: 'fac-2',
      proveedor: 'Espacio Coworking & Aulas Centro',
      nif: 'B-12345678',
      numFactura: '2026-0312',
      fecha: '2026-04-02',
      concepto: 'Alquiler de sala para talleres presenciales (Trimestre 1)',
      totalFactura: 1200.00,
      pctImputado: 80,
      importeImputado: 960.00,
      partidaId: 'p-4',
      justificantePago: true,
    },
    {
      id: 'fac-3',
      proveedor: 'Papelería y Suministros Gráficos',
      nif: 'A-44332211',
      numFactura: 'A-994',
      fecha: '2026-05-10',
      concepto: 'Material fungible para participantes',
      totalFactura: 350.00,
      pctImputado: 100,
      importeImputado: 350.00,
      partidaId: 'p-3',
      justificantePago: false, // Alerta
    }
  ]);

  // 1.8 Cronograma
  const [cronograma, setCronograma] = useState<ProjectWorkspaceData['cronograma']>(() => fullWorkspace?.cronograma || initialCron || {
    durationMonths: 12,
    activities: [
      { id: 'c-1', description: 'Entrevistas de diagnóstico inicial y diseño del plan de acción', responsible: 'Trabajador/a Social', startMonth: 1, endMonth: 4 },
      { id: 'c-2', description: 'Talleres grupales de competencias digitales y búsqueda activa', responsible: 'Educador/a Social', startMonth: 3, endMonth: 10 },
      { id: 'c-3', description: 'Seguimiento, evaluación intermedia y prospección de empleo', responsible: 'Coordinación', startMonth: 4, endMonth: 11 },
      { id: 'c-4', description: 'Evaluación final y redacción de memoria justificativa', responsible: 'Equipo Técnico', startMonth: 11, endMonth: 12 },
    ]
  });

  const handleModify = () => {
    setHasChanges(true);
  };

  // 2. REACTIVE CALCULATIONS
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
  const saldoDisponible = (subvencion.importeConcedido || totalPresupuesto) - totalEjecutadoReal;
  const pctEjecucionEconomica = subvencion.importeConcedido > 0 ? (totalEjecutadoReal / subvencion.importeConcedido) * 100 : 0;

  // Evidences stats
  const allEvidencias = useMemo(() => {
    const list: Array<{ id: string; tipo: string; descripcion: string; estado: string }> = [];
    marcoLogico.objectives.forEach(o => {
      o.results.forEach(r => {
        r.activities.forEach(a => {
          if (a.evidencias) list.push(...a.evidencias);
        });
      });
    });
    return list;
  }, [marcoLogico]);

  const validadasCount = allEvidencias.filter(e => e.estado === 'validada' || e.estado === 'aportada').length;
  const pctEvidencias = allEvidencias.length > 0 ? Math.round((validadasCount / allEvidencias.length) * 100) : 100;

  // AUDIT ALERTS & RISK SEMAPHORE (FASE 6)
  const auditAlerts = useMemo(() => {
    const alerts: Array<{ type: 'red' | 'yellow' | 'green'; text: string }> = [];

    // Check 1: Invoices without payment proof
    const missingPayments = gastosFacturas.filter(f => !f.justificantePago);
    if (missingPayments.length > 0) {
      alerts.push({
        type: 'red',
        text: `${missingPayments.length} factura(s) registrada(s) sin justificante bancario de pago adjunto.`
      });
    }

    // Check 2: Partidas with severe deviation (>10%)
    const highDevPartidas = presupuesto.partidas.filter(p => {
      const pres = p.monthlyAmount * p.months;
      const real = p.costeReal !== undefined ? p.costeReal : pres;
      return pres > 0 && Math.abs((real - pres) / pres) > 0.10;
    });
    if (highDevPartidas.length > 0) {
      alerts.push({
        type: 'yellow',
        text: `${highDevPartidas.length} partida(s) con desviación superior al 10% (requiere justificación motivada).`
      });
    }

    // Check 3: Activities without evidences
    const pendingEv = allEvidencias.filter(e => e.estado === 'pendiente');
    if (pendingEv.length > 0) {
      alerts.push({
        type: 'yellow',
        text: `${pendingEv.length} evidencia(s) documental(es) obligatoria(s) pendientes de incorporar.`
      });
    }

    // Check 4: Personnel check
    const overAllocatedWorkers = personal.filter(w => w.weeklyHours > w.maxWeeklyHours);
    if (overAllocatedWorkers.length > 0) {
      alerts.push({
        type: 'red',
        text: `Alerta de sobreimputación: ${overAllocatedWorkers.length} trabajador/a(es) superan la jornada máxima de convenio.`
      });
    }

    if (alerts.length === 0) {
      alerts.push({
        type: 'green',
        text: 'Expediente al 100%: Sin incidencias graves ni riesgos de subsanación detectados.'
      });
    }

    return alerts;
  }, [gastosFacturas, presupuesto.partidas, allEvidencias, personal]);

  const globalRisk = useMemo(() => {
    const hasRed = auditAlerts.some(a => a.type === 'red');
    const hasYellow = auditAlerts.some(a => a.type === 'yellow');
    if (hasRed) return { level: 'ALTO', class: styles.riskRed, label: '🔴 RIESGO ALTO (Revisión Urgente)' };
    if (hasYellow) return { level: 'MEDIO', class: styles.riskYellow, label: '🟡 RIESGO MEDIO (Alertas menores)' };
    return { level: 'BAJO', class: styles.riskGreen, label: '🟢 RIESGO BAJO (Expediente Conforme)' };
  }, [auditAlerts]);

  // 3. ACTIONS
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

  const handleSaveAll = async () => {
    setIsSaving(true);
    try {
      const fullData: ProjectWorkspaceData = {
        diagnostico,
        subvencion,
        marcoLogico,
        indicadores,
        personal,
        presupuesto,
        gastosFacturas,
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

  const handleCopyMemoria = () => {
    const el = document.getElementById('memoria-content');
    if (el) {
      navigator.clipboard.writeText(el.innerText);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
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
            <h1 className={styles.projectTitle}>{diagnostico.projectName || 'Expediente de Subvención'}</h1>
            <span style={{ fontSize: '0.8125rem', color: 'var(--text-secondary)' }}>
              {subvencion.expedienteNum} · {subvencion.organismo} · {diagnostico.organization}
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
            {isSaving ? 'Guardando Expediente...' : 'Guardar Todo el Expediente'}
          </button>
        </div>
      </header>

      {/* 2. SEMÁFORO DE AUDITORÍA Y CONTROL PREVENTIVO (FASE 6) */}
      <section className={styles.riskBanner}>
        <div className={styles.riskBannerHeader}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <ShieldCheck size={24} color="#2563eb" />
            <div>
              <strong style={{ fontSize: '1rem', color: 'var(--text-primary)' }}>Panel de Control Preventivo y Auditoría</strong>
              <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>Supervisión continua de cumplimiento legal y justificación</div>
            </div>
          </div>
          <span className={`${styles.riskStatusPill} ${globalRisk.class}`}>
            {globalRisk.label}
          </span>
        </div>

        <div className={styles.auditMetricsGrid}>
          <div className={styles.auditMetricCard}>
            <span className={styles.auditMetricLabel}>Ejecución Económica</span>
            <span className={styles.auditMetricValue}>{pctEjecucionEconomica.toFixed(1)}%</span>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{formatCurrency(totalEjecutadoReal)} de {formatCurrency(subvencion.importeConcedido)}</span>
          </div>
          <div className={styles.auditMetricCard}>
            <span className={styles.auditMetricLabel}>Evidencias Documentales</span>
            <span className={styles.auditMetricValue} style={{ color: pctEvidencias >= 80 ? '#16a34a' : '#d97706' }}>{pctEvidencias}%</span>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>{validadasCount} de {allEvidencias.length} aportadas</span>
          </div>
          <div className={styles.auditMetricCard}>
            <span className={styles.auditMetricLabel}>Facturas con Pago</span>
            <span className={styles.auditMetricValue} style={{ color: gastosFacturas.every(f => f.justificantePago) ? '#16a34a' : '#dc2626' }}>
              {gastosFacturas.filter(f => f.justificantePago).length} / {gastosFacturas.length}
            </span>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Con justificante bancario</span>
          </div>
          <div className={styles.auditMetricCard}>
            <span className={styles.auditMetricLabel}>Saldo Disponible</span>
            <span className={styles.auditMetricValue} style={{ color: saldoDisponible < 0 ? '#dc2626' : '#2563eb' }}>
              {formatCurrency(saldoDisponible)}
            </span>
            <span style={{ fontSize: '0.6875rem', color: 'var(--text-muted)' }}>Por imputar a la subvención</span>
          </div>
        </div>

        <div className={styles.alertsContainer}>
          {auditAlerts.map((alert, idx) => (
            <div 
              key={idx} 
              className={`${styles.alertItem} ${alert.type === 'red' ? styles.alertRed : alert.type === 'yellow' ? styles.alertYellow : styles.alertGreen}`}
            >
              {alert.type === 'red' ? <AlertCircle size={15} /> : alert.type === 'yellow' ? <AlertTriangle size={15} /> : <CheckCircle2 size={15} />}
              <span>{alert.text}</span>
            </div>
          ))}
        </div>
      </section>

      {/* 3. TABS NAVIGATION */}
      <nav className={styles.tabNav}>
        <button
          type="button"
          onClick={() => setActiveTab('subvencion')}
          className={`${styles.tabBtn} ${activeTab === 'subvencion' ? styles.tabActive : ''}`}
        >
          <Building2 size={16} />
          <span>1. Subvención</span>
          <span className={styles.tabBadge}>{subvencion.estadoSubvencion}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('diagnostico')}
          className={`${styles.tabBtn} ${activeTab === 'diagnostico' ? styles.tabActive : ''}`}
        >
          <FileText size={16} />
          <span>2. Diagnóstico</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('marcoLogico')}
          className={`${styles.tabBtn} ${activeTab === 'marcoLogico' ? styles.tabActive : ''}`}
        >
          <Target size={16} />
          <span>3. Marco Lógico</span>
          <span className={styles.tabBadge}>{marcoLogico.objectives.length} obj</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('personal')}
          className={`${styles.tabBtn} ${activeTab === 'personal' ? styles.tabActive : ''}`}
        >
          <Users size={16} />
          <span>4. Personal</span>
          <span className={styles.tabBadge}>{personal.length}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('presupuesto')}
          className={`${styles.tabBtn} ${activeTab === 'presupuesto' ? styles.tabActive : ''}`}
        >
          <Calculator size={16} />
          <span>5. Presupuesto</span>
          <span className={styles.tabBadge}>{formatCurrency(totalPresupuesto)}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('facturas')}
          className={`${styles.tabBtn} ${activeTab === 'facturas' ? styles.tabActive : ''}`}
        >
          <Receipt size={16} />
          <span>6. Gastos / Facturas</span>
          <span className={styles.tabBadge}>{gastosFacturas.length}</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('cronograma')}
          className={`${styles.tabBtn} ${activeTab === 'cronograma' ? styles.tabActive : ''}`}
        >
          <Calendar size={16} />
          <span>7. Cronograma</span>
        </button>
        <button
          type="button"
          onClick={() => setActiveTab('memoria')}
          className={`${styles.tabBtn} ${activeTab === 'memoria' ? styles.tabActive : ''}`}
        >
          <Sparkles size={16} color="#7c3aed" />
          <span style={{ color: activeTab === 'memoria' ? '#7c3aed' : 'inherit', fontWeight: 800 }}>
            8. Cuenta Justificativa
          </span>
        </button>
      </nav>

      {/* TAB 1: SUBVENCIÓN Y CONVOCATORIA (FASE 3) */}
      {activeTab === 'subvencion' && (
        <div className={styles.contentCard}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}><Building2 size={20} color="#2563eb" /> 1. Datos Oficiales de la Subvención y Financiador</h2>
              <p className={styles.sectionSubtitle}>Registra la resolución oficial, importes concedidos, fechas de ejecución y plazos de justificación.</p>
            </div>
          </div>

          <div className={styles.formGrid2}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Organismo Convocante / Financiador</label>
              <input
                type="text"
                className={styles.input}
                value={subvencion.organismo}
                onChange={e => { setSubvencion({ ...subvencion, organismo: e.target.value }); handleModify(); }}
                placeholder="Ej. Ministerio de Derechos Sociales / Consejería de Igualdad"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Línea o Programa de Subvención</label>
              <input
                type="text"
                className={styles.input}
                value={subvencion.linea}
                onChange={e => { setSubvencion({ ...subvencion, linea: e.target.value }); handleModify(); }}
                placeholder="Ej. Línea 1: Inclusión sociolaboral"
              />
            </div>
          </div>

          <div className={styles.formGrid3}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Número de Expediente Oficial</label>
              <input
                type="text"
                className={styles.input}
                value={subvencion.expedienteNum}
                onChange={e => { setSubvencion({ ...subvencion, expedienteNum: e.target.value }); handleModify(); }}
                placeholder="Ej. EXP-2026/0491-IRPF"
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Importe Concedido (€)</label>
              <input
                type="number"
                className={styles.input}
                value={subvencion.importeConcedido}
                onChange={e => { 
                  const val = parseFloat(e.target.value) || 0;
                  setSubvencion({ ...subvencion, importeConcedido: val });
                  setPresupuesto(p => ({ ...p, grantAmount: val }));
                  handleModify(); 
                }}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Aportación Propia de la ONG (€)</label>
              <input
                type="number"
                className={styles.input}
                value={subvencion.aportacionPropia}
                onChange={e => { setSubvencion({ ...subvencion, aportacionPropia: parseFloat(e.target.value) || 0 }); handleModify(); }}
              />
            </div>
          </div>

          <div className={styles.formGrid3}>
            <div className={styles.formGroup}>
              <label className={styles.label}>Fecha Inicio de Ejecución</label>
              <input
                type="date"
                className={styles.input}
                value={subvencion.fechaInicio}
                onChange={e => { setSubvencion({ ...subvencion, fechaInicio: e.target.value }); handleModify(); }}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Fecha Fin de Ejecución</label>
              <input
                type="date"
                className={styles.input}
                value={subvencion.fechaFin}
                onChange={e => { setSubvencion({ ...subvencion, fechaFin: e.target.value }); handleModify(); }}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Fecha Límite Justificación</label>
              <input
                type="date"
                className={styles.input}
                value={subvencion.fechaLimiteJustificacion}
                onChange={e => { setSubvencion({ ...subvencion, fechaLimiteJustificacion: e.target.value }); handleModify(); }}
              />
            </div>
          </div>
        </div>
      )}

      {/* TAB 2: DIAGNÓSTICO Y COLECTIVOS */}
      {activeTab === 'diagnostico' && (
        <div className={styles.contentCard}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}><FileText size={20} color="#2563eb" /> 2. Diagnóstico de Necesidades y Justificación Técnica</h2>
              <p className={styles.sectionSubtitle}>Fundamenta la necesidad social del proyecto y define los colectivos beneficiarios.</p>
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
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Entidad Solicitante / ONG</label>
              <input
                type="text"
                className={styles.input}
                value={diagnostico.organization}
                onChange={e => { setDiagnostico({ ...diagnostico, organization: e.target.value }); handleModify(); }}
              />
            </div>
          </div>

          <div className={styles.formGrid3}>
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
              <label className={styles.label}>Beneficiarios Indirectos</label>
              <input
                type="number"
                className={styles.input}
                value={diagnostico.beneficiariesIndirect}
                onChange={e => { setDiagnostico({ ...diagnostico, beneficiariesIndirect: parseInt(e.target.value) || 0 }); handleModify(); }}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>Ámbito Territorial</label>
              <input
                type="text"
                className={styles.input}
                value={diagnostico.location}
                onChange={e => { setDiagnostico({ ...diagnostico, location: e.target.value }); handleModify(); }}
              />
            </div>
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Diagnóstico de la Realidad y Problemática Social</label>
            <textarea
              className={styles.textarea}
              rows={4}
              value={diagnostico.diagnosticText}
              onChange={e => { setDiagnostico({ ...diagnostico, diagnosticText: e.target.value }); handleModify(); }}
            />
          </div>

          <div className={styles.formGroup}>
            <label className={styles.label}>Justificación Técnica de la Intervención</label>
            <textarea
              className={styles.textarea}
              rows={4}
              value={diagnostico.justification}
              onChange={e => { setDiagnostico({ ...diagnostico, justification: e.target.value }); handleModify(); }}
            />
          </div>
        </div>
      )}

      {/* TAB 3: MARCO LÓGICO Y EVIDENCIAS (FASE 5) */}
      {activeTab === 'marcoLogico' && (
        <div className={styles.contentCard}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}><Target size={20} color="#2563eb" /> 3. Marco Lógico, Actividades y Evidencias Documentales</h2>
              <p className={styles.sectionSubtitle}>Estructura los objetivos y asigna las evidencias obligatorias (firmas, fotos, encuestas) que exige la subvención.</p>
            </div>
            <button
              type="button"
              onClick={syncMLToCronograma}
              className={styles.exportBtn}
            >
              🔄 Sincronizar con Cronograma
            </button>
          </div>

          <div className={styles.formGrid2}>
            <div className={styles.formGroup}>
              <label className={styles.label}>FIN (Impacto Superior)</label>
              <textarea
                className={styles.textarea}
                rows={2}
                value={marcoLogico.fin}
                onChange={e => { setMarcoLogico({ ...marcoLogico, fin: e.target.value }); handleModify(); }}
              />
            </div>
            <div className={styles.formGroup}>
              <label className={styles.label}>PROPÓSITO (Objetivo General)</label>
              <textarea
                className={styles.textarea}
                rows={2}
                value={marcoLogico.proposito}
                onChange={e => { setMarcoLogico({ ...marcoLogico, proposito: e.target.value }); handleModify(); }}
              />
            </div>
          </div>

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
                  placeholder="Descripción del objetivo..."
                />
              </div>

              {obj.results.map((res, rIdx) => (
                <div key={res.id} className={styles.resBlock}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.5rem' }}>
                    <span style={{ fontSize: '0.875rem', fontWeight: 700, color: '#334155' }}>
                      📦 Resultado {oIdx + 1}.{rIdx + 1}
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

                  {/* Actividades con Evidencias */}
                  <div style={{ marginTop: '0.75rem' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: 'var(--text-muted)', textTransform: 'uppercase' }}>
                      Actividades y Evidencias de Ejecución:
                    </span>
                    {res.activities.map((act, aIdx) => (
                      <div key={act.id} style={{ background: '#f1f5f9', padding: '0.75rem', borderRadius: '8px', marginTop: '0.5rem' }}>
                        <div className={styles.actBlock} style={{ margin: 0, padding: 0, background: 'none', border: 'none' }}>
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
                            placeholder="Responsable..."
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

                        {/* Evidencias de la actividad */}
                        <div style={{ marginTop: '0.5rem', display: 'flex', flexWrap: 'wrap', gap: '0.4rem', alignItems: 'center' }}>
                          <span style={{ fontSize: '0.6875rem', fontWeight: 700, color: '#64748b' }}>Evidencias:</span>
                          {(act.evidencias || []).map((ev, evIdx) => (
                            <span 
                              key={ev.id} 
                              className={`${styles.evidenceTag} ${ev.estado === 'validada' || ev.estado === 'aportada' ? styles.evidenceValid : styles.evidencePending}`}
                              onClick={() => {
                                const newObjs = [...marcoLogico.objectives];
                                const current = newObjs[oIdx].results[rIdx].activities[aIdx].evidencias![evIdx].estado;
                                newObjs[oIdx].results[rIdx].activities[aIdx].evidencias![evIdx].estado = current === 'validada' ? 'pendiente' : 'validada';
                                setMarcoLogico({ ...marcoLogico, objectives: newObjs });
                                handleModify();
                              }}
                              style={{ cursor: 'pointer' }}
                              title="Click para alternar estado (Validada / Pendiente)"
                            >
                              {ev.estado === 'validada' ? '✅' : '⏳'} {ev.descripcion} ({ev.tipo})
                            </span>
                          ))}
                          <button
                            type="button"
                            onClick={() => {
                              const newObjs = [...marcoLogico.objectives];
                              if (!newObjs[oIdx].results[rIdx].activities[aIdx].evidencias) {
                                newObjs[oIdx].results[rIdx].activities[aIdx].evidencias = [];
                              }
                              newObjs[oIdx].results[rIdx].activities[aIdx].evidencias!.push({
                                id: `ev-${Date.now()}`,
                                tipo: 'firmas',
                                descripcion: 'Hoja de firmas de participantes',
                                estado: 'pendiente'
                              });
                              setMarcoLogico({ ...marcoLogico, objectives: newObjs });
                              handleModify();
                            }}
                            style={{ fontSize: '0.6875rem', border: 'none', background: '#e2e8f0', color: '#1e293b', padding: '2px 6px', borderRadius: '4px', cursor: 'pointer' }}
                          >
                            + Añadir Evidencia
                          </button>
                        </div>
                      </div>
                    ))}
                    <button
                      type="button"
                      onClick={() => {
                        const newObjs = [...marcoLogico.objectives];
                        newObjs[oIdx].results[rIdx].activities.push({
                          id: `act-${Date.now()}`,
                          description: '',
                          responsible: 'Equipo Técnico',
                          evidencias: [{ id: `ev-${Date.now()}`, tipo: 'firmas', descripcion: 'Hojas de firmas y asistencia', estado: 'pendiente' }]
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
                <Plus size={14} /> Añadir Resultado
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

      {/* TAB 4: PERSONAL E IMPUTACIONES */}
      {activeTab === 'personal' && (
        <div className={styles.contentCard}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}><Users size={20} color="#2563eb" /> 4. Personal y Horas Imputadas a la Subvención</h2>
              <p className={styles.sectionSubtitle}>Asigna las nóminas, jornada semanal y meses de dedicación a este proyecto.</p>
            </div>
            <button
              type="button"
              onClick={syncPersonalToBudget}
              className={styles.exportBtn}
            >
              🔄 Trasladar al Presupuesto
            </button>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Nombre del Trabajador/a</th>
                  <th>Categoría / Puesto</th>
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
                  const isOverLimit = worker.weeklyHours > worker.maxWeeklyHours;

                  return (
                    <tr key={worker.id} style={{ background: isOverLimit ? '#fef2f2' : 'inherit' }}>
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
                          style={{ width: '75px', borderColor: isOverLimit ? '#dc2626' : 'inherit' }}
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
            <Plus size={16} /> Añadir Trabajador/a
          </button>
        </div>
      )}

      {/* TAB 5: PRESUPUESTO */}
      {activeTab === 'presupuesto' && (
        <div className={styles.contentCard}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}><Calculator size={20} color="#2563eb" /> 5. Presupuesto Desglosado y Desviaciones</h2>
              <p className={styles.sectionSubtitle}>Plan financiero por partidas y control de gasto real frente a presupuesto concedido.</p>
            </div>
            <button
              type="button"
              onClick={exportBudgetToCsv}
              className={styles.exportBtn}
            >
              📥 Exportar Anexo CSV (Excel)
            </button>
          </div>

          <div className={styles.kpiGrid}>
            <div className={`${styles.kpiCard} ${styles.kpiHighlight}`}>
              <span className={styles.kpiLabel}>Total Proyecto Presupuestado</span>
              <span className={styles.kpiValue}>{formatCurrency(totalPresupuesto)}</span>
            </div>
            <div className={styles.kpiCard}>
              <span className={styles.kpiLabel}>Subvención Concedida</span>
              <span className={styles.kpiValue}>{formatCurrency(subvencion.importeConcedido)}</span>
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
            <Plus size={16} /> Añadir Nueva Partida
          </button>
        </div>
      )}

      {/* TAB 6: GASTOS Y FACTURAS (FASE 4) */}
      {activeTab === 'facturas' && (
        <div className={styles.contentCard}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}><Receipt size={20} color="#2563eb" /> 6. Relación Clasificada de Gastos y Facturas</h2>
              <p className={styles.sectionSubtitle}>Registra cada factura, su porcentaje de imputación a esta subvención y el justificante bancario de pago.</p>
            </div>
          </div>

          <div className={styles.tableWrapper}>
            <table className={styles.table}>
              <thead>
                <tr>
                  <th>Proveedor / Emisor</th>
                  <th>NIF / CIF</th>
                  <th>Nº Factura</th>
                  <th>Fecha</th>
                  <th>Concepto</th>
                  <th className={styles.numCol}>Total Factura</th>
                  <th>% Imputado</th>
                  <th className={styles.numCol}>Imputado Subvención</th>
                  <th style={{ textAlign: 'center' }}>Pago Bancario</th>
                  <th></th>
                </tr>
              </thead>
              <tbody>
                {gastosFacturas.map((fac, fIdx) => (
                  <tr key={fac.id}>
                    <td>
                      <input
                        type="text"
                        className={styles.input}
                        value={fac.proveedor}
                        onChange={e => {
                          const newF = [...gastosFacturas];
                          newF[fIdx].proveedor = e.target.value;
                          setGastosFacturas(newF);
                          handleModify();
                        }}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className={styles.input}
                        style={{ width: '95px' }}
                        value={fac.nif}
                        onChange={e => {
                          const newF = [...gastosFacturas];
                          newF[fIdx].nif = e.target.value;
                          setGastosFacturas(newF);
                          handleModify();
                        }}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className={styles.input}
                        style={{ width: '100px' }}
                        value={fac.numFactura}
                        onChange={e => {
                          const newF = [...gastosFacturas];
                          newF[fIdx].numFactura = e.target.value;
                          setGastosFacturas(newF);
                          handleModify();
                        }}
                      />
                    </td>
                    <td>
                      <input
                        type="date"
                        className={styles.input}
                        style={{ width: '125px' }}
                        value={fac.fecha}
                        onChange={e => {
                          const newF = [...gastosFacturas];
                          newF[fIdx].fecha = e.target.value;
                          setGastosFacturas(newF);
                          handleModify();
                        }}
                      />
                    </td>
                    <td>
                      <input
                        type="text"
                        className={styles.input}
                        value={fac.concepto}
                        onChange={e => {
                          const newF = [...gastosFacturas];
                          newF[fIdx].concepto = e.target.value;
                          setGastosFacturas(newF);
                          handleModify();
                        }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        className={styles.input}
                        style={{ width: '90px', textAlign: 'right' }}
                        value={fac.totalFactura}
                        onChange={e => {
                          const newF = [...gastosFacturas];
                          const total = parseFloat(e.target.value) || 0;
                          newF[fIdx].totalFactura = total;
                          newF[fIdx].importeImputado = Number((total * (newF[fIdx].pctImputado / 100)).toFixed(2));
                          setGastosFacturas(newF);
                          handleModify();
                        }}
                      />
                    </td>
                    <td>
                      <input
                        type="number"
                        min="0"
                        max="100"
                        className={styles.input}
                        style={{ width: '65px', textAlign: 'right' }}
                        value={fac.pctImputado}
                        onChange={e => {
                          const newF = [...gastosFacturas];
                          const pct = parseFloat(e.target.value) || 0;
                          newF[fIdx].pctImputado = pct;
                          newF[fIdx].importeImputado = Number((newF[fIdx].totalFactura * (pct / 100)).toFixed(2));
                          setGastosFacturas(newF);
                          handleModify();
                        }}
                      />
                    </td>
                    <td className={styles.numCol} style={{ color: '#1e3a8a', fontWeight: 800 }}>
                      {formatCurrency(fac.importeImputado)}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <input
                        type="checkbox"
                        checked={fac.justificantePago}
                        onChange={e => {
                          const newF = [...gastosFacturas];
                          newF[fIdx].justificantePago = e.target.checked;
                          setGastosFacturas(newF);
                          handleModify();
                        }}
                        style={{ width: '18px', height: '18px', accentColor: '#16a34a', cursor: 'pointer' }}
                        title={fac.justificantePago ? 'Justificante de pago OK' : 'Pendiente de justificante'}
                      />
                    </td>
                    <td>
                      <button
                        type="button"
                        onClick={() => {
                          setGastosFacturas(gastosFacturas.filter(f => f.id !== fac.id));
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
              setGastosFacturas([
                ...gastosFacturas,
                {
                  id: `fac-${Date.now()}`,
                  proveedor: '',
                  nif: '',
                  numFactura: '',
                  fecha: new Date().toISOString().split('T')[0],
                  concepto: '',
                  totalFactura: 0,
                  pctImputado: 100,
                  importeImputado: 0,
                  partidaId: 'p-3',
                  justificantePago: false,
                }
              ]);
              handleModify();
            }}
            className={styles.addSmallBtn}
          >
            <Plus size={16} /> Registrar Nueva Factura
          </button>
        </div>
      )}

      {/* TAB 7: CRONOGRAMA */}
      {activeTab === 'cronograma' && (
        <div className={styles.contentCard}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}><Calendar size={20} color="#2563eb" /> 7. Cronograma de Ejecución Temporal (Diagrama Gantt)</h2>
              <p className={styles.sectionSubtitle}>Planifica la temporalización mes a mes de cada actividad del proyecto.</p>
            </div>
          </div>

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
                </tr>
              </thead>
              <tbody>
                {cronograma.activities.map((act, aIdx) => (
                  <tr key={act.id}>
                    <td><strong>{act.description}</strong></td>
                    <td>{act.responsible}</td>
                    {Array.from({ length: cronograma.durationMonths }, (_, mIdx) => {
                      const monthNum = mIdx + 1;
                      const isActive = monthNum >= act.startMonth && monthNum <= act.endMonth;
                      return (
                        <td
                          key={mIdx}
                          onClick={() => {
                            const newActs = [...cronograma.activities];
                            if (monthNum < act.startMonth) newActs[aIdx].startMonth = monthNum;
                            else if (monthNum > act.endMonth) newActs[aIdx].endMonth = monthNum;
                            else {
                              if (monthNum === act.startMonth && monthNum < act.endMonth) newActs[aIdx].startMonth = monthNum + 1;
                              else newActs[aIdx].endMonth = monthNum - 1;
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
                        >
                          {isActive ? '✓' : ''}
                        </td>
                      );
                    })}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 8: MEMORIA Y CUENTA JUSTIFICATIVA (FASE 8) */}
      {activeTab === 'memoria' && (
        <div className={styles.contentCard}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}><Sparkles size={20} color="#7c3aed" /> 8. Cuenta Justificativa y Memoria Técnica Consolidada</h2>
              <p className={styles.sectionSubtitle}>Documento oficial consolidado automáticamente con todos los datos técnicos, nóminas y relación de facturas.</p>
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

          {/* RENDERIZADO DEL EXPEDIENTE MEMORIA */}
          <div id="memoria-content" className={styles.memoriaDoc}>
            <div className={styles.docHeader}>
              <h1 className={styles.docH1}>{diagnostico.projectName || 'Cuenta Justificativa de Subvención'}</h1>
              <p style={{ margin: 0, fontSize: '1.125rem', color: '#1e3a8a', fontWeight: 700 }}>
                {subvencion.organismo} · {subvencion.linea}
              </p>
              <p style={{ margin: '0.35rem 0 0', fontSize: '0.875rem', color: '#475569' }}>
                Expediente: <strong>{subvencion.expedienteNum}</strong> | Entidad: <strong>{diagnostico.organization}</strong>
              </p>
              <p style={{ margin: '0.2rem 0 0', fontSize: '0.8125rem', color: '#64748b' }}>
                Periodo de Ejecución: {subvencion.fechaInicio} al {subvencion.fechaFin} | Fecha Límite Justificación: {subvencion.fechaLimiteJustificacion}
              </p>
            </div>

            {/* Cap 1 */}
            <div className={styles.docSection}>
              <h2 className={styles.docH2}>1. Justificación y Colectivo Destinatario</h2>
              <div className={styles.docText}>
                <strong>Diagnóstico de la Realidad:</strong><br />
                {diagnostico.diagnosticText}
              </div>
              <div className={styles.docText} style={{ marginTop: '0.75rem' }}>
                <strong>Justificación Técnica:</strong><br />
                {diagnostico.justification}
              </div>
              <div className={styles.docText} style={{ marginTop: '0.75rem' }}>
                <strong>Beneficiarios:</strong> {diagnostico.beneficiariesDirect} personas beneficiarias directas ({diagnostico.targetPopulation}) en {diagnostico.location}.
              </div>
            </div>

            {/* Cap 2 */}
            <div className={styles.docSection}>
              <h2 className={styles.docH2}>2. Objetivos, Actividades y Evidencias de Ejecución</h2>
              {marcoLogico.objectives.map((obj, i) => (
                <div key={obj.id} style={{ marginTop: '1rem', paddingLeft: '1rem', borderLeft: '3px solid #2563eb' }}>
                  <strong>Objetivo Específico {i + 1}:</strong> {obj.description}
                  {obj.results.map((res, rI) => (
                    <div key={res.id} style={{ marginTop: '0.5rem', paddingLeft: '0.75rem' }}>
                      <em>Resultado {i + 1}.{rI + 1}:</em> {res.description}
                      <ul style={{ margin: '0.25rem 0 0 1.25rem', padding: 0 }}>
                        {res.activities.map(act => (
                          <li key={act.id} style={{ marginBottom: '0.35rem' }}>
                            <strong>{act.description}</strong> (Responsable: {act.responsible})
                            {act.evidencias && act.evidencias.length > 0 && (
                              <span style={{ display: 'block', fontSize: '0.8125rem', color: '#475569' }}>
                                Evidencias aportadas: {act.evidencias.map(e => `${e.descripcion} (${e.estado})`).join(', ')}
                              </span>
                            )}
                          </li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              ))}
            </div>

            {/* Cap 3: Nóminas */}
            <div className={styles.docSection}>
              <h2 className={styles.docH2}>3. Personal Técnico y Nóminas Imputadas</h2>
              <table className={styles.table} style={{ marginTop: '0.5rem' }}>
                <thead>
                  <tr>
                    <th>Trabajador/a</th>
                    <th>Puesto</th>
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
                        <td>{p.weeklyHours}h/sem ({(pct * 100).toFixed(0)}%)</td>
                        <td>{p.months} meses</td>
                        <td className={styles.numCol}>{formatCurrency(total)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>

            {/* Cap 4: Facturas */}
            <div className={styles.docSection}>
              <h2 className={styles.docH2}>4. Relación Clasificada de Gastos y Facturas</h2>
              <table className={styles.table} style={{ marginTop: '0.5rem' }}>
                <thead>
                  <tr>
                    <th>Proveedor</th>
                    <th>Nº Factura</th>
                    <th>Fecha</th>
                    <th>Concepto</th>
                    <th>% Imp.</th>
                    <th className={styles.numCol}>Total Factura</th>
                    <th className={styles.numCol}>Imputado Subvención</th>
                  </tr>
                </thead>
                <tbody>
                  {gastosFacturas.map(f => (
                    <tr key={f.id}>
                      <td><strong>{f.proveedor}</strong> ({f.nif})</td>
                      <td>{f.numFactura}</td>
                      <td>{f.fecha}</td>
                      <td>{f.concepto}</td>
                      <td>{f.pctImputado}%</td>
                      <td className={styles.numCol}>{formatCurrency(f.totalFactura)}</td>
                      <td className={styles.numCol}><strong>{formatCurrency(f.importeImputado)}</strong></td>
                    </tr>
                  ))}
                  <tr style={{ background: '#f8fafc', fontWeight: 800 }}>
                    <td colSpan={6}>TOTAL GASTOS FACTURADOS IMPUTADOS</td>
                    <td className={styles.numCol}>{formatCurrency(gastosFacturas.reduce((a, f) => a + f.importeImputado, 0))}</td>
                  </tr>
                </tbody>
              </table>
            </div>

            {/* Cap 5: Balance Final */}
            <div className={styles.docSection}>
              <h2 className={styles.docH2}>5. Balance Financiero de Liquidación</h2>
              <table className={styles.table} style={{ marginTop: '0.5rem' }}>
                <tbody>
                  <tr>
                    <td><strong>Subvención Concedida Oficialmente:</strong></td>
                    <td className={styles.numCol}><strong>{formatCurrency(subvencion.importeConcedido)}</strong></td>
                  </tr>
                  <tr>
                    <td>Total Gasto Ejecutado Justificado:</td>
                    <td className={styles.numCol}>{formatCurrency(totalEjecutadoReal)}</td>
                  </tr>
                  <tr style={{ background: '#eff6ff', fontWeight: 800, fontSize: '1rem', color: '#1e3a8a' }}>
                    <td>SALDO DE LIQUIDACIÓN ({saldoDisponible === 0 ? 'Ejecución 100%' : saldoDisponible > 0 ? 'Remanente' : 'Exceso'}):</td>
                    <td className={styles.numCol}>{formatCurrency(saldoDisponible)}</td>
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
