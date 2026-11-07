import { Response } from "express";
import Result from "../models/Result.js";
import Student from "../models/Student.js";
import { AuthRequest } from "../middleware/auth.js";
import { sendEmail } from "../utils/email.js";
import { getParentContact } from "../utils/parentAccount.js";
import {
  parseResultsFile,
  generateResultsTemplateCsv,
} from "../utils/fileParser.js";
import {
  buildSubject,
  buildSummary,
  recalculatePositions,
  notifyResultPublished,
} from "../utils/resultHelpers.js";
import mongoose from "mongoose";
import Parent from "../models/Parent.js";
import { getSettings } from "../utils/settings.js";
import { cleanupFile } from "../utils/localUpload.js";
import path from "path";
import fs from "fs";
import { resultFullEmail } from "../utils/emailTemplates.js";

// @desc    Get student results
// @route   GET /api/results/student
// @access  Private/Student
export const getStudentResults = async (req: AuthRequest, res: Response) => {
  try {
    const student = await Student.findOne({ userId: req.user!._id });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    console.log("Found student:", {
      _id: student._id,
      studentId: student.studentId,
      userId: student.userId,
    });

    const academicSession = req.query?.academicSession as string;
    const term = req.query?.term as string;

    let query: any = {
      studentId: student._id, // This should be the ObjectId reference
      isPublished: true,
    };

    console.log("Query for results:", query);

    if (academicSession) {
      query.academicSession = academicSession;
    }

    if (term) {
      query.term = term;
    }

    const results = await Result.find(query)
      .sort({ academicSession: -1, term: -1 })
      .populate("publishedBy", "email");

    console.log("Results", results);

    res.status(200).json({
      success: true,
      data: results,
    });
  } catch (error) {
    console.error("Get student results error:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting results",
    });
  }
};

// @desc    Get single result
// @route   GET /api/results/student/:id
// @access  Private/Student
export const getResult = async (req: AuthRequest, res: Response) => {
  try {
    const student = await Student.findOne({ userId: req.user!._id });
    if (!student) {
      return res.status(404).json({
        success: false,
        message: "Student profile not found",
      });
    }

    const result = await Result.findOne({
      _id: req.params.id,
      studentId: student._id,
      isPublished: true,
    }).populate("publishedBy", "email");

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Result not found",
      });
    }

    res.status(200).json({
      success: true,
      data: result,
    });
  } catch (error) {
    console.error("Get result error:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting result",
    });
  }
};

// @desc    Get all results for admin
// @route   GET /api/results
// @access  Private/Admin
export const getResults = async (req: AuthRequest, res: Response) => {
  try {
    const page = parseInt(req.query?.page as string) || 1;
    const limit = parseInt(req.query?.limit as string) || 10;
    const academicSession = req.query?.academicSession as string;
    const term = req.query?.term as string;
    const class_ = req.query?.class as string;
    const isPublished = req.query?.isPublished as string;

    let query: any = {};

    if (academicSession) {
      query.academicSession = academicSession;
    }

    if (term) {
      query.term = term;
    }

    if (class_) {
      query.class = class_;
    }

    if (isPublished !== undefined) {
      query.isPublished = isPublished === "true";
    }

    const skip = (page - 1) * limit;

    const results = await Result.find(query)
      .populate(
        "studentId",
        "studentId personalInfo.firstName personalInfo.lastName academicInfo.currentClass"
      )
      .populate("publishedBy", "email")
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await Result.countDocuments(query);

    res.status(200).json({
      success: true,
      data: results,
      pagination: {
        currentPage: page,
        totalPages: Math.ceil(total / limit),
        totalResults: total,
        hasNext: page < Math.ceil(total / limit),
        hasPrev: page > 1,
      },
    });
  } catch (error) {
    console.error("Get results error:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting results",
    });
  }
};

