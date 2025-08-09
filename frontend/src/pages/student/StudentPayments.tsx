import React, { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  CreditCard,
  Download,
  Search,
  Filter,
  Upload,
  CheckCircle,
  Clock,
  XCircle,
  AlertCircle,
  Receipt,
  Plus,
  Eye,
} from "lucide-react";
import api from "../../services/api";
import toast from "react-hot-toast";

interface Payment {
  _id: string;
  amount: number;
  paymentType: string;
  academicSession: string;
  term: string;
  status: "pending" | "verified" | "rejected";
  paymentDate: string;
  receiptUrl?: string;
  reference: string;
  verificationDetails?: {
    verifiedAt?: string;
    verifiedBy?: string;
    rejectionReason?: string;
  };
  createdAt: string;
}

interface PaymentFormData {
  amount: number;
  paymentType: string;
  academicSession: string;
  term: string;
  paymentMethod: string;
  receiptFile?: File;
}

const StudentPayments: React.FC = () => {
  const [payments, setPayments] = useState<Payment[]>([]);
  const [filteredPayments, setFilteredPayments] = useState<Payment[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [sessionFilter, setSessionFilter] = useState("all");
  const [showPaymentForm, setShowPaymentForm] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  const [formData, setFormData] = useState<PaymentFormData>({
    amount: 0,
    paymentType: "school_fees",
    academicSession: "2023/2024",
    term: "first",
    paymentMethod: "bank_transfer",
  });

  useEffect(() => {
    fetchPayments();
  }, []);

  useEffect(() => {
    filterPayments();
  }, [payments, searchTerm, statusFilter, sessionFilter]);

  const fetchPayments = async () => {
    try {
      setLoading(true);
      const response = await api.get("/payments/student");
      const paymentsData = response.data.data || response.data || [];
      setPayments(paymentsData);
    } catch (error) {
      console.error("Error fetching payments:", error);
      toast.error("Failed to load payments");
    } finally {
      setLoading(false);
    }
  };

  const filterPayments = () => {
    let filtered = [...payments];

    if (searchTerm) {
      filtered = filtered.filter(
        (payment) =>
          payment.paymentType
            .toLowerCase()
            .includes(searchTerm.toLowerCase()) ||
          payment.reference.toLowerCase().includes(searchTerm.toLowerCase()) ||
          payment.academicSession
            .toLowerCase()
            .includes(searchTerm.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      filtered = filtered.filter((payment) => payment.status === statusFilter);
    }

    if (sessionFilter !== "all") {
      filtered = filtered.filter(
        (payment) => payment.academicSession === sessionFilter
      );
    }

    // Sort by most recent first
    filtered.sort(
      (a, b) =>
        new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime()
    );

    setFilteredPayments(filtered);
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case "verified":
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case "pending":
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case "rejected":
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusBadge = (status: string) => {
    const baseClasses =
      "inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium";
    switch (status) {
      case "verified":
        return `${baseClasses} bg-green-100 text-green-800`;
      case "pending":
        return `${baseClasses} bg-yellow-100 text-yellow-800`;
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

  const handleInputChange = (
    field: keyof PaymentFormData,
    value: string | number | File
  ) => {
    setFormData((prev) => ({
      ...prev,
      [field]: value,
    }));
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      if (file.size > 5 * 1024 * 1024) {
        toast.error("File size must be less than 5MB");
        return;
      }
      if (!file.type.startsWith("image/")) {
        toast.error("Please upload an image file");
        return;
      }
      handleInputChange("receiptFile", file);
    }
  };

  const handleSubmitPayment = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.receiptFile) {
      toast.error("Please upload a payment receipt");
      return;
    }

    try {
      setSubmitting(true);

      const submitData = new FormData();
      submitData.append("amount", formData.amount.toString());
      submitData.append("paymentType", formData.paymentType);
      submitData.append("academicSession", formData.academicSession);
      submitData.append("term", formData.term);
      submitData.append("paymentMethod", formData.paymentMethod);
      submitData.append("receiptImage", formData.receiptFile);

      const response = await api.post("/payments", submitData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      console.log("Payment response", response);

      toast.success("Payment submitted successfully");
      setShowPaymentForm(false);
      setFormData({
        amount: 0,
        paymentType: "school_fees",
        academicSession: "2023/2024",
        term: "first_term",
        paymentMethod: "bank_transfer",
      });
      fetchPayments();
    } catch (error) {
      console.error("Error submitting payment:", error);
      toast.error("Failed to submit payment");
    } finally {
      setSubmitting(false);
    }
  };

  const exportPayments = () => {
    if (filteredPayments.length === 0) {
      toast.error("No payments to export");
      return;
    }

    const csvContent = [
      "Reference,Type,Amount,Session,Term,Status,Date,Verified Date",
      ...filteredPayments.map((payment) =>
        [
          payment.reference,
          payment.paymentType.replace("_", " "),
          payment.amount,
          payment.academicSession,
          payment.term.replace("_", " "),
          payment.status,
          new Date(payment.paymentDate).toLocaleDateString(),
          payment.verificationDetails?.verifiedAt
            ? new Date(
                payment.verificationDetails.verifiedAt
              ).toLocaleDateString()
            : "",
        ].join(",")
      ),
    ].join("\n");

    const blob = new Blob([csvContent], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `my_payments_${new Date().toISOString().split("T")[0]}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    toast.success("Payments exported successfully");
  };

  // Get unique sessions for filters
  const uniqueSessions = Array.from(
    new Set(payments.map((p) => p.academicSession))
  );

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  return (
    <div className="px-4 sm:px-6 lg:px-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Payments</h1>
            <p className="mt-1 text-sm text-gray-500">
              Submit and track your school fee payments
            </p>
          </div>
          <div className="flex space-x-3">
            <button
              onClick={exportPayments}
              className="inline-flex items-center px-4 py-2 border border-gray-300 shadow-sm text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <Download className="h-4 w-4 mr-2" />
              Export
            </button>
            <button
              onClick={() => setShowPaymentForm(true)}
              className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
            >
              <Plus className="h-4 w-4 mr-2" />
              Submit Payment
            </button>
          </div>
        </div>
      </div>

      {/* Payment Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        {[
          {
            name: "Total Payments",
            value: payments.length,
            color: "bg-blue-500",
            icon: CreditCard,
          },
          {
            name: "Verified",
            value: payments.filter((p) => p.status === "verified").length,
            color: "bg-green-500",
            icon: CheckCircle,
          },
          {
            name: "Pending",
            value: payments.filter((p) => p.status === "pending").length,
            color: "bg-yellow-500",
            icon: Clock,
          },
          {
            name: "Total Amount",
            value: formatCurrency(
              payments
                .filter((p) => p.status === "verified")
                .reduce((sum, p) => sum + p.amount, 0)
            ),
            color: "bg-purple-500",
            icon: Receipt,
          },
        ].map((stat, index) => (
          <motion.div
            key={stat.name}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white overflow-hidden shadow rounded-lg"
          >
            <div className="p-5">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className={`${stat.color} rounded-md p-3`}>
                    <stat.icon className="h-6 w-6 text-white" />
                  </div>
                </div>
                <div className="ml-5 w-0 flex-1">
                  <dl>
                    <dt className="text-sm font-medium text-gray-500 truncate">
                      {stat.name}
                    </dt>
                    <dd className="text-lg font-medium text-gray-900">
                      {typeof stat.value === "number" &&
                      stat.name !== "Total Amount"
                        ? stat.value.toLocaleString()
                        : stat.value}
                    </dd>
                  </dl>
                </div>
              </div>
            </div>
          </motion.div>
        ))}
      </div>

      {/* Filters */}
      <div className="mb-6 bg-white shadow rounded-lg p-6">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-5 w-5" />
            <input
              type="text"
              placeholder="Search payments..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
            />
          </div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
          >
            <option value="all">All Status</option>
            <option value="verified">Verified</option>
            <option value="pending">Pending</option>
            <option value="rejected">Rejected</option>
          </select>
          <select
            value={sessionFilter}
            onChange={(e) => setSessionFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-md focus:ring-green-500 focus:border-green-500"
          >
            <option value="all">All Sessions</option>
            {uniqueSessions.map((session) => (
              <option key={session} value={session}>
                {session}
              </option>
            ))}
          </select>
          <div className="flex items-center text-sm text-gray-500">
            <Filter className="h-4 w-4 mr-1" />
            {filteredPayments.length} payment(s) found
          </div>
        </div>
      </div>

      {/* Payments List */}
      {filteredPayments.length === 0 ? (
        <div className="bg-white shadow rounded-lg p-8 text-center">
          <CreditCard className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">
            No payments found
          </h3>
          <p className="mt-1 text-sm text-gray-500">
            {payments.length === 0
              ? "You haven't made any payments yet."
              : "Try adjusting your search or filter criteria."}
          </p>
          {payments.length === 0 && (
            <div className="mt-6">
              <button
                onClick={() => setShowPaymentForm(true)}
                className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
              >
                <Plus className="h-4 w-4 mr-2" />
                Submit Your First Payment
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {filteredPayments.map((payment, index) => (
            <motion.div
              key={payment._id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white shadow rounded-lg overflow-hidden"
            >
              <div className="px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center space-x-4">
                    {getStatusIcon(payment.status)}
                    <div>
                      <h3 className="text-lg font-medium text-gray-900">
                        {payment.paymentType.replace("_", " ").toUpperCase()}
                      </h3>
                      <p className="text-sm text-gray-500">
                        Reference: {payment.reference}
                      </p>
                      <p className="text-sm text-gray-500">
                        {payment.academicSession} -{" "}
                        {payment.term.replace("_", " ")}
                      </p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-gray-900">
                      {formatCurrency(payment.amount)}
                    </p>
                    <span className={getStatusBadge(payment.status)}>
                      {payment.status.charAt(0).toUpperCase() +
                        payment.status.slice(1)}
                    </span>
                    <p className="text-sm text-gray-500 mt-1">
                      {new Date(payment.createdAt).toLocaleDateString()}
                    </p>
                  </div>
                </div>

                {/* Status Details */}
                {payment.status === "verified" &&
                  payment.verificationDetails?.verifiedAt && (
                    <div className="mt-4 p-3 bg-green-50 rounded-md">
                      <p className="text-sm text-green-800">
                        ✓ Verified on{" "}
                        {new Date(
                          payment.verificationDetails.verifiedAt
                        ).toLocaleDateString()}
                        {payment.verificationDetails.verifiedBy &&
                          ` by Admistration`}
                      </p>
                    </div>
                  )}

                {payment.status === "rejected" &&
                  payment.verificationDetails?.rejectionReason && (
                    <div className="mt-4 p-3 bg-red-50 rounded-md">
                      <p className="text-sm text-red-800 font-medium">
                        Payment Rejected
                      </p>
                      <p className="text-sm text-red-700 mt-1">
                        Reason: {payment.verificationDetails.rejectionReason}
                      </p>
                    </div>
                  )}

                {payment.status === "pending" && (
                  <div className="mt-4 p-3 bg-yellow-50 rounded-md">
                    <p className="text-sm text-yellow-800">
                      ⏳ Payment is being reviewed by the administration
                    </p>
                  </div>
                )}

                {/* Action Buttons */}
                <div className="mt-4 flex justify-between items-center">
                  <button
                    onClick={() => {
                      setSelectedPayment(payment);
                      setShowDetails(true);
                    }}
                    className="inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View Details
                  </button>
                  {payment.receiptUrl && (
                    <button
                      onClick={() => window.open(payment.receiptUrl, "_blank")}
                      className="inline-flex items-center px-3 py-2 border border-transparent text-sm leading-4 font-medium rounded-md text-green-600 bg-green-100 hover:bg-green-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
                    >
                      <Receipt className="h-4 w-4 mr-1" />
                      View Receipt
                    </button>
                  )}
                </div>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Payment Form Modal */}
      {showPaymentForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-xl shadow-2xl p-8 max-w-lg w-full max-h-[90vh] overflow-y-auto"
          >
            <div className="flex justify-between items-center mb-8">
              <div>
                <h3 className="text-xl font-semibold text-gray-900">
                  Submit Payment
                </h3>
                <p className="text-sm text-gray-500 mt-1">
                  Fill in the payment details below
                </p>
              </div>
              <button
                onClick={() => setShowPaymentForm(false)}
                className="text-gray-400 hover:text-gray-600 p-1 rounded-full hover:bg-gray-100 transition-colors"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmitPayment} className="space-y-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Type
                </label>
                <select
                  value={formData.paymentType}
                  onChange={(e) =>
                    handleInputChange("paymentType", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                >
                  <option value="school_fees">School Fees</option>
                  <option value="uniform">Uniform</option>
                  <option value="books">Books</option>
                  <option value="extracurricular">
                    Extracurricular Activities
                  </option>
                  <option value="other">Other</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Amount (₦)
                </label>
                <input
                  type="number"
                  value={formData.amount}
                  onChange={(e) =>
                    handleInputChange("amount", parseFloat(e.target.value) || 0)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  placeholder="Enter amount"
                  required
                  min="1"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Academic Session
                  </label>
                  <select
                    value={formData.academicSession}
                    onChange={(e) =>
                      handleInputChange("academicSession", e.target.value)
                    }
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  >
                    <option value="2023/2024">2023/2024</option>
                    <option value="2024/2025">2024/2025</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Term
                  </label>
                  <select
                    value={formData.term}
                    onChange={(e) => handleInputChange("term", e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                  >
                    <option value="first">First Term</option>
                    <option value="second">Second Term</option>
                    <option value="third">Third Term</option>
                  </select>
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Method
                </label>
                <select
                  value={formData.paymentMethod}
                  onChange={(e) =>
                    handleInputChange("paymentMethod", e.target.value)
                  }
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg shadow-sm focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                >
                  <option value="bank_transfer">Bank Transfer</option>
                  <option value="online">Online Payment</option>
                  <option value="cash">Cash</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Payment Receipt <span className="text-red-500">*</span>
                </label>
                <div className="mt-1 flex justify-center px-6 pt-5 pb-6 border-2 border-gray-300 border-dashed rounded-lg hover:border-green-400 transition-colors">
                  <div className="space-y-2 text-center">
                    <div className="mx-auto h-12 w-12 text-gray-400">
                      <Upload className="h-full w-full" />
                    </div>
                    <div className="flex text-sm text-gray-600">
                      <label
                        htmlFor="receipt-upload"
                        className="relative cursor-pointer bg-white rounded-md font-medium text-green-600 hover:text-green-500 focus-within:outline-none focus-within:ring-2 focus-within:ring-offset-2 focus-within:ring-green-500"
                      >
                        <span className="underline">Upload a file</span>
                        <input
                          id="receipt-upload"
                          name="receipt-upload"
                          type="file"
                          className="sr-only"
                          accept="image/*"
                          onChange={handleFileChange}
                          required
                        />
                      </label>
                      <p className="pl-1">or drag and drop</p>
                    </div>
                    <p className="text-xs text-gray-500">
                      PNG, JPG, GIF up to 5MB
                    </p>
                    {formData.receiptFile && (
                      <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded-md">
                        <p className="text-sm text-green-700 font-medium flex items-center">
                          <CheckCircle className="h-4 w-4 mr-2" />
                          {formData.receiptFile.name}
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              </div>

              <div className="flex justify-end space-x-3 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => setShowPaymentForm(false)}
                  className="px-6 py-2 text-gray-700 bg-gray-100 border border-gray-300 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500 transition-colors font-medium"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="px-6 py-2 bg-green-600 text-white border border-transparent rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center font-medium"
                >
                  {submitting ? (
                    <>
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                      Submitting...
                    </>
                  ) : (
                    <>
                      <Upload className="h-4 w-4 mr-2" />
                      Submit Payment
                    </>
                  )}
                </button>
              </div>
            </form>
          </motion.div>
        </div>
      )}

      {/* Payment Details Modal */}
      {showDetails && selectedPayment && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-white rounded-lg p-6 max-w-md w-full"
          >
            <div className="flex justify-between items-center mb-6">
              <h3 className="text-lg font-semibold text-gray-900">
                Payment Details
              </h3>
              <button
                onClick={() => setShowDetails(false)}
                className="text-gray-400 hover:text-gray-600"
              >
                <XCircle className="h-6 w-6" />
              </button>
            </div>

            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium text-gray-500">
                  Reference
                </label>
                <p className="text-gray-900 font-mono text-sm">
                  {selectedPayment.reference}
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
                {" "}
                <label className="text-sm font-medium text-gray-500">
                  Payment Type
                </label>
                <p className="text-gray-900 capitalize">
                  {selectedPayment.paymentType.replace("_", " ")}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">
                  Academic Session
                </label>
                <p className="text-gray-900">
                  {selectedPayment.academicSession}
                </p>
              </div>

              <div>
                <label className="text-sm font-medium text-gray-500">
                  Term
                </label>
                <p className="text-gray-900 capitalize">
                  {selectedPayment.term.replace("_", " ")}
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
                  {selectedPayment.verificationDetails.verifiedBy && (
                    <p className="text-sm text-gray-500">by Administration</p>
                  )}
                </div>
              )}

              {selectedPayment.verificationDetails?.rejectionReason && (
                <div>
                  <label className="text-sm font-medium text-gray-500">
                    Rejection Reason
                  </label>
                  <p className="text-red-600">
                    {selectedPayment.verificationDetails.rejectionReason}
                  </p>
                </div>
              )}
            </div>

            <div className="flex justify-end space-x-3 mt-6">
              <button
                onClick={() => setShowDetails(false)}
                className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
              >
                Close
              </button>
              {selectedPayment.receiptUrl && (
                <button
                  onClick={() =>
                    window.open(selectedPayment.receiptUrl, "_blank")
                  }
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors flex items-center"
                >
                  <Receipt className="h-4 w-4 mr-2" />
                  View Receipt
                </button>
              )}
            </div>
          </motion.div>
        </div>
      )}
    </div>
  );
};

export default StudentPayments;
