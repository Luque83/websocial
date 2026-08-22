import type { Metadata } from 'next';
import { ToolLayout } from '@/components/tools/ToolLayout';
import { ChecklistJustificacion } from './ChecklistJustificacion';

export const metadata: Metadata = {
  title: 'Checklist de Justificación de Subvenciones para ONG',
  description: 'Lista de control interactiva para revisar facturas, justificantes de pago, nóminas, evidencias de actividades y memoria técnica antes de la auditoría.',
};

export default function ChecklistPage() {
  return (
    <ToolLayout
      title="Checklist de Justificación de Subvenciones"
      description="Verifica de forma exhaustiva todos los requisitos documentales, facturas, personal, evidencias de ejecución y memoria final exigidos por la Ley General de Subvenciones."
      category="Plantillas"
      tier="free"
      instructions={[
        'Revisa cada uno de los 5 bloques del expediente de justificación.',
        'Marca los documentos que tu entidad ya tiene localizados y firmados.',
        'Identifica al instante los requisitos obligatorios pendientes para evitar requerimientos de subsanación.',
        'Exporta el informe de auditoría preventiva a PDF.'
      ]}
    >
      <ChecklistJustificacion />
    </ToolLayout>
  );
}
