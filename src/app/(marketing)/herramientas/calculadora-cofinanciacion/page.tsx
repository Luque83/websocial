import type { Metadata } from 'next';
import { ToolLayout } from '@/components/tools/ToolLayout';
import { CofinanciacionCalculator } from './CofinanciacionCalculator';

export const metadata: Metadata = {
  title: 'Calculadora de Cofinanciación y Fondos Propios para ONG',
  description: 'Calcula el porcentaje de subvención, aportación dineraria propia de la entidad y valoración en especie exigida en las bases de convocatorias.',
};

export default function CofinanciacionPage() {
  return (
    <ToolLayout
      title="Calculadora de Cofinanciación y Fondos Propios"
      description="Determina con precisión el reparto entre la subvención solicitada, los fondos propios de tu ONG y la aportación en especie para cumplir con los límites de las bases reguladoras."
      category="Calculadoras"
      tier="free"
      instructions={[
        'Introduce el presupuesto total del proyecto (100%).',
        'Indica el porcentaje máximo subvencionable establecido en las bases.',
        'Añade la aportación en especie (cesión de aulas, voluntarios) y otros cofinanciadores.',
        'Obtén la tabla oficial de fuentes de financiación lista para tus anexos.'
      ]}
    >
      <CofinanciacionCalculator />
    </ToolLayout>
  );
}
