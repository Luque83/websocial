'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getToolData, saveToolData } from '@/app/actions/tools';

export interface ProjectAllocation {
  id: string;
  projectId?: string;
  projectName: string;
  weeklyHours: number;
  months: number;
}

export interface Worker {
  id: string;
  name: string;
  role: string;
  category: string;
  salaryMonthly: number;
  pagas: number;
  ssPct: number;
  maxWeeklyHours: number;
  allocations: ProjectAllocation[];
}

export interface PersonalMatrixData {
  organizationName?: string;
  workers?: Worker[];
}

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
    // 1. Guardar en el proyecto actual si se proporciona, o como matriz central
    if (currentProjectId) {
      await saveToolData(currentProjectId, 'gestion-personal', matrixData);
    }

    // 2. Si se solicita sincronización con los costes de los proyectos reales
    if (syncWithProjects && Array.isArray(matrixData.workers)) {
      // Agrupar asignaciones por projectId
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

      // Para cada proyecto real con personal asignado, actualizar su partida de personal en costes-proyecto
      for (const [targetProjectId, assignments] of projectWorkerMap.entries()) {
        try {
          const currentCostes = await getToolData(targetProjectId, 'costes-proyecto') as Record<string, unknown> | null;
          const existingPartidas = Array.isArray(currentCostes?.partidas) 
            ? (currentCostes.partidas as Array<Record<string, unknown>>) 
            : [];

          // Conservar partidas que NO sean de personal generadas por la matriz
          const nonPersonalPartidas = existingPartidas.filter(
            p => p.category !== 'personal' || (typeof p.id === 'string' && !p.id.startsWith('staff-'))
          );

          // Generar nuevas partidas de personal para este proyecto
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

    revalidatePath('/herramientas/gestion-personal');
    if (currentProjectId) {
      revalidatePath(`/dashboard/proyectos/${currentProjectId}`);
    }

    return { success: true, error: null };
  } catch (err: unknown) {
    console.error('Error guardando la matriz de personal:', err);
    return { 
      error: err instanceof Error ? err.message : 'Error inesperado guardando la matriz', 
      success: false 
    };
  }
}
