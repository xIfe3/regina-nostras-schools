import mongoose, { Document, Schema } from "mongoose";

export interface IResult extends Document {
  _id: string;
  studentId: mongoose.Types.ObjectId;
  academicSession: string; // e.g., "2023/2024"
  term: "first" | "second" | "third";
  class: string;
  classArm?: string;
  subjects: {
    subjectName: string;
    subjectCode?: string;
    scores: {
      firstCA?: number;
      secondCA?: number;
      thirdCA?: number;
      exam: number;
      total: number;
    };
    grade: string;
    remark: string;
    position?: number;
  }[];
  summary: {
    totalScore: number;
    averageScore: number;
    overallGrade: string;
    position: number;
    totalStudents: number;
    remark: string;
  };
  attendance: {
    schoolOpened: number;
    timesPresent: number;
    timesAbsent: number;
  };
  behavioralAssessment?: {
    punctuality: "excellent" | "very good" | "good" | "fair" | "poor";
    neatness: "excellent" | "very good" | "good" | "fair" | "poor";
    politeness: "excellent" | "very good" | "good" | "fair" | "poor";
    honesty: "excellent" | "very good" | "good" | "fair" | "poor";
    leadership: "excellent" | "very good" | "good" | "fair" | "poor";
    relationship: "excellent" | "very good" | "good" | "fair" | "poor";
  };
  teacherComments?: string;
  principalComments?: string;
  nextTermBegins?: Date;
  isPublished: boolean;
  publishedAt?: Date;
  publishedBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ResultSchema = new Schema<IResult>(
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
    class: {
      type: String,
      required: [true, "Class is required"],
    },
    classArm: String,
    subjects: [
      {
        subjectName: {
          type: String,
          required: [true, "Subject name is required"],
        },
        subjectCode: String,
        scores: {
          firstCA: {
            type: Number,
            min: 0,
            max: 10,
          },
          secondCA: {
            type: Number,
            min: 0,
            max: 10,
          },
          thirdCA: {
            type: Number,
            min: 0,
            max: 10,
          },
          exam: {
            type: Number,
            required: [true, "Exam score is required"],
            min: 0,
            max: 70,
          },
          total: {
            type: Number,
            required: [true, "Total score is required"],
            min: 0,
            max: 100,
          },
        },
        grade: {
          type: String,
          required: [true, "Grade is required"],
          enum: ["A1", "B2", "B3", "C4", "C5", "C6", "D7", "E8", "F9"],
        },
        remark: {
          type: String,
          required: [true, "Remark is required"],
        },
        position: Number,
      },
    ],
    summary: {
      totalScore: {
        type: Number,
        required: [true, "Total score is required"],
      },
      averageScore: {
        type: Number,
        required: [true, "Average score is required"],
      },
      overallGrade: {
        type: String,
        required: [true, "Overall grade is required"],
      },
      position: {
        type: Number,
        required: [true, "Position is required"],
      },
      totalStudents: {
        type: Number,
        required: [true, "Total students is required"],
      },
      remark: {
        type: String,
        required: [true, "Summary remark is required"],
      },
    },
    attendance: {
      schoolOpened: {
        type: Number,
        required: [true, "School opened days is required"],
        min: 0,
      },
      timesPresent: {
        type: Number,
        required: [true, "Times present is required"],
        min: 0,
      },
      timesAbsent: {
        type: Number,
        required: [true, "Times absent is required"],
        min: 0,
      },
    },
    behavioralAssessment: {
      punctuality: {
        type: String,
        enum: ["excellent", "very good", "good", "fair", "poor"],
      },
      neatness: {
        type: String,
        enum: ["excellent", "very good", "good", "fair", "poor"],
      },
      politeness: {
        type: String,
        enum: ["excellent", "very good", "good", "fair", "poor"],
      },
      honesty: {
        type: String,
        enum: ["excellent", "very good", "good", "fair", "poor"],
      },
      leadership: {
        type: String,
        enum: ["excellent", "very good", "good", "fair", "poor"],
      },
      relationship: {
        type: String,
        enum: ["excellent", "very good", "good", "fair", "poor"],
      },
    },
    teacherComments: String,
    principalComments: String,
    nextTermBegins: Date,
    isPublished: {
      type: Boolean,
      default: false,
    },
    publishedAt: Date,
    publishedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
  },
  {
    timestamps: true,
  }
);

// Compound index for unique results per student, session, and term
ResultSchema.index(
  { studentId: 1, academicSession: 1, term: 1 },
  { unique: true }
);
ResultSchema.index({ class: 1, academicSession: 1, term: 1 });
ResultSchema.index({ isPublished: 1 });

export default mongoose.model<IResult>("Result", ResultSchema);
