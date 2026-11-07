/**
 * Branded email layout and templates.
 *
 * Every email uses the same look as the website: navy header with the school
 * logo and name, gold accent, white card, and the school's contact details in
 * the footer. Styles are inline because many email apps (Gmail, Outlook)
 * ignore <style> blocks.
 */
import { getSettings } from "./settings";
import { siteUrl } from "./siteUrl";

const NAVY = "#0A2F66";
const BLUE = "#0C4A9F";
const GOLD = "#C4A356";
const TEXT = "#1e293b";
const MUTED = "#64748b";
const BORDER = "#e2e8f0";
const FONT = "'Work Sans', 'Segoe UI', Arial, Helvetica, sans-serif";

// Used when System Settings has not been filled in yet
const DEFAULT_SCHOOL = {
  name: "Regina Nostra Schools",
  motto: "Inspirando Excellentiam",
  address: "12 Clements Nnakwe Close, Ugbene, Abakpa, Enugu, Nigeria",
  phone: "07039265542, 09157736602",
  email: "reginanostraschools@gmail.com",
};

/** Escape text that came from users (names, messages, comments). */
export const esc = (value: unknown) =>
  String(value ?? "")
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&#39;");

const naira = (n: number) => `₦${Number(n || 0).toLocaleString("en-NG")}`;
const humanize = (s: string) =>
  String(s || "")
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");
const termName = (t: string) => `${humanize(t)} Term`;
const fullName = (s: any) =>
  [s?.personalInfo?.firstName, s?.personalInfo?.lastName].filter(Boolean).join(" ");
const loginUrl = () => `${siteUrl()}/login`;

// ---------- Building blocks (all return HTML strings) ----------

export const heading = (text: string) =>
  `<h1 style="margin:0 0 16px;font-family:${FONT};font-size:22px;line-height:1.3;font-weight:700;color:${NAVY};">${text}</h1>`;

export const para = (html: string) =>
  `<p style="margin:0 0 16px;font-family:${FONT};font-size:15px;line-height:1.65;color:${TEXT};">${html}</p>`;

export const small = (html: string) =>
  `<p style="margin:0 0 12px;font-family:${FONT};font-size:13px;line-height:1.6;color:${MUTED};">${html}</p>`;

export const button = (label: string, url: string) => `
  <table role="presentation" cellpadding="0" cellspacing="0" border="0" style="margin:8px 0 24px;">
    <tr><td bgcolor="${BLUE}" style="border-radius:8px;">
      <a href="${esc(url)}" target="_blank" style="display:inline-block;padding:13px 28px;font-family:${FONT};font-size:15px;font-weight:600;color:#ffffff;text-decoration:none;border-radius:8px;">${label}</a>
    </td></tr>
  </table>`;

