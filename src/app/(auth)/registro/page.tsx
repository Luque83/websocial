'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { signup } from '@/app/actions/auth';
import Link from 'next/link';
import styles from './registro.module.css';

function SubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <button type="submit" className={styles.button} disabled={pending}>
      {pending ? 'Creando cuenta...' : 'Crear Cuenta'}
    </button>
  );
}

export default function RegistroPage() {
  const [state, formAction] = useActionState(signup, null);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Crea tu cuenta</h1>
      <p className={styles.subtitle}>Únete a WebSocial hoy mismo</p>

      <form action={formAction} className={styles.form}>
        <div className={styles.formGroup}>
          <label htmlFor="email" className={styles.label}>Email</label>
          <input 
            type="email" 
            id="email" 
            name="email" 
            required 
            className={styles.input}
            placeholder="tu@email.com"
          />
        </div>

        <div className={styles.formGroup}>
          <label htmlFor="password" className={styles.label}>Contraseña</label>
          <input 
            type="password" 
            id="password" 
            name="password" 
            required 
            className={styles.input}
            placeholder="••••••••"
          />
        </div>

        {state?.error && (
          <div className={styles.error}>
            {state.error}
          </div>
        )}

        <SubmitButton />
      </form>

      <div className={styles.footer}>
        ¿Ya tienes una cuenta? <Link href="/login" className={styles.link}>Inicia sesión</Link>
      </div>
    </div>
  );
}
