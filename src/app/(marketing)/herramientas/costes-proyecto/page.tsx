import type { Metadata } from 'next';
import { ToolLayout } from '@/components/tools/ToolLayout';
import { CostesCalculator } from './CostesCalculator';
import { getToolData } from '@/app/actions/tools';

export const metadata: Metadata = {
  title: 'Calculadora de costes de proyecto',
  description: 'Diseña el presupuesto de tu proyecto social por partidas y obtén el desglose completo con costes indirectos.',
};

export default async function CostesProyectoPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const sp = await searchParams;
  const projectId = sp?.projectId as string | undefined;
  let initialData = undefined;
  let projectName = undefined;

  if (projectId) {
    initialData = await getToolData(projectId, 'costes-proyecto');
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data } = await supabase.from('projects').select('name').eq('id', projectId).single();
    if (data) projectName = data.name;
  }

  return (
    <ToolLayout
      title="Calculadora de costes de proyecto"
      description="Diseña el presupuesto de tu proyecto social por partidas presupuestarias y obtén el desglose completo incluyendo costes indirectos."
      category="Calculadoras"
      tier="free"
      instructions={[
        'Introduce el nombre del proyecto y su duración en meses.',
        'Añade las partidas presupuestarias con su categoría, descripción e importe mensual.',
        'Ajusta el porcentaje de costes indirectos (gastos generales).',
        'Obtén el presupuesto total desglosado por partidas y categorías.',
        'Copia o imprime el presupuesto para incluirlo en tu solicitud.',
      ]}
    >
      <CostesCalculator initialData={initialData} projectId={projectId} projectName={projectName} />
    </ToolLayout>
  );
}
