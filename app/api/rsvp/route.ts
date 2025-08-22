import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { createRSVP } from "@/controllers/rsvpController";
import { getClientIp, rateLimit, rateLimitHeaders } from "@/lib/rateLimit";

const RSVPSchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
  name: z.string().min(1, "Name is required").max(100, "Name too long"),
  email: z.string().email("Invalid email address"),
  phone: z.string().max(20, "Phone number too long").optional(),
  customFieldResponses: z.array(z.object({
    fieldName: z.string(),
    value: z.any(),
  })).optional(),
  notes: z.string().max(500, "Notes too long").optional(),
});

export async function POST(req: NextRequest) {
  try {
    // Rate limiting per IP
    const ip = getClientIp(req);
    const ipRes = rateLimit(`rsvp:ip:${ip}`, 20, 60_000); // 20 RSVPs per IP per minute
    if (ipRes.limited) {
      return new NextResponse(
        JSON.stringify({ error: "Too many RSVP attempts. Try again later." }), 
        { status: 429, headers: rateLimitHeaders(ipRes) }
      );
    }

    const body = await req.json();
    const { eventId, ...rsvpData } = RSVPSchema.parse(body);

    // Additional rate limiting per email
    const emailRes = rateLimit(`rsvp:email:${rsvpData.email}`, 5, 60_000); // 5 RSVPs per email per minute
    if (emailRes.limited) {
      return new NextResponse(
        JSON.stringify({ error: "Too many RSVPs for this email. Try again later." }), 
        { status: 429, headers: rateLimitHeaders(emailRes) }
      );
    }

    const result = await createRSVP(
      eventId, 
      rsvpData, 
      ip, 
      req.headers.get("user-agent") || undefined
    );

    if ("error" in result) {
      return NextResponse.json(
        { error: result.error }, 
        { status: 400, headers: rateLimitHeaders(emailRes) }
      );
    }

    return NextResponse.json(result, { 
      status: 201, 
      headers: rateLimitHeaders(emailRes) 
    });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}


