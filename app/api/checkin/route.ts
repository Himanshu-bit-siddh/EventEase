import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";
import { getSessionUser } from "@/lib/auth";
import { checkInParticipant, getCheckInStats } from "@/controllers/checkinController";

const CheckinSchema = z.object({
  eventId: z.string().min(1, "Event ID is required"),
  participantId: z.string().min(1, "Participant ID is required"),
  notes: z.string().max(200, "Notes too long").optional(),
});

export async function POST(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await req.json();
    const { eventId, ...checkinData } = CheckinSchema.parse(body);

    const result = await checkInParticipant(user, eventId, checkinData);
    if ("error" in result) {
      const status = result.error === "Event not found" ? 404 : 
                    result.error === "Forbidden" ? 403 : 400;
      return NextResponse.json({ error: result.error }, { status });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err: unknown) {
    if (err instanceof z.ZodError) {
      return NextResponse.json({ error: err.flatten() }, { status: 400 });
    }
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const url = new URL(req.url);
    const eventId = url.searchParams.get("eventId");
    if (!eventId) return NextResponse.json({ error: "eventId is required" }, { status: 400 });

    const result = await getCheckInStats(eventId);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }

    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}


