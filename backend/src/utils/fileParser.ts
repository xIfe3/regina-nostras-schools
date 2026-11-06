import ExcelJS from "exceljs";
import * as fs from "fs";
import Student from "../models/Student.js";

/* ------------------------------------------------------------------ */
/* Generic spreadsheet reading                                         */
/* ------------------------------------------------------------------ */

export type CellValue = string | number | Date | null;

export interface SheetRow {
  /** 1-based row number as shown in Excel (header is row 1) */
  rowNumber: number;
  /** header text (trimmed) -> value */
  values: Record<string, CellValue>;
}

/** Normalise a header for loose matching: "Student ID", "student_id", "studentId" -> "studentid" */
export const normalizeHeader = (header: string) =>
  header.toLowerCase().replace(/[^a-z0-9]/g, "");

/** Turn any ExcelJS cell value (formula, rich text, hyperlink...) into a plain value */
const cellToValue = (value: ExcelJS.CellValue): CellValue => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number" || typeof value === "string") return value;
  if (typeof value === "boolean") return value ? "TRUE" : "FALSE";
  if (value instanceof Date) return value;
  if (typeof value === "object") {
    const v = value as any;
    if ("result" in v) return cellToValue(v.result); // formula / shared formula
    if (Array.isArray(v.richText))
      return v.richText.map((t: any) => t.text).join("");
    if ("text" in v) return cellToValue(v.text); // hyperlink
    if ("error" in v) return null;
  }
  return String(value);
};

/** Minimal RFC 4180 CSV parser that keeps every value as text (no lost leading zeros). */
const parseCsv = (content: string): string[][] => {
  const text = content.replace(/^﻿/, "");
  const rows: string[][] = [];
  let row: string[] = [];
  let field = "";
  let inQuotes = false;

  for (let i = 0; i < text.length; i++) {
    const ch = text[i];
    if (inQuotes) {
      if (ch === '"') {
        if (text[i + 1] === '"') {
          field += '"';
          i++;
        } else {
          inQuotes = false;
        }
      } else {
        field += ch;
      }
    } else if (ch === '"') {
      inQuotes = true;
    } else if (ch === ",") {
      row.push(field);
      field = "";
    } else if (ch === "\n" || ch === "\r") {
      if (ch === "\r" && text[i + 1] === "\n") i++;
      row.push(field);
      rows.push(row);
      row = [];
      field = "";
    } else {
      field += ch;
    }
  }
  if (field !== "" || row.length > 0) {
    row.push(field);
    rows.push(row);
  }
  return rows;
};

/**
 * Read the first worksheet of an .xlsx or .csv file into rows keyed by header.
 * Blank rows are skipped. Throws for unsupported formats.
 */
export const readSpreadsheet = async (
  filePath: string,
  fileType: string
): Promise<SheetRow[]> => {
  const rows: SheetRow[] = [];

  if (fileType === "csv") {
    const matrix = parseCsv(fs.readFileSync(filePath, "utf8"));
    if (matrix.length === 0) return rows;
    const headers = matrix[0].map((h) => h.trim());
    for (let r = 1; r < matrix.length; r++) {
      const values: Record<string, CellValue> = {};
      let hasData = false;
      headers.forEach((header, c) => {
        if (!header) return;
        const raw = (matrix[r][c] ?? "").trim();
        values[header] = raw === "" ? null : raw;
        if (raw !== "") hasData = true;
      });
      if (hasData) rows.push({ rowNumber: r + 1, values });
    }
    return rows;
  }

  if (fileType === "xlsx") {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.readFile(filePath);
    const worksheet = workbook.worksheets[0];
    if (!worksheet) return rows;

    const headerRow = worksheet.getRow(1);
    const headers: Record<number, string> = {};
    headerRow.eachCell({ includeEmpty: false }, (cell, col) => {
      const h = String(cellToValue(cell.value) ?? "").trim();
      if (h) headers[col] = h;
    });

    worksheet.eachRow({ includeEmpty: false }, (row, rowNumber) => {
      if (rowNumber === 1) return;
      const values: Record<string, CellValue> = {};
      let hasData = false;
      Object.entries(headers).forEach(([col, header]) => {
        let v = cellToValue(row.getCell(Number(col)).value);
        if (typeof v === "string") v = v.trim() === "" ? null : v.trim();
        values[header] = v;
        if (v !== null) hasData = true;
      });
      if (hasData) rows.push({ rowNumber, values });
    });
    return rows;
  }

  if (fileType === "xls") {
    throw new Error(
      "Old Excel (.xls) files are not supported. In Excel choose File > Save As > Excel Workbook (.xlsx) or CSV, then upload again."
    );
  }

  throw new Error("Unsupported file format. Please upload an .xlsx or .csv file.");
};

