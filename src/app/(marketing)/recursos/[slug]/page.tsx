import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { getResources, getResourceSlugs } from '@/lib/content';
import { Breadcrumb } from '@/components/ui/Breadcrumb';
import { Badge } from '@/components/ui/Badge';
import { Button } from '@/components/ui/Button';
import { Container } from '@/components/ui/Container';
import { Download, ExternalLink } from 'lucide-react';
import styles from './resource.module.css';

export async function generateStaticParams() {
  return getResourceSlugs();
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  const { slug } = await params;
  const resource = getResources().find(r => r.slug === slug);
  if (!resource) return {};
  return {
    title: resource.title,
    description: resource.description,
  };
}

const CATEGORY_LABELS = {
  guia: 'Guía profesional',
  legislacion: 'Legislación',
  plantilla: 'Plantilla',
  convocatoria: 'Convocatoria',
} as const;

const CATEGORY_BADGE_VARIANTS = {
  guia: 'primary',
  legislacion: 'info',
  plantilla: 'accent',
  convocatoria: 'warning',
} as const;

export default async function ResourcePage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const resource = getResources().find(r => r.slug === slug);
  if (!resource) notFound();

  const { default: MDXContent } = await import(`@/content/recursos/${slug}.mdx`);

  const badgeVariant = CATEGORY_BADGE_VARIANTS[resource.category] as 'primary' | 'info' | 'accent' | 'warning';

  return (
    <main className={styles.main}>
      <Container size="lg">
        <Breadcrumb
          items={[
            { label: 'Inicio', href: '/' },
            { label: 'Recursos', href: '/recursos' },
            { label: resource.title },
          ]}
        />
        <header className={styles.header}>
          <Badge variant={badgeVariant}>{CATEGORY_LABELS[resource.category]}</Badge>
          <h1 className={styles.title}>{resource.title}</h1>
          <p className={styles.description}>{resource.description}</p>
          {(resource.downloadUrl || resource.externalUrl) && (
            <div className={styles.actions}>
              {resource.downloadUrl && (
                <Button href={resource.downloadUrl} size="lg">
                  <Download size={16} />
                  Descargar recurso
                </Button>
              )}
              {resource.externalUrl && (
                <Button href={resource.externalUrl} variant="outline" size="lg">
                  <ExternalLink size={16} />
                  Ver enlace externo
                </Button>
              )}
            </div>
          )}
        </header>
        <div className={`prose ${styles.proseWrapper}`}>
          <MDXContent />
        </div>
        {resource.tags.length > 0 && (
          <div className={styles.tags}>
            <span className={styles.tagsLabel}>Etiquetas:</span>
            {resource.tags.map(tag => (
              <Badge key={tag} variant="default" size="sm">{tag}</Badge>
            ))}
          </div>
        )}
      </Container>
    </main>
  );
}
