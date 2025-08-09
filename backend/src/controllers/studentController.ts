import { Response } from "express";
import Student from "../models/Student.js";
import User from "../models/User.js";
import { AuthRequest } from "../middleware/auth.js";
import { uploadFile } from "../utils/cloudinary.js";
import bcrypt from "bcryptjs";

// @desc    Get student profile
// @route   GET /api/student/profile
// @access  Private/Student
export const getProfile = async (req: AuthRequest, res: Response) => {
  try {
    const student = await Student.findOne({ userId: req.user!._id }).populate(
      "userId",
      "email isActive lastLogin createdAt"
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    res.status(200).json({
      success: true,
      data: student,
    });
  } catch (error) {
    console.error("Get profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting profile",
    });
  }
};

// @desc    Update student profile
// @route   PUT /api/student/profile
// @access  Private/Student
export const updateProfile = async (req: AuthRequest, res: Response) => {
  try {
    const allowedFields = [
      "personalInfo",
      "contactInfo",
      "parentGuardianInfo",
      "medicalInfo",
    ];

    // Build update object with only allowed fields
    const updates: any = {};

    allowedFields.forEach((field) => {
      if (req.body[field]) {
        updates[field] = req.body[field];
      }
    });

    // If no valid updates provided
    if (Object.keys(updates).length === 0) {
      return res.status(400).json({
        success: false,
        message: "No valid updates provided",
      });
    }

    // Convert dateOfBirth to proper Date object if it exists
    if (updates.personalInfo && updates.personalInfo.dateOfBirth) {
      updates.personalInfo.dateOfBirth = new Date(
        updates.personalInfo.dateOfBirth
      );
    }

    console.log(
      "Updating student profile with:",
      JSON.stringify(updates, null, 2)
    );

    const student = await Student.findOneAndUpdate(
      { userId: req.user!._id },
      updates,
      {
        new: true,
        runValidators: true,
      }
    ).populate("userId", "email isActive lastLogin");

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: student,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating profile",
      error: error instanceof Error ? error.message : "Unknown error",
    });
  }
};

// @desc    Upload profile photo
// @route   POST /api/student/profile/photo
// @access  Private/Student
export const uploadProfilePhoto = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload an image file",
      });
    }

    // Upload to cloudinary
    const uploadResult = await uploadFile(req.file, {
      folder: "profile-photos",
    });

    // Update student profile
    const student = await Student.findOneAndUpdate(
      { userId: req.user!._id },
      { "personalInfo.profilePhoto": uploadResult.url },
      { new: true }
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile photo uploaded successfully",
      data: {
        profilePhoto: uploadResult.url,
      },
    });
  } catch (error) {
    console.error("Upload profile photo error:", error);
    res.status(500).json({
      success: false,
      message: "Server error uploading profile photo",
    });
  }
};

// @desc    Update student profile settings (email/password)
// @route   PUT /api/student/settings/profile
// @access  Private/Student
export const updateProfileSettings = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { email, currentPassword, newPassword } = req.body;

    // Get user with password field included for comparison
    const user = await User.findById(req.user!._id).select("+password");
    if (!user) {
      return res.status(404).json({
        success: false,
        message: "User not found",
      });
    }

    // If updating password, verify current password
    if (newPassword) {
      if (!currentPassword) {
        return res.status(400).json({
          success: false,
          message: "Current password is required to change password",
        });
      }

      // Use the model's comparePassword method instead of direct bcrypt comparison
      const isCurrentPasswordCorrect = await user.comparePassword(
        currentPassword
      );
      if (!isCurrentPasswordCorrect) {
        return res.status(400).json({
          success: false,
          message: "Current password is incorrect",
        });
      }

      if (newPassword.length < 6) {
        return res.status(400).json({
          success: false,
          message: "New password must be at least 6 characters long",
        });
      }

      // Set the new password - the pre-save middleware will hash it automatically
      user.password = newPassword;
    }

    // Update email if provided and different
    if (email && email !== user.email) {
      // Check if email already exists
      const existingUser = await User.findOne({ email });
      if (existingUser && existingUser._id.toString() !== user._id.toString()) {
        return res.status(400).json({
          success: false,
          message: "Email already exists",
        });
      }
      user.email = email;
    }

    // Save the user - this will trigger the pre-save middleware for password hashing
    await user.save();

    res.status(200).json({
      success: true,
      message: "Profile settings updated successfully",
      data: {
        email: user.email,
      },
    });
  } catch (error) {
    console.error("Update profile settings error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating profile settings",
    });
  }
};

// @desc    Update student notification settings
// @route   PUT /api/student/settings/notifications
// @access  Private/Student
export const updateNotificationSettings = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const notificationSettings = req.body;

    const student = await Student.findOneAndUpdate(
      { userId: req.user!._id },
      {
        $set: {
          "settings.notifications": notificationSettings,
        },
      },
      {
        new: true,
        upsert: false,
      }
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Notification settings updated successfully",
      data: student.settings?.notifications || notificationSettings,
    });
  } catch (error) {
    console.error("Update notification settings error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating notification settings",
    });
  }
};

// @desc    Update student security settings
// @route   PUT /api/student/settings/security
// @access  Private/Student
export const updateSecuritySettings = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const securitySettings = req.body;

    const student = await Student.findOneAndUpdate(
      { userId: req.user!._id },
      {
        $set: {
          "settings.security": securitySettings,
        },
      },
      {
        new: true,
        upsert: false,
      }
    );

    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Security settings updated successfully",
      data: student.settings?.security || securitySettings,
    });
  } catch (error) {
    console.error("Update security settings error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating security settings",
    });
  }
};
