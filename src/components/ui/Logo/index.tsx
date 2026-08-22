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
    sm: 34,
    md: 42,
    lg: 52,
  };

  const radiusMap = {
    sm: '10px',
    md: '12px',
    lg: '14px',
  };

  const height = heightMap[size];
  const radius = radiusMap[size];
  // Relación de aspecto exacta de la imagen oficial (1024 / 558 = 1.8351)
  const width = Math.round(height * 1.835);

  const content = (
    <div
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        textDecoration: 'none',
        borderRadius: radius,
        overflow: 'hidden',
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
          justifyContent: 'center',
          overflow: 'hidden',
          borderRadius: radius,
          backgroundColor: '#ffffff',
          boxShadow: '0 2px 6px rgba(13, 58, 95, 0.08)',
          border: '1px solid rgba(13, 58, 95, 0.1)',
        }}
      >
        <Image
          src="/logo.jpg"
          alt="WebSocial Logo"
          fill
          sizes="(max-width: 768px) 90px, 120px"
          style={{ 
            objectFit: 'cover',
            borderRadius: radius,
          }}
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
