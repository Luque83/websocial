import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { ShieldCheck, Lock, Server, FileText, Database, Key } from 'lucide-react';
import styles from './seguridad.module.css';

export const metadata: Metadata = {
  title: 'Seguridad, Privacidad y RGPD | WebSocial',
  description: 'Conoce los estándares de seguridad, soberanía europea de datos y cumplimiento RGPD de WebSocial para el Tercer Sector.',
};

export default function SeguridadRgpdPage() {
  return (
    <main className={styles.main}>
      <Container>
        <SectionHeading
          eyebrow="Privacidad y Compromiso Legal"
          title="Seguridad de nivel bancario y cumplimiento RGPD estricto"
          subtitle="Diseñado desde el primer día para proteger los datos sensibles y proyectos de las entidades del Tercer Sector."
        />

        <div className={styles.grid3}>
          <div className={styles.securityCard}>
            <div className={styles.iconWrapper}>
              <Server size={24} />
            </div>
            <h2 className={styles.cardTitle}>Soberanía de Datos en la UE</h2>
            <p className={styles.cardText}>
              Todos los servidores y bases de datos están ubicados físicamente en centros de datos de la <strong>Unión Europea (Alemania / España)</strong>. No realizamos transferencias internacionales de datos a terceros países.
            </p>
          </div>

          <div className={styles.securityCard}>
            <div className={styles.iconWrapper}>
              <Lock size={24} />
            </div>
            <h2 className={styles.cardTitle}>Cifrado de Extremo a Extremo</h2>
            <p className={styles.cardText}>
              Tus datos viajan cifrados mediante conexiones seguras <strong>HTTPS / TLS 1.3</strong> y se almacenan en reposo bajo el estándar de cifrado militar <strong>AES-256</strong>.
            </p>
          </div>

          <div className={styles.securityCard}>
            <div className={styles.iconWrapper}>
              <Database size={24} />
            </div>
            <h2 className={styles.cardTitle}>Aislamiento por Organización (RLS)</h2>
            <p className={styles.cardText}>
              Utilizamos políticas de seguridad a nivel de motor de base de datos (<em>Row Level Security</em>). Cada entidad social tiene sus proyectos herméticamente aislados del resto.
            </p>
          </div>

          <div className={styles.securityCard}>
            <div className={styles.iconWrapper}>
              <FileText size={24} />
            </div>
            <h2 className={styles.cardTitle}>Contrato DPA (Art. 28 RGPD)</h2>
            <p className={styles.cardText}>
              Formalizamos un <strong>Contrato de Encargo de Tratamiento</strong> con cada entidad cliente, garantizando la cobertura jurídica exigida por la Agencia Española de Protección de Datos (AEPD).
            </p>
          </div>

          <div className={styles.securityCard}>
            <div className={styles.iconWrapper}>
              <Key size={24} />
            </div>
            <h2 className={styles.cardTitle}>Copias de Seguridad Diarias</h2>
            <p className={styles.cardText}>
              Realizamos copias de seguridad automáticas diarias redundadas geográficamente para garantizar la disponibilidad e integridad de tus proyectos ante cualquier contingencia.
            </p>
          </div>

          <div className={styles.securityCard}>
            <div className={styles.iconWrapper}>
              <ShieldCheck size={24} />
            </div>
            <h2 className={styles.cardTitle}>Propiedad de tus Datos</h2>
            <p className={styles.cardText}>
              Tu entidad es la única dueña de los datos. Puedes solicitar la exportación completa o la eliminación definitiva de tus proyectos en cualquier momento, sin trabas ni retenciones.
            </p>
          </div>
        </div>

        <div className={styles.dpaSection}>
          <div>
            <h2 className={styles.dpaTitle}>¿Necesitas el acuerdo de protección de datos para tu junta o auditoría?</h2>
            <p className={styles.dpaText}>
              Proporcionamos a todas las entidades del Plan Entidad el documento firmado del Encargo de Tratamiento listo para incorporar a su expediente de justificación o memoria de transparencia.
            </p>
          </div>
          <div className={styles.dpaAction}>
            <Link 
              href="/contacto?motivo=rgpd" 
              style={{
                backgroundColor: 'white',
                color: 'var(--color-primary-900)',
                padding: '1rem 2rem',
                borderRadius: 'var(--radius-md)',
                fontWeight: 700,
                display: 'inline-block',
                textDecoration: 'none'
              }}
            >
              Contactar con DPO
            </Link>
          </div>
        </div>
      </Container>
    </main>
  );
}
