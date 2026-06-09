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

interface OrderDepositConfirmedEmailProps {
  orderNumber: string;
  buyerName: string;
  eventTitle: string;
  packName?: string | null;
  isCamp?: boolean;
  eventImageUrl?: string | null;
  occurrenceDate: string;
  occurrenceTime?: string | null;
  venue?: string | null;
  attendees: string[];
  quantity: number;
  totalFull: string; // "1.250,00 $"
  depositPaid: string; // "375,00 $"
  remaining: string; // "875,00 $"
  depositPercent: number; // 30
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
const accentRed = "#DC2626";
const accentRedSoft = "#FEF2F2";
const accentGreen = "#059669";
const accentGreenSoft = "#ECFDF5";
const accentAmber = "#B45309";
const accentAmberSoft = "#FFFBEB";

export function OrderDepositConfirmedEmail({
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
  totalFull,
  depositPaid,
  remaining,
  depositPercent,
  eventUrl,
  ticketsUrl,
  supportEmail,
  supportPhoneDisplay,
  whatsappUrl,
}: OrderDepositConfirmedEmailProps) {
  const productLabel = packName ? `${eventTitle} · ${packName}` : eventTitle;
  const heading = isCamp
    ? "¡Plaza reservada en el campamento!"
    : "¡Reserva recibida!";

  return (
    <Html>
      <Head />
      <Preview>{`Reserva ${orderNumber} confirmada · pagaste ${depositPaid} (${depositPercent}%) — te contactamos en 24-48h`}</Preview>
      <Body style={{ backgroundColor: soft, fontFamily: "-apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif", margin: 0, padding: "32px 12px" }}>
        <Container style={{ maxWidth: "560px", margin: "0 auto", backgroundColor: "#fff", borderRadius: "16px", border: `1px solid ${border}`, overflow: "hidden" }}>
          {/* Top sash */}
          <Section style={{ background: `linear-gradient(135deg, ${brand} 0%, #F97316 100%)`, padding: "20px 28px" }}>
            <Text style={{ color: "#fff", fontSize: "12px", fontWeight: 700, letterSpacing: "0.18em", textTransform: "uppercase", margin: 0, opacity: 0.9 }}>
              Papás en CDMX
            </Text>
            <Heading as="h1" style={{ color: "#fff", fontSize: "24px", fontWeight: 800, margin: "6px 0 0", lineHeight: 1.2 }}>
              {heading}
            </Heading>
          </Section>

          {/* Body */}
          <Section style={{ padding: "28px" }}>
            <Text style={{ color: ink, fontSize: "16px", margin: 0 }}>
              Hola {buyerName} 👋
            </Text>
            <Text style={{ color: ink, fontSize: "15px", lineHeight: 1.6, margin: "10px 0 0" }}>
              ¡Gracias por confiar en <strong>Papás en CDMX</strong>! Hemos recibido tu reserva
              correctamente y tu plaza está apartada. En las próximas{" "}
              <strong>24-48 horas</strong> nuestro equipo te contactará por email o teléfono para:
            </Text>

            <ul style={{ color: ink, fontSize: "14px", lineHeight: 1.7, paddingLeft: "20px", margin: "12px 0 0" }}>
              <li>Confirmar todos los detalles de la reserva</li>
              <li>Resolver cualquier duda que tengas sobre la actividad</li>
              <li>Coordinar el pago restante de la forma más cómoda para ti</li>
            </ul>

            {/* Pago resumen */}
            <Section style={{ marginTop: "22px", border: `1px solid ${border}`, borderRadius: "12px", overflow: "hidden" }}>
              {/* Pagado */}
              <Row style={{ backgroundColor: accentGreenSoft }}>
                <Column style={{ padding: "14px 18px" }}>
                  <Text style={{ color: accentGreen, fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
                    Pagado ahora ({depositPercent}% del total)
                  </Text>
                  <Text style={{ color: accentGreen, fontSize: "26px", fontWeight: 800, margin: "4px 0 0", lineHeight: 1 }}>
                    {depositPaid}
                  </Text>
                </Column>
              </Row>
              {/* Pendiente */}
              <Row style={{ backgroundColor: accentAmberSoft, borderTop: `1px solid ${border}` }}>
                <Column style={{ padding: "14px 18px" }}>
                  <Text style={{ color: accentAmber, fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
                    Pendiente (te contactamos para gestionarlo)
                  </Text>
                  <Text style={{ color: accentAmber, fontSize: "22px", fontWeight: 800, margin: "4px 0 0", lineHeight: 1 }}>
                    {remaining}
                  </Text>
                </Column>
              </Row>
              {/* Total */}
              <Row style={{ backgroundColor: "#fff", borderTop: `1px solid ${border}` }}>
                <Column style={{ padding: "12px 18px" }}>
                  <Text style={{ color: muted, fontSize: "12px", margin: 0 }}>
                    Total de la reserva: <strong style={{ color: ink }}>{totalFull}</strong>
                  </Text>
                </Column>
              </Row>
            </Section>

            {/* Detalles del pedido */}
            <Section style={{ marginTop: "22px", padding: "18px", backgroundColor: soft, borderRadius: "12px" }}>
              <Text style={{ color: muted, fontSize: "11px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
                Pedido <span style={{ color: ink, fontFamily: "ui-monospace, SFMono-Regular, monospace" }}>{orderNumber}</span>
              </Text>
              <Text style={{ color: ink, fontSize: "15px", fontWeight: 700, margin: "8px 0 0" }}>
                {productLabel}
              </Text>
              {eventImageUrl && (
                <Img
                  src={eventImageUrl}
                  alt={eventTitle}
                  width="500"
                  style={{ width: "100%", maxWidth: "500px", borderRadius: "10px", marginTop: "12px", display: "block" }}
                />
              )}
              <Hr style={{ borderColor: border, margin: "12px 0" }} />
              <Row>
                <Column style={{ paddingRight: "8px" }}>
                  <Text style={{ color: muted, fontSize: "11px", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>Fecha</Text>
                  <Text style={{ color: ink, fontSize: "13px", fontWeight: 600, margin: "2px 0 0" }}>
                    {occurrenceDate}{occurrenceTime ? ` · ${occurrenceTime}` : ""}
                  </Text>
                </Column>
                {venue && (
                  <Column>
                    <Text style={{ color: muted, fontSize: "11px", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>Ubicación</Text>
                    <Text style={{ color: ink, fontSize: "13px", fontWeight: 600, margin: "2px 0 0" }}>
                      {venue}
                    </Text>
                  </Column>
                )}
              </Row>
              <Hr style={{ borderColor: border, margin: "12px 0" }} />
              <Text style={{ color: muted, fontSize: "11px", margin: 0, textTransform: "uppercase", letterSpacing: "0.05em" }}>
                Asistente{quantity > 1 ? "s" : ""} ({quantity})
              </Text>
              <Text style={{ color: ink, fontSize: "13px", fontWeight: 600, margin: "2px 0 0" }}>
                {attendees.length > 0 ? attendees.join(", ") : "—"}
              </Text>
            </Section>

            {/* Próximos pasos */}
            <Section style={{ marginTop: "22px", padding: "18px", backgroundColor: accentRedSoft, borderRadius: "12px", border: `1px solid #FECACA` }}>
              <Text style={{ color: accentRed, fontSize: "12px", fontWeight: 700, textTransform: "uppercase", letterSpacing: "0.1em", margin: 0 }}>
                ⏱ Próximos pasos
              </Text>
              <Text style={{ color: ink, fontSize: "14px", lineHeight: 1.6, margin: "8px 0 0" }}>
                Tu plaza queda <strong>oficialmente apartada</strong> con este depósito. Nuestro equipo
                te contactará en menos de <strong>48 horas</strong> para finalizar todos los detalles.
                No tienes que hacer nada más por ahora — guarda este email como justificante.
              </Text>
            </Section>

            <Section style={{ marginTop: "22px", textAlign: "center" as const }}>
              <Button
                href={ticketsUrl}
                style={{
                  backgroundColor: brand,
                  color: "#fff",
                  fontSize: "14px",
                  fontWeight: 700,
                  textDecoration: "none",
                  padding: "12px 22px",
                  borderRadius: "10px",
                  display: "inline-block",
                }}
              >
                Ver mi reserva
              </Button>
            </Section>

            <Hr style={{ borderColor: border, margin: "26px 0 18px" }} />

            <Text style={{ color: muted, fontSize: "13px", lineHeight: 1.6, margin: 0 }}>
              ¿Tienes alguna duda urgente? Escríbenos a{" "}
              <Link href={`mailto:${supportEmail}`} style={{ color: brand, textDecoration: "none", fontWeight: 600 }}>
                {supportEmail}
              </Link>
              , llámanos al <strong style={{ color: ink }}>{supportPhoneDisplay}</strong> o{" "}
              <Link href={whatsappUrl} style={{ color: "#25D366", textDecoration: "none", fontWeight: 600 }}>
                escríbenos por WhatsApp
              </Link>
              .
            </Text>

            <Text style={{ color: muted, fontSize: "12px", lineHeight: 1.6, margin: "16px 0 0" }}>
              Papás en CDMX actúa como plataforma de reserva. La política de cancelación se rige por las{" "}
              <Link href={`${eventUrl.replace(/\/ofertas\/.*/, "")}/terminos-compra#cancelacion`} style={{ color: brand, textDecoration: "underline" }}>
                condiciones del organizador
              </Link>
              .
            </Text>
          </Section>
        </Container>

        <Text style={{ color: muted, fontSize: "11px", textAlign: "center" as const, margin: "16px auto 0", maxWidth: "560px" }}>
          Recibes este email porque has reservado en papasencdmx.com con el pedido {orderNumber}.
        </Text>
      </Body>
    </Html>
  );
}

export default OrderDepositConfirmedEmail;
