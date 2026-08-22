-- ==============================================================================
-- WEBSOCIAL — ESQUEMA COMPLETO DE BASE DE DATOS Y SEGURIDAD SUPABASE
-- ==============================================================================

-- 1. TABLA DE PROYECTOS (EXPEDIENTES)
CREATE TABLE IF NOT EXISTS public.projects (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  description TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 2. TABLA DE MÓDULOS Y EXPEDIENTES INTEGRADOS (DATA CONSOLIDADA)
CREATE TABLE IF NOT EXISTS public.project_tools (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  project_id UUID NOT NULL REFERENCES public.projects(id) ON DELETE CASCADE,
  tool_slug TEXT NOT NULL,
  data JSONB DEFAULT '{}'::jsonb NOT NULL,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  CONSTRAINT uq_project_tool UNIQUE (project_id, tool_slug)
);

-- 3. TABLA DE PERFILES DE ORGANIZACIÓN / ENTIDAD (MULTITENANCY)
CREATE TABLE IF NOT EXISTS public.organizations (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  owner_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  name TEXT NOT NULL,
  cif TEXT,
  address TEXT,
  phone TEXT,
  website TEXT,
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL,
  updated_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- 4. TABLA DE MIEMBROS DE EQUIPO Y ROLES
CREATE TABLE IF NOT EXISTS public.organization_members (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  organization_id UUID NOT NULL REFERENCES public.organizations(id) ON DELETE CASCADE,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('director', 'tecnico', 'economico', 'auditor')),
  status TEXT DEFAULT 'active' CHECK (status IN ('active', 'pending')),
  created_at TIMESTAMPTZ DEFAULT now() NOT NULL
);

-- ==============================================================================
-- 5. POLÍTICAS DE SEGURIDAD A NIVEL DE FILA (ROW LEVEL SECURITY - RLS)
-- ==============================================================================

ALTER TABLE public.projects ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.project_tools ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organizations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.organization_members ENABLE ROW LEVEL SECURITY;

-- Limpieza de políticas previas si existieran
DROP POLICY IF EXISTS "Users can access their own projects" ON public.projects;
DROP POLICY IF EXISTS "Users can access tools for their projects" ON public.project_tools;
DROP POLICY IF EXISTS "Users can manage their organizations" ON public.organizations;
DROP POLICY IF EXISTS "Users can view members of their organization" ON public.organization_members;

-- Proyectos: los usuarios solo gestionan sus proyectos o los de su organización
CREATE POLICY "Users can access their own projects"
  ON public.projects FOR ALL
  USING (auth.uid() = user_id);

-- Project Tools: acceso mediante el proyecto padre
CREATE POLICY "Users can access tools for their projects"
  ON public.project_tools FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.projects
      WHERE projects.id = project_tools.project_id
      AND projects.user_id = auth.uid()
    )
  );

-- Organizaciones: acceso por propietario
CREATE POLICY "Users can manage their organizations"
  ON public.organizations FOR ALL
  USING (auth.uid() = owner_id);

-- Miembros: acceso por organización
CREATE POLICY "Users can view members of their organization"
  ON public.organization_members FOR ALL
  USING (
    EXISTS (
      SELECT 1 FROM public.organizations
      WHERE organizations.id = organization_members.organization_id
      AND organizations.owner_id = auth.uid()
    )
  );

-- ==============================================================================
-- 6. STORAGE BUCKET: DOCUMENTOS, FACTURAS Y EVIDENCIAS
-- ==============================================================================

INSERT INTO storage.buckets (id, name, public)
VALUES ('project-documents', 'project-documents', true)
ON CONFLICT (id) DO NOTHING;

DROP POLICY IF EXISTS "Public Read for project documents" ON storage.objects;
DROP POLICY IF EXISTS "Authenticated users can upload project documents" ON storage.objects;

CREATE POLICY "Public Read for project documents"
  ON storage.objects FOR SELECT
  USING (bucket_id = 'project-documents');

CREATE POLICY "Authenticated users can upload project documents"
  ON storage.objects FOR INSERT
  WITH CHECK (bucket_id = 'project-documents' AND auth.role() = 'authenticated');
