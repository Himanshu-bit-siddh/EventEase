import connectToDatabase from "@/lib/mongodb";
import Interaction from "@/models/Interaction";
import Registration from "@/models/Registration";
import Event from "@/models/Event";
import EventMember from "@/models/EventMember";
import type { JwtUser } from "@/lib/auth";

async function assertEventAccess(current: JwtUser, eventId: string): Promise<null | { error: "Forbidden" }> {
  await connectToDatabase();
  const event = await Event.findById(eventId);
  if (!event) return { error: "Forbidden" };
  const isMember = await EventMember.exists({ eventId: event._id, userId: current.id });
  const allowed = current.role === "ADMIN" || (current.role === "OWNER" && String(event.ownerId) === current.id) || (current.role === "STAFF" && !!isMember);
  return allowed ? null : { error: "Forbidden" };
}

export async function listRegistrations(current: JwtUser, eventId: string) {
  const access = await assertEventAccess(current, eventId);
  if (access) return access;
  const regs = await Registration.find({ eventId }).sort({ createdAt: -1 }).limit(500);
  return { registrations: regs };
}

export async function addInteraction(current: JwtUser, params: { eventId: string; participantId: string; note: string }) {
  const access = await assertEventAccess(current, params.eventId);
  if (access) return access;
  const interaction = await Interaction.create({ eventId: params.eventId, participantId: params.participantId, createdBy: current.id, note: params.note });
  return { interaction };
}

export async function listInteractions(current: JwtUser, eventId: string, participantId: string) {
  const access = await assertEventAccess(current, eventId);
  if (access) return access;
  const notes = await Interaction.find({ eventId, participantId }).sort({ createdAt: -1 }).limit(200);
  return { interactions: notes };
}


