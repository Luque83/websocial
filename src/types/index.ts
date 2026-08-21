export interface ToolItem {
  id: string;
  slug: string;
  name: string;
  description: string;
  category: ToolCategory;
  tier: 'free' | 'pro';
  status: 'available' | 'coming-soon' | 'beta';
  icon: string;
}

export type ToolCategory = 
  | 'calculadoras'
  | 'generadores'
  | 'plantillas'
  | 'gestion'
  | 'documentos';

export const TOOL_CATEGORY_LABELS: Record<ToolCategory, string> = {
  calculadoras: 'Calculadoras',
  generadores: 'Generadores',
  plantillas: 'Plantillas',
  gestion: 'Gestión',
  documentos: 'Documentos',
};

export interface BlogPost {
  slug: string;
  title: string;
  excerpt: string;
  date: string;
  category: string;
  readTime: string;
}

export interface ResourceItem {
  title: string;
  description: string;
  category: string;
  href: string;
  type: 'guide' | 'legislation' | 'template' | 'tool';
}
