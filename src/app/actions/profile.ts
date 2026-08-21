'use server';

import { createClient } from '@/lib/supabase/server';
import { revalidatePath } from 'next/cache';

export async function getProfile() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return null;

  const { data } = await supabase
    .from('profiles')
    .select('*')
    .eq('id', user.id)
    .single();

  return data;
}

export async function updateProfile(prevState: unknown, formData: FormData) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) return { error: 'No autenticado', success: false };

  const full_name = formData.get('full_name') as string;
  const organization = formData.get('organization') as string;
  const role = formData.get('role') as string;

  const { error } = await supabase
    .from('profiles')
    .upsert({ id: user.id, full_name, organization, role });

  if (error) return { error: error.message, success: false };

  revalidatePath('/dashboard/perfil');
  return { success: true, error: null };
}
