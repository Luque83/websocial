'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { getToolData, saveToolData } from '@/app/actions/tools';
import { getProjects } from '@/app/actions/projects';
import { 
  DEFAULT_STAFF_CATALOG, 
  isWorkerMatch,
  type Worker, 
  type PersonalMatrixData, 
  type ProjectAllocation 
} from '@/config/staff';
import { calcularCosteEmpresa, calcularImporteImputado } from '@/lib/cost-calculator';

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

    // Guardar en project_tools con tool_slug = 'org-staff-catalog' en los proyectos del usuario
    const { data: existingProjects } = await supabase
      .from('projects')
      .select('id')
      .eq('user_id', user.id);

    if (existingProjects && existingProjects.length > 0) {
      await Promise.allSettled(
        existingProjects.map(p =>
          saveToolData(p.id, 'org-staff-catalog', { workers, updatedAt: new Date().toISOString() })
        )
      );
    } else {
      try {
        await saveToolData('00000000-0000-0000-0000-000000000000', 'org-staff-catalog', { workers, updatedAt: new Date().toISOString() });
      } catch {
        // Fallback si no hay proyectos creados
      }
    }

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

export interface MonthlyPayrollStatus {
  mes: number;
  nombreMes: string;
  salarioBruto: number;
  costeSS: number;
  pctImputado: number;
  importeImputado: number;
  justificantePago: boolean;
  reciboNominaName?: string;
  justificantePagoName?: string;
  rlcDocName?: string;
}

export interface WorkerProjectLifecycle {
  workerId: string;
  projectId: string;
  projectName: string;
  // 1. REFORMULACIÓN / CONCEDIDO (V2)
  reformuladoHours: number;
  reformuladoMonths: number;
  reformuladoMonthlyCost: number;
  reformuladoTotalCost: number;
  // 2. EJECUCIÓN REAL (NÓMINAS SEPA)
  ejecutadoMonthsPaid: number;
  ejecutadoTotalMonths: number;
  ejecutadoPaidAmount: number;
  hasSepaProof: boolean;
  hasRlcProof: boolean;
  pendingSepaCount: number;
  // 3. JUSTIFICACIÓN CONTABLE
  isFullyJustified: boolean;
  justifiedAmount: number;
  auditIssuesCount: number;
  // DETALLE MENSUAL 12 MESES
  payrolls: MonthlyPayrollStatus[];
}

export interface GlobalImputationMatrixPayload {
  workers: Worker[];
  projects: Array<{ id: string; name: string; phase?: string; grantAmount?: number }>;
  lifecycleMap: Record<string, WorkerProjectLifecycle>; // key: `${workerId}_${projectId}`
  globalStats: {
    totalWorkers: number;
    totalAvailableHours: number;
    totalAllocatedHours: number;
    overAllocatedWorkersCount: number;
    totalConcedidoCost: number;
    totalEjecutadoPaidCost: number;
    payrollSepaCompliancePct: number;
  };
}

const MONTH_NAMES = ['Ene', 'Feb', 'Mar', 'Abr', 'May', 'Jun', 'Jul', 'Ago', 'Sep', 'Oct', 'Nov', 'Dic'];

/**
 * 3. Obtiene la información enriquecida para la Matriz de Imputación Multiproyecto
 */
