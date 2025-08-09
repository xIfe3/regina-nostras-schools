import { Response } from "express";
import crypto from "crypto";
import User from "../models/User";
import Student from "../models/Student";
import AdminProfile from "../models/AdminProfile";
import Result from "../models/Result";
import Payment from "../models/Payment";
import { AuthRequest } from "../middleware/auth";
import { sendEmail } from "../utils/email";
import { uploadFile } from "../utils/cloudinary";
import { ActivityLogger } from "../utils/activityLogger.js";

// @desc    Get all students
// @route   GET /api/admin/students
// @access  Private/Admin
export const getStudents = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query?.page as string) || 1;
    const limit = parseInt(req.query?.limit as string) || 10;
    const search = req.query?.search as string;
    const class_ = req.query?.class as string;
    const status = req.query?.status as string;

    let query: any = {};

    if (search) {
      query.$or = [
        { "personalInfo.firstName": { $regex: search, $options: "i" } },
        { "personalInfo.lastName": { $regex: search, $options: "i" } },
        { studentId: { $regex: search, $options: "i" } },
        { "contactInfo.email": { $regex: search, $options: "i" } },
      ];
    }

    if (class_) {
      query["academicInfo.currentClass"] = class_;
    }

    if (status) {
      query["academicInfo.status"] = status;
    }

    const skip = (page - 1) * limit;

    const students = await Student.find(query)
      .populate("userId", "email isActive lastLogin")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Student.countDocuments(query);

    res.status(200).json({
      success: true,
      data: students,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalStudents: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Get students error:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting students",
    });
  }
};

// @desc    Get single student
// @route   GET /api/admin/students/:id
// @access  Private/Admin
export const getStudent = async (req: AuthRequest, res: Response) => {
  try {
    const student = await Student.findById(req.params.id).populate(
      "userId",
      "email isActive lastLogin createdAt"
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    console.error("Get student error:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting student",
    });
  }
};

