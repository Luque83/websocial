import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getGlobalDeadlinesAction } from '@/app/actions/grant-lifecycle';
import { DeadlinesManager } from './DeadlinesManager';

export const metadata = {
  title: 'Motor de Plazos y Alertas · WebSocial',
  description: 'Supervisión de fechas límite y requerimientos administrativos de convocatorias y justificaciones.',
};

export default async function PlazosPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const deadlines = await getGlobalDeadlinesAction();

  return <DeadlinesManager initialDeadlines={deadlines} />;
}
