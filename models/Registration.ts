import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type RegistrationStatus = "REGISTERED" | "CHECKED_IN" | "CANCELLED" | "WAITLISTED" | "NO_SHOW";

export interface IRegistration extends Document {
  eventId: Types.ObjectId;
  participantId: Types.ObjectId;
  status: RegistrationStatus;
  rsvpAt: Date;
  checkInAt?: Date;
  waitlistPosition?: number;
  source?: string; // How they registered (web, mobile, etc.)
  ipAddress?: string;
  userAgent?: string;
  createdAt: Date;
  updatedAt: Date;
}

const RegistrationSchema = new Schema<IRegistration>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    participantId: { type: Schema.Types.ObjectId, ref: "Participant", required: true, index: true },
    status: { type: String, enum: ["REGISTERED", "CHECKED_IN", "CANCELLED", "WAITLISTED", "NO_SHOW"], default: "REGISTERED" },
    rsvpAt: { type: Date, default: () => new Date() },
    checkInAt: { type: Date },
    waitlistPosition: { type: Number, min: 1 },
    source: { type: String, default: "web" },
    ipAddress: { type: String },
    userAgent: { type: String },
  },
  { timestamps: true }
);

RegistrationSchema.index({ eventId: 1, participantId: 1 }, { unique: true });
RegistrationSchema.index({ eventId: 1, status: 1 });
RegistrationSchema.index({ eventId: 1, waitlistPosition: 1 });
RegistrationSchema.index({ participantId: 1, eventId: 1 });

const Registration: Model<IRegistration> =
  mongoose.models.Registration || mongoose.model<IRegistration>("Registration", RegistrationSchema);

export default Registration;


