import mongoose, { Document, Schema } from "mongoose";

export interface IActivity extends Document {
  _id: string;
  type:
    | "student_added"
    | "student_updated"
    | "student_deleted"
    | "result_uploaded"
    | "result_updated"
    | "result_deleted"
    | "payment_verified"
    | "payment_rejected"
    | "payment_pending"
    | "user_login"
    | "user_logout"
    | "password_reset_requested"
    | "password_reset_completed"
    | "admin_action"
    | "system_event"
    | "contact_form"
    | "system_error";
  title: string;
  description: string;
  userId: mongoose.Types.ObjectId;
  targetModel?:
    | "Student"
    | "Result"
    | "Payment"
    | "User"
    | "Event"
    | "Announcement";
  targetId?: mongoose.Types.ObjectId;
  metadata?: {
    studentName?: string;
    className?: string;
    paymentAmount?: number;
    resultSubject?: string;
    contactName?: string;
    contactEmail?: string;
    messageLength?: number;
    errorType?: string;
    userIP?: string;
    [key: string]: any;
  };
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

const ActivitySchema = new Schema<IActivity>(
  {
    type: {
      type: String,
      enum: [
        "student_added",
        "student_updated",
        "student_deleted",
        "result_uploaded",
        "result_updated",
        "result_deleted",
        "payment_verified",
        "payment_rejected",
        "payment_pending",
        "user_login",
        "user_logout",
        "password_reset_requested",
        "password_reset_completed",
        "admin_action",
        "system_event",
        "contact_form",
        "system_error",
      ],
      required: [true, "Activity type is required"],
    },
    title: {
      type: String,
      required: [true, "Activity title is required"],
      trim: true,
    },
    description: {
      type: String,
      required: [true, "Activity description is required"],
      trim: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "User ID is required"],
    },
    targetModel: {
      type: String,
      enum: ["Student", "Result", "Payment", "User", "Event", "Announcement"],
    },
    targetId: {
      type: Schema.Types.ObjectId,
    },
    metadata: {
      studentName: String,
      className: String,
      paymentAmount: Number,
      resultSubject: String,
      contactName: String,
      contactEmail: String,
      messageLength: Number,
      errorType: String,
      userIP: String,
      // Allow additional metadata fields
      type: Schema.Types.Mixed,
    },
    ipAddress: {
      type: String,
      trim: true,
    },
    userAgent: {
      type: String,
      trim: true,
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for better query performance
ActivitySchema.index({ type: 1, createdAt: -1 });
ActivitySchema.index({ userId: 1, createdAt: -1 });
ActivitySchema.index({ targetModel: 1, targetId: 1 });
ActivitySchema.index({ createdAt: -1 }); // For recent activities

export default mongoose.model<IActivity>("Activity", ActivitySchema);
