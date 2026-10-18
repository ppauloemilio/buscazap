/**
 * Envio de texto WhatsApp para OTP de reivindicação.
 * Configure WHATSAPP_OTP_WEBHOOK_URL (POST JSON { to, text })
 * ou Evolution API (EVOLUTION_API_URL + EVOLUTION_API_KEY + EVOLUTION_INSTANCE).
 */

function digitsOnly(value: string): string {
  return value.replace(/\D/g, "");
}

export async function sendWhatsAppOtpText(
  toWhatsapp: string,
  text: string
): Promise<boolean> {
  const to = digitsOnly(toWhatsapp);
  if (!to) return false;

  const webhook = process.env.WHATSAPP_OTP_WEBHOOK_URL?.trim();
  if (webhook) {
    const response = await fetch(webhook, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ to, text, phone: to, message: text }),
      cache: "no-store",
    });
    return response.ok;
  }

  const base = process.env.EVOLUTION_API_URL?.trim()?.replace(/\/$/, "");
  const key = process.env.EVOLUTION_API_KEY?.trim();
  const instance = process.env.EVOLUTION_INSTANCE?.trim();
  if (base && key && instance) {
    const response = await fetch(`${base}/message/sendText/${instance}`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        apikey: key,
      },
      body: JSON.stringify({
        number: to.startsWith("55") ? to : `55${to}`,
        text,
      }),
      cache: "no-store",
    });
    return response.ok;
  }

  return false;
}

export function isWhatsAppOtpSendConfigured(): boolean {
  return Boolean(
    process.env.WHATSAPP_OTP_WEBHOOK_URL?.trim() ||
      (process.env.EVOLUTION_API_URL?.trim() &&
        process.env.EVOLUTION_API_KEY?.trim() &&
        process.env.EVOLUTION_INSTANCE?.trim())
  );
}
