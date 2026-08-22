'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';


export async function getProjects() {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('No estás autenticado');
  }

  const { data: projects, error } = await supabase
    .from('projects')
    .select('*')
    .eq('user_id', user.id)
    .order('created_at', { ascending: false });

  if (error) {
    console.error('Error al obtener proyectos:', JSON.stringify(error), error.message, error.details);
    return [];
  }

  return projects;
}

export async function createProject(prevState: unknown, formData: FormData) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    return { error: 'No estás autenticado', success: false };
  }

  const name = formData.get('name') as string;
  const description = formData.get('description') as string;

  if (!name) {
    return { error: 'El nombre del proyecto es obligatorio', success: false };
  }

  const { error } = await supabase
    .from('projects')
    .insert({
      user_id: user.id,
      name,
      description,
    });

  if (error) {
    console.error('Error al crear el proyecto:', error);
    return { error: `Error de BD: ${error.message}`, success: false };
  }

  revalidatePath('/dashboard');
  return { success: true, error: null, timestamp: Date.now() };
}

export async function deleteProject(projectId: string) {
  const supabase = await createClient();
  
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('No estás autenticado');
  }

  const { error } = await supabase
    .from('projects')
    .delete()
    .eq('id', projectId)
    .eq('user_id', user.id); // Ensure the user owns the project

  if (error) {
    console.error('Error al eliminar el proyecto:', error);
    throw new Error('Error al eliminar el proyecto');
  }

  revalidatePath('/dashboard');
}

export async function getDashboardStats() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { totalProjects: 0, toolsUsed: 8, activeProjects: 0 };

  // Proyectos del usuario
  const { data: projects } = await supabase
    .from('projects')
    .select('id')
    .eq('user_id', user.id);

  const projectIds = (projects || []).map(p => p.id);
  
  if (projectIds.length === 0) return { totalProjects: 0, toolsUsed: 8, activeProjects: 0 };

  // Proyectos con datos guardados
  const { data: activeToolData } = await supabase
    .from('project_tools')
    .select('project_id')
    .in('project_id', projectIds);

  const activeProjectIds = new Set((activeToolData || []).map(t => t.project_id));

  return {
    totalProjects: projectIds.length,
    toolsUsed: 8, // 8 Módulos integrados del Expediente Digital
    activeProjects: activeProjectIds.size || projectIds.length,
  };
}

export async function getProjectsWithStats() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return [];

  const { data: projects } = await supabase
    .from('projects')
    .select('*, project_tools(tool_slug)')
    .eq('user_id', user.id)
    .order('updated_at', { ascending: false });

  return (projects || []).map(p => {
    const hasFullWorkspace = (p.project_tools as { tool_slug: string }[] | null)?.some(
      t => t.tool_slug === 'project-workspace-full' || t.tool_slug === 'marco-logico'
    );
    return {
      ...p,
      hasSavedData: Boolean(hasFullWorkspace),
      statusLabel: hasFullWorkspace ? 'Expediente en Gestión Activa' : 'Listo para Formular',
    };
  });
}
