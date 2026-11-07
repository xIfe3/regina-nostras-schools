import React, { useCallback, useEffect, useState } from "react";
import { ChevronLeft, ChevronRight, CreditCard, Eye, Upload } from "lucide-react";
import toast from "react-hot-toast";
import type { PaymentCheckResult, PaymentKey } from "../../services/api";
import ReceiptUploadModal from "./ReceiptUploadModal";
import {
  PaymentRecord,
  formatCurrency,
  formatDate,
  humanize,
  openReceipt,
  uploadedByLabel,
} from "./paymentHelpers";

const statusStyles: Record<PaymentRecord["status"], string> = {
  verified: "bg-green-100 text-green-800",
  pending: "bg-amber-100 text-amber-800",
  rejected: "bg-red-100 text-red-800",
};
const statusLabel: Record<PaymentRecord["status"], string> = {
  verified: "Verified",
  pending: "Awaiting verification",
  rejected: "Rejected",
};

const PAGE_SIZE = 10;

interface Props {
  title: string;
  subtitle: string;
  studentName: string;
  studentClass?: string;
  viewerUserId?: string;
  /** Changes when the student changes (parent switching child), to reload */
  reloadKey?: string;
  load: (params: { page: number; limit: number; status?: string }) => Promise<{
    payments: PaymentRecord[];
    totalPages: number;
  }>;
  check: (key: PaymentKey) => Promise<PaymentCheckResult>;
  submit: (data: Record<string, unknown>, file: File) => Promise<void>;
}

const PaymentsView: React.FC<Props> = ({
  title,
  subtitle,
  studentName,
  studentClass,
  viewerUserId,
  reloadKey,
  load,
  check,
  submit,
}) => {
  const [payments, setPayments] = useState<PaymentRecord[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(true);
  const [showUpload, setShowUpload] = useState(false);
  const [refresh, setRefresh] = useState(0);

  useEffect(() => {
    setPage(1);
  }, [reloadKey, statusFilter]);

  const loadRef = React.useRef(load);
  loadRef.current = load;

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    loadRef
      .current({ page, limit: PAGE_SIZE, status: statusFilter || undefined })
      .then((r) => {
        if (cancelled) return;
        setPayments(r.payments);
        setTotalPages(r.totalPages || 1);
      })
      .catch((error) => {
        console.error("Error fetching payments:", error);
        if (!cancelled) {
          setPayments([]);
          toast.error("Failed to load payments");
        }
      })
      .finally(() => !cancelled && setLoading(false));
    return () => {
      cancelled = true;
    };
  }, [reloadKey, page, statusFilter, refresh]);

  const onUploaded = useCallback(() => {
    setStatusFilter("");
    setPage(1);
    setRefresh((n) => n + 1);
  }, []);

  const verifiedTotal = payments.filter((p) => p.status === "verified").reduce((s, p) => s + p.amount, 0);
  const pendingCount = payments.filter((p) => p.status === "pending").length;

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mb-6 flex flex-wrap items-end justify-between gap-4">
        <div>
          <h1 className="text-2xl font-bold text-slate-900">{title}</h1>
          <p className="mt-1 text-sm text-slate-500">{subtitle}</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="rounded-md border border-slate-300 px-3 py-2 text-sm focus:border-[#0C4A9F] focus:outline-none"
            aria-label="Filter by status"
          >
            <option value="">All statuses</option>
            <option value="pending">Awaiting verification</option>
            <option value="verified">Verified</option>
            <option value="rejected">Rejected</option>
          </select>
          <button
            onClick={() => setShowUpload(true)}
            className="inline-flex items-center rounded-md bg-[#0C4A9F] px-4 py-2 text-sm font-medium text-white hover:bg-[#0A2F66]"
          >
            <Upload className="mr-2 h-4 w-4" />
            Upload receipt
          </button>
        </div>
      </div>

      <div className="mb-6 rounded-lg border border-slate-200 bg-slate-50 p-4 text-sm text-slate-600">
        Paid at the bank or by transfer? Upload a photo or PDF of the receipt here. Students and parents share one
        record, so if the receipt is already uploaded by either of you, you will be told and don't need to upload it
        again.
      </div>

      {loading ? (
        <div className="flex h-64 items-center justify-center">
          <div className="h-12 w-12 animate-spin rounded-full border-b-2 border-[#0C4A9F]" />
        </div>
      ) : payments.length === 0 ? (
        <div className="rounded-lg bg-white p-8 text-center shadow">
          <CreditCard className="mx-auto h-12 w-12 text-slate-400" />
          <h3 className="mt-2 text-sm font-medium text-slate-900">No payments yet</h3>
          <p className="mt-1 text-sm text-slate-500">Receipts you upload will appear here with their status.</p>
        </div>
      ) : (
        <div className="overflow-hidden rounded-lg bg-white shadow">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-slate-200">
              <thead className="bg-slate-50">
                <tr>
                  {["Uploaded", "Fee", "Session / Term", "Amount", "Uploaded by", "Status", ""].map((h, i) => (
                    <th
                      key={i}
                      className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wider text-slate-500"
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-200 bg-white">
                {payments.map((p) => (
                  <tr key={p._id}>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">{formatDate(p.createdAt)}</td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-900">
                      {humanize(p.paymentType)}
                      <p className="text-xs text-slate-400">
                        {humanize(p.paymentMethod)}
                        {p.transactionReference ? ` · Ref ${p.transactionReference}` : ""}
                      </p>
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-500">
                      {p.academicSession} · {humanize(p.term)} term
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm font-medium text-slate-900">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-sm text-slate-600">
                      {uploadedByLabel(p, viewerUserId)}
                    </td>
                    <td className="px-4 py-3 text-sm">
                      <span
                        className={`inline-flex whitespace-nowrap rounded-full px-2.5 py-0.5 text-xs font-medium ${statusStyles[p.status]}`}
                      >
                        {statusLabel[p.status]}
                      </span>
                      {p.status === "rejected" && p.rejectionReason && (
                        <p className="mt-1 max-w-xs text-xs text-red-600">{p.rejectionReason}</p>
                      )}
                    </td>
                    <td className="whitespace-nowrap px-4 py-3 text-right text-sm">
                      {p.receiptDetails?.receiptImage && (
                        <button
                          onClick={() => openReceipt(p.receiptDetails?.receiptImage)}
                          className="inline-flex items-center text-[#0C4A9F] hover:underline"
                        >
                          <Eye className="mr-1 h-4 w-4" /> Receipt
                        </button>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="flex flex-wrap items-center justify-between gap-3 border-t border-slate-200 px-4 py-3 text-sm">
            <p className="text-slate-500">
              Verified on this page: <span className="font-medium text-slate-900">{formatCurrency(verifiedTotal)}</span>
              {pendingCount > 0 && <> · {pendingCount} awaiting verification</>}
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((n) => Math.max(n - 1, 1))}
                  disabled={page <= 1}
                  className="rounded-md border border-slate-300 p-1.5 disabled:opacity-40"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-slate-600">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((n) => Math.min(n + 1, totalPages))}
                  disabled={page >= totalPages}
                  className="rounded-md border border-slate-300 p-1.5 disabled:opacity-40"
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}

      {showUpload && (
        <ReceiptUploadModal
          open
          onClose={() => setShowUpload(false)}
          onUploaded={onUploaded}
          studentName={studentName}
          studentClass={studentClass}
          check={check}
          submit={submit}
        />
      )}
    </div>
  );
};

export default PaymentsView;
