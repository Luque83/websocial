import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getGlobalImputationMatrixAction } from '@/app/actions/personal';
import { GlobalImputationMatrix } from './GlobalImputationMatrix';

export const dynamic = 'force-dynamic';
export const revalidate = 0;

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

  const matrixPayload = await getGlobalImputationMatrixAction();

  return (
    <GlobalImputationMatrix 
      initialWorkers={matrixPayload.workers} 
      projects={matrixPayload.projects}
      initialLifecycleMap={matrixPayload.lifecycleMap}
      initialStats={matrixPayload.globalStats}
    />
  );
}
