import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getEventAnalytics } from "@/controllers/adminController";

export async function GET(
  req: NextRequest, 
  context: { params: Promise<{ id: string }> }
) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const { id: eventId } = await context.params;
    
    const result = await getEventAnalytics(user, eventId);
    if ("error" in result) {
      const status = result.error === "Event not found" ? 404 : 403;
      return NextResponse.json({ error: result.error }, { status });
    }
    
    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
} 