import { NextRequest, NextResponse } from "next/server";
import { searchPublicEvents, getPopularEvents, getUpcomingEvents } from "@/controllers/publicController";

export async function GET(req: NextRequest) {
  try {
    const url = new URL(req.url);
    const query = url.searchParams.get("q") || "";
    const tags = url.searchParams.get("tags")?.split(",").filter(Boolean) || [];
    const location = url.searchParams.get("location") || "";
    const startDate = url.searchParams.get("startDate") || "";
    const endDate = url.searchParams.get("endDate") || "";
    const limit = parseInt(url.searchParams.get("limit") || "20");
    const offset = parseInt(url.searchParams.get("offset") || "0");
    const type = url.searchParams.get("type") || "search";
    
    let result;
    
    switch (type) {
      case "popular":
        result = await getPopularEvents(limit);
        break;
      case "upcoming":
        result = await getUpcomingEvents(limit);
        break;
      default:
        result = await searchPublicEvents({
          query,
          tags,
          location,
          startDate: startDate ? new Date(startDate) : undefined,
          endDate: endDate ? new Date(endDate) : undefined,
          limit: Math.min(limit, 100),
          offset: Math.max(offset, 0)
        });
    }
    
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 400 });
    }
    
    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
} 