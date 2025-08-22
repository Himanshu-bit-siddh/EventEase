import jwt from "jsonwebtoken";
import { cookies } from "next/headers";

export type JwtUser = {
  id: string;
  email: string;
  role: "ADMIN" | "STAFF" | "OWNER";
};

const COOKIE_NAME = "ee_session";

function getJwtSecret(): string {
  const secret = process.env.JWT_SECRET || process.env.JWT_TOKEN;
  if (!secret) throw new Error("JWT_SECRET is not set");
  return secret;
}

export function signSession(payload: JwtUser, maxAgeSeconds = 60 * 60 * 24 * 7): string {
  return jwt.sign(payload, getJwtSecret(), { expiresIn: maxAgeSeconds });
}

export function verifySession(token: string): JwtUser | null {
  try {
    return jwt.verify(token, getJwtSecret()) as JwtUser;
  } catch {
    return null;
  }
}

export async function setSessionCookie(payload: JwtUser): Promise<void> {
  const token = signSession(payload);
  const store = await cookies();
  store.set(COOKIE_NAME, token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === "production",
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 7,
  });
}

export async function clearSessionCookie(): Promise<void> {
  const store = await cookies();
  store.delete(COOKIE_NAME);
}

export async function getSessionUser(): Promise<JwtUser | null> {
  const store = await cookies();
  const token = store.get(COOKIE_NAME)?.value;
  if (!token) return null;
  return verifySession(token);
}

export function requireRole(current: JwtUser | null, roles: Array<JwtUser["role"]>): asserts current is JwtUser {
  if (!current || !roles.includes(current.role)) {
    const error = new Error("Forbidden");
    // @ts-expect-error add status
    error.status = 403;
    throw error;
  }
}


