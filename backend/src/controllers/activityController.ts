import { Response } from "express";
import Activity from "../models/Activity.js";
import { AuthRequest } from "../middleware/auth.js";
import { ActivityLogger } from "../utils/activityLogger.js";

// @desc    Get recent activities for dashboard
// @route   GET /api/admin/activities/recent
// @access  Private/Admin
export const getRecentActivities = async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query.limit as string) || 10;

    const activities = await ActivityLogger.getRecentActivities(limit);

    res.status(200).json({
      success: true,
      data: activities,
    });
  } catch (error) {
    console.error("Get recent activities error:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting recent activities",
    });
  }
};

// @desc    Get all activities with pagination and filters
// @route   GET /api/admin/activities
// @access  Private/Admin
export const getActivities = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = parseInt(req.query.limit as string) || 20;
    const type = req.query.type as string;
    const userId = req.query.userId as string;
    const days = parseInt(req.query.days as string) || 30;

    const skip = (page - 1) * limit;

    // Build filter object
    const filter: any = {};

    if (type) {
      filter.type = type;
    }

    if (userId) {
      filter.userId = userId;
    }

    // Filter by date range
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - days);
    filter.createdAt = { $gte: startDate };

    const activities = await Activity.find(filter)
      .populate("userId", "email role")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Activity.countDocuments(filter);

    res.status(200).json({
      success: true,
      data: {
        activities,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          totalItems: total,
          itemsPerPage: limit,
        },
      },
    });
  } catch (error) {
    console.error("Get activities error:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting activities",
    });
  }
};

// @desc    Get activity statistics
// @route   GET /api/admin/activities/stats
// @access  Private/Admin
export const getActivityStats = async (req: AuthRequest, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 30;

    const stats = await ActivityLogger.getActivityStats(days);

    res.status(200).json({
      success: true,
      data: stats,
    });
  } catch (error) {
    console.error("Get activity stats error:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting activity statistics",
    });
  }
};

// @desc    Get activities for a specific user
// @route   GET /api/admin/activities/user/:userId
// @access  Private/Admin
export const getUserActivities = async (req: AuthRequest, res: Response) => {
  try {
    const { userId } = req.params;
    const limit = parseInt(req.query.limit as string) || 20;

    const activities = await ActivityLogger.getUserActivities(userId, limit);

    res.status(200).json({
      success: true,
      data: activities,
    });
  } catch (error) {
    console.error("Get user activities error:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting user activities",
    });
  }
};

// @desc    Delete old activities (cleanup)
// @route   DELETE /api/admin/activities/cleanup
// @access  Private/Admin
export const cleanupOldActivities = async (req: AuthRequest, res: Response) => {
  try {
    const days = parseInt(req.query.days as string) || 90; // Default: keep last 90 days

    const cutoffDate = new Date();
    cutoffDate.setDate(cutoffDate.getDate() - days);

    const result = await Activity.deleteMany({
      createdAt: { $lt: cutoffDate },
    });

    // Log this admin action
    await ActivityLogger.log(
      req.user!._id,
      {
        type: "admin_action",
        title: "Activity Cleanup",
        description: `Cleaned up ${result.deletedCount} old activities (older than ${days} days)`,
      },
      req
    );

    res.status(200).json({
      success: true,
      message: `Successfully cleaned up ${result.deletedCount} old activities`,
      data: {
        deletedCount: result.deletedCount,
        cutoffDate,
      },
    });
  } catch (error) {
    console.error("Cleanup activities error:", error);
    res.status(500).json({
      success: false,
      message: "Server error during activity cleanup",
    });
  }
};