// @desc    Create/Update result
// @route   POST /api/results
// @access  Private/Admin
export const createResult = async (req: AuthRequest, res: Response) => {
  try {
    const resultData = req.body;

    // Find student by studentId if provided
    if (resultData.studentIdString) {
      const student = await Student.findOne({
        studentId: resultData.studentIdString,
      });
      if (!student) {
        return res.status(404).json({
          success: false,
          message: "Student not found",
        });
      }
      resultData.studentId = student._id;
      delete resultData.studentIdString;
    }

    // Check if result already exists
    const existingResult = await Result.findOne({
      studentId: resultData.studentId,
      academicSession: resultData.academicSession,
      term: resultData.term,
    });

    if (existingResult) {
      return res.status(400).json({
        success: false,
        message:
          "Result already exists for this student in the specified session and term",
      });
    }

    // Calculate scores and grades for each subject
    if (resultData.subjects && Array.isArray(resultData.subjects)) {
      resultData.subjects = resultData.subjects.map((subject: any) => {
        const { firstCA = 0, secondCA = 0, thirdCA = 0, exam } = subject.scores;
        const total = firstCA + secondCA + thirdCA + exam;

        // Calculate grade based on total score
        let grade = "F9";
        if (total >= 80) grade = "A1";
        else if (total >= 75) grade = "B2";
        else if (total >= 70) grade = "B3";
        else if (total >= 65) grade = "C4";
        else if (total >= 60) grade = "C5";
        else if (total >= 55) grade = "C6";
        else if (total >= 50) grade = "D7";
        else if (total >= 45) grade = "E8";

        // Generate remark based on grade
        let remark = "Fail";
        if (grade === "A1") remark = "Excellent";
        else if (["B2", "B3"].includes(grade)) remark = "Very Good";
        else if (["C4", "C5", "C6"].includes(grade)) remark = "Good";
        else if (grade === "D7") remark = "Pass";
        else if (grade === "E8") remark = "Poor";

        return {
          ...subject,
          scores: { firstCA, secondCA, thirdCA, exam, total },
          grade,
          remark,
        };
      });

      // Calculate summary
      const totalScore = resultData.subjects.reduce(
        (sum: number, subject: any) => sum + subject.scores.total,
        0
      );
      const averageScore =
        Math.round((totalScore / resultData.subjects.length) * 100) / 100;

      let overallGrade = "F9";
      if (averageScore >= 80) overallGrade = "A1";
      else if (averageScore >= 75) overallGrade = "B2";
      else if (averageScore >= 70) overallGrade = "B3";
      else if (averageScore >= 65) overallGrade = "C4";
      else if (averageScore >= 60) overallGrade = "C5";
      else if (averageScore >= 55) overallGrade = "C6";
      else if (averageScore >= 50) overallGrade = "D7";
      else if (averageScore >= 45) overallGrade = "E8";

      let summaryRemark = "Poor Performance";
      if (overallGrade === "A1") summaryRemark = "Excellent Performance";
      else if (["B2", "B3"].includes(overallGrade))
        summaryRemark = "Very Good Performance";
      else if (["C4", "C5", "C6"].includes(overallGrade))
        summaryRemark = "Good Performance";
      else if (overallGrade === "D7") summaryRemark = "Fair Performance";
      else if (overallGrade === "E8")
        summaryRemark = "Below Average Performance";

      resultData.summary = {
        totalScore,
        averageScore,
        overallGrade,
        position: resultData.summary?.position || 1,
        totalStudents: resultData.summary?.totalStudents || 1,
        remark: summaryRemark,
      };
    }

    const result = await Result.create({
      ...resultData,
      publishedBy: req.user!._id,
      published: true,
    });

    const populatedResult = await Result.findById(result._id)
      .populate(
        "studentId",
        "studentId personalInfo.firstName personalInfo.lastName"
      )
      .populate("publishedBy", "email");

    res.status(201).json({
      success: true,
      message: "Result created successfully",
      data: populatedResult,
    });
  } catch (error) {
    console.error("Create result error:", error);
    res.status(500).json({
      success: false,
      message: "Server error creating result",
    });
  }
};

