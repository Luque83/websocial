import React from 'react';
import Link from 'next/link';
import { footerNavigation } from '@/config/navigation';
import { siteConfig } from '@/config/site';
import styles from './Footer.module.css';

export function Footer() {
  const currentYear = new Date().getFullYear();

  return (
    <footer className={styles.footer}>
      <div className={styles.container}>
        <div className={styles.topSection}>
          <div className={styles.brandColumn}>
            <Link href="/" className={styles.logo}>
              WebSocial
            </Link>
            <p className={styles.tagline}>
              Tecnología con propósito humano
            </p>
            <p className={styles.description}>
              {siteConfig.description || 'Creando conexiones significativas a través de experiencias digitales accesibles y centradas en las personas.'}
            </p>
          </div>
          
          <div className={styles.navGrid}>
            {Object.values(footerNavigation).map((group) => (
              <div key={group.title} className={styles.navColumn}>
                <h3 className={styles.columnTitle}>{group.title}</h3>
                <ul className={styles.linkList}>
                  {group.links.map((link) => (
                    <li key={link.label}>
                      <Link href={link.href} className={styles.link}>
                        {link.label}
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
        </div>

        <div className={styles.bottomBar}>
          <p>&copy; {currentYear} WebSocial. Todos los derechos reservados.</p>
        </div>
      </div>
    </footer>
  );
}

export default Footer;
