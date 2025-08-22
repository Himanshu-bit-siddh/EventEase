import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getEventRegistrations, exportRegistrationsCSV } from "@/controllers/rsvpController";

export async function GET(
  req: NextRequest, 
  context: { params: Promise<{ id: string }> }
) {
  try {
    const { id: eventId } = await context.params;
    const user = await getSessionUser();
    
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const url = new URL(req.url);
    const includeWaitlist = url.searchParams.get("includeWaitlist") === "true";
    const exportCSV = url.searchParams.get("export") === "csv";
    
    if (exportCSV) {
      const result = await exportRegistrationsCSV(eventId);
      if ("error" in result) {
        return NextResponse.json({ error: result.error }, { status: 404 });
      }
      
      return new NextResponse(result.csvContent, {
        status: 200,
        headers: {
          "Content-Type": "text/csv",
          "Content-Disposition": `attachment; filename="${result.filename}"`,
        },
      });
    }
    
    const result = await getEventRegistrations(eventId, includeWaitlist);
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 404 });
    }
    
    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
}


