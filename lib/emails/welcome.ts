import { getPool } from "@/lib/db-admin";
import { sendEmail } from "@/lib/email";
import { getPracticeCandidateDashboardUrl } from "@/lib/practice-candidate-url";
import {
  actionButtonHtml,
  bulletListHtml,
  emailShellHtml,
  escapeHtml,
  paragraphHtml,
  signatureHtml,
  signatureText,
} from "@/lib/emails/shell";

/**
 * Onboarding email orchestration.
 *
 * Kept separate from the signup routes so further onboarding mail (activation
 * nudges, tips) can be added by extending EMAIL_TYPE and adding a builder,
 * without touching the signup path again.
 *
 * Deliberately says nothing about entitlements - no session counts, screening
 * credits, trial framing or pricing. Entitlement is dynamic and is surfaced in
 * the dashboards; a welcome email that names it goes stale the moment limits
 * change or the user buys directly.
 */

export type WelcomeAudience = "recruiter" | "practice_candidate";

const EMAIL_TYPE: Record<WelcomeAudience, string> = {
  recruiter: "welcome_recruiter",
  practice_candidate: "welcome_practice_candidate",
};

type WelcomeEmailContent = {
  subject: string;
  html: string;
  text: string;
};

function greetingName(firstName?: string | null) {
  const trimmed = firstName?.trim();

  return trimmed || "there";
}

function buildRecruiterWelcomeEmail(params: {
  firstName?: string | null;
  dashboardUrl: string;
}): WelcomeEmailContent {
  const name = greetingName(params.firstName);
  const capabilities = [
    "Create and manage job positions",
    "Screen candidates with VERIS AI",
    "Conduct AI-powered interviews",
    "Review candidate responses, scores, and insights",
    "Watch and review interview recordings",
    "Make faster, more structured hiring decisions",
  ];

  const html = emailShellHtml({
    eyebrow: "VerisNova Recruiter",
    heading: "Welcome to VerisNova",
    content: [
      paragraphHtml(`Hi ${escapeHtml(name)},`),
      paragraphHtml("Welcome to VerisNova! &#127881;"),
      paragraphHtml(
        "Your account is ready, and you&rsquo;re now one step closer to a smarter way to screen and interview candidates with AI."
      ),
      paragraphHtml("With VerisNova, you can:"),
      bulletListHtml(capabilities),
      paragraphHtml('<strong style="color:#0f172a;">Ready to get started?</strong>'),
      paragraphHtml("Head over to your VerisNova dashboard and create your first job."),
      actionButtonHtml(params.dashboardUrl, "Go to Your VerisNova Dashboard"),
      paragraphHtml(
        "If you have any questions or need help getting started, our team is here to help."
      ),
      paragraphHtml("Welcome aboard!"),
      signatureHtml(),
    ].join(""),
  });

  const text = [
    `Hi ${name},`,
    "",
    "Welcome to VerisNova!",
    "",
    "Your account is ready, and you're now one step closer to a smarter way to screen and interview candidates with AI.",
    "",
    "With VerisNova, you can:",
    ...capabilities.map((item) => `- ${item}`),
    "",
    "Ready to get started?",
    "Head over to your VerisNova dashboard and create your first job.",
    "",
    `Go to Your VerisNova Dashboard: ${params.dashboardUrl}`,
    "",
    "If you have any questions or need help getting started, our team is here to help.",
    "",
    "Welcome aboard!",
    "",
    signatureText(),
  ].join("\n");

  return {
    subject: "Welcome to VerisNova — Let's Get Started",
    html,
    text,
  };
}

function buildPracticeWelcomeEmail(params: {
  firstName?: string | null;
  practiceUrl: string;
}): WelcomeEmailContent {
  const name = greetingName(params.firstName);
  const capabilities = [
    "Practice interviews for different roles",
    "Experience realistic AI-powered interview questions",
    "Answer questions through an interactive interview experience",
    "Receive AI-powered feedback and insights",
    "Identify areas where you can improve",
    "Practice at your own pace",
  ];

  const html = emailShellHtml({
    eyebrow: "VerisNova Practice",
    heading: "Welcome to VerisNova Practice",
    content: [
      paragraphHtml(`Hi ${escapeHtml(name)},`),
      paragraphHtml("Welcome to VerisNova Practice! &#127881;"),
      paragraphHtml(
        "Your account is ready, and you can now practice your interview skills with an AI-powered interview experience designed to help you prepare with confidence."
      ),
      paragraphHtml("With VerisNova Practice, you can:"),
      bulletListHtml(capabilities),
      paragraphHtml(
        '<strong style="color:#0f172a;">Ready for your first practice interview?</strong>'
      ),
      paragraphHtml(
        "Choose the role you&rsquo;re preparing for and step into the VerisNova Calm Room to begin your AI interview practice."
      ),
      actionButtonHtml(params.practiceUrl, "Start Your Practice Interview"),
      paragraphHtml(
        "Good luck with your preparation &mdash; and welcome to VerisNova!"
      ),
      signatureHtml(),
    ].join(""),
  });

  const text = [
    `Hi ${name},`,
    "",
    "Welcome to VerisNova Practice!",
    "",
    "Your account is ready, and you can now practice your interview skills with an AI-powered interview experience designed to help you prepare with confidence.",
    "",
    "With VerisNova Practice, you can:",
    ...capabilities.map((item) => `- ${item}`),
    "",
    "Ready for your first practice interview?",
    "Choose the role you're preparing for and step into the VerisNova Calm Room to begin your AI interview practice.",
    "",
    `Start Your Practice Interview: ${params.practiceUrl}`,
    "",
    "Good luck with your preparation - and welcome to VerisNova!",
    "",
    signatureText(),
  ].join("\n");

  return {
    subject: "Welcome to VerisNova — Start Practicing with AI",
    html,
    text,
  };
}

