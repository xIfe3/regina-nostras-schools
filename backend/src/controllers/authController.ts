import { Response } from "express";
import jwt from "jsonwebtoken";
import crypto from "crypto";
import User from "../models/User";
import Student from "../models/Student";
import { AuthRequest } from "../middleware/auth";
import { sendEmail } from "../utils/email";
import { ActivityLogger } from "../utils/activityLogger.js";

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
        subject: "Password Reset Request - Regina Nostras Schools",
        html: `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #2563eb;">Password Reset Request</h2>
            <p>Dear User,</p>
            <p>You have requested to reset your password for your Regina Nostras Schools account.</p>
            <p>Please click the button below to reset your password:</p>

            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}"
                 style="background-color: #2563eb; color: white; padding: 12px 24px;
                        text-decoration: none; border-radius: 5px; display: inline-block;">
                Reset Password
              </a>
            </div>

            <p>Or copy and paste this link into your browser:</p>
            <p style="word-break: break-all; color: #2563eb;">${resetUrl}</p>

            <p><strong>This link will expire in 10 minutes.</strong></p>

            <p>If you did not request this password reset, please ignore this email and your password will remain unchanged.</p>

            <hr style="margin: 30px 0; border: none; border-top: 1px solid #e5e7eb;">
            <p style="font-size: 14px; color: #6b7280;">
              Best regards,<br>
              Regina Nostras Schools Administration
            </p>
          </div>
        `,
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
