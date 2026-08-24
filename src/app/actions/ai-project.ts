'use server';

import { createClient } from '@/lib/supabase/server';
import { generateSocialProjectWithAI, AIProjectInput } from '@/lib/ai/gemini';
import { revalidatePath } from 'next/cache';
import { saveToolData } from '@/app/actions/tools';

export async function createProjectWithAI(input: AIProjectInput) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { error: 'No estás autenticado', success: false };
  }

  if (!input.convocatoriaText || input.convocatoriaText.trim().length < 10) {
    return { error: 'Por favor, introduce una descripción o las bases de la convocatoria (mínimo 10 caracteres).', success: false };
  }

  try {
    // 1. Generar la formulación completa con IA
    const generated = await generateSocialProjectWithAI(input);

    // 2. Insertar el Proyecto
    const { data: project, error: projectError } = await supabase
      .from('projects')
      .insert({
        user_id: user.id,
        name: generated.name,
        description: generated.description,
      })
      .select()
      .single();

    if (projectError || !project) {
      console.error('Error al crear el proyecto con IA:', projectError);
      return { error: `Error en BD: ${projectError?.message}`, success: false };
    }

    const projectId = project.id;

    // 3. Poblar las herramientas en batch
    const toolsPayloads = [
      {
        project_id: projectId,
        tool_slug: 'marco-logico',
        data: {
          projectName: generated.name,
          ...generated.marcoLogico
        }
      },
      {
        project_id: projectId,
        tool_slug: 'costes-proyecto',
        data: {
          projectName: generated.name,
          ...generated.costes
        }
      },
      {
        project_id: projectId,
        tool_slug: 'indicadores-impacto',
        data: {
          projectName: generated.name,
          ...generated.indicadores
        }
      },
      {
        project_id: projectId,
        tool_slug: 'cronograma-actividades',
        data: {
          projectName: generated.name,
          ...generated.cronograma
        }
      },
      {
        project_id: projectId,
        tool_slug: 'memoria-proyecto',
        data: {
          projectName: generated.name,
          ...generated.memoria
        }
      }
    ];

    for (const payload of toolsPayloads) {
      await saveToolData(payload.project_id, payload.tool_slug, payload.data);
    }

    revalidatePath('/dashboard');
    revalidatePath(`/dashboard/proyectos/${projectId}`);

    return { 
      success: true, 
      projectId, 
      projectName: generated.name,
      error: null 
    };
  } catch (err: unknown) {
    console.error('Error general formulando proyecto con IA:', err);
    return { 
      error: err instanceof Error ? err.message : 'Error inesperado generando el proyecto con IA', 
      success: false 
    };
  }
}
