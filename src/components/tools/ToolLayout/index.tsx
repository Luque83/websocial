import React from 'react';
import { Container } from '@/components/ui/Container';
import { Badge } from '@/components/ui/Badge';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import styles from './ToolLayout.module.css';

export interface ToolLayoutProps {
  title: string;
  description: string;
  category: string;
  tier: 'free' | 'pro';
  instructions?: string[];
  children: React.ReactNode;
}

export function ToolLayout({
  title,
  description,
  category,
  tier,
  instructions = [],
  children,
}: ToolLayoutProps) {
  return (
    <div className={styles.page}>
      <Container>
        <Breadcrumb
          items={[
            { label: 'Inicio', href: '/' },
            { label: 'Herramientas', href: '/herramientas' },
            { label: title },
          ]}
        />
        <div className={styles.grid}>
          <div className={styles.main}>
            <header className={styles.header}>
              <div className={styles.badges}>
                <Badge variant="default" size="sm">{category}</Badge>
                <Badge variant={tier === 'free' ? 'success' : 'accent'} size="sm">
                  {tier === 'free' ? 'Gratuita' : 'PRO'}
                </Badge>
              </div>
              <h1 className={styles.title}>{title}</h1>
              <p className={styles.description}>{description}</p>
            </header>
            <div className={styles.toolArea}>
              {children}
            </div>
          </div>
          {instructions.length > 0 && (
            <aside className={styles.sidebar}>
              <p className={styles.instructionsLabel}>Cómo usar esta herramienta</p>
              <ol className={styles.instructionsList}>
                {instructions.map((step, idx) => (
                  <li key={idx} className={styles.instructionItem}>
                    <span className={styles.stepNumber}>{idx + 1}</span>
                    <span className={styles.stepText}>{step}</span>
                  </li>
                ))}
              </ol>
            </aside>
          )}
        </div>
      </Container>
    </div>
  );
}

export default ToolLayout;
