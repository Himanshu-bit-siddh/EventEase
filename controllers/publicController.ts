import connectToDatabase from "@/lib/mongodb";
import Event from "@/models/Event";
import type { EventSearchInput } from "@/validators/eventSchemas";

export async function searchPublicEvents(input: EventSearchInput) {
  await connectToDatabase();
  
  const filter: any = { isPublic: true };
  
  // Text search
  if (input.query) {
    filter.$or = [
      { title: { $regex: input.query, $options: "i" } },
      { description: { $regex: input.query, $options: "i" } },
      { location: { $regex: input.query, $options: "i" } }
    ];
  }
  
  // Tag filter
  if (input.tags && input.tags.length > 0) {
    filter.tags = { $in: input.tags };
  }
  
  // Location filter
  if (input.location) {
    filter.location = { $regex: input.location, $options: "i" };
  }
  
  // Date range filter
  if (input.startDate || input.endDate) {
    filter.startAt = {};
    if (input.startDate) {
      filter.startAt.$gte = input.startDate;
    }
    if (input.endDate) {
      filter.startAt.$lte = input.endDate;
    }
  }
  
  const [events, totalEvents] = await Promise.all([
    Event.find(filter)
      .select("title description startAt endAt location tags imageUrl maxAttendees")
      .sort({ startAt: 1 })
      .skip(input.offset)
      .limit(input.limit),
    Event.countDocuments(filter)
  ]);
  
  return {
    events,
    totalEvents,
    page: Math.floor(input.offset / input.limit) + 1,
    totalPages: Math.ceil(totalEvents / input.limit),
    hasMore: input.offset + input.limit < totalEvents
  };
}

export async function getPublicEvent(eventId: string) {
  await connectToDatabase();
  
  const event = await Event.findById(eventId)
    .select("title description startAt endAt location tags imageUrl maxAttendees customFields registrationDeadline allowWaitlist")
    .populate<{ ownerId: any }>("ownerId", "name");
  
  if (!event) {
    return { error: "Event not found" as const };
  }
  
  if (!event.isPublic) {
    return { error: "Event is not public" as const };
  }
  
  // Check if registration is still open
  const isRegistrationOpen = !event.registrationDeadline || new Date() < event.registrationDeadline;
  
  // Get current registration count
  const currentRegistrations = await Event.aggregate([
    { $match: { _id: event._id } },
    {
      $lookup: {
        from: "registrations",
        localField: "_id",
        foreignField: "eventId",
        pipeline: [
          { $match: { status: { $in: ["REGISTERED", "CHECKED_IN"] } } }
        ],
        as: "registrations"
      }
    },
    {
      $addFields: {
        currentRegistrations: { $size: "$registrations" },
        isFull: {
          $cond: [
            { $and: [{ $ne: ["$maxAttendees", null] }, { $gte: [{ $size: "$registrations" }, "$maxAttendees"] }] },
            true,
            false
          ]
        }
      }
    }
  ]);
  
  const eventData = event.toObject();
  const stats = currentRegistrations[0] || { currentRegistrations: 0, isFull: false };
  
  return {
    event: {
      ...eventData,
      id: String(eventData._id),
      ownerId: String(eventData.ownerId._id),
      ownerName: eventData.ownerId.name,
      currentRegistrations: stats.currentRegistrations,
      isFull: stats.isFull,
      isRegistrationOpen,
      availableSpots: event.maxAttendees ? Math.max(0, event.maxAttendees - stats.currentRegistrations) : null
    }
  };
}

export async function getPublicEventStats(eventId: string) {
  await connectToDatabase();
  
  const event = await Event.findById(eventId).select("isPublic");
  if (!event || !event.isPublic) {
    return { error: "Event not found or not public" as const };
  }
  
  const stats = await Event.aggregate([
    { $match: { _id: event._id } },
    {
      $lookup: {
        from: "registrations",
        localField: "_id",
        foreignField: "eventId",
        as: "registrations"
      }
    },
    {
      $addFields: {
        totalRegistrations: { $size: "$registrations" },
        registeredCount: {
          $size: {
            $filter: {
              input: "$registrations",
              cond: { $eq: ["$$this.status", "REGISTERED"] }
            }
          }
        },
        checkedInCount: {
          $size: {
            $filter: {
              input: "$registrations",
              cond: { $eq: ["$$this.status", "CHECKED_IN"] }
            }
          }
        },
        waitlistedCount: {
          $size: {
            $filter: {
              input: "$registrations",
              cond: { $eq: ["$$this.status", "WAITLISTED"] }
            }
          }
        }
      }
    }
  ]);
  
  if (stats.length === 0) {
    return { error: "Event not found" as const };
  }
  
  const eventStats = stats[0];
  
  return {
    totalRegistrations: eventStats.totalRegistrations,
    registeredCount: eventStats.registeredCount,
    checkedInCount: eventStats.checkedInCount,
    waitlistedCount: eventStats.waitlistedCount,
    checkInRate: eventStats.totalRegistrations > 0 ? 
      (eventStats.checkedInCount / eventStats.totalRegistrations) * 100 : 0
  };
}

export async function getPopularEvents(limit = 10) {
  await connectToDatabase();
  
  const popularEvents = await Event.aggregate([
    { $match: { isPublic: true } },
    {
      $lookup: {
        from: "registrations",
        localField: "_id",
        foreignField: "eventId",
        pipeline: [
          { $match: { status: { $in: ["REGISTERED", "CHECKED_IN"] } } }
        ],
        as: "registrations"
      }
    },
    {
      $addFields: {
        registrationCount: { $size: "$registrations" }
      }
    },
    { $sort: { registrationCount: -1 } },
    { $limit: limit },
    {
      $project: {
        title: 1,
        description: 1,
        startAt: 1,
        location: 1,
        imageUrl: 1,
        registrationCount: 1
      }
    }
  ]);
  
  return { events: popularEvents };
}

export async function getUpcomingEvents(limit = 20) {
  await connectToDatabase();
  
  const upcomingEvents = await Event.find({
    isPublic: true,
    startAt: { $gte: new Date() }
  })
  .select("title description startAt endAt location tags imageUrl")
  .sort({ startAt: 1 })
  .limit(limit);
  
  return { events: upcomingEvents };
}


