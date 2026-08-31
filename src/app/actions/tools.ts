'use server';

import { createClient } from '@/lib/supabase/server';

const DUMMY_ORG_ID = '00000000-0000-0000-0000-000000000000';

/**
 * Guarda datos de una herramienta en project_tools.
 * Comprueba si ya existe el registro para actualizar o insertar, compatible con esquemas con o sin constraint UNIQUE.
 * Si falla por RLS en el ID genérico de organización, intenta guardar vinculado a un proyecto del usuario.
 */
export async function saveToolData(projectId: string, toolSlug: string, data: unknown) {
  const supabase = await createClient();

  // 1. Buscar si ya existe el registro para este proyecto y herramienta
  const { data: existingRow, error: selectError } = await supabase
    .from('project_tools')
    .select('id')
    .eq('project_id', projectId)
    .eq('tool_slug', toolSlug)
    .maybeSingle();

  if (selectError) {
    console.warn('Checking existing tool data notice:', selectError.message);
  }

  let saveError;

  if (existingRow?.id) {
    // 2. Si existe, actualizar
    const res = await supabase
      .from('project_tools')
      .update({
        data,
        updated_at: new Date().toISOString(),
      })
      .eq('id', existingRow.id);
    saveError = res.error;
  } else {
    // 3. Si no existe, insertar nuevo
    const res = await supabase
      .from('project_tools')
      .insert({
        project_id: projectId,
        tool_slug: toolSlug,
        data,
        updated_at: new Date().toISOString(),
      });
    saveError = res.error;
  }

  // 4. Si hay error de RLS en el ID genérico de organización (00000000-0000-0000-0000-000000000000)
  if (saveError && projectId === DUMMY_ORG_ID) {
    console.warn(`Aviso RLS en ID global (${toolSlug}): intentando vincular al proyecto del usuario.`);
    const { data: userProjects } = await supabase
      .from('projects')
      .select('id')
      .limit(1);

    if (userProjects && userProjects.length > 0) {
      const fallbackProjectId = userProjects[0].id;
      const { data: fallbackRow } = await supabase
        .from('project_tools')
        .select('id')
        .eq('project_id', fallbackProjectId)
        .eq('tool_slug', toolSlug)
        .maybeSingle();

      if (fallbackRow?.id) {
        const fallbackRes = await supabase
          .from('project_tools')
          .update({ data, updated_at: new Date().toISOString() })
          .eq('id', fallbackRow.id);
        saveError = fallbackRes.error;
      } else {
        const fallbackRes = await supabase
          .from('project_tools')
          .insert({
            project_id: fallbackProjectId,
            tool_slug: toolSlug,
            data,
            updated_at: new Date().toISOString(),
          });
        saveError = fallbackRes.error;
      }
    }
  }

  if (saveError) {
    console.error('Error saving tool data:', saveError);
    throw new Error(`Failed to save tool data for ${toolSlug}: ${saveError.message}`);
  }
}

/**
 * Obtiene datos de una herramienta de project_tools.
 * Devuelve null si no existe el registro.
 */
export async function getToolData(projectId: string, toolSlug: string) {
  const supabase = await createClient();

  // 1. Intento directo por projectId
  const { data, error } = await supabase
    .from('project_tools')
    .select('data')
    .eq('project_id', projectId)
    .eq('tool_slug', toolSlug)
    .maybeSingle();

  if (data?.data) {
    return data.data;
  }

  // 2. Si es ID global de organización y no se encontró (o hubo RLS), buscar por tool_slug
  if (projectId === DUMMY_ORG_ID) {
    const { data: fallbackData } = await supabase
      .from('project_tools')
      .select('data')
      .eq('tool_slug', toolSlug)
      .limit(1)
      .maybeSingle();

    if (fallbackData?.data) {
      return fallbackData.data;
    }
  }

  if (error && error.code !== 'PGRST116') {
    console.warn('Aviso leyendo tool data:', error.message);
  }

  return null;
}
