'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export interface ProjectWorkspaceData {
  diagnostico: {
    projectName: string;
    organization: string;
    callName: string;
    targetPopulation: string;
    beneficiariesDirect: number;
    beneficiariesIndirect: number;
    location: string;
    justification: string;
    diagnosticText: string;
  };
  subvencion: {
    organismo: string;
    linea: string;
    expedienteNum: string;
    importeSolicitado: number;
    importeConcedido: number;
    aportacionPropia: number;
    fechaInicio: string;
    fechaFin: string;
    fechaLimiteJustificacion: string;
    estadoSubvencion: 'solicitud' | 'concedida' | 'ejecucion' | 'justificacion' | 'cerrada';
  };
  marcoLogico: {
    fin: string;
    proposito: string;
    objectives: Array<{
      id: string;
      description: string;
      indicators: string;
      sources: string;
      assumptions: string;
      results: Array<{
        id: string;
        description: string;
        indicators: string;
        sources: string;
        assumptions: string;
        activities: Array<{
          id: string;
          description: string;
          responsible: string;
          evidencias?: Array<{
            id: string;
            tipo: 'firmas' | 'fotos' | 'informe' | 'encuesta' | 'otro';
            descripcion: string;
            estado: 'pendiente' | 'aportada' | 'validada';
            archivoUrl?: string;
            archivoNombre?: string;
          }>;
        }>;
      }>;
    }>;
  };
  indicadores: Array<{
    id: string;
    name: string;
    unit: string;
    baseline: number;
    target: number;
    current: number;
    source: string;
  }>;
  personalEstimado?: Array<{
    id: string;
    category: string;
    role: string;
    monthlySalary: number;
    ssPct: number;
    weeklyHours: number;
    maxWeeklyHours: number;
    months: number;
  }>;
  personal: Array<{
    id: string;
    workerId?: string;
    name: string;
    role: string;
    contractType: string;
    monthlySalary: number;
    ssPct: number;
    weeklyHours: number;
    maxWeeklyHours: number;
    months: number;
  }>;
  presupuesto: {
    partidas: Array<{
      id: string;
      category: string;
      description: string;
      monthlyAmount: number;
      months: number;
      costeReal?: number;
      workerId?: string;
    }>;
    indirectPct: number;
    grantAmount: number;
  };
  gastosFacturas: Array<{
    id: string;
    proveedor: string;
    nif: string;
    numFactura: string;
    fecha: string;
    concepto: string;
    totalFactura: number;
    pctImputado: number;
    importeImputado: number;
    partidaId?: string;
    partidaName?: string;
    justificantePago: boolean;
    fechaPago?: string;
    metodoPago?: string;
    refBancaria?: string;
    facturaFileUrl?: string;
    facturaFileName?: string;
    justificanteFileUrl?: string;
    justificanteFileName?: string;
  }>;
  nominasMensuales?: Array<{
    id: string;
    workerId?: string;
    workerName: string;
    role: string;
    periodoMes: string;
    salarioBruto: number;
    ssPatronal: number;
    costeEmpresaTotal: number;
    pctImputado: number;
    importeImputado: number;
    justificantePago: boolean;
    reciboNominaUrl?: string;
    reciboNominaName?: string;
    justificantePagoUrl?: string;
    justificantePagoName?: string;
    rlcDocUrl?: string;
    rlcDocName?: string;
  }>;
  convocatoriaAnalisis?: unknown;
  cronograma: {
    durationMonths: number;
    activities: Array<{
      id: string;
      description: string;
      responsible: string;
      startMonth: number;
      endMonth: number;
    }>;
  };
}

