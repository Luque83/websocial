import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Target } from 'lucide-react';
import styles from './page.module.css';

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/auth/login');
  }

  const { data: project, error } = await supabase
    .from('projects')
    .select('*')
    .eq('id', id)
    .eq('user_id', user.id)
    .single();

  if (error || !project) {
    redirect('/dashboard');
  }

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div className={styles.headerTop}>
          <Link href="/dashboard">
            <Button variant="outline" size="sm" className={styles.backButton}>
              <ArrowLeft size={16} className={styles.backIcon} />
              Volver al Dashboard
            </Button>
          </Link>
        </div>
        <div className={styles.headerContent}>
          <h1 className={styles.title}>{project.name}</h1>
          {project.description && (
            <p className={styles.description}>{project.description}</p>
          )}
        </div>
      </header>

      <section className={styles.toolsSection}>
        <h2 className={styles.sectionTitle}>Herramientas del Proyecto</h2>
        <div className={styles.toolsGrid}>
          <Link href={`/herramientas/marco-logico?projectId=${id}`} className={styles.toolLink}>
            <Card className={styles.toolCard} padding="lg">
              <div className={styles.toolIconWrapper}>
                <Target size={32} />
              </div>
              <h3 className={styles.toolTitle}>Marco Lógico</h3>
              <p className={styles.toolDescription}>
                Define la matriz de marco lógico, objetivos, indicadores, medios de verificación y supuestos.
              </p>
            </Card>
          </Link>
        </div>
      </section>
    </div>
  );
}
