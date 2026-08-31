'use server';

import { createClient } from '@/lib/supabase/server';

/**
 * Guarda datos de una herramienta en project_tools.
 * Usa upsert nativo aprovechando la constraint UNIQUE(project_id, tool_slug).
 */
export async function saveToolData(projectId: string, toolSlug: string, data: unknown) {
  const supabase = await createClient();

  const { error } = await supabase
    .from('project_tools')
    .upsert(
      {
        project_id: projectId,
        tool_slug: toolSlug,
        data,
        updated_at: new Date().toISOString(),
      },
      { onConflict: 'project_id,tool_slug' }
    );

  if (error) {
    console.error('Error saving tool data:', error);
    throw new Error(`Failed to save tool data for ${toolSlug}: ${error.message}`);
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
