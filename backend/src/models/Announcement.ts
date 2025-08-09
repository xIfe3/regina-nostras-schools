import mongoose, { Schema, Document } from "mongoose";

export interface IAnnouncement extends Document {
  title: string;
  content: string;
  excerpt: string;
  imageUrl?: string;
  category:
    | "general"
    | "academic"
    | "sports"
    | "achievement"
    | "event"
    | "important";
  priority: "low" | "medium" | "high" | "urgent";
  status: "draft" | "published" | "archived";
  isPinned: boolean;
  publishDate: Date;
  expiryDate?: Date;
  targetAudience: "all" | "students" | "parents" | "staff" | "custom";
  customAudience?: {
    classes?: string[];
    roles?: string[];
    individuals?: mongoose.Types.ObjectId[];
  };
  author: mongoose.Types.ObjectId;
  tags: string[];
  views: number;
  attachments?: {
    name: string;
    url: string;
    type: string;
    size?: number;
  }[];
  isNotificationSent: boolean;
  metadata?: {
    readBy?: mongoose.Types.ObjectId[];
    likedBy?: mongoose.Types.ObjectId[];
    commentCount?: number;
  };
  createdAt: Date;
  updatedAt: Date;
}

const AnnouncementSchema = new Schema(
  {
    title: {
      type: String,
      required: [true, "Title is required"],
      trim: true,
      maxlength: [200, "Title cannot exceed 200 characters"],
      index: true,
    },
    content: {
      type: String,
      required: [true, "Content is required"],
      trim: true,
      maxlength: [5000, "Content cannot exceed 5000 characters"],
    },
    excerpt: {
      type: String,
      required: [true, "Excerpt is required"],
      trim: true,
      maxlength: [300, "Excerpt cannot exceed 300 characters"],
    },
    imageUrl: {
      type: String,
      trim: true,
    },
    category: {
      type: String,
      enum: [
        "general",
        "academic",
        "sports",
        "achievement",
        "event",
        "important",
      ],
      default: "general",
      required: true,
      index: true,
    },
    priority: {
      type: String,
      enum: ["low", "medium", "high", "urgent"],
      default: "medium",
      required: true,
    },
    status: {
      type: String,
      enum: ["draft", "published", "archived"],
      default: "draft",
      required: true,
      index: true,
    },
    isPinned: {
      type: Boolean,
      default: false,
      index: true,
    },
    publishDate: {
      type: Date,
      default: Date.now,
      index: true,
    },
    expiryDate: {
      type: Date,
      index: true,
    },
    targetAudience: {
      type: String,
      enum: ["all", "students", "parents", "staff", "custom"],
      default: "all",
      required: true,
    },
    customAudience: {
      classes: [
        {
          type: String,
          trim: true,
        },
      ],
      roles: [
        {
          type: String,
          enum: ["student", "admin", "teacher", "parent"],
        },
      ],
      individuals: [
        {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
      ],
    },
    author: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: [true, "Author is required"],
      index: true,
    },
    tags: [
      {
        type: String,
        trim: true,
        lowercase: true,
        maxlength: [50, "Tag cannot exceed 50 characters"],
      },
    ],
    views: {
      type: Number,
      default: 0,
      min: 0,
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
          trim: true,
        },
        type: {
          type: String,
          required: true,
        },
        size: {
          type: Number,
          min: 0,
        },
      },
    ],
    isNotificationSent: {
      type: Boolean,
      default: false,
    },
    metadata: {
      readBy: [
        {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      likedBy: [
        {
          type: Schema.Types.ObjectId,
          ref: "User",
        },
      ],
      commentCount: {
        type: Number,
        default: 0,
        min: 0,
      },
    },
  },
  {
    timestamps: true,
  }
);

// Create indexes for better query performance
AnnouncementSchema.index({ status: 1, publishDate: -1 });
AnnouncementSchema.index({ status: 1, isPinned: -1, publishDate: -1 });
AnnouncementSchema.index({ category: 1, status: 1, publishDate: -1 });
AnnouncementSchema.index({ targetAudience: 1, status: 1 });
AnnouncementSchema.index({ title: "text", content: "text", tags: "text" });
AnnouncementSchema.index({ publishDate: -1, expiryDate: 1 });

// Virtual for checking if announcement is active
AnnouncementSchema.virtual("isActive").get(function () {
  const now = new Date();
  const isPublished = this.status === "published";
  const isAfterPublishDate = this.publishDate <= now;
  const isBeforeExpiryDate = !this.expiryDate || this.expiryDate >= now;

  return isPublished && isAfterPublishDate && isBeforeExpiryDate;
});

// Virtual for full name of author
AnnouncementSchema.virtual("authorName").get(function () {
  if (this.populated("author")) {
    return (this.author as any).email || "Unknown Author";
  }
  return "Unknown Author";
});

// Pre-save middleware to auto-generate excerpt if not provided
AnnouncementSchema.pre("save", function (next) {
  if (!this.excerpt && this.content) {
    // Generate excerpt from content (first 250 characters)
    const cleanContent = this.content.replace(/<[^>]*>/g, ""); // Remove HTML tags
    this.excerpt =
      cleanContent.length > 250
        ? cleanContent.substring(0, 250) + "..."
        : cleanContent;
  }
  next();
});

// Ensure virtual fields are serialized
AnnouncementSchema.set("toJSON", { virtuals: true });
AnnouncementSchema.set("toObject", { virtuals: true });

export default mongoose.model<IAnnouncement>(
  "Announcement",
  AnnouncementSchema
);
