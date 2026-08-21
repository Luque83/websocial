import type { Metadata } from 'next';
import { ToolLayout } from '@/components/tools/ToolLayout';
import { IndicadoresGenerator } from './IndicadoresGenerator';
import { getToolData } from '@/app/actions/tools';

export const metadata: Metadata = {
  title: 'Sistema de Indicadores de Impacto',
  description: 'Diseña y monitoriza el cumplimiento de los indicadores de tu proyecto social en tiempo real.',
};

export default async function IndicadoresPage({
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
    initialData = await getToolData(projectId, 'indicadores-impacto');
    mlData = await getToolData(projectId, 'marco-logico');
    
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data } = await supabase.from('projects').select('name').eq('id', projectId).single();
    if (data) projectName = data.name;
  }

  return (
    <ToolLayout
      title="Sistema de Indicadores de Impacto"
      description="Monitoriza el avance de tu proyecto mes a mes. Esta herramienta te permite hacer un seguimiento visual del grado de cumplimiento de cada indicador para tus memorias de justificación."
      category="Gestión"
      tier="free"
      instructions={[
        'Añade o sincroniza los indicadores desde tu Marco Lógico.',
        'Define el "Valor Base" (situación de partida) y el "Valor Meta" (objetivo final).',
        'Actualiza el "Valor Actual" periódicamente para ver el progreso automático.',
        'Exporta el cuadro de mandos a PDF para adjuntarlo en tus informes de seguimiento.'
      ]}
    >
      <IndicadoresGenerator 
        initialData={initialData} 
        projectId={projectId} 
        projectName={projectName} 
        mlData={mlData} 
      />
    </ToolLayout>
  );
}
