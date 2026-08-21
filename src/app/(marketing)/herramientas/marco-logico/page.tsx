import type { Metadata } from 'next';
import { ToolLayout } from '@/components/tools/ToolLayout';
import { MarcoLogicoGenerator } from './MarcoLogicoGenerator';
import { getToolData } from '@/app/actions/tools';

export const metadata: Metadata = {
  title: 'Generador de Marco Lógico',
  description: 'Crea la Matriz de Marco Lógico de tu proyecto social paso a paso. Genera la tabla completa con objetivos, resultados, actividades, indicadores y fuentes.',
};

interface PageProps {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}

export default async function MarcoLogicoPage({ searchParams }: PageProps) {
  const resolvedParams = await searchParams;
  const projectId = resolvedParams?.projectId as string | undefined;

  let initialData = undefined;
  if (projectId) {
    initialData = await getToolData(projectId, 'marco-logico');
  }

  return (
    <ToolLayout
      title="Generador de Marco Lógico"
      description="Construye la Matriz de Marco Lógico de tu proyecto social de forma guiada. Define objetivos, resultados, actividades, indicadores y fuentes de verificación."
      category="Generadores"
      tier="free"
      instructions={[
        'Define el FIN (impacto superior) y el PROPÓSITO (objetivo general) del proyecto.',
        'Añade los objetivos específicos con sus indicadores.',
        'Para cada objetivo, define los resultados esperados.',
        'Asocia actividades concretas a cada resultado.',
        'Descarga o copia la matriz completa para tu memoria de proyecto.',
      ]}
    >
      <MarcoLogicoGenerator initialData={initialData} projectId={projectId} />
    </ToolLayout>
  );
}
