import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { getAdminCommercialMetrics } from '@/app/actions/admin';
import { AdminClientManager } from './AdminClientManager';

export const metadata = {
  title: 'Panel Comercial y Clientes · SuperAdmin',
  description: 'Control de suscripciones, ingresos recurrentes (MRR) y gestión de clientes de WebSocial.',
};

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const metrics = await getAdminCommercialMetrics();

  return <AdminClientManager initialMetrics={metrics} />;
}
