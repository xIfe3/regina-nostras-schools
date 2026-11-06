import { Response } from "express";
import mongoose from "mongoose";
import Parent from "../models/Parent";
import Student from "../models/Student";
import Result from "../models/Result";
import Payment from "../models/Payment";
import { AuthRequest } from "../middleware/auth";

const CHILD_FIELDS =
  "studentId personalInfo.firstName personalInfo.lastName personalInfo.middleName personalInfo.gender personalInfo.dateOfBirth personalInfo.profilePhoto academicInfo";

/**
 * Make sure the requested student is one of the logged-in parent's children.
 * Sends the error response itself and returns null when access is not allowed.
 */
const getOwnedChild = async (req: AuthRequest, res: Response) => {
  const { studentId } = req.params;

  if (!mongoose.isValidObjectId(studentId)) {
    res.status(404).json({ success: false, message: "Child not found" });
    return null;
  }

  const parent = await Parent.findOne({
    userId: req.user!._id,
    children: studentId,
  });

  if (!parent) {
    res.status(404).json({ success: false, message: "Child not found" });
    return null;
  }

  const student = await Student.findById(studentId).select(CHILD_FIELDS);
  if (!student) {
    res.status(404).json({ success: false, message: "Child not found" });
    return null;
  }

  return student;
};

// @desc    Get parent profile with linked children
// @route   GET /api/parent/profile
// @access  Private/Parent
export const getParentProfile = async (req: AuthRequest, res: Response) => {
  try {
    const parent = await Parent.findOne({ userId: req.user!._id }).populate(
      "children",
      CHILD_FIELDS
    );

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent profile not found",
      });
    }

    res.status(200).json({
      success: true,
      data: {
        _id: parent._id,
        name: parent.name,
        phoneNumber: parent.phoneNumber,
        email: req.user!.email,
        children: parent.children,
      },
    });
  } catch (error) {
    console.error("Get parent profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting parent profile",
    });
  }
};

// @desc    Update parent name / phone
// @route   PUT /api/parent/profile
// @access  Private/Parent
export const updateParentProfile = async (req: AuthRequest, res: Response) => {
  try {
    const update: { name?: string; phoneNumber?: string } = {};
    if (typeof req.body.name === "string") update.name = req.body.name.trim();
    if (typeof req.body.phoneNumber === "string")
      update.phoneNumber = req.body.phoneNumber.trim();

    const parent = await Parent.findOneAndUpdate(
      { userId: req.user!._id },
      update,
      { new: true }
    );

    if (!parent) {
      return res.status(404).json({
        success: false,
        message: "Parent profile not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Profile updated successfully",
      data: {
        _id: parent._id,
        name: parent.name,
        phoneNumber: parent.phoneNumber,
      },
    });
  } catch (error) {
    console.error("Update parent profile error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating parent profile",
    });
  }
};

// @desc    Get published results for one of the parent's children
// @route   GET /api/parent/children/:studentId/results
// @access  Private/Parent
export const getChildResults = async (req: AuthRequest, res: Response) => {
  try {
    const student = await getOwnedChild(req, res);
    if (!student) return;

    const query: any = { studentId: student._id, isPublished: true };
    if (req.query?.academicSession)
      query.academicSession = String(req.query.academicSession);
    if (req.query?.term) query.term = String(req.query.term);

    const results = await Result.find(query)
      .sort({ academicSession: -1, term: -1 })
      .select("-publishedBy");

    res.status(200).json({
      success: true,
      data: results,
      student,
    });
  } catch (error) {
    console.error("Get child results error:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting results",
    });
  }
};

// @desc    Get a single published result for one of the parent's children
// @route   GET /api/parent/children/:studentId/results/:resultId
// @access  Private/Parent
export const getChildResult = async (req: AuthRequest, res: Response) => {
  try {
    const student = await getOwnedChild(req, res);
    if (!student) return;

    if (!mongoose.isValidObjectId(req.params.resultId)) {
      return res
        .status(404)
        .json({ success: false, message: "Result not found" });
    }

    const result = await Result.findOne({
      _id: req.params.resultId,
      studentId: student._id,
      isPublished: true,
    }).select("-publishedBy");

    if (!result) {
      return res
        .status(404)
        .json({ success: false, message: "Result not found" });
    }

    res.status(200).json({ success: true, data: result, student });
  } catch (error) {
    console.error("Get child result error:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting result",
    });
  }
};

// @desc    Get payment records for one of the parent's children
// @route   GET /api/parent/children/:studentId/payments
// @access  Private/Parent
export const getChildPayments = async (req: AuthRequest, res: Response) => {
  try {
    const student = await getOwnedChild(req, res);
    if (!student) return;

    const page = Math.max(parseInt(req.query?.page as string) || 1, 1);
    const limit = Math.min(parseInt(req.query?.limit as string) || 10, 50);

    const query: any = { studentId: student._id };
    if (req.query?.status) query.status = String(req.query.status);
    if (req.query?.academicSession)
      query.academicSession = String(req.query.academicSession);
    if (req.query?.term) query.term = String(req.query.term);

    const [payments, total] = await Promise.all([
      Payment.find(query)
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit)
        .select("-verificationDetails.verifiedBy"),
      Payment.countDocuments(query),
    ]);

    const totalPages = Math.ceil(total / limit);

    res.status(200).json({
      success: true,
      data: payments,
      student,
      pagination: {
        currentPage: page,
        totalPages,
        totalPayments: total,
        hasNext: page < totalPages,
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Get child payments error:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting payments",
    });
  }
};
