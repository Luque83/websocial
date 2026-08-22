-- ==============================================================================
-- WEBSOCIAL — ESQUEMA INTEGRAL DEL CICLO DE VIDA DE SUBVENCIONES Y PROYECTOS
-- FASE 8: MOTOR RELACIONAL, VERSIONADO, GRAFO LÓGICO, INCIDENCIAS Y JUSTIFICACIÓN
-- ==============================================================================

-- 1. EXTENSIÓN DE CONVOCATORIAS Y BASES REGULADORAS
CREATE TABLE IF NOT EXISTS public.funding_calls (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID REFERENCES public.organizations(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  funder_name TEXT NOT NULL,
  call_type TEXT NOT NULL CHECK (call_type IN ('publica', 'privada', 'europea', 'consorcio')),
  code_reference TEXT,
  budget_max NUMERIC(12, 2) DEFAULT 0,
  cofinancing_pct_min NUMERIC(5, 2) DEFAULT 0,
  indirect_cost_pct_max NUMERIC(5, 2) DEFAULT 10,
  execution_months INTEGER DEFAULT 12,
  submission_deadline TIMESTAMPTZ,
  justification_deadline TEXT,
  status TEXT DEFAULT 'abierta' CHECK (status IN ('borrador', 'abierta', 'cerrada', 'resuelta')),
  raw_text TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. REGLAS EXTRAÍDAS DE CONVOCATORIA (TRAZABILIDAD Y LÍMITES)
CREATE TABLE IF NOT EXISTS public.funding_rules (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  funding_call_id UUID REFERENCES public.funding_calls(id) ON DELETE CASCADE,
  rule_key TEXT NOT NULL,
  rule_value TEXT NOT NULL,
  citation_article TEXT,
  is_mandatory BOOLEAN DEFAULT true,
  document_source TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 3. ESTADOS Y VERSIONES INMUTABLES DE PROYECTO (VERSIONADO / SNAPSHOTS)
CREATE TABLE IF NOT EXISTS public.project_versions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  version_number INTEGER NOT NULL,
  version_type TEXT NOT NULL CHECK (version_type IN ('solicitud_borrador', 'solicitud_presentada', 'reformulacion', 'baseline_autorizada', 'modificacion_autorizada')),
  is_active BOOLEAN DEFAULT false,
  change_summary TEXT,
  snapshot_data JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_by UUID REFERENCES auth.users(id),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. GRAFO LÓGICO: OBJETIVOS, ACTIVIDADES E INDICADORES
CREATE TABLE IF NOT EXISTS public.project_objectives (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  code TEXT NOT NULL, -- ej. OG, OE1, OE2
  type TEXT NOT NULL CHECK (type IN ('general', 'especifico')),
  description TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.project_activities (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  objective_id UUID NOT NULL REFERENCES public.project_objectives(id) ON DELETE CASCADE,
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  code TEXT NOT NULL, -- ej. A1.1, A1.2
  name TEXT NOT NULL,
  description TEXT,
  start_month INTEGER DEFAULT 1,
  end_month INTEGER DEFAULT 12,
  target_beneficiaries INTEGER DEFAULT 0,
  executed_beneficiaries INTEGER DEFAULT 0,
  executed_sessions INTEGER DEFAULT 0,
  status TEXT DEFAULT 'planificada' CHECK (status IN ('planificada', 'en_curso', 'completada', 'cancelada', 'reformulada')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.project_indicators (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  objective_id UUID REFERENCES public.project_objectives(id) ON DELETE SET NULL,
  activity_id UUID REFERENCES public.project_activities(id) ON DELETE SET NULL,
  code TEXT NOT NULL,
  name TEXT NOT NULL,
  indicator_type TEXT DEFAULT 'resultado' CHECK (indicator_type IN ('proceso', 'resultado', 'impacto')),
  baseline_value NUMERIC(10, 2) DEFAULT 0,
  target_value NUMERIC(10, 2) NOT NULL,
  achieved_value NUMERIC(10, 2) DEFAULT 0,
  verification_source TEXT NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 5. LÍNEAS PRESUPUESTARIAS Y GASTOS (CONTROL ECONÓMICO)
CREATE TABLE IF NOT EXISTS public.budget_lines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  activity_id UUID REFERENCES public.project_activities(id) ON DELETE SET NULL,
  category TEXT NOT NULL CHECK (category IN ('personal', 'actividades', 'suministros', 'viajes_dietas', 'auditoria', 'indirectos')),
  description TEXT NOT NULL,
  unit_cost NUMERIC(10, 2) DEFAULT 0,
  units NUMERIC(10, 2) DEFAULT 1,
  total_amount NUMERIC(12, 2) NOT NULL,
  grant_amount NUMERIC(12, 2) DEFAULT 0,
  own_funds_amount NUMERIC(12, 2) DEFAULT 0,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

CREATE TABLE IF NOT EXISTS public.expenses (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  budget_line_id UUID REFERENCES public.budget_lines(id) ON DELETE SET NULL,
  activity_id UUID REFERENCES public.project_activities(id) ON DELETE SET NULL,
  invoice_number TEXT NOT NULL,
  provider_name TEXT NOT NULL,
  provider_nif TEXT NOT NULL,
  concept TEXT NOT NULL,
  issue_date DATE NOT NULL,
  payment_date DATE,
  total_amount NUMERIC(10, 2) NOT NULL,
  imputation_pct NUMERIC(5, 2) DEFAULT 100,
  imputed_amount NUMERIC(10, 2) NOT NULL,
  payment_method TEXT DEFAULT 'transferencia_sepa' CHECK (payment_method IN ('transferencia_sepa', 'tarjeta_entidad', 'domiciliacion', 'efectivo_menor')),
  has_invoice_file BOOLEAN DEFAULT false,
  has_payment_file BOOLEAN DEFAULT false,
  invoice_file_url TEXT,
  payment_file_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 6. SUBSANACIONES Y REQUERIMIENTOS ADMINISTRATIVOS
CREATE TABLE IF NOT EXISTS public.requirements (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  notification_date DATE NOT NULL,
  deadline_days INTEGER DEFAULT 10,
  deadline_date DATE NOT NULL,
  funder_organism TEXT NOT NULL,
  description TEXT NOT NULL,
  affected_documents TEXT,
  status TEXT DEFAULT 'pendiente' CHECK (status IN ('pendiente', 'preparado', 'presentado', 'desestimado')),
  registry_proof_file_url TEXT,
  submission_date DATE,
  notes TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 7. GESTOR DE INCIDENCIAS Y MODIFICACIONES
CREATE TABLE IF NOT EXISTS public.project_incidents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  description TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('personal_baja', 'cambio_personal', 'retraso_calendario', 'variacion_presupuesto', 'cambio_actividad', 'disminucion_participantes', 'otro')),
  legal_severity TEXT NOT NULL CHECK (legal_severity IN ('informativa', 'comunicacion_previa', 'autorizacion_previa', 'modificacion_resolucion', 'riesgo_incumplimiento', 'no_determinado')),
  budget_impact NUMERIC(10, 2) DEFAULT 0,
  status TEXT DEFAULT 'abierta' CHECK (status IN ('abierta', 'solicitada', 'autorizada', 'rechazada', 'resuelta')),
  authorization_date DATE,
  resolution_doc_url TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 8. MOTOR DE PLAZOS Y VENCIMIENTOS
CREATE TABLE IF NOT EXISTS public.project_deadlines (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  title TEXT NOT NULL,
  deadline_date DATE NOT NULL,
  deadline_type TEXT NOT NULL CHECK (deadline_type IN ('solicitud', 'subsanacion', 'reformulacion', 'informe_intermedio', 'justificacion_final', 'alegaciones')),
  is_completed BOOLEAN DEFAULT false,
  reminder_days INTEGER DEFAULT 5,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 9. BÓVEDA DOCUMENTAL COMPARTIDA Y EVIDENCIAS
CREATE TABLE IF NOT EXISTS public.organization_documents (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  project_id UUID REFERENCES public.projects(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  category TEXT NOT NULL CHECK (category IN ('estatutos', 'cif', 'poderes_representacion', 'certificado_aeat', 'certificado_tgss', 'memoria_anual', 'anexo_convocatoria', 'factura', 'justificante_pago', 'evidencia_actividad', 'hoja_firmas', 'resolucion_concesion', 'otro')),
  file_url TEXT NOT NULL,
  file_name TEXT NOT NULL,
  file_size INTEGER,
  mime_type TEXT,
  expiration_date DATE,
  is_valid BOOLEAN DEFAULT true,
  verification_hash TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ==============================================================================
-- 10. SEGURIDAD RLS
-- ==============================================================================
ALTER TABLE public.funding_calls ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.funding_rules ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_objectives ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_activities ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_indicators ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.budget_lines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.expenses ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.requirements ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_incidents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_deadlines ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_documents ENABLE ROW LEVEL SECURITY;

-- Políticas permisivas autenticadas para la entidad
CREATE POLICY "Users can manage funding_calls of their org" ON public.funding_calls FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can manage funding_rules" ON public.funding_rules FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can manage project_versions" ON public.project_versions FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can manage project_objectives" ON public.project_objectives FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can manage project_activities" ON public.project_activities FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can manage project_indicators" ON public.project_indicators FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can manage budget_lines" ON public.budget_lines FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can manage expenses" ON public.expenses FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can manage requirements" ON public.requirements FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can manage project_incidents" ON public.project_incidents FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can manage project_deadlines" ON public.project_deadlines FOR ALL TO authenticated USING (true);
CREATE POLICY "Users can manage organization_documents" ON public.organization_documents FOR ALL TO authenticated USING (true);
