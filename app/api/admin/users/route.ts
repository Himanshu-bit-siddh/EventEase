import { NextRequest, NextResponse } from "next/server";
import { getSessionUser } from "@/lib/auth";
import { listUsers, updateUserRole } from "@/controllers/adminController";
import { z } from "zod";

const UpdateRoleSchema = z.object({ userId: z.string().min(1), role: z.enum(["ADMIN", "STAFF", "OWNER"]) });

export async function GET() {
  const current = await getSessionUser();
  if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const result = await listUsers(current);
  if ("error" in result) return NextResponse.json({ error: result.error }, { status: 403 });
  return NextResponse.json(result);
}

export async function PATCH(req: NextRequest) {
  const current = await getSessionUser();
  if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const body = await req.json();
  const parsed = UpdateRoleSchema.parse(body);
  const result = await updateUserRole(current, parsed.userId, parsed.role);
  if ("error" in result) {
    const status = result.error === "User not found" ? 404 : 403;
    return NextResponse.json({ error: result.error }, { status });
  }
  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const current = await getSessionUser();
  if (!current) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  const form = await req.formData();
  const userId = String(form.get("userId") || "");
  const role = String(form.get("role") || "");
  const parsed = UpdateRoleSchema.parse({ userId, role });
  const result = await updateUserRole(current, parsed.userId, parsed.role);
  if ("error" in result) {
    const status = result.error === "User not found" ? 404 : 403;
    return NextResponse.json({ error: result.error }, { status });
  }
  return NextResponse.json(result);
}


