import React, { useEffect, useState } from "react";
import { CreditCard, ChevronLeft, ChevronRight } from "lucide-react";
import toast from "react-hot-toast";
import { parentAPI } from "../../services/api";
import { childFullName, useParentContext } from "./parentContext";

interface Payment {
  _id: string;
  academicSession: string;
  term: string;
  paymentType: string;
  amount: number;
  paymentMethod: string;
  status: "pending" | "verified" | "rejected";
  transactionReference?: string;
  rejectionReason?: string;
  createdAt: string;
}

const formatCurrency = (amount: number) =>
  new Intl.NumberFormat("en-NG", {
    style: "currency",
    currency: "NGN",
  }).format(amount);

const humanize = (s: string) =>
  s
    .split("_")
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(" ");

const statusStyles: Record<Payment["status"], string> = {
  verified: "bg-green-100 text-green-800",
  pending: "bg-yellow-100 text-yellow-800",
  rejected: "bg-red-100 text-red-800",
};

const PAGE_SIZE = 10;

const ParentPayments: React.FC = () => {
  const { selectedChild } = useParentContext();
  const [payments, setPayments] = useState<Payment[]>([]);
  const [statusFilter, setStatusFilter] = useState("");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [loading, setLoading] = useState(false);

  // Reset paging when switching child or filter
  useEffect(() => {
    setPage(1);
  }, [selectedChild, statusFilter]);

  useEffect(() => {
    if (!selectedChild) return;
    let cancelled = false;
    setLoading(true);
    parentAPI
      .getChildPayments(selectedChild._id, {
        page,
        limit: PAGE_SIZE,
        status: statusFilter || undefined,
      })
      .then((res) => {
        if (cancelled) return;
        setPayments(res.data.data || []);
        setTotalPages(res.data.pagination?.totalPages || 1);
      })
      .catch((error) => {
        console.error("Error fetching payments:", error);
        if (!cancelled) {
          setPayments([]);
          toast.error("Failed to load payments");
        }
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [selectedChild, page, statusFilter]);

  if (!selectedChild) {
    return (
      <div className="px-4 sm:px-6 lg:px-8">
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
          <p className="mt-2 text-sm text-gray-500">
            No child is linked to your account yet. Please contact the school.
          </p>
        </div>
      </div>
    );
  }

  const verifiedTotal = payments
    .filter((p) => p.status === "verified")
    .reduce((sum, p) => sum + p.amount, 0);

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      <div className="mb-8 flex flex-wrap justify-between items-end gap-4">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Payments — {childFullName(selectedChild)}
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Fee payments submitted for {selectedChild.personalInfo.firstName}{" "}
            and their verification status
          </p>
        </div>
        <select
          value={statusFilter}
          onChange={(e) => setStatusFilter(e.target.value)}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-green-500 focus:border-[#0C4A9F]"
        >
          <option value="">All statuses</option>
          <option value="verified">Verified</option>
          <option value="pending">Pending</option>
          <option value="rejected">Rejected</option>
        </select>
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-[#0C4A9F]"></div>
        </div>
      ) : payments.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No payments found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            Payments submitted for this child will appear here.
          </p>
        </div>
      ) : (
        <div className="bg-white shadow rounded-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  {["Date", "Type", "Session / Term", "Amount", "Method", "Status"].map(
                    (h) => (
                      <th
                        key={h}
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    )
                  )}
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {payments.map((p) => (
                  <tr key={p._id}>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {new Date(p.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">
                      {humanize(p.paymentType)}
                      {p.transactionReference && (
                        <p className="text-xs text-gray-400">
                          Ref: {p.transactionReference}
                        </p>
                      )}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {p.academicSession} · {humanize(p.term)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">
                      {formatCurrency(p.amount)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">
                      {humanize(p.paymentMethod)}
                    </td>
                    <td className="px-4 py-3 whitespace-nowrap text-sm">
                      <span
                        className={`inline-flex px-2.5 py-0.5 rounded-full text-xs font-medium ${statusStyles[p.status]}`}
                      >
                        {humanize(p.status)}
                      </span>
                      {p.status === "rejected" && p.rejectionReason && (
                        <p className="text-xs text-red-600 mt-1 max-w-xs whitespace-normal">
                          {p.rejectionReason}
                        </p>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          <div className="px-4 py-3 border-t border-gray-200 flex flex-wrap items-center justify-between gap-3 text-sm">
            <p className="text-gray-500">
              Verified on this page:{" "}
              <span className="font-medium text-gray-900">
                {formatCurrency(verifiedTotal)}
              </span>
            </p>
            {totalPages > 1 && (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setPage((p) => Math.max(p - 1, 1))}
                  disabled={page <= 1}
                  className="p-1.5 rounded-md border border-gray-300 disabled:opacity-40"
                  aria-label="Previous page"
                >
                  <ChevronLeft className="h-4 w-4" />
                </button>
                <span className="text-gray-600">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => setPage((p) => Math.min(p + 1, totalPages))}
                  disabled={page >= totalPages}
                  className="p-1.5 rounded-md border border-gray-300 disabled:opacity-40"
                  aria-label="Next page"
                >
                  <ChevronRight className="h-4 w-4" />
                </button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
};

export default ParentPayments;
