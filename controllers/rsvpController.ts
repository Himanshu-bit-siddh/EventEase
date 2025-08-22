import connectToDatabase from "@/lib/mongodb";
import Event from "@/models/Event";
import Participant from "@/models/Participant";
import Registration from "@/models/Registration";
import type { RSVPInput } from "@/validators/eventSchemas";

export async function createRSVP(eventId: string, input: RSVPInput, ipAddress?: string, userAgent?: string) {
  await connectToDatabase();
  
  // Check if event exists and is public
  const event = await Event.findById(eventId);
  if (!event) return { error: "Event not found" as const };
  if (!event.isPublic) return { error: "Event is not public" as const };
  
  // Check if registration deadline has passed
  if (event.registrationDeadline && new Date() > event.registrationDeadline) {
    return { error: "Registration deadline has passed" as const };
  }
  
  // Check if event is full
  if (event.maxAttendees) {
    const currentRegistrations = await Registration.countDocuments({ 
      eventId: event._id, 
      status: { $in: ["REGISTERED", "CHECKED_IN"] } 
    });
    
    if (currentRegistrations >= event.maxAttendees) {
      if (event.allowWaitlist) {
        // Add to waitlist
        const waitlistPosition = await Registration.countDocuments({ 
          eventId: event._id, 
          status: "WAITLISTED" 
        }) + 1;
        
        const participant = await Participant.create({
          name: input.name,
          email: input.email,
          phone: input.phone,
          customFieldResponses: input.customFieldResponses,
          notes: input.notes,
        });
        
        const registration = await Registration.create({
          eventId: event._id,
          participantId: participant._id,
          status: "WAITLISTED",
          waitlistPosition,
          source: "web",
          ipAddress,
          userAgent,
        });
        
        return { 
          registration, 
          participant, 
          status: "WAITLISTED" as const,
          waitlistPosition 
        };
      } else {
        return { error: "Event is full" as const };
      }
    }
  }
  
  // Create participant
  const participant = await Participant.create({
    name: input.name,
    email: input.email,
    phone: input.phone,
    customFieldResponses: input.customFieldResponses,
    notes: input.notes,
  });
  
  // Create registration
  const registration = await Registration.create({
    eventId: event._id,
    participantId: participant._id,
    status: "REGISTERED",
    source: "web",
    ipAddress,
    userAgent,
  });
  
  return { registration, participant, status: "REGISTERED" as const };
}

export async function getEventRegistrations(eventId: string, includeWaitlist = false) {
  await connectToDatabase();
  
  const event = await Event.findById(eventId);
  if (!event) return { error: "Event not found" as const };
  
  const statusFilter = includeWaitlist 
    ? { $in: ["REGISTERED", "CHECKED_IN", "WAITLISTED"] }
    : { $in: ["REGISTERED", "CHECKED_IN"] };
  
  const registrations = await Registration.find({ 
    eventId: event._id, 
    status: statusFilter 
  })
  .populate("participantId")
  .sort({ rsvpAt: -1 });
  
  return { registrations };
}

export async function cancelRSVP(eventId: string, participantId: string) {
  await connectToDatabase();
  
  const registration = await Registration.findOne({ 
    eventId, 
    participantId,
    status: { $in: ["REGISTERED", "WAITLISTED"] }
  });
  
  if (!registration) return { error: "Registration not found" as const };
  
  registration.status = "CANCELLED";
  await registration.save();
  
  // If this was a waitlisted registration, update waitlist positions
  if (registration.waitlistPosition) {
    await Registration.updateMany(
      { 
        eventId, 
        status: "WAITLISTED",
        waitlistPosition: { $gt: registration.waitlistPosition }
      },
      { $inc: { waitlistPosition: -1 } }
    );
  }
  
  return { ok: true as const };
}

export async function exportRegistrationsCSV(eventId: string) {
  await connectToDatabase();
  
  const event = await Event.findById(eventId);
  if (!event) return { error: "Event not found" as const };
  
  const registrations = await Registration.find({ 
    eventId: event._id,
    status: { $in: ["REGISTERED", "CHECKED_IN", "WAITLISTED"] }
  })
  .populate<{ participantId: any }>("participantId")
  .sort({ rsvpAt: -1 });
  
  // Generate CSV content
  const headers = ["Name", "Email", "Phone", "Status", "RSVP Date", "Check-in Date", "Waitlist Position"];
  const rows = registrations.map(reg => [
    reg.participantId.name,
    reg.participantId.email || "",
    reg.participantId.phone || "",
    reg.status,
    reg.rsvpAt.toISOString(),
    reg.checkInAt ? reg.checkInAt.toISOString() : "",
    reg.waitlistPosition || ""
  ]);
  
  const csvContent = [headers, ...rows]
    .map(row => row.map(field => `"${field}"`).join(","))
    .join("\n");
  
  return { csvContent, filename: `${event.title}-registrations.csv` };
} 