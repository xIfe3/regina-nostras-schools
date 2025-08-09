import { Response } from "express";
import Event, { IEvent } from "../models/Event.js";
import Student from "../models/Student.js";
import User from "../models/User.js";
import { AuthRequest } from "../middleware/auth.js";
import { sendEmail } from "../utils/email.js";
import { ActivityLogger } from "../utils/activityLogger.js";
import { uploadFile } from "../utils/cloudinary.js";

// @desc    Get all events (for students)
// @route   GET /api/events/student
// @access  Private/Student
export const getStudentEvents = async (req: AuthRequest, res: Response) => {
  try {
    const student = await Student.findOne({ userId: req.user!._id });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    const page = parseInt(req.query?.page as string) || 1;
    const limit = parseInt(req.query?.limit as string) || 20;
    const type = req.query?.type as string;
    const startDate = req.query?.startDate as string;
    const endDate = req.query?.endDate as string;
    const upcoming = req.query?.upcoming === "true";

    let query: any = {
      status: "published",
      $or: [
        { targetAudience: "all" },
        { targetAudience: "students" },
        {
          targetAudience: "custom",
          $or: [
            { "customAudience.classes": student.academicInfo.currentClass },
            { "customAudience.individuals": req.user!._id },
          ],
        },
      ],
    };

    if (type) {
      query.type = type;
    }

    if (upcoming) {
      query.date = { $gte: new Date() };
    } else if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (startDate) {
      query.date = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.date = { $lte: new Date(endDate) };
    }

    const skip = (page - 1) * limit;

    const events = await Event.find(query)
      .sort({ date: 1 })
      .skip(skip)
      .limit(limit)
      .populate("organizer", "email")
      .populate("createdBy", "email")
      .select("-customAudience -updatedBy");

    const total = await Event.countDocuments(query);

    res.status(200).json({
      success: true,
      data: events,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalEvents: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Get student events error:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting events",
    });
  }
};

// @desc    Get single event details
// @route   GET /api/events/student/:id
// @access  Private/Student
export const getStudentEvent = async (req: AuthRequest, res: Response) => {
  try {
    const student = await Student.findOne({ userId: req.user!._id });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    const event = await Event.findById(req.params.id)
      .populate("organizer", "email")
      .populate("createdBy", "email")
      .select("-customAudience -updatedBy");

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    // Check if student has access to this event
    const hasAccess =
      event.status === "published" &&
      (event.targetAudience === "all" ||
        event.targetAudience === "students" ||
        (event.targetAudience === "custom" &&
          (event.customAudience?.classes?.includes(
            student.academicInfo.currentClass
          ) ||
            event.customAudience?.individuals?.some(
              (id) => id.toString() === req.user!._id.toString()
            ))));

    if (!hasAccess) {
      return res.status(403).json({
        success: false,
        message: "Access denied to this event",
      });
    }

    res.status(200).json({
      success: true,
      data: event,
    });
  } catch (error) {
    console.error("Get student event error:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting event",
    });
  }
};

// @desc    Get all events (for admin)
// @route   GET /api/events/admin
// @access  Private/Admin
export const getAdminEvents = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query?.page as string) || 1;
    const limit = parseInt(req.query?.limit as string) || 20;
    const type = req.query?.type as string;
    const status = req.query?.status as string;
    const search = req.query?.search as string;
    const startDate = req.query?.startDate as string;
    const endDate = req.query?.endDate as string;

    let query: any = {};

    if (type) {
      query.type = type;
    }

    if (status) {
      query.status = status;
    }

    if (search) {
      query.$or = [
        { title: { $regex: search, $options: "i" } },
        { description: { $regex: search, $options: "i" } },
        { location: { $regex: search, $options: "i" } },
        { tags: { $in: [new RegExp(search, "i")] } },
      ];
    }

    if (startDate && endDate) {
      query.date = {
        $gte: new Date(startDate),
        $lte: new Date(endDate),
      };
    } else if (startDate) {
      query.date = { $gte: new Date(startDate) };
    } else if (endDate) {
      query.date = { $lte: new Date(endDate) };
    }

    const skip = (page - 1) * limit;

    const events = await Event.find(query)
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit)
      .populate("organizer", "email")
      .populate("createdBy", "email")
      .populate("updatedBy", "email");

    const total = await Event.countDocuments(query);

    res.status(200).json({
      success: true,
      data: events,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalEvents: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Get admin events error:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting events",
    });
  }
};

