import { Response } from "express";
import Payment from "../models/Payment.js";
import Student from "../models/Student.js";
import { AuthRequest } from "../middleware/auth.js";
import { sendEmail } from "../utils/email.js";

// @desc    Get student payments
// @route   GET /api/payments/student
// @access  Private/Student
export const getStudentPayments = async (req: AuthRequest, res: Response) => {
  try {
    const student = await Student.findOne({ userId: req.user!._id });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    const page = parseInt(req.query?.page as string) || 1;
    const limit = parseInt(req.query?.limit as string) || 10;
    const status = req.query?.status as string;
    const academicSession = req.query?.academicSession as string;
    const term = req.query?.term as string;

    let query: any = { studentId: student._id };

    if (status) {
      query.status = status;
    }

    if (academicSession) {
      query.academicSession = academicSession;
    }

    if (term) {
      query.term = term;
    }

    const skip = (page - 1) * limit;

    const payments = await Payment.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Payment.countDocuments(query);

    res.status(200).json({
      success: true,
      data: payments,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPayments: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Get student payments error:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting payments",
    });
  }
};

// @desc    Submit payment receipt
// @route   POST /api/payments
// @access  Private/Student
export const submitPayment = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a receipt image",
      });
    }

    const student = await Student.findOne({ userId: req.user!._id });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    // Check if payment already exists for the same session, term, and type
    const existingPayment = await Payment.findOne({
      studentId: student._id,
      academicSession: req.body.academicSession,
      term: req.body.term,
      paymentType: req.body.paymentType,
      status: { $in: ["pending", "verified"] },
    });

    if (existingPayment) {
      return res.status(400).json({
        success: false,
        message: "A payment for this session, term, and type already exists",
      });
    }

    // Create payment record with file URL (assuming multer with cloudinary is configured)
    const payment = await Payment.create({
      studentId: student._id,
      academicSession: req.body.academicSession,
      term: req.body.term,
      paymentType: req.body.paymentType,
      amount: req.body.amount,
      currency: req.body.currency || "NGN",
      paymentMethod: req.body.paymentMethod,
      transactionReference: req.body.transactionReference,
      bankDetails: req.body.bankDetails,
      receiptDetails: {
        receiptNumber: req.body.receiptNumber,
        receiptImage: req.file.path, // This would be the cloudinary URL
        description: req.body.description,
      },
    });

    res.status(201).json({
      success: true,
      message: "Payment receipt submitted successfully. Awaiting verification.",
      data: payment,
    });
  } catch (error) {
    console.error("Submit payment error:", error);
    res.status(500).json({
      success: false,
      message: "Server error submitting payment",
    });
  }
};

// @desc    Get single payment
// @route   GET /api/payments/:id
// @access  Private/Student
export const getPayment = async (req: AuthRequest, res: Response) => {
  try {
    const student = await Student.findOne({ userId: req.user!._id });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    const payment = await Payment.findOne({
      _id: req.params.id,
      studentId: student._id,
    }).populate("verificationDetails.verifiedBy", "email");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    res.status(200).json({
      success: true,
      data: payment,
    });
  } catch (error) {
    console.error("Get payment error:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting payment",
    });
  }
};

// @desc    Get all payments for admin
// @route   GET /api/payments/admin
// @access  Private/Admin
export const getAllPayments = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query?.page as string) || 1;
    const limit = parseInt(req.query?.limit as string) || 10;
    const status = req.query?.status as string;
    const paymentType = req.query?.paymentType as string;
    const academicSession = req.query?.academicSession as string;
    const term = req.query?.term as string;

    let query: any = {};

    if (status) {
      query.status = status;
    }

    if (paymentType) {
      query.paymentType = paymentType;
    }

    if (academicSession) {
      query.academicSession = academicSession;
    }

    if (term) {
      query.term = term;
    }

    const skip = (page - 1) * limit;

    const payments = await Payment.find(query)
      .populate({
        path: "studentId",
        select:
          "studentId personalInfo.firstName personalInfo.lastName academicInfo.currentClass contactInfo.email",
      })
      .populate("verificationDetails.verifiedBy", "email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Payment.countDocuments(query);

    // Get payment statistics
    const statistics = await Payment.aggregate([
      { $match: query },
      {
        $group: {
          _id: "$status",
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: payments,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalPayments: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
      statistics,
    });
  } catch (error) {
    console.error("Get all payments error:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting payments",
    });
  }
};

