import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Target, Calculator, Users, FileText, BarChart2, Calendar } from 'lucide-react';
import { getDashboardTools } from '@/config/tools.registry';
import styles from './page.module.css';

const ICON_MAP: Record<string, React.ElementType> = {
  Target,
  Calculator,
  Users,
  FileText,
  BarChart2,
  Calendar,
};

export default async function ProjectPage({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const { id } = await params;
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
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

  const { data: projectTools } = await supabase
    .from('project_tools')
    .select('tool_slug, updated_at')
    .eq('project_id', id);

  const toolsDataMap = new Map(
    (projectTools || []).map((pt: { tool_slug: string; updated_at: string }) => [pt.tool_slug, pt.updated_at])
  );

  const dashboardTools = getDashboardTools();

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
          {dashboardTools.map((tool) => {
            const IconComponent = ICON_MAP[tool.iconName] || Target;
            const updatedAt = toolsDataMap.get(tool.slug);
            const statusText = updatedAt
              ? `Última edición: ${new Date(updatedAt).toLocaleDateString()}`
              : 'Sin datos aún';
            
            return (
              <Link key={tool.slug} href={`${tool.publicHref}?projectId=${id}`} className={styles.toolLink}>
                <Card className={styles.toolCard} padding="lg">
                  <div className={styles.toolIconWrapper}>
                    <IconComponent size={32} />
                  </div>
                  <h3 className={styles.toolTitle}>{tool.name}</h3>
                  <p className={styles.toolDescription}>
                    {tool.description}
                  </p>
                  <div className={styles.toolStatus}>
                    <span className={updatedAt ? styles.statusActive : styles.statusEmpty}>
                      {statusText}
                    </span>
                  </div>
                </Card>
              </Link>
            );
          })}
        </div>
      </section>
    </div>
  );
}
