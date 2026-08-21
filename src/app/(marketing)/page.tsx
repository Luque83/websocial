import type { Metadata } from "next";
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
  title: "WebSocial — Plataforma profesional para el Tercer Sector",
  description:
    "Herramientas, recursos y soluciones para trabajadores sociales, educadores sociales y profesionales de la intervención social. Reduce la burocracia, aumenta el impacto.",
};

const valueProps = [
  {
    icon: Clock,
    title: "Ahorra tiempo",
    description:
      "Reduce hasta un 65% el tiempo dedicado a documentación, cálculos y gestión administrativa.",
  },
  {
    icon: Shield,
    title: "Seguro y conforme",
    description:
      "Diseñado con RGPD y LOPDGDD en mente. Tus datos y los de las personas atendidas, protegidos.",
  },
  {
    icon: Zap,
    title: "Herramientas especializadas",
    description:
      "Calculadoras, generadores y plantillas diseñadas por y para profesionales del sector social.",
  },
  {
    icon: Target,
    title: "Todo en un lugar",
    description:
      "Centraliza proyectos, subvenciones, indicadores y documentación en una única plataforma.",
  },
];

const featuredTools = [
  {
    icon: Calculator,
    name: "Calculadora de indicadores",
    description:
      "Calcula y gestiona indicadores de impacto social de tus proyectos de forma sencilla.",
    category: "Calculadoras",
    tier: "free" as const,
  },
  {
    icon: FileText,
    name: "Generador de presupuestos",
    description:
      "Crea presupuestos profesionales para proyectos sociales con desglose por partidas.",
    category: "Generadores",
    tier: "free" as const,
  },
  {
    icon: BarChart3,
    name: "Matriz de marco lógico",
    description:
      "Diseña y estructura tus proyectos con el estándar de marco lógico completo.",
    category: "Generadores",
    tier: "pro" as const,
  },
  {
    icon: Briefcase,
    name: "Control de subvenciones",
    description:
      "Gestiona plazos, requisitos y justificaciones de todas tus subvenciones en un solo lugar.",
    category: "Gestión",
    tier: "pro" as const,
  },
  {
    icon: Users,
    name: "Cálculo de costes de personal",
    description:
      "Prorrateo de nóminas, porcentajes de jornada e imputación a proyectos de forma automática.",
    category: "Calculadoras",
    tier: "free" as const,
  },
  {
    icon: BookOpen,
    name: "Generador de memorias",
    description:
      "Genera memorias de actividades y justificación técnica a partir de los datos del proyecto.",
    category: "Documentos",
    tier: "pro" as const,
  },
];

