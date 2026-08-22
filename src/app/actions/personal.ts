'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getToolData, saveToolData } from '@/app/actions/tools';
import { getProjects } from '@/app/actions/projects';
import { 
  DEFAULT_STAFF_CATALOG, 
  type Worker, 
  type PersonalMatrixData, 
  type ProjectAllocation 
} from '@/config/staff';

export type { Worker, PersonalMatrixData, ProjectAllocation };

/**
 * 1. Obtiene el catálogo de trabajadores de la plantilla de la entidad
 */
export async function getOrgStaffCatalogAction(): Promise<Worker[]> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return DEFAULT_STAFF_CATALOG;
    }

    const { data: toolRecord } = await supabase
      .from('project_tools')
      .select('data')
      .eq('tool_slug', 'org-staff-catalog')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (
      toolRecord?.data &&
      Array.isArray((toolRecord.data as { workers?: Worker[] }).workers) &&
      (toolRecord.data as { workers?: Worker[] }).workers!.length > 0
    ) {
      return (toolRecord.data as { workers?: Worker[] }).workers!;
    }

    // Fallback: comprobar si existe en 'gestion-personal'
    const { data: fallbackRecord } = await supabase
      .from('project_tools')
      .select('data')
      .eq('tool_slug', 'gestion-personal')
      .order('updated_at', { ascending: false })
      .limit(1)
      .maybeSingle();

    if (
      fallbackRecord?.data &&
      Array.isArray((fallbackRecord.data as PersonalMatrixData).workers) &&
      (fallbackRecord.data as PersonalMatrixData).workers!.length > 0
    ) {
      return (fallbackRecord.data as PersonalMatrixData).workers!;
    }

    return DEFAULT_STAFF_CATALOG;
  } catch (err) {
    console.error('Error fetching staff catalog:', err);
    return DEFAULT_STAFF_CATALOG;
  }
}

/**
 * 2. Guarda el catálogo de trabajadores de la plantilla central de la entidad
 */
export async function saveOrgStaffCatalogAction(workers: Worker[]): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();

    if (!user) {
      return { success: false, error: 'No estás autenticado.' };
    }

    // Guardar en project_tools con tool_slug = 'org-staff-catalog'
    const { data: existingProjects } = await supabase
      .from('projects')
      .select('id')
      .order('created_at', { ascending: true })
      .limit(1);

    const targetProjectId = existingProjects?.[0]?.id || '00000000-0000-0000-0000-000000000000';

    await saveToolData(targetProjectId, 'org-staff-catalog', { workers, updatedAt: new Date().toISOString() });

    revalidatePath('/dashboard/personal');
    revalidatePath('/dashboard/matriz-imputacion');
    revalidatePath('/dashboard/proyectos/[id]', 'page');

    return { success: true, error: null };
  } catch (err: unknown) {
    console.error('Error guardando catálogo de personal:', err);
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error inesperado guardando personal.',
    };
  }
}

/**
 * 3. Obtiene la información para la Matriz de Imputación Multiproyecto
 */
export async function getGlobalImputationMatrixAction(): Promise<{
  workers: Worker[];
  projects: Array<{ id: string; name: string }>;
}> {
  try {
    const rawWorkers = await getOrgStaffCatalogAction();
    const projectsList = await getProjects();
    const formattedProjects = projectsList.map(p => ({ id: p.id, name: p.name }));
    const supabase = await createClient();

    // Consultar los workspaces de proyectos para obtener imputaciones directas
    const { data: projectWorkspaces } = await supabase
      .from('project_tools')
      .select('project_id, data')
      .eq('tool_slug', 'project-workspace-full');

    const projectStaffMap = new Map<string, Array<{ workerId?: string; name: string; weeklyHours: number; months?: number }>>();
    if (projectWorkspaces) {
      projectWorkspaces.forEach(pw => {
        const pData = pw.data as { personal?: Array<{ workerId?: string; name: string; weeklyHours: number; months?: number }> };
        if (pData?.personal && Array.isArray(pData.personal)) {
          projectStaffMap.set(pw.project_id, pData.personal);
        }
      });
    }

    // Unificar asignaciones en los trabajadores
    const mergedWorkers: Worker[] = rawWorkers.map(w => {
      const existingAllocations = Array.isArray(w.allocations) ? [...w.allocations] : [];

      formattedProjects.forEach(proj => {
        const assignedInProj = projectStaffMap.get(proj.id)?.find(
          p => p.workerId === w.id || p.name.trim().toLowerCase() === w.name.trim().toLowerCase()
        );

        const allocIdx = existingAllocations.findIndex(a => a.projectId === proj.id);
        if (assignedInProj && assignedInProj.weeklyHours > 0) {
          if (allocIdx >= 0) {
            existingAllocations[allocIdx] = {
              ...existingAllocations[allocIdx],
              projectName: proj.name,
              weeklyHours: assignedInProj.weeklyHours,
              months: assignedInProj.months || 12,
            };
          } else {
            existingAllocations.push({
              id: `alloc-${w.id}-${proj.id}`,
              projectId: proj.id,
              projectName: proj.name,
              weeklyHours: assignedInProj.weeklyHours,
              months: assignedInProj.months || 12,
            });
          }
        } else if (allocIdx < 0) {
          existingAllocations.push({
            id: `alloc-${w.id}-${proj.id}`,
            projectId: proj.id,
            projectName: proj.name,
            weeklyHours: 0,
            months: 12,
          });
        }
      });

      return {
        ...w,
        allocations: existingAllocations,
      };
    });

    return {
      workers: mergedWorkers,
      projects: formattedProjects,
    };
  } catch (err) {
    console.error('Error fetching global imputation matrix:', err);
    return {
      workers: DEFAULT_STAFF_CATALOG,
      projects: [],
    };
  }
}

