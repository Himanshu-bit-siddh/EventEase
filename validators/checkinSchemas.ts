import { z } from "zod";

export const CheckInSchema = z.object({
  eventId: z.string().min(1),
  registrationId: z.string().min(1).optional(),
  participantId: z.string().min(1).optional(),
});