// @desc    Create new event
// @route   POST /api/events/admin
// @access  Private/Admin
export const createEvent = async (req: AuthRequest, res: Response) => {
  try {
    const eventData = {
      ...req.body,
      organizer: req.user!._id,
      createdBy: req.user!._id,
    };

    // Handle file attachments if present
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const attachments = [];
      for (const file of req.files) {
        try {
          const uploadResult = await uploadFile(file.buffer, {
            folder: "events",
          });
          attachments.push({
            name: file.originalname,
            url: uploadResult,
            type: file.mimetype,
          });
        } catch (uploadError) {
          console.error("File upload error:", uploadError);
        }
      }
      eventData.attachments = attachments;
    }

    const event = await Event.create(eventData);

    await event.populate("organizer", "email");
    await event.populate("createdBy", "email");

    // Log activity
    await ActivityLogger.log(req.user!._id.toString(), {
      type: "system_event",
      title: "Event Created",
      description: `Created event: ${event.title}`,
      targetModel: "Event" as any,
      targetId: (event?._id as string | { toString(): string }).toString(),
    });

    // Send notifications if event is published
    if (event.status === "published") {
      await sendEventNotifications(event);
    }

    res.status(201).json({
      success: true,
      data: event,
      message: "Event created successfully",
    });
  } catch (error: any) {
    console.error("Create event error:", error);

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
      message: "Server error creating event",
    });
  }
};

// @desc    Update event
// @route   PUT /api/events/admin/:id
// @access  Private/Admin
export const updateEvent = async (req: AuthRequest, res: Response) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    const updateData = {
      ...req.body,
      updatedBy: req.user!._id,
    };

    // Handle file attachments if present
    if (req.files && Array.isArray(req.files) && req.files.length > 0) {
      const newAttachments = [];
      for (const file of req.files) {
        try {
          const uploadResult = await uploadFile(file.buffer, {
            folder: "events",
          });
          newAttachments.push({
            name: file.originalname,
            url: uploadResult,
            type: file.mimetype,
          });
        } catch (uploadError) {
          console.error("File upload error:", uploadError);
        }
      }

      // Merge with existing attachments
      updateData.attachments = [
        ...(event.attachments || []),
        ...newAttachments,
      ];
    }

    const updatedEvent = await Event.findByIdAndUpdate(
      req.params.id,
      updateData,
      {
        new: true,
        runValidators: true,
      }
    )
      .populate("organizer", "email")
      .populate("createdBy", "email")
      .populate("updatedBy", "email");

    // Log activity
    await ActivityLogger.log(req.user!._id.toString(), {
      type: "system_event",
      title: "Event Updated",
      description: `Updated event: ${updatedEvent!.title}`,
      targetModel: "Event" as any,
      targetId: (
        updatedEvent!._id as string | { toString(): string }
      ).toString(),
    });

    // Send notifications if event status changed to published
    if (event.status !== "published" && updatedEvent!.status === "published") {
      await sendEventNotifications(updatedEvent!);
    }

    res.status(200).json({
      success: true,
      data: updatedEvent,
      message: "Event updated successfully",
    });
  } catch (error: any) {
    console.error("Update event error:", error);

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
      message: "Server error updating event",
    });
  }
};

