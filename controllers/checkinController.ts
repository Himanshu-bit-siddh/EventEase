import connectToDatabase from "@/lib/mongodb";
import Event from "@/models/Event";
import Registration from "@/models/Registration";
import Participant from "@/models/Participant";
import type { CheckinInput } from "@/validators/eventSchemas";
import type { JwtUser } from "@/lib/auth";

export async function checkInParticipant(
  current: JwtUser, 
  eventId: string, 
  input: CheckinInput
) {
  await connectToDatabase();
  
  // Check if event exists
  const event = await Event.findById(eventId);
  if (!event) return { error: "Event not found" as const };
  
  // Check if user has permission to check in participants
  const canCheckIn = current.role === "ADMIN" || 
                    (current.role === "OWNER" && String(event.ownerId) === current.id) ||
                    current.role === "STAFF";
  
  if (!canCheckIn) return { error: "Forbidden" as const };
  
  // Find the registration
  const registration = await Registration.findOne({ 
    eventId: event._id, 
    participantId: input.participantId,
    status: { $in: ["REGISTERED", "WAITLISTED"] }
  });
  
  if (!registration) return { error: "Registration not found" as const };
  
  // Update registration status
  registration.status = "CHECKED_IN";
  registration.checkInAt = new Date();
  await registration.save();
  
  // If this was a waitlisted participant, promote someone from waitlist
  if (registration.waitlistPosition) {
    await promoteFromWaitlist(event._id);
  }
  
  // Get participant details
  const participant = await Participant.findById(input.participantId);
  
  return { 
    registration, 
    participant,
    message: "Participant checked in successfully" 
  };
}

export async function checkOutParticipant(
  current: JwtUser, 
  eventId: string, 
  participantId: string
) {
  await connectToDatabase();
  
  // Check if event exists
  const event = await Event.findById(eventId);
  if (!event) return { error: "Event not found" as const };
  
  // Check if user has permission
  const canCheckOut = current.role === "ADMIN" || 
                     (current.role === "OWNER" && String(event.ownerId) === current.id) ||
                     current.role === "STAFF";
  
  if (!canCheckOut) return { error: "Forbidden" as const };
  
  // Find the registration
  const registration = await Registration.findOne({ 
    eventId: event._id, 
    participantId,
    status: "CHECKED_IN"
  });
  
  if (!registration) return { error: "Participant not checked in" as const };
  
  // Update registration status
  registration.status = "NO_SHOW";
  await registration.save();
  
  return { 
    registration,
    message: "Participant checked out successfully" 
  };
}

export async function getCheckInStats(eventId: string) {
  await connectToDatabase();
  
  const event = await Event.findById(eventId);
  if (!event) return { error: "Event not found" as const };
  
  const stats = await Registration.aggregate([
    { $match: { eventId: event._id } },
    {
      $group: {
        _id: "$status",
        count: { $sum: 1 }
      }
    }
  ]);
  
  const totalRegistrations = await Registration.countDocuments({ eventId: event._id });
  const checkedInCount = stats.find(s => s._id === "CHECKED_IN")?.count || 0;
  const registeredCount = stats.find(s => s._id === "REGISTERED")?.count || 0;
  const waitlistedCount = stats.find(s => s._id === "WAITLISTED")?.count || 0;
  const cancelledCount = stats.find(s => s._id === "CANCELLED")?.count || 0;
  const noShowCount = stats.find(s => s._id === "NO_SHOW")?.count || 0;
  
  return {
    totalRegistrations,
    checkedInCount,
    registeredCount,
    waitlistedCount,
    cancelledCount,
    noShowCount,
    checkInRate: totalRegistrations > 0 ? (checkedInCount / totalRegistrations) * 100 : 0
  };
}

export async function bulkCheckIn(
  current: JwtUser, 
  eventId: string, 
  participantIds: string[]
) {
  await connectToDatabase();
  
  // Check if event exists
  const event = await Event.findById(eventId);
  if (!event) return { error: "Event not found" as const };
  
  // Check if user has permission
  const canCheckIn = current.role === "ADMIN" || 
                    (current.role === "OWNER" && String(event.ownerId) === current.id) ||
                    current.role === "STAFF";
  
  if (!canCheckIn) return { error: "Forbidden" as const };
  
  const results = [];
  
  for (const participantId of participantIds) {
    try {
      const result = await checkInParticipant(current, eventId, { participantId });
      results.push({ participantId, success: true, result });
    } catch (error) {
      results.push({ participantId, success: false, error: error instanceof Error ? error.message : 'Unknown error' });
    }
  }
  
  return { results };
}

async function promoteFromWaitlist(eventId: any) {
  // Find the next person on the waitlist
  const nextWaitlisted = await Registration.findOne({ 
    eventId, 
    status: "WAITLISTED" 
  }).sort({ waitlistPosition: 1 });
  
  if (nextWaitlisted) {
    nextWaitlisted.status = "REGISTERED";
    nextWaitlisted.waitlistPosition = undefined;
    await nextWaitlisted.save();
    
    // Update waitlist positions for remaining waitlisted participants
    await Registration.updateMany(
      { 
        eventId, 
        status: "WAITLISTED",
        waitlistPosition: { $gt: 1 }
      },
      { $inc: { waitlistPosition: -1 } }
    );
  }
}


