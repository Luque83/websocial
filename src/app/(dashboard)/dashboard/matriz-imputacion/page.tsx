import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getGlobalImputationMatrixAction } from '@/app/actions/personal';
import { GlobalImputationMatrix } from './GlobalImputationMatrix';

export const metadata = {
  title: 'Matriz de Imputación de Personal Multiproyecto · WebSocial',
  description: 'Gestión cruzada y prevención de sobreimputación horaria de trabajadores entre proyectos y subvenciones.',
};

export default async function MatrizImputacionPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { workers, projects } = await getGlobalImputationMatrixAction();

  return <GlobalImputationMatrix initialWorkers={workers} projects={projects} />;
}
