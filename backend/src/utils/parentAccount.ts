import crypto from "crypto";
import User from "../models/User";
import Parent from "../models/Parent";
import { IStudent } from "../models/Student";
import { sendEmail } from "./email";
import { parentChildLinkedEmail, parentCredentialsEmail } from "./emailTemplates";

export interface ParentContact {
  name: string;
  email: string;
  phoneNumber: string;
}

export type ParentLinkStatus =
  | "created" // new parent login created and linked to the student
  | "linked" // existing parent login now also linked to this student
  | "already_linked" // nothing changed
  | "credentials_resent" // password reset and emailed to the parent
  | "no_email" // student has no parent/guardian email on file
  | "email_in_use"; // email belongs to a student/admin account

export interface ParentLinkResult {
  status: ParentLinkStatus;
  email?: string;
  temporaryPassword?: string;
  emailSent?: boolean;
  /** true when the admin chose to see the password on screen instead of emailing it */
  shownOnScreen?: boolean;
  message: string;
}

/**
 * Pick the parent contact for a student: guardian first, then father, then mother.
 * Returns the first entry that has an email address.
 */
export const getParentContact = (student: IStudent): ParentContact | null => {
  const info = student.parentGuardianInfo || ({} as IStudent["parentGuardianInfo"]);
  const candidates = [info.guardian, info.father, info.mother];

  for (const c of candidates) {
    const email = c?.email?.trim().toLowerCase();
    if (email) {
      return {
        name: c?.name?.trim() || "",
        email,
        phoneNumber: c?.phoneNumber?.trim() || "",
      };
    }
  }
  return null;
};

const sendCredentialsEmail = async (
  email: string,
  parentName: string,
  password: string,
  student: IStudent
): Promise<boolean> => {
  try {
    await sendEmail({
      to: email,
      ...(await parentCredentialsEmail(parentName, email, password, student)),
    });
    return true;
  } catch (error) {
    console.error("Failed to send parent credentials email:", error);
    return false;
  }
};

const sendChildLinkedEmail = async (
  email: string,
  parentName: string,
  student: IStudent
): Promise<boolean> => {
  try {
    await sendEmail({
      to: email,
      ...(await parentChildLinkedEmail(parentName, student)),
    });
    return true;
  } catch (error) {
    console.error("Failed to send child-linked email:", error);
    return false;
  }
};

/**
 * Make sure the student is linked to exactly the parent account matching the
 * parent/guardian email on their record:
 *  - creates a parent login (and emails credentials) if none exists for that email
 *  - links the student to an existing parent login (siblings share one account)
 *  - unlinks the student from any other parent account (e.g. email was corrected)
 *
 * Never throws for email delivery problems; the result says whether the email went out.
 */
export const syncParentAccount = async (
  student: IStudent,
  options: {
    resendCredentials?: boolean;
    /** false = don't email the password; the admin shares it in person */
    sendEmail?: boolean;
  } = {}
): Promise<ParentLinkResult> => {
  const contact = getParentContact(student);

  if (!contact) {
    await Parent.updateMany(
      { children: student._id },
      { $pull: { children: student._id } }
    );
    return {
      status: "no_email",
      message: "No parent/guardian email on file, so no parent login was created.",
    };
  }

  let user = await User.findOne({ email: contact.email });

  if (user && user.role !== "parent") {
    await Parent.updateMany(
      { children: student._id },
      { $pull: { children: student._id } }
    );
    return {
      status: "email_in_use",
      email: contact.email,
      message: `The parent email ${contact.email} is already used by a ${user.role} account. Use a different parent email.`,
    };
  }

  // Brand-new parent account
  if (!user) {
    const password = crypto.randomBytes(5).toString("hex");
    user = await User.create({
      email: contact.email,
      password,
      role: "parent",
    });
    await Parent.create({
      userId: user._id,
      name: contact.name,
      phoneNumber: contact.phoneNumber,
      children: [student._id],
    });
    await Parent.updateMany(
      { children: student._id, userId: { $ne: user._id } },
      { $pull: { children: student._id } }
    );

    if (options.sendEmail === false) {
      return {
        status: "created",
        email: contact.email,
        temporaryPassword: password,
        emailSent: false,
        shownOnScreen: true,
        message: `Parent login created for ${contact.email}. Give the password to the parent.`,
      };
    }
    const emailSent = await sendCredentialsEmail(
      contact.email,
      contact.name,
      password,
      student
    );
    return {
      status: "created",
      email: contact.email,
      temporaryPassword: password,
      emailSent,
      message: emailSent
        ? `Parent login created and sent to ${contact.email}.`
        : `Parent login created for ${contact.email}, but the email could not be sent. Share the temporary password with the parent.`,
    };
  }

  // Existing parent account
  let parent = await Parent.findOne({ userId: user._id });
  if (!parent) {
    parent = await Parent.create({
      userId: user._id,
      name: contact.name,
      phoneNumber: contact.phoneNumber,
      children: [],
    });
  }

  const alreadyLinked = parent.children.some(
    (id) => id.toString() === student._id.toString()
  );

  if (!alreadyLinked) parent.children.push(student._id as any);
  if (!parent.name && contact.name) parent.name = contact.name;
  if (!parent.phoneNumber && contact.phoneNumber)
    parent.phoneNumber = contact.phoneNumber;
  await parent.save();

  await Parent.updateMany(
    { children: student._id, userId: { $ne: user._id } },
    { $pull: { children: student._id } }
  );

  if (options.resendCredentials) {
    const password = crypto.randomBytes(5).toString("hex");
    user.password = password;
    user.isActive = true;
    await user.save();
    if (options.sendEmail === false) {
      return {
        status: "credentials_resent",
        email: contact.email,
        temporaryPassword: password,
        emailSent: false,
        shownOnScreen: true,
        message: `New password created for ${contact.email}. Give it to the parent. The old password no longer works.`,
      };
    }
    const emailSent = await sendCredentialsEmail(
      contact.email,
      parent.name,
      password,
      student
    );
    return {
      status: "credentials_resent",
      email: contact.email,
      temporaryPassword: password,
      emailSent,
      message: emailSent
        ? `New parent password sent to ${contact.email}.`
        : `Parent password was reset, but the email could not be sent. Share the temporary password with the parent.`,
    };
  }

  if (!alreadyLinked) {
    const emailSent = await sendChildLinkedEmail(
      contact.email,
      parent.name,
      student
    );
    return {
      status: "linked",
      email: contact.email,
      emailSent,
      message: `Student linked to the existing parent account ${contact.email}.`,
    };
  }

  return {
    status: "already_linked",
    email: contact.email,
    message: `Student is linked to parent account ${contact.email}.`,
  };
};

/**
 * Remove a student from all parent accounts (used when a student is deleted).
 */
export const unlinkStudentFromParents = async (studentId: string) => {
  await Parent.updateMany(
    { children: studentId },
    { $pull: { children: studentId } }
  );
};
