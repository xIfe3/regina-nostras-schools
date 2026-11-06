import mongoose, { Document, Schema } from "mongoose";

/** A message shown as a popup when students and/or parents log in. */
export interface INotice extends Document {
  title: string;
  message: string;
  type: "info" | "success" | "warning" | "urgent";
  audience: "all" | "students" | "parents";
  isActive: boolean;
  startsAt?: Date;
  endsAt?: Date;
  /** true: each person sees it once; false: shown every time they open the portal */
  showOnce: boolean;
  dismissedBy: mongoose.Types.ObjectId[];
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const NoticeSchema = new Schema<INotice>(
  {
    title: { type: String, required: [true, "Title is required"], trim: true, maxlength: 150 },
    message: { type: String, required: [true, "Message is required"], trim: true, maxlength: 3000 },
    type: { type: String, enum: ["info", "success", "warning", "urgent"], default: "info" },
    audience: { type: String, enum: ["all", "students", "parents"], default: "all" },
    isActive: { type: Boolean, default: true },
    startsAt: Date,
    endsAt: Date,
    showOnce: { type: Boolean, default: true },
    dismissedBy: [{ type: Schema.Types.ObjectId, ref: "User" }],
    createdBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

NoticeSchema.index({ isActive: 1, audience: 1 });

export default mongoose.model<INotice>("Notice", NoticeSchema);
