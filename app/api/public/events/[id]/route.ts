import { NextRequest, NextResponse } from "next/server";
import { getPublicEvent, getPublicEventStats } from "@/controllers/publicController";

export async function GET(
  req: NextRequest, 
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await context.params;
    const url = new URL(req.url);
    const includeStats = url.searchParams.get("stats") === "true";
    
    if (includeStats) {
      const statsResult = await getPublicEventStats(eventId);
      if ("error" in statsResult) {
        return NextResponse.json({ error: statsResult.error }, { status: 404 });
      }
      return NextResponse.json(statsResult);
    }
    
    const result = await getPublicEvent(eventId);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }
    
    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
} 