// @desc    Update result
// @route   PUT /api/results/:id
// @access  Private/Admin
export const updateResult = async (req: AuthRequest, res: Response) => {
  try {
    const existing = await Result.findById(req.params.id);
    if (!existing) {
      return res.status(404).json({
        success: false,
        message: "Result not found",
      });
    }

    // Only allow editing result content; never the owner, publisher or id
    const {
      _id,
      studentId,
      publishedBy,
      createdAt,
      updatedAt,
      __v,
      isPublished,
      publishedAt,
      ...resultData
    } = req.body || {};

    if (resultData.subjects && Array.isArray(resultData.subjects)) {
      resultData.subjects = resultData.subjects.map(buildSubject);
      const summary = buildSummary(resultData.subjects);
      resultData.summary = {
        ...(existing.summary as any)?.toObject?.(),
        ...summary,
        position: existing.summary.position,
        totalStudents: existing.summary.totalStudents,
      };
    } else {
      delete resultData.summary;
    }

    const result = await Result.findByIdAndUpdate(req.params.id, resultData, {
      new: true,
      runValidators: true,
    });

    // Scores (or the class) may have changed, so refresh positions
    const groups = new Set([
      `${existing.academicSession}|${existing.term}|${existing.class}`,
      `${result!.academicSession}|${result!.term}|${result!.class}`,
    ]);
    for (const g of groups) {
      const [s, t, c] = g.split("|");
      await recalculatePositions(s, t, c);
    }

    const populated = await Result.findById(req.params.id)
      .populate(
        "studentId",
        "studentId personalInfo.firstName personalInfo.lastName academicInfo.currentClass"
      )
      .populate("publishedBy", "email");

    res.status(200).json({
      success: true,
      message: "Result updated successfully",
      data: populated,
    });
  } catch (error) {
    console.error("Update result error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating result",
    });
  }
};

// @desc    Publish/Unpublish result
// @route   PUT /api/results/:id/publish
// @access  Private/Admin
export const toggleResultPublication = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const isPublished = req.body?.isPublished === true;

    const result = await Result.findByIdAndUpdate(
      req.params.id,
      isPublished
        ? { isPublished: true, publishedAt: new Date(), publishedBy: req.user!._id }
        : { isPublished: false, $unset: { publishedAt: 1 } },
      { new: true }
    )
      .populate(
        "studentId",
        "studentId personalInfo.firstName personalInfo.lastName academicInfo.currentClass"
      )
      .populate("publishedBy", "email");

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Result not found",
      });
    }

    // Email student and parent in the background
    if (isPublished && req.body?.notify !== false) {
      notifyResultPublished(String(result._id)).catch(() => undefined);
    }

    res.status(200).json({
      success: true,
      message: `Result ${isPublished ? "published" : "unpublished"} successfully`,
      data: result,
    });
  } catch (error) {
    console.error("Toggle result publication error:", error);
    res.status(500).json({
      success: false,
      message: "Server error updating result publication status",
    });
  }
};

