import type { Metadata } from 'next';
import { getResources } from '@/lib/content';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { ResourceList } from '@/components/content/ResourceList';
import styles from './recursos.module.css';

export const metadata: Metadata = {
  title: 'Recursos',
  description: 'Guías, legislación, plantillas y convocatorias para profesionales del Tercer Sector.',
};

export default function RecursosPage() {
  const allResources = getResources();

  return (
    <main className={styles.main}>
      <Container>
        <SectionHeading
          eyebrow="Biblioteca de recursos"
          title="Recursos para profesionales"
          subtitle="Guías, legislación, plantillas y convocatorias seleccionadas para tu práctica profesional."
        />
        <div className={styles.note}>
          📚 Biblioteca en construcción — se añaden nuevos recursos regularmente.
        </div>
        
        <ResourceList initialResources={allResources} />
      </Container>
    </main>
  );
}
