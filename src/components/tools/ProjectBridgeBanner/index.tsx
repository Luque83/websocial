'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Sparkles, ArrowRight, LayoutDashboard, FolderPlus } from 'lucide-react';
import { createClient } from '@/lib/supabase/client';
import styles from './ProjectBridgeBanner.module.css';

interface ProjectBridgeBannerProps {
  toolName: string;
  className?: string;
}

export function ProjectBridgeBanner({
  toolName,
  className = '',
}: ProjectBridgeBannerProps) {
  const [isLoggedIn, setIsLoggedIn] = useState(false);

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setIsLoggedIn(Boolean(data?.user));
    });
  }, []);

  return (
    <div className={`${styles.banner} ${isLoggedIn ? styles.bannerLoggedIn : styles.bannerPublic} ${className}`}>
      <div className={styles.infoArea}>
        <div className={styles.iconSparkle}>
          {isLoggedIn ? <LayoutDashboard size={24} color="#009E96" /> : <Sparkles size={24} color="#16C7B2" />}
        </div>
        <div>
          <h4 className={styles.title}>
            {isLoggedIn 
              ? `¿Quieres centralizar ${toolName} en un Expediente Oficial?`
              : `¿Gestionas ${toolName} para una Subvención u ONG?`}
          </h4>
          <p className={styles.subtitle}>
            {isLoggedIn
              ? 'En tu Dashboard puedes vincular todas las herramientas en un único expediente digital con IA documental, control de pagos bancarios y cuenta justificativa oficial.'
              : 'En la plataforma WebSocial puedes integrar nóminas, facturas y memorias técnicas con IA documental y auditoría preventiva en tiempo real.'}
          </p>
        </div>
      </div>

      <div className={styles.actionArea}>
        {isLoggedIn ? (
          <Link href="/dashboard" className={styles.ctaBtn}>
            <LayoutDashboard size={16} /> Ir a Mis Expedientes
          </Link>
        ) : (
          <Link href="/registro" className={styles.ctaBtn}>
            <FolderPlus size={16} /> Probar Plataforma Gratis <ArrowRight size={16} />
          </Link>
        )}
      </div>
    </div>
  );
}

export default ProjectBridgeBanner;
