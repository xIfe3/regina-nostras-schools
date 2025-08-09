import mongoose, { Document, Schema } from "mongoose";

export interface IEvent extends Document {
  title: string;
  description?: string;
  date: Date;
  startTime?: string;
  endTime?: string;
  type: "exam" | "holiday" | "meeting" | "sports" | "academic" | "other";
  location?: string;
  mandatory: boolean;
  targetAudience: "all" | "students" | "staff" | "parents" | "custom";
  customAudience?: {
    classes?: string[];
    departments?: string[];
    individuals?: mongoose.Types.ObjectId[];
  };
  status: "draft" | "published" | "cancelled";
  organizer: mongoose.Types.ObjectId;
  attachments?: {
    name: string;
    url: string;
    type: string;
  }[];
  reminderSettings?: {
    enabled: boolean;
    reminderTime: number; // minutes before event
    reminderMethods: ("email" | "sms" | "notification")[];
  };
  rsvpRequired?: boolean;
  maxAttendees?: number;
  currentAttendees?: number;
  tags?: string[];
  isRecurring?: boolean;
  recurrencePattern?: {
    frequency: "daily" | "weekly" | "monthly" | "yearly";
    interval: number;
    endDate?: Date;
    daysOfWeek?: number[]; // for weekly recurrence
    dayOfMonth?: number; // for monthly recurrence
  };
  createdBy: mongoose.Types.ObjectId;
  updatedBy?: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const EventSchema = new Schema<IEvent>(
  {
    title: {
      type: String,
      required: [true, "Event title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
    },
    description: {
      type: String,
      trim: true,
      maxlength: [2000, "Description cannot exceed 2000 characters"],
    },
    date: {
      type: Date,
      required: [true, "Event date is required"],
      index: true,
    },
    startTime: {
      type: String,
      validate: {
        validator: function (v: string) {
          if (!v) return true;
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: "Start time must be in HH:MM format",
      },
    },
    endTime: {
      type: String,
      validate: {
        validator: function (v: string) {
          if (!v) return true;
          return /^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/.test(v);
        },
        message: "End time must be in HH:MM format",
      },
    },
    type: {
      type: String,
      required: [true, "Event type is required"],
      enum: {
        values: ["exam", "holiday", "meeting", "sports", "academic", "other"],
        message: "Invalid event type",
      },
      index: true,
    },
    location: {
      type: String,
      trim: true,
      maxlength: [200, "Location cannot exceed 200 characters"],
    },
    mandatory: {
      type: Boolean,
      default: false,
      index: true,
    },
    targetAudience: {
      type: String,
      required: [true, "Target audience is required"],
      enum: {
        values: ["all", "students", "staff", "parents", "custom"],
        message: "Invalid target audience",
      },
      default: "all",
    },
    customAudience: {
      classes: [
        {
          type: String,
          trim: true,
        },
      ],
      departments: [
        {
          type: String,
          trim: true,
        },
      ],
      individuals: [
        {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
      ],
    },
    status: {
      type: String,
      required: [true, "Event status is required"],
      enum: {
        values: ["draft", "published", "cancelled"],
        message: "Invalid event status",
      },
      default: "draft",
      index: true,
    },
    organizer: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Event organizer is required"],
    },
    attachments: [
      {
        name: {
          type: String,
          required: true,
          trim: true,
        },
        url: {
          type: String,
          required: true,
        },
        type: {
          type: String,
          required: true,
        },
      },
    ],
    reminderSettings: {
      enabled: {
        type: Boolean,
        default: true,
      },
      reminderTime: {
        type: Number,
        default: 60, // 1 hour before
        min: [5, "Reminder time must be at least 5 minutes"],
        max: [10080, "Reminder time cannot exceed 7 days (10080 minutes)"],
      },
      reminderMethods: [
        {
          type: String,
          enum: ["email", "sms", "notification"],
        },
      ],
    },
    rsvpRequired: {
      type: Boolean,
      default: false,
    },
    maxAttendees: {
      type: Number,
      min: [1, "Maximum attendees must be at least 1"],
    },
    currentAttendees: {
      type: Number,
      default: 0,
      min: [0, "Current attendees cannot be negative"],
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
      },
    ],
    isRecurring: {
      type: Boolean,
      default: false,
    },
    recurrencePattern: {
      frequency: {
        type: String,
        enum: ["daily", "weekly", "monthly", "yearly"],
      },
      interval: {
        type: Number,
        min: [1, "Interval must be at least 1"],
        max: [365, "Interval cannot exceed 365"],
      },
      endDate: {
        type: Date,
      },
      daysOfWeek: [
        {
          type: Number,
          min: 0,
          max: 6,
        },
      ],
      dayOfMonth: {
        type: Number,
        min: 1,
        max: 31,
      },
    },
    createdBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Created by is required"],
    },
    updatedBy: {
      type: Schema.Types.ObjectId,
      ref: "User",
    },
  },
  {
    timestamps: true,
    toJSON: { virtuals: true },
    toObject: { virtuals: true },
  }
);

// Indexes for better query performance
EventSchema.index({ date: 1, status: 1 });
EventSchema.index({ type: 1, status: 1 });
EventSchema.index({ mandatory: 1, status: 1 });
EventSchema.index({ targetAudience: 1, status: 1 });
EventSchema.index({ tags: 1 });
EventSchema.index({ createdBy: 1 });

// Virtual for event duration in minutes
EventSchema.virtual("durationMinutes").get(function () {
  if (!this.startTime || !this.endTime) return null;

  const start = new Date(`2000-01-01T${this.startTime}:00`);
  const end = new Date(`2000-01-01T${this.endTime}:00`);

  return Math.round((end.getTime() - start.getTime()) / (1000 * 60));
});

// Virtual for formatted date
EventSchema.virtual("formattedDate").get(function () {
  return this.date.toLocaleDateString();
});

// Virtual for is past event
EventSchema.virtual("isPast").get(function () {
  const now = new Date();
  const eventDateTime = new Date(this.date);

  if (this.endTime) {
    const [hours, minutes] = this.endTime.split(":").map(Number);
    eventDateTime.setHours(hours, minutes);
  }

  return eventDateTime < now;
});

// Virtual for is upcoming (within next 7 days)
EventSchema.virtual("isUpcoming").get(function () {
  const now = new Date();
  const weekFromNow = new Date(now.getTime() + 7 * 24 * 60 * 60 * 1000);

  return this.date >= now && this.date <= weekFromNow;
});

// Pre-save middleware
EventSchema.pre("save", function (next) {
  // Validate time logic
  if (this.startTime && this.endTime) {
    const start = new Date(`2000-01-01T${this.startTime}:00`);
    const end = new Date(`2000-01-01T${this.endTime}:00`);

    if (end <= start) {
      next(new Error("End time must be after start time"));
      return;
    }
  }

  // Validate max attendees vs current attendees
  if (
    this.maxAttendees &&
    this.currentAttendees &&
    this.currentAttendees > this.maxAttendees
  ) {
    next(new Error("Current attendees cannot exceed maximum attendees"));
    return;
  }

  // Validate recurrence settings
  if (this.isRecurring && !this.recurrencePattern?.frequency) {
    next(new Error("Recurrence pattern is required for recurring events"));
    return;
  }

  // Ensure custom audience is provided when targetAudience is custom
  if (
    this.targetAudience === "custom" &&
    (!this.customAudience ||
      (!this.customAudience.classes?.length &&
        !this.customAudience.departments?.length &&
        !this.customAudience.individuals?.length))
  ) {
    next(
      new Error(
        "Custom audience details are required when target audience is custom"
      )
    );
    return;
  }

  next();
});

// Static methods
EventSchema.statics.getUpcomingEvents = function (limit = 10) {
  return this.find({
    status: "published",
    date: { $gte: new Date() },
  })
    .sort({ date: 1 })
    .limit(limit)
    .populate("organizer", "email")
    .populate("createdBy", "email");
};

EventSchema.statics.getEventsByDateRange = function (
  startDate: Date,
  endDate: Date
) {
  return this.find({
    status: "published",
    date: {
      $gte: startDate,
      $lte: endDate,
    },
  })
    .sort({ date: 1 })
    .populate("organizer", "email")
    .populate("createdBy", "email");
};

EventSchema.statics.getEventsByType = function (type: string, limit = 20) {
  return this.find({
    status: "published",
    type,
    date: { $gte: new Date() },
  })
    .sort({ date: 1 })
    .limit(limit)
    .populate("organizer", "email")
    .populate("createdBy", "email");
};

const Event = mongoose.model<IEvent>("Event", EventSchema);

export default Event;
