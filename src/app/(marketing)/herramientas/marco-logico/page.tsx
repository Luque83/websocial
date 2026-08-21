import type { Metadata } from 'next';
import { ToolLayout } from '@/components/tools/ToolLayout';
import { MarcoLogicoGenerator } from './MarcoLogicoGenerator';

export const metadata: Metadata = {
  title: 'Generador de Marco Lógico',
  description: 'Crea la Matriz de Marco Lógico de tu proyecto social paso a paso. Genera la tabla completa con objetivos, resultados, actividades, indicadores y fuentes.',
};

export default function MarcoLogicoPage() {
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
      <MarcoLogicoGenerator />
    </ToolLayout>
  );
}
