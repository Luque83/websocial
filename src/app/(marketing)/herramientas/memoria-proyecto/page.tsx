import type { Metadata } from 'next';
import { ToolLayout } from '@/components/tools/ToolLayout';
import { MemoriaGenerator } from './MemoriaGenerator';
import { getToolData } from '@/app/actions/tools';

export const metadata: Metadata = {
  title: 'Generador de Memoria Narrativa',
  description: 'Redacta automáticamente la memoria técnica de tu proyecto social integrando los datos del marco lógico.',
};

export default async function MemoriaPage({
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
    initialData = await getToolData(projectId, 'memoria-proyecto');
    mlData = await getToolData(projectId, 'marco-logico');
    
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data } = await supabase.from('projects').select('name').eq('id', projectId).single();
    if (data) projectName = data.name;
  }

  return (
    <ToolLayout
      title="Generador de Memoria Narrativa"
      description="Esta herramienta te guía en la redacción de la memoria técnica exigida en casi cualquier convocatoria de subvenciones. Combina texto libre con auto-completado inteligente."
      category="Generadores"
      tier="free"
      instructions={[
        'Rellena los bloques narrativos de Contexto, Destinatarios, etc.',
        'Pulsa "Auto-completar" para importar tus Objetivos y Actividades directamente del Marco Lógico.',
        'Revisa la vista previa del documento generado.',
        'Exporta el resultado final a un PDF profesional listo para presentar.'
      ]}
    >
      <MemoriaGenerator 
        initialData={initialData} 
        projectId={projectId} 
        projectName={projectName} 
        mlData={mlData} 
      />
    </ToolLayout>
  );
}
