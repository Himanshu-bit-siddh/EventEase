import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { listEvents, createEvent } from "@/controllers/eventController";
import { EventSchema } from "@/validators/eventSchemas";

export async function GET() {
  const user = await getSessionUser();
  const result = await listEvents(user);
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const input = EventSchema.parse(body);
  const result = await createEvent(user, input);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 403 });
  return NextResponse.json(result, { status: 201 });
}


