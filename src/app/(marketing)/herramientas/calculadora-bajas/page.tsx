import type { Metadata } from 'next';
import { ToolLayout } from '@/components/tools/ToolLayout';
import { BajasCalculator } from './BajasCalculator';
import { getToolData } from '@/app/actions/tools';

export const metadata: Metadata = {
  title: 'Calculadora de Bajas e Imputación de IT',
  description: 'Calcula el desglose de incapacidad temporal (IT) y el coste de personal y sustitución legalmente imputable a subvenciones.',
};

export default async function CalculadoraBajasPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const sp = await searchParams;
  const projectId = sp?.projectId as string | undefined;
  
  let initialData = undefined;
  let projectName = undefined;

  if (projectId) {
    initialData = await getToolData(projectId, 'calculadora-bajas');
    
    const { createClient } = await import('@/lib/supabase/server');
    const supabase = await createClient();
    const { data } = await supabase.from('projects').select('name').eq('id', projectId).single();
    if (data) projectName = data.name;
  }

  return (
    <ToolLayout
      title="Calculadora de Bajas e IT Subvencionable"
      description="Calcula de forma exacta los tramos de incapacidad temporal, complementos de convenio y sustituciones para justificar gastos de personal sin riesgo de reintegro en auditorías."
      category="Calculadoras"
      tier="free"
      instructions={[
        'Introduce los datos de la baja médica (Base reguladora, días de baja y tipo de contingencia).',
        'Selecciona el complemento de convenio aplicable a tu entidad (ej. hasta el 100% en Acción Social).',
        'Si hubo contrato de interinidad/sustitución, añade los datos del sustituto y bonificación.',
        'Obtén la liquidación desglosada separando el pago delegado (no subvencionable) del coste real imputable.',
        'Exporta el certificado y cuadro liquidativo en PDF para el expediente de justificación.'
      ]}
    >
      <BajasCalculator 
        initialData={initialData} 
        projectId={projectId} 
        projectName={projectName} 
      />
    </ToolLayout>
  );
}
