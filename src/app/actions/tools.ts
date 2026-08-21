'use server';

import { createClient } from '@/lib/supabase/server';


export async function saveToolData(projectId: string, toolSlug: string, data: unknown) {
  const supabase = await createClient();

  // Assuming project_tools table exists and has these columns.
  const { error } = await supabase
    .from('project_tools')
    .upsert({
      project_id: projectId,
      tool_slug: toolSlug,
      data: data,
      updated_at: new Date().toISOString(),
    }, { onConflict: 'project_id, tool_slug' });

  if (error) {
    console.error('Error saving tool data:', error);
    throw new Error('Failed to save tool data');
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
