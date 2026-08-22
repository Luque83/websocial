import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { 
  Target, 
  Calendar, 
  Wrench, 
  FolderOpen, 
  FolderKanban, 
  Users, 
  Clock, 
  AlertCircle, 
  ShieldCheck,
  Building2,
  ArrowRight
} from 'lucide-react';
import styles from './page.module.css';
import { getProjectsWithStats, getDashboardStats } from '@/app/actions/projects';
import { CreateProjectForm } from './CreateProjectForm';
import { CreateAIProjectModal } from './CreateAIProjectModal';
import { getDashboardTools } from '@/config/tools.registry';
import { DeleteProjectButton } from './DeleteProjectButton';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [projects, stats] = await Promise.all([
    getProjectsWithStats(),
    getDashboardStats()
  ]);

  const totalTools = getDashboardTools().length;

  const greeting = user?.user_metadata?.full_name 
    ? `¡Hola, ${user.user_metadata.full_name.split(' ')[0]}!` 
    : '¡Hola!';

  return (
    <div className={styles.page}>
      <header className={styles.header}>
        <div>
          <h1 className={styles.title}>{greeting}</h1>
          <p className={styles.subtitle}>Panel de Control Global y Expedientes de la Entidad.</p>
        </div>
        <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center' }}>
          <Link 
            href="/dashboard/equipo" 
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '0.4rem',
              background: 'white',
              border: '1px solid var(--border-default)',
              padding: '0.6rem 1.15rem',
              borderRadius: '8px',
              color: 'var(--text-primary)',
              fontSize: '0.875rem',
              fontWeight: 700,
              textDecoration: 'none'
            }}
          >
            <Users size={16} color="#2563eb" /> Gestionar Equipo
          </Link>
        </div>
      </header>

      {/* BANNER DESTACADO ASISTENTE DE FORMULACIÓN CON IA */}
      <div style={{
        background: 'linear-gradient(135deg, #1e3a8a 0%, #1e40af 50%, #2563eb 100%)',
        color: 'white',
        borderRadius: '16px',
        padding: '2rem 2.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1.5rem',
        boxShadow: '0 10px 25px -5px rgba(37, 99, 235, 0.25)',
        border: '1px solid rgba(255, 255, 255, 0.15)'
      }}>
        <div style={{ maxWidth: '640px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.5rem', background: 'rgba(255, 255, 255, 0.15)', padding: '0.35rem 0.85rem', borderRadius: '9999px', fontSize: '0.8125rem', fontWeight: 600, marginBottom: '0.75rem', backdropFilter: 'blur(4px)' }}>
            <span style={{ color: '#fbbf24' }}>✨ Nuevo en WebSocial</span> · Asistente IA de Convocatorias
          </div>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 800, color: 'white', margin: '0 0 0.5rem 0', lineHeight: 1.2 }}>
            Formula tu Proyecto Social completo en 10 segundos
          </h2>
          <p style={{ margin: 0, color: 'rgba(255, 255, 255, 0.9)', fontSize: '0.9375rem', lineHeight: 1.5 }}>
            Pega las bases de la subvención (IRPF, FSE, Ministerios) o describe tu idea. La IA estructurará el Marco Lógico, el Presupuesto con costes de personal, los Indicadores y la Memoria Técnica automáticamente.
          </p>
        </div>
        <div>
          <CreateAIProjectModal />
        </div>
      </div>

      {/* CALENDARIO PREVENTIVO DE VENCIMIENTOS */}
      <div style={{
        background: '#fffbeb',
        border: '1px solid #fde68a',
        borderRadius: '12px',
        padding: '1rem 1.5rem',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        flexWrap: 'wrap',
        gap: '1rem'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
          <Clock size={20} color="#b45309" />
          <div>
            <strong style={{ fontSize: '0.9375rem', color: '#92400e' }}>Plazos Próximos de Justificación (Convocatorias 2026)</strong>
            <div style={{ fontSize: '0.8125rem', color: '#78350f' }}>
              Quedan expedientes activos con fecha límite de justificación en los próximos 90 días.
            </div>
          </div>
        </div>
        <span style={{ fontSize: '0.75rem', fontWeight: 800, background: '#fef3c7', color: '#92400e', padding: '0.35rem 0.75rem', borderRadius: '9999px', border: '1px solid #fde68a' }}>
          Supervisión Activa
        </span>
      </div>

      <section className={styles.statsGrid}>
        <Card className={styles.statCard} padding="lg">
          <div className={styles.statIconWrapper} style={{ backgroundColor: 'var(--color-primary-50)', color: 'var(--color-primary-600)' }}>
            <FolderKanban size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Expedientes Totales</span>
            <span className={styles.statValue}>{stats.totalProjects}</span>
          </div>
        </Card>
        
        <Card className={styles.statCard} padding="lg">
          <div className={styles.statIconWrapper} style={{ backgroundColor: 'var(--color-success-50)', color: 'var(--color-success-700)' }}>
            <Wrench size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Módulos Integrados</span>
            <span className={styles.statValue}>8 / 8</span>
          </div>
        </Card>
        
        <Card className={styles.statCard} padding="lg">
          <div className={styles.statIconWrapper} style={{ backgroundColor: 'var(--color-warning-50)', color: 'var(--color-warning-700)' }}>
            <ShieldCheck size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statLabel}>Expedientes en Ejecución</span>
            <span className={styles.statValue}>{stats.activeProjects}</span>
          </div>
        </Card>
      </section>

      <section className={styles.projectsSection}>
        <div className={styles.sectionHeader}>
          <h2 className={styles.sectionTitle}>Tus Expedientes y Proyectos</h2>
        </div>
        
        <div className={styles.mainContent}>
          <div className={styles.projectList}>
            {projects.length > 0 ? (
              <div className={styles.projectsGrid}>
                {projects.map((project) => (
                  <Link href={`/dashboard/proyectos/${project.id}`} key={project.id} style={{ textDecoration: 'none' }}>
                    <Card className={styles.projectCard} padding="md">
                      <div className={styles.projectHeader}>
                        <h3 className={styles.projectName}>{project.name}</h3>
                        <DeleteProjectButton projectId={project.id} projectName={project.name} />
                      </div>
                      
                      {project.description && (
                        <p className={styles.projectDesc}>{project.description}</p>
                      )}
                      
                      <div style={{ marginTop: 'auto', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
                        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginTop: '0.5rem' }}>
                          <span style={{
                            display: 'inline-flex',
                            alignItems: 'center',
                            gap: '0.35rem',
                            fontSize: '0.75rem',
                            fontWeight: 800,
                            padding: '0.25rem 0.6rem',
                            borderRadius: '9999px',
                            background: project.hasSavedData ? '#dcfce7' : '#eff6ff',
                            color: project.hasSavedData ? '#166534' : '#1d4ed8',
                            border: `1px solid ${project.hasSavedData ? '#86efac' : '#bfdbfe'}`
                          }}>
                            {project.hasSavedData ? '🟢 Expediente Activo' : '📝 Listo para Formular'}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)', display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                            <Calendar size={12} />
                            {new Date(project.created_at).toLocaleDateString('es-ES')}
                          </span>
                        </div>
                      </div>
                    </Card>
                  </Link>
                ))}
              </div>
            ) : (
              <Card className={styles.emptyState} padding="lg">
                <div className={styles.emptyStateIcon}>
                  <Target size={48} />
                </div>
                <h3 className={styles.emptyStateTitle}>Aún no tienes expedientes</h3>
                <p className={styles.emptyStateDesc}>
                  Crea tu primer proyecto o importa las bases de tu subvención para empezar a gestionar el marco lógico y la justificación económica.
                </p>
              </Card>
            )}
          </div>
          
          <div className={styles.formContainer}>
            <Card padding="lg">
              <h3 className={styles.formTitle} style={{ marginBottom: '1rem' }}>Formular Expediente</h3>
              <CreateAIProjectModal />
              
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', margin: '1.25rem 0', color: 'var(--text-muted)', fontSize: '0.8125rem' }}>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
                <span>o crear en blanco</span>
                <div style={{ flex: 1, height: '1px', background: 'var(--border-subtle)' }} />
              </div>

              <CreateProjectForm />
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
