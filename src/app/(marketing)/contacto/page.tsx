'use client';
import { useState } from 'react';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Button } from '@/components/ui/Button';
import { Mail, MessageCircle } from 'lucide-react';
import styles from './contacto.module.css';

export default function ContactoPage() {
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setTimeout(() => {
      alert('Formulario no disponible aún. Contacta por email.');
      setIsSubmitting(false);
    }, 500);
  };

  return (
    <main className={styles.main}>
      <Container>
        <SectionHeading 
          title="Contacto" 
          subtitle="¿Tienes dudas, sugerencias o quieres colaborar? Escríbenos."
        />
        
        <div className={styles.layout}>
          <div className={styles.formContainer}>
            <form className={styles.form} onSubmit={handleSubmit}>
              <div className={styles.formGroup}>
                <label htmlFor="nombre" className={styles.label}>Nombre</label>
                <input 
                  type="text" 
                  id="nombre" 
                  name="nombre" 
                  required 
                  className={styles.input} 
                  placeholder="Tu nombre o el de tu entidad"
                />
              </div>
              
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
                <label htmlFor="asunto" className={styles.label}>Asunto</label>
                <select id="asunto" name="asunto" required className={styles.input}>
                  <option value="">Selecciona un asunto</option>
                  <option value="Consulta general">Consulta general</option>
                  <option value="Sugerencia de herramienta">Sugerencia de herramienta</option>
                  <option value="Colaboración">Colaboración</option>
                  <option value="Soporte técnico">Soporte técnico</option>
                  <option value="Otro">Otro</option>
                </select>
              </div>
              
              <div className={styles.formGroup}>
                <label htmlFor="mensaje" className={styles.label}>Mensaje</label>
                <textarea 
                  id="mensaje" 
                  name="mensaje" 
                  required 
                  rows={5} 
                  className={styles.textarea} 
                  placeholder="¿En qué podemos ayudarte?"
                ></textarea>
              </div>
              
              <Button type="submit" variant="primary" size="lg" className={styles.submitBtn} disabled={isSubmitting}>
                {isSubmitting ? 'Enviando...' : 'Enviar mensaje'}
              </Button>
            </form>
          </div>
          
          <div className={styles.infoContainer}>
            <div className={styles.infoCard}>
              <h3 className={styles.infoTitle}>Hablemos</h3>
              <p className={styles.infoText}>
                WebSocial es un proyecto en constante evolución. Valoramos mucho el feedback de los profesionales del sector para seguir creando herramientas que realmente aporten valor.
              </p>
              
              <div className={styles.contactMethods}>
                <div className={styles.method}>
                  <div className={styles.iconWrapper}>
                    <Mail size={20} />
                  </div>
                  <div>
                    <h4 className={styles.methodTitle}>Email</h4>
                    <a href="mailto:hola@websocial.es" className={styles.methodLink}>hola@websocial.es</a>
                  </div>
                </div>
                
                <div className={styles.method}>
                  <div className={styles.iconWrapper}>
                    <MessageCircle size={20} />
                  </div>
                  <div>
                    <h4 className={styles.methodTitle}>Redes Sociales</h4>
                    <p className={styles.methodText}>Síguenos en LinkedIn y Twitter</p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </Container>
    </main>
  );
}
