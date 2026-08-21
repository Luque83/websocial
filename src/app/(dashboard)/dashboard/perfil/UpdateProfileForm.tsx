'use client';

import { useActionState } from 'react';
import { updateProfile } from '@/app/actions/profile';
import styles from './page.module.css';

interface ProfileData {
  full_name?: string | null;
  organization?: string | null;
  role?: string | null;
}

export function UpdateProfileForm({
  email,
  profile,
}: {
  email: string | undefined;
  profile: ProfileData | null;
}) {
  const [state, formAction, isPending] = useActionState(updateProfile, null);

  return (
    <form action={formAction} className={styles.formCard}>
      <div className={styles.formGroup}>
        <label htmlFor="email" className={styles.label}>
          Correo Electrónico
        </label>
        <input
          type="email"
          id="email"
          name="email"
          className={styles.input}
          defaultValue={email}
          disabled
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="full_name" className={styles.label}>
          Nombre completo
        </label>
        <input
          type="text"
          id="full_name"
          name="full_name"
          className={styles.input}
          defaultValue={profile?.full_name || ''}
          placeholder="Tu nombre completo"
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="organization" className={styles.label}>
          Organización
        </label>
        <input
          type="text"
          id="organization"
          name="organization"
          className={styles.input}
          defaultValue={profile?.organization || ''}
          placeholder="Nombre de tu organización"
        />
      </div>

      <div className={styles.formGroup}>
        <label htmlFor="role" className={styles.label}>
          Rol
        </label>
        <input
          type="text"
          id="role"
          name="role"
          className={styles.input}
          defaultValue={profile?.role || ''}
          placeholder="Ej: Administrador, Desarrollador..."
        />
      </div>

      <button
        type="submit"
        className={styles.submitBtn}
        disabled={isPending}
      >
        {isPending ? 'Guardando...' : 'Guardar Cambios'}
      </button>

      {state?.success && (
        <div className={`${styles.message} ${styles.success}`}>
          Perfil actualizado correctamente.
        </div>
      )}
      {state?.error && (
        <div className={`${styles.message} ${styles.error}`}>
          {state.error}
        </div>
      )}
    </form>
  );
}