// @desc    Publish or unpublish many results at once
// @route   POST /api/results/publish
// @access  Private/Admin
// @body    { resultIds?: string[], academicSession?, term?, class?, isPublished: boolean, notify?: boolean }
export const publishResults = async (req: AuthRequest, res: Response) => {
  try {
    const { resultIds, academicSession, term } = req.body || {};
    const className = req.body?.class;
    const isPublished = req.body?.isPublished !== false;
    const notify = req.body?.notify !== false;

    const query: any = {};
    if (Array.isArray(resultIds) && resultIds.length > 0) {
      const ids = resultIds.filter((id: string) => mongoose.isValidObjectId(id));
      if (ids.length === 0) {
        return res.status(400).json({ success: false, message: "No valid result IDs given" });
      }
      query._id = { $in: ids };
    } else {
      if (!academicSession || !term) {
        return res.status(400).json({
          success: false,
          message: "Choose the results to publish: give resultIds, or academicSession and term (and optionally class)",
        });
      }
      query.academicSession = academicSession;
      query.term = term;
      if (className) query.class = className;
    }

    // Only touch results whose state actually changes
    query.isPublished = !isPublished;
    const toChange = await Result.find(query).select("_id");
    const ids = toChange.map((r) => r._id);

    if (ids.length > 0) {
      await Result.updateMany(
        { _id: { $in: ids } },
        isPublished
          ? { $set: { isPublished: true, publishedAt: new Date(), publishedBy: req.user!._id } }
          : { $set: { isPublished: false }, $unset: { publishedAt: 1 } }
      );
    }

    if (isPublished && notify && ids.length > 0) {
      // Send emails one after another in the background so the request returns quickly
      (async () => {
        for (const id of ids) await notifyResultPublished(String(id));
      })().catch(() => undefined);
    }

    res.status(200).json({
      success: true,
      message: `${ids.length} result(s) ${isPublished ? "published" : "unpublished"}${
        isPublished && notify && ids.length > 0 ? ". Students and parents are being emailed." : "."
      }`,
      data: { changed: ids.length },
    });
  } catch (error) {
    console.error("Bulk publish error:", error);
    res.status(500).json({
      success: false,
      message: "Server error publishing results",
    });
  }
};

// @desc    Delete result
// @route   DELETE /api/results/:id
// @access  Private/Admin
export const deleteResult = async (req: AuthRequest, res: Response) => {
  try {
    const result = await Result.findByIdAndDelete(req.params.id);

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Result not found",
      });
    }

    await recalculatePositions(result.academicSession, result.term, result.class);

    res.status(200).json({
      success: true,
      message: "Result deleted successfully",
    });
  } catch (error) {
    console.error("Delete result error:", error);
    res.status(500).json({
      success: false,
      message: "Server error deleting result",
    });
  }
};


// @desc    Get available academic sessions and terms
// @route   GET /api/results/sessions-terms
// @access  Private
export const getSessionsAndTerms = async (req: AuthRequest, res: Response) => {
  try {
    const sessions = await Result.distinct("academicSession");
    const terms = ["first", "second", "third"];

    // Sort sessions in descending order
    sessions.sort((a, b) => b.localeCompare(a));

    res.status(200).json({
      success: true,
      data: {
        sessions,
        terms,
      },
    });
  } catch (error) {
    console.error("Get sessions and terms error:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting sessions and terms",
    });
  }
};

// @desc    Get class statistics for a session and term
// @route   GET /api/results/statistics
// @access  Private/Admin
export const getResultStatistics = async (req: AuthRequest, res: Response) => {
  try {
    const { academicSession, term, class: className } = req.query;

    if (!academicSession || !term) {
      return res.status(400).json({
        success: false,
        message: "Academic session and term are required",
      });
    }

    let query: any = {
      academicSession,
      term,
      isPublished: true,
    };

    if (className) {
      query.class = className;
    }

    const results = await Result.find(query).populate(
      "studentId",
      "personalInfo.firstName personalInfo.lastName"
    );

    const totalStudents = results.length;

    if (totalStudents === 0) {
      return res.status(200).json({
        success: true,
        data: {
          totalStudents: 0,
          averageScore: 0,
          gradeDistribution: {},
          topPerformers: [],
          classAverage: 0,
        },
      });
    }

    // Calculate statistics
    const totalScore = results.reduce(
      (sum, result) => sum + result.summary.averageScore,
      0
    );
    const classAverage = Math.round((totalScore / totalStudents) * 100) / 100;

    // Grade distribution
    const gradeDistribution: any = {};
    results.forEach((result) => {
      const grade = result.summary.overallGrade;
      gradeDistribution[grade] = (gradeDistribution[grade] || 0) + 1;
    });

    // Top 10 performers
    const topPerformers = results
      .sort((a, b) => b.summary.averageScore - a.summary.averageScore)
      .slice(0, 10)
      .map((result, index) => ({
        position: index + 1,
        studentName: `${(result.studentId as any).personalInfo.firstName} ${
          (result.studentId as any).personalInfo.lastName
        }`,
        averageScore: result.summary.averageScore,
        overallGrade: result.summary.overallGrade,
      }));

    res.status(200).json({
      success: true,
      data: {
        totalStudents,
        classAverage,
        gradeDistribution,
        topPerformers,
        academicSession,
        term,
        class: className || "All Classes",
      },
    });
  } catch (error) {
    console.error("Get result statistics error:", error);
    res.status(500).json({
      success: false,
      message: "Server error getting result statistics",
    });
  }
};

