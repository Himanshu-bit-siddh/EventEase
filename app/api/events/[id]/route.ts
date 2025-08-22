import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { getEvent, updateEvent, deleteEvent } from "@/controllers/eventController";
import { EventUpdateSchema } from "@/validators/eventSchemas";

export async function GET(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  const current = await getSessionUser();
  const { id } = await context.params;
  const result = await getEvent(current, id);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 404 });
  return NextResponse.json(result);
}

export async function PATCH(req: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const body = await req.json();
  const input = EventUpdateSchema.parse(body);
  const result = await updateEvent(user, id, input);
  if ("error" in result) {
    const status = result.error === "Not found" ? 404 : 403;
    return NextResponse.json({ error: result.error }, { status });
  }
  return NextResponse.json(result);
}

export async function DELETE(_: NextRequest, context: { params: Promise<{ id: string }> }) {
  const user = await getSessionUser();
  if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const { id } = await context.params;
  const result = await deleteEvent(user, id);
  if ("error" in result) {
    const status = result.error === "Not found" ? 404 : 403;
    return NextResponse.json({ error: result.error }, { status });
  }
  return NextResponse.json(result);
}


