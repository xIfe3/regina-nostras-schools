import { Response } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User";
import Student from "../models/Student";
import Parent from "../models/Parent";
import { checkPortalAccess } from "../utils/settings";
import { AuthRequest } from "../middleware/auth";
import { sendEmail } from "../utils/email";
import { ActivityLogger } from "../utils/activityLogger.js";
import { passwordResetEmail } from "../utils/emailTemplates.js";

// Generate JWT Token
const generateToken = (id: string) => {
  return jwt.sign({ id }, process.env.JWT_SECRET!, {
    expiresIn: "7d",
  });
};

// @desc    Login user
// @route   POST /api/auth/login
// @access  Public
export const login = async (req: AuthRequest, res: Response) => {
  try {
    const { email, password } = req.body;

    // Validate email and password
    if (!email || !password) {
      return res.status(400).json({
        success: false,
        message: "Please provide email and password",
      });
    }

    // Check for user
    const user = await User.findOne({ email }).select("+password");
    if (!user || !(await user.comparePassword(password))) {
      return res.status(401).json({
        success: false,
        message: "Invalid credentials",
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated. Please contact administrator.",
      });
    }

    // Maintenance mode / role logins switched off (admins are never blocked)
    const denied = await checkPortalAccess(user.role);
    if (denied) {
      return res.status(403).json({
        success: false,
        code: denied.code,
        message: denied.message,
      });
    }

    // Update last login
    user.lastLogin = new Date();
    await user.save();

    // Log login activity
    await ActivityLogger.logAuthActivity(
      user._id,
      "user_login",
      user.email,
      req
    );

    // Generate token
    const token = generateToken(user._id);

    // Get additional user data based on role
    let userData: any = {
      _id: user._id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
      lastLogin: user.lastLogin,
    };

    if (user.role === "student") {
      const student = await Student.findOne({ userId: user._id });
      userData.student = student;
    }

    if (user.role === "parent") {
      const parent = await Parent.findOne({ userId: user._id }).populate(
        "children",
        "studentId personalInfo.firstName personalInfo.lastName personalInfo.profilePhoto academicInfo.currentClass academicInfo.classArm academicInfo.status"
      );
      userData.parent = parent
        ? {
            _id: parent._id,
            name: parent.name,
            phoneNumber: parent.phoneNumber,
            children: parent.children,
          }
        : null;
    }

    res.status(200).json({
      success: true,
      token,
      user: userData,
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during login",
    });
  }
};

// @desc    Get current logged in user
// @route   GET /api/auth/me
// @access  Private
export const getMe = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;

    let userData: any = {
      _id: user!._id,
      email: user!.email,
      role: user!.role,
      isActive: user!.isActive,
      lastLogin: user!.lastLogin,
    };

    if (user!.role === "student") {
      const student = await Student.findOne({ userId: user!._id });
      userData.student = student;
    }

    if (user!.role === "parent") {
      const parent = await Parent.findOne({ userId: user!._id }).populate(
        "children",
        "studentId personalInfo.firstName personalInfo.lastName personalInfo.profilePhoto academicInfo.currentClass academicInfo.classArm academicInfo.status"
      );
      userData.parent = parent
        ? {
            _id: parent._id,
            name: parent.name,
            phoneNumber: parent.phoneNumber,
            children: parent.children,
          }
        : null;
    }

    res.status(200).json({
      success: true,
      user: userData,
    });
  } catch (error) {
    console.error("Get me error:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting user data",
    });
  }
};

// @desc    Change password
// @route   PUT /api/auth/change-password
// @access  Private
export const changePassword = async (req: AuthRequest, res: Response) => {
  try {
    const { currentPassword, newPassword, confirmPassword } = req.body;

    if (!currentPassword || !newPassword || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message:
          "Please provide current password, new password, and confirm password",
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "New password and confirm password do not match",
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: "New password must be at least 6 characters long",
      });
    }

    const user = await User.findById(req.user!._id).select("+password");

    if (!user || !(await user.comparePassword(currentPassword))) {
      return res.status(401).json({
        success: false,
        message: "Current password is incorrect",
      });
    }

    user.password = newPassword;
    await user.save();

    res.status(200).json({
      success: true,
      message: "Password changed successfully",
    });
  } catch (error) {
    console.error("Change password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error changing password",
    });
  }
};