/** Label / value rows in a light box, e.g. payment or login details. */
export const details = (rows: Array<[string, string | undefined | null]>, title?: string) => {
  const shown = rows.filter(([, v]) => v !== undefined && v !== null && v !== "");
  if (shown.length === 0) return "";
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;background:#f8fafc;border:1px solid ${BORDER};border-radius:10px;">
    ${title ? `<tr><td colspan="2" style="padding:14px 18px 4px;font-family:${FONT};font-size:12px;font-weight:700;letter-spacing:.06em;text-transform:uppercase;color:${MUTED};">${title}</td></tr>` : ""}
    ${shown
      .map(
        ([label, value], i) => `
    <tr>
      <td class="cell" style="padding:${i === 0 && !title ? 14 : 8}px 18px 8px;font-family:${FONT};font-size:14px;color:${MUTED};vertical-align:top;width:38%;">${label}</td>
      <td class="cell" style="padding:${i === 0 && !title ? 14 : 8}px 18px 8px;font-family:${FONT};font-size:14px;font-weight:600;color:${TEXT};vertical-align:top;word-break:break-word;overflow-wrap:anywhere;">${value}</td>
    </tr>`
      )
      .join("")}
    <tr><td colspan="2" style="height:6px;line-height:6px;font-size:0;">&nbsp;</td></tr>
  </table>`;
};

/** Coloured message box. */
export const notice = (html: string, tone: "info" | "success" | "warning" | "danger" = "info") => {
  const tones = {
    info: { bg: "#eff6ff", border: BLUE, text: "#1e3a8a" },
    success: { bg: "#f0fdf4", border: "#16a34a", text: "#14532d" },
    warning: { bg: "#fffbeb", border: "#d97706", text: "#78350f" },
    danger: { bg: "#fef2f2", border: "#dc2626", text: "#7f1d1d" },
  }[tone];
  return `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;">
    <tr><td style="padding:14px 18px;background:${tones.bg};border-left:4px solid ${tones.border};border-radius:6px;font-family:${FONT};font-size:14px;line-height:1.6;color:${tones.text};">${html}</td></tr>
  </table>`;
};

/** A simple data table (e.g. subject scores). */
export const dataTable = (headers: string[], rows: string[][], alignRightFrom = 1) => `
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="margin:0 0 20px;border:1px solid ${BORDER};border-radius:10px;border-collapse:separate;overflow:hidden;">
    <tr>${headers
      .map(
        (h, i) =>
          `<th style="padding:10px 6px;background:${NAVY};font-family:${FONT};font-size:12px;font-weight:600;color:#ffffff;text-align:${i >= alignRightFrom ? "center" : "left"};">${h}</th>`
      )
      .join("")}</tr>
    ${rows
      .map(
        (r, ri) =>
          `<tr>${r
            .map(
              (c, i) =>
                `<td style="padding:9px 6px;border-top:1px solid ${BORDER};background:${ri % 2 ? "#f8fafc" : "#ffffff"};font-family:${FONT};font-size:13px;color:${TEXT};text-align:${i >= alignRightFrom ? "center" : "left"};">${c}</td>`
            )
            .join("")}</tr>`
      )
      .join("")}
  </table>`;

const signOff = () =>
  para(`Kind regards,<br><strong>The School Office</strong>`);

// ---------- Layout ----------

const schoolInfo = async () => {
  let s: any = null;
  try {
    s = (await getSettings()).school;
  } catch {
    // Database not reachable: fall back to defaults
  }
  const site = siteUrl();
  const logo = s?.logo && /^https:\/\//.test(s.logo) ? s.logo : site ? `${site}/images/email-logo.png` : "";
  return {
    name: s?.name || DEFAULT_SCHOOL.name,
    motto: s?.motto || DEFAULT_SCHOOL.motto,
    address: s?.address || DEFAULT_SCHOOL.address,
    phone: s?.phone || DEFAULT_SCHOOL.phone,
    email: s?.email || DEFAULT_SCHOOL.email,
    website: s?.website || site,
    logo,
  };
};

/** Wrap email content in the branded layout. */
export const layout = async (opts: { title: string; preheader?: string; body: string }) => {
  const school = await schoolInfo();
  const year = new Date().getFullYear();
  const websiteLabel = school.website.replace(/^https?:\/\//, "");
  return `<!DOCTYPE html>
<html lang="en">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0">
<meta name="color-scheme" content="light">
<style>
  @media only screen and (max-width: 480px) {
    .pad { padding-left: 18px !important; padding-right: 18px !important; }
    .cell { padding-left: 12px !important; padding-right: 12px !important; }
  }
</style>
<title>${esc(opts.title)}</title>
</head>
<body style="margin:0;padding:0;background:#f1f5f9;">
  <div style="display:none;max-height:0;overflow:hidden;opacity:0;color:transparent;">${esc(opts.preheader || opts.title)}</div>
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="background:#f1f5f9;">
    <tr><td align="center" style="padding:28px 8px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="max-width:600px;">

        <!-- Header -->
        <tr><td align="center" bgcolor="${NAVY}" style="background:${NAVY};border-radius:14px 14px 0 0;padding:28px 24px 22px;">
          ${school.logo ? `<img src="${esc(school.logo)}" width="72" height="72" alt="${esc(school.name)}" style="display:block;margin:0 auto 12px;width:72px;height:72px;border-radius:50%;background:#ffffff;border:0;">` : ""}
          <div style="font-family:${FONT};font-size:20px;font-weight:700;letter-spacing:.02em;color:#ffffff;">${esc(school.name)}</div>
          ${school.motto ? `<div style="margin-top:4px;font-family:${FONT};font-size:13px;font-style:italic;color:${GOLD};">${esc(school.motto)}</div>` : ""}
        </td></tr>
        <tr><td style="height:4px;line-height:4px;font-size:0;background:${GOLD};">&nbsp;</td></tr>

        <!-- Body -->
        <tr><td class="pad" bgcolor="#ffffff" style="background:#ffffff;padding:32px 32px 16px;border-left:1px solid ${BORDER};border-right:1px solid ${BORDER};">
          ${opts.body}
        </td></tr>

        <!-- Footer -->
        <tr><td class="pad" bgcolor="#ffffff" style="background:#ffffff;padding:0 32px 28px;border:1px solid ${BORDER};border-top:0;border-radius:0 0 14px 14px;">
          <table role="presentation" width="100%" cellpadding="0" cellspacing="0" border="0" style="border-top:1px solid ${BORDER};">
            <tr><td style="padding-top:18px;font-family:${FONT};font-size:12px;line-height:1.7;color:${MUTED};text-align:center;">
              <strong style="color:${NAVY};">${esc(school.name)}</strong><br>
              ${esc(school.address)}<br>
              ${esc(school.phone)}${school.email ? ` &nbsp;·&nbsp; <a href="mailto:${esc(school.email)}" style="color:${BLUE};text-decoration:none;">${esc(school.email)}</a>` : ""}
              ${school.website ? `<br><a href="${esc(school.website)}" style="color:${BLUE};text-decoration:none;">${esc(websiteLabel)}</a>` : ""}
            </td></tr>
          </table>
        </td></tr>
        <tr><td style="padding:16px 12px 0;font-family:${FONT};font-size:11px;line-height:1.6;color:#94a3b8;text-align:center;">
          © ${year} ${esc(school.name)}. This is an automated message from the school portal.
        </td></tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
};

/** Plain-text version of an email (helps delivery and is shown by text-only apps). */
export const toPlainText = (html: string) =>
  html
    .replace(/<head[\s\S]*?<\/head>/gi, "")
    .replace(/<div style="display:none[\s\S]*?<\/div>/i, "")
    // Source line breaks are layout only; real breaks come from tags below
    .replace(/\s+/g, " ")
    .replace(/<a [^>]*href="([^"]+)"[^>]*>([\s\S]*?)<\/a>/gi, (_m, href, text) => {
      const label = text.replace(/<[^>]+>/g, "").trim();
      return href.startsWith("mailto:") || label === href ? label : `${label} (${href})`;
    })
    .replace(/<(br|\/p|\/tr|\/h1|\/div)\s*\/?>/gi, "\n")
    // "Label: value" for two-column detail rows
    .replace(/<\/td>\s*<td[^>]*>/gi, ": ")
    .replace(/<\/t[dh]>/gi, "  ")
    .replace(/<[^>]+>/g, "")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&lt;/g, "<")
    .replace(/&gt;/g, ">")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/[ \t]+/g, " ")
    .replace(/\n\s*\n\s*\n+/g, "\n\n")
    .split("\n")
    .map((l) => l.trim())
    .join("\n")
    .trim();

export interface BuiltEmail {
  subject: string;
  html: string;
}

// ---------- Templates ----------

export const studentWelcomeEmail = async (student: any, email: string, password: string): Promise<BuiltEmail> => ({
  subject: "Welcome to the Regina Nostra Schools student portal",
  html: await layout({
    title: "Welcome to the student portal",
    preheader: "Your student portal login details are inside.",
    body:
      heading("Welcome to the student portal") +
      para(`Dear ${esc(fullName(student))},`) +
      para("Your student portal account is ready. You can use it to see your results, print your report sheets and upload fee receipts.") +
      details(
        [
          ["Student ID", esc(student.studentId)],
          ["Email", esc(email)],
          ["Temporary password", `<span style="font-family:Consolas,Menlo,monospace;font-size:16px;letter-spacing:.06em;">${esc(password)}</span>`],
        ],
        "Your login details"
      ) +
      button("Sign in to the portal", loginUrl()) +
      notice("For your security, please change this password after you sign in (Settings → Change password).", "warning") +
      signOff(),
  }),
});

export const parentCredentialsEmail = async (
  parentName: string,
  email: string,
  password: string,
  student: any
): Promise<BuiltEmail> => ({
  subject: "Your Regina Nostra Schools parent portal login",
  html: await layout({
    title: "Your parent portal login",
    preheader: `Follow ${fullName(student)}'s results and payments online.`,
    body:
      heading("Welcome to the parent portal") +
      para(`Dear ${esc(parentName || "Parent/Guardian")},`) +
      para(
        `A parent portal account has been set up for you. You can follow <strong>${esc(fullName(student))}</strong>'s results, print report sheets and upload school fee receipts.`
      ) +
      details(
        [
          ["Child", `${esc(fullName(student))} (${esc(student.studentId)})`],
          ["Email", esc(email)],
          ["Temporary password", `<span style="font-family:Consolas,Menlo,monospace;font-size:16px;letter-spacing:.06em;">${esc(password)}</span>`],
        ],
        "Your login details"
      ) +
      button("Sign in to the parent portal", loginUrl()) +
      notice("Please change this password after you sign in (Settings → Change password).", "warning") +
      signOff(),
  }),
});