export async function getGlobalImputationMatrixAction(): Promise<GlobalImputationMatrixPayload> {
  try {
    const rawWorkers = await getOrgStaffCatalogAction();
    const projectsList = await getProjects();
    const supabase = await createClient();

    // Consultar todos los registros relevantes de herramientas de proyectos
    const { data: projectToolRecords } = await supabase
      .from('project_tools')
      .select('project_id, tool_slug, data')
      .in('tool_slug', ['project-workspace-full', 'personal-proyecto', 'costes-proyecto']);

    const workspaceMap = new Map<string, any>();
    const personalToolMap = new Map<string, any[]>();
    const costesToolMap = new Map<string, any>();

    if (projectToolRecords) {
      projectToolRecords.forEach(pt => {
        if (pt.tool_slug === 'project-workspace-full') {
          workspaceMap.set(pt.project_id, pt.data);
        } else if (pt.tool_slug === 'personal-proyecto') {
          const wList = (pt.data as any)?.workers;
          if (Array.isArray(wList)) personalToolMap.set(pt.project_id, wList);
        } else if (pt.tool_slug === 'costes-proyecto') {
          costesToolMap.set(pt.project_id, pt.data);
        }
      });
    }

    const formattedProjects = projectsList.map(p => {
      const wData = workspaceMap.get(p.id);
      return {
        id: p.id,
        name: p.name,
        phase: wData?.subvencion?.estadoSubvencion || 'En Ejecución',
        grantAmount: wData?.subvencion?.importeConcedido || 0,
      };
    });

    const lifecycleMap: Record<string, WorkerProjectLifecycle> = {};
    let totalConcedidoCost = 0;
    let totalEjecutadoPaidCost = 0;
    let totalPayrollsCount = 0;
    let totalPaidPayrollsCount = 0;

    // 1. Recopilar todos los trabajadores existentes tanto del catálogo central como de cada uno de los proyectos
    const allWorkersMap = new Map<string, Worker>();
    rawWorkers.forEach(w => allWorkersMap.set(w.id, w));

    workspaceMap.forEach((wData) => {
      if (wData && Array.isArray(wData.personal)) {
        wData.personal.forEach((pw: any) => {
          if (pw && pw.name && pw.name.trim() && !Array.from(allWorkersMap.values()).some(cw => isWorkerMatch(cw, pw))) {
            const newId = pw.workerId || pw.id || crypto.randomUUID();
            allWorkersMap.set(newId, {
              id: newId,
              name: pw.name.trim(),
              role: pw.role || 'Técnico/a de Proyecto',
              category: 'Técnico/a de Proyecto',
              contractType: pw.contractType || 'Temporal',
              salaryMonthly: pw.monthlySalary || 1850,
              pagas: 12,
              ssPct: pw.ssPct || 31.4,
              maxWeeklyHours: pw.maxWeeklyHours || 37.5,
              allocations: [],
            });
          }
        });
      }
    });

    const fullWorkersList = Array.from(allWorkersMap.values());

    // 2. Unificar asignaciones en los trabajadores y computar el ciclo de vida
    const mergedWorkers: Worker[] = fullWorkersList.map(w => {
      const existingAllocations = Array.isArray(w.allocations) ? [...w.allocations] : [];

      const { costeEmpresaMes, cuotaPatronal } = calcularCosteEmpresa(w.salaryMonthly, w.pagas || 12, w.ssPct || 31.4);
      const maxH = w.maxWeeklyHours || 37.5;

      formattedProjects.forEach((proj, projIdx) => {
        const wData = workspaceMap.get(proj.id);
        const pToolWorkers = personalToolMap.get(proj.id) || [];
        const hasProjectData = !!wData || pToolWorkers.length > 0;
        const projectStaffList: any[] = (wData?.personal && Array.isArray(wData.personal)) 
          ? wData.personal 
          : pToolWorkers;

        const assignedInProj = projectStaffList.find((p: any) => isWorkerMatch(w, p));
        const allocIdx = existingAllocations.findIndex(a => a.projectId === proj.id);

        let activeHours = 0;
        let activeMonths = 12;

        if (hasProjectData) {
          if (assignedInProj && assignedInProj.weeklyHours > 0) {
            activeHours = assignedInProj.weeklyHours;
            activeMonths = assignedInProj.months || 12;
          } else {
            // Si el proyecto tiene datos pero este trabajador no está asignado o tiene 0 horas
            activeHours = 0;
            activeMonths = 12;
          }
        } else {
          // Si el proyecto nunca ha sido guardado, respetar asignación previa si existiera en el catálogo
          if (allocIdx >= 0 && existingAllocations[allocIdx].weeklyHours > 0) {
            activeHours = existingAllocations[allocIdx].weeklyHours;
            activeMonths = existingAllocations[allocIdx].months || 12;
          } else {
            activeHours = 0;
            activeMonths = 12;
          }
        }

        const alloc = w.allocations.find((a: any) => a.projectId === proj.id);
        if (alloc && alloc.weeklyHours !== undefined) {
          activeHours = alloc.weeklyHours;
        }

        const activeMonthsArray = (assignedInProj?.activeMonths && Array.isArray(assignedInProj.activeMonths) && assignedInProj.activeMonths.length > 0)
          ? assignedInProj.activeMonths
          : ((alloc?.activeMonths && Array.isArray(alloc.activeMonths) && alloc.activeMonths.length > 0)
            ? alloc.activeMonths
            : Array.from({ length: activeMonths || 12 }, (_, i) => i + 1));

        activeMonths = activeMonthsArray.length;

        if (allocIdx >= 0) {
          existingAllocations[allocIdx] = {
            ...existingAllocations[allocIdx],
            projectName: proj.name,
            weeklyHours: activeHours,
            months: activeMonthsArray.length,
            activeMonths: activeMonthsArray,
          };
        } else {
          existingAllocations.push({
            id: `alloc-${w.id}-${proj.id}`,
            projectId: proj.id,
            projectName: proj.name,
            weeklyHours: activeHours,
            months: activeMonthsArray.length,
            activeMonths: activeMonthsArray,
          });
        }

        // Obtener nóminas mensuales registradas en este proyecto para este trabajador
        const projectPayrolls: any[] = Array.isArray(wData?.nominasMensuales)
          ? wData.nominasMensuales.filter((n: any) => isWorkerMatch(w, { workerId: n.workerId, id: n.workerId, name: n.workerName || n.trabajador }))
          : [];

        const payrolls: MonthlyPayrollStatus[] = MONTH_NAMES.map((name, idx) => {
          const mNum = idx + 1;
          const found = projectPayrolls.find(p => p.mes === mNum || (p.periodoMes && p.periodoMes.endsWith(`-${mNum.toString().padStart(2, '0')}`)));
          const pct = maxH > 0 ? (activeHours / maxH) * 100 : 0;
          const imp = Number((costeEmpresaMes * (pct / 100)).toFixed(2));

          if (found) {
            return {
              mes: mNum,
              nombreMes: name,
              salarioBruto: found.salarioBruto || w.salaryMonthly,
              costeSS: found.costeSS || cuotaPatronal,
              pctImputado: found.pctImputado !== undefined ? found.pctImputado : pct,
              importeImputado: found.importeImputado !== undefined ? found.importeImputado : imp,
              justificantePago: !!found.justificantePago,
              reciboNominaName: found.reciboNominaName,
              justificantePagoName: found.justificantePagoName,
              rlcDocName: found.rlcDocName,
            };
          }

          return {
            mes: mNum,
            nombreMes: name,
            salarioBruto: w.salaryMonthly,
            costeSS: cuotaPatronal,
            pctImputado: pct,
            importeImputado: imp,
            justificantePago: false,
            reciboNominaName: undefined,
            justificantePagoName: undefined,
            rlcDocName: undefined,
          };
        });

        const paidPayrolls = payrolls.filter(p => p.justificantePago && activeHours > 0);
        const paidAmount = paidPayrolls.reduce((sum, p) => sum + p.importeImputado, 0);
        const pctDed = maxH > 0 ? activeHours / maxH : 0;
        const monthlyCost = Number((costeEmpresaMes * pctDed).toFixed(2));
        const totalCost = Number((monthlyCost * activeMonths).toFixed(2));

        if (activeHours > 0) {
          totalConcedidoCost += totalCost;
          totalEjecutadoPaidCost += paidAmount;
          totalPayrollsCount += activeMonths;
          totalPaidPayrollsCount += paidPayrolls.length;
        }

        const key = `${w.id}_${proj.id}`;
        lifecycleMap[key] = {
          workerId: w.id,
          projectId: proj.id,
          projectName: proj.name,
          // 1. REFORMULACIÓN / CONCEDIDO (V2)
          reformuladoHours: activeHours,
          reformuladoMonths: activeMonths,
          reformuladoMonthlyCost: monthlyCost,
          reformuladoTotalCost: totalCost,
          // 2. EJECUCIÓN
          ejecutadoMonthsPaid: paidPayrolls.length,
          ejecutadoTotalMonths: activeMonths,
          ejecutadoPaidAmount: paidAmount,
          hasSepaProof: paidPayrolls.some(p => !!p.justificantePagoName),
          hasRlcProof: paidPayrolls.some(p => !!p.rlcDocName),
          pendingSepaCount: activeMonths - paidPayrolls.length,
          // 3. JUSTIFICACIÓN
          isFullyJustified: paidPayrolls.length >= activeMonths && activeHours > 0,
          justifiedAmount: paidAmount,
          auditIssuesCount: paidPayrolls.length < 6 && activeHours > 0 ? 1 : 0,
          payrolls,
        };
      });

      return {
        ...w,
        allocations: existingAllocations,
      };
    });

    const totalAvailableHours = mergedWorkers.reduce((acc, w) => acc + (w.maxWeeklyHours || 37.5), 0);
    const totalAllocatedHours = mergedWorkers.reduce((acc, w) => {
      return acc + (w.allocations || []).reduce((sum, a) => sum + (a.weeklyHours || 0), 0);
    }, 0);

    const overAllocatedWorkersCount = mergedWorkers.filter(w => {
      const sum = (w.allocations || []).reduce((s, a) => s + (a.weeklyHours || 0), 0);
      return sum > (w.maxWeeklyHours || 37.5);
    }).length;

    const compliancePct = totalPayrollsCount > 0 
      ? Math.round((totalPaidPayrollsCount / totalPayrollsCount) * 100) 
      : 100;

    return {
      workers: mergedWorkers,
      projects: formattedProjects,
      lifecycleMap,
      globalStats: {
        totalWorkers: mergedWorkers.length,
        totalAvailableHours,
        totalAllocatedHours,
        overAllocatedWorkersCount,
        totalConcedidoCost,
        totalEjecutadoPaidCost,
        payrollSepaCompliancePct: compliancePct,
      },
    };
  } catch (err) {
    console.error('Error fetching global imputation matrix:', err);
    return {
      workers: DEFAULT_STAFF_CATALOG,
      projects: [],
      lifecycleMap: {},
      globalStats: {
        totalWorkers: DEFAULT_STAFF_CATALOG.length,
        totalAvailableHours: 150,
        totalAllocatedHours: 0,
        overAllocatedWorkersCount: 0,
        totalConcedidoCost: 0,
        totalEjecutadoPaidCost: 0,
        payrollSepaCompliancePct: 100,
      },
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
          const updatedPersonalList = projectAssignments.map(({ worker, alloc }) => {
            const activeM = alloc.activeMonths && alloc.activeMonths.length > 0
              ? alloc.activeMonths
              : Array.from({ length: alloc.months || 12 }, (_, i) => i + 1);

            return {
              id: `pers-${worker.id}`,
              workerId: worker.id,
              name: worker.name,
              role: worker.role,
              contractType: worker.contractType || 'Indefinido',
              monthlySalary: worker.salaryMonthly,
              ssPct: worker.ssPct || 31.4,
              weeklyHours: alloc.weeklyHours,
              maxWeeklyHours: worker.maxWeeklyHours || 37.5,
              months: activeM.length,
              activeMonths: activeM,
            };
          });

          // 3. Construir partidas presupuestarias de personal
          const newPersonalPartidas = projectAssignments.map(({ worker, alloc }) => {
            const { costeEmpresaMes } = calcularCosteEmpresa(worker.salaryMonthly, worker.pagas || 12, worker.ssPct || 31.4);
            const costeImputadoMes = calcularImporteImputado(costeEmpresaMes, alloc.weeklyHours, worker.maxWeeklyHours || 37.5);
            const activeM = alloc.activeMonths && alloc.activeMonths.length > 0
              ? alloc.activeMonths
              : Array.from({ length: alloc.months || 12 }, (_, i) => i + 1);
            const monthsCount = activeM.length;

            return {
              id: `p-${worker.id}`,
              category: 'personal',
              description: `${worker.name} (${worker.role} - ${alloc.weeklyHours}h/sem, ${monthsCount} meses)`,
              monthlyAmount: costeImputadoMes,
              months: monthsCount,
              costeReal: Number((costeImputadoMes * monthsCount).toFixed(2)),
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

          // 4.5 Actualizar cronograma
          const currentCronograma = (await getToolData(targetProjectId, 'cronograma') as Record<string, unknown> | null) || {};
          const maxMonthsInProject = Math.max(...projectAssignments.map(pa => pa.alloc.months || 12), 12);
          const updatedCronograma = {
            ...currentCronograma,
            durationMonths: maxMonthsInProject,
          };
          await saveToolData(targetProjectId, 'cronograma', updatedCronograma);
          await saveToolData(targetProjectId, 'cronograma-actividades', updatedCronograma);

          // 5. Si existe workspace completo, actualizar su personal, presupuesto y cronograma
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
              },
              cronograma: {
                ...((currentWorkspaceRaw.cronograma as Record<string, unknown>) || {}),
                durationMonths: maxMonthsInProject,
              }
            };

            await saveToolData(targetProjectId, 'project-workspace-full', updatedWorkspace);
          } else {
            const initialWorkspace = {
              personal: updatedPersonalList,
              presupuesto: {
                partidas: newPersonalPartidas,
                resumen: {
                  totalCoste: newPersonalPartidas.reduce((s, p) => s + (p.costeReal || 0), 0),
                  subvencionSolicitada: newPersonalPartidas.reduce((s, p) => s + (p.costeReal || 0), 0),
                }
              },
              cronograma: updatedCronograma,
            };
            await saveToolData(targetProjectId, 'project-workspace-full', initialWorkspace);
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
