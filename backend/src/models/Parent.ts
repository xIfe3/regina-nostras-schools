import mongoose, { Document, Schema } from "mongoose";

export interface IParent extends Document {
  _id: string;
  userId: mongoose.Types.ObjectId;
  name: string;
  phoneNumber?: string;
  children: mongoose.Types.ObjectId[];
  createdAt: Date;
  updatedAt: Date;
}

const ParentSchema = new Schema<IParent>(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
      unique: true,
    },
    name: {
      type: String,
      trim: true,
      default: "",
    },
    phoneNumber: {
      type: String,
      trim: true,
    },
    children: [
      {
        type: Schema.Types.ObjectId,
        ref: "Student",
      },
    ],
  },
  {
    timestamps: true,
  }
);

ParentSchema.index({ children: 1 });

export default mongoose.model<IParent>("Parent", ParentSchema);
