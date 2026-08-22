import React from 'react';
import { Logo } from '@/components/ui/Logo';
import styles from './layout.module.css';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <Logo size="md" href="/" />
      </header>
      <main className={styles.main}>
        <div className={styles.card}>
          {children}
        </div>
      </main>
    </div>
  );
}
