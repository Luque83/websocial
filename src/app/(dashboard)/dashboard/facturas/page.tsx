import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { getGlobalFacturasAction } from '@/app/actions/facturas';
import { GlobalFacturasManager } from './GlobalFacturasManager';

export const metadata = {
  title: 'Gestor Central de Facturas y Proveedores | WebSocial',
  description: 'Libro oficial de facturas, reparto multiproyecto, control de contratación LGS y justificación económica.',
};

export default async function FacturasPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const { facturas, proveedores, projects } = await getGlobalFacturasAction();

  return (
    <GlobalFacturasManager
      initialFacturas={facturas}
      initialProveedores={proveedores}
      projects={projects}
    />
  );
}
