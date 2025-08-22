import { NextResponse } from "next/server";
import { getSessionUser, requireRole } from "@/lib/auth";

export async function GET() {
  try {
    const user = await getSessionUser();
    requireRole(user, ["ADMIN"]);
    return NextResponse.json({ ok: true, role: user.role });
  } catch (err: unknown) {
    const status = typeof err === "object" && err && "status" in err ? (err as { status?: number }).status ?? 500 : 500;
    return NextResponse.json({ error: "Forbidden" }, { status: status === 500 ? 403 : status });
  }
}


