import Payment, { IPayment } from "../models/Payment";
import { normalizeSession, normalizeTerm } from "./fileParser";
import { uploadFile } from "./cloudinary";

export const PAYMENT_TYPES = [
  "school_fees",
  "exam_fees",
  "uniform",
  "books",
  "excursion",
  "other",
] as const;
export const PAYMENT_METHODS = ["bank_transfer", "online_payment", "cash", "check", "pos"] as const;

const RECEIPT_TYPES = [
  "image/jpeg",
  "image/jpg",
  "image/png",
  "image/webp",
  "image/gif",
  "application/pdf",
];

export interface Submitter {
  userId: any;
  role: "student" | "parent";
  name: string;
}

type Viewer = { userId: any; role: string };

const humanize = (s: string) =>
  s
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

const formatDate = (d: Date) =>
  new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

/** Read session/term/type from a request and clean them up. */
export const readPaymentKey = (src: any) => {
  const academicSession = normalizeSession(String(src?.academicSession || ""));
  const term = normalizeTerm(String(src?.term || ""));
  const paymentType = String(src?.paymentType || "");
  if (!/^\d{4}\/\d{4}$/.test(academicSession))
    return { error: "Choose a valid academic session (e.g. 2026/2027)" };
  if (!term) return { error: "Choose a valid term" };
  if (!(PAYMENT_TYPES as readonly string[]).includes(paymentType))
    return { error: "Choose a valid payment type" };
  return { academicSession, term, paymentType };
};

/** A pending or verified payment already covering this fee, if any. */
export const findActivePayment = (
  studentId: any,
  academicSession: string,
  term: string,
  paymentType: string
) =>
  Payment.findOne({
    studentId,
    academicSession,
    term,
    paymentType,
    status: { $in: ["pending", "verified"] },
  }).sort({ createdAt: -1 });

/** Plain-English notice about an existing upload, worded for the person looking at it. */
export const describeExistingPayment = (payment: IPayment, viewer: Viewer) => {
  const what = `${humanize(payment.paymentType)} for ${humanize(payment.term)} Term ${payment.academicSession}`;
  const by = payment.submittedBy;
  let who = "";
  if (by?.userId && String(by.userId) === String(viewer.userId)) {
    who = " by you";
  } else if (by?.role === "parent") {
    who =
      viewer.role === "student"
        ? ` by your parent${by.name ? `, ${by.name},` : ""}`
        : ` by ${by.name || "a parent"}`;
  } else if (by?.role === "student") {
    who =
      viewer.role === "parent"
        ? ` by ${by.name || "your child"} (the student)`
        : ` by ${by.name || "the student"}`;
  }
  const state =
    payment.status === "verified"
      ? "The school has already verified it, so there is no need to upload it again."
      : "It is waiting for the school to verify it, so there is no need to upload it again.";
  return `${what} has already been uploaded${who} on ${formatDate(payment.createdAt)}. ${state}`;
};

export const summarizeExisting = (payment: IPayment, viewer: Viewer) => ({
  _id: payment._id,
  status: payment.status,
  amount: payment.amount,
  createdAt: payment.createdAt,
  submittedBy: payment.submittedBy
    ? { role: payment.submittedBy.role, name: payment.submittedBy.name }
    : undefined,
  message: describeExistingPayment(payment, viewer),
});

/** Store the receipt: Cloudinary when configured, otherwise inline (local development only). */
const storeReceipt = async (file: Express.Multer.File) => {
  if (!process.env.CLOUDINARY_CLOUD_NAME) {
    return `data:${file.mimetype};base64,${file.buffer.toString("base64")}`;
  }
  return uploadFile(file, { folder: "payment-receipts" });
};

const parseJson = (v: any) => {
  if (typeof v !== "string") return v;
  try {
    return JSON.parse(v);
  } catch {
    return undefined;
  }
};

/**
 * Create a payment record for a student from an upload request.
 * Shared by the student portal and the parent portal.
 */
export const submitReceipt = async (
  student: { _id: any },
  body: any,
  file: Express.Multer.File | undefined,
  submitter: Submitter
): Promise<{ status: number; json: any }> => {
  if (!file) {
    return { status: 400, json: { success: false, message: "Please upload a receipt (photo or PDF)" } };
  }
  if (!RECEIPT_TYPES.includes(file.mimetype)) {
    return {
      status: 400,
      json: { success: false, message: "The receipt must be a photo (JPG, PNG, WebP) or a PDF" },
    };
  }

  const key = readPaymentKey(body);
  if ("error" in key) return { status: 400, json: { success: false, message: key.error } };

  const amount = Number(String(body?.amount ?? "").replace(/,/g, ""));
  if (!Number.isFinite(amount) || amount < 1) {
    return { status: 400, json: { success: false, message: "Enter the amount paid" } };
  }
  const paymentMethod = String(body?.paymentMethod || "bank_transfer");
  if (!(PAYMENT_METHODS as readonly string[]).includes(paymentMethod)) {
    return { status: 400, json: { success: false, message: "Choose a valid payment method" } };
  }

  const viewer = { userId: submitter.userId, role: submitter.role };
  const existing = await findActivePayment(student._id, key.academicSession, key.term, key.paymentType);
  if (existing) {
    return {
      status: 409,
      json: {
        success: false,
        code: "ALREADY_UPLOADED",
        message: describeExistingPayment(existing, viewer),
        existing: summarizeExisting(existing, viewer),
      },
    };
  }

  let receiptImage: string;
  try {
    receiptImage = await storeReceipt(file);
  } catch (error) {
    console.error("Receipt upload error:", error);
    return { status: 502, json: { success: false, message: "Could not save the receipt. Please try again." } };
  }

  const bankDetails = parseJson(body?.bankDetails);
  const payment = await Payment.create({
    studentId: student._id,
    academicSession: key.academicSession,
    term: key.term,
    paymentType: key.paymentType,
    amount,
    currency: "NGN",
    paymentMethod,
    transactionReference: body?.transactionReference
      ? String(body.transactionReference).trim()
      : undefined,
    bankDetails: bankDetails && typeof bankDetails === "object" ? bankDetails : undefined,
    receiptDetails: {
      receiptNumber: body?.receiptNumber ? String(body.receiptNumber).trim() : undefined,
      receiptImage,
      description: body?.description ? String(body.description).trim() : undefined,
    },
    submittedBy: submitter,
  });

  return {
    status: 201,
    json: {
      success: true,
      message: "Receipt uploaded. The school will verify it soon.",
      data: payment,
    },
  };
};

/** Shared handler body for the "has this already been uploaded?" check. */
export const checkExisting = async (studentId: any, query: any, viewer: Viewer) => {
  const key = readPaymentKey(query);
  if ("error" in key) return { status: 400, json: { success: false, message: key.error } };
  const existing = await findActivePayment(studentId, key.academicSession, key.term, key.paymentType);
  return {
    status: 200,
    json: {
      success: true,
      data: {
        alreadyUploaded: !!existing,
        existing: existing ? summarizeExisting(existing, viewer) : null,
      },
    },
  };
};