export const parentChildLinkedEmail = async (parentName: string, student: any): Promise<BuiltEmail> => ({
  subject: `${fullName(student)} has been added to your parent portal`,
  html: await layout({
    title: "Child added to your parent portal",
    preheader: `${fullName(student)} now appears in your parent portal.`,
    body:
      heading("A child has been added to your account") +
      para(`Dear ${esc(parentName || "Parent/Guardian")},`) +
      para(
        `<strong>${esc(fullName(student))}</strong> (Student ID: ${esc(student.studentId)}) has been added to your parent portal. Sign in with your usual password and choose their name at the top of the page.`
      ) +
      button("Open the parent portal", loginUrl()) +
      signOff(),
  }),
});

export const passwordResetEmail = async (resetUrl: string): Promise<BuiltEmail> => ({
  subject: "Reset your Regina Nostra Schools portal password",
  html: await layout({
    title: "Reset your password",
    preheader: "Use this link within 10 minutes to choose a new password.",
    body:
      heading("Reset your password") +
      para("We received a request to reset the password for your school portal account. Click the button below to choose a new one.") +
      button("Choose a new password", resetUrl) +
      notice("<strong>This link expires in 10 minutes.</strong> If you did not ask for this, you can ignore this email and your password will not change.", "info") +
      small(`If the button does not work, copy this link into your browser:<br><a href="${esc(resetUrl)}" style="color:${BLUE};word-break:break-all;">${esc(resetUrl)}</a>`) +
      signOff(),
  }),
});

