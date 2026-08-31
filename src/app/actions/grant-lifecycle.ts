'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { saveToolData, getToolData } from '@/app/actions/tools';
import type { 
  GrantLifecycleStage,
  FundingCall,
  ProjectVersion,
  RequirementItem,
  ProjectIncidentItem,
  DeadlineItem,
  OrganizationDocument,
  CrossValidationIssue,
  VersionType
} from '@/types/grant-lifecycle';

/**
 * 1. Obtiene la estructura completa del Ciclo de Vida del Proyecto
 */
export async function getProjectGrantLifecycleAction(projectId: string) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { error: 'No autenticado', data: null };
    }

    // Buscar en project_tools con slug 'grant-lifecycle-state'
    const toolData = await getToolData(projectId, 'grant-lifecycle-state') as Record<string, unknown> | null;

    // Buscar versiones
    const versionsData = await getToolData(projectId, 'project-versions') as { versions?: ProjectVersion[] } | null;

    // Buscar requerimientos
    const requirementsData = await getToolData(projectId, 'project-requirements') as { requirements?: RequirementItem[] } | null;

    // Buscar incidencias
    const incidentsData = await getToolData(projectId, 'project-incidents') as { incidents?: ProjectIncidentItem[] } | null;

    return {
      error: null,
      data: {
        stage: (toolData?.stage as GrantLifecycleStage) || 'borrador',
        fundingCall: (toolData?.fundingCall as FundingCall) || null,
        versions: versionsData?.versions || [],
        requirements: requirementsData?.requirements || [],
        incidents: incidentsData?.incidents || [],
      }
    };
  } catch (err) {
    console.error('Error fetching grant lifecycle:', err);
    return { error: 'Error cargando el ciclo de vida', data: null };
  }
}

/**
 * 2. Guarda el estado del Ciclo de Vida del Proyecto
 */
export async function saveProjectGrantLifecycleAction(
  projectId: string,
  payload: {
    stage?: GrantLifecycleStage;
    fundingCall?: FundingCall;
    requirements?: RequirementItem[];
    incidents?: ProjectIncidentItem[];
  }
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'No autenticado' };
    }

    if (payload.stage || payload.fundingCall) {
      await saveToolData(projectId, 'grant-lifecycle-state', {
        stage: payload.stage,
        fundingCall: payload.fundingCall,
        updatedAt: new Date().toISOString(),
      });
    }

    if (payload.requirements) {
      await saveToolData(projectId, 'project-requirements', {
        requirements: payload.requirements,
        updatedAt: new Date().toISOString(),
      });
    }

    if (payload.incidents) {
      await saveToolData(projectId, 'project-incidents', {
        incidents: payload.incidents,
        updatedAt: new Date().toISOString(),
      });
    }

    revalidatePath(`/dashboard/proyectos/${projectId}`);
    return { success: true, error: null };
  } catch (err: unknown) {
    console.error('Error guardando ciclo de vida:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error inesperado guardando ciclo de vida.',
    };
  }
}

/**
 * 3. Crea una Instantánea / Snapshot Inmutable de Versión del Proyecto
 */
export async function createProjectVersionSnapshotAction(
  projectId: string,
  versionType: VersionType,
  changeSummary: string,
  projectFullData: Record<string, unknown>
) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'No autenticado' };
    }

    const currentVersions = await getToolData(projectId, 'project-versions') as { versions?: ProjectVersion[] } | null;
    const existingList = currentVersions?.versions || [];

    const newVersion: ProjectVersion = {
      id: `ver-${Date.now()}`,
      versionNumber: existingList.length + 1,
      versionType,
      isActive: true,
      createdAt: new Date().toISOString(),
      changeSummary,
      snapshotData: JSON.parse(JSON.stringify(projectFullData)),
    };

    // Marcar las anteriores como no activas
    const updatedList = existingList.map(v => ({ ...v, isActive: false })).concat(newVersion);

    await saveToolData(projectId, 'project-versions', {
      versions: updatedList,
      updatedAt: new Date().toISOString(),
    });

    revalidatePath(`/dashboard/proyectos/${projectId}`);
    return { success: true, version: newVersion, error: null };
  } catch (err: unknown) {
    console.error('Error creando snapshot de version:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error creando snapshot.',
    };
  }
}

