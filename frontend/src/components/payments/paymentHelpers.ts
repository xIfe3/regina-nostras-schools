import { feeStructure } from "../../feeStructure";

export const PAYMENT_TYPE_OPTIONS = [
  { value: "school_fees", label: "School fees" },
  { value: "exam_fees", label: "Exam fees" },
  { value: "uniform", label: "Uniform" },
  { value: "books", label: "Books" },
  { value: "excursion", label: "Excursion" },
  { value: "other", label: "Other" },
];

export const PAYMENT_METHOD_OPTIONS = [
  { value: "bank_transfer", label: "Bank transfer" },
  { value: "pos", label: "POS" },
  { value: "online_payment", label: "Online payment" },
  { value: "cash", label: "Cash (bank teller)" },
  { value: "check", label: "Cheque" },
];

export const TERM_OPTIONS = [
  { value: "first", label: "First term" },
  { value: "second", label: "Second term" },
  { value: "third", label: "Third term" },
];

export const humanize = (s: string) =>
  (s || "")
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

export const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-NG", { style: "currency", currency: "NGN" }).format(amount || 0);

export const formatDate = (d: string) =>
  new Date(d).toLocaleDateString("en-GB", { day: "numeric", month: "short", year: "numeric" });

/** The school year starts in September: Nov 2026 is in 2026/2027. */
export const currentSession = (now = new Date()) => {
  const y = now.getFullYear();
  return now.getMonth() >= 8 ? `${y}/${y + 1}` : `${y - 1}/${y}`;
};

export const sessionOptions = () => {
  const [start] = currentSession().split("/").map(Number);
  return [start + 1, start, start - 1].map((y) => `${y}/${y + 1}`);
};

/** Best guess of the current term from the month (Sep–Dec first, Jan–Apr second, May–Aug third). */
export const currentTerm = (now = new Date()) => {
  const m = now.getMonth();
  if (m >= 8) return "first";
  if (m <= 3) return "second";
  return "third";
};

const TERM_KEYS: Record<string, string> = { first: "1st Term", second: "2nd Term", third: "3rd Term" };

/** School fees from the published fee schedule, if the schedule has this session and class. */
export const expectedSchoolFees = (session: string, className?: string, term?: string) => {
  if (!className || !term) return undefined;
  return feeStructure[session]?.[className]?.[TERM_KEYS[term]];
};

/**
 * Open a receipt in a new tab. Receipts saved without Cloudinary are data URLs,
 * which browsers refuse to open directly, so those go through a blob URL.
 */
export const openReceipt = (url?: string) => {
  if (!url) return;
  if (!url.startsWith("data:")) {
    window.open(url, "_blank", "noopener");
    return;
  }
  const [meta, data] = url.split(",");
  const mime = meta.match(/^data:([^;]+)/)?.[1] || "application/octet-stream";
  const bytes = Uint8Array.from(atob(data), (c) => c.charCodeAt(0));
  const blobUrl = URL.createObjectURL(new Blob([bytes], { type: mime }));
  window.open(blobUrl, "_blank", "noopener");
  setTimeout(() => URL.revokeObjectURL(blobUrl), 60_000);
};

export interface PaymentRecord {
  _id: string;
  academicSession: string;
  term: string;
  paymentType: string;
  amount: number;
  paymentMethod: string;
  status: "pending" | "verified" | "rejected";
  transactionReference?: string;
  rejectionReason?: string;
  receiptDetails?: { receiptImage?: string; receiptNumber?: string; description?: string };
  submittedBy?: { userId?: string; role: "student" | "parent" | "admin"; name?: string };
  createdAt: string;
}

/** "You", "Parent (Mrs Obi)", "Student (Ada Obi)" or "—" for older records. */
export const uploadedByLabel = (p: PaymentRecord, viewerUserId?: string) => {
  const by = p.submittedBy;
  if (!by) return "—";
  if (viewerUserId && by.userId && String(by.userId) === String(viewerUserId)) return "You";
  const role = by.role === "parent" ? "Parent" : by.role === "student" ? "Student" : "School";
  return by.name ? `${role} (${by.name})` : role;
};
