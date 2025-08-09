import { Response } from "express";
import mongoose from "mongoose";
import Announcement, { IAnnouncement } from "../models/Announcement.js";
import Student from "../models/Student.js";
import User from "../models/User.js";
import { AuthRequest } from "../middleware/auth.js";
import { ActivityLogger } from "../utils/activityLogger.js";
import { uploadFile } from "../utils/cloudinary.js";
import { sendEmail } from "../utils/email.js";

// @desc    Get all announcements (public view)
// @route   GET /api/announcements/public
// @access  Public
export const getPublicAnnouncements = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const page = parseInt(req.query?.page as string) || 1;
    const limit = parseInt(req.query?.limit as string) || 10;
    const category = req.query?.category as string;
    const pinned = req.query?.pinned === "true";

    const skip = (page - 1) * limit;
    const now = new Date();

    let query: any = {
      status: "published",
      publishDate: { $lte: now },
      $or: [{ expiryDate: { $exists: false } }, { expiryDate: { $gte: now } }],
      targetAudience: { $in: ["all", "students", "parents"] },
    };

    if (category) {
      query.category = category;
    }

    if (pinned) {
      query.isPinned = true;
    }

    const announcements = await Announcement.find(query)
      .populate("author", "email")
      .select("-metadata -customAudience")
      .sort({ isPinned: -1, publishDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Announcement.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        announcements,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
        },
      },
    });
  } catch (error) {
    console.error("Get public announcements error:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting announcements",
    });
  }
};

// @desc    Get all announcements for authenticated users
// @route   GET /api/announcements
// @access  Private
export const getAnnouncements = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user!;
    const page = parseInt(req.query?.page as string) || 1;
    const limit = parseInt(req.query?.limit as string) || 10;
    const category = req.query?.category as string;
    const status = req.query?.status as string;
    const pinned = req.query?.pinned === "true";

    const skip = (page - 1) * limit;
    const now = new Date();

    let query: any = {
      status: "published",
      publishDate: { $lte: now },
      $or: [{ expiryDate: { $exists: false } }, { expiryDate: { $gte: now } }],
    };

    // Filter by target audience based on user role
    if (user.role === "student") {
      const student = await Student.findOne({ userId: user._id });
      if (student) {
        query.$and = [
          {
            $or: [
              { targetAudience: "all" },
              { targetAudience: "students" },
              {
                targetAudience: "custom",
                $or: [
                  {
                    "customAudience.classes":
                      student.academicInfo?.currentClass,
                  },
                  { "customAudience.individuals": user._id },
                  { "customAudience.roles": "student" },
                ],
              },
            ],
          },
        ];
      }
    } else if (user.role === "admin") {
      // Admins can see all announcements
      query.$and = [
        {
          $or: [
            { targetAudience: "all" },
            { targetAudience: "staff" },
            {
              targetAudience: "custom",
              $or: [
                { "customAudience.individuals": user._id },
                { "customAudience.roles": "admin" },
              ],
            },
          ],
        },
      ];
    }

    if (category) {
      query.category = category;
    }

    if (status && user.role === "admin") {
      query.status = status;
    }

    if (pinned) {
      query.isPinned = true;
    }

    const announcements = await Announcement.find(query)
      .populate("author", "email")
      .sort({ isPinned: -1, publishDate: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Announcement.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        announcements,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
        },
      },
    });
  } catch (error) {
    console.error("Get announcements error:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting announcements",
    });
  }
};