// @desc    Create new student
// @route   POST /api/admin/students
// @access  Private/Admin
export const createStudent = async (req: AuthRequest, res: Response) => {
  try {
    console.log("Request body:", req.body);
    console.log("Request files:", req.file);

    // Parse student data from form data
    let studentData;
    try {
      studentData = JSON.parse(req.body.studentData || "{}");
    } catch (error) {
      // If JSON parsing fails, try to construct from flat structure
      studentData = {
        personalInfo: {
          firstName: req.body.firstName,
          lastName: req.body.lastName,
          dateOfBirth: req.body.dateOfBirth,
          medicalInfo: req.body.medicalInfo || "",
        },
        contactInfo: {
          email: req.body.email,
          phone: req.body.phone || "",
          address: req.body.address || "",
        },
        parentInfo: {
          name: req.body.parentName || "",
          phone: req.body.parentPhone || "",
          email: req.body.parentEmail || "",
        },
        academicInfo: {
          currentClass: req.body.class,
          status: "active",
        },
      };
    }

    console.log("Parsed student data:", studentData);

    // Validate required fields
    if (
      !studentData.personalInfo?.firstName ||
      !studentData.personalInfo?.lastName ||
      !studentData.contactInfo?.email ||
      !studentData.academicInfo?.currentClass
    ) {
      return res.status(400).json({
        success: false,
        message:
          "Missing required fields: firstName, lastName, email, and class are required",
      });
    }

    // Check if email already exists
    const existingUser = await User.findOne({
      email: studentData.contactInfo.email,
    });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: "Email already exists",
      });
    }

    // Handle profile picture upload
    let profilePictureUrl = "";
    if (req.file) {
      try {
        // With CloudinaryStorage, the file is already uploaded to Cloudinary
        // req.file.path contains the Cloudinary URL
        profilePictureUrl = req.file.path;
      } catch (uploadError) {
        console.error("Profile picture upload error:", uploadError);
        // Continue without profile picture if upload fails
      }
    }

    // Generate random password
    const password = crypto.randomBytes(8).toString("hex");

    // Create user account
    const user = await User.create({
      email: studentData.contactInfo.email,
      password,
      role: "student",
    });

    // Add profile picture URL to student data
    if (profilePictureUrl) {
      studentData.personalInfo.profilePhoto = profilePictureUrl;
    }

    // Create student profile
    const student = await Student.create({
      userId: user._id,
      ...studentData,
    });

    // Log student creation activity
    await ActivityLogger.logStudentActivity(req.user!._id, "student_added", {
      name: `${student.personalInfo.firstName} ${student.personalInfo.lastName}`,
      className: student.academicInfo.currentClass,
      studentId: student._id,
    });

    // Send welcome email with login credentials
    await sendEmail({
      to: user.email,
      subject: "Welcome to Regina Nostras Schools - Student Portal",
      html: `
        <h2>Welcome to Regina Nostras Schools Student Portal</h2>
        <p>Dear ${student.personalInfo.firstName} ${student.personalInfo.lastName},</p>
        <p>Your student account has been created successfully. Here are your login credentials:</p>
        <p><strong>Email:</strong> ${user.email}</p>
        <p><strong>Password:</strong> ${password}</p>
        <p><strong>Student ID:</strong> ${student.studentId}</p>
        <p>Please login to the student portal and change your password immediately for security reasons.</p>
        <p>Portal URL: ${process.env.FRONTEND_URL}/student/login</p>
        <br>
        <p>Best regards,<br>Regina Nostras Schools Administration</p>
      `,
    });

    res.status(201).json({
      success: true,
      message: "Student created successfully. Login credentials sent to email.",
      data: {
        student,
        temporaryPassword: password,
      },
    });
  } catch (error) {
    console.error("Create student error:", error);
    res.status(500).json({
      success: false,
      message: "Server error creating student",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// @desc    Update student
// @route   PUT /api/admin/students/:id
// @access  Private/Admin
export const updateStudent = async (req: AuthRequest, res: Response) => {
  try {
    // Check if student exists first
    const existingStudent = await Student.findById(req.params.id);
    if (!existingStudent) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    let updateData: any = {};

    // Handle FormData (when profile image is included) vs JSON (when only data is updated)
    if (req.body.studentData) {
      // FormData case - parse the JSON string
      try {
        updateData = JSON.parse(req.body.studentData);
      } catch (parseError) {
        return res.status(400).json({
          success: false,
          message: "Invalid student data format",
        });
      }
    } else {
      // Direct JSON case
      updateData = req.body;
    }

    // Handle profile image upload if present
    if (req.file) {
      try {
        // With CloudinaryStorage, the file is already uploaded to Cloudinary
        // req.file.path contains the Cloudinary URL
        if (!updateData.personalInfo) {
          updateData.personalInfo = {};
        }
        updateData.personalInfo.profilePhoto = req.file.path;
      } catch (uploadError) {
        console.error("Profile picture upload error:", uploadError);
        // Continue with update even if image upload fails
      }
    }

    // Validate required fields
    if (updateData.personalInfo) {
      if (
        !updateData.personalInfo.firstName ||
        !updateData.personalInfo.lastName
      ) {
        return res.status(400).json({
          success: false,
          message: "First name and last name are required",
        });
      }
    }

    if (updateData.contactInfo && updateData.contactInfo.email) {
      // Check if email is being changed and if it already exists
      if (updateData.contactInfo.email !== existingStudent.contactInfo.email) {
        const existingUser = await User.findOne({
          email: updateData.contactInfo.email,
          _id: { $ne: existingStudent.userId }, // Exclude current user
        });
        if (existingUser) {
          return res.status(400).json({
            success: false,
            message: "Email already exists",
          });
        }

        // Update the associated user's email
        await User.findByIdAndUpdate(existingStudent.userId, {
          email: updateData.contactInfo.email,
        });
      }
    }

    // Update student record
    const updatedStudent = await Student.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    ).populate("userId", "email isActive lastLogin");

    // Log student update activity
    await ActivityLogger.logStudentActivity(req.user!._id, "student_updated", {
      name: `${updatedStudent!.personalInfo.firstName} ${
        updatedStudent!.personalInfo.lastName
      }`,
      className: updatedStudent!.academicInfo.currentClass,
      studentId: updatedStudent!._id,
    });

    res.status(200).json({
      success: true,
      message: "Student updated successfully",
      data: updatedStudent,
    });
  } catch (error) {
    console.error("Update student error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating student",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// @desc    Delete student
// @route   DELETE /api/admin/students/:id
// @access  Private/Admin
export const deleteStudent = async (req: AuthRequest, res: Response) => {
  try {
    const student = await Student.findById(req.params.id);

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student not found",
      });
    }

    // Delete associated user account
    await User.findByIdAndDelete(student.userId);

    // Delete student record
    await Student.findByIdAndDelete(req.params.id);

    res.status(200).json({
      success: true,
      message: "Student deleted successfully",
    });
  } catch (error) {
    console.error("Delete student error:", error);
    res.status(500).json({
      success: false,
      message: "Server error deleting student",
    });
  }
};

// @desc    Upload multiple results
// @route   POST /api/admin/results/bulk-upload
// @access  Private/Admin
export const bulkUploadResults = async (req: AuthRequest, res: Response) => {
  try {
    const { results, academicSession, term, class: className } = req.body;

    if (!results || !Array.isArray(results) || results.length === 0) {
      return res.status(400).json({
        success: false,
        message: "Results array is required",
      });
    }

    const uploadedResults = [];
    const errors = [];

    for (let i = 0; i < results.length; i++) {
      try {
        const resultData = results[i];

        // Find student by student ID
        const student = await Student.findOne({
          studentId: resultData.studentId,
        });
        if (!student) {
          errors.push(
            `Row ${i + 1}: Student with ID ${resultData.studentId} not found`
          );
          continue;
        }

        // Check if result already exists
        const existingResult = await Result.findOne({
          studentId: student._id,
          academicSession,
          term,
        });

        if (existingResult) {
          errors.push(
            `Row ${i + 1}: Result already exists for student ${
              resultData.studentId
            } in ${academicSession} ${term} term`
          );
          continue;
        }

        // Create result
        const result = await Result.create({
          studentId: student._id,
          academicSession,
          term,
          class: className,
          publishedBy: req.user!._id,
          ...resultData,
        });

        uploadedResults.push(result);
      } catch (error) {
        errors.push(`Row ${i + 1}: ${(error as Error).message}`);
      }
    }

    res.status(200).json({
      success: true,
      message: `Bulk upload completed. ${uploadedResults.length} results uploaded successfully.`,
      data: {
        uploadedCount: uploadedResults.length,
        errorCount: errors.length,
        errors: errors.length > 0 ? errors : undefined,
        uploadedResults,
      },
    });
  } catch (error) {
    console.error("Bulk upload results error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during bulk upload",
    });
  }
};

// @desc    Get all payments for verification
// @route   GET /api/admin/payments
// @access  Private/Admin
export const getPayments = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query?.page as string) || 1;
    const limit = parseInt(req.query?.limit as string) || 10;
    const status = req.query?.status as string;
    const paymentType = req.query?.paymentType as string;

    let query: any = {};

    if (status) {
      query.status = status;
    }

    if (paymentType) {
      query.paymentType = paymentType;
    }

    const skip = (page - 1) * limit;

    const payments = await Payment.find(query)
      .populate({
        path: "studentId",
        select:
          "studentId personalInfo.firstName personalInfo.lastName academicInfo.currentClass",
      })
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
    console.error("Get payments error:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting payments",
    });
  }
};

