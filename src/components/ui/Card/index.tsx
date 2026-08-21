import React from 'react';
import styles from './Card.module.css';

export interface CardProps extends React.HTMLAttributes<HTMLElement> {
  variant?: 'default' | 'elevated' | 'outlined';
  padding?: 'none' | 'sm' | 'md' | 'lg';
  hoverable?: boolean;
  as?: 'div' | 'article' | 'section';
}

export const Card = React.forwardRef<HTMLElement, CardProps>(
  (
    {
      className = '',
      variant = 'default',
      padding = 'md',
      hoverable = false,
      as = 'div',
      children,
      ...props
    },
    ref
  ) => {
    const Component = as as React.ElementType;
    
    const rootClassName = [
      styles.card,
      styles[variant],
      styles[`padding-${padding}`],
      hoverable ? styles.hoverable : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    return (
      <Component ref={ref} className={rootClassName} {...props}>
        {children}
      </Component>
    );
  }
);

Card.displayName = 'Card';