// @desc    Get single announcement
// @route   GET /api/announcements/:id
// @access  Public
export const getAnnouncement = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Validate if the ID is a valid MongoDB ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid announcement ID format",
      });
    }

    const announcement = await Announcement.findById(id).populate(
      "author",
      "email"
    );

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    // Check if announcement is accessible
    const now = new Date();
    const isActive =
      announcement.status === "published" &&
      announcement.publishDate <= now &&
      (!announcement.expiryDate || announcement.expiryDate >= now);

    if (!isActive && (!req.user || req.user.role !== "admin")) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    // Increment views count
    announcement.views += 1;
    await announcement.save();

    // Track that user has read this announcement
    if (req.user) {
      const userId = new mongoose.Types.ObjectId(req.user._id);
      if (!announcement.metadata?.readBy?.includes(userId)) {
        if (!announcement.metadata) {
          announcement.metadata = { readBy: [] };
        }
        if (!announcement.metadata.readBy) {
          announcement.metadata.readBy = [];
        }
        announcement.metadata.readBy.push(userId);
        await announcement.save();
      }
    }

    res.status(200).json({
      success: true,
      data: announcement,
    });
  } catch (error) {
    console.error("Get announcement error:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting announcement",
    });
  }
};

// @desc    Create new announcement
// @route   POST /api/announcements/admin
// @access  Private/Admin
export const createAnnouncement = async (req: AuthRequest, res: Response) => {
  try {
    const announcementData: Partial<IAnnouncement> = {
      ...req.body,
      author: req.user!._id,
    };

    // Handle image upload if present
    if (req.file) {
      try {
        const uploadResult = await uploadFile(req.file.buffer, {
          folder: "announcements",
        });
        announcementData.imageUrl = uploadResult;
      } catch (uploadError) {
        console.error("Image upload error:", uploadError);
      }
    }

    // Handle file attachments if present
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const attachments = [];
      for (const file of req.files) {
        try {
          const uploadResult = await uploadFile(file.buffer, {
            folder: "announcements/attachments",
          });
          attachments.push({
            name: file.originalname,
            url: uploadResult,
            type: file.mimetype,
            size: file.size,
          });
        } catch (uploadError) {
          console.error("File attachment upload error:", uploadError);
        }
      }
      announcementData.attachments = attachments;
    }

    const announcement = await Announcement.create(announcementData);
    await announcement.populate("author", "email");

    // Log activity
    await ActivityLogger.log(req.user!._id.toString(), {
      type: "admin_action",
      title: "Announcement Created",
      description: `Created announcement: ${announcement.title}`,
      targetModel: "Announcement" as any,
      targetId: (announcement._id as any).toString(),
    });

    // Send notifications if announcement is published and has high priority
    if (
      announcement.status === "published" &&
      (announcement.priority === "high" || announcement.priority === "urgent")
    ) {
      await sendAnnouncementNotifications(announcement);
    }

    res.status(201).json({
      success: true,
      data: announcement,
      message: "Announcement created successfully",
    });
  } catch (error: any) {
    console.error("Create announcement error:", error);

    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err: any) => err.message
      );
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: validationErrors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error creating announcement",
    });
  }
};

// @desc    Update announcement
// @route   PUT /api/announcements/admin/:id
// @access  Private/Admin
export const updateAnnouncement = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Validate if the ID is a valid MongoDB ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid announcement ID format",
      });
    }

    const announcement = await Announcement.findById(id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    const updateData = { ...req.body };

    // Handle new image upload if present
    if (req.file) {
      try {
        const uploadResult = await uploadFile(req.file.buffer, {
          folder: "announcements",
        });
        updateData.imageUrl = uploadResult;
      } catch (uploadError) {
        console.error("Image upload error:", uploadError);
      }
    }

    // Handle new file attachments if present
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const newAttachments = [];
      for (const file of req.files) {
        try {
          const uploadResult = await uploadFile(file.buffer, {
            folder: "announcements/attachments",
          });
          newAttachments.push({
            name: file.originalname,
            url: uploadResult,
            type: file.mimetype,
            size: file.size,
          });
        } catch (uploadError) {
          console.error("File attachment upload error:", uploadError);
        }
      }
      // Append to existing attachments or replace
      if (req.body.replaceAttachments === "true") {
        updateData.attachments = newAttachments;
      } else {
        updateData.attachments = [
          ...(announcement.attachments || []),
          ...newAttachments,
        ];
      }
    }

    const updatedAnnouncement = await Announcement.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate("author", "email");

    if (!updatedAnnouncement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found after update",
      });
    }

    // Log activity
    await ActivityLogger.log(req.user!._id.toString(), {
      type: "admin_action",
      title: "Announcement Updated",
      description: `Updated announcement: ${updatedAnnouncement.title}`,
      targetModel: "Announcement" as any,
      targetId: (updatedAnnouncement._id as any).toString(),
    });

    res.status(200).json({
      success: true,
      data: updatedAnnouncement,
      message: "Announcement updated successfully",
    });
  } catch (error: any) {
    console.error("Update announcement error:", error);

    if (error.name === "ValidationError") {
      const validationErrors = Object.values(error.errors).map(
        (err: any) => err.message
      );
      return res.status(400).json({
        success: false,
        message: "Validation error",
        errors: validationErrors,
      });
    }

    res.status(500).json({
      success: false,
      message: "Server error updating announcement",
    });
  }
};

