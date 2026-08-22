import React from 'react';
import Image from 'next/image';
import Link from 'next/link';

interface LogoProps {
  href?: string;
  size?: 'sm' | 'md' | 'lg';
  className?: string;
  showText?: boolean;
}

export function Logo({
  href = '/',
  size = 'md',
  className = '',
}: LogoProps) {
  const heightMap = {
    sm: 32,
    md: 40,
    lg: 48,
  };

  const height = heightMap[size];
  const width = Math.round(height * 2.2);

  const content = (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        gap: '0.5rem',
        textDecoration: 'none',
      }}
      className={className}
    >
      <div
        style={{
          position: 'relative',
          height: `${height}px`,
          width: `${width}px`,
          display: 'flex',
          alignItems: 'center',
          overflow: 'hidden',
          borderRadius: '8px',
        }}
      >
        <Image
          src="/logo.jpg"
          alt="WebSocial Logo"
          fill
          style={{ objectFit: 'contain', objectPosition: 'left center' }}
          priority
        />
      </div>
    </div>
  );

  if (href) {
    return (
      <Link href={href} style={{ textDecoration: 'none', display: 'inline-flex' }}>
        {content}
      </Link>
    );
  }

  return content;
}

export default Logo;