const paymentRows = (payment: any): Array<[string, string]> => [
  ["Fee", esc(humanize(payment.paymentType))],
  ["Amount", naira(payment.amount)],
  ["Session / term", `${esc(payment.academicSession)} · ${esc(termName(payment.term))}`],
  ...(payment.transactionReference ? [["Reference", esc(payment.transactionReference)] as [string, string]] : []),
];

export const paymentVerifiedEmail = async (
  payment: any,
  student: any,
  recipient: "student" | "parent",
  notes?: string
): Promise<BuiltEmail> => ({
  subject: `Payment confirmed: ${humanize(payment.paymentType)} for ${fullName(student)}`,
  html: await layout({
    title: "Payment confirmed",
    preheader: `${naira(payment.amount)} ${humanize(payment.paymentType).toLowerCase()} has been confirmed by the school.`,
    body:
      heading("Payment confirmed") +
      para(recipient === "parent" ? "Dear Parent/Guardian," : `Dear ${esc(fullName(student))},`) +
      notice(
        `The school has confirmed the ${esc(humanize(payment.paymentType).toLowerCase())} receipt for <strong>${esc(fullName(student))}</strong>. Thank you.`,
        "success"
      ) +
      details([...paymentRows(payment), ["Confirmed on", new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })], ["Note from the school", notes ? esc(notes) : undefined]], "Payment details") +
      button("View payments", loginUrl()) +
      signOff(),
  }),
});

