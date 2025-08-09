import { Response } from "express";
import Result from "../models/Result.js";
import Student from "../models/Student.js";
import { AuthRequest } from "../middleware/auth.js";
import { sendEmail } from "../utils/email.js";
import {
  parseResultsFile,
  generateResultsTemplate,
} from "../utils/fileParser.js";
import { cleanupFile } from "../utils/localUpload.js";
import path from "path";
import fs from "fs";

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
    const resultData = req.body;

    // Recalculate scores and grades if subjects are updated
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

      // Recalculate summary
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

      if (resultData.summary) {
        resultData.summary = {
          ...resultData.summary,
          totalScore,
          averageScore,
          overallGrade,
          remark: summaryRemark,
        };
      }
    }

    const result = await Result.findByIdAndUpdate(
      req.params.id,
      {
        ...resultData,
        publishedBy: req.user!._id,
      },
      {
        new: true,
        runValidators: true,
      }
    )
      .populate(
        "studentId",
        "studentId personalInfo.firstName personalInfo.lastName"
      )
      .populate("publishedBy", "email");

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Result not found",
      });
    }

    res.status(200).json({
      success: true,
      message: "Result updated successfully",
      data: result,
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
    const { isPublished } = req.body;

    const result = await Result.findByIdAndUpdate(
      req.params.id,
      {
        isPublished,
        publishedAt: isPublished ? new Date() : undefined,
        publishedBy: req.user!._id,
      },
      { new: true }
    )
      .populate(
        "studentId",
        "studentId personalInfo.firstName personalInfo.lastName contactInfo.email"
      )
      .populate("publishedBy", "email");

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Result not found",
      });
    }

    // Send notification email if publishing
    if (isPublished) {
      try {
        const student = result.studentId as any;
        await sendEmail({
          to: student.contactInfo.email,
          subject: "New Result Published - Regina Nostras Schools",
          html: `
            <h2>New Result Available</h2>
            <p>Dear ${student.personalInfo.firstName} ${student.personalInfo.lastName},</p>
            <p>Your result for ${result.academicSession} academic session, ${result.term} term has been published.</p>
            <p><strong>Class:</strong> ${result.class}</p>
            <p><strong>Overall Grade:</strong> ${result.summary.overallGrade}</p>
            <p><strong>Position:</strong> ${result.summary.position} out of ${result.summary.totalStudents}</p>
            <p>Please login to the student portal to view your complete result.</p>
            <p>Portal URL: ${process.env.FRONTEND_URL}/student/dashboard</p>
            <br>
            <p>Best regards,<br>Regina Nostras Schools Administration</p>
          `,
        });
      } catch (emailError) {
        console.error("Failed to send result notification email:", emailError);
        // Don't fail the entire operation if email fails
      }
    }

    res.status(200).json({
      success: true,
      message: `Result ${
        isPublished ? "published" : "unpublished"
      } successfully`,
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
export const bulkUploadResults = async (req: AuthRequest, res: Response) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        message: "Please upload a file (Excel or CSV format)",
      });
    }

    const fileExtension = path
      .extname(req.file.originalname)
      .toLowerCase()
      .substring(1);

    if (!["xlsx", "xls", "csv"].includes(fileExtension)) {
      return res.status(400).json({
        success: false,
        message: "File must be Excel (.xlsx, .xls) or CSV format",
      });
    }

    // Parse the uploaded file
    const parseResult = await parseResultsFile(req.file.path, fileExtension);

    const createdResults = [];
    const finalErrors = [...parseResult.errors];

    // Process successfully parsed data
    for (const resultData of parseResult.success) {
      try {
        // Validate academic session, term, and class from CSV data
        const { academicSession, term, class: className } = resultData;

        // Validate session format
        if (!/^\d{4}\/\d{4}$/.test(academicSession)) {
          finalErrors.push({
            row: 0,
            studentId: resultData.studentId,
            error: "Academic session must be in format YYYY/YYYY",
          });
          continue;
        }

        // Validate term
        if (!["first", "second", "third"].includes(term)) {
          finalErrors.push({
            row: 0,
            studentId: resultData.studentId,
            error: "Term must be first, second, or third",
          });
          continue;
        }

        // Find student
        const student = await Student.findOne({
          studentId: resultData.studentId,
        });
        if (!student) {
          finalErrors.push({
            row: 0,
            studentId: resultData.studentId,
            error: "Student not found",
          });
          continue;
        }

        // Check if result already exists
        const existingResult = await Result.findOne({
          studentId: student._id,
          academicSession,
          term,
        });

        if (existingResult) {
          finalErrors.push({
            row: 0,
            studentId: resultData.studentId,
            error: `Result already exists for ${academicSession} ${term} term`,
          });
          continue;
        }

        // Calculate scores and grades for each subject
        const processedSubjects = resultData.subjects.map((subject) => {
          const scores = subject.scores || {};
          const { firstCA = 0, secondCA = 0, thirdCA = 0, exam = 0 } = scores;

          // Check if total is provided in the scores object, otherwise calculate it
          const providedTotal = (scores as any).total;
          const finalTotal =
            providedTotal !== null && providedTotal !== undefined
              ? providedTotal
              : firstCA + secondCA + thirdCA + exam;

          // Calculate grade based on total score
          let grade = "F9";
          if (finalTotal >= 80) grade = "A1";
          else if (finalTotal >= 75) grade = "B2";
          else if (finalTotal >= 70) grade = "B3";
          else if (finalTotal >= 65) grade = "C4";
          else if (finalTotal >= 60) grade = "C5";
          else if (finalTotal >= 55) grade = "C6";
          else if (finalTotal >= 50) grade = "D7";
          else if (finalTotal >= 45) grade = "E8";

          // Generate remark based on grade
          let remark = "Fail";
          if (grade === "A1") remark = "Excellent";
          else if (["B2", "B3"].includes(grade)) remark = "Very Good";
          else if (["C4", "C5", "C6"].includes(grade)) remark = "Good";
          else if (grade === "D7") remark = "Pass";
          else if (grade === "E8") remark = "Poor";

          return {
            subjectName: subject.subjectName,
            subjectCode: subject.subjectCode,
            scores: { firstCA, secondCA, thirdCA, exam, total: finalTotal },
            grade,
            remark,
          };
        });

        // Calculate summary
        const totalScore = processedSubjects.reduce(
          (sum, subject) => sum + subject.scores.total,
          0
        );
        const averageScore =
          Math.round((totalScore / processedSubjects.length) * 100) / 100;

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

        // Create result
        const result = await Result.create({
          studentId: student._id,
          academicSession,
          term,
          class: className,
          subjects: processedSubjects,
          summary: {
            totalScore,
            averageScore,
            overallGrade,
            position: 1, // Will be calculated later
            totalStudents: 1, // Will be calculated later
            remark: summaryRemark,
          },
          attendance: resultData.attendance || {
            schoolOpened: 0,
            timesPresent: 0,
            timesAbsent: 0,
          },
          behavioralAssessment: resultData.behavioralAssessment,
          teacherComments: resultData.teacherComments,
          principalComments: resultData.principalComments,
          nextTermBegins: resultData.nextTermBegins,
          publishedBy: req.user!._id,
          isPublished: false, // Initially unpublished
        });

        createdResults.push(result);
      } catch (error) {
        finalErrors.push({
          row: 0,
          studentId: resultData.studentId,
          error: `Error creating result: ${(error as Error).message}`,
        });
      }
    }

    // Calculate positions for all results in this class, session, and term
    if (createdResults.length > 0) {
      try {
        // Use the last processed resultData for academicSession and className
        const lastResultData =
          parseResult.success[parseResult.success.length - 1];
        const academicSession = lastResultData?.academicSession;
        const className = lastResultData?.class;
        const term = lastResultData?.term;

        const allResults = await Result.find({
          academicSession: academicSession,
          term: term,
          class: className,
        }).sort({ "summary.averageScore": -1 });

        const totalStudents = allResults.length;

        // Update positions
        for (let i = 0; i < allResults.length; i++) {
          await Result.findByIdAndUpdate(allResults[i]._id, {
            "summary.position": i + 1,
            "summary.totalStudents": totalStudents,
          });
        }
      } catch (error) {
        console.error("Error updating positions:", error);
        // Don't fail the entire operation
      }
    }

    // Clean up uploaded file
    cleanupFile(req.file.path);

    res.status(200).json({
      success: true,
      message: `Bulk upload completed. ${createdResults.length} results created successfully.`,
      data: {
        totalProcessed: parseResult.success.length,
        successfulUploads: createdResults.length,
        errors: finalErrors,
        results: createdResults.map((r, index) => ({
          id: r._id,
          studentId: parseResult.success[index]?.studentId || "Unknown",
          averageScore: r.summary.averageScore,
          overallGrade: r.summary.overallGrade,
        })),
      },
    });
  } catch (error) {
    console.error("Bulk upload error:", error);

    // Clean up uploaded file in case of error
    if (req.file && req.file.path) {
      cleanupFile(req.file.path);
    }

    res.status(500).json({
      success: false,
      message: "Server error during bulk upload",
    });
  }
};

