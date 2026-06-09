import { Resend } from "resend";
import { render } from "@react-email/components";
import type { ReactElement } from "react";

let cached: Resend | null = null;

function getResend(): Resend | null {
  if (cached) return cached;
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  cached = new Resend(key);
  return cached;
}

function getSender(): string {
  return process.env.RESEND_FROM || "Papás en CDMX <hola@papasencdmx.com>";
}

export async function sendEmail(params: {
  to: string;
  subject: string;
  react: ReactElement;
  replyTo?: string;
}): Promise<{ ok: boolean; id?: string; error?: string }> {
  const resend = getResend();
  if (!resend) {
    console.warn("[email] RESEND_API_KEY missing; skipping email send to", params.to);
    return { ok: false, error: "RESEND_API_KEY not configured" };
  }

  try {
    // Render React Email to HTML + plaintext server-side to avoid SDK render-time crashes.
    const html = await render(params.react);
    const text = await render(params.react, { plainText: true });

    const res = await resend.emails.send({
      from: getSender(),
      to: params.to,
      subject: params.subject,
      html,
      text,
      replyTo: params.replyTo,
    });
    if (res.error) {
      console.error("[email] Resend error:", res.error);
      return { ok: false, error: res.error.message };
    }
    return { ok: true, id: res.data?.id };
  } catch (err) {
    const msg = err instanceof Error ? err.message : String(err);
    console.error("[email] Send failed:", msg);
    return { ok: false, error: msg };
  }
}