/**
 * 4. MOTOR DE AUDITORÍA Y COHERENCIA CRUZADA (Cross-Auditor)
 */
export async function runCrossAuditorAction(
  workspaceData: {
    subvencion?: {
      organismo?: string;
      importeSolicitado?: number;
      importeConcedido?: number;
      aportacionPropia?: number;
      fechaInicio?: string;
      fechaFin?: string;
      pctCostesIndirectosMax?: number;
    };
    diagnostico?: {
      beneficiariosDirectos?: number;
      colectivo?: string;
    };
    marcoLogico?: {
      objetivosEspecificos?: Array<{
        id: string;
        actividades?: Array<{ id: string; name: string; targetBeneficiaries?: number; startMonth?: number; endMonth?: number }>;
        indicadores?: Array<{ id: string; name: string; target?: number; baseline?: number; source?: string }>;
      }>;
    };
    personal?: Array<{
      id: string;
      name: string;
      role: string;
      monthlySalary: number;
      weeklyHours: number;
      maxWeeklyHours: number;
      months: number;
    }>;
    presupuesto?: {
      partidas?: Array<{
        id: string;
        category: string;
        description: string;
        costeReal: number;
        workerId?: string;
        activityId?: string;
      }>;
      indirectPct?: number;
      grantAmount?: number;
    };
    gastosFacturas?: Array<{
      id: string;
      proveedor: string;
      numFactura: string;
      fecha: string;
      totalFactura: number;
      importeImputado: number;
      pctImputado: number;
      justificantePago: boolean;
      facturaFileName?: string;
      justificanteFileName?: string;
      partidaId?: string;
    }>;
    requirements?: RequirementItem[];
    incidents?: ProjectIncidentItem[];
  }
): Promise<{ issues: CrossValidationIssue[]; score: number }> {
  const issues: CrossValidationIssue[] = [];

  const ml = workspaceData.marcoLogico?.objetivosEspecificos || [];
  const pres = workspaceData.presupuesto?.partidas || [];
  const pers = workspaceData.personal || [];
  const fact = workspaceData.gastosFacturas || [];
  const sub = workspaceData.subvencion || {};
  const diag = workspaceData.diagnostico || {};

  // 1. REGLA: Actividades sin Indicadores
  ml.forEach((oe, oeIdx) => {
    (oe.actividades || []).forEach((act) => {
      const hasInd = (oe.indicadores || []).length > 0;
      if (!hasInd) {
        issues.push({
          id: `iss-act-no-ind-${act.id}`,
          severity: 'warning',
          category: 'logica',
          title: `Actividad sin indicador asociado`,
          message: `La actividad "${act.name}" (OE ${oeIdx + 1}) no cuenta con ningún indicador de logro definido en su objetivo.`,
          suggestedAction: 'Añade un indicador de realización o resultado en el Objetivo Específico correspondiente.',
        });
      }
    });
  });

  // 2. REGLA: Objetivos sin Actividades
  ml.forEach((oe, oeIdx) => {
    if (!oe.actividades || oe.actividades.length === 0) {
      issues.push({
        id: `iss-oe-no-act-${oe.id}`,
        severity: 'error',
        category: 'logica',
        title: `Objetivo Específico sin actividades`,
        message: `El Objetivo Específico ${oeIdx + 1} no tiene actividades planificadas para alcanzarlo.`,
        suggestedAction: 'Define al menos una actividad formativa o de intervención.',
      });
    }
  });

  // 3. REGLA: Incoherencia de Beneficiarios (Diagnóstico vs. Actividades)
  const totalBeneficiariosActividades = ml.reduce((acc, oe) => {
    return acc + (oe.actividades || []).reduce((sum, a) => sum + (a.targetBeneficiaries || 0), 0);
  }, 0);
  const diagBeneficiarios = diag.beneficiariosDirectos || 0;

  if (diagBeneficiarios > 0 && totalBeneficiariosActividades > 0 && totalBeneficiariosActividades < diagBeneficiarios * 0.5) {
    issues.push({
      id: 'iss-beneficiarios-mismatch',
      severity: 'warning',
      category: 'logica',
      title: 'Incoherencia en número de personas beneficiarias',
      message: `El diagnóstico prevé ${diagBeneficiarios} beneficiarios directos, pero la suma de personas en las actividades suma únicamente ${totalBeneficiariosActividades}.`,
      suggestedAction: 'Revisa el alcance de beneficiarios previsto en cada actividad.',
    });
  }

  // 4. REGLA: Partidas de Personal sin Horas Asignadas
  pers.forEach((p) => {
    if (p.weeklyHours === 0) {
      issues.push({
        id: `iss-pers-zero-hours-${p.id}`,
        severity: 'error',
        category: 'economica',
        title: `Trabajador/a con 0 horas imputadas`,
        message: `${p.name || p.role} está registrado en la plantilla del proyecto con 0 horas semanales.`,
        suggestedAction: 'Asigna una jornada semanal mayor a 0 horas o elimina el trabajador.',
      });
    }
    if (p.weeklyHours > p.maxWeeklyHours) {
      issues.push({
        id: `iss-pers-over-hours-${p.id}`,
        severity: 'error',
        category: 'economica',
        title: `Sobreimputación ilegal de jornada laboral`,
        message: `${p.name || p.role} tiene ${p.weeklyHours}h/sem asignadas superando la jornada legal de ${p.maxWeeklyHours}h.`,
        citationRule: 'Art. 34 Estatuto de los Trabajadores y Bases Reguladoras',
        suggestedAction: 'Reduce las horas imputadas para no exceder la jornada legal.',
      });
    }
  });

  // 5. REGLA: Límite de Costes Indirectos
  const indirectPctMax = sub.pctCostesIndirectosMax || 10;
  const currentIndirectPct = workspaceData.presupuesto?.indirectPct || 0;
  if (currentIndirectPct > indirectPctMax) {
    issues.push({
      id: 'iss-indirect-exceeded',
      severity: 'error',
      category: 'economica',
      title: `Exceso en porcentaje de Costes Indirectos`,
      message: `El porcentaje de costes indirectos aplicado (${currentIndirectPct}%) supera el límite máximo fijado por la convocatoria (${indirectPctMax}%).`,
      citationRule: 'Bases Reguladoras - Régimen de Gastos Subvencionables',
      suggestedAction: `Reduce los costes indirectos al ${indirectPctMax}% o inferior.`,
    });
  }

  // 6. REGLA DOCUMENTAL: Facturas sin Justificante de Pago Bancario
  fact.forEach((f) => {
    if (!f.justificantePago || !f.justificanteFileName) {
      issues.push({
        id: `iss-fac-no-pay-${f.id}`,
        severity: 'warning',
        category: 'documental',
        title: `Factura sin justificante bancario de pago`,
        message: `La factura "${f.numFactura}" de ${f.proveedor} (${f.importeImputado} €) no tiene adjunto el comprobante de transferencia o pago bancario.`,
        citationRule: 'Art. 30 Ley 38/2003 General de Subvenciones',
        suggestedAction: 'Sube el extracto bancario SEPA o resguardo de transferencia.',
      });
    }
  });

  // 7. REGLA ADMINISTRATIVA: Requerimientos y Subsanaciones Próximos a Vencer
  (workspaceData.requirements || []).forEach((req) => {
    if (req.status === 'pendiente') {
      const now = new Date();
      const deadline = new Date(req.deadlineDate);
      const diffDays = Math.ceil((deadline.getTime() - now.getTime()) / (1000 * 60 * 60 * 24));

      if (diffDays <= 5 && diffDays >= 0) {
        issues.push({
          id: `iss-req-deadline-${req.id}`,
          severity: 'error',
          category: 'administrativa',
          title: `¡Urgente! Requerimiento de subsanación próximo a vencer`,
          message: `El requerimiento de ${req.funderOrganism} vence en ${diffDays} días (${req.deadlineDate}). Documentación: ${req.affectedDocuments}.`,
          citationRule: 'Art. 68 Ley 39/2015 del Procedimiento Administrativo Común',
          suggestedAction: 'Prepara y registra los documentos solicitados antes de la fecha límite.',
        });
      }
    }
  });

  // Puntuación de Coherencia (0 a 100)
  const errorCount = issues.filter(i => i.severity === 'error').length;
  const warningCount = issues.filter(i => i.severity === 'warning').length;
  const rawScore = 100 - (errorCount * 18) - (warningCount * 6);
  const score = Math.max(0, Math.min(100, rawScore));

  return { issues, score };
}

