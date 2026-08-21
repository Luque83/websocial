'use client';

import React from 'react';
import { useIntersection } from '@/hooks/useIntersection';
import styles from './FadeIn.module.css';

interface FadeInProps {
  children: React.ReactNode;
  delay?: number; // Delay in milliseconds
  direction?: 'up' | 'down' | 'left' | 'right' | 'none';
  className?: string;
  triggerOnce?: boolean;
}

export function FadeIn({
  children,
  delay = 0,
  direction = 'up',
  className = '',
  triggerOnce = true,
}: FadeInProps) {
  const [ref, isVisible] = useIntersection<HTMLDivElement>({ triggerOnce, threshold: 0.1 });

  const directionClass = styles[direction] || '';
  const visibleClass = isVisible ? styles.visible : '';

  return (
    <div
      ref={ref}
      className={`${styles.fadeIn} ${directionClass} ${visibleClass} ${className}`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {children}
    </div>
  );
}
