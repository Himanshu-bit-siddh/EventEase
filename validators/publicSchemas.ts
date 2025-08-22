import { z } from "zod";

export const RsvpSchema = z.object({
  eventId: z.string().min(1),
  name: z.string().min(1),
  email: z.string().email().optional(),
  phone: z.string().optional(),
});


