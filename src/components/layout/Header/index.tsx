'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Menu, X } from 'lucide-react';
import { mainNavigation } from '@/config/navigation';
import styles from './Header.module.css';

import { createClient } from '@/lib/supabase/client';

export function Header() {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    const supabase = createClient();
    supabase.auth.getUser().then(({ data }) => {
      setIsLoggedIn(Boolean(data?.user));
    });

    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setIsLoggedIn(Boolean(session?.user));
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    
    window.addEventListener('scroll', handleScroll, { passive: true });
    handleScroll();
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  useEffect(() => {
    if (isMobileMenuOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = '';
    }
    return () => {
      document.body.style.overflow = '';
    };
  }, [isMobileMenuOpen]);

  return (
    <header className={`${styles.header} ${isScrolled ? styles.scrolled : ''}`}>
      <div className={styles.container}>
        <div className={styles.logoContainer}>
          <Link href="/" className={styles.logo}>
            WebSocial<span className={styles.accentDot}>.</span>
          </Link>
        </div>

        <nav className={styles.desktopNav}>
          {mainNavigation.map((item) => {
            const isActive = pathname === item.href;
            return (
              <Link 
                key={item.href} 
                href={item.href}
                className={`${styles.navLink} ${isActive ? styles.active : ''}`}
              >
                {item.label}
              </Link>
            );
          })}
        </nav>

        <div className={styles.actions}>
          {isLoggedIn ? (
            <Link href="/dashboard" className={styles.ctaButton}>
              Mi Dashboard
            </Link>
          ) : (
            <Link href="/login" className={styles.ctaButton}>
              Acceder
            </Link>
          )}
          <button 
            className={styles.mobileMenuButton}
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            aria-label={isMobileMenuOpen ? "Cerrar menú" : "Abrir menú"}
          >
            {isMobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Overlay */}
      <div className={`${styles.mobileMenu} ${isMobileMenuOpen ? styles.mobileMenuOpen : ''}`}>
        <div className={styles.mobileMenuContent}>
          <nav className={styles.mobileNav}>
            {mainNavigation.map((item) => {
              const isActive = pathname === item.href;
              return (
                <Link 
                  key={item.href} 
                  href={item.href}
                  className={`${styles.mobileNavLink} ${isActive ? styles.active : ''}`}
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.label}
                </Link>
              );
            })}
          </nav>
          <div className={styles.mobileActions}>
            {isLoggedIn ? (
              <Link 
                href="/dashboard" 
                className={styles.mobileCtaButton}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Mi Dashboard
              </Link>
            ) : (
              <Link 
                href="/login" 
                className={styles.mobileCtaButton}
                onClick={() => setIsMobileMenuOpen(false)}
              >
                Acceder
              </Link>
            )}
          </div>
        </div>
      </div>
    </header>
  );
}

export default Header;
