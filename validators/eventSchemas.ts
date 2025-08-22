import { z } from "zod";

// Custom field validation schema
export const CustomFieldSchema = z.object({
  name: z.string().min(1, "Field name is required").max(50, "Field name too long"),
  type: z.enum(["text", "number", "select", "checkbox"]),
  required: z.boolean().default(false),
  options: z.array(z.string()).optional(),
  defaultValue: z.any().optional(),
});

// Event creation/update schema
export const EventSchema = z.object({
  title: z.string().min(1, "Title is required").max(200, "Title too long"),
  description: z.string().max(2000, "Description too long").optional(),
  startAt: z.coerce.date(),
  endAt: z.coerce.date().optional(),
  location: z.string().max(200, "Location too long").optional(),
  isPublic: z.boolean().default(true),
  maxAttendees: z.number().min(1, "Max attendees must be at least 1").optional(),
  customFields: z.array(CustomFieldSchema).optional(),
  tags: z.array(z.string().max(30)).optional(),
  imageUrl: z.string().url("Invalid image URL").optional(),
  registrationDeadline: z.coerce.date().optional(),
  allowWaitlist: z.boolean().default(false),
});

// Event update schema (all fields optional)
export const EventUpdateSchema = EventSchema.partial();

// RSVP schema for public users
export const RSVPSchema = z.object({
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  email: z.string().email("Invalid email address"),
  phone: z.string().max(20, "Phone number too long").optional(),
  customFieldResponses: z.array(z.object({
    fieldName: z.string(),
    value: z.any(),
  })).optional(),
  notes: z.string().max(500, "Notes too long").optional(),
});

// Check-in schema
export const CheckinSchema = z.object({
  participantId: z.string().min(1, "Participant ID is required"),
  notes: z.string().max(200, "Notes too long").optional(),
});

// Interaction schema
export const InteractionSchema = z.object({
  type: z.enum(["COMMENT", "LIKE", "SHARE", "PHOTO", "SURVEY_RESPONSE", "FEEDBACK"]),
  content: z.string().max(1000, "Content too long").optional(),
  metadata: z.any().optional(),
});

// Event member management schema
export const EventMemberSchema = z.object({
  userId: z.string().min(1, "User ID is required"),
  role: z.enum(["STAFF", "MODERATOR", "VIEWER"]).default("STAFF"),
});

// Event search/filter schema
export const EventSearchSchema = z.object({
  query: z.string().optional(),
  tags: z.array(z.string()).optional(),
  location: z.string().optional(),
  startDate: z.coerce.date().optional(),
  endDate: z.coerce.date().optional(),
  limit: z.number().min(1, "Limit must be at least 1").max(100, "Limit must be at most 100").default(20),
  offset: z.number().min(0, "Offset must be at least 0").default(0),
});

// Export types
export type EventInput = z.infer<typeof EventSchema>;
export type EventUpdateInput = z.infer<typeof EventUpdateSchema>;
export type RSVPInput = z.infer<typeof RSVPSchema>;
export type CheckinInput = z.infer<typeof CheckinSchema>;
export type InteractionInput = z.infer<typeof InteractionSchema>;
export type EventMemberInput = z.infer<typeof EventMemberSchema>;
export type EventSearchInput = z.infer<typeof EventSearchSchema>;