/**
 * 4. Guarda y sincroniza la Matriz de Imputación con los proyectos reales
 */
export async function savePersonalMatrixAction(
  matrixData: PersonalMatrixData,
  currentProjectId?: string,
  syncWithProjects: boolean = true
) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'No autenticado', success: false };
  }

  try {
    // 1. Guardar en el catálogo central
    if (matrixData.workers && matrixData.workers.length > 0) {
      await saveOrgStaffCatalogAction(matrixData.workers);
    }

    // 2. Si se proporciona un proyecto concreto, guardar su estado
    if (currentProjectId) {
      await saveToolData(currentProjectId, 'gestion-personal', matrixData);
    }

    // 3. Sincronizar imputaciones con los costes y el workspace de los proyectos reales
    if (syncWithProjects && Array.isArray(matrixData.workers)) {
      const projectsList = await getProjects();
      const allProjectIds = projectsList.map(p => p.id);

      for (const targetProjectId of allProjectIds) {
        try {
          // Obtener las asignaciones para este proyecto
          const projectAssignments = matrixData.workers
            .map(worker => {
              const alloc = worker.allocations.find(a => a.projectId === targetProjectId);
              return alloc && alloc.weeklyHours > 0 ? { worker, alloc } : null;
            })
            .filter((item): item is { worker: Worker; alloc: ProjectAllocation } => item !== null);

          // 1. Obtener workspace actual
          const currentWorkspaceRaw = await getToolData(targetProjectId, 'project-workspace-full') as Record<string, unknown> | null;
          
          // 2. Construir lista de personal para el workspace
          const updatedPersonalList = projectAssignments.map(({ worker, alloc }) => ({
            id: `pers-${worker.id}`,
            workerId: worker.id,
            name: worker.name,
            role: worker.role,
            contractType: worker.contractType || 'Indefinido',
            monthlySalary: worker.salaryMonthly,
            ssPct: worker.ssPct || 31.4,
            weeklyHours: alloc.weeklyHours,
            maxWeeklyHours: worker.maxWeeklyHours || 37.5,
            months: alloc.months || 12,
          }));

          // 3. Construir partidas presupuestarias de personal
          const newPersonalPartidas = projectAssignments.map(({ worker, alloc }) => {
            const salMes = worker.pagas === 14 ? (worker.salaryMonthly * 14) / 12 : worker.salaryMonthly;
            const ssMes = (salMes * (worker.ssPct || 31.4)) / 100;
            const costeEmpresaMes = salMes + ssMes;
            const pct = (worker.maxWeeklyHours || 37.5) > 0 ? (alloc.weeklyHours / (worker.maxWeeklyHours || 37.5)) : 1;
            const costeImputadoMes = Number((costeEmpresaMes * pct).toFixed(2));

            return {
              id: `p-${worker.id}`,
              category: 'personal',
              description: `${worker.name} (${worker.role} - ${alloc.weeklyHours}h/sem)`,
              monthlyAmount: costeImputadoMes,
              months: alloc.months || 12,
              costeReal: Number((costeImputadoMes * (alloc.months || 12)).toFixed(2)),
              workerId: worker.id,
            };
          });

          // 4. Actualizar costes-proyecto
          const currentCostes = (await getToolData(targetProjectId, 'costes-proyecto') as Record<string, unknown> | null) || {};
          const existingPartidas = Array.isArray(currentCostes.partidas) 
            ? (currentCostes.partidas as Array<Record<string, unknown>>) 
            : [];
          const nonPersonalPartidas = existingPartidas.filter(
            p => p.category !== 'personal' || (typeof p.id === 'string' && !p.id.startsWith('staff-') && !p.id.startsWith('p-'))
          );

          const updatedCostesPayload = {
            ...currentCostes,
            partidas: [...newPersonalPartidas, ...nonPersonalPartidas],
          };

          await saveToolData(targetProjectId, 'costes-proyecto', updatedCostesPayload);
          await saveToolData(targetProjectId, 'personal-proyecto', { workers: updatedPersonalList });

          // 5. Si existe workspace completo, actualizar su personal y presupuesto
          if (currentWorkspaceRaw) {
            const workspacePresupuesto = (currentWorkspaceRaw.presupuesto as Record<string, unknown>) || {};
            const workspaceExistingPartidas = Array.isArray(workspacePresupuesto.partidas)
              ? (workspacePresupuesto.partidas as Array<Record<string, unknown>>)
              : [];
            const workspaceNonPersonal = workspaceExistingPartidas.filter(
              p => p.category !== 'personal'
            );

            const updatedWorkspace = {
              ...currentWorkspaceRaw,
              personal: updatedPersonalList,
              presupuesto: {
                ...workspacePresupuesto,
                partidas: [...newPersonalPartidas, ...workspaceNonPersonal],
              }
            };

            await saveToolData(targetProjectId, 'project-workspace-full', updatedWorkspace);
          }

          revalidatePath(`/dashboard/proyectos/${targetProjectId}`);
        } catch (syncErr) {
          console.error(`Error sincronizando proyecto ${targetProjectId} desde matriz:`, syncErr);
        }
      }
    }

    revalidatePath('/dashboard/personal');
    revalidatePath('/dashboard/matriz-imputacion');
    revalidatePath('/herramientas/gestion-personal');

    return { success: true, error: null };
  } catch (err: unknown) {
    console.error('Error guardando la matriz de personal:', err);
    return { 
      error: err instanceof Error ? err.message : 'Error inesperado guardando la matriz', 
      success: false 
    };
  }
}
