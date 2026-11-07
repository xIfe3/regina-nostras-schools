import crypto from "crypto";
import User from "../models/User";
import Student, { IStudent } from "../models/Student";
import { sendEmail } from "./email";
import { syncParentAccount, ParentLinkResult } from "./parentAccount";
import { studentWelcomeEmail } from "./emailTemplates";

export interface CreatedStudentAccount {
  student: IStudent;
  temporaryPassword: string;
  welcomeEmailSent: boolean;
  parentAccount: ParentLinkResult | null;
}

export class StudentAccountError extends Error {
  status: number;
  constructor(message: string, status = 400) {
    super(message);
    this.status = status;
  }
}

/**
 * Create the student login + Student record, link/create the parent login and
 * email the student their credentials. Email failures never fail the creation.
 * If the Student record fails validation, the just-created login is removed again.
 */
export const createStudentAccount = async (
  studentData: any,
  options: { sendWelcomeEmail?: boolean } = {}
): Promise<CreatedStudentAccount> => {
  const email = String(studentData?.contactInfo?.email || "")
    .trim()
    .toLowerCase();

  if (
    !studentData?.personalInfo?.firstName ||
    !studentData?.personalInfo?.lastName ||
    !email ||
    !studentData?.academicInfo?.currentClass
  ) {
    throw new StudentAccountError(
      "Missing required fields: firstName, lastName, email, and class are required"
    );
  }
  studentData.contactInfo.email = email;

  if (await User.findOne({ email })) {
    throw new StudentAccountError(`Email ${email} already exists`);
  }

  const temporaryPassword = crypto.randomBytes(5).toString("hex");
  const user = await User.create({ email, password: temporaryPassword, role: "student" });

  let student: IStudent;
  try {
    student = await Student.create({ ...studentData, userId: user._id });
  } catch (error) {
    await User.findByIdAndDelete(user._id);
    const message =
      (error as any)?.name === "ValidationError"
        ? Object.values((error as any).errors)
            .map((e: any) => e.message)
            .join("; ")
        : (error as Error).message;
    throw new StudentAccountError(message);
  }

  let parentAccount: ParentLinkResult | null = null;
  try {
    parentAccount = await syncParentAccount(student);
  } catch (parentError) {
    console.error("Parent account sync error:", parentError);
  }

  let welcomeEmailSent = false;
  if (options.sendWelcomeEmail !== false) {
    try {
      await sendEmail({
        to: email,
        ...(await studentWelcomeEmail(student, email, temporaryPassword)),
      });
      welcomeEmailSent = true;
    } catch (emailError) {
      console.error("Student welcome email failed:", emailError);
    }
  }

  return { student, temporaryPassword, welcomeEmailSent, parentAccount };
};