/**
 * 5. Obtiene la Bóveda Documental de la Entidad
 */
export async function getOrganizationDocumentsAction(): Promise<OrganizationDocument[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const toolData = await getToolData('00000000-0000-0000-0000-000000000000', 'org-document-vault') as { documents?: OrganizationDocument[] } | null;
    return toolData?.documents || [
      {
        id: 'doc-1',
        title: 'Estatutos Oficiales Registrados de la Entidad',
        category: 'estatutos',
        fileUrl: '#',
        fileName: 'estatutos_registrados_asociacion.pdf',
        fileSize: 2450000,
        isValid: true,
        createdAt: '2026-01-10',
      },
      {
        id: 'doc-2',
        title: 'Tarjeta de Identificación Fiscal (CIF Definitivo)',
        category: 'cif',
        fileUrl: '#',
        fileName: 'cif_definitivo_entidad.pdf',
        fileSize: 450000,
        isValid: true,
        createdAt: '2026-01-10',
      },
      {
        id: 'doc-3',
        title: 'Certificado de Estar al Corriente con la AEAT',
        category: 'certificado_aeat',
        fileUrl: '#',
        fileName: 'certificado_corriente_aeat_2026.pdf',
        fileSize: 320000,
        expirationDate: '2026-09-30',
        isValid: true,
        createdAt: '2026-03-01',
      },
      {
        id: 'doc-4',
        title: 'Certificado de Estar al Corriente con la Seguridad Social (TGSS)',
        category: 'certificado_tgss',
        fileUrl: '#',
        fileName: 'certificado_corriente_tgss_2026.pdf',
        fileSize: 310000,
        expirationDate: '2026-09-30',
        isValid: true,
        createdAt: '2026-03-01',
      }
    ];
  } catch (err) {
    console.error('Error fetching org documents:', err);
    return [];
  }
}

