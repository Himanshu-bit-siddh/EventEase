import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { loginUser } from "@/controllers/authController";
import { getClientIp, rateLimit, rateLimitHeaders } from "@/lib/rateLimit";

const LoginSchema = z.object({
  email: z.string().trim().email(),
  password: z.string().min(8).max(100),
});

export async function POST(req: NextRequest) {
  try {
    // Basic per-IP + per-email rate limiting
    const ip = getClientIp(req);
    const ipRes = rateLimit(`login:ip:${ip}`, 10, 60_000);
    if (ipRes.limited) {
      return new NextResponse(JSON.stringify({ error: "Too many attempts. Try again later." }), { status: 429, headers: rateLimitHeaders(ipRes) });
    }

    const body = await req.json();
    const { email, password } = LoginSchema.parse(body);

    const emailRes = rateLimit(`login:email:${email}`, 5, 60_000);
    if (emailRes.limited) {
      return new NextResponse(JSON.stringify({ error: "Too many attempts for this email. Try again later." }), { status: 429, headers: rateLimitHeaders(emailRes) });
    }

    const result = await loginUser({ email, password });
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 401, headers: rateLimitHeaders(emailRes) });
    }
    return NextResponse.json(result.user, { headers: rateLimitHeaders(emailRes) });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}


