import mongoose, { Document, Schema } from "mongoose";

export interface IAdminProfile extends Document {
  _id: string;
  userId: mongoose.Types.ObjectId;
  firstName?: string;
  lastName?: string;
  phoneNumber?: string;
  address?: string;
  profilePhoto?: string;
  permissions: string[];
  bio?: string;
  department?: string;
  position?: string;
  emergencyContact?: {
    name: string;
    phone: string;
    relationship: string;
  };
  createdAt: Date;
  updatedAt: Date;
}

const AdminProfileSchema = new Schema<IAdminProfile>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    firstName: {
      type: String,
      trim: true,
      maxlength: [50, "First name cannot exceed 50 characters"],
    },
    lastName: {
      type: String,
      trim: true,
      maxlength: [50, "Last name cannot exceed 50 characters"],
    },
    phoneNumber: {
      type: String,
      trim: true,
      match: [/^[\+]?[1-9][\d]{0,15}$/, "Please enter a valid phone number"],
    },
    address: {
      type: String,
      trim: true,
      maxlength: [200, "Address cannot exceed 200 characters"],
    },
    profilePhoto: {
      type: String,
      trim: true,
    },
    permissions: {
      type: [String],
      default: [
        "read_students",
        "write_students",
        "read_results",
        "write_results",
        "read_payments",
        "write_payments",
        "read_analytics",
        "system_settings",
      ],
    },
    bio: {
      type: String,
      trim: true,
      maxlength: [500, "Bio cannot exceed 500 characters"],
    },
    department: {
      type: String,
      trim: true,
      maxlength: [100, "Department cannot exceed 100 characters"],
    },
    position: {
      type: String,
      trim: true,
      maxlength: [100, "Position cannot exceed 100 characters"],
    },
    emergencyContact: {
      name: {
        type: String,
        trim: true,
        maxlength: [100, "Emergency contact name cannot exceed 100 characters"],
      },
      phone: {
        type: String,
        trim: true,
        match: [
          /^[\+]?[1-9][\d]{0,15}$/,
          "Please enter a valid emergency contact phone number",
        ],
      },
      relationship: {
        type: String,
        trim: true,
        maxlength: [50, "Relationship cannot exceed 50 characters"],
      },
    },
  },
  {
    timestamps: true,
  }
);

// Index for efficient queries
AdminProfileSchema.index({ userId: 1 });

// Virtual for full name
AdminProfileSchema.virtual("fullName").get(function () {
  return `${this.firstName || ""} ${this.lastName || ""}`.trim();
});

// Ensure virtual fields are serialized
AdminProfileSchema.set("toJSON", { virtuals: true });
AdminProfileSchema.set("toObject", { virtuals: true });

export default mongoose.model<IAdminProfile>(
  "AdminProfile",
  AdminProfileSchema
);
