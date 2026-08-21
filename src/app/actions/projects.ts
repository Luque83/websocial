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
    console.error('Error al obtener proyectos:', error);
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