// @desc    Upload bulk results from file
// @route   POST /api/results/bulk-upload
// @access  Private/Admin
// @body    multipart: file (.xlsx/.csv), replaceExisting ("true" to overwrite existing results)
export const bulkUploadResults = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a file (Excel .xlsx or CSV)",
      });
    }

    const fileExtension = path
      .extname(req.file.originalname)
      .toLowerCase()
      .substring(1);
    const replaceExisting = String(req.body?.replaceExisting) === "true";

    const parseResult = await parseResultsFile(req.file.path, fileExtension);
    cleanupFile(req.file.path);

    const errors = [...parseResult.errors];
    const saved: Array<{
      id: string;
      row: number;
      studentId: string;
      studentName: string;
      class: string;
      averageScore: number;
      overallGrade: string;
      replaced: boolean;
    }> = [];
    const touchedGroups = new Set<string>();

    for (const data of parseResult.success) {
      try {
        const student = await Student.findOne({ studentId: data.studentId });
        if (!student) {
          errors.push({ row: data.rowNumber, studentId: data.studentId, error: "No student with this Student ID exists" });
          continue;
        }

        const subjects = data.subjects.map(buildSubject);
        const summary = buildSummary(subjects);

        const content = {
          class: data.class,
          subjects,
          summary: { ...summary, position: 1, totalStudents: 1 },
          attendance: data.attendance || { schoolOpened: 0, timesPresent: 0, timesAbsent: 0 },
          behavioralAssessment: data.behavioralAssessment,
          teacherComments: data.teacherComments,
          principalComments: data.principalComments,
          nextTermBegins: data.nextTermBegins,
        };

        const existing = await Result.findOne({
          studentId: student._id,
          academicSession: data.academicSession,
          term: data.term,
        });

        let doc;
        if (existing) {
          if (!replaceExisting) {
            errors.push({
              row: data.rowNumber,
              studentId: data.studentId,
              error: `A result already exists for ${data.academicSession} ${data.term} term. Tick "Replace existing results" to overwrite it.`,
            });
            continue;
          }
          // Remember the old class so its positions are refreshed too
          touchedGroups.add(`${existing.academicSession}|${existing.term}|${existing.class}`);
          existing.set(content);
          doc = await existing.save();
        } else {
          doc = await Result.create({
            ...content,
            studentId: student._id,
            academicSession: data.academicSession,
            term: data.term,
            publishedBy: req.user!._id,
            isPublished: false, // saved as draft; admin publishes after review
          });
        }

        touchedGroups.add(`${data.academicSession}|${data.term}|${data.class}`);
        saved.push({
          id: String(doc._id),
          row: data.rowNumber,
          studentId: data.studentId,
          studentName: `${student.personalInfo.firstName} ${student.personalInfo.lastName}`,
          class: data.class,
          averageScore: summary.averageScore,
          overallGrade: summary.overallGrade,
          replaced: !!existing,
        });
      } catch (error) {
        errors.push({
          row: data.rowNumber,
          studentId: data.studentId,
          error: `Could not save result: ${(error as Error).message}`,
        });
      }
    }

    // Refresh class positions for every class/session/term touched by this upload
    for (const g of touchedGroups) {
      const [s, t, c] = g.split("|");
      try {
        await recalculatePositions(s, t, c);
      } catch (error) {
        console.error("Error updating positions:", error);
      }
    }

    errors.sort((a, b) => a.row - b.row);
    const created = saved.filter((s) => !s.replaced).length;
    const replaced = saved.length - created;

    res.status(200).json({
      success: saved.length > 0 || errors.length === 0,
      message:
        saved.length > 0
          ? `${saved.length} result(s) saved as drafts${replaced ? ` (${replaced} replaced)` : ""}. Review them and publish when ready.`
          : "No results were saved. Fix the errors and upload again.",
      data: {
        totalRows: parseResult.success.length + parseResult.errors.length,
        totalProcessed: parseResult.success.length + parseResult.errors.length,
        successfulUploads: saved.length,
        created,
        replaced,
        errors,
        results: saved,
        groups: Array.from(touchedGroups).map((g) => {
          const [academicSession, term, className] = g.split("|");
          return { academicSession, term, class: className };
        }),
      },
    });
  } catch (error) {
    console.error("Bulk upload error:", error);
    if (req.file && req.file.path) {
      cleanupFile(req.file.path);
    }
    res.status(500).json({
      success: false,
      message: "Server error during bulk upload",
    });
  }
};

