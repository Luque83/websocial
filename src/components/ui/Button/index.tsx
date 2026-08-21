import React from 'react';
import Link from 'next/link';
import styles from './Button.module.css';

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: 'primary' | 'secondary' | 'outline' | 'ghost';
  size?: 'sm' | 'md' | 'lg';
  href?: string;
  loading?: boolean;
  fullWidth?: boolean;
}

export const Button = React.forwardRef<HTMLButtonElement, ButtonProps>(
  (
    {
      className = '',
      variant = 'primary',
      size = 'md',
      loading = false,
      fullWidth = false,
      disabled,
      href,
      children,
      ...props
    },
    ref
  ) => {
    const rootClassName = [
      styles.button,
      styles[variant],
      styles[size],
      fullWidth ? styles.fullWidth : '',
      loading ? styles.loading : '',
      className,
    ]
      .filter(Boolean)
      .join(' ');

    const innerContent = (
      <>
        {loading && (
          <span className={styles.spinner} aria-hidden="true" />
        )}
        <span className={loading ? styles.hiddenText : ''}>{children}</span>
      </>
    );

    if (href) {
      return (
        <Link href={href} className={rootClassName}>
          {innerContent}
        </Link>
      );
    }

    return (
      <button
        ref={ref}
        className={rootClassName}
        disabled={disabled || loading}
        {...props}
      >
        {innerContent}
      </button>
    );
  }
);

Button.displayName = 'Button';
