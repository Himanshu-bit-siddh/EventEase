import mongoose, { Schema, Document, Model, Types } from "mongoose";

export type InteractionType = "COMMENT" | "LIKE" | "SHARE" | "PHOTO" | "SURVEY_RESPONSE" | "FEEDBACK";

export interface IInteraction extends Document {
  eventId: Types.ObjectId;
  participantId?: Types.ObjectId; // Optional for anonymous interactions
  userId?: Types.ObjectId; // For authenticated user interactions
  type: InteractionType;
  content?: string;
  metadata?: Record<string, any>;
  isModerated: boolean;
  moderatedBy?: Types.ObjectId;
  moderatedAt?: Date;
  moderationReason?: string;
  createdAt: Date;
  updatedAt: Date;
}

const InteractionSchema = new Schema<IInteraction>(
  {
    eventId: { type: Schema.Types.ObjectId, ref: "Event", required: true, index: true },
    participantId: { type: Schema.Types.ObjectId, ref: "Participant", index: true },
    userId: { type: Schema.Types.ObjectId, ref: "User", index: true },
    type: { type: String, enum: ["COMMENT", "LIKE", "SHARE", "PHOTO", "SURVEY_RESPONSE", "FEEDBACK"], required: true },
    content: { type: String },
    metadata: { type: Schema.Types.Mixed },
    isModerated: { type: Boolean, default: false },
    moderatedBy: { type: Schema.Types.ObjectId, ref: "User" },
    moderatedAt: { type: Date },
    moderationReason: { type: String },
  },
  { timestamps: true }
);

InteractionSchema.index({ eventId: 1, type: 1 });
InteractionSchema.index({ eventId: 1, createdAt: -1 });
InteractionSchema.index({ participantId: 1, eventId: 1 });
InteractionSchema.index({ userId: 1, eventId: 1 });
InteractionSchema.index({ isModerated: 1, eventId: 1 });

const Interaction: Model<IInteraction> =
  mongoose.models.Interaction || mongoose.model<IInteraction>("Interaction", InteractionSchema);

export default Interaction;


