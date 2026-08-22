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
