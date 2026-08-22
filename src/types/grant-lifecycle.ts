export type GrantLifecycleStage = 
  | 'borrador'
  | 'solicitado'
  | 'subsanacion'
  | 'propuesta_provisional'
  | 'reformulacion'
  | 'concedido'
  | 'en_ejecucion'
  | 'en_justificacion'
  | 'justificado'
  | 'cerrado'
  | 'denegado'
  | 'desistido';

export type FundingType = 'publica' | 'privada' | 'europea' | 'consorcio';

export interface FundingRule {
  id: string;
  ruleKey: string;
  ruleValue: string;
  citationArticle?: string;
  isMandatory: boolean;
  documentSource?: string;
}

export interface FundingCall {
  id: string;
  title: string;
  funderName: string;
  callType: FundingType;
  codeReference?: string;
  budgetMax: number;
  cofinancingPctMin: number;
  indirectCostPctMax: number;
  executionMonths: number;
  submissionDeadline?: string;
  justificationDeadline?: string;
  status: 'borrador' | 'abierta' | 'cerrada' | 'resuelta';
  rules: FundingRule[];
  rawText?: string;
}

export type VersionType = 
  | 'solicitud_borrador'
  | 'solicitud_presentada'
  | 'reformulacion'
  | 'baseline_autorizada'
  | 'modificacion_autorizada';

export interface ProjectVersion {
  id: string;
  versionNumber: number;
  versionType: VersionType;
  isActive: boolean;
  createdAt: string;
  changeSummary: string;
  snapshotData: Record<string, unknown>;
}

export interface ProjectObjective {
  id: string;
  code: string; // OG, OE1, OE2
  type: 'general' | 'especifico';
  description: string;
}

export interface ProjectActivity {
  id: string;
  objectiveId: string;
  code: string; // A1.1, A1.2
  name: string;
  description: string;
  startMonth: number;
  endMonth: number;
  targetBeneficiaries: number;
  executedBeneficiaries?: number;
  executedSessions?: number;
  status: 'planificada' | 'en_curso' | 'completada' | 'cancelada' | 'reformulada';
  assignedStaffIds?: string[];
}

export interface ProjectIndicator {
  id: string;
  objectiveId?: string;
  activityId?: string;
  code: string;
  name: string;
  type: 'proceso' | 'resultado' | 'impacto';
  baselineValue: number;
  targetValue: number;
  achievedValue?: number;
  verificationSource: string;
}

export interface BudgetLineItem {
  id: string;
  activityId?: string;
  category: 'personal' | 'actividades' | 'suministros' | 'viajes_dietas' | 'auditoria' | 'indirectos';
  description: string;
  unitCost: number;
  units: number;
  totalAmount: number;
  grantAmount: number;
  ownFundsAmount: number;
  workerId?: string;
}

export interface ExpenseItem {
  id: string;
  budgetLineId?: string;
  activityId?: string;
  invoiceNumber: string;
  providerName: string;
  providerNif: string;
  concept: string;
  issueDate: string;
  paymentDate?: string;
  totalAmount: number;
  imputationPct: number;
  imputedAmount: number;
  paymentMethod: 'transferencia_sepa' | 'tarjeta_entidad' | 'domiciliacion' | 'efectivo_menor';
  hasInvoiceFile: boolean;
  hasPaymentFile: boolean;
  invoiceFileName?: string;
  paymentFileName?: string;
  invoiceFileUrl?: string;
  paymentFileUrl?: string;
}

export interface RequirementItem {
  id: string;
  notificationDate: string;
  deadlineDays: number;
  deadlineDate: string;
  funderOrganism: string;
  description: string;
  affectedDocuments: string;
  status: 'pendiente' | 'preparado' | 'presentado' | 'desestimado';
  registryProofFileName?: string;
  registryProofUrl?: string;
  submissionDate?: string;
  notes?: string;
}

export type IncidentCategory = 
  | 'personal_baja'
  | 'cambio_personal'
  | 'retraso_calendario'
  | 'variacion_presupuesto'
  | 'cambio_actividad'
  | 'disminucion_participantes'
  | 'otro';

export type IncidentLegalSeverity = 
  | 'informativa'
  | 'comunicacion_previa'
  | 'autorizacion_previa'
  | 'modificacion_resolucion'
  | 'riesgo_incumplimiento'
  | 'no_determinado';

export interface ProjectIncidentItem {
  id: string;
  title: string;
  description: string;
  category: IncidentCategory;
  legalSeverity: IncidentLegalSeverity;
  budgetImpact?: number;
  status: 'abierta' | 'solicitada' | 'autorizada' | 'rechazada' | 'resuelta';
  authorizationDate?: string;
  resolutionDocName?: string;
  resolutionDocUrl?: string;
  createdAt: string;
}

export interface DeadlineItem {
  id: string;
  title: string;
  deadlineDate: string;
  deadlineType: 'solicitud' | 'subsanacion' | 'reformulacion' | 'informe_intermedio' | 'justificacion_final' | 'alegaciones';
  isCompleted: boolean;
  reminderDays: number;
}

export interface OrganizationDocument {
  id: string;
  title: string;
  category: 
    | 'estatutos'
    | 'cif'
    | 'poderes_representacion'
    | 'certificado_aeat'
    | 'certificado_tgss'
    | 'memoria_anual'
    | 'anexo_convocatoria'
    | 'factura'
    | 'justificante_pago'
    | 'evidencia_actividad'
    | 'hoja_firmas'
    | 'resolucion_concesion'
    | 'otro';
  fileUrl: string;
  fileName: string;
  fileSize?: number;
  mimeType?: string;
  expirationDate?: string;
  isValid: boolean;
  verificationHash?: string;
  createdAt: string;
}

export interface CrossValidationIssue {
  id: string;
  severity: 'error' | 'warning' | 'info';
  category: 'logica' | 'economica' | 'documental' | 'temporal' | 'administrativa';
  title: string;
  message: string;
  citationRule?: string;
  suggestedAction?: string;
}