// @desc    Verify payment
// @route   PUT /api/payments/:id/verify
// @access  Private/Admin
export const verifyPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { verificationNotes } = req.body;

    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      {
        status: "verified",
        verificationDetails: {
          verifiedBy: req.user!._id,
          verifiedAt: new Date(),
          verificationNotes,
        },
      },
      { new: true }
    ).populate("studentId", "personalInfo contactInfo");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // Send confirmation email to student
    try {
      const student = payment.studentId as any;
      await sendEmail({
        to: student.contactInfo.email,
        subject: "Payment Verified - Regina Nostras Schools",
        html: `
          <h2>Payment Verification Confirmation</h2>
          <p>Dear ${student.personalInfo.firstName} ${
          student.personalInfo.lastName
        },</p>
          <p>Your payment has been verified successfully.</p>
          <p><strong>Payment Details:</strong></p>
          <ul>
            <li>Amount: ₦${payment.amount.toLocaleString()}</li>
            <li>Payment Type: ${payment.paymentType
              .replace("_", " ")
              .toUpperCase()}</li>
            <li>Academic Session: ${payment.academicSession}</li>
            <li>Term: ${payment.term.toUpperCase()}</li>
            <li>Verified Date: ${new Date().toLocaleDateString()}</li>
          </ul>
          ${
            verificationNotes
              ? `<p><strong>Notes:</strong> ${verificationNotes}</p>`
              : ""
          }
          <p>Thank you for your payment.</p>
          <br>
          <p>Best regards,<br>Regina Nostras Schools Administration</p>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send payment verification email:", emailError);
      // Don't fail the entire operation if email fails
    }

    res.status(200).json({
      success: true,
      message: "Payment verified successfully",
      data: payment,
    });
  } catch (error) {
    console.error("Verify payment error:", error);
    res.status(500).json({
      success: false,
      message: "Server error verifying payment",
    });
  }
};

// @desc    Reject payment
// @route   PUT /api/payments/:id/reject
// @access  Private/Admin
export const rejectPayment = async (req: AuthRequest, res: Response) => {
  try {
    const { rejectionReason } = req.body;

    if (!rejectionReason) {
      return res.status(400).json({
        success: false,
        message: "Rejection reason is required",
      });
    }

    const payment = await Payment.findByIdAndUpdate(
      req.params.id,
      {
        status: "rejected",
        rejectionReason,
      },
      { new: true }
    ).populate("studentId", "personalInfo contactInfo");

    if (!payment) {
      return res.status(404).json({
        success: false,
        message: "Payment not found",
      });
    }

    // Send rejection email to student
    try {
      const student = payment.studentId as any;
      await sendEmail({
        to: student.contactInfo.email,
        subject: "Payment Rejected - Regina Nostras Schools",
        html: `
          <h2>Payment Rejection Notice</h2>
          <p>Dear ${student.personalInfo.firstName} ${
          student.personalInfo.lastName
        },</p>
          <p>Unfortunately, your payment submission has been rejected.</p>
          <p><strong>Rejection Reason:</strong> ${rejectionReason}</p>
          <p><strong>Payment Details:</strong></p>
          <ul>
            <li>Amount: ₦${payment.amount.toLocaleString()}</li>
            <li>Payment Type: ${payment.paymentType
              .replace("_", " ")
              .toUpperCase()}</li>
            <li>Academic Session: ${payment.academicSession}</li>
            <li>Term: ${payment.term.toUpperCase()}</li>
          </ul>
          <p>Please correct the issue and resubmit your payment.</p>
          <br>
          <p>Best regards,<br>Regina Nostras Schools Administration</p>
        `,
      });
    } catch (emailError) {
      console.error("Failed to send payment rejection email:", emailError);
      // Don't fail the entire operation if email fails
    }

    res.status(200).json({
      success: true,
      message: "Payment rejected successfully",
      data: payment,
    });
  } catch (error) {
    console.error("Reject payment error:", error);
    res.status(500).json({
      success: false,
      message: "Server error rejecting payment",
    });
  }
};

// @desc    Get payment statistics
// @route   GET /api/payments/statistics
// @access  Private/Admin
export const getPaymentStatistics = async (req: AuthRequest, res: Response) => {
  try {
    const { academicSession, term } = req.query;

    let matchQuery: any = {};

    if (academicSession) {
      matchQuery.academicSession = academicSession;
    }

    if (term) {
      matchQuery.term = term;
    }

    const statistics = await Payment.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: {
            status: "$status",
            paymentType: "$paymentType",
          },
          count: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
        },
      },
      {
        $group: {
          _id: "$_id.status",
          payments: {
            $push: {
              type: "$_id.paymentType",
              count: "$count",
              amount: "$totalAmount",
            },
          },
          totalCount: { $sum: "$count" },
          totalAmount: { $sum: "$totalAmount" },
        },
      },
    ]);

    // Overall statistics
    const overallStats = await Payment.aggregate([
      { $match: matchQuery },
      {
        $group: {
          _id: null,
          totalPayments: { $sum: 1 },
          totalAmount: { $sum: "$amount" },
          verifiedCount: {
            $sum: { $cond: [{ $eq: ["$status", "verified"] }, 1, 0] },
          },
          pendingCount: {
            $sum: { $cond: [{ $eq: ["$status", "pending"] }, 1, 0] },
          },
          rejectedCount: {
            $sum: { $cond: [{ $eq: ["$status", "rejected"] }, 1, 0] },
          },
        },
      },
    ]);

    res.status(200).json({
      success: true,
      data: {
        byStatus: statistics,
        overall: overallStats[0] || {
          totalPayments: 0,
          totalAmount: 0,
          verifiedCount: 0,
          pendingCount: 0,
          rejectedCount: 0,
        },
      },
    });
  } catch (error) {
    console.error("Get payment statistics error:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting payment statistics",
    });
  }
};

// @desc    Export payments to CSV
// @route   GET /api/payments/export
// @access  Private/Admin
export const exportPayments = async (req: AuthRequest, res: Response) => {
  try {
    const { status, paymentType, academicSession, term } = req.query;

    let query: any = {};

    if (status) {
      query.status = status;
    }

    if (paymentType) {
      query.paymentType = paymentType;
    }

    if (academicSession) {
      query.academicSession = academicSession;
    }

    if (term) {
      query.term = term;
    }

    const payments = await Payment.find(query)
      .populate({
        path: "studentId",
        select:
          "studentId personalInfo.firstName personalInfo.lastName academicInfo.currentClass contactInfo.email",
      })
      .sort({ createdAt: -1 });

    // Create CSV content
    const headers = [
      "Student Name",
      "Admission Number",
      "Class",
      "Email",
      "Amount",
      "Payment Type",
      "Academic Session",
      "Term",
      "Status",
      "Payment Method",
      "Transaction Reference",
      "Receipt Number",
      "Payment Date",
      "Verification Date",
      "Verified By",
    ];

    const csvRows = payments.map((payment: any) => {
      const student = payment.studentId || {};
      return [
        `"${student.personalInfo?.firstName || "N/A"} ${
          student.personalInfo?.lastName || "N/A"
        }"`,
        student.studentId || "N/A",
        student.academicInfo?.currentClass || "N/A",
        student.contactInfo?.email || "N/A",
        payment.amount || 0,
        payment.paymentType || "N/A",
        payment.academicSession || "N/A",
        payment.term || "N/A",
        payment.status || "N/A",
        payment.paymentMethod || "N/A",
        payment.transactionReference || "N/A",
        payment.receiptDetails?.receiptNumber || "N/A",
        payment.createdAt
          ? new Date(payment.createdAt).toLocaleDateString()
          : "N/A",
        payment.verificationDetails?.verifiedAt
          ? new Date(
              payment.verificationDetails.verifiedAt
            ).toLocaleDateString()
          : "N/A",
        payment.verificationDetails?.verifiedBy || "N/A",
      ].join(",");
    });

    const csvContent = [headers.join(","), ...csvRows].join("\n");

    // Set response headers for CSV download
    res.setHeader("Content-Type", "text/csv");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="payments_export_${
        new Date().toISOString().split("T")[0]
      }.csv"`
    );

    res.send(csvContent);
  } catch (error) {
    console.error("Export payments error:", error);
    res.status(500).json({
      success: false,
      message: "Server error exporting payments",
    });
  }
};
