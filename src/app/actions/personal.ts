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
    const workers = await getOrgStaffCatalogAction();
    const projectsList = await getProjects();

    const formattedProjects = projectsList.map(p => ({ id: p.id, name: p.name }));

    return {
      workers,
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

    // 3. Sincronizar imputaciones con los costes de los proyectos reales
    if (syncWithProjects && Array.isArray(matrixData.workers)) {
      const projectWorkerMap = new Map<string, Array<{ worker: Worker; alloc: ProjectAllocation }>>();

      matrixData.workers.forEach(worker => {
        worker.allocations.forEach(alloc => {
          if (alloc.projectId && alloc.projectId !== 'sede') {
            const list = projectWorkerMap.get(alloc.projectId) || [];
            list.push({ worker, alloc });
            projectWorkerMap.set(alloc.projectId, list);
          }
        });
      });

      for (const [targetProjectId, assignments] of projectWorkerMap.entries()) {
        try {
          const currentCostes = await getToolData(targetProjectId, 'costes-proyecto') as Record<string, unknown> | null;
          const existingPartidas = Array.isArray(currentCostes?.partidas) 
            ? (currentCostes.partidas as Array<Record<string, unknown>>) 
            : [];

          const nonPersonalPartidas = existingPartidas.filter(
            p => p.category !== 'personal' || (typeof p.id === 'string' && !p.id.startsWith('staff-'))
          );

          const newPersonalPartidas = assignments.map(({ worker, alloc }) => {
            const salMes = worker.pagas === 14 ? (worker.salaryMonthly * 14) / 12 : worker.salaryMonthly;
            const ssMes = (salMes * (worker.ssPct || 31.4)) / 100;
            const costeEmpresaMes = salMes + ssMes;
            const pct = (worker.maxWeeklyHours || 37.5) > 0 ? (alloc.weeklyHours / (worker.maxWeeklyHours || 37.5)) : 1;
            const costeImputadoMes = Math.round(costeEmpresaMes * pct);

            return {
              id: `staff-${worker.id}`,
              category: 'personal',
              description: `${worker.name || worker.role} (${worker.role})`,
              puesto: `${worker.role} - ${worker.category || ''}`.trim(),
              funciones: `Imputación de ${alloc.weeklyHours}h/sem (${(pct * 100).toFixed(0)}% jornada de ${worker.maxWeeklyHours}h).`,
              monthlyAmount: costeImputadoMes,
              months: alloc.months || 12,
              costeReal: costeImputadoMes * (alloc.months || 12),
            };
          });

          const updatedCostesPayload = {
            ...(currentCostes || {}),
            partidas: [...newPersonalPartidas, ...nonPersonalPartidas],
          };

          await saveToolData(targetProjectId, 'costes-proyecto', updatedCostesPayload);
          revalidatePath(`/dashboard/proyectos/${targetProjectId}`);
        } catch (syncErr) {
          console.error(`Error sincronizando costes para proyecto ${targetProjectId}:`, syncErr);
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