export const paymentRejectedEmail = async (
  payment: any,
  student: any,
  recipient: "student" | "parent",
  reason: string
): Promise<BuiltEmail> => ({
  subject: `Action needed: payment receipt for ${fullName(student)}`,
  html: await layout({
    title: "Payment receipt not accepted",
    preheader: "The school could not accept a payment receipt. Please upload it again.",
    body:
      heading("We could not accept a receipt") +
      para(recipient === "parent" ? "Dear Parent/Guardian," : `Dear ${esc(fullName(student))},`) +
      para(`The school could not accept the ${esc(humanize(payment.paymentType).toLowerCase())} receipt uploaded for <strong>${esc(fullName(student))}</strong>.`) +
      notice(`<strong>Reason:</strong> ${esc(reason)}`, "danger") +
      details(paymentRows(payment), "Payment details") +
      para("Please sign in and upload a clear receipt again from the Payments page. If you think this is a mistake, contact the school office.") +
      button("Upload the receipt again", loginUrl()) +
      signOff(),
  }),
});

const resultSummaryRows = (result: any): Array<[string, string]> => [
  ["Session / term", `${esc(result.academicSession)} · ${esc(termName(result.term))}`],
  ["Class", esc(result.class || "")],
  ["Average", `${Number(result.summary?.averageScore || 0).toFixed(1)}%`],
  ["Overall grade", esc(result.summary?.overallGrade || "")],
  ...(result.summary?.position
    ? [["Position", `${result.summary.position} of ${result.summary.totalStudents}`] as [string, string]]
    : []),
];

export const resultPublishedEmail = async (result: any, student: any, recipient: "student" | "parent"): Promise<BuiltEmail> => ({
  subject:
    recipient === "parent"
      ? `${student.personalInfo.firstName}'s ${termName(result.term).toLowerCase()} result is ready`
      : `Your ${termName(result.term).toLowerCase()} result is ready`,
  html: await layout({
    title: "Result published",
    preheader: `The ${result.academicSession} ${termName(result.term).toLowerCase()} result is now available.`,
    body:
      heading(recipient === "parent" ? `${esc(student.personalInfo.firstName)}'s result is ready` : "Your result is ready") +
      para(recipient === "parent" ? "Dear Parent/Guardian," : `Dear ${esc(fullName(student))},`) +
      para(
        recipient === "parent"
          ? `The result for <strong>${esc(fullName(student))}</strong> (${esc(student.studentId)}) has been published.`
          : "Your result has been published."
      ) +
      details(resultSummaryRows(result), "Summary") +
      para("Sign in to see every subject and to view or print the report sheet.") +
      button("View the full result", loginUrl()) +
      signOff(),
  }),
});

/** Full result with every subject, sent from the admin "send to parent" button. */
export const resultFullEmail = async (result: any, student: any): Promise<BuiltEmail> => {
  const subjects = (result.subjects || []).map((s: any) => [
    esc(s.subjectName),
    String(s.scores?.firstCA ?? 0),
    String(s.scores?.secondCA ?? 0),
    String(s.scores?.thirdCA ?? 0),
    String(s.scores?.exam ?? 0),
    `<strong>${s.scores?.total ?? 0}</strong>`,
    `<strong>${esc(s.grade)}</strong>`,
  ]);
  const comment = (label: string, text?: string) =>
    text ? details([[label, esc(text)]]) : "";
  return {
    subject: `Academic result: ${fullName(student)}, ${result.academicSession} ${termName(result.term)}`,
    html: await layout({
      title: "Academic result",
      preheader: `${fullName(student)}'s ${result.academicSession} ${termName(result.term).toLowerCase()} result.`,
      body:
        heading("Academic result") +
        para("Dear Parent/Guardian,") +
        para(`We are pleased to share the result for <strong>${esc(fullName(student))}</strong>.`) +
        details(
          [
            ["Student", `${esc(fullName(student))} (${esc(student.studentId || "")})`],
            ["Class", esc(student.academicInfo?.currentClass || result.class || "")],
            ...resultSummaryRows(result).filter(([l]) => l !== "Class"),
            ["Total score", String(result.summary?.totalScore ?? "")],
          ],
          "Summary"
        ) +
        dataTable(["Subject", "1st CA", "2nd CA", "3rd CA", "Exam", "Total", "Grade"], subjects) +
        details(
          [
            ["School opened", result.attendance?.schoolOpened != null ? `${result.attendance.schoolOpened} days` : undefined],
            ["Present", result.attendance?.timesPresent != null ? `${result.attendance.timesPresent} days` : undefined],
            ["Absent", result.attendance?.timesAbsent != null ? `${result.attendance.timesAbsent} days` : undefined],
            ["Next term begins", result.nextTermBegins ? esc(result.nextTermBegins) : undefined],
          ],
          "Attendance"
        ) +
        comment("Class teacher's comment", result.teacherComments) +
        comment("Principal's comment", result.principalComments) +
        button("View and print the report sheet", loginUrl()) +
        para("For any questions about this result, please contact the school office.") +
        signOff(),
    }),
  };
};

