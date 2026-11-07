import Parent from "../models/Parent";
import { sendEmail } from "./email";
import { paymentRejectedEmail, paymentVerifiedEmail } from "./emailTemplates";

/**
 * Tell the student and their parent(s) that a payment receipt was confirmed or
 * rejected. Never throws: email problems are logged, not passed on.
 */
export const notifyPaymentDecision = async (
  payment: any,
  student: any,
  decision: { verified: true; notes?: string } | { verified: false; reason: string }
) => {
  const studentEmail = student?.contactInfo?.email?.toLowerCase();
  let parentEmails: string[] = [];
  try {
    const parents = await Parent.find({ children: student._id }).populate("userId", "email");
    parentEmails = parents
      .map((p: any) => p.userId?.email?.toLowerCase())
      .filter((e: string | undefined): e is string => !!e && e !== studentEmail);
  } catch (error) {
    console.error("Could not look up parents for payment email:", error);
  }

  const send = async (to: string, recipient: "student" | "parent") => {
    try {
      const email = decision.verified
        ? await paymentVerifiedEmail(payment, student, recipient, decision.notes)
        : await paymentRejectedEmail(payment, student, recipient, decision.reason);
      await sendEmail({ to, ...email });
    } catch (error) {
      console.error(`Payment email to ${recipient} failed:`, error);
    }
  };

  await Promise.all([
    ...(studentEmail ? [send(studentEmail, "student")] : []),
    ...[...new Set(parentEmails)].map((e) => send(e, "parent")),
  ]);
};
