import React from 'react';
import Link from 'next/link';
import styles from './layout.module.css';

export default function AuthLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className={styles.layout}>
      <header className={styles.header}>
        <Link href="/" className={styles.logo}>
          WebSocial
        </Link>
      </header>
      <main className={styles.main}>
        <div className={styles.card}>
          {children}
        </div>
      </main>
    </div>
  );
}