const audiences = [
  {
    icon: HeartHandshake,
    title: "Trabajadores/as sociales",
    description: "Informes, historias sociales, valoraciones y seguimiento de casos.",
  },
  {
    icon: Users,
    title: "Educadores/as sociales",
    description: "Proyectos educativos, actividades, indicadores y memorias.",
  },
  {
    icon: Briefcase,
    title: "Técnicos/as de proyectos",
    description: "Diseño, formulación, presupuestación y seguimiento de proyectos.",
  },
  {
    icon: BarChart3,
    title: "Gestores/as de subvenciones",
    description: "Control de convocatorias, plazos, justificaciones y auditorías.",
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
          'Plataforma de herramientas, calculadoras y recursos para trabajadores sociales, educadores sociales y profesionales del Tercer Sector en España.',
        areaServed: 'ES',
        knowsAbout: [
          'Trabajo social',
          'Servicios sociales',
          'Gestión de proyectos sociales',
          'Subvenciones',
          'Tercer Sector',
        ],
      },
      {
        '@type': 'WebSite',
        '@id': 'https://websocial.es/#website',
        url: 'https://websocial.es',
        name: 'WebSocial',
        publisher: { '@id': 'https://websocial.es/#organization' },
        inLanguage: 'es',
        potentialAction: {
          '@type': 'SearchAction',
          target: 'https://websocial.es/blog?q={search_term_string}',
          'query-input': 'required name=search_term_string',
        },
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
              🚀 Plataforma para el Tercer Sector
            </Badge>
            <h1 className={styles.heroTitle}>
              Menos burocracia.
              <br />
              <span className={styles.heroTitleAccent}>
                Más intervención social.
              </span>
            </h1>
            <p className={styles.heroSubtitle}>
              Herramientas, calculadoras y recursos profesionales diseñados para
              trabajadores sociales, educadores sociales y profesionales del
              Tercer Sector. Simplifica tu gestión para centrarte en lo que
              importa: las personas.
            </p>
            <div className={styles.heroCtas}>
              <Button href="/herramientas" size="lg">
                Explorar herramientas
                <ArrowRight size={18} />
              </Button>
              <Button href="/sobre-nosotros" variant="outline" size="lg">
                Conoce el proyecto
              </Button>
            </div>
            <div className={styles.heroTrust}>
              <span className={styles.heroTrustItem}>
                <Shield size={14} /> Cumplimiento RGPD
              </span>
              <span className={styles.heroTrustItem}>
                <Zap size={14} /> 100% gratuito en fase inicial
              </span>
              <span className={styles.heroTrustItem}>
                <Target size={14} /> Diseñado por profesionales del sector
              </span>
            </div>
          </FadeIn>
        </Container>
      </section>

      {/* ═══ VALUE PROPOSITION ═══ */}
      <section className={styles.section}>
        <Container>
          <SectionHeading
            eyebrow="¿Por qué WebSocial?"
            title="Tu trabajo importa. Tu tiempo también."
            subtitle="Dedicamos demasiadas horas a burocracia, cálculos y papeleo. WebSocial te devuelve ese tiempo para la intervención profesional."
          />
          <div className={styles.valueGrid}>
            {valueProps.map((item) => (
              <Card key={item.title} variant="elevated" hoverable>
                <div className={styles.valueIcon}>
                  <item.icon size={24} />
                </div>
                <h3 className={styles.valueTitle}>{item.title}</h3>
                <p className={styles.valueDescription}>{item.description}</p>
              </Card>
            ))}
          </div>
        </Container>
      </section>

      {/* ═══ FEATURED TOOLS ═══ */}
      <section className={styles.sectionAlt}>
        <Container>
          <SectionHeading
            eyebrow="Herramientas profesionales"
            title="Diseñadas para tu día a día"
            subtitle="Calculadoras, generadores y utilidades especializadas para el sector social. Sin complicaciones."
          />
          <div className={styles.toolsGrid}>
            {featuredTools.map((tool) => (
              <Card key={tool.name} variant="default" hoverable padding="lg">
                <div className={styles.toolHeader}>
                  <div className={styles.toolIcon}>
                    <tool.icon size={22} />
                  </div>
                  <Badge
                    variant={tool.tier === "free" ? "success" : "accent"}
                    size="sm"
                  >
                    {tool.tier === "free" ? "Gratuita" : "PRO"}
                  </Badge>
                </div>
                <h3 className={styles.toolName}>{tool.name}</h3>
                <p className={styles.toolDescription}>{tool.description}</p>
                <span className={styles.toolCategory}>{tool.category}</span>
              </Card>
            ))}
          </div>
          <div className={styles.toolsCta}>
            <Button href="/herramientas" variant="outline">
              Ver todas las herramientas
              <ArrowRight size={16} />
            </Button>
          </div>
        </Container>
      </section>

      {/* ═══ AUDIENCE ═══ */}
      <section className={styles.section}>
        <Container>
          <SectionHeading
            eyebrow="¿Para quién es WebSocial?"
            title="Para profesionales que marcan la diferencia"
            subtitle="Tanto si trabajas en una ONG, una fundación, un ayuntamiento o como profesional independiente."
          />
          <div className={styles.audienceGrid}>
            {audiences.map((item) => (
              <div key={item.title} className={styles.audienceItem}>
                <div className={styles.audienceIcon}>
                  <item.icon size={28} />
                </div>
                <div>
                  <h3 className={styles.audienceTitle}>{item.title}</h3>
                  <p className={styles.audienceDescription}>
                    {item.description}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </Container>
      </section>

      {/* ═══ NEWSLETTER ═══ */}
      <Container size="lg" className={styles.newsletterSection}>
        <FadeIn delay={200} direction="up">
          <NewsletterCTA />
        </FadeIn>
      </Container>

      {/* ═══ CTA FINAL ═══ */}
      <section className={styles.ctaSection}>
        <Container size="lg">
          <div className={styles.ctaCard}>
            <h2 className={styles.ctaTitle}>
              Empieza a simplificar tu trabajo hoy
            </h2>
            <p className={styles.ctaSubtitle}>
              Accede a herramientas profesionales gratuitas diseñadas
              específicamente para el Tercer Sector.
            </p>
            <div className={styles.ctaButtons}>
              <Button href="/herramientas" size="lg" variant="secondary">
                Explorar herramientas gratuitas
                <ArrowRight size={18} />
              </Button>
              <Button href="/contacto" size="lg" variant="ghost">
                Contactar con nosotros
              </Button>
            </div>
          </div>
        </Container>
      </section>
    </>
  );
}
