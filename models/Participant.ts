import mongoose, { Schema, Document, Model } from "mongoose";

export interface ICustomFieldResponse {
  fieldName: string;
  value: any;
}

export interface IParticipant extends Document {
  name: string;
  email?: string;
  phone?: string;
  customFieldResponses?: ICustomFieldResponse[];
  notes?: string;
  createdAt: Date;
  updatedAt: Date;
}

const CustomFieldResponseSchema = new Schema<ICustomFieldResponse>({
  fieldName: { type: String, required: true },
  value: Schema.Types.Mixed,
});

const ParticipantSchema = new Schema<IParticipant>(
  {
    name: { type: String, required: true, trim: true },
    email: { type: String, lowercase: true, trim: true, index: true },
    phone: { type: String },
    customFieldResponses: [CustomFieldResponseSchema],
    notes: { type: String },
  },
  { timestamps: true }
);

const Participant: Model<IParticipant> =
  mongoose.models.Participant || mongoose.model<IParticipant>("Participant", ParticipantSchema);

export default Participant;


