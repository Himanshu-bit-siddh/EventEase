import connectToDatabase from "@/lib/mongodb";
import User from "@/models/User";
import bcrypt from "bcryptjs";
import { setSessionCookie } from "@/lib/auth";

export async function registerUser(params: { name?: string; email: string; password: string; role?: "ADMIN"|"STAFF"|"OWNER" }) {
  const { name, email, password, role } = params;
  await connectToDatabase();
  const existing = await User.findOne({ email });
  if (existing) return { error: "Email already in use" as const };
  const passwordHash = await bcrypt.hash(password, 10);
  const user = await User.create({ name, email, passwordHash, role: role || "OWNER" });
  return { user: { id: String(user._id), email: user.email, role: user.role } };
}

export async function loginUser(params: { email: string; password: string }) {
  const { email, password } = params;
  await connectToDatabase();
  const user = await User.findOne({ email });
  if (!user) return { error: "Invalid credentials" as const };
  const ok = await user.comparePassword(password);
  if (!ok) return { error: "Invalid credentials" as const };
  await setSessionCookie({ id: String(user._id), email: user.email, role: user.role });
  return { user: { id: String(user._id), email: user.email, role: user.role } };
}


