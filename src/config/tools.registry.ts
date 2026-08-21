import { ToolCategory } from '@/types';

export type ToolStatus = 'available' | 'coming-soon';

export interface ToolRegistryEntry {
  slug: string;
  name: string;
  description: string;
  iconName: string; // nombre del icono de lucide-react
  category: ToolCategory;
  status: ToolStatus;
  publicHref: string;
  dashboardEnabled: boolean;
}

export const TOOLS_REGISTRY: ToolRegistryEntry[] = [
  {
    slug: 'marco-logico',
    name: 'Generador de Marco Lógico',
    description: 'Diseña la matriz de marco lógico completa con objetivos, indicadores, medios de verificación y supuestos.',
    iconName: 'Target',
    category: 'generadores',
    status: 'available',
    publicHref: '/herramientas/marco-logico',
    dashboardEnabled: true,
  },
  {
    slug: 'costes-proyecto',
    name: 'Calculadora de Costes',
    description: 'Elabora el presupuesto detallado del proyecto por partidas: personal, material, actividades y más.',
    iconName: 'Calculator',
    category: 'calculadoras',
    status: 'available',
    publicHref: '/herramientas/costes-proyecto',
    dashboardEnabled: true,
  },
  {
    slug: 'prorrateo-nominas',
    name: 'Prorrateo de Nóminas',
    description: 'Reparte los costes salariales entre proyectos según las horas dedicadas a cada uno.',
    iconName: 'Users',
    category: 'calculadoras',
    status: 'available',
    publicHref: '/herramientas/prorrateo-nominas',
    dashboardEnabled: true,
  },
  {
    slug: 'memoria-proyecto',
    name: 'Generador de Memoria',
    description: 'Genera automáticamente la memoria narrativa de tu proyecto social.',
    iconName: 'FileText',
    category: 'generadores',
    status: 'coming-soon',
    publicHref: '/herramientas/memoria-proyecto',
    dashboardEnabled: false,
  },
  {
    slug: 'indicadores-impacto',
    name: 'Sistema de Indicadores',
    description: 'Diseña y monitoriza los indicadores de impacto social de tu intervención.',
    iconName: 'BarChart2',
    category: 'gestion',
    status: 'coming-soon',
    publicHref: '/herramientas/indicadores-impacto',
    dashboardEnabled: false,
  },
  {
    slug: 'cronograma',
    name: 'Cronograma de Actividades',
    description: 'Planifica y visualiza el calendario de tu proyecto en formato Gantt.',
    iconName: 'Calendar',
    category: 'gestion',
    status: 'coming-soon',
    publicHref: '/herramientas/cronograma',
    dashboardEnabled: false,
  },
];

export const getAvailableTools = () =>
  TOOLS_REGISTRY.filter(t => t.status === 'available');

export const getDashboardTools = () =>
  TOOLS_REGISTRY.filter(t => t.dashboardEnabled && t.status === 'available');
