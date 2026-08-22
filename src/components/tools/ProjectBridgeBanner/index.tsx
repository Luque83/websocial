'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, FolderPlus, ArrowRight, CheckCircle2, Building2 } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import styles from './ProjectBridgeBanner.module.css';

interface ProjectBridgeBannerProps {
  toolName: string;
  onSaveToProject?: (projectId: string) => Promise<void> | void;
  className?: string;
}

export function ProjectBridgeBanner({
  toolName,
  onSaveToProject,
  className = '',
}: ProjectBridgeBannerProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [projects, setProjects] = useState<Array<{ id: string; name: string }>>([]);
  const [selectedProjectId, setSelectedProjectId] = useState<string>('');
  const [isSaving, setIsSaving] = useState(false);
  const [savedSuccess, setSavedSuccess] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(async ({ data }) => {
      if (data?.user) {
        setIsLoggedIn(true);
        const { data: userProjects } = await supabase
          .from('projects')
          .select('id, name')
          .eq('user_id', data.user.id)
          .order('created_at', { ascending: false });
        if (userProjects && userProjects.length > 0) {
          setProjects(userProjects);
          setSelectedProjectId(userProjects[0].id);
        }
      }
    });
  }, []);

  const handleSave = async () => {
    if (!selectedProjectId || !onSaveToProject) return;
    setIsSaving(true);
    try {
      await onSaveToProject(selectedProjectId);
      setSavedSuccess(true);
      setTimeout(() => setSavedSuccess(false), 3000);
    } catch (err) {
      console.error('Error guardando en proyecto:', err);
    } finally {
      setIsSaving(false);
    }
  };

  if (isLoggedIn) {
    return (
      <div className={`${styles.banner} ${styles.bannerLoggedIn} ${className}`}>
        <div className={styles.infoArea}>
          <Building2 size={20} className={styles.iconPro} />
          <div>
            <h4 className={styles.title}>Expediente Digital de Proyecto</h4>
            <p className={styles.subtitle}>
              Puedes volcar los resultados de <strong>{toolName}</strong> directamente al expediente de tu proyecto.
            </p>
          </div>
        </div>

        {projects.length > 0 ? (
          <div className={styles.actionArea}>
            <select
              className={styles.select}
              value={selectedProjectId}
              onChange={e => setSelectedProjectId(e.target.value)}
            >
              {projects.map(p => (
                <option key={p.id} value={p.id}>{p.name}</option>
              ))}
            </select>

            {onSaveToProject ? (
              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className={styles.saveBtn}
              >
                {savedSuccess ? (
                  <>
                    <CheckCircle2 size={16} /> ¡Volcado con Éxito!
                  </>
                ) : (
                  <>
                    <FolderPlus size={16} /> {isSaving ? 'Guardando...' : 'Volcar al Proyecto'}
                  </>
                )}
              </button>
            ) : (
              <Link href={`/dashboard/proyectos/${selectedProjectId}`} className={styles.openBtn}>
                Abrir Expediente <ArrowRight size={14} />
              </Link>
            )}
          </div>
        ) : (
          <Link href="/dashboard" className={styles.createProjectBtn}>
            <FolderPlus size={16} /> Crear mi primer proyecto
          </Link>
        )}
      </div>
    );
  }

  return (
    <div className={`${styles.banner} ${styles.bannerPublic} ${className}`}>
      <div className={styles.infoArea}>
        <Sparkles size={22} className={styles.iconSparkle} />
        <div>
          <h4 className={styles.title}>¿Gestionas este cálculo para una Subvención u ONG?</h4>
          <p className={styles.subtitle}>
            En la plataforma profesional puedes vincular los datos de <strong>{toolName}</strong> a tus proyectos reales,
            repartir costes entre financiadores y generar la memoria técnica automáticamente.
          </p>
        </div>
      </div>
      <div className={styles.actionArea}>
        <Link href="/registro" className={styles.ctaBtn}>
          Crear Proyecto Gratis <ArrowRight size={16} />
        </Link>
      </div>
    </div>
  );
}

export default ProjectBridgeBanner;
