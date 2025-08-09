import ExcelJS from "exceljs";
import * as fs from "fs";
import Student from "../models/Student.js";

export interface ParsedResultData {
  studentId: string;
  academicSession: string;
  term: string;
  class: string;
  subjects: Array<{
    subjectName: string;
    subjectCode?: string;
    scores: {
      firstCA?: number;
      secondCA?: number;
      thirdCA?: number;
      exam: number;
    };
  }>;
  attendance?: {
    schoolOpened: number;
    timesPresent: number;
    timesAbsent: number;
  };
  behavioralAssessment?: {
    punctuality?: string;
    neatness?: string;
    politeness?: string;
    honesty?: string;
    leadership?: string;
    relationship?: string;
  };
  teacherComments?: string;
  principalComments?: string;
  nextTermBegins?: Date;
}

export interface BulkUploadResult {
  success: ParsedResultData[];
  errors: Array<{
    row: number;
    studentId?: string;
    error: string;
  }>;
}

// Parse Excel/CSV file for bulk result upload
export const parseResultsFile = async (
  filePath: string,
  fileType: string
): Promise<BulkUploadResult> => {
  const result: BulkUploadResult = {
    success: [],
    errors: [],
  };

  try {
    let jsonData: any[] = [];

    if (fileType === "xlsx" || fileType === "xls") {
      const workbook = new ExcelJS.Workbook();
      await workbook.xlsx.readFile(filePath);
      const worksheet = workbook.worksheets[0];

      // Convert worksheet to JSON
      const rows: any[] = [];
      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header row
        const rowData: any = {};
        row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
          const header =
            worksheet.getRow(1).getCell(colNumber).value?.toString() ||
            `Column${colNumber}`;
          rowData[header] = cell.value;
        });
        rows.push(rowData);
      });
      jsonData = rows;
    } else if (fileType === "csv") {
      const csvData = fs.readFileSync(filePath, "utf8");
      const workbook = new ExcelJS.Workbook();
      await workbook.csv.readFile(filePath);
      const worksheet = workbook.worksheets[0];

      // Convert worksheet to JSON
      const rows: any[] = [];
      worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
        if (rowNumber === 1) return; // Skip header row
        const rowData: any = {};
        row.eachCell({ includeEmpty: false }, (cell, colNumber) => {
          const header =
            worksheet.getRow(1).getCell(colNumber).value?.toString() ||
            `Column${colNumber}`;
          rowData[header] = cell.value;
        });
        rows.push(rowData);
      });
      jsonData = rows;
    } else {
      throw new Error(
        "Unsupported file format. Please use Excel (.xlsx, .xls) or CSV files."
      );
    }

    for (let i = 0; i < jsonData.length; i++) {
      const row = jsonData[i] as any;
      const rowNumber = i + 2; // +2 because row 1 is header, and array is 0-indexed

      try {
        // Validate required fields
        if (!row["Student ID"] && !row["student_id"] && !row["studentId"]) {
          result.errors.push({
            row: rowNumber,
            error: "Student ID is required",
          });
          continue;
        }

        // Validate academic session, term, and class
        const academicSession =
          row["Academic Session"] ||
          row["academic_session"] ||
          row["academicSession"];
        const term = row["Term"] || row["term"];
        const className = row["Class"] || row["class"];

        if (!academicSession) {
          result.errors.push({
            row: rowNumber,
            error: "Academic Session is required",
          });
          continue;
        }

        if (!term) {
          result.errors.push({
            row: rowNumber,
            error: "Term is required",
          });
          continue;
        }

        if (!className) {
          result.errors.push({
            row: rowNumber,
            error: "Class is required",
          });
          continue;
        }

        const studentId =
          row["Student ID"] || row["student_id"] || row["studentId"];

        // Verify student exists
        const student = await Student.findOne({
          studentId: studentId.toString(),
        });
        if (!student) {
          result.errors.push({
            row: rowNumber,
            studentId: studentId.toString(),
            error: "Student not found",
          });
          continue;
        }

        // Parse subjects - look for direct subject columns with total scores
        const subjects: any[] = [];
        const excludedColumns = [
          "Student ID",
          "student_id",
          "studentId",
          "Academic Session",
          "academic_session",
          "academicSession",
          "Term",
          "term",
          "Class",
          "class",
          "School_Opened",
          "school_opened",
          "Times_Present",
          "times_present",
          "Times_Absent",
          "times_absent",
          "punctuality",
          "neatness",
          "politeness",
          "honesty",
          "leadership",
          "relationship",
          "Teacher_Comments",
          "teacher_comments",
          "Principal_Comments",
          "principal_comments",
          "Next_Term_Begins",
          "next_term_begins",
        ];

        // Find subject columns (any column that's not in the excluded list)
        Object.keys(row).forEach((key) => {
          const normalizedKey = key.trim();

          // Skip excluded columns and empty keys
          if (
            !normalizedKey ||
            excludedColumns.some(
              (col) => col.toLowerCase() === normalizedKey.toLowerCase()
            )
          ) {
            return;
          }

          const score = parseFloat(row[key]);

          // If it's a valid score, treat this column as a subject
          if (!isNaN(score) && score >= 0 && score <= 100) {
            subjects.push({
              subjectName: normalizedKey,
              scores: {
                firstCA: 0, // Default CA scores to 0
                secondCA: 0,
                thirdCA: 0,
                exam: 0, // Default exam to 0 since we only have total
                total: score, // Store the CSV score as the total
              },
            });
          }
        });

        if (subjects.length === 0) {
          result.errors.push({
            row: rowNumber,
            studentId: studentId.toString(),
            error:
              "No valid subjects found. Make sure each subject column has a score between 0-100",
          });
          continue;
        }

        // Parse attendance
        const attendance = {
          schoolOpened:
            parseInt(row["School_Opened"] || row["school_opened"] || "0") || 0,
          timesPresent:
            parseInt(row["Times_Present"] || row["times_present"] || "0") || 0,
          timesAbsent:
            parseInt(row["Times_Absent"] || row["times_absent"] || "0") || 0,
        };

        // Parse behavioral assessment
        const behavioralAssessment: any = {};
        const behaviorFields = [
          "punctuality",
          "neatness",
          "politeness",
          "honesty",
          "leadership",
          "relationship",
        ];

        behaviorFields.forEach((field) => {
          const value =
            row[field] || row[field.charAt(0).toUpperCase() + field.slice(1)];
          if (
            value &&
            ["excellent", "very good", "good", "fair", "poor"].includes(
              value.toLowerCase()
            )
          ) {
            behavioralAssessment[field] = value.toLowerCase();
          }
        });

        const parsedData: ParsedResultData = {
          studentId: studentId.toString(),
          academicSession: academicSession.toString(),
          term: term.toString(),
          class: className.toString(),
          subjects,
          attendance: attendance.schoolOpened > 0 ? attendance : undefined,
          behavioralAssessment:
            Object.keys(behavioralAssessment).length > 0
              ? behavioralAssessment
              : undefined,
          teacherComments:
            row["Teacher_Comments"] || row["teacher_comments"] || undefined,
          principalComments:
            row["Principal_Comments"] || row["principal_comments"] || undefined,
          nextTermBegins: row["Next_Term_Begins"]
            ? new Date(row["Next_Term_Begins"])
            : undefined,
        };

        result.success.push(parsedData);
      } catch (error) {
        result.errors.push({
          row: rowNumber,
          studentId:
            row["Student ID"] ||
            row["student_id"] ||
            row["studentId"] ||
            "Unknown",
          error: `Error parsing row: ${(error as Error).message}`,
        });
      }
    }
  } catch (error) {
    result.errors.push({
      row: 0,
      error: `Error reading file: ${(error as Error).message}`,
    });
  }

  return result;
};

