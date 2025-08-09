import Activity, { IActivity } from "../models/Activity.js";
import { Request } from "express";
import { AuthRequest } from "../middleware/auth.js";

export interface ActivityData {
  type: IActivity["type"];
  title: string;
  description: string;
  targetModel?: "Student" | "Result" | "Payment" | "User";
  targetId?: string;
  metadata?: {
    studentName?: string;
    className?: string;
    paymentAmount?: number;
    resultSubject?: string;
    [key: string]: any;
  };
}

export class ActivityLogger {
  /**
   * Log an activity to the database
   */
  static async log(
    userId: string,
    activityData: ActivityData,
    req?: Request | AuthRequest
  ): Promise<void> {
    try {
      const activity = new Activity({
        type: activityData.type,
        title: activityData.title,
        description: activityData.description,
        userId,
        targetModel: activityData.targetModel,
        targetId: activityData.targetId,
        metadata: activityData.metadata,
        ipAddress: req?.ip || req?.connection?.remoteAddress,
        userAgent: req?.get("User-Agent"),
      });

      await activity.save();
      console.log(`Activity logged: ${activityData.type} by user ${userId}`);
    } catch (error) {
      console.error("Error logging activity:", error);
      // Don't throw error to avoid breaking the main operation
    }
  }

  /**
   * Log student-related activities
   */
  static async logStudentActivity(
    userId: string,
    type: "student_added" | "student_updated" | "student_deleted",
    studentData: { name: string; className: string; studentId: string },
    req?: Request | AuthRequest
  ): Promise<void> {
    const titles = {
      student_added: "New Student Added",
      student_updated: "Student Updated",
      student_deleted: "Student Deleted",
    };

    const descriptions = {
      student_added: `New student ${studentData.name} added to ${studentData.className}`,
      student_updated: `Student ${studentData.name} information updated`,
      student_deleted: `Student ${studentData.name} removed from system`,
    };

    await this.log(
      userId,
      {
        type,
        title: titles[type],
        description: descriptions[type],
        targetModel: "Student",
        targetId: studentData.studentId,
        metadata: {
          studentName: studentData.name,
          className: studentData.className,
        },
      },
      req
    );
  }

  /**
   * Log result-related activities
   */
  static async logResultActivity(
    userId: string,
    type: "result_uploaded" | "result_updated" | "result_deleted",
    resultData: {
      studentName: string;
      subject: string;
      className: string;
      resultId: string;
    },
    req?: Request | AuthRequest
  ): Promise<void> {
    const titles = {
      result_uploaded: "Results Uploaded",
      result_updated: "Results Updated",
      result_deleted: "Results Deleted",
    };

    const descriptions = {
      result_uploaded: `Results uploaded for ${resultData.studentName} - ${resultData.subject}`,
      result_updated: `Results updated for ${resultData.studentName} - ${resultData.subject}`,
      result_deleted: `Results deleted for ${resultData.studentName} - ${resultData.subject}`,
    };

    await this.log(
      userId,
      {
        type,
        title: titles[type],
        description: descriptions[type],
        targetModel: "Result",
        targetId: resultData.resultId,
        metadata: {
          studentName: resultData.studentName,
          resultSubject: resultData.subject,
          className: resultData.className,
        },
      },
      req
    );
  }

  /**
   * Log payment-related activities
   */
  static async logPaymentActivity(
    userId: string,
    type: "payment_verified" | "payment_rejected" | "payment_pending",
    paymentData: {
      studentName: string;
      amount: number;
      paymentType: string;
      paymentId: string;
    },
    req?: Request | AuthRequest
  ): Promise<void> {
    const titles = {
      payment_verified: "Payment Verified",
      payment_rejected: "Payment Rejected",
      payment_pending: "Payment Pending",
    };

    const descriptions = {
      payment_verified: `Payment verified for ${
        paymentData.studentName
      } - ₦${paymentData.amount.toLocaleString()}`,
      payment_rejected: `Payment rejected for ${
        paymentData.studentName
      } - ₦${paymentData.amount.toLocaleString()}`,
      payment_pending: `Payment pending for ${
        paymentData.studentName
      } - ₦${paymentData.amount.toLocaleString()}`,
    };

    await this.log(
      userId,
      {
        type,
        title: titles[type],
        description: descriptions[type],
        targetModel: "Payment",
        targetId: paymentData.paymentId,
        metadata: {
          studentName: paymentData.studentName,
          paymentAmount: paymentData.amount,
        },
      },
      req
    );
  }

  /**
   * Log authentication activities
   */
  static async logAuthActivity(
    userId: string,
    type:
      | "user_login"
      | "user_logout"
      | "password_reset_requested"
      | "password_reset_completed",
    userEmail: string,
    req?: Request | AuthRequest
  ): Promise<void> {
    const titles = {
      user_login: "User Login",
      user_logout: "User Logout",
      password_reset_requested: "Password Reset Requested",
      password_reset_completed: "Password Reset Completed",
    };

    const descriptions = {
      user_login: `User ${userEmail} logged in`,
      user_logout: `User ${userEmail} logged out`,
      password_reset_requested: `Password reset requested for ${userEmail}`,
      password_reset_completed: `Password reset completed for ${userEmail}`,
    };

    await this.log(
      userId,
      {
        type,
        title: titles[type],
        description: descriptions[type],
        targetModel: "User",
        targetId: userId,
      },
      req
    );
  }

  /**
   * Get recent activities for dashboard
   */
  static async getRecentActivities(limit: number = 10): Promise<IActivity[]> {
    try {
      const activities = await Activity.find()
        .populate("userId", "email role")
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      return activities;
    } catch (error) {
      console.error("Error fetching recent activities:", error);
      return [];
    }
  }

  /**
   * Get activities for a specific user
   */
  static async getUserActivities(
    userId: string,
    limit: number = 20
  ): Promise<IActivity[]> {
    try {
      const activities = await Activity.find({ userId })
        .sort({ createdAt: -1 })
        .limit(limit)
        .lean();

      return activities;
    } catch (error) {
      console.error("Error fetching user activities:", error);
      return [];
    }
  }

  /**
   * Get activity statistics
   */
  static async getActivityStats(days: number = 30) {
    try {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);

      const stats = await Activity.aggregate([
        {
          $match: {
            createdAt: { $gte: startDate },
          },
        },
        {
          $group: {
            _id: "$type",
            count: { $sum: 1 },
          },
        },
        {
          $sort: { count: -1 },
        },
      ]);

      const totalActivities = await Activity.countDocuments({
        createdAt: { $gte: startDate },
      });

      return {
        totalActivities,
        typeBreakdown: stats,
        period: `${days} days`,
      };
    } catch (error) {
      console.error("Error fetching activity stats:", error);
      return {
        totalActivities: 0,
        typeBreakdown: [],
        period: `${days} days`,
      };
    }
  }
}

export default ActivityLogger;