/** Look up a value by any of several header aliases (matching is case/space/underscore-insensitive). */
export const getField = (
  row: Record<string, CellValue>,
  ...aliases: string[]
): CellValue => {
  const wanted = aliases.map(normalizeHeader);
  for (const [header, value] of Object.entries(row)) {
    if (wanted.includes(normalizeHeader(header)) && value !== null) {
      return value;
    }
  }
  return null;
};

export const asText = (value: CellValue): string => {
  if (value === null || value === undefined) return "";
  if (value instanceof Date) return value.toISOString().split("T")[0];
  return String(value).trim();
};

export const asNumber = (value: CellValue): number | null => {
  if (value === null || value === undefined || value === "") return null;
  if (typeof value === "number") return value;
  const n = Number(String(value).trim());
  return Number.isFinite(n) ? n : null;
};

/**
 * Parse a date from a cell: Date objects, Excel serial numbers, YYYY-MM-DD,
 * DD/MM/YYYY (Nigerian/UK format) and YYYY/MM/DD. Returns null if invalid.
 */
export const parseDate = (value: CellValue): Date | null => {
  if (value === null || value === undefined || value === "") return null;
  if (value instanceof Date) return isNaN(value.getTime()) ? null : value;
  if (typeof value === "number") {
    // Excel serial date (days since 1899-12-30)
    if (value > 20000 && value < 80000) {
      return new Date(Date.UTC(1899, 11, 30) + value * 86400000);
    }
    return null;
  }
  const s = String(value).trim();
  let m = s.match(/^(\d{4})[-/.](\d{1,2})[-/.](\d{1,2})/);
  if (m) {
    const d = new Date(Date.UTC(+m[1], +m[2] - 1, +m[3]));
    return isNaN(d.getTime()) ? null : d;
  }
  m = s.match(/^(\d{1,2})[-/.](\d{1,2})[-/.](\d{4})$/);
  if (m) {
    const d = new Date(Date.UTC(+m[3], +m[2] - 1, +m[1]));
    return isNaN(d.getTime()) ? null : d;
  }
  return null;
};

/** Nigerian phone numbers lose their leading 0 when Excel stores them as numbers. */
export const normalizePhone = (value: CellValue): string => {
  const s = asText(value);
  if (/^[789]\d{9}$/.test(s)) return "0" + s;
  return s;
};

/* ------------------------------------------------------------------ */
/* Results                                                             */
/* ------------------------------------------------------------------ */

