'use client';

import React, { useState, FormEvent } from 'react';
import { Send, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import styles from './NewsletterCTA.module.css';

interface NewsletterCTAProps {
  className?: string;
}

export function NewsletterCTA({ className = '' }: NewsletterCTAProps) {
  const [status, setStatus] = useState<'idle' | 'loading' | 'success'>('idle');
  const [email, setEmail] = useState('');

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setStatus('loading');
    
    // Simulate network request (will be replaced with real API call in Phase 4)
    setTimeout(() => {
      setStatus('success');
      setEmail('');
    }, 1200);
  };

  return (
    <section className={`${styles.wrapper} ${className}`}>
      <div className={styles.container}>
        <div className={styles.content}>
          <h2 className={styles.title}>Únete a la comunidad WebSocial</h2>
          <p className={styles.subtitle}>
            Recibe recursos, guías prácticas y plantillas exclusivas directamente en tu correo. 
            Sin spam, solo contenido útil para profesionales del sector social.
          </p>
        </div>

        {status === 'success' ? (
          <div className={styles.successMessage}>
            <CheckCircle2 size={24} className={styles.successIcon} />
            <div>
              <strong>¡Gracias por suscribirte!</strong>
              <p>Revisa tu bandeja de entrada para confirmar tu correo.</p>
            </div>
          </div>
        ) : (
          <form className={styles.form} onSubmit={handleSubmit}>
            <div className={styles.inputGroup}>
              <input
                type="email"
                placeholder="Tu dirección de correo electrónico"
                className={styles.input}
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                disabled={status === 'loading'}
                aria-label="Correo electrónico para suscribirse a la newsletter"
              />
              <Button 
                type="submit" 
                variant="secondary" 
                disabled={status === 'loading'}
                className={styles.submitBtn}
              >
                {status === 'loading' ? 'Enviando...' : (
                  <>
                    Suscribirme
                    <Send size={16} />
                  </>
                )}
              </Button>
            </div>
            <p className={styles.privacyHint}>
              Al suscribirte aceptas nuestra política de privacidad. Puedes darte de baja en cualquier momento.
            </p>
          </form>
        )}
      </div>
    </section>
  );
}

export default NewsletterCTA;
