import React from 'react';
import Link from 'next/link';
import { createClient } from '@/lib/supabase/server';
import { Card } from '@/components/ui/Card';
import { 
  Target, 
  Calendar, 
  Wrench, 
  FolderKanban, 
  Users, 
  Clock, 
  AlertTriangle, 
  ShieldCheck,
  CheckCircle2,
  ArrowRight
} from 'lucide-react';
import styles from './page.module.css';
import { getProjectsWithStats, getDashboardStats } from '@/app/actions/projects';
import { getGlobalDeadlinesAction } from '@/app/actions/grant-lifecycle';
import { CreateProjectForm } from './CreateProjectForm';
import { CreateAIProjectModal } from './CreateAIProjectModal';
import { getDashboardTools } from '@/config/tools.registry';
import { DeleteProjectButton } from './DeleteProjectButton';

export default async function DashboardPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  const [projects, stats, deadlines] = await Promise.all([
    getProjectsWithStats(),
    getDashboardStats(),
    getGlobalDeadlinesAction(),
  ]);

  const urgentDeadlines = deadlines.filter(d => {
    if (d.isCompleted) return false;
    const diffDays = Math.ceil((new Date(d.deadlineDate).getTime() - Date.now()) / (1000 * 60 * 60 * 24));
    return diffDays >= 0 && diffDays <= 30;
  });
  const overdueDeadlines = deadlines.filter(d => {
    if (d.isCompleted) return false;
    return new Date(d.deadlineDate) < new Date();
  });

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

      {/* CALENDARIO PREVENTIVO DE VENCIMIENTOS REAL */}
      <Link href="/dashboard/plazos" style={{ textDecoration: 'none' }}>
        <div style={{
          background: overdueDeadlines.length > 0 ? '#FEF2F2' : urgentDeadlines.length > 0 ? '#FFFBEB' : '#F0FDF4',
          border: `1px solid ${overdueDeadlines.length > 0 ? '#FECACA' : urgentDeadlines.length > 0 ? '#FDE68A' : '#BBF7D0'}`,
          borderRadius: '12px',
          padding: '1rem 1.5rem',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          flexWrap: 'wrap',
          gap: '1rem',
          transition: 'transform 0.15s ease',
          cursor: 'pointer'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            {overdueDeadlines.length > 0 ? (
              <AlertTriangle size={20} color="#DC2626" />
            ) : urgentDeadlines.length > 0 ? (
              <Clock size={20} color="#B45309" />
            ) : (
              <CheckCircle2 size={20} color="#16A34A" />
            )}
            <div>
              <strong style={{ fontSize: '0.9375rem', color: overdueDeadlines.length > 0 ? '#991B1B' : urgentDeadlines.length > 0 ? '#92400E' : '#166534' }}>
                {overdueDeadlines.length > 0
                  ? `⚠️ Atención: ${overdueDeadlines.length} ${overdueDeadlines.length === 1 ? 'plazo vencido' : 'plazos vencidos'}`
                  : urgentDeadlines.length > 0
                  ? `Plazos Próximos de Justificación (${urgentDeadlines.length} en los próximos 30 días)`
                  : 'Todos los plazos y justificaciones de la entidad están al día'}
              </strong>
              <div style={{ fontSize: '0.8125rem', color: overdueDeadlines.length > 0 ? '#7F1D1D' : urgentDeadlines.length > 0 ? '#78350F' : '#15803D' }}>
                {overdueDeadlines.length > 0 
                  ? 'Hay requerimientos o entregas fuera de plazo que requieren subsanación urgente.'
                  : urgentDeadlines.length > 0 
                  ? 'Revisa los expedientes con vencimientos inminentes para evitar requerimientos.'
                  : 'Supervisión de convocatorias, subsanaciones e informes intermedios activa.'}
              </div>
            </div>
          </div>
          <span style={{
            fontSize: '0.75rem',
            fontWeight: 800,
            background: overdueDeadlines.length > 0 ? '#FEE2E2' : urgentDeadlines.length > 0 ? '#FEF3C7' : '#DCFCE7',
            color: overdueDeadlines.length > 0 ? '#991B1B' : urgentDeadlines.length > 0 ? '#92400E' : '#166534',
            padding: '0.35rem 0.75rem',
            borderRadius: '9999px',
            border: `1px solid ${overdueDeadlines.length > 0 ? '#FECACA' : urgentDeadlines.length > 0 ? '#FDE68A' : '#86EFAC'}`,
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.3rem'
          }}>
            Ver Calendario <ArrowRight size={12} />
          </span>
        </div>
      </Link>

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
              <h3 className={styles.formTitle} style={{ marginBottom: '1rem' }}>Crear Expediente en Blanco</h3>
              <CreateProjectForm />
            </Card>
          </div>
        </div>
      </section>
    </div>
  );
}
