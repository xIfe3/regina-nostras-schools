import mongoose, { Document, Schema } from "mongoose";

/**
 * Single document (key "global") holding school-wide settings:
 * school details / letterhead, result sheet options and portal access.
 * Images are stored as data URLs (small logos, signatures, stamps).
 */
export interface ISystemSettings extends Document {
  key: string;
  school: {
    name: string;
    motto?: string;
    address?: string;
    phone?: string;
    email?: string;
    website?: string;
    logo?: string; // data URL
    letterheadImage?: string; // data URL: full-width letterhead used instead of the built one
  };
  resultSheet: {
    title: string;
    principalName?: string;
    principalSignature?: string; // data URL
    schoolStamp?: string; // data URL
    footerNote?: string;
    showPosition: boolean;
    showBehaviour: boolean;
    showGradeKey: boolean;
  };
  access: {
    maintenanceMode: boolean;
    maintenanceMessage: string;
    studentLoginEnabled: boolean;
    parentLoginEnabled: boolean;
    loginDisabledMessage: string;
  };
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const SystemSettingsSchema = new Schema<ISystemSettings>(
  {
    key: { type: String, required: true, unique: true, default: "global" },
    school: {
      name: { type: String, default: "Regina Nostra Schools", trim: true },
      motto: { type: String, trim: true, default: "" },
      address: { type: String, trim: true, default: "" },
      phone: { type: String, trim: true, default: "" },
      email: { type: String, trim: true, default: "" },
      website: { type: String, trim: true, default: "" },
      logo: { type: String, default: "" },
      letterheadImage: { type: String, default: "" },
    },
    resultSheet: {
      title: { type: String, default: "Student's Termly Report Sheet", trim: true },
      principalName: { type: String, trim: true, default: "" },
      principalSignature: { type: String, default: "" },
      schoolStamp: { type: String, default: "" },
      footerNote: { type: String, trim: true, default: "" },
      showPosition: { type: Boolean, default: true },
      showBehaviour: { type: Boolean, default: true },
      showGradeKey: { type: Boolean, default: true },
    },
    access: {
      maintenanceMode: { type: Boolean, default: false },
      maintenanceMessage: {
        type: String,
        default:
          "The portal is undergoing scheduled maintenance. Please check back shortly.",
      },
      studentLoginEnabled: { type: Boolean, default: true },
      parentLoginEnabled: { type: Boolean, default: true },
      loginDisabledMessage: {
        type: String,
        default: "Portal access is currently closed. Please contact the school office.",
      },
    },
    updatedBy: { type: Schema.Types.ObjectId, ref: "User" },
  },
  { timestamps: true }
);

export default mongoose.model<ISystemSettings>("SystemSettings", SystemSettingsSchema);