// @desc    Delete event
// @route   DELETE /api/events/admin/:id
// @access  Private/Admin
export const deleteEvent = async (req: AuthRequest, res: Response) => {
  try {
    const event = await Event.findById(req.params.id);

    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    await Event.findByIdAndDelete(req.params.id);

    // Log activity
    await ActivityLogger.log(req.user!._id.toString(), {
      type: "system_event",
      title: "Event Deleted",
      description: `Deleted event: ${event.title}`,
      targetModel: "Event" as any,
      targetId: (event._id as string | { toString(): string }).toString(),
    });

    res.status(200).json({
      success: true,
      message: "Event deleted successfully",
    });
  } catch (error) {
    console.error("Delete event error:", error);
    res.status(500).json({
      success: false,
      message: "Server error deleting event",
    });
  }
};

// @desc    Get event statistics
// @route   GET /api/events/admin/statistics
// @access  Private/Admin
export const getEventStatistics = async (req: AuthRequest, res: Response) => {
  try {
    const currentDate = new Date();
    const currentYear = currentDate.getFullYear();
    const currentMonth = currentDate.getMonth();

    // Get basic statistics
    const totalEvents = await Event.countDocuments();
    const publishedEvents = await Event.countDocuments({ status: "published" });
    const draftEvents = await Event.countDocuments({ status: "draft" });
    const cancelledEvents = await Event.countDocuments({ status: "cancelled" });

    // Get upcoming events
    const upcomingEvents = await Event.countDocuments({
      status: "published",
      date: { $gte: currentDate },
    });

    // Get events this month
    const thisMonthStart = new Date(currentYear, currentMonth, 1);
    const thisMonthEnd = new Date(currentYear, currentMonth + 1, 0);
    const thisMonthEvents = await Event.countDocuments({
      status: "published",
      date: {
        $gte: thisMonthStart,
        $lte: thisMonthEnd,
      },
    });

    // Get events by type
    const eventsByType = await Event.aggregate([
      { $match: { status: "published" } },
      {
        $group: {
          _id: "$type",
          count: { $sum: 1 },
        },
      },
      { $sort: { count: -1 } },
    ]);

    // Get events by month (last 12 months)
    const last12Months = [];
    for (let i = 11; i >= 0; i--) {
      const date = new Date(currentYear, currentMonth - i, 1);
      const nextMonth = new Date(currentYear, currentMonth - i + 1, 1);

      const count = await Event.countDocuments({
        status: "published",
        date: {
          $gte: date,
          $lt: nextMonth,
        },
      });

      last12Months.push({
        month: date.toLocaleString("default", {
          month: "short",
          year: "numeric",
        }),
        count,
      });
    }

    // Get mandatory vs optional events
    const mandatoryEvents = await Event.countDocuments({
      status: "published",
      mandatory: true,
    });
    const optionalEvents = await Event.countDocuments({
      status: "published",
      mandatory: false,
    });

    res.status(200).json({
      success: true,
      data: {
        overview: {
          totalEvents,
          publishedEvents,
          draftEvents,
          cancelledEvents,
          upcomingEvents,
          thisMonthEvents,
        },
        eventsByType,
        eventsLast12Months: last12Months,
        eventsByMandatory: {
          mandatory: mandatoryEvents,
          optional: optionalEvents,
        },
      },
    });
  } catch (error) {
    console.error("Get event statistics error:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting event statistics",
    });
  }
};

// @desc    Get upcoming events
// @route   GET /api/events/upcoming
// @access  Private
export const getUpcomingEvents = async (req: AuthRequest, res: Response) => {
  try {
    const limit = parseInt(req.query?.limit as string) || 10;

    let query: any = {
      status: "published",
      date: { $gte: new Date() },
    };

    // If user is a student, filter by appropriate audience
    if (req.user!.role === "student") {
      const student = await Student.findOne({ userId: req.user!._id });
      if (student) {
        query.$or = [
          { targetAudience: "all" },
          { targetAudience: "students" },
          {
            targetAudience: "custom",
            $or: [
              { "customAudience.classes": student.academicInfo.currentClass },
              { "customAudience.individuals": req.user!._id },
            ],
          },
        ];
      }
    }

    const events = await Event.find(query)
      .sort({ date: 1 })
      .limit(limit)
      .populate("organizer", "email")
      .select("-customAudience -updatedBy");

    res.status(200).json({
      success: true,
      data: events,
    });
  } catch (error) {
    console.error("Get upcoming events error:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting upcoming events",
    });
  }
};

