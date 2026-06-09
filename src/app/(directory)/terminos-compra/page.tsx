import Link from "next/link";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Términos de Compra | Papás en CDMX",
  description:
    "Términos y condiciones aplicables a la reserva y el pago de actividades, campamentos y servicios educativos a través de Papás en CDMX.",
  robots: { index: true, follow: true },
};

interface Section {
  title: string;
  id?: string;
  paragraphs?: string[];
  list?: string[];
}

export default function TerminosCompraPage() {
  const lastUpdated = new Date().toLocaleDateString("es-MX", {
    year: "numeric",
    month: "long",
    day: "numeric",
  });

  const sections: Section[] = [
    {
      title: "1. Objeto y aceptación",
      paragraphs: [
        "Estos Términos de compra regulan la contratación de entradas, plazas y packs de actividades, campamentos y servicios educativos (en adelante, “la Reserva” o “las Reservas”) realizada a través de la plataforma Papás en CDMX (en adelante, “la Plataforma”), operada por Local Family Network LTD.",
        "Al realizar una Reserva confirmas que has leído, entendido y aceptas expresamente estos Términos de compra, la Política de privacidad y el Aviso legal. Si no estás de acuerdo con alguno de estos documentos, no debes completar la compra.",
      ],
    },
    {
      title: "2. Rol de la Plataforma",
      paragraphs: [
        "La Plataforma actúa exclusivamente como intermediario tecnológico y procesador de pagos entre el comprador y el tercero que presta el servicio contratado (en adelante, “el Organizador”). La Plataforma no es el vendedor, prestador ni organizador de ninguna actividad, campamento o servicio ofrecido.",
        "El Organizador es el único responsable de la ejecución del servicio contratado, incluyendo instalaciones, personal, monitores, alimentación, transporte y cualquier otro aspecto operativo. Las condiciones específicas de cada servicio (horarios, requisitos, política de cancelación, etc.) son establecidas íntegramente por el Organizador.",
        "La Plataforma se compromete a seleccionar Organizadores verificados y a facilitar el proceso de contratación, pero no sustituye ni asume la responsabilidad profesional del Organizador sobre el servicio prestado.",
      ],
    },
    {
      title: "3. Condiciones del comprador",
      paragraphs: [
        "Para realizar una Reserva el comprador debe ser mayor de edad (18 años cumplidos) y, cuando la Reserva sea para un menor de edad, actuar en calidad de padre, madre o tutor legal del asistente. Al completar la compra, el comprador declara:",
      ],
      list: [
        "Ser mayor de edad y tener plena capacidad para contratar.",
        "Ser padre, madre o tutor legal del menor o menores que figuran como asistentes, y disponer de autorización para su participación.",
        "Que los datos facilitados (nombre, email, teléfono, nombre del asistente, etc.) son veraces, completos y actualizados.",
        "Que ha informado al Organizador, a través de las notas de la Reserva o por contacto directo, de cualquier alergia, condición médica, tratamiento, necesidad especial o información relevante sobre el asistente.",
      ],
    },
    {
      title: "4. Proceso de compra y confirmación",
      paragraphs: [
        "El precio, la descripción, las fechas y las plazas disponibles se muestran en la ficha de cada actividad o campamento. El precio final incluye los descuentos aplicables y los impuestos legales vigentes en México.",
        "Una vez enviado el formulario, serás redirigido a la pasarela de pago de Stripe para completar la transacción de forma segura. La Plataforma no almacena los datos completos de tu tarjeta.",
        "Tras el pago correcto recibirás por email un justificante con el número de pedido y los detalles de la Reserva. En el caso de campamentos, un miembro del equipo se pondrá en contacto contigo en un plazo máximo de 24 horas por WhatsApp o teléfono para confirmar todos los detalles operativos (horarios, llegada, comidas, alergias, equipación y contactos de emergencia).",
      ],
    },
    {
      title: "5. Liquidación de pagos al Organizador",
      paragraphs: [
        "La Plataforma transfiere los fondos al Organizador en un plazo máximo de siete (7) días naturales desde la fecha de la transacción. Durante ese periodo, los fondos permanecen en la cuenta de la Plataforma con el único fin de completar el proceso de liquidación.",
      ],
    },
    {
      title: "6. Derecho de desistimiento",
      paragraphs: [
        "Conforme a la Ley Federal de Protección al Consumidor (PROFECO), tratándose de servicios con fecha o periodo de ejecución específicos (como campamentos y actividades programadas), la cancelación y el reembolso se rigen por la política del organizador publicada antes del pago. Esta cláusula debe ser revisada por un abogado en México:",
      ],
      list: [
        "Servicios recreativos, campamentos y actividades con fecha programada: el reembolso depende de la política de cancelación de cada organizador, mostrada en la ficha del servicio y en la pantalla de pago.",
      ],
    },
    {
      id: "cancelacion",
      title: "7. Política de cancelación y reembolsos",
      paragraphs: [],
    },
    {
      title: "7.1. Política del Organizador",
      paragraphs: [
        "Cada Organizador establece su propia política de cancelación y reembolsos. Dicha política se muestra de forma visible en la ficha de la actividad y en la pantalla de pago, antes de completar la compra. Es responsabilidad del comprador leer y aceptar las condiciones del Organizador antes de realizar el pago.",
        "Algunos Organizadores no admiten reembolsos ni cancelaciones bajo ninguna circunstancia. Otros pueden ofrecer alternativas como crédito, traslado de fecha o cesión de plaza. Las condiciones concretas dependen exclusivamente de cada Organizador.",
      ],
    },
    {
      title: "7.2. Procesamiento de reembolsos",
      paragraphs: [
        "En los casos en que el Organizador autorice un reembolso, la Plataforma lo gestionará a través de Stripe. El importe reembolsado al comprador será el autorizado por el Organizador.",
        "Los gastos de procesamiento derivados de la transacción original y de la devolución (comisiones de la pasarela de pago) serán asumidos por el Organizador, conforme a las condiciones acordadas entre el Organizador y la Plataforma. Estos gastos no se repercutirán al comprador.",
        "El reembolso se realizará en el mismo medio de pago utilizado en la compra. El importe aparecerá en la cuenta del comprador en un plazo habitual de 5 a 10 días hábiles, sujeto a los tiempos del banco emisor.",
      ],
    },
    {
      title: "7.3. Cancelación por el Organizador o fuerza mayor",
      paragraphs: [
        "Si el Organizador cancela el servicio por causas imputables a él (falta de mínimo de asistentes, avería de instalaciones, indisponibilidad de personal, etc.), el comprador tendrá derecho al reembolso íntegro del importe pagado o, si lo prefiere, al traslado de la Reserva a otra fecha o servicio equivalente.",
        "En supuestos de fuerza mayor (fenómenos meteorológicos adversos graves, emergencias sanitarias, órdenes de autoridades, etc.) que impidan la prestación del servicio, la resolución (reembolso, traslado o crédito) se determinará conforme a la política del Organizador y a las obligaciones legales vigentes.",
      ],
    },
    {
      id: "como-cancelar",
      title: "7.4. Cómo solicitar cambio o cancelación",
      paragraphs: [
        "Para cualquier solicitud relacionada con cancelaciones, cambios o reembolsos, envía un correo a hola@papasencdmx.com indicando:",
      ],
      list: [
        "Número de pedido (PCM-XXXXXX) que aparece en tu email de confirmación.",
        "Nombre del comprador y del asistente.",
        "Motivo de la solicitud y alternativa preferida (si aplica).",
        "Documentación justificativa si el motivo es médico o de fuerza mayor.",
      ],
    },
    {
      title: "8. Información médica, alergias y contactos de emergencia",
      paragraphs: [
        "El comprador se compromete a comunicar al Organizador, antes del inicio de la actividad, cualquier dato médico, alergia alimentaria, tratamiento farmacológico, necesidad educativa especial o información relevante del asistente. Estos datos se tratarán con la máxima confidencialidad y únicamente con la finalidad de garantizar la seguridad y bienestar del menor durante la actividad.",
        "El comprador facilitará un teléfono de contacto operativo durante toda la duración del servicio. La Plataforma y el Organizador podrán utilizar este teléfono para cualquier comunicación urgente, incluidas situaciones de emergencia sanitaria.",
      ],
    },
    {
      title: "9. Uso de imágenes durante la actividad",
      paragraphs: [
        "Durante los campamentos y actividades pueden tomarse fotografías o vídeos con fines internos, de seguridad o de comunicación del Organizador o la Plataforma. Si no deseas que el asistente aparezca en estas imágenes, debes comunicarlo por escrito al Organizador y a la Plataforma antes del inicio de la actividad. En ausencia de comunicación expresa se entenderá que el comprador autoriza el uso de imágenes en los términos habituales del sector, siempre respetando la legislación vigente en materia de protección de menores.",
      ],
    },
    {
      title: "10. Precios, descuentos e impuestos",
      paragraphs: [
        "Todos los precios se muestran en pesos mexicanos (MXN) e incluyen los impuestos aplicables. Los descuentos mostrados en la ficha se aplican automáticamente sobre el importe cobrado. La factura o justificante podrá solicitarse por email a hola@papasencdmx.com indicando el número de pedido.",
      ],
    },
    {
      title: "11. Limitación de responsabilidad",
      paragraphs: [
        "La Plataforma actúa como intermediario tecnológico y procesador de pagos. Su responsabilidad se limita exclusivamente a la correcta gestión del proceso de contratación y cobro, y en cualquier caso, al importe efectivamente pagado por la Reserva.",
        "La Plataforma no responde de la calidad, disponibilidad, cancelación, modificación o cualquier otro aspecto relacionado con la ejecución del servicio prestado por el Organizador. Cualquier reclamación relativa al servicio contratado deberá dirigirse directamente al Organizador.",
        "El Organizador es el responsable civil de la actividad y debe disponer de los seguros exigidos por la normativa aplicable a la prestación de servicios a menores.",
      ],
    },
    {
      title: "12. Protección de datos y datos de menores",
      paragraphs: [
        "El tratamiento de datos personales se realiza conforme al Ley Federal de Protección de Datos Personales en Posesión de los Particulares (LFPDPPP) y la LFPDPPP. El responsable del tratamiento es Local Family Network LTD.",
        "Cuando la Reserva afecte a menores de catorce (14) años, se entenderá que el padre, madre o tutor legal presta el consentimiento en su nombre. Los datos del menor se tratarán con especial diligencia y únicamente se comunicarán al Organizador en la medida necesaria para la prestación del servicio.",
        "Puedes ejercer tus derechos de acceso, rectificación, supresión, oposición, limitación y portabilidad escribiendo a hola@papasencdmx.com. Más información en la Política de privacidad.",
      ],
    },
    {
      title: "13. Reclamaciones y servicio de atención al cliente",
      paragraphs: [
        "Puedes dirigir cualquier reclamación al correo hola@papasencdmx.com indicando tu número de pedido y el motivo de la reclamación. Nos comprometemos a responder en un plazo máximo de 14 días naturales. Como consumidor tienes también derecho a acudir a la plataforma de resolución de litigios en línea de la Comisión Europea, disponible en https://ec.europa.eu/consumers/odr.",
      ],
    },
    {
      title: "14. Ley aplicable y jurisdicción",
      paragraphs: [
        "Estos Términos de compra se rigen por la legislación mexicana. Para cualquier controversia relacionada con la Reserva, las partes se someten a los juzgados y tribunales del domicilio del consumidor.",
      ],
    },
    {
      title: "15. Modificaciones",
      paragraphs: [
        "La Plataforma podrá actualizar estos Términos de compra para reflejar cambios legislativos o en el funcionamiento del servicio. La versión aplicable a una Reserva será la vigente en el momento de la compra y quedará reflejada en el justificante recibido por email.",
      ],
    },
  ];

  return (
    <main className="container-padres section-padding">
      <div className="max-w-3xl mx-auto">
        <h1 className="font-display text-display-md sm:text-display-lg text-ocean-900 mb-4">
          Términos de compra
        </h1>
        <p className="text-sm text-warm-400 mb-10">Última actualización: {lastUpdated}</p>

        <div className="rounded-2xl bg-ocean-50 border border-ocean-100 p-5 mb-10">
          <p className="text-sm text-ocean-900 leading-relaxed">
            <strong className="font-semibold">Resumen rápido:</strong> Padres
            en CDMX es una plataforma que facilita la reserva y el pago de
            actividades infantiles. No organizamos las actividades: conectamos
            a las familias con los negocios que las ofrecen. Cada negocio
            establece sus propias condiciones de cancelación y reembolso, que
            se muestran antes de completar el pago.
          </p>
        </div>

        <div className="space-y-8">
          {sections.map((section) => (
            <section
              key={section.title}
              id={section.id}
              className="space-y-3 scroll-mt-20"
            >
              <h2 className="font-display text-lg font-bold text-ocean-900">
                {section.title}
              </h2>
              {section.paragraphs?.map((p, i) => (
                <p key={i} className="text-sm text-warm-600 leading-relaxed">
                  {p}
                </p>
              ))}
              {section.list && (
                <ul className="list-disc pl-6 space-y-1.5 text-sm text-warm-600">
                  {section.list.map((item) => (
                    <li key={item}>{item}</li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>

        <div className="mt-12 pt-8 border-t border-warm-200 text-sm text-warm-500 leading-relaxed">
          <p>
            Para condiciones generales de uso del sitio consulta nuestros{" "}
            <Link href="/terminos-uso" className="font-semibold text-brand-600 hover:text-brand-500">
              Términos de uso
            </Link>
            , el{" "}
            <Link href="/aviso-legal" className="font-semibold text-brand-600 hover:text-brand-500">
              Aviso legal
            </Link>{" "}
            y la{" "}
            <Link href="/politica-privacidad" className="font-semibold text-brand-600 hover:text-brand-500">
              Política de privacidad
            </Link>
            .
          </p>
          <p className="mt-4">
            ¿Dudas sobre tu reserva?{" "}
            <a
              href="mailto:hola@papasencdmx.com"
              className="font-semibold text-brand-600 hover:text-brand-500"
            >
              hola@papasencdmx.com
            </a>
          </p>
        </div>
      </div>
    </main>
  );
}
