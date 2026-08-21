import React from 'react';
import styles from './Container.module.css';

export interface ContainerProps extends React.HTMLAttributes<HTMLElement> {
  size?: 'sm' | 'md' | 'lg' | 'xl' | '2xl';
  as?: 'div' | 'section' | 'main' | 'article';
}

export const Container = React.forwardRef<HTMLElement, ContainerProps>(
  ({ className = '', size = 'xl', as = 'div', children, ...props }, ref) => {
    const Component = as as React.ElementType;
    
    const rootClassName = [
      styles.container,
      styles[size],
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

Container.displayName = 'Container';