// @desc    Forgot password
// @route   POST /api/auth/forgot-password
// @access  Public
export const forgotPassword = async (req: AuthRequest, res: Response) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({
        success: false,
        message: "Please provide email address",
      });
    }

    const user = await User.findOne({ email });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "No user found with this email address",
      });
    }

    if (!user.isActive) {
      return res.status(401).json({
        success: false,
        message: "Account is deactivated. Please contact administrator.",
      });
    }

    // Maintenance mode / role logins switched off (admins are never blocked)
    const denied = await checkPortalAccess(user.role);
    if (denied) {
      return res.status(403).json({
        success: false,
        code: denied.code,
        message: denied.message,
      });
    }

    // Generate reset token
    const resetToken = user.generatePasswordResetToken();
    await user.save({ validateBeforeSave: false });

    // Create reset URL
    const resetUrl = `${req.protocol}://${req.get(
      "host"
    )}/reset-password/${resetToken}`;

    // For development, also include the reset URL in the response
    const isDevelopment = process.env.NODE_ENV === "development";

    try {
      // Send email with reset link
      await sendEmail({
        to: user.email,
        ...(await passwordResetEmail(resetUrl)),
      });

      // Log password reset request
      await ActivityLogger.logAuthActivity(
        user._id,
        "password_reset_requested",
        user.email,
        req
      );

      const response: any = {
        success: true,
        message: "Password reset email sent successfully",
      };

      // Include reset URL in development for testing
      if (isDevelopment) {
        response.resetUrl = resetUrl;
        response.note = "Reset URL included for development testing only";
      }

      res.status(200).json(response);
    } catch (emailError) {
      console.error("Email sending failed:", emailError);

      // Clear reset token if email fails
      user.resetPasswordToken = undefined;
      user.resetPasswordExpire = undefined;
      await user.save({ validateBeforeSave: false });

      return res.status(500).json({
        success: false,
        message: "Email could not be sent. Please try again later.",
      });
    }
  } catch (error) {
    console.error("Forgot password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error processing password reset request",
    });
  }
};

// @desc    Reset password
// @route   PUT /api/auth/reset-password/:resettoken
// @access  Public
export const resetPassword = async (req: AuthRequest, res: Response) => {
  try {
    const { password, confirmPassword } = req.body;
    const { resettoken } = req.params;

    if (!password || !confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Please provide password and confirm password",
      });
    }

    if (password !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: "Passwords do not match",
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: "Password must be at least 6 characters long",
      });
    }

    // Hash the token and find user
    const resetPasswordToken = crypto
      .createHash("sha256")
      .update(resettoken)
      .digest("hex");

    const user = await User.findOne({
      resetPasswordToken,
      resetPasswordExpire: { $gt: Date.now() },
    });

    if (!user) {
      return res.status(400).json({
        success: false,
        message: "Invalid or expired reset token",
      });
    }

    // Set new password
    user.password = password;
    user.resetPasswordToken = undefined;
    user.resetPasswordExpire = undefined;
    await user.save();

    // Log password reset success
    await ActivityLogger.logAuthActivity(
      user._id,
      "password_reset_completed",
      user.email,
      req
    );

    // Password is changed, but don't log them in while the portal is closed
    const resetDenied = await checkPortalAccess(user.role);
    if (resetDenied) {
      return res.status(403).json({
        success: false,
        code: resetDenied.code,
        message: `Your password has been changed. ${resetDenied.message}`,
      });
    }

    // Generate new JWT token for immediate login
    const token = generateToken(user._id);

    // Get user data for response
    let userData: any = {
      _id: user._id,
      email: user.email,
      role: user.role,
      isActive: user.isActive,
    };

    if (user.role === "student") {
      const student = await Student.findOne({ userId: user._id });
      userData.student = student;
    }

    if (user.role === "parent") {
      const parent = await Parent.findOne({ userId: user._id }).populate(
        "children",
        "studentId personalInfo.firstName personalInfo.lastName personalInfo.profilePhoto academicInfo.currentClass academicInfo.classArm academicInfo.status"
      );
      userData.parent = parent
        ? {
            _id: parent._id,
            name: parent.name,
            phoneNumber: parent.phoneNumber,
            children: parent.children,
          }
        : null;
    }

    res.status(200).json({
      success: true,
      message: "Password reset successful",
      token,
      user: userData,
    });
  } catch (error) {
    console.error("Reset password error:", error);
    res.status(500).json({
      success: false,
      message: "Server error resetting password",
    });
  }
};
