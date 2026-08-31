'use client';

import React, { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, LogOut, UserCircle, FolderKanban, ShieldCheck, Users, Sparkles, Eye, ToggleLeft, ToggleRight, UserCheck, FileSpreadsheet, Clock, Receipt } from 'lucide-react';
import { signOutAction } from '@/app/(dashboard)/actions';
import { Logo } from '@/components/ui/Logo';
import styles from './DashboardSidebar.module.css';

interface DashboardSidebarProps {
  userEmail?: string;
  recentProjects?: Array<{ id: string; name: string }>;
  isAdmin?: boolean;
}

export function DashboardSidebar({ userEmail, recentProjects, isAdmin = false }: DashboardSidebarProps) {
  const pathname = usePathname();
  const [viewMode, setViewMode] = useState<'admin' | 'client'>(isAdmin ? 'admin' : 'client');

  const showAdminMenu = isAdmin && viewMode === 'admin';

  const baseNavItems = [
    { name: 'Mis Proyectos', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Plantilla y Personal', href: '/dashboard/personal', icon: UserCheck },
    { name: 'Matriz de Imputación', href: '/dashboard/matriz-imputacion', icon: FileSpreadsheet },
    { name: 'Facturas y Gastos', href: '/dashboard/facturas', icon: Receipt },
    { name: 'Bóveda Documental', href: '/dashboard/documentos', icon: FolderKanban },
    { name: 'Plazos y Alertas', href: '/dashboard/plazos', icon: Clock },
    { name: 'Equipo y Permisos', href: '/dashboard/equipo', icon: Users },
    { name: 'Mi Entidad / Perfil', href: '/dashboard/perfil', icon: UserCircle },
  ];

  const navItems = showAdminMenu 
    ? [...baseNavItems, { name: 'Panel Comercial', href: '/dashboard/admin', icon: ShieldCheck }]
    : baseNavItems;

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <Logo size="md" href="/" />
      </div>

      {/* Switcher de Vista Exclusivo para el SuperAdmin */}
      {isAdmin && (
        <div style={{
          margin: '0 1rem 1rem 1rem',
          padding: '0.65rem 0.85rem',
          background: viewMode === 'admin' ? '#0D3A5F' : '#EAF5FB',
          border: `1.5px solid ${viewMode === 'admin' ? '#16C7B2' : '#CBD5E1'}`,
          borderRadius: '10px',
          color: viewMode === 'admin' ? 'white' : '#0D3A5F',
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.35rem' }}>
            <span style={{ fontSize: '0.6875rem', fontWeight: 800, textTransform: 'uppercase', letterSpacing: '0.05em', color: viewMode === 'admin' ? '#16C7B2' : '#009E96' }}>
              {viewMode === 'admin' ? '👑 Modo Gestor (Admin)' : '🏢 Vista Cliente (ONG)'}
            </span>
            <button
              type="button"
              onClick={() => setViewMode(prev => prev === 'admin' ? 'client' : 'admin')}
              style={{
                background: 'transparent',
                border: 'none',
                color: viewMode === 'admin' ? '#16C7B2' : '#0D3A5F',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '0.2rem',
                fontSize: '0.75rem',
                fontWeight: 700,
                padding: 0
              }}
              title="Cambiar vista para probar la experiencia de cliente"
            >
              {viewMode === 'admin' ? <ToggleRight size={20} color="#16C7B2" /> : <ToggleLeft size={20} color="#5C7E9B" />}
            </button>
          </div>
          <p style={{ margin: 0, fontSize: '0.75rem', color: viewMode === 'admin' ? 'rgba(255,255,255,0.8)' : '#5C7E9B', lineHeight: 1.3 }}>
            {viewMode === 'admin' ? 'Acceso a Panel Comercial y facturación.' : 'Viendo el panel exactamente como una ONG cliente.'}
          </p>
        </div>
      )}

      <nav className={styles.nav}>
        <ul className={styles.navList}>
          {navItems.map((item) => {
            const Icon = item.icon;
            const isActive = pathname === item.href || pathname.startsWith(`${item.href}/`);
            return (
              <li key={item.href} className={styles.navItem}>
                <Link
                  href={item.href}
                  className={`${styles.navLink} ${isActive ? styles.active : ''}`}
                >
                  <Icon className={styles.icon} size={20} />
                  <span>{item.name}</span>
                </Link>
              </li>
            );
          })}
        </ul>

        {recentProjects && recentProjects.length > 0 && (
          <div className={styles.recentSection}>
            <h3 className={styles.recentTitle}>Proyectos recientes</h3>
            <ul className={styles.recentList}>
              {recentProjects.map((project) => (
                <li key={project.id} className={styles.recentItem}>
                  <Link href={`/dashboard/proyectos/${project.id}`} className={styles.recentLink}>
                    <FolderKanban size={14} className={styles.recentIcon} />
                    <span title={project.name}>
                      {project.name.length > 20 ? project.name.substring(0, 20) + '...' : project.name}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        )}
      </nav>

      <div className={styles.footer}>
        <div className={styles.userInfo}>
          <div className={styles.avatar}>
            {userEmail ? userEmail.charAt(0).toUpperCase() : 'U'}
          </div>
          <div className={styles.userDetails}>
            <span className={styles.userName}>
              {isAdmin ? '👑 Gestor / SuperAdmin' : '🏢 Entidad Social'}
            </span>
            <span className={styles.userEmail}>{userEmail || 'Cargando...'}</span>
          </div>
        </div>
        
        <form action={signOutAction}>
          <button type="submit" className={styles.logoutBtn}>
            <LogOut size={18} />
            <span>Cerrar sesión</span>
          </button>
        </form>
      </div>
    </aside>
  );
}

export default DashboardSidebar;
