import { createClient } from '@/lib/supabase/server';
import { getProfile } from '@/app/actions/profile';
import { UpdateProfileForm } from './UpdateProfileForm';
import styles from './page.module.css';
import { redirect } from 'next/navigation';

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const profile = await getProfile();

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>Mi Perfil</h1>
        <p className={styles.description}>
          Gestiona tu información personal y preferencias de la cuenta.
        </p>
      </div>

      <UpdateProfileForm email={user.email} profile={profile} />
    </div>
  );
}
