import { Container } from "@/components/ui/Container";
import { Button } from "@/components/ui/Button";

export default function NotFound() {
  return (
    <div
      style={{
        minHeight: "100vh",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
      }}
    >
      <Container size="sm">
        <p
          style={{
            fontSize: "5rem",
            fontWeight: 800,
            lineHeight: 1,
            color: "var(--color-primary-200)",
            marginBottom: "var(--space-4)",
          }}
        >
          404
        </p>
        <h1
          style={{
            fontSize: "clamp(1.5rem, 3vw, 2rem)",
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: "var(--space-4)",
          }}
        >
          Página no encontrada
        </h1>
        <p
          style={{
            fontSize: "1.0625rem",
            color: "var(--text-secondary)",
            marginBottom: "var(--space-8)",
            lineHeight: 1.6,
          }}
        >
          Lo sentimos, la página que buscas no existe o ha sido movida.
        </p>
        <Button href="/">Volver al inicio</Button>
      </Container>
    </div>
  );
}
