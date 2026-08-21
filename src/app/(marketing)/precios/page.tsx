import type { Metadata } from 'next';
import Link from 'next/link';
import { Container } from '@/components/ui/Container';
import { SectionHeading } from '@/components/ui/SectionHeading';
import { Check, ShieldCheck } from 'lucide-react';
import styles from './precios.module.css';

export const metadata: Metadata = {
  title: 'Planes y Precios | Software para ONGs y Profesionales Sociales',
  description: 'Planes adaptados al Tercer Sector. 100% subvencionables e imputables como costes indirectos o gestión de proyectos.',
};

export default function PreciosPage() {
  return (
    <main className={styles.main}>
      <Container>
        <div style={{ textAlign: 'center' }}>
          <SectionHeading
            eyebrow="Planes transparentes para el Tercer Sector"
            title="Tecnología profesional al alcance de cualquier entidad"
            subtitle="Diseñado para maximizar el impacto social de tus proyectos sin poner en riesgo tu presupuesto."
          />
          
          <div className={styles.subventionBadge}>
            <ShieldCheck size={20} />
            <span><strong>100% Subvencionable:</strong> El coste de la licencia es imputable a tus proyectos como gasto directo de software o coste indirecto de gestión.</span>
          </div>
        </div>

        <div className={styles.pricingGrid}>
          {/* Plan Gratuito */}
          <div className={styles.pricingCard}>
            <h2 className={styles.planName}>Comunidad</h2>
            <p className={styles.planDescription}>Para estudiantes, técnicos individuales y consultas puntuales.</p>
            <div className={styles.priceContainer}>
              <span className={styles.priceNumber}>0 €</span>
              <span className={styles.pricePeriod}>/ para siempre</span>
            </div>
            <ul className={styles.featuresList}>
              <li className={styles.featureItem}>
                <Check size={18} className={styles.featureCheck} />
                <span>Acceso a las 7 calculadoras y generadores online</span>
              </li>
              <li className={styles.featureItem}>
                <Check size={18} className={styles.featureCheck} />
                <span>Cálculos de Marco Lógico, Costes y Bajas</span>
              </li>
              <li className={styles.featureItem}>
                <Check size={18} className={styles.featureCheck} />
                <span>Exportación básica a PDF con marca de agua</span>
              </li>
              <li className={styles.featureItem}>
                <Check size={18} className={styles.featureCheck} />
                <span>Acceso a guías y blog profesional</span>
              </li>
            </ul>
            <div className={styles.cardCta}>
              <Link href="/registro" className={`${styles.ctaBtn} ${styles.ctaOutline}`}>
                Empezar gratis
              </Link>
            </div>
          </div>

          {/* Plan Entidad ONG (Destacado) */}
          <div className={`${styles.pricingCard} ${styles.featuredCard}`}>
            <div className={styles.featuredTag}>Más recomendado para ONGs</div>
            <h2 className={styles.planName}>Entidad Social</h2>
            <p className={styles.planDescription}>Para asociaciones, fundaciones y ONGs que gestionan subvenciones públicas.</p>
            <div className={styles.priceContainer}>
              <span className={styles.priceNumber}>69 €</span>
              <span className={styles.pricePeriod}>/ mes (o 690 €/año facturado)</span>
            </div>
            <ul className={styles.featuresList}>
              <li className={styles.featureItem}>
                <Check size={18} className={styles.featureCheck} />
                <span><strong>Proyectos ilimitados</strong> en la nube</span>
              </li>
              <li className={styles.featureItem}>
                <Check size={18} className={styles.featureCheck} />
                <span><strong>Hasta 5 técnicos</strong> con acceso al Workspace</span>
              </li>
              <li className={styles.featureItem}>
                <Check size={18} className={styles.featureCheck} />
                <span><strong>Personalización con logo y CIF de tu ONG</strong> en todos los PDFs</span>
              </li>
              <li className={styles.featureItem}>
                <Check size={18} className={styles.featureCheck} />
                <span>Tablero de control ejecutivo y métricas de impacto</span>
              </li>
              <li className={styles.featureItem}>
                <Check size={18} className={styles.featureCheck} />
                <span>Auto-completado de memorias y presupuestos cruzados</span>
              </li>
              <li className={styles.featureItem}>
                <Check size={18} className={styles.featureCheck} />
                <span>Factura oficial con CIF para justificación de subvención</span>
              </li>
            </ul>
            <div className={styles.cardCta}>
              <Link href="/registro?plan=entidad" className={`${styles.ctaBtn} ${styles.ctaPrimary}`}>
                Contratar para mi entidad
              </Link>
            </div>
          </div>

          {/* Plan Federaciones / Gran Entidad */}
          <div className={styles.pricingCard}>
            <h2 className={styles.planName}>Federación / Red</h2>
            <p className={styles.planDescription}>Para grandes organizaciones, federaciones y redes con múltiples sedes.</p>
            <div className={styles.priceContainer}>
              <span className={styles.priceNumber}>A medida</span>
            </div>
            <ul className={styles.featuresList}>
              <li className={styles.featureItem}>
                <Check size={18} className={styles.featureCheck} />
                <span>Usuarios y sedes territoriales ilimitadas</span>
              </li>
              <li className={styles.featureItem}>
                <Check size={18} className={styles.featureCheck} />
                <span>Plantillas corporativas unificadas</span>
              </li>
              <li className={styles.featureItem}>
                <Check size={18} className={styles.featureCheck} />
                <span>Formación online personalizada para el equipo</span>
              </li>
              <li className={styles.featureItem}>
                <Check size={18} className={styles.featureCheck} />
                <span>Contrato DPA de Protección de Datos personalizado</span>
              </li>
              <li className={styles.featureItem}>
                <Check size={18} className={styles.featureCheck} />
                <span>Gestor de cuenta y soporte telefónico prioritario</span>
              </li>
            </ul>
            <div className={styles.cardCta}>
              <Link href="/contacto?motivo=federacion" className={`${styles.ctaBtn} ${styles.ctaOutline}`}>
                Solicitar propuesta
              </Link>
            </div>
          </div>
        </div>

        {/* Sección de Preguntas Frecuentes */}
        <section className={styles.faqSection}>
          <h3 className={styles.faqTitle}>Preguntas frecuentes sobre contratación y subvenciones</h3>
          <div className={styles.faqGrid}>
            <div className={styles.faqItem}>
              <h4 className={styles.faqQuestion}>¿Podemos justificar la factura de WebSocial en nuestras subvenciones?</h4>
              <p className={styles.faqAnswer}>
                Sí, absolutamente. Emitimos factura oficial con los datos fiscales de tu entidad (CIF y razón social). La mayoría de convocatorias (IRPF autonómico y estatal, FSE, Ministerios, Ayuntamientos y Fundaciones privadas) permiten imputar las licencias de software de gestión como <strong>Gasto directo de ejecución</strong> o dentro de la partida de <strong>Costes indirectos / Gastos generales</strong>.
              </p>
            </div>
            <div className={styles.faqItem}>
              <h4 className={styles.faqQuestion}>¿Podemos pagar por transferencia bancaria anual?</h4>
              <p className={styles.faqAnswer}>
                Sí. Sabemos que muchas entidades sociales operan mediante mancomunidad de firmas y aprobación de facturas. Emitimos una factura proforma anual y activamos la licencia de tu equipo en cuanto se confirma la transferencia.
              </p>
            </div>
            <div className={styles.faqItem}>
              <h4 className={styles.faqQuestion}>¿Dónde se almacenan los datos de nuestra ONG?</h4>
              <p className={styles.faqAnswer}>
                Todos los datos se almacenan exclusivamente en servidores ubicados dentro del territorio de la <strong>Unión Europea (Frankfurt / Madrid)</strong> con cifrado de nivel bancario (AES-256). Cumplimos estrictamente con el RGPD y la LOPDGDD, garantizando que ninguna otra entidad tenga acceso a vuestros proyectos.
              </p>
            </div>
            <div className={styles.faqItem}>
              <h4 className={styles.faqQuestion}>¿Qué ocurre si decidimos cancelar la suscripción?</h4>
              <p className={styles.faqAnswer}>
                No hay permanencia. Vuestros datos son vuestra propiedad. En cualquier momento podéis exportar todas vuestras memorias, presupuestos y cronogramas en formato PDF o solicitar la eliminación definitiva conforme al derecho de supresión del RGPD.
              </p>
            </div>
          </div>
        </section>
      </Container>
    </main>
  );
}