// @desc    Verify payment
// @route   PUT /api/admin/payments/:id/verify
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
        </ul>
        <p>Thank you for your payment.</p>
        <br>
        <p>Best regards,<br>Regina Nostras Schools Administration</p>
      `,
    });

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
// @route   PUT /api/admin/payments/:id/reject
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

// @desc    Get dashboard statistics
// @route   GET /api/admin/dashboard/stats
// @access  Private/Admin
export const getDashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    // Get total counts
    const totalStudents = await Student.countDocuments({
      "academicInfo.status": "active",
    });

    const totalResults = await Result.countDocuments();

    const pendingPayments = await Payment.countDocuments({
      status: "pending",
    });

    const totalPayments = await Payment.countDocuments();
    const verifiedPayments = await Payment.countDocuments({
      status: "verified",
    });

    // Get recent activities (last 30 days)
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const recentStudents = await Student.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    const recentResults = await Result.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    const recentPayments = await Payment.countDocuments({
      createdAt: { $gte: thirtyDaysAgo },
    });

    // Get class distribution
    const classDistribution = await Student.aggregate([
      {
        $match: { "academicInfo.status": "active" },
      },
      {
        $group: {
          _id: "$academicInfo.currentClass",
          count: { $sum: 1 },
        },
      },
      {
        $sort: { _id: 1 },
      },
    ]);

    // Get payment statistics
    const paymentStats = await Payment.aggregate([
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
      data: {
        overview: {
          totalStudents,
          totalResults,
          pendingPayments,
          totalPayments,
          verifiedPayments,
          paymentVerificationRate:
            totalPayments > 0
              ? Math.round((verifiedPayments / totalPayments) * 100)
              : 0,
        },
        recentActivity: {
          recentStudents,
          recentResults,
          recentPayments,
        },
        classDistribution,
        paymentStats,
      },
    });
  } catch (error) {
    console.error("Get dashboard stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting dashboard statistics",
    });
  }
};

// @desc    Get admin profile
// @route   GET /api/admin/profile
// @access  Private/Admin
export const getAdminProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;

    // Get user data
    const userData = await User.findById(user._id).select("-password");
    if (!userData) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // Get or create admin profile
    let adminProfile = await AdminProfile.findOne({ userId: user._id });
    if (!adminProfile) {
      adminProfile = await AdminProfile.create({
        userId: user._id,
        permissions: [
          "read_students",
          "write_students",
          "read_results",
          "write_results",
          "read_payments",
          "write_payments",
          "read_analytics",
          "system_settings",
        ],
      });
    }

    // Combine user data and profile data
    const profileData = {
      _id: userData._id,
      email: userData.email,
      role: userData.role,
      isActive: userData.isActive,
      lastLogin: userData.lastLogin,
      createdAt: userData.createdAt,
      firstName: adminProfile.firstName,
      lastName: adminProfile.lastName,
      phoneNumber: adminProfile.phoneNumber,
      address: adminProfile.address,
      profilePhoto: adminProfile.profilePhoto,
      permissions: adminProfile.permissions,
      bio: adminProfile.bio,
      department: adminProfile.department,
      position: adminProfile.position,
      emergencyContact: adminProfile.emergencyContact,
    };

    res.status(200).json({
      success: true,
      data: profileData,
    });
  } catch (error) {
    console.error("Get admin profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting admin profile",
    });
  }
};

// @desc    Update admin profile
// @route   PUT /api/admin/profile
// @access  Private/Admin
export const updateAdminProfile = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const {
      firstName,
      lastName,
      phoneNumber,
      address,
      bio,
      department,
      position,
      emergencyContact,
    } = req.body;

    // Validate input
    if (firstName && firstName.length > 50) {
      return res.status(400).json({
        success: false,
        message: "First name cannot exceed 50 characters",
      });
    }

    if (lastName && lastName.length > 50) {
      return res.status(400).json({
        success: false,
        message: "Last name cannot exceed 50 characters",
      });
    }

    if (phoneNumber && !/^[\+]?[1-9][\d]{0,15}$/.test(phoneNumber)) {
      return res.status(400).json({
        success: false,
        message: "Please enter a valid phone number",
      });
    }

    if (address && address.length > 200) {
      return res.status(400).json({
        success: false,
        message: "Address cannot exceed 200 characters",
      });
    }

    if (bio && bio.length > 500) {
      return res.status(400).json({
        success: false,
        message: "Bio cannot exceed 500 characters",
      });
    }

    // Get or create admin profile
    let adminProfile = await AdminProfile.findOne({ userId: user._id });
    if (!adminProfile) {
      adminProfile = await AdminProfile.create({
        userId: user._id,
        permissions: [
          "read_students",
          "write_students",
          "read_results",
          "write_results",
          "read_payments",
          "write_payments",
          "read_analytics",
          "system_settings",
        ],
      });
    }

    // Update profile fields
    const updateData: any = {};
    if (firstName !== undefined) updateData.firstName = firstName;
    if (lastName !== undefined) updateData.lastName = lastName;
    if (phoneNumber !== undefined) updateData.phoneNumber = phoneNumber;
    if (address !== undefined) updateData.address = address;
    if (bio !== undefined) updateData.bio = bio;
    if (department !== undefined) updateData.department = department;
    if (position !== undefined) updateData.position = position;
    if (emergencyContact !== undefined)
      updateData.emergencyContact = emergencyContact;

    // Update the profile
    const updatedProfile = await AdminProfile.findByIdAndUpdate(
      adminProfile._id,
      updateData,
      { new: true, runValidators: true }
    );

    // Get user data for complete response
    const userData = await User.findById(user._id).select("-password");

    // Combine user data and profile data
    const profileData = {
      _id: userData!._id,
      email: userData!.email,
      role: userData!.role,
      isActive: userData!.isActive,
      lastLogin: userData!.lastLogin,
      createdAt: userData!.createdAt,
      firstName: updatedProfile!.firstName,
      lastName: updatedProfile!.lastName,
      phoneNumber: updatedProfile!.phoneNumber,
      address: updatedProfile!.address,
      profilePhoto: updatedProfile!.profilePhoto,
      permissions: updatedProfile!.permissions,
      bio: updatedProfile!.bio,
      department: updatedProfile!.department,
      position: updatedProfile!.position,
      emergencyContact: updatedProfile!.emergencyContact,
    };

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: profileData,
    });
  } catch (error) {
    console.error("Update admin profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating admin profile",
    });
  }
};

// @desc    Upload admin profile photo
// @route   POST /api/admin/profile/photo
// @access  Private/Admin
export const uploadAdminProfilePhoto = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const user = req.user!;

    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a photo file",
      });
    }

    // Validate file type
    const allowedTypes = ["image/jpeg", "image/png", "image/gif", "image/webp"];
    if (!allowedTypes.includes(req.file.mimetype)) {
      return res.status(400).json({
        success: false,
        message: "Please upload a valid image file (JPEG, PNG, GIF, WEBP)",
      });
    }

    // Validate file size (5MB limit)
    if (req.file.size > 5 * 1024 * 1024) {
      return res.status(400).json({
        success: false,
        message: "File size should be less than 5MB",
      });
    }

    // Use the Cloudinary upload result directly
    const photoUrl = (req.file as any).path; // Cloudinary provides the URL in the path field

    // Get or create admin profile
    let adminProfile = await AdminProfile.findOne({ userId: user._id });
    if (!adminProfile) {
      adminProfile = await AdminProfile.create({
        userId: user._id,
        profilePhoto: photoUrl,
        permissions: [
          "read_students",
          "write_students",
          "read_results",
          "write_results",
          "read_payments",
          "write_payments",
          "read_analytics",
          "system_settings",
        ],
      });
    } else {
      adminProfile.profilePhoto = photoUrl;
      await adminProfile.save();
    }

    res.status(200).json({
      success: true,
      message: "Profile photo updated successfully",
      photoUrl,
    });
  } catch (error) {
    console.error("Upload admin profile photo error:", error);
    res.status(500).json({
      success: false,
      message: "Server error uploading profile photo",
    });
  }
};

// @desc    Change admin password
// @route   PUT /api/admin/password
// @access  Private/Admin
export const changeAdminPassword = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const { currentPassword, newPassword } = req.body;

    if (!currentPassword || !newPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide current password and new password",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long",
      });
    }

    // Get user with password
    const userData = await User.findById(user._id).select("+password");
    if (!userData || !(await userData.comparePassword(currentPassword))) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    // Update password
    userData.password = newPassword;
    await userData.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change admin password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error changing password",
    });
  }
};