// @desc    Download bulk upload template
// @route   GET /api/results/bulk-template
// @access  Private/Admin
export const downloadBulkTemplate = async (req: AuthRequest, res: Response) => {
  try {
    const template = await generateResultsTemplate();

    res.setHeader(
      "Content-Type",
      "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet"
    );
    res.setHeader(
      "Content-Disposition",
      "attachment; filename=bulk-results-template.xlsx"
    );

    res.send(template);
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
      select: "studentId personalInfo academicInfo contactInfo",
    });

    if (!result) {
      return res.status(404).json({
        success: false,
        message: "Result not found",
      });
    }

    const student = result.studentId as any;
    const parentEmail =
      student.contactInfo?.parentEmail || student.contactInfo?.guardianEmail;

    if (!parentEmail) {
      return res.status(400).json({
        success: false,
        message: "No parent/guardian email found for this student",
      });
    }

    // Email content
    const emailSubject = `Academic Result - ${student.personalInfo?.firstName} ${student.personalInfo?.lastName} - ${result.academicSession} ${result.term} Term`;

    const emailHtml = `
      <!DOCTYPE html>
      <html>
      <head>
        <style>
          body { font-family: Arial, sans-serif; line-height: 1.6; margin: 0; padding: 20px; }
          .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 20px; text-align: center; border-radius: 10px; }
          .content { background: #f9f9f9; padding: 20px; border-radius: 10px; margin: 20px 0; }
          .summary { background: white; padding: 15px; border-radius: 8px; margin: 15px 0; border-left: 4px solid #667eea; }
          .subjects { width: 100%; border-collapse: collapse; margin: 15px 0; }
          .subjects th, .subjects td { border: 1px solid #ddd; padding: 8px; text-align: left; }
          .subjects th { background-color: #f2f2f2; font-weight: bold; }
          .grade-a { color: #10b981; font-weight: bold; }
          .grade-b { color: #3b82f6; font-weight: bold; }
          .grade-c { color: #f59e0b; font-weight: bold; }
          .grade-d { color: #ef4444; font-weight: bold; }
          .grade-f { color: #dc2626; font-weight: bold; }
          .footer { text-align: center; margin-top: 30px; color: #666; font-size: 12px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>REGINA NOSTRA SCHOOLS</h1>
          <h2>Academic Result Notification</h2>
        </div>

        <div class="content">
          <h3>Dear Parent/Guardian,</h3>
          <p>We are pleased to share the academic result for your child/ward:</p>

          <div class="summary">
            <h4>Student Information</h4>
            <p><strong>Name:</strong> ${
              student.personalInfo?.firstName || ""
            } ${student.personalInfo?.lastName || ""}</p>
            <p><strong>Student ID:</strong> ${student.studentId || "N/A"}</p>
            <p><strong>Class:</strong> ${
              student.academicInfo?.currentClass || "N/A"
            }</p>
            <p><strong>Academic Session:</strong> ${result.academicSession}</p>
            <p><strong>Term:</strong> ${
              result.term.charAt(0).toUpperCase() + result.term.slice(1)
            } Term</p>
          </div>

          <div class="summary">
            <h4>Performance Summary</h4>
            <p><strong>Total Score:</strong> ${result.summary.totalScore}</p>
            <p><strong>Average Score:</strong> ${result.summary.averageScore.toFixed(
              1
            )}%</p>
            <p><strong>Overall Grade:</strong> <span class="grade-${result.summary.overallGrade.toLowerCase()}">${
      result.summary.overallGrade
    }</span></p>
            <p><strong>Position:</strong> ${result.summary.position} out of ${
      result.summary.totalStudents
    } students</p>
          </div>

          <h4>Subject Breakdown</h4>
          <table class="subjects">
            <thead>
              <tr>
                <th>Subject</th>
                <th>1st CA</th>
                <th>2nd CA</th>
                <th>3rd CA</th>
                <th>Exam</th>
                <th>Total</th>
                <th>Grade</th>
              </tr>
            </thead>
            <tbody>
              ${result.subjects
                .map(
                  (subject: any) => `
                <tr>
                  <td>${subject.subjectName}</td>
                  <td>${subject.scores.firstCA || 0}</td>
                  <td>${subject.scores.secondCA || 0}</td>
                  <td>${subject.scores.thirdCA || 0}</td>
                  <td>${subject.scores.exam}</td>
                  <td>${subject.scores.total}</td>
                  <td class="grade-${subject.grade.toLowerCase()}">${
                    subject.grade
                  }</td>
                </tr>
              `
                )
                .join("")}
            </tbody>
          </table>

          <div class="summary">
            <h4>Attendance Record</h4>
            <p><strong>School Opened:</strong> ${
              result.attendance.schoolOpened
            } days</p>
            <p><strong>Times Present:</strong> ${
              result.attendance.timesPresent
            } days</p>
            <p><strong>Times Absent:</strong> ${
              result.attendance.timesAbsent
            } days</p>
          </div>

          ${
            result.teacherComments
              ? `
            <div class="summary">
              <h4>Class Teacher's Comment</h4>
              <p>${result.teacherComments}</p>
            </div>
          `
              : ""
          }

          ${
            result.principalComments
              ? `
            <div class="summary">
              <h4>Principal's Comment</h4>
              <p>${result.principalComments}</p>
            </div>
          `
              : ""
          }

          ${
            result.nextTermBegins
              ? `
            <div class="summary">
              <h4>Next Term Information</h4>
              <p><strong>Next Term Begins:</strong> ${result.nextTermBegins}</p>
            </div>
          `
              : ""
          }

          <p>For any inquiries regarding this result, please contact the school administration.</p>
          <p>Thank you for your continued trust in Regina Nostra Schools.</p>
        </div>

        <div class="footer">
          <p>This is an automated email from Regina Nostra Schools Academic Management System.</p>
          <p>Generated on: ${new Date().toLocaleDateString()}</p>
        </div>
      </body>
      </html>
    `;

    // Send email
    await sendEmail({
      to: parentEmail,
      subject: emailSubject,
      html: emailHtml,
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
