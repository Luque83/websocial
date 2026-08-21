import type { Metadata } from 'next';
import { ToolLayout } from '@/components/tools/ToolLayout';
import { CronogramaGenerator } from './CronogramaGenerator';
import { getToolData } from '@/app/actions/tools';

export const metadata: Metadata = {
  title: 'Cronograma de Actividades',
  description: 'Planifica y visualiza el calendario de tu proyecto social en formato Gantt. Imprescindible para anexos y justificaciones.',
};

export default async function CronogramaPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const sp = await searchParams;
  const projectId = sp?.projectId as string | undefined;
  
  let initialData = undefined;
  let projectName = undefined;
  let mlData = undefined;

  if (projectId) {
    initialData = await getToolData(projectId, 'cronograma-actividades');
    mlData = await getToolData(projectId, 'marco-logico');
    
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data } = await supabase.from('projects').select('name').eq('id', projectId).single();
    if (data) projectName = data.name;
  }

  return (
    <ToolLayout
      title="Cronograma de Actividades"
      description="Planifica de forma visual cuándo se ejecutará cada actividad de tu proyecto. El diagrama resultante es perfecto para incluirlo en la formulación técnica de tu subvención."
      category="Gestión"
      tier="free"
      instructions={[
        'Define la duración total del proyecto en meses.',
        'Añade las actividades (se sincronizan automáticamente si ya hiciste el Marco Lógico).',
        'Establece el mes de inicio, mes de fin y la persona responsable.',
        'Exporta tu diagrama de Gantt a PDF con un clic.'
      ]}
    >
      <CronogramaGenerator 
        initialData={initialData} 
        projectId={projectId} 
        projectName={projectName} 
        mlData={mlData} 
      />
    </ToolLayout>
  );
}
