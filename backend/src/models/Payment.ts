import mongoose, { Document, Schema } from "mongoose";

export interface IPayment extends Document {
  _id: string;
  studentId: mongoose.Types.ObjectId;
  academicSession: string;
  term: "first" | "second" | "third";
  paymentType:
    | "school_fees"
    | "exam_fees"
    | "uniform"
    | "books"
    | "excursion"
    | "other";
  amount: number;
  currency: string;
  paymentMethod: "bank_transfer" | "online_payment" | "cash" | "check" | "pos";
  status: "pending" | "verified" | "rejected";
  transactionReference?: string;
  bankDetails?: {
    bankName: string;
    accountNumber: string;
    accountName: string;
    transactionDate: Date;
  };
  receiptDetails: {
    receiptNumber?: string;
    receiptImage?: string;
    description?: string;
  };
  verificationDetails?: {
    verifiedBy: mongoose.Types.ObjectId;
    verifiedAt: Date;
    verificationNotes?: string;
  };
  rejectionReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new Schema<IPayment>(
  {
    studentId: {
      type: Schema.Types.ObjectId,
      ref: "Student",
      required: true,
    },
    academicSession: {
      type: String,
      required: [true, "Academic session is required"],
      match: [/^\d{4}\/\d{4}$/, "Academic session must be in format YYYY/YYYY"],
    },
    term: {
      type: String,
      enum: ["first", "second", "third"],
      required: [true, "Term is required"],
    },
    paymentType: {
      type: String,
      enum: [
        "school_fees",
        "exam_fees",
        "uniform",
        "books",
        "excursion",
        "other",
      ],
      required: [true, "Payment type is required"],
    },
    amount: {
      type: Number,
      required: [true, "Amount is required"],
      min: [1, "Amount must be greater than 0"],
    },
    currency: {
      type: String,
      default: "NGN",
      enum: ["NGN", "USD", "EUR", "GBP"],
    },
    paymentMethod: {
      type: String,
      enum: ["bank_transfer", "online_payment", "cash", "check", "pos"],
      required: [true, "Payment method is required"],
    },
    status: {
      type: String,
      enum: ["pending", "verified", "rejected"],
      default: "pending",
    },
    transactionReference: String,
    bankDetails: {
      bankName: String,
      accountNumber: String,
      accountName: String,
      transactionDate: Date,
    },
    receiptDetails: {
      receiptNumber: String,
      receiptImage: {
        type: String,
        required: [true, "Receipt image is required"],
      },
      description: String,
    },
    verificationDetails: {
      verifiedBy: {
        type: Schema.Types.ObjectId,
        ref: "User",
      },
      verifiedAt: Date,
      verificationNotes: String,
    },
    rejectionReason: String,
  },
  {
    timestamps: true,
  }
);

// Indexes
PaymentSchema.index({ studentId: 1, academicSession: 1, term: 1 });
PaymentSchema.index({ status: 1 });
PaymentSchema.index({ paymentType: 1 });
PaymentSchema.index({ createdAt: -1 });

export default mongoose.model<IPayment>("Payment", PaymentSchema);
