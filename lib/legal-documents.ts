export type LegalDocument = {
  id: "terms" | "privacy"
  title: string
  lastUpdated: string
  intro: string
  sections: Array<{
    title: string
    paragraphs?: string[]
    bullets?: string[]
  }>
}

export const TERMS_VERSION = "2026-05"
export const PRIVACY_VERSION = "2026-05"

export const legalDocuments: Record<LegalDocument["id"], LegalDocument> = {
  terms: {
    id: "terms",
    title: "VerisNova Terms of Service",
    lastUpdated: "May 2026",
    intro:
      "VerisNova is a product operated by Verixans Technologies Pvt Ltd (\"Verixans\", \"VerisNova\", \"we\", \"our\", or \"us\"). By accessing or using VerisNova services, recruiter workspace, screening systems, interview intelligence infrastructure, evidence review tools, or related services, you agree to these Terms of Service.",
    sections: [
      {
        title: "1. Service Overview",
        paragraphs: ["VerisNova provides:"],
        bullets: [
          "AI-assisted interview infrastructure",
          "Candidate screening systems",
          "Behavioral and competency evidence tools",
          "Hiring workflow intelligence",
          "Recruiter collaboration systems",
          "Audit-oriented hiring evidence systems",
        ],
      },
      {
        title: "2. Organization Responsibility",
        paragraphs: [
          "The platform is intended for lawful recruitment, evaluation, and hiring workflows.",
          "Organizations using VerisNova are responsible for:",
        ],
        bullets: [
          "ensuring lawful hiring practices",
          "obtaining candidate consent where required",
          "reviewing AI-generated insights responsibly",
          "maintaining confidentiality of candidate data",
          "complying with local employment and privacy regulations",
        ],
      },
      {
        title: "3. AI & Behavioral Analysis Disclaimer",
        paragraphs: [
          "VerisNova may generate interview summaries, behavioral insights, structured hiring recommendations, review indicators, and competency observations.",
          "These outputs are intended to support recruiter review and should not be treated as sole legal or employment determinations. Final hiring decisions remain the responsibility of the organization.",
        ],
      },
      {
        title: "4. Account Security",
        paragraphs: ["Users are responsible for:"],
        bullets: [
          "protecting login credentials",
          "maintaining authorized workspace access",
          "preventing unauthorized usage",
          "reporting suspicious activity",
        ],
      },
      {
        title: "5. Billing & Subscription",
        paragraphs: [
          "Paid plans may include interview session credits, screening credits, and organization usage allocations.",
          "Payments are processed through authorized third-party payment providers. Invoices, billing records, GST calculations, and payment history may be maintained for audit and compliance purposes.",
        ],
      },
      {
        title: "6. Acceptable Use",
        paragraphs: ["Users must not:"],
        bullets: [
          "misuse interview systems",
          "upload unlawful content",
          "attempt platform exploitation",
          "reverse engineer security systems",
          "conduct fraudulent hiring activity",
          "interfere with platform stability",
        ],
      },
      {
        title: "7. Data Retention",
        paragraphs: [
          "VerisNova may retain interview records, transcripts, behavioral evidence, billing records, audit logs, and recruiter activity history.",
          "Retention periods may vary based on organization settings, operational requirements, compliance needs, and platform policies.",
        ],
      },
      {
        title: "8. Intellectual Property",
        paragraphs: [
          "All platform infrastructure, software, branding, workflows, AI systems, dashboards, and visual assets remain the property of Verixans Technologies Pvt Ltd unless otherwise stated.",
        ],
      },
      {
        title: "9. Service Availability",
        paragraphs: [
          "We strive to maintain reliable platform availability but do not guarantee uninterrupted service at all times.",
          "Scheduled maintenance, infrastructure upgrades, third-party outages, or unforeseen technical events may affect availability.",
        ],
      },
      {
        title: "10. Limitation of Liability",
        paragraphs: [
          "To the maximum extent permitted by law, Verixans Technologies Pvt Ltd shall not be liable for hiring outcomes, recruiter decisions, employment disputes, indirect damages, operational losses, or business interruption.",
          "Organizations remain responsible for their hiring processes and final employment decisions.",
        ],
      },
      {
        title: "11. Changes to Terms",
        paragraphs: ["We may update these Terms periodically. Continued use of VerisNova after updates constitutes acceptance of the revised Terms."],
      },
      {
        title: "12. Contact",
        paragraphs: ["Verixans Technologies Pvt Ltd", "VerisNova Platform Operations", "Support: support@verisnova.com"],
      },
    ],
  },
  privacy: {
    id: "privacy",
    title: "VerisNova Privacy Policy",
    lastUpdated: "May 2026",
    intro:
      "VerisNova is operated by Verixans Technologies Pvt Ltd (\"we\", \"our\", or \"us\"). This Privacy Policy explains how VerisNova collects, uses, stores, and protects information related to recruiter workflows, candidate evaluations, and platform operations.",
    sections: [
      {
        title: "1. Information We Collect",
        paragraphs: ["VerisNova may collect:"],
        bullets: [
          "recruiter account information",
          "organization details",
          "candidate interview responses",
          "screening data",
          "interview recordings",
          "transcripts",
          "behavioral analysis signals",
          "billing and payment metadata",
          "usage analytics",
          "support communications",
        ],
      },
      {
        title: "2. How We Use Information",
        paragraphs: ["Information may be used to:"],
        bullets: [
          "operate hiring workflows",
          "generate interview insights",
          "improve platform performance",
          "provide recruiter dashboards",
          "generate reports and evidence trails",
          "process billing and invoices",
          "maintain platform security",
          "prevent fraud and abuse",
        ],
      },
      {
        title: "3. Candidate Data & Interview Evidence",
        paragraphs: [
          "Organizations using VerisNova are responsible for obtaining appropriate candidate consent, complying with applicable employment laws, and ensuring lawful interview practices.",
          "VerisNova processes candidate information as part of recruiter-authorized workflows.",
        ],
      },
      {
        title: "4. Payment & Billing Data",
        paragraphs: [
          "Payments are processed through authorized third-party payment providers.",
          "VerisNova may store payment references, invoice records, subscription activity, and GST-related billing metadata. Sensitive payment credentials are not stored directly by VerisNova servers.",
        ],
      },
      {
        title: "5. Data Security",
        paragraphs: ["We implement reasonable technical and operational measures to protect platform data, including:"],
        bullets: ["authentication systems", "access controls", "organization isolation", "audit logging", "infrastructure monitoring"],
      },
      {
        title: "6. Data Sharing",
        paragraphs: ["VerisNova does not sell personal data. Information may be shared with:"],
        bullets: ["authorized organization users", "infrastructure/service providers", "payment processors", "legal or regulatory authorities where required"],
      },
      {
        title: "7. Data Retention",
        paragraphs: [
          "Data retention periods may vary depending on organization settings, operational requirements, billing compliance, audit requirements, and legal obligations.",
          "Organizations may request deletion or retention adjustments where applicable.",
        ],
      },
      {
        title: "8. Cookies & Analytics",
        paragraphs: [
          "VerisNova may use authentication cookies, session management tools, operational analytics, and security monitoring systems. These help maintain platform stability and user experience.",
        ],
      },
      {
        title: "9. User Rights",
        paragraphs: ["Depending on applicable laws, users may request account updates, billing corrections, access requests, deletion requests, and data export requests."],
      },
      {
        title: "10. Children's Privacy",
        paragraphs: ["VerisNova is intended for professional hiring and recruitment usage and is not directed toward children."],
      },
      {
        title: "11. Policy Updates",
        paragraphs: ["We may update this Privacy Policy periodically. Continued use of VerisNova after updates constitutes acceptance of the revised policy."],
      },
      {
        title: "12. Contact",
        paragraphs: ["Verixans Technologies Pvt Ltd", "VerisNova Platform Operations", "Support: support@verisnova.com"],
      },
    ],
  },
}
