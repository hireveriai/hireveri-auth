/**
 * Shared VerisNova transactional email chrome.
 *
 * Deliberately a copy of the visual language already shipping from
 * recruiter-dashboard/lib/services/email.service.ts (trialShellHtml /
 * actionButtonHtml): same slate ground, 640px card, 24px radius, uppercase
 * tracked eyebrow, #2563eb accent. It is duplicated rather than imported
 * because auth and recruiter-dashboard are separate deployments with separate
 * dependency trees — there is no shared package to put it in, and adding one
 * for two helpers would be a bigger change than this feature warrants.
 *
 * Header is typographic, not an <img>, matching the existing templates. Most
 * clients block remote images by default, so a wordmark that always renders
 * beats a logo that usually does not.
 */

export function escapeHtml(value: unknown) {
  return String(value ?? "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#39;");
}

export function emailShellHtml(params: { eyebrow: string; heading: string; content: string }) {
  return `
    <div style="margin:0;padding:0;background:#f1f5f9;font-family:Arial,Helvetica,sans-serif;color:#0f172a;">
      <div style="max-width:640px;margin:0 auto;padding:32px 18px;">
        <div style="border:1px solid #dbe3ee;border-radius:24px;overflow:hidden;background:#ffffff;box-shadow:0 18px 48px rgba(15,23,42,0.10);">
          <div style="padding:26px 28px;border-bottom:1px solid #e2e8f0;background:#f8fafc;">
            <div style="font-size:11px;letter-spacing:0.28em;text-transform:uppercase;color:#2563eb;">${escapeHtml(params.eyebrow)}</div>
            <h1 style="margin:12px 0 0;font-size:24px;line-height:1.25;color:#0f172a;">${escapeHtml(params.heading)}</h1>
          </div>
          <div style="padding:28px;">
            ${params.content}
          </div>
        </div>
        <div style="padding:18px 6px 0;color:#94a3b8;font-size:12px;line-height:1.6;text-align:center;">
          Verixans Technologies Pvt. Ltd. &middot;
          <a href="https://www.verisnova.com" style="color:#94a3b8;">www.verisnova.com</a>
        </div>
      </div>
    </div>
  `;
}

export function actionButtonHtml(link: string, label: string) {
  /* Table-wrapped rather than a bare inline-block <a>: Outlook on Windows
     collapses inline-block padding, which turns the CTA into plain text. */
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:22px 0 6px;">
      <tr>
        <td align="center" bgcolor="#2563eb" style="border-radius:12px;">
          <a href="${escapeHtml(link)}"
             style="display:inline-block;padding:14px 26px;border-radius:12px;background:#2563eb;color:#ffffff;text-decoration:none;font-weight:700;font-size:15px;font-family:Arial,Helvetica,sans-serif;">
            ${escapeHtml(label)}
          </a>
        </td>
      </tr>
    </table>
  `;
}

export function paragraphHtml(text: string) {
  return `<p style="margin:0 0 14px;color:#334155;font-size:15px;line-height:1.7;">${text}</p>`;
}

export function bulletListHtml(items: string[]) {
  const rows = items
    .map(
      (item) =>
        `<li style="margin:0 0 8px;color:#334155;font-size:15px;line-height:1.7;">${escapeHtml(item)}</li>`
    )
    .join("");

  return `<ul style="margin:0 0 18px;padding-left:20px;">${rows}</ul>`;
}

export function signatureHtml() {
  /* Signed by role, not as a hand-typed note from Jatin: this is an automated
     send and the existing system has no "sent personally" concept. */
  return `
    <div style="margin-top:26px;padding-top:18px;border-top:1px solid #e2e8f0;">
      <p style="margin:0 0 2px;color:#334155;font-size:15px;line-height:1.7;">Best regards,</p>
      <p style="margin:0;color:#0f172a;font-size:15px;font-weight:700;line-height:1.5;">Jatin Singh</p>
      <p style="margin:0;color:#64748b;font-size:13px;line-height:1.6;">Founder &amp; CEO, VerisNova</p>
      <p style="margin:0;color:#64748b;font-size:13px;line-height:1.6;">Verixans Technologies Pvt. Ltd.</p>
      <p style="margin:6px 0 0;font-size:13px;line-height:1.6;">
        <a href="https://www.verisnova.com" style="color:#2563eb;">www.verisnova.com</a>
      </p>
    </div>
  `;
}

export function signatureText() {
  return [
    "Best regards,",
    "Jatin Singh",
    "Founder & CEO, VerisNova",
    "Verixans Technologies Pvt. Ltd.",
    "https://www.verisnova.com",
  ].join("\n");
}