export interface ParsedResultData {
  rowNumber: number;
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
      total?: number;
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

export interface BulkUploadError {
  row: number;
  studentId?: string;
  error: string;
}

export interface BulkUploadResult {
  success: ParsedResultData[];
  errors: BulkUploadError[];
}

const BEHAVIOR_FIELDS = [
  "punctuality",
  "neatness",
  "politeness",
  "honesty",
  "leadership",
  "relationship",
] as const;

const BEHAVIOR_VALUES = ["excellent", "very good", "good", "fair", "poor"];

/** Columns that are never treated as subjects (normalised header form) */
const NON_SUBJECT_COLUMNS = new Set(
  [
    "studentid",
    "admissionnumber",
    "admissionno",
    "regno",
    "studentname",
    "name",
    "fullname",
    "firstname",
    "lastname",
    "surname",
    "othernames",
    "sn",
    "sno",
    "serialnumber",
    "no",
    "gender",
    "sex",
    "age",
    "academicsession",
    "session",
    "term",
    "class",
    "classarm",
    "arm",
    "schoolopened",
    "timespresent",
    "timesabsent",
    "teachercomments",
    "teachercomment",
    "principalcomments",
    "principalcomment",
    "nexttermbegins",
    "total",
    "average",
    "position",
    "grade",
    ...BEHAVIOR_FIELDS,
  ].map(normalizeHeader)
);

/** "First Term", "1st", "1", "FIRST" -> "first" */
export const normalizeTerm = (value: string): string | null => {
  const s = value.toLowerCase().replace(/term/g, "").trim();
  if (["first", "1st", "1"].includes(s)) return "first";
  if (["second", "2nd", "2"].includes(s)) return "second";
  if (["third", "3rd", "3"].includes(s)) return "third";
  return null;
};

/** "2023-2024", "2023 / 2024" -> "2023/2024" */
export const normalizeSession = (value: string): string => {
  const m = value.match(/^\s*(\d{4})\s*[-/]\s*(\d{4})\s*$/);
  return m ? `${m[1]}/${m[2]}` : value.trim();
};

const COMPONENT_PATTERN =
  /^(.*?)[\s_\-:]*(ca1|ca2|ca3|1stca|2ndca|3rdca|firstca|secondca|thirdca|exam|examination)$/i;

const componentKey = (suffix: string): "firstCA" | "secondCA" | "thirdCA" | "exam" => {
  const s = suffix.toLowerCase();
  if (["ca1", "1stca", "firstca"].includes(s)) return "firstCA";
  if (["ca2", "2ndca", "secondca"].includes(s)) return "secondCA";
  if (["ca3", "3rdca", "thirdca"].includes(s)) return "thirdCA";
  return "exam";
};

/**
 * Parse an uploaded results spreadsheet. One row per student.
 * Subject columns can be either a single total score per subject ("Mathematics")
 * or split components ("Mathematics CA1", "Mathematics CA2", "Mathematics Exam").
 */
export const parseResultsFile = async (
  filePath: string,
  fileType: string
): Promise<BulkUploadResult> => {
  const result: BulkUploadResult = { success: [], errors: [] };

  let rows: SheetRow[];
  try {
    rows = await readSpreadsheet(filePath, fileType);
  } catch (error) {
    result.errors.push({ row: 0, error: (error as Error).message });
    return result;
  }

  if (rows.length === 0) {
    result.errors.push({ row: 0, error: "The file has no data rows." });
    return result;
  }

  const seen = new Map<string, number>();

  for (const { rowNumber, values: row } of rows) {
    const studentId = asText(
      getField(row, "Student ID", "studentId", "Admission Number", "Admission No", "Reg No")
    ).toUpperCase();

    try {
      if (!studentId) {
        result.errors.push({ row: rowNumber, error: "Student ID is required" });
        continue;
      }

      const academicSession = normalizeSession(
        asText(getField(row, "Academic Session", "Session"))
      );
      const termRaw = asText(getField(row, "Term"));
      const className = asText(getField(row, "Class"));

      if (!academicSession) {
        result.errors.push({ row: rowNumber, studentId, error: "Academic Session is required (e.g. 2024/2025)" });
        continue;
      }
      if (!/^\d{4}\/\d{4}$/.test(academicSession)) {
        result.errors.push({ row: rowNumber, studentId, error: `Academic Session "${academicSession}" must look like 2024/2025` });
        continue;
      }
      const term = normalizeTerm(termRaw);
      if (!term) {
        result.errors.push({ row: rowNumber, studentId, error: `Term "${termRaw}" must be first, second or third` });
        continue;
      }
      if (!className) {
        result.errors.push({ row: rowNumber, studentId, error: "Class is required" });
        continue;
      }

      const dupKey = `${studentId}|${academicSession}|${term}`;
      if (seen.has(dupKey)) {
        result.errors.push({
          row: rowNumber,
          studentId,
          error: `Duplicate row: this student already appears on row ${seen.get(dupKey)} for the same session and term`,
        });
        continue;
      }
      seen.set(dupKey, rowNumber);

      const student = await Student.findOne({ studentId });
      if (!student) {
        result.errors.push({ row: rowNumber, studentId, error: "No student with this Student ID exists" });
        continue;
      }

      // Subjects
      const totals = new Map<string, number>();
      const components = new Map<
        string,
        { firstCA?: number; secondCA?: number; thirdCA?: number; exam?: number }
      >();
      const scoreErrors: string[] = [];

      for (const [header, value] of Object.entries(row)) {
        const norm = normalizeHeader(header);
        if (!norm || NON_SUBJECT_COLUMNS.has(norm) || value === null) continue;

        const score = asNumber(value);
        if (score === null) continue; // e.g. "AB" for absent - subject skipped

        const comp = header.trim().match(COMPONENT_PATTERN);
        if (comp && comp[1].trim()) {
          const subject = comp[1].trim();
          const key = componentKey(comp[2]);
          const max = key === "exam" ? 70 : 10;
          if (score < 0 || score > max) {
            scoreErrors.push(`${header.trim()} = ${score} (must be 0-${max})`);
            continue;
          }
          const entry = components.get(subject) || {};
          entry[key] = score;
          components.set(subject, entry);
        } else {
          if (score < 0 || score > 100) {
            scoreErrors.push(`${header.trim()} = ${score} (must be 0-100)`);
            continue;
          }
          totals.set(header.trim(), score);
        }
      }

      if (scoreErrors.length > 0) {
        result.errors.push({ row: rowNumber, studentId, error: `Invalid score: ${scoreErrors.join("; ")}` });
        continue;
      }

      const subjects: ParsedResultData["subjects"] = [];
      for (const [subjectName, c] of components) {
        const total = (c.firstCA || 0) + (c.secondCA || 0) + (c.thirdCA || 0) + (c.exam || 0);
        if (total > 100) {
          scoreErrors.push(`${subjectName} CA + Exam adds up to ${total} (must be 100 or less)`);
          continue;
        }
        subjects.push({
          subjectName,
          scores: {
            firstCA: c.firstCA || 0,
            secondCA: c.secondCA || 0,
            thirdCA: c.thirdCA || 0,
            exam: c.exam || 0,
            total,
          },
        });
      }
      for (const [subjectName, total] of totals) {
        if (components.has(subjectName)) continue;
        subjects.push({
          subjectName,
          // Only the final score is known (CA/exam breakdown not given)
          scores: { firstCA: 0, secondCA: 0, thirdCA: 0, exam: 0, total },
        });
      }

      if (scoreErrors.length > 0) {
        result.errors.push({ row: rowNumber, studentId, error: scoreErrors.join("; ") });
        continue;
      }
      if (subjects.length === 0) {
        result.errors.push({
          row: rowNumber,
          studentId,
          error: "No subject scores found. Add one column per subject with a score from 0 to 100.",
        });
        continue;
      }

      // Attendance
      const schoolOpened = asNumber(getField(row, "School_Opened", "School Opened")) || 0;
      const timesPresent = asNumber(getField(row, "Times_Present", "Times Present")) || 0;
      const timesAbsentRaw = asNumber(getField(row, "Times_Absent", "Times Absent"));
      const timesAbsent =
        timesAbsentRaw !== null ? timesAbsentRaw : Math.max(schoolOpened - timesPresent, 0);

      // Behaviour
      const behavioralAssessment: Record<string, string> = {};
      for (const field of BEHAVIOR_FIELDS) {
        const v = asText(getField(row, field)).toLowerCase();
        if (BEHAVIOR_VALUES.includes(v)) behavioralAssessment[field] = v;
      }

      result.success.push({
        rowNumber,
        studentId,
        academicSession,
        term,
        class: className,
        subjects,
        attendance: schoolOpened > 0 ? { schoolOpened, timesPresent, timesAbsent } : undefined,
        behavioralAssessment:
          Object.keys(behavioralAssessment).length > 0 ? behavioralAssessment : undefined,
        teacherComments:
          asText(getField(row, "Teacher_Comments", "Teacher Comment", "Teacher Comments")) || undefined,
        principalComments:
          asText(getField(row, "Principal_Comments", "Principal Comment", "Principal Comments")) ||
          undefined,
        nextTermBegins: parseDate(getField(row, "Next_Term_Begins", "Next Term Begins")) || undefined,
      });
    } catch (error) {
      result.errors.push({
        row: rowNumber,
        studentId: studentId || "Unknown",
        error: `Error reading row: ${(error as Error).message}`,
      });
    }
  }

  return result;
};

/* ------------------------------------------------------------------ */
/* Templates                                                           */
/* ------------------------------------------------------------------ */

export const DEFAULT_SUBJECTS = [
  "Mathematics",
  "English",
  "Basic Science",
  "Basic Technology",
  "Social Studies",
  "Civic Education",
  "Computer Studies",
  "CRS",
  "Agricultural Science",
  "French",
];

const RESULT_EXTRA_COLUMNS = [
  "School_Opened",
  "Times_Present",
  "Times_Absent",
  ...BEHAVIOR_FIELDS,
  "Teacher_Comments",
  "Principal_Comments",
  "Next_Term_Begins",
];

const csvEscape = (value: unknown) => {
  const s = value === null || value === undefined ? "" : String(value);
  return /[",\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

export const toCsv = (rows: unknown[][]) =>
  // BOM so Excel opens UTF-8 names correctly
  "﻿" + rows.map((r) => r.map(csvEscape).join(",")).join("\r\n") + "\r\n";

/**
 * Results template as CSV. When students are given, one row per student is
 * pre-filled with ID, name, session, term and class so teachers only type scores.
 */
export const generateResultsTemplateCsv = (options: {
  students?: Array<{ studentId: string; name: string; className: string }>;
  academicSession?: string;
  term?: string;
  subjects?: string[];
}): string => {
  const subjects = options.subjects && options.subjects.length > 0 ? options.subjects : DEFAULT_SUBJECTS;
  const header = ["Student ID", "Student Name", "Academic Session", "Term", "Class", ...subjects, ...RESULT_EXTRA_COLUMNS];

  const rows: unknown[][] = [header];

  if (options.students && options.students.length > 0) {
    for (const s of options.students) {
      rows.push([
        s.studentId,
        s.name,
        options.academicSession || "",
        options.term || "",
        s.className,
        ...subjects.map(() => ""),
        ...RESULT_EXTRA_COLUMNS.map(() => ""),
      ]);
    }
  } else {
    rows.push([
      "RNS2025ABC123",
      "Ada Okafor",
      options.academicSession || "2024/2025",
      options.term || "first",
      "JSS 1",
      ...subjects.map((_, i) => 60 + ((i * 7) % 35)),
      90,
      88,
      2,
      "excellent",
      "very good",
      "excellent",
      "excellent",
      "good",
      "very good",
      "Good performance overall. Keep it up!",
      "Well done.",
      "2025-01-13",
    ]);
  }

  return toCsv(rows);
};

export const STUDENT_TEMPLATE_HEADERS = [
  "firstName",
  "lastName",
  "middleName",
  "email",
  "phoneNumber",
  "currentClass",
  "classArm",
  "dateOfBirth",
  "gender",
  "stateOfOrigin",
  "localGovernmentArea",
  "street",
  "city",
  "state",
  "parentName",
  "parentPhone",
  "parentEmail",
];

export const generateStudentsTemplateCsv = (): string =>
  toCsv([
    STUDENT_TEMPLATE_HEADERS,
    [
      "John",
      "Doe",
      "",
      "john.doe@email.com",
      "08012345678",
      "JSS 1",
      "A",
      "2012-01-15",
      "male",
      "Lagos",
      "Ikeja",
      "12 Allen Avenue",
      "Ikeja",
      "Lagos",
      "Mr. Doe",
      "08098765432",
      "parent@email.com",
    ],
  ]);

/* ------------------------------------------------------------------ */
/* Students                                                            */
/* ------------------------------------------------------------------ */

export interface ParsedStudentRow {
  rowNumber: number;
  studentData: any;
}

/**
 * Parse a student bulk-upload spreadsheet into Student documents (without userId).
 * Required: firstName, lastName, email, currentClass, dateOfBirth, gender.
 */
export const parseStudentsFile = async (
  filePath: string,
  fileType: string
): Promise<{ success: ParsedStudentRow[]; errors: BulkUploadError[] }> => {
  const out = { success: [] as ParsedStudentRow[], errors: [] as BulkUploadError[] };

  let rows: SheetRow[];
  try {
    rows = await readSpreadsheet(filePath, fileType);
  } catch (error) {
    out.errors.push({ row: 0, error: (error as Error).message });
    return out;
  }
  if (rows.length === 0) {
    out.errors.push({ row: 0, error: "The file has no data rows." });
    return out;
  }

  const seenEmails = new Map<string, number>();

  for (const { rowNumber, values: row } of rows) {
    const firstName = asText(getField(row, "firstName", "First Name"));
    const lastName = asText(getField(row, "lastName", "Last Name", "Surname"));
    const email = asText(getField(row, "email", "Student Email")).toLowerCase();
    const label = email || `${firstName} ${lastName}`.trim() || undefined;

    const missing: string[] = [];
    if (!firstName) missing.push("firstName");
    if (!lastName) missing.push("lastName");
    if (!email) missing.push("email");
    const currentClass = asText(getField(row, "currentClass", "Class"));
    if (!currentClass) missing.push("currentClass");
    const dobRaw = getField(row, "dateOfBirth", "Date of Birth", "DOB");
    if (dobRaw === null) missing.push("dateOfBirth");
    const genderRaw = asText(getField(row, "gender", "Sex")).toLowerCase();
    if (!genderRaw) missing.push("gender");

    if (missing.length > 0) {
      out.errors.push({ row: rowNumber, studentId: label, error: `Missing required: ${missing.join(", ")}` });
      continue;
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      out.errors.push({ row: rowNumber, studentId: label, error: `Invalid email "${email}"` });
      continue;
    }
    if (seenEmails.has(email)) {
      out.errors.push({
        row: rowNumber,
        studentId: label,
        error: `Email already used on row ${seenEmails.get(email)} of this file`,
      });
      continue;
    }
    seenEmails.set(email, rowNumber);

    const dateOfBirth = parseDate(dobRaw);
    if (!dateOfBirth) {
      out.errors.push({ row: rowNumber, studentId: label, error: `Invalid dateOfBirth "${asText(dobRaw)}" (use YYYY-MM-DD)` });
      continue;
    }

    const gender = ["m", "male", "boy"].includes(genderRaw)
      ? "male"
      : ["f", "female", "girl"].includes(genderRaw)
      ? "female"
      : null;
    if (!gender) {
      out.errors.push({ row: rowNumber, studentId: label, error: `Gender "${genderRaw}" must be male or female` });
      continue;
    }

    const parentName = asText(getField(row, "parentName", "Parent Name", "Guardian Name"));
    const parentPhone = normalizePhone(getField(row, "parentPhone", "Parent Phone", "Guardian Phone"));
    const parentEmail = asText(getField(row, "parentEmail", "Parent Email", "Guardian Email")).toLowerCase();
    if (parentEmail && !/^\S+@\S+\.\S+$/.test(parentEmail)) {
      out.errors.push({ row: rowNumber, studentId: label, error: `Invalid parentEmail "${parentEmail}"` });
      continue;
    }

    const stateOfOrigin = asText(getField(row, "stateOfOrigin", "State of Origin")) || "Not provided";
    const street =
      asText(getField(row, "street", "address", "Home Address")) || "Not provided";
    const state = asText(getField(row, "state")) || stateOfOrigin;

    out.success.push({
      rowNumber,
      studentData: {
        personalInfo: {
          firstName,
          lastName,
          middleName: asText(getField(row, "middleName", "Middle Name", "Other Names")) || undefined,
          dateOfBirth,
          gender,
          nationality: asText(getField(row, "nationality")) || "Nigerian",
          stateOfOrigin,
          localGovernmentArea:
            asText(getField(row, "localGovernmentArea", "LGA")) || "Not provided",
          religion: asText(getField(row, "religion")) || undefined,
        },
        contactInfo: {
          email,
          phoneNumber: normalizePhone(getField(row, "phoneNumber", "Phone")) || undefined,
          address: {
            street,
            city: asText(getField(row, "city")) || state,
            state,
            country: "Nigeria",
          },
        },
        parentGuardianInfo: {
          guardian: {
            name: parentName,
            relationship: "Parent/Guardian",
            occupation: "",
            phoneNumber: parentPhone,
            email: parentEmail,
          },
        },
        academicInfo: {
          currentClass,
          classArm: asText(getField(row, "classArm", "Arm")) || undefined,
          admissionDate:
            parseDate(getField(row, "admissionDate", "Admission Date")) || new Date(),
          status: "active",
        },
        medicalInfo: {
          allergies: [],
          emergencyContact: {
            name: parentName,
            relationship: "Parent/Guardian",
            phoneNumber: parentPhone,
          },
        },
      },
    });
  }

  return out;
};
