'use client';

import { useActionState } from 'react';
import { useFormStatus } from 'react-dom';
import { login } from '@/app/actions/auth';
import Link from 'next/link';
import styles from './login.module.css';

function SubmitButton() {
  const { pending } = useFormStatus();
  
  return (
    <button type="submit" className={styles.button} disabled={pending}>
      {pending ? 'Iniciando sesión...' : 'Iniciar Sesión'}
    </button>
  );
}

export default function LoginPage() {
  const [state, formAction] = useActionState(login, null);

  return (
    <div className={styles.container}>
      <h1 className={styles.title}>Bienvenido de nuevo</h1>
      <p className={styles.subtitle}>Inicia sesión en tu cuenta para continuar</p>

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
        ¿No tienes una cuenta? <Link href="/registro" className={styles.link}>Regístrate aquí</Link>
      </div>
    </div>
  );
}
