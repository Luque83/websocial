'use server';

import { createClient } from '@/lib/supabase/server';

/**
 * Guarda datos de una herramienta en project_tools.
 * Comprueba si ya existe el registro para actualizar o insertar, compatible con esquemas con o sin constraint UNIQUE.
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
    console.error('Error checking existing tool data:', selectError);
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

  const { data, error } = await supabase
    .from('project_tools')
    .select('data')
    .eq('project_id', projectId)
    .eq('tool_slug', toolSlug)
    .maybeSingle();

  if (error) {
    console.error('Error getting tool data:', error);
    throw new Error('Failed to get tool data');
  }

  return data?.data ?? null;
}
