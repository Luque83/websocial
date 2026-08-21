import type { Metadata } from 'next';
import { ToolsCatalog } from './ToolsCatalog';
import type { ToolItem } from '@/types';
import { TOOLS_REGISTRY } from '@/config/tools.registry';

export const metadata: Metadata = {
  title: 'Herramientas profesionales',
  description:
    'Calculadoras, generadores y plantillas para profesionales del sector social. Prorrateo de nóminas, costes de proyecto, marco lógico y más.',
};

const tools: ToolItem[] = TOOLS_REGISTRY.map((t, idx) => ({
  id: String(idx + 1),
  slug: t.slug,
  name: t.name,
  description: t.description,
  category: t.category,
  tier: 'free',
  status: t.status as 'available' | 'coming-soon',
  icon: t.iconName,
}));

export default function HerramientasPage() {
  return (
    <main>
      <ToolsCatalog initialTools={tools} />
    </main>
  );
}