// Generate a template Excel file for bulk upload
export const generateResultsTemplate = async (): Promise<Buffer> => {
  const sampleData = [
    {
      "Student ID": "RNS2024ABC123",
      "Academic Session": "2023/2024",
      Term: "first",
      Class: "JSS 1A",
      Mathematics: 85,
      English: 78,
      Science: 92,
      Computer: 88,
      "Social Studies": 75,
      French: 70,
      Art: 80,
      Music: 85,
      "Physical Education": 90,
      School_Opened: 90,
      Times_Present: 88,
      Times_Absent: 2,
      punctuality: "excellent",
      neatness: "very good",
      politeness: "excellent",
      honesty: "excellent",
      leadership: "good",
      relationship: "very good",
      Teacher_Comments: "Good performance overall. Keep it up!",
      Principal_Comments: "Well done. Continue to work hard.",
      Next_Term_Begins: "2024-09-15",
    },
    {
      "Student ID": "RNS2024ABC124",
      "Academic Session": "2023/2024",
      Term: "first",
      Class: "JSS 1A",
      Mathematics: 75,
      English: 82,
      Science: 78,
      Computer: 90,
      "Social Studies": 85,
      French: 68,
      Art: 75,
      Music: 82,
      "Physical Education": 88,
      School_Opened: 90,
      Times_Present: 85,
      Times_Absent: 5,
      punctuality: "good",
      neatness: "excellent",
      politeness: "good",
      honesty: "very good",
      leadership: "excellent",
      relationship: "good",
      Teacher_Comments: "Shows improvement in all areas.",
      Principal_Comments: "Excellent progress this term.",
      Next_Term_Begins: "2024-09-15",
    },
  ];

  const workbook = new ExcelJS.Workbook();
  const worksheet = workbook.addWorksheet("Results Template");

  // Add headers
  const headers = Object.keys(sampleData[0]);
  worksheet.addRow(headers);

  // Add sample data
  sampleData.forEach((row) => {
    const values = headers.map((header) => row[header as keyof typeof row]);
    worksheet.addRow(values);
  });

  // Add instructions sheet
  const instructionSheet = workbook.addWorksheet("Instructions");

  const instructions = [
    ["INSTRUCTIONS FOR BULK RESULT UPLOAD"],
    [""],
    ["REQUIRED COLUMNS:"],
    ["1. Student ID: Must match existing student IDs in the system"],
    ["2. Academic Session: e.g., 2023/2024, 2024/2025"],
    ["3. Term: first, second, or third"],
    ["4. Class: e.g., JSS 1A, SSS 2B, Nursery 1"],
    [
      "5. Subject Scores: Each subject should have one column with the final total score (0-100)",
    ],
    [""],
    ["OPTIONAL COLUMNS:"],
    ["6. Attendance: School_Opened, Times_Present, Times_Absent (all numbers)"],
    [
      "7. Behavioral Assessment: Use lowercase values: excellent, very good, good, fair, poor",
    ],
    ["8. Comments: Teacher_Comments and Principal_Comments are optional"],
    ["9. Next_Term_Begins: Use format YYYY-MM-DD"],
    [""],
    ["SUBJECT EXAMPLES:"],
    [
      "Mathematics, English, Science, Computer, Social Studies, French, Art, Music, Physical Education",
    ],
    [""],
    ["IMPORTANT NOTES:"],
    [
      "- All students in the same upload should have the same Academic Session, Term, and Class",
    ],
    [
      "- Score Range: All subject scores should be between 0-100 (final term total)",
    ],
    ["- Student IDs must already exist in the system"],
    ["- Each row represents one student's complete results for the term"],
    ["- Add/remove subject columns as needed for your school"],
    ["- Maximum file size: 10MB"],
  ];

  instructions.forEach((row) => {
    instructionSheet.addRow(row);
  });

  // Convert to buffer and return
  const arrayBuffer = await workbook.xlsx.writeBuffer();
  return Buffer.from(arrayBuffer);
};
