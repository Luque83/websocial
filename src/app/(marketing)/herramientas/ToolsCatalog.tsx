'use client';
import { useState } from 'react';
import Link from 'next/link';
import { ToolItem, ToolCategory, TOOL_CATEGORY_LABELS } from '@/types';
import {
  Calculator,
  FileText,
  BarChart3,
  Briefcase,
  Users,
  BookOpen,
  Calendar,
  ClipboardCheck,
  FileCheck,
  ArrowRight,
} from 'lucide-react';
import { Card } from '@/components/ui/Card';
import { Badge } from '@/components/ui/Badge';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { FadeIn } from '@/components/ui/FadeIn';
import styles from './herramientas.module.css';

const iconMap: Record<string, React.ComponentType<{ size?: number }>> = {
  Calculator,
  FileText,
  BarChart3,
  Briefcase,
  Users,
  BookOpen,
  Calendar,
  ClipboardCheck,
  FileCheck,
};

export function ToolsCatalog({ initialTools }: { initialTools: ToolItem[] }) {
  const [activeCategory, setActiveCategory] = useState<ToolCategory | 'all'>('all');

  const filteredTools =
    activeCategory === 'all'
      ? initialTools
      : initialTools.filter((t) => t.category === activeCategory);

  return (
    <Container className={styles.container}>
      <SectionHeading
        title="Herramientas profesionales"
        subtitle="Un catálogo completo diseñado para facilitar tu día a día en el sector social."
      />

      <div className={styles.filterBar}>
        <button
          className={`${styles.filterBtn} ${activeCategory === 'all' ? styles.active : ''}`}
          onClick={() => setActiveCategory('all')}
        >
          Todas
        </button>
        {(Object.entries(TOOL_CATEGORY_LABELS) as [ToolCategory, string][]).map(([key, label]) => (
          <button
            key={key}
            className={`${styles.filterBtn} ${activeCategory === key ? styles.active : ''}`}
            onClick={() => setActiveCategory(key)}
          >
            {label}
          </button>
        ))}
      </div>

      <div className={styles.grid}>
        {filteredTools.map((tool, index) => {
          const Icon = iconMap[tool.icon] || FileText;
          const isComingSoon = tool.status === 'coming-soon';
          const isAvailable = tool.status === 'available';
          const cardContent = (
            <Card
              className={`${styles.card} ${isComingSoon ? styles.comingSoon : ''} ${isAvailable && tool.slug ? styles.clickable : ''}`}
            >
              <div className={styles.cardHeader}>
                <div className={styles.iconWrapper}>
                  <Icon size={24} />
                </div>
                <div className={styles.badges}>
                  <Badge variant={tool.tier === 'pro' ? 'primary' : 'success'} size="sm">
                    {tool.tier === 'free' ? 'Gratuita' : 'PRO'}
                  </Badge>
                  {isComingSoon && <Badge variant="warning" size="sm">Próximamente</Badge>}
                  {tool.status === 'beta' && <Badge variant="info" size="sm">Beta</Badge>}
                </div>
              </div>
              <h3 className={styles.title}>{tool.name}</h3>
              <p className={styles.description}>{tool.description}</p>
              <div className={styles.footer}>
                <Badge variant="default" size="sm">{TOOL_CATEGORY_LABELS[tool.category]}</Badge>
                {isAvailable && tool.slug && (
                  <span className={styles.useLink}>
                    Usar herramienta <ArrowRight size={14} />
                  </span>
                )}
              </div>
            </Card>
          );

          return (
            <FadeIn key={tool.id} delay={index * 100} direction="up" className={styles.fadeInWrapper}>
              {isAvailable && tool.slug ? (
                <Link href={`/herramientas/${tool.slug}`} className={styles.cardLink}>
                  {cardContent}
                </Link>
              ) : (
                cardContent
              )}
            </FadeIn>
          );
        })}
      </div>
    </Container>
  );
}
