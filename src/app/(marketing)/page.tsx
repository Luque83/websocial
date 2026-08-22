import type { Metadata } from "next";
import Link from "next/link";
import {
  Calculator,
  FileText,
  BarChart3,
  Clock,
  Shield,
  Users,
  Briefcase,
  HeartHandshake,
  ArrowRight,
  Zap,
  Target,
  BookOpen,
  Bot,
  Receipt,
  ShieldCheck,
  Building2,
  FileCheck,
  CheckCircle2
} from "lucide-react";
import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";
import { Card } from "@/components/ui/Card";
import { Badge } from "@/components/ui/Badge";
import { SectionHeading } from "@/components/ui/SectionHeading";
import { FadeIn } from "@/components/ui/FadeIn";
import { NewsletterCTA } from "@/components/marketing/NewsletterCTA";
import styles from "./page.module.css";

export const metadata: Metadata = {
  title: "WebSocial — La Plataforma que Entiende la Subvención",
  description:
    "Plataforma inteligente de gestión de proyectos, subvenciones y justificación oficial para entidades del Tercer Sector. Desde el análisis de bases con IA hasta la cuenta justificativa 1-clic.",
};

const valueProps = [
  {
    icon: Bot,
    title: "IA Documental Trazable",
    description:
      "Pega las bases reguladoras o resoluciones oficiales. La IA extrae gastos subvencionables, límites de costes indirectos y plazos con cita de artículos.",
  },
  {
    icon: Target,
    title: "Expediente Digital Único",
    description:
      "Un dato se introduce una vez y se reutiliza: Marco Lógico, nóminas con SS Patronal, registro de facturas y evidencias de actividades.",
  },
  {
    icon: ShieldCheck,
    title: "Auditoría Preventiva y Riesgo",
    description:
      "Semáforo de cumplimiento continuo (🟢/🟡/🔴) que detecta facturas sin justificante bancario o desviaciones presupuestarias (>10%).",
  },
  {
    icon: FileCheck,
    title: "Cuenta Justificativa 1-Clic",
    description:
      "Compila automáticamente la memoria oficial de liquidación con trazabilidad técnica y económica completa lista para PDF o Excel (CSV).",
  },
];

const featuredTools = [
  {
    icon: Calculator,
    name: "Calculadora de Cofinanciación",
    description:
      "Calcula el reparto oficial entre subvención, fondos propios de la ONG y valoración en especie.",
    category: "Financiación",
    tier: "free" as const,
    href: "/herramientas/calculadora-cofinanciacion"
  },
  {
    icon: FileCheck,
    name: "Checklist de Justificación",
    description:
      "Auditoría preventiva de facturas, nóminas, RLC/RNT y publicidad de logos antes de la entrega.",
    category: "Auditoría",
    tier: "free" as const,
    href: "/herramientas/checklist-justificacion"
  },
  {
    icon: BarChart3,
    name: "Matriz de Marco Lógico",
    description:
      "Diseña objetivos, resultados, actividades y vincula las evidencias obligatorias (firmas, fotos).",
    category: "Proyectos",
    tier: "free" as const,
    href: "/herramientas/marco-logico"
  },
  {
    icon: Users,
    name: "Prorrateo de Nóminas",
    description:
      "Imputación salarial multiproyecto con cálculo exacto de coste empresa y SS Patronal (~31,4%).",
    category: "Personal",
    tier: "free" as const,
    href: "/herramientas/prorrateo-nominas"
  },
  {
    icon: Calculator,
    name: "Presupuesto y Desviaciones",
    description:
      "Control de costes directos, indirectos y alertas tempranas de desviación legal de partidas (±10%).",
    category: "Finanzas",
    tier: "free" as const,
    href: "/herramientas/costes-proyecto"
  },
  {
    icon: BookOpen,
    name: "Memoria Técnica Oficial",
    description:
      "Generador estructurado de la memoria técnica de actividades y justificación narrativa.",
    category: "Documentos",
    tier: "free" as const,
    href: "/herramientas/memoria-proyecto"
  },
];

const audiences = [
  {
    icon: Building2,
    title: "Dirección de ONG y Asociaciones",
    description: "Supervisión de la cartera de subvenciones, calendario de vencimientos y semáforos de riesgo.",
  },
  {
    icon: Briefcase,
    title: "Técnicos/as de Proyectos",
    description: "Formulación rápida de marco lógico, indicadores, cronogramas y carga de hojas de firmas.",
  },
  {
    icon: Receipt,
    title: "Gestores/as Económicos y Admin",
    description: "Imputación clasificada de facturas, control de transferencias y cuadro financiero de liquidación.",
  },
  {
    icon: ShieldCheck,
    title: "Auditores/as y Evaluadores",
    description: "Revisión documental ágil y trazable con acceso directo a justificantes bancarios y evidencias.",
  },
];

