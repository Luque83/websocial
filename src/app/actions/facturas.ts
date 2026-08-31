'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { saveToolData, getToolData } from '@/app/actions/tools';
import { getProjects } from '@/app/actions/projects';
import type { 
  FacturaGlobalItem, 
  ProveedorItem, 
  FacturasMatrixData,
  FacturaImputacionProject 
} from '@/types/facturas';
import { DEFAULT_PROVEEDORES_CATALOG } from '@/types/facturas';

const GLOBAL_ORG_ID = '00000000-0000-0000-0000-000000000000';
const TOOL_SLUG_FACTURAS = 'global-facturas-matrix';
const TOOL_SLUG_PROVEEDORES = 'global-proveedores-catalog';

/**
 * Obtiene el catálogo central de proveedores de la entidad
 */
export async function getProveedoresCatalogAction(): Promise<ProveedorItem[]> {
  try {
    const data = await getToolData(GLOBAL_ORG_ID, TOOL_SLUG_PROVEEDORES) as { proveedores?: ProveedorItem[] } | null;
    if (data && Array.isArray(data.proveedores) && data.proveedores.length > 0) {
      return data.proveedores;
    }
    return DEFAULT_PROVEEDORES_CATALOG;
  } catch (error) {
    console.error('Error getting proveedores catalog:', error);
    return DEFAULT_PROVEEDORES_CATALOG;
  }
}

/**
 * Guarda el catálogo central de proveedores de la entidad
 */
export async function saveProveedoresCatalogAction(proveedores: ProveedorItem[]): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autenticado' };

    await saveToolData(GLOBAL_ORG_ID, TOOL_SLUG_PROVEEDORES, {
      proveedores,
      updatedAt: new Date().toISOString()
    });

    revalidatePath('/dashboard/facturas');
    return { success: true, error: null };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error guardando proveedores'
    };
  }
}

/**
 * Obtiene la Matriz Global de Facturas, Proveedores y Reparto Multiproyecto
 */
export async function getGlobalFacturasAction(): Promise<{
  success: boolean;
  facturas: FacturaGlobalItem[];
  proveedores: ProveedorItem[];
  projects: Array<{ id: string; name: string; phase?: string; grantAmount?: number }>;
  error: string | null;
}> {
  try {
    const projectsList = await getProjects();
    const projects = projectsList.map(p => ({
      id: p.id,
      name: p.name,
      phase: p.phase,
      grantAmount: p.grantAmount,
    }));

    const proveedores = await getProveedoresCatalogAction();
    const globalData = await getToolData(GLOBAL_ORG_ID, TOOL_SLUG_FACTURAS) as FacturasMatrixData | null;
    let globalFacturas: FacturaGlobalItem[] = globalData?.facturas || [];

    // Recopilar facturas existentes en cada proyecto para fusionarlas bidireccionalmente
    for (const proj of projects) {
      try {
        const workspaceRaw = await getToolData(proj.id, 'project-workspace-full') as Record<string, unknown> | null;
        const projectFacturas = Array.isArray(workspaceRaw?.gastosFacturas)
          ? (workspaceRaw.gastosFacturas as Array<Record<string, unknown>>)
          : [];

        for (const pf of projectFacturas) {
          const numFactura = (pf.numFactura as string) || '';
          const proveedorNombre = (pf.proveedor as string) || '';
          const totalFactura = Number(pf.totalFactura) || 0;
          const importeImputado = Number(pf.importeImputado) || totalFactura;
          const pctImputado = Number(pf.pctImputado) || 100;

          // Buscar si ya existe en global
          const existingIdx = globalFacturas.findIndex(
            gf => (gf.numFactura && gf.numFactura === numFactura && gf.proveedorNombre === proveedorNombre) || gf.id === pf.id
          );

          if (existingIdx >= 0) {
            const gf = globalFacturas[existingIdx];
            const existingImputacionIdx = gf.imputaciones.findIndex(imp => imp.projectId === proj.id);
            const impData: FacturaImputacionProject = {
              id: `imp-${gf.id}-${proj.id}`,
              projectId: proj.id,
              projectName: proj.name,
              partidaId: (pf.partidaId as string) || undefined,
              partidaName: (pf.partidaName as string) || undefined,
              pctImputado,
              importeImputado,
            };

            if (existingImputacionIdx >= 0) {
              gf.imputaciones[existingImputacionIdx] = impData;
            } else {
              gf.imputaciones.push(impData);
            }
          } else if (numFactura || proveedorNombre) {
            // Añadir como nueva factura global
            const newGf: FacturaGlobalItem = {
              id: (pf.id as string) || crypto.randomUUID(),
              proveedorNombre: proveedorNombre || 'Proveedor',
              nif: (pf.nif as string) || '',
              numFactura: numFactura || `FAC-${Date.now().toString().slice(-4)}`,
              fechaEmision: (pf.fecha as string) || new Date().toISOString().slice(0, 10),
              concepto: (pf.concepto as string) || 'Gasto de proyecto',
              categoria: 'otro',
              baseImponible: totalFactura > 0 ? Number((totalFactura / 1.21).toFixed(2)) : 0,
              ivaPct: 21,
              ivaImporte: totalFactura > 0 ? Number((totalFactura - totalFactura / 1.21).toFixed(2)) : 0,
              totalFactura,
              metodoPago: (pf.metodoPago as any) || 'transferencia_sepa',
              justificantePago: !!pf.justificantePago,
              fechaPago: (pf.fechaPago as string) || undefined,
              refBancaria: (pf.refBancaria as string) || undefined,
              facturaFileName: (pf.facturaFileName as string) || undefined,
              facturaFileUrl: (pf.facturaFileUrl as string) || undefined,
              justificanteFileName: (pf.justificanteFileName as string) || undefined,
              justificanteFileUrl: (pf.justificanteFileUrl as string) || undefined,
              imputaciones: [
                {
                  id: `imp-${pf.id || crypto.randomUUID()}-${proj.id}`,
                  projectId: proj.id,
                  projectName: proj.name,
                  partidaId: (pf.partidaId as string) || undefined,
                  partidaName: (pf.partidaName as string) || undefined,
                  pctImputado,
                  importeImputado,
                }
              ]
            };
            globalFacturas.push(newGf);
          }
        }
      } catch (projErr) {
        console.error(`Error leyendo facturas de proyecto ${proj.id}:`, projErr);
      }
    }

    return {
      success: true,
      facturas: globalFacturas,
      proveedores,
      projects,
      error: null,
    };
  } catch (err: unknown) {
    return {
      success: false,
      facturas: [],
      proveedores: DEFAULT_PROVEEDORES_CATALOG,
      projects: [],
      error: err instanceof Error ? err.message : 'Error cargando facturas globales',
    };
  }
}

