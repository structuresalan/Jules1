import type { VercelRequest, VercelResponse } from '@vercel/node';
import { Resend } from 'resend';

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = process.env.RESEND_FROM_EMAIL || 'SimplifyStruct <onboarding@resend.dev>';

export default async function handler(req: VercelRequest, res: VercelResponse) {
  if (req.method !== 'POST') return res.status(405).json({ error: 'Method not allowed' });

  try {
    const { to, companyName, role, inviterName, inviterEmail, appUrl } = req.body as {
      to: string;
      companyName: string;
      role: string;
      inviterName?: string;
      inviterEmail?: string;
      appUrl: string;
    };

    if (!to || !companyName || !role || !appUrl) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const html = `
      <!DOCTYPE html>
      <html>
      <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif; background: #f4f5f7; padding: 32px; margin: 0;">
        <table cellpadding="0" cellspacing="0" border="0" align="center" style="background: #ffffff; border-radius: 12px; overflow: hidden; max-width: 520px; width: 100%; box-shadow: 0 2px 8px rgba(0,0,0,.06);">
          <tr><td style="background: linear-gradient(90deg, #2563eb, #3b82f6); height: 3px;"></td></tr>
          <tr><td style="padding: 32px 36px 8px;">
            <div style="font-family: 'IBM Plex Mono', monospace; font-size: 10.5px; letter-spacing: .16em; text-transform: uppercase; color: #8a94a8; margin-bottom: 8px;">SimplifyStruct</div>
            <h1 style="margin: 0 0 8px; font-size: 22px; font-weight: 700; color: #0f1117; letter-spacing: -.02em;">You've been invited to ${companyName}</h1>
            <p style="margin: 0; color: #6b7280; font-size: 14px; line-height: 1.5;">
              ${inviterName || inviterEmail || 'A team admin'} invited you to join <b>${companyName}</b> as a <b style="text-transform: capitalize;">${role}</b>.
            </p>
          </td></tr>
          <tr><td style="padding: 20px 36px 28px;">
            <a href="${appUrl}" style="display: inline-block; background: #0f1117; color: #ffffff; text-decoration: none; padding: 12px 22px; border-radius: 8px; font-size: 14px; font-weight: 600;">Accept invitation →</a>
            <p style="margin: 20px 0 0; color: #9aa1ad; font-size: 12px; line-height: 1.5;">
              Sign in with this email address to see the pending invitation in your Teams settings. If you don't have an account yet, create one using this email and the invite will appear automatically.
            </p>
          </td></tr>
          <tr><td style="border-top: 1px solid #eee; padding: 16px 36px; font-family: 'IBM Plex Mono', monospace; font-size: 10px; color: #b0b8c8; letter-spacing: .1em; text-transform: uppercase;">
            © 2026 SimplifyStruct
          </td></tr>
        </table>
      </body>
      </html>
    `;

    const result = await resend.emails.send({
      from: FROM,
      to,
      subject: `Invitation to join ${companyName} on SimplifyStruct`,
      html,
    });

    if (result.error) return res.status(500).json({ error: result.error.message });
    return res.status(200).json({ id: result.data?.id });
  } catch (err) {
    const message = err instanceof Error ? err.message : 'Unknown error';
    return res.status(500).json({ error: message });
  }
}
