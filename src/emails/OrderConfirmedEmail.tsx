import {
  Body,
  Container,
  Head,
  Heading,
  Html,
  Img,
  Link,
  Preview,
  Section,
  Text,
  Hr,
  Row,
  Column,
  Button,
} from "@react-email/components";

interface OrderConfirmedEmailProps {
  orderNumber: string;
  buyerName: string;
  eventTitle: string;
  packName?: string | null;
  isCamp?: boolean;
  eventImageUrl?: string | null;
  occurrenceDate: string;        // "Sábado, 18 de abril de 2026" or "23 abr – 27 abr"
  occurrenceTime?: string | null; // "11:00"
  venue?: string | null;
  attendees: string[];
  quantity: number;
  total: string;                  // "24,00 $"
  eventUrl: string;
  ticketsUrl: string;
  supportEmail: string;
  supportPhoneDisplay: string;
  whatsappUrl: string;
}

const brand = "#F08C00";
const ink = "#272E2F";
const muted = "#777777";
const soft = "#F6F6F6";
const border = "#EAEAEA";

export function OrderConfirmedEmail({
  orderNumber,
  buyerName,
  eventTitle,
  packName,
  isCamp = false,
  eventImageUrl,
  occurrenceDate,
  occurrenceTime,
  venue,
  attendees,
  quantity,
  total,
  eventUrl,
  ticketsUrl,
  supportEmail,
  supportPhoneDisplay,
  whatsappUrl,
}: OrderConfirmedEmailProps) {
  const headingLead = isCamp ? "¡Plaza confirmada!" : "¡Reserva confirmada!";
  const heroCopy = isCamp
    ? `Hola ${buyerName.split(" ")[0]}, tu plaza en el campamento está reservada.`
    : `Hola ${buyerName.split(" ")[0]}, ya tienes tu plaza.`;
  const ticketCtaLabel = isCamp ? "Ver mi reserva" : "Ver mis entradas";
  const detailsCopy = isCamp ? "ver los detalles del campamento" : "ver los detalles del evento";
  return (
    <Html>
      <Head />
      <Preview>{headingLead} {orderNumber} · {eventTitle}</Preview>
      <Body style={{ backgroundColor: "#F2F2F2", fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", margin: 0, padding: 0 }}>
        <Container style={{ maxWidth: 600, margin: "0 auto", backgroundColor: "#FFFFFF", borderRadius: 16, overflow: "hidden", marginTop: 24, marginBottom: 24 }}>
          {/* Brand bar */}
          <Section style={{ backgroundColor: brand, padding: "18px 28px", textAlign: "left" }}>
            <Text style={{ color: "#FFFFFF", fontSize: 14, fontWeight: 700, margin: 0, letterSpacing: "0.4px", textTransform: "uppercase" }}>
              Papás en CDMX
            </Text>
          </Section>

          {/* Hero */}
          <Section style={{ padding: "36px 32px 12px" }}>
            <Text style={{ fontSize: 13, color: brand, fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.8px", margin: 0 }}>
              {headingLead}
            </Text>
            <Heading style={{ fontSize: 28, color: ink, fontWeight: 800, margin: "8px 0 4px", lineHeight: 1.2 }}>
              {heroCopy}
            </Heading>
            <Text style={{ fontSize: 15, color: muted, lineHeight: 1.6, margin: "8px 0 0" }}>
              Guarda este email como justificante. Tu número de pedido es <strong style={{ color: ink }}>{orderNumber}</strong>.
            </Text>
          </Section>

          {/* Order number card */}
          <Section style={{ padding: "0 32px" }}>
            <Container style={{ backgroundColor: soft, borderRadius: 12, padding: "16px 20px", margin: "20px 0 0" }}>
              <Text style={{ fontSize: 11, color: muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.6px", margin: 0 }}>
                Número de pedido
              </Text>
              <Text style={{ fontSize: 22, color: ink, fontWeight: 800, margin: "4px 0 0", fontFamily: "ui-monospace, SFMono-Regular, Menlo, monospace", letterSpacing: "0.5px" }}>
                {orderNumber}
              </Text>
            </Container>
          </Section>

          {/* Event card */}
          <Section style={{ padding: "24px 32px 0" }}>
            {eventImageUrl && (
              <Img
                src={eventImageUrl}
                alt={eventTitle}
                width="536"
                style={{ borderRadius: 12, width: "100%", height: "auto", display: "block", marginBottom: 16 }}
              />
            )}
            <Heading as="h2" style={{ fontSize: 20, color: ink, fontWeight: 700, margin: "0 0 4px", lineHeight: 1.3 }}>
              {eventTitle}
            </Heading>
            {packName && (
              <Text style={{ fontSize: 13, color: brand, fontWeight: 700, margin: "0 0 12px", textTransform: "uppercase", letterSpacing: "0.4px" }}>
                Pack: {packName}
              </Text>
            )}

            <Row style={{ marginBottom: 6 }}>
              <Column style={{ width: 100, verticalAlign: "top" }}>
                <Text style={{ fontSize: 13, color: muted, margin: 0 }}>Fecha</Text>
              </Column>
              <Column>
                <Text style={{ fontSize: 14, color: ink, fontWeight: 600, margin: 0 }}>
                  {occurrenceDate}{occurrenceTime ? ` · ${occurrenceTime}` : ""}
                </Text>
              </Column>
            </Row>

            {venue && (
              <Row style={{ marginBottom: 6 }}>
                <Column style={{ width: 100, verticalAlign: "top" }}>
                  <Text style={{ fontSize: 13, color: muted, margin: 0 }}>Lugar</Text>
                </Column>
                <Column>
                  <Text style={{ fontSize: 14, color: ink, margin: 0 }}>{venue}</Text>
                </Column>
              </Row>
            )}

            <Row style={{ marginBottom: 6 }}>
              <Column style={{ width: 100, verticalAlign: "top" }}>
                <Text style={{ fontSize: 13, color: muted, margin: 0 }}>
                  Asistente{quantity > 1 ? "s" : ""}
                </Text>
              </Column>
              <Column>
                <Text style={{ fontSize: 14, color: ink, margin: 0 }}>
                  {attendees.join(" · ")}
                </Text>
              </Column>
            </Row>

            <Row>
              <Column style={{ width: 100, verticalAlign: "top" }}>
                <Text style={{ fontSize: 13, color: muted, margin: 0 }}>Total</Text>
              </Column>
              <Column>
                <Text style={{ fontSize: 14, color: ink, fontWeight: 700, margin: 0 }}>{total}</Text>
              </Column>
            </Row>
          </Section>

          {/* CTAs */}
          <Section style={{ padding: "28px 32px 8px", textAlign: "center" }}>
            <Button
              href={ticketsUrl}
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
              {ticketCtaLabel}
            </Button>
            <Text style={{ fontSize: 13, color: muted, margin: "14px 0 0" }}>
              También puedes{" "}
              <Link href={eventUrl} style={{ color: brand, fontWeight: 600 }}>
                {detailsCopy}
              </Link>
              .
            </Text>
          </Section>

          {/* Next steps — campamentos only */}
          {isCamp && (
            <Section style={{ padding: "28px 32px 0" }}>
              <Container
                style={{
                  backgroundColor: "#ECFDF5",
                  border: "1px solid #A7F3D0",
                  borderRadius: 12,
                  padding: "18px 22px",
                }}
              >
                <Text
                  style={{
                    fontSize: 11,
                    color: "#047857",
                    fontWeight: 700,
                    textTransform: "uppercase",
                    letterSpacing: "0.6px",
                    margin: 0,
                  }}
                >
                  Próximos pasos
                </Text>
                <Text style={{ fontSize: 15, color: ink, fontWeight: 700, margin: "6px 0 8px" }}>
                  Te llamaremos en las próximas 24 horas.
                </Text>
                <Text style={{ fontSize: 14, color: ink, lineHeight: 1.6, margin: 0 }}>
                  Un miembro de nuestro equipo se pondrá en contacto contigo por{" "}
                  <strong>WhatsApp</strong> o por teléfono al número que nos has
                  facilitado, para confirmar todos los detalles del campamento
                  (hora de llegada, comidas, alergias, equipación, emergencia y
                  cualquier otra información importante sobre tu hijo/a).
                </Text>
                <Text style={{ fontSize: 13, color: muted, lineHeight: 1.6, margin: "10px 0 0" }}>
                  Tu plaza está <strong style={{ color: "#047857" }}>reservada y garantizada</strong>.
                  Esta llamada es solo para asegurar que todo salga perfecto el primer día.
                </Text>
              </Container>
            </Section>
          )}

          {/* Cancellation info — always visible after purchase */}
          <Section style={{ padding: "28px 32px 0" }}>
            <Container
              style={{
                backgroundColor: soft,
                border: `1px solid ${border}`,
                borderRadius: 12,
                padding: "18px 22px",
              }}
            >
              <Text
                style={{
                  fontSize: 11,
                  color: muted,
                  fontWeight: 700,
                  textTransform: "uppercase",
                  letterSpacing: "0.6px",
                  margin: 0,
                }}
              >
                ¿Necesitas cambiar tu reserva?
              </Text>
              <Text style={{ fontSize: 14, color: ink, lineHeight: 1.6, margin: "8px 0 0" }}>
                La política de cancelación y reembolso la establece el{" "}
                <strong>organizador</strong> de la actividad. Escríbenos y
                tramitamos tu solicitud con ellos.
              </Text>
              <Text style={{ fontSize: 14, color: ink, lineHeight: 1.6, margin: "8px 0 0" }}>
                Escribe a{" "}
                <Link href={`mailto:${supportEmail}`} style={{ color: brand, fontWeight: 600 }}>
                  {supportEmail}
                </Link>{" "}
                con el número de pedido <strong>{orderNumber}</strong> y el
                motivo de la solicitud.
              </Text>
            </Container>
          </Section>

          <Hr style={{ borderColor: border, margin: "28px 32px 0" }} />

          {/* Support */}
          <Section style={{ padding: "20px 32px 28px" }}>
            <Text style={{ fontSize: 13, color: muted, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.6px", margin: 0 }}>
              ¿Necesitas ayuda?
            </Text>
            <Text style={{ fontSize: 14, color: ink, lineHeight: 1.6, margin: "6px 0 0" }}>
              Escríbenos a{" "}
              <Link href={`mailto:${supportEmail}`} style={{ color: brand, fontWeight: 600 }}>
                {supportEmail}
              </Link>{" "}
              o por{" "}
              <Link href={whatsappUrl} style={{ color: brand, fontWeight: 600 }}>
                WhatsApp al {supportPhoneDisplay}
              </Link>
              . Menciona tu número de pedido <strong>{orderNumber}</strong>.
            </Text>
          </Section>

          {/* Footer */}
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

export default OrderConfirmedEmail;
