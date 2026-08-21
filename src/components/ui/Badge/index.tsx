import React from 'react';
import styles from './Badge.module.css';

export interface BadgeProps extends React.HTMLAttributes<HTMLSpanElement> {
  variant?: 'default' | 'primary' | 'accent' | 'success' | 'warning' | 'error' | 'info';
  size?: 'sm' | 'md';
}

export const Badge = React.forwardRef<HTMLSpanElement, BadgeProps>(
  ({ className = '', variant = 'default', size = 'md', children, ...props }, ref) => {
    const rootClassName = [
      styles.badge,
      styles[variant],
      styles[size],
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <span ref={ref} className={rootClassName} {...props}>
        {children}
      </span>
    );
  }
);

Badge.displayName = 'Badge';
