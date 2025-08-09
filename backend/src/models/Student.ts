import mongoose, { Document, Schema } from "mongoose";

export interface IStudent extends Document {
  _id: string;
  userId: mongoose.Types.ObjectId;
  studentId: string; // Auto-generated unique ID
  personalInfo: {
    firstName: string;
    lastName: string;
    middleName?: string;
    dateOfBirth: Date;
    gender: "male" | "female";
    bloodGroup?: string;
    nationality: string;
    stateOfOrigin: string;
    localGovernmentArea: string;
    religion?: string;
    profilePhoto?: string;
  };
  contactInfo: {
    email: string;
    phoneNumber?: string;
    address: {
      street: string;
      city: string;
      state: string;
      postalCode?: string;
      country: string;
    };
  };
  parentGuardianInfo: {
    father?: {
      name: string;
      occupation: string;
      phoneNumber: string;
      email?: string;
    };
    mother?: {
      name: string;
      occupation: string;
      phoneNumber: string;
      email?: string;
    };
    guardian?: {
      name: string;
      relationship: string;
      occupation: string;
      phoneNumber: string;
      email?: string;
    };
  };
  academicInfo: {
    currentClass: string;
    classArm?: string;
    admissionDate: Date;
    graduationDate?: Date;
    status: "active" | "graduated" | "transferred" | "suspended";
    previousSchool?: string;
  };
  medicalInfo?: {
    allergies?: string[];
    medications?: string[];
    emergencyContact: {
      name: string;
      relationship: string;
      phoneNumber: string;
    };
  };
  settings?: {
    notifications?: {
      emailNotifications: boolean;
      smsNotifications: boolean;
      resultNotifications: boolean;
      paymentNotifications: boolean;
      eventNotifications: boolean;
    };
    security?: {
      twoFactorEnabled: boolean;
      loginAlerts: boolean;
    };
  };
  createdAt: Date;
  updatedAt: Date;
}

const StudentSchema = new Schema<IStudent>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    studentId: {
      type: String,
      unique: true,
    },
    personalInfo: {
      firstName: {
        type: String,
        required: [true, "First name is required"],
        trim: true,
      },
      lastName: {
        type: String,
        required: [true, "Last name is required"],
        trim: true,
      },
      middleName: {
        type: String,
        trim: true,
      },
      dateOfBirth: {
        type: Date,
        required: [true, "Date of birth is required"],
      },
      gender: {
        type: String,
        enum: ["male", "female"],
        required: [true, "Gender is required"],
      },
      bloodGroup: {
        type: String,
        enum: ["A+", "A-", "B+", "B-", "AB+", "AB-", "O+", "O-"],
      },
      nationality: {
        type: String,
        required: [true, "Nationality is required"],
        default: "Nigerian",
      },
      stateOfOrigin: {
        type: String,
        required: [true, "State of origin is required"],
      },
      localGovernmentArea: {
        type: String,
        required: [true, "Local government area is required"],
      },
      religion: String,
      profilePhoto: String,
    },
    contactInfo: {
      email: {
        type: String,
        required: [true, "Email is required"],
        lowercase: true,
        trim: true,
      },
      phoneNumber: String,
      address: {
        street: {
          type: String,
          required: [true, "Street address is required"],
        },
        city: {
          type: String,
          required: [true, "City is required"],
        },
        state: {
          type: String,
          required: [true, "State is required"],
        },
        postalCode: String,
        country: {
          type: String,
          default: "Nigeria",
        },
      },
    },
    parentGuardianInfo: {
      father: {
        name: String,
        occupation: String,
        phoneNumber: String,
        email: String,
      },
      mother: {
        name: String,
        occupation: String,
        phoneNumber: String,
        email: String,
      },
      guardian: {
        name: String,
        relationship: String,
        occupation: String,
        phoneNumber: String,
        email: String,
      },
    },
    academicInfo: {
      currentClass: {
        type: String,
        required: [true, "Current class is required"],
      },
      classArm: String,
      admissionDate: {
        type: Date,
        required: [true, "Admission date is required"],
      },
      graduationDate: Date,
      status: {
        type: String,
        enum: ["active", "graduated", "transferred", "suspended"],
        default: "active",
      },
      previousSchool: String,
    },
    medicalInfo: {
      allergies: [String],
      medications: [String],
      emergencyContact: {
        name: String,
        relationship: String,
        phoneNumber: String,
      },
    },
    settings: {
      notifications: {
        emailNotifications: {
          type: Boolean,
          default: true,
        },
        smsNotifications: {
          type: Boolean,
          default: false,
        },
        resultNotifications: {
          type: Boolean,
          default: true,
        },
        paymentNotifications: {
          type: Boolean,
          default: true,
        },
        eventNotifications: {
          type: Boolean,
          default: true,
        },
      },
      security: {
        twoFactorEnabled: {
          type: Boolean,
          default: false,
        },
        loginAlerts: {
          type: Boolean,
          default: true,
        },
      },
    },
  },
  {
    timestamps: true,
  }
);

// Generate student ID before saving
StudentSchema.pre("save", function (next) {
  if (!this.studentId) {
    const year = new Date().getFullYear();
    const random = Math.random().toString(36).substr(2, 6).toUpperCase();
    this.studentId = `RNS${year}${random}`;
  }
  next();
});

// Create indexes
// Note: studentId already has unique: true which creates an index automatically
StudentSchema.index({
  "personalInfo.firstName": 1,
  "personalInfo.lastName": 1,
});
StudentSchema.index({ "academicInfo.currentClass": 1 });
StudentSchema.index({ "academicInfo.status": 1 });

export default mongoose.model<IStudent>("Student", StudentSchema);
