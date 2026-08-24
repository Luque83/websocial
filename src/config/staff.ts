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
  contractType?: string;
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

export function normalizeName(name: string): string {
  return (name || '')
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // remove accents
    .toLowerCase()
    .trim();
}

export function isWorkerMatch(
  catalogWorker: { id: string; name: string },
  projectWorker: { id?: string; workerId?: string; name?: string }
): boolean {
  if (!projectWorker) return false;
  if (projectWorker.workerId && projectWorker.workerId === catalogWorker.id) {
    return true;
  }
  if (projectWorker.id && (projectWorker.id === catalogWorker.id || projectWorker.id === `pers-${catalogWorker.id}`)) {
    return true;
  }
  const normCat = normalizeName(catalogWorker.name);
  const normProj = normalizeName(projectWorker.name || '');
  if (!normCat || !normProj) return false;
  if (normCat === normProj) return true;
  if (normCat.includes(normProj) || normProj.includes(normCat)) return true;
  
  // Word intersection match (e.g. "Elena Gómez Morales" and "Elena Gómez")
  const wordsCat = normCat.split(/\s+/).filter(w => w.length > 2);
  const wordsProj = normProj.split(/\s+/).filter(w => w.length > 2);
  const common = wordsCat.filter(w => wordsProj.includes(w));
  return common.length >= 2 || (common.length === 1 && wordsCat[0] === wordsProj[0]);
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

export interface EstimatedCategoryProfile {
  id: string;
  category: string;
  role: string;
  monthlySalary: number;
  ssPct: number;
  weeklyHours: number;
  maxWeeklyHours: number;
  months: number;
}

export const DEFAULT_CATEGORY_PROFILES: EstimatedCategoryProfile[] = [
  {
    id: 'cat-1',
    category: 'Titulado/a Superior (Grupo 1)',
    role: 'Trabajador/a Social',
    monthlySalary: 2100,
    ssPct: 31.4,
    weeklyHours: 20,
    maxWeeklyHours: 37.5,
    months: 12,
  },
  {
    id: 'cat-2',
    category: 'Titulado/a Medio (Grupo 2)',
    role: 'Educador/a Social',
    monthlySalary: 1850,
    ssPct: 31.4,
    weeklyHours: 18.75,
    maxWeeklyHours: 37.5,
    months: 10,
  },
  {
    id: 'cat-3',
    category: 'Titulado/a Superior (Grupo 1)',
    role: 'Psicólogo/a',
    monthlySalary: 2300,
    ssPct: 31.4,
    weeklyHours: 15,
    maxWeeklyHours: 37.5,
    months: 12,
  },
  {
    id: 'cat-4',
    category: 'Técnico/a Especialista (Grupo 3)',
    role: 'Integrador/a Social',
    monthlySalary: 1750,
    ssPct: 31.4,
    weeklyHours: 20,
    maxWeeklyHours: 37.5,
    months: 10,
  },
  {
    id: 'cat-5',
    category: 'Personal Administrativo (Grupo 4)',
    role: 'Administrativo/a de Gestión',
    monthlySalary: 1600,
    ssPct: 31.4,
    weeklyHours: 10,
    maxWeeklyHours: 37.5,
    months: 12,
  },
  {
    id: 'cat-6',
    category: 'Titulado/a Superior (Grupo 1)',
    role: 'Coordinador/a Técnico/a de Proyecto',
    monthlySalary: 2400,
    ssPct: 31.4,
    weeklyHours: 20,
    maxWeeklyHours: 37.5,
    months: 12,
  }
];

