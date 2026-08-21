import type { Metadata } from 'next';
import { ToolLayout } from '@/components/tools/ToolLayout';
import { CostesCalculator } from './CostesCalculator';

export const metadata: Metadata = {
  title: 'Calculadora de costes de proyecto',
  description: 'Diseña el presupuesto de tu proyecto social por partidas y obtén el desglose completo con costes indirectos.',
};

export default function CostesProyectoPage() {
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
      <CostesCalculator />
    </ToolLayout>
  );
}
