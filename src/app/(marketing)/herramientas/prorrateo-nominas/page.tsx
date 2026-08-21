import type { Metadata } from 'next';
import { ToolLayout } from '@/components/tools/ToolLayout';
import { ProrrateoCalculator } from './ProrrateoCalculator';

export const metadata: Metadata = {
  title: 'Calculadora de prorrateo de nóminas',
  description: 'Calcula el porcentaje de nómina imputable a cada proyecto social. Ideal para la justificación de costes de personal en subvenciones.',
};

export default function ProrrateoNominasPage() {
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
      <ProrrateoCalculator />
    </ToolLayout>
  );
}
