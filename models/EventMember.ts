import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type MemberRole = "STAFF" | "MODERATOR" | "VIEWER";

export interface IEventMember extends Document {
  eventId: Types.ObjectId;
  userId: Types.ObjectId;
  role: MemberRole;
  addedAt: Date;
  addedBy: Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const EventMemberSchema = new Schema<IEventMember>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", required: true, index: true },
    role: { type: String, enum: ["STAFF", "MODERATOR", "VIEWER"], default: "STAFF" },
    addedAt: { type: Date, default: () => new Date() },
    addedBy: { type: Schema.Types.ObjectId, ref: "User", required: true },
  },
  { timestamps: true }
);

EventMemberSchema.index({ eventId: 1, userId: 1 }, { unique: true });
EventMemberSchema.index({ userId: 1, eventId: 1 });

const EventMember: Model<IEventMember> =
  mongoose.models.EventMember || mongoose.model<IEventMember>("EventMember", EventMemberSchema);

export default EventMember;


