import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { registerUser } from "@/controllers/authController";
import { getClientIp, rateLimit, rateLimitHeaders } from "@/lib/rateLimit";

const RegisterSchema = z.object({
  name: z.string().trim().min(1).optional(),
  email: z.string().trim().email(),
  password: z.string().min(8).max(100),
  role: z.enum(["ADMIN", "STAFF", "OWNER"]).optional(),
});

export async function POST(req: NextRequest) {
  try {
    const ip = getClientIp(req);
    const ipRes = rateLimit(`register:ip:${ip}`, 5, 60_000);
    if (ipRes.limited) {
      return new NextResponse(JSON.stringify({ error: "Too many requests. Try again later." }), { status: 429, headers: rateLimitHeaders(ipRes) });
    }

    const body = await req.json();
    const { name, email, password, role } = RegisterSchema.parse(body);

    const emailRes = rateLimit(`register:email:${email}`, 3, 60_000);
    if (emailRes.limited) {
      return new NextResponse(JSON.stringify({ error: "Too many registrations for this email. Try again later." }), { status: 429, headers: rateLimitHeaders(emailRes) });
    }

    const result = await registerUser({ name, email, password, role });
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400, headers: rateLimitHeaders(emailRes) });
    }
    return NextResponse.json(result.user, { headers: rateLimitHeaders(emailRes) });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}


