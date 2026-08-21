'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { LayoutDashboard, LogOut } from 'lucide-react';
import { signOutAction } from '@/app/(dashboard)/actions';
import styles from './DashboardSidebar.module.css';

interface DashboardSidebarProps {
  userEmail?: string;
}

export function DashboardSidebar({ userEmail }: DashboardSidebarProps) {
  const pathname = usePathname();

  const navItems = [
    { name: 'Mis Proyectos (Inicio)', href: '/dashboard', icon: LayoutDashboard },
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