export const announcementEmail = async (announcement: any): Promise<BuiltEmail> => {
  const urgent = ["high", "urgent"].includes(String(announcement.priority));
  return {
    subject: `${urgent ? "Important: " : ""}${announcement.title}`,
    html: await layout({
      title: announcement.title,
      preheader: announcement.excerpt || announcement.title,
      body:
        (urgent ? notice(`<strong>${esc(humanize(announcement.priority))} priority</strong>`, "warning") : "") +
        heading(esc(announcement.title)) +
        small(
          `${esc(humanize(announcement.category || "General"))} · ${new Date(announcement.publishDate || Date.now()).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })}`
        ) +
        para(esc(announcement.excerpt || "")) +
        button("Read the full announcement", `${siteUrl()}/announcements/${announcement._id}`) +
        signOff(),
    }),
  };
};

export const eventEmail = async (event: any): Promise<BuiltEmail> => ({
  subject: `New event: ${event.title}`,
  html: await layout({
    title: event.title,
    preheader: `${event.title} on ${new Date(event.date).toLocaleDateString("en-GB", { day: "numeric", month: "long" })}`,
    body:
      heading(esc(event.title)) +
      (event.mandatory ? notice("<strong>Attendance at this event is required.</strong>", "warning") : "") +
      details(
        [
          ["Date", new Date(event.date).toLocaleDateString("en-GB", { weekday: "long", day: "numeric", month: "long", year: "numeric" })],
          ["Time", event.startTime ? `${esc(event.startTime)}${event.endTime ? ` – ${esc(event.endTime)}` : ""}` : undefined],
          ["Location", event.location ? esc(event.location) : undefined],
        ],
        "Event details"
      ) +
      (event.description ? para(esc(event.description)) : "") +
      button("See it in the portal", loginUrl()) +
      signOff(),
  }),
});

export const contactToSchoolEmail = async (data: { name: string; email: string; message: string }): Promise<BuiltEmail> => ({
  subject: `New website enquiry from ${data.name}`,
  html: await layout({
    title: "New website enquiry",
    preheader: data.message.slice(0, 120),
    body:
      heading("New website enquiry") +
      details([
        ["Name", esc(data.name)],
        ["Email", `<a href="mailto:${esc(data.email)}" style="color:${BLUE};">${esc(data.email)}</a>`],
        ["Received", new Date().toLocaleString("en-GB", { dateStyle: "medium", timeStyle: "short" })],
      ]) +
      notice(esc(data.message).replace(/\n/g, "<br>"), "info") +
      small("Reply to this email address directly to answer the enquiry."),
  }),
});

export const contactConfirmationEmail = async (data: { name: string; message: string }): Promise<BuiltEmail> => ({
  subject: "We received your message",
  html: await layout({
    title: "We received your message",
    preheader: "Thank you for contacting us. We will reply within one working day.",
    body:
      heading("Thank you for contacting us") +
      para(`Dear ${esc(data.name)},`) +
      para("Thank you for reaching out. We have received your message and will reply within one working day.") +
      details([["Your message", esc(data.message).replace(/\n/g, "<br>")]]) +
      para("If your enquiry is urgent, please call the school office during office hours (Monday to Friday, 8:00am – 5:00pm).") +
      signOff(),
  }),
});