// @desc    Delete announcement
// @route   DELETE /api/announcements/admin/:id
// @access  Private/Admin
export const deleteAnnouncement = async (req: AuthRequest, res: Response) => {
  try {
    const { id } = req.params;

    // Validate if the ID is a valid MongoDB ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid announcement ID format",
      });
    }

    const announcement = await Announcement.findById(id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    await Announcement.findByIdAndDelete(id);

    // Log activity
    await ActivityLogger.log(req.user!._id.toString(), {
      type: "admin_action",
      title: "Announcement Deleted",
      description: `Deleted announcement: ${announcement.title}`,
      targetModel: "Announcement" as any,
      targetId: (announcement._id as any).toString(),
    });

    res.status(200).json({
      success: true,
      message: "Announcement deleted successfully",
    });
  } catch (error) {
    console.error("Delete announcement error:", error);
    res.status(500).json({
      success: false,
      message: "Server error deleting announcement",
    });
  }
};

// @desc    Get admin announcements with all statuses
// @route   GET /api/announcements/admin
// @access  Private/Admin
export const getAdminAnnouncements = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const page = parseInt(req.query?.page as string) || 1;
    const limit = parseInt(req.query?.limit as string) || 10;
    const category = req.query?.category as string;
    const status = req.query?.status as string;
    const search = req.query?.search as string;

    const skip = (page - 1) * limit;

    let query: any = {};

    if (category) {
      query.category = category;
    }

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { content: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    const announcements = await Announcement.find(query)
      .populate("author", "email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Announcement.countDocuments(query);

    res.status(200).json({
      success: true,
      data: {
        announcements,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
        },
      },
    });
  } catch (error) {
    console.error("Get admin announcements error:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting announcements",
    });
  }
};

