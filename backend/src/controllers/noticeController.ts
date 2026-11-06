import { Response } from "express";
import mongoose from "mongoose";
import Notice from "../models/Notice";
import { AuthRequest } from "../middleware/auth";

const EDITABLE = ["title", "message", "type", "audience", "isActive", "startsAt", "endsAt", "showOnce"];

const cleanBody = (body: any) => {
  const out: Record<string, unknown> = {};
  for (const k of EDITABLE) {
    if (body && k in body) out[k] = body[k];
  }
  // Empty date inputs mean "no limit"
  for (const k of ["startsAt", "endsAt"]) {
    if (out[k] === "" || out[k] === null) out[k] = undefined;
  }
  return out;
};

const datesInvalid = (n: { startsAt?: any; endsAt?: any }) =>
  n.startsAt && n.endsAt && new Date(n.endsAt) <= new Date(n.startsAt);

// @desc    List all login notices
// @route   GET /api/notices
// @access  Private/Admin
export const getNotices = async (_req: AuthRequest, res: Response) => {
  try {
    const notices = await Notice.find().sort({ createdAt: -1 }).lean();
    res.status(200).json({
      success: true,
      data: notices.map(({ dismissedBy, ...n }) => ({
        ...n,
        seenBy: dismissedBy?.length || 0,
      })),
    });
  } catch (error) {
    console.error("Get notices error:", error);
    res.status(500).json({ success: false, message: "Server error getting notices" });
  }
};

// @desc    Create a login notice
// @route   POST /api/notices
// @access  Private/Admin
export const createNotice = async (req: AuthRequest, res: Response) => {
  try {
    const data = cleanBody(req.body);
    if (datesInvalid(data as any)) {
      return res.status(400).json({ success: false, message: "End date must be after the start date" });
    }
    const notice = await Notice.create({ ...data, createdBy: req.user!._id });
    res.status(201).json({ success: true, message: "Notice created", data: notice });
  } catch (error: any) {
    if (error?.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors).map((e: any) => e.message).join("; "),
      });
    }
    console.error("Create notice error:", error);
    res.status(500).json({ success: false, message: "Server error creating notice" });
  }
};

// @desc    Update a login notice
// @route   PUT /api/notices/:id
// @access  Private/Admin
export const updateNotice = async (req: AuthRequest, res: Response) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: "Notice not found" });
    }
    const notice = await Notice.findById(req.params.id);
    if (!notice) return res.status(404).json({ success: false, message: "Notice not found" });

    const data = cleanBody(req.body);
    notice.set(data);
    if (datesInvalid(notice)) {
      return res.status(400).json({ success: false, message: "End date must be after the start date" });
    }
    // Optionally show it again to everyone (e.g. after editing the text)
    if (req.body?.resetSeen === true) notice.dismissedBy = [];
    await notice.save();
    res.status(200).json({ success: true, message: "Notice updated", data: notice });
  } catch (error: any) {
    if (error?.name === "ValidationError") {
      return res.status(400).json({
        success: false,
        message: Object.values(error.errors).map((e: any) => e.message).join("; "),
      });
    }
    console.error("Update notice error:", error);
    res.status(500).json({ success: false, message: "Server error updating notice" });
  }
};

// @desc    Delete a login notice
// @route   DELETE /api/notices/:id
// @access  Private/Admin
export const deleteNotice = async (req: AuthRequest, res: Response) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: "Notice not found" });
    }
    const notice = await Notice.findByIdAndDelete(req.params.id);
    if (!notice) return res.status(404).json({ success: false, message: "Notice not found" });
    res.status(200).json({ success: true, message: "Notice deleted" });
  } catch (error) {
    console.error("Delete notice error:", error);
    res.status(500).json({ success: false, message: "Server error deleting notice" });
  }
};

// @desc    Notices the logged-in student/parent should see now
// @route   GET /api/notices/active
// @access  Private (student, parent)
export const getActiveNotices = async (req: AuthRequest, res: Response) => {
  try {
    const role = req.user!.role;
    const audience = role === "student" ? "students" : role === "parent" ? "parents" : null;
    if (!audience) return res.status(200).json({ success: true, data: [] });

    const now = new Date();
    const notices = await Notice.find({
      isActive: true,
      audience: { $in: ["all", audience] },
      $and: [
        { $or: [{ startsAt: { $exists: false } }, { startsAt: null }, { startsAt: { $lte: now } }] },
        { $or: [{ endsAt: { $exists: false } }, { endsAt: null }, { endsAt: { $gt: now } }] },
        { $or: [{ showOnce: false }, { dismissedBy: { $ne: req.user!._id } }] },
      ],
    })
      .select("title message type showOnce createdAt")
      .sort({ createdAt: -1 })
      .limit(5);

    res.status(200).json({ success: true, data: notices });
  } catch (error) {
    console.error("Get active notices error:", error);
    res.status(500).json({ success: false, message: "Server error getting notices" });
  }
};

// @desc    Mark a notice as seen by the logged-in user
// @route   POST /api/notices/:id/dismiss
// @access  Private (student, parent)
export const dismissNotice = async (req: AuthRequest, res: Response) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: "Notice not found" });
    }
    await Notice.updateOne(
      { _id: req.params.id },
      { $addToSet: { dismissedBy: req.user!._id } }
    );
    res.status(200).json({ success: true });
  } catch (error) {
    console.error("Dismiss notice error:", error);
    res.status(500).json({ success: false, message: "Server error" });
  }
};
