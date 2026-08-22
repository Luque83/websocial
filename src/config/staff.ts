export interface ProjectAllocation {
  id: string;
  projectId?: string;
  projectName: string;
  weeklyHours: number;
  months: number;
}

export interface Worker {
  id: string;
  name: string;
  role: string;
  category: string;
  salaryMonthly: number;
  pagas: number;
  ssPct: number;
  maxWeeklyHours: number;
  allocations: ProjectAllocation[];
}

export interface PersonalMatrixData {
  organizationName?: string;
  workers?: Worker[];
}

export const DEFAULT_STAFF_CATALOG: Worker[] = [
  {
    id: 'w-1',
    name: 'Elena Gómez',
    role: 'Trabajadora Social',
    category: 'Titulada Superior / Grupo 1',
    salaryMonthly: 2100,
    pagas: 12,
    ssPct: 31.4,
    maxWeeklyHours: 37.5,
    allocations: [],
  },
  {
    id: 'w-2',
    name: 'Carlos Ruiz',
    role: 'Educador Social',
    category: 'Titulado Medio / Grupo 2',
    salaryMonthly: 1850,
    pagas: 12,
    ssPct: 31.4,
    maxWeeklyHours: 37.5,
    allocations: [],
  },
  {
    id: 'w-3',
    name: 'Marta Sánchez',
    role: 'Psicóloga / Coordinadora',
    category: 'Titulada Superior / Grupo 1',
    salaryMonthly: 2300,
    pagas: 14,
    ssPct: 32.0,
    maxWeeklyHours: 37.5,
    allocations: [],
  },
  {
    id: 'w-4',
    name: 'David Navarro',
    role: 'Integrador Social',
    category: 'Técnico Especialista / Grupo 3',
    salaryMonthly: 1750,
    pagas: 12,
    ssPct: 31.4,
    maxWeeklyHours: 37.5,
    allocations: [],
  },
  {
    id: 'w-5',
    name: 'Laura Morales',
    role: 'Administrativa Contable',
    category: 'Oficial Administrativo / Grupo 4',
    salaryMonthly: 1600,
    pagas: 14,
    ssPct: 31.4,
    maxWeeklyHours: 37.5,
    allocations: [],
  },
];
