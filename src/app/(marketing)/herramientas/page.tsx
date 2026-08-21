import type { Metadata } from 'next';
import { ToolsCatalog } from './ToolsCatalog';
import type { ToolItem } from '@/types';

export const metadata: Metadata = {
  title: 'Herramientas profesionales',
  description:
    'Calculadoras, generadores y plantillas para profesionales del sector social. Prorrateo de nóminas, costes de proyecto, marco lógico y más.',
};

const tools: ToolItem[] = [
  // ── AVAILABLE (Fase 2) ───────────────────────────────────────────────
  {
    id: '1',
    slug: 'prorrateo-nominas',
    name: 'Prorrateo de nóminas',
    description:
      'Calcula el porcentaje e importe de salario imputable a cada proyecto cuando un/a trabajador/a comparte jornada entre varios proyectos sociales.',
    category: 'calculadoras',
    tier: 'free',
    status: 'available',
    icon: 'Calculator',
  },
  {
    id: '2',
    slug: 'costes-proyecto',
    name: 'Costes de proyecto',
    description:
      'Diseña el presupuesto de tu proyecto social por partidas: personal, material, actividades, comunicación y costes indirectos.',
    category: 'calculadoras',
    tier: 'free',
    status: 'available',
    icon: 'BarChart3',
  },
  {
    id: '3',
    slug: 'marco-logico',
    name: 'Generador de Marco Lógico',
    description:
      'Construye la Matriz de Marco Lógico de tu proyecto paso a paso: objetivos, resultados, actividades, indicadores y fuentes de verificación.',
    category: 'generadores',
    tier: 'free',
    status: 'available',
    icon: 'ClipboardCheck',
  },
  // ── COMING SOON (Fases futuras) ──────────────────────────────────────
  {
    id: '4',
    slug: 'generador-informes',
    name: 'Generador de informes sociales',
    description:
      'Genera informes de intervención social estructurados y exportables a Word/PDF.',
    category: 'documentos',
    tier: 'free',
    status: 'coming-soon',
    icon: 'FileText',
  },
  {
    id: '5',
    slug: 'checklist-justificacion',
    name: 'Checklist de justificación',
    description:
      'Lista de verificación para asegurar que tu justificación de subvención cumple todos los requisitos.',
    category: 'plantillas',
    tier: 'free',
    status: 'coming-soon',
    icon: 'FileCheck',
  },
  {
    id: '6',
    slug: 'dashboard-indicadores',
    name: 'Dashboard de impacto',
    description:
      'Visualiza y gestiona los indicadores de seguimiento de tus proyectos en tiempo real.',
    category: 'gestion',
    tier: 'pro',
    status: 'coming-soon',
    icon: 'BarChart3',
  },
  {
    id: '7',
    slug: 'gestor-casos',
    name: 'Gestor de casos',
    description:
      'Seguimiento profesional de intervenciones sociales con historial de actuaciones.',
    category: 'gestion',
    tier: 'pro',
    status: 'coming-soon',
    icon: 'Briefcase',
  },
  {
    id: '8',
    slug: 'directorio-recursos',
    name: 'Directorio de recursos',
    description:
      'Mapa de recursos sociales, servicios y entidades por zona geográfica.',
    category: 'generadores',
    tier: 'free',
    status: 'coming-soon',
    icon: 'Users',
  },
  {
    id: '9',
    slug: 'buscador-subvenciones',
    name: 'Buscador de subvenciones',
    description:
      'Encuentra convocatorias de subvenciones adecuadas a tu entidad y proyectos.',
    category: 'documentos',
    tier: 'free',
    status: 'coming-soon',
    icon: 'BookOpen',
  },
];

export default function HerramientasPage() {
  return (
    <main>
      <ToolsCatalog initialTools={tools} />
    </main>
  );
}
