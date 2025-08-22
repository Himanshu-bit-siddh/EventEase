import { z } from "zod";

export const LoginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(100),
});

export const RegisterSchema = z.object({
  name: z.string().trim().min(1).optional(),
  email: z.string().trim().email(),
  password: z.string().min(8).max(100),
  role: z.enum(["ADMIN", "STAFF", "OWNER"]).optional(),
});


