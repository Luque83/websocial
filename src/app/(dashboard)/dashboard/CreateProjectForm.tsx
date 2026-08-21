'use client';

import { useActionState, useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { createProject } from '@/app/actions/projects';
import { Button } from '@/components/ui/Button';
import { Plus } from 'lucide-react';
import { useFormStatus } from 'react-dom';
import styles from './page.module.css';

function SubmitButton() {
  const { pending } = useFormStatus();
  return (
    <Button type="submit" fullWidth className={styles.submitBtn} disabled={pending}>
      <Plus size={18} />
      {pending ? 'Creando...' : 'Crear Proyecto'}
    </Button>
  );
}

export function CreateProjectForm() {
  const [state, formAction] = useActionState(createProject, null);
  const formRef = useRef<HTMLFormElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (state?.success) {
      formRef.current?.reset();
      router.refresh();
    }
  }, [state, router]);

  return (
    <form ref={formRef} action={formAction} className={styles.form}>
      <div className={styles.formGroup}>
        <label htmlFor="name" className={styles.label}>Nombre del proyecto</label>
        <input 
          type="text" 
          id="name" 
          name="name" 
          required 
          className={styles.input} 
          placeholder="Ej. Iniciativa Educativa 2026"
        />
      </div>
      
      <div className={styles.formGroup}>
        <label htmlFor="description" className={styles.label}>Descripción</label>
        <textarea 
          id="description" 
          name="description" 
          rows={3}
          className={styles.textarea} 
          placeholder="Describe brevemente los objetivos del proyecto..."
        />
      </div>

      {state?.error && (
        <div style={{ color: 'var(--color-error-500)', fontSize: '0.875rem', marginBottom: '1rem' }}>
          {state.error}
        </div>
      )}
      
      <SubmitButton />
    </form>
  );
}
