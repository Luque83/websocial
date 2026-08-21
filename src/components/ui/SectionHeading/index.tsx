import React from 'react';
import styles from './SectionHeading.module.css';

export interface SectionHeadingProps extends React.HTMLAttributes<HTMLDivElement> {
  title: string;
  subtitle?: string;
  eyebrow?: string;
  align?: 'left' | 'center';
}

export const SectionHeading = React.forwardRef<HTMLDivElement, SectionHeadingProps>(
  ({ className = '', title, subtitle, eyebrow, align = 'center', children, ...props }, ref) => {
    const rootClassName = [
      styles.sectionHeading,
      styles[align],
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <div ref={ref} className={rootClassName} {...props}>
        {eyebrow && <p className={styles.eyebrow}>{eyebrow}</p>}
        <h2 className={styles.title}>{title}</h2>
        {subtitle && <p className={styles.subtitle}>{subtitle}</p>}
        {children && <div className={styles.content}>{children}</div>}
      </div>
    );
  }
);

SectionHeading.displayName = 'SectionHeading';
