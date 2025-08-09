import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  Download,
  Filter,
  Search,
  Eye,
  CheckCircle,
  XCircle,
  Clock,
  User,
  Receipt,
  RefreshCw,
  AlertCircle,
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";

interface Payment {
  _id: string;
  studentId: {
    _id: string;
    personalInfo?: {
      firstName?: string;
      lastName?: string;
    };
    studentId?: string;
    academicInfo?: {
      currentClass?: string;
    };
    contactInfo?: {
      email?: string;
    };
  };
  amount: number;
  paymentType: string;
  academicSession: string;
  term: string;
  status: "pending" | "verified" | "rejected";
  paymentMethod: string;
  transactionReference?: string;
  receiptDetails?: {
    receiptImage?: string;
    receiptNumber?: string;
    description?: string;
  };
  verificationDetails?: {
    verifiedAt: string;
    verifiedBy: string;
    verificationNotes?: string;
  };
  rejectionReason?: string;
  createdAt: string;
}

const AdminPayments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sessionFilter, setSessionFilter] = useState("all");
  const [termFilter, setTermFilter] = useState("all");
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showModal, setShowModal] = useState(false);

  useEffect(() => {
    fetchPayments();
  }, []);

  useEffect(() => {
    fetchPayments();
  }, [statusFilter, sessionFilter, termFilter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);

      const queryParams = new URLSearchParams();
      queryParams.append("limit", "100"); // Get more payments initially

      if (statusFilter !== "all") {
        queryParams.append("status", statusFilter);
      }
      if (sessionFilter !== "all") {
        queryParams.append("academicSession", sessionFilter);
      }
      if (termFilter !== "all") {
        queryParams.append("term", termFilter);
      }

      const response = await api.get(
        `/payments/admin?${queryParams.toString()}`
      );

      if (response.data.success) {
        console.log("Fetched payments response:", response);
        console.log(
          "First payment student data:",
          response.data.data[0]?.studentId
        );
        setPayments(response.data.data || []);
      } else {
        throw new Error(response.data.message || "Failed to fetch payments");
      }
    } catch (error: any) {
      console.error("Error fetching payments:", error);
      toast.error(error.response?.data?.message || "Failed to load payments");
      setPayments([]); // Set empty array on error
    } finally {
      setLoading(false);
    }
  };

  const handleVerifyPayment = async (paymentId: string) => {
    try {
      await api.put(`/payments/${paymentId}/verify`);
      const updatedPayments = payments.map((payment) =>
        payment._id === paymentId
          ? {
              ...payment,
              status: "verified" as const,
              verificationDetails: {
                verifiedAt: new Date().toISOString(),
                verifiedBy: "Admin User",
              },
            }
          : payment
      );
      setPayments(updatedPayments);
      toast.success("Payment verified successfully");
    } catch (error) {
      console.error("Error verifying payment:", error);
      toast.error("Failed to verify payment");
    }
  };

  const handleRejectPayment = async (paymentId: string) => {
    try {
      await api.put(`/payments/${paymentId}/reject`, {
        rejectionReason: "Payment rejected by administrator",
      });
      const updatedPayments = payments.map((payment) =>
        payment._id === paymentId
          ? { ...payment, status: "rejected" as const }
          : payment
      );
      setPayments(updatedPayments);
      toast.success("Payment rejected");
    } catch (error) {
      console.error("Error rejecting payment:", error);
      toast.error("Failed to reject payment");
    }
  };

  const filteredPayments = payments.filter((payment) => {
    // Check if studentId is properly populated
    if (!payment.studentId || typeof payment.studentId === "string") {
      console.warn("Student not populated or invalid:", payment.studentId);
      return false;
    }

    const student = payment.studentId;
    const searchLower = searchTerm.toLowerCase();

    const matchesSearch =
      student.personalInfo?.firstName?.toLowerCase().includes(searchLower) ||
      student.personalInfo?.lastName?.toLowerCase().includes(searchLower) ||
      student.studentId?.toLowerCase().includes(searchLower) ||
      (payment.transactionReference &&
        payment.transactionReference.toLowerCase().includes(searchLower));

    const matchesStatus =
      statusFilter === "all" || payment.status === statusFilter;
    const matchesSession =
      sessionFilter === "all" || payment.academicSession === sessionFilter;
    const matchesTerm = termFilter === "all" || payment.term === termFilter;

    return matchesSearch && matchesStatus && matchesSession && matchesTerm;
  });

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <CheckCircle className="h-5 w-5 text-emerald-500" />;
      case "pending":
        return <Clock className="h-5 w-5 text-amber-500" />;
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses = "px-3 py-1 rounded-full text-xs font-medium";
    switch (status) {
      case "verified":
        return `${baseClasses} bg-emerald-100 text-emerald-800`;
      case "pending":
        return `${baseClasses} bg-amber-100 text-amber-800`;
      case "rejected":
        return `${baseClasses} bg-red-100 text-red-800`;
      default:
        return `${baseClasses} bg-gray-100 text-gray-800`;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("en-NG", {
      style: "currency",
      currency: "NGN",
    }).format(amount);
  };

  const exportPayments = async () => {
    try {
      // Try backend export first
      const response = await api.get("/payments/export", {
        responseType: "blob",
        params: {
          status: statusFilter !== "all" ? statusFilter : undefined,
          academicSession: sessionFilter !== "all" ? sessionFilter : undefined,
          term: termFilter !== "all" ? termFilter : undefined,
        },
      });

      const blob = new Blob([response.data], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payments_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success("Payment report exported successfully");
    } catch (error) {
      console.error("Error exporting payments:", error);

      // Fallback to client-side export
      if (filteredPayments.length === 0) {
        toast.error("No payments to export");
        return;
      }

      const headers = [
        "Student Name",
        "Admission Number",
        "Class",
        "Amount",
        "Payment Type",
        "Session",
        "Term",
        "Status",
        "Payment Method",
        "Reference",
        "Payment Date",
      ];

      const csvContent = [
        headers.join(","),
        ...filteredPayments.map((payment) =>
          [
            `"${payment.studentId?.personalInfo?.firstName || "N/A"} ${
              payment.studentId?.personalInfo?.lastName || "N/A"
            }"`,
            payment.studentId?.studentId || "N/A",
            payment.studentId?.academicInfo?.currentClass || "N/A",
            payment.amount,
            payment.paymentType,
            payment.academicSession,
            payment.term,
            payment.status,
            payment.paymentMethod,
            payment.transactionReference || "",
            new Date(payment.createdAt).toLocaleDateString(),
          ].join(",")
        ),
      ].join("\n");

      const blob = new Blob([csvContent], { type: "text/csv" });
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `payments_${new Date().toISOString().split("T")[0]}.csv`;
      a.click();
      window.URL.revokeObjectURL(url);

      toast.success("Payment report exported successfully");
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-16 w-16 border-b-2 border-blue-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading payments...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-blue-50 to-indigo-50">
      {/* Header */}
      <div className="bg-gradient-to-r from-indigo-600 via-purple-600 to-pink-600 px-4 sm:px-6 lg:px-8 py-8">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center mb-4">
                <div className="p-3 bg-white/20 backdrop-blur-sm rounded-xl mr-4">
                  <CreditCard className="h-8 w-8 text-white" />
                </div>
                <div>
                  <h1 className="text-3xl font-bold text-white">
                    Payment Management
                  </h1>
                  <p className="text-indigo-100">
                    Monitor and manage student payments
                  </p>
                </div>
              </div>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={exportPayments}
                className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl px-4 py-2 text-white hover:bg-white/30 transition-colors flex items-center"
              >
                <Download className="h-4 w-4 mr-2" />
                Export
              </button>
              <button
                onClick={fetchPayments}
                className="bg-white/20 backdrop-blur-sm border border-white/30 rounded-xl px-4 py-2 text-white hover:bg-white/30 transition-colors flex items-center"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="px-4 sm:px-6 lg:px-8 -mt-4 relative z-10 pb-8">
        {/* Filters and Search */}
        <div className="bg-white/90 backdrop-blur-sm border border-white/30 rounded-2xl p-6 mb-8 shadow-xl">
          <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
              <input
                type="text"
                placeholder="Search payments..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
              />
            </div>

            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">All Status</option>
              <option value="verified">Verified</option>
              <option value="pending">Pending</option>
              <option value="rejected">Rejected</option>
            </select>

            <select
              value={sessionFilter}
              onChange={(e) => setSessionFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">All Sessions</option>
              <option value="2023/2024">2023/2024</option>
              <option value="2022/2023">2022/2023</option>
            </select>

            <select
              value={termFilter}
              onChange={(e) => setTermFilter(e.target.value)}
              className="px-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
            >
              <option value="all">All Terms</option>
              <option value="First Term">First Term</option>
              <option value="Second Term">Second Term</option>
              <option value="Third Term">Third Term</option>
            </select>

            <button className="bg-gradient-to-r from-indigo-500 to-purple-600 text-white px-6 py-3 rounded-xl hover:from-indigo-600 hover:to-purple-700 transition-all flex items-center justify-center">
              <Filter className="h-4 w-4 mr-2" />
              Filter
            </button>
          </div>
        </div>

        {/* Payments Table */}
        <div className="bg-white/90 backdrop-blur-sm border border-white/30 rounded-2xl shadow-xl overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">
              Payment Records
            </h3>
          </div>

          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Student
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Amount
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Type
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Session/Term
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Date
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredPayments.length === 0 ? (
                  <tr>
                    <td colSpan={7} className="px-6 py-12 text-center">
                      <div className="text-gray-500">
                        <CreditCard className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p className="text-lg font-medium">No payments found</p>
                        <p className="text-sm">
                          {payments.length === 0
                            ? "No payments have been submitted yet."
                            : "Try adjusting your search or filter criteria."}
                        </p>
                      </div>
                    </td>
                  </tr>
                ) : (
                  filteredPayments.map((payment) => (
                    <tr key={payment._id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="flex-shrink-0 h-10 w-10">
                            <div className="h-10 w-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center">
                              <User className="h-5 w-5 text-white" />
                            </div>
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">
                              {payment.studentId?.personalInfo?.firstName ||
                                "N/A"}{" "}
                              {payment.studentId?.personalInfo?.lastName ||
                                "N/A"}
                            </div>
                            <div className="text-sm text-gray-500">
                              {payment.studentId?.studentId || "N/A"} •{" "}
                              {payment.studentId?.academicInfo?.currentClass ||
                                "N/A"}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-sm font-medium text-gray-900">
                          {formatCurrency(payment.amount)}
                        </div>
                        <div className="text-sm text-gray-500 capitalize">
                          {payment.paymentMethod.replace("_", " ")}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        {payment.paymentType}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div>{payment.academicSession}</div>
                        <div>{payment.term}</div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={getStatusBadge(payment.status)}>
                          {payment.status.charAt(0).toUpperCase() +
                            payment.status.slice(1)}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {new Date(payment.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                        <div className="flex items-center space-x-2">
                          <button
                            onClick={() => {
                              setSelectedPayment(payment);
                              setShowModal(true);
                            }}
                            className="text-indigo-600 hover:text-indigo-900"
                            title="View Details"
                          >
                            <Eye className="h-4 w-4" />
                          </button>

                          {payment.status === "pending" && (
                            <>
                              <button
                                onClick={() => handleVerifyPayment(payment._id)}
                                className="text-emerald-600 hover:text-emerald-900"
                                title="Verify Payment"
                              >
                                <CheckCircle className="h-4 w-4" />
                              </button>
                              <button
                                onClick={() => handleRejectPayment(payment._id)}
                                className="text-red-600 hover:text-red-900"
                                title="Reject Payment"
                              >
                                <XCircle className="h-4 w-4" />
                              </button>
                            </>
                          )}

                          {payment.receiptDetails?.receiptImage && (
                            <button
                              onClick={() =>
                                window.open(
                                  payment.receiptDetails?.receiptImage,
                                  "_blank"
                                )
                              }
                              className="text-blue-600 hover:text-blue-900"
                              title="Download Receipt"
                            >
                              <Receipt className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Payment Details Modal */}
      {showModal && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-2xl p-6 max-w-md w-full"
          >
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Payment Details
              </h3>
              <button
                onClick={() => setShowModal(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Student
                </label>
                <p className="text-gray-900">
                  {selectedPayment.studentId?.personalInfo?.firstName || "N/A"}{" "}
                  {selectedPayment.studentId?.personalInfo?.lastName || "N/A"}
                </p>
                <p className="text-sm text-gray-500">
                  {selectedPayment.studentId?.studentId || "N/A"} •{" "}
                  {selectedPayment.studentId?.academicInfo?.currentClass ||
                    "N/A"}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">
                  Amount
                </label>
                <p className="text-lg font-semibold text-gray-900">
                  {formatCurrency(selectedPayment.amount)}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">
                  Reference
                </label>
                <p className="text-gray-900 font-mono text-sm">
                  {selectedPayment.transactionReference || "N/A"}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">
                  Status
                </label>
                <div className="flex items-center space-x-2">
                  {getStatusIcon(selectedPayment.status)}
                  <span className={getStatusBadge(selectedPayment.status)}>
                    {selectedPayment.status.charAt(0).toUpperCase() +
                      selectedPayment.status.slice(1)}
                  </span>
                </div>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">
                  Payment Date
                </label>
                <p className="text-gray-900">
                  {new Date(selectedPayment.createdAt).toLocaleString()}
                </p>
              </div>

              {selectedPayment.verificationDetails?.verifiedAt && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Verified
                  </label>
                  <p className="text-gray-900">
                    {new Date(
                      selectedPayment.verificationDetails.verifiedAt
                    ).toLocaleString()}
                  </p>
                  <p className="text-sm text-gray-500">
                    by {selectedPayment.verificationDetails.verifiedBy}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowModal(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
              {selectedPayment.receiptDetails?.receiptImage && (
                <button
                  onClick={() =>
                    window.open(
                      selectedPayment.receiptDetails?.receiptImage,
                      "_blank"
                    )
                  }
                  className="px-4 py-2 bg-gradient-to-r from-indigo-500 to-purple-600 text-white rounded-lg hover:from-indigo-600 hover:to-purple-700 transition-all flex items-center"
                >
                  <Receipt className="h-4 w-4 mr-2" />
                  Download Receipt
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default AdminPayments;
