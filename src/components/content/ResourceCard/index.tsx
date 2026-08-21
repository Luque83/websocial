import React from 'react';
import { BookOpen, Scale, FileText, Megaphone, Download, ExternalLink, ArrowRight } from 'lucide-react';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import type { ResourceMeta } from '@/lib/content';
import styles from './ResourceCard.module.css';

const CATEGORY_ICONS = {
  guia: BookOpen,
  legislacion: Scale,
  plantilla: FileText,
  convocatoria: Megaphone,
} as const;

const CATEGORY_BADGE_VARIANTS = {
  guia: 'primary',
  legislacion: 'info',
  plantilla: 'accent',
  convocatoria: 'warning',
} as const;

const CATEGORY_LABELS = {
  guia: 'Guía',
  legislacion: 'Legislación',
  plantilla: 'Plantilla',
  convocatoria: 'Convocatoria',
} as const;

const BORDER_CLASSES = {
  guia: styles.borderPrimary,
  legislacion: styles.borderInfo,
  plantilla: styles.borderAccent,
  convocatoria: styles.borderWarning,
} as const;

export interface ResourceCardProps {
  resource: ResourceMeta;
  className?: string;
}

export function ResourceCard({ resource, className = '' }: ResourceCardProps) {
  const Icon = CATEGORY_ICONS[resource.category];
  const badgeVariant = CATEGORY_BADGE_VARIANTS[resource.category] as 'primary' | 'info' | 'accent' | 'warning';
  const borderClass = BORDER_CLASSES[resource.category];

  return (
    <article className={`${styles.card} ${borderClass} ${className}`}>
      <div className={styles.header}>
        <div className={styles.iconWrapper}>
          <Icon size={22} />
        </div>
        <Badge variant={badgeVariant} size="sm">
          {CATEGORY_LABELS[resource.category]}
        </Badge>
      </div>
      <h3 className={styles.title}>{resource.title}</h3>
      <p className={styles.description}>{resource.description}</p>
      {resource.tags.length > 0 && (
        <div className={styles.tags}>
          {resource.tags.slice(0, 3).map(tag => (
            <Badge key={tag} variant="default" size="sm">{tag}</Badge>
          ))}
        </div>
      )}
      <div className={styles.footer}>
        {resource.downloadUrl ? (
          <Button href={resource.downloadUrl} variant="outline" size="sm">
            <Download size={14} />
            Descargar
          </Button>
        ) : resource.externalUrl ? (
          <Button href={resource.externalUrl} variant="outline" size="sm">
            <ExternalLink size={14} />
            Ver enlace
          </Button>
        ) : (
          <Button href={`/recursos/${resource.slug}`} variant="outline" size="sm">
            <ArrowRight size={14} />
            Más información
          </Button>
        )}
      </div>
    </article>
  );
}

export default ResourceCard;
