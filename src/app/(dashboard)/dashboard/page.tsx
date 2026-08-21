import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Plus, BarChart2, Users, Target, FolderKanban, Calendar } from 'lucide-react';
import styles from './page.module.css';
import { getProjects } from '@/app/actions/projects';
import { CreateProjectForm } from './CreateProjectForm';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const projects = await getProjects();

  const greeting = user?.user_metadata?.full_name 
    ? `¡Hola, ${user.user_metadata.full_name.split(' ')[0]}!` 
    : '¡Hola!';

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{greeting}</h1>
          <p className={styles.subtitle}>Bienvenido a tu panel de control de WebSocial.</p>
        </div>
      </header>

      <section className={styles.statsGrid}>
        <Card className={styles.statCard} padding="lg">
          <div className={styles.statIconWrapper} style={{ backgroundColor: 'var(--color-primary-50)', color: 'var(--color-primary-600)' }}>
            <FolderKanban size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Proyectos activos</span>
            <span className={styles.statValue}>{projects.length}</span>
          </div>
        </Card>
        
        <Card className={styles.statCard} padding="lg">
          <div className={styles.statIconWrapper} style={{ backgroundColor: 'var(--color-success-50)', color: 'var(--color-success-700)' }}>
            <Users size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Colaboradores</span>
            <span className={styles.statValue}>0</span>
          </div>
        </Card>
        
        <Card className={styles.statCard} padding="lg">
          <div className={styles.statIconWrapper} style={{ backgroundColor: 'var(--color-warning-50)', color: 'var(--color-warning-700)' }}>
            <BarChart2 size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Impacto medido</span>
            <span className={styles.statValue}>0%</span>
          </div>
        </Card>
      </section>

      <section className={styles.projectsSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Tus proyectos</h2>
        </div>
        
        <div className={styles.mainContent}>
          <div className={styles.projectList}>
            {projects.length > 0 ? (
              <div className={styles.projectsGrid}>
                {projects.map((project) => (
                  <Card key={project.id} className={styles.projectCard} padding="md">
                    <h3 className={styles.projectName}>{project.name}</h3>
                    {project.description && (
                      <p className={styles.projectDesc}>{project.description}</p>
                    )}
                    <div className={styles.projectMeta}>
                      <Calendar size={14} />
                      <span>{new Date(project.created_at).toLocaleDateString('es-ES')}</span>
                    </div>
                  </Card>
                ))}
              </div>
            ) : (
              <Card className={styles.emptyState} padding="lg">
                <div className={styles.emptyStateIcon}>
                  <Target size={48} />
                </div>
                <h3 className={styles.emptyStateTitle}>Aún no tienes proyectos</h3>
                <p className={styles.emptyStateDesc}>
                  Crea tu primer proyecto para empezar a medir y maximizar el impacto social de tus iniciativas.
                </p>
              </Card>
            )}
          </div>
          
          <div className={styles.formContainer}>
            <Card padding="lg">
              <h3 className={styles.formTitle}>Crear nuevo proyecto</h3>
              <CreateProjectForm />
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
