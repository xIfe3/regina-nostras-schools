import React, { useEffect, useRef, useState } from "react";
import { AlertTriangle, CheckCircle2, FileText, Loader2, Upload, X } from "lucide-react";
import toast from "react-hot-toast";
import type { ExistingPayment, PaymentCheckResult, PaymentKey } from "../../services/api";
import {
  PAYMENT_METHOD_OPTIONS,
  PAYMENT_TYPE_OPTIONS,
  TERM_OPTIONS,
  currentSession,
  currentTerm,
  expectedSchoolFees,
  formatCurrency,
  sessionOptions,
} from "./paymentHelpers";

const MAX_BYTES = 5 * 1024 * 1024;
const ACCEPT = "image/jpeg,image/png,image/webp,application/pdf";

interface Props {
  open: boolean;
  onClose: () => void;
  onUploaded: () => void;
  /** Who the payment is for, e.g. "Ada Obi" */
  studentName: string;
  studentClass?: string;
  check: (key: PaymentKey) => Promise<PaymentCheckResult>;
  submit: (data: Record<string, unknown>, file: File) => Promise<void>;
}

const inputClass =
  "mt-1 block w-full rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#0C4A9F] focus:outline-none focus:ring-1 focus:ring-[#0C4A9F]";

const ReceiptUploadModal: React.FC<Props> = ({
  open,
  onClose,
  onUploaded,
  studentName,
  studentClass,
  check,
  submit,
}) => {
  const [paymentType, setPaymentType] = useState("school_fees");
  const [academicSession, setAcademicSession] = useState(currentSession());
  const [term, setTerm] = useState(currentTerm());
  const [amount, setAmount] = useState("");
  const [amountTouched, setAmountTouched] = useState(false);
  const [paymentMethod, setPaymentMethod] = useState("bank_transfer");
  const [transactionReference, setTransactionReference] = useState("");
  const [description, setDescription] = useState("");
  const [file, setFile] = useState<File | null>(null);
  const [preview, setPreview] = useState<string | null>(null);
  const [checking, setChecking] = useState(false);
  const [existing, setExisting] = useState<ExistingPayment | null>(null);
  const [submitting, setSubmitting] = useState(false);
  const fileInput = useRef<HTMLInputElement>(null);
  // Keep the latest check() without re-running the effect on every parent render
  const checkRef = useRef(check);
  checkRef.current = check;

  // Ask the server whether this fee was already uploaded (by the student or a parent)
  useEffect(() => {
    if (!open) return;
    let cancelled = false;
    setChecking(true);
    const t = setTimeout(() => {
      checkRef
        .current({ academicSession, term, paymentType })
        .then((r) => !cancelled && setExisting(r.existing))
        .catch(() => !cancelled && setExisting(null))
        .finally(() => !cancelled && setChecking(false));
    }, 250);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, [open, academicSession, term, paymentType]);

  // Pre-fill school fees from the fee schedule until the user types their own amount
  useEffect(() => {
    if (amountTouched) return;
    const fee = paymentType === "school_fees" ? expectedSchoolFees(academicSession, studentClass, term) : undefined;
    setAmount(fee ? String(fee) : "");
  }, [paymentType, academicSession, term, studentClass, amountTouched]);

  useEffect(() => {
    if (!file || !file.type.startsWith("image/")) {
      setPreview(null);
      return;
    }
    const url = URL.createObjectURL(file);
    setPreview(url);
    return () => URL.revokeObjectURL(url);
  }, [file]);

  useEffect(() => {
    if (!open) return;
    const onKey = (e: KeyboardEvent) => e.key === "Escape" && !submitting && onClose();
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [open, submitting, onClose]);

  if (!open) return null;

  const pickFile = (f?: File) => {
    if (!f) return;
    if (!ACCEPT.split(",").includes(f.type)) {
      toast.error("Please choose a photo (JPG, PNG, WebP) or a PDF of the receipt");
      return;
    }
    if (f.size > MAX_BYTES) {
      toast.error("The receipt must be smaller than 5MB");
      return;
    }
    setFile(f);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (existing) return;
    if (!file) {
      toast.error("Please attach the receipt");
      return;
    }
    if (!(Number(amount) > 0)) {
      toast.error("Enter the amount paid");
      return;
    }
    try {
      setSubmitting(true);
      await submit(
        { paymentType, academicSession, term, amount: Number(amount), paymentMethod, transactionReference, description },
        file
      );
      toast.success("Receipt uploaded. The school will verify it soon.");
      onUploaded();
      onClose();
    } catch (error) {
      const err = error as { message?: string; response?: { data?: { code?: string; existing?: ExistingPayment } } };
      const data = err?.response?.data;
      if (data?.code === "ALREADY_UPLOADED" && data.existing) {
        // Someone else uploaded it while this form was open
        setExisting(data.existing);
      } else {
        toast.error(err?.message || "Could not upload the receipt");
      }
    } finally {
      setSubmitting(false);
    }
  };

  const blocked = !!existing;
  const verified = existing?.status === "verified";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/50 p-4" role="dialog" aria-modal="true" aria-labelledby="upload-receipt-title">
      <div className="max-h-[92vh] w-full max-w-lg overflow-y-auto rounded-xl bg-white shadow-xl">
        <div className="flex items-start justify-between border-b border-slate-200 px-6 py-4">
          <div>
            <h2 id="upload-receipt-title" className="text-lg font-semibold text-slate-900">
              Upload payment receipt
            </h2>
            <p className="text-sm text-slate-500">For {studentName}</p>
          </div>
          <button onClick={onClose} disabled={submitting} className="text-slate-400 hover:text-slate-600" aria-label="Close">
            <X className="h-5 w-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4 px-6 py-5">
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-3">
            <label className="block text-sm font-medium text-slate-700 sm:col-span-3">
              What was paid for
              <select value={paymentType} onChange={(e) => setPaymentType(e.target.value)} className={inputClass}>
                {PAYMENT_TYPE_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700 sm:col-span-2">
              Session
              <select value={academicSession} onChange={(e) => setAcademicSession(e.target.value)} className={inputClass}>
                {sessionOptions().map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </label>
            <label className="block text-sm font-medium text-slate-700">
              Term
              <select value={term} onChange={(e) => setTerm(e.target.value)} className={inputClass}>
                {TERM_OPTIONS.map((o) => (
                  <option key={o.value} value={o.value}>
                    {o.label}
                  </option>
                ))}
              </select>
            </label>
          </div>

          {checking ? (
            <p className="flex items-center text-sm text-slate-500">
              <Loader2 className="mr-2 h-4 w-4 animate-spin" /> Checking if this has already been uploaded…
            </p>
          ) : existing ? (
            <div
              role="alert"
              className={`flex gap-3 rounded-md border p-3 text-sm ${
                verified ? "border-green-200 bg-green-50 text-green-900" : "border-amber-200 bg-amber-50 text-amber-900"
              }`}
            >
              {verified ? (
                <CheckCircle2 className="mt-0.5 h-5 w-5 flex-shrink-0 text-green-600" />
              ) : (
                <AlertTriangle className="mt-0.5 h-5 w-5 flex-shrink-0 text-amber-600" />
              )}
              <div>
                <p className="font-medium">Already uploaded</p>
                <p className="mt-0.5">{existing.message}</p>
                <p className="mt-1 text-xs opacity-80">Amount on that receipt: {formatCurrency(existing.amount)}</p>
              </div>
            </div>
          ) : null}

          <fieldset disabled={blocked} className="space-y-4 disabled:opacity-50">
            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <label className="block text-sm font-medium text-slate-700">
                Amount paid (₦)
                <input
                  type="number"
                  min={1}
                  inputMode="numeric"
                  value={amount}
                  onChange={(e) => {
                    setAmountTouched(true);
                    setAmount(e.target.value);
                  }}
                  className={inputClass}
                  required
                />
              </label>
              <label className="block text-sm font-medium text-slate-700">
                Paid by
                <select value={paymentMethod} onChange={(e) => setPaymentMethod(e.target.value)} className={inputClass}>
                  {PAYMENT_METHOD_OPTIONS.map((o) => (
                    <option key={o.value} value={o.value}>
                      {o.label}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            <label className="block text-sm font-medium text-slate-700">
              Transaction reference <span className="font-normal text-slate-400">(optional)</span>
              <input value={transactionReference} onChange={(e) => setTransactionReference(e.target.value)} className={inputClass} />
            </label>

            <div>
              <span className="block text-sm font-medium text-slate-700">Receipt</span>
              <button
                type="button"
                onClick={() => fileInput.current?.click()}
                onDragOver={(e) => e.preventDefault()}
                onDrop={(e) => {
                  e.preventDefault();
                  pickFile(e.dataTransfer.files?.[0]);
                }}
                className="mt-1 flex w-full flex-col items-center justify-center rounded-md border-2 border-dashed border-slate-300 px-4 py-5 text-sm text-slate-600 hover:border-[#0C4A9F] hover:bg-slate-50"
              >
                {file ? (
                  <>
                    {preview ? (
                      <img src={preview} alt="Receipt preview" className="mb-2 max-h-40 rounded" />
                    ) : (
                      <FileText className="mb-2 h-8 w-8 text-slate-400" />
                    )}
                    <span className="font-medium text-slate-800">{file.name}</span>
                    <span className="text-xs text-slate-500">Click to choose a different file</span>
                  </>
                ) : (
                  <>
                    <Upload className="mb-2 h-6 w-6 text-slate-400" />
                    <span>Click to choose a photo or PDF of the receipt</span>
                    <span className="text-xs text-slate-500">JPG, PNG, WebP or PDF, up to 5MB</span>
                  </>
                )}
              </button>
              <input
                ref={fileInput}
                type="file"
                accept={ACCEPT}
                className="hidden"
                onChange={(e) => {
                  pickFile(e.target.files?.[0]);
                  e.target.value = "";
                }}
              />
            </div>

            <label className="block text-sm font-medium text-slate-700">
              Note to the school <span className="font-normal text-slate-400">(optional)</span>
              <textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} className={inputClass} />
            </label>
          </fieldset>

          <div className="flex justify-end gap-2 border-t border-slate-200 pt-4">
            <button
              type="button"
              onClick={onClose}
              disabled={submitting}
              className="rounded-md border border-slate-300 bg-white px-4 py-2 text-sm font-medium text-slate-700 hover:bg-slate-50"
            >
              {blocked ? "Close" : "Cancel"}
            </button>
            {!blocked && (
              <button
                type="submit"
                disabled={submitting || checking}
                className="inline-flex items-center rounded-md bg-[#0C4A9F] px-4 py-2 text-sm font-medium text-white hover:bg-[#0A2F66] disabled:opacity-50"
              >
                {submitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-4 w-4" />}
                {submitting ? "Uploading…" : "Upload receipt"}
              </button>
            )}
          </div>
        </form>
      </div>
    </div>
  );
};

export default ReceiptUploadModal;
