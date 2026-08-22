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
    status: 'available',
    publicHref: '/herramientas/memoria-proyecto',
    dashboardEnabled: true,
  },
  {
    slug: 'indicadores-impacto',
    name: 'Sistema de Indicadores',
    description: 'Diseña y monitoriza los indicadores de impacto social de tu intervención.',
    iconName: 'BarChart2',
    category: 'gestion',
    status: 'available',
    publicHref: '/herramientas/indicadores-impacto',
    dashboardEnabled: true,
  },
  {
    slug: 'cronograma',
    name: 'Cronograma de Actividades',
    description: 'Planifica y visualiza el calendario de tu proyecto en formato Gantt.',
    iconName: 'Calendar',
    category: 'gestion',
    status: 'available',
    publicHref: '/herramientas/cronograma',
    dashboardEnabled: true,
  },
  {
    slug: 'calculadora-bajas',
    name: 'Calculadora de Bajas e IT',
    description: 'Calcula los tramos de incapacidad temporal y el importe exacto de personal y sustitución imputable a subvenciones.',
    iconName: 'ShieldAlert',
    category: 'calculadoras',
    status: 'available',
    publicHref: '/herramientas/calculadora-bajas',
    dashboardEnabled: true,
  },
  {
    slug: 'gestion-personal',
    name: 'Matriz de Imputación de Personal',
    description: 'Gestión integral de plantilla, costes empresa y reparto multiproyecto con control de horas y sobreimputación.',
    iconName: 'UserCheck',
    category: 'calculadoras',
    status: 'available',
    publicHref: '/herramientas/gestion-personal',
    dashboardEnabled: true,
  },
  {
    slug: 'calculadora-cofinanciacion',
    name: 'Calculadora de Cofinanciación',
    description: 'Calcula el reparto entre subvención, fondos propios y aportación en especie para cumplir los límites de convocatoria.',
    iconName: 'PieChart',
    category: 'calculadoras',
    status: 'available',
    publicHref: '/herramientas/calculadora-cofinanciacion',
    dashboardEnabled: true,
  },
  {
    slug: 'checklist-justificacion',
    name: 'Checklist de Justificación',
    description: 'Auditoría preventiva y lista de control de facturas, pagos, personal y evidencias antes de la entrega oficial.',
    iconName: 'ClipboardCheck',
    category: 'plantillas',
    status: 'available',
    publicHref: '/herramientas/checklist-justificacion',
    dashboardEnabled: true,
  },
];

export const getAvailableTools = () =>
  TOOLS_REGISTRY.filter(t => t.status === 'available');

export const getDashboardTools = () =>
  TOOLS_REGISTRY.filter(t => t.dashboardEnabled && t.status === 'available');
