import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getOrganizationDocumentsAction } from '@/app/actions/grant-lifecycle';
import { DocumentVaultManager } from './DocumentVaultManager';

export const metadata = {
  title: 'Bóveda Documental de la Entidad · WebSocial',
  description: 'Repositorio centralizado de documentación corporativa compartida y certificados oficiales.',
};

export default async function DocumentosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const docs = await getOrganizationDocumentsAction();

  return <DocumentVaultManager initialDocuments={docs} />;
}
