import React from 'react';
import { createClient } from '@/lib/supabase/server';
import { getProfile } from '@/app/actions/profile';
import { isSuperAdmin } from '@/lib/auth/roles';
import { UpdateProfileForm } from './UpdateProfileForm';
import Link from 'next/link';
import { ShieldCheck, Sparkles, Building2, CheckCircle2, UserCheck, Bot, FileText, Lock } from 'lucide-react';
import styles from './page.module.css';
import { redirect } from 'next/navigation';

export const metadata = {
  title: 'Mi Entidad y Suscripción · WebSocial',
  description: 'Gestiona los datos de tu entidad social, servicios contratados y estado de tu suscripción.',
};

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const profile = await getProfile();
  const isAdmin = isSuperAdmin(user.email);

  return (
    <div className={styles.container}>
      <div className={styles.header}>
        <h1 className={styles.title}>
          {isAdmin ? '👑 Perfil del Gestor / Administrador' : '🏢 Perfil de la Entidad y Suscripción'}
        </h1>
        <p className={styles.description}>
          {isAdmin 
            ? 'Panel de control de tu cuenta de autor y gestor de WebSocial con acceso a supervisión global.'
            : 'Gestiona los datos de tu organización o actividad profesional, servicios contratados y equipo para la justificación de proyectos.'}
        </p>
      </div>

      {/* TARJETA DE PLAN Y SERVICIOS CONTRATADOS */}
      <div style={{
        background: 'linear-gradient(135deg, #0D3A5F 0%, #082640 100%)',
        color: 'white',
        borderRadius: '16px',
        padding: '2rem 2.25rem',
        marginBottom: '2rem',
        boxShadow: '0 8px 24px -4px rgba(13, 58, 95, 0.3)',
        border: '1.5px solid #16C7B2'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '1.5rem' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '0.4rem', background: 'rgba(22, 199, 178, 0.15)', color: '#16C7B2', padding: '0.35rem 0.75rem', borderRadius: '9999px', fontSize: '0.75rem', fontWeight: 800, textTransform: 'uppercase', marginBottom: '0.75rem', border: '1px solid rgba(22, 199, 178, 0.3)' }}>
              {isAdmin ? <Sparkles size={14} color="#16C7B2" /> : <Building2 size={14} color="#16C7B2" />}
              {isAdmin ? 'Licencia Maestro / SuperAdmin' : 'Suscripción Activa'}
            </div>
            
            <h2 style={{ fontSize: '1.75rem', fontWeight: 800, margin: '0 0 0.5rem 0', color: 'white' }}>
              {isAdmin ? '👑 Gestor General de Plataforma' : 'Plan Entidad Social'}
            </h2>
            
            <p style={{ margin: 0, fontSize: '0.9375rem', color: 'rgba(255,255,255,0.85)', lineHeight: 1.5, maxWidth: '600px' }}>
              {isAdmin 
                ? 'Tienes acceso irrestricto a todas las herramientas, analítica de ingresos (MRR), base de clientes y configuración global.'
                : 'Acceso completo al Expediente Digital de Subvenciones, Asistente de Formulación con IA Documental y Motor de Auditoría Preventiva.'}
            </p>
          </div>

          <div style={{ display: 'flex', gap: '0.75rem', alignItems: 'center', flexWrap: 'wrap' }}>
            {isAdmin ? (
              <Link
                href="/dashboard/admin"
                style={{
                  backgroundColor: '#16C7B2',
                  color: '#0D3A5F',
                  padding: '0.75rem 1.35rem',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '0.875rem',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 4px 14px rgba(22, 199, 178, 0.35)'
                }}
              >
                <Sparkles size={16} /> Abrir Panel Comercial (MRR)
              </Link>
            ) : (
              <Link
                href="/precios"
                style={{
                  backgroundColor: 'white',
                  color: '#0D3A5F',
                  padding: '0.75rem 1.35rem',
                  borderRadius: '10px',
                  fontWeight: 800,
                  fontSize: '0.875rem',
                  textDecoration: 'none',
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                }}
              >
                <Sparkles size={16} color="#009E96" /> Gestionar Suscripción
              </Link>
            )}
          </div>
        </div>

        {/* LISTA DE SERVICIOS Y COBERTURAS INCLUIDAS */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
          gap: '0.85rem',
          marginTop: '1.5rem',
          paddingTop: '1.25rem',
          borderTop: '1px solid rgba(255,255,255,0.15)'
        }}>
          {[
            { label: '8 Módulos de Expediente Digital', icon: FileText },
            { label: 'Analizador IA de Bases y Convocatorias (PDF)', icon: Bot },
            { label: 'Semáforo de Auditoría Preventiva', icon: ShieldCheck },
            { label: 'Servidores UE · Cumplimiento RGPD', icon: Lock },
          ].map((srv, idx) => {
            const Icon = srv.icon;
            return (
              <div key={idx} style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontSize: '0.8125rem', color: 'rgba(255,255,255,0.9)' }}>
                <CheckCircle2 size={16} color="#16C7B2" style={{ flexShrink: 0 }} />
                <span>{srv.label}</span>
              </div>
            );
          })}
        </div>
      </div>

      {/* FORMULARIO DE DATOS FISCALES Y DE CONTACTO */}
      <UpdateProfileForm email={user.email} profile={profile} />
    </div>
  );
}
