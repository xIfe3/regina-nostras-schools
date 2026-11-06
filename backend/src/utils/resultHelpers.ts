import Result from "../models/Result";
import Student from "../models/Student";
import { sendEmail } from "./email";
import { getParentContact } from "./parentAccount";

/* WAEC-style grading used across the school */
export const gradeFor = (score: number): string => {
  if (score >= 80) return "A1";
  if (score >= 75) return "B2";
  if (score >= 70) return "B3";
  if (score >= 65) return "C4";
  if (score >= 60) return "C5";
  if (score >= 55) return "C6";
  if (score >= 50) return "D7";
  if (score >= 45) return "E8";
  return "F9";
};

export const subjectRemarkFor = (grade: string): string => {
  if (grade === "A1") return "Excellent";
  if (["B2", "B3"].includes(grade)) return "Very Good";
  if (["C4", "C5", "C6"].includes(grade)) return "Good";
  if (grade === "D7") return "Pass";
  if (grade === "E8") return "Poor";
  return "Fail";
};

export const summaryRemarkFor = (grade: string): string => {
  if (grade === "A1") return "Excellent Performance";
  if (["B2", "B3"].includes(grade)) return "Very Good Performance";
  if (["C4", "C5", "C6"].includes(grade)) return "Good Performance";
  if (grade === "D7") return "Fair Performance";
  if (grade === "E8") return "Below Average Performance";
  return "Poor Performance";
};

const num = (v: unknown) => {
  const n = Number(v);
  return Number.isFinite(n) ? n : 0;
};

/**
 * Normalise one subject and compute total, grade and remark.
 * If CA/exam components are present they are summed; if they are all zero but a
 * total was supplied (e.g. an upload that only had final scores), the total is kept.
 */
export const buildSubject = (subject: any) => {
  const s = subject?.scores || {};
  const firstCA = num(s.firstCA);
  const secondCA = num(s.secondCA);
  const thirdCA = num(s.thirdCA);
  const exam = num(s.exam);
  const componentSum = firstCA + secondCA + thirdCA + exam;
  const providedTotal =
    s.total !== undefined && s.total !== null && s.total !== "" ? num(s.total) : null;

  const total =
    componentSum === 0 && providedTotal !== null ? providedTotal : componentSum;
  const grade = gradeFor(total);

  return {
    subjectName: String(subject.subjectName || "").trim(),
    subjectCode: subject.subjectCode,
    scores: { firstCA, secondCA, thirdCA, exam, total },
    grade,
    remark: subjectRemarkFor(grade),
  };
};

export const buildSummary = (subjects: Array<{ scores: { total: number } }>) => {
  const totalScore = subjects.reduce((sum, s) => sum + s.scores.total, 0);
  const averageScore =
    subjects.length > 0 ? Math.round((totalScore / subjects.length) * 100) / 100 : 0;
  const overallGrade = gradeFor(averageScore);
  return {
    totalScore,
    averageScore,
    overallGrade,
    remark: summaryRemarkFor(overallGrade),
  };
};

/**
 * Recalculate class positions for one class/session/term.
 * Students with the same average share a position (1, 2, 2, 4...).
 */
export const recalculatePositions = async (
  academicSession: string,
  term: string,
  className: string
) => {
  const results = await Result.find({ academicSession, term, class: className })
    .select("_id summary.averageScore")
    .sort({ "summary.averageScore": -1 });

  const totalStudents = results.length;
  let lastScore: number | null = null;
  let lastPosition = 0;

  const ops = results.map((r, i) => {
    const score = r.summary.averageScore;
    const position = score === lastScore ? lastPosition : i + 1;
    lastScore = score;
    lastPosition = position;
    return {
      updateOne: {
        filter: { _id: r._id },
        update: {
          $set: {
            "summary.position": position,
            "summary.totalStudents": totalStudents,
          },
        },
      },
    };
  });

  if (ops.length > 0) await Result.bulkWrite(ops);
};

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

/**
 * Email the student and their parent/guardian that a result has been published.
 * Never throws; returns how many emails were sent.
 */
export const notifyResultPublished = async (resultId: string): Promise<number> => {
  try {
    const result = await Result.findById(resultId);
    if (!result) return 0;
    const student = await Student.findById(result.studentId);
    if (!student) return 0;

    const name = `${student.personalInfo.firstName} ${student.personalInfo.lastName}`;
    const loginUrl = `${process.env.FRONTEND_URL || ""}/login`;
    const details = `
      <p><strong>Session:</strong> ${result.academicSession} &nbsp; <strong>Term:</strong> ${capitalize(result.term)}</p>
      <p><strong>Class:</strong> ${result.class}</p>
      <p><strong>Average:</strong> ${result.summary.averageScore}% &nbsp; <strong>Grade:</strong> ${result.summary.overallGrade}
      &nbsp; <strong>Position:</strong> ${result.summary.position} of ${result.summary.totalStudents}</p>
    `;

    let sent = 0;
    const studentEmail = student.contactInfo?.email;
    const parentEmail = getParentContact(student)?.email;

    if (studentEmail) {
      try {
        await sendEmail({
          to: studentEmail,
          subject: "New Result Published - Regina Nostras Schools",
          html: `
            <h2>New Result Available</h2>
            <p>Dear ${name},</p>
            <p>Your result has been published.</p>
            ${details}
            <p>Log in to the student portal to see the full result: <a href="${loginUrl}">${loginUrl}</a></p>
            <br><p>Best regards,<br>Regina Nostras Schools Administration</p>
          `,
        });
        sent++;
      } catch (e) {
        console.error("Result email to student failed:", e);
      }
    }

    if (parentEmail && parentEmail !== studentEmail?.toLowerCase()) {
      try {
        await sendEmail({
          to: parentEmail,
          subject: `${student.personalInfo.firstName}'s result is ready - Regina Nostras Schools`,
          html: `
            <h2>Result Published</h2>
            <p>Dear Parent/Guardian,</p>
            <p>The result for <strong>${name}</strong> (${student.studentId}) has been published.</p>
            ${details}
            <p>Log in to the parent portal to see the full result: <a href="${loginUrl}">${loginUrl}</a></p>
            <br><p>Best regards,<br>Regina Nostras Schools Administration</p>
          `,
        });
        sent++;
      } catch (e) {
        console.error("Result email to parent failed:", e);
      }
    }

    return sent;
  } catch (error) {
    console.error("notifyResultPublished error:", error);
    return 0;
  }
};
