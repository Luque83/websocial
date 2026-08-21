import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { ArrowLeft, Target, Calculator, Users, FileText, BarChart2, Calendar, CheckCircle, ShieldAlert, UserCheck } from 'lucide-react';
import { getDashboardTools } from '@/config/tools.registry';
import styles from './page.module.css';

const ICON_MAP: Record<string, React.ElementType> = {
  Target,
  Calculator,
  Users,
  FileText,
  BarChart2,
  Calendar,
  ShieldAlert,
  UserCheck,
};

interface ProjectToolRow {
  tool_slug: string;
  updated_at: string;
  data?: Record<string, unknown>;
}

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
    .select('tool_slug, updated_at, data')
    .eq('project_id', id);

  const toolsDataMap = new Map(
    ((projectTools || []) as ProjectToolRow[]).map(pt => [pt.tool_slug, pt])
  );

  const dashboardTools = getDashboardTools();

  // DASHBOARD METRICS CALCULATION
  let totalCost = 0;
  let totalRealCost = 0;
  let indirectPct = 0;
  const costesTool = toolsDataMap.get('costes-proyecto');
  if (costesTool?.data) {
    const d = costesTool.data;
    if (Array.isArray(d.partidas)) {
      const partidas = d.partidas as Array<Record<string, unknown>>;
      const direct = partidas.reduce((acc: number, p) => acc + (Number(p.monthlyAmount || 0) * Number(p.months || 1)), 0);
      const directReal = partidas.reduce((acc: number, p) => acc + (p.costeReal !== undefined ? Number(p.costeReal) : Number(p.monthlyAmount || 0) * Number(p.months || 1)), 0);
      indirectPct = Number(d.indirectPct) || 0;
      totalCost = direct + (direct * indirectPct / 100);
      totalRealCost = directReal + (directReal * indirectPct / 100);
    }
  }

  let totalActivities = 0;
  let durationMonths = 0;
  const cronogramaTool = toolsDataMap.get('cronograma-actividades') || toolsDataMap.get('cronograma');
  if (cronogramaTool?.data) {
    const d = cronogramaTool.data;
    if (Array.isArray(d.activities)) totalActivities = d.activities.length;
    durationMonths = Number(d.durationMonths) || 0;
  }

  let indicatorsProgress = 0;
  let indicatorsCount = 0;
  const indTool = toolsDataMap.get('indicadores-impacto');
  if (indTool?.data) {
    const d = indTool.data;
    if (Array.isArray(d.indicadores)) {
      const indicadores = d.indicadores as Array<Record<string, unknown>>;
      const validInds = indicadores.filter(i => typeof i.name === 'string' && i.name.trim());
      indicatorsCount = validInds.length;
      if (indicatorsCount > 0) {
        let totalPct = 0;
        validInds.forEach(ind => {
          const range = Number(ind.target || 0) - Number(ind.baseline || 0);
          const progress = Number(ind.current || 0) - Number(ind.baseline || 0);
          let pct = range === 0 ? 0 : (progress / range) * 100;
          if (pct < 0) pct = 0;
          if (pct > 100) pct = 100;
          totalPct += pct;
        });
        indicatorsProgress = totalPct / indicatorsCount;
      }
    }
  }

  let completedCoreTools = 0;
  const coreTools = ['marco-logico', 'costes-proyecto', 'cronograma', 'indicadores-impacto'];
  coreTools.forEach(slug => {
    // Check both potential slugs for cronograma
    if (toolsDataMap.has(slug) || (slug === 'cronograma' && toolsDataMap.has('cronograma-actividades'))) {
      completedCoreTools++;
    }
  });
  const formulationPct = Math.round((completedCoreTools / 4) * 100);

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

      <section>
        <div className={styles.metricsGrid}>
          <div className={styles.metricCard}>
            <div className={styles.metricHeader}>
              <Calculator size={18} />
              Presupuesto vs. Real
            </div>
            <div className={styles.metricValue}>
              {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(totalCost)}
            </div>
            <p className={styles.metricSubtitle}>
              Gastado real: {new Intl.NumberFormat('es-ES', { style: 'currency', currency: 'EUR' }).format(totalRealCost)} ({totalCost > 0 ? ((totalRealCost / totalCost) * 100).toFixed(0) : 0}%)
            </p>
          </div>
          
          <div className={styles.metricCard}>
            <div className={styles.metricHeader}>
              <Calendar size={18} />
              Cronograma
            </div>
            <div className={styles.metricValue}>
              {durationMonths > 0 ? `${durationMonths} meses` : 'No definido'}
            </div>
            <p className={styles.metricSubtitle}>{totalActivities} actividades programadas</p>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricHeader}>
              <BarChart2 size={18} />
              Impacto y Ejecución
            </div>
            <div className={styles.metricValue}>
              {Math.round(indicatorsProgress)}%
            </div>
            <div className={styles.progressContainer}>
              <div className={styles.progressBar} style={{ width: `${Math.round(indicatorsProgress)}%` }} />
            </div>
            <p className={styles.metricSubtitle} style={{ marginTop: '0.5rem' }}>{indicatorsCount} indicadores evaluados</p>
          </div>

          <div className={styles.metricCard}>
            <div className={styles.metricHeader}>
              <CheckCircle size={18} />
              Estado de Formulación
            </div>
            <div className={styles.metricValue}>
              {formulationPct}%
            </div>
            <div className={styles.progressContainer}>
              <div 
                className={styles.progressBar} 
                style={{ 
                  width: `${formulationPct}%`, 
                  backgroundColor: formulationPct === 100 ? '#10b981' : 'var(--color-primary-500)' 
                }} 
              />
            </div>
            <p className={styles.metricSubtitle} style={{ marginTop: '0.5rem' }}>{completedCoreTools} de 4 módulos clave completados</p>
          </div>
        </div>
      </section>

      <section className={styles.toolsSection}>
        <h2 className={styles.sectionTitle}>Herramientas del Proyecto</h2>
        <div className={styles.toolsGrid}>
          {dashboardTools.map((tool) => {
            const IconComponent = ICON_MAP[tool.iconName] || Target;
            const toolState = toolsDataMap.get(tool.slug) || (tool.slug === 'cronograma' ? toolsDataMap.get('cronograma-actividades') : null);
            const updatedAt = toolState?.updated_at;
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
