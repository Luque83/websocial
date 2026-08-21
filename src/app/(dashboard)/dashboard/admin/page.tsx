import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { redirect } from 'next/navigation';
import { Building2, FolderKanban, CheckCircle2, FileSpreadsheet } from 'lucide-react';
import styles from './admin.module.css';

export default async function AdminPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  // Load all projects in system
  const { data: allProjects } = await supabase
    .from('projects')
    .select('id, name, description, user_id, created_at, updated_at')
    .order('created_at', { ascending: false });

  // Load tools usage in system
  const { count: totalToolsCount } = await supabase
    .from('project_tools')
    .select('id', { count: 'exact' });

  // Load profiles
  const { data: allProfiles } = await supabase
    .from('profiles')
    .select('*');

  const totalProjects = allProjects?.length || 0;
  const totalProfiles = allProfiles?.length || 0;

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <div>
          <h1 className={styles.title}>Panel de Control Comercial (SuperAdmin)</h1>
          <p className={styles.subtitle}>
            Gestión global de entidades sociales clientes, proyectos activos y licencias comerciales.
          </p>
        </div>
      </div>

      {/* KPI Globales */}
      <div className={styles.statsGrid}>
        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <Building2 size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{totalProfiles || 1}</span>
            <span className={styles.statLabel}>Entidades Registradas</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <FolderKanban size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{totalProjects}</span>
            <span className={styles.statLabel}>Proyectos Formulados</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon}>
            <FileSpreadsheet size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>{totalToolsCount || 0}</span>
            <span className={styles.statLabel}>Módulos Técnicos Utilizados</span>
          </div>
        </div>

        <div className={styles.statCard}>
          <div className={styles.statIcon} style={{ background: '#ecfdf5', color: '#059669' }}>
            <CheckCircle2 size={24} />
          </div>
          <div className={styles.statInfo}>
            <span className={styles.statValue}>100% UE</span>
            <span className={styles.statLabel}>Cumplimiento RGPD Activo</span>
          </div>
        </div>
      </div>

      {/* Tabla de Entidades y Proyectos Recientes */}
      <div className={styles.tableSection}>
        <h2 className={styles.sectionTitle}>
          <Building2 size={20} /> Entidades y Proyectos en la Plataforma
        </h2>
        <div className={styles.tableWrapper}>
          <table className={styles.table}>
            <thead>
              <tr>
                <th>Proyecto / Entidad</th>
                <th>Descripción / Objeto</th>
                <th>Fecha de Creación</th>
                <th>Estado de Licencia</th>
                <th>Acción Comercial</th>
              </tr>
            </thead>
            <tbody>
              {allProjects && allProjects.length > 0 ? (
                allProjects.map((p) => (
                  <tr key={p.id}>
                    <td>
                      <strong>{p.name}</strong>
                    </td>
                    <td>{p.description || <em style={{ color: 'var(--text-muted)' }}>Sin descripción</em>}</td>
                    <td>{new Date(p.created_at).toLocaleDateString('es-ES')}</td>
                    <td>
                      <span className={styles.badgeActive}>Plan Entidad Social</span>
                    </td>
                    <td>
                      <button className={styles.actionBtn}>
                        Emitir Factura Proforma
                      </button>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan={5} style={{ textAlign: 'center', padding: '2rem', color: 'var(--text-muted)' }}>
                    No hay proyectos registrados aún.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
