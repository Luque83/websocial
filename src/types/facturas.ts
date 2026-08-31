/**
 * Tipos de datos para el Gestor Central de Facturas, Proveedores e Imputaciones
 */

export type CategoriaGasto = 
  | 'alquiler'
  | 'suministros'
  | 'material_fungible'
  | 'equipamiento'
  | 'auditoria'
  | 'consultoria'
  | 'servicios_profesionales'
  | 'viajes_dietas'
  | 'difusion_publicidad'
  | 'seguros'
  | 'mantenimiento'
  | 'otro';

export const CATEGORIAS_GASTO_LABELS: Record<CategoriaGasto, string> = {
  alquiler: 'Alquiler y Arrendamientos',
  suministros: 'Suministros (Luz, Agua, Gas, Internet)',
  material_fungible: 'Material Fungible y Pedagógico',
  equipamiento: 'Equipamiento e Inventariable',
  auditoria: 'Auditoría Externa Oficial (ROAC)',
  consultoria: 'Consultoría y Asistencia Técnica',
  servicios_profesionales: 'Servicios Profesionales Independientes',
  viajes_dietas: 'Desplazamientos, Viajes y Dietas',
  difusion_publicidad: 'Difusión, Comunicación y Publicidad',
  seguros: 'Seguros y Responsabilidad Civil',
  mantenimiento: 'Mantenimiento y Reparaciones',
  otro: 'Otros Gastos Directos',
};

export interface ProveedorItem {
  id: string;
  nombre: string;
  nif: string;
  categoria: CategoriaGasto;
  email?: string;
  telefono?: string;
  iban?: string;
  direccion?: string;
  contacto?: string;
  notas?: string;
  createdAt?: string;
}

export const DEFAULT_PROVEEDORES_CATALOG: ProveedorItem[] = [
  {
    id: 'prov-1',
    nombre: 'Inmobiliaria Social Centro S.L.',
    nif: 'B-84920193',
    categoria: 'alquiler',
    email: 'contacto@inmosocial.es',
    telefono: '914 281 920',
    iban: 'ES91 2100 0418 4502 0005 1829',
    direccion: 'C/ Gran Vía 42, 3º D, Madrid',
    contacto: 'Carlos Mendoza',
    notas: 'Arrendamiento de sede central y aulas polivalentes para talleres'
  },
  {
    id: 'prov-2',
    nombre: 'Iberdrola Clientes S.A.U.',
    nif: 'A-95748392',
    categoria: 'suministros',
    email: 'empresas@iberdrola.es',
    telefono: '900 225 235',
    iban: 'ES76 0049 1500 0512 3456 7890',
    direccion: 'Plaza Euskadi 5, Bilbao',
    contacto: 'Atención Corporativa',
    notas: 'Suministro eléctrico sede y centros de intervención social'
  },
  {
    id: 'prov-3',
    nombre: 'Auditoría & Consultoría Social ROAC S.L.P.',
    nif: 'B-41928374',
    categoria: 'auditoria',
    email: 'informes@auditorsocial.es',
    telefono: '954 112 334',
    iban: 'ES45 0081 0234 5600 0123 4567',
    direccion: 'Avda. Constitución 18, Sevilla',
    contacto: 'María Valenzuela (Auditora ROAC nº 2198)',
    notas: 'Auditoría obligatoria de justificaciones de subvenciones públicas'
  },
  {
    id: 'prov-4',
    nombre: 'Suministros Pedagógicos del Sur S.A.',
    nif: 'A-91823741',
    categoria: 'material_fungible',
    email: 'pedidos@suministrosur.es',
    telefono: '955 839 201',
    iban: 'ES23 2038 9876 5400 1234 5678',
    direccion: 'Polígono Ind. La Isla, Calle 4, Dos Hermanas',
    contacto: 'Antonio Ruiz',
    notas: 'Material de papelería, didáctico y kits para beneficiarios'
  },
  {
    id: 'prov-5',
    nombre: 'Tecnología Social Cloud & Software S.L.',
    nif: 'B-87654321',
    categoria: 'servicios_profesionales',
    email: 'soporte@tecnosocial.es',
    telefono: '910 394 857',
    iban: 'ES67 0182 4567 8901 2345 6789',
    direccion: 'C/ Alcalá 120, Madrid',
    contacto: 'Javier Lucas',
    notas: 'Licencias de software de gestión y almacenamiento seguro RGPD'
  }
];

export interface FacturaImputacionProject {
  id?: string;
  projectId: string;
  projectName: string;
  partidaId?: string;
  partidaName?: string;
  pctImputado: number;
  importeImputado: number;
  activeMonths?: number[]; // [1, 2, 3...]
}

export interface FacturaGlobalItem {
  id: string;
  proveedorId?: string;
  proveedorNombre: string;
  nif: string;
  numFactura: string;
  fechaEmision: string; // YYYY-MM-DD
  concepto: string;
  categoria: CategoriaGasto;
  baseImponible: number;
  ivaPct: number;
  ivaImporte: number;
  totalFactura: number;
  metodoPago: 'transferencia_sepa' | 'tarjeta' | 'domiciliacion' | 'efectivo' | 'otro';
  justificantePago: boolean;
  fechaPago?: string;
  refBancaria?: string;
  facturaFileUrl?: string;
  facturaFileName?: string;
  justificanteFileUrl?: string;
  justificanteFileName?: string;
  presupuestosPreviosFileUrl?: string;
  presupuestosPreviosFileName?: string;
  imputaciones: FacturaImputacionProject[];
  observaciones?: string;
  createdAt?: string;
}

export interface FacturasMatrixData {
  facturas: FacturaGlobalItem[];
  proveedores: ProveedorItem[];
  updatedAt?: string;
}