/**
 * Resolve the recipient from the authenticated identity, never from the
 * request body. A client can reach these signup endpoints with an arbitrary
 * payload; the address and the audience must both come from server state.
 */
async function resolveIdentityEmail(identityId: string) {
  const { rows } = await getPool().query(
    `
    select lower(coalesce(primary_email, email)) as email
    from public.identity_users
    where identity_id = $1::uuid
    `,
    [identityId]
  );

  return (rows[0]?.email as string | undefined) || null;
}

/**
 * Claim the single allowed send for this identity + email type.
 *
 * Returns null when another request already claimed it, which is what makes
 * refresh, retry, double-submit and session restoration safe. The INSERT is
 * the lock - checking first and inserting after would leave a race open.
 */
async function claimDelivery(params: {
  identityId: string;
  emailType: string;
  audience: WelcomeAudience;
  recipientEmail: string;
}) {
  const { rows } = await getPool().query(
    `
    insert into public.onboarding_email_deliveries (
      identity_id, email_type, audience, recipient_email, status, attempts
    )
    values ($1::uuid, $2::text, $3::text, $4::text, 'PENDING', 1)
    on conflict on constraint ux_onboarding_email_once do nothing
    returning delivery_id
    `,
    [params.identityId, params.emailType, params.audience, params.recipientEmail]
  );

  return (rows[0]?.delivery_id as string | undefined) || null;
}

async function markDelivery(
  deliveryId: string,
  status: "SENT" | "FAILED",
  error?: unknown
) {
  await getPool().query(
    `
    update public.onboarding_email_deliveries
    set
      status = $2::text,
      sent_at = case when $2::text = 'SENT' then now() else sent_at end,
      last_error = $3::text
    where delivery_id = $1::uuid
    `,
    [
      deliveryId,
      status,
      error
        ? String(error instanceof Error ? error.message : error).slice(0, 2000)
        : null,
    ]
  );
}

/**
 * Send the welcome email for a newly created account.
 *
 * Never throws. Account creation has already succeeded by the time this runs,
 * and a mail provider outage must not fail the signup - the caller's response
 * is unaffected either way. Failures are logged through the same console
 * channel the existing signup-alert email uses, and recorded as FAILED on the
 * delivery row, which leaves a queryable list of accounts needing a resend.
 */
export async function sendWelcomeEmail(params: {
  identityId: string;
  audience: WelcomeAudience;
  firstName?: string | null;
  /** Recruiter only: the recruiter app URL already resolved by the caller. */
  recruiterDashboardUrl?: string | null;
}) {
  const emailType = EMAIL_TYPE[params.audience];
  let deliveryId: string | null = null;

  try {
    const recipientEmail = await resolveIdentityEmail(params.identityId);

    if (!recipientEmail) {
      console.warn(
        `WELCOME EMAIL SKIPPED (${emailType}): no email on identity`,
        params.identityId
      );
      return;
    }

    deliveryId = await claimDelivery({
      identityId: params.identityId,
      emailType,
      audience: params.audience,
      recipientEmail,
    });

    if (!deliveryId) {
      // Already sent (or in flight) for this identity. Expected on refresh.
      return;
    }

    const content =
      params.audience === "recruiter"
        ? buildRecruiterWelcomeEmail({
            firstName: params.firstName,
            dashboardUrl: params.recruiterDashboardUrl || getRecruiterFallbackUrl(),
          })
        : buildPracticeWelcomeEmail({
            firstName: params.firstName,
            practiceUrl: getPracticeCandidateDashboardUrl(),
          });

    await sendEmail({
      to: recipientEmail,
      subject: content.subject,
      text: content.text,
      html: content.html,
      /* Second layer of protection, at the provider. Resend dedupes on this
         key, so even a lost delivery row cannot produce a duplicate send. */
      idempotencyKey: `${emailType}-${params.identityId}`,
    });

    await markDelivery(deliveryId, "SENT");
  } catch (error) {
    console.warn(`WELCOME EMAIL FAILED (${emailType}):`, error);

    if (deliveryId) {
      try {
        await markDelivery(deliveryId, "FAILED", error);
      } catch (markError) {
        console.warn("WELCOME EMAIL STATUS UPDATE FAILED:", markError);
      }
    }
  }
}

/** Only reached if a caller omits the resolved recruiter URL. */
function getRecruiterFallbackUrl() {
  return process.env.RECRUITER_APP_URL?.trim() || "https://recruiter.verisnova.com";
}

export const __welcomeEmailTemplates = {
  buildRecruiterWelcomeEmail,
  buildPracticeWelcomeEmail,
};
