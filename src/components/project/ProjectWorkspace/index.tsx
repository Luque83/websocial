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
  Building2,
  Receipt,
  ShieldCheck,
  AlertTriangle,
  FileCheck,
  Paperclip,
  Upload,
  Bot,
  ExternalLink,
  BookOpen,
  UserCheck,
  History,
  Sliders,
  FolderKanban,
  Camera,
  Award,
  PlayCircle,
  ClipboardCheck,
  X
} from 'lucide-react';
import { saveProjectWorkspaceAction, type ProjectWorkspaceData } from '@/app/actions/projectWorkspace';
import { analyzeConvocatoriaAction } from '@/app/actions/ai-analyzer';
import { uploadProjectDocumentAction } from '@/app/actions/storage';
import { getOrgStaffCatalogAction } from '@/app/actions/personal';
import { DEFAULT_STAFF_CATALOG, type Worker as OrgWorker } from '@/config/staff';
import type { ConvocatoriaAnalysisResult } from '@/lib/ai/callAnalyzer';
import { GrantLifecycleNav, type LifecyclePhase } from '@/components/project/GrantLifecycleNav';
import { TramitacionTab } from '@/components/project/tabs/TramitacionTab';
import { IncidenciasTab } from '@/components/project/tabs/IncidenciasTab';
import { AuditoriaTab } from '@/components/project/tabs/AuditoriaTab';
import type { 
  GrantLifecycleStage, 
  ProjectVersion, 
  RequirementItem, 
  ProjectIncidentItem, 
  VersionType, 
  CrossValidationIssue 
} from '@/types/grant-lifecycle';
import { 
  getProjectGrantLifecycleAction, 
  saveProjectGrantLifecycleAction, 
  createProjectVersionSnapshotAction, 
  runCrossAuditorAction 
} from '@/app/actions/grant-lifecycle';
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
  // 1. STATE INITIALIZATION - TWO-TIER LIFECYCLE NAVIGATION
  const [activePhase, setActivePhase] = useState<LifecyclePhase>('solicitud');
  const [activeSubTab, setActiveSubTab] = useState<string>('convocatoria');
  const [isSaving, setIsSaving] = useState(false);
  const [lastSaved, setLastSaved] = useState<string | null>(null);
  const [hasChanges, setHasChanges] = useState(false);
  const [copied, setCopied] = useState(false);

  // Grant Lifecycle States (Fase 8)
  const [lifecycleStage, setLifecycleStage] = useState<GrantLifecycleStage>('borrador');
  const [versions, setVersions] = useState<ProjectVersion[]>([]);
  const [cierreData, setCierreData] = useState<{
    resolucionNum: string;
    fechaResolucion: string;
    importeLiquidado: number;
    saldoFinal: number;
    estadoCierre: 'conforme' | 'reintegro' | 'alegaciones';
    resolucionDocUrl?: string;
    resolucionDocName?: string;
  }>({
    resolucionNum: 'RES-2026/LIQ-044',
    fechaResolucion: '2026-12-15',
    importeLiquidado: 40000,
    saldoFinal: 0,
    estadoCierre: 'conforme',
    resolucionDocName: 'resolucion_liquidacion_definitiva_firmada.pdf'
  });
  const [requirements, setRequirements] = useState<RequirementItem[]>([
    {
      id: 'req-init-1',
      notificationDate: '2026-03-10',
      deadlineDays: 10,
      deadlineDate: '2026-03-24',
      funderOrganism: 'Consejería de Inclusión Social',
      description: 'Subsanación formal: Aportación del Certificado de Representación Legal y Anexo IV firmado electrónicamente.',
      affectedDocuments: 'Anexo IV - Declaración Responsable y Poderes Notariales',
      status: 'presentado',
      submissionDate: '2026-03-18',
    }
  ]);
  const [incidents, setIncidents] = useState<ProjectIncidentItem[]>([
    {
      id: 'inc-init-1',
      title: 'Baja médica IT de Educador Social y sustitución urgente',
      description: 'Baja médica temporal por incapacidad temporal de 21 días. Sustitución tramitada conforme al Art. 15 Estatuto de los Trabajadores sin alteración del coste empresa.',
      category: 'personal_baja',
      legalSeverity: 'comunicacion_previa',
      budgetImpact: 0,
      status: 'resuelta',
      createdAt: '2026-02-15',
    }
  ]);

  // Auditor States
  const [auditScore, setAuditScore] = useState(94);
  const [auditIssues, setAuditIssues] = useState<CrossValidationIssue[]>([]);

  // Staff Catalog States (Importar de Plantilla de la Entidad)
  const [staffCatalog, setStaffCatalog] = useState<OrgWorker[]>(DEFAULT_STAFF_CATALOG);
  const [isImportStaffModalOpen, setIsImportStaffModalOpen] = useState(false);
  const [selectedStaffIds, setSelectedStaffIds] = useState<string[]>([]);

  useEffect(() => {
    getOrgStaffCatalogAction().then((catalog) => {
      if (Array.isArray(catalog) && catalog.length > 0) {
        setStaffCatalog(catalog);
      }
    });

    getProjectGrantLifecycleAction(projectId).then((res) => {
      if (res.data) {
        if (res.data.stage) setLifecycleStage(res.data.stage);
        if (res.data.versions && res.data.versions.length > 0) setVersions(res.data.versions);
        if (res.data.requirements && res.data.requirements.length > 0) setRequirements(res.data.requirements);
        if (res.data.incidents && res.data.incidents.length > 0) setIncidents(res.data.incidents);
      }
    });
  }, [projectId]);

  // AI Modal States
  const [isAIModalOpen, setIsAIModalOpen] = useState(false);
  const [aiInputText, setAiInputText] = useState('');
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [analysisResult, setAnalysisResult] = useState<ConvocatoriaAnalysisResult | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [isExtractingPdf, setIsExtractingPdf] = useState(false);
  const [pdfUploadedName, setPdfUploadedName] = useState<string | null>(null);

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
                  { id: 'ev-1', tipo: 'firmas', descripcion: 'Fichas de acogida y consentimiento firmadas', estado: 'aportada', archivoNombre: 'fichas_acogida_firmadas.pdf' },
                  { id: 'ev-2', tipo: 'informe', descripcion: 'Informe de valoración diagnóstica individual', estado: 'validada', archivoNombre: 'informe_diagnostico_inicial.pdf' }
                ]
              },
              { 
                id: 'act-1-1-2', 
                description: 'Talleres grupales de competencias digitales y búsqueda activa de empleo', 
                responsible: 'Educador/a Social',
                evidencias: [
                  { id: 'ev-3', tipo: 'firmas', descripcion: 'Listados de asistencia diarios con DNI y firma', estado: 'aportada', archivoNombre: 'hojas_firmas_talleres_m1_m3.pdf' },
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

  // 1.5.1 Nóminas Mensuales Detalladas (Ejecución Real)
  const [activePersonalSubTab, setActivePersonalSubTab] = useState<'prevision' | 'nominas_mensuales'>('prevision');
  const [nominasMensuales, setNominasMensuales] = useState<NonNullable<ProjectWorkspaceData['nominasMensuales']>>(() => fullWorkspace?.nominasMensuales || [
    {
      id: 'nom-1',
      workerId: 'pers-1',
      workerName: 'Elena Gómez',
      role: 'Trabajadora Social / Coordinadora',
      periodoMes: '2026-01',
      salarioBruto: 2100,
      ssPatronal: 659.40,
      costeEmpresaTotal: 2759.40,
      pctImputado: 53.33,
      importeImputado: 1471.68,
      justificantePago: true,
      reciboNominaName: 'nomina_enero_2026_elena.pdf',
      justificantePagoName: 'transferencia_sueldo_enero_elena.pdf',
      rlcDocName: 'rlc_enero_2026_tgss.pdf',
    },
    {
      id: 'nom-2',
      workerId: 'pers-1',
      workerName: 'Elena Gómez',
      role: 'Trabajadora Social / Coordinadora',
      periodoMes: '2026-02',
      salarioBruto: 2100,
      ssPatronal: 659.40,
      costeEmpresaTotal: 2759.40,
      pctImputado: 53.33,
      importeImputado: 1471.68,
      justificantePago: true,
      reciboNominaName: 'nomina_febrero_2026_elena.pdf',
      justificantePagoName: 'transferencia_sueldo_febrero_elena.pdf',
      rlcDocName: 'rlc_febrero_2026_tgss.pdf',
    },
    {
      id: 'nom-3',
      workerId: 'pers-2',
      workerName: 'Carlos Ruiz',
      role: 'Educador Social',
      periodoMes: '2026-01',
      salarioBruto: 1850,
      ssPatronal: 580.90,
      costeEmpresaTotal: 2430.90,
      pctImputado: 50.00,
      importeImputado: 1215.45,
      justificantePago: true,
      reciboNominaName: 'nomina_enero_2026_carlos.pdf',
      justificantePagoName: 'transferencia_sueldo_enero_carlos.pdf',
      rlcDocName: 'rlc_enero_2026_tgss.pdf',
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

  // 1.7 Gastos y Facturas Detalladas con Archivos
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
      facturaFileName: 'factura_089_formacion.pdf',
      justificanteFileName: 'justificante_banco_089.pdf'
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
      facturaFileName: 'factura_alquiler_aulas_t1.pdf',
      justificanteFileName: 'transferencia_alquiler_t1.pdf'
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
      justificantePago: false,
      facturaFileName: 'factura_papeleria_994.pdf'
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

  // 2. FINANCIAL CALCULATIONS
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
    const list: Array<{ id: string; tipo: string; descripcion: string; estado: string; archivoUrl?: string; archivoNombre?: string }> = [];
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

    const missingPayments = gastosFacturas.filter(f => !f.justificantePago);
    if (missingPayments.length > 0) {
      alerts.push({
        type: 'red',
        text: `${missingPayments.length} factura(s) registrada(s) sin justificante bancario de pago adjunto.`
      });
    }

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

    const pendingEv = allEvidencias.filter(e => e.estado === 'pendiente');
    if (pendingEv.length > 0) {
      alerts.push({
        type: 'yellow',
        text: `${pendingEv.length} evidencia(s) documental(es) obligatoria(s) pendientes de incorporar.`
      });
    }

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

  // 3. AI CALL ANALYZER HANDLER (FASE 7)
  const handleWorkspacePdfUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setIsExtractingPdf(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/extract-pdf', {
        method: 'POST',
        body: formData,
      });
      const data = await res.json();
      if (!data.success || !data.text) {
        alert(data.error || 'No se pudo procesar el archivo PDF');
      } else {
        setAiInputText(data.text);
        setPdfUploadedName(`${data.fileName || file.name} (${data.numPages || 1} pág.)`);
      }
    } catch (err: unknown) {
      alert(err instanceof Error ? err.message : 'Error al procesar el archivo');
    } finally {
      setIsExtractingPdf(false);
    }
  };

  const handleAnalyzeConvocatoria = async () => {
    if (!aiInputText.trim()) return;
    setIsAnalyzing(true);
    try {
      const res = await analyzeConvocatoriaAction(aiInputText);
      if (res.success && res.data) {
        setAnalysisResult(res.data);
      } else {
        alert(res.error || 'Error analizando la convocatoria.');
      }
    } catch (err) {
      console.error(err);
      alert('Error inesperado analizando la convocatoria.');
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleApplyAIAnalysis = () => {
    if (!analysisResult) return;
    setSubvencion(prev => ({
      ...prev,
      organismo: analysisResult.organismo || prev.organismo,
      linea: analysisResult.linea || prev.linea,
      importeConcedido: analysisResult.importeMaximo || prev.importeConcedido,
      aportacionPropia: analysisResult.pctCofinanciacionMinima > 0 ? ((analysisResult.importeMaximo * analysisResult.pctCofinanciacionMinima) / 100) : prev.aportacionPropia,
    }));
    setPresupuesto(prev => ({
      ...prev,
      indirectPct: analysisResult.pctCostesIndirectosMax || prev.indirectPct,
      grantAmount: analysisResult.importeMaximo || prev.grantAmount,
    }));
    setIsAIModalOpen(false);
    handleModify();
  };

  // 4. STORAGE FILE UPLOAD HANDLER
  const handleFileUpload = async (
    e: React.ChangeEvent<HTMLInputElement>,
    onUploaded: (fileUrl: string, fileName: string) => void
  ) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      const formData = new FormData();
      formData.append('file', file);
      formData.append('projectId', projectId);
      formData.append('category', 'documentos');

      const res = await uploadProjectDocumentAction(formData);
      if (res.success && res.fileUrl) {
        onUploaded(res.fileUrl, res.fileName || file.name);
        handleModify();
      } else {
        alert(res.error || 'Error al subir el archivo.');
      }
    } catch (err) {
      console.error('Error subiendo archivo:', err);
      alert('Error al subir el archivo adjunto.');
    } finally {
      setIsUploading(false);
      e.target.value = '';
    }
  };

  // 5. ACTIONS
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

  const generateMonthlyPayrollsFromStaff = () => {
    const months = ['2026-01', '2026-02', '2026-03', '2026-04', '2026-05', '2026-06', '2026-07', '2026-08', '2026-09', '2026-10', '2026-11', '2026-12'];
    const generated: typeof nominasMensuales = [];

    personal.forEach(w => {
      const numMonths = Math.min(w.months || 12, 12);
      const ssAmount = Number((w.monthlySalary * (w.ssPct / 100)).toFixed(2));
      const totalCosteEmpresa = Number((w.monthlySalary + ssAmount).toFixed(2));
      const pct = w.maxWeeklyHours > 0 ? (w.weeklyHours / w.maxWeeklyHours) * 100 : 100;
      const imputedAmount = Number(((totalCosteEmpresa * pct) / 100).toFixed(2));

      for (let i = 0; i < numMonths; i++) {
        generated.push({
          id: `nom-${w.id}-${i + 1}`,
          workerId: w.id,
          workerName: w.name,
          role: w.role,
          periodoMes: months[i],
          salarioBruto: w.monthlySalary,
          ssPatronal: ssAmount,
          costeEmpresaTotal: totalCosteEmpresa,
          pctImputado: Number(pct.toFixed(2)),
          importeImputado: imputedAmount,
          justificantePago: false,
        });
      }
    });

    if (generated.length > 0) {
      setNominasMensuales(generated);
      setActivePersonalSubTab('nominas_mensuales');
      setHasChanges(true);
    }
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
        nominasMensuales,
        cronograma,
        convocatoriaAnalisis: analysisResult,
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

  // 4. CROSS-AUDITOR EFFECT
  useEffect(() => {
    runCrossAuditorAction({
      subvencion: {
        organismo: subvencion.organismo,
        importeSolicitado: subvencion.importeSolicitado,
        importeConcedido: subvencion.importeConcedido,
        aportacionPropia: subvencion.aportacionPropia,
        pctCostesIndirectosMax: analysisResult?.pctCostesIndirectosMax || 10,
      },
      diagnostico: {
        beneficiariosDirectos: diagnostico.beneficiariesDirect,
        colectivo: diagnostico.targetPopulation,
      },
      marcoLogico: {
        objetivosEspecificos: marcoLogico.objectives.map(o => ({
          id: o.id,
          actividades: o.results.flatMap(r => r.activities.map(a => ({
            id: a.id,
            name: a.description,
            targetBeneficiaries: diagnostico.beneficiariesDirect,
          }))),
          indicadores: indicadores.map(i => ({
            id: i.id,
            name: i.name,
            target: i.target,
            baseline: i.baseline,
            source: i.source,
          })),
        })),
      },
      personal,
      presupuesto: {
        partidas: presupuesto.partidas.map(p => ({
          id: p.id,
          category: p.category,
          description: p.description,
          costeReal: p.costeReal !== undefined ? p.costeReal : (p.monthlyAmount * p.months),
          workerId: p.workerId,
        })),
        indirectPct: presupuesto.indirectPct,
        grantAmount: presupuesto.grantAmount,
      },
      gastosFacturas,
      requirements,
      incidents,
    }).then(res => {
      setAuditScore(res.score);
      setAuditIssues(res.issues);
    });
  }, [subvencion, diagnostico, marcoLogico, personal, presupuesto, gastosFacturas, requirements, incidents, analysisResult]);

  const handlePhaseChange = async (phase: LifecyclePhase) => {
    setActivePhase(phase);
    if (phase === 'solicitud') {
      setActiveSubTab('convocatoria');
      setLifecycleStage('solicitado');
    } else if (phase === 'subsanacion') {
      setActiveSubTab('requerimientos');
      setLifecycleStage('subsanacion');
    } else if (phase === 'reformulacion') {
      setActiveSubTab('comparador');
      setLifecycleStage('reformulacion');
    } else if (phase === 'ejecucion') {
      setActiveSubTab('nominas');
      setLifecycleStage('en_ejecucion');
    } else if (phase === 'justificacion') {
      setActiveSubTab('auditor_preventivo');
      setLifecycleStage('en_justificacion');
    } else if (phase === 'cierre') {
      setActiveSubTab('resolucion_cierre');
      setLifecycleStage('cerrado');
    }
    setHasChanges(true);
  };

  const handleRequestSnapshot = async (versionType: VersionType, summary: string) => {
    const fullData: ProjectWorkspaceData = {
      diagnostico,
      subvencion,
      marcoLogico,
      indicadores,
      personal,
      presupuesto,
      gastosFacturas,
      cronograma,
      convocatoriaAnalisis: analysisResult,
    };
    const res = await createProjectVersionSnapshotAction(projectId, versionType, summary, fullData as unknown as Record<string, unknown>);
    if (res.success && res.version) {
      setVersions(prev => [...prev.map(v => ({ ...v, isActive: false })), res.version!]);
      alert(`¡Snapshot creado con éxito: Versión ${res.version.versionNumber} (${versionType})!`);
    }
  };

  const handleUpdateRequirements = async (newReqs: RequirementItem[]) => {
    setRequirements(newReqs);
    setHasChanges(true);
    await saveProjectGrantLifecycleAction(projectId, { requirements: newReqs });
  };

  const handleUpdateIncidents = async (newIncs: ProjectIncidentItem[]) => {
    setIncidents(newIncs);
    setHasChanges(true);
    await saveProjectGrantLifecycleAction(projectId, { incidents: newIncs });
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

      {/* 2. PRIMARY LIFECYCLE PHASE NAVIGATION BAR */}
      <GrantLifecycleNav
        currentPhase={activePhase}
        onPhaseChange={handlePhaseChange}
        auditScore={auditScore}
        auditErrorCount={auditIssues.length}
        onOpenAuditor={() => {
          setActivePhase('justificacion');
          setActiveSubTab('auditor_preventivo');
        }}
      />

      {/* 3. CONTEXTUAL SUB-MENU BAR (Renders ONLY sub-tabs belonging to activePhase) */}
      <nav className={styles.tabNav}>
        {activePhase === 'solicitud' && (
          <>
            <button
              type="button"
              onClick={() => setActiveSubTab('convocatoria')}
              className={`${styles.tabBtn} ${activeSubTab === 'convocatoria' ? styles.tabActive : ''}`}
            >
              <Building2 size={15} />
              <span>1.1 Convocatoria & Bases (IA)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('diagnostico')}
              className={`${styles.tabBtn} ${activeSubTab === 'diagnostico' ? styles.tabActive : ''}`}
            >
              <FileText size={15} />
              <span>1.2 Diagnóstico & Colectivo</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('marcoLogico')}
              className={`${styles.tabBtn} ${activeSubTab === 'marcoLogico' ? styles.tabActive : ''}`}
            >
              <Target size={15} />
              <span>1.3 Marco Lógico & Actividades</span>
              <span className={styles.tabBadge}>{marcoLogico.objectives.length} obj</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('personal')}
              className={`${styles.tabBtn} ${activeSubTab === 'personal' ? styles.tabActive : ''}`}
            >
              <Users size={15} />
              <span>1.4 Plantilla & Personal Estimado</span>
              <span className={styles.tabBadge}>{personal.length}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('presupuesto')}
              className={`${styles.tabBtn} ${activeSubTab === 'presupuesto' ? styles.tabActive : ''}`}
            >
              <Calculator size={15} />
              <span>1.5 Presupuesto & Cofinanciación</span>
              <span className={styles.tabBadge}>{formatCurrency(totalPresupuesto)}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('cronograma')}
              className={`${styles.tabBtn} ${activeSubTab === 'cronograma' ? styles.tabActive : ''}`}
            >
              <Calendar size={15} />
              <span>1.6 Cronograma Gantt</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('snapshot_solicitud')}
              className={`${styles.tabBtn} ${activeSubTab === 'snapshot_solicitud' ? styles.tabActive : ''}`}
            >
              <Camera size={15} />
              <span>1.7 Registrar Solicitud (V1)</span>
              <span className={styles.tabBadge}>{versions.filter(v => v.versionType === 'solicitud_presentada').length}</span>
            </button>
          </>
        )}

        {activePhase === 'subsanacion' && (
          <>
            <button
              type="button"
              onClick={() => setActiveSubTab('requerimientos')}
              className={`${styles.tabBtn} ${activeSubTab === 'requerimientos' ? styles.tabActive : ''}`}
            >
              <AlertCircle size={15} />
              <span>2.1 Requerimientos Notificados (10 Días)</span>
              <span className={styles.tabBadge} style={{ background: requirements.some(r => r.status === 'pendiente') ? '#FEE2E2' : '#EAF5FB', color: requirements.some(r => r.status === 'pendiente') ? '#DC2626' : '#0D3A5F' }}>
                {requirements.filter(r => r.status === 'pendiente').length > 0 ? `⚠️ ${requirements.filter(r => r.status === 'pendiente').length}` : `${requirements.length}`}
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('boveda_subsanar')}
              className={`${styles.tabBtn} ${activeSubTab === 'boveda_subsanar' ? styles.tabActive : ''}`}
            >
              <FolderKanban size={15} />
              <span>2.2 Documentos a Subsanar (Bóveda)</span>
            </button>
          </>
        )}

        {activePhase === 'reformulacion' && (
          <>
            <button
              type="button"
              onClick={() => setActiveSubTab('comparador')}
              className={`${styles.tabBtn} ${activeSubTab === 'comparador' ? styles.tabActive : ''}`}
            >
              <Sliders size={15} />
              <span>3.1 Comparador Solicitado vs. Concedido</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('reform_diagnostico')}
              className={`${styles.tabBtn} ${activeSubTab === 'reform_diagnostico' ? styles.tabActive : ''}`}
            >
              <FileText size={15} />
              <span>3.2 Beneficiarios & Diagnóstico</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('reform_marcoLogico')}
              className={`${styles.tabBtn} ${activeSubTab === 'reform_marcoLogico' ? styles.tabActive : ''}`}
            >
              <Target size={15} />
              <span>3.3 Marco Lógico & Actividades</span>
              <span className={styles.tabBadge}>{marcoLogico.objectives.length} obj</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('reform_personal')}
              className={`${styles.tabBtn} ${activeSubTab === 'reform_personal' ? styles.tabActive : ''}`}
            >
              <Users size={15} />
              <span>3.4 Personal & Dedicación</span>
              <span className={styles.tabBadge}>{personal.length}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('reform_presupuesto')}
              className={`${styles.tabBtn} ${activeSubTab === 'reform_presupuesto' ? styles.tabActive : ''}`}
            >
              <Calculator size={15} />
              <span>3.5 Presupuesto Reformulado</span>
              <span className={styles.tabBadge}>{formatCurrency(totalPresupuesto)}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('reform_cronograma')}
              className={`${styles.tabBtn} ${activeSubTab === 'reform_cronograma' ? styles.tabActive : ''}`}
            >
              <Calendar size={15} />
              <span>3.6 Cronograma Reformulado</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('reform_baseline')}
              className={`${styles.tabBtn} ${activeSubTab === 'reform_baseline' ? styles.tabActive : ''}`}
            >
              <Award size={15} />
              <span>3.7 Fijar Baseline Autorizada (V2)</span>
              <span className={styles.tabBadge}>{versions.filter(v => v.versionType === 'baseline_autorizada').length}</span>
            </button>
          </>
        )}

        {activePhase === 'ejecucion' && (
          <>
            <button
              type="button"
              onClick={() => setActiveSubTab('nominas')}
              className={`${styles.tabBtn} ${activeSubTab === 'nominas' ? styles.tabActive : ''}`}
            >
              <Users size={15} />
              <span>4.1 Nóminas Mensuales (Recibos, Pagos SEPA, RLC)</span>
              <span className={styles.tabBadge}>{nominasMensuales.length}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('facturas')}
              className={`${styles.tabBtn} ${activeSubTab === 'facturas' ? styles.tabActive : ''}`}
            >
              <Receipt size={15} />
              <span>4.2 Facturas de Proveedores & Pagos Bancarios</span>
              <span className={styles.tabBadge}>{gastosFacturas.length}</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('actividades_evidencias')}
              className={`${styles.tabBtn} ${activeSubTab === 'actividades_evidencias' ? styles.tabActive : ''}`}
            >
              <CheckCircle2 size={15} />
              <span>4.3 Seguimiento de Actividades & Hojas de Firmas</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('incidencias')}
              className={`${styles.tabBtn} ${activeSubTab === 'incidencias' ? styles.tabActive : ''}`}
            >
              <AlertTriangle size={15} color="#EA580C" />
              <span>4.4 Incidencias, Bajas IT y Modificaciones</span>
              <span className={styles.tabBadge}>{incidents.length}</span>
            </button>
          </>
        )}

        {activePhase === 'justificacion' && (
          <>
            <button
              type="button"
              onClick={() => setActiveSubTab('auditor_preventivo')}
              className={`${styles.tabBtn} ${activeSubTab === 'auditor_preventivo' ? styles.tabActive : ''}`}
            >
              <ShieldCheck size={15} color="#16C7B2" />
              <span>5.1 Auditor de Coherencia Preventivo</span>
              <span className={styles.tabBadge} style={{ background: auditScore >= 85 ? '#DCFCE7' : '#FEE2E2', color: auditScore >= 85 ? '#166534' : '#991B1B' }}>
                {auditScore}/100
              </span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('cuenta_justificativa')}
              className={`${styles.tabBtn} ${activeSubTab === 'cuenta_justificativa' ? styles.tabActive : ''}`}
            >
              <Calculator size={15} />
              <span>5.2 Cuenta Justificativa de Gastos (Liquidación)</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('memoria_tecnica')}
              className={`${styles.tabBtn} ${activeSubTab === 'memoria_tecnica' ? styles.tabActive : ''}`}
            >
              <FileText size={15} />
              <span>5.3 Memoria Técnica y de Actividades Oficial</span>
            </button>
          </>
        )}

        {activePhase === 'cierre' && (
          <>
            <button
              type="button"
              onClick={() => setActiveSubTab('resolucion_cierre')}
              className={`${styles.tabBtn} ${activeSubTab === 'resolucion_cierre' ? styles.tabActive : ''}`}
            >
              <Award size={15} />
              <span>6.1 Resolución de Liquidación Definitiva</span>
            </button>
            <button
              type="button"
              onClick={() => setActiveSubTab('archivo_custodia')}
              className={`${styles.tabBtn} ${activeSubTab === 'archivo_custodia' ? styles.tabActive : ''}`}
            >
              <FolderKanban size={15} />
              <span>6.2 Archivo y Custodia del Expediente (4 Años)</span>
            </button>
          </>
        )}
      </nav>

      {/* 1.1 SUBVENCIÓN Y CONVOCATORIA (FASE 1) */}
      {activePhase === 'solicitud' && activeSubTab === 'convocatoria' && (
        <div className={styles.contentCard}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}><Building2 size={20} color="#2563eb" /> 1. Datos Oficiales de la Subvención y Financiador</h2>
              <p className={styles.sectionSubtitle}>Registra la resolución oficial, importes concedidos, fechas de ejecución y plazos de justificación.</p>
            </div>
            <button
              type="button"
              onClick={() => setIsAIModalOpen(true)}
              className={styles.saveBtn}
              style={{ background: '#7c3aed' }}
            >
              <Bot size={16} /> Analizar Bases con IA Documental
            </button>
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

          {/* SIMULADOR DE COFINANCIACIÓN Y REGLA DE TRES (HERRAMIENTA INTEGRADA) */}
          {(() => {
            const tot = (Number(subvencion.importeConcedido) || 0) + (Number(subvencion.aportacionPropia) || 0);
            const pSub = tot > 0 ? ((Number(subvencion.importeConcedido) || 0) / tot) * 100 : 0;
            const pProp = tot > 0 ? ((Number(subvencion.aportacionPropia) || 0) / tot) * 100 : 0;
            return (
              <div style={{ background: '#f8fafc', border: '1.5px solid #cbd5e1', borderLeft: '5px solid #16c7b2', borderRadius: '12px', padding: '1.25rem 1.5rem', marginTop: '1rem' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '0.75rem', marginBottom: '0.75rem' }}>
                  <div>
                    <h3 style={{ fontSize: '0.95rem', fontWeight: 800, color: '#0d3a5f', margin: 0, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Calculator size={18} color="#16c7b2" /> Análisis Oficial de Cofinanciación y Porcentajes
                    </h3>
                    <p style={{ fontSize: '0.8125rem', color: '#5c7e9b', margin: '0.2rem 0 0' }}>
                      Cálculo de aportación propia y ratio de cofinanciación exigido por la convocatoria.
                    </p>
                  </div>
                  <div style={{ fontSize: '0.875rem', fontWeight: 800, color: '#0d3a5f', background: 'white', padding: '0.4rem 0.8rem', borderRadius: '8px', border: '1px solid #cbd5e1' }}>
                    Presupuesto Total: {formatCurrency(tot)}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '1rem', marginTop: '0.75rem' }}>
                  <div style={{ background: 'white', border: '1px solid #cbd5e1', padding: '0.75rem 1rem', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#009e96', textTransform: 'uppercase' }}>Subvención Concedida</span>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0d3a5f' }}>{formatCurrency(subvencion.importeConcedido)}</div>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#009e96' }}>{pSub.toFixed(1)}% del proyecto</span>
                  </div>
                  <div style={{ background: 'white', border: '1px solid #cbd5e1', padding: '0.75rem 1rem', borderRadius: '8px' }}>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#ff7a3f', textTransform: 'uppercase' }}>Aportación Propia ONG</span>
                    <div style={{ fontSize: '1.25rem', fontWeight: 900, color: '#0d3a5f' }}>{formatCurrency(subvencion.aportacionPropia)}</div>
                    <span style={{ fontSize: '0.8125rem', fontWeight: 700, color: '#ff7a3f' }}>{pProp.toFixed(1)}% cofinanciación</span>
                  </div>
                </div>
              </div>
            );
          })()}
        </div>
      )}

      {/* 1.2 / 3.2: DIAGNÓSTICO Y COLECTIVOS */}
      {((activePhase === 'solicitud' && activeSubTab === 'diagnostico') || (activePhase === 'reformulacion' && activeSubTab === 'reform_diagnostico')) && (
        <div className={styles.contentCard}>
          {activePhase === 'reformulacion' && (
            <div style={{ background: '#EFF6FF', border: '1.5px solid #93C5FD', borderRadius: '10px', padding: '0.85rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Sliders size={20} color="#2563EB" />
              <div>
                <strong style={{ color: '#1E40AF', fontSize: '0.875rem' }}>🔄 Reformulación de Beneficiarios y Diagnóstico (V2)</strong>
                <p style={{ fontSize: '0.75rem', color: '#1E3A8A', margin: '0.15rem 0 0 0' }}>
                  Los datos de la solicitud original están precargados. Puedes reajustar los beneficiarios previstos de forma proporcional a la cuantía concedida ({formatCurrency(subvencion.importeConcedido)}).
                </p>
              </div>
            </div>
          )}
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}><FileText size={20} color="#2563eb" /> {activePhase === 'reformulacion' ? '3.2 Reformulación de Beneficiarios y Diagnóstico' : '2. Diagnóstico de Necesidades y Justificación Técnica'}</h2>
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

      {/* 1.3 / 3.3 / 4.3: MARCO LÓGICO Y EVIDENCIAS */}
      {((activePhase === 'solicitud' && activeSubTab === 'marcoLogico') || 
        (activePhase === 'reformulacion' && activeSubTab === 'reform_marcoLogico') || 
        (activePhase === 'ejecucion' && activeSubTab === 'actividades_evidencias')) && (
        <div className={styles.contentCard}>
          {activePhase === 'reformulacion' && (
            <div style={{ background: '#EFF6FF', border: '1.5px solid #93C5FD', borderRadius: '10px', padding: '0.85rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Sliders size={20} color="#2563EB" />
              <div>
                <strong style={{ color: '#1E40AF', fontSize: '0.875rem' }}>🔄 Reformulación del Marco Lógico y Metas (V2)</strong>
                <p style={{ fontSize: '0.75rem', color: '#1E3A8A', margin: '0.15rem 0 0 0' }}>
                  Los objetivos y actividades solicitadas están cargados. Puedes modificar o redimensionar las metas de las actividades para ajustarlas a la cuantía concedida.
                </p>
              </div>
            </div>
          )}
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}><Target size={20} color="#2563eb" /> {activePhase === 'reformulacion' ? '3.3 Reformulación del Marco Lógico y Metas' : '3. Marco Lógico, Actividades y Evidencias Documentales'}</h2>
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

                  {/* Actividades con Evidencias y Subida de Archivos */}
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
                            <div key={ev.id} style={{ display: 'inline-flex', alignItems: 'center', gap: '0.25rem' }}>
                              <span 
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

                              {ev.archivoNombre ? (
                                <a 
                                  href={ev.archivoUrl || '#'} 
                                  download={ev.archivoNombre}
                                  className={styles.fileAttachedBadge}
                                  title="Descargar documento de evidencia adjunto"
                                >
                                  <Paperclip size={10} /> {ev.archivoNombre.slice(0, 15)}...
                                </a>
                              ) : (
                                <label className={styles.fileUploadLabel} title="Subir PDF / Imagen de la evidencia">
                                  <Upload size={10} /> Subir
                                  <input 
                                    type="file" 
                                    style={{ display: 'none' }} 
                                    onChange={(e) => handleFileUpload(e, (url, name) => {
                                      const newObjs = [...marcoLogico.objectives];
                                      newObjs[oIdx].results[rIdx].activities[aIdx].evidencias![evIdx].archivoUrl = url;
                                      newObjs[oIdx].results[rIdx].activities[aIdx].evidencias![evIdx].archivoNombre = name;
                                      newObjs[oIdx].results[rIdx].activities[aIdx].evidencias![evIdx].estado = 'aportada';
                                      setMarcoLogico({ ...marcoLogico, objectives: newObjs });
                                    })}
                                  />
                                </label>
                              )}
                            </div>
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
                                descripcion: 'Hojas de firmas y asistencia',
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

      {/* 1.4 / 3.4 / 4.1: PERSONAL Y NÓMINAS */}
      {((activePhase === 'solicitud' && activeSubTab === 'personal') || 
        (activePhase === 'reformulacion' && activeSubTab === 'reform_personal') || 
        (activePhase === 'ejecucion' && activeSubTab === 'nominas')) && (
        <div className={styles.contentCard}>
          {activePhase === 'reformulacion' && (
            <div style={{ background: '#EFF6FF', border: '1.5px solid #93C5FD', borderRadius: '10px', padding: '0.85rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Sliders size={20} color="#2563EB" />
              <div>
                <strong style={{ color: '#1E40AF', fontSize: '0.875rem' }}>🔄 Reformulación de Personal y Horas Asignadas (V2)</strong>
                <p style={{ fontSize: '0.75rem', color: '#1E3A8A', margin: '0.15rem 0 0 0' }}>
                  Ajusta las horas semanales o los meses de imputación de los trabajadores a la subvención para adaptarlos a la nueva dotación económica.
                </p>
              </div>
            </div>
          )}
          <datalist id="staff-catalog-datalist">
            {staffCatalog.map(w => (
              <option key={w.id} value={w.name}>
                {w.role} - Bruto: {w.salaryMonthly} €/mes
              </option>
            ))}
          </datalist>

          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}><Users size={20} color="#2563eb" /> {activePhase === 'reformulacion' ? '3.4 Reformulación de Plantilla y Dedicación' : '4. Personal, Plantilla y Nóminas Mensuales'}</h2>
              <p className={styles.sectionSubtitle}>Gestiona la previsión de plantilla asignada y registra los gastos de nóminas mes a mes con sus justificantes de pago bancario y Seguridad Social.</p>
            </div>
            <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
              <button
                type="button"
                onClick={() => {
                  setSelectedStaffIds(staffCatalog.map(w => w.id));
                  setIsImportStaffModalOpen(true);
                }}
                style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.4rem',
                  background: '#0D3A5F',
                  color: 'white',
                  border: 'none',
                  padding: '0.5rem 1rem',
                  borderRadius: '8px',
                  fontSize: '0.8125rem',
                  fontWeight: 800,
                  cursor: 'pointer',
                  boxShadow: '0 2px 8px rgba(13, 58, 95, 0.25)'
                }}
              >
                <Users size={16} color="#16C7B2" /> 👥 Importar de la Plantilla ({staffCatalog.length})
              </button>
              <button
                type="button"
                onClick={syncPersonalToBudget}
                className={styles.exportBtn}
              >
                🔄 Trasladar al Presupuesto
              </button>
            </div>
          </div>

          {/* Sub-tabs selector for Personal */}
          <div style={{ display: 'flex', gap: '0.5rem', marginBottom: '1.25rem', borderBottom: '2px solid #E2E8F0', paddingBottom: '0.5rem', flexWrap: 'wrap' }}>
            <button
              type="button"
              onClick={() => setActivePersonalSubTab('prevision')}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: '8px',
                border: 'none',
                background: activePersonalSubTab === 'prevision' ? '#0D3A5F' : '#EAF5FB',
                color: activePersonalSubTab === 'prevision' ? '#ffffff' : '#0D3A5F',
                fontWeight: 800,
                fontSize: '0.8125rem',
                cursor: 'pointer'
              }}
            >
              👥 4A. Previsión Anual y Plantilla Asignada ({personal.length})
            </button>
            <button
              type="button"
              onClick={() => setActivePersonalSubTab('nominas_mensuales')}
              style={{
                padding: '0.45rem 1rem',
                borderRadius: '8px',
                border: 'none',
                background: activePersonalSubTab === 'nominas_mensuales' ? '#0D3A5F' : '#EAF5FB',
                color: activePersonalSubTab === 'nominas_mensuales' ? '#ffffff' : '#0D3A5F',
                fontWeight: 800,
                fontSize: '0.8125rem',
                cursor: 'pointer'
              }}
            >
              📑 4B. Registro Mensual de Nóminas Ejecutadas ({nominasMensuales.length})
            </button>
          </div>

          {/* 4A: PREVISIÓN ANUAL */}
          {activePersonalSubTab === 'prevision' && (
            <div>
              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th style={{ minWidth: '220px' }}>Nombre del Trabajador/a</th>
                      <th>Categoría / Puesto</th>
                      <th>Bruto / Mes (€)</th>
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
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.35rem' }}>
                              <input
                                type="text"
                                list="staff-catalog-datalist"
                                className={styles.input}
                                placeholder="Nombre o busca en plantilla..."
                                value={worker.name}
                                onChange={e => {
                                  const val = e.target.value;
                                  const matched = staffCatalog.find(w => w.name.toLowerCase() === val.toLowerCase());
                                  const newP = [...personal];
                                  if (matched) {
                                    newP[idx] = {
                                      ...newP[idx],
                                      name: matched.name,
                                      role: matched.role || newP[idx].role,
                                      monthlySalary: matched.salaryMonthly || newP[idx].monthlySalary,
                                      ssPct: matched.ssPct || newP[idx].ssPct,
                                      maxWeeklyHours: matched.maxWeeklyHours || newP[idx].maxWeeklyHours,
                                    };
                                  } else {
                                    newP[idx].name = val;
                                  }
                                  setPersonal(newP);
                                  handleModify();
                                }}
                              />
                              <select
                                style={{
                                  fontSize: '0.75rem',
                                  padding: '0.25rem 0.5rem',
                                  borderRadius: '6px',
                                  border: '1.5px solid #D5ECF8',
                                  background: '#EAF5FB',
                                  color: '#0D3A5F',
                                  fontWeight: 700,
                                  cursor: 'pointer'
                                }}
                                value=""
                                onChange={e => {
                                  const found = staffCatalog.find(w => w.id === e.target.value);
                                  if (found) {
                                    const newP = [...personal];
                                    newP[idx] = {
                                      ...newP[idx],
                                      name: found.name,
                                      role: found.role,
                                      monthlySalary: found.salaryMonthly,
                                      ssPct: found.ssPct || 31.4,
                                      maxWeeklyHours: found.maxWeeklyHours || 37.5,
                                    };
                                    setPersonal(newP);
                                    handleModify();
                                  }
                                }}
                              >
                                <option value="">⚡ Cargar datos de plantilla...</option>
                                {staffCatalog.map(w => (
                                  <option key={w.id} value={w.id}>
                                    {w.name} · {w.role} ({w.salaryMonthly} €/m)
                                  </option>
                                ))}
                              </select>
                            </div>
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
                              step="0.1"
                              className={styles.input}
                              style={{ width: '75px' }}
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

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '1rem', marginTop: '1rem' }}>
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
                  <Plus size={16} /> Añadir Fila Manual
                </button>

                <button
                  type="button"
                  onClick={generateMonthlyPayrollsFromStaff}
                  style={{
                    background: '#0D3A5F',
                    color: 'white',
                    border: 'none',
                    padding: '0.5rem 1rem',
                    borderRadius: '8px',
                    fontSize: '0.8125rem',
                    fontWeight: 800,
                    cursor: 'pointer',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem'
                  }}
                >
                  ⚡ Generar las Nóminas Mensuales desde la Plantilla ({personal.length} trabajadores)
                </button>
              </div>
            </div>
          )}

          {/* 4B: REGISTRO MENSUAL DE NÓMINAS */}
          {activePersonalSubTab === 'nominas_mensuales' && (
            <div>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem', flexWrap: 'wrap', gap: '0.75rem' }}>
                <span style={{ fontSize: '0.875rem', color: '#475569', fontWeight: 600 }}>
                  Registro mensual de nóminas reales, cálculo de coste empresa y archivo de justificantes SEPA y Seguros Sociales.
                </span>

                <button
                  type="button"
                  onClick={() => {
                    const firstW = personal[0];
                    setNominasMensuales([
                      ...nominasMensuales,
                      {
                        id: `nom-${Date.now()}`,
                        workerId: firstW?.id,
                        workerName: firstW?.name || 'Trabajador/a',
                        role: firstW?.role || 'Técnico/a',
                        periodoMes: '2026-01',
                        salarioBruto: firstW?.monthlySalary || 1800,
                        ssPatronal: Number(((firstW?.monthlySalary || 1800) * 0.314).toFixed(2)),
                        costeEmpresaTotal: Number(((firstW?.monthlySalary || 1800) * 1.314).toFixed(2)),
                        pctImputado: 50,
                        importeImputado: Number((((firstW?.monthlySalary || 1800) * 1.314) * 0.5).toFixed(2)),
                        justificantePago: false,
                      }
                    ]);
                    handleModify();
                  }}
                  className={styles.addSmallBtn}
                >
                  <Plus size={14} /> Registrar Nómina Manual
                </button>
              </div>

              <div className={styles.tableWrapper}>
                <table className={styles.table}>
                  <thead>
                    <tr>
                      <th>Trabajador/a</th>
                      <th>Mes</th>
                      <th className={styles.numCol}>Bruto (€)</th>
                      <th className={styles.numCol}>SS Patronal (€)</th>
                      <th className={styles.numCol}>Coste Empresa</th>
                      <th className={styles.numCol}>% Imp.</th>
                      <th className={styles.numCol}>Imputado Subvención</th>
                      <th>Documentación y Comprobantes</th>
                      <th></th>
                    </tr>
                  </thead>
                  <tbody>
                    {nominasMensuales.length === 0 ? (
                      <tr>
                        <td colSpan={9} style={{ textAlign: 'center', padding: '2rem', color: '#64748B' }}>
                          No hay nóminas mensuales registradas. Pulsa en <em>"Generar las Nóminas Mensuales desde la Plantilla"</em> para precargar los 12 meses.
                        </td>
                      </tr>
                    ) : (
                      nominasMensuales.map((nom, nIdx) => (
                        <tr key={nom.id}>
                          <td>
                            <strong>{nom.workerName}</strong>
                            <div style={{ fontSize: '0.75rem', color: '#64748B' }}>{nom.role}</div>
                          </td>
                          <td>
                            <input
                              type="month"
                              className={styles.input}
                              style={{ padding: '0.2rem 0.4rem', fontSize: '0.75rem', width: '130px' }}
                              value={nom.periodoMes}
                              onChange={e => {
                                const updated = [...nominasMensuales];
                                updated[nIdx].periodoMes = e.target.value;
                                setNominasMensuales(updated);
                                handleModify();
                              }}
                            />
                          </td>
                          <td className={styles.numCol}>
                            <input
                              type="number"
                              className={styles.input}
                              style={{ width: '80px', padding: '0.2rem 0.4rem', fontSize: '0.75rem' }}
                              value={nom.salarioBruto}
                              onChange={e => {
                                const bruto = parseFloat(e.target.value) || 0;
                                const updated = [...nominasMensuales];
                                updated[nIdx].salarioBruto = bruto;
                                updated[nIdx].costeEmpresaTotal = Number((bruto + updated[nIdx].ssPatronal).toFixed(2));
                                updated[nIdx].importeImputado = Number(((updated[nIdx].costeEmpresaTotal * updated[nIdx].pctImputado) / 100).toFixed(2));
                                setNominasMensuales(updated);
                                handleModify();
                              }}
                            />
                          </td>
                          <td className={styles.numCol}>
                            <input
                              type="number"
                              className={styles.input}
                              style={{ width: '75px', padding: '0.2rem 0.4rem', fontSize: '0.75rem' }}
                              value={nom.ssPatronal}
                              onChange={e => {
                                const ss = parseFloat(e.target.value) || 0;
                                const updated = [...nominasMensuales];
                                updated[nIdx].ssPatronal = ss;
                                updated[nIdx].costeEmpresaTotal = Number((updated[nIdx].salarioBruto + ss).toFixed(2));
                                updated[nIdx].importeImputado = Number(((updated[nIdx].costeEmpresaTotal * updated[nIdx].pctImputado) / 100).toFixed(2));
                                setNominasMensuales(updated);
                                handleModify();
                              }}
                            />
                          </td>
                          <td className={styles.numCol}>
                            <strong>{formatCurrency(nom.costeEmpresaTotal)}</strong>
                          </td>
                          <td className={styles.numCol}>
                            <input
                              type="number"
                              className={styles.input}
                              style={{ width: '60px', padding: '0.2rem 0.4rem', fontSize: '0.75rem' }}
                              value={nom.pctImputado}
                              onChange={e => {
                                const pct = parseFloat(e.target.value) || 0;
                                const updated = [...nominasMensuales];
                                updated[nIdx].pctImputado = pct;
                                updated[nIdx].importeImputado = Number(((updated[nIdx].costeEmpresaTotal * pct) / 100).toFixed(2));
                                setNominasMensuales(updated);
                                handleModify();
                              }}
                            />
                          </td>
                          <td className={styles.numCol} style={{ fontWeight: 800, color: '#0D3A5F' }}>
                            {formatCurrency(nom.importeImputado)}
                          </td>
                          <td>
                            <div style={{ display: 'flex', gap: '0.35rem', flexWrap: 'wrap', alignItems: 'center' }}>
                              {/* 1. Recibo de Nómina */}
                              {nom.reciboNominaName ? (
                                <span className={styles.fileAttachedBadge}>📄 Nómina</span>
                              ) : (
                                <label className={styles.fileUploadLabel}>
                                  <Upload size={11} /> Nómina PDF
                                  <input
                                    type="file"
                                    accept=".pdf"
                                    style={{ display: 'none' }}
                                    onChange={e => handleFileUpload(e, (url, name) => {
                                      const updated = [...nominasMensuales];
                                      updated[nIdx].reciboNominaUrl = url;
                                      updated[nIdx].reciboNominaName = name;
                                      setNominasMensuales(updated);
                                    })}
                                  />
                                </label>
                              )}

                              {/* 2. Justificante de Pago Salario SEPA */}
                              {nom.justificantePagoName ? (
                                <span className={styles.fileAttachedBadge} style={{ background: '#DCFCE7', color: '#166534', borderColor: '#86EFAC' }}>🏦 Pago SEPA</span>
                              ) : (
                                <label className={styles.fileUploadLabel}>
                                  <Upload size={11} /> Pago Banco
                                  <input
                                    type="file"
                                    accept=".pdf"
                                    style={{ display: 'none' }}
                                    onChange={e => handleFileUpload(e, (url, name) => {
                                      const updated = [...nominasMensuales];
                                      updated[nIdx].justificantePagoUrl = url;
                                      updated[nIdx].justificantePagoName = name;
                                      updated[nIdx].justificantePago = true;
                                      setNominasMensuales(updated);
                                    })}
                                  />
                                </label>
                              )}

                              {/* 3. Documento RLC / RNT */}
                              {nom.rlcDocName ? (
                                <span className={styles.fileAttachedBadge} style={{ background: '#E0E7FF', color: '#3730A3', borderColor: '#A5B4FC' }}>📑 RLC/RNT</span>
                              ) : (
                                <label className={styles.fileUploadLabel}>
                                  <Upload size={11} /> RLC SS
                                  <input
                                    type="file"
                                    accept=".pdf"
                                    style={{ display: 'none' }}
                                    onChange={e => handleFileUpload(e, (url, name) => {
                                      const updated = [...nominasMensuales];
                                      updated[nIdx].rlcDocUrl = url;
                                      updated[nIdx].rlcDocName = name;
                                      setNominasMensuales(updated);
                                    })}
                                  />
                                </label>
                              )}
                            </div>
                          </td>
                          <td>
                            <button
                              type="button"
                              onClick={() => {
                                setNominasMensuales(nominasMensuales.filter(n => n.id !== nom.id));
                                handleModify();
                              }}
                              className={styles.deleteIconBtn}
                            >
                              <Trash2 size={15} />
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      {/* 1.5 / 3.5: PRESUPUESTO Y COFINANCIACIÓN */}
      {((activePhase === 'solicitud' && activeSubTab === 'presupuesto') || (activePhase === 'reformulacion' && activeSubTab === 'reform_presupuesto')) && (
        <div className={styles.contentCard}>
          {activePhase === 'reformulacion' && (
            <div style={{ background: '#EFF6FF', border: '1.5px solid #93C5FD', borderRadius: '10px', padding: '0.85rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Sliders size={20} color="#2563EB" />
              <div>
                <strong style={{ color: '#1E40AF', fontSize: '0.875rem' }}>🔄 Reformulación Presupuestaria por Partidas (V2)</strong>
                <p style={{ fontSize: '0.75rem', color: '#1E3A8A', margin: '0.15rem 0 0 0' }}>
                  Presupuesto Solicitado: <strong>{formatCurrency(subvencion.importeSolicitado || totalPresupuesto)}</strong> | Subvención Concedida: <strong>{formatCurrency(subvencion.importeConcedido)}</strong>. Reajusta los importes de cada partida para cuadrar exactamente el presupuesto reformulado.
                </p>
              </div>
            </div>
          )}
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}><Calculator size={20} color="#2563eb" /> {activePhase === 'reformulacion' ? '3.5 Reformulación del Presupuesto por Partidas' : '5. Presupuesto Desglosado y Desviaciones'}</h2>
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

      {/* 4.2: GASTOS Y FACTURAS (FASE 4) */}
      {activePhase === 'ejecucion' && activeSubTab === 'facturas' && (
        <div className={styles.contentCard}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}><Receipt size={20} color="#2563eb" /> 6. Relación Clasificada de Gastos, Facturas y Justificantes</h2>
              <p className={styles.sectionSubtitle}>Registra cada factura, su porcentaje de imputación a esta subvención y adjunta los comprobantes bancarios.</p>
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
                  <th>% Imp.</th>
                  <th className={styles.numCol}>Imputado Subvención</th>
                  <th style={{ textAlign: 'center' }}>Adjunto Factura</th>
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
                      {fac.facturaFileName ? (
                        <a 
                          href={fac.facturaFileUrl || '#'} 
                          download={fac.facturaFileName}
                          className={styles.fileAttachedBadge}
                          title="Descargar Factura PDF"
                        >
                          <Paperclip size={11} /> {fac.facturaFileName.slice(0, 10)}...
                        </a>
                      ) : (
                        <label className={styles.fileUploadLabel}>
                          <Upload size={11} /> Factura
                          <input 
                            type="file" 
                            style={{ display: 'none' }}
                            onChange={(e) => handleFileUpload(e, (url, name) => {
                              const newF = [...gastosFacturas];
                              newF[fIdx].facturaFileUrl = url;
                              newF[fIdx].facturaFileName = name;
                              setGastosFacturas(newF);
                            })}
                          />
                        </label>
                      )}
                    </td>
                    <td style={{ textAlign: 'center' }}>
                      <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem' }}>
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
                          title={fac.justificantePago ? 'Pago Verificado' : 'Pendiente de Justificante'}
                        />
                        {fac.justificanteFileName ? (
                          <a 
                            href={fac.justificanteFileUrl || '#'} 
                            download={fac.justificanteFileName}
                            className={styles.fileAttachedBadge}
                            style={{ background: '#dcfce7', color: '#15803d', borderColor: '#86efac' }}
                            title="Descargar Justificante de Pago"
                          >
                            <Paperclip size={10} /> OK
                          </a>
                        ) : (
                          <label className={styles.fileUploadLabel} title="Subir justificante de pago bancario">
                            <Upload size={10} /> Pago
                            <input 
                              type="file" 
                              style={{ display: 'none' }}
                              onChange={(e) => handleFileUpload(e, (url, name) => {
                                const newF = [...gastosFacturas];
                                newF[fIdx].justificanteFileUrl = url;
                                newF[fIdx].justificanteFileName = name;
                                newF[fIdx].justificantePago = true;
                                setGastosFacturas(newF);
                              })}
                            />
                          </label>
                        )}
                      </div>
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

      {/* 1.6 / 3.6: CRONOGRAMA GANTT */}
      {((activePhase === 'solicitud' && activeSubTab === 'cronograma') || (activePhase === 'reformulacion' && activeSubTab === 'reform_cronograma')) && (
        <div className={styles.contentCard}>
          {activePhase === 'reformulacion' && (
            <div style={{ background: '#EFF6FF', border: '1.5px solid #93C5FD', borderRadius: '10px', padding: '0.85rem 1.25rem', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Sliders size={20} color="#2563EB" />
              <div>
                <strong style={{ color: '#1E40AF', fontSize: '0.875rem' }}>🔄 Reformulación del Cronograma Gantt (V2)</strong>
                <p style={{ fontSize: '0.75rem', color: '#1E3A8A', margin: '0.15rem 0 0 0' }}>
                  Reajusta los meses de inicio y fin de las actividades si el periodo de ejecución concedido se ha modificado.
                </p>
              </div>
            </div>
          )}
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}><Calendar size={20} color="#2563eb" /> {activePhase === 'reformulacion' ? '3.6 Reformulación del Cronograma Temporal' : '7. Cronograma de Ejecución Temporal (Diagrama Gantt)'}</h2>
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

      {/* 1.7 / 2.1 / 3.1 / 3.7: TRAMITACIÓN, SNAPSHOTS Y REFORMULACIÓN */}
      {((activePhase === 'solicitud' && activeSubTab === 'snapshot_solicitud') || 
        (activePhase === 'subsanacion' && activeSubTab === 'requerimientos') || 
        (activePhase === 'reformulacion' && (activeSubTab === 'comparador' || activeSubTab === 'reform_baseline'))) && (
        <TramitacionTab
          versions={versions}
          requirements={requirements}
          onRequestSnapshot={handleRequestSnapshot}
          onUpdateRequirements={handleUpdateRequirements}
          solicitadoAmount={subvencion.importeSolicitado || 0}
          concedidoAmount={subvencion.importeConcedido || 0}
          totalPresupuesto={totalPresupuesto}
          beneficiariosDirectos={diagnostico.beneficiariesDirect || 0}
          activeViewMode={activePhase === 'subsanacion' ? 'subsanaciones' : activePhase === 'reformulacion' ? (activeSubTab === 'reform_baseline' ? 'versiones' : 'reformulacion') : 'versiones'}
          formatCurrency={formatCurrency}
        />
      )}

      {/* 2.2: DOCUMENTOS DESDE BÓVEDA PARA SUBSANACIÓN */}
      {activePhase === 'subsanacion' && activeSubTab === 'boveda_subsanar' && (
        <div className={styles.contentCard}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}><FolderKanban size={20} color="#2563eb" /> 2.2 Bóveda de Documentos Institucionales</h2>
              <p className={styles.sectionSubtitle}>Selecciona y descarga los documentos oficiales de la entidad para adjuntarlos a tu escrito de subsanación.</p>
            </div>
            <Link
              href="/dashboard/documentos"
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.4rem',
                background: '#0D3A5F',
                color: 'white',
                padding: '0.45rem 0.95rem',
                borderRadius: '8px',
                fontSize: '0.8125rem',
                fontWeight: 700,
                textDecoration: 'none'
              }}
            >
              <ExternalLink size={14} /> Ir a la Bóveda General
            </Link>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '1rem' }}>
            <div style={{ background: '#F8FAFC', border: '1.5px solid #CBD5E1', borderRadius: '10px', padding: '1rem' }}>
              <strong style={{ color: '#0D3A5F', fontSize: '0.875rem' }}>📄 Poderes y Representación Legal</strong>
              <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.35rem 0 0.75rem 0' }}>Escritura notarial de apoderamiento y DNI del representante legal.</p>
              <span style={{ fontSize: '0.6875rem', background: '#DCFCE7', color: '#166534', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 800 }}>✓ En Vigor</span>
            </div>
            <div style={{ background: '#F8FAFC', border: '1.5px solid #CBD5E1', borderRadius: '10px', padding: '1rem' }}>
              <strong style={{ color: '#0D3A5F', fontSize: '0.875rem' }}>📑 Certificado AEAT (Hacienda)</strong>
              <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.35rem 0 0.75rem 0' }}>Certificado positivo de estar al corriente de obligaciones tributarias.</p>
              <span style={{ fontSize: '0.6875rem', background: '#DCFCE7', color: '#166534', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 800 }}>✓ En Vigor (Vence 2026-09-01)</span>
            </div>
            <div style={{ background: '#F8FAFC', border: '1.5px solid #CBD5E1', borderRadius: '10px', padding: '1rem' }}>
              <strong style={{ color: '#0D3A5F', fontSize: '0.875rem' }}>📑 Certificado TGSS (Seguridad Social)</strong>
              <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.35rem 0 0.75rem 0' }}>Certificado positivo de no tener deudas con la Seguridad Social.</p>
              <span style={{ fontSize: '0.6875rem', background: '#DCFCE7', color: '#166534', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 800 }}>✓ En Vigor (Vence 2026-09-01)</span>
            </div>
            <div style={{ background: '#F8FAFC', border: '1.5px solid #CBD5E1', borderRadius: '10px', padding: '1rem' }}>
              <strong style={{ color: '#0D3A5F', fontSize: '0.875rem' }}>🏛️ Estatutos e Inscripción Registral</strong>
              <p style={{ fontSize: '0.75rem', color: '#64748B', margin: '0.35rem 0 0.75rem 0' }}>Estatutos registrados y certificado de inscripción en el Registro de Asociaciones / Fundaciones.</p>
              <span style={{ fontSize: '0.6875rem', background: '#DCFCE7', color: '#166534', padding: '0.15rem 0.5rem', borderRadius: '4px', fontWeight: 800 }}>✓ En Vigor</span>
            </div>
          </div>
        </div>
      )}

      {/* 4.4: GESTOR DE INCIDENCIAS Y MODIFICACIONES */}
      {activePhase === 'ejecucion' && activeSubTab === 'incidencias' && (
        <IncidenciasTab
          incidents={incidents}
          onUpdateIncidents={handleUpdateIncidents}
          formatCurrency={formatCurrency}
        />
      )}

      {/* 5.1 / 5.2 / 5.3: AUDITORÍA DE COHERENCIA Y JUSTIFICACIÓN OFICIAL */}
      {activePhase === 'justificacion' && (
        <AuditoriaTab
          auditScore={auditScore}
          auditIssues={auditIssues}
          projectName={diagnostico.projectName || 'Expediente de Subvención'}
          subvencion={subvencion}
          diagnostico={{
            colectivo: diagnostico.targetPopulation,
            justificacion: diagnostico.justification,
            beneficiariosDirectos: diagnostico.beneficiariesDirect,
            localizacion: diagnostico.location,
          }}
          marcoLogico={{
            objetivoGeneral: marcoLogico.proposito || marcoLogico.fin,
            objetivosEspecificos: marcoLogico.objectives.map((o) => ({
              id: o.id,
              name: o.description,
              actividades: o.results.flatMap(r => r.activities.map(a => ({
                id: a.id,
                name: a.description,
                targetBeneficiaries: diagnostico.beneficiariesDirect,
                startMonth: 1,
                endMonth: cronograma.durationMonths || 12,
              }))),
              indicadores: indicadores.map(i => ({
                id: i.id,
                name: i.name,
                target: i.target,
                baseline: i.baseline,
                source: i.source,
              })),
            })),
          }}
          personal={personal}
          presupuesto={{
            ...presupuesto,
            partidas: presupuesto.partidas.map(p => ({
              id: p.id,
              category: p.category,
              description: p.description,
              costeReal: p.costeReal !== undefined ? p.costeReal : (p.monthlyAmount * p.months),
            }))
          }}
          gastosFacturas={gastosFacturas}
          nominasMensuales={nominasMensuales}
          formatCurrency={formatCurrency}
        />
      )}

      {/* 6.1 / 6.2: CIERRE Y LIQUIDACIÓN DEFINITIVA */}
      {activePhase === 'cierre' && (
        <div className={styles.contentCard}>
          <div className={styles.sectionHeader}>
            <div>
              <h2 className={styles.sectionTitle}><CheckCircle2 size={20} color="#16a34a" /> 6. Cierre, Liquidación Definitiva y Archivo Legal</h2>
              <p className={styles.sectionSubtitle}>Registro de la resolución de liquidación emitida por el órgano concedente y protocolo de custodia durante el plazo legal de prescripción (4 años, Art. 39 Ley General de Subvenciones).</p>
            </div>
            <span style={{ background: '#DCFCE7', color: '#166534', padding: '0.4rem 0.85rem', borderRadius: '8px', fontWeight: 800, fontSize: '0.8125rem', border: '1px solid #86EFAC' }}>
              ✓ Expediente Conforme y Liquidado
            </span>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', marginBottom: '1.5rem' }}>
            <div style={{ background: '#F8FAFC', border: '1.5px solid #CBD5E1', borderRadius: '10px', padding: '1rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Resolución de Cierre</span>
              <input
                type="text"
                className={styles.input}
                style={{ marginTop: '0.4rem' }}
                value={cierreData.resolucionNum}
                onChange={e => { setCierreData({ ...cierreData, resolucionNum: e.target.value }); handleModify(); }}
              />
            </div>
            <div style={{ background: '#F8FAFC', border: '1.5px solid #CBD5E1', borderRadius: '10px', padding: '1rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Fecha de Liquidación</span>
              <input
                type="date"
                className={styles.input}
                style={{ marginTop: '0.4rem' }}
                value={cierreData.fechaResolucion}
                onChange={e => { setCierreData({ ...cierreData, fechaResolucion: e.target.value }); handleModify(); }}
              />
            </div>
            <div style={{ background: '#F8FAFC', border: '1.5px solid #CBD5E1', borderRadius: '10px', padding: '1rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Importe Liquidado</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#0D3A5F', marginTop: '0.4rem' }}>
                {formatCurrency(subvencion.importeConcedido || 0)}
              </div>
            </div>
            <div style={{ background: '#F8FAFC', border: '1.5px solid #CBD5E1', borderRadius: '10px', padding: '1rem' }}>
              <span style={{ fontSize: '0.75rem', color: '#64748B', fontWeight: 700, textTransform: 'uppercase' }}>Saldo / Reintegro</span>
              <div style={{ fontSize: '1.25rem', fontWeight: 800, color: '#166534', marginTop: '0.4rem' }}>
                0,00 € (0% Reintegro)
              </div>
            </div>
          </div>

          <div style={{ background: '#F0FDFA', border: '1.5px solid #99F6E4', borderRadius: '10px', padding: '1.25rem', marginBottom: '1.25rem' }}>
            <h3 style={{ margin: '0 0 0.5rem 0', color: '#0F766E', fontSize: '0.9375rem', fontWeight: 800, display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
              <FolderKanban size={18} color="#0D9488" /> Protocolo de Custodia Legal Digitalizada (2026 - 2030)
            </h3>
            <p style={{ fontSize: '0.8125rem', color: '#115E59', margin: '0 0 0.75rem 0' }}>
              Conforme a la Ley 38/2003, la entidad debe conservar todos los originales y justificantes bancarios durante 4 años ante posibles auditorías del Tribunal de Cuentas o Intervención General.
            </p>
            <div style={{ display: 'flex', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span style={{ background: 'white', border: '1px solid #99F6E4', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, color: '#0F766E' }}>
                ✓ {versions.length} Snapshots Inmutables Archivados
              </span>
              <span style={{ background: 'white', border: '1px solid #99F6E4', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, color: '#0F766E' }}>
                ✓ {nominasMensuales.length} Nóminas y Transferencias SEPA
              </span>
              <span style={{ background: 'white', border: '1px solid #99F6E4', padding: '0.35rem 0.75rem', borderRadius: '6px', fontSize: '0.75rem', fontWeight: 700, color: '#0F766E' }}>
                ✓ {gastosFacturas.length} Facturas con Justificante Bancario
              </span>
            </div>
          </div>
        </div>
      )}

      {/* 4. MODAL: AI CONVOCATORIA ANALYZER (FASE 7) */}
      {isAIModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent}>
            <div className={styles.modalHeader}>
              <h3 className={styles.modalTitle}>
                <Bot size={22} color="#7c3aed" /> Analizador de Bases y Convocatorias con IA Documental
              </h3>
              <button 
                type="button" 
                onClick={() => setIsAIModalOpen(false)} 
                className={styles.modalCloseBtn}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              {!analysisResult ? (
                <>
                  <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                    Sube el archivo <strong>PDF de las bases o convocatoria</strong> o pega el texto directamente.
                    El auditor de IA extraerá con máxima trazabilidad los límites presupuestarios, gastos permitidos, conceptos no subvencionables y plazos legales.
                  </p>

                  {/* ZONA DE SUBIDA DE PDF */}
                  <div style={{
                    border: '2px dashed #c4b5fd',
                    background: '#f5f3ff',
                    borderRadius: '12px',
                    padding: '1.25rem',
                    textAlign: 'center',
                    display: 'flex',
                    flexDirection: 'column',
                    alignItems: 'center',
                    gap: '0.5rem',
                    marginTop: '0.5rem'
                  }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: '#6b21a8', fontWeight: 700, fontSize: '0.9375rem' }}>
                      <Upload size={20} color="#7c3aed" />
                      <span>Subir Documento PDF de las Bases Oficiales / BOE</span>
                    </div>
                    <p style={{ margin: 0, fontSize: '0.8125rem', color: '#7c3aed' }}>
                      Extrae automáticamente las reglas de justificación, límites de costes indirectos y cofinanciación desde el archivo oficial.
                    </p>

                    <label style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '0.4rem',
                      background: '#7c3aed',
                      color: 'white',
                      padding: '0.5rem 1.25rem',
                      borderRadius: '8px',
                      fontSize: '0.875rem',
                      fontWeight: 700,
                      cursor: isExtractingPdf ? 'not-allowed' : 'pointer',
                      marginTop: '0.25rem',
                      boxShadow: '0 2px 8px rgba(124, 58, 237, 0.25)'
                    }}>
                      {isExtractingPdf ? (
                        <>
                          <Bot size={16} /> Extrayendo texto del PDF...
                        </>
                      ) : (
                        <>
                          <Paperclip size={16} /> Seleccionar Archivo PDF
                        </>
                      )}
                      <input
                        type="file"
                        accept=".pdf,application/pdf"
                        onChange={handleWorkspacePdfUpload}
                        disabled={isExtractingPdf}
                        style={{ display: 'none' }}
                      />
                    </label>

                    {pdfUploadedName && (
                      <div style={{
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.4rem',
                        background: '#dcfce7',
                        color: '#166534',
                        padding: '0.35rem 0.75rem',
                        borderRadius: '6px',
                        fontSize: '0.8125rem',
                        fontWeight: 700,
                        marginTop: '0.25rem',
                        border: '1px solid #86efac'
                      }}>
                        <CheckCircle2 size={16} color="#16a34a" />
                        PDF cargado: {pdfUploadedName}
                      </div>
                    )}
                  </div>

                  <textarea
                    rows={6}
                    className={styles.textarea}
                    placeholder="El texto del PDF aparecerá aquí, o puedes pegar directamente el fragmento del Boletín Oficial (BOE, BOJA, BOCM, etc.)..."
                    value={aiInputText}
                    onChange={e => setAiInputText(e.target.value)}
                  />
                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem' }}>
                    <button
                      type="button"
                      onClick={() => setIsAIModalOpen(false)}
                      className={styles.exportBtn}
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={handleAnalyzeConvocatoria}
                      disabled={isAnalyzing || aiInputText.trim().length < 20}
                      className={styles.saveBtn}
                      style={{ background: '#7c3aed' }}
                    >
                      {isAnalyzing ? 'Analizando Documento...' : 'Auditar y Extraer Reglas'}
                    </button>
                  </div>
                </>
              ) : (
                <div className={styles.aiAnalysisResultCard}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                    <div>
                      <strong style={{ fontSize: '1rem', color: '#1e1b4b' }}>{analysisResult.linea}</strong>
                      <div style={{ fontSize: '0.8125rem', color: '#64748b' }}>{analysisResult.organismo}</div>
                    </div>
                    <span className={styles.aiCitationTag} style={{ background: '#dcfce7', color: '#166534' }}>
                      Confianza: {analysisResult.confianzaAnalisis}
                    </span>
                  </div>

                  <p style={{ fontSize: '0.875rem', color: '#334155', background: '#f1f5f9', padding: '0.75rem', borderRadius: '8px', margin: 0 }}>
                    {analysisResult.resumenEjecutivo}
                  </p>

                  <div className={styles.formGrid3}>
                    <div style={{ background: 'white', padding: '0.65rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '0.6875rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Importe Máximo</span>
                      <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#1e3a8a' }}>{formatCurrency(analysisResult.importeMaximo)}</div>
                    </div>
                    <div style={{ background: 'white', padding: '0.65rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '0.6875rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Costes Indirectos Máx.</span>
                      <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#2563eb' }}>{analysisResult.pctCostesIndirectosMax}%</div>
                    </div>
                    <div style={{ background: 'white', padding: '0.65rem', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                      <span style={{ fontSize: '0.6875rem', color: '#64748b', textTransform: 'uppercase', fontWeight: 700 }}>Cofinanciación Mín.</span>
                      <div style={{ fontSize: '1.125rem', fontWeight: 800, color: '#16a34a' }}>{analysisResult.pctCofinanciacionMinima}%</div>
                    </div>
                  </div>

                  {/* Gastos Subvencionables con Citas */}
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#166534', textTransform: 'uppercase' }}>
                      ✅ Gastos Subvencionables y Citas Legales:
                    </span>
                    <div className={styles.aiRuleList} style={{ marginTop: '0.35rem' }}>
                      {analysisResult.gastosElegibles.map((g, idx) => (
                        <div key={idx} className={styles.aiRuleItem}>
                          <div>
                            <strong>{g.concepto}</strong> {g.limite && <span style={{ color: '#64748b' }}>({g.limite})</span>}
                          </div>
                          <span className={styles.aiCitationTag}>{g.citaArticulo}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Gastos NO Subvencionables con Citas */}
                  <div>
                    <span style={{ fontSize: '0.75rem', fontWeight: 700, color: '#991b1b', textTransform: 'uppercase' }}>
                      ❌ Gastos Excluidos / No Elegibles:
                    </span>
                    <div className={styles.aiRuleList} style={{ marginTop: '0.35rem' }}>
                      {analysisResult.gastosNoElegibles.map((g, idx) => (
                        <div key={idx} className={styles.aiRuleItem} style={{ background: '#fff5f5' }}>
                          <div>
                            <strong>{g.concepto}</strong> — <span style={{ color: '#7f1d1d' }}>{g.motivo}</span>
                          </div>
                          <span className={styles.aiCitationTag} style={{ background: '#fee2e2', color: '#991b1b' }}>{g.citaArticulo}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '0.5rem' }}>
                    <button
                      type="button"
                      onClick={() => setAnalysisResult(null)}
                      className={styles.exportBtn}
                    >
                      Analizar Otro Texto
                    </button>
                    <button
                      type="button"
                      onClick={handleApplyAIAnalysis}
                      className={styles.saveBtn}
                    >
                      <Check size={16} /> Aplicar Reglas al Expediente
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* MODAL DE IMPORTACIÓN DE PLANTILLA DE LA ENTIDAD */}
      {isImportStaffModalOpen && (
        <div className={styles.modalOverlay}>
          <div className={styles.modalContent} style={{ maxWidth: '750px' }}>
            <div className={styles.modalHeader} style={{ background: '#0D3A5F', color: 'white' }}>
              <h3 style={{ margin: 0, display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '1.125rem', color: 'white' }}>
                <Users size={22} color="#16C7B2" /> Importar Personal de la Plantilla de la Entidad
              </h3>
              <button 
                type="button" 
                onClick={() => setIsImportStaffModalOpen(false)} 
                className={styles.modalCloseBtn}
                style={{ color: 'white' }}
              >
                <X size={20} />
              </button>
            </div>

            <div className={styles.modalBody}>
              <p style={{ margin: 0, fontSize: '0.875rem', color: 'var(--text-secondary)' }}>
                Selecciona los trabajadores registrados en tu entidad para importarlos automáticamente con su <strong>categoría profesional, salario bruto real y jornada legal</strong>. Podrás editar cualquier importe en el proyecto según la dedicación concedida.
              </p>

              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', margin: '0.5rem 0' }}>
                <span style={{ fontSize: '0.8125rem', color: '#5C7E9B', fontWeight: 600 }}>
                  Plantilla disponible: <strong>{staffCatalog.length}</strong> trabajadores registrados
                </span>
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setSelectedStaffIds(staffCatalog.map(w => w.id))}
                    style={{
                      background: '#EAF5FB',
                      border: '1px solid #D5ECF8',
                      color: '#0D3A5F',
                      padding: '0.25rem 0.6rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Seleccionar Todos
                  </button>
                  <button
                    type="button"
                    onClick={() => setSelectedStaffIds([])}
                    style={{
                      background: '#f1f5f9',
                      border: '1px solid #e2e8f0',
                      color: '#64748b',
                      padding: '0.25rem 0.6rem',
                      borderRadius: '6px',
                      fontSize: '0.75rem',
                      fontWeight: 700,
                      cursor: 'pointer'
                    }}
                  >
                    Desmarcar Todos
                  </button>
                </div>
              </div>

              <div style={{ maxHeight: '320px', overflowY: 'auto', border: '1.5px solid #D5ECF8', borderRadius: '10px' }}>
                <table className={styles.table} style={{ margin: 0 }}>
                  <thead style={{ position: 'sticky', top: 0, zIndex: 5, background: '#F8FAFC' }}>
                    <tr>
                      <th style={{ width: '40px' }}></th>
                      <th>Trabajador/a</th>
                      <th>Puesto / Categoría</th>
                      <th className={styles.numCol}>Salario Bruto / Mes</th>
                      <th>Jornada Legal</th>
                    </tr>
                  </thead>
                  <tbody>
                    {staffCatalog.map((worker) => {
                      const isSelected = selectedStaffIds.includes(worker.id);
                      return (
                        <tr 
                          key={worker.id} 
                          style={{ background: isSelected ? '#F0FDFA' : 'inherit', cursor: 'pointer' }}
                          onClick={() => {
                            setSelectedStaffIds(prev => 
                              prev.includes(worker.id) 
                                ? prev.filter(id => id !== worker.id) 
                                : [...prev, worker.id]
                            );
                          }}
                        >
                          <td>
                            <input
                              type="checkbox"
                              checked={isSelected}
                              onChange={() => {}}
                              style={{ cursor: 'pointer', width: '16px', height: '16px' }}
                            />
                          </td>
                          <td>
                            <strong style={{ color: '#0D3A5F' }}>{worker.name}</strong>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.8125rem', color: '#475569' }}>
                              {worker.role} {worker.category ? `(${worker.category})` : ''}
                            </span>
                          </td>
                          <td className={styles.numCol}>
                            <span style={{
                              background: '#EAF5FB',
                              color: '#009E96',
                              fontWeight: 800,
                              padding: '0.2rem 0.5rem',
                              borderRadius: '6px',
                              fontSize: '0.8125rem'
                            }}>
                              {worker.salaryMonthly.toLocaleString('es-ES')} €/mes
                            </span>
                          </td>
                          <td>
                            <span style={{ fontSize: '0.75rem', color: '#64748b' }}>
                              {worker.maxWeeklyHours || 37.5} h/semana
                            </span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>

              <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1rem' }}>
                <button
                  type="button"
                  onClick={() => setIsImportStaffModalOpen(false)}
                  className={styles.exportBtn}
                >
                  Cancelar
                </button>
                <button
                  type="button"
                  disabled={selectedStaffIds.length === 0}
                  onClick={() => {
                    const toImport = staffCatalog.filter(w => selectedStaffIds.includes(w.id));
                    const newEntries = toImport.map(w => ({
                      id: `pers-${Date.now()}-${w.id}`,
                      name: w.name,
                      role: w.role || 'Técnico de Proyecto',
                      contractType: 'Indefinido',
                      monthlySalary: w.salaryMonthly || 1800,
                      ssPct: w.ssPct || 31.4,
                      weeklyHours: w.maxWeeklyHours || 37.5,
                      maxWeeklyHours: w.maxWeeklyHours || 37.5,
                      months: 12,
                    }));
                    setPersonal(prev => [...prev, ...newEntries]);
                    setIsImportStaffModalOpen(false);
                    setSelectedStaffIds([]);
                    handleModify();
                  }}
                  className={styles.saveBtn}
                  style={{ background: '#0D3A5F', color: 'white' }}
                >
                  <UserCheck size={16} color="#16C7B2" /> Importar {selectedStaffIds.length} Trabajador/es al Proyecto
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default ProjectWorkspace;
