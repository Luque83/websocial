'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';
import { saveToolData, getToolData } from '@/app/actions/tools';

export type UserRole = 'director' | 'tecnico' | 'economico' | 'auditor';

export interface TeamMember {
  id: string;
  name: string;
  email: string;
  role: UserRole;
  avatarUrl?: string;
  status: 'active' | 'pending';
  joinedAt: string;
}

export interface OrganizationProfile {
  id: string;
  name: string;
  cif: string;
  address: string;
  phone: string;
  website: string;
  members: TeamMember[];
}

const DEFAULT_MEMBERS: TeamMember[] = [
  {
    id: 'mem-1',
    name: 'Elena Gómez',
    email: 'elena.gomez@asociacion.org',
    role: 'director',
    status: 'active',
    joinedAt: '2025-11-10',
  },
  {
    id: 'mem-2',
    name: 'Carlos Ruiz',
    email: 'carlos.ruiz@asociacion.org',
    role: 'tecnico',
    status: 'active',
    joinedAt: '2026-01-15',
  },
  {
    id: 'mem-3',
    name: 'Laura Martínez',
    email: 'laura.admin@asociacion.org',
    role: 'economico',
    status: 'active',
    joinedAt: '2026-02-01',
  }
];

export async function getOrganizationAction(): Promise<OrganizationProfile> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    throw new Error('Usuario no autenticado');
  }

  // Check if organization profile exists using getToolData
  const orgData = await getToolData('00000000-0000-0000-0000-000000000000', 'perfil-organizacion-equipo') as OrganizationProfile | null;

  if (orgData && orgData.members) {
    return orgData;
  }

  const initialOrg: OrganizationProfile = {
    id: 'org-main',
    name: 'Asociación Acción e Inclusión Social',
    cif: 'G-12345678',
    address: 'Calle Mayor 45, Planta 2, 28013 Madrid',
    phone: '+34 912 345 678',
    website: 'https://accion-inclusion.org',
    members: DEFAULT_MEMBERS,
  };

  // Seed default safely
  try {
    await saveToolData('00000000-0000-0000-0000-000000000000', 'perfil-organizacion-equipo', initialOrg);
  } catch (seedErr) {
    console.warn('Notice: Could not persist initial org profile seed:', seedErr);
  }

  return initialOrg;
}

export async function inviteTeamMemberAction(member: {
  name: string;
  email: string;
  role: UserRole;
}): Promise<{ success: boolean; error?: string }> {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    return { success: false, error: 'Usuario no autenticado' };
  }

  const org = await getOrganizationAction();

  const newMember: TeamMember = {
    id: `mem-${Date.now()}`,
    name: member.name,
    email: member.email,
    role: member.role,
    status: 'active',
    joinedAt: new Date().toISOString().split('T')[0],
  };

  org.members.push(newMember);

  try {
    await saveToolData('00000000-0000-0000-0000-000000000000', 'perfil-organizacion-equipo', org);
  } catch (err) {
    console.warn('Could not save team member:', err);
  }

  revalidatePath('/dashboard/equipo');
  return { success: true };
}

export async function removeTeamMemberAction(memberId: string): Promise<{ success: boolean }> {
  const org = await getOrganizationAction();

  org.members = org.members.filter(m => m.id !== memberId);

  try {
    await saveToolData('00000000-0000-0000-0000-000000000000', 'perfil-organizacion-equipo', org);
  } catch (err) {
    console.warn('Could not save team member removal:', err);
  }

  revalidatePath('/dashboard/equipo');
  return { success: true };
}
