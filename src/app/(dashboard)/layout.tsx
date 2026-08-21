import React from 'react';
import { redirect } from 'next/navigation';
import { createClient } from '@/lib/supabase/server';
import { DashboardSidebar } from '@/components/layout/DashboardSidebar';
import styles from './layout.module.css';
import { getProjects } from '@/app/actions/projects';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();

  if (!user) {
    redirect('/login');
  }

  const projects = await getProjects();
  const recentProjects = projects.slice(0, 3).map(p => ({ id: p.id, name: p.name }));

  return (
    <div className={styles.layout}>
      <DashboardSidebar userEmail={user.email} recentProjects={recentProjects} />
      <main className={styles.main}>
        <div className={styles.container}>
          {children}
        </div>
      </main>
    </div>
  );
}