// @desc    Get announcement statistics
// @route   GET /api/announcements/admin/statistics
// @access  Private/Admin
export const getAnnouncementStatistics = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    // Get basic statistics
    const totalAnnouncements = await Announcement.countDocuments();
    const publishedAnnouncements = await Announcement.countDocuments({
      status: "published",
    });
    const draftAnnouncements = await Announcement.countDocuments({
      status: "draft",
    });
    const pinnedAnnouncements = await Announcement.countDocuments({
      isPinned: true,
      status: "published",
    });

    // Get announcements by category
    const categoryStats = await Announcement.aggregate([
      { $match: { status: "published" } },
      { $group: { _id: "$category", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Get announcements by priority
    const priorityStats = await Announcement.aggregate([
      { $match: { status: "published" } },
      { $group: { _id: "$priority", count: { $sum: 1 } } },
      { $sort: { count: -1 } },
    ]);

    // Get this month's announcements
    const thisMonthStart = new Date(currentYear, currentMonth, 1);
    const thisMonthEnd = new Date(currentYear, currentMonth + 1, 0);

    const thisMonthAnnouncements = await Announcement.countDocuments({
      createdAt: { $gte: thisMonthStart, $lte: thisMonthEnd },
    });

    // Get most viewed announcements
    const mostViewed = await Announcement.find({ status: "published" })
      .select("title views publishDate")
      .sort({ views: -1 })
      .limit(5);

    // Get recent announcements activity
    const recentActivity = await Announcement.find()
      .populate("author", "email")
      .select("title status createdAt updatedAt author")
      .sort({ updatedAt: -1 })
      .limit(10);

    res.status(200).json({
      success: true,
      data: {
        summary: {
          total: totalAnnouncements,
          published: publishedAnnouncements,
          draft: draftAnnouncements,
          pinned: pinnedAnnouncements,
          thisMonth: thisMonthAnnouncements,
        },
        categories: categoryStats,
        priorities: priorityStats,
        mostViewed,
        recentActivity,
      },
    });
  } catch (error) {
    console.error("Get announcement statistics error:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting announcement statistics",
    });
  }
};

// @desc    Toggle announcement pin status
// @route   PUT /api/announcements/admin/:id/pin
// @access  Private/Admin
export const toggleAnnouncementPin = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { id } = req.params;

    // Validate if the ID is a valid MongoDB ObjectId
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      return res.status(400).json({
        success: false,
        message: "Invalid announcement ID format",
      });
    }

    const announcement = await Announcement.findById(id);

    if (!announcement) {
      return res.status(404).json({
        success: false,
        message: "Announcement not found",
      });
    }

    announcement.isPinned = !announcement.isPinned;
    await announcement.save();

    // Log activity
    await ActivityLogger.log(req.user!._id.toString(), {
      type: "admin_action",
      title: `Announcement ${announcement.isPinned ? "Pinned" : "Unpinned"}`,
      description: `${
        announcement.isPinned ? "Pinned" : "Unpinned"
      } announcement: ${announcement.title}`,
      targetModel: "Announcement" as any,
      targetId: (announcement._id as any).toString(),
    });

    res.status(200).json({
      success: true,
      data: { isPinned: announcement.isPinned },
      message: `Announcement ${
        announcement.isPinned ? "pinned" : "unpinned"
      } successfully`,
    });
  } catch (error) {
    console.error("Toggle announcement pin error:", error);
    res.status(500).json({
      success: false,
      message: "Server error toggling announcement pin status",
    });
  }
};

// Helper function to send announcement notifications
const sendAnnouncementNotifications = async (announcement: IAnnouncement) => {
  try {
    // Get users based on target audience
    let users: any[] = [];

    if (announcement.targetAudience === "all") {
      users = await User.find({ isActive: true }).select("email role");
    } else if (announcement.targetAudience === "students") {
      users = await User.find({ role: "student", isActive: true }).select(
        "email role"
      );
    } else if (announcement.targetAudience === "staff") {
      users = await User.find({ role: "admin", isActive: true }).select(
        "email role"
      );
    } else if (
      announcement.targetAudience === "custom" &&
      announcement.customAudience
    ) {
      const query: any = { isActive: true };

      if (announcement.customAudience.roles?.length) {
        query.role = { $in: announcement.customAudience.roles };
      }

      if (announcement.customAudience.individuals?.length) {
        query.$or = [
          { _id: { $in: announcement.customAudience.individuals } },
          ...(query.role ? [{ role: query.role }] : []),
        ];
        delete query.role;
      }

      users = await User.find(query).select("email role");
    }

    // Send notification emails
    const emailPromises = users.map(async (user) => {
      try {
        await sendEmail({
          to: user.email,
          subject: `[${announcement.priority.toUpperCase()}] ${
            announcement.title
          }`,
          html: `
            <h2>${announcement.title}</h2>
            <p><strong>Category:</strong> ${announcement.category}</p>
            <p><strong>Priority:</strong> ${announcement.priority}</p>
            <p><strong>Published:</strong> ${announcement.publishDate}</p>
            <hr>
            <p>${announcement.excerpt}</p>
            <p><a href="${process.env.FRONTEND_URL}/announcements/${announcement._id}">Read Full Announcement</a></p>
          `,
        });
      } catch (emailError) {
        console.error(
          `Failed to send notification to ${user.email}:`,
          emailError
        );
      }
    });

    await Promise.allSettled(emailPromises);

    // Mark notification as sent
    announcement.isNotificationSent = true;
    await announcement.save();
  } catch (error) {
    console.error("Send announcement notifications error:", error);
  }
};
