'use server';

import { createClient } from '@/lib/supabase/server';


export async function saveToolData(projectId: string, toolSlug: string, data: unknown) {
  const supabase = await createClient();

  // Manual upsert to bypass missing unique constraint in DB
  const { data: existingRow } = await supabase
    .from('project_tools')
    .select('id')
    .eq('project_id', projectId)
    .eq('tool_slug', toolSlug)
    .maybeSingle();

  let error;
  if (existingRow) {
    const res = await supabase
      .from('project_tools')
      .update({ data, updated_at: new Date().toISOString() })
      .eq('id', existingRow.id);
    error = res.error;
  } else {
    const res = await supabase
      .from('project_tools')
      .insert({
        project_id: projectId,
        tool_slug: toolSlug,
        data,
        updated_at: new Date().toISOString(),
      });
    error = res.error;
  }

  if (error) {
    console.error('Error saving tool data:', error);
    throw new Error(`Failed to save tool data: ${error.message}`);
  }
}

export async function getToolData(projectId: string, toolSlug: string) {
  const supabase = await createClient();

  const { data, error } = await supabase
    .from('project_tools')
    .select('data')
    .eq('project_id', projectId)
    .eq('tool_slug', toolSlug)
    .single();

  if (error && error.code !== 'PGRST116') { // PGRST116 is no rows returned
    console.error('Error getting tool data:', error);
    throw new Error('Failed to get tool data');
  }

  return data?.data || null;
}