export async function saveProjectWorkspaceAction(projectId: string, data: ProjectWorkspaceData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Usuario no autenticado');
  }

  // 1. Update project basic info in projects table
  const { error: projError } = await supabase
    .from('projects')
    .update({
      name: data.diagnostico.projectName || 'Proyecto sin título',
      description: data.diagnostico.justification || '',
      updated_at: new Date().toISOString(),
    })
    .eq('id', projectId)
    .eq('user_id', user.id);

  if (projError) {
    console.error('Error updating project base info:', projError);
  }

  // 2. Save individual tool records in project_tools table so all existing queries and views remain compatible
  const toolRecords: Array<{ project_id: string; tool_slug: string; data: unknown; updated_at: string }> = [
    {
      project_id: projectId,
      tool_slug: 'diagnostico',
      data: data.diagnostico,
      updated_at: new Date().toISOString(),
    },
    {
      project_id: projectId,
      tool_slug: 'marco-logico',
      data: data.marcoLogico,
      updated_at: new Date().toISOString(),
    },
    {
      project_id: projectId,
      tool_slug: 'indicadores-impacto',
      data: { indicadores: data.indicadores },
      updated_at: new Date().toISOString(),
    },
    {
      project_id: projectId,
      tool_slug: 'personal-proyecto',
      data: { workers: data.personal },
      updated_at: new Date().toISOString(),
    },
    {
      project_id: projectId,
      tool_slug: 'costes-proyecto',
      data: data.presupuesto,
      updated_at: new Date().toISOString(),
    },
    {
      project_id: projectId,
      tool_slug: 'cronograma',
      data: data.cronograma,
      updated_at: new Date().toISOString(),
    },
    {
      project_id: projectId,
      tool_slug: 'cronograma-actividades',
      data: data.cronograma,
      updated_at: new Date().toISOString(),
    },
    {
      project_id: projectId,
      tool_slug: 'project-workspace-full',
      data: data,
      updated_at: new Date().toISOString(),
    }
  ];

  for (const record of toolRecords) {
    const { data: existing } = await supabase
      .from('project_tools')
      .select('id')
      .eq('project_id', record.project_id)
      .eq('tool_slug', record.tool_slug)
      .maybeSingle();

    let upsertErr;
    if (existing) {
      const res = await supabase
        .from('project_tools')
        .update({ data: record.data, updated_at: record.updated_at })
        .eq('id', existing.id);
      upsertErr = res.error;
    } else {
      const res = await supabase
        .from('project_tools')
        .insert(record);
      upsertErr = res.error;
    }
    
    if (upsertErr) {
      console.error('Error upserting tool record:', record.tool_slug, upsertErr);
      throw new Error(`Error BD guardando ${record.tool_slug}: ${upsertErr.message}`);
    }
  }

  // 3. Sincronizar bidireccionalmente la asignación de personal hacia la Matriz de Imputación y Catálogo de la entidad
  try {
    const { isWorkerMatch, DEFAULT_STAFF_CATALOG } = await import('@/config/staff');
    const { getOrgStaffCatalogAction, saveOrgStaffCatalogAction } = await import('@/app/actions/personal');
    const catalogWorkers = await getOrgStaffCatalogAction();
    const baseCatalog = Array.isArray(catalogWorkers) && catalogWorkers.length > 0 ? [...catalogWorkers] : [...DEFAULT_STAFF_CATALOG];

    const updatedCatalog = baseCatalog.map(cw => {
      const assignedInProject = (data.personal || []).find(p => isWorkerMatch(cw, p));

      const currentAllocations = Array.isArray(cw.allocations) ? [...cw.allocations] : [];
      const allocIdx = currentAllocations.findIndex(a => a.projectId === projectId);

      if (assignedInProject && assignedInProject.weeklyHours > 0) {
        if (allocIdx >= 0) {
          currentAllocations[allocIdx] = {
            ...currentAllocations[allocIdx],
            projectName: data.diagnostico?.projectName || currentAllocations[allocIdx].projectName,
            weeklyHours: assignedInProject.weeklyHours,
            months: assignedInProject.months || 12,
          };
        } else {
          currentAllocations.push({
            id: `alloc-${cw.id}-${projectId}`,
            projectId: projectId,
            projectName: data.diagnostico?.projectName || 'Proyecto',
            weeklyHours: assignedInProject.weeklyHours,
            months: assignedInProject.months || 12,
          });
        }
      } else if (allocIdx >= 0) {
        currentAllocations[allocIdx] = {
          ...currentAllocations[allocIdx],
          weeklyHours: 0,
        };
      }

      return {
        ...cw,
        role: assignedInProject?.role || cw.role,
        salaryMonthly: assignedInProject?.monthlySalary || cw.salaryMonthly,
        ssPct: assignedInProject?.ssPct || cw.ssPct,
        maxWeeklyHours: assignedInProject?.maxWeeklyHours || cw.maxWeeklyHours,
        allocations: currentAllocations,
      };
    });

    // Añadir cualquier nuevo trabajador que se haya creado en el proyecto y no existiese en el catálogo
    for (const p of (data.personal || [])) {
      if (p.name && p.name.trim() && !updatedCatalog.some(cw => isWorkerMatch(cw, p))) {
        const newWorkerId = p.workerId || p.id || `w-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
        updatedCatalog.push({
          id: newWorkerId,
          name: p.name.trim(),
          role: p.role || 'Técnico/a de Proyecto',
          category: 'Técnico/a de Proyecto',
          contractType: p.contractType || 'Temporal',
          salaryMonthly: p.monthlySalary || 1850,
          pagas: 12,
          ssPct: p.ssPct || 31.4,
          maxWeeklyHours: p.maxWeeklyHours || 37.5,
          allocations: [
            {
              id: `alloc-${newWorkerId}-${projectId}`,
              projectId: projectId,
              projectName: data.diagnostico?.projectName || 'Proyecto',
              weeklyHours: p.weeklyHours || 0,
              months: p.months || 12,
            }
          ]
        });
      }
    }

    // Guardar el catálogo central actualizado en la entidad
    await saveOrgStaffCatalogAction(updatedCatalog);
  } catch (syncErr) {
    console.error('Error sincronizando personal con matriz general:', syncErr);
  }

  revalidatePath('/dashboard/matriz-imputacion');
  revalidatePath('/dashboard/personal');
  revalidatePath(`/dashboard/proyectos/${projectId}`);
  revalidatePath('/dashboard/proyectos/[id]', 'page');

  return { success: true, savedAt: new Date().toISOString() };
}

export async function getFullProjectWorkspaceData(projectId: string) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Usuario no autenticado');
  }

  const { data: project, error: projError } = await supabase
    .from('projects')
    .select('*')
    .eq('id', projectId)
    .eq('user_id', user.id)
    .single();

  if (projError || !project) {
    return null;
  }

  const { data: tools } = await supabase
    .from('project_tools')
    .select('tool_slug, data')
    .eq('project_id', projectId);

  const toolsMap = new Map((tools || []).map(t => [t.tool_slug, t.data]));

  // Also check if org staff catalog or general personal matrix exists to provide assigned staff
  const { data: staffCatalogRecord } = await supabase
    .from('project_tools')
    .select('data')
    .eq('tool_slug', 'org-staff-catalog')
    .order('updated_at', { ascending: false })
    .limit(1)
    .maybeSingle();

  const { data: matrixRecord } = await supabase
    .from('project_tools')
    .select('data')
    .eq('project_id', '00000000-0000-0000-0000-000000000000')
    .eq('tool_slug', 'matriz-personal-general')
    .maybeSingle();

  return {
    project,
    toolsMap: Object.fromEntries(toolsMap),
    staffCatalog: staffCatalogRecord?.data?.workers || null,
    generalMatrix: matrixRecord?.data || null,
  };
}
