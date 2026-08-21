import type { Metadata } from 'next';
import { ToolLayout } from '@/components/tools/ToolLayout';
import { PersonalMatrixCalculator } from './PersonalMatrixCalculator';
import { getToolData } from '@/app/actions/tools';
import { createClient } from '@/lib/supabase/server';

export const metadata: Metadata = {
  title: 'Matriz de Imputación de Personal y Costes Salariales',
  description: 'Gestión de plantilla, costes empresa y reparto multiproyecto para justificación de gastos de personal en subvenciones públicas.',
};

export default async function GestionPersonalPage({
  searchParams,
}: {
  searchParams: Promise<{ projectId?: string }>;
}) {
  const sp = await searchParams;
  const projectId = sp?.projectId as string | undefined;

  const supabase = await createClient();
  let initialData = undefined;
  let projectName = undefined;

  // Obtener proyectos disponibles para vincular personal
  const { data: projectsData } = await supabase
    .from('projects')
    .select('id, name')
    .order('name', { ascending: true });

  const availableProjects = projectsData || [];

  if (projectId) {
    initialData = await getToolData(projectId, 'gestion-personal');
    const { data: p } = await supabase.from('projects').select('name').eq('id', projectId).single();
    if (p) projectName = p.name;
  }

  return (
    <ToolLayout
      title="Matriz de Imputación de Personal"
      description="Gestiona la plantilla de tu entidad social, calcula el coste empresa real (Bruto + SS Patronal) y distribuye las horas y costes entre proyectos con control anti-sobreimputación."
      category="Calculadoras"
      tier="free"
      instructions={[
        'Introduce los datos de tu plantilla técnica (Salario bruto, pagas 12/14 y % de SS Patronal).',
        'Asigna a cada trabajador/a las horas semanales y meses imputados a cada proyecto de la entidad.',
        'Verifica que ningún trabajador supere el 100% de su jornada laboral de convenio (37.5h o 40h).',
        'Consulta la Matriz Global Consolidada para ver el reparto entre todas las subvenciones de la ONG.',
        'Exporta el Cuadro Oficial de Imputación en PDF para auditorías de justificación.',
      ]}
    >
      <PersonalMatrixCalculator
        initialData={initialData}
        projectId={projectId}
        projectName={projectName}
        availableProjects={availableProjects}
      />
    </ToolLayout>
  );
}
