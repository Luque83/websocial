'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, LogOut, UserCircle, FolderKanban, ShieldCheck, Users } from 'lucide-react';
import { signOutAction } from '@/app/(dashboard)/actions';
import styles from './DashboardSidebar.module.css';

interface DashboardSidebarProps {
  userEmail?: string;
  recentProjects?: Array<{ id: string; name: string }>;
}

export function DashboardSidebar({ userEmail, recentProjects }: DashboardSidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Mis Proyectos', href: '/dashboard', icon: LayoutDashboard },
    { name: 'Equipo y Permisos', href: '/dashboard/equipo', icon: Users },
    { name: 'Plantilla y Personal', href: '/herramientas/gestion-personal', icon: UserCircle },
    { name: 'Mi Entidad / Perfil', href: '/dashboard/perfil', icon: UserCircle },
    { name: 'Panel Comercial', href: '/dashboard/admin', icon: ShieldCheck },
  ];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.logo}>
        <Link href="/dashboard">
          WebSocial<span>.</span>
        </Link>
      </div>

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
            <span className={styles.userName}>Usuario</span>
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
