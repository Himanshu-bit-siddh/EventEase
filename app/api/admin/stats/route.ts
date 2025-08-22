import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getSystemStats, getSystemHealth } from "@/controllers/adminController";

export async function GET(req: NextRequest) {
  try {
    const user = await getSessionUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    
    const url = new URL(req.url);
    const type = url.searchParams.get("type") || "stats";
    
    let result;
    
    if (type === "health") {
      result = await getSystemHealth(user);
    } else {
      result = await getSystemStats(user);
    }
    
    if ("error" in result) {
      return NextResponse.json({ error: result.error }, { status: 403 });
    }
    
    return NextResponse.json(result);
  } catch (err: unknown) {
    return NextResponse.json({ error: "Internal Server Error" }, { status: 500 });
  }
} 