/**
 * Guarda la Matriz Global de Facturas y sincroniza bidireccionalmente con los proyectos
 */
export async function saveGlobalFacturasAction(
  matrixData: { facturas: FacturaGlobalItem[]; proveedores?: ProveedorItem[] },
  syncWithProjects: boolean = true
): Promise<{ success: boolean; error: string | null }> {
  try {
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return { success: false, error: 'No autenticado' };

    // 1. Guardar matriz global
    await saveToolData(GLOBAL_ORG_ID, TOOL_SLUG_FACTURAS, {
      facturas: matrixData.facturas,
      updatedAt: new Date().toISOString(),
    });

    // 2. Si vienen proveedores, guardarlos también
    if (matrixData.proveedores && Array.isArray(matrixData.proveedores)) {
      await saveToolData(GLOBAL_ORG_ID, TOOL_SLUG_PROVEEDORES, {
        proveedores: matrixData.proveedores,
        updatedAt: new Date().toISOString(),
      });
    }

    // 3. Sincronizar bidireccionalmente con cada proyecto
    if (syncWithProjects) {
      const projectsList = await getProjects();

      for (const proj of projectsList) {
        try {
          // Filtrar las facturas que tengan imputación a este proyecto
          const projectInvoices = matrixData.facturas
            .map(f => {
              const imp = f.imputaciones.find(i => i.projectId === proj.id);
              if (!imp || imp.pctImputado <= 0) return null;

              return {
                id: f.id,
                proveedor: f.proveedorNombre,
                nif: f.nif,
                numFactura: f.numFactura,
                fecha: f.fechaEmision,
                concepto: f.concepto,
                partidaId: imp.partidaId || '',
                partidaName: imp.partidaName || '',
                totalFactura: f.totalFactura,
                pctImputado: imp.pctImputado,
                importeImputado: imp.importeImputado,
                justificantePago: f.justificantePago,
                fechaPago: f.fechaPago || '',
                metodoPago: f.metodoPago || 'transferencia_sepa',
                refBancaria: f.refBancaria || '',
                facturaFileName: f.facturaFileName || '',
                facturaFileUrl: f.facturaFileUrl || '',
                justificanteFileName: f.justificanteFileName || '',
                justificanteFileUrl: f.justificanteFileUrl || '',
              };
            })
            .filter(Boolean);

          const currentWorkspaceRaw = await getToolData(proj.id, 'project-workspace-full') as Record<string, unknown> | null;

          if (currentWorkspaceRaw) {
            const updatedWorkspace = {
              ...currentWorkspaceRaw,
              gastosFacturas: projectInvoices,
            };
            await saveToolData(proj.id, 'project-workspace-full', updatedWorkspace);
          }

          revalidatePath(`/dashboard/proyectos/${proj.id}`);
        } catch (projSyncErr) {
          console.error(`Error sincronizando facturas en proyecto ${proj.id}:`, projSyncErr);
        }
      }
    }

    revalidatePath('/dashboard/facturas');
    revalidatePath('/dashboard');
    return { success: true, error: null };
  } catch (err: unknown) {
    return {
      success: false,
      error: err instanceof Error ? err.message : 'Error guardando matriz de facturas',
    };
  }
}
