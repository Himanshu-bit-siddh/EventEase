import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { 
  createInteraction, 
  getEventInteractions, 
  moderateInteraction,
  deleteInteraction,
  getInteractionStats 
} from "@/controllers/interactionController";
import { getClientIp, rateLimit, rateLimitHeaders } from "@/lib/rateLimit";

const CreateInteractionSchema = z.object({ 
  type: z.enum(["COMMENT", "LIKE", "SHARE", "PHOTO", "SURVEY_RESPONSE", "FEEDBACK"] as const),
  content: z.string().max(1000).optional(),
  metadata: z.any().optional(),
});

const ModerationSchema = z.object({
  action: z.enum(["approve", "reject"] as const),
  reason: z.string().max(200).optional(),
});

export async function POST(
  req: NextRequest, 
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await context.params;
    const user = await getSessionUser();
    
    // Rate limiting per IP
    const ip = getClientIp(req);
    const ipRes = rateLimit(`interaction:ip:${ip}`, 30, 60_000); // 30 interactions per IP per minute
    if (ipRes.limited) {
      return new NextResponse(
        JSON.stringify({ error: "Too many interactions. Try again later." }), 
        { status: 429, headers: rateLimitHeaders(ipRes) }
      );
    }

    const body = await CreateInteractionSchema.parse(await req.json());
    
    // Additional rate limiting per user if authenticated
    if (user) {
      const userRes = rateLimit(`interaction:user:${user.id}`, 20, 60_000);
      if (userRes.limited) {
        return new NextResponse(
          JSON.stringify({ error: "Too many interactions for this user. Try again later." }), 
          { status: 429, headers: rateLimitHeaders(userRes) }
        );
      }
      
      const result = await createInteraction(
        eventId, 
        body, 
        undefined, 
        user.id, 
        ip, 
        req.headers.get("user-agent") || undefined
      );
      
      if ("error" in result) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      
      return NextResponse.json(result, { status: 201, headers: rateLimitHeaders(userRes) });
    } else {
      // Anonymous interaction (not supported for most types)
      if (body.type !== "LIKE" && body.type !== "SHARE") {
        return NextResponse.json({ error: "Authentication required for this interaction type" }, { status: 401 });
      }
      
      const result = await createInteraction(
        eventId, 
        body, 
        undefined, 
        undefined, 
        ip, 
        req.headers.get("user-agent") || undefined
      );
      
      if ("error" in result) {
        return NextResponse.json({ error: result.error }, { status: 400 });
      }
      
      return NextResponse.json(result, { status: 201, headers: rateLimitHeaders(ipRes) });
    }
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(
  req: NextRequest, 
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await context.params;
    const user = await getSessionUser();
    
    const url = new URL(req.url);
    const type = url.searchParams.get("type");
    const includeModerated = url.searchParams.get("includeModerated") === "true";
    
    // Only authenticated users can see moderated content
    if (includeModerated && !user) {
      return NextResponse.json({ error: "Authentication required" }, { status: 401 });
    }
    
    const result = await getEventInteractions(eventId, type || undefined, includeModerated);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }
    
    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function PATCH(
  req: NextRequest, 
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await context.params;
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const url = new URL(req.url);
    const interactionId = url.searchParams.get("interactionId");
    if (!interactionId) return NextResponse.json({ error: "interactionId is required" }, { status: 400 });
    
    const body = ModerationSchema.parse(await req.json());
    
    const result = await moderateInteraction(user, interactionId, body.action, body.reason);
    if ("error" in result) {
      const status = result.error === "Forbidden" ? 403 : 404;
      return NextResponse.json({ error: result.error }, { status });
    }
    
    return NextResponse.json(result);
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest, 
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await context.params;
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const url = new URL(req.url);
    const interactionId = url.searchParams.get("interactionId");
    if (!interactionId) return NextResponse.json({ error: "interactionId is required" }, { status: 400 });
    
    const result = await deleteInteraction(user, interactionId);
    if ("error" in result) {
      const status = result.error === "Forbidden" ? 403 : 404;
      return NextResponse.json({ error: result.error }, { status });
    }
    
    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}


