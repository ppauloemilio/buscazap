import { Resend } from "resend";

function getAppUrl(): string {
  return process.env.APP_URL ?? "http://localhost:3000";
}

function getFromAddress(): string {
  return process.env.RESEND_FROM_EMAIL ?? "BuscaZapp <onboarding@resend.dev>";
}

export async function sendPasswordResetEmail(input: {
  readonly to: string;
  readonly name: string;
  readonly resetUrl: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    if (process.env.NODE_ENV === "production") {
      throw new Error("Envio de e-mail não configurado (RESEND_API_KEY)");
    }

    console.info("[dev] Link de redefinição de senha:", input.resetUrl);
    return;
  }

  const resend = new Resend(apiKey);

  await resend.emails.send({
    from: getFromAddress(),
    to: input.to,
    subject: "Redefinição de senha — BuscaZapp",
    html: `
      <div style="font-family: sans-serif; max-width: 480px; margin: 0 auto;">
        <h2 style="color: #111;">Olá, ${input.name}</h2>
        <p>Recebemos uma solicitação para redefinir a senha da sua conta no BuscaZapp.</p>
        <p>
          <a href="${input.resetUrl}" style="display: inline-block; background: #25D366; color: #fff; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
            Redefinir senha
          </a>
        </p>
        <p style="color: #666; font-size: 14px;">
          Este link expira em 1 hora. Se você não solicitou a redefinição, ignore este e-mail.
        </p>
        <p style="color: #999; font-size: 12px; word-break: break-all;">
          ${input.resetUrl}
        </p>
      </div>
    `,
  });
}

export function buildPasswordResetUrl(token: string): string {
  const appUrl = getAppUrl().replace(/\/$/, "");
  return `${appUrl}/redefinir-senha?token=${encodeURIComponent(token)}`;
}
