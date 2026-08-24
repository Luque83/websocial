import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { ProjectWorkspace } from '@/components/project/ProjectWorkspace';
import { getOrgStaffCatalogAction } from '@/app/actions/personal';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

interface ProjectToolRow {
  tool_slug: string;
  updated_at: string;
  data?: Record<string, unknown>;
}

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !project) {
    redirect('/dashboard');
  }

  const { data: projectTools } = await supabase
    .from('project_tools')
    .select('tool_slug, updated_at, data')
    .eq('project_id', id);

  const toolsDataMap: Record<string, unknown> = {};
  (projectTools || []).forEach((pt: ProjectToolRow) => {
    toolsDataMap[pt.tool_slug] = pt.data;
  });

  const staffCatalog = await getOrgStaffCatalogAction();

  // Also fetch entity matrix if available
  const { data: generalMatrixRecord } = await supabase
    .from('project_tools')
    .select('data')
    .eq('project_id', '00000000-0000-0000-0000-000000000000')
    .eq('tool_slug', 'matriz-personal-general')
    .single();

  return (
    <ProjectWorkspace
      projectId={id}
      initialProject={project}
      initialToolsData={toolsDataMap}
      initialStaffCatalog={staffCatalog}
      generalMatrix={generalMatrixRecord?.data || null}
    />
  );
}
