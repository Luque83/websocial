import type { Metadata } from 'next';
import { ToolLayout } from '@/components/tools/ToolLayout';
import { ProrrateoCalculator } from './ProrrateoCalculator';
import { getToolData } from '@/app/actions/tools';

export const metadata: Metadata = {
  title: 'Calculadora de prorrateo de nóminas',
  description: 'Calcula el porcentaje de nómina imputable a cada proyecto social. Ideal para la justificación de costes de personal en subvenciones.',
};

export default async function ProrrateoNominasPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const sp = await searchParams;
  const projectId = sp?.projectId as string | undefined;
  let initialData = undefined;
  let projectName = undefined;

  if (projectId) {
    initialData = await getToolData(projectId, 'prorrateo-nominas');
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data } = await supabase.from('projects').select('name').eq('id', projectId).single();
    if (data) projectName = data.name;
  }

  return (
    <ToolLayout
      title="Calculadora de prorrateo de nóminas"
      description="Calcula el porcentaje e importe de salario imputable a cada proyecto cuando un trabajador o trabajadora comparte su jornada entre varios proyectos sociales."
      category="Calculadoras"
      tier="free"
      instructions={[
        'Introduce el salario bruto mensual del trabajador/a.',
        'Añade cada proyecto e indica las horas semanales dedicadas a él.',
        'La herramienta calcula automáticamente el % y el importe imputable.',
        'Copia o imprime la tabla resultante para tu justificación.',
      ]}
    >
      <ProrrateoCalculator initialData={initialData} projectId={projectId} projectName={projectName} />
    </ToolLayout>
  );
}
