import mongoose, { Schema, Document, Model, Types } from "mongoose";

export interface ICustomField {
  name: string;
  type: "text" | "number" | "select" | "checkbox";
  required: boolean;
  options?: string[]; // For select type
  defaultValue?: any;
}

export interface IEvent extends Document {
  title: string;
  description?: string;
  startAt: Date;
  endAt?: Date;
  location?: string;
  isPublic: boolean;
  ownerId: Types.ObjectId;
  maxAttendees?: number;
  customFields?: ICustomField[];
  tags?: string[];
  imageUrl?: string;
  registrationDeadline?: Date;
  allowWaitlist: boolean;
  createdAt: Date;
  updatedAt: Date;
}

const CustomFieldSchema = new Schema<ICustomField>({
  name: { type: String, required: true, trim: true },
  type: { type: String, enum: ["text", "number", "select", "checkbox"], required: true },
  required: { type: Boolean, default: false },
  options: [{ type: String }],
  defaultValue: Schema.Types.Mixed,
});

const EventSchema = new Schema<IEvent>(
  {
    title: { type: String, required: true, trim: true },
    description: { type: String },
    startAt: { type: Date, required: true },
    endAt: { type: Date },
    location: { type: String },
    isPublic: { type: Boolean, default: true },
    ownerId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    maxAttendees: { type: Number, min: 1 },
    customFields: [CustomFieldSchema],
    tags: [{ type: String, trim: true }],
    imageUrl: { type: String },
    registrationDeadline: { type: Date },
    allowWaitlist: { type: Boolean, default: false },
  },
  { timestamps: true }
);

EventSchema.index({ ownerId: 1, startAt: -1 });
EventSchema.index({ isPublic: 1, startAt: -1 });
EventSchema.index({ tags: 1 });
EventSchema.index({ location: 1 });

const Event: Model<IEvent> = mongoose.models.Event || mongoose.model<IEvent>("Event", EventSchema);
export default Event;


