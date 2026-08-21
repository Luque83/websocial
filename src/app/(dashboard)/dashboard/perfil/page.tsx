import { createClient } from '@/lib/supabase/server';
import { getProfile } from '@/app/actions/profile';
import { UpdateProfileForm } from './UpdateProfileForm';
import Link from 'next/link';
import { ShieldCheck, Sparkles, Building2 } from 'lucide-react';
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
        <h1 className={styles.title}>Perfil de la Entidad y Cuenta</h1>
        <p className={styles.description}>
          Gestiona los datos de tu organización, roles y estado de tu suscripción para justificación de subvenciones.
        </p>
      </div>

      <div style={{
        background: 'linear-gradient(135deg, var(--color-primary-900), var(--color-primary-800))',
        color: 'white',
        borderRadius: '12px',
        padding: '1.5rem 2rem',
        marginBottom: '2rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.25rem' }}>
            <Building2 size={20} color="#60a5fa" />
            <span style={{ fontSize: '0.8125rem', textTransform: 'uppercase', letterSpacing: '0.05em', color: 'rgba(255,255,255,0.7)' }}>
              Plan Activo
            </span>
          </div>
          <div style={{ fontSize: '1.5rem', fontWeight: 800 }}>Plan Entidad Social</div>
          <div style={{ fontSize: '0.875rem', color: 'rgba(255,255,255,0.85)', display: 'flex', alignItems: 'center', gap: '0.35rem', marginTop: '0.25rem' }}>
            <ShieldCheck size={16} color="#34d399" /> Servidores en la UE · Cumplimiento RGPD Art. 28
          </div>
        </div>
        <div>
          <Link
            href="/precios"
            style={{
              backgroundColor: 'white',
              color: 'var(--color-primary-900)',
              padding: '0.75rem 1.25rem',
              borderRadius: '8px',
              fontWeight: 700,
              fontSize: '0.875rem',
              textDecoration: 'none',
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.5rem'
            }}
          >
            <Sparkles size={16} color="#d97706" /> Ver Planes y Facturación
          </Link>
        </div>
      </div>

      <UpdateProfileForm email={user.email} profile={profile} />
    </div>
  );
}