/**
 * 6. Guarda la Bóveda Documental de la Entidad
 */
export async function saveOrganizationDocumentsAction(documents: OrganizationDocument[]) {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'No autenticado' };

    await saveToolData('00000000-0000-0000-0000-000000000000', 'org-document-vault', {
      documents,
      updatedAt: new Date().toISOString(),
    });

    revalidatePath('/dashboard/documentos');
    return { success: true, error: null };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error guardando documentos',
    };
  }
}

/**
 * 7. Obtiene el Calendario Unificado de Plazos y Alertas de la Entidad
 */
export async function getGlobalDeadlinesAction(): Promise<DeadlineItem[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return [];

    const toolData = await getToolData('00000000-0000-0000-0000-000000000000', 'global-deadlines') as { deadlines?: DeadlineItem[] } | null;
    return toolData?.deadlines || [
      {
        id: 'dead-1',
        title: 'Cierre Convocatoria IRPF 2026 (Línea Inserción)',
        deadlineDate: '2026-04-30',
        deadlineType: 'solicitud',
        isCompleted: false,
        reminderDays: 5,
      },
      {
        id: 'dead-2',
        title: 'Subsanación Requerimiento Anexo III (Ayuntamiento)',
        deadlineDate: '2026-05-15',
        deadlineType: 'subsanacion',
        isCompleted: false,
        reminderDays: 3,
      },
      {
        id: 'dead-3',
        title: 'Plazo Límite de Justificación Final EXP-2025/089',
        deadlineDate: '2026-06-30',
        deadlineType: 'justificacion_final',
        isCompleted: false,
        reminderDays: 15,
      }
    ];
  } catch (err) {
    console.error('Error fetching global deadlines:', err);
    return [];
  }
}

/**
 * 8. Guarda el Calendario Unificado de Plazos y Alertas de la Entidad
 */
export async function saveGlobalDeadlinesAction(deadlines: DeadlineItem[]): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) return { success: false, error: 'No autenticado' };

    await saveToolData('00000000-0000-0000-0000-000000000000', 'global-deadlines', {
      deadlines,
      updatedAt: new Date().toISOString(),
    });

    revalidatePath('/dashboard/plazos');
    revalidatePath('/dashboard');
    return { success: true, error: null };
  } catch (err: unknown) {
    console.error('Error saving global deadlines:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error guardando plazos',
    };
  }
}

