import { Metadata } from 'next';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Card } from '@/components/ui/Card';
import { Button } from '@/components/ui/Button';
import { Target, Shield, Users } from 'lucide-react';
import styles from './about.module.css';

export const metadata: Metadata = {
  title: 'Sobre nosotros | WebSocial',
  description: 'Conoce nuestra misión y visión para transformar el sector social.',
};

const values = [
  {
    id: 'utilidad',
    title: 'Utilidad real',
    description: 'Cada herramienta resuelve un problema concreto del día a día profesional.',
    icon: Target
  },
  {
    id: 'privacidad',
    title: 'Privacidad primero',
    description: 'Diseñamos pensando en RGPD y en la protección de datos sensibles.',
    icon: Shield
  },
  {
    id: 'comunidad',
    title: 'Comunidad profesional',
    description: 'Construido con y para profesionales del Tercer Sector.',
    icon: Users
  }
];

export default function SobreNosotrosPage() {
  return (
    <main className={styles.main}>
      <section className={styles.hero}>
        <Container>
          <div className={styles.heroContent}>
            <h1 className={styles.heroTitle}>Tecnología con propósito humano</h1>
            <p className={styles.heroSubtitle}>
              WebSocial nace de la convicción de que los profesionales del sector social merecen herramientas a la altura de su compromiso.
            </p>
          </div>
        </Container>
      </section>

      <section className={styles.valuesSection}>
        <Container>
          <SectionHeading title="Nuestros principios" subtitle="" />
          <div className={styles.valuesGrid}>
            {values.map((value) => (
              <Card key={value.id} className={styles.valueCard}>
                <div className={styles.iconWrapper}>
                  <value.icon size={32} />
                </div>
                <h3 className={styles.valueTitle}>{value.title}</h3>
                <p className={styles.valueDescription}>{value.description}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      <section className={styles.visionSection}>
        <Container>
          <div className={styles.visionContent}>
            <h2>Nuestra visión</h2>
            <p>
              Nuestra visión es crear una plataforma integral que centralice todas las herramientas que un profesional del sector social necesita: desde calculadoras y generadores de documentos hasta gestión de proyectos y subvenciones.
            </p>
          </div>
        </Container>
      </section>

      <section className={styles.ctaSection}>
        <Container>
          <div className={styles.ctaContent}>
            <h2>¿Quieres saber más?</h2>
            <p>Estamos abiertos a sugerencias, colaboraciones y feedback de la comunidad.</p>
            <Button href="/contacto" variant="primary" size="lg">
              Contactar ahora
            </Button>
          </div>
        </Container>
      </section>
    </main>
  );
}
