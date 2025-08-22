import connectToDatabase from "@/lib/mongodb";
import Event from "@/models/Event";
import EventMember from "@/models/EventMember";
import type { JwtUser } from "@/lib/auth";

export async function listEvents(current: JwtUser | null) {
  await connectToDatabase();
  if (!current) {
    const events = await Event.find({ isPublic: true }).sort({ startAt: -1 }).limit(50);
    return { events };
  }
  if (current.role === "ADMIN") {
    const events = await Event.find({}).sort({ startAt: -1 }).limit(100);
    return { events };
  }
  const memberEventIds = await EventMember.find({ userId: current.id }).distinct("eventId");
  const query = current.role === "OWNER" ? { ownerId: current.id } : { _id: { $in: memberEventIds } };
  const events = await Event.find(query).sort({ startAt: -1 }).limit(100);
  return { events };
}

export async function createEvent(current: JwtUser, input: any) {
  await connectToDatabase();
  if (current.role === "STAFF") return { error: "Forbidden" as const };
  const event = await Event.create({ ...input, ownerId: current.id, isPublic: input.isPublic ?? true });
  return { event };
}

export async function getEvent(current: JwtUser | null, id: string) {
  await connectToDatabase();
  const event = await Event.findById(id);
  if (!event) return { error: "Not found" as const };
  if (!event.isPublic) {
    // Only visible to authorized users if private
    if (!current) return { error: "Not found" as const };
    const isMember = await EventMember.exists({ eventId: event._id, userId: current.id });
    const canView =
      current.role === "ADMIN" ||
      (current.role === "OWNER" && String(event.ownerId) === current.id) ||
      (current.role === "STAFF" && !!isMember);
    if (!canView) return { error: "Not found" as const };
  }
  return { event };
}

export async function updateEvent(current: JwtUser, id: string, input: any) {
  await connectToDatabase();
  const event = await Event.findById(id);
  if (!event) return { error: "Not found" as const };
  const isMember = await EventMember.exists({ eventId: event._id, userId: current.id });
  const canEdit = current.role === "ADMIN" || (current.role === "OWNER" && String(event.ownerId) === current.id) || (current.role === "STAFF" && !!isMember);
  if (!canEdit) return { error: "Forbidden" as const };
  Object.assign(event, input);
  await event.save();
  return { event };
}

export async function deleteEvent(current: JwtUser, id: string) {
  await connectToDatabase();
  const event = await Event.findById(id);
  if (!event) return { error: "Not found" as const };
  const canDelete = current.role === "ADMIN" || (current.role === "OWNER" && String(event.ownerId) === current.id);
  if (!canDelete) return { error: "Forbidden" as const };
  await event.deleteOne();
  return { ok: true as const };
}

export async function addMember(current: JwtUser, eventId: string, userId: string) {
  await connectToDatabase();
  const event = await Event.findById(eventId);
  if (!event) return { error: "Not found" as const };
  const canManage = current.role === "ADMIN" || (current.role === "OWNER" && String(event.ownerId) === current.id);
  if (!canManage) return { error: "Forbidden" as const };
  await EventMember.updateOne({ eventId: event._id, userId }, { $setOnInsert: { role: "STAFF" } }, { upsert: true });
  return { ok: true as const };
}

export async function removeMember(current: JwtUser, eventId: string, userId: string) {
  await connectToDatabase();
  const event = await Event.findById(eventId);
  if (!event) return { error: "Not found" as const };
  const canManage = current.role === "ADMIN" || (current.role === "OWNER" && String(event.ownerId) === current.id);
  if (!canManage) return { error: "Forbidden" as const };
  await EventMember.deleteOne({ eventId: event._id, userId });
  return { ok: true as const };
}


