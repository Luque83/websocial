import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getOrgStaffCatalogAction } from '@/app/actions/personal';
import { StaffDirectoryManager } from './StaffDirectoryManager';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

export const metadata = {
  title: 'Plantilla y Nóminas · WebSocial',
  description: 'Gestión centralizada del personal de la entidad con sus salarios brutos y costes de Seguridad Social.',
};

export default async function PersonalPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const workers = await getOrgStaffCatalogAction();

  return <StaffDirectoryManager initialWorkers={workers} />;
}