// @desc    Download bulk upload template (CSV). With ?class=, one row per student in that class is pre-filled.
// @route   GET /api/results/bulk-template?class=&academicSession=&term=&subjects=Maths,English
// @access  Private/Admin
export const downloadBulkTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const className = String(req.query?.class || "").trim();
    const academicSession = String(req.query?.academicSession || "").trim();
    const term = String(req.query?.term || "").trim();
    const subjects = String(req.query?.subjects || "")
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean);

    let students: Array<{ studentId: string; name: string; className: string }> | undefined;
    if (className) {
      const docs = await Student.find({
        "academicInfo.currentClass": className,
        "academicInfo.status": "active",
      })
        .select("studentId personalInfo.firstName personalInfo.lastName academicInfo.currentClass")
        .sort({ "personalInfo.lastName": 1, "personalInfo.firstName": 1 });

      students = docs.map((d) => ({
        studentId: d.studentId,
        name: `${d.personalInfo.lastName} ${d.personalInfo.firstName}`,
        className: d.academicInfo.currentClass,
      }));

      if (students.length === 0) {
        return res.status(404).json({
          success: false,
          message: `No active students found in class "${className}"`,
        });
      }
    }

    const csv = generateResultsTemplateCsv({ students, academicSession, term, subjects });
    const safeName = (className || "sample").replace(/[^a-z0-9]+/gi, "_");

    res.setHeader("Content-Type", "text/csv; charset=utf-8");
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="results_template_${safeName}.csv"`
    );
    res.send(csv);
  } catch (error) {
    console.error("Download template error:", error);
    res.status(500).json({
      success: false,
      message: "Server error generating template",
    });
  }
};


// @desc    Generate result sheet PDF
// @route   POST /api/results/generate-sheet
// @access  Private/Admin
export const generateResultSheet = async (req: AuthRequest, res: Response) => {
  try {
    const { resultId } = req.body;

    if (!resultId) {
      return res.status(400).json({
        success: false,
        message: "Result ID is required",
      });
    }

    const result = await Result.findById(resultId).populate({
      path: "studentId",
      select: "studentId personalInfo academicInfo contactInfo",
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Result not found",
      });
    }

    // Import PDFKit dynamically
    const PDFDocument = require("pdfkit");
    const doc = new PDFDocument({ margin: 50 });

    // Set response headers for PDF download
    res.setHeader("Content-Type", "application/pdf");
    const _student = result.studentId as any;
    res.setHeader(
      "Content-Disposition",
      `attachment; filename="result_sheet_${_student?.studentId}_${result.academicSession}_${result.term}.pdf"`
    );

    // Pipe the PDF to the response
    doc.pipe(res);

    // School Header
    doc
      .fontSize(20)
      .font("Helvetica-Bold")
      .text("REGINA NOSTRA SCHOOLS", 50, 50, { align: "center" });
    doc
      .fontSize(14)
      .font("Helvetica")
      .text("Academic Result Sheet", 50, 80, { align: "center" });
    doc.moveDown(2);

    // Student Information
    const student = result.studentId as any;
    doc
      .fontSize(12)
      .font("Helvetica-Bold")
      .text("STUDENT INFORMATION", 50, doc.y);
    doc.moveDown(0.5);

    doc
      .font("Helvetica")
      .text(
        `Name: ${student.personalInfo?.firstName || ""} ${
          student.personalInfo?.lastName || ""
        }`,
        50,
        doc.y
      );
    doc.text(`Student ID: ${student.studentId || "N/A"}`, 50, doc.y);
    doc.text(
      `Class: ${student.academicInfo?.currentClass || "N/A"}`,
      50,
      doc.y
    );
    doc.text(`Academic Session: ${result.academicSession}`, 50, doc.y);
    doc.text(
      `Term: ${
        result.term.charAt(0).toUpperCase() + result.term.slice(1)
      } Term`,
      50,
      doc.y
    );
    doc.moveDown(1);

    // Results Table
    doc.font("Helvetica-Bold").text("ACADEMIC PERFORMANCE", 50, doc.y);
    doc.moveDown(0.5);

    // Table headers
    const startY = doc.y;
    const rowHeight = 25;
    let currentY = startY;

    // Draw table headers
    doc.rect(50, currentY, 500, rowHeight).stroke();
    doc.font("Helvetica-Bold").fontSize(10);
    doc.text("SUBJECT", 60, currentY + 8);
    doc.text("1ST CA", 180, currentY + 8);
    doc.text("2ND CA", 230, currentY + 8);
    doc.text("3RD CA", 280, currentY + 8);
    doc.text("EXAM", 330, currentY + 8);
    doc.text("TOTAL", 380, currentY + 8);
    doc.text("GRADE", 430, currentY + 8);
    doc.text("REMARK", 480, currentY + 8);

    currentY += rowHeight;

    // Draw subject rows
    doc.font("Helvetica").fontSize(9);
    result.subjects.forEach((subject: any) => {
      doc.rect(50, currentY, 500, rowHeight).stroke();
      doc.text(subject.subjectName.substring(0, 15), 60, currentY + 8);
      doc.text((subject.scores.firstCA || 0).toString(), 185, currentY + 8);
      doc.text((subject.scores.secondCA || 0).toString(), 235, currentY + 8);
      doc.text((subject.scores.thirdCA || 0).toString(), 285, currentY + 8);
      doc.text(subject.scores.exam.toString(), 335, currentY + 8);
      doc.text(subject.scores.total.toString(), 385, currentY + 8);
      doc.text(subject.grade, 435, currentY + 8);
      doc.text(subject.remark.substring(0, 10), 485, currentY + 8);
      currentY += rowHeight;
    });

    // Summary
    doc.moveDown(2);
    doc
      .font("Helvetica-Bold")
      .fontSize(12)
      .text("SUMMARY", 50, currentY + 20);
    doc.moveDown(0.5);

    doc.font("Helvetica").fontSize(10);
    doc.text(`Total Score: ${result.summary.totalScore}`, 50, doc.y);
    doc.text(
      `Average Score: ${result.summary.averageScore.toFixed(1)}%`,
      50,
      doc.y
    );
    doc.text(`Overall Grade: ${result.summary.overallGrade}`, 50, doc.y);
    doc.text(
      `Position: ${result.summary.position} out of ${result.summary.totalStudents}`,
      50,
      doc.y
    );
    doc.moveDown(1);

    // Attendance
    doc.font("Helvetica-Bold").text("ATTENDANCE RECORD", 50, doc.y);
    doc.moveDown(0.5);
    doc.font("Helvetica");
    doc.text(
      `School Opened: ${result.attendance.schoolOpened} days`,
      50,
      doc.y
    );
    doc.text(
      `Times Present: ${result.attendance.timesPresent} days`,
      50,
      doc.y
    );
    doc.text(`Times Absent: ${result.attendance.timesAbsent} days`, 50, doc.y);
    doc.moveDown(1);

    // Comments
    if (result.teacherComments) {
      doc.font("Helvetica-Bold").text("CLASS TEACHER'S COMMENT:", 50, doc.y);
      doc
        .font("Helvetica")
        .text(result.teacherComments, 50, doc.y, { width: 500 });
      doc.moveDown(1);
    }

    if (result.principalComments) {
      doc.font("Helvetica-Bold").text("PRINCIPAL'S COMMENT:", 50, doc.y);
      doc
        .font("Helvetica")
        .text(result.principalComments, 50, doc.y, { width: 500 });
      doc.moveDown(1);
    }

    // Footer
    doc.moveDown(2);
    doc
      .fontSize(8)
      .text(`Generated on: ${new Date().toLocaleDateString()}`, 50, doc.y);
    if (result.nextTermBegins) {
      doc.text(`Next Term Begins: ${result.nextTermBegins}`, 50, doc.y);
    }

    // Finalize the PDF
    doc.end();
  } catch (error) {
    console.error("Generate result sheet error:", error);
    res.status(500).json({
      success: false,
      message: "Server error generating result sheet",
    });
  }
};

// @desc    Send result notification to parent
// @route   POST /api/results/send-notification
// @access  Private/Admin
export const sendResultNotification = async (
  req: AuthRequest,
  res: Response
) => {
  try {
    const { resultId } = req.body;

    if (!resultId) {
      return res.status(400).json({
        success: false,
        message: "Result ID is required",
      });
    }

    const result = await Result.findById(resultId).populate({
      path: "studentId",
      select:
        "studentId personalInfo academicInfo contactInfo parentGuardianInfo",
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Result not found",
      });
    }

    const student = result.studentId as any;
    const parentEmail = getParentContact(student)?.email;

    if (!parentEmail) {
      return res.status(400).json({
        success: false,
        message: "No parent/guardian email found for this student",
      });
    }

    await sendEmail({
      to: parentEmail,
      ...(await resultFullEmail(result, student)),
    });

    res.status(200).json({
      success: true,
      message: "Result notification sent successfully",
      data: {
        sentTo: parentEmail,
        studentName: `${student.personalInfo?.firstName} ${student.personalInfo?.lastName}`,
        resultId: result._id,
      },
    });
  } catch (error) {
    console.error("Send result notification error:", error);
    res.status(500).json({
      success: false,
      message: "Server error sending result notification",
    });
  }
};

// @desc    Everything needed to render a printable report sheet (result, student, letterhead)
// @route   GET /api/results/:id/sheet
// @access  Private: admin (any result), student (own published), parent (own child's published)
export const getResultSheet = async (req: AuthRequest, res: Response) => {
  try {
    if (!mongoose.isValidObjectId(req.params.id)) {
      return res.status(404).json({ success: false, message: "Result not found" });
    }

    const result = await Result.findById(req.params.id).select("-publishedBy");
    if (!result) {
      return res.status(404).json({ success: false, message: "Result not found" });
    }

    const role = req.user!.role;
    if (role !== "admin") {
      let allowed = false;
      if (role === "student") {
        const me = await Student.findOne({ userId: req.user!._id }).select("_id");
        allowed = !!me && String(me._id) === String(result.studentId);
      } else if (role === "parent") {
        const parent = await Parent.findOne({
          userId: req.user!._id,
          children: result.studentId,
        }).select("_id");
        allowed = !!parent;
      }
      // Drafts are only visible to the school
      if (!allowed || !result.isPublished) {
        return res.status(404).json({ success: false, message: "Result not found" });
      }
    }

    const student = await Student.findById(result.studentId).select(
      "studentId personalInfo.firstName personalInfo.lastName personalInfo.middleName personalInfo.gender personalInfo.dateOfBirth personalInfo.profilePhoto academicInfo.currentClass academicInfo.classArm"
    );
    const settings = await getSettings();

    res.status(200).json({
      success: true,
      data: {
        result,
        student,
        school: settings.school,
        sheet: settings.resultSheet,
      },
    });
  } catch (error) {
    console.error("Get result sheet error:", error);
    res.status(500).json({ success: false, message: "Server error getting result sheet" });
  }
};
