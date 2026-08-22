import React from 'react';
import type { Metadata } from 'next';
import { getOrganizationAction } from '@/app/actions/organizations';
import { TeamManager } from './TeamManager';

export const metadata: Metadata = {
  title: 'Equipo y Colaboradores',
  description: 'Gestión de miembros, roles y permisos de la entidad en WebSocial.',
};

export default async function EquipoPage() {
  const org = await getOrganizationAction();

  return <TeamManager initialOrg={org} />;
}
