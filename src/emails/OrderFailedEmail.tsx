import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
  Hr,
  Button,
} from "@react-email/components";

interface OrderFailedEmailProps {
  orderNumber: string;
  buyerName: string;
  eventTitle: string;
  isCamp?: boolean;
  retryUrl: string;
  whatsappUrl: string;
  supportEmail: string;
  supportPhoneDisplay: string;
}

const brand = "#F08C00";
const ink = "#272E2F";
const muted = "#777777";
const soft = "#F6F6F6";
const border = "#EAEAEA";
const danger = "#DC2626";

export function OrderFailedEmail({
  orderNumber,
  buyerName,
  eventTitle,
  isCamp = false,
  retryUrl,
  whatsappUrl,
  supportEmail,
  supportPhoneDisplay,
}: OrderFailedEmailProps) {
  const heroLabel = isCamp ? "Reserva no completada" : "Pago no completado";
  const heading = isCamp
    ? `Hola ${buyerName.split(" ")[0]}, tu reserva del campamento no se pudo completar.`
    : `Hola ${buyerName.split(" ")[0]}, tu pago no se pudo procesar.`;
  const retryCta = isCamp ? "Reintentar la reserva" : "Reintentar el pago";
  const previewCopy = isCamp
    ? `Tu reserva del campamento no se pudo completar · ${orderNumber}`
    : `Tu pago no se pudo completar · ${orderNumber}`;
  return (
    <Html>
      <Head />
      <Preview>{previewCopy}</Preview>
      <Body style={{ backgroundColor: "#F2F2F2", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 600, margin: "0 auto", backgroundColor: "#FFFFFF", borderRadius: 16, overflow: "hidden", marginTop: 24, marginBottom: 24 }}>
          <Section style={{ backgroundColor: brand, padding: "18px 28px" }}>
            <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: 700, margin: 0, letterSpacing: "0.4px", textTransform: "uppercase" }}>
              Papás en CDMX
            </Text>
          </Section>

          <Section style={{ padding: "36px 32px 12px" }}>
            <Text style={{ fontSize: 13, color: danger, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", margin: 0 }}>
              {heroLabel}
            </Text>
            <Heading style={{ fontSize: 26, color: ink, fontWeight: 800, margin: "8px 0 4px", lineHeight: 1.2 }}>
              {heading}
            </Heading>
            <Text style={{ fontSize: 15, color: muted, lineHeight: 1.6, margin: "10px 0 0" }}>
              No te hemos cobrado nada. Esto suele pasar por fondos insuficientes, una tarjeta bloqueada por tu banco o un dato incorrecto.
            </Text>
          </Section>

          <Section style={{ padding: "16px 32px 0" }}>
            <Container style={{ backgroundColor: soft, borderRadius: 12, padding: "16px 20px" }}>
              <Text style={{ fontSize: 11, color: muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.6px", margin: 0 }}>
                Pedido
              </Text>
              <Text style={{ fontSize: 18, color: ink, fontWeight: 700, margin: "4px 0 0" }}>
                {orderNumber} · {eventTitle}
              </Text>
            </Container>
          </Section>

          <Section style={{ padding: "28px 32px 8px", textAlign: "center" }}>
            <Button
              href={retryUrl}
              style={{
                backgroundColor: brand,
                color: "#FFFFFF",
                padding: "14px 28px",
                borderRadius: 10,
                fontSize: 14,
                fontWeight: 700,
                textDecoration: "none",
                display: "inline-block",
              }}
            >
              {retryCta}
            </Button>
          </Section>

          <Hr style={{ borderColor: border, margin: "28px 32px 0" }} />

          <Section style={{ padding: "20px 32px 28px" }}>
            <Text style={{ fontSize: 13, color: muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.6px", margin: 0 }}>
              ¿Quieres que te ayudemos?
            </Text>
            <Text style={{ fontSize: 14, color: ink, lineHeight: 1.6, margin: "6px 0 0" }}>
              Escríbenos por{" "}
              <Link href={whatsappUrl} style={{ color: brand, fontWeight: 700 }}>
                WhatsApp al {supportPhoneDisplay}
              </Link>{" "}
              — te respondemos el mismo día. También puedes escribir a{" "}
              <Link href={`mailto:${supportEmail}`} style={{ color: brand, fontWeight: 600 }}>
                {supportEmail}
              </Link>
              . Menciona tu pedido <strong>{orderNumber}</strong>.
            </Text>
          </Section>

          <Section style={{ backgroundColor: soft, padding: "18px 32px", textAlign: "center" }}>
            <Text style={{ fontSize: 12, color: muted, margin: 0, lineHeight: 1.6 }}>
              Papás en CDMX · Operado por Local Family Network LTD
            </Text>
          </Section>
        </Container>
      </Body>
    </Html>
  );
}

export default OrderFailedEmail;