export default function HomePage() {
  const jsonLd = {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'Organization',
        '@id': 'https://websocial.es/#organization',
        name: 'WebSocial',
        url: 'https://websocial.es',
        description:
          'Plataforma inteligente de gestión de proyectos, subvenciones y justificación oficial para el Tercer Sector en España.',
        areaServed: 'ES',
        knowsAbout: [
          'Subvenciones',
          'Gestión de proyectos sociales',
          'Marco Lógico',
          'Tercer Sector',
          'Justificación de subvenciones',
        ],
      },
      {
        '@type': 'WebSite',
        '@id': 'https://websocial.es/#website',
        url: 'https://websocial.es',
        name: 'WebSocial',
        publisher: { '@id': 'https://websocial.es/#organization' },
        inLanguage: 'es',
      },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify(jsonLd).replace(/</g, '\\u003c'),
        }}
      />
      {/* ═══ HERO ═══ */}
      <section className={styles.hero}>
        <div className={styles.heroBackground}>
          <div className={styles.heroGlow} />
          <div className={styles.heroGlowAccent} />
        </div>
        <Container size="xl">
          <FadeIn className={styles.heroContent}>
            <Badge variant="primary" size="md">
              🏛️ La Plataforma que Entiende la Subvención
            </Badge>
            <h1 className={styles.heroTitle}>
              Gestión inteligente de proyectos y subvenciones.
              <br />
              <span className={styles.heroTitleAccent}>
                Para el Tercer Sector.
              </span>
            </h1>
            <p className={styles.heroSubtitle}>
              Desde el análisis de bases oficiales con IA hasta la cuenta justificativa oficial.
              Centraliza en un único expediente digital el marco lógico, nóminas, facturas con pago bancario y evidencias de actividades.
            </p>
            <div className={styles.heroActions}>
              <Button href="/registro" size="lg" variant="primary">
                Crear Expediente Gratis <ArrowRight size={18} />
              </Button>
              <Button href="/herramientas" size="lg" variant="outline">
                Ver Herramientas Gratuitas
              </Button>
            </div>
            <div className={styles.heroProof}>
              <span className={styles.proofItem}>
                <CheckCircle2 size={16} className={styles.proofIcon} /> Sin tarjeta de crédito
              </span>
              <span className={styles.proofItem}>
                <CheckCircle2 size={16} className={styles.proofIcon} /> 10 Herramientas públicas activas
              </span>
              <span className={styles.proofItem}>
                <CheckCircle2 size={16} className={styles.proofIcon} /> Conforme a la Ley General de Subvenciones
              </span>
            </div>
          </FadeIn>
        </Container>
      </section>

      {/* ═══ VALUE PROPS ═══ */}
      <section className={styles.valueProps}>
        <Container size="xl">
          <SectionHeading
            eyebrow="Propuesta de Valor"
            title="Diseñado para resolver la complejidad de las subvenciones"
            subtitle="Un dato se introduce una sola vez y se reutiliza en el presupuesto, cronograma, control de facturas y memoria final."
            align="center"
          />
          <div className={styles.valueGrid}>
            {valueProps.map((prop, i) => {
              const Icon = prop.icon;
              return (
                <FadeIn key={prop.title} delay={i * 0.1}>
                  <Card className={styles.valueCard} padding="lg">
                    <div className={styles.valueIconWrapper}>
                      <Icon size={24} />
                    </div>
                    <h3 className={styles.valueTitle}>{prop.title}</h3>
                    <p className={styles.valueDescription}>{prop.description}</p>
                  </Card>
                </FadeIn>
              );
            })}
          </div>
        </Container>
      </section>

      {/* ═══ FEATURED TOOLS ═══ */}
      <section className={styles.tools}>
        <Container size="xl">
          <SectionHeading
            eyebrow="Ecosistema de Utilidad"
            title="Herramientas especializadas de libre acceso"
            subtitle="Calculadoras y generadores que resuelven tareas técnicas al instante sin necesidad de registrarte."
            align="center"
          />
          <div className={styles.toolsGrid}>
            {featuredTools.map((tool, i) => {
              const Icon = tool.icon;
              return (
                <FadeIn key={tool.name} delay={i * 0.08}>
                  <Link href={tool.href} style={{ textDecoration: 'none', color: 'inherit' }}>
                    <Card className={styles.toolCard} padding="md">
                      <div className={styles.toolHeader}>
                        <div className={styles.toolIconWrapper}>
                          <Icon size={20} />
                        </div>
                        <Badge variant="primary" size="sm">
                          {tool.category}
                        </Badge>
                      </div>
                      <h3 className={styles.toolName}>{tool.name}</h3>
                      <p className={styles.toolDescription}>{tool.description}</p>
                      <div className={styles.toolFooter}>
                        <span className={styles.toolLink}>
                          Abrir herramienta <ArrowRight size={14} />
                        </span>
                      </div>
                    </Card>
                  </Link>
                </FadeIn>
              );
            })}
          </div>
        </Container>
      </section>

      {/* ═══ AUDIENCES ═══ */}
      <section className={styles.audiences}>
        <Container size="xl">
          <SectionHeading
            eyebrow="Para todo el equipo"
            title="Colaboración multi-usuario para entidades sociales"
            subtitle="Permisos y vistas adaptadas a cada rol de tu organización."
            align="center"
          />
          <div className={styles.audiencesGrid}>
            {audiences.map((aud, i) => {
              const Icon = aud.icon;
              return (
                <FadeIn key={aud.title} delay={i * 0.1}>
                  <Card className={styles.audienceCard} padding="lg">
                    <div className={styles.audienceIconWrapper}>
                      <Icon size={24} />
                    </div>
                    <h3 className={styles.audienceTitle}>{aud.title}</h3>
                    <p className={styles.audienceDescription}>{aud.description}</p>
                  </Card>
                </FadeIn>
              );
            })}
          </div>
        </Container>
      </section>

      {/* ═══ NEWSLETTER CTA ═══ */}
      <NewsletterCTA />
    </>
  );
}