// @desc    Remove attachment from event
// @route   DELETE /api/events/admin/:id/attachments/:attachmentIndex
// @access  Private/Admin
export const removeEventAttachment = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { id, attachmentIndex } = req.params;
    const index = parseInt(attachmentIndex);

    const event = await Event.findById(id);
    if (!event) {
      return res.status(404).json({
        success: false,
        message: "Event not found",
      });
    }

    if (!event.attachments || index >= event.attachments.length || index < 0) {
      return res.status(400).json({
        success: false,
        message: "Invalid attachment index",
      });
    }

    // Remove the attachment
    event.attachments.splice(index, 1);
    event.updatedBy = req.user!._id as any;

    await event.save();

    res.status(200).json({
      success: true,
      message: "Attachment removed successfully",
      data: event,
    });
  } catch (error) {
    console.error("Remove event attachment error:", error);
    res.status(500).json({
      success: false,
      message: "Server error removing attachment",
    });
  }
};

// Helper function to send event notifications
const sendEventNotifications = async (event: IEvent) => {
  try {
    let recipients: string[] = [];

    // Determine recipients based on target audience
    if (event.targetAudience === "all" || event.targetAudience === "students") {
      // Get all student emails
      const students = await Student.find({}).populate("userId", "email");
      recipients = students.map((student: any) => student.userId.email);
    } else if (event.targetAudience === "custom") {
      // Get custom audience emails
      if (event.customAudience?.classes?.length) {
        const classStudents = await Student.find({
          "academicInfo.currentClass": { $in: event.customAudience.classes },
        }).populate("userId", "email");
        recipients.push(
          ...classStudents.map((student: any) => student.userId.email)
        );
      }

      if (event.customAudience?.individuals?.length) {
        const individuals = await User.find(
          {
            _id: { $in: event.customAudience.individuals },
          },
          "email"
        );
        recipients.push(...individuals.map((user) => user.email));
      }
    }

    // Remove duplicates
    recipients = [...new Set(recipients)];

    // Send email notifications (in batches to avoid overwhelming email service)
    const batchSize = 50;
    for (let i = 0; i < recipients.length; i += batchSize) {
      const batch = recipients.slice(i, i + batchSize);

      const emailPromises = batch.map((email) =>
        sendEmail({
          to: email,
          subject: `New Event: ${event.title}`,
          html: `
            <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
              <h2 style="color: #059669;">New Event Notification</h2>
              <div style="background-color: #f9f9f9; padding: 20px; border-radius: 8px; margin: 20px 0;">
                <h3 style="color: #333; margin-top: 0;">${event.title}</h3>
                <p><strong>Date:</strong> ${event.date.toLocaleDateString()}</p>
                ${
                  event.startTime
                    ? `<p><strong>Time:</strong> ${event.startTime}${
                        event.endTime ? ` - ${event.endTime}` : ""
                      }</p>`
                    : ""
                }
                ${
                  event.location
                    ? `<p><strong>Location:</strong> ${event.location}</p>`
                    : ""
                }
                ${
                  event.description
                    ? `<p><strong>Description:</strong> ${event.description}</p>`
                    : ""
                }
                ${
                  event.mandatory
                    ? '<p style="color: #dc2626; font-weight: bold;">⚠️ This event is mandatory.</p>'
                    : ""
                }
                <div>
                  <p>A new event has been published!</p>
                  <p>Please log in to your student portal for more details and updates.</p>
                </div>
              </div>
            </div>
          `,
        }).catch((error) => {
          console.error(`Failed to send email to ${email}:`, error);
        })
      );

      await Promise.allSettled(emailPromises);

      // Small delay between batches
      if (i + batchSize < recipients.length) {
        await new Promise((resolve) => setTimeout(resolve, 1000));
      }
    }

    console.log(`Event notifications sent to ${recipients.length} recipients`);
  } catch (error) {
    console.error("Error sending event notifications:", error);
  }
};
